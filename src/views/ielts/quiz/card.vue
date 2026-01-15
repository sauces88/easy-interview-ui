<template>
  <div class="quiz-cards">
    <div class="search-section">
      <div class="tab-section">
        <el-tabs
          v-model="activePartId"
          @tab-change="handlePartChange"
          class="custom-tabs"
        >
          <el-tab-pane
            v-for="part in partOptions"
            :key="part.id"
            :name="part.id"
            :label="part.codeName"
          />
        </el-tabs>
      </div>

      <!-- 分类选择标签和筛选 -->
      <div class="filter-row">
        <div class="filter-left">
          <div class="category-tabs">
            <el-tabs
              v-model="activeCategoryId"
              @tab-change="handleCategoryChange"
              class="custom-tabs"
            >
              <el-tab-pane
                name=""
                label="ALL"
              />
              <el-tab-pane
                v-for="category in categoryOptions"
                :key="category.id"
                :name="category.id"
                :label="category.codeName"
              />
            </el-tabs>
          </div>
          <div class="filter-divider" />
          <div class="filter-group">
            <div
              class="filter-item"
              :class="{ 'is-active': searchForm.practiceFlag === true }"
              @click="togglePracticeFilter(true)"
            >
              {{ t('ielts.quiz.practiced') }}
            </div>
            <div
              class="filter-item"
              :class="{ 'is-active': searchForm.practiceFlag === false }"
              @click="togglePracticeFilter(false)"
            >
              {{ t('ielts.quiz.notPracticedTag') }}
            </div>
          </div>
        </div>
        <div class="search-input">
          <el-input
            v-model="searchForm.topic"
            :placeholder="t('ielts.quiz.searchPlaceholder')"
            :prefix-icon="Search"
            @keyup="handleKeywordSearch"
          />
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="action-bar">
      <div class="selected-info">
        <template v-if="selectedTopic">
          <span class="selected-label">{{ t('ielts.quiz.selected') }}:</span>
          <span class="selected-topic">{{ selectedTopic.topic }}</span>
        </template>
        <template v-else>
          <span class="no-selected">{{ t('ielts.quiz.selectTopic') }}</span>
        </template>
      </div>
      <div class="action-buttons">
        <el-button
          :disabled="!selectedTopic"
          :loading="startingPractice"
          :icon="Microphone"
          @click="handleStartTopic(selectedTopic!)"
          v-auth="'topic.practice.create'"
          class="action-btn primary"
        >
          {{ t('ielts.quiz.startPractice') }}
        </el-button>
        <el-button
          :disabled="!selectedTopic"
          :icon="View"
          @click="handleViewTopicHistory(selectedTopic!)"
          v-auth="'topic.practice.query_table'"
          class="action-btn"
        >
          {{ t('ielts.quiz.viewHistory') }}
        </el-button>
      </div>
    </div>

    <!-- Cards Container -->
    <div class="quiz-cards-container">
      <div
        class="cards-wrapper"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="loading || noMore"
        :infinite-scroll-distance="100"
        :infinite-scroll-immediate="false"
        :infinite-scroll-delay="500"
      >
        <div
          v-for="topicItem in topicList"
          :key="topicItem.topic"
          class="topic-card"
          :class="{ 'is-selected': selectedTopic?.topic === topicItem.topic }"
          @click="handleSelectTopic(topicItem)"
        >
          <div class="card-header">
            <div class="topic-tags">
              <el-tag
                v-if="topicItem.questions[0]?.part"
                size="small"
                type="info"
              >
                {{ getPartName(topicItem.questions[0].part) }}
              </el-tag>
              <el-tag
                v-if="topicItem.questions[0]?.category"
                size="small"
                type="info"
              >
                {{ getCategoryName(topicItem.questions[0].category) }}
              </el-tag>
              <el-tag
                v-if="topicItem.questions[0]?.type"
                size="small"
                type="info"
              >
                {{ getTypeName(topicItem.questions[0].type) }}
              </el-tag>
            </div>
            <span
              class="practice-badge"
              :class="topicItem.practiceCount > 0 ? 'practiced' : 'not-practiced'"
            >
              {{ topicItem.practiceCount > 0 ? t('ielts.quiz.practicedTimes', { count: topicItem.practiceCount }) : t('ielts.quiz.notPracticed') }}
            </span>
          </div>
          <div class="topic-title">
            {{ topicItem.topic }}
          </div>
          <div
            class="topic-question"
            v-if="topicItem.questions[0]?.text"
          >
            {{ topicItem.questions[0].text }}
          </div>
          <div class="card-footer">
            <el-tag
              v-if="topicItem.questions[0]?.source"
              size="small"
              class="source-tag"
            >
              {{ topicItem.questions[0].source }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- Loading & No More -->
      <div
        class="loading-text"
        v-if="loading"
      >
        {{ t('ielts.quiz.loading') }}
      </div>
      <div
        class="loading-text"
        v-if="noMore && topicList.length > 0"
      >
        {{ t('ielts.quiz.noMoreData') }}
      </div>
      <div
        class="loading-text"
        v-if="!loading && topicList.length === 0"
      >
        {{ t('ielts.quiz.noMoreData') }}
      </div>
    </div>

    <QuizDetail ref="quizDetailRef" />

    <el-dialog
      v-model="historyDialogVisible"
      width="480px"
      destroy-on-close
      class="history-dialog"
      :show-close="true"
    >
      <template #header>
        <div class="history-dialog-header">
          <span class="header-title">{{ t('ielts.quiz.viewHistory') }}</span>
          <span class="header-topic">{{ currentHistoryTopic }}</span>
        </div>
      </template>

      <div
        class="history-list"
        v-loading="historyLoading"
      >
        <div
          v-for="item in practiceHistoryList"
          :key="item.id"
          class="history-item"
        >
          <div class="item-left">
            <span class="item-id">#{{ item.id }}</span>
            <span
              class="item-status"
              :class="getTopicPracticeStatus(item).type"
            >
              {{ getTopicPracticeStatus(item).text }}
            </span>
          </div>
          <div class="item-right">
            <button
              v-if="getTopicPracticeStatus(item).type === 'success'"
              class="item-btn"
              @click="handleViewTopicDetail(item)"
            >
              {{ t('ielts.quiz.viewDetails') }}
            </button>
            <button
              v-else-if="getTopicPracticeStatus(item).type === 'info'"
              class="item-btn primary"
              @click="handleContinueTopicPractice(item)"
            >
              {{ t('ielts.quiz.continuePractice') }}
            </button>
            <button
              v-else
              class="item-btn warning"
              @click="handleRetryTopicPractice(item)"
            >
              {{ t('ielts.quiz.retryPractice') }}
            </button>
          </div>
        </div>

        <div
          v-if="!historyLoading && practiceHistoryList.length === 0"
          class="empty-state"
        >
          {{ t('ielts.quiz.noMoreData') }}
        </div>
      </div>

      <div
        class="history-pagination"
        v-if="historyTotal > historyPageSize"
      >
        <el-pagination
          v-model:current-page="historyPageNum"
          v-model:page-size="historyPageSize"
          :total="historyTotal"
          layout="prev, pager, next"
          small
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, provide} from 'vue'
import { useI18n } from 'vue-i18n'
import { useOptionsStore } from '@/stores/modules/options'
import { getQuizListV2Api } from '@/api/modules/ielts/quiz'
import type { IQuiz } from '@/api/interface/ielts/quiz'
import { getTopicPracticeHistoryListApi, getTopicPracticeDetailApi } from '@/api/modules/ielts/topicPractice'
import type { ITopicPractice } from '@/api/interface/ielts/topicPractice'
import { Search, Microphone, View } from '@element-plus/icons-vue'
import QuizDetail from './components/QuizDetail.vue'
import mittBus from '@/utils/mittBus'

