<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="订单表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-auth="'order.import'"
          type="primary"
          :icon="Upload"
          plain
          @click="importData"
        >
          导入
        </el-button>
        <el-button
          v-auth="'order.export'"
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
          v-auth="'order.update'"
          type="primary"
          link
          :icon="EditPen"
          @click="openAddEdit('编辑订单表', row, false)"
        >
          编辑
        </el-button>
      </template>
    </ProTable>
    <OrderForm ref="orderRef" />
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
  createOrderApi,
  removeOrderApi,
  updateOrderApi,
  getOrderListApi,
  getOrderDetailApi,
  importOrderExcelApi,
  exportOrderExcelApi,
} from '@/api/modules/pay/order';
import { useHandleData } from '@/hooks/useHandleData';
import OrderForm from '@/views/pay/order/components/OrderForm.vue';
import type { ColumnProps, ProTableInstance, SearchProps } from '@/components/ProTable/interface';
import type { IOrder } from '@/api/interface/pay/order';
import ImportExcel from '@/components/ImportExcel/index.vue';
import { downloadTemplate } from '@/api/modules/system/common';
import { ElMessageBox } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
defineOptions({
  name: 'OrderView'
})
const proTableRef = ref<ProTableInstance>();
// 支付通道选项
const payChannelOptions = [
  { label: '支付宝', value: 'A' },
  { label: '微信', value: 'W' },
  { label: '云闪付', value: 'UNS' }
]
// 支付货币选项
const currencyTypeOptions = [
  { label: '人民币', value: 'CNY' },
  { label: '加币', value: 'CAD' },
  { label: '美元', value: 'USD' }
]
// 支付状态选项
const statusOptions = [
  { label: '支付成功', value: 'SUCCESS' },
  { label: '已退款', value: 'REFUND' },
  { label: '未支付', value: 'NOTPAY' },
  { label: '已关闭', value: 'CLOSED' },
  { label: '用户支付中', value: 'USERPAYING' },
  { label: '支付失败', value: 'PAYERROR' },
  { label: '订单异常', value: 'EXCEPTION' }
]
// 表格配置项
const columns: ColumnProps<IOrder.Row>[] = [
  { type: 'selection', width: 80 },
  { prop: 'commodityId', label: '商品ID' },
  { prop: 'payChannel', label: '支付通道', enum: payChannelOptions },
  { prop: 'currencyType', label: '支付货币', enum: currencyTypeOptions },
  { prop: 'payPrice', label: '实际支付价(分)' },
  { prop: 'payTime', label: '支付时间' },
  { prop: 'purchaser', label: '购买者' },
  { prop: 'error', label: '订单异常时的信息' },
  { prop: 'status', label: '状态', enum: statusOptions },
  { prop: 'remark', label: '备注' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'payChannel', label: '支付通道', el: 'select', enum: payChannelOptions },
  { prop: 'currencyType', label: '支付货币', el: 'select', enum: currencyTypeOptions },
  { prop: 'status', label: '状态', el: 'select', enum: statusOptions },
]
// 获取table列表
const getTableList = (params: IOrder.Query) => {
  let newParams = formatParams(params);
  return getOrderListApi(newParams);
};
const formatParams = (params: IOrder.Query) =>{
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.payTime && (newParams.payTimeStart = newParams.payTime[0]);
  newParams.payTime && (newParams.payTimeEnd = newParams.payTime[1]);
  delete newParams.payTime;
  newParams.createTime && (newParams.createTimeStart = newParams.createTime[0]);
  newParams.createTime && (newParams.createTimeEnd = newParams.createTime[1]);
  delete newParams.createTime;
  newParams.updateTime && (newParams.updateTimeStart = newParams.updateTime[0]);
  newParams.updateTime && (newParams.updateTimeEnd = newParams.updateTime[1]);
  delete newParams.updateTime;
  return newParams;
}
// 打开 drawer(新增、查看、编辑)
const orderRef = ref<InstanceType<typeof OrderForm>>()
const openAddEdit = async(title: string, row: any = {}, isAdd = true) => {
  if (!isAdd) {
    const record = await getOrderDetailApi({ id: row?.id })
    row = record?.data
  }
  const params = {
    title,
    row: { ...row },
    api: isAdd ? createOrderApi : updateOrderApi,
    getTableList: proTableRef.value?.getTableList
  }
  orderRef.value?.acceptParams(params)
}
// 删除信息
const deleteInfo = async (params: IOrder.Row) => {
  await useHandleData(
    removeOrderApi,
    { ids: [params.id] },
    `删除【${params.id}】订单表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeOrderApi, { ids }, '删除所选订单表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}
// 导入
const ImportExcelRef = ref<InstanceType<typeof ImportExcel>>()
const importData = () => {
  const params = {
    title: '订单表',
    templateName: '订单表',
    tempApi: downloadTemplate,
    importApi: importOrderExcelApi,
    getTableList: proTableRef.value?.getTableList
  }
  ImportExcelRef.value?.acceptParams(params)
}
// 导出
const downloadFile = async () => {
  let newParams = formatParams(proTableRef.value?.searchParam as IOrder.Query);
  useDownload(exportOrderExcelApi, "订单表", newParams);
};
</script>
