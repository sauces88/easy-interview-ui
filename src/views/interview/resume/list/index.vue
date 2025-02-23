<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="简历表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <template #tableHeader="scope">
        <el-button
          v-auth="'resume.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'resume.export'"
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
          v-auth="'resume.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑简历表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'resume.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
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
          查看简历
        </el-link>
      </template>
    </ProTable>
    <ResumeForm ref="resumeRef" />
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

defineOptions({
  name: 'ResumeView'
})

const proTableRef = ref<ProTableInstance>();

// 表格配置项
const columns: ColumnProps<IResume.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '主键', width: 80 },
  { prop: 'text', label: '文本内容' },
  { prop: 'createId', label: '创建人', width: 100 },
  { prop: 'url', label: '简历文件', width: 120 },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'url', label: '文件地址', el: 'input' },
  { prop: 'text', label: '文本内容', el: 'input' },
]
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
