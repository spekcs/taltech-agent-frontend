<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCanvasStore } from '@/stores/canvasStore'
import FileUpload from 'primevue/fileupload'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'

const props = defineProps({
  courseId: { type: [String, Number], default: null },
  courseOptions: { type: Array, default: () => [] },
})

const toast = useToast()
const canvasStore = useCanvasStore()

const selectedFiles = ref([])
const isUploading = ref(false)
const uploadStatus = ref('')
const selectedExistingCourse = ref(props.courseId ? String(props.courseId) : '')
const manualCourse = ref('')

const selectableCourses = computed(() =>
  props.courseOptions.map((course) => ({
    label: course.name,
    value: course.id,
  })),
)

const resolvedCourse = computed(() =>
  String(props.courseId || selectedExistingCourse.value || manualCourse.value || '').trim(),
)

const onSelect = (event) => {
  selectedFiles.value = event.files || []
}

const onError = (error) => {
  toast.add({
    severity: 'error',
    summary: 'Upload failed',
    detail: error?.message || 'Faili üleslaadimine ebaõnnestus.',
    life: 3500,
  })
}

const uploadSingleFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file, file.name)
  formData.append('title', file.name.replace(/\.pdf$/i, ''))
  formData.append('course', resolvedCourse.value)

  const response = await fetch('/api/ingest', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

const uploadFiles = async ({ files }) => {
  if (!resolvedCourse.value) {
    onError(new Error('Vali olemasolev kursus või sisesta uus kursuse nimi.'))
    return
  }

  if (!files?.length) {
    onError(new Error('Vali vähemalt üks PDF fail.'))
    return
  }

  try {
    isUploading.value = true
    let uploaded = 0

    for (const file of files) {
      uploadStatus.value = `Laen üles: ${file.name}`
      await uploadSingleFile(file)
      uploaded += 1
    }

    uploadStatus.value = 'Värskendan teemasid...'
    await canvasStore.loadData(true)
    selectedFiles.value = []
    uploadStatus.value = ''
    manualCourse.value = ''

    toast.add({
      severity: 'success',
      summary: 'Upload complete',
      detail: `${uploaded} faili töödeldi edukalt.`,
      life: 3000,
    })
  } catch (error) {
    onError(error)
  } finally {
    isUploading.value = false
    uploadStatus.value = ''
  }
}
</script>

<template>
  <div class="file-upload-container">
    <Card class="shadow-lg rounded-2xl border-none">
      <template #title>
        <h3 class="text-xl font-bold mb-2">Upload Course Materials</h3>
      </template>
      <template #content>
        <p class="text-gray-500 mb-4 text-sm">
          Lae PDF-id üles olemasoleva kursuse alla või loo uus kursus lihtsalt uue nime sisestamisega.
        </p>

        <div class="upload-fields">
          <div>
            <label class="upload-label">Olemasolev kursus</label>
            <Select
              v-model="selectedExistingCourse"
              :options="selectableCourses"
              optionLabel="label"
              optionValue="value"
              :disabled="Boolean(courseId) || isUploading"
              placeholder="Vali olemasolev kursus"
              class="w-full"
            />
          </div>

          <div>
            <label class="upload-label">Või uus kursuse nimi</label>
            <InputText
              v-model="manualCourse"
              :disabled="Boolean(courseId) || isUploading"
              placeholder="Näiteks Andmestruktuurid"
              class="w-full"
            />
          </div>
        </div>

        <p v-if="isUploading || uploadStatus" class="mb-4 text-sm text-amber-700">
          {{ uploadStatus || 'Töötlen materjale...' }}
        </p>

        <FileUpload
          name="files"
          customUpload
          @uploader="uploadFiles"
          @select="onSelect"
          :multiple="true"
          accept="application/pdf"
          :maxFileSize="20000000"
          :disabled="isUploading"
          class="custom-file-upload"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <i class="pi pi-cloud-upload text-5xl text-gray-300 mb-4"></i>
              <p class="text-gray-400">Lohista PDF-id siia või vali failid.</p>
            </div>
          </template>
        </FileUpload>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.file-upload-container {
  max-width: 600px;
  width: 100%;
}

:deep(.p-card) {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: none;
}

.upload-fields {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

.upload-label {
  display: block;
  margin-bottom: 0.45rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:deep(.p-fileupload) {
  border: none;
}

:deep(.p-fileupload-header) {
  background: transparent;
  padding: 0 0 1rem 0;
  border: none;
  display: flex;
  gap: 0.5rem;
}

:deep(.p-fileupload-content) {
  border: none;
  padding: 0;
}

:deep(.p-button) {
  border-radius: 8px;
  box-shadow: none;
}
</style>
