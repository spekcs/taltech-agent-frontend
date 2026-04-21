<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import EditorJS from '@editorjs/editorjs'
import { QuizTool, ChatTool } from '@/tools'
import RuledBg from '@/components/canvas/RuledBg.vue'

const route = useRoute()
const canvasStore = useCanvasStore()
const editorRef = ref(null)
let editorInstance = null

const topics = computed(() => {
  return canvasStore.topics
})

const initEditor = () => {
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    editorInstance.destroy()
  }

  const topicId = route.params.id
  const initialTopic = topicId ? topics.value.find((t) => t.id == topicId) : null

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
          topics: topics.value,
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
}

onMounted(async () => {
  if (canvasStore.topics.length === 0) {
    await canvasStore.fetchTopics()
  }
  initEditor()
})

// watch(
//   [() => route.params.id, () => canvasStore.topics],
//   () => {
//     initEditor()
//   },
//   { deep: true },
// )

onUnmounted(() => {
  if (editorInstance && typeof editorInstance.destroy === 'function') {
    editorInstance.destroy()
  }
})
</script>

<template>
  <div class="quiz-view-wrapper min-h-screen p-6">
    <div
      class="quiz-content relative mx-auto max-w-[1000px] p-12 rounded-xl bg-white overflow-hidden"
    >
      <RuledBg />

      <div class="relative z-10">
        <div class="mb-8 ml-6">
          <h1 class="text-2xl font-black text-gray-900 flex items-center gap-3">
            <i class="pi pi-bolt" style="font-size: 2rem"></i>
            Interactive Quiz
          </h1>
        </div>

        <div ref="editorRef" class="quiz-editor"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-view-wrapper {
}

.quiz-content {
  background: url('/pattern.svg');
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 12px 24px rgba(0, 0, 0, 0.06),
    0 32px 48px rgba(0, 0, 0, 0.04);
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
