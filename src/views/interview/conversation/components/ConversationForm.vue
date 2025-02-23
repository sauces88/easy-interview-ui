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
      <el-form-item label="智能体id" prop="botId">
        <el-input
          v-model="paramsProps.row.botId"
          placeholder="请填写智能体id"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="会话id" prop="conversationId">
        <el-input
          v-model="paramsProps.row.conversationId"
          placeholder="请填写会话id"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="是否完结（0=未完结,1=已完结）" prop="completed">
        <el-input-number
          v-model="paramsProps.row.completed" :precision="0" :min="1" :max="999999" />
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

defineOptions({
    name: 'ConversationForm'
})

const rules = reactive({
  botId: [{ required: true, message: '请填写智能体id' }],
  conversationId: [{ required: true, message: '请填写会话id' }],
  completed: [{ required: true, message: '请填写是否完结（0=未完结,1=已完结）' }],
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