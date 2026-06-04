import axios from 'axios';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api';

const api = axios.create({ baseURL: BASE, timeout: 90000 });

/* Upload */
export const uploadFile = (fd: FormData) =>
  api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

export const uploadText = (text: string, title?: string) =>
  api.post('/upload/text', { text, title });

/* Lesson */
export const generateLesson  = (content: string, topic?: string, filename?: string) =>
  api.post('/lesson/generate', { content, topic, filename });

export const getSession      = (sessionId: string) => api.get(`/lesson/session/${sessionId}`);
export const reExplain       = (sessionId: string) => api.post('/lesson/reexplain', { sessionId });

/* Chat */
export const sendMessage    = (sessionId: string, message: string) =>
  api.post('/chat/message', { sessionId, message });

export const getChatHistory = (sessionId: string) => api.get(`/chat/history/${sessionId}`);

/* Quiz */
export const generateQuiz  = (sessionId: string, difficulty = 'medium') =>
  api.post('/quiz/generate', { sessionId, difficulty });

export const submitQuiz    = (sessionId: string, answers: Record<number, string>) =>
  api.post('/quiz/submit', { sessionId, answers });

/* Sessions */
export const listSessions   = () => api.get('/session/list');
export const deleteSession  = (id: string) => api.delete(`/session/${id}`);
