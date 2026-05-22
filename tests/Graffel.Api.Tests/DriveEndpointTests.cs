using System.Net;
using System.Net.Http.Json;
using Graffel.Api.Drive;

namespace Graffel.Api.Tests;

public class DriveEndpointTests : IClassFixture<GraffelApiFactory>
{
    private readonly GraffelApiFactory _factory;

    public DriveEndpointTests(GraffelApiFactory factory)
    {
        _factory = factory;
        InMemoryDriveStore.ClearAll();
    }

    private HttpClient SignedInClient(string email = "drive-user@example.com", string name = "Drive User")
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-User", $"{email}|{name}");
        return client;
    }

    [Fact]
    public async Task ListFiles_WithoutAuth_Returns401()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/api/drive/files");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task ListFiles_NewUser_ReturnsEmptyList()
    {
        var client = SignedInClient();
        var files = await client.GetFromJsonAsync<List<DriveFileSummary>>("/api/drive/files");
        Assert.NotNull(files);
        Assert.Empty(files);
    }

    [Fact]
    public async Task CreateThenList_ReturnsTheCreatedFile()
    {
        var client = SignedInClient();
        var res = await client.PostAsJsonAsync("/api/drive/files", new { name = "First.graffel", body = "{\"format\":\"graffel\"}" });
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var created = await res.Content.ReadFromJsonAsync<DriveFileSummary>();
        Assert.NotNull(created);
        Assert.Equal("First.graffel", created.Name);

        var files = await client.GetFromJsonAsync<List<DriveFileSummary>>("/api/drive/files");
        Assert.NotNull(files);
        Assert.Single(files);
        Assert.Equal(created.Id, files[0].Id);
    }

    [Fact]
    public async Task GetFile_RoundTripsTheBodyContent()
    {
        var client = SignedInClient();
        var body = "{\"format\":\"graffel\",\"schemaVersion\":1,\"nodes\":[],\"edges\":[]}";
        var res = await client.PostAsJsonAsync("/api/drive/files", new { name = "RT.graffel", body });
        var created = await res.Content.ReadFromJsonAsync<DriveFileSummary>();

        var fetched = await client.GetFromJsonAsync<DriveFileContent>($"/api/drive/files/{created!.Id}");
        Assert.NotNull(fetched);
        Assert.Equal(body, fetched.Body);
        Assert.Equal("RT.graffel", fetched.Name);
    }

    [Fact]
    public async Task GetFile_UnknownId_Returns404()
    {
        var client = SignedInClient();
        var res = await client.GetAsync("/api/drive/files/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task UpdateFile_RewritesContent()
    {
        var client = SignedInClient();
        var res = await client.PostAsJsonAsync("/api/drive/files", new { name = "U.graffel", body = "first" });
        var created = await res.Content.ReadFromJsonAsync<DriveFileSummary>();

        await client.PutAsJsonAsync($"/api/drive/files/{created!.Id}", new { name = "U.graffel", body = "second" });

        var fetched = await client.GetFromJsonAsync<DriveFileContent>($"/api/drive/files/{created.Id}");
        Assert.NotNull(fetched);
        Assert.Equal("second", fetched.Body);
    }

    [Fact]
    public async Task DeleteFile_RemovesIt()
    {
        var client = SignedInClient();
        var res = await client.PostAsJsonAsync("/api/drive/files", new { name = "D.graffel", body = "x" });
        var created = await res.Content.ReadFromJsonAsync<DriveFileSummary>();

        var del = await client.DeleteAsync($"/api/drive/files/{created!.Id}");
        Assert.Equal(HttpStatusCode.NoContent, del.StatusCode);

        var get = await client.GetAsync($"/api/drive/files/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, get.StatusCode);
    }

    [Fact]
    public async Task ListFiles_ScopesPerUser()
    {
        var alice = SignedInClient("alice@example.com", "Alice");
        var bob   = SignedInClient("bob@example.com",   "Bob");

        await alice.PostAsJsonAsync("/api/drive/files", new { name = "alice.graffel", body = "{}" });
        await bob  .PostAsJsonAsync("/api/drive/files", new { name = "bob.graffel",   body = "{}" });

        var aliceFiles = await alice.GetFromJsonAsync<List<DriveFileSummary>>("/api/drive/files");
        var bobFiles   = await bob  .GetFromJsonAsync<List<DriveFileSummary>>("/api/drive/files");

        Assert.NotNull(aliceFiles);
        Assert.NotNull(bobFiles);
        Assert.Single(aliceFiles);
        Assert.Single(bobFiles);
        Assert.Equal("alice.graffel", aliceFiles[0].Name);
        Assert.Equal("bob.graffel",   bobFiles[0].Name);
    }
}
