<template>
  <div>
    <!-- 未完成练习确认对话框 -->
    <el-dialog
      v-model="showContinueDialog"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      class="continue-dialog"
    >
      <template #header>
        <div class="custom-header">
          <el-icon
            class="close-icon"
            @click="handleContinueDialogClose"
          >
            <Close />
          </el-icon>
        </div>
      </template>

      <div class="continue-content">
        <div class="continue-header">
          <div class="title-with-icon">
            <el-icon
              size="24"
              color="#E6A23C"
            >
              <WarningFilled />
            </el-icon>
            <h3>检测到未完成的练习</h3>
          </div>
          <p class="subtitle">
            您有一个未完成的面试练习，请选择如何继续
          </p>
        </div>

        <div class="notice-cards">
          <div
            class="notice-card continue-card"
            @click="handleContinueChoice(true)"
          >
            <div class="card-icon">
              <el-icon color="#409EFF">
                <VideoPlay />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>继续练习</h4>
              <p>从上次中断的地方继续答题</p>
            </div>
          </div>

          <div
            class="notice-card new-card"
            @click="handleContinueChoice(false)"
          >
            <div class="card-icon">
              <el-icon color="#67C23A">
                <Refresh />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>重新开始</h4>
              <p>放弃当前进度，开始新的练习</p>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 退出确认对话框 -->
    <el-dialog
      v-model="showExitDialog"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
      :show-header="false"
      class="exit-dialog"
    >
      <div class="exit-content">
        <div class="exit-header">
          <div class="title-with-icon">
            <el-icon
              size="24"
              color="#E6A23C"
            >
              <WarningFilled />
            </el-icon>
            <h3>退出确认</h3>
          </div>
          <p class="subtitle">
            确定要退出练习吗？当前进度将会保存
          </p>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            size="large"
            @click="handleExitCancel"
            text
          >
            <el-icon style="margin-right: 8px">
              <Close />
            </el-icon>
            取消
          </el-button>
          <el-button
            type="danger"
            size="large"
            @click="handleExitConfirm"
            text
          >
            <el-icon style="margin-right: 8px">
              <CircleCloseFilled />
            </el-icon>
            确认退出
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 准备确认对话框 -->
    <el-dialog
      v-model="showPreparationDialog"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      :show-header="false"
      class="preparation-dialog"
    >
      <div class="preparation-content">
        <div class="preparation-header">
          <div class="title-with-icon">
            <el-icon
              size="24"
              color="#2E8BFA"
            >
              <InfoFilled />
            </el-icon>
            <h3>准备开始面试练习</h3>
          </div>
          <p class="subtitle">
            请确保您已经准备好，并且设备正常工作
          </p>
        </div>

        <div class="notice-cards">
          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#67C23A">
                <Microphone />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>设备检查</h4>
              <p>请确保麦克风已授权并且工作正常</p>
            </div>
          </div>

          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#F56C6C">
                <Warning />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>练习环境</h4>
              <p>请选择安静的环境进行练习</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            size="large"
            type="danger"
            @click="showPreparationDialog = false"
            text
          >
            <el-icon style="margin-right: 8px">
              <ArrowLeft />
            </el-icon>
            取消
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="handleStartConfirm"
            text
          >
            <el-icon style="margin-right: 8px">
              <VideoPlay />
            </el-icon>
            我准备好了
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 面试练习对话框 -->
    <el-dialog
      v-model="visible"
      width="100vw"
      :before-close="handleClose"
      class="practice-dialog"
      destroy-on-close
      fullscreen
      :show-close="false"
    >
      <template #header>
        <div class="practice-header">
          <span>{{ projectName }}</span>
          <el-button
            type="danger"
            text
            class="close-btn"
            @click="handleClose"
          >
            退出练习
          </el-button>
        </div>
      </template>

      <div
        class="practice-content"
        v-if="practiceStarted"
      >
        <!-- 题目区域 -->
        <div
          class="question-section"
          v-if="currentQuestion && !showingEvaluation"
        >
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
            {{ currentQuestion }}
          </div>

          <div
            v-if="currentQuestionTips"
            class="question-tips"
            :class="{ 'blur-content': isCollapsed }"
          >
            <span style="color: #409eff; font-weight: 600;">Tips：</span>
            <span style="color: #606266;">{{ currentQuestionTips }}</span>
          </div>
          <div
            v-if="currentQuestionTarget"
            class="question-target"
            :class="{ 'blur-content': isCollapsed }"
          >
            <span style="color: #f56c6c; font-weight: 600;">Research direction：</span>
            <span style="color: #606266;">{{ currentQuestionTarget }}</span>
          </div>
        </div>

        <!-- 音频播放器 -->
        <AudioWaveform
          v-if="!showingEvaluation"
          :audio-url="audioUrl"
          :autoplay="true"
          :clickable="true"
          v-show="audioUrl"
          @ended="handleAudioEnd"
        />

        <!-- 录制控制区域 -->
        <div class="recording-section">
          <div class="recording-controls">
            <!-- 录制倒计时显示 -->
            <div
              v-if="countdown > 0"
              class="countdown-display"
            >
              <div class="countdown-number">
                {{ countdown }}
              </div>
              <div class="countdown-text">
                准备录制...
              </div>
            </div>

            <!-- 录制中状态 -->
            <div
              v-else-if="isRecording"
              class="recording-status"
            >
              <div class="recording-indicator">
                <div class="recording-dot" />
                <span class="recording-text">正在录制</span>
              </div>
              <div class="recording-time">
                {{ formatTime(recordingTime) }}
              </div>
              <el-button
                type="danger"
                :icon="VideoPause"
                @click="stopRecording"
                class="stop-btn"
              >
                停止录制
              </el-button>
            </div>

            <!-- 上传中状态 -->
            <div
              v-else-if="isUploading"
              class="uploading-status"
            >
              <div class="uploading-indicator">
                <div class="uploading-spinner" />
                <span class="uploading-text">正在上传音频...</span>
              </div>
            </div>

            <!-- 上传失败状态 -->
            <div
              v-else-if="uploadError"
              class="upload-error-status"
            >
              <div class="error-content">
                <el-icon class="error-icon">
                  <WarningFilled />
                </el-icon>
                <p class="error-message">
                  音频上传失败，请重试
                </p>
                <div class="error-actions">
                  <el-button
                    type="primary"
                    text
                    @click="retryUpload"
                  >
                    重新上传
                  </el-button>
                  <el-button
                    type="warning"
                    text
                    @click="retryRecording"
                  >
                    重新录制
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 等待回复状态 -->
            <div
              v-else-if="waitingResponse"
              class="waiting-status"
            >
              <div class="waiting-indicator">
                <div class="waiting-spinner" />
                <span class="waiting-text">{{ isFirstMessage ? '正在初始化...' : '正在处理...' }}</span>
              </div>
            </div>

            <!-- 等待评估状态 -->
            <div
              v-else-if="waitingEvaluation"
              class="waiting-evaluation"
            >
              <div class="waiting-indicator">
                <div class="waiting-spinner" />
                <span class="waiting-text">正在评估中...</span>
              </div>
            </div>

            <!-- 评估准备好状态（未展示） - 优先于错误状态 -->
            <div
              v-else-if="evaluationReady && !showingEvaluation"
              class="evaluation-ready"
            >
              <div class="ready-header">
                <el-icon :class="evaluationError ? 'error-icon-large' : 'success-icon-large'">
                  <component :is="evaluationError ? WarningFilled : SuccessFilled" />
                </el-icon>
                <span class="ready-title">{{ evaluationError ? '评估异常' : '评估已完成' }}</span>
              </div>

              <p
                class="ready-desc"
                :class="{ 'error-desc': evaluationError }"
              >
                {{ evaluationError ? errorMessage || '评估生成失败，请重试' : '您的练习已经完成评估，点击下方按钮查看详细的评估报告' }}
              </p>

              <div class="ready-actions">
                <el-button
                  v-if="evaluationError"
                  type="warning"
                  :loading="reappraising"
                  @click="handleReappraise"
                  :icon="Refresh"
                  size="large"
                  text
                >
                  {{ reappraising ? '正在重新评估...' : '重新生成评估' }}
                </el-button>
                <el-button
                  v-else
                  type="primary"
                  @click="handleViewEvaluation"
                  :icon="Document"
                  size="large"
                  text
                >
                  查看评估报告
                </el-button>
              </div>
            </div>

            <!-- 错误状态 -->
            <div
              v-else-if="errorMessage"
              class="error-status"
            >
              <div class="error-content">
                <el-icon :class="canRetry ? 'error-icon' : 'fatal-error-icon'">
                  <component :is="canRetry ? WarningFilled : CircleCloseFilled" />
                </el-icon>
                <p class="error-message">
                  {{ errorMessage }}
                </p>
                <div class="error-actions">
                  <el-button
                    v-if="canRetry"
                    type="primary"
                    text
                    @click="retryRecording"
                  >
                    重新回答
                  </el-button>
                  <el-button
                    v-else
                    type="danger"
                    text
                    @click="handleClose"
                  >
                    退出练习
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 练习结束状态（展示评估） -->
            <div
              v-else-if="practiceFinished"
            >
              <!-- 评分和点评展示 - 使用 Markdown 渲染 -->
              <div class="evaluation-container">
                <div
                  v-if="evaluationResult"
                  class="evaluation-section"
                >
                  <div class="section-header">
                    <el-icon class="header-icon">
                      <Document />
                    </el-icon>
                    <h3>评分</h3>
                  </div>
                  <div class="markdown-content">
                    <v-md-preview :text="evaluationResult" />
                  </div>
                </div>

                <div
                  v-if="evaluationComment"
                  class="comment-section"
                >
                  <div class="section-header">
                    <el-icon class="header-icon">
                      <Document />
                    </el-icon>
                    <h3>评语</h3>
                  </div>
                  <div class="markdown-content">
                    <v-md-preview :text="evaluationComment" />
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="evaluation-actions">
                  <el-button
                    v-if="evaluationError"
                    type="warning"
                    :loading="reappraising"
                    @click="handleReappraise"
                    :icon="Refresh"
                  >
                    {{ reappraising ? '正在重新评估...' : '重新生成评估' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useSocketStore } from '@/stores/modules/socket'
import { uploadFile } from '@/api/modules/system/upload'
import { getUnfinishedProjTaskApi, reappraiseApi } from '@/api/modules/research/projTask'
import mittBus from '@/utils/mittBus'
import { RESEARCH_CHANNEL } from '@/config/consts'
import {
  InfoFilled,
  Microphone,
  Warning,
  ArrowLeft,
  VideoPlay,
  VideoPause,
  WarningFilled,
  SuccessFilled,
  CircleCloseFilled,
  Refresh,
  Close,
  View,
  Hide,
  Document
} from '@element-plus/icons-vue'
import AudioWaveform from '@/views/ielts/mockExam/components/AudioWaveform.vue'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import type { IResearchProj } from '@/api/interface/research/researchProj'

// 初始化 markdown 预览主题
VMdPreview.use(githubTheme)

// Socket 相关
const socketStore = useSocketStore()

// 对话框状态
const showContinueDialog = ref(false)
const showPreparationDialog = ref(false)
const showExitDialog = ref(false)
const visible = ref(false)
const practiceStarted = ref(false)
const isCollapsed = ref(false) // 题目是否隐藏，默认显示

// 项目信息
const selectedProject = ref<IResearchProj.Row>()
const projectName = ref('')
const currentProjTaskId = ref<number | null>(null) // 当前任务ID（用于重新评估）
const currentProjTaskDetailId = ref<number | null>(null)
const continueFlag = ref<boolean | null>(null) // 是否继续上次练习，默认为null
const currentSpeakerId = ref<number | null>(null) // 当前练习使用的发音人ID

// 题目和音频
const currentQuestion = ref('')
const currentQuestionType = ref('')
const currentQuestionTips = ref('')
const currentQuestionTarget = ref('')
const projTaskDetails = ref<any[]>([])
const audioUrl = ref('')
const currentAudioBase64 = ref('')

// 录制相关状态
const countdown = ref(0)
const isRecording = ref(false)
const recordingTime = ref(0)
const isUploading = ref(false)
const waitingResponse = ref(false)
const isFirstMessage = ref(true)
const waitingEvaluation = ref(false)
const allowAutoRecord = ref(false) // 是否允许音频播放结束后自动开始录制

// 定时器
const countdownTimer = ref<number | null>(null)
const recordingTimer = ref<number | null>(null)

// 媒体录制
const stream = ref<MediaStream | null>(null)
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
    projPracticeAudioProcessor: AudioProcessor | null
    AudioContext: typeof AudioContext
    webkitAudioContext: typeof AudioContext
  }
}

