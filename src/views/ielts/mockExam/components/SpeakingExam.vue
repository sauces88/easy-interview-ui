<template>
  <el-dialog
    v-model="visible"
    width="100vw"
    :before-close="handleClose"
    class="speaking-exam-dialog"
    destroy-on-close
    fullscreen
    :show-close="false"
  >
    <template #header>
      <div class="exam-header">
        <span v-if="currentPart">{{ t('ielts.mockExam.speakingExam.title') }} - {{ currentPart }}</span>
        <span v-else>{{ t('ielts.mockExam.speakingExam.title') }}</span>
        <el-button
          type="danger"
          text
          class="close-btn"
          @click="handleClose"
        >
          {{ t('ielts.mockExam.speakingExam.exitExam') }}
        </el-button>
      </div>
    </template>

    <div
      class="speaking-exam"
      v-if="examStarted"
    >
      <!-- 题目区域 -->
      <div
        class="question-section"
        v-if="currentQuestion"
        v-show="!examFinished"
      >
        <div class="question-header">
          <el-button
            :icon="isCollapsed ? View : Hide"
            text
            class="collapse-btn"
            @click="toggleCollapse"
          />
          <div
            class="question-text"
            :class="{ 'blur-content': isCollapsed }"
          >
            {{ currentQuestion.text }}
          </div>
        </div>

        <div
          v-if="currentQuestion.tips"
          class="question-tips"
          :class="{ 'blur-content': isCollapsed }"
        >
          <el-icon class="tips-icon">
            <InfoFilled />
          </el-icon>
          <div class="tips-content">
            <div
              class="tips-text"
              v-html="currentQuestion.tips?.replace(/\n/g, '<br>')"
            />
          </div>
        </div>
      </div>

      <!-- 音频播放器 -->
      <AudioWaveform
        :audio-url="audioUrl"
        :autoplay="true"
        :clickable="false"
        v-show="!examFinished"
        @ended="handleAudioEnd"
      />

      <!-- 录制控制区域 -->
      <div class="recording-section">
        <div class="recording-controls">
          <!-- 思考倒计时显示 (Part2) -->
          <div
            v-if="thinkingTime > 0"
            class="thinking-display"
          >
            <div class="thinking-number">
              {{ formatTime(thinkingTime) }}
            </div>
            <div class="thinking-text">
              {{ t('ielts.mockExam.speakingExam.thinkingTime') }}
            </div>
          </div>

          <!-- 录制倒计时显示 -->
          <div
            v-else-if="countdown > 0"
            class="countdown-display"
          >
            <div class="countdown-number">
              {{ countdown }}
            </div>
            <div class="countdown-text">
              {{ t('ielts.mockExam.speakingExam.prepareRecording') }}
            </div>
          </div>

          <!-- 录制中状态 -->
          <div
            v-else-if="isRecording"
            class="recording-status"
          >
            <div class="recording-indicator">
              <div class="recording-dot" />
              <span class="recording-text">{{ t('ielts.mockExam.speakingExam.recording') }}</span>
            </div>
            <div class="recording-time">
              {{ formatTime(getMaxRecordingTime() - recordingTime) }}
            </div>

            <el-button
              type="danger"
              :icon="VideoPause"
              @click="stopRecording"
              class="stop-btn"
            >
              {{ t('ielts.mockExam.speakingExam.stopRecording') }}
            </el-button>
          </div>

          <!-- 录制完成状态（上传中）-->
          <div
            v-else-if="isUploading"
            class="uploading-status"
          >
            <div class="uploading-indicator">
              <div class="uploading-spinner" />
              <span class="uploading-text">{{ t('ielts.mockExam.speakingExam.uploadingAudio') }}</span>
            </div>
          </div>

          <!-- 等待回复状态 -->
          <div
            v-else-if="waitingResponse"
            class="waiting-status"
          >
            <div class="waiting-indicator">
              <div class="waiting-spinner" />
              <span class="waiting-text">{{ isFirstMessage ? t('ielts.mockExam.speakingExam.initializing') : t('ielts.mockExam.speakingExam.submitting') }}</span>
            </div>
          </div>

          <!-- 等待评分状态 -->
          <div
            v-else-if="waitingEvaluation"
            class="waiting-evaluation"
          >
            <div class="waiting-indicator">
              <div class="waiting-spinner" />
              <span class="waiting-text">{{ t('ielts.mockExam.speakingExam.evaluating') }}</span>
            </div>
          </div>

          <!-- 评分错误状态 -->
          <div
            v-else-if="evaluationError"
            class="evaluation-error"
          >
            <div class="error-content">
              <el-icon class="error-icon">
                <WarningFilled />
              </el-icon>
              <p class="error-message">
                {{ evaluationError }}
              </p>
              <div class="error-actions">
                <el-button
                  type="primary"
                  @click="retryGenerateReport"
                  text
                >
                  {{ t('ielts.mockExam.speakingExam.retryGenerate') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="errorMessage"
            class="error-status"
          >
            <div class="error-content">
              <el-icon class="error-icon">
                <WarningFilled />
              </el-icon>
              <p class="error-message">
                {{ errorMessage }}
              </p>
              <div
                class="error-actions"
                v-if="!finishFlag"
              >
                <el-button
                  type="primary"
                  text
                  @click="retryRecording"
                >
                  {{ t('ielts.mockExam.speakingExam.retryAnswer') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 考试结束状态 -->
          <div
            v-else-if="examFinished"
            class="exam-finished"
          >
            <div class="finished-header">
              <el-icon class="success-icon-large">
                <SuccessFilled />
              </el-icon>
              <span class="finished-title">{{ t('ielts.mockExam.speakingExam.examCompleted') }}</span>
            </div>

            <!-- 评分和点评展示 -->
            <ExamResults
              :evaluation-result="evaluationResult"
              :evaluation-comment="evaluationComment"
            />

            <el-button
              type="primary"
              @click="handleClose"
              style="margin-top: 20px;"
              text
            >
              {{ t('ielts.mockExam.speakingExam.close') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSocketStore } from '@/stores/modules/socket'
import { uploadFile } from '@/api/modules/system/upload'
import { getQuizDetailApi } from '@/api/modules/ielts/quiz'
import { retryGenerateEvaluation } from '@/api/modules/ielts/mockExam'
import mittBus from '@/utils/mittBus'
import { IELTS_MOCK_CHANNEL } from '@/config/consts'
import {
  View,
  Hide,
  InfoFilled,
  VideoPause,
  WarningFilled,
  SuccessFilled
} from '@element-plus/icons-vue'
import AudioWaveform from './AudioWaveform.vue'
import ExamResults from './ExamResults.vue'

const { t } = useI18n()

interface QuizDetail {
  id: number
  text: string
  tips?: string
  part: string
  audio?: string
}

interface MockExamDetail {
  id: number
  quizId: number
  extra?: string
}

// 对话框状态
const visible = ref(false)
const examStarted = ref(false)
const currentPart = ref('')
const isCollapsed = ref(true) // 默认模糊显示

// Socket 相关
const socketStore = useSocketStore()

// 考试数据
const selectedSpeaker = ref<any>(null)
const extraData = ref<any>(null)
const mockExamId = ref<number | null>(null)
const mockExamDetailList = ref<MockExamDetail[]>([])
const currentQuestionIndex = ref(0)
const currentQuestion = ref<QuizDetail | null | any>(null)

// 音频相关
const audioUrl = ref('')
const extraAudioUrl = ref('') // Part2 额外音频
const currentAudioBase64 = ref('') // 记录当前音频的base64，用于判断是否是新音频
const currentExtraAudioBase64 = ref('') // 记录当前额外音频的base64

// 录制相关状态
const countdown = ref(0)
const thinkingTime = ref(0) // Part2 思考时间
const isRecording = ref(false)
const recordingTime = ref(0)
const isUploading = ref(false)
const waitingResponse = ref(false)
const isFirstMessage = ref(true) // 是否是第一次发送消息

// 定时器
const countdownTimer = ref<number | null>(null)
const thinkingTimer = ref<number | null>(null)
const recordingTimer = ref<number | null>(null)

// 媒体录制相关
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const stream = ref<MediaStream | null>(null)

// 音频处理器类型声明
interface AudioProcessor {
  audioContext: AudioContext
  processor: ScriptProcessorNode
  source: MediaStreamAudioSourceNode
  audioChunks: Int16Array[]
}

declare global {
  interface Window {
    speakingExamAudioProcessor: AudioProcessor | null
    AudioContext: typeof AudioContext
    webkitAudioContext: typeof AudioContext
  }
}

// 错误和完成状态
const errorMessage = ref('')
const finishFlag = ref(false)
const examFinished = ref(false)
const evaluationResult = ref<any>(null)
const evaluationComment = ref<any>(null)

// 最后一题状态管理
const isLastQuestion = ref(false)
const waitingEvaluation = ref(false)
const evaluationError = ref('')

// 当前题目ID
const currentMockExamDetailId = ref<number | null>(null)

// 获取最大录制时间（秒）
const getMaxRecordingTime = () => {
  return currentPart.value === 'Part2' ? 120 : 60
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 请求麦克风权限
const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    return true
  } catch (error) {
    ElMessage.error(t('ielts.mockExam.speakingExam.microphonePermissionFailed'))
    return false
  }
}

// 开始倒计时
const startCountdown = async () => {
  if (!await requestMicrophonePermission()) {
    return
  }

  countdown.value = 3
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

// 开始思考时间 (Part2)
const startThinkingTime = () => {
  thinkingTime.value = 60 // 1分钟思考时间
  thinkingTimer.value = window.setInterval(() => {
    thinkingTime.value--
    if (thinkingTime.value <= 0) {
      if (thinkingTimer.value) {
        clearInterval(thinkingTimer.value)
        thinkingTimer.value = null
      }
      // 思考时间结束后播放额外音频
      if (extraAudioUrl.value) {
        playExtraAudio()
      } else {
        startCountdown() // 如果没有额外音频，直接开始录制倒计时
      }
    }
  }, 1000)
}

// 播放Part2额外音频
const playExtraAudio = () => {
  if (extraAudioUrl.value) {
    audioUrl.value = extraAudioUrl.value
    // 音频播放完后会触发 handleAudioEnd，然后开始录制倒计时
  }
}

// 开始录制
const startRecording = async () => {
  if (!stream.value) {
    if (!await requestMicrophonePermission()) {
      return
    }
  }

  // 使用 Web Audio API 处理音频
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const source = audioContext.createMediaStreamSource(stream.value!)

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
  window.speakingExamAudioProcessor = { audioContext, processor, source, audioChunks: processedAudioChunks }

  audioChunks.value = []
  isRecording.value = true
  recordingTime.value = 0

  // 开始计时
  recordingTimer.value = window.setInterval(() => {
    recordingTime.value++

    // 达到最大录制时间自动停止
    if (recordingTime.value >= getMaxRecordingTime()) {
      stopRecording()
    }
  }, 1000)
}

// 停止录制
const stopRecording = () => {
  if (isRecording.value && window.speakingExamAudioProcessor) {
    const { audioContext, processor, source, audioChunks: processedChunks } = window.speakingExamAudioProcessor

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
    window.speakingExamAudioProcessor = null
    isRecording.value = false

    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }

    // 触发录制完成处理
    handleRecordingComplete()
  }
}

// 录制完成处理
const handleRecordingComplete = async () => {
  // 如果正在退出考试过程中，不处理录音完成
  if (!examStarted.value) {
    return
  }

  const audioBlob = audioChunks.value[0] // 已经是处理好的WAV Blob

  // 上传音频
  isUploading.value = true

  try {
    const file = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })

    const uploadParams = {
      file: file as any,
      dirTag: 'audio'
    }

    const response = await uploadFile(uploadParams)
    const uploadedAudioUrl = response.data.url

    // 发送消息到后端
    const message = {
      mockExamDetailId: currentMockExamDetailId.value,
      speakerId: selectedSpeaker.value?.id,
      audioUrl: uploadedAudioUrl
    }

    socketStore.send(message, IELTS_MOCK_CHANNEL)
    waitingResponse.value = true
    isFirstMessage.value = false // 不是第一次发送消息了

  } catch (error) {
    ElMessage.error(t('ielts.mockExam.speakingExam.audioUploadFailed'))
  } finally {
    isUploading.value = false
  }
}

// 重新录制
const retryRecording = () => {
  errorMessage.value = ''
  finishFlag.value = false
  startCountdown()
}

// 重新生成评分、评价报告
const retryGenerateReport = async () => {
  if (!mockExamId.value) {
    ElMessage.error(t('ielts.mockExam.speakingExam.cannotGetExamId'))
    return
  }

  evaluationError.value = ''
  waitingEvaluation.value = true

  try {
    const response = await retryGenerateEvaluation({ id: mockExamId.value })

    // 重新生成成功，显示结果
    examFinished.value = true
    waitingEvaluation.value = false

    if (response.data) {
      evaluationResult.value = response.data.evaluation
      evaluationComment.value = response.data.comment
    }
  } catch (error) {
    waitingEvaluation.value = false
    evaluationError.value = t('ielts.mockExam.speakingExam.retryGenerateFailed')
  }
}

// 音频播放结束
const handleAudioEnd = () => {
  // 如果是最后一题的第一条消息播放完毕，显示等待评分状态
  if (isLastQuestion.value && !waitingEvaluation.value) {
    waitingEvaluation.value = true
    return
  }

  if (currentPart.value === 'Part2' && thinkingTime.value === 0 && !isRecording.value) {
    // Part2 播放完题目音频后开始思考时间
    if (audioUrl.value === extraAudioUrl.value) {
      // 如果是播放完额外音频，开始录制倒计时
      startCountdown()
    } else {
      // 如果是播放完题目音频，开始思考时间
      startThinkingTime()
    }
  } else if (thinkingTime.value === 0) {
    // 其他情况播放完音频后开始录制倒计时
    startCountdown()
  }
}

// 收起/展开题目
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 处理socket消息
const handleSocketMessage = async (data: string) => {
  const message = JSON.parse(data)
  const {
    mockExamDetailId,
    finishFlag: finish,
    audioBase64,
    extraAudioBase64,
    extraData: extra,
    error
  } = message

  waitingResponse.value = false

  // 检查是否异常结束考试
  if (finish) {
    finishFlag.value = true
    if (error) {
      // 异常结束且有错误信息
      errorMessage.value = error
      examFinished.value = false
    } else {
      // 正常结束，但可能是因为回答过于简单等原因提前结束
      examFinished.value = true
    }
    return
  }

  // 检查错误 - 但不要在这里return，因为需要继续处理具体的错误类型
  if (error) {
    // 先不设置errorMessage，让后面的具体逻辑处理
  }

  // 处理音频
  if (audioBase64) {
    // 只有当音频内容真正变化时才创建新的blob URL
    if (audioBase64 !== currentAudioBase64.value) {
      // 清理旧的URL
      if (audioUrl.value) {
        URL.revokeObjectURL(audioUrl.value)
      }

      const byteCharacters = atob(audioBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'audio/mpeg' })
      audioUrl.value = URL.createObjectURL(blob)
      currentAudioBase64.value = audioBase64
    }
  }

  // 处理Part2额外音频
  if (extraAudioBase64) {
    // 只有当音频内容真正变化时才创建新的blob URL
    if (extraAudioBase64 !== currentExtraAudioBase64.value) {
      // 清理旧的URL
      if (extraAudioUrl.value) {
        URL.revokeObjectURL(extraAudioUrl.value)
      }

      const byteCharacters = atob(extraAudioBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'audio/mpeg' })
      extraAudioUrl.value = URL.createObjectURL(blob)
      currentExtraAudioBase64.value = extraAudioBase64
    }
  }

  // 初次进入考试
  if (extra && !extraData.value) {
    extraData.value = extra
    mockExamDetailList.value = extra.mockExamDetailList || []
    mockExamId.value = extra.id || null

    // 获取第一题详情
    if (mockExamDetailList.value.length > 0) {
      const firstQuestion = mockExamDetailList.value[0]
      currentMockExamDetailId.value = firstQuestion.id

      const response = await getQuizDetailApi({ id: firstQuestion.quizId })
      currentQuestion.value = response.data

      // 设置当前Part
      if (response.data.part === '2001001') {
        currentPart.value = 'Part1'
      } else if (response.data.part === '2001002') {
        currentPart.value = 'Part2'
      }
    }
    return
  }

  // 检查是否为最后一题
  if (!mockExamDetailId) {
    if (!isLastQuestion.value) {
      // 如果有错误且不是最后一题的第二条消息，直接处理错误
      if (error) {
        errorMessage.value = error
        waitingResponse.value = false
        waitingEvaluation.value = false
        isUploading.value = false
        isRecording.value = false
        return
      }
      // 第一条消息：播放音频，然后显示loading
      isLastQuestion.value = true
      // 音频播放完后会自动显示loading状态
    } else {
      // 第二条消息：显示评分结果
      waitingEvaluation.value = false
      if (error) {
        evaluationError.value = error
        // 确保其他状态被清理
        examFinished.value = false
        errorMessage.value = ''
      } else {
        examFinished.value = true
        evaluationError.value = ''
        if (extra) {
          evaluationResult.value = extra.evaluation
          evaluationComment.value = extra.comment
        }
      }
    }
    return
  }

  // Part3的额外题目
  if (extra && Array.isArray(extra)) {
    mockExamDetailList.value.push(...extra)
    currentPart.value = 'Part3'
  }

  // 处理题目跳转
  if (mockExamDetailId !== currentMockExamDetailId.value) {
    // 跳转到下一题
    const nextQuestionIndex = mockExamDetailList.value.findIndex(q => q.id === mockExamDetailId)
    if (nextQuestionIndex !== -1) {
      currentQuestionIndex.value = nextQuestionIndex
      currentMockExamDetailId.value = mockExamDetailId

      const nextQuestion = mockExamDetailList.value[nextQuestionIndex]

      if (currentPart.value === 'Part3' && nextQuestion.extra) {
        // Part3 extra字段直接是题目文本
        currentQuestion.value = {
          text: nextQuestion.extra,
          id: nextQuestion.id
        }
      } else {
        // 其他情况调用API获取题目详情
        const response = await getQuizDetailApi({ id: nextQuestion.quizId })
        currentQuestion.value = response.data

        if (response.data.part === '2001002') {
          currentPart.value = 'Part2'
        }
      }

      // 重置为模糊状态
      isCollapsed.value = true

      // 强制触发响应式更新
    }
  }

  // 最后检查是否有未处理的错误
  if (error && !evaluationError.value && !errorMessage.value) {
    errorMessage.value = error
    // 确保其他状态不会阻止错误显示
    waitingResponse.value = false
    waitingEvaluation.value = false
    isUploading.value = false
    isRecording.value = false
  }
}

