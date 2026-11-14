import {
  ageOn,
  canMessage,
  canView,
  discoverFor,
  feedFor,
  isFriend,
  replyPreview,
  storyGroups,
  widgetMomentsFor,
} from '../rules';
import type { Follow, Graph, Moment, User } from '../types';

const user = (id: string, over: Partial<User> = {}): User => ({
  id,
  username: id,
  name: id,
  bio: '',
  isPrivate: false,
  age: 25,
  dmPermission: 'everyone',
  ...over,
});

const moment = (id: string, authorId: string, audience: Moment['audience'], createdAt: number): Moment => ({
  id,
  authorId,
  image: 1,
  caption: '',
  audience,
  createdAt,
  reactions: {},
  comments: [],
});

function fixture(overrides: Partial<Record<string, Partial<User>>> = {}): Graph {
  const ids = ['me', 'friend', 'followingOnly', 'followerOnly', 'stranger', 'privatePending', 'minor'];
  const users: Record<string, User> = {};
  for (const id of ids) users[id] = user(id, overrides[id]);
  users.privatePending = { ...users.privatePending, isPrivate: true, ...overrides.privatePending };
  users.minor = { ...users.minor, age: 17, ...overrides.minor };
  const follows: Follow[] = [
    { from: 'me', to: 'friend', status: 'active' },
    { from: 'friend', to: 'me', status: 'active' },
    { from: 'me', to: 'followingOnly', status: 'active' },
    { from: 'followerOnly', to: 'me', status: 'active' },
    { from: 'me', to: 'privatePending', status: 'pending' },
  ];
  return { users, follows };
}

const moments: Moment[] = [
  moment('m-friend-friends', 'friend', 'friends', 100),
  moment('m-following-friends', 'followingOnly', 'friends', 90),
  moment('m-following-everyone', 'followingOnly', 'everyone', 80),
  moment('m-follower-everyone', 'followerOnly', 'everyone', 70),
  moment('m-stranger-everyone', 'stranger', 'everyone', 60),
  moment('m-private-followers', 'privatePending', 'followers', 50),
  moment('m-minor-everyone', 'minor', 'everyone', 40),
  moment('m-me', 'me', 'friends', 30),
];
const byId = (id: string) => moments.find((m) => m.id === id)!;

describe('friendship', () => {
  it('treats mutual active follows as friends', () => {
    const g = fixture();
    expect(isFriend(g, 'me', 'friend')).toBe(true);
    expect(isFriend(g, 'me', 'followingOnly')).toBe(false);
  });
});

describe('canView', () => {
  it("shows a friend's friends-only moment", () => {
    expect(canView(fixture(), 'me', byId('m-friend-friends'))).toBe(true);
  });

  it('hides a friends-only moment from someone who is only followed one way', () => {
    expect(canView(fixture(), 'me', byId('m-following-friends'))).toBe(false);
  });

  it('hides every moment of a private account whose follow request is still pending', () => {
    expect(canView(fixture(), 'me', byId('m-private-followers'))).toBe(false);
  });

  it('hides old everyone-moments from non-followers as soon as the author goes private', () => {
    const g = fixture({ stranger: { isPrivate: true } });
    expect(canView(g, 'me', byId('m-stranger-everyone'))).toBe(false);
  });

  it('always shows my own moments', () => {
    expect(canView(fixture(), 'me', byId('m-me'))).toBe(true);
  });
});

describe('feed and discover', () => {
  it('feed contains only visible moments of people I follow plus mine, newest first', () => {
    const ids = feedFor(fixture(), 'me', moments).map((m) => m.id);
    expect(ids).toEqual(['m-friend-friends', 'm-following-everyone', 'm-me']);
  });

  it('discover excludes minors, private authors and myself', () => {
    const ids = discoverFor(fixture(), 'me', moments).map((m) => m.id);
    expect(ids).toEqual(['m-following-everyone', 'm-follower-everyone', 'm-stranger-everyone']);
  });
});

describe('widgetMomentsFor', () => {
  it('friends source shows only friends', () => {
    expect(widgetMomentsFor(fixture(), 'me', moments, 'friends').map((m) => m.id)).toEqual(['m-friend-friends']);
  });

  it('followers source shows visible moments of my followers', () => {
    expect(widgetMomentsFor(fixture(), 'me', moments, 'followers').map((m) => m.id)).toEqual([
      'm-friend-friends',
      'm-follower-everyone',
    ]);
  });

  it('everyone source is locked for a 16-17 year old viewer', () => {
    expect(widgetMomentsFor(fixture(), 'minor', moments, 'everyone')).toEqual([]);
  });
});

describe('canMessage', () => {
  it('blocks an adult stranger from messaging a minor even if the minor allows everyone', () => {
    expect(canMessage(fixture(), 'me', 'minor')).toBe(false);
  });

  it('lets a friend message a minor', () => {
    const g = fixture();
    g.follows.push({ from: 'me', to: 'minor', status: 'active' }, { from: 'minor', to: 'me', status: 'active' });
    expect(canMessage(g, 'me', 'minor')).toBe(true);
  });

  it('blocks a minor from messaging an adult stranger even if the adult allows everyone', () => {
    const g = fixture({ minor: { dmPermission: 'everyone' }, stranger: { dmPermission: 'everyone' } });
    g.follows.push({ from: 'stranger', to: 'minor', status: 'active' });
    expect(canMessage(g, 'minor', 'stranger')).toBe(false);
  });

  it('respects a followers-only DM setting', () => {
    const g = fixture({ followingOnly: { dmPermission: 'followers' }, stranger: { dmPermission: 'followers' } });
    expect(canMessage(g, 'me', 'followingOnly')).toBe(true);
    expect(canMessage(g, 'me', 'stranger')).toBe(false);
  });
});

describe('replyPreview', () => {
  it('returns the replied-to moment only while the viewer can still see it', () => {
    const g = fixture();
    expect(replyPreview(g, 'me', moments, 'm-friend-friends')?.id).toBe('m-friend-friends');
    expect(replyPreview(g, 'me', moments, 'm-following-friends')).toBeUndefined();
    expect(replyPreview(g, 'me', moments, undefined)).toBeUndefined();
  });
});

describe('ageOn', () => {
  const now = new Date(2026, 10, 14); // 14 Nov 2026
  it('counts a birthday later this year as not yet reached', () => {
    expect(ageOn({ year: 2008, month: 12, day: 20 }, now)).toBe(17);
    expect(ageOn({ year: 2010, month: 12, day: 1 }, now)).toBe(15);
  });
  it('counts a birthday earlier this year (or today) as reached', () => {
    expect(ageOn({ year: 2008, month: 11, day: 14 }, now)).toBe(18);
    expect(ageOn({ year: 2010, month: 3, day: 2 }, now)).toBe(16);
  });
  it('returns NaN for impossible dates', () => {
    expect(ageOn({ year: 2009, month: 2, day: 30 }, now)).toBeNaN();
    expect(ageOn({ year: 2009, month: 13, day: 1 }, now)).toBeNaN();
  });
});

describe('storyGroups', () => {
  it('groups my visible feed moments by author, newest author first, excluding me', () => {
    const groups = storyGroups(fixture(), 'me', moments);
    expect(groups.map((s) => s.userId)).toEqual(['friend', 'followingOnly']);
    expect(groups[1].moments.map((m) => m.id)).toEqual(['m-following-everyone']);
  });
});
