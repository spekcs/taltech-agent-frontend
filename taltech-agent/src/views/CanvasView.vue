<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import TopicSheet from '@/components/topic/TopicSheet.vue'
import Select from 'primevue/select'

const router = useRouter()
const route = useRoute()
const canvasStore = useCanvasStore()

const selectedTopicId = ref(null)
const selectedCourseId = ref(null)

const courseOptions = computed(() => canvasStore.courses.map((course) => ({
  id: course.id,
  name: course.name,
  topicCount: course.topicCount,
})))

const topics = computed(() => {
  const activeCourse = selectedCourseId.value
  return canvasStore.nodes
    .filter((node) => (node.materialCount || node.materials?.length || 0) > 0)
    .filter((node) => !activeCourse || node.courseId === activeCourse)
    .map((node) => ({
      id: String(node.id),
      name: node.title,
      courseId: node.courseId,
      materialCount: node.materialCount || node.materials?.length || 0,
    }))
})

const syncCourseFromTopic = (topicId) => {
  const match = canvasStore.nodes.find((node) => String(node.id) === String(topicId))
  if (match?.courseId) {
    selectedCourseId.value = match.courseId
  }
}

const ensureSelection = () => {
  if (route.params.id) {
    selectedTopicId.value = String(route.params.id)
    syncCourseFromTopic(route.params.id)
    return
  }

  if (!selectedCourseId.value && courseOptions.value.length) {
    selectedCourseId.value = courseOptions.value[0].id
  }

  if (topics.value.length && !topics.value.some((topic) => topic.id === selectedTopicId.value)) {
    selectedTopicId.value = topics.value[0].id
    router.replace({ name: 'canvas', params: { id: topics.value[0].id } })
  }
}

onMounted(async () => {
  await canvasStore.loadData()
  ensureSelection()
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      selectedTopicId.value = String(newId)
      syncCourseFromTopic(newId)
    } else {
      ensureSelection()
    }
  },
)

watch(courseOptions, () => {
  if (!selectedCourseId.value && courseOptions.value.length) {
    selectedCourseId.value = courseOptions.value[0].id
  }
})

watch(selectedCourseId, () => {
  if (!topics.value.some((topic) => topic.id === selectedTopicId.value) && topics.value.length) {
    selectedTopicId.value = topics.value[0].id
    router.push({ name: 'canvas', params: { id: topics.value[0].id } })
  }
})

watch(selectedTopicId, (newId) => {
  if (newId && String(newId) !== String(route.params.id)) {
    router.push({ name: 'canvas', params: { id: String(newId) } })
  }
})
</script>

<template>
  <div class="canvas-view p-6 max-w-7xl mx-auto">
    <div class="canvas-shell">
      <aside class="canvas-sidebar">
        <p class="canvas-label">Topic explorer</p>

        <div class="sidebar-stack">
          <div>
            <label class="sidebar-field">Aine</label>
            <Select
              v-model="selectedCourseId"
              :options="courseOptions"
              optionLabel="name"
              optionValue="id"
              placeholder="Vali aine"
              class="w-full"
            />
          </div>

          <div>
            <label class="sidebar-field">Teema</label>
            <Select
              v-model="selectedTopicId"
              :options="topics"
              optionLabel="name"
              optionValue="id"
              placeholder="Vali teema"
              class="w-full"
            />
          </div>
        </div>

        <div class="topic-list-panel">
          <button
            v-for="topic in topics"
            :key="topic.id"
            class="topic-row"
            :class="{ active: selectedTopicId === topic.id }"
            @click="selectedTopicId = topic.id"
          >
            <span>{{ topic.name }}</span>
            <small>{{ topic.materialCount }} viidet</small>
          </button>
        </div>
      </aside>

      <section class="canvas-main">
        <TopicSheet :topic-id="selectedTopicId || null" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.canvas-view {
  min-height: 100vh;
}

.canvas-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.canvas-sidebar {
  position: sticky;
  top: 1.5rem;
  padding: 1rem;
  border-radius: 22px;
  background: #fcfaf6;
  border: 1px solid #ece5d8;
}

.canvas-label {
  margin: 0;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #8a5a44;
}

.sidebar-stack {
  display: grid;
  gap: 0.85rem;
  margin-top: 1rem;
}

.sidebar-field {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #8a5a44;
}

.topic-list-panel {
  display: grid;
  gap: 0.55rem;
  margin-top: 1rem;
  max-height: calc(100vh - 240px);
  overflow: auto;
  padding-right: 0.2rem;
}

.topic-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid #ece5d8;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
}

.topic-row.active {
  border-color: #d48b65;
  background: #fff6ef;
}

.topic-row small {
  color: #6b6860;
}

@media (max-width: 1024px) {
  .canvas-shell {
    grid-template-columns: 1fr;
  }

  .canvas-sidebar {
    position: static;
  }

  .topic-list-panel {
    max-height: none;
  }
}
</style>
