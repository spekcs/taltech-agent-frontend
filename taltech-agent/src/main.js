import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import ToastService from 'primevue/toastservice'
import 'primeicons/primeicons.css'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/canvas' },
    { path: '/canvas', component: () => import('./views/CanvasView.vue') },
    { path: '/courses', component: () => import('./views/CourseSelector.vue') },
    { path: '/quiz', component: () => import('./views/QuizView.vue') },
  ],
})

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: { darkModeSelector: false },
    },
  })
  .use(ToastService)
  .mount('#app')
