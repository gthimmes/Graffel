using System.Reflection;

namespace Graffel.Api.Endpoints;

internal static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/healthz", () => Results.Ok(new
        {
            status = "ok",
            version = AppVersion.Current
        }));

        return app;
    }
}

internal static class AppVersion
{
    public static string Current { get; } =
        Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "0.1.0";
}
