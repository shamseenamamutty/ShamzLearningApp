import { beforeEach, describe, expect, it, vi } from 'vitest';

// No backend configured (like the live site today): codes are made on the device and shown.
vi.mock('./api', () => ({ apiEnabled: false, setTokens: vi.fn(), setOnRefresh: vi.fn(), ApiError: class extends Error {} }));
const { useStore } = await import('./store');

const DETAILS = { name: 'Amina', email: 'a@b.com', phone: '+971501234567', password: 'secret123', pin: '4821' };

describe('sign-up in demo mode (no backend yet)', () => {
  beforeEach(() => useStore.setState({ parent: null, parentSignedIn: false, pendingSignUp: null }));

  it('makes two 6-digit codes and needs both to create the account', async () => {
    await useStore.getState().startSignUp(DETAILS);
    const p = useStore.getState().pendingSignUp!;
    expect(p.mode).toBe('demo');
    expect(p.maskedPhone).toBe('+971•••567');
    expect(p.demoCodes!.phone).toMatch(/^\d{6}$/);
    expect(p.demoCodes!.email).toMatch(/^\d{6}$/);
    const wrong = p.demoCodes!.email === '000000' ? '111111' : '000000';
    expect(await useStore.getState().verifySignUp(p.demoCodes!.phone, wrong)).toBe('wrong-email');
    expect(useStore.getState().parent).toBeNull();
    expect(await useStore.getState().verifySignUp(p.demoCodes!.phone, p.demoCodes!.email)).toBe('ok');
    expect(useStore.getState().parent).toMatchObject({ name: 'Amina', phone: '+971501234567' });
    // The PIN chosen at sign-up unlocks "Let's go".
    useStore.getState().signOut();
    expect(await useStore.getState().unlockWithPin('4821')).toBe(true);
  });

  it('locks after five wrong tries until new codes are sent', async () => {
    await useStore.getState().startSignUp(DETAILS);
    const codes = useStore.getState().pendingSignUp!.demoCodes!;
    const bad = codes.phone === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++) await useStore.getState().verifySignUp(bad, codes.email);
    expect(await useStore.getState().verifySignUp(codes.phone, codes.email)).toBe('expired');
    await useStore.getState().resendSignUpCodes();
    const fresh = useStore.getState().pendingSignUp!.demoCodes!;
    expect(await useStore.getState().verifySignUp(fresh.phone, fresh.email)).toBe('ok');
  });
});
