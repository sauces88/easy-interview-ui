<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="句子练习记录表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-auth="'sentence.practice.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'sentence.practice.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'sentence.practice.export'"
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
          v-auth="'sentence.practice.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑句子练习记录表', row, false)"
        >
          编辑
        </el-button>
        <el-button
          v-auth="'sentence.practice.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <SentencePracticeForm ref="sentencePracticeRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Delete,
  EditPen,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createSentencePracticeApi,
  removeSentencePracticeApi,
  updateSentencePracticeApi,
  getSentencePracticeListApi,
  getSentencePracticeDetailApi,
  importSentencePracticeExcelApi,
  exportSentencePracticeExcelApi,
} from '@/api/modules/ielts/sentencePractice';
import { useHandleData } from '@/hooks/useHandleData';
import SentencePracticeForm from '@/views/ielts/sentencePractice/components/SentencePracticeForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ISentencePractice } from '@/api/interface/ielts/sentencePractice';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'SentencePracticeView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<ISentencePractice.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'sentenceId', label: '句子表主键' },
  { prop: 'audio', label: '句子跟读音频' },
  { prop: 'evaluation', label: '评测结果' },
  { prop: 'result', label: '处理结果' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'sentenceId', label: '句子表主键', el: 'input' },
]
// 获取table列表
const getTableList = (params: ISentencePractice.Query) => {
  let newParams = formatParams(params);
  return getSentencePracticeListApi(newParams);
};
const formatParams = (params: ISentencePractice.Query) =>{
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
const sentencePracticeRef = ref<InstanceType<typeof SentencePracticeForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getSentencePracticeDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createSentencePracticeApi : updateSentencePracticeApi,
    getTableList: proTableRef.value?.getTableList
  }
  sentencePracticeRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ISentencePractice.Row) => {
  await useHandleData(
    removeSentencePracticeApi,
    { ids: [params.id] },
    `删除【${params.id}】句子练习记录表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeSentencePracticeApi, { ids }, '删除所选句子练习记录表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '句子练习记录表',
    templateName: '句子练习记录表',
    tempApi: downloadTemplate,
    importApi: importSentencePracticeExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ISentencePractice.Query);
  useDownload(exportSentencePracticeExcelApi, "句子练习记录表", newParams);
};
</script>
