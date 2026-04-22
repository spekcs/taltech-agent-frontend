<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import Button from 'primevue/button'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import { quizApi } from '@/api'

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) },
  readOnly: { type: Boolean, default: false },
  onSave: { type: Function, default: null },
})

const router = useRouter()
const route = useRoute()

const step = ref(props.initialData.step || 'selection')
const difficulty = ref(props.initialData.difficulty || 'hard')
const selectedTopicId = ref(props.initialData.selectedTopic?.id || null)
const selectedCourseId = ref(props.initialData.selectedTopic?.courseId || null)
const topicQuery = ref(props.initialData.topicQuery || '')
const questions = ref(props.initialData.questions || [])
const currentIndex = ref(props.initialData.currentIndex || 0)
const answers = ref(props.initialData.answers || {})
const results = ref(props.initialData.results || null)
const isSubmitting = ref(false)
const errorMessage = ref('')

const topics = computed(() => {
  const liveTopics = props.config.getTopics?.()
  if (Array.isArray(liveTopics)) return liveTopics
  return Array.isArray(props.config.topics) ? props.config.topics : []
})

const routeTopicId = computed(() => props.config.getRouteTopicId?.() || null)

const courseOptions = computed(() => {
  const unique = [...new Set(topics.value.map((topic) => topic.courseId).filter(Boolean))]
  return unique.map((courseId) => ({
    label: courseId,
    value: courseId,
  }))
})

const filteredTopics = computed(() => {
  const query = topicQuery.value.trim().toLowerCase()
  return topics.value.filter((topic) => {
    const matchesCourse = !selectedCourseId.value || topic.courseId === selectedCourseId.value
    const matchesQuery = !query || topic.name.toLowerCase().includes(query)
    return matchesCourse && matchesQuery
  })
})

const quickTopicSuggestions = computed(() => filteredTopics.value.slice(0, 8))

const selectedTopic = computed(() =>
  topics.value.find((topic) => String(topic.id) === String(selectedTopicId.value)) || null,
)

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const progress = computed(() =>
  questions.value.length ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0,
)

const difficultyOptions = [
  { label: 'Quick', value: 'easy' },
  { label: 'Deep', value: 'hard' },
]

const nQuestions = computed(() => (difficulty.value === 'easy' ? 5 : 10))

const save = () => {
  props.onSave?.({
    step: step.value,
    difficulty: difficulty.value,
    selectedTopic: selectedTopic.value,
    topicQuery: topicQuery.value,
    questions: questions.value,
    currentIndex: currentIndex.value,
    answers: answers.value,
    results: results.value,
  })
}

watch(
  routeTopicId,
  (newTopicId) => {
    if (!newTopicId) return
    const nextTopic = topics.value.find((topic) => String(topic.id) === String(newTopicId))
    if (!nextTopic || String(selectedTopicId.value) === String(nextTopic.id)) return

    selectedTopicId.value = String(nextTopic.id)
    selectedCourseId.value = nextTopic.courseId || null
    topicQuery.value = nextTopic.name
    step.value = 'selection'
    questions.value = []
    currentIndex.value = 0
    answers.value = {}
    results.value = null
    errorMessage.value = ''
    save()
  },
  { immediate: true },
)

watch(selectedCourseId, (newCourseId) => {
  if (!newCourseId) {
    save()
    return
  }

  if (selectedTopic.value?.courseId === newCourseId) {
    save()
    return
  }

  const nextTopic = filteredTopics.value[0] || null
  selectedTopicId.value = nextTopic?.id || null
  if (nextTopic && !topicQuery.value.trim()) {
    topicQuery.value = nextTopic.name
  }
  save()
})

