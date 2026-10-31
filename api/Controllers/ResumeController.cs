using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Dtos.Resume;
using Resumade.Api.Models;
using Resumade.Api.Services;
using System.Security.Claims;

namespace Resumade.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ResumesController : ControllerBase
    {
        private readonly ResumeService _resumeService;

        public ResumesController(ResumeService resumeService)
        {
            _resumeService = resumeService;
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
    }
}