// 开始考试
const startExam = (speaker: any) => {
  // 先清理之前的所有状态
  currentPart.value = ''
  isCollapsed.value = true
  extraData.value = null
  mockExamId.value = null
  mockExamDetailList.value = []
  currentQuestionIndex.value = 0
  currentQuestion.value = null
  audioUrl.value = ''
  extraAudioUrl.value = ''
  currentAudioBase64.value = ''
  currentExtraAudioBase64.value = ''
  countdown.value = 0
  thinkingTime.value = 0
  isRecording.value = false
  recordingTime.value = 0
  isUploading.value = false
  waitingResponse.value = false
  errorMessage.value = ''
  finishFlag.value = false
  examFinished.value = false
  evaluationResult.value = null
  evaluationComment.value = ''
  currentMockExamDetailId.value = null
  isLastQuestion.value = false
  waitingEvaluation.value = false
  evaluationError.value = ''

  // 设置新考试状态
  selectedSpeaker.value = speaker
  examStarted.value = true
  isFirstMessage.value = true

  // 发送初始消息
  const message = {
    mockExamDetailId: null,
    speakerId: speaker.id,
    audioUrl: null
  }

  socketStore.send(message, IELTS_MOCK_CHANNEL)
  waitingResponse.value = true
}

// 清理定时器
const clearTimers = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  if (thinkingTimer.value) {
    clearInterval(thinkingTimer.value)
    thinkingTimer.value = null
  }
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
}

