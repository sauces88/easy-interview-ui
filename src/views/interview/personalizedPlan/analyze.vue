<template>
  <div class="analyze-page">
    <div class="content-wrapper">
      <div class="header">
        <h2>{{ t('interview.personalizedPlan.analyzeTitle') }}</h2>
      </div>
      <div class="progress-section">
        <el-progress :percentage="progress" status="success" striped striped-flow />
        <p class="progress-label">{{ t('interview.personalizedPlan.analyzeProgress') }}: {{ progress }}%</p>
      </div>
      <div class="status-section">
        <p>{{ statusText }}</p>
      </div>
    </div>

    <div v-if="errorOccurred" class="error-overlay">
      <div class="error-content">
        <el-icon color="#F56C6C" size="40"><CircleCloseFilled /></el-icon>
        <h3>{{ t('interview.personalizedPlan.analyzeError') }}</h3>
        <p>{{ t('interview.personalizedPlan.analyzeRetry') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElProgress } from 'element-plus'
import { Loading, CircleCloseFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import {
  getAgentIdByIdentifier,
  getConversationByAgentId,
  resetPersonalizedPlan
} from '@/api/modules/interview/personalizedPlan'
import { getAllMessages, sendStreamMessage } from '@/api/modules/interview/coze'
import type { ICoze } from '@/api/interface/interview/coze'

const { t } = useI18n()
const router = useRouter()
const loading = ref(true)
const progress = ref(0)
const statusText = ref(t('interview.personalizedPlan.statusPreparing'))
const errorOccurred = ref(false)
const analyzeAgentId = ref('')
const analyzeConversationId = ref('')

// 模拟进度和状态更新
const simulateProgress = () => {
  const interval = setInterval(() => {
    progress.value += 10
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
    }
  }, 300)
}

// 执行分析流程
const runAnalysis = async () => {
  loading.value = true
  errorOccurred.value = false
  progress.value = 0
  statusText.value = t('interview.personalizedPlan.statusPreparing')

  try {
    // 1. 获取智能体ID
    const { data: agentId } = await getAgentIdByIdentifier('analyzeData')
    if (!agentId) {
      throw new Error('Failed to get agent ID')
    }
    analyzeAgentId.value = agentId
    progress.value = 10

    // 2. 获取对话ID
    const { data: conversation } = await getConversationByAgentId(agentId)
    if (!conversation || !conversation.conversationId) {
      // 如果没有对话，可能需要重置或创建
      await resetPersonalizedPlan() // 尝试重置
      const { data: newConversation } = await getConversationByAgentId(agentId) // 再次获取
      if (!newConversation || !newConversation.conversationId) {
        throw new Error('Failed to get or create conversation ID')
      }
      analyzeConversationId.value = newConversation.conversationId
    } else {
      analyzeConversationId.value = conversation.conversationId
    }
    progress.value = 20
    statusText.value = t('interview.personalizedPlan.statusAnalyzingResume')

    // 3. 检查是否已有分析结果
    const { data: messages } = await getAllMessages(analyzeConversationId.value)
    if (messages && messages.length > 0 && messages.some(m => m.role === 'assistant')) {
      progress.value = 100
      statusText.value = t('interview.personalizedPlan.statusAnalyzingComplete')
      loading.value = false
      setTimeout(() => {
        router.push('/interview/personalizedPlan/match')
      }, 1500)
      return
    }

    // 4. 如果没有结果，发送消息触发分析
    progress.value = 30
    simulateProgress() // 开始模拟进度条

    const messageData: ICoze.ChatRequest = {
      conversationId: analyzeConversationId.value,
      content: '1', // 简单的触发消息
      audioFlag: false
    }

    await sendStreamMessage(messageData, {
      onMessage: (eventData) => {
        // 根据需要处理流式消息，例如更新状态文本
        // statusText.value = '更新状态...'
        if (progress.value < 90) progress.value += 5 // 逐步增加进度
      },
      onError: (error) => {
        console.error('分析流错误:', error)
        throw new Error('Stream error during analysis')
      },
      onComplete: () => {
        progress.value = 100
        statusText.value = t('interview.personalizedPlan.statusAnalyzingComplete')
        loading.value = false
        setTimeout(() => {
          router.push('/interview/personalizedPlan/match')
        }, 1500)
      }
    })
  } catch (error) {
    console.error('分析流程错误:', error)
    statusText.value = t('interview.personalizedPlan.analyzeError')
    errorOccurred.value = true
    loading.value = false
    ElMessage.error(t('interview.personalizedPlan.analyzeError'))
  }
}

onMounted(() => {
  runAnalysis()
})
</script>

<style scoped lang="scss">
.analyze-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  background-color: #f8f9fa;
  position: relative;
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
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-wrapper {
  text-align: center;

  .el-icon {
    font-size: 40px;
    color: #409EFF;
    margin-bottom: 15px;
  }

  p {
    font-size: 16px;
    color: #606266;
  }
}

.content-wrapper {
  background-color: #fff;
  padding: 40px 60px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 600px;

  .header {
    margin-bottom: 30px;
    h2 {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
    }
  }

  .progress-section {
    margin-bottom: 30px;
    .el-progress {
      margin-bottom: 10px;
    }
    .progress-label {
      font-size: 14px;
      color: #606266;
    }
  }

  .status-section {
    p {
      font-size: 16px;
      color: #303133;
      min-height: 24px;
    }
  }
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.error-content {
  text-align: center;
  background-color: #fff;
  padding: 30px 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

  h3 {
    color: #F56C6C;
    margin-top: 15px;
    margin-bottom: 10px;
    font-size: 18px;
  }
  p {
    color: #606266;
    font-size: 14px;
  }
}
</style>
