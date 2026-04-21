<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SelectButton from 'primevue/selectbutton'

const route = useRoute()
const router = useRouter()

const viewOptions = [
  { label: 'Canvas', value: '/canvas' },
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

:deep(.p-selectbutton) {
  background: white;
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e8e3d8;
}

:deep(.p-selectbutton .p-button) {
  border: none;
  background: transparent;
  color: #6b6860;
  border-radius: 8px;
  font-weight: 500;
  padding: 0.5rem 1rem;
  transition: all 0.2s;
}

:deep(.p-selectbutton .p-button.p-highlight) {
  background: #6366f1;
  color: white;
}

:deep(.p-selectbutton .p-button:not(.p-highlight):hover) {
  background: #fcfaf7;
  color: #1a1a1a;
}
</style>
