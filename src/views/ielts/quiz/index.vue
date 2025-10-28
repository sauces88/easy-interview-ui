<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="雅思问题表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'quiz.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增雅思问题表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'quiz.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'quiz.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'quiz.export'"
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
          v-auth="'quiz.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑雅思问题表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'quiz.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <QuizForm ref="quizRef" />
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
  Download
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createQuizApi,
  removeQuizApi,
  updateQuizApi,
  getQuizListApi,
  getQuizDetailApi,
  importQuizExcelApi,
  exportQuizExcelApi,
} from '@/api/modules/ielts/quiz';
import { useHandleData } from '@/hooks/useHandleData';
import QuizForm from '@/views/ielts/quiz/components/QuizForm.vue';
import { useOptionsStore } from '@/stores/modules/options';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IQuiz } from '@/api/interface/ielts/quiz';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'QuizView'
})
const optionsStore = useOptionsStore();
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IQuiz.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'topic', label: '主题' },
  { prop: 'text', label: '问题' },
  { prop: 'audio', label: '音频' },
  { prop: 'tips', label: '答题思路' },
  { prop: 'tags', label: '标签' },
  { prop: 'source', label: '来源' },
  { prop: 'part',
    label: 'part',
    tag: true,
    enum: optionsStore.getDictOptions('ielts_part'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
  { prop: 'type',
    label: '类型',
    tag: true,
    enum: optionsStore.getDictOptions('ielts_type'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
  { prop: 'category',
    label: '分类',
    tag: true,
    enum: optionsStore.getDictOptions('ielts_category'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'topic', label: '主题', el: 'input' },
  { prop: 'tags', label: '标签', el: 'input' },
  { prop: 'source', label: '来源', el: 'input' },
  { prop: 'part',
    label: 'part',
    el: 'select',
    enum: optionsStore.getDictOptions('ielts_part'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
  { prop: 'type',
    label: '类型',
    el: 'select',
    enum: optionsStore.getDictOptions('ielts_type'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
  { prop: 'category',
    label: '分类',
    el: 'select',
    enum: optionsStore.getDictOptions('ielts_category'),
    fieldNames: {
      label: "codeName",
      value: "id",
      tagType: "callbackShowStyle"
    },
  },
]
// 获取table列表
const getTableList = (params: IQuiz.Query) => {
  let newParams = formatParams(params);
  return getQuizListApi(newParams);
};
const formatParams = (params: IQuiz.Query) =>{
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
const quizRef = ref<InstanceType<typeof QuizForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getQuizDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createQuizApi : updateQuizApi,
    getTableList: proTableRef.value?.getTableList
  }
  quizRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IQuiz.Row) => {
  await useHandleData(
    removeQuizApi,
    { ids: [params.id] },
    `删除【${params.id}】雅思问题表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeQuizApi, { ids }, '删除所选雅思问题表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '雅思问题表',
    templateName: '雅思问题表',
    tempApi: downloadTemplate,
    importApi: importQuizExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IQuiz.Query);
  useDownload(exportQuizExcelApi, "雅思问题表", newParams);
};

</script>
