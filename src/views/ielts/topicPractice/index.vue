<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="主题练习记录表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          type="primary"
          v-auth="'topic.practice.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增主题练习记录表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'topic.practice.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'topic.practice.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'topic.practice.export'"
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
          v-auth="'topic.practice.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑主题练习记录表', row, false)"
        >
          编辑
        </el-button>
        <el-button
          v-auth="'topic.practice.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <TopicPracticeForm ref="topicPracticeRef" />
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
  createTopicPracticeApi,
  removeTopicPracticeApi,
  getTopicPracticeListApi,
  getTopicPracticeDetailApi,
  importTopicPracticeExcelApi,
  exportTopicPracticeExcelApi,
} from '@/api/modules/ielts/topicPractice';
import { useHandleData } from '@/hooks/useHandleData';
import TopicPracticeForm from '@/views/ielts/topicPractice/components/TopicPracticeForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ITopicPractice } from '@/api/interface/ielts/topicPractice';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'TopicPracticeView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<ITopicPractice.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'status', label: '状态(0=未完结，1=已完结)' },
  { prop: 'evaluation', label: '总体评测结果' },
  { prop: 'comment', label: '评语' },
  { prop: 'result', label: '处理结果' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'status', label: '状态(0=未完结，1=已完结)', el: 'select' },
  { prop: 'evaluation', label: '总体评测结果', el: 'input' },
  { prop: 'comment', label: '评语', el: 'input' },
  { prop: 'result', label: '处理结果', el: 'input' },
]
// 获取table列表
const getTableList = (params: ITopicPractice.Query) => {
  let newParams = formatParams(params);
  return getTopicPracticeListApi(newParams);
};
const formatParams = (params: ITopicPractice.Query) =>{
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
const topicPracticeRef = ref<InstanceType<typeof TopicPracticeForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getTopicPracticeDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: createTopicPracticeApi,
    getTableList: proTableRef.value?.getTableList
  }
  topicPracticeRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ITopicPractice.Row) => {
  await useHandleData(
    removeTopicPracticeApi,
    { ids: [params.id] },
    `删除【${params.id}】主题练习记录表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeTopicPracticeApi, { ids }, '删除所选主题练习记录表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '主题练习记录表',
    templateName: '主题练习记录表',
    tempApi: downloadTemplate,
    importApi: importTopicPracticeExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ITopicPractice.Query);
  useDownload(exportTopicPracticeExcelApi, "主题练习记录表", newParams);
};
</script>
