<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('interview.conversation.title')"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
      :key="i18nKey"
    >
      <!-- 添加完结状态的自定义模板 -->
      <template #completed="scope">
        <el-tag :type="scope.row.completed ? 'success' : 'warning'">
          {{ scope.row.completed ? t('interview.conversation.completed') : t('interview.conversation.uncompleted') }}
        </el-tag>
      </template>

      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'conversation.create'"
          :icon="CirclePlus"
          @click="openAddEdit(t('interview.conversation.addTitle'))"
        >
          {{ t('common.add') }}
        </el-button>
        <el-button
          v-auth="'conversation.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          {{ t('common.batchDelete') }}
        </el-button>
        <el-button
          v-auth="'conversation.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          {{ t('table.import') }}
        </el-button>
        <el-button
          v-auth="'conversation.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          {{ t('table.export') }}
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
          {{ t('common.delete') }}
        </el-button>
      </template>
    </ProTable>
    <ConversationForm ref="conversationRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableI18n } from '@/hooks/useTableI18n'
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
import { useI18n } from 'vue-i18n'

const { t, i18nKey } = useTableI18n()

const proTableRef = ref<ProTableInstance>();
// 表格配置项 - 改为计算属性
const columns = computed<ColumnProps<IConversation.Row>[]>(() => [
  { type: 'selection', width: 80 },
  { prop: 'id', label: t('table.index'), width: 80 },
  { prop: 'botId', label: t('interview.bot.id') },
  { prop: 'conversationId', label: t('interview.conversation.id') },
  { prop: 'completed', label: t('interview.conversation.status') },
  { prop: 'createId', label: t('system.user.createId') },
  { prop: 'createTime', label: t('system.user.createTime') },
  { prop: 'operation', label: t('table.operation'), width: 250, fixed: 'right' },
])
// 搜索条件项 - 改为计算属性
const searchColumns = computed<SearchProps[]>(() => [
  { prop: 'botId', label: t('interview.bot.id'), el: 'input' },
  { prop: 'completed', label: t('interview.conversation.status'), el: 'input' }
])
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
    t('message.deleteConfirm')
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(
    removeConversationApi,
    { ids },
    t('message.deleteConfirm')
  )
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: t('interview.conversation.title'),
    templateName: t('interview.conversation.title'),
    tempApi: downloadTemplate,
    importApi: importConversationExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IConversation.Query);
  useDownload(exportConversationExcelApi, t('interview.conversation.title'), newParams);
};
</script>
