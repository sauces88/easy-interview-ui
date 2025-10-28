<template>
  <el-dialog
    v-model="visible"
    title="练习详情"
    width="100vw"
    fullscreen
    destroy-on-close
    :show-close="false"
    class="practice-detail-dialog"
  >
    <template #header>
      <div class="detail-header">
        <!-- 显示评估时显示返回按钮，否则显示标题 -->
        <el-button
          v-if="showingEvaluation"
          @click="backToDetail"
          :icon="ArrowLeft"
          text
          class="back-btn"
        >
          返回查看答题详情
        </el-button>
        <span v-else>练习详情</span>

        <el-button
          type="danger"
          text
          class="close-btn"
          @click="visible = false"
        >
          关闭
        </el-button>
      </div>
    </template>

    <div
      v-loading="loading"
      class="detail-content"
    >
      <div
        v-if="practiceData && filteredDetails.length > 0"
        class="practice-info"
      >
        <!-- 当前题目 - 仅在未显示评估时展示 -->
        <div
          v-if="!showingEvaluation"
          class="question-item"
        >
          <!-- 题目进度 -->
          <div class="question-progress">
            <span class="progress-text">第 {{ currentIndex + 1 }} 题 / 共 {{ filteredDetails.length }} 题</span>
          </div>

          <!-- 题目内容 -->
          <div class="question-section">
            <div class="question-header">
              <h3>第 {{ currentIndex + 1 }} 题</h3>
            </div>

            <div class="question-text">
              {{ currentDetail.researchQuestion.content }}
            </div>

            <div
              v-if="currentDetail.researchQuestion.tips"
              class="question-tips"
            >
              <span style="color: #409eff; font-weight: 600">Tips：</span>
              <span style="color: #606266">{{ currentDetail.researchQuestion.tips }}</span>
            </div>

            <div
              v-if="currentDetail.researchQuestion.target"
              class="question-target"
            >
              <span style="color: #f56c6c; font-weight: 600">Research direction：</span>
              <span style="color: #606266">{{ currentDetail.researchQuestion.target }}</span>
            </div>
          </div>

          <!-- 音频播放器 -->
          <div
            v-if="currentDetail.audio"
            class="audio-section"
          >
            <h4>回答音频</h4>
            <AudioWaveform
              :audio-url="currentDetail.audio"
              :autoplay="false"
              :clickable="true"
            />
          </div>

          <!-- 答题文本 -->
          <div
            v-if="currentDetail.audioText"
            class="answer-text-section"
          >
            <h4>回答内容</h4>
            <div class="answer-text">
              {{ currentDetail.audioText }}
            </div>
          </div>

          <!-- 导航按钮 -->
          <div class="navigation-buttons">
            <el-button
              v-if="currentIndex > 0"
              @click="previousQuestion"
              :icon="ArrowLeft"
              text
            >
              上一题
            </el-button>
            <el-button
              v-if="currentIndex < filteredDetails.length - 1"
              type="primary"
              @click="nextQuestion"
              text
            >
              下一题
              <el-icon style="margin-left: 8px">
                <ArrowRight />
              </el-icon>
            </el-button>
          </div>
        </div>

        <!-- 查看评估报告按钮 -->
        <div
          v-if="hasEvaluation && !showingEvaluation && currentIndex === filteredDetails.length - 1"
          class="evaluation-ready"
        >
          <div class="ready-header">
            <el-icon class="success-icon-large">
              <SuccessFilled />
            </el-icon>
            <span class="ready-title">评估已完成</span>
          </div>

          <p class="ready-desc">
            点击下方按钮查看详细的评估报告
          </p>

          <div class="ready-actions">
            <el-button
              type="primary"
              @click="handleViewEvaluation"
              :icon="Document"
              size="large"
              text
            >
              查看评估报告
            </el-button>
          </div>
        </div>

        <!-- 评估报告 -->
        <div
          v-if="showingEvaluation"
          class="practice-finished"
        >
          <!-- 评分和点评展示 - 使用 Markdown 渲染 -->
          <div class="evaluation-container">
            <div
              v-if="practiceData.score"
              class="evaluation-section"
            >
              <div class="section-header">
                <el-icon class="header-icon">
                  <Document />
                </el-icon>
                <h3>评分</h3>
              </div>
              <div class="markdown-content">
                <v-md-preview :text="practiceData.score" />
              </div>
            </div>

            <div
              v-if="practiceData.comment"
              class="comment-section"
            >
              <div class="section-header">
                <el-icon class="header-icon">
                  <Document />
                </el-icon>
                <h3>评语</h3>
              </div>
              <div class="markdown-content">
                <v-md-preview :text="practiceData.comment" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getProjTaskDetailApi } from '@/api/modules/research/projTask'
