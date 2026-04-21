<script setup>
import TopicCanvas from '@/components/canvas/TopicCanvas.vue'
import Select from 'primevue/select'

const topic = undefined
</script>

<template>
  <div class="canvas-view">
    <Select
      v-model="topic"
      :options="[]"
      optionLabel="name"
      placeholder="Select a City"
      class="w-full mt-8"
    />

    <TopicCanvas />
  </div>
</template>

<style scoped></style>
