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
      <el-form-item label="雅思主题练习记录表主键" prop="topicPracticeId">
        <el-input-number
          v-model="paramsProps.row.topicPracticeId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="问题主键" prop="quizId">
        <el-input-number
          v-model="paramsProps.row.quizId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="本题答题音频" prop="audio">
        <el-input
          v-model="paramsProps.row.audio"
          placeholder="请填写本题答题音频"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="本题评测结果" prop="evaluation">
        <el-input
          v-model="paramsProps.row.evaluation"
          placeholder="请填写本题评测结果"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="处理结果" prop="result">
        <el-input
          v-model="paramsProps.row.result"
          placeholder="请填写处理结果"
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
    name: 'TopicPracticeQuizForm'
})

const rules = reactive({
  topicPracticeId: [{ required: true, message: '请填写雅思主题练习记录表主键' }],
  quizId: [{ required: true, message: '请填写问题主键' }],
  audio: [{ required: true, message: '请填写本题答题音频' }],
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