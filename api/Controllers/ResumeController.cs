using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Resumade.Api.Dtos.Resumes;
using System.Security.Claims;
using Resumade.Api.Dtos.Parsing;
using Resumade.Api.Infrastructure.Validation;
using Resumade.Api.Services.Parsing;
using Resumade.Api.Services.Parsing.Pipeline;
using Resumade.Api.Services.Pdf;
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
        private readonly ResumeGenerationService _resumeGenerationService;

        public ResumesController(ResumeService resumeService, ResumeParserService resumeParserService,
            ResumeGenerationService resumeGenerationService)
        {
            _resumeService = resumeService;
            _resumeParserService = resumeParserService;
            _resumeGenerationService = resumeGenerationService;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userIdClaim!);
        }

        [HttpGet]
        public async Task<ActionResult<List<ResumeDto>>> GetAll()
        {
            var resumes = await _resumeService.GetUserResumesAsync(GetUserId());
            return Ok(resumes);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<ResumeDto>> GetById(Guid id)
        {
            var resume = await _resumeService.GetResumeByIdAsync(id, GetUserId());
            if (resume == null) return NotFound();
            return Ok(resume);
        }

        [AllowAnonymous]
        [HttpPost("pdf")]
        [EnableRateLimiting("pdf")]
        [RequestSizeLimit(2_000_000)]
        [Produces("application/pdf")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
        public async Task<IActionResult> DownloadDraftPdf(DownloadResumePdfDto preview, CancellationToken ct)
        {
            var bytes = await _resumeGenerationService.GenerateAsync(preview.Html, ct);
            var title = string.Concat(preview.Title.Trim().Select(character =>
                char.IsControl(character) || "<>:\"/\\|?*".Contains(character) ? '-' : character));
            return File(bytes, "application/pdf", $"{title}.pdf");
        }

        [HttpPost]
        public async Task<ActionResult<ResumeDto>> Create(CreateResumeDto dto)
        {
            var resume = await _resumeService.CreateResumeAsync(dto, GetUserId());
            return CreatedAtAction(nameof(GetById), new { id = resume.Id }, resume);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<ResumeDto>> Update(Guid id, UpdateResumeDto dto)
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
