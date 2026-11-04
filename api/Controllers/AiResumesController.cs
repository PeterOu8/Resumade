using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Dtos.AI;
using Resumade.Api.Services.AI;

namespace Resumade.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/ai/resumes")]
public sealed class AiResumesController(AiResumeService aiResumeService) : ControllerBase
{
    [HttpPost("parse")]
    [RequestSizeLimit(500_000)]
    public async Task<ActionResult<AiResumeResponseDto>> Parse(AiParseResumeDto request, CancellationToken cancellationToken)
    {
        try
        {
            var content = await aiResumeService.ParseAsync(request, cancellationToken);
            return Ok(new AiResumeResponseDto { Content = content });
        }
        catch (AiProviderException error)
        {
            return Problem(statusCode: error.StatusCode, title: "AI parsing failed", detail: error.Message);
        }
    }

    [HttpPost("tailor")]
    [RequestSizeLimit(500_000)]
    public async Task<ActionResult<AiResumeResponseDto>> Tailor(AiTailorResumeDto request, CancellationToken cancellationToken)
    {
        try
        {
            var content = await aiResumeService.TailorAsync(request, cancellationToken);
            return Ok(new AiResumeResponseDto { Content = content });
        }
        catch (AiProviderException error)
        {
            return Problem(statusCode: error.StatusCode, title: "AI tailoring failed", detail: error.Message);
        }
    }
}