watch(topicQuery, () => {
  const current = selectedTopic.value
  if (current && filteredTopics.value.some((topic) => String(topic.id) === String(current.id))) {
    save()
    return
  }

  const exactMatch = filteredTopics.value.find(
    (topic) => topic.name.toLowerCase() === topicQuery.value.trim().toLowerCase(),
  )
  if (exactMatch) {
    selectedTopicId.value = exactMatch.id
    selectedCourseId.value = exactMatch.courseId || selectedCourseId.value
  }
  save()
})

const selectTopic = (topic) => {
  if (!topic || selectedTopicId.value === topic.id) return
  selectedTopicId.value = topic.id
  selectedCourseId.value = topic.courseId || null
  topicQuery.value = topic.name
  errorMessage.value = ''
  save()
}

const resolveTopicForQuiz = () => {
  if (selectedTopic.value) return selectedTopic.value
  return filteredTopics.value[0] || null
}

const startQuiz = async () => {
  const topicForQuiz = resolveTopicForQuiz()
  if (!topicForQuiz) return

  if (!selectedTopic.value || String(selectedTopic.value.id) !== String(topicForQuiz.id)) {
    selectedTopicId.value = topicForQuiz.id
    selectedCourseId.value = topicForQuiz.courseId || null
  }

  errorMessage.value = ''

  try {
    const { data } = await quizApi.generateQuiz(topicForQuiz.name, {
      course: topicForQuiz.courseId || null,
      nQuestions: nQuestions.value,
    })

    questions.value = data.questions || []
    currentIndex.value = 0
    answers.value = {}
    results.value = null
    step.value = 'quiz'
    if (selectedTopicId.value && selectedTopicId.value != route.params.id) {
      router.replace({ name: route.name, params: { id: selectedTopicId.value } })
    }
    save()
  } catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Quizi ei saanud käivitada.'
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1
    save()
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    save()
  }
}

const buildInsights = (evaluations, score) => {
  if (!evaluations.length) return []
  if (score === evaluations.length) {
    return ['Kõik vastused olid õiged. Proovi nüüd teemat seletada ilma märkmeteta.']
  }

  const missed = evaluations
    .filter((item) => !item.correct)
    .slice(0, 4)
    .map((item) => item.feedback)

  return missed.length
    ? missed
    : ['Vastused olid osaliselt õiged, aga tasub mõned allikad veel kord üle vaadata.']
}

const scoreToQuality = (score, total) => {
  if (!total) return 0
  const ratio = score / total
  if (ratio >= 0.95) return 5
  if (ratio >= 0.8) return 4
  if (ratio >= 0.6) return 3
  if (ratio >= 0.4) return 2
  if (ratio >= 0.2) return 1
  return 0
}

const submitQuiz = async () => {
  if (!selectedTopic.value || !questions.value.length) return

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const evaluationPayload = questions.value.map((question, index) => ({
      question: question.question,
      student_answer: answers.value[index] || '',
      source_text: question.source_text,
    }))

    const { data } = await quizApi.evaluateAnswersBatch(evaluationPayload)
    const evaluationResults = data.results || []

    const evaluations = questions.value.map((question, index) => {
      const studentAnswer = answers.value[index] || ''
      const result = evaluationResults[index] || {
        correct: false,
        feedback: 'Hindamist ei õnnestunud koostada.',
      }
      return {
        ...question,
        answer: studentAnswer,
        correct: Boolean(result.correct),
        feedback: result.feedback || '',
      }
    })

    const score = evaluations.filter((item) => item.correct).length
    const total = evaluations.length

    await quizApi.saveResult({
      concept: selectedTopic.value.name,
      course: selectedTopic.value.courseId || null,
      score,
      total,
    })

    if (selectedTopic.value.courseId) {
      await quizApi.updateSm2({
        concept: selectedTopic.value.name,
        course: selectedTopic.value.courseId,
        quality: scoreToQuality(score, total),
      })
    }

    results.value = {
      score,
      total,
      percentage: total ? Math.round((score / total) * 100) : 0,
      insights: buildInsights(evaluations, score),
      evaluations,
    }
    step.value = 'results'
    save()
  } catch (error) {
    errorMessage.value = error?.response?.data?.detail || 'Quizi tulemuste arvutamine ebaõnnestus.'
  } finally {
    isSubmitting.value = false
  }
}

