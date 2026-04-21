import axios from 'axios';

const API_BASE_URL = process.env.BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const courseApi = {
  getCourses: () => api.get('/courses'),
  getCourseTopics: (courseId) => api.get(`/courses/${courseId}/topics`),
};

export const topicApi = {
  getTopicDetails: (topicId) => api.get(`/topics/${topicId}`),
  getTopicMaterials: (topicId) => api.get(`/topics/${topicId}/materials`),
};

export const quizApi = {
  generateQuiz: (topicId) => api.post('/quiz/generate', { topic_id: topicId }),
  submitAnswers: (quizId, answers) => api.post(`/quiz/${quizId}/submit`, { answers }),
  getLatestResults: () => api.get('/quiz/results/latest'),
};

export const chatApi = {
  sendMessage: (payload) => api.post('/chat', payload),
};

export default api;
