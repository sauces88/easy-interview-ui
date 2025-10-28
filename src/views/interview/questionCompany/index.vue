<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="公司表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'question.company.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增公司表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'question.company.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'question.company.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'question.company.export'"
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
          v-auth="'question.company.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑公司表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'question.company.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <QuestionCompanyForm ref="questionCompanyRef" />
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
  createQuestionCompanyApi,
  removeQuestionCompanyApi,
  updateQuestionCompanyApi,
  getQuestionCompanyListApi,
  getQuestionCompanyDetailApi,
  importQuestionCompanyExcelApi,
  exportQuestionCompanyExcelApi,
} from '@/api/modules/interview/questionCompany';
import { useHandleData } from '@/hooks/useHandleData';
import QuestionCompanyForm from '@/views/interview/questionCompany/components/QuestionCompanyForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IQuestionCompany } from '@/api/interface/interview/questionCompany';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'QuestionCompanyView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IQuestionCompany.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '序号' },
  { prop: 'name', label: '公司名称' },
  { prop: 'nameUs', label: '公司名称(英文)' },
  { prop: 'logo', label: '公司logo' },
  { prop: 'sort', label: '排序' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'name', label: '公司名称', el: 'input' },
  { prop: 'nameUs', label: '公司名称(英文)', el: 'input' },
  { prop: 'logo', label: '公司logo', el: 'input' },
  { prop: 'sort', label: '排序', el: 'input' },
]
// 获取table列表
const getTableList = (params: IQuestionCompany.Query) => {
  let newParams = formatParams(params);
  return getQuestionCompanyListApi(newParams);
};
const formatParams = (params: IQuestionCompany.Query) =>{
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
const questionCompanyRef = ref<InstanceType<typeof QuestionCompanyForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getQuestionCompanyDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createQuestionCompanyApi : updateQuestionCompanyApi,
    getTableList: proTableRef.value?.getTableList
  }
  questionCompanyRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IQuestionCompany.Row) => {
  await useHandleData(
    removeQuestionCompanyApi,
    { ids: [params.id] },
    `删除【${params.id}】公司表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeQuestionCompanyApi, { ids }, '删除所选公司表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '公司表',
    templateName: '公司表',
    tempApi: downloadTemplate,
    importApi: importQuestionCompanyExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IQuestionCompany.Query);
  useDownload(exportQuestionCompanyExcelApi, "公司表", newParams);
};
</script>
