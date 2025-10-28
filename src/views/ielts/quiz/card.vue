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

      <!-- 分类选择标签和搜索框 -->
      <div class="tab-section-with-search">
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

        <!-- 搜索输入框 -->
        <div class="search-input-wrapper">
          <el-input
            v-model="searchForm.text"
            :placeholder="t('ielts.quiz.searchPlaceholder')"
            class="content-search"
            @keyup="handleKeywordSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
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
        >
          <div class="topic-content">
            <div class="topic-left">
              <div class="topic-title">
                {{ topicItem.topic }}
              </div>
              <div
                class="topic-question"
                v-if="topicItem.questions[0]?.text"
              >
                {{ topicItem.questions[0].text }}
              </div>
              <div class="topic-tags">
                <el-tag
                  v-if="topicItem.questions[0]?.part"
                  size="small"
                  type="primary"
                >
                  {{ getPartName(topicItem.questions[0].part) }}
                </el-tag>
                <el-tag
                  v-if="topicItem.questions[0]?.category"
                  size="small"
                  type="success"
                >
                  {{ getCategoryName(topicItem.questions[0].category) }}
                </el-tag>
                <el-tag
                  v-if="topicItem.questions[0]?.type"
                  size="small"
                  type="warning"
                >
                  {{ getTypeName(topicItem.questions[0].type) }}
                </el-tag>
                <el-tag
                  v-for="(tag, idx) in getTagList(topicItem.questions[0]?.tags)"
                  :key="idx"
                  size="small"
                  type="danger"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>

            <div class="topic-right">
              <div class="topic-actions">
                <el-button
                  type="success"
                  size="small"
                  text
                  :icon="Microphone"
                  @click="handleStartTopic(topicItem)"
                  v-auth="'topic.practice.create'"
                  class="practice-btn"
                >
                  {{ t('ielts.quiz.startPractice') }}
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  text
                  :icon="View"
                  @click="handleViewTopicHistory(topicItem)"
                  v-auth="'topic.practice.query_table'"
                  class="history-btn"
                >
                  {{ t('ielts.quiz.viewHistory') }}
                </el-button>
              </div>
              <div
                v-if="topicItem.questions[0]?.source"
                class="source-info"
              >
                {{ t('ielts.quiz.source') }}：{{ topicItem.questions[0].source }}
              </div>
            </div>
          </div>
        </div>

        <!-- Loading & No More -->
        <div
          style="text-align: center; padding: 20px; color: #999; font-size: 14px;"
          v-if="loading"
        >
          {{ t('ielts.quiz.loading') }}
        </div>
        <div
          style="text-align: center; padding: 20px; color: #999; font-size: 14px;"
          v-if="noMore && topicList.length > 0"
        >
          {{ t('ielts.quiz.noMoreData') }}
        </div>
        <div
          style="text-align: center; padding: 20px; color: #999; font-size: 14px;"
          v-if="!loading && topicList.length === 0"
        >
          {{ t('ielts.quiz.noMoreData') }}
        </div>
      </div>
    </div>

    <QuizDetail ref="quizDetailRef" />

    <el-dialog
      v-model="historyDialogVisible"
      width="500px"
      destroy-on-close
    >
      <!-- 表格区域 -->
      <div style="margin-bottom: 16px;">
        <el-table
          :data="practiceHistoryList"
          style="width: 100%"
          v-loading="historyLoading"
        >
          <el-table-column
            prop="id"
            :label="t('ielts.quiz.id')"
            align="center"
          />
          <el-table-column
            :label="t('ielts.quiz.status')"
            align="center"
          >
            <template #default="scope">
              <el-tag
                :type="(getTopicPracticeStatus(scope.row).type as any)"
                size="small"
              >
                {{ getTopicPracticeStatus(scope.row).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="t('ielts.quiz.operation')"
            width="150"
            align="center"
            fixed="right"
          >
            <template #default="scope">
              <el-button
                v-if="getTopicPracticeStatus(scope.row).type === 'success'"
                type="primary"
                size="small"
                text
                @click="handleViewTopicDetail(scope.row)"
              >
                {{ t('ielts.quiz.viewDetails') }}
              </el-button>
              <el-button
                v-else-if="getTopicPracticeStatus(scope.row).type === 'info'"
                type="primary"
                size="small"
                text
                @click="handleContinueTopicPractice(scope.row)"
              >
                {{ t('ielts.quiz.continuePractice') }}
              </el-button>
              <el-button
                v-else
                type="warning"
                size="small"
                text
                @click="handleRetryTopicPractice(scope.row)"
              >
                {{ t('ielts.quiz.retryPractice') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div
        style="display: flex; justify-content: right; margin-top: 16px; padding-right: 30px;"
        v-if="historyTotal > 0"
      >
        <el-pagination
          v-model:current-page="historyPageNum"
          v-model:page-size="historyPageSize"
          :total="historyTotal"
          layout="prev, pager, next"
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
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const noMore = ref(false)

// 搜索相关
const searchForm = reactive<{
  category?: string
  part?: string
  text?: string
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
const handleStartTopic = (topicItem: TopicItem) => {
  // 直接开始整个topic的练习，不再显示选择题目的对话框
  quizDetailRef.value?.openTopicPractice(topicItem.topic)
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
.quiz-cards {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .search-section {
    flex-shrink: 0;
    margin-bottom: 20px;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    .tab-section {
      margin-bottom: 12px;
      display: flex;
      align-items: center;

      :deep(.custom-tabs) {
        .el-tabs__header {
          margin: 0;
        }

        .el-tabs__nav-wrap {
          &::after {
            display: none;
          }
        }

        .el-tabs__nav {
          border: none;
        }

        .el-tabs__item {
          padding: 8px 16px;
          margin-right: 8px;
          border-radius: 16px;
          background: var(--el-fill-color-light);
          border: none;
          font-size: 13px;
          transition: all 0.3s;

          &:hover {
            background: var(--el-color-primary-light-8);
            color: var(--el-color-primary);
          }

          &.is-active {
            background: var(--el-color-primary);
            color: #fff;
          }
        }
      }
    }

    .tab-section-with-search {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;

      .category-tabs {
        flex: 1;
        margin-right: 20px;

        :deep(.custom-tabs) {
          .el-tabs__header {
            margin: 0;
          }

          .el-tabs__nav-wrap {
            &::after {
              display: none;
            }
          }

          .el-tabs__nav {
            border: none;
          }

          .el-tabs__item {
            padding: 8px 16px;
            margin-right: 8px;
            border-radius: 16px;
            background: var(--el-fill-color-light);
            border: none;
            font-size: 13px;
            transition: all 0.3s;

            &:hover {
              background: var(--el-color-primary-light-8);
              color: var(--el-color-primary);
            }

            &.is-active {
              background: var(--el-color-primary);
              color: #fff;
            }
          }
        }
      }

      .search-input-wrapper {
        flex-shrink: 0;

        :deep(.content-search) {
          width: 300px;
          .el-input__wrapper {
            border-radius: 20px;
            padding: 0 16px;
            background-color: var(--el-fill-color-blank);
            border: 1px solid var(--el-border-color-light);
            box-shadow: none;

            &:hover, &.is-focus {
              border-color: var(--el-border-color);
              background-color: var(--el-fill-color-light);
            }

            .el-input__inner {
              color: var(--el-text-color-regular);
              &::placeholder {
                color: var(--el-text-color-placeholder);
              }
            }
          }
        }
      }
    }
  }

  .topic-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    color: #333;
    transition: all 0.3s ease;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    margin-bottom: 16px;

    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .topic-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;

    }

    .topic-left {
      flex: 1;
      min-width: 0;

      .topic-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
        line-height: 1.4;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .topic-question {
        font-size: 15px;
        line-height: 1.6;
        color: #666;
        margin-bottom: 16px;
        word-wrap: break-word;
        overflow-wrap: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .topic-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .topic-right {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;

      .topic-actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;

        .practice-btn {
          border-radius: 20px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .history-btn {
          font-size: 12px;
          color: #909399;
          padding: 2px 8px;

          &:hover {
            color: #409eff;
          }
        }

        .topic-count {
          font-size: 12px;
          color: #909399;
          background: var(--el-fill-color-light);
          padding: 4px 8px;
          border-radius: 8px;
          text-align: center;
        }
      }

      .source-info {
        margin-top: 20px;
        font-size: 12px;
        color: #999;
        text-align: right;
      }
    }

    .topic-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;

      .el-tag {
        border-radius: 14px;
        font-size: 12px;
        padding: 4px 10px;
        font-weight: 500;
        border: none;
      }
    }

  }

  .quiz-cards-container {
    flex: 1;
    position: relative;
  }

  .cards-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0 0 40px;
  }

  // 历史记录模态框样式
  .history-search {
    margin-bottom: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .empty-history {
    text-align: center;
    padding: 40px 0;
  }
}
</style>

<style lang="scss">
.select-dropdown {
  border-radius: 8px;
  padding: 4px;

  .el-select-dropdown__item {
    border-radius: 4px;
    padding: 8px 12px;

    &:hover, &.selected {
      background-color: var(--el-fill-color-light);
      color: var(--el-text-color-primary);
    }

    &.selected {
      font-weight: 500;
    }
  }
}
</style>
