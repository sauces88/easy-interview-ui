<template>
  <!-- 全屏对话界面 -->
  <teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="conversation-fullscreen"
      >
        <!-- 主容器 -->
        <div class="conversation-container">
          <!-- 顶部工具栏 -->
          <div class="conversation-header">
            <div class="header-left">
              <!-- 左侧折叠时的展开按钮 -->
              <el-button
                v-if="!showHistoryPanel"
                text
                :icon="Histogram"
                @click="toggleHistoryPanel"
                class="toggle-icon-btn"
              />
              <div
                class="status-badge"
                :class="`status-${agentState}`"
              >
                <span class="status-dot" />
                <span class="status-text">{{ stateText }}</span>
              </div>
              <span
                v-if="conversationId"
                class="conversation-id"
              >{{ conversationId }}</span>
            </div>
            <div class="header-right">
              <!-- 右侧折叠时的展开按钮 -->
              <el-button
                v-if="!showTranscript"
                text
                :icon="ChatDotRound"
                @click="toggleTranscript"
                class="toggle-icon-btn"
              />
              <el-button
                text
                @click="handleClose"
              >
                {{ t('ielts.conversation.close') }}
              </el-button>
            </div>
          </div>

          <!-- 主要内容区 -->
          <div class="conversation-body">
            <!-- 左侧：历史会话列表 -->
            <transition name="slide-left">
              <div
                v-show="showHistoryPanel"
                class="history-section"
              >
                <div class="history-header">
                  <span class="history-title">{{ t('ielts.conversation.historyConversations') }}</span>
                  <el-button
                    text
                    :icon="Fold"
                    @click="toggleHistoryPanel"
                    class="toggle-icon-btn"
                  />
                </div>

                <div class="history-content">
                  <!-- 空状态 -->
                  <div
                    v-if="displayHistoryList.length === 0"
                    class="empty-state"
                  >
                    <el-icon
                      :size="48"
                      color="#9ca3af"
                    >
                      <Clock />
                    </el-icon>
                    <p>{{ t('ielts.conversation.noHistory') }}</p>
                  </div>

                  <!-- 历史会话列表 -->
                  <div
                    v-else
                    class="history-list"
                  >
                    <div
                      v-for="item in displayHistoryList"
                      :key="item.id"
                      class="history-item"
                      :class="{ 'active': item.conversationId === conversationId, 'disabled': isConnected }"
                      @click="!isConnected && handleHistoryItemClick(item)"
                    >
                      <div class="history-item-content">
                        <div class="history-item-header">
                          <el-icon :size="16">
                            <ChatDotRound />
                          </el-icon>
                          <span class="history-conv-text">{{ getConversationDisplayText(item) }}</span>
                        </div>
                        <div class="history-item-status">
                          <span
                            class="status-tag"
                            :class="`status-${item.status}`"
                          >
                            {{
                              item.status === 0 ? t('ielts.conversation.statusInit') :
                              item.status === 1 ? t('ielts.conversation.statusClosed') :
                              item.status === 2 ? t('ielts.conversation.statusCloseError') :
                              item.status === 3 ? t('ielts.conversation.statusEvalError') :
                              item.status === 4 ? t('ielts.conversation.statusCompleted') :
                              t('ielts.conversation.statusInit')
                            }}
                          </span>
                          <el-button
                            v-if="item.status === 4 && item.conversationId === conversationId"
                            type="primary"
                            size="small"
                            link
                            @click.stop="showEvaluationResults = true"
                          >
                            <el-icon>
                              <View />
                            </el-icon>
                            {{ t('ielts.conversation.viewEvaluation') }}
                          </el-button>
                        </div>
                      </div>
                    </div>

                    <!-- 查看全部按钮 -->
                    <div
                      v-if="!showAllHistory && historyTotal > 5"
                      class="view-all-btn"
                    >
                      <el-button
                        text
                        @click="toggleShowAllHistory"
                      >
                        {{ t('ielts.conversation.viewAll') }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>

            <!-- 中间：音频可视化 -->
            <div class="visualizer-section">
              <!-- Bar Visualizer -->
              <div class="bar-visualizer-wrapper">
                <div class="bar-visualizer">
                  <div
                    v-for="i in 15"
                    :key="i"
                    class="bar"
                    :class="`bar-${agentState}`"
                    :style="getBarStyle(i)"
                  />
                </div>
              </div>

              <!-- 控制按钮 -->
              <div class="controls">
                <!-- 开始对话按钮 -->
                <el-button
                  v-if="!isConnected && !isEndingConversation && !isEvaluating"
                  size="large"
                  :loading="agentState === 'connecting'"
                  round
                  text
                  @click="startConversation"
                >
                  <el-icon
                    v-if="agentState !== 'connecting'"
                    style="margin-right: 8px; font-size: 18px"
                  >
                    <VideoPlay />
                  </el-icon>
                  {{ t('ielts.conversation.start') }}
                </el-button>

                <!-- 对话中按钮 -->
                <template v-else-if="isConnected || isEndingConversation">
                  <el-button
                    v-if="isConnected"
                    :type="isMuted ? 'info' : 'success'"
                    size="large"
                    round
                    text
                    @click="toggleMute"
                  >
                    <el-icon
                      :size="18"
                      style="margin-right: 8px;"
                    >
                      <Microphone v-if="!isMuted" />
                      <Mute v-else />
                    </el-icon>
                    {{ isMuted ? t('ielts.conversation.unmute') : t('ielts.conversation.mute') }}
                  </el-button>

                  <el-button
                    type="danger"
                    size="large"
                    round
                    text
                    :loading="isEndingConversation"
                    @click="endConversation"
                  >
                    <el-icon
                      v-if="!isEndingConversation"
                      style="margin-right: 8px;"
                    >
                      <SwitchButton />
                    </el-icon>
                    {{ t('ielts.conversation.end') }}
                  </el-button>
                </template>

                <!-- 评估按钮 -->
                <el-button
                  v-if="hasUserMessages && !isConnected && evaluationStatus !== 3 && evaluationStatus !== 2 && evaluationStatus !== 4 && !isEndingConversation"
                  type="primary"
                  size="large"
                  round
                  text
                  :loading="isEvaluating"
                  @click="handleEvaluate"
                >
                  <el-icon
                    v-if="!isEvaluating"
                    style="margin-right: 8px;"
                  >
                    <DocumentChecked />
                  </el-icon>
                  {{ isEvaluating ? t('ielts.conversation.evaluating') : t('ielts.conversation.evaluate') }}
                </el-button>

                <!-- 查看评估按钮（评估完成后显示） -->
                <el-button
                  v-if="hasUserMessages && !isConnected && evaluationStatus === 4 && !isEndingConversation"
                  type="success"
                  size="large"
                  round
                  text
                  @click="showEvaluationResults = true"
                >
                  <el-icon style="margin-right: 8px;">
                    <View />
                  </el-icon>
                  {{ t('ielts.conversation.viewEvaluation') }}
                </el-button>

                <!-- 重试关闭按钮（关闭异常时显示） -->
                <el-button
                  v-if="hasUserMessages && !isConnected && evaluationStatus === 2 && isCurrentConversation && !isEndingConversation"
                  type="danger"
                  size="large"
                  round
                  text
                  @click="retryCloseConversation"
                >
                  <el-icon style="margin-right: 8px;">
                    <RefreshRight />
                  </el-icon>
                  {{ t('ielts.conversation.retryClose') }}
                </el-button>

                <!-- 重新评估按钮（评估异常时显示） -->
                <el-button
                  v-if="hasUserMessages && !isConnected && evaluationStatus === 3 && !isEndingConversation"
                  type="warning"
                  size="large"
                  round
                  text
                  :loading="isEvaluating"
                  @click="retryEvaluation"
                >
                  <el-icon
                    v-if="!isEvaluating"
                    style="margin-right: 8px;"
                  >
                    <RefreshRight />
                  </el-icon>
                  {{ t('ielts.conversation.retryEvaluation') }}
                </el-button>
              </div>
            </div>

            <!-- 右侧：对话记录 -->
            <transition name="slide-right">
              <div
                v-show="showTranscript"
                class="transcript-section"
              >
                <div
                  class="transcript-header"
                  :class="{ 'no-audio': !audioUrl }"
                >
                  <!-- 音频播放器 -->
                  <div
                    v-if="audioUrl"
                    class="header-audio-player"
                  >
                    <audio
                      :src="audioUrl"
                      controls
                    />
                  </div>
                  <el-button
                    text
                    :icon="Expand"
                    @click="toggleTranscript"
                    class="toggle-icon-btn"
                  />
                </div>
                <div
                  ref="transcriptContainer"
                  class="transcript-content"
                >
                  <!-- 空状态 -->
                  <div
                    v-if="messages.length === 0"
                    class="empty-state"
                  >
                    <el-icon
                      :size="48"
                      color="#d1d5db"
                    >
                      <ChatDotRound />
                    </el-icon>
                    <p>{{ t('ielts.conversation.noMessages') }}</p>
                  </div>

                  <!-- 消息列表 -->
                  <div
                    v-else
                    class="messages-list"
                  >
                    <div
                      v-for="(msg, index) in messages"
                      :key="index"
                      class="message-bubble"
                      :class="msg.role"
                    >
                      <div
                        v-if="msg.role === 'agent'"
                        class="message-avatar"
                      >
                        <el-icon
                          :size="18"
                          color="#3b82f6"
                        >
                          <Service />
                        </el-icon>
                      </div>
                      <div class="message-text">
                        {{ msg.content }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </transition>

    <!-- 全屏评估结果模态框 -->
    <transition name="fade">
      <div
        v-if="showEvaluationResults"
        class="evaluation-fullscreen"
      >
        <div class="evaluation-container">
          <!-- 顶部工具栏 -->
          <div class="evaluation-header">
            <h2 class="evaluation-title">
              {{ t('ielts.conversation.evaluationResults') }}
            </h2>
            <el-button
              type="info"
              @click="closeEvaluationResults"
              text
            >
              {{ t('ielts.conversation.backToConversation') }}
            </el-button>
          </div>

          <!-- 评估结果内容 -->
          <div class="evaluation-content">
            <ExamResults
              :evaluation-result="evaluationResult"
              :evaluation-comment="evaluationComment"
            />
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Microphone,
  Mute,
  View,
  ChatDotRound,
  VideoPlay,
  SwitchButton,
  DocumentChecked,
  Service,
  Clock,
  Histogram,
  Fold,
  Expand,
  RefreshRight
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { Conversation } from '@elevenlabs/client'
import { getSignedUrlApi } from '@/api/modules/labs/elevenlabs'
import { getElevenlabsConvListApi, initElevenlabsConv, evaluating, getElevenlabsConvDetailApi, closeElevenlabsConvApi } from '@/api/modules/labs/elevenlabsConv'
import type { IElevenlabsConv } from '@/api/interface/labs/elevenlabsConv'
import ExamResults from '@/views/ielts/mockExam/components/ExamResults.vue'

interface Message {
  role: 'user' | 'agent'
  content: string
  time: string
}

interface Props {
  visible: boolean
  agentId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'conversation-ended': [conversationId: string]
}>()

const { t } = useI18n()

// 状态定义
type AgentState = 'idle' | 'connecting' | 'initializing' | 'listening' | 'speaking' | 'thinking'

// 对话状态
const agentState = ref<AgentState>('idle')
const isConnected = ref(false)
const isMuted = ref(false)
const conversationId = ref<string>('')
const conversation = ref<any>(null)
const isClosing = ref(false) // 标记是否正在关闭
const isEndingConversation = ref(false) // 标记是否正在结束对话（调用结束对话接口中）
const isCurrentConversation = ref(false) // 标记是否是当前正在进行的对话（区分历史会话）

// UI 状态
const showHistoryPanel = ref(true) // 左侧历史会话面板，默认展开
const showTranscript = ref(false) // 右侧当前聊天记录，默认折叠
const messages = ref<Message[]>([])
const hasUserMessages = ref(false)
const transcriptContainer = ref<HTMLElement | null>(null)

// 历史会话列表
const historyList = ref<IElevenlabsConv.Row[]>([])
const historyTotal = ref(0) // 历史会话总数
const showAllHistory = ref(false) // 是否显示全部历史记录

// 评估相关状态
const isEvaluating = ref(false) // 是否正在评估
const evaluationStatus = ref<number | null>(null) // 评估状态 (0=初始化, 1=完成, 2=异常)
const evaluationResult = ref<any>(null) // 评估结果
const evaluationComment = ref<string>('') // 评估评语
const showEvaluationResults = ref(false) // 是否显示评估结果
const audioUrl = ref<string>('') // 音频URL

// Bar 动画状态
const barHeights = ref<number[]>(Array(15).fill(20))
let animationFrameId: number | null = null

// 流式显示状态
const streamingMessageIndex = ref<number>(-1)
const streamingText = ref<string>('')

// 状态文本
const stateText = computed(() => {
  const stateMap: Record<AgentState, string> = {
    idle: t('ielts.conversation.disconnected'),
    connecting: t('ielts.conversation.connecting'),
    initializing: t('ielts.conversation.initializing'),
    listening: isMuted.value ? t('ielts.conversation.muted') : t('ielts.conversation.listening'),
    speaking: t('ielts.conversation.speaking'),
    thinking: t('ielts.conversation.thinking')
  }
  return stateMap[agentState.value]
})

// 显示的历史会话列表（默认5条）
const displayHistoryList = computed(() => {
  return historyList.value
})

// 获取会话显示文本（优先显示第一条用户消息）
const getConversationDisplayText = (item: IElevenlabsConv.Row) => {
  if (item.message) {
    try {
      const messages = JSON.parse(item.message)
      if (Array.isArray(messages)) {
        // 找到第一条用户消息
        const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
        if (firstUserMessage && firstUserMessage.content) {
          // 限制显示长度，避免过长
          const maxLength = 30
          const content = firstUserMessage.content.trim()
          return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e)
    }
  }
  // 没有用户消息则显示 conversationId
  return item.conversationId || 'N/A'
}

// 获取柱状条样式
const getBarStyle = (index: number) => {
  const height = barHeights.value[index - 1] || 20
  return {
    height: `${height}%`
  }
}

// 柱状条动画
const animateBars = () => {
  const state = agentState.value
  const time = Date.now() / 1000

  barHeights.value = barHeights.value.map((_, i) => {
    const normalizedIndex = i / 14 // 0 to 1
    const centerDistance = Math.abs(normalizedIndex - 0.5) * 2 // 0 at center, 1 at edges

    switch (state) {
      case 'connecting':
        // 波浪动画
        return 20 + Math.abs(Math.sin(time * 3 + i * 0.4)) * 30

      case 'initializing':
        // 从中心向外
        return 20 + Math.abs(Math.sin(time * 4 - centerDistance * 3)) * 40

      case 'listening':
        // 轻微呼吸
        return 25 + Math.sin(time * 2 + i * 0.3) * 10

      case 'speaking':
        // 强烈波动
        return 20 + Math.abs(Math.sin(time * 5 + i * 0.5)) * 60 + Math.random() * 15

      case 'thinking':
        // 脉冲
        const pulse = Math.abs(Math.sin(time * 2.5))
        return 20 + pulse * (1 - centerDistance) * 50

      default:
        return 20
    }
  })

  if (agentState.value !== 'idle') {
    animationFrameId = requestAnimationFrame(animateBars)
  }
}

// 开始动画
const startAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  animateBars()
}

// 停止动画
const stopAnimation = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  barHeights.value = Array(15).fill(20)
}

// 监听状态变化
watch(agentState, (newState) => {
  if (newState === 'idle') {
    stopAnimation()
  } else {
    startAnimation()
  }
})

// 监听 visible 变化
watch(() => props.visible, async (val) => {
  if (!val) {
    agentState.value = 'idle'
  } else {
    // 对话框打开时重置状态并获取历史会话列表
    showAllHistory.value = false
    await fetchHistoryList()
  }
})

// 获取历史会话列表
const fetchHistoryList = async () => {
  const limit = showAllHistory.value ? 50 : 5 // 根据展开状态决定获取数量
  const { data } = await getElevenlabsConvListApi({
    agentId: props.agentId,
    page: 1,
    limit
  })
  historyList.value = data?.rows || []
  historyTotal.value = data?.total || 0
}

// 显示全部历史（一次性操作）
const toggleShowAllHistory = async () => {
  showAllHistory.value = true
  // 重新获取所有数据
  await fetchHistoryList()
}

// 处理历史记录点击
const handleHistoryItemClick = async (item: IElevenlabsConv.Row) => {
  if (!item.conversationId) return

  try {
    // 获取会话详情
    const { data } = await getElevenlabsConvDetailApi({ conversationId: item.conversationId })

    // 更新当前会话ID和状态
    conversationId.value = item.conversationId
    evaluationStatus.value = data.status ?? null
    isCurrentConversation.value = false // 标记为历史会话，不显示异常提示

    // 处理消息记录
    let hasValidMessages = false
    if (data.message) {
      try {
        const messageList = JSON.parse(data.message)
        if (Array.isArray(messageList) && messageList.length > 0) {
          // 将消息转换为 Message 格式
          messages.value = messageList.map((msg: any) => ({
            role: msg.role || 'user',
            content: msg.content || msg.message || '',
            time: new Date().toLocaleTimeString()
          }))
          hasValidMessages = true
        }
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }

    // 如果没有有效消息，清空消息列表
    if (!hasValidMessages) {
      messages.value = []
    }

    // 设置 hasUserMessages 状态
    hasUserMessages.value = hasValidMessages

    // 展开右侧对话记录面板（即使是空的也展开）
    showTranscript.value = true

    // 滚动到底部
    await nextTick()
    if (transcriptContainer.value) {
      transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight
    }

    // 如果有音频，设置音频URL
    if (data.audio) {
      audioUrl.value = data.audio
    } else {
      audioUrl.value = ''
    }

    // 如果状态为评测成功，缓存评估结果（不自动弹出）
    if (data.status === 4) {
      // 解析评分和评语
      if (data.score) {
        try {
          evaluationResult.value = JSON.parse(data.score)
        } catch (e) {
          console.error('Failed to parse score:', e)
        }
      }
      if (data.comment) {
        evaluationComment.value = data.comment
      }
    } else {
      // 如果不是评测成功状态，清空评估结果
      evaluationResult.value = null
      evaluationComment.value = ''
    }
  } catch (error) {
    console.error('Failed to get conversation detail:', error)
    ElMessage.error(t('ielts.conversation.getDetailFailed'))
  }
}

// 切换历史面板
const toggleHistoryPanel = () => {
  showHistoryPanel.value = !showHistoryPanel.value
}

// 开始对话
const startConversation = async () => {
  // 清除之前的对话记录
  messages.value = []
  hasUserMessages.value = false
  conversationId.value = ''
  isClosing.value = false // 重置关闭标志
  isEndingConversation.value = false // 重置结束对话标志
  isCurrentConversation.value = true // 标记为当前对话
  audioUrl.value = '' // 清空音频URL
  evaluationStatus.value = null // 清空评估状态
  evaluationResult.value = null // 清空评估结果
  evaluationComment.value = ''
  showEvaluationResults.value = false

  agentState.value = 'connecting'

  try {
    // 获取签名 URL
    const { data: signedUrl } = await getSignedUrlApi({ agentId: props.agentId })

    if (!signedUrl) {
      throw new Error('Failed to get signed URL')
    }

    // 检查是否在获取URL期间用户已关闭
    if (isClosing.value) {
      return
    }

    agentState.value = 'initializing'

    // 启动对话
    const conv = await Conversation.startSession({
      signedUrl,
      onConnect: async (props) => {
        const { conversationId : conversation_id} = props

        conversationId.value = conversation_id

        // 如果在连接过程中用户已关闭，立即断开
        if (isClosing.value) {
          conv.endSession()
          return
        }

        isConnected.value = true
        agentState.value = 'listening'
        ElMessage.success(t('ielts.conversation.connected'))

        // 初始化会话
        try {
          await initElevenlabsConv({ conversationId: conversation_id })

          // 更新历史列表
          await fetchHistoryList()
        } catch (error) {
          console.error('❌ Failed to initialize conversation:', error)
        }
      },
      onDisconnect: () => {
        isConnected.value = false
        agentState.value = 'idle'
      },
      onError: (message, context) => {
        console.error('❌ Conversation error:', message, context)
        ElMessage.error(t('ielts.conversation.error'))
        isConnected.value = false
        agentState.value = 'idle'
      },
      onMessage: (props) => {
        const { message, source } = props

        if (message) {
          const cleanContent = message.trim()
          if (source === 'user') {
            addMessage('user', cleanContent)
            hasUserMessages.value = true
          } else if (source === 'ai') {
            addMessage('agent', cleanContent)
          }
        }
      },
      onModeChange: (prop) => {
        if (prop.mode === 'speaking') {
          agentState.value = 'speaking'
        } else if (prop.mode === 'listening') {
          agentState.value = 'listening'
        }
      },
      onStatusChange: () => {
        // Status change handling
      },
      onInterruption: () => {
        // Interruption handling
      }
    })

    // 保存conversation引用
    conversation.value = conv

    // 如果在startSession期间用户已关闭，确保清理
    if (isClosing.value) {
      if (conv) {
        await conv.endSession()
      }
      conversation.value = null
    }
  } catch (error: any) {
    console.error('Failed to start conversation:', error)

    // 只有在没有主动关闭的情况下才显示错误信息
    if (!isClosing.value) {
      ElMessage.error(error.message || t('ielts.conversation.startFailed'))
    }

    agentState.value = 'idle'
    conversation.value = null
  }
}

// 添加消息（流式展示）
const addMessage = (role: 'user' | 'agent', content: string) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  // 用户消息直接显示，不需要流式效果
  if (role === 'user') {
    messages.value.push({ role, content, time })
    nextTick(() => {
      if (transcriptContainer.value) {
        transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight
      }
    })
    return
  }

  // AI 消息使用流式展示
  const messageIndex = messages.value.length
  messages.value.push({ role, content: '', time })
  streamingMessageIndex.value = messageIndex

  let currentIndex = 0
  const streamInterval = setInterval(() => {
    if (currentIndex < content.length) {
      messages.value[messageIndex].content += content[currentIndex]
      currentIndex++

      // 自动滚动
      nextTick(() => {
        if (transcriptContainer.value) {
          transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight
        }
      })
    } else {
      clearInterval(streamInterval)
      streamingMessageIndex.value = -1
    }
  }, 10) // 每10ms显示一个字符
}

// 切换静音
const toggleMute = () => {
  if (conversation.value) {
    const newMutedState = !isMuted.value
    conversation.value.setMicMuted(newMutedState)
    isMuted.value = newMutedState
  }
}

// 结束对话
const endConversation = async () => {
  isEndingConversation.value = true

  // 第一步：先结束 WebSocket 连接
  try {
    if (conversation.value) {
      await conversation.value.endSession()
      conversation.value = null
    }
  } catch (error) {
    console.error('❌ Failed to close WebSocket:', error)
  }

  // 更新状态
  isConnected.value = false
  agentState.value = 'idle'

  // 第二步：WebSocket结束后，调用关闭会话接口
  if (conversationId.value) {
    try {
      await closeElevenlabsConvApi({ conversationId: conversationId.value })
    } catch (error) {
      console.error('❌ Failed to close conversation:', error)
    }

    // 无论成功还是失败，都调用详情接口获取服务器真实状态
    try {
      const { data } = await getElevenlabsConvDetailApi({ conversationId: conversationId.value })
      evaluationStatus.value = data.status ?? null

      // 根据状态显示不同的消息
      if (data.status === 2) {
        // 关闭异常
        ElMessage.error(t('ielts.conversation.statusCloseError'))
      } else {
        // 关闭成功
        ElMessage.success(t('ielts.conversation.ended'))
      }
    } catch (detailError) {
      console.error('❌ Failed to get conversation detail:', detailError)
      ElMessage.error(t('ielts.conversation.getDetailFailed'))
    }

    // 更新历史列表
    await fetchHistoryList()
  }

  isEndingConversation.value = false
}

// 重试关闭对话
const retryCloseConversation = async () => {
  isEndingConversation.value = true

  if (conversationId.value) {
    try {
      await closeElevenlabsConvApi({ conversationId: conversationId.value })
    } catch (error) {
      console.error('❌ Failed to retry close conversation:', error)
    }

    // 无论成功还是失败，都调用详情接口获取服务器真实状态
    try {
      const { data } = await getElevenlabsConvDetailApi({ conversationId: conversationId.value })
      evaluationStatus.value = data.status ?? null

      // 根据状态显示不同的消息
      if (data.status === 2) {
        // 仍然是关闭异常
        ElMessage.error(t('ielts.conversation.retryCloseFailed'))
      } else {
        // 重试成功
        ElMessage.success(t('ielts.conversation.retryCloseSuccess'))
      }
    } catch (detailError) {
      console.error('❌ Failed to get conversation detail:', detailError)
      ElMessage.error(t('ielts.conversation.getDetailFailed'))
    }

    // 更新历史列表
    await fetchHistoryList()
  }

  isEndingConversation.value = false
}

// 关闭对话框
const handleClose = async () => {
  // 设置关闭标志，阻止正在进行的连接
  isClosing.value = true

  // 强制结束对话并断开连接
  if (conversation.value) {
    try {
      await conversation.value.endSession()
    } catch (error) {
      console.error('❌ Error ending session:', error)
    }
    conversation.value = null
  }

  // 重置所有状态
  isConnected.value = false
  agentState.value = 'idle'
  isMuted.value = false

  if (conversationId.value) {
    // eslint-disable-next-line
    emit('conversation-ended', conversationId.value)
  }

  // 重置UI状态
  messages.value = []
  hasUserMessages.value = false
  conversationId.value = ''
  streamingMessageIndex.value = -1
  streamingText.value = ''
  isCurrentConversation.value = false

  // 重置评估状态
  isEvaluating.value = false
  evaluationStatus.value = null
  evaluationResult.value = null
  evaluationComment.value = ''
  showEvaluationResults.value = false

  emit('update:visible', false)
}

// 切换文本显示
const toggleTranscript = () => {
  showTranscript.value = !showTranscript.value
}

// 评估
const handleEvaluate = async () => {
  if (!conversationId.value) {
    ElMessage.error(t('ielts.conversation.noConversationId'))
    return
  }

  isEvaluating.value = true
  evaluationStatus.value = null
  evaluationResult.value = null
  evaluationComment.value = ''

  try {
    // 调用评估接口（同步等待完成）
    await evaluating({ conversationId: conversationId.value })
  } catch (error) {
    console.error('❌ Failed to evaluate:', error)
  }

  // 无论成功还是失败，都调用详情接口获取服务器真实状态
  try {
    const { data } = await getElevenlabsConvDetailApi({ conversationId: conversationId.value })
    evaluationStatus.value = data.status ?? null

    if (data.status === 3) {
      // 测评异常
      ElMessage.error(t('ielts.conversation.evaluationError'))
    } else if (data.status === 4) {
      // 评测成功
      // 解析评分和评语
      if (data.score) {
        evaluationResult.value = JSON.parse(data.score)
      }
      if (data.comment) {
        evaluationComment.value = data.comment
      }

      ElMessage.success(t('ielts.conversation.evaluationCompleted'))
    } else {
      // 其他状态
      ElMessage.warning(t('ielts.conversation.evaluationFailed'))
    }
  } catch (detailError) {
    console.error('❌ Failed to get conversation detail:', detailError)
    ElMessage.error(t('ielts.conversation.getDetailFailed'))
  }

  // 更新历史列表中的状态
  await fetchHistoryList()

  isEvaluating.value = false
}

// 重新评估
const retryEvaluation = () => {
  evaluationStatus.value = null
  showEvaluationResults.value = false
  handleEvaluate()
}

// 关闭评估结果
const closeEvaluationResults = () => {
  showEvaluationResults.value = false
}

// 清理
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // 断开 WebSocket
  if (conversation.value) {
    conversation.value.endSession()
  }
})
</script>

