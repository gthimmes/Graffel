using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Graffel.Api.Tests;

public class AuthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public AuthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetMe_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();

        var res = await client.GetAsync("/api/me");

        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task GetMe_WithTestUserHeader_ReturnsUserInfo()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", "alice@example.com|Alice");

        var body = await client.GetFromJsonAsync<MeResponse>("/api/me");

        Assert.NotNull(body);
        Assert.Equal("alice@example.com", body.Email);
        Assert.Equal("Alice", body.Name);
        Assert.Equal("test:alice@example.com", body.Id);
    }

    [Fact]
    public async Task GetMe_AcceptsBareEmailFormatInTestHeader()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", "bob@example.com");

        var body = await client.GetFromJsonAsync<MeResponse>("/api/me");

        Assert.NotNull(body);
        Assert.Equal("bob@example.com", body.Email);
        Assert.Equal("bob@example.com", body.Name);
    }

    [Fact]
    public async Task GetGoogleStart_WhenCredentialsAreMissing_Returns503WithMessage()
    {
        // The default test composition has no Google client id/secret in configuration,
        // so the start endpoint should refuse to issue a challenge.
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
        });

        var res = await client.GetAsync("/api/auth/google/start");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
        var body = await res.Content.ReadAsStringAsync();
        Assert.Contains("google_not_configured", body);
    }

    [Fact]
    public async Task PostSignout_AlwaysReturns204()
    {
        var client = _factory.CreateClient();
        // Even an anonymous user can call sign-out; it's a no-op.
        var res = await client.PostAsync("/api/auth/signout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, res.StatusCode);
    }

    private sealed record MeResponse(string? Id, string? Email, string? Name, string? Picture);
}
