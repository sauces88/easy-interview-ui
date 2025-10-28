<template>
  <!-- 练习选择对话框 -->
  <el-dialog
    v-model="showPracticeOptions"
    width="450px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    class="practice-options-dialog"
  >
    <template #header>
      <div class="custom-dialog-header">
        <el-icon class="header-icon">
          <InfoFilled />
        </el-icon>
        <span class="header-title">{{ t('ielts.quiz.unfinishedPractice') }}</span>
      </div>
    </template>
    <span>{{ t('ielts.quiz.unfinishedTip') }} <strong>{{ topic }}</strong></span>
    <template #footer>
      <div style="text-align: right;">
        <el-button
          type="danger"
          text
          size="default"
          @click="startNewPractice"
          class="footer-button"
        >
          {{ t('ielts.quiz.restartPractice') }}
        </el-button>
        <el-button
          type="primary"
          text
          size="default"
          @click="continuePractice"
          class="footer-button"
        >
          {{ t('ielts.quiz.continueLastPractice') }}
        </el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog
    v-model="visible"
    width="100vw"
    :before-close="handleClose"
    class="quiz-detail-dialog"
    destroy-on-close
    fullscreen
    :show-close="false"
  >
    <template #header>
      <div class="quiz-header">
        <span>
          {{ topic }} - {{ t('ielts.quiz.questionProgress', { current: currentQuizIndex + 1, total: currentTopicPractice?.topicPracticeQuizList?.length || 0 }) }}

        </span>
        <el-button
          type="danger"
          text
          class="close-btn"
          @click="handleClose"
        >
          {{ practiceMode === 'view' ? t('ielts.quiz.close') : t('ielts.quiz.exitAnswer') }}
        </el-button>
      </div>
    </template>
    <div
      class="quiz-detail"
      v-if="currentQuiz"
    >
      <!-- 题目区域 -->
      <div class="question-section">
        <div class="question-header">
          <el-button
            :icon="isCollapsed ? View: Hide"
            text
            class="collapse-btn"
            @click="toggleCollapse"
          />
          <div
            class="question-text"
            :class="{ 'blur-content': isCollapsed }"
          >
            {{ currentQuiz.text }}
          </div>
        </div>
        <div
          v-if="currentQuiz.tips"
          class="question-tips"
          :class="{ 'blur-content': isCollapsed }"
        >
          <el-icon class="tips-icon">
            <InfoFilled />
          </el-icon>
          <div class="tips-content">
            <div
              class="tips-text"
              v-html="currentQuiz.tips?.replace(/\n/g, '<br>')"
            />
          </div>
        </div>
      </div>

      <!-- 音频播放器 -->
      <div
        v-if="currentQuiz.audio"
        class="audio-section"
      >
        <AudioWaveform
          ref="audioWaveformRef"
          :audio-url="currentQuiz.audio"
          :autoplay="shouldAutoPlayAudio"
          :clickable="true"
          @ended="handleAudioEnd"
        />
      </div>

      <!-- 录制控制区域 -->
      <div class="recording-section">
        <div class="recording-controls">
          <!-- 倒计时显示 -->
          <div
            v-if="countdown > 0"
            class="countdown-display"
          >
            <div class="countdown-number">
              {{ countdown }}
            </div>
            <div class="countdown-text">
              {{ t('ielts.quiz.prepareRecording') }}
            </div>
          </div>

          <!-- 录制按钮 -->
          <div
            v-else-if="!isRecording && !hasRecording"
          >
            <el-button
              v-if="practiceMode && hasPreviousQuiz()"
              :icon="ArrowLeft"
              text
              class="collapse-btn previous-btn"
              @click="goToPreviousQuiz"
              :disabled="!isPreviousQuizReady()"
              :loading="isCheckingPreviousQuiz"
            >
              {{ isPreviousQuizReady() ? t('ielts.quiz.viewPrevious') : t('ielts.quiz.waitPreviousEval') }}
            </el-button>

            <el-button
              v-if="practiceMode !== 'view'"
              :icon="Microphone"
              text
              class="collapse-btn record-btn"
              @click="startCountdown"
              :disabled="isProcessing || isQuizAnswered()"
            >
              {{ t('ielts.quiz.startRecording') }}
            </el-button>

            <el-button
              v-if="practiceMode && hasNextQuiz() && (submitStatus === 'completed' || isQuizAnswered())"
              :icon="ArrowRight"
              class="collapse-btn"
              @click="nextQuiz"
              text
            >
              {{ t('ielts.quiz.nextQuestion') }}
            </el-button>
          </div>

          <!-- 录制中状态 -->
          <div
            v-else-if="isRecording"
            class="recording-status"
          >
            <div class="recording-indicator">
              <div class="recording-dot" />
              <span class="recording-text">{{ t('ielts.quiz.recording') }}</span>
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
              {{ t('ielts.quiz.stopRecording') }}
            </el-button>
          </div>

          <!-- 录制完成状态（提交前）-->
          <div
            v-else-if="hasRecording && submitStatus === 'idle'"
            class="recording-finished"
          >
            <div class="recording-info">
              <el-icon class="success-icon">
                <SuccessFilled />
              </el-icon>
              <span class="finished-text">{{ t('ielts.quiz.recordingCompleted') }} ({{ formatTime(recordingDuration) }})</span>
            </div>
            <div class="audio-preview">
              <audio
                :src="recordingUrl"
                controls
              />
            </div>
            <div class="action-buttons">
              <el-button
                v-if="practiceMode !== 'view'"
                type="primary"
                text
                :icon="Upload"
                @click="submitRecording"
                :loading="isSubmitting"
              >
                {{ t('ielts.quiz.submitAnswer') }}
              </el-button>
              <el-button
                v-if="practiceMode !== 'view'"
                type="default"
                text
                :icon="RefreshRight"
                @click="retryRecording"
              >
                {{ t('ielts.quiz.reRecord') }}
              </el-button>
            </div>
          </div>

          <!-- 分析处理中状态 -->
          <div
            v-else-if="submitStatus === 'processing'"
            class="processing-status"
          >
            <div class="processing-indicator">
              <span class="processing-text">{{ t('ielts.quiz.voiceAnalyzing') }}</span>
            </div>
            <div class="processing-illustration">
              <img
                src="@/assets/images/processing.svg"
                alt="处理中"
                class="processing-image"
              >
            </div>
            <div class="processing-actions">
              <div class="action-buttons">
                <el-button
                  @click="refreshData"
                  :icon="RefreshRight"
                  text
                >
                  {{ t('ielts.quiz.refreshData') }}
                </el-button>
                <el-button
                  v-if="practiceMode && hasNextQuiz()"
                  type="primary"
                  @click="nextQuiz"
                  :icon="ArrowRight"
                  text
                >
                  {{ t('ielts.quiz.nextQuestion') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 分析出错状态 -->
          <div
            v-else-if="submitStatus === 'error'"
            class="error-status"
          >
            <div class="error-actions">
              <el-button
                v-if="practiceMode"
                type="primary"
                class="primary-action-button"
                @click="currentTopicPractice?.result ? reappraiseTopic() : reappraiseQuiz()"
              >
                {{ t('ielts.quiz.retryEvaluation') }}
              </el-button>
              <el-button
                v-else
                type="primary"
                class="primary-action-button"
                @click="refreshData"
              >
                {{ t('ielts.quiz.retryAnalysis') }}
              </el-button>
              <el-button
                class="secondary-action-button"
                @click="tryAgain"
              >
                {{ t('ielts.quiz.retryRecording') }}
              </el-button>
            </div>

            <div class="error-message">
              {{ practiceMode ? t('ielts.quiz.evaluationError') : t('ielts.quiz.voiceAnalysisError') }}
            </div>
          </div>

          <!-- 重新评估状态 -->
          <div
            v-else-if="submitStatus === 'reappraising'"
            class="processing-status"
          >
            <div class="processing-indicator">
              <div class="processing-spinner" />
              <span class="processing-text">{{ t('ielts.quiz.evaluating') }}</span>
            </div>
            <div class="processing-actions">
              <div class="action-buttons">
                <el-button
                  @click="refreshData"
                  :icon="RefreshRight"
                  text
                >
                  {{ t('ielts.quiz.refreshData') }}
                </el-button>
                <el-button
                  v-if="practiceMode && hasNextQuiz()"
                  type="primary"
                  @click="nextQuiz"
                  :icon="ArrowRight"
                  text
                >
                  {{ t('ielts.quiz.nextQuestion') }}
                </el-button>
              </div>
              <p class="processing-tip">
                {{ t('ielts.quiz.reevaluationTip') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 评测结果展示 -->
      <EvaluationResults
        v-if="submitStatus === 'completed'"
        :evaluation-result="evaluationResult"
        :result-comment="resultComment"
      />

      <!-- 最后一题完成后的总体评估按钮 -->
      <div
        v-if="submitStatus === 'completed' && isLastQuiz()"
        class="completion-section"
      >
        <div class="completion-header">
          <el-icon class="success-icon-large">
            <SuccessFilled />
          </el-icon>
          <span class="completion-title">
            {{ practiceMode === 'view' ? t('ielts.quiz.allCompleted') : t('ielts.quiz.congratulations') }}
          </span>
        </div>
        <p class="completion-description">
          {{ practiceMode === 'view' ? t('ielts.quiz.viewOverallDesc') : t('ielts.quiz.viewOverallDesc') }}
        </p>
        <el-button
          type="primary"
          text
          :loading="checkingOverall"
          @click="openOverallEvaluation"
        >
          <el-icon style="margin-right: 4px;">
            <View />
          </el-icon>
          {{ t('ielts.quiz.viewOverallButton') }}
        </el-button>
      </div>
    </div>

    <!-- 录制时间不足警告对话框 -->
    <el-dialog
      v-model="showWarning"
      :title="t('ielts.quiz.recordingTooShort')"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div class="warning-content">
        <el-icon class="warning-icon">
          <WarningFilled />
        </el-icon>
        <p>{{ t('ielts.quiz.recordingTooShortTip') }}</p>
        <p class="min-time-text">
          {{ t('ielts.quiz.minRecordingTime') }}
        </p>
      </div>
      <template #footer>
        <span style="text-align: right;">
          <el-button @click="discardRecording">{{ t('ielts.quiz.discard') }}</el-button>
          <el-button
            type="primary"
            @click="retryRecording"
          >{{ t('ielts.quiz.rerecord') }}</el-button>
        </span>
      </template>
    </el-dialog>
  </el-dialog>

  <!-- 总体评估页面 -->
  <OverallEvaluation
    ref="overallEvaluationRef"
    :topic="topic"
    :evaluation-result="evaluationResult"
    :result-comment="resultComment"
    :overall-evaluation-status="overallEvaluationStatus"
    :practice-data="currentTopicPractice"
  />
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref, provide, inject} from 'vue'
import {ElMessage} from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import mittBus from '@/utils/mittBus'
import type {IQuiz} from '@/api/interface/ielts/quiz'
import {createTopicPracticeApi, getUnfinishedTopicPracticeDetailApi, finishTopicPracticeApi, reappraiseTopicPracticeApi, getTopicPracticeDetailApi} from '@/api/modules/ielts/topicPractice'
import {reappraiseTopicPracticeQuizApi, getTopicPracticeQuizDetailApi, updateTopicPracticeQuizApi} from '@/api/modules/ielts/topicPracticeQuiz'
import {getQuizDetailApi} from '@/api/modules/ielts/quiz'
import {
  View,
  Hide,
  ArrowLeft,
  ArrowRight,
  InfoFilled,
  Microphone,
  RefreshRight,
  SuccessFilled,
  Upload,
  VideoPause,
  WarningFilled
} from '@element-plus/icons-vue'
import EvaluationResults from './EvaluationResults.vue'
import OverallEvaluation from './OverallEvaluation.vue'
import AudioWaveform from '../../mockExam/components/AudioWaveform.vue'

interface QuizItem extends IQuiz.Row {}

// 检查当前题目是否已经被回答
const isQuizAnswered = () => {
  if (!currentTopicPractice.value?.topicPracticeQuizList || currentQuizIndex.value < 0) {
    return false
  }

  const currentQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value]

  // 检查是否有评估结果（result字段且解析后code为'0000'表示评估完成）
  if (currentQuizPractice?.result) {
    const result = JSON.parse(currentQuizPractice.result)
    return result.code === '0000'
  }

  return false
}

// 对话框状态
const visible = ref(false)
const currentQuiz = ref<QuizItem | null>(null)
const isCollapsed = ref(false)
const topic = ref('')

// Topic练习相关状态
const currentTopicPractice = ref<any>(null)
const currentQuizIndex = ref(0)
const quizDetails = ref<Map<number, QuizItem>>(new Map())
const practiceMode = ref<'continue' | 'new' | 'view'>()
const showPracticeOptions = ref(false)

// 倒计时状态
const countdown = ref(0)
const countdownTimer = ref<number | null>(null)

// 录制状态
const isRecording = ref(false)
const hasRecording = ref(false)
const isProcessing = ref(false)
const isSubmitting = ref(false)
const recordingTime = ref(0)
const recordingDuration = ref(0)
const recordingTimer = ref<number | null>(null)
const recordingUrl = ref('')

// 媒体录制相关
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const stream = ref<MediaStream | null>(null)

// 警告对话框
const showWarning = ref(false)

// 音频波形组件引用
const audioWaveformRef = ref<InstanceType<typeof AudioWaveform> | null>(null)
const isAudioPlaying = ref(false)
const shouldAutoPlayAudio = ref(true) // 控制音频是否自动播放

// 提交后状态管理
const practiceId = ref<number | null>(null)
const submitStatus = ref<'idle' | 'processing' | 'completed' | 'error' | 'reappraising'>('idle')
const evaluationResult = ref<any>(null)
const resultComment = ref('')
const showingOverallResult = ref(false)
const checkingOverall = ref(false)
const overallEvaluationStatus = ref<'processing' | 'completed' | 'error' | null>(null)
const isCheckingPreviousQuiz = ref(false)

// 检查上一题是否已准备好
const isPreviousQuizReady = () => {
  if (!currentTopicPractice.value || currentQuizIndex.value <= 0) return false

  const previousQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value - 1]
  if (!previousQuizPractice) return false

  if (previousQuizPractice.result)
    return true
  return false;
}

// 总体评估组件引用
const overallEvaluationRef = ref<InstanceType<typeof OverallEvaluation>>()

// 获取最大录制时间（秒）
const getMaxRecordingTime = () => {
  return currentQuiz.value?.part === '2001001' ? 30 : 120
}

// 获取最小录制时间（秒）
const getMinRecordingTime = () => {
  return currentQuiz.value?.part === '2001001' ? 15 : 30
}

// 检查未完结的topic练习
const checkUnfinishedPractice = async () => {
  const response = await getUnfinishedTopicPracticeDetailApi({ topic: topic.value })
  if (response.data && Object.keys(response.data).length > 0) {
    // 有未完结的练习，展示选择对话框
    currentTopicPractice.value = response.data
    showPracticeOptions.value = true
    return true
  }
  return false
}

// 继续上次练习
const continuePractice = async () => {
  showPracticeOptions.value = false
  practiceMode.value = 'continue'

  // 打开主对话框
  visible.value = true

  if (currentTopicPractice.value) {
    await loadQuizDetails()

    // 检查总体练习是否完成
    const practice = currentTopicPractice.value
    if (practice.result) {
      const result = JSON.parse(practice.result)
      if (result.code === '0000') {
        // 总体评估完成，显示结果
        submitStatus.value = 'completed'
        if (practice.evaluation) {
          evaluationResult.value = JSON.parse(practice.evaluation)
        }
        resultComment.value = practice.comment || ''
      } else {
        // 总体评估异常，需要检查小题完成情况
        submitStatus.value = 'error'

        // 初始化显示状态：找到最后一个已完成的小题或第一个未完成的小题
        initializeContinueMode()
      }
    } else {
      // 还没有总体结果，继续练习
      findNextUnfinishedQuiz()
    }
  }
}

// 开始新练习
const startNewPractice = async () => {
  showPracticeOptions.value = false
  practiceMode.value = 'new'

  // 打开主对话框
  visible.value = true
  // 如果有未完结的练习，先结束它
  if (currentTopicPractice.value) {
    await finishTopicPracticeApi({
      id: currentTopicPractice.value.id,
      topic: topic.value,
      status: 2 // 强制完结
    })
  }

  // 创建新练习
  const response = await createTopicPracticeApi({ topic: topic.value })
  currentTopicPractice.value = response.data

  await loadQuizDetails()
  findNextUnfinishedQuiz()
}

// 直接开始新练习（没有未完结的练习）
const startDirectNewPractice = async () => {
  practiceMode.value = 'new'

  const response = await createTopicPracticeApi({ topic: topic.value })
  currentTopicPractice.value = response.data

  await loadQuizDetails()
  findNextUnfinishedQuiz()
}

// 加载题目详情
const loadQuizDetails = async () => {
  if (!currentTopicPractice.value) return

  const quizIds = currentTopicPractice.value.topicPracticeQuizList.map(item => item.quizId)

  for (const quizId of quizIds) {
    const response = await getQuizDetailApi({ id: quizId })
    quizDetails.value.set(quizId, response.data)
  }
}

// 找到下一个未完成的题目
const findNextUnfinishedQuiz = () => {
  if (!currentTopicPractice.value) return

  const quizList = currentTopicPractice.value.topicPracticeQuizList
  let foundUnfinished = false

  for (let i = 0; i < quizList.length; i++) {
    const quiz = quizList[i]

    // 没有录音或者结果异常
    if (!quiz.audio || (quiz.result && JSON.parse(quiz.result).code !== '0000')) {
      currentQuizIndex.value = i
      const quizDetail = quizDetails.value.get(quiz.quizId)
      if (quizDetail) {
        currentQuiz.value = quizDetail
        foundUnfinished = true
        break
      }
    }
  }

  if (!foundUnfinished) {
    // 所有题目都已完成，等待总体结果
    submitStatus.value = 'processing'
  }
}

// 初始化继续练习模式的显示状态
const initializeContinueMode = () => {
  if (!currentTopicPractice.value) return

  const quizList = currentTopicPractice.value.topicPracticeQuizList

  // 找到最后一个已完成的题目，或者第一个未完成的题目
  let targetIndex = 0

  // 从后往前找，找到最后一个已完成的题目
  for (let i = quizList.length - 1; i >= 0; i--) {
    const quiz = quizList[i]
    if (quiz.audio && quiz.result) {
      const result = JSON.parse(quiz.result)
      if (result.code === '0000') {
        targetIndex = i
        break
      }
    }
  }

  // 设置当前题目
  currentQuizIndex.value = targetIndex
  const quiz = quizList[targetIndex]
  const quizDetail = quizDetails.value.get(quiz.quizId)

  if (quizDetail) {
    currentQuiz.value = quizDetail

    // 如果该题已有评估结果，显示评估结果
    if (quiz.evaluation) {
      evaluationResult.value = JSON.parse(quiz.evaluation)
      submitStatus.value = 'completed'
      // 重置录制相关状态，确保导航按钮能够显示
      hasRecording.value = false
      isRecording.value = false
      countdown.value = 0
    } else if (quiz.result) {
      // 有result但没有evaluation
      const result = JSON.parse(quiz.result)
      if (result.code === '0000') {
        submitStatus.value = 'processing' // 等待评估中
      } else {
        submitStatus.value = 'error' // 出现异常
      }
    } else {
      // 未完成的题目
      submitStatus.value = 'idle'
    }
  }
}

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 音频格式转换（单声道，16k采样率，wav格式）
const convertAudioToWav = async (audioBlob: Blob): Promise<File> => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const reader = new FileReader()

    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // 转换为单声道，16k采样率
      const sampleRate = 16000
      const length = audioBuffer.duration * sampleRate
      const offlineContext = new OfflineAudioContext(1, length, sampleRate)
      const source = offlineContext.createBufferSource()

      // 如果是立体声，转为单声道
      let monoBuffer
      if (audioBuffer.numberOfChannels > 1) {
        monoBuffer = offlineContext.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate)
        const leftChannel = audioBuffer.getChannelData(0)
        const rightChannel = audioBuffer.getChannelData(1)
        const monoData = monoBuffer.getChannelData(0)

        for (let i = 0; i < audioBuffer.length; i++) {
          monoData[i] = (leftChannel[i] + rightChannel[i]) / 2
        }
      } else {
        monoBuffer = audioBuffer
      }

      source.buffer = monoBuffer
      source.connect(offlineContext.destination)
      source.start()

      const renderedBuffer = await offlineContext.startRendering()

      // 转换为WAV格式
      const wavBlob = bufferToWav(renderedBuffer)
      const wavFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' })

      resolve(wavFile)
    }

    reader.onerror = () => reject(new Error('读取音频文件失败'))
    reader.readAsArrayBuffer(audioBlob)
  })
}

