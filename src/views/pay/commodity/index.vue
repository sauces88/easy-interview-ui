<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="商品表"
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
          v-auth="'commodity.create'"
          :icon="CirclePlus"
          @click="openAddEdit('新增商品表')"
        >
          新增
        </el-button>
        <el-button
          v-auth="'commodity.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          批量删除
        </el-button>
        <el-button
          v-auth="'commodity.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'commodity.export'"
          type="primary"
          :icon="Download"
          plain
          @click="downloadFile"
        >
          导出
        </el-button>
      </template>
      <template #type="{ row }">
        {{ typeOptions.find(item => item.value === row.type)?.label || row.type }}
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status ? 'success' : 'danger'">
          {{ row.status ? '上架' : '未上架' }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button
          v-auth="'commodity.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑商品表', row, false)"
        >
          编辑
        </el-button>
        <el-button
          v-auth="'commodity.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <CommodityForm ref="commodityRef" />
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
  createCommodityApi,
  removeCommodityApi,
  updateCommodityApi,
  getCommodityListApi,
  getCommodityDetailApi,
  importCommodityExcelApi,
  exportCommodityExcelApi,
} from '@/api/modules/pay/commodity';
import { useHandleData } from '@/hooks/useHandleData';
import CommodityForm from '@/views/pay/commodity/components/CommodityForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { ICommodity } from '@/api/interface/pay/commodity';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'CommodityView'
})
const proTableRef = ref<ProTableInstance>();
// 商品类型选项
const typeOptions = [
  { label: 'easy-interview', value: "0" },
  { label: 'speakx', value: "1" },
  { label: 'jinli', value: "2" }
]
// 发布状态选项
const statusOptions = [
  { label: '未上架', value: false },
  { label: '上架', value: true }
]
// 表格配置项
const columns: ColumnProps<ICommodity.Row>[] = [
  { type: 'selection', width: 60 },
  { prop: 'id', label: '#' , width: 80},
  { prop: 'name', label: '商品名称' },
  { prop: 'code', label: '商品代码（描述）' },
  { prop: 'type', label: '商品类型', enum: typeOptions },
  { prop: 'stock', label: '商品库存' },
  { prop: 'originalPrice', label: '原价(分)' },
  { prop: 'discountPrice', label: '折扣价(分)' },
  { prop: 'days', label: '订阅天数' },
  { prop: 'credits', label: '积分' },
  { prop: 'status', label: '发布状态', enum: statusOptions },
  { prop: 'remark', label: '备注' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'name', label: '商品名称', el: 'input' },
  { prop: 'code', label: '商品代码（描述）', el: 'input' },
  { prop: 'type', label: '商品类型', el: 'select', enum: typeOptions },
  { prop: 'status', label: '发布状态', el: 'select', enum: statusOptions },
]
// 获取table列表
const getTableList = (params: ICommodity.Query) => {
  let newParams = formatParams(params);
  return getCommodityListApi(newParams);
};
const formatParams = (params: ICommodity.Query) =>{
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
const commodityRef = ref<InstanceType<typeof CommodityForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getCommodityDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createCommodityApi : updateCommodityApi,
    getTableList: proTableRef.value?.getTableList
  }
  commodityRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: ICommodity.Row) => {
  await useHandleData(
    removeCommodityApi,
    { ids: [params.id] },
    `删除【${params.id}】商品表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeCommodityApi, { ids }, '删除所选商品表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '商品表',
    templateName: '商品表',
    tempApi: downloadTemplate,
    importApi: importCommodityExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as ICommodity.Query);
  useDownload(exportCommodityExcelApi, "商品表", newParams);
};
</script>
