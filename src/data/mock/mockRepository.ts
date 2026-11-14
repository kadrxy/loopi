// In-memory Repository used until the Supabase backend exists. Async on purpose, so screens
// already handle loading the way they will with a real network.
import { canMessage, minorLockBlocks } from '@/domain/rules';
import type { Block, Follow, Message, MessageStatus, Moment, User } from '@/domain/types';

import type { MessageListener, NewMoment, Repository, StatusListener } from '../repository';

export type Seed = {
  meId: string;
  users: User[];
  follows: Follow[];
  moments: Moment[];
  conversations: Record<string, Message[]>;
  /** Images used by devSimulateFriendMoment. */
  simImages?: Moment['image'][];
  /** Friend ids that may "post" in the simulator. */
  simAuthors?: string[];
  fakeReplies?: string[];
};

type Options = { onIncoming?: MessageListener; deliverDelayMs?: number; readDelayMs?: number; replyDelayMs?: number };

let seq = 1;
const id = (p: string) => `${p}_${Date.now().toString(36)}_${seq++}`;

export function createMockRepository(seed: Seed, opts: Options = {}): Repository {
  const meId = seed.meId;
  const users = new Map(seed.users.map((u) => [u.id, { ...u }]));
  let follows: Follow[] = seed.follows.map((f) => ({ ...f }));
  let blocks: Block[] = [];
  // Copy shallowly: images may be numbers from require() and must stay as they are.
  let moments: Moment[] = seed.moments.map((m) => ({ ...m, reactions: { ...m.reactions }, comments: [...m.comments] }));
  const conversations: Record<string, Message[]> = Object.fromEntries(
    Object.entries(seed.conversations).map(([k, v]) => [k, v.map((msg) => ({ ...msg }))]),
  );
  const listeners = new Set<MessageListener>();
  const statusListeners = new Set<StatusListener>();
  if (opts.onIncoming) listeners.add(opts.onIncoming);
  const replies = seed.fakeReplies ?? ['😄'];

  const graph = () => ({ users: Object.fromEntries(users), follows: [...follows], blocks: [...blocks] });
  const findMoment = (momentId: string) => {
    const m = moments.find((x) => x.id === momentId);
    if (!m) throw new Error(`moment ${momentId} not found`);
    return m;
  };
  const replaceMoment = (next: Moment) => {
    moments = moments.map((m) => (m.id === next.id ? next : m));
    return next;
  };

  return {
    meId,
    async getGraph() {
      return graph();
    },
    async updateMe(patch) {
      const next = { ...users.get(meId)!, ...patch };
      users.set(meId, next);
      return next;
    },
    async listMoments() {
      return [...moments];
    },
    async createMoment(input: NewMoment) {
      const m: Moment = { id: id('m'), authorId: meId, ...input, createdAt: Date.now(), reactions: {}, comments: [] };
      moments = [m, ...moments];
      return m;
    },
    async react(momentId, reaction) {
      const m = findMoment(momentId);
      const reactions = { ...m.reactions };
      if (reactions[meId] === reaction) delete reactions[meId];
      else reactions[meId] = reaction;
      return replaceMoment({ ...m, reactions });
    },
    async comment(momentId, body) {
      const m = findMoment(momentId);
      return replaceMoment({
        ...m,
        comments: [...m.comments, { id: id('c'), authorId: meId, body, createdAt: Date.now() }],
      });
    },
    async toggleCommentLike(momentId, commentId) {
      const m = findMoment(momentId);
      const comments = m.comments.map((c) => {
        if (c.id !== commentId) return c;
        const liked = c.likedBy ?? [];
        return { ...c, likedBy: liked.includes(meId) ? liked.filter((u) => u !== meId) : [...liked, meId] };
      });
      return replaceMoment({ ...m, comments });
    },
    async toggleFollow(userId) {
      const existing = follows.find((f) => f.from === meId && f.to === userId);
      if (existing) follows = follows.filter((f) => f !== existing);
      else follows = [...follows, { from: meId, to: userId, status: users.get(userId)?.isPrivate ? 'pending' : 'active' }];
      return [...follows];
    },
    async toggleBlock(userId) {
      const existing = blocks.find((b) => b.from === meId && b.to === userId);
      if (existing) blocks = blocks.filter((b) => b !== existing);
      else {
        blocks = [...blocks, { from: meId, to: userId }];
        follows = follows.filter((f) => !((f.from === meId && f.to === userId) || (f.from === userId && f.to === meId)));
      }
      return graph();
    },
    async deleteAccount() {
      moments = moments.filter((m) => m.authorId !== meId);
      follows = follows.filter((f) => f.from !== meId && f.to !== meId);
      blocks = blocks.filter((b) => b.from !== meId);
      for (const k of Object.keys(conversations)) delete conversations[k];
    },
    async respondFollow(fromId, accept) {
      const req = follows.find((f) => f.from === fromId && f.to === meId && f.status === 'pending');
      if (req) follows = accept ? follows.map((f) => (f === req ? { ...f, status: 'active' as const } : f)) : follows.filter((f) => f !== req);
      return [...follows];
    },
    async listConversations() {
      return Object.fromEntries(Object.entries(conversations).map(([k, v]) => [k, [...v]]));
    },
    async sendMessage(toId, body, replyToMomentId, image) {
      // The backend enforces the DM rules too, not only the UI.
      if (!canMessage(graph(), meId, toId)) throw new Error('messaging not allowed');
      const msg: Message = { id: id('msg'), fromId: meId, body, createdAt: Date.now(), replyToMomentId, image, status: 'sent' };
      conversations[toId] = [...(conversations[toId] ?? []), msg];
      const receipt = (status: MessageStatus) => {
        conversations[toId] = (conversations[toId] ?? []).map((m) => (m.id === msg.id ? { ...m, status } : m));
        statusListeners.forEach((l) => l(toId, msg.id, status));
      };
      setTimeout(() => receipt('delivered'), opts.deliverDelayMs ?? 600);
      setTimeout(() => receipt('read'), opts.readDelayMs ?? 1400);
      setTimeout(() => {
        // Replying inside a thread I started is allowed, except across the 16–17 lock.
        if (minorLockBlocks(graph(), toId, meId)) return;
        const reply: Message = {
          id: id('msg'),
          fromId: toId,
          body: replies[Math.floor(Math.random() * replies.length)],
          createdAt: Date.now(),
          read: false,
        };
        conversations[toId] = [...(conversations[toId] ?? []), reply];
        listeners.forEach((l) => l(toId, reply));
      }, opts.replyDelayMs ?? 2600);
      return msg;
    },
    onStatus(listener) {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
    async markRead(withId) {
      conversations[withId] = (conversations[withId] ?? []).map((m) => (m.fromId !== meId && !m.read ? { ...m, read: true } : m));
      return [...conversations[withId]];
    },
    onMessage(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async devSimulateFriendMoment() {
      const authors = seed.simAuthors ?? [];
      const images = seed.simImages ?? [];
      if (!authors.length || !images.length) throw new Error('simulator not configured');
      const m: Moment = {
        id: id('m'),
        authorId: authors[Math.floor(Math.random() * authors.length)],
        image: images[Math.floor(Math.random() * images.length)],
        caption: '',
        audience: 'friends',
        createdAt: Date.now(),
        reactions: {},
        comments: [],
      };
      moments = [m, ...moments];
      return m;
    },
  };
}
