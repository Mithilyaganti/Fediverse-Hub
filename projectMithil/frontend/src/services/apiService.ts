import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface Post {
  _id: string;
  authorId: string;
  content: string;
  platform: 'twitter' | 'mastodon' | 'reddit' | 'local';
  platformPostId?: string;
  createdAt: string;
  likes: number;
  reposts: number;
}

export interface Thread {
  _id: string;
  authorId: string;
  title: string;
  content: string;
  replies: Reply[];
  createdAt: string;
}

export interface Reply {
  _id: string;
  threadId: string;
  authorId: string;
  content: string;
  parentReplyId?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'like' | 'repost' | 'mention' | 'message' | 'reply';
  content: string;
  relatedPostId?: string;
  createdAt: string;
  read: boolean;
}

// API Functions
export const apiService = {
  // Timeline
  getTimeline: async (): Promise<{ timeline: Post[] }> => {
    const response = await api.get('/timeline');
    return response.data;
  },

  // Posts
  createPost: async (content: string, networks: string[]): Promise<any> => {
    const response = await api.post('/post', {
      content,
      networks,
      userToken: 'mock_token'
    });
    return response.data;
  },

  // Messages
  getMessages: async (userId: string): Promise<{ messages: Message[] }> => {
    const response = await api.get(`/message?userId=${userId}`);
    return response.data;
  },

  sendMessage: async (fromUser: string, toUser: string, content: string): Promise<any> => {
    const response = await api.post('/message', {
      fromUser,
      toUser,
      content
    });
    return response.data;
  },

  // Threads
  getThreads: async (): Promise<{ threads: Thread[] }> => {
    const response = await api.get('/thread');
    return response.data;
  },

  createThread: async (author: string, title: string, content: string): Promise<{ thread: Thread }> => {
    const response = await api.post('/thread', {
      author,
      title,
      content
    });
    return response.data;
  },

  replyToThread: async (threadId: string, author: string, content: string): Promise<any> => {
    const response = await api.post(`/thread/${threadId}/reply`, {
      author,
      content
    });
    return response.data;
  },

  // Notifications
  getNotifications: async (): Promise<{ notifications: Notification[] }> => {
    const response = await api.get('/notification');
    return response.data;
  },

  // Search
  search: async (query: string, type: string = 'all'): Promise<any> => {
    const response = await api.get(`/search?query=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },

  // Auth
  login: async (provider: string, code: string): Promise<any> => {
    const response = await api.post('/auth/login', {
      provider,
      code
    });
    return response.data;
  },

  linkAccount: async (provider: string, code: string, userId: string): Promise<any> => {
    const response = await api.post('/auth/link', {
      provider,
      code,
      userId
    });
    return response.data;
  },
};

export default apiService;
