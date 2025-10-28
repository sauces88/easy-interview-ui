<template>
  <el-dialog
    v-model="visible"
    :title="`${projectName} - 问题列表`"
    width="90%"
    :destroy-on-close="true"
    draggable
  >
    <ProTable
      ref="proTableRef"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      :init-param="initParam"
      :search-col="{ xs: 2, sm: 3, md: 3, lg: 4, xl: 4 }"
      row-key="id"
    >
      <template #tableHeader="scope">
        <el-button
          type="primary"
          :icon="CirclePlus"
          @click="openAddEdit('新增问题')"
        >
          新增
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
      </template>
      <template #type="{ row }">
        <el-tag
          v-if="row.type"
          type="primary"
        >
          {{ row.type }}
        </el-tag>
        <span
          v-else
          style="color: #ccc;"
        >未设置</span>
      </template>
      <template #operation="{ row }">
        <el-button
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑问题', row, false)"
        >
          编辑
        </el-button>
        <el-button
          type="danger"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ResearchQuestionForm
      ref="researchQuestionRef"
      @success="proTableRef?.getTableList()"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CirclePlus, Delete, EditPen } from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createResearchQuestionApi,
  removeResearchQuestionApi,
  updateResearchQuestionApi,
  getResearchQuestionListApi,
  getResearchQuestionDetailApi,
} from '@/api/modules/research/researchQuestion'
import { useHandleData } from '@/hooks/useHandleData'
import ResearchQuestionForm from '@/views/research/researchQuestion/components/ResearchQuestionForm.vue'
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface'
import type { IResearchQuestion } from '@/api/interface/research/researchQuestion'

defineOptions({
  name: 'QuestionListDialog'
})

const visible = ref(false)
const projectId = ref<number | string>()
const projectName = ref('')
const initParam = ref({})

const proTableRef = ref<ProTableInstance>()

// 表格配置项
const columns: ColumnProps<IResearchQuestion.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'content', label: '题目内容' },
  { prop: 'tips', label: '引导（提示）' },
  { prop: 'target', label: '考察方向', width: 150 },
  { prop: 'type', label: '题目类型', width: 200 },
  { prop: 'operation', label: '操作', width: 200, fixed: 'right' }
]

// 题目类型选项（从表格数据中提取并去重）
const typeOptions = ref<Array<{ label: string; value: string }>>([])

// 搜索条件项
const searchColumns = computed<SearchProps[]>(() => {
  const columns: SearchProps[] = [
    { prop: 'content', label: '题目内容',el: 'input', props: { placeholder: '请输入题目内容' } },
  ]

  // 只有当有题目类型选项时才显示题目类型搜索框
  if (typeOptions.value.length > 0) {
    columns.unshift({
      prop: 'type',
      label: '题目类型',
      el: 'select',
      props: { placeholder: '请选择题目类型', style: { width: '150px' } },
      enum: typeOptions.value,
      fieldNames: { label: 'label', value: 'value' }
    })
  }

  return columns
})

// 获取table列表
const getTableList = async (params: IResearchQuestion.Query) => {
  let newParams = { ...params, projectId: projectId.value }
  const result = await getResearchQuestionListApi(newParams as any)

  // 提取题目类型并去重
  if (result?.data?.rows && Array.isArray(result.data.rows)) {
    const types = result.data.rows
      .map((item: any) => item.type)
      .filter((type: string) => type && type.trim())

    const uniqueTypes = [...new Set(types)]
    typeOptions.value = uniqueTypes.map(type => ({
      label: type,
      value: type
    }))
  } else {
    typeOptions.value = []
  }

  return result
}

// 打开模态框
const acceptParams = (params: { projectId: number | string; projectName: string }) => {
  projectId.value = params.projectId
  projectName.value = params.projectName
  initParam.value = { projectId: params.projectId }
  visible.value = true
  typeOptions.value = [] // 重置选项
}

// 打开新增/编辑弹窗
const researchQuestionRef = ref<InstanceType<typeof ResearchQuestionForm>>()
const openAddEdit = async (title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getResearchQuestionDetailApi({ id: row?.id })
    row = record?.data
  } else {
    row.projectId = projectId.value
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createResearchQuestionApi : updateResearchQuestionApi,
    getTableList: proTableRef.value?.getTableList
  }
  researchQuestionRef.value?.acceptParams(params)
}

// 删除信息
const deleteInfo = async (params: IResearchQuestion.Row) => {
  await useHandleData(
    removeResearchQuestionApi,
    { ids: [params.id] },
    `删除【${params.content}】问题`
  )
  proTableRef.value?.getTableList()
}

// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeResearchQuestionApi, { ids }, '删除所选问题')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="scss">
:deep(.el-dialog__body) {
  padding: 20px;
}
</style>
