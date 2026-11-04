using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace Resumade.Api.Services.Pdf;

public sealed class ResumeGenerationService : IAsyncDisposable
{
    private static readonly TimeSpan RenderTimeout = TimeSpan.FromSeconds(25);
    private const string DocumentPolicy = """
        <!doctype html>
        <meta charset="utf-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; style-src 'unsafe-inline'; font-src data:; base-uri 'none'; form-action 'none'">
        """;

    private readonly object _browserLock = new();
    private Task<IBrowser>? _browser;
    private readonly SemaphoreSlim _renderSlots = new(2, 2);

    private Task<IBrowser> GetBrowserAsync()
    {
        lock (_browserLock)
        {
            if (_browser is null || _browser.IsFaulted || _browser.IsCanceled ||
                (_browser.IsCompletedSuccessfully && !_browser.Result.IsConnected))
            {
                _browser = StartBrowserAsync();
            }

            return _browser;
        }
    }

    private static async Task<IBrowser> StartBrowserAsync()
    {
        if (OperatingSystem.IsLinux() &&
            string.Equals(Environment.UserName, "root", StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Chromium PDF rendering must run as a non-root user so its sandbox remains enabled.");
        }

        var executablePath =
            Environment.GetEnvironmentVariable(
                "PUPPETEER_EXECUTABLE_PATH");

        if (string.IsNullOrWhiteSpace(executablePath))
        {
            var fetcher = new BrowserFetcher();
            var installed = await fetcher.DownloadAsync();
            executablePath = installed.GetExecutablePath();
        }

        return await Puppeteer.LaunchAsync(new LaunchOptions
        {
            Headless = true,
            // Deliberately do not pass --no-sandbox.
            ExecutablePath = executablePath
        });
    }

    public async Task<byte[]> GenerateAsync(
        string html,
        CancellationToken ct = default)
    {
        await _renderSlots.WaitAsync(ct);

        try
        {
            // Browser provisioning is a singleton cold-start operation. The hard
            // per-document budget begins once the shared browser is available.
            var browser = await GetBrowserAsync().WaitAsync(ct);
            using var renderTimeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            renderTimeout.CancelAfter(RenderTimeout);
            var renderToken = renderTimeout.Token;

            await using var context = await browser.CreateBrowserContextAsync();
            await using var page = await context.NewPageAsync();

            // HTML is supplied by the client:
            // Do not execute scripts or fetch external resources.
            await page.SetJavaScriptEnabledAsync(false);
            await page.SetRequestInterceptionAsync(true);

            page.AddRequestInterceptor(request =>
            {
                // Never permit a document navigation, including data:, file://,
                // loopback, private/link-local networks, or cloud metadata hosts.
                // Self-contained data URLs are allowed only as subresources.
                var allow = !request.IsNavigationRequest &&
                    request.Url.StartsWith("data:", StringComparison.OrdinalIgnoreCase);
                return allow ? request.ContinueAsync() : request.AbortAsync();
            });

            await page.SetContentAsync(
                DocumentPolicy + html,
                new SetContentOptions
                {
                    WaitUntil = [WaitUntilNavigation.Load],
                    Timeout = 20000
                }).WaitAsync(renderToken);

            return await page.PdfDataAsync(new PdfOptions
            {
                Format = PaperFormat.A4,
                PreferCSSPageSize = true,
                PrintBackground = true,
                WaitForFonts = true,
                Timeout = 20000
            }).WaitAsync(renderToken);
        }
        finally
        {
            _renderSlots.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_browser is { } browserTask)
        {
            // A failed launch has no browser to dispose.
            var completed = await Task.WhenAny(browserTask);
            if (completed.IsCompletedSuccessfully)
                await (await completed).DisposeAsync();
        }

        _renderSlots.Dispose();
    }
}
