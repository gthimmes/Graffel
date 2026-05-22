using Graffel.Api.Auth;
using Graffel.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddGraffelAuth(builder.Configuration);
// TestAuthHandler is registered in any environment so tests can ride on the production composition.
// In production it does nothing unless someone sends X-Test-User — which we never accept from the internet.
builder.Services.AddGraffelTestAuth();
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = GraffelAuth.GraffelDefaultPolicy();
});

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapVersionEndpoints();
app.MapAuthEndpoints();

// Serve the React SPA from wwwroot. Fallback to index.html for client-side routing.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();

// Expose Program as a partial class so WebApplicationFactory<Program> can find it from the test assembly.
public partial class Program;
