using KidsLang.Domain;
using Microsoft.EntityFrameworkCore;

namespace KidsLang.Application.Abstractions;

public interface IKidsLangDb
{
    DbSet<Parent> Parents { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<PendingRegistration> PendingRegistrations { get; }
    DbSet<ChildProfile> ChildProfiles { get; }
    DbSet<LessonProgress> LessonProgress { get; }
    DbSet<ActivityAttempt> ActivityAttempts { get; }
    DbSet<QuizAttempt> QuizAttempts { get; }
    DbSet<ItemMastery> ItemMastery { get; }
    DbSet<Reward> Rewards { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public enum NodeKind { Lesson, Checkpoint, LevelTest }

public sealed record JourneyNodeInfo(
    string Id, string CourseId, NodeKind Kind, string? UnitId, string TitleEn,
    IReadOnlyList<string> NewItems, IReadOnlyList<string> ReviewItems, MasteryConfig Mastery, string? Sticker, string? LevelId);

public sealed record CourseInfo(string Id, string LanguageCode, string Direction, string TitleEn, string TitleNative, string Mascot);

/// <summary>Published content (source of truth: /content JSON).</summary>
public interface IContentCatalog
{
    IReadOnlyList<CourseInfo> Courses { get; }
    IReadOnlyList<JourneyNodeInfo> Nodes(string courseId);
    JourneyNodeInfo? FindNode(string nodeId);
    bool ItemExists(string itemId);
}

public interface IPasswordService
{
    string Hash(Parent parent, string password);
    bool Verify(Parent parent, string password);
}

public interface ITokenService
{
    string CreateAccessToken(Parent parent);
    (string Token, string Hash) CreateRefreshToken();
    string HashRefreshToken(string token);
    TimeSpan RefreshLifetime { get; }
}

public enum OtpChannel { WhatsApp, Email }

/// <summary>
/// Delivers a one-time code from "Kidzly". WhatsApp and email providers are still to be chosen
/// (docs/PENDING-DECISIONS.md); until then Development uses an in-memory outbox.
/// </summary>
public interface IOtpSender
{
    /// <summary>False when no provider is configured for the channel (the request then gets a 503).</summary>
    bool IsConfigured(OtpChannel channel);
    Task SendAsync(OtpChannel channel, string destination, string code, CancellationToken ct);
}

public interface IClock
{
    DateTime UtcNow { get; }
}