const { t } = useI18n()
const optionsStore = useOptionsStore()

// 新的数据结构定义
interface QuestionItem extends IQuiz.Row {}

interface TopicItem {
  topic: string
  questions: QuestionItem[]
  practiceCount: number
}

defineOptions({
  name: 'QuizCardView'
})

// 获取字典选项
const partOptions = computed(() => optionsStore.getDictOptions('ielts_part') || [])
const categoryOptions = computed(() => optionsStore.getDictOptions('ielts_category') || [])
const typeOptions = computed(() => optionsStore.getDictOptions('ielts_type') || [])

// 获取名称方法
const getPartName = (partId: any) => {
  const part = partOptions.value.find(item => item.id === partId)
  return part ? part.codeName : partId
}

const getCategoryName = (categoryId: any) => {
  const category = categoryOptions.value.find(item => item.id === categoryId)
  return category ? category.codeName : categoryId
}

const getTypeName = (typeId: any) => {
  const type = typeOptions.value.find(item => item.id === typeId)
  return type ? type.codeName : typeId
}

// 获取标签列表
const getTagList = (tags?: string): string[] => {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(Boolean)
}

// 数据相关
const topicList = ref<TopicItem[]>([])
const activePartId = ref<string>('')
const activeCategoryId = ref<string>('')
const pageNum = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
const noMore = ref(false)
const selectedTopic = ref<TopicItem | null>(null)
const startingPractice = ref(false)

