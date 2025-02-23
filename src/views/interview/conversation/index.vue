<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="会话表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 添加完结状态的自定义模板 -->
      <template #completed="scope">
        <el-tag :type="scope.row.completed ? 'success' : 'warning'">
          {{ scope.row.completed ? '已完结' : '未完结' }}
        </el-tag>
      </template>

      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'conversation.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增会话表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'conversation.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'conversation.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'conversation.export'"
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
            v-auth="'conversation.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ConversationForm ref="conversationRef" />
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
  createConversationApi,
  removeConversationApi,
  updateConversationApi,
  getConversationListApi,
  getConversationDetailApi,
  importConversationExcelApi,
  exportConversationExcelApi,
} from '@/api/modules/interview/conversation';
import { useHandleData } from '@/hooks/useHandleData';
import ConversationForm from '@/views/interview/conversation/components/ConversationForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IConversation } from '@/api/interface/interview/conversation';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'ConversationView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IConversation.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '主键' },
  { prop: 'botId', label: '智能体id' },
  { prop: 'conversationId', label: '会话id' },
  { prop: 'completed', label: '是否完结'},
  { prop: 'createId', label: '创建人' },
  { prop: 'createTime', label: '创建时间' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' },
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'botId', label: '智能体id', el: 'input' },
  {
    prop: 'completed',
    label: '是否完结',
    el: 'select',
    props: {
      clearable: true,
      placeholder: '请选择是否完结'
    },
    enum: [
      { label: '已完结', value: 1 },
      { label: '未完结', value: 0 }
    ]
  },
  { prop: 'conversationId', label: '会话id', el: 'input' },
  { prop: 'createId', label: '创建人', el: 'input' },
  { prop: 'createTime', label: '创建时间', el: 'date-picker', props: { type: 'datetimerange' } }
]
// 获取table列表
const getTableList = (params: IConversation.Query) => {
  let newParams = formatParams(params);
  return getConversationListApi(newParams);
};
const formatParams = (params: IConversation.Query) =>{
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
const conversationRef = ref<InstanceType<typeof ConversationForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getConversationDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createConversationApi : updateConversationApi,
    getTableList: proTableRef.value?.getTableList
  }
  conversationRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IConversation.Row) => {
  await useHandleData(
    removeConversationApi,
    { ids: [params.id] },
    `删除【${params.id}】会话表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeConversationApi, { ids }, '删除所选会话表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '会话表',
    templateName: '会话表',
    tempApi: downloadTemplate,
    importApi: importConversationExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IConversation.Query);
  useDownload(exportConversationExcelApi, "会话表", newParams);
};
</script>
