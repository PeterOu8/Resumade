using Resumade.Api.Infrastructure.Configuration;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddResumadeApi(builder.Configuration);

var app = builder.Build();
app.UseResumadeApi();
app.Run();

public partial class Program;
