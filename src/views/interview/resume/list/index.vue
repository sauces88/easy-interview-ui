<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('interview.resume.title')"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
      :key="i18nKey"
    >
      <template #tableHeader="scope">
        <el-button
          v-auth="'resume.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          {{ t('table.import') }}
        </el-button>
        <el-button
          v-auth="'resume.export'"
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
          v-auth="'resume.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑简历表', row, false)"
        >
        {{ t('common.edit') }}
        </el-button>
      </template>
      <!-- 添加 url 列的自定义渲染 -->
      <template #url="{ row }">
        <el-link
          type="primary"
          :href="row.url"
          target="_blank"
          :underline="false"
        >
          {{ t('interview.resume.view') }}
        </el-link>
      </template>
    </ProTable>
    <ResumeForm ref="resumeRef" />
    <ImportExcel ref="ImportExcelRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Delete,
  EditPen,
  Upload,
  Download,
} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {
  createResumeApi,
  removeResumeApi,
  updateResumeApi,
  getResumeListApi,
  getResumeDetailApi,
  importResumeExcelApi,
  exportResumeExcelApi,
} from '@/api/modules/interview/resume';
import { useHandleData } from '@/hooks/useHandleData';
import ResumeForm from '@/views/interview/resume/components/ResumeForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IResume } from '@/api/interface/interview/resume';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// 添加一个响应式变量作为组件的key，当语言变化时强制重新渲染
const i18nKey = computed(() => locale.value)

const proTableRef = ref<ProTableInstance>();

// 使用 computed 让列配置变成响应式的，但保持原始的 prop 名称不变
const columns = computed<ColumnProps<IResume.Row>[]>(() => [
  { type: 'selection' as const, width: 80 },
  { prop: 'id', label: t('table.index'), width: 80 },
  { prop: 'text', label: t('table.content') },
  { prop: 'createId', label: t('table.createId'), width: 100 },
  { prop: 'url', label: t('table.file'), width: 120 },
  { prop: 'operation', label: t('table.operation'), width: 250, fixed: 'right' }
]);

// 搜索条件
const searchColumns = computed<SearchProps[]>(() => [
  { prop: 'text', label: t('table.text'), el: 'input' as const },
]);

// 获取table列表
const getTableList = (params: IResume.Query) => {
  let newParams = formatParams(params);
  return getResumeListApi(newParams);
};
const formatParams = (params: IResume.Query) =>{
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
const resumeRef = ref<InstanceType<typeof ResumeForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getResumeDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createResumeApi : updateResumeApi,
    getTableList: proTableRef.value?.getTableList
  }
  resumeRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IResume.Row) => {
  await useHandleData(
    removeResumeApi,
    { ids: [params.id] },
    `删除【${params.id}】简历表`
  )
  proTableRef.value?.getTableList()
}

// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '简历表',
    templateName: '简历表',
    tempApi: downloadTemplate,
    importApi: importResumeExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IResume.Query);
  useDownload(exportResumeExcelApi, "简历表", newParams);
};
</script>
