import mongoose, { Schema, Document } from 'mongoose';

// Database models and interfaces
export interface User extends Document {
  username: string;
  email: string;
  connectedAccounts: {
    twitter?: { token: string; username: string };
    mastodon?: { token: string; instance: string; username: string };
    reddit?: { token: string; username: string };
  };
  createdAt: Date;
}

export interface Post extends Document {
  authorId: string;
  content: string;
  platform: 'twitter' | 'mastodon' | 'reddit' | 'local';
  platformPostId?: string;
  createdAt: Date;
  likes: number;
  reposts: number;
}

export interface Thread extends Document {
  authorId: string;
  title: string;
  content: string;
  replies: Reply[];
  createdAt: Date;
}

export interface Reply extends Document {
  threadId: string;
  authorId: string;
  content: string;
  parentReplyId?: string;
  createdAt: Date;
}

export interface Message extends Document {
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

export interface Notification extends Document {
  userId: string;
  type: 'like' | 'repost' | 'mention' | 'message' | 'reply';
  content: string;
  relatedPostId?: string;
  createdAt: Date;
  read: boolean;
}

// MongoDB Schemas
const UserSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  connectedAccounts: {
    twitter: {
      token: String,
      username: String
    },
    mastodon: {
      token: String,
      instance: String,
      username: String
    },
    reddit: {
      token: String,
      username: String
    }
  },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new Schema<Post>({
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  platform: { type: String, enum: ['twitter', 'mastodon', 'reddit', 'local'], required: true },
  platformPostId: String,
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  reposts: { type: Number, default: 0 }
});

const ReplySchema = new Schema<Reply>({
  threadId: { type: String, required: true },
  authorId: { type: String, required: true },
  content: { type: String, required: true },
  parentReplyId: String,
  createdAt: { type: Date, default: Date.now }
});

const ThreadSchema = new Schema<Thread>({
  authorId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  replies: [ReplySchema],
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new Schema<Message>({
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

const NotificationSchema = new Schema<Notification>({
  userId: { type: String, required: true },
  type: { type: String, enum: ['like', 'repost', 'mention', 'message', 'reply'], required: true },
  content: { type: String, required: true },
  relatedPostId: String,
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

// Export Models
export const UserModel = mongoose.model<User>('User', UserSchema);
export const PostModel = mongoose.model<Post>('Post', PostSchema);
export const ThreadModel = mongoose.model<Thread>('Thread', ThreadSchema);
export const ReplyModel = mongoose.model<Reply>('Reply', ReplySchema);
export const MessageModel = mongoose.model<Message>('Message', MessageSchema);
export const NotificationModel = mongoose.model<Notification>('Notification', NotificationSchema);
