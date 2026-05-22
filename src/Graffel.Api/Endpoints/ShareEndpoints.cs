using System.Security.Claims;
using Graffel.Api.Drive;
using Graffel.Api.Share;

namespace Graffel.Api.Endpoints;

internal static class ShareEndpoints
{
    public static IEndpointRouteBuilder MapShareEndpoints(this IEndpointRouteBuilder app)
    {
        // POST /api/share — owner-only: snapshot a body (or a Drive file) into a share token.
        app.MapPost("/api/share", async (
            CreateShareRequest req,
            IShareStore shares,
            IDriveStore drive,
            HttpContext ctx,
            CancellationToken cancel) =>
        {
            var ownerId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(ownerId)) return Results.Unauthorized();

            string body;
            string title;
            if (!string.IsNullOrEmpty(req.DriveFileId))
            {
                var file = await drive.GetAsync(req.DriveFileId, cancel);
                if (file is null) return Results.NotFound(new { error = "drive_file_not_found" });
                body  = file.Body;
                title = req.Title ?? file.Name;
            }
            else if (!string.IsNullOrEmpty(req.Body))
            {
                body  = req.Body;
                title = req.Title ?? "Untitled diagram";
            }
            else
            {
                return Results.BadRequest(new { error = "driveFileId or body required" });
            }

            var record = await shares.CreateAsync(ownerId, body, title, cancel);
            return Results.Ok(new
            {
                token = record.Token,
                url   = $"/v/{record.Token}",
                createdAt = record.CreatedAt,
            });
        })
        .RequireAuthorization();

        // GET /api/share/{token} — public: resolve a share. No auth.
        app.MapGet("/api/share/{token}", async (string token, IShareStore shares, CancellationToken cancel) =>
        {
            var rec = await shares.GetAsync(token, cancel);
            if (rec is null) return Results.NotFound();
            return Results.Ok(new
            {
                title = rec.Title,
                body  = rec.Body,
                createdAt = rec.CreatedAt,
            });
        })
        .AllowAnonymous();

        // DELETE /api/share/{token} — owner-only.
        app.MapDelete("/api/share/{token}", async (string token, IShareStore shares, HttpContext ctx, CancellationToken cancel) =>
        {
            var ownerId = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(ownerId)) return Results.Unauthorized();
            var outcome = await shares.RevokeAsync(token, ownerId, cancel);
            return outcome switch
            {
                RevokeOutcome.Revoked   => Results.NoContent(),
                RevokeOutcome.Forbidden => Results.Forbid(),
                _                       => Results.NotFound(),
            };
        })
        .RequireAuthorization();

        return app;
    }

    public sealed record CreateShareRequest(string? DriveFileId, string? Body, string? Title);
}
