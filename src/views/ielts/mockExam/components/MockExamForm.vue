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
        label="状态"
        prop="status"
      >
        <el-select
          v-model="paramsProps.row.status"
          clearable
          placeholder="请选择状态"
        >
          <el-option
            v-for="item in optionsStore.getDictOptions('')"
            :key="item.id"
            :label="item.codeName"
            :value="Number(item.id)"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="评测结果"
        prop="evaluation"
      >
        <el-input
          v-model="paramsProps.row.evaluation"
          placeholder="请填写评测结果"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="评语"
        prop="comment"
      >
        <el-input
          v-model="paramsProps.row.comment"
          placeholder="请填写评语"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="对话记录"
        prop="chats"
      >
        <el-input
          v-model="paramsProps.row.chats"
          placeholder="请填写对话记录"
          clearable
        />
      </el-form-item>
      <el-form-item
        label="处理结果"
        prop="result"
      >
        <el-input
          v-model="paramsProps.row.result"
          placeholder="请填写处理结果"
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
import { useOptionsStore } from '@/stores/modules/options'

defineOptions({
    name: 'MockExamForm'
})

const optionsStore = useOptionsStore()
const rules = reactive({
  status: [{ required: true, message: '请填写状态' }],
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
