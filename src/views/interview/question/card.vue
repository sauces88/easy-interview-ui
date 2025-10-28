<template>
  <div class="question-cards">
    <!-- Search Section -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item v-for="(item, index) in searchColumns" :key="index" :class="{ 'search-input': item.el === 'input' }">
          <el-input
            v-if="item.el === 'input'"
            v-model="searchForm[item.prop]"
            :placeholder="item.placeholder"
            class="content-search"
            @keyup="(e: KeyboardEvent) => item.onKeyup?.(e)"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-else-if="item.el === 'select'"
            v-model="searchForm[item.prop]"
            :placeholder="item.label"
            popper-class="select-dropdown"
            :suffix-icon="ArrowDown"
            class="button-select"
            clearable
            @change="() => item.onChange?.()"
          >
            <template #prefix>
              <template v-if="searchForm[item.prop]">
                <span class="select-value">{{ getSelectedLabel(item, searchForm[item.prop]) }}</span>
              </template>
              <template v-else>
                <span class="select-label">{{ item.label }}</span>
              </template>
            </template>
            <el-option
              v-for="option in (item.options?.value || [])"
              :key="option[item.valueKey || 'id']"
              :label="item.labelKey?.(option) || ''"
              :value="option[item.valueKey || 'id']"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- Cards Container -->
    <div class="question-cards-container">
      <div class="cards-wrapper"
           v-infinite-scroll="loadMore"
           :infinite-scroll-disabled="loading || noMore"
           :infinite-scroll-distance="100"
           :infinite-scroll-immediate="false"
           :infinite-scroll-delay="500">
        <div v-for="item in questionList" :key="item.id" class="question-card">
          <div class="card-header">
            <div class="company-info">
              <img :src="item.logo" class="company-logo" />
              <div class="info-text">
                <span class="company-name">{{ getLocalizedText(item.questionCompanyName, item.questionCompanyNameUs) }}</span>
                <span class="question-type">{{ getLocalizedText(item.questionRoleName, item.questionRoleNameUs) }}</span>
              </div>
            </div>
          </div>

          <div class="card-content">
            <div class="question-text">{{ getLocalizedText(item.content, item.contentUs) }}</div>
          </div>

          <div class="card-tags">
            <el-tag v-for="(tag, idx) in getLocalizedTags(item)" :key="idx" size="small">{{ tag }}</el-tag>
            <el-tag type="warning" size="small">{{ item.level }}</el-tag>
          </div>

        </div>
      </div>
    </div>

    <!-- Loading & No More -->
    <div class="load-more" v-if="loading">{{ t('common.loading') }}</div>
    <div class="no-more" v-if="noMore && questionList.length > 0">{{ t('common.noMore') }}</div>
    <div class="no-data" v-if="!loading && questionList.length === 0">{{ t('common.noMore') }}</div>

    <QuestionForm ref="questionRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, type Ref, watch, computed, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/modules/app'
import {
  createQuestionApi,
  removeQuestionApi,
  updateQuestionApi,
  getQuestionListApi,
  getQuestionDetailApi,
  importQuestionExcelApi,
  exportQuestionExcelApi,
} from '@/api/modules/interview/question'
import { getQuestionCompanyListApi } from '@/api/modules/interview/questionCompany'
import { getQuestionRoleListApi } from '@/api/modules/interview/questionRole'
import { useHandleData } from '@/hooks/useHandleData'
import QuestionForm from '@/views/interview/question/components/QuestionForm.vue'
import type { SearchProps } from '@/components/ProTable/interface'
import type { IQuestion } from '@/api/interface/interview/question'
import type { IQuestionCompany } from '@/api/interface/interview/questionCompany'
import type { IQuestionRole } from '@/api/interface/interview/questionRole'
import ImportExcel from '@/components/ImportExcel/index.vue'
import { downloadTemplate } from '@/api/modules/system/common'
import { useDownload } from "@/hooks/useDownload"
import { ArrowDown, Search } from '@element-plus/icons-vue'

const { t } = useI18n()
const appStore = useAppStore()

type Language = 'zh-CN' | 'en-US'

interface QuestionItem extends IQuestion.Row {
  likeCount?: number;
}

interface SearchColumn {
  prop: string
  label: string
  el: 'input' | 'select'
  placeholder?: string
  options?: Ref<any[]>
  valueKey?: string
  labelKey?: (item: any) => string
  onKeyup?: (e: KeyboardEvent) => void
  onChange?: () => void
}

defineOptions({
  name: 'QuestionView'
})

// 计算当前内容字段
const contentField = computed(() => appStore.language === 'zh-CN' ? 'content' : 'contentUs')

// 获取公司标签
const getCompanyLabel = (id: number) => {
  const company = companyOptions.value.find(item => item.id === id)
  return company ? getLocalizedText(company.name, company.nameUs) : ''
}

