<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import Card from 'primevue/card'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import EditorJS from '@editorjs/editorjs'
import ChatTool from './index.js'
import { quizApi } from '@/api'

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
const topics = ref(props.config.topics || [])
const error = ref(null)

// Watch for topics updates from parent
watch(() => props.config.topics, (newTopics) => {
  console.log('[QuizTool] Topics updated in config:', newTopics?.length)
  if (newTopics && newTopics.length > 0) {
    topics.value = newTopics
    if (route?.params?.topic && !selectedTopic.value) {
      const name = route.params.topic
      selectedTopic.value = topics.value.find(t => t.name === name)
      console.log('[QuizTool] Auto-selected topic from route:', selectedTopic.value?.name)
    }
  }
}, { immediate: true })

// Watch topic change and update route
watch(selectedTopic, (newTopic) => {
  if (newTopic && route?.name && newTopic.name !== route.params.topic) {
    console.log('[QuizTool] Pushing new topic to router:', newTopic.name)
    router.push({ 
      name: route.name, 
      params: { 
        course: route.params.course || props.config.course,
        topic: newTopic.name 
      } 
    })
  }
})

const questions = ref(props.initialData.questions || [])
const currentIndex = ref(props.initialData.currentIndex || 0)
const selectedAnswers = ref(props.initialData.selectedAnswers || {})
const evaluations = ref(props.initialData.evaluations || {})
const isSubmitting = ref(false)
const results = ref(props.initialData.results || null)

let questionEditor = null
let resultEditor = null

const currentQuestion = computed(() => questions.value[currentIndex.value])
const progress = computed(() =>
  questions.value.length > 0 ? ((currentIndex.value + 1) / questions.value.length) * 100 : 0
)
const isEasy = computed(() => difficulty.value === 'easy')

const startQuiz = async () => {
  if (!selectedTopic.value) {
    error.value = "Please select a topic first."
    return
  }

  console.log('[QuizTool] Starting quiz for:', selectedTopic.value.name)
  isSubmitting.value = true
  error.value = null
  
  try {
    const res = await quizApi.generateQuiz({
      concept: selectedTopic.value.name,
      course: props.config.course,
      n_questions: 5
    })
    
    console.log('[QuizTool] Quiz generated:', res.data)
    
    if (!Array.isArray(res.data)) {
      throw new Error("Invalid response format: expected an array of questions.")
    }

    questions.value = res.data.map((q, idx) => ({
      id: idx,
      question: q.question,
      source_text: q.source_text || '',
      content: {
        blocks: [{ type: 'paragraph', data: { text: q.question } }]
      },
      options: Array.isArray(q.options) 
        ? q.options.map((opt, i) => ({ id: String.fromCharCode(97 + i), text: opt })) 
        : [],
      answer: q.answer
    }))

    if (questions.value.length === 0) {
      throw new Error("No questions were generated for this topic.")
    }

    step.value = 'quiz'
    currentIndex.value = 0
    selectedAnswers.value = {}
    evaluations.value = {}
    save()
    await nextTick()
    initQuestionEditor()
  } catch (err) {
    console.error('[QuizTool] Failed to generate quiz:', err)
    error.value = "Failed to load quiz. Using demo questions."
    
    // Fallback mock
    questions.value = [
      {
        id: 0,
        question: 'Miks kasutatakse alalisvooluliine pikkade kaabelliinide korral?',
        source_text: 'Alalisvoolu puhul puudub mahtuvusvool...',
        content: { blocks: [{ type: 'paragraph', data: { text: 'Miks kasutatakse alalisvooluliine pikkade kaabelliinide korral?' } }] },
        options: [],
        answer: null
      },
      {
        id: 1,
        question: 'Millised nimipinged vastavad IEC standarditele Eesti kõrgepingevõrkudes?',
        source_text: 'Eesti kõrgepingevõrkudes on standardpinged 110, 220 ja 330 kV...',
        content: { blocks: [{ type: 'paragraph', data: { text: 'Millised nimipinged vastavad IEC standarditele Eesti kõrgepingevõrkudes?' } }] },
        options: [
          { id: 'a', text: '110, 220, 330 kV' },
          { id: 'b', text: '10, 20, 35 kV' }
        ],
        answer: 'a'
      }
    ]
    step.value = 'quiz'
    save()
    await nextTick()
    initQuestionEditor()
  } finally {
    isSubmitting.value = false
  }
}

const initQuestionEditor = () => {
  if (questionEditor) {
    questionEditor.destroy()
    questionEditor = null
  }
  
  if (!currentQuestion.value) return
  
  const holder = document.getElementById('quiz-question-editor')
  if (!holder) {
    console.warn('[QuizTool] Question editor holder not found, retrying...')
    setTimeout(initQuestionEditor, 50)
    return
  }

  questionEditor = new EditorJS({
    holder: 'quiz-question-editor',
    data: currentQuestion.value.content,
    readOnly: true,
    minHeight: 0
  })
}

