import { defineStore } from 'pinia'
import { ref } from 'vue'
import { topicApi } from '@/api'
import { courseApi } from '@/api'

export const useCanvasStore = defineStore('canvas', () => {
  const topics = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const courses = ref([])

  const fetchTopics = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await topicApi.getAllTopics()
      topics.value = response.data.concepts || []
    } catch (err) {
      console.error('Failed to fetch topics:', err)
      error.value = err.message
      // Fallback for demo if API fails
      topics.value = [
        {
          id: 1,
          title: 'Introduction to Algorithms',
          content: 'Big-O notation...',
          color: '#6366f1',
        },
        { id: 2, title: 'Data Structures', content: 'Arrays, Lists...', color: '#10b981' },
        { id: 3, title: 'Graph Theory', content: 'DFS, BFS...', color: '#f59e0b' },
        { id: 4, title: 'Dynamic Programming', content: 'Classic DP...', color: '#f43f5e' },
      ]
    } finally {
      isLoading.value = false
    }
  }

  const fetchCourses = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await courseApi.getCourses()
      let coursesData = Array.isArray(response.data) ? response.data : (response.data.courses || [])
      
      // Enrich courses with topic counts
      const enrichedCourses = await Promise.all(coursesData.map(async (course) => {
        const courseName = typeof course === 'string' ? course : course.name;
        try {
          const topicsRes = await topicApi.getAllTopics(courseName);
          const topicCount = topicsRes.data.concepts ? topicsRes.data.concepts.length : 0;
          
          if (typeof course === 'string') {
            return { name: course, topicCount };
          } else {
            return { ...course, topicCount };
          }
        } catch (err) {
          console.error(`Failed to fetch topics for course ${courseName}:`, err);
          return typeof course === 'string' ? { name: course, topicCount: 0 } : { ...course, topicCount: 0 };
        }
      }));
      
      courses.value = enrichedCourses;
    } catch (err) {
      console.error('Failed to fetch courses:', err)
      error.value = err.message
      courses.value = [
        { id: 1, name: 'Computer Science 101', topicCount: 12 },
        { id: 2, name: 'Data Structures & Algorithms', topicCount: 8 },
        { id: 3, name: 'Web Development Fundamentals', topicCount: 15 },
      ]
    } finally {
      isLoading.value = false
    }
  }

  return { topics, isLoading, error, fetchTopics, fetchCourses, courses }
})