// 选择话题
const handleSelectTopic = (topicItem: TopicItem) => {
  if (selectedTopic.value?.topic === topicItem.topic) {
    selectedTopic.value = null
  } else {
    selectedTopic.value = topicItem
  }
}

// 切换练习状态筛选
const togglePracticeFilter = (value: boolean) => {
  if (searchForm.practiceFlag === value) {
    searchForm.practiceFlag = undefined
  } else {
    searchForm.practiceFlag = value
  }
  handleSearch()
}

// 搜索相关
const searchForm = reactive<{
  category?: string
  part?: string
  topic?: string
  practiceFlag?: boolean
  [key: string]: any
}>({})

// 格式化参数
const formatParams = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params))
  if (newParams.createTime) {
    newParams.createTimeStart = newParams.createTime[0]
    newParams.createTimeEnd = newParams.createTime[1]
    delete newParams.createTime
  }
  if (newParams.updateTime) {
    newParams.updateTimeStart = newParams.updateTime[0]
    newParams.updateTimeEnd = newParams.updateTime[1]
    delete newParams.updateTime
  }
  newParams.page = params.page || 1
  newParams.limit = params.limit || 12
  return newParams
}

// 获取数据
const getTableList = async () => {
  if (loading.value || noMore.value) return
  loading.value = true

  const params = {
    ...searchForm,
    page: pageNum.value,
    limit: pageSize.value
  }

  const res = await getQuizListV2Api(formatParams(params))

  let list: TopicItem[] = []

  if (res.data) {
    if (Array.isArray(res.data.rows)) {
      list = res.data.rows
    } else if (Array.isArray(res.data)) {
      list = res.data as TopicItem[]
    }
  }

  if (pageNum.value === 1) {
    topicList.value = list
  } else {
    topicList.value.push(...list)
  }

  let totalCount = 0
  if (res.data) {
    totalCount = res.data.total
  }

  total.value = totalCount
  noMore.value = topicList.value.length >= total.value || list.length === 0

  loading.value = false
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  noMore.value = false
  topicList.value = []
  getTableList()
}

// 关键词搜索
const handleKeywordSearch = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSearch()
  }
}

// Part标签切换
const handlePartChange = (partId: any) => {
  searchForm.part = partId
  handleSearch()
}

// 分类标签切换
const handleCategoryChange = (categoryId: any) => {
  searchForm.category = categoryId || undefined
  handleSearch()
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    pageNum.value++
    getTableList()
  }
}

// 移除了选择题目相关的变量，现在直接开始整个topic的练习

// 开始答题
const quizDetailRef = ref<InstanceType<typeof QuizDetail>>()