const evaluateAnswer = async () => {
  const answer = selectedAnswers.value[currentIndex.value]
  if (!answer || answer.trim().length < 5) return
  
  const q = currentQuestion.value
  if (q.options.length > 0) return

  console.log('[QuizTool] Evaluating answer for Q:', currentIndex.value)
  try {
    const res = await quizApi.evaluate({
      question: q.question,
      student_answer: answer,
      source_text: q.source_text
    })
    evaluations.value[currentIndex.value] = res.data
    save()
  } catch (err) {
    console.error('[QuizTool] Evaluation failed:', err)
  }
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
  console.log('[QuizTool] Submitting quiz results...')
  
  let scoreCount = 0
  questions.value.forEach((q, index) => {
    if (q.options.length > 0) {
      if (selectedAnswers.value[index] === q.answer) scoreCount++
    } else {
      const evalData = evaluations.value[index]
      if (evalData && evalData.correct) scoreCount++
    }
  })

  const quality = Math.round((scoreCount / Math.max(1, questions.value.length)) * 5)

  try {
    await quizApi.submitResult({
      concept: selectedTopic.value.name,
      course: props.config.course,
      score: scoreCount,
      total: questions.value.length,
      quality: quality
    })
    
    results.value = {
      score: scoreCount,
      total: questions.value.length,
      quality: quality,
      insights: [
        `You completed the quiz for ${selectedTopic.value.name}.`,
        `Score: ${scoreCount} / ${questions.value.length}.`,
        quality >= 4 ? 'Excellent job! You have mastered this concept.' : 'Consider reviewing the material again.'
      ]
    }
    
    step.value = 'results'
    save()
    nextTick(() => initResultChat())
  } catch (err) {
    console.error('[QuizTool] Failed to submit results:', err)
    results.value = { 
      score: scoreCount, 
      total: questions.value.length, 
      insights: [`Score: ${scoreCount}/${questions.value.length}.`, 'Result saved locally only.'] 
    }
    step.value = 'results'
    nextTick(() => initResultChat())
  } finally {
    isSubmitting.value = false
  }
}

