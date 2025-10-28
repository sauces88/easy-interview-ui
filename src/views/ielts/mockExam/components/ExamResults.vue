<template>
  <div class="exam-results">
    <!-- 评分展示区域 -->
    <div
      v-if="parsedEvaluationResult"
      style="margin-bottom: 30px;"
    >
      <div class="score-grid">
        <div class="score-card">
          <div class="score-label">
            {{ t('ielts.mockExam.accuracy') }}
          </div>
          <div class="score-value">
            {{ (parsedEvaluationResult.accuracy || 0).toFixed(2) }}
          </div>
          <div class="score-desc">
            {{ t('ielts.mockExam.accuracyDesc') }}
          </div>
        </div>

        <div class="score-card">
          <div class="score-label">
            {{ t('ielts.mockExam.fluency') }}
          </div>
          <div class="score-value">
            {{ (parsedEvaluationResult.fluency * 100 || 0).toFixed(2) }}
          </div>
          <div class="score-desc">
            {{ t('ielts.mockExam.fluencyDesc') }}
          </div>
        </div>

        <div class="score-card">
          <div class="score-label">
            {{ t('ielts.mockExam.grammar') }}
          </div>
          <div class="score-value">
            {{ (parsedEvaluationResult.grammar || 0).toFixed(2) }}
          </div>
          <div class="score-desc">
            {{ t('ielts.mockExam.grammarDesc') }}
          </div>
        </div>

        <div class="score-card">
          <div class="score-label">
            {{ t('ielts.mockExam.vocabulary') }}
          </div>
          <div class="score-value">
            {{ (parsedEvaluationResult.variation || 0).toFixed(2) }}
          </div>
          <div class="score-desc">
            {{ t('ielts.mockExam.vocabularyDesc') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 专业点评区域 -->
    <div
      v-if="evaluationComment"
      class="comment-section"
    >
      <div class="comment-header">
        <el-icon style="color: #409eff; margin-right: 8px; font-size: 18px;">
          <InfoFilled />
        </el-icon>
        <h3 style="font-size: 16px; color: #333; margin: 0; font-weight: 600;">
          {{ t('ielts.mockExam.professionalComment') }}
        </h3>
      </div>
      <div
        class="comment-content"
        v-html="formatMarkdown(evaluationComment)"
      />
    </div>

    <!-- 无数据提示 -->
    <div
      v-if="!parsedEvaluationResult && !evaluationComment"
      class="no-data-tip"
    >
      <el-icon class="no-data-icon">
        <InfoFilled />
      </el-icon>
      <p>{{ t('ielts.mockExam.noScoreData') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  evaluationResult?: any
  evaluationComment?: string
}

const props = defineProps<Props>()

// 解析评分数据
const parsedEvaluationResult = computed(() => {
  if (!props.evaluationResult) return null

  if (typeof props.evaluationResult === 'string') {
    return JSON.parse(props.evaluationResult)
  }

  return props.evaluationResult
})

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
</script>

<style lang="scss" scoped>
.exam-results {

  .score-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
  }

  .score-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

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
  }

  .comment-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    border-left: 4px solid #409eff;

    .comment-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .comment-content {
      color: #555;
      line-height: 1.6;
      font-size: 14px;
      text-align: left;
    }
  }

  .no-data-tip {
    text-align: center;
    padding: 40px 20px;
    color: #999;

    .no-data-icon {
      font-size: 32px;
      margin-bottom: 12px;
      color: #d9d9d9;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }
}
</style>
