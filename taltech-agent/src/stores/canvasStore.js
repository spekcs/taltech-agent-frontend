import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCanvasStore = defineStore('canvas', () => {
  const nodes = ref([
    {
      id: 1,
      title: 'Introduction to Algorithms',
      content: 'Big-O notation, sorting, searching fundamentals.',
      color: '#6366f1',
      width: 260,
    },
    {
      id: 2,
      title: 'Data Structures',
      content: 'Arrays, linked lists, trees, graphs, hash tables.',
      color: '#10b981',
      width: 260,
    },
    {
      id: 3,
      title: 'Graph Theory',
      content: 'DFS, BFS, shortest paths, minimum spanning trees.',
      color: '#f59e0b',
      width: 260,
    },
    {
      id: 4,
      title: 'Dynamic Programming',
      content: 'Memoization, tabulation, classic DP problems.',
      color: '#f43f5e',
      width: 260,
    },
  ])


  return { nodes }
})
