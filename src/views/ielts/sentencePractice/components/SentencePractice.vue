<template>
  <el-dialog
    v-model="visible"
    width="100vw"
    :before-close="handleClose"
    class="sentence-practice-dialog"
    destroy-on-close
    fullscreen
    :show-close="false"
  >
    <template #header>
      <div class="practice-header">
        <span>{{ t('ielts.sentencePractice.practiceTitle') }}</span>
        <el-button
          type="danger"
          text
          class="close-btn"
          @click="handleClose"
        >
          {{ t('ielts.sentencePractice.exitPractice') }}
        </el-button>
      </div>
    </template>

    <!-- 加载状态 -->
    <div
      class="loading-section"
      v-if="isLoadingSentence"
    >
      <div class="loading-content">
        <div class="loading-spinner" />
        <div class="loading-text">
          {{ t('ielts.sentencePractice.loadingContent') }}
        </div>
      </div>
    </div>

    <div
      class="sentence-practice"
      v-else-if="practiceStarted"
    >
      <!-- 句子文本 -->
      <div
        class="text-section"
        v-if="currentSentence"
      >
        <div
          class="sentence-text"
          v-if="!showEvaluation"
        >
          {{ currentSentence.text }}
        </div>
        <!-- 评估结果显示 -->
        <div
          class="sentence-text"
          v-else
        >
          <span
            v-for="(word, index) in evaluatedWords"
            :key="index"
            class="word"
            :class="getWordColorClass(word)"
            @mouseenter="showWordTooltip($event, word)"
            @mouseleave="hideWordTooltip"
          >
            {{ word.text }}
          </span>
        </div>
      </div>

      <!-- 音频播放器 -->
      <AudioWaveform
        ref="audioWaveformRef"
        :audio-url="audioUrl"
        :autoplay="true"
        :clickable="!isRecording && countdown === 0"
        v-show="true"
        style="height: 120px;"
        @ended="handleAudioEnd"
        @manual-click="handleManualClick"
      />

      <!-- 控制区域 -->
      <div class="control-section">
        <!-- 倒计时显示 -->
        <div
          v-if="countdown > 0"
          class="countdown-display"
        >
          <div class="countdown-number">
            {{ countdown }}
          </div>
          <div class="countdown-text">
            {{ t('ielts.sentencePractice.prepareRecording') }}
          </div>
        </div>

        <!-- 录制状态 -->
        <div
          v-else-if="isRecording"
          class="recording-status"
        >
          <div class="recording-indicator">
            <div class="recording-dot" />
            <span class="recording-text">{{ t('ielts.sentencePractice.recording') }}</span>
          </div>
          <div class="recording-time">
            {{ formatTime(recordingTime) }}
          </div>
          <div class="recording-buttons">
            <el-button
              type="success"
              @click="stopRecording"
              text
            >
              {{ t('ielts.sentencePractice.completeRecording') }}
            </el-button>
            <el-button
              type="danger"
              @click="cancelRecording"
              text
            >
              {{ t('ielts.sentencePractice.cancelRecording') }}
            </el-button>
          </div>
        </div>

        <!-- 上传状态 -->
        <div
          v-else-if="isUploading"
          class="uploading-status"
        >
          <div class="uploading-indicator">
            <div class="uploading-spinner" />
            <span class="uploading-text">{{ t('ielts.sentencePractice.evaluating') }}</span>
          </div>
        </div>

        <!-- 录制完成，显示评估按钮 -->
        <div
          v-else-if="recordingCompleted && !showEvaluation"
          class="evaluation-section"
        >
          <el-button
            type="primary"
            @click="submitEvaluation"
            size="large"
            text
          >
            <el-icon style="margin-right: 8px;">
              <TrendCharts />
            </el-icon>
            {{ t('ielts.sentencePractice.startEvaluation') }}
          </el-button>
        </div>

        <!-- 显示重新录制按钮 -->
        <div
          v-else-if="showRetryRecord"
          class="retry-section"
        >
          <div class="retry-buttons">
            <el-button
              type="danger"
              @click="startRecordingCountdown"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <Refresh />
              </el-icon>
              {{ t('ielts.sentencePractice.reRecord') }}
            </el-button>
            <el-button
              type="primary"
              @click="switchSentence"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <Switch />
              </el-icon>
              {{ t('ielts.sentencePractice.switchSentence') }}
            </el-button>
          </div>
        </div>

        <!-- 评估错误状态 -->
        <div
          v-else-if="showEvaluationError"
          class="error-section"
        >
          <div class="error-message">
            <div class="error-icon">
              ⚠️
            </div>
            <div class="error-text">
              {{ evaluationErrorMessage }}
            </div>
          </div>
          <div class="error-buttons">
            <el-button
              type="primary"
              @click="retryEvaluation"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <RefreshRight />
              </el-icon>
              {{ t('ielts.sentencePractice.retryEvaluation') }}
            </el-button>
            <el-button
              type="success"
              @click="switchSentence"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <Switch />
              </el-icon>
              {{ t('ielts.sentencePractice.switchSentence') }}
            </el-button>
          </div>
        </div>

        <!-- 评估完成，显示操作按钮和分数 -->
        <div
          v-else-if="showEvaluation"
          class="result-section"
        >
          <div class="action-buttons">
            <el-button
              type="primary"
              @click="retryPractice"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <Microphone />
              </el-icon>
              {{ t('ielts.sentencePractice.retryPractice') }}
            </el-button>
            <el-button
              type="success"
              @click="switchSentence"
              size="large"
              text
            >
              <el-icon style="margin-right: 8px;">
                <ArrowRight />
              </el-icon>
              {{ t('ielts.sentencePractice.switchAnother') }}
            </el-button>
          </div>

          <div class="scores">
            <div class="score-item">
              <span class="score-label">{{ t('ielts.sentencePractice.averageScore') }}</span>
              <span class="score-value">{{ evaluationData?.suggestedScore?.toFixed(1) || '-' }}</span>
            </div>
            <div class="score-item">
              <span class="score-label">{{ t('ielts.sentencePractice.accuracy') }}</span>
              <span class="score-value">{{ evaluationData?.accuracy === -1 ? '0.0' : (evaluationData?.accuracy?.toFixed(1) || '-') }}%</span>
            </div>
            <div class="score-item">
              <span class="score-label">{{ t('ielts.sentencePractice.fluency') }}</span>
              <span class="score-value">{{ (evaluationData?.fluency * 100)?.toFixed(1) || '-' }}%</span>
            </div>
            <div class="score-item">
              <span class="score-label">{{ t('ielts.sentencePractice.completion') }}</span>
              <span class="score-value">{{ (evaluationData?.completion * 100)?.toFixed(1) || '-' }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 单词提示框 -->
    <div
      v-if="tooltipVisible"
      class="word-tooltip"
      :style="tooltipStyle"
    >
      <div>{{ t('ielts.sentencePractice.accuracy') }}: {{ tooltipData?.accuracy === -1 ? '0.0' : (tooltipData?.accuracy?.toFixed(1) || '-') }}%</div>
      <div>{{ t('ielts.sentencePractice.fluency') }}: {{ (tooltipData?.fluency * 100)?.toFixed(1) || '-' }}%</div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { TrendCharts, Refresh, Switch, RefreshRight, Microphone, ArrowRight } from '@element-plus/icons-vue'
import { getRandomSentenceApi } from '@/api/modules/ielts/sentence'
import { createSentencePracticeApi } from '@/api/modules/ielts/sentencePractice'
import { uploadFile } from '@/api/modules/system/upload'
import AudioWaveform from '@/views/ielts/mockExam/components/AudioWaveform.vue'

const { t } = useI18n()

interface Emits {
  (e: 'practiceClosed'): void
}

const emit = defineEmits<Emits>()

interface SentenceData {
  id: number
  text: string
  audio: string
}

interface WordEvaluation {
  beginTime: number
  endTime: number
  accuracy: number
  fluency: number
  referenceWord: string
  word: string
  matchTag: number
}

interface EvaluationData {
  suggestedScore: number
  accuracy: number
  fluency: number
  completion: number
  words: WordEvaluation[]
}

interface EvaluatedWord {
  text: string
  accuracy: number
  fluency: number
  score: number
}

// 对话框状态
const visible = ref(false)
const practiceStarted = ref(false)
const isLoadingSentence = ref(false)

// 考官和句子数据
const selectedSpeaker = ref<any>(null)
const currentSentence = ref<SentenceData | null | any>(null)
const audioUrl = ref('')

// 录制相关状态
const countdown = ref(0)
const isRecording = ref(false)
const recordingTime = ref(0)
const recordingCompleted = ref(false)
const showRetryRecord = ref(false)
const isUploading = ref(false)
const isCancelled = ref(false) // 标记是否为取消录制
const isManualPlay = ref(false) // 标记是否为手动播放

// 评估相关状态
const showEvaluation = ref(false)
const showEvaluationError = ref(false) // 评估错误状态
const evaluationErrorMessage = ref('') // 错误信息
const evaluationData = ref<EvaluationData | any>(null)
const evaluatedWords = ref<EvaluatedWord[]>([])

// 定时器
const countdownTimer = ref<number | null>(null)
const recordingTimer = ref<number | null>(null)

// 录制相关
const audioChunks = ref<Blob[]>([])

// 音频处理器类型声明
interface AudioProcessor {
  audioContext: AudioContext
  processor: ScriptProcessorNode
  source: MediaStreamAudioSourceNode
  audioChunks: Int16Array[]
}

declare global {
  interface Window {
    sentencePracticeAudioProcessor: AudioProcessor | null
    AudioContext: typeof AudioContext
    webkitAudioContext: typeof AudioContext
  }
}
const stream = ref<MediaStream | null>(null)

// 提示框
const tooltipVisible = ref(false)
const tooltipData = ref<WordEvaluation | any>(null)
const tooltipStyle = ref<any>({})

// 音频组件引用
const audioWaveformRef = ref<any>(null)

// 获取随机句子
const loadRandomSentence = async () => {
  if (!selectedSpeaker.value) return

  isLoadingSentence.value = true

  try {
    const { data } = await getRandomSentenceApi({ speakerId: selectedSpeaker.value.id })
    currentSentence.value = data

    // 处理音频URL
    if (data.audio) {
      audioUrl.value = data.audio
    }
  } catch (error) {
    ElMessage.error(t('ielts.sentencePractice.loadContentFailed'))
    console.error('加载句子失败:', error)
  } finally {
    isLoadingSentence.value = false
  }
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 播放音频
const playAudio = () => {
  if (isRecording.value) {
    ElMessage.warning(t('ielts.sentencePractice.cannotPlayDuringRecording'))
    return
  }

  // 调用AudioWaveform组件的play方法
  if (audioWaveformRef.value) {
    audioWaveformRef.value.play()
  }
}

// 处理手动点击音波
const handleManualClick = () => {
  isManualPlay.value = true
}

// 音频播放结束
const handleAudioEnd = () => {
  if (isRecording.value) return // 录制中不重新开始

  // 只有在非手动播放时才启动录制倒计时
  if (!isManualPlay.value) {
    startRecordingCountdown()
  }

  // 重置手动播放标记
  isManualPlay.value = false
}

// 开始录制倒计时
const startRecordingCountdown = async () => {
  countdown.value = 3
  showRetryRecord.value = false
  recordingCompleted.value = false
  isCancelled.value = false // 重置取消标志

  // 在倒计时期间预先获取麦克风权限
  try {
    if (!stream.value) {
      stream.value = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })
    }
  } catch (error) {
    ElMessage.error(t('ielts.sentencePractice.microphonePermissionFailed'))
    return
  }

  countdownTimer.value = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer.value) {
        clearInterval(countdownTimer.value)
        countdownTimer.value = null
      }
      startRecording()
    }
  }, 1000)
}

