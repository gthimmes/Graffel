namespace Graffel.Api.Share;

public sealed record ShareRecord(
    string Token,
    string OwnerId,
    string Body,
    string Title,
    DateTimeOffset CreatedAt);

public interface IShareStore
{
    Task<ShareRecord> CreateAsync(string ownerId, string body, string title, CancellationToken ct = default);
    Task<ShareRecord?> GetAsync(string token, CancellationToken ct = default);
    /// <summary>Revoke a share. Returns true if it existed and the caller owns it.</summary>
    Task<RevokeOutcome> RevokeAsync(string token, string callerOwnerId, CancellationToken ct = default);
}

public enum RevokeOutcome { Revoked, NotFound, Forbidden }
