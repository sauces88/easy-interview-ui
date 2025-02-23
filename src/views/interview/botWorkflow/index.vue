<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="智能体工作流关联表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'bot.workflow.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增智能体工作流关联表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'bot.workflow.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'bot.workflow.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'bot.workflow.export'"
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
          v-auth="'bot.workflow.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑智能体工作流关联表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'bot.workflow.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <BotWorkflowForm ref="botWorkflowRef" />
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
  createBotWorkflowApi,
  removeBotWorkflowApi,
  updateBotWorkflowApi,
  getBotWorkflowListApi,
  getBotWorkflowDetailApi,
  importBotWorkflowExcelApi,
  exportBotWorkflowExcelApi,
} from '@/api/modules/interview/botWorkflow';
import { useHandleData } from '@/hooks/useHandleData';
import BotWorkflowForm from '@/views/interview/botWorkflow/components/BotWorkflowForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IBotWorkflow } from '@/api/interface/interview/botWorkflow';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'BotWorkflowView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IBotWorkflow.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '主键'},
  { prop: 'botId', label: '智能体id' },
  { prop: 'workflowId', label: '工作流id' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'botId', label: '智能体id', el: 'input' },
  { prop: 'workflowId', label: '工作流id', el: 'input' },
]
// 获取table列表
const getTableList = (params: IBotWorkflow.Query) => {
  let newParams = formatParams(params);
  return getBotWorkflowListApi(newParams);
};
const formatParams = (params: IBotWorkflow.Query) =>{
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
const botWorkflowRef = ref<InstanceType<typeof BotWorkflowForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getBotWorkflowDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createBotWorkflowApi : updateBotWorkflowApi,
    getTableList: proTableRef.value?.getTableList
  }
  botWorkflowRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IBotWorkflow.Row) => {
  await useHandleData(
    removeBotWorkflowApi,
    { ids: [params.id] },
    `删除【${params.id}】智能体工作流关联表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeBotWorkflowApi, { ids }, '删除所选智能体工作流关联表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '智能体工作流关联表',
    templateName: '智能体工作流关联表',
    tempApi: downloadTemplate,
    importApi: importBotWorkflowExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IBotWorkflow.Query);
  useDownload(exportBotWorkflowExcelApi, "智能体工作流关联表", newParams);
};
</script>
