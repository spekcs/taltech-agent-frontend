<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import Card from 'primevue/card'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import EditorJS from '@editorjs/editorjs'
import ChatTool from './index.js'

const props = defineProps({
  initialData: { type: Object, default: () => ({}) },
  config: { type: Object, default: () => ({}) },
  readOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['save'])
const router = useRouter()
const route = useRoute()

// --- State ---
const step = ref(props.initialData.step || 'selection')
const quizType = ref(props.initialData.quizType || 'test')
const difficulty = ref(props.initialData.difficulty || 'hard')
const selectedTopic = ref(props.initialData.selectedTopic || null)

// // Watch topic change and update route
// watch(selectedTopic, (newTopic) => {
//   if (newTopic && newTopic.id != route.params?.id) {
//     router.push({ name: route.name, params: { id: newTopic.id } })
//   }
// })

const topics = ref(props.config.topics || [
  { id: 1, name: 'Data Structures' },
  { id: 2, name: 'Algorithms' },
  { id: 3, name: 'Graph Theory' },
  { id: 4, name: 'Dynamic Programming' }
])

const questions = ref(props.initialData.questions || [])
const currentIndex = ref(props.initialData.currentIndex || 0)
const selectedAnswers = ref(props.initialData.selectedAnswers || {})
const isSubmitting = ref(false)
const results = ref(props.initialData.results || null)

let questionEditor = null
let resultEditor = null

// --- Computed ---
const currentQuestion = computed(() => questions.value[currentIndex.value])
const progress = computed(() =>
  questions.value.length > 0 ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0
)
const isEasy = computed(() => difficulty.value === 'easy')

// --- Methods ---
const startQuiz = async () => {
  // Mock questions
  questions.value = [
    {
      id: 1,
      content: {
        blocks: [
          {
            type: 'paragraph',
            data: { text: 'What is the time complexity of a binary search algorithm on a sorted array?' }
          }
        ]
      },
      options: [
        { id: 'a', text: 'O(n)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n^2)' },
        { id: 'd', text: 'O(1)' }
      ],
      answer: 'b'
    },
    {
      id: 2,
      content: {
        blocks: [
          {
            type: 'paragraph',
            data: { text: 'Which data structure follows the <b>LIFO</b> (Last In First Out) principle?' }
          }
        ]
      },
      options: [
        { id: 'a', text: 'Queue' },
        { id: 'b', text: 'Linked List' },
        { id: 'c', text: 'Stack' },
        { id: 'd', text: 'Tree' }
      ],
      answer: 'c'
    }
  ]

  step.value = 'quiz'
  currentIndex.value = 0
  selectedAnswers.value = {}
  save()

  await nextTick()
  initQuestionEditor()
}

const initQuestionEditor = () => {
  if (questionEditor) questionEditor.destroy()
  if (!currentQuestion.value) return

  questionEditor = new EditorJS({
    holder: 'quiz-question-editor',
    data: currentQuestion.value.content,
    readOnly: true,
    minHeight: 0
  })
}

const nextQuestion = async () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    save()
    await nextTick()
    initQuestionEditor()
  }
}

const prevQuestion = async () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    save()
    await nextTick()
    initQuestionEditor()
  }
}

const submitQuiz = async () => {
  isSubmitting.value = true

  setTimeout(() => {
    let score = 0
    questions.value.forEach((q, index) => {
      if (!isEasy.value) {
        if (selectedAnswers.value[index] === q.answer) score++
      } else {
        if (selectedAnswers.value[index]?.length > 10) score++
      }
    })

    results.value = {
      score,
      total: questions.value.length,
      insights: [
        'Your understanding of algorithms is improving.',
        'Focus more on stack-based operations.'
      ]
    }

    isSubmitting.value = false
    step.value = 'results'
    save()

    nextTick(() => {
      initResultChat()
    })
  }, 1000)
}

const initResultChat = () => {
  if (resultEditor) resultEditor.destroy()
  resultEditor = new EditorJS({
    holder: 'quiz-result-chat',
    tools: {
      chat: {
        class: ChatTool,
        config: {
          endpoint: '/api/chat',
          systemPrompt: `Analyze results: ${JSON.stringify(results.value)}`
        }
      }
    },
    data: {
      blocks: [
        { type: 'chat', data: { messages: [{ role: 'assistant', content: 'How can I help with these results?', time: new Date().toLocaleTimeString() }] } }
      ]
    }
  })
}

const save = () => {
  emit('save', {
    step: step.value,
    quizType: quizType.value,
    difficulty: difficulty.value,
    selectedTopic: selectedTopic.value,
    questions: questions.value,
    currentIndex: currentIndex.value,
    selectedAnswers: selectedAnswers.value,
    results: results.value
  })
}

