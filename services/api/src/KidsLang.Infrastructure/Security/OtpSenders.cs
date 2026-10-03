using System.Collections.Concurrent;
using KidsLang.Application.Abstractions;
using Microsoft.Extensions.Logging;

namespace KidsLang.Infrastructure.Security;

/// <summary>
/// Development / test sender: keeps the last code per destination in memory instead of sending it.
/// Selected with Otp:Sender = Dev. Never used in production (see docs/PENDING-DECISIONS.md).
/// </summary>
public sealed class DevOtpOutbox(ILogger<DevOtpOutbox> log) : IOtpSender
{
    private readonly ConcurrentDictionary<string, string> _last = new(StringComparer.OrdinalIgnoreCase);

    public bool IsConfigured(OtpChannel channel) => true;

    public Task SendAsync(OtpChannel channel, string destination, string code, CancellationToken ct)
    {
        _last[$"{channel}:{destination}"] = code;
        // Code only — the phone/email is PII and is never logged.
        log.LogInformation("Dev OTP outbox: {Channel} code {Code}", channel, code);
        return Task.CompletedTask;
    }

    public string? LastCode(OtpChannel channel, string destination) => _last.GetValueOrDefault($"{channel}:{destination}");
}

/// <summary>No provider chosen yet: registration answers 503 instead of pretending to send.</summary>
public sealed class UnconfiguredOtpSender : IOtpSender
{
    public bool IsConfigured(OtpChannel channel) => false;
    public Task SendAsync(OtpChannel channel, string destination, string code, CancellationToken ct) =>
        throw new InvalidOperationException($"No {channel} OTP provider is configured.");
}