const initResultChat = () => {
  if (resultEditor) {
    resultEditor.destroy()
    resultEditor = null
  }
  
  const holder = document.getElementById('quiz-result-chat')
  if (!holder) {
    setTimeout(initResultChat, 50)
    return
  }

  resultEditor = new EditorJS({
    holder: 'quiz-result-chat',
    tools: {
      chat: {
        class: ChatTool,
        config: {
          endpoint: '/api/chat',
          systemPrompt: `Analyze results for concept "${selectedTopic.value?.name}": ${JSON.stringify(results.value)}`
        }
      }
    },
    data: {
      blocks: [
        { type: 'chat', data: { messages: [{ role: 'assistant', content: 'Results ready. How can I help you understand this topic better?', time: new Date().toLocaleTimeString() }] } }
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
    evaluations: evaluations.value,
    results: results.value
  })
}

const reset = () => {
  step.value = 'selection'
  questions.value = []
  results.value = null
  selectedAnswers.value = {}
  evaluations.value = {}
  error.value = null
  save()
}

onMounted(() => {
  if (step.value === 'quiz') initQuestionEditor()
  if (step.value === 'results') initResultChat()
})
</script>

<template>
  <div class="quiz-tool rounded-3xl overflow-hidden bg-white shadow-sm my-4 border border-gray-100">
    <!-- Selection -->
    <div v-if="step === 'selection'" class="p-6">
      <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
        <i class="pi pi-cog text-indigo-500"></i>
        Quiz Configuration
      </h3>
      
      <Message v-if="error" severity="error" class="mb-4" @close="error = null">{{ error }}</Message>

      <div class="flex flex-col gap-6">
        <div>
          <label class="block text-sm font-semibold mb-2">Topic</label>
          <div v-if="topics.length === 0" class="p-4 bg-gray-50 rounded-xl border border-dashed text-center text-gray-400">
            <i class="pi pi-spin pi-spinner mr-2"></i> Loading topics...
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div
              v-for="topic in topics" :key="topic.name"
              class="p-3 rounded-xl cursor-pointer transition-all text-sm border"
              :class="selectedTopic?.name === topic.name ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 hover:bg-gray-50'"
              @click="selectedTopic = topic; save()"
            >
              {{ topic.name }}
            </div>
          </div>
        </div>
        
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <label class="block text-sm font-semibold mb-2">Quiz Type</label>
            <SelectButton v-model="quizType" :options="[{ label: 'Test', value: 'test' }, { label: 'Learning', value: 'learning' }]" optionLabel="label" optionValue="value" @change="save" class="w-full" />
          </div>
          <div class="flex-1">
            <label class="block text-sm font-semibold mb-2">Difficulty</label>
            <SelectButton v-model="difficulty" :options="[{ label: 'Open', value: 'easy' }, { label: 'MCQ', value: 'hard' }]" optionLabel="label" optionValue="value" @change="save" class="w-full" />
          </div>
        </div>
        
        <Button 
          label="Generate Quiz" 
          icon="pi pi-bolt"
          :disabled="!selectedTopic" 
          :loading="isSubmitting" 
          @click="startQuiz" 
          class="w-full py-3" 
        />
      </div>
    </div>

    <!-- Quiz -->
    <div v-else-if="step === 'quiz'" class="p-6">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-2">
          <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Concept</span>
          <span class="font-bold text-gray-700">{{ selectedTopic?.name }}</span>
        </div>
        <Button icon="pi pi-times" text rounded severity="secondary" @click="reset" />
      </div>
      
      <ProgressBar :value="progress" style="height: 6px" class="mb-6 rounded-full" />

      <div class="bg-gray-50 p-6 rounded-2xl mb-6 border border-gray-100 min-h-[100px]">
        <div id="quiz-question-editor" class="prose max-w-none"></div>
      </div>

      <!-- Multiple Choice -->
      <div v-if="currentQuestion?.options.length > 0" class="flex flex-col gap-2 mb-6">
        <div
          v-for="option in currentQuestion?.options" :key="option.id"
          class="flex items-center p-4 rounded-xl border cursor-pointer transition-all"
          :class="selectedAnswers[currentIndex] === option.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-200 hover:bg-gray-50'"
          @click="selectedAnswers[currentIndex] = option.id; save()"
        >
          <RadioButton v-model="selectedAnswers[currentIndex]" :value="option.id" />
          <label class="ml-3 cursor-pointer text-sm font-medium w-full">{{ option.text }}</label>
        </div>
      </div>

      <!-- Open Ended -->
      <div v-else class="mb-6">
        <Textarea 
          v-model="selectedAnswers[currentIndex]" 
          rows="5" 
          class="w-full p-4 rounded-2xl border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" 
          placeholder="Explain your answer here..." 
          @blur="evaluateAnswer"
          @input="save" 
        />
        <div v-if="evaluations[currentIndex]" class="mt-4 p-4 rounded-xl text-sm border animate-fade-in" :class="evaluations[currentIndex].correct ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'">
          <div class="font-bold flex items-center gap-2 mb-1">
             <i :class="evaluations[currentIndex].correct ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'"></i>
             {{ evaluations[currentIndex].correct ? 'Correct' : 'Needs improvement' }}
             <span v-if="evaluations[currentIndex].score !== undefined" class="ml-auto bg-white/50 px-2 py-0.5 rounded text-xs">Score: {{ evaluations[currentIndex].score }}/100</span>
          </div>
          <p class="leading-relaxed">{{ evaluations[currentIndex].feedback }}</p>
        </div>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-gray-50">
        <Button label="Previous" icon="pi pi-arrow-left" text :disabled="currentIndex === 0" @click="prevQuestion" />
        
        <div class="flex gap-2">
          <Button v-if="currentIndex < questions.length - 1" label="Next Question" icon="pi pi-arrow-right" iconPos="right" @click="nextQuestion" :disabled="!selectedAnswers[currentIndex]" />
          <Button v-else label="Finalize & Submit" severity="success" :loading="isSubmitting" @click="submitQuiz" :disabled="!selectedAnswers[currentIndex]" />
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-if="step === 'results' && results" class="p-8 text-center">
      <div class="text-5xl mb-4 text-yellow-500">
        <i class="pi pi-sparkles"></i>
      </div>
      <h3 class="text-3xl font-black text-gray-900 mb-1">Score: {{ results.score }} / {{ results.total }}</h3>
      <p class="text-gray-500 mb-8 font-medium">Concept Mastery for "{{ selectedTopic?.name }}"</p>
      
      <div class="text-left bg-gray-50 p-6 rounded-3xl my-6 border border-gray-100">
        <h4 class="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">AI Insights</h4>
        <div v-for="(insight, i) in results.insights" :key="i" class="flex items-start mb-3 text-sm text-gray-700">
          <i class="pi pi-check-circle text-green-500 mr-3 mt-0.5"></i>
          <span class="leading-relaxed">{{ insight }}</span>
        </div>
      </div>
      
      <div class="text-left mb-6">
         <h4 class="text-xs font-black uppercase text-gray-400 tracking-widest mb-4 ml-2">Review with Assistant</h4>
         <div id="quiz-result-chat" class="border border-gray-100 rounded-2xl p-2 bg-white min-h-[150px]"></div>
      </div>
      
      <div class="flex gap-3">
         <Button label="Retake Quiz" icon="pi pi-refresh" severity="secondary" text @click="reset" class="flex-1" />
         <Button label="Done" icon="pi pi-check" @click="router.push({ name: 'canvas', params: { course: route.params.course, topic: route.params.topic } })" class="flex-1" />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-selectbutton .p-button) { flex: 1; font-size: 0.875rem; border-radius: 10px; }
:deep(.ce-paragraph) { padding: 0 !important; margin: 0 !important; font-size: 1.1rem; line-height: 1.6; color: #374151; }

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