// 关闭 QuizDetail 对话框的方法
const closeQuizDetail = () => {
  if (quizDetailRef.value) {
    quizDetailRef.value.handleClose?.()
  }
}

// provide关闭方法给子组件使用
provide('close-quiz-detail', closeQuizDetail)

// 开始话题练习
const handleStartTopic = async (topicItem: TopicItem) => {
  try {
    startingPractice.value = true
    // 直接开始整个topic的练习，不再显示选择题目的对话框
    await quizDetailRef.value?.openTopicPractice(topicItem.topic)
  } finally {
    startingPractice.value = false
  }
}

// 练习记录相关
const historyDialogVisible = ref(false)
const practiceHistoryList = ref<ITopicPractice.Row[]>([])
const currentHistoryTopic = ref<string>('')
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPageNum = ref(1)
const historyPageSize = ref(10)

// 历史记录搜索表单
const historySearchForm = reactive<{
  status?: number
  [key: string]: any
}>({})

// 查看话题练习记录
const handleViewTopicHistory = async (topicItem: TopicItem) => {
  currentHistoryTopic.value = topicItem.topic
  historyPageNum.value = 1
  historySearchForm.status = undefined
  historyDialogVisible.value = true
  await loadHistoryData()
}

// 加载历史记录数据
const loadHistoryData = async () => {
  if (historyLoading.value) return
  historyLoading.value = true

  const params = {
    topic: currentHistoryTopic.value,
    page: historyPageNum.value,
    limit: historyPageSize.value,
    ...historySearchForm
  }

  const response = await getTopicPracticeHistoryListApi(params)

  if (response.data && response.data.rows) {
    practiceHistoryList.value = response.data.rows
    historyTotal.value = response.data.total || 0
  } else {
    practiceHistoryList.value = []
    historyTotal.value = 0
  }

  historyLoading.value = false
}

// 历史记录分页变化
const handleHistoryPageChange = (page: number) => {
  historyPageNum.value = page
  loadHistoryData()
}

// 获取话题练习状态 (0=未完结，否则根据result.code判断)
const getTopicPracticeStatus = (practiceRow: ITopicPractice.Row) => {
  if (practiceRow.status === 0) {
    return { type: 'info', text: t('ielts.quiz.unfinished') }
  }

  if (!practiceRow.result) {
    return { type: 'danger', text: t('ielts.quiz.error') }
  }

  const resultData = JSON.parse(practiceRow.result)
  if (resultData.code === '0000') {
    return { type: 'success', text: t('ielts.quiz.success') }
  } else {
    return { type: 'danger', text: t('ielts.quiz.error') }
  }
}

// 查看话题练习详情
const handleViewTopicDetail = async (practiceRow: ITopicPractice.Row) => {
  if (!practiceRow.id) return

  // 调用 getTopicPracticeDetailApi 获取详细的练习数据，包括 topicPracticeQuizList
  const response = await getTopicPracticeDetailApi({ id: practiceRow.id })
  const practiceDetail = response.data

  // 关闭历史记录对话框
  historyDialogVisible.value = false

  // 打开话题练习详情查看模式，传入完整的练习数据
  quizDetailRef.value?.openTopicPracticeWithData(currentHistoryTopic.value, practiceDetail, 'view')
}

// 继续练习话题 (未完结状态)
const handleContinueTopicPractice = async (practiceRow: ITopicPractice.Row) => {
  if (!practiceRow.id || !currentHistoryTopic.value) return

  // 获取详细的练习数据
  const response = await getTopicPracticeDetailApi({ id: practiceRow.id })
  const practiceDetail = response.data

  // 关闭历史记录对话框
  historyDialogVisible.value = false

  // 继续未完结的练习，传入练习数据
  quizDetailRef.value?.openTopicPracticeWithData(currentHistoryTopic.value, practiceDetail, 'continue')
}

// 重新练习话题
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleRetryTopicPractice = (_:any) => {
  if (!currentHistoryTopic.value) return

  // 关闭历史记录对话框
  historyDialogVisible.value = false

  // 直接开始新的话题练习
  quizDetailRef.value?.openTopicPractice(currentHistoryTopic.value)
}

