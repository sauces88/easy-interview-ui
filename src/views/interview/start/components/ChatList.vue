<template>
  <div class="chat-list">
    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef">
      <el-scrollbar class="custom-scrollbar">
        <div class="message-wrapper">
          <template v-for="msg in messages" :key="msg.id">
            <div 
              class="message-item"
              :class="{ 'message-right': msg && msg.role === 'user' }"
              v-if="msg && msg.content && msg.content.trim()"
            >
              <div class="message-content">
                <p v-if="msg && msg.role !== 'assistant'">
                  {{ msg.content }}
                </p>
                <v-md-preview v-else :text="msg.content" class="markdown-content" />
              </div>
              <div class="message-time">
                <span>{{ formatTime(msg.created_at) }}</span>
              </div>
            </div>
          </template>
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
          :disabled="disabled || loading || isSendingAudio"
          :placeholder="loading ? t('interview.start.thinking') : isSendingAudio ? t('interview.start.sendingVoiceMessage') : t('interview.start.inputPlaceholder')"
          @keydown.enter.prevent="handleSend"
          :class="{ 'input-loading': loading || isSendingAudio }"
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
            :disabled="disabled || loading || isSendingAudio"
          >
            <el-icon><microphone /></el-icon>
          </el-button>

          <el-button
            type="primary"
            @click="handleSend"
            circle
            :disabled="disabled || loading || isSendingAudio || !inputText.trim()"
          >
            <el-icon v-if="loading"><loading /></el-icon>
            <el-icon v-else><position /></el-icon>
          </el-button>

          <!-- 加载状态指示器 -->
          <div
            v-if="loading || isSendingAudio"
            class="input-loading-indicator"
            :class="{ 'voice-sending': isSendingAudio }"
          >
            <el-icon class="is-loading"><loading /></el-icon>
            <span>{{ isSendingAudio ? t('interview.start.sendingVoiceMessage') : t('interview.start.thinking') }}</span>
          </div>
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
import { useI18n } from 'vue-i18n'
// 引入v-md-preview组件
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'

const { t } = useI18n()

const props = defineProps<{
  messages: ICoze.MessageResponse[]
  loading: boolean
  disabled: boolean
}>()

const emit = defineEmits<{
  (e: 'send-text', content: string): void
  (e: 'send-audio', file: File): void
  (e: 'message-complete'): void
  (e: 'audio-send-complete', success: boolean): void
  (e: 'reset-audio'): void
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

// 添加一个发送状态的 ref
const isSendingAudio = ref(false)

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return ''
  
  try {
    // 将字符串时间戳转为数字并乘以1000转换为毫秒
    const timestamp = parseInt(time) * 1000
    return isNaN(timestamp) ? '' : dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
  } catch (err) {
    console.error('格式化时间错误:', err)
    return ''
  }
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
    // 告知父组件在录音前重置音频播放
    emit('reset-audio')

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
    // 设置发送状态为 true
    isSendingAudio.value = true

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
    // 发送完成事件（失败）
    emit('audio-send-complete', false)
  }
}

// 添加一个方法来重置发送状态
const resetSendingState = () => {
  isSendingAudio.value = false
}

// 添加一个新方法来触发消息发送
const triggerSend = (text: string) => {
  inputText.value = text
  handleSend()
}

