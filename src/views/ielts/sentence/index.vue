<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="句子表"
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
          v-auth="'sentence.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增句子表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'sentence.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'sentence.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'sentence.export'"
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
          v-auth="'sentence.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑句子表', row, false)"
        >
          编辑
        </el-button>
        <el-button
          v-auth="'sentence.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <SentenceForm ref="sentenceRef" />
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
  createSentenceApi,
  removeSentenceApi,
  updateSentenceApi,
  getSentenceListApi,
  getSentenceDetailApi,
  importSentenceExcelApi,
  exportSentenceExcelApi,
} from '@/api/modules/ielts/sentence';
import { useHandleData } from '@/hooks/useHandleData';
import SentenceForm from '@/views/ielts/sentence/components/SentenceForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ISentence } from '@/api/interface/ielts/sentence';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'SentenceView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<ISentence.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'text', label: '句子内容' },
  { prop: 'audio', label: '音频' },
  { prop: 'tags', label: '标签' },
  { prop: 'remark', label: '备注' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'text', label: '句子内容', el: 'input' },
  { prop: 'tags', label: '标签', el: 'input' },
]
// 获取table列表
const getTableList = (params: ISentence.Query) => {
  let newParams = formatParams(params);
  return getSentenceListApi(newParams);
};
const formatParams = (params: ISentence.Query) =>{
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
const sentenceRef = ref<InstanceType<typeof SentenceForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getSentenceDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createSentenceApi : updateSentenceApi,
    getTableList: proTableRef.value?.getTableList
  }
  sentenceRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ISentence.Row) => {
  await useHandleData(
    removeSentenceApi,
    { ids: [params.id] },
    `删除【${params.id}】句子表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeSentenceApi, { ids }, '删除所选句子表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '句子表',
    templateName: '句子表',
    tempApi: downloadTemplate,
    importApi: importSentenceExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ISentence.Query);
  useDownload(exportSentenceExcelApi, "句子表", newParams);
};
</script>
