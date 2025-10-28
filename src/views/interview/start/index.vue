<template>
  <div class="interview-start">
    <el-row
      :gutter="20"
      class="h-full"
    >
      <!-- 左侧卡片 -->
      <el-col
        :span="12"
        class="h-full"
      >
        <el-card
          class="edit-card"
          shadow="hover"
        >
          <template #header>
            <div class="card-header">
              <span>{{ showResume ? t('interview.resume.editInfo') : t('interview.start.assistant') }}</span>
              <div class="header-actions">
                <el-button
                  v-if="!showResume"
                  :type="isBlurred ? 'primary' : 'default'"
                  @click="toggleBlur"
                  size="small"
                  circle
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  v-if="showResume && hasResume"
                  type="primary"
                  link
                  @click="openUploadDialog"
                >
                  {{ t('interview.resume.update') }}
                </el-button>
              </div>
            </div>
          </template>
          <!-- 简历编辑区域 -->
          <template v-if="showResume">
            <el-empty
              v-if="!hasResume"
              :description="t('interview.start.uploadResumeFirst')"
            >
              <el-button
                type="primary"
                @click="openUploadDialog"
              >
                {{ t('interview.start.uploadResume') }}
              </el-button>
            </el-empty>
            <el-form
              v-else
              ref="ruleFormRef"
              :rules="rules"
              :model="resumeData"
              @submit.enter.prevent="handleSubmit"
            >
              <el-form-item
                prop="text"
                class="content-item"
              >
                <el-input
                  v-model="resumeData.text"
                  :placeholder="t('interview.start.enterResumeContent')"
                  type="textarea"
                  :autosize="{ minRows: 16, maxRows: 16 }"
                />
              </el-form-item>
              <el-form-item class="button-item">
                <el-button
                  type="primary"
                  @click="handleSubmit"
                  :disabled="!isTextModified"
                >
                  {{ t('interview.resume.save') }}
                </el-button>
              </el-form-item>
            </el-form>
          </template>
          <!-- 辅助对话区域 -->
          <template v-else>
            <AssistantChatList
              :messages="assistantMessages"
              :is-blurred="isBlurred"
            />
          </template>
        </el-card>
      </el-col>

      <!-- 右侧聊天区域 -->
      <el-col
        :span="12"
        class="h-full"
      >
        <el-card
          class="chat-card"
          shadow="hover"
        >
          <template
            #header
            v-if="conversation?.conversationId && !conversation.completed"
          >
            <div class="card-header">
              <span />
              <div class="header-actions">
                <el-tooltip
                  :content="audioEnabled ? t('interview.start.audioDisabled') : t('interview.start.audioEnabled')"
                  placement="top"
                >
                  <el-button
                    :type="audioEnabled ? 'success' : 'info'"
                    circle
                    @click="handleAudioToggle"
                  >
                    <Icon
                      :icon="audioEnabled ? 'material-symbols:volume-up' : 'material-symbols:volume-off'"
                      width="20"
                      height="20"
                    />
                  </el-button>
                </el-tooltip>
                <el-button
                  type="danger"
                  link
                  @click="handleEndInterview"
                >
                  {{ t('interview.start.endInterview') }}
                </el-button>
              </div>
            </div>
          </template>

          <template v-if="conversation?.conversationId && !conversation.completed">
            <ChatList
              ref="chatListRef"
              :messages="messages"
              :loading="loading"
              :disabled="inputDisabled"
              @send-text="handleSendText"
              @send-audio="handleSendAudio"
              @reset-audio="resetAudio"
            />
          </template>
          <template v-else>
            <StartInterviewCard
              :selected-bot="selectedBot"
              :has-unfinished-conversation="hasUnfinishedConversation"
              @select-bot="() => showBotDialog = true"
              @start-interview="handleStartInterview"
              @continue-interview="handleContinueInterview"
              @fetch-last-conversation="fetchLastConversation"
            />
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 上传简历对话框 -->
    <el-dialog
      v-model="uploadVisible"
      :title="t('interview.start.uploadTitle')"
      :destroy-on-close="true"
      width="580px"
      draggable
    >
      <el-upload
        v-model:file-list="fileList"
        class="upload-demo"
        drag
        :file-size="3"
        :auto-upload="false"
        :limit="1"
        @change="handleFileUpload"
        :accept="'.pdf'"
      >
        <el-icon class="el-icon--upload">
          <upload-filled />
        </el-icon>
        <div class="el-upload__text">
          <em>{{ t('interview.start.clickUpload') }}</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            {{ t('interview.start.uploadRequirements') }}
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 选择智能体弹窗 -->
    <SelectBotDialog
      v-model="showBotDialog"
      @select="handleSelectBot"
    />

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmDialogVisible"
      :title="t('interview.start.confirmLeave')"
      width="400px"
    >
      <span>{{ t('interview.start.leaveWarning') }}</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">{{ t('interview.start.stayButton') }}</el-button>
          <el-button
            type="primary"
            @click="confirmEndInterview"
          >
            {{ t('interview.start.leaveButton') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'
import {
  getLastConversation,
  createConversation,
  completeConversation,
  sendStreamMessage,
  getAllMessages
} from '@/api/modules/interview/coze'
import { getCurrentUserResumeDetailApi, createResumeApi, updateResumeApi } from '@/api/modules/interview/resume'
import { flashAsrApi } from '@/api/modules/tool/asr'
import type { ICoze } from '@/api/interface/interview/coze'
import ChatList from './components/ChatList.vue'
import SelectBotDialog from './components/SelectBotDialog.vue'
import StartInterviewCard from './components/StartInterviewCard.vue'
import AssistantChatList from './components/AssistantChatList.vue'
import { View } from '@element-plus/icons-vue'
import { useI18n } from "vue-i18n"
import type { IBot } from '@/api/interface/interview/bot'
import './components/FixButton.scss'
const { t } = useI18n()

// 扩展消息接口，添加isPrologue可选属性
interface ExtendedMessage extends ICoze.MessageResponse {
  isPrologue?: boolean;
}

const selectedBot = ref<any>()

const hasUnfinishedConversation = ref(false)

// 获取上次未完成的会话
const fetchLastConversation = async () => {
  try {
    // 先重置状态
    hasUnfinishedConversation.value = false

    if (!selectedBotId.value) return

    // 使用非空断言，因为我们已经检查了 selectedBotId.value 不为空
    const res = await getLastConversation(selectedBotId.value!)
    if (res.code === '0000' &&
        res.data &&
        res.data.length === 2 &&
        !res.data[0].completed) {
      hasUnfinishedConversation.value = true
    }
  } catch (err) {
    console.error('获取上次会话失败：', err)
  }
}

defineOptions({
  name: 'StartInterviewView'
})

const ruleFormRef = ref<FormInstance>()

const messages = ref<ExtendedMessage[]>([])
const loading = ref(false)
const inputDisabled = ref(false)
const showBotDialog = ref(false)
const selectedBotId = ref<string>()
let currentMessage = ref('')
const conversation = ref<ICoze.ConversationVO>()

// 简历相关
const resumeData = ref<any>({
  url: '',
  text: '',
  id: undefined
})
const uploadVisible = ref(false)
const fileList = ref<UploadUserFile[]>([])
const isTextModified = ref(false)
const initialText = ref('')

const rules = {
  text: [{ required: true, message: t('interview.start.emptyResumeValidation') }]
}

// 判断是否有简历
const hasResume = computed(() => {
  return resumeData.value.url && resumeData.value.id
})

// 获取当前用户简历数据
const fetchResumeData = async () => {
  try {
    const { data } = await getCurrentUserResumeDetailApi()
    if (data && Object.keys(data).length > 0) {
      resumeData.value = data
      initialText.value = data.text || ''
      isTextModified.value = false
    } else {
      ElMessage.info({
        message: t('interview.start.noResumeUploadFirst'),
        duration: 2500,
        showClose: true
      })
    }
  } catch (error) {
    console.error('获取简历数据异常：', error)
    ElMessage.error(t('interview.start.systemError'))
  }
}

// 打开上传对话框
const openUploadDialog = () => {
  uploadVisible.value = true
  fileList.value = []
}

// 处理文件上传
const handleFileUpload = async (uploadFile: UploadUserFile) => {
  if (!uploadFile || !uploadFile.raw) {
    return
  }

  try {
    await createResumeApi(uploadFile.raw)
    ElMessage.success(t('interview.start.uploadSuccess'))
    uploadVisible.value = false
    fileList.value = []
    fetchResumeData()
  } catch (error) {
    console.error('上传失败：', error)
    ElMessage.error(t('interview.start.uploadError'))
  }
}

// 保存简历内容
const handleSubmit = () => {
  if (!ruleFormRef.value) return

  ruleFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      await updateResumeApi(resumeData.value)
      ElMessage.success('保存成功！')
      initialText.value = resumeData.value.text
      isTextModified.value = false
    } catch (error) {
      console.error('保存失败：', error)
      ElMessage.error('保存失败')
    }
  })
}

