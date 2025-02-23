<template>
  <div class="pdf-container">
    <iframe
      v-if="isGoogleDriveUrl"
      :src="googleViewerUrl"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
    <iframe 
      v-else-if="isPdfUrl"
      :src="url"
      frameborder="0"
      width="100%"
      height="100%"
    ></iframe>
    <div v-else class="unsupported-format">
      不支持的文件格式
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  url: string
}>()

const isPdfUrl = computed(() => {
  return props.url.toLowerCase().endsWith('.pdf')
})

const isGoogleDriveUrl = computed(() => {
  return !isPdfUrl.value && props.url.trim() !== ''
})

const googleViewerUrl = computed(() => {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(props.url)}&embedded=true`
})
</script>

<style scoped>
.pdf-container {
  width: 100%;
  height: 100%;
}

.unsupported-format {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}
</style> 