// 错误和完成状态
const errorMessage = ref('')
const errorMessageJSON = ref({} as any)
const canRetry = ref(true) // 是否可以重试
const practiceFinished = ref(false)
const evaluationReady = ref(false) // 评估是否已准备好（但未展示）
const showingEvaluation = ref(false) // 是否正在查看评估
const evaluationError = ref(false) // 评估是否失败
const evaluationResult = ref<any>(null)
const evaluationComment = ref<any>(null)
const reappraising = ref(false) // 是否正在重新评估
const uploadError = ref(false) // 上传是否失败
const recordedAudioBlob = ref<Blob | null>(null) // 保存录制的音频

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
    ElMessage.error('麦克风权限获取失败')
    return false
  }
}

// 开始倒计时
const startCountdown = async () => {
  if (!await requestMicrophonePermission()) {
    return
  }

  // 开始倒计时后，禁止后续自动录制
  allowAutoRecord.value = false

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

// 开始录制
const startRecording = async () => {
  if (!stream.value) {
    if (!await requestMicrophonePermission()) {
      return
    }
  }

  // 使用 Web Audio API 处理音频
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
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
  window.projPracticeAudioProcessor = { audioContext, processor, source, audioChunks: processedAudioChunks }

  audioChunks.value = []
  isRecording.value = true
  recordingTime.value = 120 // 从120秒开始倒计时

  // 开始倒计时（最大120秒）
  recordingTimer.value = window.setInterval(() => {
    recordingTime.value--

    // 倒计时结束自动停止
    if (recordingTime.value <= 0) {
      stopRecording()
    }
  }, 1000)
}

// 停止录制
const stopRecording = () => {
  if (isRecording.value && window.projPracticeAudioProcessor) {
    const { audioContext, processor, source, audioChunks: processedChunks } = window.projPracticeAudioProcessor

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
    const wavBlob = createWavFile(result, 16000)

    // 模拟原来的 audioChunks 行为
    audioChunks.value = [wavBlob as Blob]

    // 清理
    window.projPracticeAudioProcessor = null
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
  if (!practiceStarted.value) {
    return
  }

  const audioBlob = audioChunks.value[0]
  recordedAudioBlob.value = audioBlob

  // 上传音频
  isUploading.value = true
  uploadError.value = false

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
      researchProjId: selectedProject.value?.id,
      projTaskDetailId: currentProjTaskDetailId.value,
      continueFlag: continueFlag.value,
      speakerId: currentSpeakerId.value,
      audioUrl: uploadedAudioUrl
    }

    socketStore.send(message, RESEARCH_CHANNEL)
    waitingResponse.value = true
    isFirstMessage.value = false

  } catch (error) {
    uploadError.value = true
    ElMessage.error('音频上传失败')
  } finally {
    isUploading.value = false
  }
}

