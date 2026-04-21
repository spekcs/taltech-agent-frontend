<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import RuledBg from '@/components/canvas/RuledBg.vue'
import EditorJS from '@editorjs/editorjs'
import ChatTool from '@/tools/index.js'
import { useCanvasStore } from '@/stores/canvasStore'
import { topicApi } from '@/api'

const props = defineProps({
  topicTitle: { type: String, default: null }
})

const canvasStore = useCanvasStore()
const editorRef = ref(null)
const editorInstance = ref(null)
const topicData = ref(null)
const isLoading = ref(false)

const emit = defineEmits(['change'])

const loadTopicData = async () => {
  if (!props.topicTitle) {
    topicData.value = null
    if (editorInstance.value) {
      editorInstance.value.destroy()
      editorInstance.value = null
    }
    return
  }

  isLoading.value = true
  try {
    // 1. Get summary from API
    const summaryRes = await topicApi.getTopicSummary(props.topicTitle, canvasStore.currentCourse)

    // 2. Get status/sm2 data
    const statusRes = await topicApi.getTopicStatus(props.topicTitle, canvasStore.currentCourse)

    topicData.value = {
      title: props.topicTitle,
      content: summaryRes.data || 'No summary available.',
      status: statusRes.data,
      materials: [] // Can be extended if API supports materials
    }

    initEditor()
  } catch (err) {
    console.error('Failed to load topic data:', err)
    // Fallback if API fails
    const found = canvasStore.topics.find(t => t.title === props.topicTitle)
    topicData.value = found || { title: props.topicTitle, content: 'Error loading content.' }
    initEditor()
  } finally {
    isLoading.value = false
  }
}

watch(() => props.topicTitle, loadTopicData)

/**
 * Custom Editor.js Tool for Materials
 */
class MaterialsTool {
  static get toolbox() {
    return {
      title: 'Materials',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v118c0 19 15 34 34 34h71l36 36 36-36h69c19 0 34-15 34-34v-37z" fill="none" stroke="currentColor" stroke-width="20"/><path d="M93 100h150M93 140h100M93 180h150" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="round"/></svg>',
    }
  }

  constructor({ data, api }) {
    this.api = api
    this.data = {
      summary: data.summary || 'New material summary',
      assets: data.assets || [],
    }
    this.wrapper = undefined
  }

  render() {
    this.wrapper = document.createElement('div')
    this.wrapper.classList.add('topic__materials', 'mt-4', 'mb-4')

    const container = document.createElement('div')
    container.classList.add('material', 'flex', 'flex-row', 'w-full', 'gap-2')

    // Summary Section
    const summaryEl = document.createElement('div')
    summaryEl.classList.add(
      'materials__summary',
      'p-2',
      'bg-amber-50',
      'flex-2',
      'outline-none',
      'rounded-lg',
    )
    summaryEl.contentEditable = true
    summaryEl.innerHTML = this.data.summary
    summaryEl.addEventListener('input', () => {
      this.data.summary = summaryEl.innerHTML
    })

    // Sources Section
    const sourcesEl = document.createElement('div')
    sourcesEl.classList.add('materials__sources', 'flex', 'flex-1', 'flex-col', 'gap-y-2')

    const renderAssets = () => {
      const existingAssets = sourcesEl.querySelectorAll('.source-wrapper')
      existingAssets.forEach((el) => el.remove())

      this.data.assets.forEach((asset, index) => {
        const assetWrapper = document.createElement('div')
        assetWrapper.classList.add('source-wrapper', 'relative', 'group')

        const sourceItem = this.createAssetElement(asset, index)

        const removeBtn = document.createElement('div')
        removeBtn.innerHTML = '<i class="pi pi-times"></i>'
        removeBtn.classList.add(
          'absolute',
          '-right-2',
          '-top-2',
          'bg-red-500',
          'text-white',
          'rounded-full',
          'w-5',
          'h-5',
          'flex',
          'items-center',
          'justify-center',
          'cursor-pointer',
          'opacity-0',
          'group-hover:opacity-100',
          'transition-opacity',
          'text-[10px]',
        )
        removeBtn.addEventListener('click', () => {
          this.data.assets.splice(index, 1)
          renderAssets()
        })

        assetWrapper.appendChild(sourceItem)
        assetWrapper.appendChild(removeBtn)
        sourcesEl.insertBefore(assetWrapper, addAssetBtn)
      })
    }

    const addAssetBtn = document.createElement('button')
    addAssetBtn.innerText = '+ Add Source'
    addAssetBtn.classList.add(
      'text-[0.7rem]',
      'mt-1',
      'text-gray-400',
      'hover:text-gray-600',
      'cursor-pointer',
      'text-left',
      'border',
      'border-dashed',
      'border-gray-300',
      'rounded-lg',
      'p-1',
      'hover:bg-gray-50',
    )
    addAssetBtn.addEventListener('click', () => {
      this.data.assets.push({ title: 'Source Title', link: 'https://' })
      renderAssets()
    })

    sourcesEl.appendChild(addAssetBtn)
    renderAssets()

    container.appendChild(summaryEl)
    container.appendChild(sourcesEl)
    this.wrapper.appendChild(container)

    return this.wrapper
  }

