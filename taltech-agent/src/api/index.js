import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const courseApi = {
  getCourses: () => api.get('/courses'),
  getCourseTopics: (courseId) => api.get(`/courses/${courseId}/topics`),
  ingest: (formData) => api.post('/ingest', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const topicApi = {
  getAllTopics: () => api.get(`/concepts`),
  getTopicDetails: (topicId) => api.get(`/topics/${topicId}`),
  getTopicMaterials: (topicId) => api.get(`/topics/${topicId}/materials`),
};

export const quizApi = {
  generateQuiz: (topicId, options = {}) =>
    api.post('/quiz/generate', {
      topic_id: topicId,
      type: options.type || 'test',
      difficulty: options.difficulty || 'hard'
    }),
  submitAnswers: (quizId, answers) => api.post(`/quiz/${quizId}/submit`, { answers }),
  getLatestResults: () => api.get('/quiz/results/latest'),
};

export const chatApi = {
  sendMessage: (payload) => api.post('/chat', payload),
};

export default api;