const reset = () => {
  step.value = 'selection'
  currentIndex.value = 0
  questions.value = []
  answers.value = {}
  results.value = null
  errorMessage.value = ''
  save()
}
</script>

<template>
  <div class="quiz-tool rounded-2xl overflow-hidden bg-white shadow-sm my-4">
    <div v-if="step === 'selection'" class="p-6">
      <h3 class="text-xl font-bold mb-4">Quiz Configuration</h3>
      <div class="flex flex-col gap-6">
        <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

        <div class="selection-grid">
          <section class="selection-card">
            <label class="block text-sm font-semibold mb-2">1. Aine</label>
            <Select
              v-model="selectedCourseId"
              :options="courseOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Vali aine"
              class="w-full"
            />
            <p class="selection-note mt-2">
              Piira quiz ühe kursuse materjalidele.
            </p>
          </section>

          <section class="selection-card">
            <label class="block text-sm font-semibold mb-2">2. Otsi terminit või teemat</label>
            <InputText
              v-model="topicQuery"
              class="w-full"
              placeholder="Näiteks: subnetting, OSPF, alamhulk"
            />
            <p class="selection-note mt-2">
              Võid alustada lihtsalt märksõnast. Kui sobiv teema leidub, kasutame seda.
            </p>
          </section>
        </div>

        <section class="selection-card">
          <div class="selection-head">
            <div>
              <label class="block text-sm font-semibold mb-2">3. Täpsem teema</label>
              <p class="selection-note">Valikuline. Kui jätad valimata, kasutatakse esimest sobivat vastet.</p>
            </div>
            <span class="result-count">{{ filteredTopics.length }} teemat</span>
          </div>

          <Select
            v-model="selectedTopicId"
            :options="filteredTopics"
            optionLabel="name"
            optionValue="id"
            placeholder="Vali konkreetne teema"
            class="w-full"
          />

          <div v-if="quickTopicSuggestions.length" class="suggestion-grid">
            <button
              v-for="topic in quickTopicSuggestions"
              :key="topic.id"
              type="button"
              class="topic-card p-3 rounded-lg cursor-pointer transition-all text-sm text-left"
              :class="selectedTopicId === topic.id ? 'selected' : ''"
              @pointerdown.stop
              @click.stop="selectTopic(topic)"
            >
              <strong class="block">{{ topic.name }}</strong>
              <span class="topic-meta">{{ topic.courseId || 'General' }}</span>
            </button>
          </div>
        </section>

        <section class="selection-card">
          <label class="block text-sm font-semibold mb-2">4. Depth</label>
          <SelectButton
            v-model="difficulty"
            :options="difficultyOptions"
            optionLabel="label"
            optionValue="value"
            @change="save"
          />
          <p class="selection-note mt-2">
            {{ nQuestions }} avatud küsimust, vastused hinnatakse allikateksti põhjal.
          </p>
        </section>

        <Button
          label="Start Quiz"
          :disabled="(!selectedTopicId && !filteredTopics.length) || readOnly"
          @click="startQuiz"
          class="w-full"
        />
      </div>
    </div>

    <div v-else-if="step === 'quiz'" class="p-6">
      <p v-if="errorMessage" class="error-banner mb-4">{{ errorMessage }}</p>
      <div class="flex justify-between items-center mb-4">
        <div>
          <span class="font-bold">{{ selectedTopic?.name }}</span>
          <p class="selection-note mb-0">{{ selectedTopic?.courseId || 'General' }}</p>
        </div>
        <Button icon="pi pi-times" text rounded severity="secondary" @click="reset" />
      </div>

      <ProgressBar :value="progress" style="height: 6px" class="mb-6" />

      <article v-if="currentQuestion" class="question-card mb-6">
        <p class="question-eyebrow">Question {{ currentIndex + 1 }} / {{ questions.length }}</p>
        <h4 class="question-text">{{ currentQuestion.question }}</h4>
        <p class="question-source">
          Allikas: {{ currentQuestion.document_title }}
          <span v-if="currentQuestion.page_number"> | lk {{ currentQuestion.page_number }}</span>
        </p>
      </article>

      <Textarea
        v-model="answers[currentIndex]"
        rows="7"
        class="w-full mb-6"
        placeholder="Kirjuta vastus oma sõnadega..."
        :disabled="readOnly"
        @input="save"
      />

      <div class="flex justify-between">
        <Button label="Prev" icon="pi pi-chevron-left" text :disabled="currentIndex === 0" @click="prevQuestion" />
        <Button
          v-if="currentIndex < questions.length - 1"
          label="Next"
          icon="pi pi-chevron-right"
          iconPos="right"
          @click="nextQuestion"
          :disabled="!answers[currentIndex]"
        />
        <Button
          v-else
          label="Submit"
          severity="success"
          :loading="isSubmitting"
          @click="submitQuiz"
          :disabled="!answers[currentIndex] || readOnly"
        />
      </div>
    </div>

    <div v-if="step === 'results' && results" class="p-6 text-center">
      <div class="text-4xl mb-4 text-yellow-500">
        <i class="pi pi-sparkles"></i>
      </div>
      <h3 class="text-2xl font-bold mb-1">Score: {{ results.score }} / {{ results.total }}</h3>
      <p class="selection-note">{{ results.percentage }}% correct</p>

      <div class="text-left bg-gray-50 p-6 rounded-2xl my-6 border border-gray-100">
        <div
          v-for="insight in results.insights"
          :key="insight"
          class="flex items-start mb-3 text-sm text-gray-700"
        >
          <i class="pi pi-check-circle text-green-500 mr-3 mt-0.5"></i>
          <span>{{ insight }}</span>
        </div>
      </div>

      <div class="evaluation-list">
        <article
          v-for="item in results.evaluations"
          :key="`${item.document_title}-${item.page_number}-${item.question}`"
          class="evaluation-card"
        >
          <div class="evaluation-header">
            <strong>{{ item.question }}</strong>
            <span :class="item.correct ? 'ok' : 'warn'">
              {{ item.correct ? 'Correct' : 'Review' }}
            </span>
          </div>
          <p class="evaluation-feedback">{{ item.feedback }}</p>
        </article>
      </div>

      <Button label="Try Again" icon="pi pi-refresh" text @click="reset" class="w-full mt-6" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-selectbutton .p-button) {
  flex: 1;
  font-size: 0.875rem;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.selection-card {
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid #e5e7eb;
  background: #fffdf9;
}

.selection-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
  margin-bottom: 0.75rem;
}

.result-count {
  color: #8a5a44;
  background: #fff2e4;
  border: 1px solid #ecd9c7;
  border-radius: 8px;
  padding: 0.2rem 0.55rem;
  font-size: 0.8rem;
  white-space: nowrap;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.topic-card {
  border: 1px solid #e5e7eb;
  background: #fff;
}

.topic-card.selected {
  border-color: #6366f1;
  background: #eef2ff;
}

.topic-meta,
.selection-note,
.question-source,
.evaluation-feedback {
  color: #6b7280;
}

.question-card,
.evaluation-card {
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: #fffdf9;
}

.error-banner {
  padding: 0.85rem 1rem;
  border-radius: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #be123c;
}

.question-eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8a5a44;
}

.question-text {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
}

.evaluation-list {
  display: grid;
  gap: 0.75rem;
  text-align: left;
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.ok {
  color: #15803d;
}

.warn {
  color: #b45309;
}

@media (max-width: 900px) {
  .selection-grid,
  .suggestion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
