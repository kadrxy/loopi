import { activityFor, canMessage, canView, isBlocked, searchUsers } from '../rules';
import type { Graph, Moment, User } from '../types';

const u = (id: string): User => ({ id, username: id, name: id, bio: '', isPrivate: false, age: 25, dmPermission: 'everyone' });
const graph: Graph = {
  users: { me: u('me'), bad: u('bad'), ok: u('ok') },
  follows: [{ from: 'bad', to: 'me', status: 'active' }],
  blocks: [{ from: 'me', to: 'bad' }],
};
const mo = (id: string, authorId: string): Moment => ({
  id, authorId, image: 1, caption: '', audience: 'everyone', createdAt: 1, reactions: {}, comments: [],
});

describe('blocking', () => {
  it('works both ways: neither side sees or messages the other', () => {
    expect(isBlocked(graph, 'me', 'bad')).toBe(true);
    expect(isBlocked(graph, 'bad', 'me')).toBe(true);
    expect(canView(graph, 'me', mo('b', 'bad'))).toBe(false);
    expect(canView(graph, 'bad', mo('m', 'me'))).toBe(false);
    expect(canMessage(graph, 'me', 'bad')).toBe(false);
    expect(canMessage(graph, 'bad', 'me')).toBe(false);
    expect(canView(graph, 'me', mo('o', 'ok'))).toBe(true);
  });

  it('keeps blocked people out of search and notifications', () => {
    expect(searchUsers(graph, 'me', 'bad')).toEqual([]);
    expect(activityFor(graph, 'me', []).map((a) => a.fromId)).not.toContain('bad');
  });
});
