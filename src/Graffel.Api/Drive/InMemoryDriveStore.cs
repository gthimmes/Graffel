using System.Collections.Concurrent;
using System.Security.Claims;

namespace Graffel.Api.Drive;

/// <summary>
/// Per-user in-memory Drive shim used in tests. Data is keyed by user id (the
/// authenticated principal's NameIdentifier claim) so concurrent test users
/// don't share state.
/// </summary>
public sealed class InMemoryDriveStore(IHttpContextAccessor accessor) : IDriveStore
{
    private static readonly ConcurrentDictionary<string, ConcurrentDictionary<string, StoredFile>> _byUser = new();

    private string UserId
    {
        get
        {
            var ctx = accessor.HttpContext
                ?? throw new InvalidOperationException("No HttpContext");
            var id = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(id)
                ? throw new InvalidOperationException("User is not authenticated")
                : id;
        }
    }

    private ConcurrentDictionary<string, StoredFile> Bucket => _byUser.GetOrAdd(UserId, _ => new());

    public Task<IReadOnlyList<DriveFileSummary>> ListAsync(CancellationToken ct = default)
    {
        var items = Bucket.Values
            .OrderByDescending(f => f.ModifiedTime)
            .Select(f => new DriveFileSummary(f.Id, f.Name, f.ModifiedTime))
            .ToList();
        return Task.FromResult<IReadOnlyList<DriveFileSummary>>(items);
    }

    public Task<DriveFileContent?> GetAsync(string fileId, CancellationToken ct = default)
    {
        return Task.FromResult(Bucket.TryGetValue(fileId, out var f)
            ? new DriveFileContent(f.Id, f.Name, f.Body)
            : null);
    }

    public Task<DriveFileSummary> CreateAsync(string name, string body, CancellationToken ct = default)
    {
        var id = Guid.NewGuid().ToString("N");
        var now = DateTimeOffset.UtcNow;
        Bucket[id] = new StoredFile(id, name, body, now);
        return Task.FromResult(new DriveFileSummary(id, name, now));
    }

    public Task<DriveFileSummary> UpdateAsync(string fileId, string name, string body, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        Bucket[fileId] = new StoredFile(fileId, name, body, now);
        return Task.FromResult(new DriveFileSummary(fileId, name, now));
    }

    public Task<bool> DeleteAsync(string fileId, CancellationToken ct = default)
    {
        return Task.FromResult(Bucket.TryRemove(fileId, out _));
    }

    /// <summary>Test-only: wipe everything across all users.</summary>
    public static void ClearAll() => _byUser.Clear();

    private sealed record StoredFile(string Id, string Name, string Body, DateTimeOffset ModifiedTime);
}