// 开始录制
const startRecording = async () => {
  if (!stream.value) {
    ElMessage.error(t('ielts.sentencePractice.microphoneNotReady'))
    return
  }

  // 使用 Web Audio API 处理音频
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(stream.value)

  // 创建音频处理器
  const processor = audioContext.createScriptProcessor(4096, 1, 1)
  const processedAudioChunks: Int16Array[] = []

  processor.onaudioprocess = (event: AudioProcessingEvent) => {
    const inputBuffer = event.inputBuffer.getChannelData(0)
    const inputSampleRate = audioContext.sampleRate
    const outputSampleRate = 16000

    // 重采样到 16kHz
    const resampledData = resample(inputBuffer, inputSampleRate, outputSampleRate)

    // 将 Float32Array 转换为 Int16Array (16-bit PCM)
    const int16Array = new Int16Array(resampledData.length)
    for (let i = 0; i < resampledData.length; i++) {
      const sample = Math.max(-1, Math.min(1, resampledData[i]))
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
    }
    processedAudioChunks.push(int16Array)
  }

  source.connect(processor)
  processor.connect(audioContext.destination)

  // 保存处理器引用用于停止
  window.sentencePracticeAudioProcessor = { audioContext, processor, source, audioChunks: processedAudioChunks }

  audioChunks.value = []
  isRecording.value = true
  recordingTime.value = 0

  // 开始计时
  recordingTimer.value = window.setInterval(() => {
    recordingTime.value++

    // 最大录制时间60秒（1分钟）
    if (recordingTime.value >= 60) {
      stopRecording()
    }
  }, 1000)
}

