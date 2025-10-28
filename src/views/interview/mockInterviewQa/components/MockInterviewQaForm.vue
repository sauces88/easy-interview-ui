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
      <el-form-item label="模拟面试id" prop="mockInterviewId">
        <el-input-number
          v-model="paramsProps.row.mockInterviewId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="问题id" prop="questionId">
        <el-input-number
          v-model="paramsProps.row.questionId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="录音文件url" prop="url">
        <el-input
          v-model="paramsProps.row.url"
          placeholder="请填写录音文件url"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="录音文件时长(s)" prop="duration">
        <el-input-number
          v-model="paramsProps.row.duration" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="回答内容" prop="content">
        <el-input
          v-model="paramsProps.row.content"
          placeholder="请填写回答内容"
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

defineOptions({
    name: 'MockInterviewQaForm'
})

const rules = reactive({
  mockInterviewId: [{ required: true, message: '请填写模拟面试id' }],
  questionId: [{ required: true, message: '请填写问题id' }],
  url: [{ required: true, message: '请填写录音文件url' }],
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