// 重新上传音频
const retryUpload = async () => {
  if (!recordedAudioBlob.value) {
    ElMessage.error('未找到录音文件')
    return
  }

  isUploading.value = true
  uploadError.value = false

  try {
    const file = new File([recordedAudioBlob.value], `recording-${Date.now()}.wav`, { type: 'audio/wav' })

    const uploadParams = {
      file: file as any,
      dirTag: 'audio'
    }

    const response = await uploadFile(uploadParams)
    const uploadedAudioUrl = response.data.url

    // 发送消息到后端
    const message = {
      researchProjId: selectedProject.value?.id,
      projTaskDetailId: currentProjTaskDetailId.value,
      continueFlag: continueFlag.value,
      speakerId: currentSpeakerId.value,
      audioUrl: uploadedAudioUrl
    }

    socketStore.send(message, RESEARCH_CHANNEL)
    waitingResponse.value = true
    isFirstMessage.value = false

  } catch (error) {
    uploadError.value = true
    ElMessage.error('音频上传失败')
  } finally {
    isUploading.value = false
  }
}

// 重新录制
const retryRecording = () => {
  errorMessage.value = ''
  canRetry.value = true
  uploadError.value = false
  recordedAudioBlob.value = null
  startCountdown()
}

// 音频播放结束
const handleAudioEnd = () => {
  // 只有自动播放的音频（第一次播放）结束后才自动开始录制
  // 用户手动点击重听的音频播放结束后不开始录制
  if (allowAutoRecord.value) {
    startCountdown()
  }
}