// 将AudioBuffer转换为WAV格式（单声道，16k采样率，16位深度）
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const length = buffer.length
  const channels = 1 // 强制单声道
  const sampleRate = 16000 // 强制16k采样率
  const bitsPerSample = 16 // 16位深度
  const bytesPerSample = bitsPerSample / 8
  const byteRate = sampleRate * channels * bytesPerSample
  const blockAlign = channels * bytesPerSample
  const dataSize = length * bytesPerSample

  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  // WAV文件头
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  // RIFF头
  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true) // 文件大小-8
  writeString(8, 'WAVE')

  // fmt子块
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt子块大小
  view.setUint16(20, 1, true) // 音频格式(PCM)
  view.setUint16(22, channels, true) // 声道数
  view.setUint32(24, sampleRate, true) // 采样率
  view.setUint32(28, byteRate, true) // 字节率
  view.setUint16(32, blockAlign, true) // 块对齐
  view.setUint16(34, bitsPerSample, true) // 位深度

  // data子块
  writeString(36, 'data')
  view.setUint32(40, dataSize, true) // 数据大小

  // 写入音频数据（16位PCM）
  const channelData = buffer.getChannelData(0)
  let offset = 44
  for (let i = 0; i < length; i++) {
    // 将浮点数转换为16位整数
    const sample = Math.max(-1, Math.min(1, channelData[i]))
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
    view.setInt16(offset, intSample, true) // little-endian
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

// 开始倒计时
const startCountdown = async () => {
  // 确保麦克风权限已获取（如果之前没有获取到，再次尝试）
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

// 请求麦克风权限
const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (!stream.value) {
      stream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
    return true
  } catch (error) {
    console.error('麦克风权限请求失败:', error)
    ElMessage.error(t('ielts.quiz.microphonePermissionFailed'))
    return false
  }
}

// 开始录制
const startRecording = async () => {
  if (!stream.value) {
    if (!await requestMicrophonePermission()) {
      return
    }
  }

  audioChunks.value = []
  mediaRecorder.value = new MediaRecorder(stream.value!)

  mediaRecorder.value.ondataavailable = (event) => {
    audioChunks.value.push(event.data)
  }

  mediaRecorder.value.onstop = handleRecordingComplete

  mediaRecorder.value.start()
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
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    isRecording.value = false

    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}

// 录制完成处理
const handleRecordingComplete = () => {
  const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
  recordingUrl.value = URL.createObjectURL(audioBlob)
  recordingDuration.value = recordingTime.value

  // 检查录制时长是否足够
  if (recordingDuration.value < getMinRecordingTime()) {
    showWarning.value = true
    return
  }

  hasRecording.value = true
}

// 重录
const retryRecording = () => {
  showWarning.value = false
  hasRecording.value = false
  recordingTime.value = 0
  recordingDuration.value = 0

  if (recordingUrl.value) {
    URL.revokeObjectURL(recordingUrl.value)
    recordingUrl.value = ''
  }
}

// 放弃录制
const discardRecording = () => {
  showWarning.value = false
  retryRecording()
}

// 提交录制
const submitRecording = async () => {
  if (!currentQuiz.value?.id || !currentTopicPractice.value) {
    ElMessage.error(t('ielts.quiz.questionInfoError'))
    return
  }

  isSubmitting.value = true

  // 转换录音为所需格式
  const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
  const wavFile = await convertAudioToWav(audioBlob)

  // 获取当前题目的TopicPracticeQuiz ID
  const currentQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value]

  // 调用更新接口
  await updateTopicPracticeQuizApi(wavFile, currentQuizPractice.id)

  submitStatus.value = 'processing'
  isSubmitting.value = false
}

