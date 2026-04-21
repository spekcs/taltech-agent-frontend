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
const featuredTopics = computed(() => canvasStore.nodes.slice(0, 6))
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
          Vali kursus, laadi üles uued PDF-id ja ava kohe seotud teemad ning viited.
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
        <h2 class="text-xl font-bold mb-2">My Courses</h2>
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
        
        <Button label="Create New Course" icon="pi pi-plus" outlined class="mt-4 rounded-xl" />
      </div>
      
      <div class="upload-section">
        <h2 class="text-xl font-bold mb-4">Add Materials</h2>
        <FileUpload />
        <div class="topic-preview mt-8">
          <h3 class="text-lg font-bold mb-3">Featured topics</h3>
          <div class="topic-list">
            <button
              v-for="topic in featuredTopics"
              :key="topic.id"
              class="topic-chip"
              @click="router.push({ name: 'canvas', params: { id: topic.id } })"
            >
              <span class="topic-chip-title">{{ topic.title }}</span>
              <span class="topic-chip-meta">{{ topic.courseId }}</span>
            </button>
          </div>
        </div>
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
  padding: 2rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(218, 119, 87, 0.22), transparent 32%),
    linear-gradient(135deg, #f8f1e7 0%, #fffdf8 55%, #eef5ff 100%);
  border: 1px solid rgba(194, 184, 165, 0.45);
}

.eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #8a5a44;
}

.hero-copy {
  max-width: 54ch;
  color: #62584d;
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
  min-height: 120px;
  padding: 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(209, 205, 197, 0.8);
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
}

.stat-label {
  color: #6b6860;
}

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
  border-radius: 999px;
  background: #f4eee3;
  color: #725f42;
  font-size: 0.75rem;
}

.topic-preview {
  padding: 1rem 0 0;
}

.topic-list {
  display: grid;
  gap: 0.7rem;
}

.topic-chip {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 100%;
  padding: 0.9rem 1rem;
  border-radius: 18px;
  border: 1px solid #ece5d8;
  background: #fffdfa;
  cursor: pointer;
  text-align: left;
}

.topic-chip-title {
  font-weight: 700;
}

.topic-chip-meta {
  font-size: 0.8rem;
  color: #6b6860;
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
