using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Models;
using Resumade.Api.Models.Resumes;
using Resumade.Api.Services;

namespace Resumade.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/resumes/{resumeId:guid}/document")]
public sealed class ResumeDocumentsController(ResumeDocumentService documents) : ControllerBase
{
    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(ResumeDocumentService.MaxFileSizeBytes)]
    [ProducesResponseType<ResumeDocumentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ResumeDocumentResponse>> Upload(
        Guid resumeId,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null)
            return BadRequest(new ProblemDetails { Title = "A PDF or DOCX file is required." });

        try
        {
            await using var content = file.OpenReadStream();
            var result = await documents.UploadAsync(
                resumeId,
                new ResumeDocumentUpload(content, file.FileName, file.ContentType, file.Length),
                cancellationToken);
            return Ok(ResumeDocumentResponse.From(result));
        }
        catch (ResumeNotFoundException)
        {
            return NotFound(new ProblemDetails { Title = "Resume not found." });
        }
        catch (InvalidResumeDocumentException exception)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid resume document.", Detail = exception.Message });
        }
    }
}
