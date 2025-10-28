<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="问题所属角色表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'question.role.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增问题所属角色表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'question.role.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'question.role.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'question.role.export'"
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
          v-auth="'question.role.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑问题所属角色表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'question.role.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <QuestionRoleForm ref="questionRoleRef" />
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
  createQuestionRoleApi,
  removeQuestionRoleApi,
  updateQuestionRoleApi,
  getQuestionRoleListApi,
  getQuestionRoleDetailApi,
  importQuestionRoleExcelApi,
  exportQuestionRoleExcelApi,
} from '@/api/modules/interview/questionRole';
import { useHandleData } from '@/hooks/useHandleData';
import QuestionRoleForm from '@/views/interview/questionRole/components/QuestionRoleForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IQuestionRole } from '@/api/interface/interview/questionRole';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'QuestionRoleView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IQuestionRole.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '序号' },
  { prop: 'name', label: '名称' },
  { prop: 'nameUs', label: '名称-英文' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'name', label: '名称', el: 'input' },
  { prop: 'nameUs', label: '名称-英文', el: 'input' },
]
// 获取table列表
const getTableList = (params: IQuestionRole.Query) => {
  let newParams = formatParams(params);
  return getQuestionRoleListApi(newParams);
};
const formatParams = (params: IQuestionRole.Query) =>{
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
const questionRoleRef = ref<InstanceType<typeof QuestionRoleForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getQuestionRoleDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createQuestionRoleApi : updateQuestionRoleApi,
    getTableList: proTableRef.value?.getTableList
  }
  questionRoleRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IQuestionRole.Row) => {
  await useHandleData(
    removeQuestionRoleApi,
    { ids: [params.id] },
    `删除【${params.id}】问题所属角色表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeQuestionRoleApi, { ids }, '删除所选问题所属角色表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '问题所属角色表',
    templateName: '问题所属角色表',
    tempApi: downloadTemplate,
    importApi: importQuestionRoleExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IQuestionRole.Query);
  useDownload(exportQuestionRoleExcelApi, "问题所属角色表", newParams);
};
</script>
