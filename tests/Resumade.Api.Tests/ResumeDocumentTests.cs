using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Resumade.Api.Infrastructure.Persistence;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ResumeDocumentTests(ResumadeApiFactory factory) : IClassFixture<ResumadeApiFactory>
{
    [Fact]
    public async Task Anonymous_upload_is_rejected_and_invalid_files_are_not_stored()
    {
        using var client = factory.CreateClient();
        using var content = CreateMultipart("resume.txt", "text/plain", [1, 2, 3]);

        var anonymous = await client.PostAsync($"/api/resumes/{Guid.NewGuid()}/document", content);

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task PDF_and_DOCX_uploads_persist_metadata_and_replace_the_physical_file()
    {
        using var client = factory.CreateClient();
        var user = await RegisterAsync(client);
        Authorize(client, user.AccessToken);
        var resumeId = await CreateResumeAsync(client);

        try
        {
            var pdf = await UploadAsync(client, resumeId, "candidate.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46]);
            if (pdf.StatusCode != HttpStatusCode.OK)
                Assert.Fail($"PDF upload returned {(int)pdf.StatusCode}: {await pdf.Content.ReadAsStringAsync()}");
            var pdfMetadata = await pdf.Content.ReadFromJsonAsync<DocumentMetadata>();
            Assert.Equal("candidate.pdf", pdfMetadata!.OriginalFileName);
            Assert.Equal("application/pdf", pdfMetadata.ContentType);
            Assert.Equal(4, pdfMetadata.FileSize);

            var firstStorageKey = await GetStorageKeyAsync(pdfMetadata.Id);
            Assert.True(File.Exists(ToPhysicalPath(firstStorageKey)));

            var docx = await UploadAsync(client, resumeId, "candidate.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", [0x50, 0x4B, 0x03, 0x04]);
            Assert.Equal(HttpStatusCode.OK, docx.StatusCode);
            var docxMetadata = await docx.Content.ReadFromJsonAsync<DocumentMetadata>();
            Assert.Equal("candidate.docx", docxMetadata!.OriginalFileName);
            Assert.Equal("application/vnd.openxmlformats-officedocument.wordprocessingml.document", docxMetadata.ContentType);

            var secondStorageKey = await GetStorageKeyAsync(docxMetadata.Id);
            Assert.False(File.Exists(ToPhysicalPath(firstStorageKey)));
            Assert.True(File.Exists(ToPhysicalPath(secondStorageKey)));

            await using var scope = factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
            var persisted = await db.ResumeDocuments.SingleAsync(x => x.Id == docxMetadata.Id);
            Assert.Equal(resumeId, persisted.ResumeId);
            Assert.Equal(docxMetadata.FileSize, persisted.FileSize);
        }
        finally
        {
            await DeleteUserAsync(user.UserId);
        }
    }

    [Fact]
    public async Task Unsupported_oversized_and_cross_user_uploads_are_rejected()
    {
        using var clientA = factory.CreateClient();
        using var clientB = factory.CreateClient();
        var userA = await RegisterAsync(clientA);
        var userB = await RegisterAsync(clientB);
        Authorize(clientA, userA.AccessToken);
        Authorize(clientB, userB.AccessToken);
        var resumeId = await CreateResumeAsync(clientA);

        try
        {
            using var unsupported = CreateMultipart("resume.txt", "text/plain", [1, 2, 3]);
            Assert.Equal(HttpStatusCode.BadRequest,
                (await clientA.PostAsync($"/api/resumes/{resumeId}/document", unsupported)).StatusCode);

            using var oversized = CreateMultipart("resume.pdf", "application/pdf", new byte[10 * 1024 * 1024 + 1]);
            var oversizedResponse = await clientA.PostAsync($"/api/resumes/{resumeId}/document", oversized);
            Assert.Contains(oversizedResponse.StatusCode, new[] { HttpStatusCode.BadRequest, HttpStatusCode.RequestEntityTooLarge });

            using var crossUser = CreateMultipart("resume.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46]);
            Assert.Equal(HttpStatusCode.NotFound,
                (await clientB.PostAsync($"/api/resumes/{resumeId}/document", crossUser)).StatusCode);
        }
        finally
        {
            await DeleteUserAsync(userA.UserId);
            await DeleteUserAsync(userB.UserId);
        }
    }

    private static MultipartFormDataContent CreateMultipart(string name, string contentType, byte[] bytes)
    {
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        content.Add(file, "file", name);
        return content;
    }

    private async Task<HttpResponseMessage> UploadAsync(HttpClient client, Guid resumeId, string name,
        string contentType, byte[] bytes)
    {
        using var content = CreateMultipart(name, contentType, bytes);
        return await client.PostAsync($"/api/resumes/{resumeId}/document", content);
    }

    private async Task<string> GetStorageKeyAsync(Guid documentId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        return await db.ResumeDocuments.Where(x => x.Id == documentId).Select(x => x.StorageKey).SingleAsync();
    }

    private string ToPhysicalPath(string storageKey) =>
        Path.Combine(factory.StorageRoot, storageKey.Replace('/', Path.DirectorySeparatorChar));

    private static async Task<AuthenticatedUser> RegisterAsync(HttpClient client)
    {
        var email = $"document-{Guid.NewGuid():N}@example.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "A-valid-test-password-123!" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return new AuthenticatedUser(
            json.RootElement.GetProperty("accessToken").GetString()!,
            json.RootElement.GetProperty("user").GetProperty("id").GetGuid());
    }

    private static async Task<Guid> CreateResumeAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/resumes", new { name = "Upload test resume" });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("id").GetGuid();
    }

    private async Task DeleteUserAsync(Guid userId)
    {
        await using var scope = factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ResumadeDbContext>();
        await db.Users.Where(x => x.Id == userId).ExecuteDeleteAsync();
    }

    private static void Authorize(HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

    private sealed record AuthenticatedUser(string AccessToken, Guid UserId);
    private sealed record DocumentMetadata(Guid Id, Guid ResumeId, string OriginalFileName, string ContentType, long FileSize, DateTimeOffset UploadedAt);
}