// 查看评估
const handleViewEvaluation = () => {
  showingEvaluation.value = true
  practiceFinished.value = true
}

// 重新评估
const handleReappraise = async () => {
  if (!currentProjTaskId.value) {
    ElMessage.error('无法获取任务ID')
    return
  }

  try {
    reappraising.value = true
    const { data } = await reappraiseApi({ id: currentProjTaskId.value })
    // 处理返回的评估数据
    if (data) {
      evaluationResult.value = data.score
      evaluationComment.value = data.comment
      const hasValidData = data.score || data.comment
      evaluationError.value = !hasValidData

      if (hasValidData) {
        // 清除错误消息
        errorMessage.value = ''
      }
    }
  }finally {
    reappraising.value = false
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
    projTaskId: taskId,
    projTaskDetailId: taskDetailId,
    extraData,
    audioBase64,
    error
  } = message

  waitingResponse.value = false
  // 检查错误
  if (error) {
    // 如果是在等待评估阶段收到错误，表示评估异常
    if (waitingEvaluation.value) {
      waitingEvaluation.value = false
      evaluationError.value = true
      evaluationReady.value = true
      // 保存错误消息用于显示
      errorMessage.value = error
      return
    }

    // 否则是答题过程中的错误
    // 判断是否为JSON字符串
    try {
      // JSON错误 - 无法继续练习
      errorMessageJSON.value = JSON.parse(error);
      errorMessage.value = errorMessageJSON.value?.message
      canRetry.value = false
    } catch {
      // 普通字符串错误 - 可以重试
      errorMessage.value = error
      canRetry.value = true
    }

    waitingResponse.value = false
    waitingEvaluation.value = false
    isUploading.value = false
    isRecording.value = false
    return
  }

  // 更新 projTaskId
  if (taskId) {
    currentProjTaskId.value = taskId
  }

  // 处理额外数据（题目、评分等）
  if (extraData) {
    // 首次接收到数据，保存projTaskDetails
    if (extraData.projTaskDetails && extraData.projTaskDetails.length > 0) {
      projTaskDetails.value = extraData.projTaskDetails
    }

    // 如果是评估数据（练习结束）
    if (extraData.score !== undefined || extraData.comment !== undefined) {
      waitingEvaluation.value = false
      evaluationResult.value = extraData.score
      evaluationComment.value = extraData.comment
      // 判断评估是否失败（评分和评语都为空或null）
      evaluationError.value = !extraData.score && !extraData.comment
      // 设置评估准备好状态，而不是直接完成
      evaluationReady.value = true
      reappraising.value = false
      return
    }
  }

  // 检查是否为最后一题（没有 projTaskDetailId 返回）
  const isLastQuestion = !taskDetailId && !practiceFinished.value

  // 处理音频
  if (audioBase64) {
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

      // 如果是最后一题，播放完音频后不再开始录制，只等待评估结果
      if (isLastQuestion) {
        allowAutoRecord.value = false
        waitingEvaluation.value = true
      } else {
        // 收到新音频后，允许自动播放结束后开始录制
        allowAutoRecord.value = true
      }
    }
  }

  // 更新 projTaskDetailId 并匹配题目信息
  if (taskDetailId) {
    currentProjTaskDetailId.value = taskDetailId

    // 从projTaskDetails中找到对应的题目详情
    const currentDetail = projTaskDetails.value.find(detail => detail.id === taskDetailId)
    if (currentDetail && currentDetail.researchQuestion) {
      const question = currentDetail.researchQuestion
      currentQuestion.value = question.content || ''
      currentQuestionType.value = question.type || ''
      currentQuestionTips.value = question.tips || ''
      currentQuestionTarget.value = question.target || ''
    }
  }
}

