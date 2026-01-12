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
      <el-form-item
        label="商品名称"
        prop="name"
      >
        <el-input
          v-model="paramsProps.row.name"
          placeholder="请填写商品名称"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="商品代码(描述)"
        prop="code"
      >
        <el-input
          v-model="paramsProps.row.code"
          placeholder="请填写商品代码（描述）"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="商品类型"
        prop="type"
      >
        <el-select
          v-model="paramsProps.row.type"
          clearable
          placeholder="请选择商品类型"
        >
          <el-option
            label="easy-interview"
            :value="0"
          />
          <el-option
            label="speakx"
            :value="1"
          />
          <el-option
            label="jinli"
            :value="2"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="商品库存"
        prop="stock"
      >
        <el-input-number
          v-model="paramsProps.row.stock"
          :precision="0"
          :min="-1"
          :max="999999"
        />
        <span style="margin-left: 8px; color: #909399; font-size: 12px">-1表示不限数量</span>
      </el-form-item>
      <el-form-item
        label="原价(分)"
        prop="originalPrice"
      >
        <el-input-number
          v-model="paramsProps.row.originalPrice"
          :precision="0"
          :min="0"
          :max="999999"
        />
      </el-form-item>
      <el-form-item
        label="折扣价(分)"
        prop="discountPrice"
      >
        <el-input-number
          v-model="paramsProps.row.discountPrice"
          :precision="0"
          :min="0"
          :max="999999"
        />
      </el-form-item>
      <el-form-item
        label="订阅天数"
        prop="days"
      >
        <el-input-number
          v-model="paramsProps.row.days"
          :precision="0"
          :min="0"
          :max="999999"
        />
      </el-form-item>
      <el-form-item
        label="积分"
        prop="credits"
      >
        <el-input-number
          v-model="paramsProps.row.credits"
          :precision="0"
          :min="0"
          :max="999999999"
        />
      </el-form-item>
      <el-form-item
        label="发布状态"
        prop="status"
      >
        <el-select
          v-model="paramsProps.row.status"
          clearable
          placeholder="请选择发布状态"
        >
          <el-option
            label="未上架"
            :value="false"
          />
          <el-option
            label="上架"
            :value="true"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="备注"
        prop="remark"
      >
        <el-input
          v-model="paramsProps.row.remark"
          placeholder="请填写备注"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        取消
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type ElForm, ElMessage } from 'element-plus'

defineOptions({
    name: 'CommodityForm'
})
const rules = reactive({
  name: [{ required: true, message: '请填写商品名称' }],
  code: [{ required: true, message: '请填写商品描述' }],
  type: [{ required: true, message: '请选择商品类型' }],
  stock: [{ required: true, message: '请填写商品库存' }],
  status: [{ required: true, message: '请选择发布状态' }],
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

  // 新增模式设置默认值
  if (!params.row.id) {
    if (params.row.stock === undefined) {
      params.row.stock = -1
    }
    if (params.row.originalPrice === undefined) {
      params.row.originalPrice = 0
    }
    if (params.row.discountPrice === undefined) {
      params.row.discountPrice = 0
    }
    if (params.row.days === undefined) {
      params.row.days = 0
    }
    if (params.row.credits === undefined) {
      params.row.credits = 0
    }
  }
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
