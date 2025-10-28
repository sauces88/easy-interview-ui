<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="雅思模拟考试表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          type="primary"
          v-auth="'mock.exam.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增雅思模拟考试表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'mock.exam.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'mock.exam.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'mock.exam.export'"
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
          v-auth="'mock.exam.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <MockExamForm ref="mockExamRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  CirclePlus,
  Delete,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createMockExamApi,
  removeMockExamApi,
  getMockExamListApi,
  getMockExamDetailApi,
  importMockExamExcelApi,
  exportMockExamExcelApi,
} from '@/api/modules/ielts/mockExam';
import { useHandleData } from '@/hooks/useHandleData';
import MockExamForm from '@/views/ielts/mockExam/components/MockExamForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IMockExam } from '@/api/interface/ielts/mockExam';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'MockExamView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IMockExam.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'status', label: '状态' },
  { prop: 'evaluation', label: '评测结果' },
  { prop: 'comment', label: '评语' },
  { prop: 'chats', label: '对话记录' },
  { prop: 'result', label: '处理结果' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'status', label: '状态', el: 'select' },
  { prop: 'result', label: '处理结果', el: 'input' },
]
// 获取table列表
const getTableList = (params: IMockExam.Query) => {
  let newParams = formatParams(params);
  return getMockExamListApi(newParams);
};
const formatParams = (params: IMockExam.Query) =>{
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
const mockExamRef = ref<InstanceType<typeof MockExamForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getMockExamDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: createMockExamApi,
    getTableList: proTableRef.value?.getTableList
  }
  mockExamRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IMockExam.Row) => {
  await useHandleData(
    removeMockExamApi,
    { ids: [params.id] },
    `删除【${params.id}】雅思模拟考试表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeMockExamApi, { ids }, '删除所选雅思模拟考试表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '雅思模拟考试表',
    templateName: '雅思模拟考试表',
    tempApi: downloadTemplate,
    importApi: importMockExamExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IMockExam.Query);
  useDownload(exportMockExamExcelApi, "雅思模拟考试表", newParams);
};
</script>