// 处理继续对话框关闭
const handleContinueDialogClose = () => {
  showContinueDialog.value = false
  continueFlag.value = null
}

// 处理用户选择继续或新练习
const handleContinueChoice = (isContinue: boolean) => {
  continueFlag.value = isContinue
  showContinueDialog.value = false
  // 打开练习对话框
  visible.value = true
  startPractice()
}

// 检查未完结任务
const checkUnfinishedTask = async (): Promise<boolean> => {
  if (!selectedProject.value?.id) return true

  try {
    const { data } = await getUnfinishedProjTaskApi({ researchProjId: selectedProject.value.id })
    if (data && data.id) {
      // 有未完结的任务，显示选择对话框
      showContinueDialog.value = true
      return false // 暂停流程，等待用户选择
    } else {
      // 没有未完结的任务，保持为null
      continueFlag.value = null
      return true
    }
  } catch (error) {
    console.error('检查未完结任务失败：', error)
    return false
  }
}

// 确认开始练习
const handleStartConfirm = async () => {
  showPreparationDialog.value = false

  // 检查未完结任务
  const canStart = await checkUnfinishedTask()

  // 如果检查失败或需要等待用户选择，不打开练习对话框
  if (!canStart) {
    return
  }

  // 没有未完结任务，直接打开练习对话框
  visible.value = true
  startPractice()
}

