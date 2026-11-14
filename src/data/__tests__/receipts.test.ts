import { unreadThreads } from '@/domain/rules';

import { createMockRepository, type Seed } from '../mock/mockRepository';
import { createAppStore } from '../store';

const seed = (): Seed => ({
  meId: 'me',
  users: [
    { id: 'me', username: 'me', name: 'Me', bio: '', isPrivate: false, age: 25, dmPermission: 'followers' },
    { id: 'pub', username: 'pub', name: 'Pub', bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' },
  ],
  follows: [],
  moments: [],
  conversations: {
    pub: [{ id: 'x1', fromId: 'pub', body: 'hey', createdAt: 1 }],
  },
});

const timings = { deliverDelayMs: 100, readDelayMs: 300, replyDelayMs: 500 };

describe('message receipts', () => {
  afterEach(() => jest.useRealTimers());

  it('a sent message goes sent → delivered → read, in that order', async () => {
    jest.useFakeTimers();
    const statuses: string[] = [];
    const repo = createMockRepository(seed(), timings);
    repo.onStatus((withId, id, status) => withId === 'pub' && statuses.push(status));
    const msg = await repo.sendMessage('pub', 'hello');
    expect(msg.status).toBe('sent');
    jest.advanceTimersByTime(100);
    expect(statuses).toEqual(['delivered']);
    jest.advanceTimersByTime(200);
    expect(statuses).toEqual(['delivered', 'read']);
    expect((await repo.listConversations()).pub.find((m) => m.id === msg.id)?.status).toBe('read');
  });

  it('the store shows the latest receipt on my message', async () => {
    jest.useFakeTimers();
    const store = createAppStore(createMockRepository(seed(), timings));
    await store.getState().load();
    await store.getState().sendMessage('pub', 'hello');
    const mine = () => store.getState().conversations.pub.find((m) => m.body === 'hello');
    expect(mine()?.status).toBe('sent');
    jest.advanceTimersByTime(100);
    expect(mine()?.status).toBe('delivered');
    jest.advanceTimersByTime(200);
    expect(mine()?.status).toBe('read');
  });

  it('opening a chat marks their messages read, which clears the unread count', async () => {
    const store = createAppStore(createMockRepository(seed(), timings));
    await store.getState().load();
    expect(unreadThreads(store.getState().conversations, 'me')).toBe(1);
    await store.getState().markRead('pub');
    expect(unreadThreads(store.getState().conversations, 'me')).toBe(0);
  });

  it('effects play by default; reducing them is an in-app choice', async () => {
    const store = createAppStore(createMockRepository(seed(), timings));
    expect(store.getState().settings.reduceMotion).toBe(false);
  });
});

describe('comment likes', () => {
  it('liking a comment twice takes the like back', async () => {
    const s = seed();
    s.moments = [
      {
        id: 'm1',
        authorId: 'pub',
        image: 1,
        caption: '',
        audience: 'everyone',
        createdAt: 1,
        reactions: {},
        comments: [{ id: 'c1', authorId: 'pub', body: 'hi', createdAt: 2 }],
      },
    ];
    const store = createAppStore(createMockRepository(s, timings));
    await store.getState().load();
    await store.getState().likeComment('m1', 'c1');
    expect(store.getState().moments[0].comments[0].likedBy).toEqual(['me']);
    await store.getState().likeComment('m1', 'c1');
    expect(store.getState().moments[0].comments[0].likedBy).toEqual([]);
  });
});

describe('safety and account', () => {
  it('blocking removes follows both ways; blocking again unblocks', async () => {
    const s = seed();
    s.follows = [
      { from: 'me', to: 'pub', status: 'active' },
      { from: 'pub', to: 'me', status: 'active' },
    ];
    const store = createAppStore(createMockRepository(s, timings));
    await store.getState().load();
    await store.getState().toggleBlock('pub');
    expect(store.getState().graph.follows).toEqual([]);
    expect(store.getState().graph.blocks).toEqual([{ from: 'me', to: 'pub' }]);
    await store.getState().toggleBlock('pub');
    expect(store.getState().graph.blocks).toEqual([]);
  });

  it('a moment can carry where it was taken', async () => {
    const store = createAppStore(createMockRepository(seed(), timings));
    await store.getState().load();
    const place = { name: 'Mỹ Khê', lat: 16.06, lng: 108.24 };
    const m = await store.getState().createMoment({ image: 2, caption: '', audience: 'friends', place });
    expect(m.place).toEqual(place);
  });

  it('deleting the account wipes my moments and signs out for good', async () => {
    const data: Record<string, string> = {};
    const storage = { getItem: async (k: string) => data[k] ?? null, setItem: async (k: string, v: string) => void (data[k] = v) };
    const s = seed();
    s.moments = [{ id: 'mine', authorId: 'me', image: 1, caption: '', audience: 'friends', createdAt: 1, reactions: {}, comments: [] }];
    const store = createAppStore(createMockRepository(s, timings), { storage });
    await store.getState().load();
    store.getState().signInExisting();
    await store.getState().deleteAccount();
    expect(store.getState().onboarded).toBe(false);
    expect(store.getState().moments.find((m) => m.authorId === 'me')).toBeUndefined();

    const again = createAppStore(createMockRepository(seed(), timings), { storage });
    await again.getState().load();
    expect(again.getState().onboarded).toBe(false);
  });
});