// 手动刷新数据
const refreshData = async () => {
  if (submitStatus.value === 'processing') {
    // 如果在处理单题，刷新单题结果
    const currentQuizPractice = currentTopicPractice.value?.topicPracticeQuizList[currentQuizIndex.value]
    if (currentQuizPractice) {
      const response = await getTopicPracticeQuizDetailApi({ id: currentQuizPractice.id })
      const result = response.data

      if (result.result) {
        const resultData = JSON.parse(result.result)
        if (resultData.code === '0000') {
          // 单题处理成功
          if (result.evaluation) {
            evaluationResult.value = JSON.parse(result.evaluation)
            submitStatus.value = 'completed'

            // 如果是最后一题，检查总体评估状态
            if (isLastQuiz()) {
              checkOverallEvaluationStatus()
            }
          }
        } else {
          // 单题处理失败
          submitStatus.value = 'error'
          ElMessage.error(t('ielts.quiz.voiceAnalysisError') + ': ' + (resultData.message || t('ielts.quiz.error')))
        }
      } else {
        ElMessage.info(t('ielts.quiz.analysisInProgress'))
      }
    }
  } else if (submitStatus.value === 'reappraising') {
    // 在重新评估中，刷新对应的结果
    if (currentTopicPractice.value?.result) {
      // 刷新总体结果
      const response = await getTopicPracticeDetailApi({ id: currentTopicPractice.value.id })
      const result = response.data

      if (result.result) {
        const resultData = JSON.parse(result.result)
        if (resultData.code === '0000') {
          // 总体评估完成
          submitStatus.value = 'completed'
          if (result.evaluation) {
            evaluationResult.value = JSON.parse(result.evaluation)
          }
          resultComment.value = result.comment || ''
          currentTopicPractice.value = result
        } else {
          // 总体评估失败
          submitStatus.value = 'error'
        }
      } else {
        ElMessage.info('重新评估仍在进行中')
      }
    } else {
      // 刷新单题结果
      const currentQuizPractice = currentTopicPractice.value?.topicPracticeQuizList[currentQuizIndex.value]
      if (currentQuizPractice) {
        const response = await getTopicPracticeQuizDetailApi({ id: currentQuizPractice.id })
        const result = response.data

        if (result.result) {
          const resultData = JSON.parse(result.result)
          if (resultData.code === '0000') {
            // 单题重新评估成功
            if (result.evaluation) {
              evaluationResult.value = JSON.parse(result.evaluation)
              submitStatus.value = 'completed'
              ElMessage.success(t('ielts.quiz.reevaluationUpdated'))
            }
          } else {
            // 单题重新评估失败
            submitStatus.value = 'error'
            ElMessage.error(t('ielts.quiz.reevaluationFailed') + ': ' + (resultData.message || t('ielts.quiz.error')))
          }
        } else {
          ElMessage.info(t('ielts.quiz.reevaluating'))
        }
      }
    }
  } else {
    ElMessage.info(t('ielts.quiz.noDataToRefresh'))
  }
}