// 清理资源
const cleanup = () => {
  clearTimers()

  // 停止录制
  if (isRecording.value) {
    stopRecording()
  }

  // 清理媒体流
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  // 清理音频URL
  if (audioUrl.value) {
    URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = ''
  }
  if (extraAudioUrl.value) {
    URL.revokeObjectURL(extraAudioUrl.value)
    extraAudioUrl.value = ''
  }

  // 清理音频处理器
  if (window.speakingExamAudioProcessor) {
    const { audioContext, processor, source } = window.speakingExamAudioProcessor
    try {
      source.disconnect()
      processor.disconnect()
      audioContext.close()
    } catch (e: any) {
      // 忽略清理错误
    }
    window.speakingExamAudioProcessor = null
  }
}

// 关闭对话框
const handleClose = async () => {
  if (examStarted.value && !examFinished.value) {
    try {
      await ElMessageBox.confirm(
        t('ielts.mockExam.speakingExam.exitConfirm'),
        t('ielts.mockExam.speakingExam.exitConfirmTitle'),
        {
          confirmButtonText: t('ielts.mockExam.speakingExam.confirmExit'),
          cancelButtonText: t('ielts.mockExam.speakingExam.cancel'),
          type: 'warning',
        }
      )
    } catch {
      return // 用户取消
    }
  }

  // 发送退出消息
  if (examStarted.value) {
    const exitMessage = {}
    socketStore.send(exitMessage, IELTS_MOCK_CHANNEL)
  }

  // 如果正在录制，先停止录制但不上传
  if (isRecording.value) {
    // 先设置考试结束状态，防止录制完成后继续处理
    examStarted.value = false

    // 停止录制
    if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
      mediaRecorder.value.stop()
      isRecording.value = false
    }
  }

  cleanup()

  // 重置所有状态
  examStarted.value = false
  currentPart.value = ''
  isCollapsed.value = true
  extraData.value = null
  mockExamId.value = null
  mockExamDetailList.value = []
  currentQuestionIndex.value = 0
  currentQuestion.value = null
  extraAudioUrl.value = ''
  currentAudioBase64.value = ''
  currentExtraAudioBase64.value = ''
  countdown.value = 0
  thinkingTime.value = 0
  isRecording.value = false
  recordingTime.value = 0
  isUploading.value = false
  waitingResponse.value = false
  isFirstMessage.value = true
  errorMessage.value = ''
  finishFlag.value = false
  examFinished.value = false
  evaluationResult.value = null
  evaluationComment.value = ''
  currentMockExamDetailId.value = null
  isLastQuestion.value = false
  waitingEvaluation.value = false
  evaluationError.value = ''

  visible.value = false
}

