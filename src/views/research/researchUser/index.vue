<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="申研个人资料表"
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
          v-auth="'research.user.create'"
          :icon="CirclePlus"
          @click="openAddEdit('')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'research.user.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'research.user.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'research.user.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          导出
        </el-button>
      </template>
      <template #isPerfect="{ row }">
        <el-tag
          v-if="row.name"
          type="success"
        >
          已完善
        </el-tag>
        <el-tag
          v-else
          type="info"
        >
          待完善
        </el-tag>
      </template>
      <template #gender="{ row }">
        <span>{{ row.gender === true ? '男' : '女' }}</span>
      </template>
      <template #operation="{ row }">
        <el-button
          v-auth="'research.user.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('', row, false)"
        >
          编辑&分配
        </el-button>
        <el-button
          v-auth="'research.user.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ResearchUserForm ref="researchUserRef" />
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
  createResearchUserApi,
  removeResearchUserApi,
  updateResearchUserApi,
  getResearchUserListApi,
  getResearchUserDetailApi,
  importResearchUserExcelApi,
  exportResearchUserExcelApi,
} from '@/api/modules/research/researchUser';
import { useHandleData } from '@/hooks/useHandleData';
import ResearchUserForm from '@/views/research/researchUser/components/ResearchUserForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IResearchUser } from '@/api/interface/research/researchUser';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'ResearchUserView'
})
const proTableRef = ref<ProTableInstance>();
// 表格配置项
const columns: ColumnProps<IResearchUser.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'userName', label: '用户名', width: 180},
  { prop: 'name', label: '姓名',width: 180},
  { prop: 'age', label: '年龄',width: 100 },
  { prop: 'gender', label: '性别' ,width: 100 },
  { prop: 'education', label: '教育经历'},
  { prop: 'isPerfect', label: '是否完善', width: 120 },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'userId', label: '用户id', el: 'input' },
  { prop: 'name', label: '姓名', el: 'input' },
]
// 获取table列表
const getTableList = (params: IResearchUser.Query) => {
  let newParams = formatParams(params);
  return getResearchUserListApi(newParams);
};
const formatParams = (params: IResearchUser.Query) =>{
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
const researchUserRef = ref<InstanceType<typeof ResearchUserForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getResearchUserDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createResearchUserApi : updateResearchUserApi,
    getTableList: proTableRef.value?.getTableList
  }
  researchUserRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IResearchUser.Row) => {
  await useHandleData(
    removeResearchUserApi,
    { ids: [params.id] },
    `删除【${params.id}】申研个人资料表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeResearchUserApi, { ids }, '删除所选申研个人资料表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '申研个人资料表',
    templateName: '申研个人资料表',
    tempApi: downloadTemplate,
    importApi: importResearchUserExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IResearchUser.Query);
  useDownload(exportResearchUserExcelApi, "申研个人资料表", newParams);
};
</script>