// 开始练习
const startPractice = () => {
  // 清理之前的状态
  practiceStarted.value = true
  isFirstMessage.value = true
  currentQuestion.value = ''
  currentQuestionType.value = ''
  currentQuestionTips.value = ''
  currentQuestionTarget.value = ''
  projTaskDetails.value = []
  audioUrl.value = ''
  currentAudioBase64.value = ''
  countdown.value = 0
  isRecording.value = false
  recordingTime.value = 0
  isUploading.value = false
  waitingResponse.value = false
  errorMessageJSON.value = null
  errorMessage.value = ''
  canRetry.value = true
  practiceFinished.value = false
  evaluationReady.value = false
  showingEvaluation.value = false
  evaluationError.value = false
  evaluationResult.value = null
  evaluationComment.value = null
  reappraising.value = false
  waitingEvaluation.value = false
  currentProjTaskId.value = null
  currentProjTaskDetailId.value = null
  allowAutoRecord.value = false
  uploadError.value = false
  recordedAudioBlob.value = null
  // 注意：continueFlag 不重置，保持checkUnfinishedTask设置的值

  // 随机选择一个发音人ID，整个练习过程都使用这个ID
  const speakerIds = [1, 3, 7, 10, 12]
  currentSpeakerId.value = speakerIds[Math.floor(Math.random() * speakerIds.length)]

  // 发送初始消息
  const message = {
    researchProjId: selectedProject.value?.id,
    projTaskDetailId: null,
    continueFlag: continueFlag.value,
    speakerId: currentSpeakerId.value,
    audioUrl: null
  }

  socketStore.send(message, RESEARCH_CHANNEL)
  waitingResponse.value = true
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

  // 清理音频处理器
  if (window.projPracticeAudioProcessor) {
    const { audioContext, processor, source } = window.projPracticeAudioProcessor
    try {
      source.disconnect()
      processor.disconnect()
      audioContext.close()
    } catch (e) {
      // 忽略清理错误
    }
    window.projPracticeAudioProcessor = null
  }
}

// 关闭对话框
const handleClose = async () => {
  // 如果是JSON错误（无法继续练习），直接关闭不弹确认框
  const hasJSONError = errorMessageJSON.value && Object.keys(errorMessageJSON.value).length > 0

  if (practiceStarted.value && !practiceFinished.value && !hasJSONError) {
    // 显示自定义退出确认对话框
    showExitDialog.value = true
    return
  }

  // 执行退出逻辑
  doClose()
}

// 执行退出
const doClose = () => {
  // 先设置practiceStarted为false，防止cleanup中的stopRecording触发消息发送
  practiceStarted.value = false

  // 安全检查，避免热更新时cleanup未定义
  if (typeof cleanup === 'function') {
    cleanup()
  }

  // 重置所有状态
  isFirstMessage.value = true
  currentQuestion.value = ''
  currentQuestionType.value = ''
  currentQuestionTips.value = ''
  currentQuestionTarget.value = ''
  projTaskDetails.value = []
  currentAudioBase64.value = ''
  countdown.value = 0
  isRecording.value = false
  recordingTime.value = 0
  isUploading.value = false
  waitingResponse.value = false
  errorMessageJSON.value = null
  errorMessage.value = ''
  canRetry.value = true
  practiceFinished.value = false
  evaluationReady.value = false
  showingEvaluation.value = false
  evaluationError.value = false
  evaluationResult.value = null
  evaluationComment.value = null
  reappraising.value = false
  waitingEvaluation.value = false
  currentProjTaskId.value = null
  currentProjTaskDetailId.value = null
  continueFlag.value = null
  allowAutoRecord.value = false
  currentSpeakerId.value = null
  uploadError.value = false
  recordedAudioBlob.value = null

  visible.value = false
}

