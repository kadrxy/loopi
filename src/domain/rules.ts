// Visibility rules (spec §6.2–6.4, §6.7, §7). Pure functions; evaluated at view time.
// When the Supabase backend lands, the same rules are enforced in Postgres (RLS / can_view_moment).

import type { ActivityItem, BirthDate, DmPermission, Graph, MapPlace, Message, Moment, StoryGroup, User, WidgetSource } from './types';

const newestFirst = (a: Moment, b: Moment) => b.createdAt - a.createdAt;

export const isFollowing = (g: Graph, a: string, b: string) =>
  g.follows.some((f) => f.from === a && f.to === b && f.status === 'active');

export const isPending = (g: Graph, a: string, b: string) =>
  g.follows.some((f) => f.from === a && f.to === b && f.status === 'pending');

export const isFriend = (g: Graph, a: string, b: string) => isFollowing(g, a, b) && isFollowing(g, b, a);

export const isMinor = (u: User | undefined) => !!u && u.age < 18;

/** Either person blocked the other: they disappear for each other everywhere. */
export function isBlocked(g: Graph, a: string, b: string): boolean {
  return !!g.blocks?.some((x) => (x.from === a && x.to === b) || (x.from === b && x.to === a));
}

export function canView(g: Graph, viewerId: string, m: Moment): boolean {
  if (m.authorId === viewerId) return true;
  if (isBlocked(g, viewerId, m.authorId)) return false;
  const author = g.users[m.authorId];
  if (!author) return false;
  if (author.isPrivate && !isFollowing(g, viewerId, author.id)) return false;
  switch (m.audience) {
    case 'everyone':
      return true;
    case 'followers':
      return isFollowing(g, viewerId, author.id);
    case 'friends':
      return isFriend(g, viewerId, author.id);
  }
}

/** Discover and the "everyone" widget source draw from this pool. */
export function inPublicPool(g: Graph, m: Moment): boolean {
  const author = g.users[m.authorId];
  return !!author && m.audience === 'everyone' && !author.isPrivate && !isMinor(author);
}

export function feedFor(g: Graph, viewerId: string, moments: Moment[]): Moment[] {
  return moments
    .filter((m) => (m.authorId === viewerId || isFollowing(g, viewerId, m.authorId)) && canView(g, viewerId, m))
    .sort(newestFirst);
}

export function discoverFor(g: Graph, viewerId: string, moments: Moment[]): Moment[] {
  return moments.filter((m) => m.authorId !== viewerId && inPublicPool(g, m)).sort(newestFirst);
}

export function widgetMomentsFor(g: Graph, viewerId: string, moments: Moment[], source: WidgetSource): Moment[] {
  const viewer = g.users[viewerId];
  if (source === 'everyone' && isMinor(viewer)) return [];
  return moments
    .filter((m) => m.authorId !== viewerId && canView(g, viewerId, m))
    .filter((m) => {
      switch (source) {
        case 'friends':
          return isFriend(g, viewerId, m.authorId);
        case 'following':
          return isFollowing(g, viewerId, m.authorId);
        case 'followers':
          return isFollowing(g, m.authorId, viewerId);
        case 'everyone':
          return inPublicPool(g, m) || isFollowing(g, viewerId, m.authorId);
      }
    })
    .sort(newestFirst);
}

/** 16–17 lock, both directions: no DMs between a minor and an adult who isn't their friend. */
export function minorLockBlocks(g: Graph, a: string, b: string): boolean {
  return isMinor(g.users[a]) !== isMinor(g.users[b]) && !isFriend(g, a, b);
}

export function canMessage(g: Graph, fromId: string, toId: string): boolean {
  const from = g.users[fromId];
  const to = g.users[toId];
  if (!from || !to || fromId === toId) return false;
  if (isBlocked(g, fromId, toId)) return false;
  const friends = isFriend(g, fromId, toId);
  if (minorLockBlocks(g, fromId, toId)) return false;
  const rule: DmPermission = to.dmPermission;
  switch (rule) {
    case 'everyone':
      return true;
    case 'followers':
      return isFollowing(g, fromId, toId);
    case 'friends':
      return friends;
    case 'nobody':
      return false;
  }
}

/** The moment a chat message replied to, only while the viewer may still see it. */
export function replyPreview(g: Graph, viewerId: string, moments: Moment[], momentId?: string): Moment | undefined {
  if (!momentId) return undefined;
  const m = moments.find((x) => x.id === momentId);
  return m && canView(g, viewerId, m) ? m : undefined;
}