// 选择面试官
const handleSelectBot = (bot: IBot.Row, prologue: string) => {
  selectedBot.value = bot
  selectedBotId.value = bot.bot_id
  // 存储开场白，等待用户点击开始面试时使用
  prologueText.value = prologue
  showBotDialog.value = false
}

// 加载消息列表
const loadMessages = async () => {
  if (!conversation.value) return

  loading.value = true;

  // 保存开场白
  const prologueMessage = messages.value.find(msg => msg.isPrologue === true);
  messages.value = []; // 清空除开场白外的消息

  try {
    // 使用新API直接获取所有消息
    const res = await getAllMessages(conversation.value.conversationId);

    if (res.code === '0000') {
      console.log(`加载了 ${res.data.length} 条消息`);

      // 更新消息列表
      messages.value = res.data;

      // 如果有开场白，将其添加到历史消息的开头
      if (prologueMessage) {
        // 检查第一条消息是否已经是开场白
        const firstMessage = messages.value[0];
        if (!firstMessage ||
            firstMessage.role !== 'assistant' ||
            firstMessage.content !== prologueMessage.content) {
          messages.value.unshift(prologueMessage);
        }
      }
    } else {
      conversation.value = undefined;
      messages.value = [];
      throw new Error(res.message || '获取消息列表失败');
    }
  } catch (err) {
    console.error('加载消息失败:', err);
    conversation.value = undefined;
    messages.value = [];
    ElMessage.error('加载消息失败');
    throw err;
  } finally {
    loading.value = false;
  }
};

