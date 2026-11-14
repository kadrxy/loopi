import { createMockRepository, type Seed } from '../mock/mockRepository';
import { createAppStore, type KeyValueStorage } from '../store';

const seed = (): Seed => ({
  meId: 'me',
  users: [{ id: 'me', username: 'me', name: 'Me', bio: '', isPrivate: false, age: 25, dmPermission: 'followers' }],
  follows: [],
  moments: [],
  conversations: {},
});

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => data[k] ?? null,
    setItem: async (k, v) => {
      data[k] = v;
    },
  };
}

const now = () => new Date(2026, 10, 14);

describe('session persistence', () => {
  it('a restarted app remembers onboarding, settings and my profile', async () => {
    const storage = memoryStorage();
    const first = createAppStore(createMockRepository(seed()), { storage, now });
    await first.getState().load();
    await first.getState().finishOnboarding('Deniz', { year: 2000, month: 5, day: 1 });
    await first.getState().updateSettings({ launch: 'camera', lang: 'en' });

    const second = createAppStore(createMockRepository(seed()), { storage, now });
    await second.getState().load();
    const s = second.getState();
    expect(s.onboarded).toBe(true);
    expect(s.settings.launch).toBe('camera');
    expect(s.settings.lang).toBe('en');
    expect(s.graph.users.me.name).toBe('Deniz');
    expect(s.graph.users.me.age).toBe(26);
  });

  it('a restarted 17 year old keeps the private profile in the graph, not only in settings', async () => {
    const storage = memoryStorage();
    const first = createAppStore(createMockRepository(seed()), { storage, now });
    await first.getState().load();
    await first.getState().finishOnboarding('Can', { year: 2009, month: 6, day: 1 });

    const second = createAppStore(createMockRepository(seed()), { storage, now });
    await second.getState().load();
    const me = second.getState().graph.users.me;
    expect(me.age).toBe(17);
    expect(me.isPrivate).toBe(true);
    expect(me.dmPermission).toBe('friends');
  });

  it('signing in and then signing out are both remembered', async () => {
    const storage = memoryStorage();
    const restart = async () => {
      const store = createAppStore(createMockRepository(seed()), { storage, now });
      await store.getState().load();
      return store;
    };
    const first = await restart();
    first.getState().signInExisting();
    await new Promise((r) => setTimeout(r, 0));

    const second = await restart();
    expect(second.getState().onboarded).toBe(true);
    second.getState().resetOnboarding();
    await new Promise((r) => setTimeout(r, 0));

    expect((await restart()).getState().onboarded).toBe(false);
  });

  it('a corrupt saved session is ignored instead of crashing the launch', async () => {
    const storage = memoryStorage({ 'loopi.session': '{not json' });
    const store = createAppStore(createMockRepository(seed()), { storage, now });
    await store.getState().load();
    expect(store.getState().loaded).toBe(true);
    expect(store.getState().onboarded).toBe(false);
  });

  it('without a saved session, privacy settings mirror my profile', async () => {
    const s = seed();
    s.users[0] = { ...s.users[0], isPrivate: true, dmPermission: 'friends' };
    const store = createAppStore(createMockRepository(s), { storage: memoryStorage(), now });
    await store.getState().load();
    expect(store.getState().settings.isPrivate).toBe(true);
    expect(store.getState().settings.dmPermission).toBe('friends');
  });
});

describe('profile and social actions', () => {
  it('an edited profile survives a restart', async () => {
    const storage = memoryStorage();
    const first = createAppStore(createMockRepository(seed()), { storage, now });
    await first.getState().load();
    await first.getState().updateProfile({ name: 'Deniz', username: 'deniz', bio: 'Hội An', avatar: 'file:///a.jpg' });

    const second = createAppStore(createMockRepository(seed()), { storage, now });
    await second.getState().load();
    const me = second.getState().graph.users.me;
    expect([me.name, me.username, me.bio, me.avatar]).toEqual(['Deniz', 'deniz', 'Hội An', 'file:///a.jpg']);
  });

  it('the middle tab is the map unless I choose the camera', async () => {
    const store = createAppStore(createMockRepository(seed()), { storage: memoryStorage(), now });
    await store.getState().load();
    expect(store.getState().settings.centerTab).toBe('map');
  });

  it('approving a request makes them a follower, declining removes it', async () => {
    const s = seed();
    s.users.push(
      { id: 'a', username: 'a', name: 'A', bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' },
      { id: 'b', username: 'b', name: 'B', bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' },
    );
    s.follows.push({ from: 'a', to: 'me', status: 'pending' }, { from: 'b', to: 'me', status: 'pending' });
    const store = createAppStore(createMockRepository(s), { now });
    await store.getState().load();
    await store.getState().respondFollow('a', true);
    await store.getState().respondFollow('b', false);
    const follows = store.getState().graph.follows;
    expect(follows).toContainEqual({ from: 'a', to: 'me', status: 'active' });
    expect(follows.find((f) => f.from === 'b')).toBeUndefined();
  });

  it('a photo reply carries the image', async () => {
    const s = seed();
    s.users.push({ id: 'f', username: 'f', name: 'F', bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' });
    const store = createAppStore(createMockRepository(s, { replyDelayMs: 60_000 }), { now });
    await store.getState().load();
    await store.getState().sendMessage('f', '', undefined, 'file:///shot.jpg');
    expect(store.getState().conversations.f[0].image).toBe('file:///shot.jpg');
  });
});

describe('story ring order', () => {
  it('watching a story greys its ring at once but only moves it on the next refresh', async () => {
    const store = createAppStore(createMockRepository(seed()), { now });
    await store.getState().load();
    store.getState().markSeen('a');
    expect(store.getState().seen.a).toBe(true);
    expect(store.getState().seenAtRefresh.a).toBeUndefined();
    await store.getState().refresh();
    expect(store.getState().seenAtRefresh.a).toBe(true);
  });
});