// 确认退出
const handleExitConfirm = () => {
  showExitDialog.value = false
  doClose()
}

// 取消退出
const handleExitCancel = () => {
  showExitDialog.value = false
}

// 打开练习（外部调用）
const open = (project: IResearchProj.Row) => {
  selectedProject.value = project
  projectName.value = project.name || ''
  continueFlag.value = null // 重置为初始状态
  showPreparationDialog.value = true
}

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
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
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

// 重采样函数
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
      output[i] = inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction
    } else {
      output[i] = inputBuffer[index]
    }
  }

  return output
}

onMounted(() => {
  (mittBus as any).on(`socket.${RESEARCH_CHANNEL}`, handleSocketMessage)
})

onUnmounted(() => {
  // 安全检查，避免热更新时cleanup未定义
  if (typeof cleanup === 'function') {
    cleanup()
  }
  (mittBus as any).off(`socket.${RESEARCH_CHANNEL}`, handleSocketMessage)
})

defineExpose({
  open
})
</script>

<style scoped lang="scss">
// 继续对话框样式 - 和准备对话框保持一致
:global(.continue-dialog .el-dialog) {
  border-top: none !important;
}

:global(.continue-dialog .el-dialog__body) {
  border-top: none !important;
  padding-top: 0 !important;
}

:global(.continue-dialog .el-dialog__header) {
  border-bottom: none !important;
  padding: 0 !important;
  margin: 0 !important;

  .custom-header {
    position: relative;
    height: 0;

    .close-icon {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 18px;
      color: #909399;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #606266;
      }
    }
  }
}

:global(.continue-dialog .el-dialog__footer) {
  border-top: none !important;
}

.continue-content {
  padding: 32px;

  .continue-header {
    text-align: center;
    margin-bottom: 32px;

    .title-with-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .notice-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .notice-card {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      background: #fafbfc;
      border: 2px solid #ebeef5;
      border-radius: 8px;
      transition: all 0.3s;
      cursor: pointer;
      user-select: none;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &:active {
        transform: translateY(0);
      }

      &.continue-card:hover {
        background: #f0f9ff;
        border-color: #409eff;
      }

      &.new-card:hover {
        background: #f0f9ff;
        border-color: #67c23a;
      }

      .card-icon {
        margin-right: 12px;
        font-size: 20px;
      }

      .card-content {
        flex: 1;

        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.4;
        }
      }
    }
  }
}

// 退出对话框样式
:global(.exit-dialog .el-dialog) {
  border-top: none !important;
}