// 修改继续上次面试的处理函数
const handleContinueInterview = async () => {
  if (!hasResume.value) {
    ElMessage.warning(t('interview.start.noResumeContent'))
    return
  }
  if (!selectedBot.value) {
    ElMessage.warning(t('interview.start.noSelectedBot'))
    return
  }
  if (!selectedBotId.value) {
    ElMessage.warning(t('interview.start.noSelectedBot'))
    return
  }

  const res = await getLastConversation(selectedBotId.value)
  if (res.code === '0000' && res.data && res.data.length === 2) {
    // 找到主会话和辅助会话
    const mainConversation = res.data.find(conv => conv.assistantId)
    const assistantConv = res.data.find(conv => !conv.assistantId)

    if (mainConversation && !mainConversation.completed && assistantConv) {
      conversation.value = mainConversation
      assistantConversation.value = assistantConv
      showResume.value = false
      messages.value = []
      assistantMessages.value = []

      // 添加开场白到对话列表（如果存在）
      if (prologueText.value) {
        messages.value.push({
          id: 'prologue-' + Date.now().toString(),
          role: 'assistant',
          content: prologueText.value,
          created_at: Math.floor(Date.now() / 1000).toString(),
          isPrologue: true // 标记为开场白
        } as ExtendedMessage);
      }

      // 加载主会话消息
      await loadMessages()

      // 加载辅助会话消息
      await loadAssistantMessages()
    }
  }
}

// 修改开始新面试的处理函数
const handleStartInterview = async () => {
  if (!hasResume.value) {
    ElMessage.warning(t('interview.start.noResumeContent'))
    return
  }
  if (!selectedBot.value) {
    ElMessage.warning(t('interview.start.noSelectedBot'))
    return
  }
  try {
    if (!selectedBotId.value) {
      ElMessage.warning(t('interview.start.noSelectedBot'))
      return
    }

    // 结束上次未完成的会话
    const lastRes = await getLastConversation(selectedBotId.value)
    if (lastRes.code === '0000' &&
        lastRes.data &&
        lastRes.data.length === 2) {
      const mainConversation = lastRes.data.find(conv => conv.assistantId)
      if (mainConversation && !mainConversation.completed) {
        await completeConversation(mainConversation.id)
      }
    }

    // 创建新会话
    const res = await createConversation(selectedBot.value.bot_id)
    if (res.code === '0000' && res.data && res.data.length === 2) {
      const mainConversation = res.data.find(conv => conv.assistantId)
      const assistantConv = res.data.find(conv => !conv.assistantId)

      if (mainConversation && assistantConv) {
        conversation.value = mainConversation
        assistantConversation.value = assistantConv
        showResume.value = false
        messages.value = []
        assistantMessages.value = []
        pendingAssistantMessage.value = '' // 重置待发送的辅助消息

        // 添加开场白到对话列表
        if (prologueText.value) {
          messages.value.push({
            id: 'prologue-' + Date.now().toString(),
            role: 'assistant',
            content: prologueText.value,
            created_at: Math.floor(Date.now() / 1000).toString(),
            isPrologue: true // 标记为开场白
          } as ExtendedMessage)
        }
      } else {
        ElMessage.error('创建会话失败：无法识别主会话和辅助会话')
      }
    } else {
      ElMessage.error(res.message || '创建会话失败')
    }
  } catch (err) {
    console.error(err)
  }
}

