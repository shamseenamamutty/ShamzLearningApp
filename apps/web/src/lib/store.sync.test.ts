import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  apiEnabled: true,
  startRegistration: vi.fn(),
  resendRegistration: vi.fn(),
  verifyRegistration: vi.fn(),
  login: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  },
  createChild: vi.fn(),
  deleteChild: vi.fn(),
  submitQuiz: vi.fn(),
  submitAttemptsBatch: vi.fn(),
  setTokens: vi.fn(),
  setOnRefresh: vi.fn(),
}));
vi.mock('./api', () => apiMocks);

// Imported after the mock so the store binds to the mocked module.
const { useStore } = await import('./store');

const reset = () => {
  useStore.setState({ parent: null, parentSignedIn: false, backendAuth: null, children: [], activeChildId: null, data: {}, settings: {}, pendingSignUp: null });
  Object.values(apiMocks).forEach((fn) => typeof fn === 'function' && 'mockReset' in fn && fn.mockReset());
  apiMocks.createChild.mockResolvedValue({});
  apiMocks.deleteChild.mockResolvedValue(undefined);
};

const DETAILS = { name: 'Amina', email: 'Parent@Example.com', phone: '+971501234567', password: 'secret123', pin: '4821' };

/** Full sign-up against the (mocked) backend: start → codes → verify. */
async function signUpWithBackend() {
  apiMocks.startRegistration.mockResolvedValue({ registrationId: 'r1', maskedPhone: '+971•••567', maskedEmail: 'p•••@example.com', expiresAtUtc: new Date(Date.now() + 600_000).toISOString() });
  apiMocks.verifyRegistration.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', parentId: 'p1' });
  expect(await useStore.getState().startSignUp(DETAILS)).toEqual({ ok: true });
  expect(await useStore.getState().verifySignUp('123456', '654321')).toBe('ok');
}

