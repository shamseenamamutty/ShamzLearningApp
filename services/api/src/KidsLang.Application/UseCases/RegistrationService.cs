using System.Security.Cryptography;
using System.Text;
using KidsLang.Application.Abstractions;
using KidsLang.Application.Contracts;
using KidsLang.Domain;
using Microsoft.EntityFrameworkCore;

namespace KidsLang.Application.UseCases;

/// <summary>
/// Parent sign-up in two steps: <see cref="StartAsync"/> records the details and sends a 6-digit code
/// by WhatsApp to the phone and another by email; <see cref="VerifyAsync"/> creates the account once
/// both codes match. Replaces the old single-step /auth/register.
/// </summary>
public sealed class RegistrationService(IKidsLangDb db, IPasswordService passwords, ITokenService tokens, IOtpSender otp, IClock clock)
{
    public static readonly TimeSpan CodeLifetime = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(30);
    public const int MaxFailedAttempts = 5;
    public const int MaxResends = 3;

    public async Task<Result<StartRegistrationResponse>> StartAsync(StartRegistrationRequest req, CancellationToken ct)
    {
        if (!otp.IsConfigured(OtpChannel.WhatsApp) || !otp.IsConfigured(OtpChannel.Email))
            return Result<StartRegistrationResponse>.Fail(ErrorKind.Unavailable, "Verification messages can't be sent right now.");

        var email = req.Email.Trim().ToLowerInvariant();
        var phone = Registration.NormalizePhone(req.Phone);
        if (await db.Parents.AnyAsync(p => p.Email == email, ct))
            return Result<StartRegistrationResponse>.Fail(ErrorKind.Conflict, "An account with this email already exists.");
        if (await db.Parents.AnyAsync(p => p.Phone == phone, ct))
            return Result<StartRegistrationResponse>.Fail(ErrorKind.Conflict, "An account with this phone number already exists.");

        // Starting again for the same email replaces the earlier, unfinished attempt.
        var stale = await db.PendingRegistrations.Where(r => r.Email == email || r.Phone == phone).ToListAsync(ct);
        db.PendingRegistrations.RemoveRange(stale);

        var pending = new PendingRegistration { Name = req.Name.Trim(), Email = email, Phone = phone, Locale = req.Locale ?? "en", CreatedAtUtc = clock.UtcNow };
        var stand = new Parent { Id = pending.Id };
        pending.PasswordHash = passwords.Hash(stand, req.Password);
        pending.PinHash = passwords.Hash(stand, req.Pin);
        var (phoneCode, emailCode) = IssueCodes(pending);
        db.PendingRegistrations.Add(pending);
        await db.SaveChangesAsync(ct);

        await otp.SendAsync(OtpChannel.WhatsApp, phone, phoneCode, ct);
        await otp.SendAsync(OtpChannel.Email, email, emailCode, ct);
        return Result<StartRegistrationResponse>.Ok(Response(pending));
    }

    public async Task<Result<StartRegistrationResponse>> ResendAsync(ResendRegistrationRequest req, CancellationToken ct)
    {
        var pending = await db.PendingRegistrations.FirstOrDefaultAsync(r => r.Id == req.RegistrationId, ct);
        if (pending is null) return Result<StartRegistrationResponse>.Fail(ErrorKind.NotFound, "This sign-up has expired. Please start again.");
        if (pending.Resends >= MaxResends || clock.UtcNow - pending.CodesSentAtUtc < ResendCooldown)
            return Result<StartRegistrationResponse>.Fail(ErrorKind.TooManyRequests, "Please wait a moment before asking for new codes.");
        pending.Resends++;
        pending.FailedAttempts = 0;
        var (phoneCode, emailCode) = IssueCodes(pending);
        await db.SaveChangesAsync(ct);
        await otp.SendAsync(OtpChannel.WhatsApp, pending.Phone, phoneCode, ct);
        await otp.SendAsync(OtpChannel.Email, pending.Email, emailCode, ct);
        return Result<StartRegistrationResponse>.Ok(Response(pending));
    }