// 停止录制
const stopRecording = () => {
  if (isRecording.value && window.sentencePracticeAudioProcessor) {
    const { audioContext, processor, source, audioChunks: processedChunks } = window.sentencePracticeAudioProcessor

    // 断开音频连接
    source.disconnect()
    processor.disconnect()
    audioContext.close()

    // 合并所有音频块
    const totalLength = processedChunks.reduce((acc: number, chunk: Int16Array) => acc + chunk.length, 0)
    const result = new Int16Array(totalLength)
    let offset = 0
    for (const chunk of processedChunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    // 创建 WAV 文件
    const wavBlob = createWavFile(result, 16000) // 使用16kHz采样率

    // 模拟原来的 audioChunks 行为，用于后续处理
    audioChunks.value = [wavBlob as Blob]

    // 清理
    window.sentencePracticeAudioProcessor = null
    isRecording.value = false

    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    // 触发录制完成处理
    handleRecordingComplete()
  }
}

// 取消录制
const cancelRecording = () => {
  // 设置取消标志
  isCancelled.value = true

  // 直接停止录制，不触发录制完成处理
  if (isRecording.value && window.sentencePracticeAudioProcessor) {
    const { audioContext, processor, source } = window.sentencePracticeAudioProcessor

    // 断开音频连接
    source.disconnect()
    processor.disconnect()
    audioContext.close()

    // 清理
    window.sentencePracticeAudioProcessor = null
    isRecording.value = false

    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }

  // 清理媒体流
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  // 设置为重新录制状态
  showRetryRecord.value = true
  recordingCompleted.value = false
  audioChunks.value = [] // 清空录制数据
}

// 录制完成处理
const handleRecordingComplete = () => {
  // 如果是取消录制，不执行完成处理
  if (isCancelled.value) {
    isCancelled.value = false // 重置取消标志
    return
  }

  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  // 只有在正常录制完成时才设置为可评估状态
  recordingCompleted.value = true
  showRetryRecord.value = false
}

// 提交评估
const submitEvaluation = async () => {
  if (!currentSentence.value || audioChunks.value.length === 0) {
    ElMessage.error(t('ielts.sentencePractice.recordingDataIncomplete'))
    return
  }

  isUploading.value = true

  try {
    const audioBlob = audioChunks.value[0] // 已经是处理好的WAV Blob
    const file = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })

    const uploadParams = {
      file: file as any,
      dirTag: 'audio'
    }

    const response = await uploadFile(uploadParams)
    const uploadedAudioUrl = response.data.url

    // 提交到评估接口
    const practiceResponse = await createSentencePracticeApi({
      sentenceId: currentSentence.value.id,
      audio: uploadedAudioUrl
    })

    // 处理评估结果
    if (practiceResponse.data.evaluation) {
      evaluationData.value = JSON.parse(practiceResponse.data.evaluation)
      processEvaluationWords()
      showEvaluation.value = true
    } else {
      ElMessage.warning(t('ielts.sentencePractice.evaluationEmpty'))
      showRetryRecord.value = true
      recordingCompleted.value = false
    }
  } catch (error) {
    console.error('评估失败:', error)

    // 设置错误状态
    showEvaluationError.value = true
    evaluationErrorMessage.value = t('ielts.sentencePractice.evaluationServiceUnavailable')
    recordingCompleted.value = false

    // 隐藏其他状态
    showRetryRecord.value = false
    showEvaluation.value = false
  } finally {
    isUploading.value = false
  }
}