/** Full years between a birth date and `now`; NaN for impossible dates (e.g. 30 Feb). */
export function ageOn(birth: BirthDate, now: Date): number {
  const d = new Date(birth.year, birth.month - 1, birth.day);
  if (d.getFullYear() !== birth.year || d.getMonth() !== birth.month - 1 || d.getDate() !== birth.day) return NaN;
  let age = now.getFullYear() - birth.year;
  const beforeBirthday = now.getMonth() < birth.month - 1 || (now.getMonth() === birth.month - 1 && now.getDate() < birth.day);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Story ring row: one group per followed author with visible moments, newest author first. */
export function storyGroups(g: Graph, viewerId: string, moments: Moment[]): StoryGroup[] {
  const groups = new Map<string, Moment[]>();
  for (const m of feedFor(g, viewerId, moments)) {
    if (m.authorId === viewerId) continue;
    groups.set(m.authorId, [...(groups.get(m.authorId) ?? []), m]);
  }
  return [...groups.entries()].map(([userId, ms]) => ({ userId, moments: ms, unseen: true }));
}

/** People who asked to follow me and wait for my answer. */
export function incomingRequests(g: Graph, meId: string): string[] {
  return g.follows.filter((f) => f.to === meId && f.status === 'pending').map((f) => f.from);
}

/** Notifications: others' reactions and comments on my moments, new followers and requests, newest first. */
export function activityFor(g: Graph, meId: string, moments: Moment[]): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const m of moments) {
    if (m.authorId !== meId) continue;
    for (const [fromId, reaction] of Object.entries(m.reactions)) {
      if (fromId !== meId) items.push({ id: `r:${m.id}:${fromId}`, kind: 'reaction', fromId, momentId: m.id, reaction, createdAt: m.createdAt + 1 });
    }
    for (const c of m.comments) {
      if (c.authorId !== meId) items.push({ id: `c:${c.id}`, kind: 'comment', fromId: c.authorId, momentId: m.id, body: c.body, createdAt: c.createdAt });
    }
  }
  // Follows carry no time yet; show them under the dated items, requests on top.
  for (const f of g.follows) {
    if (f.to !== meId) continue;
    if (f.status === 'pending') items.push({ id: `q:${f.from}`, kind: 'request', fromId: f.from, createdAt: Number.MAX_SAFE_INTEGER });
    else items.push({ id: `f:${f.from}`, kind: 'follow', fromId: f.from, createdAt: 0 });
  }
  return items.filter((i) => !isBlocked(g, meId, i.fromId)).sort((a, b) => b.createdAt - a.createdAt);
}

/** Lowercase, strip accents (Nguyễn → nguyen, Ayşe → ayse, đ → d, ı → i). */
export function fold(s: string): string {
  return s
    .toLocaleLowerCase('en')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/ı/g, 'i');
}

export function searchUsers(g: Graph, meId: string, query: string): string[] {
  const q = fold(query.trim());
  if (!q) return [];
  return Object.values(g.users)
    .filter((u) => u.id !== meId && !isBlocked(g, meId, u.id) && (fold(u.name).includes(q) || fold(u.username).includes(q)))
    .map((u) => u.id);
}

/** Map pins: visible moments grouped by place, newest moment first in each group. */
export function mapPlaces(g: Graph, viewerId: string, moments: Moment[]): MapPlace[] {
  const byName = new Map<string, MapPlace>();
  for (const m of moments) {
    if (!m.place || !canView(g, viewerId, m)) continue;
    const p = byName.get(m.place.name) ?? { ...m.place, moments: [] };
    p.moments.push(m);
    byName.set(m.place.name, p);
  }
  return [...byName.values()].map((p) => ({ ...p, moments: p.moments.sort((a, b) => b.createdAt - a.createdAt) }));
}

/** Conversations with at least one message from the other person that I have not read yet. */
export function unreadThreads(conversations: Record<string, Message[]>, meId: string): number {
  return Object.values(conversations).filter((msgs) => msgs.some((m) => m.fromId !== meId && !m.read)).length;
}

/** One person's moments that the viewer may see, newest first (profile grid, post feed). */
export function userMoments(g: Graph, viewerId: string, moments: Moment[], authorId: string): Moment[] {
  return moments.filter((m) => m.authorId === authorId && canView(g, viewerId, m)).sort((a, b) => b.createdAt - a.createdAt);
}