// 检查总体评估状态
const checkOverallEvaluationStatus = async () => {
  if (!currentTopicPractice.value) return

  checkingOverall.value = true
  showingOverallResult.value = true

  const response = await getTopicPracticeDetailApi({ id: currentTopicPractice.value.id })
  const result = response.data

  if (result.result) {
    const resultData = JSON.parse(result.result)
    if (resultData.code === '0000') {
      // 总体评估完成
      overallEvaluationStatus.value = 'completed'
      if (result.evaluation) {
        evaluationResult.value = JSON.parse(result.evaluation)
      }
      resultComment.value = result.comment || ''
      currentTopicPractice.value = result
    } else {
      // 总体评估失败
      overallEvaluationStatus.value = 'error'
    }
  } else {
    // 总体评估还在进行中
    overallEvaluationStatus.value = 'processing'
  }
  checkingOverall.value = false
}

// 重新分析总体评估
const reappraiseOverallTopic = async () => {
  if (!currentTopicPractice.value) return

  await reappraiseTopicPracticeApi({ id: currentTopicPractice.value.id })
  overallEvaluationStatus.value = 'processing'
}

// 打开总体评估页面
const openOverallEvaluation = async () => {
  checkingOverall.value = true

  // 先检查总体评估状态
  await checkOverallEvaluationStatus()

  // 打开总体评估页面
  overallEvaluationRef.value?.open()
  checkingOverall.value = false
}

