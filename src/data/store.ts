// App state. Screens read and act through this store; the store talks only to the Repository.
import { createStore, type StoreApi } from 'zustand/vanilla';

import { ageOn, isMinor } from '@/domain/rules';
import type { Audience, BirthDate, DmPermission, Graph, ImageRef, Message, Moment, Reaction, WidgetSource } from '@/domain/types';

import type { NewMoment, ProfilePatch, Repository } from './repository';

export type Lang = 'tr' | 'en';

export type Settings = {
  launch: 'camera' | 'home';
  homeTab: 'feed' | 'discover';
  isPrivate: boolean;
  defaultAudience: Audience;
  widgetTap: 'post' | 'chat' | 'ask';
  dmPermission: DmPermission;
  lang: Lang;
  widgets: { small: WidgetSource; medium: WidgetSource };
  newMomentAlerts: boolean;
  /** Middle tab-bar button; the other one opens by swiping right on Home. */
  centerTab: 'map' | 'camera';
  /** Off by default: effects play even when the phone asks to reduce motion. */
  reduceMotion: boolean;
};

export const defaultSettings: Settings = {
  launch: 'home',
  homeTab: 'feed',
  isPrivate: false,
  defaultAudience: 'friends',
  widgetTap: 'post',
  dmPermission: 'followers',
  lang: 'tr',
  widgets: { small: 'friends', medium: 'everyone' },
  newMomentAlerts: true,
  centerTab: 'map',
  reduceMotion: false,
};

