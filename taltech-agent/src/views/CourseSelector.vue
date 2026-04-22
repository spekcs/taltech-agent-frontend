<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCanvasStore } from '@/stores/canvasStore'
import FileUpload from '@/components/FileUpload.vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const canvasStore = useCanvasStore()
const courses = computed(() => canvasStore.courses)
const stats = computed(() => canvasStore.stats)

onMounted(() => {
  canvasStore.loadData()
})

const openCourse = (course) => {
  const firstTopic = canvasStore.nodes.find((node) => node.courseId === course.id)
  if (firstTopic) {
    router.push({ name: 'canvas', params: { id: firstTopic.id } })
  }
}
</script>

<template>
  <div class="courses-container max-w-6xl mx-auto py-12 px-4">
    <section class="hero-panel mb-10">
      <div>
        <p class="eyebrow">TalTech Agent</p>
        <h1 class="text-4xl font-black mb-3">Õppematerjalid, teemad ja quiz'id ühes vaates</h1>
        <p class="hero-copy">
          Vali olemasolev kursus või laadi uued PDF-id üles juba olemasoleva aine alla või uue nimega kursusesse.
        </p>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ stats.courses }}</span>
          <span class="stat-label">kursust</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.sources }}</span>
          <span class="stat-label">allikat</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ stats.chunks }}</span>
          <span class="stat-label">tekstilõiku</span>
        </div>
      </div>
    </section>

    <div class="grid xl:grid-cols-[1.4fr,0.9fr] gap-12">
      <div class="courses-list flex flex-col gap-4">
        <div>
          <h2 class="text-xl font-bold mb-2">My Courses</h2>
          <p class="section-note">Ava kursus, et minna otse selle teemade ja materjalide juurde.</p>
        </div>

        <p v-if="canvasStore.loading" class="section-note">Laen kursuseid...</p>

        <Card
          v-for="course in courses"
          :key="course.id"
          class="course-card shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer rounded-2xl"
          @click="openCourse(course)"
        >
          <template #content>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-bold text-lg">{{ course.name }}</h3>
                <p class="text-gray-500 text-sm">{{ course.count }} materjali, {{ course.topicCount }} teemat</p>
                <div class="concept-row">
                  <span v-for="concept in course.concepts.slice(0, 3)" :key="concept" class="concept-pill">{{ concept }}</span>
                </div>
              </div>
              <Button icon="pi pi-chevron-right" text rounded />
            </div>
          </template>
        </Card>
      </div>

      <div class="upload-section">
        <h2 class="text-xl font-bold mb-4">Add Materials</h2>
        <FileUpload :course-options="courses" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.courses-container {
  min-height: 80vh;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}

.hero-copy {
  max-width: 54ch;
  color: #6b7280;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  align-self: end;
}

.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 108px;
  padding: 1rem;
  border-radius: 16px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
}

.stat-label,
.section-note {
  color: #6b6860;
}

.concept-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.6rem;
}

.concept-pill {
  padding: 0.25rem 0.55rem;
  border-radius: 8px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 0.75rem;
}

@media (max-width: 960px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
