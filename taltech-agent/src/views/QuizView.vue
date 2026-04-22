<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import EditorJS from '@editorjs/editorjs'
import { QuizTool, ChatTool } from '@/tools'

const route = useRoute()
const canvasStore = useCanvasStore()
const editorRef = ref(null)
let editorInstance = null

const topics = computed(() =>
  canvasStore.nodes
    .filter((node) => (node.materialCount || node.materials?.length || 0) > 0)
    .map((node) => ({
      id: String(node.id),
      name: node.title,
      courseId: node.courseId,
      materialCount: node.materialCount || node.materials?.length || 0,
    })),
)

onMounted(async () => {
  await canvasStore.loadData()
  const topicId = route.params.id ? String(route.params.id) : null
  const initialTopic = topicId ? topics.value.find((topic) => topic.id === topicId) : topics.value[0] || null

  editorInstance = new EditorJS({
    holder: editorRef.value,
    data: {
      blocks: [
        {
          type: 'quiz',
          data: {
            selectedTopic: initialTopic,
          },
        },
      ],
    },
    tools: {
      quiz: {
        class: QuizTool,
        config: {
          getTopics: () => topics.value,
          getRouteTopicId: () => (route.params.id ? String(route.params.id) : null),
        },
      },
      chat: {
        class: ChatTool,
        config: {
          endpoint: '/api/chat',
        },
      },
    },
    minHeight: 0,
  })
})

onUnmounted(() => {
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    editorInstance.destroy()
  }
})
</script>

<template>
  <div class="quiz-view-wrapper min-h-screen p-6">
    <div class="quiz-content mx-auto max-w-[1000px]">
      <div class="quiz-header">
        <h1>Quiz</h1>
        <p>Choose a course, narrow to a topic if you want, and start.</p>
      </div>

      <div ref="editorRef" class="quiz-editor"></div>
    </div>
  </div>
</template>

<style scoped>
.quiz-content {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #ffffff;
  padding: 32px;
}

.quiz-header {
  margin-bottom: 24px;
}

.quiz-header h1 {
  margin: 0 0 8px;
  font-size: 1.875rem;
  line-height: 1.1;
}

.quiz-header p {
  margin: 0;
  color: #6b7280;
}

:deep(.ce-block__content) {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

:deep(.ce-toolbar__content) {
  max-width: 800px;
}
</style>
