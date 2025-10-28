<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="申研面试题目表（私有化题库）"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'research.question.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增申研面试题目表（私有化题库）')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'research.question.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'research.question.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'research.question.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          导出
        </el-button>
      </template>
      <template #operation="{ row }">
        <el-button
          v-auth="'research.question.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑申研面试题目表（私有化题库）', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'research.question.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ResearchQuestionForm ref="researchQuestionRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  CirclePlus,
  Delete,
  EditPen,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createResearchQuestionApi,
  removeResearchQuestionApi,
  updateResearchQuestionApi,
  getResearchQuestionListApi,
  getResearchQuestionDetailApi,
  importResearchQuestionExcelApi,
  exportResearchQuestionExcelApi,
} from '@/api/modules/research/researchQuestion';
import { useHandleData } from '@/hooks/useHandleData';
import ResearchQuestionForm from '@/views/research/researchQuestion/components/ResearchQuestionForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IResearchQuestion } from '@/api/interface/research/researchQuestion';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'ResearchQuestionView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IResearchQuestion.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'projectId', label: '关联所属项目ID' },
  { prop: 'type', label: '题目类型' },
  { prop: 'content', label: '题目内容' },
  { prop: 'tips', label: '引导（提示）' },
  { prop: 'target', label: '考察方向' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'projectId', label: '关联所属项目ID', el: 'input' },
  { prop: 'type', label: '题目类型', el: 'select' },
  { prop: 'content', label: '题目内容', el: 'input' },
]
// 获取table列表
const getTableList = (params: IResearchQuestion.Query) => {
  let newParams = formatParams(params);
  return getResearchQuestionListApi(newParams);
};
const formatParams = (params: IResearchQuestion.Query) =>{
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.createTime && (newParams.createTimeStart = newParams.createTime[0]);
  newParams.createTime && (newParams.createTimeEnd = newParams.createTime[1]);
  delete newParams.createTime;
  newParams.updateTime && (newParams.updateTimeStart = newParams.updateTime[0]);
  newParams.updateTime && (newParams.updateTimeEnd = newParams.updateTime[1]);
  delete newParams.updateTime;
  return newParams;
}
// 打开 drawer(新增、查看、编辑)
const researchQuestionRef = ref<InstanceType<typeof ResearchQuestionForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getResearchQuestionDetailApi({ id: row?.id })
    row = record?.data
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
    `删除【${params.id}】申研面试题目表（私有化题库）`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeResearchQuestionApi, { ids }, '删除所选申研面试题目表（私有化题库）')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '申研面试题目表（私有化题库）',
    templateName: '申研面试题目表（私有化题库）',
    tempApi: downloadTemplate,
    importApi: importResearchQuestionExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IResearchQuestion.Query);
  useDownload(exportResearchQuestionExcelApi, "申研面试题目表（私有化题库）", newParams);
};
</script>