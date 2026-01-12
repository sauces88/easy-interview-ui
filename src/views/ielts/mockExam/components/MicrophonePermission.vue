<template>
  <div class="microphone-permission">
    <el-button
      :icon="Microphone"
      :class="{ 'granted': microphoneGranted }"
      @click="requestMicrophonePermission"
      :disabled="checking"
      :loading="checking"
      class="mic-button"
      text
    >
      {{ microphoneGranted ? t('ielts.mockExam.micGranted') : t('ielts.mockExam.micRequest') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Microphone } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'permissionChanged', granted: boolean): void
}>()

const microphoneGranted = ref(false)
const checking = ref(false)

// 检查麦克风权限
const checkMicrophonePermission = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    ElMessage.error(t('ielts.mockExam.micNotSupported'))
    return false
  }

  try {
    // 检查权限状态
    const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    if (permission.state === 'granted') {
      microphoneGranted.value = true
      emit('permissionChanged', true)
      return true
    }
    return false
  } catch (error) {
    // 某些浏览器可能不支持 permissions API，直接尝试获取媒体流
    return false
  }
}

// 请求麦克风权限
const requestMicrophonePermission = async () => {
  if (microphoneGranted.value) return

  checking.value = true

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    })

    // 获取成功，立即停止流以释放资源
    stream.getTracks().forEach(track => track.stop())

    microphoneGranted.value = true
    emit('permissionChanged', true)
    ElMessage.success(t('ielts.mockExam.micPermissionSuccess'))
  } catch (error: any) {
    microphoneGranted.value = false
    emit('permissionChanged', false)

    if (error.name === 'NotAllowedError') {
      ElMessage.error(t('ielts.mockExam.micPermissionDenied'))
    } else if (error.name === 'NotFoundError') {
      ElMessage.error(t('ielts.mockExam.micNotFound'))
    } else {
      console.error(error.message)
      ElMessage.error(t('ielts.mockExam.micPermissionFailed'))
    }
  } finally {
    checking.value = false
  }
}

onMounted(() => {
  checkMicrophonePermission()
})

defineExpose({
  checkMicrophonePermission,
  requestMicrophonePermission,
  microphoneGranted
})
</script>

<style scoped lang="scss">
.microphone-permission {
  .mic-button {
    color: var(--el-color-danger);
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      color: var(--el-color-danger);
    }

    &:disabled {
      color: #c0c4cc;
    }

    &.granted {
      color: var(--el-color-success);

      &:hover {
        color: var(--el-color-success);
      }
    }
  }
}
</style>