// 处理从消息打开练习结果
const handleOpenWithResult = (data: any) => {
  if (data && data.quiz && data.practiceResult) {
    quizDetailRef.value?.openWithResult(data.quiz, data.practiceResult)
  }
}

// 处理单个练习评估完成事件
const handleQuizEvaluationComplete = (data: any) => {
  // 更新UI当单个练习评估完成
  console.log('Quiz evaluation complete:', data)
  // 可以在这里更新相关的UI状态，比如更新进度条等
}

// 处理整体评估完成事件
const handleOverallEvaluationComplete = (data: any) => {
  // 更新UI当整体评估完成
  console.log('Overall evaluation complete:', data)
  // 可以在这里刷新列表或显示完成通知
}

// 处理练习状态刷新事件
const handleQuizRefreshStatus = () => {
  // 刷新当前状态
  console.log('Refreshing quiz status')
  handleSearch() // 刷新列表数据
  if (historyDialogVisible.value) {
    loadHistoryData() // 如果历史记录对话框打开，也刷新历史数据
  }
}

// 处理从消息打开练习详情事件
const handleOpenQuizDetailFromMessage = (data: any) => {
  const { topic, topicPracticeData, mode, targetQuizId, autoPlay = true } = data;

  if (quizDetailRef.value) {
    // 打开QuizDetail模态框
    quizDetailRef.value.openTopicPracticeWithData(topic, topicPracticeData, mode, autoPlay);

    // 如果指定了目标题目，还需要切换到对应的题目
    // 这部分可以通过QuizDetail组件内部的逻辑处理，或者通过额外的事件通知
    if (targetQuizId) {
      // 可以发送一个额外的事件来切换到指定题目
      setTimeout(() => {
        mittBus.emit('switchToQuizInModal', { quizId: targetQuizId });
      }, 100); // 延迟一点确保模态框已经打开
    }
  }
}

// 初始化
onMounted(() => {
  // 监听来自消息的打开事件
  mittBus.on('quiz.openWithResult', handleOpenWithResult)
  mittBus.on('openQuizDetailFromMessage', handleOpenQuizDetailFromMessage)

  // 监听新的mittBus事件
  mittBus.on('quiz.evaluationComplete', handleQuizEvaluationComplete)
  mittBus.on('overall.evaluationComplete', handleOverallEvaluationComplete)
  mittBus.on('quiz.refreshStatus', handleQuizRefreshStatus)

  // 初始化默认选中项
  if (partOptions.value.length > 0) {
    activePartId.value = partOptions.value[0].id + ""
    searchForm.part = partOptions.value[0].id + ""
  }

  // 分类默认选中全部
  activeCategoryId.value = ''

  handleSearch()
})

// 清理事件监听
onUnmounted(() => {
  mittBus.off('quiz.openWithResult', handleOpenWithResult)
  mittBus.off('openQuizDetailFromMessage', handleOpenQuizDetailFromMessage)
  mittBus.off('quiz.evaluationComplete', handleQuizEvaluationComplete)
  mittBus.off('overall.evaluationComplete', handleOverallEvaluationComplete)
  mittBus.off('quiz.refreshStatus', handleQuizRefreshStatus)
})
</script>

<style lang="scss" scoped>
// Minimalist Design System
$white: #ffffff;
$black: #18181b;
$gray-50: #fafafa;
$gray-100: #f4f4f5;
$gray-200: #e4e4e7;
$gray-400: #a1a1aa;
$gray-500: #71717a;
$gray-600: #52525b;
$gray-900: #18181b;

// Source标签 - 醒目的深色
$source-bg: #18181b;
$source-text: #ffffff;

// 主按钮色
$primary: #2563eb;
$primary-hover: #1d4ed8;

