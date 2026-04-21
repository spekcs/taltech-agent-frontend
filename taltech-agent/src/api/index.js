import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const courseApi = {
  getCourses: () => api.get('/courses'),
  getCourseTopics: (courseId) => api.get(`/courses/${encodeURIComponent(courseId)}/topics`),
}

export const topicApi = {
  getTopics: (course) =>
    api.get('/topics', {
      params: course ? { course } : undefined,
    }),
  getTopicDetails: (topicId) => api.get(`/topics/${topicId}`),
  getTopicMaterials: (topicId) => api.get(`/topics/${topicId}/materials`),
  searchTopicMaterials: (topicId, q, limit = 5) =>
    api.get(`/topics/${topicId}/search`, {
      params: { q, limit },
    }),
}

export const systemApi = {
  getStats: () => api.get('/stats'),
}

export const quizApi = {
  generateQuiz: (concept, options = {}) =>
    api.post('/quiz/generate', {
      concept,
      course: options.course || null,
      n_questions: options.nQuestions || 10,
    }),
  evaluateAnswer: (payload) => api.post('/quiz/evaluate', payload),
  evaluateAnswersBatch: (items) => api.post('/quiz/evaluate-batch', { items }),
  saveResult: (payload) => api.post('/quiz/result', payload),
  updateSm2: (payload) => api.post('/quiz/sm2', payload),
  getWeakConcepts: (course, limit = 5) =>
    api.get('/quiz/weak', {
      params: {
        course,
        limit,
      },
    }),
}

export const chatApi = {
  sendMessage: (payload) => api.post('/chat', payload),
}

export default api
