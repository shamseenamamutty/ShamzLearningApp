import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({ apiEnabled: false, setTokens: vi.fn(), setOnRefresh: vi.fn() }));
const { useStore } = await import('./store');

describe('parent PIN', () => {
  beforeEach(() => useStore.setState({ parent: null, parentSignedIn: false }));

  it('stores only a hash of the PIN chosen at registration', async () => {
    await useStore.getState().registerParent('a@b.com', 'secret123', '4821');
    const p = useStore.getState().parent!;
    expect(p.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(p)).not.toContain('4821');
  });

  it('leaves the PIN unset when none is chosen', async () => {
    await useStore.getState().registerParent('a@b.com', 'secret123');
    expect(useStore.getState().parent!.pinHash).toBeNull();
  });

  it('unlocks with the right PIN only, and signs the parent in', async () => {
    await useStore.getState().registerParent('a@b.com', 'secret123', '4821');
    useStore.getState().signOut();
    expect(await useStore.getState().unlockWithPin('1111')).toBe(false);
    expect(useStore.getState().parentSignedIn).toBe(false);
    expect(await useStore.getState().unlockWithPin('4821')).toBe(true);
    expect(useStore.getState().parentSignedIn).toBe(true);
  });

  it('never unlocks an account without a PIN', async () => {
    await useStore.getState().registerParent('a@b.com', 'secret123');
    useStore.getState().signOut();
    expect(await useStore.getState().unlockWithPin('')).toBe(false);
  });

  it('replaces the PIN with setParentPin', async () => {
    await useStore.getState().registerParent('a@b.com', 'secret123', '4821');
    await useStore.getState().setParentPin('9090');
    expect(await useStore.getState().unlockWithPin('4821')).toBe(false);
    expect(await useStore.getState().unlockWithPin('9090')).toBe(true);
  });
});