.quiz-cards {
  padding: 24px 32px;
  min-height: 100vh;
  background: $gray-50;

  // 筛选区域
  .search-section {
    margin-bottom: 20px;
    background: $white;
    padding: 20px 24px;
    border-radius: 12px;

    .tab-section {
      margin-bottom: 16px;

      :deep(.custom-tabs) {
        .el-tabs__header {
          margin: 0;
        }

        .el-tabs__nav-wrap::after {
          display: none;
        }

        .el-tabs__nav {
          border: none;
        }

        .el-tabs__active-bar {
          display: none;
        }

        .el-tabs__item {
          padding: 8px 0;
          margin-right: 32px;
          background: transparent;
          border: none;
          border-radius: 0;
          font-size: 15px;
          font-weight: 500;
          color: $gray-400;
          transition: color 0.2s;
          height: auto;
          line-height: 1.5;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: $black;
            transform: scaleX(0);
            transition: transform 0.2s;
          }

          &:hover {
            color: $gray-600;
          }

          &.is-active {
            color: $black;
            font-weight: 600;

            &::after {
              transform: scaleX(1);
            }
          }
        }
      }
    }

    .filter-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      .filter-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .category-tabs {
        :deep(.custom-tabs) {
          .el-tabs__header {
            margin: 0;
          }

          .el-tabs__nav-wrap::after {
            display: none;
          }

          .el-tabs__nav {
            border: none;
          }

          .el-tabs__active-bar {
            display: none;
          }

          .el-tabs__item {
            padding: 6px 14px;
            margin-right: 6px;
            background: $gray-100;
            border: none;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            color: $gray-500;
            transition: all 0.15s;
            height: auto;
            line-height: 1.5;

            &:hover {
              background: $gray-200;
              color: $gray-600;
            }

            &.is-active {
              background: $black;
              color: $white;
            }
          }
        }
      }

      .filter-divider {
        width: 1px;
        height: 20px;
        background: $gray-200;
        margin: 0 8px;
      }

      .filter-group {
        display: flex;
        gap: 6px;

        .filter-item {
          padding: 6px 14px;
          background: $gray-100;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: $gray-500;
          cursor: pointer;
          transition: all 0.15s;

          &:hover {
            background: $gray-200;
            color: $gray-600;
          }

          &.is-active {
            background: $black;
            color: $white;
          }
        }
      }

      .search-input {
        flex-shrink: 0;

        :deep(.el-input) {
          width: 200px;

          .el-input__wrapper {
            border-radius: 6px;
            padding: 0 12px;
            background: $gray-100;
            border: none;
            box-shadow: none;

            &:hover, &.is-focus {
              background: $gray-200;
            }

            .el-input__inner {
              font-size: 13px;
              color: $gray-900;

              &::placeholder {
                color: $gray-400;
              }
            }

            .el-input__prefix {
              color: $gray-400;
            }
          }
        }
      }
    }
  }

  // 操作工具栏
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: $white;
    padding: 14px 20px;
    border-radius: 10px;
    margin-bottom: 16px;

    .selected-info {
      font-size: 14px;
      color: $gray-500;
      display: flex;
      align-items: center;
      gap: 8px;

      .selected-label {
        color: $gray-400;
      }

      .selected-topic {
        color: $gray-900;
        font-weight: 500;
        max-width: 400px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .no-selected {
        color: $gray-400;
      }
    }

    .action-buttons {
      display: flex;
      gap: 8px;

      .action-btn {
        border-radius: 6px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        border: 1px solid $gray-200;
        background: $white;
        color: $gray-600;
        transition: all 0.15s;

        &:hover:not(:disabled) {
          border-color: $gray-900;
          color: $gray-900;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        &.primary {
          background: $black;
          border-color: $black;
          color: $white;

          &:hover:not(:disabled) {
            background: $gray-900;
            color: #d4d4d8 !important;
          }

          &:disabled {
            background: $gray-200;
            border-color: $gray-200;
            color: $gray-400;
            opacity: 1;
          }
        }
      }
    }
  }

  // 卡片容器
  .quiz-cards-container {
    flex: 1;
  }

  .cards-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  // 话题卡片 - 网格风格
  .topic-card {
    background: $white;
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s;
    border: 2px solid transparent;
    display: flex;
    flex-direction: column;
    min-height: 160px;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    &.is-selected {
      border-color: $black;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .topic-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        :deep(.el-tag) {
          border-radius: 4px;
          font-size: 11px;
          padding: 2px 6px;
          font-weight: 500;
          border: none;
          height: auto;
          line-height: 1.4;
          background: $gray-100;
          color: $gray-600;
        }
      }

      .practice-badge {
        font-size: 11px;
        font-weight: 500;
        flex-shrink: 0;
        padding: 3px 8px;
        border-radius: 10px;

        &.practiced {
          background: #dcfce7;
          color: #16a34a;
        }

        &.not-practiced {
          background: $gray-100;
          color: $gray-400;
        }
      }
    }

    .topic-title {
      font-size: 15px;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 6px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .topic-question {
      font-size: 13px;
      line-height: 1.5;
      color: $gray-500;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }

    .card-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;

      .source-tag {
        background: $source-bg;
        color: $source-text;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        padding: 3px 8px;
        font-weight: 500;
      }
    }
  }

  .loading-text {
    grid-column: 1 / -1;
    text-align: center;
    padding: 32px;
    color: $gray-400;
    font-size: 14px;
  }
}