// 处理评估单词数据
const processEvaluationWords = () => {
  if (!evaluationData.value || !currentSentence.value) return

  const words = currentSentence.value.text.toLowerCase().split(/\s+/)
  const evaluationWords = evaluationData.value.words

  evaluatedWords.value = words.map((word, index) => {
    // 尝试按索引顺序匹配评估数据中的单词
    let matchedWord = evaluationWords.find(ew =>
      ew.referenceWord.toLowerCase().includes(`${word.toLowerCase()}_${index}`)
    )

    // 如果按索引匹配不到，尝试直接匹配单词
    if (!matchedWord) {
      matchedWord = evaluationWords.find(ew =>
        ew.word.toLowerCase() === word.toLowerCase()
      )
    }

    // 如果还是匹配不到，尝试部分匹配
    if (!matchedWord) {
      matchedWord = evaluationWords.find(ew =>
        ew.referenceWord.toLowerCase().includes(word.toLowerCase()) ||
        word.toLowerCase().includes(ew.word.toLowerCase())
      )
    }

    if (matchedWord) {
      const score = (matchedWord.accuracy + matchedWord.fluency * 100) / 2
      return {
        text: word,
        accuracy: matchedWord.accuracy,
        fluency: matchedWord.fluency,
        score
      }
    }

    return {
      text: word,
      accuracy: 0,
      fluency: 0,
      score: 0
    }
  })
}

