<template>
  <el-dialog
    v-model="visible"
    :title="`${paramsProps.title}`"
    :destroy-on-close="true"
    width="800px"
    draggable
  >
    <el-form
      ref="ruleFormRef"
      label-width="90px"
      label-suffix=" :"
      :rules="rules"
      :model="paramsProps.row"
      @submit.enter.prevent="handleSubmit"
    >
      <el-form-item label="题目内容" prop="content">
        <el-input
          v-model="paramsProps.row.content"
          type="textarea"
          :rows="5"
          :autosize="{ minRows: 5, maxRows: 10 }"
          placeholder="请输入题目内容"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="题目类型" prop="type">
        <el-input
          v-model="paramsProps.row.type"
          placeholder="请输入题目类型"
          clearable
        />
      </el-form-item>

      <el-form-item label="引导提示" prop="tips">
        <el-input
          v-model="paramsProps.row.tips"
          type="textarea"
          :rows="3"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="请输入引导提示，帮助受访者更好地理解和回答问题"
        />
      </el-form-item>

      <el-form-item label="考察方向" prop="target">
        <el-input
          v-model="paramsProps.row.target"
          type="textarea"
          :rows="3"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="请输入考察方向"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type ElForm, ElMessage } from 'element-plus'

defineOptions({
    name: 'ResearchQuestionForm'
})

const rules = reactive({
  type: [{ required: true, message: '请输入题目类型' }],
  content: [{ required: true, message: '请输入题目内容' }],
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