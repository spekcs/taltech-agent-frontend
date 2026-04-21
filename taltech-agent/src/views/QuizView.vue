<script setup>
import { ref, computed } from 'vue'
import ProgressBar from 'primevue/progressbar'
import Card from 'primevue/card'
import Button from 'primevue/button'
import RadioButton from 'primevue/radiobutton'

const questions = ref([
  {
    id: 1,
    text: 'What is the time complexity of a binary search algorithm?',
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
    text: 'Which data structure follows the LIFO (Last In First Out) principle?',
    options: [
      { id: 'a', text: 'Queue' },
      { id: 'b', text: 'Linked List' },
      { id: 'c', text: 'Stack' },
      { id: 'd', text: 'Tree' }
    ],
    answer: 'c'
  }
  // ... more questions would be loaded from API
])

const currentIndex = ref(0)
const selectedAnswers = ref({})
const isSubmitted = ref(false)

const currentQuestion = computed(() => questions.value[currentIndex.value])
const progress = computed(() => ((currentIndex.value + 1) / questions.value.length) * 100)

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

const prevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const submitQuiz = () => {
  isSubmitted.value = true
  // In real app, call quizApi.submitAnswers
}

const score = computed(() => {
  let correct = 0
  questions.value.forEach((q, index) => {
    if (selectedAnswers.value[index] === q.answer) {
      correct++
    }
  })
  return correct
})
</script>

<template>
  <div class="quiz-container max-w-2xl mx-auto mt-12 p-4">
    <div v-if="!isSubmitted">
      <div class="mb-8">
        <h2 class="text-xl font-bold mb-2">Quiz: Data Structures & Algorithms</h2>
        <ProgressBar :value="progress" style="height: 6px"></ProgressBar>
        <div class="text-right text-sm text-gray-500 mt-1">
          Question {{ currentIndex + 1 }} of {{ questions.length }}
        </div>
      </div>

      <Card class="quiz-card border-none shadow-lg rounded-2xl overflow-hidden bg-white">
        <template #content>
          <div class="p-4">
            <p class="text-lg font-medium mb-6">{{ currentQuestion.text }}</p>

            <div class="flex flex-col gap-4">
              <div
                v-for="option in currentQuestion.options"
                :key="option.id"
                class="flex items-center p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="selectedAnswers[currentIndex] = option.id"
              >
                <RadioButton
                  v-model="selectedAnswers[currentIndex]"
                  :inputId="option.id"
                  name="quiz-option"
                  :value="option.id"
                />
                <label :for="option.id" class="ml-3 cursor-pointer w-full">{{ option.text }}</label>
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex justify-between p-4">
            <Button
              label="Previous"
              icon="pi pi-chevron-left"
              text
              :disabled="currentIndex === 0"
              @click="prevQuestion"
            />
            <Button
              v-if="currentIndex < questions.length - 1"
              label="Next"
              icon="pi pi-chevron-right"
              iconPos="right"
              @click="nextQuestion"
              :disabled="!selectedAnswers[currentIndex]"
            />
            <Button
              v-else
              label="Submit Quiz"
              severity="success"
              @click="submitQuiz"
              :disabled="!selectedAnswers[currentIndex]"
            />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="text-center py-12">
      <Card class="shadow-xl rounded-2xl p-8">
        <template #content>
          <div class="text-6xl mb-4">🎉</div>
          <h2 class="text-2xl font-bold mb-2">Quiz Completed!</h2>
          <p class="text-gray-600 mb-8">
            You scored {{ score }} out of {{ questions.length }}
          </p>
          <div class="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
            <h3 class="font-bold mb-4">Recommended Topics:</h3>
            <ul class="list-disc ml-5 space-y-2 text-gray-700">
              <li>Review Binary Search Trees</li>
              <li>Practice Dynamic Programming basics</li>
            </ul>
          </div>
          <Button label="Back to Topics" icon="pi pi-arrow-left" @click="$router.push('/canvas')" />
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.quiz-container {
  min-height: 80vh;
}

:deep(.p-card) {
  border-radius: 20px;
}

:deep(.p-radiobutton .p-radiobutton-box) {
  border-radius: 50%;
}
</style>