// 添加加载辅助会话消息的函数
const loadAssistantMessages = async () => {
  if (!assistantConversation.value) return

  try {
    // 使用新API直接获取所有消息
    const res = await getAllMessages(assistantConversation.value.conversationId);

    if (res.code === '0000') {
      console.log(`加载了 ${res.data.length} 条辅助消息`);

      // 更新辅助消息列表
      assistantMessages.value = res.data;
    } else {
      throw new Error(res.message || '获取辅助消息列表失败');
    }
  } catch (err) {
    console.error('加载辅助会话消息失败：', err);
    assistantMessages.value = [];
    ElMessage.error('加载辅助消息失败');
  }
}

// 用于存储完整的AI响应
const pendingAssistantMessage = ref<string>('')

// 添加辅助消息队列
const assistantMessageQueue = ref<string[]>([])
const isProcessingAssistantQueue = ref(false)

// 添加处理辅助消息队列的函数
const processAssistantMessageQueue = async () => {
  if (isProcessingAssistantQueue.value || assistantMessageQueue.value.length === 0) return

  isProcessingAssistantQueue.value = true
  const currentAssistantMessage = assistantMessages.value[assistantMessages.value.length - 1]

  while (assistantMessageQueue.value.length > 0) {
    const text = assistantMessageQueue.value.shift() || ''
    // 直接添加整个文本块，不再逐字显示
    currentAssistantMessage.content += text
    // 添加一个很短的延迟以确保UI能够更新
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  isProcessingAssistantQueue.value = false
}

// 修改发送辅助消息的函数
const sendAssistantMessage = async (content: string) => {
  if (!assistantConversation.value || !content) return

  try {
    // 添加用户消息
    assistantMessages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: Math.floor(Date.now() / 1000).toString()
    })

    // 添加 AI 消息占位
    const assistantAiMessageId = Date.now().toString()
    assistantMessages.value.push({
      id: assistantAiMessageId,
      role: 'assistant',
      content: '',
      created_at: Math.floor(Date.now() / 1000).toString()
    })

    // 使用事件处理方式发送消息
    sendStreamMessage(
      {
        conversationId: assistantConversation.value.conversationId,
        content,
        audioFlag: false
      },
      {
        onMessage: (eventData) => {
          switch (eventData.type) {
            case 'text.delta':
              try {
                const jsonContent = typeof eventData.content === 'string' ? JSON.parse(eventData.content) : eventData.content
                const messageContent = jsonContent.content || ''
                assistantMessageQueue.value.push(messageContent)
                processAssistantMessageQueue()
              } catch (error) {
                console.error('解析辅助消息内容失败：', error)
              }
              break

            case 'text.completed':
              // 辅助消息完成
              break
          }
        },
        onError: (error) => {
          console.error(error)
          // 不删除消息，只显示错误
          ElMessage.error(error.data)
        },
        onComplete: () => {
          // 辅助消息完成的处理
        }
      }
    )
  } catch (err) {
    console.error('发送辅助消息失败：', err)
  }
}

// 添加提取问题的辅助函数
const extractQuestion = (content: string): string | null => {
  // 匹配 [ Question ] 或 [ Next Question ] 开头的问题，直到下一个问题标记
  const match = content.match(/(?:\[ Question \]|\[ Next Question \]|\[Question\]|\[Next Question\])([\s\S]+?)(?=\[ Question \]|\[ Next Question \]|\[Question\]|\[Next Question\]|$)/);
  return match ? match[1].trim() : null;
}

// 在 script setup 顶部添加音频相关的状态
const mediaSource = ref<MediaSource | null>(null)
const sourceBuffer = ref<SourceBuffer | null>(null)
const audioElement = ref(new Audio())
let isPlayingAudio = false
let audioQueue: Uint8Array[] = []

