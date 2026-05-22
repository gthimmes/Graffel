namespace Graffel.Api.Drive;

public sealed record DriveFileSummary(string Id, string Name, DateTimeOffset ModifiedTime);

public sealed record DriveFileContent(string Id, string Name, string Body);

/// <summary>
/// Abstraction over Google Drive. Production binding talks to the real API via the
/// signed-in user's stored OAuth tokens; tests use an in-memory implementation.
/// All operations are scoped to the calling user — the implementation derives identity
/// from HttpContext (or a test-provided header).
/// </summary>
public interface IDriveStore
{
    Task<IReadOnlyList<DriveFileSummary>> ListAsync(CancellationToken ct = default);
    Task<DriveFileContent?> GetAsync(string fileId, CancellationToken ct = default);
    Task<DriveFileSummary> CreateAsync(string name, string body, CancellationToken ct = default);
    Task<DriveFileSummary> UpdateAsync(string fileId, string name, string body, CancellationToken ct = default);
    Task<bool> DeleteAsync(string fileId, CancellationToken ct = default);
}
