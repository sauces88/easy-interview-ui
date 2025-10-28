<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="问题表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'question.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增问题表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'question.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'question.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'question.export'"
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
          v-auth="'question.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑问题表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'question.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <QuestionForm ref="questionRef" />
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
  createQuestionApi,
  removeQuestionApi,
  updateQuestionApi,
  getQuestionListAdminApi,
  getQuestionDetailApi,
  importQuestionExcelApi,
  exportQuestionExcelApi,
} from '@/api/modules/interview/question';
import { useHandleData } from '@/hooks/useHandleData';
import QuestionForm from '@/views/interview/question/components/QuestionForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IQuestion } from '@/api/interface/interview/question';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'QuestionView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IQuestion.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'content', label: '问题内容' },
  { prop: 'contentUs', label: '问题内容(英文)' },
  { prop: 'tags', label: '标签' },
  { prop: 'tagsUs', label: '标签(英文)' },
  { prop: 'level', label: '难度' },
  { prop: 'companyId', label: '关联公司id' },
  { prop: 'roleId', label: '关联所属角色id' },
  { prop: 'sort', label: '排序' },
  { 
    prop: 'isShow', 
    label: '是否展示在题库', 
    tag: true,
    enum: [
      { label: '是', value: 'T', tagType: 'success' },
      { label: '否', value: 'F', tagType: 'danger' }
    ]
  },
  { 
    prop: 'isEnabled', 
    label: '是否用在模拟面试', 
    tag: true,
    enum: [
      { label: '是', value: 'T', tagType: 'success' },
      { label: '否', value: 'F', tagType: 'danger' }
    ]
  },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'content', label: '问题内容', el: 'input' },
  { prop: 'contentUs', label: '问题内容(英文)', el: 'input' },
  { prop: 'tags', label: '标签', el: 'input' },
  { prop: 'tagsUs', label: '标签(英文)', el: 'input' },
  { prop: 'level', label: '难度', el: 'input' },
  { prop: 'companyId', label: '关联公司id（问题来源哪个公司）', el: 'input' },
  { prop: 'roleId', label: '关联所属角色id（问题所属角色）', el: 'input' },
  { prop: 'sort', label: '排序', el: 'input' },
  { 
    prop: 'isShow', 
    label: '是否展示在题库', 
    el: 'select', 
    enum: [
      { label: '是', value: 'T' },
      { label: '否', value: 'F' }
    ]
  },
  { 
    prop: 'isEnabled', 
    label: '是否用在模拟面试', 
    el: 'select', 
    enum: [
      { label: '是', value: 'T' },
      { label: '否', value: 'F' }
    ]
  },
]
// 获取table列表
const getTableList = (params: IQuestion.Query) => {
  let newParams = formatParams(params);
  return getQuestionListAdminApi(newParams);
};
const formatParams = (params: IQuestion.Query) =>{
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
const questionRef = ref<InstanceType<typeof QuestionForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getQuestionDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createQuestionApi : updateQuestionApi,
    getTableList: proTableRef.value?.getTableList
  }
  questionRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IQuestion.Row) => {
  await useHandleData(
    removeQuestionApi,
    { ids: [params.id] },
    `删除【${params.id}】问题表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeQuestionApi, { ids }, '删除所选问题表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '问题表',
    templateName: '问题表',
    tempApi: downloadTemplate,
    importApi: importQuestionExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IQuestion.Query);
  useDownload(exportQuestionExcelApi, "问题表", newParams);
};
</script>
