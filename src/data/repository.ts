// The only door screens use to reach data. Today: in-memory mock. Later: Supabase.
import type { Audience, Follow, Graph, ImageRef, Message, MessageStatus, Moment, Place, Reaction, User } from '@/domain/types';

export type NewMoment = { image: ImageRef; caption: string; audience: Audience; place?: Place };
export type ProfilePatch = Partial<Pick<User, 'name' | 'username' | 'bio' | 'avatar' | 'cover' | 'age' | 'isPrivate' | 'dmPermission'>>;
export type MessageListener = (withId: string, message: Message) => void;
export type StatusListener = (withId: string, messageId: string, status: MessageStatus) => void;

export interface Repository {
  readonly meId: string;
  getGraph(): Promise<Graph>;
  updateMe(patch: ProfilePatch): Promise<User>;
  listMoments(): Promise<Moment[]>;
  createMoment(input: NewMoment): Promise<Moment>;
  react(momentId: string, reaction: Reaction): Promise<Moment>;
  comment(momentId: string, body: string): Promise<Moment>;
  toggleCommentLike(momentId: string, commentId: string): Promise<Moment>;
  toggleFollow(userId: string): Promise<Follow[]>;
  /** Answer someone's request to follow me. */
  respondFollow(fromId: string, accept: boolean): Promise<Follow[]>;
  /** Block or unblock someone; blocking also ends follows in both directions. */
  toggleBlock(userId: string): Promise<Graph>;
  /** Permanently remove my account and everything I posted. */
  deleteAccount(): Promise<void>;
  listConversations(): Promise<Record<string, Message[]>>;
  sendMessage(toId: string, body: string, replyToMomentId?: string, image?: ImageRef): Promise<Message>;
  /** Realtime-style subscription for incoming messages. Returns an unsubscribe function. */
  onMessage(listener: MessageListener): () => void;
  /** Receipts for my messages (delivered, read). Returns an unsubscribe function. */
  onStatus(listener: StatusListener): () => void;
  /** I opened the chat: their messages become read. */
  markRead(withId: string): Promise<Message[]>;
  /** Development aid for the widget preview; absent in production backends. */
  devSimulateFriendMoment?(): Promise<Moment>;
}
