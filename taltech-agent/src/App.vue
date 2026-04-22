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
  <main class="app-shell flex flex-col min-h-screen">
    <Toast />
    <header class="topbar">
      <div class="brand-mark">TalTech Agent</div>
      <div class="nav-container">
        <SelectButton
          v-model="currentPath"
          :options="viewOptions"
          optionLabel="label"
          optionValue="value"
          aria-labelledby="basic"
          :allowEmpty="false"
        />
      </div>
    </header>
    <RouterView />
  </main>
</template>

<style scoped>
.app-shell {
  max-width: var(--max-content-width, 1200px);
  margin: 0 auto;
  padding: 24px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 50;
  margin-bottom: 24px;
  padding: 12px 0 20px;
  background: #fafafa;
}

.brand-mark {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #111111;
}

.nav-container :deep(.p-selectbutton) {
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.nav-container :deep(.p-button) {
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  box-shadow: none;
}

.nav-container :deep(.p-button.p-highlight) {
  background: #111111;
  color: #ffffff;
}

@media (max-width: 720px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}

</style>
