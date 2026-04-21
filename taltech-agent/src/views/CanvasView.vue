<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import TopicCanvas from '@/components/canvas/TopicCanvas.vue'
const router = useRouter()
const canvasStore = useCanvasStore()

const selectedTopic = ref(null)

const topics = computed(() =>
  canvasStore.nodes.map(node => ({
    id: node.id,
    name: node.title
  }))
)

</script>

<template>
  <div class="canvas-view p-6 max-w-7xl mx-auto">
    <TopicCanvas />
  </div>
</template>

<style scoped>
.canvas-view {
  min-height: 100vh;
}
</style>
