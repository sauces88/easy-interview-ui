<template>
  <div class="chat-list">
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <el-scrollbar class="custom-scrollbar">
        <el-empty v-if="!hasMessage" description="暂无消息"/>

        <div v-else class="message-wrapper">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'message-right': msg.role === 'user' }"
          >
            <div class="message-content">
              {{ msg.content }}
            </div>
            <div class="message-time">
              {{ formatTime(msg.created_at) }}
            </div>
          </div>
          <div v-if="loading" class="loading-wrapper">
            <el-icon class="is-loading"><loading /></el-icon>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          :disabled="disabled || loading"
          placeholder="输入消息内容..."
          @keydown.enter.prevent="handleSend"
        />
        <div class="action-buttons">
          <!-- 录音相关按钮 -->
          <div class="record-controls" v-if="isRecording">
            <span class="recording-time">
              {{ recordingTime }}s / {{ MAX_RECORDING_TIME }}s
            </span>
            <el-button 
              type="danger" 
              circle
              @click="stopRecording"
            >
              <el-icon><CircleClose /></el-icon>
            </el-button>
            <el-button 
              type="success" 
              circle
              @click="confirmRecording"
              :disabled="recordingTime < 1"
            >
              <el-icon><Select /></el-icon>
            </el-button>
          </div>
          <el-button
            v-else
            :class="{ recording: isRecording }"
            @click="startRecording"
            circle
            :disabled="disabled || loading"
          >
            <el-icon><microphone /></el-icon>
          </el-button>

          <el-button
            type="primary"
            @click="handleSend"
            circle
            :disabled="disabled || loading || !inputText.trim()"
          >
            <el-icon><position /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { Loading, Microphone, Position, CircleClose, Select } from '@element-plus/icons-vue'
import type { ICoze } from '@/api/interface/interview/coze'

const props = defineProps<{
  messages: ICoze.MessageResponse[]
  loading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'send-text', content: string): void
  (e: 'send-audio', file: File): void
  (e: 'message-complete'): void
}>()

const messageListRef = ref<HTMLElement>()
const inputText = ref('')
const isRecording = ref(false)
const recordingTime = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordingTimer: number | null = null
let audioBlob: Blob | null = null

// 添加最大录音时长常量（秒）
const MAX_RECORDING_TIME = 120 // 2分钟

// 格式化时间
const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm:ss')
}

// 判断是否有消息
const hasMessage = computed(() => {
  return props.messages && props.messages.length > 0
})

// 滚动到底部
const scrollToBottom = () => {
  if (messageListRef.value) {
    const scrollbar = messageListRef.value.querySelector('.el-scrollbar__wrap')
    if (scrollbar) {
      setTimeout(() => {
        scrollbar.scrollTop = scrollbar.scrollHeight
      }, 100)
    }
  }
}

// 监听消息变化，自动滚动
watch(() => props.messages, () => {
  scrollToBottom()
}, { deep: true })

// 发送文本消息
const handleSend = () => {
  const content = inputText.value.trim()
  if (!content) return

  emit('send-text', content)
  inputText.value = ''
}

// 开始录音
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    })

    audioChunks = []
    mediaRecorder.addEventListener('dataavailable', (event) => {
      audioChunks.push(event.data)
    })

    mediaRecorder.addEventListener('stop', () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      stream.getTracks().forEach(track => track.stop())
    })

    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    
    // 开始计时
    recordingTimer = window.setInterval(() => {
      recordingTime.value++
      // 达到最大时长时自动停止
      if (recordingTime.value >= MAX_RECORDING_TIME) {
        stopRecording()
        ElMessage.warning('录音时长已达到2分钟限制')
      }
    }, 1000)
  } catch (err) {
    console.error('录音失败：', err)
    ElMessage.error('无法访问麦克风')
  }
}

// 停止录音
const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
    // 清理音频数据
    audioBlob = null
    audioChunks = []
    recordingTime.value = 0
  }
}

// 添加音频格式转换函数
const convertToWav = async (blob: Blob): Promise<Blob> => {
  // 创建音频上下文
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000 // 设置采样率为 16000Hz
  })

  // 将 blob 转换为 ArrayBuffer
  const arrayBuffer = await blob.arrayBuffer()
  
  // 解码音频数据
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
  
  // 创建离线音频上下文
  const offlineAudioContext = new OfflineAudioContext({
    numberOfChannels: 1, // 单声道
    length: audioBuffer.duration * 16000,
    sampleRate: 16000
  })

  // 创建音源节点
  const source = offlineAudioContext.createBufferSource()
  source.buffer = audioBuffer
  source.connect(offlineAudioContext.destination)
  source.start()

  // 渲染音频
  const renderedBuffer = await offlineAudioContext.startRendering()

  // 将 AudioBuffer 转换为 WAV 格式
  const wavData = new Int16Array(renderedBuffer.length)
  const channelData = renderedBuffer.getChannelData(0)
  
  // 将浮点数转换为16位整数
  for (let i = 0; i < channelData.length; i++) {
    wavData[i] = Math.max(-1, Math.min(1, channelData[i])) * 0x7FFF
  }

  // 创建 WAV 文件头
  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)
  
  // WAV 文件头格式
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(view, 0, 'RIFF') // RIFF identifier
  view.setUint32(4, 36 + wavData.length * 2, true) // file length
  writeString(view, 8, 'WAVE') // WAVE identifier
  writeString(view, 12, 'fmt ') // fmt chunk
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // audio format (1 for PCM)
  view.setUint16(22, 1, true) // number of channels
  view.setUint32(24, 16000, true) // sample rate
  view.setUint32(28, 16000 * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(view, 36, 'data') // data chunk identifier
  view.setUint32(40, wavData.length * 2, true) // data chunk length

  // 合并文件头和音频数据
  const wavBlob = new Blob([wavHeader, wavData.buffer], { type: 'audio/wav' })
  return wavBlob
}