// 添加重置音频的函数
const resetAudio = () => {
  try {
    // 1. 立即停止当前音频播放
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.currentTime = 0;

      // 移除音频源
      if (audioElement.value.src) {
        URL.revokeObjectURL(audioElement.value.src);
        audioElement.value.src = '';
        audioElement.value.load(); // 强制刷新音频元素
      }
    }

    // 2. 清理 SourceBuffer
    if (mediaSource.value && sourceBuffer.value) {
      try {
        if (!sourceBuffer.value.updating) {
          mediaSource.value.removeSourceBuffer(sourceBuffer.value);
        }
      } catch (e) {
        console.warn('清理 SourceBuffer 失败:', e);
      }
    }

    // 3. 结束 MediaSource 流
    if (mediaSource.value && mediaSource.value.readyState === 'open') {
      try {
        mediaSource.value.endOfStream();
      } catch (e) {
        console.warn('结束 MediaSource 流失败:', e);
      }
    }

    // 4. 清空队列和重置状态
    audioQueue = [];
    isPlayingAudio = false;

    // 5. 重置引用
    sourceBuffer.value = null;
    mediaSource.value = null;

    console.log('音频已重置');
  } catch (error) {
    console.error('重置音频失败:', error);
  }
}

// 修改初始化 MediaSource 的函数
const initMediaSource = () => {
  try {
    // 清理之前的资源
    if (mediaSource.value) {
      if (sourceBuffer.value) {
        try {
          mediaSource.value.removeSourceBuffer(sourceBuffer.value)
        } catch (e) {
          console.warn('清理 SourceBuffer 失败:', e)
        }
      }
      if (mediaSource.value.readyState === 'open') {
        mediaSource.value.endOfStream()
      }
    }

    // 创建新的 MediaSource
    mediaSource.value = new MediaSource()
    audioElement.value.src = URL.createObjectURL(mediaSource.value)
    audioQueue = []
    isPlayingAudio = false

    return new Promise<void>((resolve) => {
      mediaSource.value!.addEventListener('sourceopen', () => {
        try {
          sourceBuffer.value = mediaSource.value!.addSourceBuffer('audio/mpeg')
          // 移除 mode 设置，使用默认的 'sequence' 模式
          sourceBuffer.value.addEventListener('updateend', () => {
            // 当缓冲区更新完成后处理队列中的下一个片段
            if (audioQueue.length > 0 && !sourceBuffer.value?.updating) {
              const nextChunk = audioQueue.shift()
              if (nextChunk) {
                try {
                  sourceBuffer.value?.appendBuffer(nextChunk)
                } catch (error) {
                  console.error('添加音频数据失败：', error)
                }
              }
            }

            // 如果队列为空且还没开始播放，开始播放
            if (audioQueue.length === 0 && !isPlayingAudio && audioElement.value.readyState >= 2) {
              isPlayingAudio = true
              audioElement.value.play().catch(err => {
                console.error('音频播放失败：', err)
                ElMessage.error('音频播放失败')
              })
            }
          })
          resolve()
        } catch (error) {
          console.error('初始化 SourceBuffer 失败：', error)
          resolve()
        }
      }, { once: true })
    })
  } catch (error) {
    console.error('初始化 MediaSource 失败：', error)
  }
}

// 修改处理音频片段的函数
const handleAudioChunk = async (base64Audio: string) => {
  // 如果 MediaSource 未初始化或状态不正确，先初始化
  if (!sourceBuffer.value || !mediaSource.value || mediaSource.value.readyState !== 'open') {
    try {
      await initMediaSource()
    } catch (error) {
      console.error('初始化 MediaSource 失败：', error)
      return
    }
  }

  try {
    // 将 base64 转换为 Uint8Array
    const byteCharacters = atob(base64Audio)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i)
    }

    // 如果 sourceBuffer 正在更新中或队列不为空，将数据加入队列
    if (sourceBuffer.value?.updating || audioQueue.length > 0) {
      audioQueue.push(byteArray)
      return
    }

    // 直接添加到 sourceBuffer
    try {
      sourceBuffer.value?.appendBuffer(byteArray)
    } catch (error) {
      console.error('添加音频数据失败：', error)
    }
  } catch (error) {
    console.error('处理音频片段失败：', error)
  }
}

