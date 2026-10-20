using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Models;
using Resumade.Api.Models.Resumes;
using Resumade.Api.Services;

namespace Resumade.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/resumes")]
public sealed class ResumesController(ResumeService resumes) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<ResumeDetailResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ResumeDetailResponse>> Create(
        CreateResumeRequest request,
        CancellationToken cancellationToken)
    {
        var result = await resumes.CreateAsync(new CreateResumeCommand(request.Name), cancellationToken);
        return CreatedAtAction(nameof(Get), new { resumeId = result.Id }, ResumeDetailResponse.From(result));
    }

    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ResumeSummaryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<ResumeSummaryResponse>>> List(CancellationToken cancellationToken)
    {
        var results = await resumes.ListAsync(cancellationToken);
        return Ok(results.Select(ResumeSummaryResponse.From).ToArray());
    }

    [HttpGet("{resumeId:guid}")]
    [ProducesResponseType<ResumeDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ResumeDetailResponse>> Get(Guid resumeId, CancellationToken cancellationToken)
    {
        var result = await resumes.GetAsync(resumeId, cancellationToken);
        return result is null
            ? NotFound(new ProblemDetails { Title = "Resume not found." })
            : Ok(ResumeDetailResponse.From(result));
    }
}