  createAssetElement(asset, index) {
    const source = document.createElement('div')
    source.classList.add('source', 'bg-olive-50', 'rounded-xl', 'pr-4', 'pl-4', 'pt-2', 'pb-2')

    const title = document.createElement('div')
    title.classList.add('source__title', 'text-[0.75rem]', 'outline-none', 'font-medium')
    title.contentEditable = true
    title.innerText = asset.title
    title.addEventListener('input', () => {
      this.data.assets[index].title = title.innerText
    })

    const link = document.createElement('div')
    link.classList.add('source__link', 'text-[0.7rem]', 'outline-none', 'break-all')
    link.style.color = 'var(--color-gray-400)'
    link.contentEditable = true
    link.innerText = asset.link
    link.addEventListener('input', () => {
      this.data.assets[index].link = link.innerText
    })

    source.appendChild(title)
    source.appendChild(link)
    return source
  }

  save() {
    return this.data
  }
}

const initEditor = () => {
  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }

  if (!topicData.value) return

  const blocks = []

  if (topicData.value.content) {
    if (typeof topicData.value.content === 'string') {
      blocks.push({ type: 'paragraph', data: { text: topicData.value.content } })
    } else if (topicData.value.content.blocks) {
      blocks.push(...topicData.value.content.blocks)
    }
  }

  if (topicData.value.materials && topicData.value.materials.length > 0) {
    topicData.value.materials.forEach((material) => {
      blocks.push({
        type: 'materials',
        data: material,
      })
    })
  }

  editorInstance.value = new EditorJS({
    holder: editorRef.value,
    data: { blocks },
    tools: {
      materials: MaterialsTool,
      chat: {
        class: ChatTool,
        config: {
          endpoint: '/api/chat',
          model: 'gpt-4o',
          systemPrompt: 'You are a helpful assistant.',
          getContext: async () => {
            const data = await editorInstance.value.save()
            return data.blocks
              .filter((b) => b.type !== 'chat')
              .map((b) => b.data?.text || b.data?.content || b.data?.summary || '')
              .filter(Boolean)
          },
        },
      },
    },
    onChange: async () => {
      const data = await editorInstance.value.save()
      emit('change', data)
    },
    minHeight: 0,
  })
}

onMounted(() => {
  loadTopicData()
})

onUnmounted(() => {
  if (editorInstance.value && typeof editorInstance.value.destroy === 'function') {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
})
</script>

<template>
  <div class="topic__wrapper relative min-h-[400px]">
    <RuledBg />

    <div v-if="isLoading" class="flex items-center justify-center h-full mt-20">
       <i class="pi pi-spin pi-spinner text-4xl text-indigo-500"></i>
    </div>

    <div v-else-if="topicData" class="topic">
      <div class="topic__heading font-bold text-2xl mb-2">
        <h1>{{ topicData.title }}</h1>
      </div>

      <div class="topic__description">
        <div ref="editorRef"></div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center h-full text-gray-400 mt-20">
      <div class="text-center">
        <i class="pi pi-map text-5xl mb-4"></i>
        <p>Select a topic to view its content</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.topic__wrapper {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 4px 8px rgba(0, 0, 0, 0.06),
    0 12px 24px rgba(0, 0, 0, 0.06),
    0 32px 48px rgba(0, 0, 0, 0.04);
  max-width: var(--max-content-width);
  margin: 24px auto;
  padding: 44px 24px;
  min-width: 1000px;
  border-radius: 12px;
  background: url('/pattern.svg');
}

.topic__heading {
  margin-left: 7em;
}
</style>
