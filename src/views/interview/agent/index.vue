<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="智能体表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'agent.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增智能体表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'agent.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'agent.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'agent.export'"
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
          v-auth="'agent.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑智能体表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'agent.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <AgentForm ref="agentRef" />
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
  createAgentApi,
  removeAgentApi,
  updateAgentApi,
  getAgentListApi,
  getAgentDetailApi,
  importAgentExcelApi,
  exportAgentExcelApi,
} from '@/api/modules/interview/agent';
import { useHandleData } from '@/hooks/useHandleData';
import AgentForm from '@/views/interview/agent/components/AgentForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IAgent } from '@/api/interface/interview/agent';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'AgentView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IAgent.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '#', width: 80 },
  { prop: 'botId', label: 'coze的botId' },
  { prop: 'identifier', label: '唯一标识符' },
  { prop: 'remark', label: '描述' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'botId', label: 'coze的botId', el: 'input' },
  { prop: 'identifier', label: '唯一标识符', el: 'input' },
]
// 获取table列表
const getTableList = (params: IAgent.Query) => {
  let newParams = formatParams(params);
  return getAgentListApi(newParams);
};
const formatParams = (params: IAgent.Query) =>{
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
const agentRef = ref<InstanceType<typeof AgentForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getAgentDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createAgentApi : updateAgentApi,
    getTableList: proTableRef.value?.getTableList
  }
  agentRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IAgent.Row) => {
  await useHandleData(
    removeAgentApi,
    { ids: [params.id] },
    `删除【${params.id}】智能体表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeAgentApi, { ids }, '删除所选智能体表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '智能体表',
    templateName: '智能体表',
    tempApi: downloadTemplate,
    importApi: importAgentExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IAgent.Query);
  useDownload(exportAgentExcelApi, "智能体表", newParams);
};
</script>
