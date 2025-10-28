<template>
  <div class="personalized-plan">
    <div class="plan-header">
      <div class="avatar">
        <el-avatar :size="80" src="/avatar.jpg" />
      </div>
      <div class="header-title">
        <h2>{{ t('interview.personalizedPlan.title') }}</h2>
      </div>
      <div class="header-description">
        <p>{{ t('interview.personalizedPlan.description') }}</p>
      </div>
    </div>

    <div class="plan-steps">
      <el-steps :active="activeStep" finish-status="success" simple>
        <el-step :title="t('interview.personalizedPlan.stepUpload')" />
        <el-step :title="t('interview.personalizedPlan.stepAnalyze')" />
        <el-step :title="t('interview.personalizedPlan.stepMatch')" />
        <el-step :title="t('interview.personalizedPlan.stepGenerate')" />
      </el-steps>
    </div>

    <div class="plan-content">
      <div v-if="activeStep === 1" class="step-content">
        <div v-if="!hasResume" class="empty-content">
          <el-empty :description="t('interview.personalizedPlan.emptyResume')">
            <el-button type="primary" @click="goToUploadResume">{{ t('interview.personalizedPlan.uploadButton') }}</el-button>
          </el-empty>
        </div>
        <div v-else class="resume-content">
          <el-button type="primary" @click="goToAnalyzeData">{{ t('interview.personalizedPlan.startButton') }}</el-button>
        </div>
      </div>

      <div v-else-if="activeStep === 2" class="step-content">
        <el-button type="primary" @click="goToAnalyzeData">{{ t('interview.personalizedPlan.startButton') }}</el-button>
      </div>

      <div v-else-if="activeStep === 3" class="step-content">
        <el-button type="primary" @click="goToMatchJob">{{ t('interview.personalizedPlan.startButton') }}</el-button>
      </div>

      <div v-else-if="activeStep === 4" class="step-content">
        <el-button type="primary" @click="goToGeneratePlan">{{ t('interview.personalizedPlan.viewPlanButton') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getCurrentUserResumeDetailApi } from '@/api/modules/interview/resume'
import {
  getAgentIdByIdentifier,
  getConversationByAgentId,
  resetPersonalizedPlan
} from '@/api/modules/interview/personalizedPlan'
import { getAllMessages } from '@/api/modules/interview/coze'
import type { ICoze } from '@/api/interface/interview/coze'
import type { IConversation } from '@/api/interface/interview/conversation'
import type { IResume } from '@/api/interface/interview/resume'

const { t } = useI18n()
const router = useRouter()
const activeStep = ref(1)
const hasResume = ref(false)
const analyzeDataMessages = ref<ICoze.MessageResponse[]>([])
const matchJobMessages = ref<ICoze.MessageResponse[]>([])
const generatePlanMessages = ref<ICoze.MessageResponse[]>([])

// 获取当前用户简历
const checkResume = async () => {
  try {
    const { data: resumeData } = await getCurrentUserResumeDetailApi()
    if (resumeData && resumeData.id) {
      hasResume.value = true
      await checkAnalyzeData()
    } else {
      hasResume.value = false
      activeStep.value = 1
    }
  } catch (error) {
    console.error('获取简历失败', error)
    hasResume.value = false
    activeStep.value = 1
  }
}

// 检查是否已有分析数据记录
const checkAnalyzeData = async () => {
  try {
    // 获取分析数据智能体ID
    const { data: analyzeAgentId } = await getAgentIdByIdentifier('analyzeData')
    if (!analyzeAgentId) {
      activeStep.value = 2
      return
    }

    // 获取分析数据对话
    const { data: analyzeConversation } = await getConversationByAgentId(analyzeAgentId)
    if (!analyzeConversation || !analyzeConversation.conversationId) {
      activeStep.value = 2
      return
    }

    // 获取所有消息
    const { data: messages } = await getAllMessages(analyzeConversation.conversationId)
    analyzeDataMessages.value = messages || []

    if (messages && messages.length > 0) {
      activeStep.value = 3
      await checkMatchJob()
    } else {
      activeStep.value = 2
    }
  } catch (error) {
    console.error('检查分析数据失败', error)
    activeStep.value = 2
  }
}

// 检查是否已有匹配工作记录
const checkMatchJob = async () => {
  try {
    // 获取匹配工作智能体ID
    const { data: matchJobAgentId } = await getAgentIdByIdentifier('matchJob')
    if (!matchJobAgentId) {
      activeStep.value = 3
      return
    }

    // 获取匹配工作对话
    const { data: matchJobConversation } = await getConversationByAgentId(matchJobAgentId)
    if (!matchJobConversation || !matchJobConversation.conversationId) {
      activeStep.value = 3
      return
    }

    // 获取所有消息
    const { data: messages } = await getAllMessages(matchJobConversation.conversationId)
    matchJobMessages.value = messages || []

    // 检查是否已选择岗位
    const selectedJob = localStorage.getItem('selectedJob')

    // 只有当同时满足：1.有匹配消息 2.已选择岗位 时，才进入第4步
    if (messages && messages.length > 0) {
      if (selectedJob) {
        activeStep.value = 4
        await checkGeneratePlan()
      } else {
        // 有匹配结果但未选择岗位，保持在第3步
        activeStep.value = 3
      }
    } else {
      activeStep.value = 3
    }
  } catch (error) {
    console.error('检查匹配工作失败', error)
    activeStep.value = 3
  }
}

// 检查是否已有生成计划记录
const checkGeneratePlan = async () => {
  try {
    // 获取生成计划智能体ID
    const { data: generatePlanAgentId } = await getAgentIdByIdentifier('generatePlan')
    if (!generatePlanAgentId) {
      activeStep.value = 4
      return
    }

    // 获取生成计划对话
    const { data: generatePlanConversation } = await getConversationByAgentId(generatePlanAgentId)
    if (!generatePlanConversation || !generatePlanConversation.conversationId) {
      activeStep.value = 4
      return
    }

    // 获取所有消息
    const { data: messages } = await getAllMessages(generatePlanConversation.conversationId)
    generatePlanMessages.value = messages || []

    if (messages && messages.length > 0) {
      activeStep.value = 4
    }
  } catch (error) {
    console.error('检查生成计划失败', error)
    activeStep.value = 4
  }
}

// 跳转到上传简历页面
const goToUploadResume = () => {
  router.push('/interview/resume/owner')
}

// 转到分析数据页面
const goToAnalyzeData = () => {
  router.push('/interview/personalizedPlan/analyze')
}

// 转到匹配工作页面
const goToMatchJob = () => {
  router.push('/interview/personalizedPlan/match')
}

// 转到生成计划页面
const goToGeneratePlan = () => {
  router.push('/interview/personalizedPlan/plan')
}

// 重新分析
const reAnalyze = async () => {
  try {
    await resetPersonalizedPlan()
    ElMessage.success(t('interview.personalizedPlan.resetSuccess'))
    activeStep.value = 1
    await checkResume()
  } catch (error) {
    ElMessage.error(t('interview.personalizedPlan.resetFailed'))
    console.error('重置分析失败', error)
  }
}

onMounted(async () => {
  await checkResume()
})
</script>

<style scoped lang="scss">
.personalized-plan {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  align-items: center;

  .plan-header {
    text-align: center;
    margin-bottom: 40px;

    .avatar {
      margin-bottom: 20px;
    }

    .header-title {
      margin-bottom: 10px;

      h2 {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
    }

    .header-description {
      max-width: 600px;
      margin: 0 auto;

      p {
        color: #606266;
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }

  .plan-steps {
    width: 100%;
    max-width: 800px;
    margin-bottom: 40px;
  }

  .plan-content {
    width: 100%;
    max-width: 800px;
    background-color: #fff;
    border-radius: 8px;
    padding: 30px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .step-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;

      p {
        margin-bottom: 20px;
        font-size: 16px;
        color: #303133;
      }
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    .resume-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
  }
}

// Specific style for English step titles to prevent line breaks
:deep(.el-steps--simple) {
  .el-step__title {
    white-space: nowrap;
  }
}

// Style for English language only to prevent line break
html[lang="en"] {
  :deep(.el-steps--simple) {
    .el-step__title {
      white-space: nowrap;
    }
  }
}
</style>
