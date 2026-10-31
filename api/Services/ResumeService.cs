using Microsoft.EntityFrameworkCore;
using Resumade.Api.Data;
using Resumade.Api.Dtos.Resume;
using Resumade.Api.Models;
using System.Text.Json;

namespace Resumade.Api.Services
{
    public class ResumeService
    {
        private readonly ResumadeDbContext _context;

        public ResumeService(ResumadeDbContext context)
        {
            _context = context;
        }

        private static readonly JsonSerializerOptions JsonOptions =
            new(JsonSerializerDefaults.Web);

        private static ResumeDto ToDto(Models.Resume resume)
        {
            var content = JsonSerializer.Deserialize<ResumeContentDto>(
                resume.ContentJson, JsonOptions);

            return new ResumeDto
            {
                Id = resume.Id,
                Title = resume.Title,
                Content = content
                    ?? throw new JsonException("Stored resume content cannot be null."),
                CreatedAt = resume.CreatedAt,
                UpdatedAt = resume.UpdatedAt
            };
        }

        public async Task<List<ResumeDto>> GetUserResumesAsync(Guid userId)
        {
            var resumes = await _context.Resumes
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.UpdatedAt)
                .ToListAsync();

            return resumes.Select(ToDto).ToList();
        }

        public async Task<ResumeDto?> GetResumeByIdAsync(Guid id, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            return ToDto(resume);
        }

        public async Task<ResumeDto> CreateResumeAsync(CreateResumeDto dto, Guid userId)
        {
            var resume = new Models.Resume
            {
                UserId = userId,
                Title = dto.Title.Trim(),
                ContentJson = JsonSerializer.Serialize(dto.Content, JsonOptions)
            };

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync();

            return ToDto(resume);
        }

        public async Task<ResumeDto?> UpdateResumeAsync(Guid id, UpdateResumeDto dto, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            resume.Title = dto.Title.Trim();
            resume.ContentJson = JsonSerializer.Serialize(dto.Content, JsonOptions);
            resume.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return ToDto(resume);
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