const reset = () => {
  step.value = 'selection'
  questions.value = []
  results.value = null
  selectedAnswers.value = {}
  save()
}

const quizTypeOptions = [
  { label: 'Test', value: 'test' },
  { label: 'Learning', value: 'learning' }
]

const difficultyOptions = [
  { label: 'Easy', value: 'easy' },
  { label: 'Hard', value: 'hard' }
]
</script>

<template>
  <div class="quiz-tool rounded-3xl overflow-hidden bg-white shadow-sm my-4">
    <!-- Selection -->
    <div v-if="step === 'selection'" class="p-6">
      <h3 class="text-xl font-bold mb-4">Quiz Configuration</h3>
      <div class="flex flex-col gap-6">
        <div>
          <label class="block text-sm font-semibold mb-2">Topic</label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="topic in topics" :key="topic.id"
              class="p-3 rounded-xl cursor-pointer transition-all text-sm"
              :class="selectedTopic?.id === topic.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'"
              @click="selectedTopic = topic; save()"
            >
              {{ topic.name }}
            </div>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="flex-1">
            <label class="block text-sm font-semibold mb-2">Type</label>
            <SelectButton v-model="quizType" :options="quizTypeOptions" optionLabel="label" optionValue="value" @change="save" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-semibold mb-2">Difficulty</label>
            <SelectButton v-model="difficulty" :options="difficultyOptions" optionLabel="label" optionValue="value" @change="save" />
          </div>
        </div>
        <Button label="Start Quiz" :disabled="!selectedTopic" @click="startQuiz" class="w-full" />
      </div>
    </div>

    <!-- Quiz -->
    <div v-else-if="step === 'quiz'" class="p-6">
      <div class="flex justify-between items-center mb-4">
        <span class="font-bold">{{ selectedTopic?.name }}</span>
        <Button icon="pi pi-times" text rounded severity="secondary" @click="reset" />
      </div>
      <ProgressBar :value="progress" style="height: 6px" class="mb-6" />

      <div id="quiz-question-editor" class="mb-6 prose max-w-none"></div>

      <div v-if="!isEasy" class="flex flex-col gap-2 mb-6">
        <div
          v-for="option in currentQuestion?.options" :key="option.id"
          class="flex items-center p-3 rounded-xl cursor-pointer transition-all"
          :class="selectedAnswers[currentIndex] === option.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:bg-gray-50'"
          @click="selectedAnswers[currentIndex] = option.id; save()"
        >
          <RadioButton v-model="selectedAnswers[currentIndex]" :value="option.id" />
          <label class="ml-3 cursor-pointer text-sm font-medium">{{ option.text }}</label>
        </div>
      </div>
      <Textarea v-else v-model="selectedAnswers[currentIndex]" rows="4" class="w-full mb-6" placeholder="Your answer..." @input="save" />

      <div class="flex justify-between">
        <Button label="Prev" icon="pi pi-chevron-left" text :disabled="currentIndex === 0" @click="prevQuestion" />
        <Button v-if="currentIndex < questions.length - 1" label="Next" icon="pi pi-chevron-right" iconPos="right" @click="nextQuestion" :disabled="!selectedAnswers[currentIndex]" />
        <Button v-else label="Submit" severity="success" :loading="isSubmitting" @click="submitQuiz" :disabled="!selectedAnswers[currentIndex]" />
      </div>
    </div>

    <!-- Results -->
    <div v-if="step === 'results' && results" class="p-6 text-center">
      <div class="text-4xl mb-4 text-yellow-500">
        <i class="pi pi-sparkles"></i>
      </div>
      <h3 class="text-2xl font-bold mb-1">Score: {{ results.score }} / {{ results.total }}</h3>
      <div class="text-left bg-gray-50 p-6 rounded-2xl my-6 border border-gray-100">
        <div v-for="insight in results.insights" :key="insight" class="flex items-start mb-3 text-sm text-gray-700">
          <i class="pi pi-check-circle text-green-500 mr-3 mt-0.5"></i>
          <span>{{ insight }}</span>
        </div>
      </div>
      <div id="quiz-result-chat" class="text-left rounded-xl p-2 mb-6"></div>
      <Button label="Try Again" icon="pi pi-refresh" text @click="reset" class="w-full" />
    </div>
  </div>
</template>

<style scoped>
:deep(.p-selectbutton .p-button) { flex: 1; font-size: 0.875rem; }
:deep(.ce-paragraph) { padding: 0 !important; margin: 0 !important; font-size: 1rem; }
</style>
