<template>
  <div class="ielts-speaking">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t('ielts.mockExam.pageTitle') }}</h2>
      <div class="description-container">
        <p class="description">
          {{ t('ielts.mockExam.pageDescription') }}
        </p>
      </div>
    </div>

    <!-- 开始模拟面试区域 -->
    <SpeakerSelect
      :speakers="speakers"
      :selected-speaker="selectedSpeaker"
      @speaker-select="handleSpeakerSelect"
      @microphone-change="handleMicrophoneChange"
      @start-test="showPreparationDialog = true"
    />

    <!-- 历史记录区域 -->
    <div class="history-section">
      <div
        class="history-list"
        v-infinite-scroll="loadMoreHistory"
        :infinite-scroll-disabled="historyLoading"
      >
        <div
          v-if="historyList.length === 0 && !historyLoading"
          class="empty-history"
        >
          <el-empty :description="t('ielts.mockExam.noTestHistory')" />
        </div>

        <div
          v-for="record in historyList"
          :key="record.id"
          class="history-item"
        >
          <div class="history-main">
            <div class="history-left">
              <div class="history-title">
                {{ t('ielts.mockExam.testNumber', { id: record.id }) }}
              </div>
              <div class="history-meta">
                <span class="history-time">
                  {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
                </span>
                <el-divider direction="vertical" />
                <el-tag
                  :type="getStatusTagType(record.status)"
                  size="small"
                  effect="plain"
                >
                  {{ record.status || 'UNKNOWN' }}
                </el-tag>
                <el-tag
                  v-if="record.evaluation"
                  type="success"
                  size="small"
                  effect="dark"
                >
                  {{ t('ielts.mockExam.averageScore') }}: {{ getSuggestedScore(record.evaluation) }}
                </el-tag>
              </div>
            </div>
            <div class="history-actions">
              <el-button
                v-if="record.status === 'FINISHED'"
                size="small"
                type="success"
                text
                @click="viewExamResults(record)"
              >
                {{ t('ielts.mockExam.viewEvaluation') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 准备确认对话框 -->
    <el-dialog
      v-model="showPreparationDialog"
      width="600px"
      :close-on-click-modal="false"
      :show-close="false"
      :show-header="false"
      class="preparation-dialog"
    >
      <div class="preparation-content">
        <div class="preparation-header">
          <div class="title-with-icon">
            <el-icon
              size="24"
              color="#2E8BFA"
            >
              <InfoFilled />
            </el-icon>
            <h3>{{ t('ielts.mockExam.startTestTitle') }}</h3>
          </div>
          <p class="subtitle">
            {{ t('ielts.mockExam.startTestSubtitle') }}
          </p>
        </div>

        <div class="notice-cards">
          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#67C23A">
                <Microphone />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>{{ t('ielts.mockExam.deviceCheck') }}</h4>
              <p>{{ t('ielts.mockExam.deviceCheckDesc') }}</p>
            </div>
          </div>

          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#E6A23C">
                <Clock />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>{{ t('ielts.mockExam.timeArrangement') }}</h4>
              <p>{{ t('ielts.mockExam.timeArrangementDesc') }}</p>
            </div>
          </div>

          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#F56C6C">
                <Warning />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>{{ t('ielts.mockExam.testEnvironment') }}</h4>
              <p>{{ t('ielts.mockExam.testEnvironmentDesc') }}</p>
            </div>
          </div>

          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#909399">
                <Document />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>{{ t('ielts.mockExam.testProcess') }}</h4>
              <p>{{ t('ielts.mockExam.testProcessDesc') }}</p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            size="large"
            type="danger"
            @click="showPreparationDialog = false"
            text
          >
            <el-icon style="margin-right: 8px;">
              <ArrowLeft />
            </el-icon>
            {{ t('ielts.mockExam.cancel') }}
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="startExam"
            text
          >
            <el-icon style="margin-right: 8px;">
              <VideoPlay />
            </el-icon>
            {{ t('ielts.mockExam.imReady') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情模态框 -->
    <el-dialog
      v-model="showResultsDialog"
      :title="t('ielts.mockExam.testDetails')"
      width="98%"
      top="5vh"
      :close-on-click-modal="false"
      fullscreen
    >
      <ExamResults
        v-if="selectedExamRecord"
        :evaluation-result="selectedExamRecord.evaluation"
        :evaluation-comment="selectedExamRecord.comment"
      />
    </el-dialog>

    <!-- 模拟考试组件 -->
    <SpeakingExam ref="speakingExamRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
import {VideoPlay, Microphone, Clock, Warning, Document, InfoFilled, ArrowLeft} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { ISpeaker } from '@/api/interface/ielts/speaker'
import type { IMockExam } from '@/api/interface/ielts/mockExam'
import { getSpeakerListApi } from '@/api/modules/ielts/speaker'
import { getMockExamListApi } from '@/api/modules/ielts/mockExam'
import { useUserStore } from '@/stores/modules/user'
import SpeakingExam from './components/SpeakingExam.vue'
import SpeakerSelect from './components/SpeakerSelect.vue'
import ExamResults from './components/ExamResults.vue'

const userStore = useUserStore()

// 考官相关
const speakers = ref<ISpeaker.Row[]>([])
const selectedSpeaker = ref<ISpeaker.Row>()

// 麦克风权限
const microphoneGranted = ref(false)

// 历史记录相关
const historyList = ref<IMockExam.Row[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyTotal = ref(0)

// 对话框
const showPreparationDialog = ref(false)
const showResultsDialog = ref(false)
const selectedExamRecord = ref<IMockExam.Row | null>(null)

// 模拟考试组件引用
const speakingExamRef = ref<InstanceType<typeof SpeakingExam>>()

// 加载考官列表
const loadSpeakers = async () => {
  try {
    const { data } = await getSpeakerListApi({ page: 1, limit: 20 })
    speakers.value = data.rows

    // 加载已选择的考官
    loadSelectedSpeaker()
  } catch (error) {
    console.error('加载考官列表失败:', error)
  }
}

// 加载已选择的考官
const loadSelectedSpeaker = () => {
  const saved = localStorage.getItem('ielts-selected-speaker')
  if (saved) {
    const savedSpeaker = JSON.parse(saved)
    // 确保选中的考官在当前列表中
    const speaker = speakers.value.find(s => s.id === savedSpeaker.id)
    if (speaker) {
      selectedSpeaker.value = speaker
    }
  } else if (speakers.value.length > 0) {
    // 默认选择第一个考官
    selectedSpeaker.value = speakers.value[0]
  }
}

// 处理考官选择
const handleSpeakerSelect = (speaker: ISpeaker.Row) => {
  selectedSpeaker.value = speaker
  localStorage.setItem('ielts-selected-speaker', JSON.stringify(speaker))
}

// 处理麦克风权限变化
const handleMicrophoneChange = (granted: boolean) => {
  microphoneGranted.value = granted
}

// 加载历史记录
const loadHistory = async (reset = false) => {
  if (historyLoading.value) return

  historyLoading.value = true

  try {
    const params: IMockExam.Query = {
      page: reset ? 1 : historyPage.value,
      limit: 5,
      userId: userStore.userInfo.id
    }

    const { data } = await getMockExamListApi(params)

    if (reset) {
      historyList.value = data.rows
      historyPage.value = 1
    } else {
      historyList.value.push(...data.rows)
    }

    historyTotal.value = data.total
    historyPage.value++
  } catch (error) {
    console.error('加载历史记录失败:', error)
  } finally {
    historyLoading.value = false
  }
}

// 滚动加载更多历史记录
const loadMoreHistory = () => {
  if (historyList.value.length < historyTotal.value) {
    loadHistory()
  }
}

// 获取状态标签类型
const getStatusTagType = (status: any) => {
  switch (status) {
    case 'FINISHED': return 'success'
    case 'UNFINISHED': return 'warning'
    case 'ABNORMAL': return 'danger'
    case 'INITIALIZED': return 'info'
    default: return 'info'
  }
}

// 获取建议分数
const getSuggestedScore = (evaluation: string) => {
  if (!evaluation) return '-'

  try {
    const parsed = JSON.parse(evaluation)
    return parsed.suggestedScore ? Number(parsed.suggestedScore).toFixed(2) : '-'
  } catch {
    return '-'
  }
}

// 查看考试详情
const viewExamResults = (record: IMockExam.Row) => {
  selectedExamRecord.value = record
  showResultsDialog.value = true
}

// 开始考试
const startExam = () => {
  if (!selectedSpeaker.value) {
    ElMessage.warning(t('ielts.mockExam.pleaseSelectExaminer'))
    return
  }

  showPreparationDialog.value = false

  // 打开模拟考试组件
  nextTick(() => {
    speakingExamRef.value?.open(selectedSpeaker.value!)
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadSpeakers()
  loadHistory(true)
})
</script>

<style scoped lang="scss">
// 全局覆盖 dialog 的灰线
:global(.preparation-dialog .el-dialog) {
  border-top: none !important;
}

:global(.preparation-dialog .el-dialog__body) {
  border-top: none !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

:global(.preparation-dialog .el-dialog__header) {
  display: none !important;
  border-bottom: none !important;
}

:global(.preparation-dialog .el-dialog__footer) {
  border-top: none !important;
}
.ielts-speaking {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    text-align: center;
    margin-bottom: 40px;

    .description-container {
      border-radius: 12px;
      padding-top: 10px;
      padding-left: 20px;
    }

    .description {
      text-align: left;
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
      margin: 0;
    }
  }

  .history-section {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    border: 1px solid #ebeef5;

    .history-list {
      .empty-history {
        text-align: center;
        padding: 40px 0;
      }

      .history-item {
        padding: 20px;
        margin-bottom: 16px;
        background: #fafbfc;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          background: #f0f9ff;
          border-color: #d1ecf1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .history-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-left {
          flex: 1;
          min-width: 0;

          .history-title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 10px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .history-meta {
            display: flex;
            align-items: center;
            gap: 8px;

            .history-time {
              font-size: 13px;
              color: #909399;
            }

            .el-divider {
              margin: 0;
            }
          }
        }

        .history-actions {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
          margin-left: 16px;
        }
      }

      .loading-more {
        text-align: center;
        padding: 20px 0;
      }
    }
  }

  .preparation-content {
    h4 {
      color: #303133;
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }

    .notice-list {
      margin: 0;
      padding-left: 20px;

      li {
        margin-bottom: 12px;
        line-height: 1.6;
        color: #606266;
        font-size: 14px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .dialog-footer {
    text-align: center;
  }
}

  .preparation-content {
    padding: 32px;

    .preparation-header {
      text-align: center;
      margin-bottom: 32px;

      .title-with-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-bottom: 12px;

        h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
      }

      .subtitle {
        margin: 0;
        font-size: 14px;
        color: #909399;
      }
    }

    .notice-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .notice-card {
        display: flex;
        align-items: flex-start;
        padding: 20px;
        background: #fafbfc;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover {
          background: #f0f9ff;
          border-color: #d1ecf1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .card-icon {
          margin-right: 12px;
          font-size: 20px;
        }

        .card-content {
          flex: 1;

          h4 {
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }

          p {
            margin: 0;
            font-size: 13px;
            color: #606266;
            line-height: 1.4;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

@media screen and (max-width: 768px) {
  .ielts-speaking {
    padding: 16px;

    .page-header {
      h1 {
        font-size: 24px;
      }
    }

    .history-section {
      padding: 20px;

      .history-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;

        .history-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>
