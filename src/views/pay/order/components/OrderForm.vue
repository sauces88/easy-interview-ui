<template>
  <el-dialog
    v-model="visible"
    :title="`${paramsProps.title}`"
    :destroy-on-close="true"
    width="580px"
    draggable
  >
    <el-form
      ref="ruleFormRef"
      label-width="140px"
      label-suffix=" :"
      :rules="rules"
      :model="paramsProps.row"
      @submit.enter.prevent="handleSubmit"
    >
      <el-form-item label="商品ID" prop="commodityId">
        <el-input-number
          v-model="paramsProps.row.commodityId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="支付通道" prop="payChannel">
        <el-select v-model="paramsProps.row.payChannel" clearable placeholder="请选择支付通道">
          <el-option label="支付宝" value="A" />
          <el-option label="微信" value="W" />
          <el-option label="云闪付" value="UNS" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付货币" prop="currencyType">
        <el-select v-model="paramsProps.row.currencyType" clearable placeholder="请选择支付货币">
          <el-option label="人民币" value="CNY" />
          <el-option label="加币" value="CAD" />
          <el-option label="美元" value="USD" />
        </el-select>
      </el-form-item>
      <el-form-item label="实际支付价(单位:分)" prop="payPrice">
        <el-input-number
          v-model="paramsProps.row.payPrice" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="支付时间" prop="payTime">
        <el-date-picker clearable
          v-model="paramsProps.row.payTime"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="请选择支付时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="购买者" prop="purchaser">
        <el-input-number
          v-model="paramsProps.row.purchaser" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="订单异常时的信息" prop="error">
        <el-input
          v-model="paramsProps.row.error"
          placeholder="请填写订单异常时的信息"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="paramsProps.row.status" clearable placeholder="请选择状态">
          <el-option label="支付成功" value="SUCCESS" />
          <el-option label="已退款" value="REFUND" />
          <el-option label="未支付" value="NOTPAY" />
          <el-option label="已关闭" value="CLOSED" />
          <el-option label="用户支付中" value="USERPAYING" />
          <el-option label="支付失败" value="PAYERROR" />
          <el-option label="订单异常" value="EXCEPTION" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="paramsProps.row.remark"
          placeholder="请填写备注"
          clearable
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false"> 取消</el-button>
      <el-button type="primary" @click="handleSubmit"> 确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type ElForm, ElMessage } from 'element-plus'
import { useOptionsStore } from '@/stores/modules/options'

defineOptions({
    name: 'OrderForm'
})

const optionsStore = useOptionsStore()
const rules = reactive({
  commodityId: [{ required: true, message: '请选择商品ID' }],
  payChannel: [{ required: true, message: '请选择支付通道' }],
  currencyType: [{ required: true, message: '请选择支付货币' }],
  purchaser: [{ required: true, message: '请填写购买者' }],
  status: [{ required: true, message: '请选择状态' }],
})

const visible = ref(false)
const paramsProps = ref<View.DefaultParams>({
  title: '',
  row: {},
  api: undefined,
  getTableList: undefined
})

// 接收父组件传过来的参数
const acceptParams = (params: View.DefaultParams) => {
  paramsProps.value = params
  visible.value = true
}

// 提交数据（新增/编辑）
const ruleFormRef = ref<InstanceType<typeof ElForm>>()
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return
    try {
      await paramsProps.value.api!(paramsProps.value.row)
      ElMessage.success({ message: `${paramsProps.value.title}成功！` })
      paramsProps.value.getTableList!()
      visible.value = false
    } catch (error) {
      console.log(error)
    }
  })
}

defineExpose({
  acceptParams
})
</script>

<style scoped lang="scss"></style>