<template>
  <el-dialog
    v-model="visible"
    width="100vw"
    :before-close="handleClose"
    class="overall-evaluation-dialog"
    destroy-on-close
    fullscreen
    :show-close="false"
  >
    <template #header>
      <div class="evaluation-header">
        <span>{{ topic }} - {{ t('ielts.quiz.overallTitle') }}</span>
        <el-button
          type="danger"
          text
          class="close-btn"
          @click="handleClose"
        >
          {{ t('ielts.quiz.exit') }}
        </el-button>
      </div>
    </template>

    <div class="overall-evaluation-content">
      <!-- 总体评估处理中 -->
      <div
        v-if="overallEvaluationStatus === 'processing'"
        class="processing-status"
      >
        <div class="processing-indicator">
          <div class="processing-spinner" />
          <span class="processing-text">{{ t('ielts.quiz.overallProcessing') }}</span>
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
              class="secondary-action-button"
              @click="checkOverallEvaluationStatus"
              :icon="RefreshRight"
            >
              {{ t('ielts.quiz.refreshStatus') }}
            </el-button>
          </div>
          <p class="processing-tip">
            {{ t('ielts.quiz.processingTip') }}
          </p>
        </div>
      </div>

      <!-- 总体评估成功 -->
      <div
        v-else-if="overallEvaluationStatus === 'completed'"
        class="overall-results"
      >
        <!-- 评分展示区域 -->
        <div style="margin-bottom: 30px;">
          <h2 class="results-title">
            {{ t('ielts.quiz.overallResults') }}
          </h2>
          <div class="score-grid">
            <div class="score-card" :style="{ background: scoreCardGradient }">
              <div class="score-label">
                {{ t('ielts.quiz.accuracy') }}
              </div>
              <div class="score-value">
                {{ (evaluationResult.accuracy || 0).toFixed(2) }}
              </div>
              <div class="score-desc">
                {{ t('ielts.quiz.accuracyDesc') }}
              </div>
            </div>

            <div class="score-card" :style="{ background: scoreCardGradient }">
              <div class="score-label">
                {{ t('ielts.quiz.fluency') }}
              </div>
              <div class="score-value">
                {{ (evaluationResult.fluency * 100 || 0).toFixed(2) }}
              </div>
              <div class="score-desc">
                {{ t('ielts.quiz.fluencyDesc') }}
              </div>
            </div>
            <div class="score-card" :style="{ background: scoreCardGradient }">
              <div class="score-label">
                {{ t('ielts.quiz.grammar') }}
              </div>
              <div class="score-value">
                {{ (evaluationResult.grammar || 0).toFixed(2) }}
              </div>
              <div class="score-desc">
                {{ t('ielts.quiz.grammarDesc') }}
              </div>
            </div>

            <div class="score-card" :style="{ background: scoreCardGradient }">
              <div class="score-label">
                {{ t('ielts.quiz.vocabulary') }}
              </div>
              <div class="score-value">
                {{ (evaluationResult.variation || 0).toFixed(2) }}
              </div>
              <div class="score-desc">
                {{ t('ielts.quiz.vocabularyDesc') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 专业点评区域 -->
        <div
          v-if="resultComment"
          class="comment-section"
        >
          <div class="comment-header">
            <el-icon style="color: #409eff; margin-right: 8px; font-size: 18px;">
              <InfoFilled />
            </el-icon>
            <h3 style="font-size: 16px; color: #333; margin: 0; font-weight: 600;">
              {{ t('ielts.quiz.professionalComment') }}
            </h3>
          </div>
          <div
            class="comment-content"
            v-html="formatMarkdown(resultComment)"
          />
        </div>
      </div>

      <!-- 总体评估失败 -->
      <div
        v-else-if="overallEvaluationStatus === 'error'"
        class="error-status"
      >
        <div class="error-message">
          {{ t('ielts.quiz.overallError') }}
        </div>
        <div class="error-actions">
          <el-button
            type="primary"
            class="primary-action-button"
            @click="reappraiseOverallTopic"
          >
            {{ t('ielts.quiz.retryAnalysis') }}
          </el-button>
          <el-button
            class="secondary-action-button"
            @click="handleClose"
          >
            {{ t('ielts.quiz.exitPractice') }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { RefreshRight, InfoFilled } from '@element-plus/icons-vue'
import { ref, inject, onMounted, onUnmounted, computed } from "vue"
import { useI18n } from 'vue-i18n'
import mittBus from '@/utils/mittBus'

const { t } = useI18n()

// 根据域名判断使用哪种颜色主题（支持 URL 参数覆盖，方便本地测试）
// 使用方式：?site=speakx
const scoreCardGradient = computed(() => {
  const hostname = window.location.hostname
  const siteParam = new URLSearchParams(window.location.search).get('site')

  const isSpeakx = siteParam ? siteParam === 'speakx' : hostname === 'speakx.gealam.com'

  if (isSpeakx) {
    return 'linear-gradient(135deg, #00b4a0 0%, #00c9b7 50%, #00d4c0 100%)'
  }
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
})

interface Props {
  topic: string
  evaluationResult: any
  resultComment: string
  overallEvaluationStatus: 'processing' | 'completed' | 'error' | null
  practiceData: any
}

const props = defineProps<Props>()

const visible = ref(false)

// 使用inject获取父组件提供的方法
const checkOverallEvaluationStatus = inject<() => void>('check-overall-status')
const reappraiseOverallTopic = inject<() => void>('reappraise-overall')
const closeQuizDetail = inject<() => void>('close-quiz-detail')
const closePractice = inject<() => void>('close-practice')

const handleClose = () => {
  // 关闭总体评估对话框
  visible.value = false
  if (closeQuizDetail) {
    closeQuizDetail()
  } else if (closePractice) {
    closePractice()
  }
}

// 格式化Markdown内容
const formatMarkdown = (content: string) => {
  if (!content) return ''

  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/\n\n/g, '<br><br>')
}

// 打开对话框
const open = () => {
  visible.value = true
}

// 关闭对话框（内部使用）
const close = () => {
  visible.value = false
}

// 处理来自消息的总体评估完成通知
const handleOverallEvaluationComplete = (data: { topicPracticeId: string }) => {
  if (props.practiceData?.id?.toString() === data.topicPracticeId && visible.value) {
    // 当前总体评估完成，刷新状态
    if (checkOverallEvaluationStatus) {
      checkOverallEvaluationStatus()
    }
  }
}

// 组件挂载时添加事件监听
onMounted(() => {
  (mittBus as any).on('overall.evaluationComplete', handleOverallEvaluationComplete)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  (mittBus as any).off('overall.evaluationComplete', handleOverallEvaluationComplete)
})

// 暴露方法
defineExpose({
  open,
  close
})
</script>

<style lang="scss" scoped>
.overall-evaluation-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .evaluation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
    font-weight: 600;

    .close-btn {
      color: #f56c6c;
    }
  }
}

