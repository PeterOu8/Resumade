using Resend;

namespace Resumade.Api.Services.Auth;

public interface IAccountEmailSender
{
    Task SendAsync(string recipient, string subject, string path, string token);
}

public sealed class AccountEmailSender(
    IResend resend, IConfiguration configuration, IHostEnvironment environment) : IAccountEmailSender
{
    public async Task SendAsync(string recipient, string subject, string path, string token)
    {
        var baseUrl = configuration["Frontend:BaseUrl"] ?? configuration["Frontend__BaseUrl"];
        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var origin) ||
            !(origin.Scheme == Uri.UriSchemeHttps ||
              (environment.IsDevelopment() && origin.IsLoopback && origin.Scheme == Uri.UriSchemeHttp)) ||
            origin.PathAndQuery != "/" || origin.Fragment.Length != 0 || origin.UserInfo.Length != 0)
        {
            throw new InvalidOperationException("Frontend:BaseUrl must be an HTTPS origin.");
        }

        var from = configuration["Email:FromAddress"] ?? configuration["Email__FromAddress"];
        if (!System.Net.Mail.MailAddress.TryCreate(from, out var sender) || sender.Address != from)
            throw new InvalidOperationException("Email:FromAddress must be a sender address.");

        var url = new Uri(origin, $"{path}#token={token}").AbsoluteUri;
        const string notice = "If you did not request this email, you can ignore it.";
        var instructions = path == "/verify-email"
            ? "Confirm your email address to finish setting up your Resumade account. This link is valid for 24 hours."
            : "Use this link within 30 minutes to choose a new password for your Resumade account.";
        var message = new EmailMessage
        {
            From = $"Resumade <{sender.Address}>",
            Subject = $"{subject} | Resumade",
            TextBody = $"Resumade\n\n{subject}\n\n{instructions}\n\n{url}\n\n{notice}",
            HtmlBody = AccountEmailTemplates.AccountAction(subject, instructions, url, notice)
        };
        message.To.Add(recipient);
        await resend.EmailSendAsync(message);
    }
}
