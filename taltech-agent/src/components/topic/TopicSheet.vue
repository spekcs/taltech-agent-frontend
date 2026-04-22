<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useCanvasStore } from '@/stores/canvasStore'
import { topicApi } from '@/api'

const props = defineProps({
  topicId: { type: [String, Number], default: null },
})

const router = useRouter()
const canvasStore = useCanvasStore()
const searchQuery = ref('')
const searchLoading = ref(false)
const searchResults = ref([])

const topic = computed(() =>
  canvasStore.nodes.find((node) => String(node.id) === String(props.topicId)) || null,
)

const ensureHydrated = async () => {
  if (!props.topicId) return
  await canvasStore.hydrateTopic(String(props.topicId))
  searchResults.value = []
  searchQuery.value = ''
}

const runSearch = async () => {
  if (!props.topicId || !searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchLoading.value = true
  try {
    const { data } = await topicApi.searchTopicMaterials(props.topicId, searchQuery.value.trim(), 5)
    searchResults.value = data.matches || []
  } finally {
    searchLoading.value = false
  }
}

onMounted(() => {
  ensureHydrated()
})

watch(() => props.topicId, () => {
  ensureHydrated()
})

const launchQuiz = () => {
  if (topic.value?.id) {
    router.push({ name: 'quiz', params: { id: topic.value.id } })
  }
}
</script>

<template>
  <section v-if="topic" class="topic-sheet">
    <header class="topic-hero">
      <div class="hero-copy">
        <p class="topic-course">{{ topic.courseId }}</p>
        <h1>{{ topic.title }}</h1>
        <p class="topic-summary">
          Otsi sellest teemast märksõna või küsimusega ja ava kohe vastav koht materjalis.
        </p>
      </div>

      <div class="hero-side">
        <div class="hero-stat">
          <strong>{{ topic.materialCount || topic.materials?.length || 0 }}</strong>
          <span>viidet</span>
        </div>
        <button class="inline-action" @click="launchQuiz">Ava quiz</button>
      </div>
    </header>

    <section class="sheet-card search-card">
      <div class="section-head">
        <div>
          <h2>Otsi materjalidest</h2>
          <p class="section-note">Kirjuta märksõna või küsimus. Näitan ainult parimaid vasteid ja viidet õigesse kohta.</p>
        </div>
      </div>

      <div class="search-bar">
        <InputText
          v-model="searchQuery"
          class="w-full"
          placeholder="Näiteks: vlan trunking, subnetting, ospf või kuidas ipv4 aadressi arvutada"
          @keyup.enter="runSearch"
        />
        <Button label="Otsi" :loading="searchLoading" @click="runSearch" />
      </div>

      <div v-if="searchResults.length" class="reference-list">
        <article v-for="card in searchResults" :key="card.id" class="reference-card">
          <div class="reference-rank">
            {{ card.page || '#' }}
          </div>

          <div class="reference-body">
            <div class="result-head">
              <div>
                <h3>{{ card.title }}</h3>
                <p class="reference-meta">{{ card.where }}</p>
              </div>
              <a :href="card.fileUrl" target="_blank" rel="noopener noreferrer" class="open-link">
                Ava materjal
              </a>
            </div>

            <blockquote>{{ card.quote }}</blockquote>
          </div>
        </article>
      </div>

      <div v-else class="empty-search">
        <p class="section-note">
          {{ searchQuery ? 'Vasteid ei leitud. Proovi teist märksõna või lühemat küsimust.' : 'Sisesta otsing, et leida õige koht materjalidest.' }}
        </p>
      </div>
    </section>
  </section>

  <section v-else class="topic-sheet topic-empty">
    <h2>Vali teema</h2>
    <p>Vali vasakult aine ja teema, siis saad siit kohe materjalidest otsida.</p>
  </section>
</template>

<style scoped>
.topic-sheet {
  display: grid;
  gap: 1.25rem;
}

.topic-hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.hero-copy {
  min-width: 0;
}

.topic-course {
  margin: 0 0 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.8rem;
  color: #6b7280;
}

.topic-hero h1 {
  margin: 0 0 0.6rem;
  font-size: 2.35rem;
  line-height: 1.08;
}

.topic-summary {
  margin: 0;
  max-width: 52ch;
  color: #6b7280;
  line-height: 1.55;
}

.hero-side {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.hero-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 100px;
  min-height: 100px;
  padding: 0.9rem;
  border-radius: 8px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.hero-stat strong {
  font-size: 1.8rem;
}

.sheet-card {
  padding: 1.15rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.search-card {
  min-height: 440px;
}

.sheet-card h2 {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.95rem;
}

.section-note,
.reference-meta {
  color: #6b7280;
  font-size: 0.92rem;
}

.inline-action,
.open-link {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111111;
  border-radius: 8px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  text-decoration: none;
}

.search-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.reference-list {
  display: grid;
  gap: 0.8rem;
}

.reference-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 0.85rem;
  padding: 0.9rem;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
}

.reference-rank {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #f3f4f6;
  color: #111111;
  font-weight: 800;
}

.reference-body h3 {
  margin: 0 0 0.2rem;
}

.result-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

blockquote {
  margin: 0.55rem 0 0;
  padding-left: 0.9rem;
  border-left: 2px solid #d1d5db;
  color: #302c27;
  line-height: 1.45;
}

.empty-search {
  min-height: 240px;
  display: grid;
  place-items: center;
  text-align: center;
}

.topic-empty {
  padding: 2rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

@media (max-width: 1080px) {
  .topic-hero {
    display: grid;
    grid-template-columns: 1fr;
  }

  .hero-side {
    justify-content: space-between;
  }

  .search-bar,
  .result-head {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
