using Microsoft.EntityFrameworkCore;
using Resumade.Api.Data;
using Resumade.Api.Models;
using Resumade.Api.Models.Dtos;

namespace Resumade.Api.Services
{
    public class ResumeService
    {
        private readonly ResumadeDbContext _context;

        public ResumeService(ResumadeDbContext context)
        {
            _context = context;
        }

        public async Task<List<ResumeDto>> GetUserResumesAsync(Guid userId)
        {
            return await _context.Resumes
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.UpdatedAt)
                .Select(r => new ResumeDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    ContentJson = r.ContentJson,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();
        }

        public async Task<ResumeDto?> GetResumeByIdAsync(Guid id, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            return new ResumeDto
            {
                Id = resume.Id,
                Title = resume.Title,
                ContentJson = resume.ContentJson,
                CreatedAt = resume.CreatedAt,
                UpdatedAt = resume.UpdatedAt
            };
        }

        public async Task<ResumeDto> CreateResumeAsync(CreateResumeDto dto, Guid userId)
        {
            var resume = new Resume
            {
                UserId = userId,
                Title = dto.Title,
                ContentJson = dto.ContentJson
            };

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync();

            return new ResumeDto
            {
                Id = resume.Id,
                Title = resume.Title,
                ContentJson = resume.ContentJson,
                CreatedAt = resume.CreatedAt,
                UpdatedAt = resume.UpdatedAt
            };
        }

        public async Task<ResumeDto?> UpdateResumeAsync(Guid id, UpdateResumeDto dto, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            resume.Title = dto.Title;
            resume.ContentJson = dto.ContentJson;
            resume.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new ResumeDto
            {
                Id = resume.Id,
                Title = resume.Title,
                ContentJson = resume.ContentJson,
                CreatedAt = resume.CreatedAt,
                UpdatedAt = resume.UpdatedAt
            };
        }

        public async Task<bool> DeleteResumeAsync(Guid id, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return false;

            _context.Resumes.Remove(resume);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
