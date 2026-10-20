namespace Resumade.Api.Models.Files;

public sealed record FileToStore(Stream Content, string StorageKey);