// 打开考试
const open = (speaker: any) => {
  visible.value = true
  startExam(speaker)
}

onMounted(() => {
  (mittBus as any).on(`socket.${IELTS_MOCK_CHANNEL}`, handleSocketMessage)
})

onUnmounted(() => {
  cleanup()
  ;(mittBus as any).off(`socket.${IELTS_MOCK_CHANNEL}`, handleSocketMessage)
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
.speaking-exam-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .exam-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-btn {
      color: #f56c6c;
    }
  }
}

.speaking-exam {
  padding: 8px;
  margin: 0 auto;

  .question-section {
    margin-bottom: 24px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e6e8eb;

    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }

    .question-text {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      flex: 1;
      padding: 0;
    }

    .question-tips {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border: none;
      border-radius: 8px;
      border-left: 1px solid #409eff;
      margin-top: 16px;

      .tips-icon {
        color: #409eff;
        margin-top: 2px;
      }

      .tips-content {
        flex: 1;

        .tips-text {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
      }
    }
  }

  .recording-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;

    .recording-controls {
      text-align: center;
      padding: 20px 0;

      .thinking-display {
        .thinking-number {
          font-size: 45px;
          font-weight: bold;
          color: #e6a23c;
          margin-bottom: 10px;
          animation: pulse 1s infinite;
        }

        .thinking-text {
          font-size: 18px;
          color: #666;
        }
      }

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
          text-shadow: 0 0 10px rgba(245, 108, 108, 0.3);
        }

        .stop-btn {
          padding: 10px 25px;
          border-radius: 20px;
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

      .waiting-status {
        .waiting-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          .waiting-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #409eff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .waiting-text {
            font-size: 16px;
            color: #409eff;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }
      }

      .waiting-evaluation {
        .waiting-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          .waiting-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e6a23c;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          .waiting-text {
            font-size: 16px;
            color: #e6a23c;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        }
      }

      .evaluation-error {
        .error-content {
          text-align: center;
          padding: 20px 0;

          .error-icon {
            font-size: 48px;
            color: #e6a23c;
            margin-bottom: 16px;
          }

          .error-message {
            margin: 8px 0 20px 0;
            font-size: 16px;
            color: #333;
          }

          .error-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
          }
        }
      }

      .error-status {
        .error-content {
          text-align: center;
          padding: 20px 0;

          .error-icon {
            font-size: 48px;
            color: #e6a23c;
            margin-bottom: 16px;
          }

          .error-message {
            margin: 8px 0 20px 0;
            font-size: 16px;
            color: #333;
          }

          .error-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
          }
        }
      }

      .exam-finished {
        .finished-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;

          .success-icon-large {
            font-size: 22px;
            color: #52c41a;
          }

          .finished-title {
            font-size: 20px;
            font-weight: 600;
            color: #333;
          }
        }

      }
    }
  }

  .collapse-btn {
    color: #666;
  }

  // 高斯模糊效果
  .blur-content {
    filter: blur(8px);
    transition: filter 0.3s ease;
    user-select: none;
    pointer-events: none;
  }
}
</style>
