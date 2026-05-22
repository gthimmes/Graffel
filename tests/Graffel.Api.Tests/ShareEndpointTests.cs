using System.Net;
using System.Net.Http.Json;
using Graffel.Api.Drive;
using Graffel.Api.Share;
using Microsoft.Extensions.DependencyInjection;

namespace Graffel.Api.Tests;

public class ShareEndpointTests : IClassFixture<GraffelApiFactory>
{
    private readonly GraffelApiFactory _factory;

    public ShareEndpointTests(GraffelApiFactory factory)
    {
        _factory = factory;
        InMemoryDriveStore.ClearAll();
        // Reset share registry between tests.
        var scope = _factory.Services.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IShareStore>();
        ((InMemoryShareStore)store).Clear();
    }

    private HttpClient SignedIn(string email = "owner@example.com", string name = "Owner")
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Add("X-Test-User", $"{email}|{name}");
        return c;
    }

    [Fact]
    public async Task CreateShare_RequiresAuth()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/share", new { body = "{}", title = "X" });
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task CreateShare_FromInlineBody_ReturnsToken()
    {
        var client = SignedIn();
        var res = await client.PostAsJsonAsync("/api/share", new { body = "{\"format\":\"graffel\"}", title = "Test" });
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<CreateResponse>();
        Assert.NotNull(body);
        Assert.False(string.IsNullOrEmpty(body.Token));
        Assert.Equal($"/v/{body.Token}", body.Url);
    }

    [Fact]
    public async Task GetShare_AnonymousReturnsTheSnapshot()
    {
        var owner = SignedIn();
        var create = await owner.PostAsJsonAsync("/api/share", new { body = "snapshot-body", title = "Snap" });
        var created = await create.Content.ReadFromJsonAsync<CreateResponse>();

        // Resolve as anonymous client (no X-Test-User header).
        var anon = _factory.CreateClient();
        var get = await anon.GetAsync($"/api/share/{created!.Token}");
        Assert.Equal(HttpStatusCode.OK, get.StatusCode);
        var resolved = await get.Content.ReadFromJsonAsync<ResolveResponse>();
        Assert.NotNull(resolved);
        Assert.Equal("snapshot-body", resolved.Body);
        Assert.Equal("Snap", resolved.Title);
    }

    [Fact]
    public async Task GetShare_UnknownToken_Returns404()
    {
        var anon = _factory.CreateClient();
        var res = await anon.GetAsync("/api/share/not-a-real-token");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task CreateShare_FromDriveFile_SnapshotsTheBody()
    {
        var owner = SignedIn();
        // Stash a Drive file first.
        var driveRes = await owner.PostAsJsonAsync("/api/drive/files", new { name = "X.graffel", body = "drive-body" });
        var drive = await driveRes.Content.ReadFromJsonAsync<DriveFileSummary>();

        var create = await owner.PostAsJsonAsync("/api/share", new { driveFileId = drive!.Id, title = "X" });
        var created = await create.Content.ReadFromJsonAsync<CreateResponse>();

        var anon = _factory.CreateClient();
        var get  = await anon.GetAsync($"/api/share/{created!.Token}");
        var resolved = await get.Content.ReadFromJsonAsync<ResolveResponse>();
        Assert.NotNull(resolved);
        Assert.Equal("drive-body", resolved.Body);
    }

    [Fact]
    public async Task RevokeShare_OwnerCanRevoke_NonOwnerCannot()
    {
        var alice = SignedIn("alice@example.com", "Alice");
        var bob   = SignedIn("bob@example.com",   "Bob");

        var create = await alice.PostAsJsonAsync("/api/share", new { body = "alice's", title = "A" });
        var created = await create.Content.ReadFromJsonAsync<CreateResponse>();

        // Bob can't revoke Alice's share.
        var bobAttempt = await bob.DeleteAsync($"/api/share/{created!.Token}");
        Assert.Equal(HttpStatusCode.Forbidden, bobAttempt.StatusCode);

        // Alice can.
        var aliceRevoke = await alice.DeleteAsync($"/api/share/{created.Token}");
        Assert.Equal(HttpStatusCode.NoContent, aliceRevoke.StatusCode);

        // After revoke, the share is gone.
        var anon = _factory.CreateClient();
        var get  = await anon.GetAsync($"/api/share/{created.Token}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    private sealed record CreateResponse(string Token, string Url, DateTimeOffset CreatedAt);
    private sealed record ResolveResponse(string Title, string Body, DateTimeOffset CreatedAt);
}
