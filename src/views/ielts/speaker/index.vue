<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="发音人表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button type="primary"
          v-auth="'speaker.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增发音人表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'speaker.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'speaker.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'speaker.export'"
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
          v-auth="'speaker.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑发音人表', row, false)"
        >
          编辑
        </el-button>
        <el-button
            v-auth="'speaker.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <SpeakerForm ref="speakerRef" />
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
  createSpeakerApi,
  removeSpeakerApi,
  updateSpeakerApi,
  getSpeakerListApi,
  getSpeakerDetailApi,
  importSpeakerExcelApi,
  exportSpeakerExcelApi,
} from '@/api/modules/ielts/speaker';
import { useHandleData } from '@/hooks/useHandleData';
import SpeakerForm from '@/views/ielts/speaker/components/SpeakerForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ISpeaker } from '@/api/interface/ielts/speaker';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'SpeakerView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<ISpeaker.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'name', label: '音色名称' },
  { prop: 'voiceType', label: '音色标识' },
  { prop: 'pitchRate', label: '音调,取值范围为 [-12, 12],(取值越大,音调越高)' },
  { prop: 'speechRate', label: '语速,取值范围为 [-50, 100],取值越大,语速越快,(100代表2.0倍速,-50 代表0.5倍速)' },
  { prop: 'audio', label: '试听音频' },
  { prop: 'description', label: '描述' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'name', label: '音色名称', el: 'input' },
  { prop: 'voiceType', label: '音色标识', el: 'select' },
  { prop: 'description', label: '描述', el: 'input' },
]
// 获取table列表
const getTableList = (params: ISpeaker.Query) => {
  let newParams = formatParams(params);
  return getSpeakerListApi(newParams);
};
const formatParams = (params: ISpeaker.Query) =>{
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
const speakerRef = ref<InstanceType<typeof SpeakerForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getSpeakerDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createSpeakerApi : updateSpeakerApi,
    getTableList: proTableRef.value?.getTableList
  }
  speakerRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ISpeaker.Row) => {
  await useHandleData(
    removeSpeakerApi,
    { ids: [params.id] },
    `删除【${params.id}】发音人表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeSpeakerApi, { ids }, '删除所选发音人表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '发音人表',
    templateName: '发音人表',
    tempApi: downloadTemplate,
    importApi: importSpeakerExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ISpeaker.Query);
  useDownload(exportSpeakerExcelApi, "发音人表", newParams);
};
</script>