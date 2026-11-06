using Microsoft.EntityFrameworkCore;
using Resumade.Api.Data;
using Resumade.Api.Dtos.Resumes;
using Resumade.Api.Models;
using System.Data;
using System.Text.Json;

namespace Resumade.Api.Services.Resume
{
    public class ResumeService
    {
        public const int MaxSavedResumes = 16;
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
                Presentation = string.IsNullOrWhiteSpace(resume.PresentationJson)
                    ? null
                    : JsonSerializer.Deserialize<JsonElement>(resume.PresentationJson, JsonOptions),
                CreatedAt = resume.CreatedAt,
                UpdatedAt = resume.UpdatedAt
            };
        }

        internal async Task<ResumePageDto> GetUserResumesAsync(
            Guid userId, int limit, ResumeCursor? after, CancellationToken cancellationToken)
        {
            var query = _context.Resumes
                .AsNoTracking()
                .Where(r => r.UserId == userId);
            if (after is { } cursor)
            {
                query = query.Where(r => r.UpdatedAt < cursor.UpdatedAt ||
                    (r.UpdatedAt == cursor.UpdatedAt && r.Id.CompareTo(cursor.Id) < 0));
            }

            var resumes = await query
                .OrderByDescending(r => r.UpdatedAt)
                .ThenByDescending(r => r.Id)
                .Select(r => new ResumeSummaryDto(r.Id, r.Title, r.CreatedAt, r.UpdatedAt))
                .Take(limit + 1)
                .ToListAsync(cancellationToken);

            if (resumes.Count <= limit)
                return new ResumePageDto(resumes, null);

            resumes.RemoveAt(limit);
            var last = resumes[^1];
            return new ResumePageDto(resumes, ResumeCursor.From(last).ToString());
        }

        public async Task<ResumeDto?> GetResumeByIdAsync(Guid id, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            return ToDto(resume);
        }

        public async Task<ResumeDto?> CreateResumeAsync(
            SaveResumeDto dto, Guid userId, CancellationToken cancellationToken)
        {
            var isPostgres = _context.Database.IsNpgsql();
            await using var transaction = isPostgres
                ? await _context.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
                : await _context.Database.BeginTransactionAsync(cancellationToken);
            if (isPostgres)
            {
                // Serialise creates for this owner so they cannot claim the same slot.
                await _context.Database.SqlQuery<Guid>(
                    $"SELECT \"Id\" AS \"Value\" FROM \"Users\" WHERE \"Id\" = {userId} FOR UPDATE")
                    .ToListAsync(cancellationToken);
            }

            var savedCount = await _context.Resumes
                .Where(r => r.UserId == userId)
                .Take(MaxSavedResumes)
                .CountAsync(cancellationToken);
            if (savedCount >= MaxSavedResumes)
                return null;

            var resume = new Models.Resume
            {
                UserId = userId,
                Title = dto.Title.Trim(),
                ContentJson = JsonSerializer.Serialize(dto.Content, JsonOptions),
                PresentationJson = dto.Presentation is { } presentation
                    ? presentation.GetRawText()
                    : null
            };

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return ToDto(resume);
        }

        public async Task<ResumeDto?> UpdateResumeAsync(Guid id, SaveResumeDto dto, Guid userId)
        {
            var resume = await _context.Resumes
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId);

            if (resume == null) return null;

            resume.Title = dto.Title.Trim();
            resume.ContentJson = JsonSerializer.Serialize(dto.Content, JsonOptions);
            resume.PresentationJson = dto.Presentation is { } presentation
                ? presentation.GetRawText()
                : resume.PresentationJson;
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
