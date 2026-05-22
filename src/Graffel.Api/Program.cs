using Graffel.Api.Auth;
using Graffel.Api.Drive;
using Graffel.Api.Endpoints;
using Graffel.Api.Share;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddGraffelAuth(builder.Configuration);
// TestAuthHandler is registered in any environment so tests can ride on the production composition.
// In production it does nothing unless someone sends X-Test-User — which we never accept from the internet.
builder.Services.AddGraffelTestAuth();
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = GraffelAuth.GraffelDefaultPolicy();
});

// IDriveStore: in tests the composition switches to InMemoryDriveStore (see WebApplicationFactory
// + Playwright env). Production uses the real Google Drive client.
var useInMemoryDrive = builder.Configuration.GetValue<bool>("Drive:UseInMemory");
if (useInMemoryDrive)
    builder.Services.AddSingleton<IDriveStore, InMemoryDriveStore>();
else
    builder.Services.AddScoped<IDriveStore, GoogleDriveStore>();

// IShareStore is in-memory in v2.2 (see ADR-0009 — restarts wipe shares).
builder.Services.AddSingleton<IShareStore, InMemoryShareStore>();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapHealthEndpoints();
app.MapVersionEndpoints();
app.MapAuthEndpoints();
app.MapDriveEndpoints();
app.MapShareEndpoints();

// Serve the React SPA from wwwroot. Fallback to index.html for client-side routing.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();

// Expose Program as a partial class so WebApplicationFactory<Program> can find it from the test assembly.
public partial class Program;
