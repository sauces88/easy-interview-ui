<template>
  <div class="sentence-repeat">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t('ielts.sentencePractice.pageTitle') }}</h2>
      <div class="description-container">
        <p class="description">
          {{ t('ielts.sentencePractice.pageDescription') }}
        </p>
      </div>
    </div>

    <!-- 考官选择区域 -->
    <SpeakerSelect
      :speakers="speakers"
      :selected-speaker="selectedSpeaker"
      @speaker-select="handleSpeakerSelect"
      @microphone-change="handleMicrophoneChange"
    >
      <template #headerText>
        <span>{{ t('ielts.sentencePractice.selectSpeakerTip') }}</span>
      </template>
      <template #actionButton="{ selectedSpeaker: speaker, microphoneGranted: micGranted }">
        <el-button
          :disabled="!speaker || !micGranted"
          @click="startPractice"
          class="start-practice-btn"
        >
          <el-icon style="margin-right: 8px; font-size: 20px">
            <VideoPlay />
          </el-icon>
          {{ t('ielts.sentencePractice.startPractice') }}
        </el-button>
      </template>
    </SpeakerSelect>

    <!-- 历史记录区域 -->
    <div class="history-section">
      <div
        class="history-grid"
        v-infinite-scroll="loadMoreHistory"
        :infinite-scroll-disabled="historyLoading"
      >
        <div
          v-if="historyList.length === 0 && !historyLoading"
          class="empty-history"
        >
          <el-empty :description="t('ielts.sentencePractice.noHistory')" />
        </div>

        <div
          v-for="record in historyList"
          :key="record.id"
          class="history-card"
        >
          <div class="score-circle">
            <div
              class="circle-progress"
              :style="getProgressStyle((record as any).evaluation)"
            >
              <span class="score-text">{{ getScore((record as any).evaluation) }}</span>
            </div>
          </div>
          <div class="record-info">
            <div class="record-time">
              {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
            </div>
            <div class="record-status">
              <el-tag
                :type="getStatusTagType((record as any).result)"
                size="small"
                effect="dark"
              >
                {{ getStatusText((record as any).result) }}
              </el-tag>
            </div>
          </div>
          <div class="record-actions">
            <el-button
              size="small"
              type="primary"
              text
              @click="viewDetails(record)"
            >
              {{ t('ielts.sentencePractice.viewDetails') }}
            </el-button>
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
            <h3>{{ t('ielts.sentencePractice.prepareTitle') }}</h3>
          </div>
          <p class="subtitle">
            {{ t('ielts.sentencePractice.prepareSubtitle') }}
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
              <h4>{{ t('ielts.sentencePractice.deviceCheck') }}</h4>
              <p>{{ t('ielts.sentencePractice.deviceCheckDesc') }}</p>
            </div>
          </div>

          <div class="notice-card">
            <div class="card-icon">
              <el-icon color="#F56C6C">
                <Warning />
              </el-icon>
            </div>
            <div class="card-content">
              <h4>{{ t('ielts.sentencePractice.testEnvironment') }}</h4>
              <p>{{ t('ielts.sentencePractice.testEnvironmentDesc') }}</p>
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
            {{ t('ielts.sentencePractice.cancel') }}
          </el-button>
          <el-button
            type="success"
            size="large"
            @click="startPracticeConfirm"
            text
          >
            <el-icon style="margin-right: 8px;">
              <VideoPlay />
            </el-icon>
            {{ t('ielts.sentencePractice.imReady') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 句子跟读练习组件 -->
    <SentencePractice
      ref="sentencePracticeRef"
      @practice-closed="handlePracticeClosed"
    />

    <!-- 练习详情组件 -->
    <PracticeDetail
      ref="practiceDetailRef"
    />
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted, ref} from 'vue'
import { useI18n } from 'vue-i18n'
import {ElMessage} from 'element-plus'
import {ArrowLeft, InfoFilled, Microphone, VideoPlay, Warning} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type {ISpeaker} from '@/api/interface/ielts/speaker'
import type {ISentencePractice} from '@/api/interface/ielts/sentencePractice'
import {getSpeakerListApi} from '@/api/modules/ielts/speaker'
import {getSentencePracticeListApi} from '@/api/modules/ielts/sentencePractice'
import {useUserStore} from '@/stores/modules/user'
import SpeakerSelect from '../mockExam/components/SpeakerSelect.vue'
import SentencePractice from './components/SentencePractice.vue'
import PracticeDetail from './components/PracticeDetail.vue'

const userStore = useUserStore()
const { t } = useI18n()

// 考官相关
const speakers = ref<ISpeaker.Row[]>([])
const selectedSpeaker = ref<ISpeaker.Row>()

// 麦克风权限
const microphoneGranted = ref(false)

// 历史记录相关
const historyList = ref<ISentencePractice.Row[]>([])
const historyLoading = ref(false)
const historyPage = ref(1)
const historyTotal = ref(0)

// 对话框
const showPreparationDialog = ref(false)

// 句子跟读组件引用
const sentencePracticeRef = ref<InstanceType<typeof SentencePractice>>()

// 练习详情组件引用
const practiceDetailRef = ref<InstanceType<typeof PracticeDetail>>()

// 加载考官列表
const loadSpeakers = async () => {
  const { data } = await getSpeakerListApi({ page: 1, limit: 20 })
  speakers.value = data.rows

  // 加载已选择的考官
  loadSelectedSpeaker()
}

// 加载已选择的考官
const loadSelectedSpeaker = () => {
  const saved = localStorage.getItem('ielts-selected-speaker')
  if (saved) {
    const savedSpeaker = JSON.parse(saved)
    const speaker = speakers.value.find(s => s.id === savedSpeaker.id)
    if (speaker) {
      selectedSpeaker.value = speaker
    }
  } else if (speakers.value.length > 0) {
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

// 开始练习
const startPractice = () => {
  if (!selectedSpeaker.value) {
    ElMessage.warning(t('ielts.sentencePractice.selectSpeakerFirst'))
    return
  }

  showPreparationDialog.value = true
}

// 确认开始练习
const startPracticeConfirm = () => {
  if (!selectedSpeaker.value) {
    ElMessage.warning(t('ielts.sentencePractice.selectSpeakerFirst'))
    return
  }

  showPreparationDialog.value = false

  // 打开句子跟读练习组件
  nextTick(() => {
    sentencePracticeRef.value?.open(selectedSpeaker.value!)
  })
}

// 加载历史记录
const loadHistory = async (reset = false) => {
  if (historyLoading.value) return

  historyLoading.value = true

  const params: ISentencePractice.Query = {
    page: reset ? 1 : historyPage.value,
    limit: 12,
    userId: userStore.userInfo.id
  }

  const { data } = await getSentencePracticeListApi(params)

  if (reset) {
    historyList.value = data.rows
    historyPage.value = 1
  } else {
    historyList.value.push(...data.rows)
  }

  historyTotal.value = data.total
  historyPage.value++
  historyLoading.value = false
}

// 滚动加载更多历史记录
const loadMoreHistory = () => {
  if (historyList.value.length < historyTotal.value) {
    loadHistory()
  }
}

// 获取分数
const getScore = (evaluation: string) => {
  if (!evaluation) return '-'

  const parsed = JSON.parse(evaluation)
  return parsed.suggestedScore ? Number(parsed.suggestedScore).toFixed(2) : '-'
}

// 获取进度样式
const getProgressStyle = (evaluation: string) => {
  const score = getScore(evaluation)
  if (score === '-') return {}

  const percentage = Number(score)
  const color = percentage >= 80 ? '#67C23A' : percentage >= 60 ? '#E6A23C' : '#F56C6C'

  return {
    background: `conic-gradient(${color} 0deg ${percentage * 3.6}deg, #e8f4fd ${percentage * 3.6}deg 360deg)`
  }
}

// 获取状态标签类型
const getStatusTagType = (result: string) => {
  if (!result) return 'info'

  const parsed = JSON.parse(result)
  return parsed.code === '0000' ? 'success' : 'danger'
}

// 获取状态文本
const getStatusText = (result: string) => {
  if (!result) return t('ielts.sentencePractice.unknown')

  const parsed = JSON.parse(result)
  return parsed.code === '0000' ? t('ielts.sentencePractice.completed') : t('ielts.sentencePractice.error')
}

// 查看详情
const viewDetails = (record: any) => {
  practiceDetailRef.value?.open(record, selectedSpeaker.value)
}

// 处理练习关闭事件
const handlePracticeClosed = () => {
  // 重新加载历史记录
  loadHistory(true)
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

.sentence-repeat {
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

  .start-practice-btn {
    background: #2E8BFA;
    border: none;
    border-radius: 8px;
    height: 48px;
    padding: 0 24px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(46, 139, 250, 0.2);

    &:hover:not(:disabled) {
      background: #1E7AE0;
      box-shadow: 0 4px 12px rgba(46, 139, 250, 0.3);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: scale(0.98) translateY(0);
    }

    &:disabled {
      background: #c0c4cc;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  .history-section {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    border: 1px solid #ebeef5;

    .history-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;

      .empty-history {
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px 0;
      }

      .history-card {
        display: flex;
        align-items: center;
        padding: 20px;
        background: #fafbfc;
        border: 1px solid #ebeef5;
        border-radius: 12px;
        transition: all 0.3s;

        &:hover {
          background: #f0f9ff;
          border-color: #d1ecf1;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .score-circle {
          margin-right: 16px;
          flex-shrink: 0;

          .circle-progress {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: #fff;

            &::before {
              content: '';
              position: absolute;
              width: 40px;
              height: 40px;
              background: #fff;
              border-radius: 50%;
              z-index: 1;
            }

            .score-text {
              font-size: 12px;
              font-weight: 600;
              color: #303133;
              position: relative;
              z-index: 2;
            }
          }
        }

        .record-info {
          flex: 1;
          min-width: 0;

          .record-time {
            font-size: 13px;
            color: #909399;
            margin-bottom: 8px;
          }

          .record-status {
            margin-bottom: 8px;
          }
        }

        .record-actions {
          margin-left: 16px;
          flex-shrink: 0;
          display: flex;
          align-items: center;

          .el-button {
            padding: 0;
            height: auto;
          }
        }
      }
    }
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

@media screen and (max-width: 1024px) {
  .sentence-repeat {
    .history-section {
      .history-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .sentence-repeat {
    padding: 16px;

    .page-header {
      h2 {
        font-size: 24px;
      }
    }

    .history-section {
      padding: 20px;

      .history-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  }
}
</style>