import { SuccessFilled, Document, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import AudioWaveform from '@/views/ielts/mockExam/components/AudioWaveform.vue'
import VMdPreview from '@kangc/v-md-editor/lib/preview'
import '@kangc/v-md-editor/lib/style/preview.css'
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js'
import '@kangc/v-md-editor/lib/theme/style/github.css'

// 初始化 markdown 预览主题
VMdPreview.use(githubTheme)

const visible = ref(false)
const loading = ref(false)
const practiceData = ref<any>(null)
const showingEvaluation = ref(false)
const currentIndex = ref(0)

// 是否有评估（只有已完结状态才显示评估按钮）
const hasEvaluation = computed(() => {
  if (!practiceData.value) return false
  // 只有状态为已完结(1)时，才显示评估按钮
  if (practiceData.value.status !== 1) return false
  return !!(practiceData.value.score || practiceData.value.comment)
})

// 过滤后的题目列表（未完结状态只显示已答题的）
const filteredDetails = computed(() => {
  if (!practiceData.value || !practiceData.value.projTaskDetails) return []

  const details = practiceData.value.projTaskDetails

  // 如果是未完结状态(0)，只返回已答题的（有audio或audioText的）
  if (practiceData.value.status === 0) {
    return details.filter((detail: any) => detail.audio || detail.audioText)
  }

  // 其他状态返回所有题目
  return details
})

// 当前题目
const currentDetail = computed(() => {
  return filteredDetails.value[currentIndex.value]
})

// 上一题
const previousQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

// 下一题
const nextQuestion = () => {
  if (currentIndex.value < filteredDetails.value.length - 1) {
    currentIndex.value++
  }
}

// 查看评估
const handleViewEvaluation = () => {
  showingEvaluation.value = true
}

// 返回查看答题详情
const backToDetail = () => {
  showingEvaluation.value = false
  // 返回到最后一题
  currentIndex.value = filteredDetails.value.length - 1
}

// 加载详情
const loadDetail = async (id: number) => {
  loading.value = true
  try {
    const { data } = await getProjTaskDetailApi({ id })
    if (data) {
      practiceData.value = data
      currentIndex.value = 0
    }
  } catch (error) {
    ElMessage.error('加载详情失败')
  } finally {
    loading.value = false
  }
}

// 打开对话框
const open = (id: number) => {
  visible.value = true
  showingEvaluation.value = false
  currentIndex.value = 0
  loadDetail(id)
}

defineExpose({
  open
})
</script>

<style scoped lang="scss">
.practice-detail-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .back-btn {
      font-size: 14px;
      padding: 8px 16px;

      &:hover {
        color: #409eff;
        background: #ecf5ff;
      }
    }

    .close-btn {
      color: #f56c6c;
    }
  }
}

.detail-content {
  padding: 20px;
  min-height: 400px;
}

.practice-info {
  margin: 0 auto;
}

.question-item {
  margin-bottom: 40px;
}

.question-progress {
  margin-bottom: 20px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  text-align: center;

  .progress-text {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
  }
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #e6e8eb;

  .el-button {
    min-width: 120px;
  }
}

.question-section {
  margin-bottom: 24px;
  padding: 24px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e6e8eb;

  .question-header {
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .question-text {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 16px;
  }

  .question-tips {
    margin-bottom: 12px;
    padding: 12px;
    background: #f0f9ff;
    border-left: 3px solid #409eff;
    border-radius: 4px;
    line-height: 1.6;
  }

  .question-target {
    padding: 12px;
    background: #fef0f0;
    border-left: 3px solid #f56c6c;
    border-radius: 4px;
    line-height: 1.6;
  }
}

.audio-section {
  margin-bottom: 24px;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
  }
}

.answer-text-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e6e8eb;
  border-radius: 8px;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 12px 0;
  }

  .answer-text {
    font-size: 14px;
    line-height: 1.8;
    color: #606266;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.evaluation-ready {
  text-align: center;
  padding: 40px 20px;
  margin-top: 40px;
  background: #f8f9fa;
  border-radius: 12px;

  .ready-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 20px;

    .success-icon-large {
      font-size: 48px;
      color: #52c41a;
    }

    .ready-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
    }
  }

  .ready-desc {
    font-size: 16px;
    color: #606266;
    margin-bottom: 30px;
    line-height: 1.6;
  }

  .ready-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }
}

.practice-finished {
  padding: 20px;

  .evaluation-container {
    .evaluation-section,
    .comment-section {
      margin-bottom: 30px;
      background: #ffffff;
      border: 1px solid #e6e8eb;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff;

        .header-icon {
          font-size: 20px;
        }

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      .markdown-content {
        padding: 20px;
        text-align: left;
        background: #fafbfc;

        :deep(.v-md-editor-preview) {
          background: transparent;
          padding: 0;
        }

        :deep(.github-markdown-body) {
          background: transparent;
          font-size: 14px;
          line-height: 1.8;

          h1,
          h2,
          h3,
          h4,
          h5,
          h6 {
            margin-top: 24px;
            margin-bottom: 16px;
            font-weight: 600;
            line-height: 1.25;
            color: #303133;
          }

          h1 {
            font-size: 2em;
            border-bottom: 1px solid #e6e8eb;
            padding-bottom: 0.3em;
          }

          h2 {
            font-size: 1.5em;
            border-bottom: 1px solid #e6e8eb;
            padding-bottom: 0.3em;
          }

          p {
            margin-bottom: 16px;
          }

          ul,
          ol {
            padding-left: 2em;
            margin-bottom: 16px;
          }

          li {
            margin-bottom: 8px;
          }

          code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.9em;
          }

          pre {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
          }

          blockquote {
            border-left: 4px solid #409eff;
            padding-left: 16px;
            color: #606266;
            margin: 16px 0;
          }

          table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;

            th,
            td {
              border: 1px solid #e6e8eb;
              padding: 8px 12px;
              text-align: left;
            }

            th {
              background: #f3f4f6;
              font-weight: 600;
            }

            tr:nth-child(even) {
              background: #fafbfc;
            }
          }

          strong {
            font-weight: 600;
            color: #303133;
          }

          em {
            font-style: italic;
          }
        }
      }
    }
  }
}
</style>
