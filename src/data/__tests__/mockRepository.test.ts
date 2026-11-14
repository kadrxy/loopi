import { createMockRepository, type Seed } from '../mock/mockRepository';
import { createAppStore } from '../store';

const seed = (): Seed => ({
  meId: 'me',
  users: [
    { id: 'me', username: 'me', name: 'Me', bio: '', isPrivate: false, age: 25, dmPermission: 'followers' },
    { id: 'pub', username: 'pub', name: 'Pub', bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' },
    { id: 'priv', username: 'priv', name: 'Priv', bio: '', isPrivate: true, age: 25, dmPermission: 'friends' },
  ],
  follows: [],
  moments: [
    { id: 'm1', authorId: 'pub', image: 1, caption: 'hi', audience: 'everyone', createdAt: 1, reactions: {}, comments: [] },
  ],
  conversations: {},
});

describe('mock repository', () => {
  it('following a public user is active, a private user is pending, and a second call unfollows', async () => {
    const repo = createMockRepository(seed());
    let follows = await repo.toggleFollow('pub');
    expect(follows).toContainEqual({ from: 'me', to: 'pub', status: 'active' });
    follows = await repo.toggleFollow('priv');
    expect(follows).toContainEqual({ from: 'me', to: 'priv', status: 'pending' });
    follows = await repo.toggleFollow('pub');
    expect(follows.find((f) => f.to === 'pub')).toBeUndefined();
  });

  it('reacting twice with the same emoji removes the reaction', async () => {
    const repo = createMockRepository(seed());
    expect((await repo.react('m1', 'heart')).reactions.me).toBe('heart');
    expect((await repo.react('m1', 'heart')).reactions.me).toBeUndefined();
  });

  it('creates my moment at the top of the list', async () => {
    const repo = createMockRepository(seed());
    const m = await repo.createMoment({ image: 2, caption: 'new', audience: 'friends' });
    expect(m.authorId).toBe('me');
    expect((await repo.listMoments())[0].id).toBe(m.id);
  });

  it('appends sent messages and delivers a fake reply through onIncoming', async () => {
    jest.useFakeTimers();
    const incoming = jest.fn();
    const repo = createMockRepository(seed(), { onIncoming: incoming, replyDelayMs: 1000 });
    await repo.sendMessage('pub', 'hello', 'm1');
    const convo = (await repo.listConversations()).pub;
    expect(convo.at(-1)).toMatchObject({ fromId: 'me', body: 'hello', replyToMomentId: 'm1' });
    jest.advanceTimersByTime(1000);
    expect(incoming).toHaveBeenCalledWith('pub', expect.objectContaining({ fromId: 'pub' }));
    jest.useRealTimers();
  });
});

describe('minor messaging guard', () => {
  it('refuses to send from a minor to an adult stranger and never fakes a reply', async () => {
    jest.useFakeTimers();
    const s = seed();
    s.users[0] = { ...s.users[0], age: 17 };
    const incoming = jest.fn();
    const repo = createMockRepository(s, { onIncoming: incoming, replyDelayMs: 10 });
    await expect(repo.sendMessage('pub', 'hi')).rejects.toThrow();
    jest.advanceTimersByTime(50);
    expect(incoming).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});

describe('app store', () => {
  it('a private profile can never publish to everyone, even if the picker still says so', async () => {
    const store = createAppStore(createMockRepository(seed()));
    await store.getState().load();
    await store.getState().updateSettings({ isPrivate: true });
    const m = await store.getState().createMoment({ image: 3, caption: '', audience: 'everyone' });
    expect(m.audience).toBe('followers');
  });

  it('onboarding someone who turns 18 next month keeps the 16-17 protections', async () => {
    const store = createAppStore(createMockRepository(seed()), { now: () => new Date(2026, 10, 14) });
    await store.getState().load();
    await store.getState().finishOnboarding('Ana', { year: 2008, month: 12, day: 20 });
    expect(store.getState().graph.users.me.age).toBe(17);
    expect(store.getState().settings.isPrivate).toBe(true);
  });

  it('onboarding a 17 year old applies the protective defaults', async () => {
    const store = createAppStore(createMockRepository(seed()), { now: () => new Date('2026-11-14') });
    await store.getState().load();
    await store.getState().finishOnboarding('Ana', { year: 2009, month: 6, day: 1 });
    const s = store.getState();
    expect(s.onboarded).toBe(true);
    expect(s.graph.users.me.age).toBe(17);
    expect(s.settings.isPrivate).toBe(true);
    expect(s.settings.dmPermission).toBe('friends');
    expect(Object.values(s.settings.widgets)).not.toContain('everyone');
    expect(s.graph.users.me.isPrivate).toBe(true);
  });

  it('switching to a private profile moves an everyone default audience to followers', async () => {
    const store = createAppStore(createMockRepository(seed()));
    await store.getState().load();
    await store.getState().updateSettings({ defaultAudience: 'everyone' });
    await store.getState().updateSettings({ isPrivate: true });
    expect(store.getState().settings.defaultAudience).toBe('followers');
    expect(store.getState().graph.users.me.isPrivate).toBe(true);
  });
});
