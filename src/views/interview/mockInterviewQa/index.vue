<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="模拟面试QA表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-auth="'mock.interview.qa.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          导出
        </el-button>
      </template>
    </ProTable>
    <MockInterviewQaForm ref="mockInterviewQaRef" />
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
  createMockInterviewQaApi,
  removeMockInterviewQaApi,
  updateMockInterviewQaApi,
  getMockInterviewQaListApi,
  getMockInterviewQaDetailApi,
  importMockInterviewQaExcelApi,
  exportMockInterviewQaExcelApi,
} from '@/api/modules/interview/mockInterviewQa';
import { useHandleData } from '@/hooks/useHandleData';
import MockInterviewQaForm from '@/views/interview/mockInterviewQa/components/MockInterviewQaForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IMockInterviewQa } from '@/api/interface/interview/mockInterviewQa';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'MockInterviewQaView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IMockInterviewQa.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: "#" , width: 50 },
  { prop: 'mockInterviewId', label: '模拟面试id', width: 120 },
  { prop: 'questionId', label: '问题id', width: 120  },
  { prop: 'url', label: '录音文件url' , width: 240 },
  { prop: 'duration', label: '录音文件时长(s)' , width: 150 },
  { prop: 'content', label: '回答内容' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'mockInterviewId', label: '模拟面试id', el: 'input' },
  { prop: 'questionId', label: '问题id', el: 'input' },
  { prop: 'url', label: '录音文件url', el: 'input' },
  { prop: 'duration', label: '录音文件时长(s)', el: 'input' },
  { prop: 'content', label: '回答内容', el: 'input' },
]
// 获取table列表
const getTableList = (params: IMockInterviewQa.Query) => {
  let newParams = formatParams(params);
  return getMockInterviewQaListApi(newParams);
};
const formatParams = (params: IMockInterviewQa.Query) =>{
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
const mockInterviewQaRef = ref<InstanceType<typeof MockInterviewQaForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getMockInterviewQaDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createMockInterviewQaApi : updateMockInterviewQaApi,
    getTableList: proTableRef.value?.getTableList
  }
  mockInterviewQaRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IMockInterviewQa.Row) => {
  await useHandleData(
    removeMockInterviewQaApi,
    { ids: [params.id] },
    `删除【${params.id}】模拟面试QA表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeMockInterviewQaApi, { ids }, '删除所选模拟面试QA表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '模拟面试QA表',
    templateName: '模拟面试QA表',
    tempApi: downloadTemplate,
    importApi: importMockInterviewQaExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IMockInterviewQa.Query);
  useDownload(exportMockInterviewQaExcelApi, "模拟面试QA表", newParams);
};
</script>
