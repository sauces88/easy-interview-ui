<template>
  <div class="plan-page">
    <div class="plan-header">
      <el-button @click="goBack" text size="large">
        <el-icon><ArrowLeft /></el-icon>
        {{ t('common.back') }}
      </el-button>

      <div class="plan-header-actions">
        <el-button
          v-if="trainingPlan"
          type="primary"
          @click="mockInterview"
          size="small"
        >
          {{ t('interview.personalizedPlan.startMockInterviewButton') }}
        </el-button>
        <el-button
          type="primary"
          plain
          @click="reAnalyze"
          size="small"
        >
          {{ t('interview.personalizedPlan.reAnalyzeButton') }}
        </el-button>
      </div>
    </div>

    <div class="plan-content">
      <!-- 选中岗位信息卡片 -->
      <div class="job-info">
        <el-card class="job-card" shadow="hover">
          <template #header>
            <div class="job-header">
              <h3>{{ selectedJob.role }}</h3>
              <p class="company">{{ selectedJob.company }}</p>
            </div>
          </template>
          <div class="job-content">
            <div class="match-container">
              <ul class="match-list">
                <li v-for="(item, idx) in selectedJob.match" :key="idx" class="match-item">{{ item }}</li>
              </ul>
            </div>
            <div class="job-description">
              <a v-if="selectedJob.linkUrl && selectedJob.linkUrl !== '#'" :href="selectedJob.linkUrl" target="_blank" class="view-link">{{ selectedJob.jobLink }}</a>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分隔线 -->
      <div class="divider"></div>

      <!-- 训练计划 -->
      <div class="training-plan">
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>{{ t('interview.personalizedPlan.loadingGeneratingPlan') }}</p>
        </div>
        <div v-else-if="trainingPlan" class="plan-content-text">
           <v-md-preview :text="trainingPlan" />
        </div>
        <div v-else class="loading-wrapper">
          <el-icon class="is-loading"><Loading /></el-icon>
          <p>{{ t('interview.personalizedPlan.loadingPreparingPlan') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github'
import '@kangc/v-md-editor/lib/theme/style/github.css'
import {
  getAgentIdByIdentifier,
  getConversationByAgentId,
  resetPersonalizedPlan
} from '@/api/modules/interview/personalizedPlan'
import { getAllMessages, sendStreamMessage } from '@/api/modules/interview/coze'
import type { ICoze } from '@/api/interface/interview/coze'

VMdPreview.use(githubTheme)

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const selectedJob = ref<{
  role: string;
  company: string;
  jobLink: string;
  linkUrl: string;
  match: string[];
}>({
  role: '',
  company: '',
  jobLink: '',
  linkUrl: '',
  match: []
})
const trainingPlan = ref('')
const generateAgentId = ref('')
const generateConversationId = ref('')

// 返回上一页
const goBack = () => {
  router.push('/interview/personalizedPlan/match')
}

// 初始化数据
const initData = async () => {
  // 先获取计划生成对话，检查是否已有计划
  try {
    const { data: agentId } = await getAgentIdByIdentifier('generatePlan')
    if (agentId) {
      generateAgentId.value = agentId
      const { data: conversation } = await getConversationByAgentId(agentId)
      if (conversation && conversation.conversationId) {
        generateConversationId.value = conversation.conversationId
        // 获取已有的计划内容
        const { data: messages } = await getAllMessages(conversation.conversationId)
        if (messages && messages.length > 0) {
          // 寻找助手回复和用户消息
          const assistantMessage = messages.find(msg => msg.role === 'assistant')
          const userMessage = messages.find(msg => msg.role === 'user')

          if (assistantMessage) {
            trainingPlan.value = assistantMessage.content

            // 解析用户消息中的岗位信息
            if (userMessage && userMessage.content) {
              try {
                const jobData = JSON.parse(userMessage.content)
                if (jobData) {
                  selectedJob.value = {
                    role: jobData.role || '',
                    company: jobData.company || '',
                    jobLink: jobData.jobLink || '',
                    linkUrl: jobData.linkUrl || '#',
                    match: Array.isArray(jobData.match) ? jobData.match : []
                  }
                }
              } catch (error) {
                console.error('解析对话中的岗位数据失败', error)
                ElMessage.error(t('interview.personalizedPlan.parseJobDataError'))
              }
            }

            // 如果用户消息解析失败，再尝试从localStorage获取
            if (!selectedJob.value.role) {
              const localJobData = localStorage.getItem('selectedJob')
              if (localJobData) {
                try {
                  selectedJob.value = JSON.parse(localJobData)
                } catch (error) {
                  console.error('解析本地岗位数据失败', error)
                  ElMessage.warning(t('interview.personalizedPlan.parseLocalJobError'))
                  // 有计划但没有岗位信息，不阻止继续
                }
              }
            }

            return // 已有计划，直接返回
          }
        }
      }
    }

    // 到这里说明没有现成的计划，需要检查岗位信息
    const jobData = localStorage.getItem('selectedJob')
    if (jobData) {
      try {
        selectedJob.value = JSON.parse(jobData)
      } catch (error) {
        console.error('解析岗位数据失败', error)
        ElMessage.warning(t('interview.personalizedPlan.fetchJobError'))
        return
      }
    } else {
      ElMessage.warning(t('interview.personalizedPlan.noJobSelectedError'))
      setTimeout(() => {
        router.push('/interview/personalizedPlan/match')
      }, 1500)
      return
    }

    // 没有计划但有岗位信息，开始生成计划
    if (generateAgentId.value && generateConversationId.value) {
      generateTrainingPlan()
    }
  } catch (error) {
    console.error('获取计划数据失败', error)
    ElMessage.error(t('interview.personalizedPlan.fetchPlanError'))
  }
}

// 生成训练计划
const generateTrainingPlan = async () => {
  if (!generateAgentId.value || !generateConversationId.value) {
    ElMessage.error(t('interview.personalizedPlan.generatePlanStartError'))
    return
  }

  if (!selectedJob.value.role) {
    ElMessage.warning(t('interview.personalizedPlan.noJobSelectedError'))
    return
  }

  loading.value = true

  try {
    // 准备向AI发送的岗位信息
    const jobContent = JSON.stringify({
      role: selectedJob.value.role,
      company: selectedJob.value.company,
      jobLink: selectedJob.value.jobLink,
      linkUrl: selectedJob.value.linkUrl,
      match: selectedJob.value.match
    })

    // 发送消息触发计划生成
    const messageData: ICoze.ChatRequest = {
      conversationId: generateConversationId.value,
      content: jobContent,
      audioFlag: false
    }

    sendStreamMessage(messageData, {
      onMessage: (eventData) => {
        if (eventData.type === 'text.delta') {
          try {
            // Handle different content formats
            let messageContent = ''
            if (typeof eventData.content === 'string') {
              try {
                const parsed = JSON.parse(eventData.content)
                // Specifically look for content in assistant's message
                if (parsed.role === 'assistant') {
                  messageContent = parsed.content || ''
                }
              } catch (e) {
                // If not JSON format, use content directly
                messageContent = eventData.content
              }
            } else if (eventData.content && typeof eventData.content === 'object') {
              if (eventData.content.role === 'assistant') {
                messageContent = eventData.content.content || ''
              }
            }

            if (messageContent) {
              trainingPlan.value += messageContent
            }
          } catch (error) {
            console.error('解析消息内容失败：', error)
          }
        }
      },
      onError: (error) => {
        console.error('生成计划失败', error)
        ElMessage.error(t('interview.personalizedPlan.generatePlanProcessError'))
        loading.value = false
      },
      onComplete: () => {
        loading.value = false
      }
    })
  } catch (error) {
    console.error('启动计划生成失败', error)
    ElMessage.error(t('interview.personalizedPlan.generatePlanLaunchError'))
    loading.value = false
  }
}

// 重新分析
const reAnalyze = async () => {
  try {
    await resetPersonalizedPlan()
    // 清除本地存储的岗位信息
    localStorage.removeItem('selectedJob')
    ElMessage.success(t('interview.personalizedPlan.resetSuccess'))
    router.push('/interview/personalizedPlan')
  } catch (error) {
    console.error('重置失败', error)
    ElMessage.error(t('interview.personalizedPlan.resetFailed'))
  }
}

// 开始模拟面试
const mockInterview = () => {
  ElMessage.success(t('interview.personalizedPlan.mockInterviewStart'))
  router.push('/interview/start')
}

onMounted(async () => {
  await initData()
})
</script>

<style scoped lang="scss">
.plan-page {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 80px);
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .plan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .plan-header-title {
      h2 {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin: 0;
      }
    }
  }

  .plan-content {
    background-color: #fff;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .job-info {
      margin-bottom: 20px;

      .job-card {
        max-width: 500px;
        margin: 0 auto;
        height: 320px;
        overflow: hidden;
        position: relative;
        transition: all 0.3s ease;
        border: 1px solid #e4e7ed;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          border-color: #e4e7ed;
        }

        .job-header {
          padding: 8px 12px;
          margin-bottom: 0;

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
          height: calc(100% - 60px);

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

              li, .match-item {
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
            height: 20px;

            .view-link {
              color: #409EFF;
              text-decoration: none;
              font-size: 13px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 180px;

              &:hover {
                text-decoration: underline;
              }
            }
          }
        }
      }
    }

    .divider {
      height: 1px;
      background-color: #ebeef5;
      margin: 10px 0 20px;
      width: 100%;
    }

    .training-plan {
      flex: 1;
      overflow-y: auto;
      padding: 0;

      .plan-content-text {
        font-size: 14px;
        line-height: 1.6;
        color: #303133;

        :deep(.v-md-editor-preview) {
           padding: 0 15px;
           background: transparent;
        }
      }
    }
  }

  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;

    .el-icon {
      font-size: 30px;
      margin-bottom: 10px;
      color: #409EFF;
    }

    p {
      color: #606266;
      font-size: 16px;
    }
  }

  .empty-result {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 150px;
  }
}
</style>
