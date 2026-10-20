using System.ComponentModel.DataAnnotations;

namespace Resumade.Api.Models;

public sealed record CreateResumeRequest([Required, StringLength(200)] string Name);