// 获取角色标签
const getRoleLabel = (id: number) => {
  const role = roleOptions.value.find(item => item.id === id)
  return role ? getLocalizedText(role.name, role.nameUs) : ''
}

// 获取本地化文本
const getLocalizedText = (zhText: string | undefined | null, enText: string | undefined | null): string => {
  if (!zhText && !enText) return ''
  return appStore.language === 'zh-CN' ? (zhText || '') : (enText || zhText || '')
}

// 获取本地化标签
const getLocalizedTags = (item: QuestionItem): string[] => {
  const tagsString = appStore.language === 'zh-CN' ? item.tags : (item.tagsUs || item.tags)
  if (!tagsString) return []
  // 按逗号分割标签
  return tagsString.split(',').map(tag => tag.trim()).filter(Boolean)
}

// 获取选中值
const getSelectedLabel = (item: SearchColumn, value: any) => {
  if (!value || !item.options?.value) return ''
  const option = item.options.value.find(opt => opt[item.valueKey || 'id'] === value)
  return option ? item.labelKey?.(option) || '' : ''
}

const translatedLabels = computed(() => ({
  company: t('interview.question.company'),
  role: t('interview.question.role'),
  content: t('interview.question.content'),
  pleaseInput: t('interview.question.pleaseInput')
}))

const searchColumns = computed<SearchColumn[]>(() => {
  return [
    {
      prop: 'companyId',
      label: t('interview.question.company'),
      el: 'select' as const,
      options: companyOptions,
      labelKey: (item: IQuestionCompany.Row) => {
        if (!item?.id) return ''
        return getLocalizedText(item.name, item.nameUs)
      },
      valueKey: 'id',
      onChange: () => handleSearch()
    },
    {
      prop: 'roleId',
      label: t('interview.question.role'),
      el: 'select' as const,
      options: roleOptions,
      labelKey: (item: IQuestionRole.Row) => {
        if (!item?.id) return ''
        return getLocalizedText(item.name, item.nameUs)
      },
      valueKey: 'id',
      onChange: () => handleSearch()
    },
    {
      prop: appStore.language === 'zh-CN' ? 'content' : 'contentUs',
      label: t('interview.question.content'),
      el: 'input' as const,
      placeholder: t('interview.question.pleaseInput'),
      onKeyup: (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          handleSearch()
        }
      }
    }
  ]
})

// 数据相关
const questionList = ref<QuestionItem[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const noMore = ref(false)

// 搜索相关
const searchForm = reactive<{
  companyId?: number
  roleId?: number
  content?: string
  contentUs?: string
  [key: string]: any
}>({})
const companyOptions = ref<IQuestionCompany.Row[]>([])
const roleOptions = ref<IQuestionRole.Row[]>([])

// 监听 localStorage 变化
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === 'language') {
    const newLanguage = (e.newValue || 'zh-CN') as Language
    appStore.changeLanguage(newLanguage)
    handleSearch()
  }
}

// 监听语言变化，更新搜索字段和重新搜索
watch(() => appStore.language, (newLanguage) => {
  if (!newLanguage) {
    // 如果语言为空，设置默认语言
    appStore.changeLanguage('zh-CN')
    return
  }
  nextTick(() => {
    handleSearch()
  })
}, { immediate: true })

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

  // 使用传入的 pageNum 和 pageSize
  newParams.page = params.page || 1
  newParams.limit = params.limit || 10

  return newParams
}

// 获取数据
const getTableList = async () => {
  if (loading.value || noMore.value) return
  loading.value = true
  try {
    const params = {
      ...searchForm,
      page: pageNum.value,
      limit: pageSize.value
    }

    const res = await getQuestionListApi(formatParams(params))

    let list: QuestionItem[] = []

    if (res.data) {
      if (Array.isArray(res.data.rows)) {
        list = res.data.rows
      } else if (Array.isArray(res.data)) {
        list = res.data as QuestionItem[]
      }
    }

    if (pageNum.value === 1) {
      questionList.value = list
    } else {
      questionList.value.push(...list)
    }

    let totalCount = 0
    if (res.data && typeof res.data.total === 'number') {
      totalCount = res.data.total
    }

    total.value = totalCount
    noMore.value = questionList.value.length >= total.value || list.length === 0
  } catch (error) {
    console.error('获取问题列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  noMore.value = false
  questionList.value = []
  getTableList()
}

// 加载更多
const loadMore = () => {
  if (!loading.value && !noMore.value) {
    pageNum.value++
    getTableList()
  }
}

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

// 获取公司Logo
const getCompanyLogo = (companyId: number | undefined) => {
  if (!companyId) return '/default-company-logo.png'
  return `/company-logos/${companyId}.png`
}

// 获取公司名称
const getCompanyName = (companyId: number | undefined) => {
  if (!companyId) return 'Unknown Company'
  return `Company ${companyId}` // 这里需要根据实际情况获取公司名称
}

// 处理点赞
const handleLike = (item: QuestionItem) => {
  if (!item.likeCount) item.likeCount = 0
  item.likeCount++
}

// 处理保存
const handleSave = (item: QuestionItem) => {
  // 实现保存到练习的逻辑
  console.log('Save to practice:', item)
}

// 处理AI问答
const handleAskAI = (item: QuestionItem) => {
  // 实现AI问答的逻辑
  console.log('Ask AI about:', item)
}

// 打开 drawer(新增、查看、编辑)
const questionRef = ref<InstanceType<typeof QuestionForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getQuestionDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createQuestionApi : updateQuestionApi,
    getTableList
  }
  questionRef.value?.acceptParams(params)
}

