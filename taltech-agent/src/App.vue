<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import Toast from 'primevue/toast'

const route = useRoute()
const router = useRouter()

const viewOptions = [
  { label: 'Topics', value: '/canvas' },
  { label: 'Courses', value: '/courses' },
  { label: 'Quiz', value: '/quiz' }
]

const currentPath = computed({
  get: () => route.path,
  set: (newPath) => {
    if (newPath) router.push(newPath)
  }
})
</script>

<template>
  <main class="flex flex-col min-h-screen">
    <Toast />
    <div class="nav-container flex justify-end mb-8">
      <SelectButton
        v-model="currentPath"
        :options="viewOptions"
        optionLabel="label"
        optionValue="value"
        aria-labelledby="basic"
        :allowEmpty="false"
      />
    </div>
    <RouterView />
  </main>
</template>

<style scoped>
main {
  max-width: var(--max-content-width, 1200px);
  margin: 0 auto;
  padding: 48px 24px;
}

.nav-container {
  position: sticky;
  top: 1rem;
  z-index: 100;
}

</style>
