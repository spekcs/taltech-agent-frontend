<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import TopicCanvas from '@/components/canvas/TopicCanvas.vue'
import Select from 'primevue/select'

const route = useRoute()
const canvasStore = useCanvasStore()

const selectedTopic = ref(null)

let topics = ref([])

// Sync from route param on mount
onMounted(async () => {
  await canvasStore.fetchTopics()
  topics.value = canvasStore.topics

  // if (route.params.id) {
  //   const topic = topics.value.find(t => t.id == route.params.id)
  //   if (topic) selectedTopic.value = topic
  // }
})

// Push to router on select
watch(selectedTopic, (newTopic) => {
  // if (newTopic && newTopic.id != route.params.id) {
  //   router.push({ name: 'canvas', params: { id: newTopic.id } })
  // }
})

// Sync from route param on change
watch(() => route.params.id, (newId) => {
  // if (newId) {
  //   const topic = topics.value.find(t => t.id == newId)
  //   if (topic) selectedTopic.value = topic
  // } else {
  //   selectedTopic.value = null
  // }
})

</script>

<template>
  <div class="canvas-view p-6 max-w-7xl mx-auto">
    <Select
      v-model="selectedTopic"
      :options="topics"
      optionLabel="name"
      placeholder="Select a topic"
      class="w-full mt-8"
    />
    <TopicCanvas />
  </div>
</template>

<style scoped>
.canvas-view {
  min-height: 100vh;
}
</style>