// 对外暴露方法
defineExpose({
  resetSendingState,
  triggerSend
})

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
    padding: 15px 10px;

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
      max-width: 100%;
    }

    .message-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 95%;

      // 特别为AI回复设置宽度
      &:not(.message-right) {
        min-width: 95%; // AI回复最小占据75%宽度
      }

      &.message-right {
        align-self: flex-end;
        align-items: flex-end;
        // 完全重写用户消息宽度计算
        width: auto;
        min-width: min-content;
        max-width: 85%; // 最大不超过85%
        margin-left: auto; // 确保消息靠右对齐

        .message-content {
          background-color: #409eff;
          color: #fff;
          border-radius: 10px 2px 10px 10px;
          display: inline-block;
          padding: 8px 12px;
          text-align: left;
          width: auto; // 宽度自适应内容

          p {
            margin: 0;
            word-break: break-word;
            display: inline; // 使段落成为内联元素，消除多余空隙
            white-space: pre-wrap; // 保留空格和换行
          }
        }
      }

      .message-content {
        //padding: 8px 12px;
        padding: 1px 1px;
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        width: 100%; // 确保内容宽度占满容器

        p {
          margin: 0;
          white-space: pre-wrap; // 保留空格和换行，但允许文本自动换行
          word-break: break-word; // 更友好的断词方式
          line-height: 1.5;
          // 特别处理中文单字
          &:lang(zh) {
            &:only-child {
              padding: 0 2px; // 为单个中文字符增加额外的内边距
            }
          }
        }
        
        // 直接调整Markdown内容的样式
        :deep(.markdown-content) {
          margin: -8px -12px; // 抵消父元素的内边距
          padding: 2px 2px;
        }
      }

      .message-time {
        font-size: 12px;
        color: #999;
        margin-top: 8px;
        display: flex !important;
        white-space: nowrap !important;
        width: auto !important;
        padding: 2px 8px !important;
        margin: 8px 0 !important;
        justify-content: flex-end !important;
        align-items: center !important;

        // 时间文本样式
        > span:first-child {
          margin-right: 10px !important;
        }

        // 测试按钮样式
        button.测试, .测试 {
          display: inline-block !important;
          padding: 8px 16px !important;
          min-width: 60px !important;
          max-width: fit-content !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          font-size: 14px !important;
          text-align: center !important;
          cursor: pointer !important;
          background-color: #409eff !important;
          color: white !important;
          border-radius: 4px !important;
          border: none !important;
          box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
          margin: 0 0 0 10px !important;
          float: right !important;
          clear: both !important;
          position: relative !important;

          // 单个字符按钮优化
          &.测试 {
            margin: 0;
            text-align: center;
          }
        }
      }
    }
  }

  .input-area {
    background-color: #fff;
    border-top: 1px solid #eee;
    position: relative;
    bottom: 0;
    padding-left: 0%;
    padding-right: 0%;
    padding-top: 1%;
    padding-bottom: 0%;

    .input-wrapper {
      position: relative;

      :deep(.el-textarea) {
        width: 100%;

        .el-textarea__inner {
          resize: none;
          border-radius: 8px;
          padding: 12px 16px;
          padding-right: 100px;
          height: 150px !important; //用来调整文本域高度
          min-height: 80px !important;
          max-height: 200px;
          line-height: 1.5;
          overflow-y: auto;
          font-size: 14px;
        }
      }

      .action-buttons {
        z-index: 1;
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

        // 输入框加载指示器样式
        .input-loading-indicator {
          display: flex;
          align-items: center;
          background-color: #ecf5ff;
          border-radius: 15px;
          padding: 8px 15px;
          gap: 8px;
          border: 1px solid #d9ecff;
          animation: pulse-border 2s infinite;
          box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);

          &.voice-sending {
            background-color: #f0f9eb;
            border-color: #e1f3d8;
            box-shadow: 0 0 10px rgba(103, 194, 58, 0.3);
            animation: voice-pulse-border 2s infinite;

            .el-icon {
              color: #67c23a;
            }

            span {
              color: #67c23a;
            }
          }

          .el-icon {
            color: #409eff;
            font-size: 18px;
            animation: spin 1.2s linear infinite;
          }

          span {
            font-size: 15px;
            color: #409eff;
            white-space: nowrap;
            font-weight: 600;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes input-loading-pulse {
  0%, 100% {
    border-color: #dcdfe6;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    background-color: #f8f9fa;
  }
  50% {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
    background-color: #ecf5ff;
  }
}

@keyframes pulse-border {
  0%, 100% {
    border-color: #d9ecff;
    box-shadow: 0 0 5px rgba(64, 158, 255, 0.2);
  }
  50% {
    border-color: #409eff;
    box-shadow: 0 0 10px rgba(64, 158, 255, 0.4);
  }
}

@keyframes voice-pulse-border {
  0%, 100% {
    border-color: #e1f3d8;
    box-shadow: 0 0 5px rgba(103, 194, 58, 0.2);
  }
  50% {
    border-color: #67c23a;
    box-shadow: 0 0 10px rgba(103, 194, 58, 0.4);
  }
}

// 添加Markdown样式
:deep(.markdown-content) {
  background: transparent;
  border: none;
  padding: 0;
  width: 100%; // 确保占满整个容器
  
  .v-md-pre-wrapper {
    margin: 0;
  }
  
  .v-md-pre-wrapper pre {
    margin: 10px 0;
    border-radius: 6px;
    padding: 12px;
    font-size: 14px;
    overflow-x: auto; // 添加水平滚动条
    max-width: 100%; // 确保不会溢出
    background-color: #f8f8f8; // 浅色背景
  }
  
  p, ul, ol {
    margin-bottom: 10px;
    line-height: 1.6;
  }
  
  ul, ol {
    padding-left: 20px;
  }
  
  code {
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    padding: 2px 4px;
    font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; // 使用等宽字体
  }
  
  blockquote {
    padding: 10px 15px;
    border-left: 4px solid #dfe2e5;
    color: #666;
    margin: 10px 0;
    background-color: #f8f8f8;
  }
  
  a {
    color: #409eff;
  }
  
  table {
    border-collapse: collapse;
    margin: 10px 0;
    width: 100%;
    
    th, td {
      border: 1px solid #eee;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #f5f7fa;
    }
  }
  
  // 添加列表项间距
  li {
    margin-bottom: 4px;
  }
  
  // 优化标题样式
  h1, h2, h3, h4, h5, h6 {
    margin-top: 16px;
    margin-bottom: 12px;
    font-weight: 600;
  }
}
</style>
