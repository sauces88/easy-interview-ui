<template>
  <div class="interview-start">
    <el-row :gutter="20" class="h-full">
      <!-- 左侧简历编辑卡片 -->
      <el-col :span="12" class="h-full">
        <el-card class="edit-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>简历信息编辑</span>
              <div class="header-actions">
                <el-button
                    v-if="hasResume"
                    type="primary"
                    link
                    @click="openUploadDialog"
                >
                  重新上传
                </el-button>
              </div>
            </div>
          </template>
          <el-empty v-if="!hasResume" description="请先上传简历文件后再编辑简历信息">
            <el-button type="primary" @click="openUploadDialog">上传简历</el-button>
          </el-empty>
          <el-form
              v-else
              ref="ruleFormRef"
              :rules="rules"
              :model="resumeData"
              @submit.enter.prevent="handleSubmit"
          >
            <el-form-item prop="text" class="content-item">
              <el-input
                  v-model="resumeData.text"
                  placeholder="请填写简历内容"
                  type="textarea"
                  :autosize="{ minRows: 16, maxRows: 16 }"
              ></el-input>
            </el-form-item>
            <el-form-item class="button-item">
              <el-button
                  type="primary"
                  @click="handleSubmit"
                  :disabled="!isTextModified"
              >
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧聊天区域 -->
      <el-col :span="12" class="h-full">
        <el-card class="chat-card" shadow="hover">
          <template #header v-if="conversation?.conversationId && !conversation.completed">
            <div class="card-header">
              <span></span>
              <div class="header-actions">
                <el-button
                    type="danger"
                    link
                    @click="handleEndInterview"
                >
                  结束面试
                </el-button>
              </div>
            </div>
          </template>

          <template v-if="conversation?.conversationId && !conversation.completed">
            <ChatList
                :messages="messages"
                :loading="loading"
                :disabled="inputDisabled"
                @send-text="handleSendText"
                @send-audio="handleSendAudio"
            />
          </template>
          <template v-else>
            <StartInterviewCard
                :selected-bot="selectedBot"
                :has-unfinished-conversation="hasUnfinishedConversation"
                @select-bot="handleSelectBot"
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
        title="上传简历"
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
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF 格式，文件大小不能超过 3M
          </div>
        </template>
      </el-upload>
    </el-dialog>

    <!-- 选择智能体弹窗 -->
    <SelectBotDialog
        v-model="showBotDialog"
        @select="handleBotSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage } from 'element-plus'