// 删除信息
const deleteInfo = async (params: QuestionItem) => {
  const id = params.id
  if (!id) return

  await useHandleData(
      removeQuestionApi,
      { ids: [id] },
      t('interview.question.delete')
  )
  handleSearch()
}

// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  if (!ids.length) return

  await useHandleData(removeQuestionApi, { ids }, t('interview.question.batchDelete'))
  questionList.value = questionList.value.filter(item => item.id && !ids.includes(item.id))
}

// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: t('interview.question.title'),
    templateName: t('interview.question.template'),
    tempApi: downloadTemplate,
    importApi: importQuestionExcelApi,
    getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}

// 导出
const downloadFile = async () => {
  const params = formatParams({
    ...searchForm,
    pageNum: 1,
    pageSize: 999
  })
  useDownload(exportQuestionExcelApi, t('interview.question.title'), params)
}

// 获取公司列表
const getCompanyList = async () => {
  try {
    const res = await getQuestionCompanyListApi({ page: 1, limit: 999 })
    if (res.data?.rows) {
      companyOptions.value = res.data.rows
    }
  } catch (error) {
    console.error('获取公司列表失败:', error)
  }
}

// 获取角色列表
const getRoleList = async () => {
  try {
    const res = await getQuestionRoleListApi({ page: 1, limit: 999 })
    if (res.data?.rows) {
      roleOptions.value = res.data.rows
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
  }
}

// 初始化
onMounted(() => {
  // 添加 storage 事件监听
  window.addEventListener('storage', handleStorageChange)

  // 确保有默认语言
  if (!appStore.language) {
    appStore.changeLanguage('zh-CN')
  }

  getCompanyList()
  getRoleList()
  handleSearch()
})

onUnmounted(() => {
  // 移除 storage 事件监听
  window.removeEventListener('storage', handleStorageChange)
})
</script>

<style lang="scss" scoped>
.question-cards {
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

    .search-form {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
      margin-right: 0;

      &.search-input {
        margin-left: auto;
        flex: 1;
        max-width: 300px;
      }
    }

    :deep(.button-select) {
      .el-input {
        .el-input__wrapper {
          background-color: var(--el-fill-color-blank);
          box-shadow: none;
          border-radius: 20px;
          padding: 6px 16px;
          transition: all 0.3s;
          border: 1px solid var(--el-border-color-light);
          display: flex;
          align-items: center;
          min-width: 140px;

          &:hover {
            background-color: var(--el-fill-color-light);
            border-color: var(--el-border-color);
          }

          .el-input__inner {
            color: var(--el-text-color-regular);
            font-size: 14px;
            margin-left: 8px;
            padding-left: 4px;

            &::placeholder {
              color: var(--el-text-color-placeholder);
            }
          }

          .el-select__caret {
            color: var(--el-text-color-regular);
            font-size: 12px;
            margin-left: 4px;
          }

          .select-label {
            color: var(--el-text-color-primary);
            font-size: 14px;
            font-weight: 500;
          }

          .select-value {
            color: var(--el-text-color-primary);
            font-size: 14px;
            font-weight: 500;
          }

          // 隐藏原生的 input 显示
          .el-input__inner {
            opacity: 0;
            width: 0;
            margin: 0;
            padding: 0;
          }
        }
      }
    }

    :deep(.button-select .el-input__wrapper.is-focus) {
      box-shadow: none !important;
      background-color: var(--el-fill-color-light);
      border-color: var(--el-border-color);
    }

    :deep(.content-search) {
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

  .question-cards-container {
    flex: 1;
    position: relative;
  }

  .cards-wrapper {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0 0 40px;
  }

  .question-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 20px;
    color: #333;
    transition: all 0.2s ease;
    border: 1px solid #ebeef5;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      margin-bottom: 16px;

      .company-info {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .company-logo {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f5f7fa;
          border: 1px solid #ebeef5;
        }

        .info-text {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .company-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }

          .question-type {
            font-size: 13px;
            color: #666;
          }
        }
      }
    }

    .card-content {
      margin-bottom: 16px;

      .question-text {
        font-size: 15px;
        line-height: 1.6;
        color: #333;
      }
    }

    .card-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .el-tag {
        border-radius: 4px;
      }
    }
  }

  .load-more,
  .no-more,
  .no-data {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
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
