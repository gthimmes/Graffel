using Google.Apis.Auth.OAuth2;
using Google.Apis.Drive.v3;
using Google.Apis.Services;
using Microsoft.AspNetCore.Authentication;
using DriveFile = Google.Apis.Drive.v3.Data.File;

namespace Graffel.Api.Drive;

/// <summary>
/// Real Drive store backed by Google.Apis.Drive.v3. Tokens are read from the
/// authenticated cookie (Google scheme has SaveTokens = true). One-off
/// DriveService per call — Drive's client is thread-unsafe and cheap to construct.
/// </summary>
public sealed class GoogleDriveStore(IHttpContextAccessor accessor) : IDriveStore
{
    private const string GraffelMime = "application/json";
    private const string GraffelMarkerKey = "graffel";
    private const string GraffelMarkerValue = "1";

    private async Task<DriveService> ServiceAsync(CancellationToken ct)
    {
        var ctx = accessor.HttpContext
            ?? throw new InvalidOperationException("No HttpContext");
        var token = await ctx.GetTokenAsync("Google", "access_token");
        if (string.IsNullOrEmpty(token))
            throw new UnauthorizedAccessException("Google access token unavailable; user may need to re-sign in.");

        return new DriveService(new BaseClientService.Initializer
        {
            HttpClientInitializer = GoogleCredential.FromAccessToken(token),
            ApplicationName = "Graffel",
        });
    }

    public async Task<IReadOnlyList<DriveFileSummary>> ListAsync(CancellationToken ct = default)
    {
        using var svc = await ServiceAsync(ct);
        var req = svc.Files.List();
        req.Q = $"mimeType='{GraffelMime}' and properties has {{ key='{GraffelMarkerKey}' and value='{GraffelMarkerValue}' }} and trashed=false";
        req.Fields = "files(id,name,modifiedTime)";
        req.PageSize = 100;
        var page = await req.ExecuteAsync(ct);
        return page.Files.Select(f => new DriveFileSummary(
            f.Id,
            f.Name,
            f.ModifiedTimeDateTimeOffset ?? DateTimeOffset.MinValue
        )).ToList();
    }

    public async Task<DriveFileContent?> GetAsync(string fileId, CancellationToken ct = default)
    {
        using var svc = await ServiceAsync(ct);
        DriveFile meta;
        try
        {
            var getReq = svc.Files.Get(fileId);
            getReq.Fields = "id,name";
            meta = await getReq.ExecuteAsync(ct);
        }
        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
        using var ms = new MemoryStream();
        await svc.Files.Get(fileId).DownloadAsync(ms, ct);
        ms.Position = 0;
        using var reader = new StreamReader(ms);
        var body = await reader.ReadToEndAsync(ct);
        return new DriveFileContent(meta.Id, meta.Name, body);
    }

    public async Task<DriveFileSummary> CreateAsync(string name, string body, CancellationToken ct = default)
    {
        using var svc = await ServiceAsync(ct);
        var meta = new DriveFile
        {
            Name = name,
            MimeType = GraffelMime,
            Properties = new Dictionary<string, string>
            {
                [GraffelMarkerKey] = GraffelMarkerValue,
                ["app"] = "graffel",
                ["v"] = "1",
            },
        };
        using var content = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(body));
        var req = svc.Files.Create(meta, content, GraffelMime);
        req.Fields = "id,name,modifiedTime";
        var upload = await req.UploadAsync(ct);
        if (upload.Status != Google.Apis.Upload.UploadStatus.Completed)
            throw upload.Exception ?? new InvalidOperationException("Drive upload failed");
        var file = req.ResponseBody;
        return new DriveFileSummary(
            file.Id,
            file.Name,
            file.ModifiedTimeDateTimeOffset ?? DateTimeOffset.UtcNow
        );
    }

    public async Task<DriveFileSummary> UpdateAsync(string fileId, string name, string body, CancellationToken ct = default)
    {
        using var svc = await ServiceAsync(ct);
        var meta = new DriveFile { Name = name };
        using var content = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(body));
        var req = svc.Files.Update(meta, fileId, content, GraffelMime);
        req.Fields = "id,name,modifiedTime";
        var upload = await req.UploadAsync(ct);
        if (upload.Status != Google.Apis.Upload.UploadStatus.Completed)
            throw upload.Exception ?? new InvalidOperationException("Drive update failed");
        var file = req.ResponseBody;
        return new DriveFileSummary(
            file.Id,
            file.Name,
            file.ModifiedTimeDateTimeOffset ?? DateTimeOffset.UtcNow
        );
    }

    public async Task<bool> DeleteAsync(string fileId, CancellationToken ct = default)
    {
        using var svc = await ServiceAsync(ct);
        try
        {
            await svc.Files.Delete(fileId).ExecuteAsync(ct);
            return true;
        }
        catch (Google.GoogleApiException ex) when (ex.HttpStatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return false;
        }
    }
}