import type { UploadUserFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import {
  getLastConversation,
  createConversation,
  completeConversation,
  getMessageList,
  sendStreamMessage
} from '@/api/modules/interview/coze'
import { getCurrentUserResumeDetailApi, createResumeApi, updateResumeApi } from '@/api/modules/interview/resume'
import { asrApi } from '@/api/modules/tool/asr'
import type { ICoze } from '@/api/interface/interview/coze'
import ChatList from './components/ChatList.vue'
import SelectBotDialog from './components/SelectBotDialog.vue'
import StartInterviewCard from './components/StartInterviewCard.vue'
const selectedBot = ref<any>()

const hasUnfinishedConversation = ref(false)

// 获取上次未完成的会话
const fetchLastConversation = async () => {
  try {
    // 先重置状态
    hasUnfinishedConversation.value = false

    if (!selectedBotId.value) return

    const res = await getLastConversation(selectedBotId.value!)
    // 只有在有数据且数据不为空对象且会话未完成时才设置为 true
    if (res.code === '0000' &&
        res.data &&
        Object.keys(res.data).length > 0 &&
        !res.data.completed) {
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

const messages = ref<ICoze.MessageResponse[]>([])
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
  text: [{ required: true, message: '请填写简历内容' }]
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
        message: '您还未上传简历，请先上传简历文件',
        duration: 0,
        showClose: true
      })
    }
  } catch (error) {
    console.error('获取简历数据异常：', error)
    ElMessage.error('系统异常，请稍后重试')
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
    ElMessage.success('上传成功')
    uploadVisible.value = false
    fileList.value = []
    fetchResumeData()
  } catch (error) {
    console.error('上传失败：', error)
    ElMessage.error('上传失败')
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
const handleSelectBot = () => {
  showBotDialog.value = true
}

// 加载消息列表
const loadMessages = async () => {
  if (!conversation.value) return

  loading.value = true
  try {
    const res = await getMessageList({
      conversationId: conversation.value.conversationId,
      order: 'asc'
    })
    if (res.code === '0000') {
      messages.value = res.data.rows
    } else {
      conversation.value = undefined
      messages.value = []
      throw new Error(res.message || '获取消息列表失败')
    }
  } catch (err) {
    conversation.value = undefined
    messages.value = []
    // 不在这里显示错误消息，只抛出错误
    throw err
  } finally {
    loading.value = false
  }
}

// 选择智能体
const handleBotSelect = async ({...bot}) => {
  selectedBot.value = bot
  showBotDialog.value = false
  selectedBotId.value = bot.bot_id
}

// 继续上次面试
const handleContinueInterview = async () => {
  if (!hasResume.value) {
    ElMessage.warning('请先上传简历后再开始面试')
    return
  }
  if (!selectedBot.value) {
    ElMessage.warning('请先选择面试官')
    return
  }

  const res = await getLastConversation(selectedBotId.value)
  if (res.code === '0000' &&
      res.data &&
      Object.keys(res.data).length > 0 &&
      !res.data.completed) {
    conversation.value = res.data
  }

  if (conversation.value && !conversation.value.completed) {
    await loadMessages()
  }
}

// 开始新面试
const handleStartInterview = async () => {
  if (!hasResume.value) {
    ElMessage.warning('请先上传简历后再开始面试')
    return
  }
  if (!selectedBot.value) {
    ElMessage.warning('请先选择面试官')
    return
  }
  try {
    const res = await getLastConversation(selectedBotId.value)
    if (res.code === '0000' &&
        res.data &&
        Object.keys(res.data).length > 0 &&
        !res.data.completed) {
        const response = await completeConversation(res.data.id)
        if (response.code === '0000') {
          console.log("已结束上次面试")
        } else {
          ElMessage.error(response.message || '结束上次面试失败')
        }
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('系统异常，请稍后重试')
  }

  try {
    const res = await createConversation(selectedBot.value.bot_id)
    if (res.code === '0000') {
      conversation.value = res.data
    } else {
      ElMessage.error(res.message || '创建会话失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('系统异常，请稍后重试')
  }
}

// 结束面试
const handleEndInterview = async () => {
  if (!conversation.value) return

  try {
    const res = await completeConversation(conversation.value.id)
    if (res.code === '0000') {
      conversation.value = undefined
      messages.value = []
      hasUnfinishedConversation.value = false
      ElMessage.success('面试已结束')
    } else {
      ElMessage.error(res.message || '结束面试失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('系统异常，请稍后重试')
  }
}

// 在 script setup 顶部添加消息队列
const messageQueue = ref<string[]>([])
const isProcessingQueue = ref(false)

// 添加处理消息队列的函数
const processMessageQueue = async () => {
  if (isProcessingQueue.value || messageQueue.value.length === 0) return

  isProcessingQueue.value = true
  const currentAiMessage = messages.value[messages.value.length - 1]

  while (messageQueue.value.length > 0) {
    const text = messageQueue.value.shift() || ''
    for (let i = 0; i < text.length; i++) {
      currentAiMessage.content += text[i]
      await new Promise(resolve => setTimeout(resolve, 10)) // 控制打字速度
    }
  }

  isProcessingQueue.value = false
}

// 在 script setup 顶部添加音频相关的状态
const audioChunks = ref<string[]>([])
const mediaSource = ref<MediaSource | null>(null)
const sourceBuffer = ref<SourceBuffer | null>(null)
const audioElement = ref(new Audio())
let isPlayingAudio = false

// 初始化 MediaSource
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
    isPlayingAudio = false

    return new Promise<void>((resolve) => {
      mediaSource.value!.addEventListener('sourceopen', () => {
        try {
          sourceBuffer.value = mediaSource.value!.addSourceBuffer('audio/mpeg')
          sourceBuffer.value.mode = 'sequence'
          sourceBuffer.value.addEventListener('updateend', () => {
            // 当缓冲区更新完成后，如果还没开始播放，就开始播放
            if (!isPlayingAudio && audioElement.value.readyState >= 2) {
              isPlayingAudio = true
              audioElement.value.play().catch(err => {
                console.error('音频播放失败：', err)
                ElMessage.error('音频播放失败')
              })
            }
            // 如果队列中还有数据，继续处理
            if (audioChunks.value.length > 0 && !sourceBuffer.value?.updating) {
              const chunk = audioChunks.value.shift()
              if (chunk) handleAudioChunk(chunk)
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

// 处理音频片段
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
    // 将 base64 转换为 ArrayBuffer
    const byteCharacters = atob(base64Audio)
    const byteArray = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i)
    }

    // 如果 sourceBuffer 正在更新中，先将数据加入队列
    if (sourceBuffer.value?.updating) {
      audioChunks.value.push(base64Audio)
      return
    }

    // 将数据添加到 sourceBuffer
    sourceBuffer.value?.appendBuffer(byteArray)
  } catch (error) {
    console.error('处理音频片段失败：', error)
  }
}

// 结束音频流
const endAudioStream = () => {
  try {
    // 确保所有队列中的数据都被处理
    if (audioChunks.value.length > 0) {
      const processRemainingChunks = () => {
        if (audioChunks.value.length > 0 && !sourceBuffer.value?.updating) {
          const chunk = audioChunks.value.shift()
          if (chunk) handleAudioChunk(chunk)
          setTimeout(processRemainingChunks, 10)
        } else if (audioChunks.value.length === 0) {
          if (mediaSource.value?.readyState === 'open') {
            mediaSource.value.endOfStream()
          }
        }
      }
      processRemainingChunks()
    } else {
      if (mediaSource.value?.readyState === 'open') {
        mediaSource.value.endOfStream()
      }
    }
  } catch (error) {
    console.error('结束音频流失败：', error)
  }
  isPlayingAudio = false
}

// 修改消息处理逻辑中的音频相关部分
const handleSendText = async (content: string) => {
  if (!conversation.value || !conversation.value.conversationId) {
    ElMessage.warning('会话不存在或已失效，请重新开始面试')
    return
  }

  try {
    loading.value = true
    inputDisabled.value = true

    // 先添加用户消息到列表
    messages.value.push({
      id: Date.now().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    })

    // 创建新的 AI 消息
    currentMessage.value = ''
    const aiMessageId = Date.now().toString()
    messages.value.push({
      id: aiMessageId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    })

    // 发送消息并处理 SSE 响应
    const cleanup = sendStreamMessage(
        {
          conversationId: conversation.value.conversationId,
          content
        },
        {
          onMessage: (eventData) => {
            switch (eventData.type) {
              case 'text':
                try {
                  const jsonContent = typeof eventData.content === 'string' ? JSON.parse(eventData.content) : eventData.content
                  const messageContent = jsonContent.content || ''

                  // 只将 AI 的回复添加到消息队列
                  messageQueue.value.push(messageContent)
                  processMessageQueue()
                } catch (error) {
                  console.error('解析消息内容失败：', error)
                }
                break

              case 'text.done':
                currentMessage.value = ''
                break

              case 'audio':
                // 不再需要检查 isPlayingAudio
                handleAudioChunk(eventData.content)
                break

              case 'audio.done':
                endAudioStream()
                break
            }
          },
          onError: (error) => {
            console.log(error)
            // 移除最后一条未完成的AI消息
            messages.value.pop()
            ElMessage.error('接收消息失败')
            loading.value = false
            inputDisabled.value = false
          },
          onComplete: () => {
            loading.value = false
            inputDisabled.value = false
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
  try {
    // 先进行语音识别
    const res = await asrApi(file)
    if (res.code === '0000' && res.data) {
      handleSendText(res.data)
    } else {
      throw new Error(res.message || '语音识别失败')
    }
  } catch (err) {
    console.error(err)
    ElMessage.error('发送语音失败')
    loading.value = false
    inputDisabled.value = false
  }
}

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
</script>

<style scoped lang="scss">
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

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
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
        gap: 10px;
        align-items: center;
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
}
</style>
