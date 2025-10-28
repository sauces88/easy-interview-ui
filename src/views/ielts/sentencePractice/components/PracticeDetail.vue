<template>
  <el-dialog
    v-model="visible"
    width="100vw"
    fullscreen
    :before-close="handleClose"
    class="practice-detail-dialog"
    destroy-on-close
    :show-close="false"
  >
    <template #header>
      <div class="detail-header">
        <span>{{ t('ielts.sentencePractice.practiceDetail') }}</span>
        <el-button
          type="danger"
          text
          class="close-btn"
          @click="handleClose"
        >
          {{ t('ielts.sentencePractice.close') }}
        </el-button>
      </div>
    </template>

    <!-- 加载状态 -->
    <div
      class="loading-section"
      v-if="isLoading"
    >
      <div class="loading-content">
        <div class="loading-spinner" />
        <div class="loading-text">
          {{ t('ielts.sentencePractice.loadingDetail') }}
        </div>
      </div>
    </div>

    <div
      class="practice-detail"
      v-else-if="practiceData && sentenceData"
    >
      <!-- 句子文本 -->
      <div class="text-section">
        <!-- 评估结果显示 -->
        <div class="sentence-text">
          <span
            v-for="(word, index) in evaluatedWords"
            :key="index"
            class="word"
            :class="getWordColorClass(word)"
            @mouseenter="showWordTooltip($event, word)"
            @mouseleave="hideWordTooltip"
          >
            {{ word.text }}
          </span>
        </div>
      </div>

      <!-- 音频区域 -->
      <div class="audio-section">
        <!-- 标准音频 -->
        <div class="audio-item">
          <div class="audio-label">
            {{ t('ielts.sentencePractice.referenceAudio') }}
          </div>
          <AudioWaveform
            :audio-url="sentenceData.audio"
            :autoplay="false"
            :clickable="true"
            style="height: 80px;"
          />
        </div>

        <!-- 练习录音 -->
        <div class="audio-item">
          <div class="audio-label">
            {{ t('ielts.sentencePractice.yourRecording') }}
          </div>
          <AudioWaveform
            :audio-url="practiceData.audio"
            :autoplay="false"
            :clickable="true"
            style="height: 80px; background: #f8f9fa;"
          />
        </div>
      </div>

      <!-- 评估结果 -->
      <div
        class="result-section"
        v-if="evaluationData"
      >
        <div class="scores">
          <div class="score-item">
            <span class="score-label">{{ t('ielts.sentencePractice.averageScore') }}</span>
            <span class="score-value">{{ evaluationData?.suggestedScore?.toFixed(1) || '-' }}</span>
          </div>
          <div class="score-item">
            <span class="score-label">{{ t('ielts.sentencePractice.accuracy') }}</span>
            <span class="score-value">{{ evaluationData?.accuracy === -1 ? '0.0' : (evaluationData?.accuracy?.toFixed(1) || '-') }}%</span>
          </div>
          <div class="score-item">
            <span class="score-label">{{ t('ielts.sentencePractice.fluency') }}</span>
            <span class="score-value">{{ (evaluationData?.fluency * 100)?.toFixed(1) || '-' }}%</span>
          </div>
          <div class="score-item">
            <span class="score-label">{{ t('ielts.sentencePractice.completion') }}</span>
            <span class="score-value">{{ (evaluationData?.completion * 100)?.toFixed(1) || '-' }}%</span>
          </div>
        </div>
      </div>

      <!-- 练习信息 -->
      <div class="practice-info">
        <div class="info-item">
          <span class="info-label">{{ t('ielts.sentencePractice.practiceTime') }}</span>
          <span class="info-value">{{ dayjs(practiceData.createTime).format('YYYY-MM-DD HH:mm:ss') }}</span>
        </div>
      </div>
    </div>

    <!-- 单词提示框 -->
    <div
      v-if="tooltipVisible"
      class="word-tooltip"
      :style="tooltipStyle"
    >
      <div>{{ t('ielts.sentencePractice.accuracy') }}: {{ tooltipData?.accuracy === -1 ? '0.0' : (tooltipData?.accuracy?.toFixed(1) || '-') }}%</div>
      <div>{{ t('ielts.sentencePractice.fluency') }}: {{ tooltipData?.fluency ? (tooltipData.fluency * 100).toFixed(1) : '-' }}%</div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { getSentencePracticeDetailApi } from '@/api/modules/ielts/sentencePractice'
import { getSentenceDetailV2Api } from '@/api/modules/ielts/sentence'
import AudioWaveform from '@/views/ielts/mockExam/components/AudioWaveform.vue'

const { t } = useI18n()

interface WordEvaluation {
  beginTime: number
  endTime: number
  accuracy: number
  fluency: number
  referenceWord: string
  word: string
  matchTag: number
}

interface EvaluationData {
  suggestedScore: number
  accuracy: number
  fluency: number
  completion: number
  words: WordEvaluation[]
}

interface EvaluatedWord {
  text: string
  accuracy: number
  fluency: number
  score: number
}

// 对话框状态
const visible = ref(false)
const isLoading = ref(false)

// 数据
const practiceData = ref<any>(null)
const sentenceData = ref<any>(null)
const evaluationData = ref<EvaluationData | null>(null)
const evaluatedWords = ref<EvaluatedWord[]>([])
const speaker = ref()

// 提示框
const tooltipVisible = ref(false)
const tooltipData = ref<WordEvaluation | null>(null)
const tooltipStyle = ref<any>({})