export type AppState = {
  meId: string;
  loaded: boolean;
  onboarded: boolean;
  graph: Graph;
  moments: Moment[];
  conversations: Record<string, Message[]>;
  /** userId -> true while their (fake) reply is pending */
  typing: Record<string, boolean>;
  /** userId -> true once their story was watched this session */
  seen: Record<string, boolean>;
  /** `seen` as of the last refresh: rings are ordered by this, so they never jump under the finger. */
  seenAtRefresh: Record<string, boolean>;
  settings: Settings;
  load: () => Promise<void>;
  finishOnboarding: (name: string, birth: BirthDate) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  updateProfile: (patch: Pick<ProfilePatch, 'name' | 'username' | 'bio' | 'avatar' | 'cover'>) => Promise<void>;
  respondFollow: (fromId: string, accept: boolean) => Promise<void>;
  toggleBlock: (userId: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  createMoment: (input: NewMoment) => Promise<Moment>;
  react: (momentId: string, reaction: Reaction) => Promise<void>;
  comment: (momentId: string, body: string) => Promise<void>;
  likeComment: (momentId: string, commentId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  sendMessage: (toId: string, body: string, replyToMomentId?: string, image?: ImageRef) => Promise<void>;
  simulateFriendMoment: () => Promise<void>;
  markSeen: (userId: string) => void;
  markRead: (withId: string) => Promise<void>;
  resetOnboarding: () => void;
  signInExisting: () => void;
  refresh: () => Promise<void>;
};

/** The subset of AsyncStorage the store needs; injected so tests can use memory. */
export type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const SESSION_KEY = 'loopi.session';

/** What survives an app restart until the real backend owns it. */
type SavedProfile = Pick<ProfilePatch, 'name' | 'age' | 'username' | 'bio' | 'avatar' | 'cover'>;
type SavedSession = { v: 1; onboarded: boolean; settings: Settings; me?: SavedProfile };

function parseSession(raw: string | null): SavedSession | undefined {
  if (!raw) return undefined;
  try {
    const s = JSON.parse(raw) as Partial<SavedSession>;
    return s && s.v === 1 && typeof s.onboarded === 'boolean' && s.settings ? (s as SavedSession) : undefined;
  } catch {
    return undefined;
  }
}

type Deps = { now?: () => Date; initialSettings?: Partial<Settings>; storage?: KeyValueStorage };

export function createAppStore(repo: Repository, deps: Deps = {}): StoreApi<AppState> {
  const now = deps.now ?? (() => new Date());
  let unsubscribe: (() => void) | undefined;
  let unsubscribeStatus: (() => void) | undefined;

  return createStore<AppState>((set, get) => {
    const refreshGraph = async () => set({ graph: await repo.getGraph() });
    const swapMoment = (m: Moment) => set({ moments: get().moments.map((x) => (x.id === m.id ? m : x)) });
    const save = async () => {
      if (!deps.storage) return;
      const { onboarded, settings, graph, meId } = get();
      const me = graph.users[meId];
      const profile: SavedProfile | undefined = me && { name: me.name, age: me.age, username: me.username, bio: me.bio, avatar: me.avatar, cover: me.cover };
      const session: SavedSession = { v: 1, onboarded, settings, me: profile };
      try {
        await deps.storage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        // Losing a save only means the next launch starts from the defaults.
      }
    };
    const restore = async (): Promise<SavedSession | undefined> => {
      if (!deps.storage) return undefined;
      try {
        return parseSession(await deps.storage.getItem(SESSION_KEY));
      } catch {
        return undefined;
      }
    };

    return {
      meId: repo.meId,
      loaded: false,
      onboarded: false,
      graph: { users: {}, follows: [] },
      moments: [],
      conversations: {},
      typing: {},
      seen: {},
      seenAtRefresh: {},
      settings: { ...defaultSettings, ...deps.initialSettings },

      async load() {
        const saved = await restore();
        if (saved) {
          const settings = { ...defaultSettings, ...saved.settings };
          await repo.updateMe({ ...saved.me, isPrivate: settings.isPrivate, dmPermission: settings.dmPermission });
          set({ settings, onboarded: saved.onboarded });
        }
        const [graph, moments, conversations] = await Promise.all([
          repo.getGraph(),
          repo.listMoments(),
          repo.listConversations(),
        ]);
        if (!saved) {
          // Settings start as a cache of the profile, so the toggles show what others actually see.
          const me = graph.users[repo.meId];
          if (me) set({ settings: { ...get().settings, isPrivate: me.isPrivate, dmPermission: me.dmPermission } });
        }
        unsubscribeStatus?.();
        unsubscribeStatus = repo.onStatus((withId, messageId, status) => {
          const c = get().conversations;
          set({ conversations: { ...c, [withId]: (c[withId] ?? []).map((m) => (m.id === messageId ? { ...m, status } : m)) } });
        });
        unsubscribe?.();
        unsubscribe = repo.onMessage((withId, msg) => {
          const c = get().conversations;
          set({
            conversations: { ...c, [withId]: [...(c[withId] ?? []), msg] },
            typing: { ...get().typing, [withId]: false },
          });
        });
        set({ graph, moments, conversations, loaded: true });
      },

      async finishOnboarding(name, birth) {
        const age = ageOn(birth, now());
        const me = await repo.updateMe({ name, age });
        if (isMinor(me)) {
          await get().updateSettings({
            isPrivate: true,
            dmPermission: 'friends',
            defaultAudience: 'friends',
            widgets: { small: 'friends', medium: 'following' },
          });
        }
        await refreshGraph();
        set({ onboarded: true });
        await save();
      },

      async updateSettings(patch) {
        const next = { ...get().settings, ...patch };
        if (next.isPrivate && next.defaultAudience === 'everyone') next.defaultAudience = 'followers';
        set({ settings: next });
        if ('isPrivate' in patch || 'dmPermission' in patch) {
          await repo.updateMe({ isPrivate: next.isPrivate, dmPermission: next.dmPermission });
          await refreshGraph();
        }
        await save();
      },

      async updateProfile(patch) {
        await repo.updateMe(patch);
        await refreshGraph();
        await save();
      },

      async toggleBlock(userId) {
        set({ graph: await repo.toggleBlock(userId) });
      },

      async deleteAccount() {
        await repo.deleteAccount();
        const [graph, moments, conversations] = await Promise.all([repo.getGraph(), repo.listMoments(), repo.listConversations()]);
        set({ graph, moments, conversations, onboarded: false, settings: { ...defaultSettings }, seen: {}, seenAtRefresh: {} });
        await save();
      },

      async respondFollow(fromId, accept) {
        const follows = await repo.respondFollow(fromId, accept);
        set({ graph: { ...get().graph, follows } });
      },

      async createMoment(input) {
        // Spec §6.3: "everyone" exists only for public profiles, whatever a stale picker says.
        const audience = get().settings.isPrivate && input.audience === 'everyone' ? 'followers' : input.audience;
        const m = await repo.createMoment({ ...input, audience });
        set({ moments: [m, ...get().moments] });
        return m;
      },

      async react(momentId, reaction) {
        swapMoment(await repo.react(momentId, reaction));
      },

      async comment(momentId, body) {
        swapMoment(await repo.comment(momentId, body));
      },

      async likeComment(momentId, commentId) {
        swapMoment(await repo.toggleCommentLike(momentId, commentId));
      },

      async toggleFollow(userId) {
        const follows = await repo.toggleFollow(userId);
        set({ graph: { ...get().graph, follows } });
      },

      async sendMessage(toId, body, replyToMomentId, image) {
        const msg = await repo.sendMessage(toId, body, replyToMomentId, image);
        const c = get().conversations;
        set({
          conversations: { ...c, [toId]: [...(c[toId] ?? []), msg] },
          typing: { ...get().typing, [toId]: true },
        });
      },

      async simulateFriendMoment() {
        if (!repo.devSimulateFriendMoment) return;
        const m = await repo.devSimulateFriendMoment();
        set({ moments: [m, ...get().moments] });
      },

      async markRead(withId) {
        const msgs = get().conversations[withId];
        if (!msgs?.some((m) => m.fromId !== get().meId && !m.read)) return;
        const next = await repo.markRead(withId);
        set({ conversations: { ...get().conversations, [withId]: next } });
      },

      markSeen(userId) {
        if (!get().seen[userId]) set({ seen: { ...get().seen, [userId]: true } });
      },

      resetOnboarding() {
        set({ onboarded: false });
        void save();
      },

      async refresh() {
        const [graph, moments, conversations] = await Promise.all([repo.getGraph(), repo.listMoments(), repo.listConversations()]);
        // Keep the spinner visible briefly so a pull-to-refresh reads as an action.
        await new Promise((r) => setTimeout(r, 600));
        set({ graph, moments, conversations, seenAtRefresh: { ...get().seen } });
      },

      signInExisting() {
        // Mock login for a returning user; the real check happens on the backend later.
        set({ onboarded: true });
        void save();
      },
    };
  });
}
