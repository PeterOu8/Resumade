using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resumade.Api.Models;
using Resumade.Api.Models.Profiles;
using Resumade.Api.Services;

namespace Resumade.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/profile")]
public sealed class ProfileController(ProfileService profiles) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ProfileResponse>> Get(CancellationToken cancellationToken)
    {
        var profile = await profiles.GetAsync(cancellationToken);
        return profile is null
            ? NotFound(new ProblemDetails { Title = "Profile not found." })
            : Ok(ProfileResponse.From(profile));
    }

    [HttpPut]
    [ProducesResponseType<ProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ProfileResponse>> Put(UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        var result = await profiles.UpsertAsync(new UpdateProfileCommand(
            request.FirstName,
            request.LastName,
            request.Headline,
            request.Location,
            request.Phone,
            request.LinkedInUrl,
            request.GitHubUrl,
            request.PortfolioUrl,
            request.Summary), cancellationToken);

        return Ok(ProfileResponse.From(result));
    }
}