// 处理总体评估页面关闭
const handleOverallEvaluationClose = () => {
  // 关闭总体评估页面后可以选择关闭整个练习或返回
  showingOverallResult.value = false
}

// 从总体评估页面重新练习
const handleRetryPracticeFromOverall = () => {
  // 关闭总体评估页面
  handleOverallEvaluationClose()

  // 关闭主对话框
  handleClose()

  // 重新开始练习
  setTimeout(() => {
    if (topic.value) {
      openTopicPractice(topic.value)
    }
  }, 100)
}

// 重新尝试
const tryAgain = () => {
  // 重置状态
  submitStatus.value = 'idle'
  practiceId.value = null
  evaluationResult.value = null
  resultComment.value = ''
  showingOverallResult.value = false
  overallEvaluationStatus.value = null

  // 回到录制状态
  retryRecording()
}

// 下一题
const nextQuiz = () => {
  if (!currentTopicPractice.value) return

  // 重置当前题目状态（查看模式下不需要重置）
  if (practiceMode.value !== 'view') {
    submitStatus.value = 'idle'
    evaluationResult.value = null
    showingOverallResult.value = false
    overallEvaluationStatus.value = null
    retryRecording()
  }

  // 直接移动到下一题
  if (currentQuizIndex.value < currentTopicPractice.value.topicPracticeQuizList.length - 1) {
    currentQuizIndex.value = currentQuizIndex.value + 1
    const nextQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value]

    const quizDetail = quizDetails.value.get(nextQuizPractice.quizId)
    if (quizDetail) {
      currentQuiz.value = quizDetail

      // 如果该题已有评估结果，显示评估结果（不管在什么模式下）
      if (nextQuizPractice.evaluation) {
        evaluationResult.value = JSON.parse(nextQuizPractice.evaluation)
        submitStatus.value = 'completed'
        // 重置录制相关状态，确保导航按钮能够显示
        hasRecording.value = false
        isRecording.value = false
        countdown.value = 0
        // 已练习的题目不播放音频
        shouldAutoPlayAudio.value = false
      } else if (nextQuizPractice.result) {
        // 有结果但没有评估，也视为已练习
        const result = JSON.parse(nextQuizPractice.result)
        if (result.code === '0000') {
          submitStatus.value = 'processing' // 等待评估中
        } else {
          submitStatus.value = 'error' // 出现异常
        }
        // 已练习的题目不播放音频
        shouldAutoPlayAudio.value = false
      } else if (practiceMode.value !== 'view') {
        // 只有在非查看模式下才重置状态（为新题目做准备）
        submitStatus.value = 'idle'
        evaluationResult.value = null
        // 未练习的题目才播放音频
        shouldAutoPlayAudio.value = true
      } else {
        // 查看模式下没有结果的题目，不播放音频
        submitStatus.value = 'idle'
        shouldAutoPlayAudio.value = false
      }
    }
  }
}

