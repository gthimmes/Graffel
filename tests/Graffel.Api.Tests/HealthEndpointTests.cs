using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Graffel.Api.Tests;

public class HealthEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public HealthEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetHealthz_ReturnsOkStatus()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/healthz");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetHealthz_ReturnsStatusOkInBody()
    {
        var client = _factory.CreateClient();

        var body = await client.GetFromJsonAsync<HealthResponse>("/healthz");

        Assert.NotNull(body);
        Assert.Equal("ok", body.Status);
        Assert.False(string.IsNullOrWhiteSpace(body.Version));
    }

    [Fact]
    public async Task GetApiVersion_ReturnsVersionMetadata()
    {
        var client = _factory.CreateClient();

        var body = await client.GetFromJsonAsync<VersionResponse>("/api/version");

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.Version));
        Assert.Equal("graffel", body.App);
    }

    private record HealthResponse(string Status, string Version);
    private record VersionResponse(string App, string Version);
}
