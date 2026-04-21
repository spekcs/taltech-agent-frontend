import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

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
  getAllTopics: (course) => api.get(`/concepts`, { params: { course } }),
  getTopicDetails: (topicId) => api.get(`/topics/${topicId}`),
  getTopicMaterials: (topicId) => api.get(`/topics/${topicId}/materials`),
};

export const quizApi = {
  generateQuiz: (options = {}) =>
    api.post('/quiz/generate', {
      concept: options.concept, // Single topic
      concepts: options.concepts, // Array of topics
      course: options.course,
      n_questions: options.n_questions || 5
    }),
  evaluate: (payload) =>
    api.post('/quiz/evaluate', {
      question: payload.question,
      student_answer: payload.student_answer,
      source_text: payload.source_text
    }),
  submitResult: (result) => 
    api.post('/quiz/result', {
      concept: result.concept,
      course: result.course,
      score: result.score,
      total: result.total,
      quality: result.quality // 0-5
    }),
  getNextTopic: (course) => api.get('/quiz/next', { params: { course } }),
};
export const chatApi = {
  sendMessage: (payload) => api.post('/chat', payload),
};

export default api;
