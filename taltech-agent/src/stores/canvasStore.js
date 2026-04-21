import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi, systemApi, topicApi } from '@/api'

export const useCanvasStore = defineStore('canvas', () => {
  const nodes = ref([])
  const courses = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const topicLoading = ref(false)
  const stats = ref({ courses: 0, sources: 0, chunks: 0 })
  const error = ref(null)

  const palette = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6']

  const normalizeTopics = (payload) => {
    if (Array.isArray(payload)) return payload
    return payload?.topics || []
  }

  const buildCourses = (coursePayload, topicItems) => {
    const courseNames = Array.isArray(coursePayload)
      ? coursePayload
      : (coursePayload?.courses || [])

    return courseNames.map((courseName) => {
      const matchingTopics = topicItems.filter((topic) => topic.courseId === courseName)
      return {
        id: courseName,
        name: courseName,
        count: matchingTopics.reduce((sum, topic) => sum + (topic.materialCount || 0), 0),
        topicCount: matchingTopics.length,
        concepts: matchingTopics.slice(0, 4).map((topic) => topic.title),
      }
    })
  }

  const mergeTopicIntoNodes = (topic, index = 0) => {
    const existing = nodes.value.find((node) => node.id === topic.id)
    const incomingMaterials = topic.materials || []
    const hasRichMaterials = incomingMaterials.some((item) => item?.summary || item?.page || item?.concepts?.length)
    const contentLooksGeneric = typeof topic.content === 'string' && (
      topic.content.includes('on kursuse') ||
      topic.content.includes('on valitud teema')
    )

    return {
      id: topic.id,
      title: topic.title || topic.name || existing?.title,
      content: (!topic.content || contentLooksGeneric) ? (existing?.content || topic.content || `${topic.name} on valitud teema.`) : topic.content,
      courseId: topic.courseId || existing?.courseId,
      summary: topic.summary || existing?.summary || '',
      whyItMatters: topic.whyItMatters || existing?.whyItMatters || '',
      subtopics: topic.subtopics?.length ? topic.subtopics : (existing?.subtopics || []),
      materials: hasRichMaterials ? incomingMaterials : (existing?.materials || incomingMaterials),
      matches: topic.matches?.length ? topic.matches : (existing?.matches || []),
      readingList: topic.readingList || existing?.readingList || [],
      recallPrompts: topic.recallPrompts || existing?.recallPrompts || [],
      relatedTopics: topic.relatedTopics || existing?.relatedTopics || [],
      modeGuides: topic.modeGuides || existing?.modeGuides || {},
      materialCount: topic.materialCount ?? existing?.materialCount ?? incomingMaterials.length ?? 0,
      color: existing?.color || palette[index % palette.length],
      width: existing?.width || 260,
    }
  }

  const loadData = async (force = false) => {
    if (loading.value || (loaded.value && !force)) return

    loading.value = true
    error.value = null

    try {
      const [{ data: courseItems }, { data: topicItems }, { data: statsData }] = await Promise.all([
        courseApi.getCourses(),
        topicApi.getTopics(),
        systemApi.getStats(),
      ])

      const normalizedTopics = normalizeTopics(topicItems)
      courses.value = buildCourses(courseItems, normalizedTopics)
      stats.value = statsData
      nodes.value = normalizedTopics.map((topic, index) => mergeTopicIntoNodes(topic, index))
      loaded.value = true
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  const getTopicsForCourse = async (courseId) => {
    const { data } = await courseApi.getCourseTopics(courseId)
    return normalizeTopics(data)
  }

  const hydrateTopic = async (topicId) => {
    if (!topicId) return null

    topicLoading.value = true
    error.value = null

    try {
      const [{ data: detail }, { data: materials }] = await Promise.all([
        topicApi.getTopicDetails(topicId),
        topicApi.getTopicMaterials(topicId),
      ])

      const hydratedTopic = mergeTopicIntoNodes({
        ...detail,
        materials,
      })

      const existingIndex = nodes.value.findIndex((node) => node.id === topicId)
      if (existingIndex >= 0) {
        nodes.value[existingIndex] = hydratedTopic
      } else {
        nodes.value.push(hydratedTopic)
      }

      return hydratedTopic
    } catch (err) {
      error.value = err
      throw err
    } finally {
      topicLoading.value = false
    }
  }

  return { nodes, courses, loading, loaded, topicLoading, stats, error, loadData, hydrateTopic, getTopicsForCourse }
})