// 打开详情对话框
const open = async (record: any, selectedSpeaker: any) => {
  visible.value = true
  isLoading.value = true
  speaker.value= selectedSpeaker

  try {
    // 获取练习详情
    const practiceResponse = await getSentencePracticeDetailApi({ id: record.id })
    practiceData.value = practiceResponse.data

    // 检查 sentenceId 是否存在
    if (!practiceResponse.data.sentenceId) {
      throw new Error(t('ielts.sentencePractice.sentenceIdMissing'))
    }

    // 获取句子详情
    const sentenceResponse = await getSentenceDetailV2Api({
      speakerId: selectedSpeaker.id,
      id: practiceResponse.data.sentenceId
    })
    sentenceData.value = sentenceResponse.data

    // 处理评估数据
    if (practiceData.value.evaluation) {
      evaluationData.value = JSON.parse(practiceData.value.evaluation)
      processEvaluationWords()
    }
  } catch (error) {
    ElMessage.error(t('ielts.sentencePractice.loadDetailFailed'))
    console.error('加载详情失败:', error)
    handleClose()
  } finally {
    isLoading.value = false
  }
}

// 处理评估单词数据
const processEvaluationWords = () => {
  if (!evaluationData.value || !sentenceData.value) return

  const words = sentenceData.value.text.toLowerCase().split(/\s+/)
  const evaluationWords = evaluationData.value.words

  evaluatedWords.value = words.map((word, index) => {
    // 尝试按索引顺序匹配评估数据中的单词
    let matchedWord = evaluationWords.find(ew =>
      ew.referenceWord.toLowerCase().includes(`${word.toLowerCase()}_${index}`)
    )

    // 如果按索引匹配不到，尝试直接匹配单词
    if (!matchedWord) {
      matchedWord = evaluationWords.find(ew =>
        ew.word.toLowerCase() === word.toLowerCase()
      )
    }

    // 如果还是匹配不到，尝试部分匹配
    if (!matchedWord) {
      matchedWord = evaluationWords.find(ew =>
        ew.referenceWord.toLowerCase().includes(word.toLowerCase()) ||
        word.toLowerCase().includes(ew.word.toLowerCase())
      )
    }

    if (matchedWord) {
      const score = (matchedWord.accuracy + matchedWord.fluency * 100) / 2
      return {
        text: word,
        accuracy: matchedWord.accuracy,
        fluency: matchedWord.fluency,
        score
      }
    }

    return {
      text: word,
      accuracy: 0,
      fluency: 0,
      score: 0
    }
  })
}

// 获取单词颜色类
const getWordColorClass = (word: EvaluatedWord) => {
  if (word.score >= 80) return 'word-excellent'
  if (word.score >= 60) return 'word-good'
  return 'word-poor'
}

// 显示单词提示
const showWordTooltip = (event: MouseEvent, word: EvaluatedWord) => {
  const target = event.target as HTMLElement
  const rect = target.getBoundingClientRect()

  tooltipData.value = {
    accuracy: word.accuracy,
    fluency: word.fluency,
    beginTime: 0,
    endTime: 0,
    referenceWord: word.text,
    word: word.text,
    matchTag: 0
  }

  tooltipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top - 60}px`
  }

  tooltipVisible.value = true
}

// 隐藏单词提示
const hideWordTooltip = () => {
  tooltipVisible.value = false
}

// 关闭对话框
const handleClose = () => {
  visible.value = false

  // 重置状态
  practiceData.value = null
  sentenceData.value = null
  evaluationData.value = null
  evaluatedWords.value = []
  tooltipVisible.value = false
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.practice-detail-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .close-btn {
      color: #f56c6c;
    }
  }
}

.loading-section {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;

  .loading-content {
    text-align: center;

    .loading-spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #409eff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .loading-text {
      font-size: 16px;
      color: #606266;
      font-weight: 500;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  }
}

.practice-detail {
  padding: 20px;

  .text-section {
    margin-bottom: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;

    .sentence-text {
      font-size: 20px;
      line-height: 1.8;
      color: #303133;
      font-weight: 500;
      text-align: center;
      margin: 0;

      .word {
        padding: 1px 2px;
        margin: 0 1px;
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.3s;

        &.word-excellent {
          color: #67c23a;
          text-decoration: underline;
          text-decoration-color: #67c23a;
        }

        &.word-good {
          color: #e6a23c;
          text-decoration: underline;
          text-decoration-color: #e6a23c;
        }

        &.word-poor {
          color: #f56c6c;
          text-decoration: underline;
          text-decoration-color: #f56c6c;
        }

        &:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
      }
    }
  }

  .audio-section {
    margin-bottom: 50px;

    .audio-item {
      margin-bottom: 7%;

      .audio-label {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }
    }
  }

  .result-section {
    margin-bottom: 50px;

    .scores {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;

      .score-item {
        text-align: center;

        .score-label {
          display: block;
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .score-value {
          display: block;
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }
      }
    }
  }

  .practice-info {
    padding: 20px;
    background: #f0f9ff;
    border-radius: 12px;
    border-left: 4px solid #409eff;

    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-label {
        font-size: 14px;
        color: #909399;
        margin-right: 8px;
        min-width: 80px;
      }

      .info-value {
        font-size: 14px;
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

.word-tooltip {
  position: fixed;
  background: #303133;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 9999;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: #303133;
  }

  div {
    margin: 2px 0;
  }
}

@media screen and (max-width: 768px) {
  .practice-detail {
    padding: 16px;

    .text-section {
      .sentence-text {
        font-size: 16px;
      }
    }

    .result-section {
      .scores {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }
    }
  }
}
</style>