// 重新评估单题
const reappraiseQuiz = async () => {
  if (!currentTopicPractice.value) return

  const currentQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value]

  await reappraiseTopicPracticeQuizApi({ id: currentQuizPractice.id })
  submitStatus.value = 'reappraising'
  ElMessage.success(t('ielts.quiz.reevaluationStarted'))
}

// 重新评估总体
const reappraiseTopic = async () => {
  if (!currentTopicPractice.value) return

  await reappraiseTopicPracticeApi({ id: currentTopicPractice.value.id })
  submitStatus.value = 'reappraising'
  ElMessage.success(t('ielts.quiz.reevaluationStarted'))
}

// 播放音频
const playAudio = () => {
  if (audioWaveformRef.value) {
    audioWaveformRef.value.play()
  }
}

// 音频播放结束
const handleAudioEnd = async () => {
  isAudioPlaying.value = false

  // 音频播放结束后预先请求麦克风权限，这样用户点击录制时不会有延迟
  if (practiceMode.value !== 'view' && !isQuizAnswered()) {
    await requestMicrophonePermission()
  }
}

// 收起/展开题目
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 关闭对话框
const handleClose = () => {
  // 清理倒计时
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }

  // 清理录制定时器
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  // 停止录制
  if (isRecording.value) {
    stopRecording()
  }

  // 清理媒体流
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }

  // 清理录制URL
  if (recordingUrl.value) {
    URL.revokeObjectURL(recordingUrl.value)
    recordingUrl.value = ''
  }

  // 重置状态
  countdown.value = 0
  isRecording.value = false
  hasRecording.value = false
  isProcessing.value = false
  isSubmitting.value = false
  recordingTime.value = 0
  recordingDuration.value = 0
  showWarning.value = false
  isCollapsed.value = false
  isAudioPlaying.value = false
  shouldAutoPlayAudio.value = true // 重置音频自动播放设置

  // 停止音频播放
  audioWaveformRef.value?.stop()

  // 重置提交状态
  submitStatus.value = 'idle'
  practiceId.value = null
  evaluationResult.value = null
  resultComment.value = ''
  showingOverallResult.value = false
  overallEvaluationStatus.value = null
  checkingOverall.value = false

  visible.value = false
}

// 打开答题对话框
const openQuiz = (quiz: QuizItem) => {
  currentQuiz.value = quiz
  visible.value = true
}

// 开始主题练习
const openTopicPractice = async (topicValue: string) => {
  topic.value = topicValue

  // 检查是否有未完结的练习
  const hasUnfinished = await checkUnfinishedPractice()

  if (!hasUnfinished) {
    // 没有未完结的练习，直接开始新练习并打开主对话框
    visible.value = true
    await startDirectNewPractice()
  }
  // 如果有未完结的练习，showPracticeOptions 会在 checkUnfinishedPractice 中设置为 true
  // 用户选择后会在 continuePractice 或 startNewPractice 中打开主对话框
}

// 从消息跳转过来时直接打开并显示结果
const openWithResult = (quiz: QuizItem, practiceResult: any) => {
  currentQuiz.value = quiz
  practiceId.value = practiceResult.id

  // 设置评测结果
  if (practiceResult.result && practiceResult.result.code === '0000') {
    submitStatus.value = 'completed'
    if (practiceResult.evaluation) {
      evaluationResult.value = practiceResult.evaluation
    }
    resultComment.value = practiceResult.comment || ''
  } else {
    submitStatus.value = 'error'
  }

  visible.value = true
}

// 检查是否有下一题
const hasNextQuiz = () => {
  if (!currentTopicPractice.value) return false
  return currentQuizIndex.value < currentTopicPractice.value.topicPracticeQuizList.length - 1
}

// 检查是否是最后一题
const isLastQuiz = () => {
  if (!currentTopicPractice.value) return false
  return currentQuizIndex.value === currentTopicPractice.value.topicPracticeQuizList.length - 1
}

// 检查是否有上一题并且上一题有结果
const hasPreviousQuiz = () => {
  if (!currentTopicPractice.value) return false
  return currentQuizIndex.value > 0
}

// 轮询检查上一题的结果
const checkPreviousQuizResult = async () => {
  if (!currentTopicPractice.value || currentQuizIndex.value <= 0) return

  const previousQuizPractice = currentTopicPractice.value.topicPracticeQuizList[currentQuizIndex.value - 1]
  if (!previousQuizPractice) return

  isCheckingPreviousQuiz.value = true

  const response = await getTopicPracticeQuizDetailApi({ id: previousQuizPractice.id })
  console.log(response)
  const result = response.data

  if (result.result) {
    // 更新本地数据
    previousQuizPractice.result = result.result
    previousQuizPractice.evaluation = result.evaluation
    // 深度触发响应式更新
    currentTopicPractice.value = {
      ...currentTopicPractice.value,
      topicPracticeQuizList: [...currentTopicPractice.value.topicPracticeQuizList]
    }
    isCheckingPreviousQuiz.value = false
  } else {
    // 结果为空，继续轮询
    isCheckingPreviousQuiz.value = false
    setTimeout(checkPreviousQuizResult, 5000)
  }
}

