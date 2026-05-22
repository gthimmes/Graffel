using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace Graffel.Api.Share;

/// <summary>
/// Process-local share registry. Restarts wipe shares. Replace with SQLite or
/// equivalent for persistence (the IShareStore shape doesn't change). See ADR-0009.
/// </summary>
public sealed class InMemoryShareStore : IShareStore
{
    private readonly ConcurrentDictionary<string, ShareRecord> _records = new();

    public Task<ShareRecord> CreateAsync(string ownerId, string body, string title, CancellationToken ct = default)
    {
        // 16 random bytes -> 22-char URL-safe base64. ~128 bits of entropy.
        var bytes = RandomNumberGenerator.GetBytes(16);
        var token = Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var record = new ShareRecord(token, ownerId, body, title, DateTimeOffset.UtcNow);
        _records[token] = record;
        return Task.FromResult(record);
    }

    public Task<ShareRecord?> GetAsync(string token, CancellationToken ct = default)
        => Task.FromResult(_records.TryGetValue(token, out var rec) ? rec : null);

    public Task<RevokeOutcome> RevokeAsync(string token, string callerOwnerId, CancellationToken ct = default)
    {
        if (!_records.TryGetValue(token, out var rec))
            return Task.FromResult(RevokeOutcome.NotFound);
        if (rec.OwnerId != callerOwnerId)
            return Task.FromResult(RevokeOutcome.Forbidden);
        _records.TryRemove(token, out _);
        return Task.FromResult(RevokeOutcome.Revoked);
    }

    /// <summary>Test-only.</summary>
    public void Clear() => _records.Clear();
}
