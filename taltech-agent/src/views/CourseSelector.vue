<script setup>
import FileUpload from '@/components/FileUpload.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import { onMounted, ref } from 'vue'
import { useCanvasStore } from '@/stores/canvasStore'

const canvasStore = useCanvasStore()
const selectedCourseName = ref('')

const selectCourse = (course) => {
  selectedCourseName.value = typeof course === 'string' ? course : course.name;
}

// Sync from route param on mount
onMounted(async () => {
  await canvasStore.fetchCourses()
})

</script>

<template>
  <div class="courses-container max-w-5xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-black mb-8">Course Management</h1>

    <div class="grid md:grid-cols-2 gap-12">
      <div class="courses-list flex flex-col gap-4">
        <h2 class="text-xl font-bold mb-2">My Courses</h2>
        <Card
          v-for="course in canvasStore.courses"
          :key="typeof course === 'string' ? course : course.id || course.name"
          class="course-card shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer rounded-2xl"
          :class="{ 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50': selectedCourseName === (typeof course === 'string' ? course : course.name) }"
          @click="selectCourse(course)"
        >
          <template #content>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-bold text-lg">{{ typeof course === 'string' ? course : course.name }}</h3>
                <p v-if="course.topicCount !== undefined" class="text-gray-500 text-sm">{{ course.topicCount }} topics related</p>
                <p v-else-if="course.count !== undefined" class="text-gray-500 text-sm">{{ course.count }} materials processed</p>
              </div>
              <Button icon="pi pi-chevron-right" text rounded />
            </div>
          </template>
        </Card>
      </div>

      <div class="upload-section">
        <h2 class="text-xl font-bold mb-4">Add Materials</h2>
        <FileUpload :initialCourse="selectedCourseName" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.courses-container {
  min-height: 80vh;
}
</style>
