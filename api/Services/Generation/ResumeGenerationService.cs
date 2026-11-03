namespace Resumade.Api.Services.Generation
{
    public sealed class PdfGenerationException(int statusCode, string message) : Exception(message)
    {
        public int StatusCode { get; } = statusCode;
    }

    public sealed class ResumeGenerationService
    {

    }
}