// 跳转到上一题
const goToPreviousQuiz = () => {
  if (!hasPreviousQuiz()) return

  // 检查上一题是否已准备好
  if (!isPreviousQuizReady()) {
    // 如果上一题结果为空，开始轮询检查
    checkPreviousQuizResult()
    return
  }

  // 重置当前题目状态（查看模式下不需要重置）
  if (practiceMode.value !== 'view') {
    submitStatus.value = 'idle'
    evaluationResult.value = null
    retryRecording()
  }

  // 回到上一题
  currentQuizIndex.value = currentQuizIndex.value - 1
  const previousQuizPractice = currentTopicPractice.value?.topicPracticeQuizList[currentQuizIndex.value]

  // 设置不自动播放音频（手动切换题目时）
  shouldAutoPlayAudio.value = false

  if (previousQuizPractice) {
    const quizDetail = quizDetails.value.get(previousQuizPractice.quizId)
    if (quizDetail) {
      currentQuiz.value = quizDetail

      // 如果该题已有评估结果，优先显示评估结果（不管在什么模式下）
      if (previousQuizPractice.evaluation) {
        evaluationResult.value = JSON.parse(previousQuizPractice.evaluation)
        submitStatus.value = 'completed'
        // 重置录制相关状态，确保导航按钮能够显示
        hasRecording.value = false
        isRecording.value = false
        countdown.value = 0
      } else if (previousQuizPractice.result) {
        // 如果有result但没有evaluation，检查result状态
        const result = JSON.parse(previousQuizPractice.result)
        if (result.code === '0000') {
          submitStatus.value = 'processing' // 等待评估中
        } else {
          submitStatus.value = 'error' // 出现异常
        }
      } else if (practiceMode.value !== 'view') {
        // 只有在非查看模式下才重置为初始状态
        submitStatus.value = 'idle'
        evaluationResult.value = null
      } else {
        // 查看模式下没有结果的题目，显示为未开始状态
        submitStatus.value = 'idle'
      }
    }
  }
}

// 提供方法给子组件使用
provide('check-overall-status', checkOverallEvaluationStatus)
provide('reappraise-overall', reappraiseOverallTopic)
provide('retry-practice', handleRetryPracticeFromOverall)
provide('close-overall', () => {
  overallEvaluationRef.value?.close()
})
provide('close-practice', () => {
  // 强制关闭对话框，直接设置visible为false
  visible.value = false
  // 执行清理逻辑
  handleClose()
})

// 接收 card.vue 提供的关闭方法并转发给子组件
const closeQuizDetailFromCard = inject<() => void>('close-quiz-detail')
provide('close-quiz-detail', closeQuizDetailFromCard)

// 处理来自消息的评估完成通知
const handleQuizEvaluationComplete = async (event: unknown) => {
  const data = event as { topicPracticeQuizId: string };
  if (currentTopicPractice.value?.topicPracticeQuizList) {
    // 查找对应的题目练习记录
    const targetQuizIndex = currentTopicPractice.value.topicPracticeQuizList.findIndex(
      quiz => quiz.id.toString() === data.topicPracticeQuizId
    )

    if (targetQuizIndex !== -1) {
      // 获取最新的评估结果
      const response = await getTopicPracticeQuizDetailApi({ id: data.topicPracticeQuizId })
      const result = response.data

      // 更新本地数据
      currentTopicPractice.value.topicPracticeQuizList[targetQuizIndex] = result

      // 如果是当前题目
      if (targetQuizIndex === currentQuizIndex.value) {
        if (submitStatus.value === 'processing') {
          if (result.result && result.evaluation) {
            const resultData = JSON.parse(result.result)
            if (resultData.code === '0000') {
              // 单题处理成功，更新状态和结果
              evaluationResult.value = JSON.parse(result.evaluation)
              submitStatus.value = 'completed'

              // 重置录制相关状态，确保导航按钮能够显示
              hasRecording.value = false
              isRecording.value = false
              recordingTime.value = 0
              recordingDuration.value = 0
              if (recordingUrl.value) {
                URL.revokeObjectURL(recordingUrl.value)
                recordingUrl.value = ''
              }

              // 如果是最后一题，检查总体评估状态
              if (isLastQuiz()) {
                checkOverallEvaluationStatus()
              }
            }
          }
        }
      } else {
        // 如果不是当前题目，不自动跳转，只更新本地数据
        // 评分完成后，用户可以通过"查看上一题"按钮主动查看结果
        console.log(t('ielts.quiz.questionScoreCompleted', { index: targetQuizIndex + 1 }))
      }

      // 如果是上一题完成了，且用户正在等待上一题评估
      if (targetQuizIndex === currentQuizIndex.value - 1 && isCheckingPreviousQuiz.value) {
        isCheckingPreviousQuiz.value = false
      }
    }
  }
}

// 处理来自消息的总体评估完成通知
const handleOverallEvaluationComplete = async (event: unknown) => {
  const data = event as { topicPracticeId: string };
  if (currentTopicPractice.value && currentTopicPractice.value.id.toString() === data.topicPracticeId) {
    // 当前显示的practice与消息中的topicPracticeId匹配，刷新总体评估状态
    await checkOverallEvaluationStatus()

    // checkOverallEvaluationStatus 会更新 currentTopicPractice.value 和 overallEvaluationStatus
    // 如果总体评估完成且当前是错误状态，自动切换到完成状态
    if (overallEvaluationStatus.value === 'completed' && submitStatus.value === 'error') {
      const practice = currentTopicPractice.value
      // 总体评估成功，显示结果
      submitStatus.value = 'completed'

      // evaluationResult 和 resultComment 已经在 checkOverallEvaluationStatus 中更新了
      // 自动打开总体评估对话框
      if (overallEvaluationRef.value) {
        overallEvaluationRef.value.open()
      }
    }
  }
}

// 组件挂载
onMounted(async () => {
  // 如果是topic练习模式，需要加载题目详情
  if (practiceMode.value && currentTopicPractice.value) {
    await loadQuizDetails()
  }

  // 监听评估完成消息
  mittBus.on('quiz.evaluationComplete', handleQuizEvaluationComplete)
  mittBus.on('overall.evaluationComplete', handleOverallEvaluationComplete)
  // 监听切换题目消息
  mittBus.on('switchToQuizInModal', handleSwitchToQuizInModal)
})

// 清理资源
onUnmounted(() => {
  handleClose()
  // 移除消息监听器
  mittBus.off('quiz.evaluationComplete', handleQuizEvaluationComplete)
  mittBus.off('overall.evaluationComplete', handleOverallEvaluationComplete)
  mittBus.off('switchToQuizInModal', handleSwitchToQuizInModal)
})