// 修改确认发送录音函数
const confirmRecording = async () => {
  if (!mediaRecorder || !isRecording.value) return
  
  try {
    // 等待音频数据准备完成
    const audioData = await new Promise<Blob>((resolve) => {
      const handleStop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' })
        resolve(blob)
      }
      mediaRecorder!.addEventListener('stop', handleStop, { once: true })
      mediaRecorder!.stop() // 停止录音
    })

    // 转换为指定格式的 WAV
    const wavBlob = await convertToWav(audioData)
    
    // 创建文件并发送
    const file = new File([wavBlob], 'recording.wav', {
      type: 'audio/wav'
    })
    
    // 清理状态
    isRecording.value = false
    recordingTime.value = 0
    if (recordingTimer) {
      clearInterval(recordingTimer)
      recordingTimer = null
    }
    
    // 发送文件
    emit('send-audio', file)
    
    // 清理数据
    audioBlob = null
    audioChunks = []
  } catch (err) {
    console.error('音频处理失败：', err)
    ElMessage.error('音频处理失败')
  }
}

// 播放音频
const playAudio = (base64Audio: string) => {
  try {
    // 将Base64数据转换为二进制数组
    const byteCharacters = atob(base64Audio)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'audio/mpeg' })

    // 创建对象URL并播放
    const audioUrl = URL.createObjectURL(blob)
    const audio = new Audio(audioUrl)
    audio.play().catch(err => {
      console.error('音频播放失败：', err)
      ElMessage.error('音频播放失败')
    })

    // 播放完成后释放对象URL
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
    }
  } catch (err) {
    console.error('音频处理失败：', err)
    ElMessage.error('音频处理失败')
  }
}

onMounted(() => {
  scrollToBottom()
})

// 组件卸载时清理
onUnmounted(() => {
  if (recordingTimer) {
    clearInterval(recordingTimer)
  }
  stopRecording()
})
</script>

<style scoped lang="scss">
.chat-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;

  .message-list {
    flex: 1;
    overflow: hidden;
    padding: 20px;

    // 隐藏滚动条
    :deep(.custom-scrollbar) {
      // 隐藏 webkit 浏览器的滚动条
      .el-scrollbar__wrap {
        &::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      }

      // 隐藏 element-plus 的滚动条
      .el-scrollbar__bar {
        display: none !important;
      }
    }

    .message-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 70%;

      &.message-right {
        align-self: flex-end;
        align-items: flex-end;

        .message-content {
          background-color: #409eff;
          color: #fff;
          border-radius: 10px 2px 10px 10px;
        }
      }

      .message-content {
        padding: 12px 16px;
        background-color: #fff;
        border-radius: 2px 10px 10px 10px;
        word-break: break-all;
        line-height: 1.5;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .message-time {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
        padding: 0 4px;
      }
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      padding: 20px 0;
    }
  }

  .input-area {
    background-color: #fff;
    border-top: 1px solid #eee;
    padding: 16px;

    .input-wrapper {
      position: relative;

      .el-input {
        :deep(.el-textarea__inner) {
          resize: none;
          border-radius: 8px;
          padding: 8px 12px;
          padding-right: 100px; // 为按钮留出空间
          min-height: 24px;
          max-height: 100px;
          line-height: 1.5;
        }
      }

      .action-buttons {
        position: absolute;
        right: 8px;
        bottom: 8px;
        display: flex;
        gap: 8px;
        align-items: center;

        .record-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          
          .recording-time {
            font-size: 14px;
            color: #666;
            min-width: 40px;
          }
        }

        .el-button {
          font-size: 18px;
          height: 32px;
          width: 32px;
          padding: 0;

          &.recording {
            color: #fff;
            background-color: #f56c6c;
            animation: pulse 1s infinite;
          }

          &.is-disabled {
            background-color: #f5f7fa;
            border-color: #e4e7ed;
            color: #c0c4cc;
          }
        }
      }
    }
  }
}

.action-buttons {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 8px;
  align-items: center;

  .record-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .recording-time {
      font-size: 14px;
      color: #666;
      min-width: 40px;
    }
  }

  .el-button {
    font-size: 18px;
    height: 32px;
    width: 32px;
    padding: 0;

    &.recording {
      color: #fff;
      background-color: #f56c6c;
      animation: pulse 1s infinite;
    }

    &.is-disabled {
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      color: #c0c4cc;
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
</style>
