<script setup>
import { ref } from 'vue';
import FileUpload from 'primevue/fileupload';
import Card from 'primevue/card';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  courseId: { type: [String, Number], default: null }
});

const toast = useToast();

const onUpload = () => {
  toast.add({ severity: 'success', summary: 'Success', detail: 'File uploaded successfully', life: 3000 });
  console.log('File uploaded successfully');
};

const onSelect = (event) => {
  console.log('Files selected:', event.files);
};

const onError = (event) => {
  toast.add({ severity: 'error', summary: 'Error', detail: 'Upload failed', life: 3000 });
  console.error('Upload error:', event.error);
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
        
        <FileUpload 
          name="demo[]" 
          url="/api/upload" 
          @upload="onUpload" 
          @select="onSelect"
          @error="onError"
          :multiple="true" 
          accept="application/pdf" 
          :maxFileSize="10000000"
          class="custom-file-upload"
        >
          <template #empty>
            <div class="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
              <i class="pi pi-cloud-upload text-5xl text-gray-300 mb-4"></i>
              <p class="text-gray-400">Drag and drop files here to upload.</p>
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
