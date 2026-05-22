using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;

namespace Graffel.Api.Auth;

internal static class GraffelAuth
{
    public const string CookieScheme = "GraffelCookie";
    public const string GoogleScheme = "Google";
    public const string TestScheme = "Test";
    /// <summary>
    /// Default scheme. Forwards to TestScheme when the request carries X-Test-User; otherwise CookieScheme.
    /// </summary>
    public const string DefaultScheme = "Graffel";

    /// <summary>
    /// Wires cookie authentication for the session + Google OAuth as the sign-in provider.
    /// Google client credentials come from configuration (user-secrets in dev, env vars in prod).
    /// If they're missing, the Google handler still binds — calls to /api/auth/google/start return
    /// a 503 with a clear "not configured" message instead of crashing.
    /// </summary>
    public static IServiceCollection AddGraffelAuth(this IServiceCollection services, IConfiguration config)
    {
        var googleClientId     = config["Auth:Google:ClientId"];
        var googleClientSecret = config["Auth:Google:ClientSecret"];

        services.AddSingleton(new GoogleAuthAvailability(
            Configured: !string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret)));

        var auth = services
            .AddAuthentication(DefaultScheme)
            .AddPolicyScheme(DefaultScheme, DefaultScheme, options =>
            {
                options.ForwardDefaultSelector = ctx =>
                    ctx.Request.Headers.ContainsKey("X-Test-User") ? TestScheme : CookieScheme;
            })
            .AddCookie(CookieScheme, options =>
            {
                options.Cookie.Name = "graffel.session";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.ExpireTimeSpan = TimeSpan.FromDays(30);
                options.SlidingExpiration = true;
                // No login redirect — this is an API; return 401 instead.
                options.Events.OnRedirectToLogin = ctx =>
                {
                    if (ctx.Request.Path.StartsWithSegments("/api"))
                    {
                        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        return Task.CompletedTask;
                    }
                    ctx.Response.Redirect(ctx.RedirectUri);
                    return Task.CompletedTask;
                };
            });

        // Always bind the Google scheme so the SignInScheme reference works; if creds are missing,
        // the start endpoint short-circuits with 503 before anything reaches Google.
        auth.AddGoogle(GoogleScheme, options =>
        {
            options.ClientId     = googleClientId     ?? "missing";
            options.ClientSecret = googleClientSecret ?? "missing";
            options.SignInScheme = CookieScheme;
            options.SaveTokens   = true; // keep access/refresh tokens in the cookie for v2.1 Drive calls
            options.Scope.Add("https://www.googleapis.com/auth/drive.file");
            options.CallbackPath = "/api/auth/google/callback";
            options.ClaimActions.MapJsonKey("picture", "picture", "url");
        });

        return services;
    }

    /// <summary>
    /// Test wire-up: in addition to cookies + Google, register a TestAuthHandler that signs in
    /// a synthetic user when the request carries an `X-Test-User` header.
    /// This lets xUnit + Playwright bypass Google without weakening real auth.
    /// </summary>
    public static IServiceCollection AddGraffelTestAuth(this IServiceCollection services)
    {
        services.AddAuthentication()
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestScheme, _ => { });
        return services;
    }

    public static AuthorizationPolicy GraffelDefaultPolicy() =>
        new AuthorizationPolicyBuilder(DefaultScheme)
            .RequireAuthenticatedUser()
            .Build();
}

internal sealed record GoogleAuthAvailability(bool Configured);

internal sealed class TestAuthHandler(
    Microsoft.Extensions.Options.IOptionsMonitor<AuthenticationSchemeOptions> options,
    Microsoft.Extensions.Logging.ILoggerFactory logger,
    System.Text.Encodings.Web.UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers["X-Test-User"].ToString();
        if (string.IsNullOrWhiteSpace(header))
            return Task.FromResult(AuthenticateResult.NoResult());

        // Header format: "email|Display Name" or just "email"
        var parts = header.Split('|', 2, StringSplitOptions.TrimEntries);
        var email = parts[0];
        var name  = parts.Length > 1 ? parts[1] : email;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, $"test:{email}"),
            new Claim(ClaimTypes.Email, email),
            new Claim(ClaimTypes.Name, name),
            new Claim("picture", ""),
        };
        var identity = new ClaimsIdentity(claims, GraffelAuth.TestScheme);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, GraffelAuth.TestScheme);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
