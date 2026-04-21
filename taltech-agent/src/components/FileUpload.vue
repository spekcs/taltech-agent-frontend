<script setup>
import { ref, watch } from 'vue';
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { courseApi } from '@/api';

const props = defineProps({
  initialCourse: { type: String, default: '' }
});

const toast = useToast();
const title = ref('');
const course = ref(props.initialCourse);
const isUploading = ref(false);

watch(() => props.initialCourse, (newVal) => {
  course.value = newVal;
});

const onUpload = async (event) => {
  if (!title.value || !course.value) {
    toast.add({ severity: 'warn', summary: 'Missing Info', detail: 'Please provide both title and course name', life: 3000 });
    return;
  }

  isUploading.value = true;
  try {
    const file = event.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.value);
    formData.append('course', course.value);

    await courseApi.ingest(formData);
    
    toast.add({ severity: 'success', summary: 'Success', detail: 'File uploaded and ingested successfully', life: 3000 });
    title.value = '';
    // Clear files from component
    event.options.clear();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Upload failed: ' + (error.response?.data?.detail || error.message), life: 3000 });
    console.error('Upload error:', error);
  } finally {
    isUploading.value = false;
  }
};

const onSelect = (event) => {
  if (event.files.length > 0 && !title.value) {
    // Auto-fill title with filename (minus extension)
    const fileName = event.files[0].name;
    title.value = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  }
};
</script>

<template>
  <div class="file-upload-container">
    <Card class="shadow-lg rounded-2xl border-none">
      <template #title>
        <h3 class="text-xl font-bold mb-2">Upload Course Materials</h3>
      </template>
      <template #content>
        <p class="text-gray-500 mb-6 text-sm">
          Select PDF files to add them as materials for the course. These will be automatically processed and categorized.
        </p>

        <div class="flex flex-col gap-4 mb-6">
          <div class="flex flex-col gap-2">
            <label for="course" class="font-bold text-sm">Course Name</label>
            <InputText id="course" v-model="course" placeholder="Enter course name" class="rounded-xl" />
          </div>
          <div class="flex flex-col gap-2">
            <label for="title" class="font-bold text-sm">Material Title</label>
            <InputText id="title" v-model="title" placeholder="Enter material title" class="rounded-xl" />
          </div>
        </div>
        
        <FileUpload 
          mode="advanced"
          customUpload 
          @uploader="onUpload" 
          @select="onSelect"
          :multiple="false" 
          accept="application/pdf" 
          :maxFileSize="10000000"
          :auto="false"
          class="custom-file-upload"
          :disabled="isUploading"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <i class="pi pi-cloud-upload text-5xl text-gray-300 mb-4"></i>
              <p class="text-gray-400">Drag and drop file here to upload.</p>
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
  border-radius: 12px;
}
</style>
