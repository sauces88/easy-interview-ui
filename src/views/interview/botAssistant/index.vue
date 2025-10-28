<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('interview.botAssistant.title')"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
      :key="i18nKey"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          type="primary"
          v-auth="'bot.assistant.create'"
          :icon="CirclePlus"
          @click="openAddEdit(t('interview.botAssistant.addTitle'))"
        >
          {{ t('common.add') }}
        </el-button>
        <el-button
          v-auth="'bot.assistant.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          {{ t('common.batchDelete') }}
        </el-button>
        <el-button
          v-auth="'bot.assistant.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          {{ t('table.import') }}
        </el-button>
        <el-button
          v-auth="'bot.assistant.export'"
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
          v-auth="'bot.assistant.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit(t('interview.botAssistant.editTitle'), row, false)"
        >
          {{ t('common.edit') }}
        </el-button>
        <el-button
          v-auth="'bot.assistant.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          {{ t('common.delete') }}
        </el-button>
      </template>
    </ProTable>
    <BotAssistantForm ref="botAssistantRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTableI18n } from '@/hooks/useTableI18n'
import {
  CirclePlus,
  Delete,
  EditPen,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createBotAssistantApi,
  removeBotAssistantApi,
  updateBotAssistantApi,
  getBotAssistantListApi,
  getBotAssistantDetailApi,
  importBotAssistantExcelApi,
  exportBotAssistantExcelApi,
} from '@/api/modules/interview/botAssistant';
import { useHandleData } from '@/hooks/useHandleData';
import BotAssistantForm from '@/views/interview/botAssistant/components/BotAssistantForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps, HeaderRenderScope } from '@/components/ProTable/interface';
import type { IBotAssistant } from '@/api/interface/interview/botAssistant';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
import { useI18n } from 'vue-i18n';

const { t, i18nKey } = useTableI18n()

const proTableRef = ref<ProTableInstance>();
// 表格配置项 - 改为计算属性
const columns = computed<ColumnProps<IBotAssistant.Row>[]>(() => [
  { type: 'selection', width: 80 },
  { prop: 'id', label: t('table.index'), width: 80 },
  { prop: 'assistantBotId', label: t('interview.botAssistant.assistantId') },
  { prop: 'mainBotId', label: t('interview.botAssistant.mainId') },
  { prop: 'createId', label: t('system.user.createId') },
  { prop: 'createTime', label: t('system.user.createTime') },
  { prop: 'operation', label: t('table.operate'), width: 250, fixed: 'right' }
])
// 搜索条件项 - 改为计算属性
const searchColumns = computed<SearchProps[]>(() => [
  { prop: 'assistantBotId', label: t('interview.botAssistant.assistantId'), el: 'input' },
  { prop: 'mainBotId', label: t('interview.botAssistant.mainId'), el: 'input' },
])
// 获取table列表
const getTableList = (params: IBotAssistant.Query) => {
  let newParams = formatParams(params);
  return getBotAssistantListApi(newParams);
};
const formatParams = (params: IBotAssistant.Query) =>{
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
const botAssistantRef = ref<InstanceType<typeof BotAssistantForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getBotAssistantDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createBotAssistantApi : updateBotAssistantApi,
    getTableList: proTableRef.value?.getTableList
  }
  botAssistantRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IBotAssistant.Row) => {
  await useHandleData(
    removeBotAssistantApi,
    { ids: [params.id] },
    t('message.deleteConfirm')
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(
    removeBotAssistantApi,
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
    title: t('interview.botAssistant.title'),
    templateName: t('interview.botAssistant.title'),
    tempApi: downloadTemplate,
    importApi: importBotAssistantExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IBotAssistant.Query);
  useDownload(exportBotAssistantExcelApi, t('interview.botAssistant.title'), newParams);
};
</script>
