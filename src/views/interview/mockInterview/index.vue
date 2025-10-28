<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="模拟面试表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'mock.interview.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增模拟面试表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'mock.interview.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'mock.interview.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'mock.interview.export'"
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
          v-auth="'mock.interview.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑模拟面试表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'mock.interview.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <MockInterviewForm ref="mockInterviewRef" />
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
  createMockInterviewApi,
  removeMockInterviewApi,
  updateMockInterviewApi,
  getMockInterviewListApi,
  getMockInterviewDetailApi,
  importMockInterviewExcelApi,
  exportMockInterviewExcelApi,
} from '@/api/modules/interview/mockInterview';
import { useHandleData } from '@/hooks/useHandleData';
import MockInterviewForm from '@/views/interview/mockInterview/components/MockInterviewForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IMockInterview } from '@/api/interface/interview/mockInterview';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'MockInterviewView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IMockInterview.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: "#" , width: 50 },
  { prop: 'sessionId', label: '会话id', width: 180 },
  { prop: 'companyId', label: '公司id', width: 80},
  { prop: 'roleId', label: '角色id' , width: 80},
  { prop: 'feedback', label: '最终评测结果' },
  { prop: 'shareFlag', label: '是否分享' , width: 120},
  { prop: 'operation', label: '操作', width: 180, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'sessionId', label: 'coze的会话Id', el: 'input' },
  { prop: 'companyId', label: '公司id', el: 'input' },
  { prop: 'roleId', label: '角色id', el: 'input' },
  { prop: 'feedback', label: '最终评测结果', el: 'input' },
  { prop: 'shareFlag', label: '是否分享', el: 'input' },
]
// 获取table列表
const getTableList = (params: IMockInterview.Query) => {
  let newParams = formatParams(params);
  return getMockInterviewListApi(newParams);
};
const formatParams = (params: IMockInterview.Query) =>{
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
const mockInterviewRef = ref<InstanceType<typeof MockInterviewForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getMockInterviewDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createMockInterviewApi : updateMockInterviewApi,
    getTableList: proTableRef.value?.getTableList
  }
  mockInterviewRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IMockInterview.Row) => {
  await useHandleData(
    removeMockInterviewApi,
    { ids: [params.id] },
    `删除【${params.id}】模拟面试表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeMockInterviewApi, { ids }, '删除所选模拟面试表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '模拟面试表',
    templateName: '模拟面试表',
    tempApi: downloadTemplate,
    importApi: importMockInterviewExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IMockInterview.Query);
  useDownload(exportMockInterviewExcelApi, "模拟面试表", newParams);
};
</script>
