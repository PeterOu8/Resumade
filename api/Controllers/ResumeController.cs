using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.ComponentModel.DataAnnotations;
using Resumade.Api.Dtos.Resumes;
using System.Security.Claims;
using Resumade.Api.Dtos.Parsing;
using Resumade.Api.Infrastructure.Validation;
using Resumade.Api.Services.Parsing;
using Resumade.Api.Services.Parsing.Pipeline;
using Resumade.Api.Services.Resume;

namespace Resumade.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ResumesController : ControllerBase
    {
        private readonly ResumeService _resumeService;
        private readonly ResumeParserService _resumeParserService;

        public ResumesController(ResumeService resumeService, ResumeParserService resumeParserService)
        {
            _resumeService = resumeService;
            _resumeParserService = resumeParserService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userIdClaim!);
        }

        [HttpGet]
        public async Task<ActionResult<ResumePageDto>> GetAll(
            [FromQuery, Range(1, 8)] int limit = 8,
            [FromQuery, MaxLength(56)] string? cursor = null,
            CancellationToken cancellationToken = default)
        {
            if (!ResumeCursor.TryParse(cursor, out var after))
                return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Invalid resume cursor");

            return Ok(await _resumeService.GetUserResumesAsync(
                GetUserId(), limit, cursor is null ? null : after, cancellationToken));
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ResumeDto>> GetById(Guid id)
        {
            var resume = await _resumeService.GetResumeByIdAsync(id, GetUserId());
            if (resume == null) return NotFound();
            return Ok(resume);
        }

        [HttpPost]
        public async Task<ActionResult<ResumeDto>> Create(SaveResumeDto dto, CancellationToken cancellationToken)
        {
            var resume = await _resumeService.CreateResumeAsync(dto, GetUserId(), cancellationToken);
            if (resume is null)
            {
                return Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "Saved resume limit reached",
                    detail: $"You can save up to {ResumeService.MaxSavedResumes} resumes.");
            }

            return CreatedAtAction(nameof(GetById), new { id = resume.Id }, resume);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ResumeDto>> Update(Guid id, SaveResumeDto dto)
        {
            var resume = await _resumeService.UpdateResumeAsync(id, dto, GetUserId());
            if (resume == null) return NotFound();
            return Ok(resume);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var deleted = await _resumeService.DeleteResumeAsync(id, GetUserId());
            if (!deleted) return NotFound();
            return NoContent();
        }

        [AllowAnonymous]
        [HttpPost("parse")]
        [EnableRateLimiting("parse")]
        public ActionResult<ResumeContentDto> Parse([FromBody] List<TextItemDto> request)
        {
            var error = ParseRequestValidator.Validate(request);

            if (error is not null)
            {
                return BadRequest(new ProblemDetails
                {
                    Title = "Invalid resume text items",
                    Detail = error,
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var sanitisedItems = request!
                .Select(TextItemMapper.Sanitise)
                .ToList();
            var textItems = TextItemMapper.MapTextItems(sanitisedItems);
            var resumeContent = _resumeParserService.Parse(textItems);

            return Ok(resumeContent);
        }
    }
}
