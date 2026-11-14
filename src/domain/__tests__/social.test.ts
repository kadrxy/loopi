import { activityFor, incomingRequests, mapPlaces, searchUsers, userMoments } from '../rules';
import type { Graph, Moment, User } from '../types';

const u = (id: string, extra: Partial<User> = {}): User => ({
  id, username: id, name: id, bio: '', isPrivate: false, age: 25, dmPermission: 'followers', ...extra,
});
const mo = (id: string, authorId: string, extra: Partial<Moment> = {}): Moment => ({
  id, authorId, image: 1, caption: '', audience: 'everyone', createdAt: 100, reactions: {}, comments: [], ...extra,
});

const graph: Graph = {
  users: {
    me: u('me', { isPrivate: true }),
    minh: u('minh', { name: 'Minh Nguyễn', username: 'minh.ng' }),
    ayse: u('ayse', { name: 'Ayşe' }),
    mai: u('mai', { isPrivate: true }),
    req: u('req'),
  },
  follows: [
    { from: 'minh', to: 'me', status: 'active' },
    { from: 'me', to: 'minh', status: 'active' },
    { from: 'req', to: 'me', status: 'pending' },
    { from: 'me', to: 'mai', status: 'pending' },
  ],
};

describe('incoming follow requests', () => {
  it('lists people waiting for my approval, not the requests I sent', () => {
    expect(incomingRequests(graph, 'me')).toEqual(['req']);
  });
});

describe('activity', () => {
  it("collects others' reactions and comments on my moments, followers and requests, newest first", () => {
    const moments = [
      mo('mine', 'me', {
        createdAt: 10,
        reactions: { minh: 'fire', me: 'heart' },
        comments: [
          { id: 'c1', authorId: 'minh', body: 'güzel', createdAt: 50 },
          { id: 'c2', authorId: 'me', body: 'sağ ol', createdAt: 60 },
        ],
      }),
      mo('theirs', 'minh', { reactions: { ayse: 'heart' } }),
    ];
    const items = activityFor(graph, 'me', moments);
    const kinds = items.map((i) => `${i.kind}:${i.fromId}`);
    expect(kinds).toEqual(expect.arrayContaining(['request:req', 'follow:minh', 'comment:minh', 'reaction:minh']));
    expect(kinds).not.toContain('comment:me');
    expect(kinds).not.toContain('reaction:me');
    expect(kinds).not.toContain('reaction:ayse');
    const times = items.map((i) => i.createdAt);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe('user search', () => {
  it('ignores case and Vietnamese/Turkish accents, matches usernames, never returns me', () => {
    expect(searchUsers(graph, 'me', 'nguyen')).toEqual(['minh']);
    expect(searchUsers(graph, 'me', 'AYSE')).toEqual(['ayse']);
    expect(searchUsers(graph, 'me', 'minh.ng')).toEqual(['minh']);
    expect(searchUsers(graph, 'me', 'me')).toEqual([]);
    expect(searchUsers(graph, 'me', '  ')).toEqual([]);
  });
});

describe('map places', () => {
  it('groups only moments I may see that carry a place', () => {
    const place = { name: 'My Khe', lat: 16.06, lng: 108.24 };
    const moments = [
      mo('a', 'minh', { place, createdAt: 5 }),
      mo('b', 'minh', { place, createdAt: 9 }),
      mo('c', 'mai', { place, audience: 'followers' }), // private, request pending: hidden
      mo('d', 'minh'), // no place
    ];
    const places = mapPlaces(graph, 'me', moments);
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('My Khe');
    expect(places[0].moments.map((m) => m.id)).toEqual(['b', 'a']);
  });
});

describe('a person\'s moments', () => {
  it('lists only the moments I may see, newest first', () => {
    const moments = [
      mo('old', 'minh', { createdAt: 1 }),
      mo('new', 'minh', { createdAt: 9 }),
      mo('hidden', 'mai', { audience: 'followers' }),
      mo('other', 'ayse'),
    ];
    expect(userMoments(graph, 'me', moments, 'minh').map((m) => m.id)).toEqual(['new', 'old']);
    expect(userMoments(graph, 'me', moments, 'mai')).toEqual([]);
  });
});
