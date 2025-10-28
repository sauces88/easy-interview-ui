<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="主题问题-练习明细表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'topic.practice.quiz.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增主题问题-练习明细表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'topic.practice.quiz.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'topic.practice.quiz.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'topic.practice.quiz.export'"
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
          v-auth="'topic.practice.quiz.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑主题问题-练习明细表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'topic.practice.quiz.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <TopicPracticeQuizForm ref="topicPracticeQuizRef" />
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
  createTopicPracticeQuizApi,
  removeTopicPracticeQuizApi,
  updateTopicPracticeQuizApi,
  getTopicPracticeQuizListApi,
  getTopicPracticeQuizDetailApi,
  importTopicPracticeQuizExcelApi,
  exportTopicPracticeQuizExcelApi,
} from '@/api/modules/ielts/topicPracticeQuiz';
import { useHandleData } from '@/hooks/useHandleData';
import TopicPracticeQuizForm from '@/views/ielts/topicPracticeQuiz/components/TopicPracticeQuizForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ITopicPracticeQuiz } from '@/api/interface/ielts/topicPracticeQuiz';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'TopicPracticeQuizView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<ITopicPracticeQuiz.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'topicPracticeId', label: '雅思主题练习记录表主键' },
  { prop: 'quizId', label: '问题主键' },
  { prop: 'audio', label: '本题答题音频' },
  { prop: 'evaluation', label: '本题评测结果' },
  { prop: 'result', label: '处理结果' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'topicPracticeId', label: '雅思主题练习记录表主键', el: 'input' },
  { prop: 'quizId', label: '问题主键', el: 'input' },
  { prop: 'audio', label: '本题答题音频', el: 'input' },
  { prop: 'evaluation', label: '本题评测结果', el: 'input' },
  { prop: 'result', label: '处理结果', el: 'input' },
]
// 获取table列表
const getTableList = (params: ITopicPracticeQuiz.Query) => {
  let newParams = formatParams(params);
  return getTopicPracticeQuizListApi(newParams);
};
const formatParams = (params: ITopicPracticeQuiz.Query) =>{
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
const topicPracticeQuizRef = ref<InstanceType<typeof TopicPracticeQuizForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getTopicPracticeQuizDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createTopicPracticeQuizApi : updateTopicPracticeQuizApi as any,
    getTableList: proTableRef.value?.getTableList
  }
  topicPracticeQuizRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ITopicPracticeQuiz.Row) => {
  await useHandleData(
    removeTopicPracticeQuizApi,
    { ids: [params.id] },
    `删除【${params.id}】主题问题-练习明细表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeTopicPracticeQuizApi, { ids }, '删除所选主题问题-练习明细表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '主题问题-练习明细表',
    templateName: '主题问题-练习明细表',
    tempApi: downloadTemplate,
    importApi: importTopicPracticeQuizExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ITopicPracticeQuiz.Query);
  useDownload(exportTopicPracticeQuizExcelApi, "主题问题-练习明细表", newParams);
};
</script>
