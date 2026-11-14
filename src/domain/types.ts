/** Quick reactions, stored by kind and drawn as icons (never emoji). */
export type Reaction = 'heart' | 'fire' | 'laugh' | 'wow' | 'sad' | 'bravo';

/** A bundled asset (number from require) or a file/remote URI (e.g. a camera shot). */
export type ImageRef = number | string;

/** Where a moment was taken; drives the map. */
export type Place = { name: string; lat: number; lng: number };

export type Audience = 'everyone' | 'followers' | 'friends';
export type WidgetSource = 'friends' | 'following' | 'followers' | 'everyone';
export type DmPermission = 'everyone' | 'followers' | 'friends' | 'nobody';

export type User = {
  id: string;
  username: string;
  name: string;
  bio: string;
  isPrivate: boolean;
  age: number;
  dmPermission: DmPermission;
  cover?: ImageRef;
  avatar?: ImageRef;
};

export type Comment = { id: string; authorId: string; body: string; createdAt: number; likedBy?: string[] };

export type Moment = {
  id: string;
  authorId: string;
  image: ImageRef;
  caption: string;
  audience: Audience;
  createdAt: number;
  place?: Place;
  /** userId -> reaction kind */
  reactions: Record<string, Reaction>;
  comments: Comment[];
};

export type Follow = { from: string; to: string; status: 'active' | 'pending' };

export type Message = {
  id: string;
  fromId: string;
  body: string;
  createdAt: number;
  replyToMomentId?: string;
  image?: ImageRef;
  /** My messages: sent (one tick) → delivered (two ticks) → read (two blue ticks). */
  status?: MessageStatus;
  /** Their messages: true once I opened the chat. */
  read?: boolean;
};

export type MessageStatus = 'sent' | 'delivered' | 'read';

/** `from` blocked `to`; the block works both ways. */
export type Block = { from: string; to: string };

export type Graph = { users: Record<string, User>; follows: Follow[]; blocks?: Block[] };

export type ActivityItem = {
  id: string;
  kind: 'reaction' | 'comment' | 'follow' | 'request';
  fromId: string;
  createdAt: number;
  momentId?: string;
  reaction?: Reaction;
  body?: string;
};

export type MapPlace = Place & { moments: Moment[] };

export type StoryGroup = { userId: string; moments: Moment[]; unseen: boolean };

/** Calendar birth date; month is 1-12. */
export type BirthDate = { year: number; month: number; day: number };