// 响应式
@media (max-width: 1200px) {
  .quiz-cards {
    .cards-wrapper {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 768px) {
  .quiz-cards {
    padding: 16px;

    .search-section {
      padding: 16px;

      .filter-row {
        flex-direction: column;
        align-items: stretch;

        .filter-left {
          .filter-divider {
            display: none;
          }
        }

        .search-input {
          width: 100%;
          margin-top: 8px;

          :deep(.el-input) {
            width: 100%;
          }
        }
      }
    }

    .action-bar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .selected-info {
        justify-content: center;
      }

      .action-buttons {
        justify-content: center;
      }
    }

    .cards-wrapper {
      grid-template-columns: 1fr;
    }
  }
}

</style>

<style lang="scss">
// 历史记录弹窗样式
.history-dialog {
  .el-dialog {
    border-radius: 12px;
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 20px 24px 16px;
    margin: 0;
    border-bottom: 1px solid #f4f4f5;
  }

  .el-dialog__body {
    padding: 0;
  }

  .history-dialog-header {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: #18181b;
    }

    .header-topic {
      font-size: 13px;
      color: #71717a;
      max-width: 380px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .history-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 24px;
    border-bottom: 1px solid #f4f4f5;
    transition: background 0.15s;

    &:hover {
      background: #fafafa;
    }

    &:last-child {
      border-bottom: none;
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .item-id {
        font-size: 13px;
        color: #a1a1aa;
        font-weight: 500;
      }

      .item-status {
        font-size: 12px;
        font-weight: 500;
        padding: 3px 10px;
        border-radius: 10px;

        &.success {
          background: #dcfce7;
          color: #16a34a;
        }

        &.info {
          background: #e0f2fe;
          color: #0284c7;
        }

        &.danger {
          background: #fee2e2;
          color: #dc2626;
        }
      }
    }

    .item-right {
      .item-btn {
        font-size: 13px;
        font-weight: 500;
        padding: 6px 14px;
        border-radius: 6px;
        border: 1px solid #e4e4e7;
        background: #fff;
        color: #52525b;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          border-color: #18181b;
          color: #18181b;
        }

        &.primary {
          background: #18181b;
          border-color: #18181b;
          color: #fff;

          &:hover {
            background: #27272a;
          }
        }

        &.warning {
          background: #fef3c7;
          border-color: #fef3c7;
          color: #d97706;

          &:hover {
            background: #fde68a;
          }
        }
      }
    }
  }

  .empty-state {
    padding: 48px 24px;
    text-align: center;
    color: #a1a1aa;
    font-size: 14px;
  }

  .history-pagination {
    padding: 16px 24px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #f4f4f5;
  }
}
</style>