// 处理切换到指定题目的事件
const handleSwitchToQuizInModal = (data: any) => {
  const { quizId } = data
  if (!currentTopicPractice.value || !quizId) return

  // 找到对应的题目索引
  const targetIndex = currentTopicPractice.value.topicPracticeQuizList.findIndex(
    (quiz: any) => quiz.quizId === quizId
  )

  if (targetIndex !== -1) {
    // 切换到指定题目
    currentQuizIndex.value = targetIndex
    const targetQuizPractice = currentTopicPractice.value.topicPracticeQuizList[targetIndex]
    const quizDetail = quizDetails.value.get(targetQuizPractice.quizId)

    if (quizDetail) {
      currentQuiz.value = quizDetail

      // 根据题目状态设置相应的显示状态
      if (targetQuizPractice.evaluation) {
        evaluationResult.value = JSON.parse(targetQuizPractice.evaluation)
        submitStatus.value = 'completed'
        // 重置录制相关状态，确保导航按钮能够显示
        hasRecording.value = false
        isRecording.value = false
        countdown.value = 0
        // 已练习的题目不播放音频
        shouldAutoPlayAudio.value = false
      } else if (targetQuizPractice.result) {
        const result = JSON.parse(targetQuizPractice.result)
        if (result.code === '0000') {
          submitStatus.value = 'processing' // 等待评估中
        } else {
          submitStatus.value = 'error' // 出现异常
        }
        // 已练习的题目不播放音频
        shouldAutoPlayAudio.value = false
      } else {
        // 未完成的题目
        submitStatus.value = 'idle'
        // 从消息切换过来的未练习题目不播放音频（由外部控制）
        shouldAutoPlayAudio.value = false
      }
    }
  }
}

// 打开话题练习（带数据和模式）
const openTopicPracticeWithData = async (topicValue: string, practiceData: any, mode: 'view' | 'continue', autoPlay: boolean = true) => {
  topic.value = topicValue
  currentTopicPractice.value = practiceData
  practiceMode.value = mode === 'continue' ? 'continue' : 'view'
  shouldAutoPlayAudio.value = autoPlay // 设置音频是否自动播放

  // 打开主对话框
  visible.value = true

  if (practiceData) {
    await loadQuizDetails()

    if (mode === 'view') {
      // 查看模式：直接显示结果，不允许录制
      const practice = practiceData
      if (practice.result) {
        const result = JSON.parse(practice.result)
        if (result.code === '0000') {
          // 总体评估完成，显示结果
          submitStatus.value = 'completed'
          resultComment.value = practice.comment || ''

          // 定位到第一题并显示该题的评估结果
          currentQuizIndex.value = 0
          const firstQuizPractice = practiceData.topicPracticeQuizList[0]
          if (firstQuizPractice) {
            const quizDetail = quizDetails.value.get(firstQuizPractice.quizId)
            if (quizDetail) {
              currentQuiz.value = quizDetail

              // 获取当前题目的评估结果（用于显示本体评分）
              if (firstQuizPractice.evaluation) {
                evaluationResult.value = JSON.parse(firstQuizPractice.evaluation)
              }
            }
          }
        } else {
          // 总体评估异常
          submitStatus.value = 'error'
        }
      }
    } else {
      // 继续模式：检查状态并定位到合适的题目
      const practice = practiceData
      if (practice.result) {
        const result = JSON.parse(practice.result)
        if (result.code === '0000') {
          // 总体评估完成，显示结果
          submitStatus.value = 'completed'
          if (practice.evaluation) {
            evaluationResult.value = JSON.parse(practice.evaluation)
          }
          resultComment.value = practice.comment || ''
        } else {
          // 总体评估异常，需要检查小题完成情况
          submitStatus.value = 'error'

          // 初始化显示状态：找到最后一个已完成的小题或第一个未完成的小题
          initializeContinueMode()
        }
      } else {
        // 还没有总体结果，继续练习
        findNextUnfinishedQuiz()
      }
    }
  }
}

// 暴露方法
defineExpose({
  openQuiz,
  openWithResult,
  openTopicPractice,
  openTopicPracticeWithData,
  handleClose
})
</script>

<style lang="scss" scoped>
.quiz-detail-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
  .quiz-header{
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.quiz-detail {
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

        .tips-title {
          font-size: 13px;
          font-weight: 500;
          color: #409eff;
          margin-bottom: 4px;
        }

        .tips-text {
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }
      }
    }
  }

  .audio-section {
    margin-bottom: 24px;
  }

  .recording-section {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;

    .recording-controls {
      text-align: center;
      padding: 20px 0;

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

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
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

      .recording-finished {
        .recording-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;

          .success-icon {
            color: #67c23a;
            font-size: 18px;
          }

          .finished-text {
            font-size: 16px;
            color: #67c23a;
            font-weight: 500;
          }
        }

        .audio-preview {
          margin: 20px;

          audio {
            margin: 20px;
            width: 100%;
            max-width: 500px;
          }
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
      }
    }
  }

  .collapse-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;

    .left-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .collapse-btn {
      color: #666;
    }

    .previous-btn {
      color: #409eff;
      font-size: 13px;

      &:hover {
        color: #337ecc;
      }
    }

    .close-btn {
      color: #f56c6c;
    }
  }

  // 高斯模糊效果
  .blur-content {
    filter: blur(8px);
    transition: filter 0.3s ease;
    user-select: none;
    pointer-events: none;
  }

  // 练习选择对话框样式
  .practice-options {
    padding: 20px 24px;
  }

  .dialog-footer {
    text-align: right;

    .footer-button {
      margin-left: 12px;

      &:first-child {
        margin-left: 0;
      }
    }
  }

}

.completion-section {
  text-align: center;
}

.completion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.success-icon-large {
  font-size: 22px;
  color: #52c41a;
}

.completion-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.completion-description {
  color: #666;
  font-size: 14px;
  margin: 12px 0 24px 0;
  line-height: 1.5;
}

.warning-content {
  text-align: center;
  padding: 20px 0;

  .warning-icon {
    font-size: 48px;
    color: #e6a23c;
    margin-bottom: 16px;
  }

  p {
    margin: 8px 0;
    font-size: 16px;
    color: #333;
  }

  .min-time-text {
    font-size: 14px;
    color: #666;
  }
}

// 练习选择对话框样式
.practice-options-dialog {
  :deep(.el-dialog) {
    border-radius: 8px;

    .el-dialog__header {
      padding: 20px 24px 0;
      text-align: left;
    }

    .el-dialog__body {
      padding: 10px 0 0;
    }

    .el-dialog__footer {
      padding: 20px 24px;
    }
  }

  .custom-dialog-header {
    display: flex;
    align-items: center;
    gap: 8px;

    .header-icon {
      color: #409eff;
      font-size: 18px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }
  }
}
</style>