describe('store <-> backend sync (mocked api module)', () => {
  beforeEach(reset);
  afterEach(() => vi.clearAllMocks());

  it('sends sign-up details to the backend, then signs in with its tokens once both codes verify', async () => {
    await signUpWithBackend();
    expect(apiMocks.startRegistration).toHaveBeenCalledWith(expect.objectContaining({ name: 'Amina', email: 'parent@example.com', phone: '+971501234567', pin: '4821', consentGiven: true }));
    expect(apiMocks.verifyRegistration).toHaveBeenCalledWith('r1', '123456', '654321');
    const { parentSignedIn, backendAuth, parent, pendingSignUp } = useStore.getState();
    expect(parentSignedIn).toBe(true);
    expect(backendAuth).toEqual({ access: 'a', refresh: 'r' });
    expect(parent).toMatchObject({ name: 'Amina', phone: '+971501234567', email: 'parent@example.com' });
    expect(parent!.pinHash).toMatch(/^[0-9a-f]{64}$/);
    expect(pendingSignUp).toBeNull();
  });

  it('does not create the account until the codes are verified, and reports which code was wrong', async () => {
    apiMocks.startRegistration.mockResolvedValue({ registrationId: 'r1', maskedPhone: 'x', maskedEmail: 'y', expiresAtUtc: '' });
    await useStore.getState().startSignUp(DETAILS);
    expect(useStore.getState().parentSignedIn).toBe(false);
    apiMocks.verifyRegistration.mockRejectedValue(new apiMocks.ApiError(401, '{"detail":"The WhatsApp code is not right."}'));
    expect(await useStore.getState().verifySignUp('000000', '654321')).toBe('wrong-phone');
    expect(useStore.getState().parent).toBeNull();
  });

  it('maps an existing account and a missing sender to clear errors', async () => {
    apiMocks.startRegistration.mockRejectedValueOnce(new apiMocks.ApiError(409, 'exists'));
    expect(await useStore.getState().startSignUp(DETAILS)).toEqual({ ok: false, error: 'exists' });
    apiMocks.startRegistration.mockRejectedValueOnce(new apiMocks.ApiError(503, 'no sender'));
    expect(await useStore.getState().startSignUp(DETAILS)).toEqual({ ok: false, error: 'unavailable' });
    apiMocks.startRegistration.mockRejectedValueOnce(new TypeError('offline'));
    expect(await useStore.getState().startSignUp(DETAILS)).toEqual({ ok: false, error: 'network' });
  });

  it('mirrors a new child to the backend once signed in there', async () => {
    await signUpWithBackend();
    apiMocks.createChild.mockResolvedValue({});
    const id = useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    await Promise.resolve(); // let the fire-and-forget call settle
    expect(apiMocks.createChild).toHaveBeenCalledWith(expect.objectContaining({ id, nickname: 'Sara' }));
  });

  it('does not call the backend to create a child when signed in locally only', () => {
    useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    expect(apiMocks.createChild).not.toHaveBeenCalled();
  });

  it('upgrades a locally-missed mastery when the server confirms it, without touching the returned result', async () => {
    await signUpWithBackend();
    const childId = useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    useStore.getState().selectChild(childId);

    apiMocks.submitQuiz.mockResolvedValue({ mastered: true, score: 1, stars: 3, missedItems: [], nextNodeId: null, newRewards: [] });
    const result = useStore.getState().completeCheck('ar-l1-u1-l1', [{ itemId: 'ar-letter-alif', correct: false }], null);
    expect(result.mastered).toBe(false); // the synchronous return is the client's own evaluation, unaffected

    await vi.waitFor(() => expect(useStore.getState().data[childId]!.lessons['ar-l1-u1-l1']!.status).toBe('mastered'));
    expect(useStore.getState().data[childId]!.lessons['ar-l1-u1-l1']!.stars).toBe(3);
  });

  it('never downgrades a lesson the client already mastered, even if the server disagrees', async () => {
    await signUpWithBackend();
    const childId = useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    useStore.getState().selectChild(childId);

    apiMocks.submitQuiz.mockResolvedValue({ mastered: false, score: 0.4, stars: 0, missedItems: ['ar-letter-alif'], nextNodeId: null, newRewards: [] });
    const perfect = Array.from({ length: 5 }, () => ({ itemId: 'ar-letter-alif', correct: true }));
    useStore.getState().completeCheck('ar-l1-u1-l1', perfect, 0.9);
    await apiMocks.submitQuiz.mock.results[0]!.value.catch(() => {});
    await new Promise((r) => setTimeout(r, 0));
    expect(useStore.getState().data[childId]!.lessons['ar-l1-u1-l1']!.status).toBe('mastered');
  });

  it('flushQueue sends queued attempts and clears the accepted ones', async () => {
    await signUpWithBackend();
    const childId = useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    useStore.getState().selectChild(childId);
    useStore.getState().recordAnswer('act-1', 'ar-letter-alif', true);
    expect(useStore.getState().data[childId]!.queue).toHaveLength(1);

    apiMocks.submitAttemptsBatch.mockImplementation(async (batch: { id: string }[]) => ({ acceptedIds: batch.map((a) => a.id) }));
    await useStore.getState().flushQueue();
    expect(useStore.getState().data[childId]!.queue).toHaveLength(0);
    expect(apiMocks.submitAttemptsBatch).toHaveBeenCalledTimes(1);
  });

  it('flushQueue is a no-op without a backend session', async () => {
    const childId = useStore.getState().addChild({ nickname: 'Sara', ageBand: '4-6', avatar: { animal: '🦊', color: '#fff', item: 'none' }, pinHash: null, courses: ['ar'] });
    useStore.getState().selectChild(childId);
    useStore.getState().recordAnswer('act-1', 'ar-letter-alif', true);
    await useStore.getState().flushQueue();
    expect(apiMocks.submitAttemptsBatch).not.toHaveBeenCalled();
    expect(useStore.getState().data[childId]!.queue).toHaveLength(1);
  });
});