:global(.exit-dialog .el-dialog__body) {
  border-top: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:global(.exit-dialog .el-dialog__header) {
  display: none !important;
  border-bottom: none !important;
}

:global(.exit-dialog .el-dialog__footer) {
  border-top: none !important;
}

.exit-content {
  padding: 32px;

  .exit-header {
    text-align: center;

    .title-with-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }
}

// 全局覆盖 dialog 的灰线
:global(.preparation-dialog .el-dialog) {
  border-top: none !important;
}

:global(.preparation-dialog .el-dialog__body) {
  border-top: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:global(.preparation-dialog .el-dialog__header) {
  display: none !important;
  border-bottom: none !important;
}

:global(.preparation-dialog .el-dialog__footer) {
  border-top: none !important;
}

.preparation-content {
  padding: 32px;

  .preparation-header {
    text-align: center;
    margin-bottom: 32px;

    .title-with-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;

      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }

  .notice-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .notice-card {
      display: flex;
      align-items: flex-start;
      padding: 20px;
      background: #fafbfc;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        background: #f0f9ff;
        border-color: #d1ecf1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .card-icon {
        margin-right: 12px;
        font-size: 20px;
      }

      .card-content {
        flex: 1;

        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.4;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.practice-dialog {
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

.practice-content {
  padding: 8px;
  margin: 0 auto;

  .question-section {
    position: relative;
    margin-bottom: 24px;
    padding: 24px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e6e8eb;

    .collapse-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 10;
    }

    .question-text {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
      margin-bottom: 16px;
      padding-right: 50px;
      transition: filter 0.3s ease;
    }

    .blur-content {
      filter: blur(8px);
      user-select: none;
    }

    .question-tips {
      margin-bottom: 12px;
      padding: 12px;
      background: #f0f9ff;
      border-left: 3px solid #409eff;
      border-radius: 4px;
      line-height: 1.6;
      transition: filter 0.3s ease;
    }

    .question-target {
      padding: 12px;
      background: #fef0f0;
      border-left: 3px solid #f56c6c;
      border-radius: 4px;
      line-height: 1.6;
      transition: filter 0.3s ease;
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

      .upload-error-status {
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

      .waiting-status, .waiting-evaluation {
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

      .error-status {
        .error-content {
          text-align: center;
          padding: 20px 0;

          .error-icon {
            font-size: 48px;
            color: #e6a23c;
            margin-bottom: 16px;
          }

          .fatal-error-icon {
            font-size: 48px;
            color: #f56c6c;
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

      .evaluation-ready {
        text-align: center;
        padding: 40px 20px;

        .ready-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;

          .success-icon-large {
            font-size: 32px;
            color: #52c41a;
          }

          .error-icon-large {
            font-size: 32px;
            color: #E6A23C;
          }

          .ready-title {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
          }
        }

        .ready-desc {
          font-size: 16px;
          color: #606266;
          margin-bottom: 30px;
          line-height: 1.6;

          &.error-desc {
            font-weight: 500;
          }
        }

        .ready-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
        }
      }

      .practice-finished {
        padding: 20px;

        .finished-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e6e8eb;

          .success-icon-large {
            font-size: 32px;
            color: #52c41a;
          }

          .finished-title {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
          }
        }

        .evaluation-container {
          margin-top: -50px;
          .evaluation-section, .comment-section {
            margin-bottom: 30px;
            background: #ffffff;
            border: 1px solid #e6e8eb;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

            .section-header {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 16px 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;

              .header-icon {
                font-size: 20px;
              }

              h3 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
              }
            }

            .markdown-content {
              padding: 20px;
              text-align: left;
              background: #fafbfc;

              :deep(.v-md-editor-preview) {
                background: transparent;
                padding: 0;
              }

              :deep(.github-markdown-body) {
                background: transparent;
                font-size: 14px;
                line-height: 1.8;

                h1, h2, h3, h4, h5, h6 {
                  margin-top: 24px;
                  margin-bottom: 16px;
                  font-weight: 600;
                  line-height: 1.25;
                  color: #303133;
                }

                h1 {
                  font-size: 2em;
                  border-bottom: 1px solid #e6e8eb;
                  padding-bottom: 0.3em;
                }

                h2 {
                  font-size: 1.5em;
                  border-bottom: 1px solid #e6e8eb;
                  padding-bottom: 0.3em;
                }

                p {
                  margin-bottom: 16px;
                }

                ul, ol {
                  padding-left: 2em;
                  margin-bottom: 16px;
                }

                li {
                  margin-bottom: 8px;
                }

                code {
                  background: #f3f4f6;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 0.9em;
                }

                pre {
                  background: #f8f9fa;
                  padding: 16px;
                  border-radius: 8px;
                  overflow-x: auto;
                }

                blockquote {
                  border-left: 4px solid #409eff;
                  padding-left: 16px;
                  color: #606266;
                  margin: 16px 0;
                }

                table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 16px 0;

                  th, td {
                    border: 1px solid #e6e8eb;
                    padding: 8px 12px;
                    text-align: left;
                  }

                  th {
                    background: #f3f4f6;
                    font-weight: 600;
                  }

                  tr:nth-child(even) {
                    background: #fafbfc;
                  }
                }

                strong {
                  font-weight: 600;
                  color: #303133;
                }

                em {
                  font-style: italic;
                }
              }
            }
          }

          .evaluation-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e6e8eb;
          }
        }
      }
    }
  }
}
</style>
