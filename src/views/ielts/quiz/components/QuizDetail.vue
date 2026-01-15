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
    fullscreen
    :before-close="handleClose"
    class="quiz-detail-dialog"
    destroy-on-close
    :show-close="false"
    :modal="true"
    append-to-body
  >
    <template #header />
    <!-- 加载状态 -->
    <div
      v-if="isLoadingData"
      class="loading-container"
    >
      <div class="loading-spinner" />
      <p class="loading-text">{{ t('ielts.quiz.loadingPractice') }}</p>
    </div>
    <div
      class="practice-container"
      v-else-if="currentQuiz"
    >
      <!-- 顶部进度条 -->
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercent + '%' }"
        />
      </div>

      <!-- 头部信息栏 -->
      <header class="header">
        <div class="topic-info">
          <span class="topic-badge">{{ topic?.toUpperCase() }}</span>
          <span class="progress-text">Question {{ currentQuizIndex + 1 }} / {{ currentTopicPractice?.topicPracticeQuizList?.length || 0 }}</span>
        </div>
        <button
          class="btn-exit"
          @click="handleClose"
        >
          <el-icon><SwitchButton /></el-icon>
          Exit
        </button>
      </header>

      <!-- 主内容区域 -->
      <div class="content-area">
        <!-- 音频播放器 -->
        <div
          v-if="currentQuiz.audio"
          class="audio-player-wrapper"
        >
          <AudioWaveform
            ref="audioWaveformRef"
            :audio-url="currentQuiz.audio"
            :autoplay="shouldAutoPlayAudio"
            :clickable="true"
            @ended="handleAudioEnd"
          />
        </div>

        <!-- 题目文字区域 -->
        <div
          class="question-area"
          @click="isCollapsed ? null : toggleCollapse()"
        >
          <div
            class="question-text-wrapper"
            :class="{ 'is-blurred': isCollapsed }"
          >
            <p class="question-text">
              {{ currentQuiz.text }}
            </p>
            <div
              v-if="currentQuiz.tips && !isCollapsed"
              class="question-tips"
            >
              <el-icon class="tips-icon">
                <InfoFilled />
              </el-icon>
              <span v-html="currentQuiz.tips?.replace(/\n/g, '<br>')" />
            </div>
          </div>
          <button
            v-if="isCollapsed"
            class="show-text-btn"
            @click.stop="toggleCollapse"
          >
            <el-icon><View /></el-icon>
            Show Text
          </button>
        </div>

        <!-- 录制控制区域 -->
        <div class="recording-area">
          <!-- 倒计时显示 -->
          <div
            v-if="countdown > 0"
            class="countdown-display"
          >
            <div class="countdown-circle">
              <span class="countdown-number">{{ countdown }}</span>
            </div>
            <p class="countdown-text">
              {{ t('ielts.quiz.prepareRecording') }}
            </p>
          </div>

          <!-- 麦克风按钮（未录制状态） -->
          <div
            v-else-if="!isRecording && !hasRecording && submitStatus !== 'error' && submitStatus !== 'processing'"
            class="mic-idle"
          >
            <!-- 导航按钮 -->
            <div
              v-if="practiceMode && (hasPreviousQuiz() || (hasNextQuiz() && (submitStatus === 'completed' || isQuizAnswered())))"
              class="nav-buttons"
            >
              <button
                v-if="hasPreviousQuiz()"
                class="nav-btn prev"
                @click="goToPreviousQuiz"
                :disabled="!isPreviousQuizReady() || isCheckingPreviousQuiz"
              >
                <el-icon><ArrowLeft /></el-icon>
                <span>{{ t('ielts.quiz.previousQuestion') }}</span>
              </button>
              <button
                v-if="hasNextQuiz() && (submitStatus === 'completed' || isQuizAnswered())"
                class="nav-btn next"
                @click="nextQuiz"
              >
                <el-icon><ArrowRight /></el-icon>
                <span>{{ t('ielts.quiz.nextQuestion') }}</span>
              </button>
            </div>

            <button
              v-if="practiceMode !== 'view'"
              class="mic-button"
              @click="startCountdown"
              :disabled="isProcessing || isQuizAnswered()"
              :class="{ 'is-disabled': isProcessing || isQuizAnswered() }"
            >
              <el-icon class="mic-icon">
                <Microphone />
              </el-icon>
            </button>
            <p class="mic-hint">
              {{ t('ielts.quiz.tapToAnswer') }}
            </p>
          </div>

          <!-- 录制中状态 -->
          <div
            v-else-if="isRecording"
            class="recording-active"
          >
            <div class="recording-indicator">
              <div class="recording-dot" />
              <span>{{ t('ielts.quiz.recording') }}</span>
            </div>
            <div class="recording-time">
              {{ formatTime(getMaxRecordingTime() - recordingTime) }}
            </div>
            <button
              class="stop-btn"
              @click="stopRecording"
            >
              <el-icon><VideoPause /></el-icon>
              {{ t('ielts.quiz.stopRecording') }}
            </button>
          </div>

          <!-- 录制完成状态 -->
          <div
            v-else-if="hasRecording && submitStatus === 'idle'"
            class="recording-done"
          >
            <div class="done-info">
              <el-icon class="done-icon">
                <SuccessFilled />
              </el-icon>
              <span>{{ t('ielts.quiz.recordingCompleted') }} ({{ formatTime(recordingDuration) }})</span>
            </div>
            <div
              v-if="recordingWarning.type"
              :class="['warning-msg', recordingWarning.type]"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>{{ recordingWarning.message }}</span>
            </div>
            <div class="audio-preview">
              <audio
                :src="recordingUrl"
                controls
              />
            </div>
            <div class="done-actions">
              <button
                v-if="practiceMode !== 'view'"
                class="action-btn primary"
                @click="submitRecording"
                :disabled="isSubmitting"
              >
                <el-icon><Upload /></el-icon>
                {{ t('ielts.quiz.submitAnswer') }}
              </button>
              <button
                v-if="practiceMode !== 'view'"
                class="action-btn secondary"
                @click="retryRecording"
              >
                <el-icon><RefreshRight /></el-icon>
                {{ t('ielts.quiz.reRecord') }}
              </button>
            </div>
          </div>

          <!-- 处理中状态 -->
          <div
            v-else-if="submitStatus === 'processing'"
            class="processing-state"
          >
            <div class="processing-spinner" />
            <p>{{ t('ielts.quiz.voiceAnalyzing') }}</p>
            <div class="processing-actions">
              <button
                class="action-btn secondary"
                @click="refreshData"
              >
                <el-icon><RefreshRight /></el-icon>
                {{ t('ielts.quiz.refreshData') }}
              </button>
              <button
                v-if="practiceMode && hasNextQuiz()"
                class="action-btn primary"
                @click="nextQuiz"
              >
                <el-icon><ArrowRight /></el-icon>
                {{ t('ielts.quiz.nextQuestion') }}
              </button>
            </div>
          </div>

          <!-- 错误状态 -->
          <div
            v-else-if="submitStatus === 'error'"
            class="error-state"
          >
            <el-icon class="error-icon">
              <CircleClose />
            </el-icon>
            <p class="error-title">
              {{ practiceMode ? t('ielts.quiz.evaluationError') : t('ielts.quiz.voiceAnalysisError') }}
            </p>
            <p class="error-desc">
              {{ t('ielts.quiz.errorDescription') }}
            </p>
            <div class="error-actions">
              <button
                class="action-btn primary"
                @click="currentTopicPractice?.result ? reappraiseTopic() : reappraiseQuiz()"
              >
                <el-icon><RefreshRight /></el-icon>
                {{ t('ielts.quiz.retryEvaluation') }}
              </button>
              <button
                class="action-btn secondary"
                @click="tryAgain"
              >
                <el-icon><Microphone /></el-icon>
                {{ t('ielts.quiz.retryRecording') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div class="divider" />

        <!-- 示例答案区域 -->
        <div
          v-if="hasSampleAnswers"
          class="sample-answers-section"
        >
          <div
            class="sample-answers-header"
            @click="toggleSampleAnswers"
          >
            <div class="header-left">
              <span class="lightbulb-icon">💡</span>
              <span class="header-title">{{ t('ielts.quiz.sampleAnswers.title') }}</span>
            </div>
            <el-icon :class="['expand-icon', { expanded: showSampleAnswers }]">
              <ArrowDown />
            </el-icon>
          </div>

          <div
            v-show="showSampleAnswers"
            class="sample-answers-content"
          >
            <div class="band-tabs">
              <button
                v-for="band in availableBands"
                :key="band.key"
                :class="['band-tab', { active: activeBand === band.key }]"
                @click="activeBand = band.key"
              >
                {{ band.label }}
              </button>
            </div>

            <div class="answer-card">
              <p class="answer-text">
                "{{ currentSampleAnswer.answer }}"
              </p>
              <div
                v-if="currentSampleAnswer.explanation"
                class="answer-explanation"
              >
                <span class="why-label">{{ t('ielts.quiz.sampleAnswers.why', { band: activeBandLabel }) }}</span>
                {{ currentSampleAnswer.explanation }}
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

        <!-- 完成区域 -->
        <div
          v-if="submitStatus === 'completed' && isLastQuiz()"
          class="completion-section"
        >
          <el-icon class="completion-icon">
            <SuccessFilled />
          </el-icon>
          <h3>{{ practiceMode === 'view' ? t('ielts.quiz.allCompleted') : t('ielts.quiz.congratulations') }}</h3>
          <p>{{ t('ielts.quiz.viewOverallDesc') }}</p>
          <button
            class="action-btn primary"
            @click="openOverallEvaluation"
            :disabled="checkingOverall"
          >
            <el-icon><View /></el-icon>
            {{ t('ielts.quiz.viewOverallButton') }}
          </button>
        </div>
      </div>
    </div>
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
import {onMounted, onUnmounted, ref, provide, inject, computed, watch} from 'vue'
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
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  InfoFilled,
  Microphone,
  RefreshRight,
  SuccessFilled,
  Upload,
  VideoPause,
  WarningFilled,
  CircleClose,
  SwitchButton
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
const isCollapsed = ref(true) // 一开始文本隐藏
const topic = ref('')
const isLoadingData = ref(false)

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
const recordingWarning = ref<{ type: 'short' | 'long' | '', message: string }>({ type: '', message: '' })

// 媒体录制相关
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const stream = ref<MediaStream | null>(null)

// 音频波形组件引用
const audioWaveformRef = ref<InstanceType<typeof AudioWaveform> | null>(null)
const isAudioPlaying = ref(false)
const shouldAutoPlayAudio = ref(true) // 控制音频是否自动播放

// 示例答案相关状态
const showSampleAnswers = ref(false)
const activeBand = ref<'6' | '7' | '8'>('6')

// 进度条百分比
const progressPercent = computed(() => {
  if (!currentTopicPractice.value?.topicPracticeQuizList?.length) return 0
  return ((currentQuizIndex.value + 1) / currentTopicPractice.value.topicPracticeQuizList.length) * 100
})

// 检查是否有示例答案
const hasSampleAnswers = computed(() => {
  if (!currentQuiz.value) return false
  return !!(currentQuiz.value.answer6 || currentQuiz.value.answer7 || currentQuiz.value.answer8)
})

// 获取可用的 Band 选项
const availableBands = computed(() => {
  const bands: { key: '6' | '7' | '8'; label: string }[] = []
  if (currentQuiz.value?.answer6) {
    bands.push({ key: '6', label: 'Band 6.0' })
  }
  if (currentQuiz.value?.answer7) {
    bands.push({ key: '7', label: 'Band 7.0' })
  }
  if (currentQuiz.value?.answer8) {
    bands.push({ key: '8', label: 'Band 8.0+' })
  }
  return bands
})

// 获取当前选中的 Band 标签
const activeBandLabel = computed(() => {
  const labels: Record<string, string> = {
    '6': '6.0',
    '7': '7.0',
    '8': '8.0+'
  }
  return labels[activeBand.value] || '6.0'
})

// 解析示例答案（以 | 分割为答案和解释）
const parseSampleAnswer = (content: string | undefined) => {
  if (!content) return { answer: '', explanation: '' }
  const parts = content.split('|')
  return {
    answer: parts[0]?.trim() || '',
    explanation: parts[1]?.trim() || ''
  }
}

// 获取当前选中的示例答案
const currentSampleAnswer = computed(() => {
  if (!currentQuiz.value) return { answer: '', explanation: '' }

  const answerMap: Record<string, string | undefined> = {
    '6': currentQuiz.value.answer6,
    '7': currentQuiz.value.answer7,
    '8': currentQuiz.value.answer8
  }

  return parseSampleAnswer(answerMap[activeBand.value])
})

// 切换示例答案显示
const toggleSampleAnswers = () => {
  showSampleAnswers.value = !showSampleAnswers.value
  // 默认选中第一个可用的 Band
  if (showSampleAnswers.value && availableBands.value.length > 0) {
    activeBand.value = availableBands.value[0].key
  }
}

// 切换题目时重置示例答案状态
watch(currentQuiz, () => {
  showSampleAnswers.value = false
  activeBand.value = '6'
})

// 提交后状态管理
const practiceId = ref<number | null>(null)
const submitStatus = ref<'idle' | 'processing' | 'completed' | 'error'>('idle')
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

  // 有录音文件才能查看（无论评估成功还是失败）
  return !!previousQuizPractice.audio;
}

// 总体评估组件引用
const overallEvaluationRef = ref<InstanceType<typeof OverallEvaluation>>()

// 获取最大录制时间（秒）
const getMaxRecordingTime = () => {
  return currentQuiz.value?.part === '2001001' ? 60 : 120
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
  isLoadingData.value = true

  if (currentTopicPractice.value) {
    await loadQuizDetails()

    // 检查总体练习是否完成
    const practice = currentTopicPractice.value
    console.log(`[continuePractice] practice.result="${practice.result}"`)
    if (practice.result) {
      const result = JSON.parse(practice.result)
      if (result.code === '0000') {
        // 总体评估完成，显示结果
        submitStatus.value = 'completed'
        console.log(`[continuePractice] 总体评估完成，设置状态为 completed`)
        if (practice.evaluation) {
          evaluationResult.value = JSON.parse(practice.evaluation)
        }
        resultComment.value = practice.comment || ''
      } else {
        // 总体评估异常，需要检查小题完成情况
        submitStatus.value = 'error'
        console.log(`[continuePractice] 总体评估异常，设置状态为 error，调用 initializeContinueMode`)

        // 初始化显示状态：找到最后一个已完成的小题或第一个未完成的小题
        initializeContinueMode()
      }
    } else {
      // 还没有总体结果，继续练习
      console.log(`[continuePractice] 没有总体结果，调用 findNextUnfinishedQuiz`)
      findNextUnfinishedQuiz()
      console.log(`[continuePractice] findNextUnfinishedQuiz 执行完成，当前 submitStatus="${submitStatus.value}"`)
    }
  }

  isLoadingData.value = false
}

// 开始新练习
const startNewPractice = async () => {
  showPracticeOptions.value = false
  practiceMode.value = 'new'

  // 打开主对话框
  visible.value = true
  isLoadingData.value = true

  try {
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
  } finally {
    isLoadingData.value = false
  }
}

// 直接开始新练习（没有未完结的练习）
const startDirectNewPractice = async () => {
  isLoadingData.value = true
  try {
    practiceMode.value = 'new'

    const response = await createTopicPracticeApi({ topic: topic.value })
    currentTopicPractice.value = response.data

    await loadQuizDetails()
    findNextUnfinishedQuiz()
  } finally {
    isLoadingData.value = false
  }
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

      console.log(`[findNextUnfinishedQuiz] 找到未完成题目 index=${i}, quizId=${quiz.quizId}, audio=${!!quiz.audio}, result=${quiz.result}, quizDetail=${!!quizDetail}`)

      if (quizDetail) {
        currentQuiz.value = quizDetail
        foundUnfinished = true

        // 重置录制相关状态
        hasRecording.value = false
        isRecording.value = false
        countdown.value = 0
        recordingWarning.value = { type: '', message: '' }

        // 设置对应的状态
        if (!quiz.audio) {
          // 没有录音，显示idle状态（可以开始录制）
          submitStatus.value = 'idle'
          console.log(`[findNextUnfinishedQuiz] 设置状态为 idle`)
        } else if (quiz.result) {
          // 有录音且有result，检查result状态
          const result = JSON.parse(quiz.result)
          if (result.code === '0000') {
            // 评估成功但在这里被找到，说明没有evaluation
            submitStatus.value = 'processing'
            console.log(`[findNextUnfinishedQuiz] 设置状态为 processing (result.code=0000)`)
          } else {
            // 评估失败，显示错误状态
            submitStatus.value = 'error'
            console.log(`[findNextUnfinishedQuiz] 设置状态为 error (result.code=${result.code})`)
          }
        } else {
          // 有录音但没有result，等待处理
          submitStatus.value = 'processing'
          console.log(`[findNextUnfinishedQuiz] 设置状态为 processing (无result)`)
        }

        break
      } else {
        console.warn(`[findNextUnfinishedQuiz] quizDetail 不存在，跳过 index=${i}, quizId=${quiz.quizId}`)
      }
    }
  }

  if (!foundUnfinished) {
    // 所有题目都已完成，等待总体结果
    submitStatus.value = 'processing'
    console.log(`[findNextUnfinishedQuiz] 所有题目已完成，设置状态为 processing`)
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

  // 重置警告
  recordingWarning.value = { type: '', message: '' }

  // 仅对 part 2001001 进行时长检查
  if (currentQuiz.value?.part === '2001001') {
    if (recordingDuration.value <= 10) {
      recordingWarning.value = {
        type: 'short',
        message: t('ielts.quiz.recordingTooShortWarning')
      }
    } else if (recordingDuration.value > 30) {
      recordingWarning.value = {
        type: 'long',
        message: t('ielts.quiz.recordingTooLongWarning')
      }
    }
  }

  hasRecording.value = true
}

