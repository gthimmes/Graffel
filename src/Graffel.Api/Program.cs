using Graffel.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapHealthEndpoints();
app.MapVersionEndpoints();

// Serve the React SPA from wwwroot. Fallback to index.html for client-side routing.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();

// Expose Program as a partial class so WebApplicationFactory<Program> can find it from the test assembly.
public partial class Program;
