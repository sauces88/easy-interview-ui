<template>
  <div class="match-job">
    <div class="match-header">
      <el-button @click="goBack" text size="large">
        <el-icon><ArrowLeft /></el-icon>
        {{ t('common.back') }}
      </el-button>
      <div class="match-header-actions">
        <el-button
          type="primary"
          @click="generatePlan"
          :disabled="!planExists && selectedJob === null"
          size="small"
        >
          {{ planExists ? t('interview.personalizedPlan.viewPlanButton') : t('interview.personalizedPlan.generatePlanButton') }}
        </el-button>
      </div>
    </div>

    <div class="match-content">
      <!-- 分析结果 -->
      <div class="analyze-result">
        <div class="loading-container" v-if="analyzeLoading">
          <div class="loading-wrapper">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>{{ t('interview.personalizedPlan.loadingAnalyzing') }}</p>
          </div>
        </div>
        <div v-else-if="analyzeResult" class="analyze-text">
          <v-md-preview :text="analyzeResult" />
        </div>
        <div v-else class="loading-container">
          <div class="loading-wrapper">
            <el-icon class="is-loading"><Loading /></el-icon>
            <p>{{ t('interview.personalizedPlan.loadingPreparingAnalysis') }}</p>
          </div>
        </div>
      </div>

      <div class="bottom-container">
        <!-- 工作匹配结果 -->
        <div class="match-result">
          <div class="loading-container" v-if="matchLoading">
            <div class="loading-wrapper">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>{{ t('interview.personalizedPlan.loadingMatching') }}</p>
            </div>
          </div>
          <el-row v-else-if="matchResults.length > 0" :gutter="20">
            <el-col :span="8" v-for="(job, index) in matchResults" :key="index">
              <el-card
                :class="{'job-card': true, 'job-card-selected': selectedJob === index}"
                @click="selectJob(index)"
                shadow="hover"
              >
                <template #header>
                  <div class="job-header">
                    <h3>{{ job.role }}</h3>
                    <p class="company">{{ job.company }}</p>
                  </div>
                </template>
                <div class="job-content">
                  <div class="match-container">
                    <ul class="match-list">
                      <li v-for="(item, idx) in job.match" :key="idx" class="match-item">{{ item }}</li>
                    </ul>
                  </div>
                  <div class="job-description">
                    <a :href="job.linkUrl" target="_blank" class="view-link">{{ job.jobLink }}</a>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
          <div v-else class="loading-container">
            <div class="loading-wrapper">
              <el-icon class="is-loading"><Loading /></el-icon>
              <p>{{ t('interview.personalizedPlan.loadingPreparingMatch') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  getAgentIdByIdentifier,
  getConversationByAgentId,
  resetPersonalizedPlan
} from '@/api/modules/interview/personalizedPlan'
import { getAllMessages, sendStreamMessage } from '@/api/modules/interview/coze'
import type { ICoze } from '@/api/interface/interview/coze'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github'
import '@kangc/v-md-editor/lib/theme/style/github.css'

VMdPreview.use(githubTheme)

const { t } = useI18n()
const router = useRouter()
const analyzeLoading = ref(false)
const matchLoading = ref(false)
const analyzeResult = ref('')
const matchResults = ref<Array<{
  role: string;
  company: string;
  jobLink: string;
  linkUrl: string;
  match: string[];
}>>([])
const selectedJob = ref<number | null>(null)
const planExists = ref(false)

const analyzeAgentId = ref('')
const analyzeConversationId = ref('')
const matchAgentId = ref('')
const matchConversationId = ref('')
const generateAgentId = ref('')
const generateConversationId = ref('')

// Define needed variables
const analyzeError = ref(false)
const jobList = ref<Array<any>>([])

// Remove the initialization since it's already done in main.ts
// VMdPreview.use(githubTheme)

// 返回上一页
const goBack = () => {
  localStorage.removeItem('selectedJob')
  router.push('/interview/personalizedPlan')
}

// 初始化页面数据
const initData = async () => {
  // 设置初始加载状态
  analyzeLoading.value = false
  matchLoading.value = false

  try {
    // 获取分析数据智能体ID和对话
    const { data: agentId } = await getAgentIdByIdentifier('analyzeData')
    if (agentId) {
      analyzeAgentId.value = agentId
      const { data: conversation } = await getConversationByAgentId(agentId)
      if (conversation && conversation.conversationId) {
        analyzeConversationId.value = conversation.conversationId
        // 获取分析结果消息
        const { data: messages } = await getAllMessages(conversation.conversationId)
        if (messages && messages.length > 0) {
          // 寻找第一条助手回复
          const assistantMessage = messages.find(msg => msg.role === 'assistant')
          if (assistantMessage) {
            analyzeResult.value = assistantMessage.content
          }
        }
      }
    }

    // 获取匹配工作智能体ID和对话
    const { data: matchId } = await getAgentIdByIdentifier('matchJob')
    if (matchId) {
      matchAgentId.value = matchId
      const { data: conversation } = await getConversationByAgentId(matchId)
      if (conversation && conversation.conversationId) {
        matchConversationId.value = conversation.conversationId
        // 获取匹配结果消息
        const { data: messages } = await getAllMessages(conversation.conversationId)
        if (messages && messages.length > 0) {
          // 寻找第一条助手回复
          const assistantMessage = messages.find(msg => msg.role === 'assistant')
          if (assistantMessage) {
            parseMatchResult(assistantMessage.content)
          }
        }
      }
    }

    // 检查是否已存在计划
    const { data: generateId } = await getAgentIdByIdentifier('generatePlan')
    if (generateId) {
      generateAgentId.value = generateId
      const { data: conversation } = await getConversationByAgentId(generateId)
      if (conversation && conversation.conversationId) {
        generateConversationId.value = conversation.conversationId
        // 获取已有的计划内容
        const { data: messages } = await getAllMessages(conversation.conversationId)
        if (messages && messages.length > 0) {
          // 寻找助手回复
          const assistantMessage = messages.find(msg => msg.role === 'assistant')
          if (assistantMessage && assistantMessage.content) {
            planExists.value = true
          }
        }
      }
    }

    // 如果没有分析结果，自动开始分析
    if (!analyzeResult.value && analyzeAgentId.value && analyzeConversationId.value) {
      startAnalyze()
    }
    // 如果有分析结果但没有匹配结果，自动开始匹配
    else if (analyzeResult.value && matchResults.value.length === 0 && matchAgentId.value && matchConversationId.value) {
      startMatch()
    }
  } catch (error) {
    console.error('初始化数据失败', error)
    ElMessage.error(t('interview.personalizedPlan.fetchDataFailed'))
  }
}

// 解析匹配结果（从文本转为结构化数据）
const parseMatchResult = (text: string) => {
  if (!text) return

  try {
    // 解析返回的JSON格式数据
    const parsedData = JSON.parse(text)
    if (Array.isArray(parsedData)) {
      matchResults.value = parsedData
    } else if (typeof parsedData === 'object') {
      // 如果是对象而不是数组，检查是否有jobs或matches等属性
      if (parsedData.jobs && Array.isArray(parsedData.jobs)) {
        matchResults.value = parsedData.jobs
      } else if (parsedData.matches && Array.isArray(parsedData.matches)) {
        matchResults.value = parsedData.matches
      } else {
        console.warn('返回的匹配数据格式不符合预期:', parsedData)
        matchResults.value = []
      }
    } else {
      console.warn('返回的匹配数据格式不符合预期:', parsedData)
      matchResults.value = []
    }
  } catch (error) {
    console.error('解析匹配结果失败', error)
    matchResults.value = []
    ElMessage.error(t('interview.personalizedPlan.parseMatchError'))
  }
}

// 开始分析
const startAnalyze = async () => {
  if (!analyzeAgentId.value || !analyzeConversationId.value) {
    ElMessage.error(t('interview.personalizedPlan.analyzeStartError'))
    return
  }

  analyzeLoading.value = true
  analyzeResult.value = '' // 清空之前的结果，以便流式显示
  analyzeError.value = false

  // 用于跟踪是否已收到第一条数据
  let receivedFirstChunk = false

  try {
    // 发送主会话消息
    let responseContent = ''
    sendStreamMessage(
      {
        conversationId: analyzeConversationId.value,
        content: '1', // 简单的触发消息
        audioFlag: false
      },
      {
        onMessage: (eventData: any) => {
          if (eventData.type === 'text.delta') {
            try {
              // 处理不同格式的内容
              let messageContent = ''
              if (typeof eventData.content === 'string') {
                try {
                  const parsed = JSON.parse(eventData.content)
                  messageContent = parsed.content || ''
                } catch (e) {
                  // 如果不是JSON格式，直接使用内容
                  messageContent = eventData.content
                }
              } else if (eventData.content && typeof eventData.content === 'object') {
                messageContent = eventData.content.content || ''
              }

              if (messageContent) {
                // 收到第一条数据时立即取消加载状态
                if (!receivedFirstChunk && messageContent.trim()) {
                  analyzeLoading.value = false
                  receivedFirstChunk = true
                }

                responseContent += messageContent
                analyzeResult.value = responseContent

                // 使用 nextTick 确保界面已经更新后再滚动
                nextTick(() => {
                  const element = document.querySelector('.analyze-text')
                  if (element) {
                    element.scrollTop = element.scrollHeight
                  }
                })
              }
            } catch (error) {
              console.error('解析消息内容失败：', error)
            }
          }
        },
        onError: (error: any) => {
          console.error('分析失败', error)
          ElMessage.error(t('interview.personalizedPlan.analyzeProcessError'))
          analyzeLoading.value = false
          analyzeError.value = true
        },
        onComplete: () => {
          // 确保即使没有收到任何数据，加载状态也会被取消
          analyzeLoading.value = false
          // 如果没有匹配结果，开始匹配
          if (matchResults.value.length === 0) {
            startMatch()
          }
        }
      }
    )
  } catch (error) {
    console.error('启动分析失败', error)
    ElMessage.error(t('interview.personalizedPlan.analyzeLaunchError'))
    analyzeLoading.value = false
    analyzeError.value = true
  }
}

// 开始匹配
const startMatch = async () => {
  if (!matchAgentId.value || !matchConversationId.value) {
    ElMessage.error(t('interview.personalizedPlan.matchStartError'))
    return
  }

  matchLoading.value = true
  // 清空之前的匹配结果
  matchResults.value = []

  // 用于跟踪是否已收到第一条数据
  let receivedFirstChunk = false

  try {
    // 发送消息触发匹配
    let responseContent = ''
    sendStreamMessage(
      {
        conversationId: matchConversationId.value,
        content: '2', // 简单的触发消息
        audioFlag: false
      },
      {
        onMessage: (eventData) => {
          if (eventData.type === 'text.delta') {
            try {
              // 处理不同格式的内容
              let messageContent = ''
              if (typeof eventData.content === 'string') {
                try {
                  const parsed = JSON.parse(eventData.content)
                  messageContent = parsed.content || ''
                } catch (e) {
                  // 如果不是JSON格式，直接使用内容
                  messageContent = eventData.content
                }
              } else if (eventData.content && typeof eventData.content === 'object') {
                messageContent = eventData.content.content || ''
              }

              if (messageContent) {
                // 收到第一条数据时立即取消加载状态
                if (!receivedFirstChunk && messageContent.trim()) {
                  matchLoading.value = false
                  receivedFirstChunk = true
                }

                responseContent += messageContent

                // 尝试实时解析JSON数组
                try {
                  // 确保完整的JSON
                  let validJson = responseContent.trim()
                  // 检查是否有未闭合的括号
                  if (validJson.startsWith('[') && !validJson.endsWith(']')) {
                    validJson += ']'
                  }

                  const tempResult = JSON.parse(validJson)
                  if (Array.isArray(tempResult)) {
                    matchResults.value = tempResult
                  }
                } catch (e) {
                  // 解析失败时忽略，继续累积流式内容
                }
              }
            } catch (error) {
              console.error('解析消息内容失败：', error)
            }
          }
        },
        onError: (error) => {
          console.error('匹配失败', error)
          ElMessage.error(t('interview.personalizedPlan.matchProcessError'))
          matchLoading.value = false
        },
        onComplete: () => {
          // 确保即使没有收到任何数据，加载状态也会被取消
          matchLoading.value = false
          // 完成后尝试最终解析
          parseMatchResult(responseContent)
        }
      }
    )
  } catch (error) {
    console.error('启动匹配失败', error)
    ElMessage.error(t('interview.personalizedPlan.matchLaunchError'))
    matchLoading.value = false
  }
}

// 选择岗位
const selectJob = (index: number) => {
  selectedJob.value = index
}

// 重置匹配
const resetMatch = async () => {
  try {
    await resetPersonalizedPlan()
    ElMessage.success(t('interview.personalizedPlan.resetSuccess'))
    router.push('/interview/personalizedPlan')
  } catch (error) {
    console.error('重置失败', error)
    ElMessage.error(t('interview.personalizedPlan.resetFailed'))
  }
}

// 生成计划
const generatePlan = () => {
  // 如果已有计划，直接跳转到查看计划页面
  if (planExists.value) {
    router.push('/interview/personalizedPlan/plan')
    return
  }

  // 需要生成新计划时，才验证是否选择了岗位
  if (selectedJob.value === null) {
    ElMessage.warning(t('interview.personalizedPlan.selectJobPrompt'))
    return
  }

  const selectedJobData = matchResults.value[selectedJob.value]
  // 将选中的岗位信息存储在本地，以便在生成计划页面使用
  localStorage.setItem('selectedJob', JSON.stringify(selectedJobData))

  router.push('/interview/personalizedPlan/plan')
}

onMounted(async () => {
  await initData()
})
</script>

<style scoped lang="scss">
.match-job {
  padding: 20px;
  background-color: #f8f9fa;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .match-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    height: 32px;

    .match-header-title {
      flex: 1;
      margin-left: 10px;

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }

    .match-header-actions {
      margin-left: auto;
    }
  }

  .match-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;

    .analyze-result {
      height: 0;
      flex: 6;
      margin-bottom: 15px;
      padding: 15px;
      background-color: #ffffff;
      border-radius: 8px;
      overflow-y: auto;

      .analyze-text {
        font-size: 14px;
        line-height: 1.6;
        color: #303133;

        // Styling for the v-md-preview component
        :deep(.v-md-editor) {
          background: transparent;
          border: none;
          padding: 0;

          .v-md-pre-wrapper {
            margin: 0;
          }

          .v-md-pre-wrapper pre {
            margin: 10px 0;
            border-radius: 6px;
            padding: 12px;
            font-size: 14px;
            overflow-x: auto;
            max-width: 100%;
            background-color: #f8f8f8;
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
            font-family: Consolas, Monaco, monospace;
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

          li {
            margin-bottom: 4px;
          }
        }
      }
    }

    .bottom-container {
      height: 0;
      flex: 4;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-top: 15px;
      border-top: 1px solid #ebeef5;
      padding-top: 15px;

      .match-result {
        flex: 3.5;
        margin-bottom: 0;
        overflow-y: auto;
        padding-top: 5px;
        position: relative;
        z-index: 1;

        .el-row {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        .job-card {
          margin-bottom: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          height: 350px;
          overflow: hidden;
          position: relative;
          border: 1px solid #e4e7ed;
          z-index: 2;

          &:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-color: #e4e7ed;
          }

          &.job-card-selected {
            border: 2px solid #409EFF;
          }

          .job-header {
            flex: 3;
            margin-bottom: 0;
            padding: 8px 12px;

            h3 {
              margin: 0 0 5px 0;
              font-size: 16px;
              font-weight: bold;
              color: #303133;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .company {
              margin: 0;
              font-size: 14px;
              color: #606266;
              white-space: normal;
              overflow: visible;
            }
          }

          .job-content {
            font-size: 14px;
            color: #606266;
            overflow: auto;
            display: flex;
            flex-direction: column;
            height: calc(100% - 70px);

            .match-container {
              flex: 1;
              overflow: auto;
              padding-bottom: 36px;

              .match-list {
                padding-left: 20px;
                margin: 10px 0;
                color: #606266;
                font-size: 13px;
                list-style-position: outside;

                .match-item {
                  margin-bottom: 6px;
                  line-height: 1.4;
                  white-space: normal;
                  overflow: visible;
                }
              }
            }

            .job-description {
              position: absolute;
              bottom: 10px;
              right: 10px;
              display: flex;
              justify-content: flex-end;
              height: 36px;
              width: 100%;
              padding: 0 10px;
              box-sizing: border-box;

              .view-link {
                color: #409EFF;
                text-decoration: none;
                font-size: 13px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
                text-align: right;

                &:hover {
                  text-decoration: underline;
                }
              }
            }
          }
        }
      }
    }
  }

  .loading-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
  }

  .loading-wrapper {
    text-align: center;

    .el-icon {
      font-size: 30px;
      color: #409EFF;
      margin-bottom: 12px;
    }

    p {
      font-size: 16px;
      color: #606266;
      margin: 0;
    }
  }

  .empty-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
  }

  .analyze-result, .match-result {
    position: relative;
  }
}
</style>
