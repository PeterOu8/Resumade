using Resumade.Api.Models.Entities.Resumes;
using Xunit;

namespace Resumade.Api.Tests;

public sealed class ResumeDomainTests
{
    [Fact]
    public void Resume_rejects_an_empty_name() =>
        Assert.Throws<ArgumentException>(() => new Resume(Guid.NewGuid(), Guid.NewGuid(), " ", Guid.NewGuid()));

    [Fact]
    public void Resume_creates_an_initial_manual_version()
    {
        var resume = new Resume(Guid.NewGuid(), Guid.NewGuid(), "Backend Engineer", Guid.NewGuid());

        var version = Assert.Single(resume.Versions);
        Assert.Equal(1, version.VersionNumber);
        Assert.Equal(ResumeSourceType.Manual, version.SourceType);
    }

    [Fact]
    public void ResumeVersion_rejects_an_invalid_version_number() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new ResumeVersion(
            Guid.NewGuid(), Guid.NewGuid(), 0, null, null, ResumeSourceType.Manual));

    [Fact]
    public void Experience_rejects_a_negative_sort_order() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new Experience(
            Guid.NewGuid(), Guid.NewGuid(), "Resumade", "Engineer", null,
            new YearMonth(2025, 1), null, true, null, -1));

    [Fact]
    public void Experience_rejects_an_end_month_before_the_start_month() =>
        Assert.Throws<ArgumentException>(() => new Experience(
            Guid.NewGuid(), Guid.NewGuid(), "Resumade", "Engineer", null,
            new YearMonth(2025, 2), new YearMonth(2025, 1), false, null, 0));

    [Fact]
    public void Skill_rejects_negative_years_of_experience() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new Skill(
            Guid.NewGuid(), Guid.NewGuid(), ".NET", null, null, -0.1m, 0));
}