// 重录
const retryRecording = () => {
  hasRecording.value = false
  recordingTime.value = 0
  recordingDuration.value = 0
  recordingWarning.value = { type: '', message: '' }

  if (recordingUrl.value) {
    URL.revokeObjectURL(recordingUrl.value)
    recordingUrl.value = ''
  }
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

            // 如果是最后一题，检查总体评估状态（但不覆盖当前显示的单题评分）
            if (isLastQuiz()) {
              checkOverallEvaluationStatus(false)
            }
          }
        } else {
          // 单题处理失败
          submitStatus.value = 'error'
        }
      } else {
        ElMessage.info(t('ielts.quiz.analysisInProgress'))
      }
    }
  } else {
    ElMessage.info(t('ielts.quiz.noDataToRefresh'))
  }
}

// 检查总体评估状态
const checkOverallEvaluationStatus = async (shouldUpdateEvaluationResult = true) => {
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
      // 只有在明确需要更新时才覆盖evaluationResult（避免覆盖单题评分）
      if (shouldUpdateEvaluationResult && result.evaluation) {
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
  // 切换到处理中状态，等待评估结果
  submitStatus.value = 'processing'
  ElMessage.success(t('ielts.quiz.reevaluationStarted'))
}

// 重新评估总体
const reappraiseTopic = async () => {
  if (!currentTopicPractice.value) return

  await reappraiseTopicPracticeApi({ id: currentTopicPractice.value.id })
  // 切换到处理中状态，等待评估结果
  submitStatus.value = 'processing'
  ElMessage.success(t('ielts.quiz.reevaluationStarted'))
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
  recordingWarning.value = { type: '', message: '' }
  isCollapsed.value = true // 重置为隐藏状态
  isAudioPlaying.value = false
  shouldAutoPlayAudio.value = true // 重置音频自动播放设置
  isLoadingData.value = false // 重置加载状态

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

              // 如果是最后一题，检查总体评估状态（但不覆盖当前显示的单题评分）
              if (isLastQuiz()) {
                checkOverallEvaluationStatus(false)
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
    // 如果当前正在显示单题评分（状态为completed），不要覆盖它
    const shouldUpdate = submitStatus.value !== 'completed'
    await checkOverallEvaluationStatus(shouldUpdate)

    // checkOverallEvaluationStatus 会更新 currentTopicPractice.value 和 overallEvaluationStatus
    // 如果总体评估完成且当前是错误状态，自动切换到完成状态
    if (overallEvaluationStatus.value === 'completed' && submitStatus.value === 'error') {
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
  isLoadingData.value = true

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

  isLoadingData.value = false
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
// CSS 变量
:root {
  --primary: #00C4CC;
  --primary-hover: #009aa0;
  --text-dark: #2D3E50;
  --text-light: #64748B;
  --bg-color: #F5F7FA;
  --white: #FFFFFF;
  --danger: #FF5252;
  --gold: #F1C40F;
}

// 主对话框样式
.quiz-detail-dialog {
  :deep(.el-overlay) {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 2000 !important;
    background-color: rgba(0, 0, 0, 0.3);
  }

  :deep(.el-overlay-dialog) {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    overflow: hidden;
  }

  :deep(.el-dialog) {
    background: #F5F7FA;
    margin: 0 !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-height: none !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  :deep(.el-dialog__header) {
    display: none !important;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  // 加载状态容器
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: 100%;
    height: 100%;
    min-height: 300px;

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid #EEF2F6;
      border-top-color: #00C4CC;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }
  }
}

// 练习卡片容器
.practice-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: none;

  // 顶部进度条
  .progress-bar {
    height: 4px;
    background: #EEF2F6;
    width: 100%;
    border: none;

    .progress-fill {
      height: 100%;
      background: #00C4CC;
      border-radius: 0 4px 4px 0;
      transition: width 0.3s ease;
    }
  }

  // 头部信息栏
  .header {
    padding: 20px 30px;
    border-bottom: 1px solid #EEF2F6;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .topic-info {
      display: flex;
      align-items: center;
      gap: 15px;

      .topic-badge {
        background: #E0F7FA;
        color: #009aa0;
        padding: 5px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .progress-text {
        color: #64748B;
        font-size: 14px;
      }
    }

    .btn-exit {
      color: #FF5252;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.7;
      }
    }
  }

  // 主内容区域
  .content-area {
    padding: 40px 40px 50px 40px;
    display: flex;
    flex-direction: column;
    align-items: center;

    // 音频播放器
    .audio-player-wrapper {
      width: 100%;
      max-width: 550px;
      margin-bottom: 30px;

      :deep(.audio-section) {
        .audio-waveform {
          padding: 12px 16px;
          border-radius: 50px;
          background: #F1F5F9;
          border: none;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03);

          .waveform-container {
            .waveform-canvas {
              height: 32px;
            }
          }
        }
      }
    }

    // 题目区域
    .question-area {
      position: relative;
      margin-bottom: 50px;
      width: 100%;
      text-align: center;
      cursor: pointer;

      .question-text-wrapper {
        transition: all 0.4s ease;

        &.is-blurred {
          filter: blur(12px);
          opacity: 0.3;
          user-select: none;
        }

        .question-text {
          font-size: 28px;
          color: #2D3E50;
          font-weight: 700;
          line-height: 1.4;
          margin: 0;
        }

        .question-tips {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 20px;
          padding: 12px 16px;
          background: #f0f7ff;
          border-radius: 8px;
          text-align: left;
          font-size: 14px;
          color: #64748B;

          .tips-icon {
            color: #409eff;
            margin-top: 2px;
          }
        }
      }

      .show-text-btn {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        z-index: 5;
        backdrop-filter: blur(4px);
        background: rgba(45, 62, 80, 0.8);
        color: #fff;
        border: none;

        &:hover {
          background: rgba(45, 62, 80, 0.9);
        }
      }
    }

    // 录制区域
    .recording-area {
      text-align: center;
      width: 100%;

      // 倒计时
      .countdown-display {
        .countdown-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00C4CC, #009aa0);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          box-shadow: 0 10px 20px rgba(0, 196, 204, 0.3);
          animation: pulse 1s infinite;

          .countdown-number {
            font-size: 36px;
            font-weight: bold;
            color: #fff;
          }
        }

        .countdown-text {
          color: #64748B;
          font-size: 14px;
        }
      }

      // 麦克风空闲状态
      .mic-idle {
        .nav-buttons {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 20px;

          .nav-btn {
            height: 44px;
            padding: 0 16px;
            border-radius: 22px;
            border: 1px solid #EEF2F6;
            background: #fff;
            color: #64748B;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            font-size: 14px;

            &:hover:not(:disabled) {
              border-color: #00C4CC;
              color: #00C4CC;
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }

        .mic-button {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00C4CC, #009aa0);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 10px 20px rgba(0, 196, 204, 0.3);
          transition: transform 0.2s, box-shadow 0.2s;

          &:hover:not(.is-disabled) {
            transform: scale(1.05);
            box-shadow: 0 15px 30px rgba(0, 196, 204, 0.4);
          }

          &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .mic-icon {
            font-size: 28px;
            color: #fff;
          }
        }

        .mic-hint {
          color: #64748B;
          font-size: 14px;
          margin: 0;
        }
      }

      // 录制中
      .recording-active {
        .recording-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;

          .recording-dot {
            width: 12px;
            height: 12px;
            background: #FF5252;
            border-radius: 50%;
            animation: blink 1s infinite;
          }

          span {
            color: #FF5252;
            font-weight: 500;
          }
        }

        .recording-time {
          font-size: 48px;
          font-weight: bold;
          color: #FF5252;
          margin-bottom: 24px;
        }

        .stop-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 24px;
          background: #FF5252;
          color: #fff;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #e74c3c;
          }
        }
      }

      // 录制完成
      .recording-done {
        .done-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;

          .done-icon {
            color: #52c41a;
            font-size: 20px;
          }

          span {
            color: #52c41a;
            font-weight: 500;
          }
        }

        .warning-msg {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          margin-bottom: 16px;

          &.short {
            background: #fef0f0;
            color: #FF5252;
          }

          &.long {
            background: #fdf6ec;
            color: #e6a23c;
          }
        }

        .audio-preview {
          margin: 20px 0;

          audio {
            width: 100%;
            max-width: 400px;
          }
        }

        .done-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
      }

      // 处理中
      .processing-state {
        .processing-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #EEF2F6;
          border-top-color: #00C4CC;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        p {
          color: #64748B;
          margin-bottom: 24px;
        }

        .processing-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
      }

      // 错误状态
      .error-state {
        .error-icon {
          font-size: 48px;
          color: #FF5252;
          margin-bottom: 16px;
        }

        .error-title {
          font-size: 16px;
          font-weight: 600;
          color: #2D3E50;
          margin-bottom: 8px;
        }

        .error-desc {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .error-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
      }
    }

    // 通用按钮样式
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &.primary {
        background: #00C4CC;
        color: #fff;

        &:hover:not(:disabled) {
          background: #009aa0;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: #F8FAFC;
        color: #64748B;
        border: 1px solid #EEF2F6;

        &:hover {
          background: #EEF2F6;
        }
      }
    }

    // 分隔线
    .divider {
      height: 1px;
      background: #EEF2F6;
      margin: 20px 0;
      width: 100%;
    }

    // 示例答案区域
    .sample-answers-section {
      background: #F8FAFC;
      border-radius: 16px;
      overflow: hidden;
      width: 100%;
      border: 1px solid #EEF2F6;

      .sample-answers-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: #f0f4f8;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;

          .lightbulb-icon {
            font-size: 18px;
          }

          .header-title {
            font-size: 16px;
            font-weight: 600;
            color: #2D3E50;
          }
        }

        .expand-icon {
          color: #cbd5e1;
          transition: transform 0.3s;

          &.expanded {
            transform: rotate(180deg);
          }
        }
      }

      .sample-answers-content {
        padding: 0 20px 20px;

        .band-tabs {
          display: flex;
          gap: 10px;
          padding: 16px 0 20px;
          justify-content: center;

          .band-tab {
            padding: 8px 20px;
            border-radius: 20px;
            border: 1px solid #EEF2F6;
            background: white;
            font-size: 13px;
            font-weight: 600;
            color: #64748B;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
              border-color: #00C4CC;
              color: #00C4CC;
            }

            &.active {
              background: #00C4CC;
              color: white;
              border-color: #00C4CC;
              box-shadow: 0 4px 10px rgba(0, 196, 204, 0.2);
            }
          }
        }

        .answer-card {
          background: white;
          padding: 25px;
          border-radius: 16px;
          border: 1px solid #EEF2F6;
          animation: fadeIn 0.3s ease;

          .answer-text {
            font-size: 15px;
            line-height: 1.6;
            color: #2D3E50;
            margin: 0 0 16px 0;
          }

          .answer-explanation {
            font-size: 13px;
            color: #64748B;
            background: #F0F4F8;
            padding: 10px 15px;
            border-radius: 8px;
            border-left: 3px solid #00C4CC;

            .why-label {
              font-weight: 600;
              color: #00C4CC;
              margin-right: 4px;
            }
          }
        }
      }
    }

    // 完成区域
    .completion-section {
      text-align: center;
      padding: 40px 20px;
      background: #F8FAFC;
      border-radius: 16px;
      margin-top: 24px;
      width: 100%;
      border: 1px solid #EEF2F6;

      .completion-icon {
        font-size: 48px;
        color: #52c41a;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        color: #2D3E50;
        margin: 0 0 8px 0;
      }

      p {
        color: #64748B;
        margin: 0 0 24px 0;
      }
    }
  }
}

// 动画
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

// 练习选择对话框样式
.practice-options-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;

    .el-dialog__header {
      padding: 20px 24px 0;
      text-align: left;
    }

    .el-dialog__body {
      padding: 16px 24px;
    }

    .el-dialog__footer {
      padding: 16px 24px;
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

<style lang="scss">
// 全局样式 - 用于 append-to-body 的对话框
.quiz-detail-dialog {
  .el-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: 2000 !important;
  }

  .el-dialog {
    background: #F5F7FA !important;
    margin: 0 !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    height: 100% !important;
    max-height: none !important;
    border: none !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  .el-dialog__header {
    display: none !important;
    padding: 0 !important;
    margin: 0 !important;
    height: 0 !important;
  }

  .el-dialog__body {
    padding: 15vh 20px !important;
    width: 100% !important;
    height: 100% !important;
    overflow-y: auto;
    display: flex !important;
    justify-content: center !important;
    align-items: flex-start !important;
    box-sizing: border-box;
  }
}
</style>
