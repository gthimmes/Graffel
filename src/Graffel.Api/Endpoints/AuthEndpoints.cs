using System.Security.Claims;
using Graffel.Api.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Graffel.Api.Endpoints;

internal static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/google/start", (HttpContext ctx, GoogleAuthAvailability avail, string? returnUrl) =>
        {
            if (!avail.Configured)
            {
                return Results.Json(
                    new
                    {
                        error = "google_not_configured",
                        message = "Google OAuth client credentials are not configured. See README → Google OAuth setup.",
                    },
                    statusCode: StatusCodes.Status503ServiceUnavailable);
            }

            var safeReturn = SafeReturnUrl(returnUrl);
            return Results.Challenge(
                new AuthenticationProperties { RedirectUri = safeReturn },
                new[] { GraffelAuth.GoogleScheme });
        });

        group.MapPost("/signout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync(GraffelAuth.CookieScheme);
            return Results.NoContent();
        });

        app.MapGet("/api/me", (HttpContext ctx) =>
        {
            var user = ctx.User;
            if (user.Identity?.IsAuthenticated != true)
                return Results.Unauthorized();

            return Results.Ok(new
            {
                id      = user.FindFirstValue(ClaimTypes.NameIdentifier),
                email   = user.FindFirstValue(ClaimTypes.Email),
                name    = user.FindFirstValue(ClaimTypes.Name),
                picture = user.FindFirst("picture")?.Value,
            });
        });

        return app;
    }

    /// <summary>Confine the returnUrl to same-site relative paths to prevent open-redirect.</summary>
    private static string SafeReturnUrl(string? candidate)
    {
        if (string.IsNullOrWhiteSpace(candidate)) return "/";
        // Reject absolute URLs and protocol-relative ones.
        if (candidate.StartsWith("//") || candidate.Contains("://")) return "/";
        if (!candidate.StartsWith('/')) return "/";
        return candidate;
    }
}