// 获取单词颜色类
const getWordColorClass = (word: EvaluatedWord) => {
  if (word.score >= 80) return 'word-excellent'
  if (word.score >= 60) return 'word-good'
  return 'word-poor'
}

// 显示单词提示
const showWordTooltip = (event: MouseEvent, word: EvaluatedWord) => {
  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()

  tooltipData.value = {
    accuracy: word.accuracy,
    fluency: word.fluency,
    beginTime: 0,
    endTime: 0,
    referenceWord: word.text,
    word: word.text,
    matchTag: 0
  }

  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top - 60}px`
  }

  tooltipVisible.value = true
}

// 隐藏单词提示
const hideWordTooltip = () => {
  tooltipVisible.value = false
}

// 重新评估
const retryEvaluation = () => {
  showEvaluationError.value = false
  evaluationErrorMessage.value = ''
  // 直接调用评估方法
  submitEvaluation()
}

// 重新跟读
const retryPractice = () => {
  showEvaluation.value = false
  showEvaluationError.value = false
  evaluationErrorMessage.value = ''
  evaluationData.value = null
  evaluatedWords.value = []
  recordingCompleted.value = false
  audioChunks.value = []

  // 重新播放音频
  if (audioUrl.value) {
    playAudio()
  }
}

// 切换另一句
const switchSentence = async () => {
  showEvaluation.value = false
  showEvaluationError.value = false
  evaluationErrorMessage.value = ''
  evaluationData.value = null
  evaluatedWords.value = []
  recordingCompleted.value = false
  showRetryRecord.value = false
  audioChunks.value = []

  await loadRandomSentence()
}

// 清理定时器
const clearTimers = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

// 清理资源
const cleanup = () => {
  clearTimers()

  if (isRecording.value) {
    stopRecording()
  }

  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  // 清理音频处理器
  if (window.sentencePracticeAudioProcessor) {
    const { audioContext, processor, source } = window.sentencePracticeAudioProcessor
    try {
      source.disconnect()
      processor.disconnect()
      audioContext.close()
    } catch (e: any) {
      // 忽略清理错误
    }
    window.sentencePracticeAudioProcessor = null
  }
}

// 关闭对话框
const handleClose = () => {
  cleanup()

  // 重置所有状态
  practiceStarted.value = false
  isLoadingSentence.value = false
  currentSentence.value = null
  audioUrl.value = ''
  countdown.value = 0
  isRecording.value = false
  recordingTime.value = 0
  recordingCompleted.value = false
  showRetryRecord.value = false
  isUploading.value = false
  showEvaluation.value = false
  showEvaluationError.value = false
  evaluationErrorMessage.value = ''
  evaluationData.value = null
  evaluatedWords.value = []
  isManualPlay.value = false

  visible.value = false

  // 通知父组件练习已关闭
  emit('practiceClosed')
}

// 开始练习
const startPractice = async (speaker: any) => {
  selectedSpeaker.value = speaker
  practiceStarted.value = true

  await loadRandomSentence()
}

// 打开练习
const open = (speaker: any) => {
  visible.value = true
  startPractice(speaker)
}

onUnmounted(() => {
  cleanup()
})

// 创建 WAV 文件
const createWavFile = (samples: Int16Array, sampleRate: number) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  // WAV 文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  // 写入音频数据
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i], true)
    offset += 2
  }

  return new Blob([view], { type: 'audio/wav' })
}

// 重采样函数 - 线性插值法
const resample = (inputBuffer: Float32Array, inputSampleRate: number, outputSampleRate: number) => {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer
  }

  const ratio = inputSampleRate / outputSampleRate
  const outputLength = Math.floor(inputBuffer.length / ratio)
  const output = new Float32Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const position = i * ratio
    const index = Math.floor(position)
    const fraction = position - index

    if (index + 1 < inputBuffer.length) {
      // 线性插值
      output[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction
    } else {
      output[i] = inputBuffer[index]
    }
  }

  return output
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>

.sentence-practice-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .practice-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-btn {
      color: #f56c6c;
    }
  }
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;

  .loading-content {
    text-align: center;

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #409eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .loading-text {
      font-size: 16px;
      color: #606266;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
}

.sentence-practice {
  padding: 8px;
  margin: 0 auto;

  .text-section {
    margin-bottom: 24px;
    padding: 2%;
    background: #f8f9fa;
    border-radius: 12px;

    .sentence-text {
      font-size: 24px;
      line-height: 1.8;
      color: #303133;
      font-weight: 500;
      text-align: center;
      margin: 0;

      .word {
        padding: 1px 2px;
        margin: 0 1px;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.3s;

        &.word-excellent {
          color: #67c23a;
          background: #f0f9ff;
        }

        &.word-good {
          color: #e6a23c;
          background: #fdf6ec;
        }

        &.word-poor {
          color: #f56c6c;
          background: #fef0f0;
        }

        &:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
      }
    }
  }

  .control-section {
    text-align: center;
    margin-top: 5%;

    .countdown-display {
      .countdown-number {
        font-size: 48px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 10px;
        animation: pulse 1s infinite;
      }

      .countdown-text {
        font-size: 18px;
        color: #666;
      }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .recording-status {
      .recording-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 20px;

        .recording-dot {
          width: 12px;
          height: 12px;
          background: #f56c6c;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        .recording-text {
          font-size: 16px;
          color: #f56c6c;
          font-weight: 500;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      }

      .recording-time {
        font-size: 36px;
        font-weight: bold;
        color: #f56c6c;
        margin-bottom: 20px;
      }

      .recording-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
    }

    .uploading-status {
      .uploading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .uploading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #409eff;
          border-top: 2px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .uploading-text {
          font-size: 16px;
          color: #409eff;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      }
    }

    .retry-section {
      margin-top: 8%;
      .retry-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
    }

    .error-section {
      .error-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;

        .error-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .error-text {
          font-size: 16px;
          color: #f56c6c;
          text-align: center;
          line-height: 1.5;
        }
      }

      .error-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
    }

    .result-section {
      .action-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 30px;
      }

      .scores {
        margin-top: 25%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 12px;

        .score-item {
          text-align: center;

          .score-label {
            display: block;
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .score-value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: #303133;
          }
        }
      }
    }
  }
}

.word-tooltip {
  position: fixed;
  background: #303133;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 9999;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #303133;
  }

  div {
    margin: 2px 0;
  }
}

@media screen and (max-width: 768px) {
  .sentence-practice {
    padding: 16px;

    .text-section {
      .sentence-text {
        font-size: 18px;
      }
    }

    .result-section {
      .scores {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;

        .el-button {
          width: 100%;
          max-width: 200px;
        }
      }
    }
  }
}
</style>
