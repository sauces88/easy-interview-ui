<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="申研项目"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      :search-col="{ xs: 2, sm: 3, md: 3, lg: 4, xl: 4 }"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          type="primary"
          v-auth="'research.proj.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增项目')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'research.proj.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'research.proj.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'research.proj.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          导出
        </el-button>
      </template>
      <template #configStatus="{ row }">
        <el-tag :type="row.configStatus === 1 ? 'success' : 'danger'">
          {{ row.configStatus === 1 ? '已配置' : '未配置' }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button
          v-auth="'research.proj.update'"
          type="info"
          link
          :icon="List"
          @click="openQuestionList(row)"
        >
          问题列表
        </el-button>
        <el-button
          v-auth="'research.proj.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑申研项目', row, false)"
        >
          编辑&配置
        </el-button>
        <el-button
          v-auth="'research.proj.remove'"
          type="danger"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ResearchProjForm ref="researchProjRef" />
    <QuestionListDialog ref="questionListDialogRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  List,
  CirclePlus,
  Delete,
  EditPen,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createResearchProjApi,
  removeResearchProjApi,
  updateResearchProjApi,
  getResearchProjListApi,
  getResearchProjDetailApi,
  importResearchProjExcelApi,
  exportResearchProjExcelApi,
} from '@/api/modules/research/researchProj';
import { useHandleData } from '@/hooks/useHandleData';
import ResearchProjForm from '@/views/research/researchProj/components/ResearchProjForm.vue';
import QuestionListDialog from '@/views/research/researchProj/components/QuestionListDialog.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IResearchProj } from '@/api/interface/research/researchProj';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'ResearchProjView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IResearchProj.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'name', label: '项目名称' },
  { prop: 'academy', label: '所属院校' },
  { prop: 'credit', label: '所需积分', width: 100 },
  { prop: 'configStatus', label: '题目配置状态', width: 150 },
  { prop: 'count', label: '题目数量',  width: 100 },
  { prop: 'operation', label: '操作', width: 300, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'name', label: '项目名称', el: 'input' },
  { prop: 'academy', label: '所属院校', el: 'input' },
  {
    prop: 'configStatus',
    label: '题目配置状态',
    el: 'select',
    props: { style: { width: '120px' }, placeholder: '请选择状态' },
    enum: [
      { label: '未配置', value: 0 },
      { label: '已配置', value: 1 }
    ]
  },
]
// 获取table列表
const getTableList = (params: IResearchProj.Query) => {
  let newParams = formatParams(params);
  return getResearchProjListApi(newParams);
};
const formatParams = (params: IResearchProj.Query) =>{
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
const researchProjRef = ref<InstanceType<typeof ResearchProjForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getResearchProjDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createResearchProjApi : updateResearchProjApi,
    getTableList: proTableRef.value?.getTableList
  }
  researchProjRef.value?.acceptParams(params)
}
// 打开问题列表
const questionListDialogRef = ref<InstanceType<typeof QuestionListDialog>>()
const openQuestionList = (row: IResearchProj.Row) => {
  questionListDialogRef.value?.acceptParams({
    projectId: row.id,
    projectName: row.name
  } as any)
}
// 删除信息
const deleteInfo = async (params: IResearchProj.Row) => {
  await useHandleData(
    removeResearchProjApi,
    { ids: [params.id] },
    `删除【${params.name}】申研项目`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeResearchProjApi, { ids }, '删除所选申研项目')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '申研项目',
    templateName: '申研项目',
    tempApi: downloadTemplate,
    importApi: importResearchProjExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IResearchProj.Query);
  useDownload(exportResearchProjExcelApi, "申研项目", newParams);
};
</script>
