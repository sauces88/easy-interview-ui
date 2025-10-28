<template>
  <div class="evaluation-results">
    <!-- 单题评分展示 -->
    <div
      v-if="evaluationResult"
      class="scores-section"
    >
      <div class="score-card">
        <div class="score-item-overall">
          <div class="score-label">
            {{ t('ielts.quiz.currentScore') }}
          </div>
          <div class="score-value">
            {{ evaluationResult.suggestedScore?.toFixed(2) || 0 }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  evaluationResult: any
  resultComment: string
}

const props = withDefaults(defineProps<Props>(), {
  evaluationResult: null,
  resultComment: ''
})

// 格式化Markdown内容
const formatMarkdown = (content: string) => {
  if (!content) return ''

  // 基本的markdown转HTML
  return content
    // 处理粗体 **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 处理斜体 *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 处理代码 `code` -> <code>code</code>
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 处理换行 \n -> <br>
    .replace(/\n/g, '<br>')
    // 处理段落分隔 (连续两个换行)
    .replace(/\n\n/g, '<br><br>')
}
</script>

<style lang="scss" scoped>
.evaluation-results {
  margin-top: 24px;
  padding: 24px;

  .scores-section {
    margin-bottom: 28px;
  }
  
  .score-card {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  
  .score-item-overall {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    min-width: 160px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
  
  .score-label {
    font-size: 14px;
    opacity: 0.9;
    margin-bottom: 8px;
  }
  
  .score-value {
    font-size: 32px;
    font-weight: bold;

  }

}

</style>