// 结束音频流
const endAudioStream = () => {
  try {
    // 确保所有队列中的数据都被处理完
    const processRemainingChunks = () => {
      if (audioQueue.length > 0 && !sourceBuffer.value?.updating) {
        const chunk = audioQueue.shift()
        if (chunk) {
          sourceBuffer.value?.appendBuffer(chunk)
          setTimeout(processRemainingChunks, 10)
        }
      } else if (audioQueue.length === 0) {
        // 所有数据处理完毕后结束流
        if (mediaSource.value?.readyState === 'open') {
          setTimeout(() => {
            mediaSource.value?.endOfStream()
          }, 100) // 添加小延迟确保最后一个片段被完全处理
        }
      }
    }

    if (audioQueue.length > 0) {
      processRemainingChunks()
    } else if (mediaSource.value?.readyState === 'open') {
      setTimeout(() => {
        mediaSource.value?.endOfStream()
      }, 100)
    }
  } catch (error) {
    console.error('结束音频流失败：', error)
  }
  isPlayingAudio = false
}

// 添加音频开关状态
const audioEnabled = ref(false)

// 修改音频开关处理函数
const handleAudioToggle = () => {
    audioEnabled.value = !audioEnabled.value
    ElMessage.success(audioEnabled.value ? '语音播放已开启' : '语音播放已关闭')
}

// 添加对 ChatList 组件的引用
const chatListRef = ref()

// 添加消息队列
const messageQueue = ref<string[]>([])
const isProcessingQueue = ref(false)

// 处理消息队列的函数
const processMessageQueue = async () => {
  if (isProcessingQueue.value || messageQueue.value.length === 0) return

  isProcessingQueue.value = true
  const lastIndex = messages.value.length - 1
  // 添加安全检查，确保消息存在
  if (lastIndex < 0) {
    isProcessingQueue.value = false
    return
  }

  const currentAiMessage = messages.value[lastIndex]
  // 再次检查确保消息对象有效且是AI消息
  if (!currentAiMessage || currentAiMessage.role !== 'assistant') {
    isProcessingQueue.value = false
    return
  }

  while (messageQueue.value.length > 0) {
    const text = messageQueue.value.shift() || ''
    if (currentAiMessage && currentAiMessage.content !== undefined) {
      // 直接添加整个文本块，不再逐字显示
      currentAiMessage.content += text
      // 添加一个很短的延迟以确保UI能够更新
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  isProcessingQueue.value = false
}

// 结束面试的处理函数
const handleEndInterview = async () => {
  if (!conversation.value) return

  try {
    const res = await completeConversation(conversation.value.id)
    if (res.code === '0000') {
      conversation.value = undefined
      assistantConversation.value = undefined
      messages.value = []
      assistantMessages.value = []
      hasUnfinishedConversation.value = false
      showResume.value = true
      pendingAssistantMessage.value = '' // 重置待发送的辅助消息
      ElMessage.success('面试已结束')
    } else {
      ElMessage.error(res.message || '结束面试失败')
    }
  } catch (err) {
    console.error(err)
  }
}

// 发送消息的处理函数
const handleSendText = async (content: string) => {
  if (!conversation.value || !conversation.value.conversationId) {
    ElMessage.warning('会话不存在或已失效，请重新开始面试')
    return
  }

  try {
    // 明确记录日志并重置音频播放
    console.log('发送文本消息前重置音频')
    // 确保在发送消息前重置音频
    resetAudio()

    loading.value = true
    inputDisabled.value = true
    const mainResponse = ref('')

    // 添加用户消息到列表
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: Math.floor(Date.now() / 1000).toString()
    })

    currentMessage.value = ''
    const aiMessageId = Date.now().toString()
    let aiMessageAdded = false

    // 发送主会话消息
    sendStreamMessage(
      {
        conversationId: conversation.value.conversationId,
        content,
        audioFlag: audioEnabled.value
      },
      {
        onMessage: (eventData) => {
          switch (eventData.type) {
            case 'text.delta':
              try {
                const jsonContent = typeof eventData.content === 'string' ? JSON.parse(eventData.content) : eventData.content
                // 检查jsonContent是否存在且含有content属性
                if (!jsonContent || typeof jsonContent !== 'object') {
                  console.error('无效的消息内容格式：', eventData.content)
                  return
                }

                const messageContent = jsonContent.content || ''

                // 当收到第一个内容片段时才添加AI消息
                if (!aiMessageAdded && messageContent && messageContent.trim()) {
                  messages.value.push({
                    id: aiMessageId,
                    role: 'assistant',
                    content: messageContent, // 直接设置第一个内容片段
                    created_at: Math.floor(Date.now() / 1000).toString()
                  });
                  mainResponse.value = messageContent
                  aiMessageAdded = true
                } else if (aiMessageAdded && messageContent) {
                  // 只有已经添加了AI消息且有内容才更新
                  messageQueue.value.push(messageContent)
                  mainResponse.value += messageContent
                  nextTick(() => {
                    processMessageQueue()
                  })
                }
              } catch (error) {
                console.error('解析消息内容失败：', error)
              }
              break

            case 'text.completed':
              currentMessage.value = ''
              loading.value = false
              inputDisabled.value = false
              // 主会话完成后，提取问题并发送辅助消息
              if (assistantConversation.value && mainResponse.value) {
                const question = extractQuestion(mainResponse.value)
                if (question) {
                  nextTick(() => {
                    sendAssistantMessage(question)
                  })
                }
              }
              break

            case 'audio.delta':
              if (audioEnabled.value) {
                handleAudioChunk(eventData.content)
              }
              break

            case 'audio.completed':
              if (audioEnabled.value) {
                endAudioStream()
              }
              break
          }
        },
        onError: (error) => {
          console.log(error)
          // 不再移除消息
          // messages.value.pop()
          ElMessage.error(error.data)
          loading.value = false
          inputDisabled.value = false
        },
        onComplete: () => {
          // 移到 text.completed 中处理
          // loading.value = false
          // inputDisabled.value = false
        }
      }
    )
  } catch (err) {
    console.error(err)
    ElMessage.error('发送消息失败')
    loading.value = false
    inputDisabled.value = false
  }
}