<style lang="scss" scoped>
.conversation-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #ffffff;
}

.conversation-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #f9fafb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
}

.toggle-icon-btn {
  font-size: 18px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.status-connecting {
  background: #fef3c7;
  color: #d97706;

  .status-dot {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

.status-badge.status-initializing {
  background: #dbeafe;
  color: #2563eb;

  .status-dot {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

.status-badge.status-listening {
  background: #d1fae5;
  color: #059669;

  .status-dot {
    animation: pulse 2s ease-in-out infinite;
  }
}

.status-badge.status-speaking {
  background: #fee2e2;
  color: #dc2626;

  .status-dot {
    animation: pulse 1s ease-in-out infinite;
  }
}

.status-badge.status-thinking {
  background: #fef3c7;
  color: #d97706;

  .status-dot {
    animation: pulse 1.2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.conversation-id {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.header-right {
  display: flex;
  gap: 8px;
}

.conversation-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.visualizer-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 32px;
  background: #ffffff;
}

.bar-visualizer-wrapper {
  width: 100%;
  max-width: 480px;
}

.bar-visualizer {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 4px;
  height: 120px;
  padding: 0 20px;
}

.bar {
  flex: 1;
  max-width: 8px;
  border-radius: 4px;
  transition: height 0.05s ease;
  min-height: 15%;
  background: #d1d5db;
}

.bar-idle {
  background: #e5e7eb;
}

.bar-connecting {
  background: #9ca3af;
}

.bar-initializing {
  background: #6b7280;
}

.bar-listening {
  background: #d1d5db;
}

.bar-speaking {
  background: #1f2937;
}

.bar-thinking {
  background: #9ca3af;
}

.status-message {
  font-size: 18px;
  font-weight: 500;
  color: #374151;
  text-align: center;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;

  .el-button {
    min-width: 120px;
  }
}

.evaluation-results {
  margin-top: 32px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.evaluation-error-state {
  margin-top: 32px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  text-align: center;

  .error-content {
    margin-bottom: 24px;

    .error-icon {
      font-size: 64px;
      color: #f56c6c;
      margin-bottom: 16px;
      animation: shake 0.5s;
    }

    .error-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }

    .error-description {
      font-size: 14px;
      color: #909399;
      line-height: 1.6;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
}

// 左侧历史会话面板
.history-section {
  width: 320px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f3f4f6;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.history-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &.active {
    background: #dbeafe;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}

.history-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  flex: 1;
}

.history-conv-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  word-break: break-word;
  flex: 1;
}

.history-item-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 4px;
  font-weight: 500;

  &.status-0 {
    background: #fef3c7;
    color: #d97706;
  }

  &.status-1 {
    background: #e5e7eb;
    color: #6b7280;
  }

  &.status-2 {
    background: #fee2e2;
    color: #dc2626;
  }

  &.status-3 {
    background: #fee2e2;
    color: #dc2626;
  }

  &.status-4 {
    background: #d1fae5;
    color: #059669;
  }
}

.view-all-btn {
  margin-top: 8px;
  text-align: center;
}

.transcript-section {
  width: 380px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
}

.transcript-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f3f4f6;

  &.no-audio {
    justify-content: flex-end;
  }
}

.transcript-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.transcript-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;

    &:hover {
      background: #9ca3af;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  gap: 16px;

  p {
    margin: 0;
    font-size: 14px;
  }
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.message-bubble {
  display: flex;
  gap: 12px;
  animation: messageIn 0.3s ease;
  max-width: 85%;

  &.agent {
    align-self: flex-start;
    flex-direction: row;

    .message-text {
      background: #f3f4f6;
      color: #1f2937;
      border-radius: 4px 16px 16px 16px;
    }
  }

  &.user {
    align-self: flex-end;
    flex-direction: row-reverse;

    .message-text {
      background: #1f2937;
      color: #ffffff;
      border-radius: 16px 4px 16px 16px;
    }
  }
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-text {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
}

// header 中的音频播放器
.header-audio-player {
  flex: 1;

  audio {
    width: 100%;
    height: 32px;
    outline: none;
  }
}

// 过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// 左侧滑入动画
.slide-left-enter-active {
  transition: all 0.3s ease;
}

.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

// 右侧滑入动画
.slide-right-enter-active {
  transition: all 0.3s ease;
}

.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

// 全屏评估结果模态框
.evaluation-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: #ffffff;
}

.evaluation-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.evaluation-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.evaluation-content {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  background: #f9fafb;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 4px;

    &:hover {
      background: #9ca3af;
    }
  }
}
</style>
