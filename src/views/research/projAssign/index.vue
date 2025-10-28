<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="项目-学员分配表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'proj.assign.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增项目-学员分配表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'proj.assign.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'proj.assign.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'proj.assign.export'"
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
          v-auth="'proj.assign.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑项目-学员分配表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'proj.assign.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ProjAssignForm ref="projAssignRef" />
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
  createProjAssignApi,
  removeProjAssignApi,
  updateProjAssignApi,
  getProjAssignListApi,
  getProjAssignDetailApi,
  importProjAssignExcelApi,
  exportProjAssignExcelApi,
} from '@/api/modules/research/projAssign';
import { useHandleData } from '@/hooks/useHandleData';
import ProjAssignForm from '@/views/research/projAssign/components/ProjAssignForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IProjAssign } from '@/api/interface/research/projAssign';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'ProjAssignView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IProjAssign.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'projectId', label: '关联分配的项目ID' },
  { prop: 'researchUserId', label: '关联被分配的学员ID' },
  { prop: 'assignUserId', label: '执行分配的用户ID' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'projectId', label: '关联分配的项目ID', el: 'input' },
  { prop: 'researchUserId', label: '关联被分配的学员ID', el: 'input' },
  { prop: 'assignUserId', label: '执行分配的用户ID', el: 'input' },
]
// 获取table列表
const getTableList = (params: IProjAssign.Query) => {
  let newParams = formatParams(params);
  return getProjAssignListApi(newParams);
};
const formatParams = (params: IProjAssign.Query) =>{
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
const projAssignRef = ref<InstanceType<typeof ProjAssignForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getProjAssignDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createProjAssignApi : updateProjAssignApi,
    getTableList: proTableRef.value?.getTableList
  }
  projAssignRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IProjAssign.Row) => {
  await useHandleData(
    removeProjAssignApi,
    { ids: [params.id] },
    `删除【${params.id}】项目-学员分配表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeProjAssignApi, { ids }, '删除所选项目-学员分配表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '项目-学员分配表',
    templateName: '项目-学员分配表',
    tempApi: downloadTemplate,
    importApi: importProjAssignExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IProjAssign.Query);
  useDownload(exportProjAssignExcelApi, "项目-学员分配表", newParams);
};
</script>