// 修改发送语音消息的处理函数
const handleSendAudio = async (file: File) => {
  // 创建一个消息用于显示实时识别结果
  let messageId;
  try {
    // 明确记录日志并重置音频播放
    console.log('发送语音消息前重置音频')
    // 确保在发送语音消息前重置音频
    resetAudio()

    // 检查文件是否有效
    if (!file || file.size === 0) {
      throw new Error('无效的音频文件')
    }

    messageId = Date.now().toString()
    const newMessage = {
      id: messageId,
      role: 'user',
      content: '',
      created_at: Math.floor(Date.now() / 1000).toString()
    }
    messages.value.push(newMessage)

    // 使用 flashAsrApi 获取完整的识别结果
    const response = await flashAsrApi(file)

    if (response.code === '0000' && response.data) {
      const fullText = response.data

      // 模拟流式显示效果，逐步显示文字
      const words = fullText.split('')
      let displayedText = ''

      // 逐字显示文本
      for (let i = 0; i < words.length; i++) {
        displayedText += words[i]

        // 更新消息内容
        const index = messages.value.findIndex(msg => msg.id === messageId)
        if (index !== -1) {
          messages.value[index] = {
            ...messages.value[index],
            content: displayedText
          }
        }

        // 添加延迟以模拟流式效果 (每个字符50ms)
        await new Promise(resolve => setTimeout(resolve, 1))
      }

      // 确保最终文本完整显示后，发送AI对话消息
      if (!conversation.value || !conversation.value.conversationId) {
        ElMessage.warning('会话不存在或已失效，请重新开始面试')
        return
      }

      const mainResponse = ref('')
      const aiMessageId = Date.now().toString()
      let aiMessageAdded = false

      // 发送主会话消息
      await sendStreamMessage(
        {
          conversationId: conversation.value.conversationId,
          content: fullText,
          audioFlag: audioEnabled.value
        },
        {
          onMessage: (eventData) => {
            switch (eventData.type) {
              case 'text.delta':
                try {
                  const jsonContent = typeof eventData.content === 'string' ? JSON.parse(eventData.content) : eventData.content
                  // 检查jsonContent是否存在且含有content属性
                  if (!jsonContent || typeof jsonContent !== 'object') {
                    console.error('无效的消息内容格式：', eventData.content)
                    return
                  }

                  const messageContent = jsonContent.content || ''

                  // 当收到第一个内容片段时才添加AI消息
                  if (!aiMessageAdded && messageContent && messageContent.trim()) {
                    messages.value.push({
                      id: aiMessageId,
                      role: 'assistant',
                      content: messageContent, // 直接设置第一个内容片段
                      created_at: Math.floor(Date.now() / 1000).toString()
                    });
                    mainResponse.value = messageContent
                    aiMessageAdded = true
                  } else if (aiMessageAdded && messageContent) {
                    // 只有已经添加了AI消息且有内容才更新
                    messageQueue.value.push(messageContent)
                    mainResponse.value += messageContent
                    nextTick(() => {
                      processMessageQueue()
                    })
                  }
                } catch (error) {
                  console.error('解析消息内容失败：', error)
                }
                break

              case 'text.completed':
                currentMessage.value = ''
                // 主会话完成后，提取问题并发送辅助消息
                if (assistantConversation.value && mainResponse.value) {
                  const question = extractQuestion(mainResponse.value)
                  if (question) {
                    nextTick(() => {
                      sendAssistantMessage(question)
                    })
                  }
                }
                break

              case 'audio.delta':
                if (audioEnabled.value) {
                  handleAudioChunk(eventData.content)
                }
                break

              case 'audio.completed':
                if (audioEnabled.value) {
                  endAudioStream()
                }
                break
            }
          },
          onError: (error) => {
            console.log(error)
            ElMessage.error(error.data)
            // 在错误时重置所有状态
            chatListRef.value?.resetSendingState()
            loading.value = false
            inputDisabled.value = false
          },
          onComplete: () => {
            // 只在整个流程完成时重置状态
            chatListRef.value?.resetSendingState()
            loading.value = false
            inputDisabled.value = false
          }
        }
      )
    } else {
      throw new Error(response.message || '语音识别失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('发送语音消息失败')
    // 移除失败的消息
    const index = messages.value.findIndex(msg => msg.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    chatListRef.value?.resetSendingState()
  }
}

// 监听文本变化
watch(
  () => resumeData.value.text,
  (newText) => {
    isTextModified.value = newText !== initialText.value
  }
)

// 初始化
fetchResumeData()

// 组件卸载时清理资源
onUnmounted(() => {
  if (mediaSource.value) {
    if (mediaSource.value.readyState === 'open') {
      mediaSource.value.endOfStream()
    }
    URL.revokeObjectURL(audioElement.value.src)
  }
})

// 添加新的状态变量
const showResume = ref(true) // 控制是否显示简历
const assistantConversation = ref<ICoze.ConversationVO>() // 辅助会话对象
const assistantMessages = ref<ICoze.MessageResponse[]>([]) // 辅助会话消息列表
const isBlurred = ref(false)

const toggleBlur = () => {
  isBlurred.value = !isBlurred.value
}

// 添加新的状态变量
const confirmDialogVisible = ref(false)

const confirmEndInterview = () => {
  confirmDialogVisible.value = false
  handleEndInterview()
}

// 添加新的状态变量
const prologueText = ref('')
</script>

<style scoped lang="scss">
@import './components/FixButton.scss';

.interview-start {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-row) {
    margin: 0 !important;
    flex: 1;
    min-height: 0;
  }

  :deep(.el-col) {
    height: 100%;
    display: flex;
    flex-direction: column;

    .card-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;
        min-width: 100px;
        justify-content: flex-end;
      }
    }

    :deep(.el-card__body) {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }

  .edit-card,
  .chat-card {
    flex: 1;
    display: flex;
    flex-direction: column;

    .card-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 12px;
        align-items: center;

        :deep(.el-button.is-circle) {
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.05);
          }

          .el-icon {
            font-size: 18px;
          }
        }
      }
    }

    :deep(.el-card__body) {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }

  .el-form {
    height: 100%;
    display: flex;
    flex-direction: column;

    .content-item {
      flex: 1;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;

      :deep(.el-textarea) {
        height: 100%;
        display: flex;
        flex-direction: column;

        .el-textarea__inner {
          height: 100% !important;
          flex: 1;
          resize: none;
          font-size: 14px;
          line-height: 1.5;
          padding: 12px;
        }
      }
    }

    .button-item {
      margin-bottom: 0;
      :deep(.el-form-item__content) {
        display: flex;
        justify-content: flex-end;
        margin-left: 0 !important;

        .el-button {
          padding: 12px 30px;
        }
      }
    }
  }

  // 上传对话框样式
  :deep(.el-dialog__body) {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  :deep(.el-upload) {
    width: 100%;

    .el-upload-dragger {
      width: 100%;
      height: 200px;
    }
  }

  .center-content {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :deep(.el-switch) {
    .el-switch__label--left {
      // 开关关闭时（inactive）文字显示正常黑色
      color: #909399;
    }

    &.is-checked {
      .el-switch__label--left {
        // 开关打开时（active）文字显示灰色
        color: #67C23A;
      }
    }
  }
}
</style>
