<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('interview.workspace.title')"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
      :key="i18nKey"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'workspace.create'"
          :icon="CirclePlus"
          @click="openAddEdit(t('interview.workspace.addTitle'))"
        >
          {{ t('common.add') }}
        </el-button>
        <el-button
          v-auth="'workspace.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          {{ t('common.batchDelete') }}
        </el-button>
        <el-button
          v-auth="'workspace.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          {{ t('table.import') }}
        </el-button>
        <el-button
          v-auth="'workspace.export'"
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
          v-auth="'workspace.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit(t('interview.workspace.editTitle'), row, false)"
        >
          {{ t('common.edit') }}
        </el-button>
        <el-button
          v-auth="'workspace.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          {{ t('common.delete') }}
        </el-button>
      </template>
    </ProTable>
    <WorkspaceForm ref="workspaceRef" />
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
  createWorkspaceApi,
  removeWorkspaceApi,
  updateWorkspaceApi,
  getWorkspaceListApi,
  getWorkspaceDetailApi,
  importWorkspaceExcelApi,
  exportWorkspaceExcelApi,
} from '@/api/modules/interview/workspace';
import { useHandleData } from '@/hooks/useHandleData';
import WorkspaceForm from '@/views/interview/workspace/components/WorkspaceForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IWorkspace } from '@/api/interface/interview/workspace';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";

const { t, i18nKey } = useTableI18n()

const proTableRef = ref<ProTableInstance>();
// 表格配置项 - 改为计算属性
const columns = computed<ColumnProps<IWorkspace.Row>[]>(() => [
  { type: 'selection', width: 80 },
  { prop: 'id', label: t('table.index'), width: 80 },
  { prop: 'workspaceId', label: t('interview.workspace.id') },
  { prop: 'identifier', label: t('interview.workspace.identifier') },
  { prop: 'createId', label: t('system.user.createId') },
  { prop: 'createTime', label: t('system.user.createTime') },
  { prop: 'operation', label: t('table.operation'), width: 250, fixed: 'right' }
])
// 搜索条件项 - 改为计算属性
const searchColumns = computed<SearchProps[]>(() => [
  { prop: 'workspaceId', label: t('interview.workspace.id'), el: 'input' },
  { prop: 'identifier', label: t('interview.workspace.identifier'), el: 'input' },
])
// 获取table列表
const getTableList = (params: IWorkspace.Query) => {
  let newParams = formatParams(params);
  return getWorkspaceListApi(newParams);
};
const formatParams = (params: IWorkspace.Query) =>{
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
const workspaceRef = ref<InstanceType<typeof WorkspaceForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getWorkspaceDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createWorkspaceApi : updateWorkspaceApi,
    getTableList: proTableRef.value?.getTableList
  }
  workspaceRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IWorkspace.Row) => {
  await useHandleData(
    removeWorkspaceApi,
    { ids: [params.id] },
    t('message.deleteConfirm')
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(
    removeWorkspaceApi, 
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
    title: t('interview.workspace.title'),
    templateName: t('interview.workspace.title'),
    tempApi: downloadTemplate,
    importApi: importWorkspaceExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IWorkspace.Query);
  useDownload(exportWorkspaceExcelApi, t('interview.workspace.title'), newParams);
};
</script>
