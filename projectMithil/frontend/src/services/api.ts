import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Timeline API
export const timelineAPI = {
  getTimeline: () => api.get('/timeline'),
};

// Auth API
export const authAPI = {
  login: (provider: string, code: string) => 
    api.post('/auth/login', { provider, code }),
  linkAccount: (provider: string, code: string, userId: string) =>
    api.post('/auth/link', { provider, code, userId }),
};

// Post API
export const postAPI = {
  createPost: (content: string, networks: string[], userToken: string) =>
    api.post('/post', { content, networks, userToken }),
};

// Message API
export const messageAPI = {
  sendMessage: (fromUser: string, toUser: string, content: string) =>
    api.post('/message', { fromUser, toUser, content }),
  getMessages: (userId: string) =>
    api.get(`/message?userId=${userId}`),
};

// Thread API
export const threadAPI = {
  createThread: (author: string, title: string, content: string) =>
    api.post('/thread', { author, title, content }),
  getThreads: () => api.get('/thread'),
  replyToThread: (threadId: string, author: string, content: string) =>
    api.post(`/thread/${threadId}/reply`, { author, content }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (userToken: string) =>
    api.get('/notification', { headers: { Authorization: userToken } }),
};

// Search API
export const searchAPI = {
  search: (query: string, type: string) =>
    api.get(`/search?query=${query}&type=${type}`),
};

export default api;
