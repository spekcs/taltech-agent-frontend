<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import TopicCanvas from '@/components/canvas/TopicCanvas.vue'
import Select from 'primevue/select'

const canvasStore = useCanvasStore()

const selectedCourse = ref(null)
const selectedTopic = ref(null)

const courses = computed(() => canvasStore.courses)
const topics = computed(() =>
  canvasStore.topics.map(t => ({
    name: t.title
  }))
)

onMounted(async () => {
  await canvasStore.fetchCourses()
  await canvasStore.fetchTopics()
})

</script>

<template>
  <div class="canvas-view p-6 max-w-7xl mx-auto">
    <div class="flex flex-col md:flex-row gap-4 mt-8">
      <div class="flex-1">
        <label class="block text-sm font-semibold mb-2 text-gray-600">Course</label>
        <Select
          v-model="selectedCourse"
          :options="courses"
          placeholder="Select a course"
          optionLabel="name"
          class="w-full rounded-xl"
          :loading="canvasStore.isLoading && courses.length === 0"
        />
      </div>
      <div class="flex-1">
        <label class="block text-sm font-semibold mb-2 text-gray-600">Topic</label>
        <Select
          v-model="selectedTopic"
          :options="topics"
          optionLabel="name"
          placeholder="Select a topic"
          class="w-full rounded-xl"
          :disabled="!selectedCourse"
          :loading="canvasStore.isLoading && topics.length === 0"
        />
      </div>
    </div>

    <TopicCanvas :topic-title="selectedTopic?.name" />
  </div>
</template>

<style scoped>
.canvas-view {
  min-height: 100vh;
}

:deep(.p-select) {
  border-radius: 12px;
}
</style>
