namespace Graffel.Api.Endpoints;

internal static class VersionEndpoints
{
    public static IEndpointRouteBuilder MapVersionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/version", () => Results.Ok(new
        {
            app = "graffel",
            version = AppVersion.Current
        }));

        return app;
    }
}