.overall-evaluation-content {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.results-title {
  text-align: center;
  color: #333;
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.score-card {
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.score-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  opacity: 0.9;
}

.score-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.score-desc {
  font-size: 12px;
  opacity: 0.8;
}

.comment-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #409eff;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.comment-content {
  color: #555;
  line-height: 1.6;
  font-size: 14px;
}

.processing-status {
  text-align: center;
  padding: 50px 0;

  .processing-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 30px;

    .processing-spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #409eff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .processing-text {
      font-size: 18px;
      color: #409eff;
      font-weight: 500;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  }

  .processing-illustration {
    margin: 30px 0;

    .processing-image {
      max-width: 200px;
      height: auto;
      opacity: 0.8;
    }
  }

  .processing-actions {
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 20px;
    }

    .processing-tip {
      color: #909399;
      font-size: 14px;
      margin: 0;
    }
  }
}

.completion-section {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
  margin: 24px 0;
  border: 1px solid #e3f2fd;
}

.completion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.success-icon-large {
  font-size: 32px;
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

.error-status {
  text-align: center;
  padding: 50px 0;

  .error-message {
    font-size: 18px;
    color: #f56c6c;
    margin-bottom: 30px;

    &:before {
      content: '⚠';
      font-size: 24px;
      margin-right: 8px;
    }
  }

  .error-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
  }
}

// 按钮样式
.primary-action-button, .secondary-action-button {
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.primary-action-button {
  background-color: #409eff;
  color: white;
  border: none;

  &:hover {
    background-color: #337ecc;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  }
}

.secondary-action-button {
  background-color: #ffffff;
  color: #606266;
  border: 1px solid #dcdfe6;

  &:hover {
    background-color: #f2f6fc;
    border-color: #c6e2ff;
  }
}

.refresh-icon {
  margin-right: 6px;
}
</style>
