using Graffel.Api.Drive;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Graffel.Api.Tests;

/// <summary>
/// Shared test factory: forces the in-memory Drive store so tests don't reach Google,
/// and lets every test ride the same composition. The TestAuthHandler activates per-request
/// via the X-Test-User header.
/// </summary>
public class GraffelApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        builder.ConfigureTestServices(services =>
        {
            // Swap the production IDriveStore for the in-memory test shim.
            var existing = services.SingleOrDefault(d => d.ServiceType == typeof(IDriveStore));
            if (existing is not null) services.Remove(existing);
            services.AddSingleton<IDriveStore, InMemoryDriveStore>();
        });
    }
}
