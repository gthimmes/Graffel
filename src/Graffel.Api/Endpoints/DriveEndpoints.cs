using Graffel.Api.Drive;

namespace Graffel.Api.Endpoints;

internal static class DriveEndpoints
{
    public static IEndpointRouteBuilder MapDriveEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/drive").RequireAuthorization();

        group.MapGet("/files", async (IDriveStore store, CancellationToken ct) =>
        {
            var list = await store.ListAsync(ct);
            return Results.Ok(list);
        });

        group.MapGet("/files/{id}", async (string id, IDriveStore store, CancellationToken ct) =>
        {
            var file = await store.GetAsync(id, ct);
            return file is null
                ? Results.NotFound()
                : Results.Ok(file);
        });

        group.MapPost("/files", async (CreateRequest req, IDriveStore store, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Body is null)
                return Results.BadRequest(new { error = "name and body required" });
            var summary = await store.CreateAsync(req.Name, req.Body, ct);
            return Results.Created($"/api/drive/files/{summary.Id}", summary);
        });

        group.MapPut("/files/{id}", async (string id, CreateRequest req, IDriveStore store, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name) || req.Body is null)
                return Results.BadRequest(new { error = "name and body required" });
            var summary = await store.UpdateAsync(id, req.Name, req.Body, ct);
            return Results.Ok(summary);
        });

        group.MapDelete("/files/{id}", async (string id, IDriveStore store, CancellationToken ct) =>
        {
            var ok = await store.DeleteAsync(id, ct);
            return ok ? Results.NoContent() : Results.NotFound();
        });

        return app;
    }

    public sealed record CreateRequest(string Name, string Body);
}