    public async Task<Result<AuthResponse>> VerifyAsync(VerifyRegistrationRequest req, CancellationToken ct)
    {
        var pending = await db.PendingRegistrations.FirstOrDefaultAsync(r => r.Id == req.RegistrationId, ct);
        if (pending is null || pending.ExpiresAtUtc <= clock.UtcNow || pending.FailedAttempts >= MaxFailedAttempts)
            return Result<AuthResponse>.Fail(ErrorKind.Unauthorized, "These codes have expired. Ask for new codes.");

        var phoneOk = Matches(pending.PhoneCodeHash, pending.Id, req.PhoneCode);
        var emailOk = Matches(pending.EmailCodeHash, pending.Id, req.EmailCode);
        if (!phoneOk || !emailOk)
        {
            pending.FailedAttempts++;
            await db.SaveChangesAsync(ct);
            var which = !phoneOk && !emailOk ? "Both codes are" : !phoneOk ? "The WhatsApp code is" : "The email code is";
            return Result<AuthResponse>.Fail(ErrorKind.Unauthorized, $"{which} not right.");
        }

        // The email/phone may have been taken by another sign-up that finished first.
        if (await db.Parents.AnyAsync(p => p.Email == pending.Email || p.Phone == pending.Phone, ct))
            return Result<AuthResponse>.Fail(ErrorKind.Conflict, "An account with this email or phone already exists.");

        var now = clock.UtcNow;
        var parent = new Parent
        {
            Id = pending.Id,
            Name = pending.Name,
            Email = pending.Email,
            Phone = pending.Phone,
            PasswordHash = pending.PasswordHash,
            PinHash = pending.PinHash,
            Locale = pending.Locale,
            ConsentGivenAtUtc = pending.CreatedAtUtc,
            EmailVerifiedAtUtc = now,
            PhoneVerifiedAtUtc = now,
            CreatedAtUtc = now,
        };
        db.Parents.Add(parent);
        db.PendingRegistrations.Remove(pending);
        var (token, hash) = tokens.CreateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken { ParentId = parent.Id, TokenHash = hash, ExpiresAtUtc = now + tokens.RefreshLifetime });
        await db.SaveChangesAsync(ct);
        return Result<AuthResponse>.Ok(new AuthResponse(tokens.CreateAccessToken(parent), token, parent.Id));
    }

    private (string Phone, string Email) IssueCodes(PendingRegistration pending)
    {
        var phone = NewCode();
        var email = NewCode();
        pending.PhoneCodeHash = HashCode(pending.Id, phone);
        pending.EmailCodeHash = HashCode(pending.Id, email);
        pending.CodesSentAtUtc = clock.UtcNow;
        pending.ExpiresAtUtc = clock.UtcNow + CodeLifetime;
        return (phone, email);
    }

    private static StartRegistrationResponse Response(PendingRegistration p) =>
        new(p.Id, Registration.MaskPhone(p.Phone), Registration.MaskEmail(p.Email), p.ExpiresAtUtc);

    private static string NewCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static string HashCode(Guid id, string code) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes($"{id:N}:{code}")));

    private static bool Matches(string storedHash, Guid id, string code) =>
        CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(storedHash), Encoding.ASCII.GetBytes(HashCode(id, code.Trim())));
}

public static class Registration
{
    /// <summary>"+971 50-123 4567" → "+971501234567"; a leading 00 becomes +.</summary>
    public static string NormalizePhone(string phone)
    {
        var digits = new string((phone ?? "").Where(c => char.IsDigit(c) || c == '+').ToArray());
        if (digits.StartsWith("00", StringComparison.Ordinal)) digits = "+" + digits[2..];
        return digits;
    }

    public static string MaskPhone(string phone) => phone.Length <= 4 ? phone : $"{phone[..4]}•••{phone[^3..]}";

    public static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        return at <= 1 ? email : $"{email[0]}•••{email[at..]}";
    }
}
