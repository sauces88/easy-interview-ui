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
      <el-form-item label="coze的会话Id" prop="sessionId">
        <el-input
          v-model="paramsProps.row.sessionId"
          placeholder="请填写coze的会话Id"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="公司id" prop="companyId">
        <el-input-number
          v-model="paramsProps.row.companyId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="角色id" prop="roleId">
        <el-input-number
          v-model="paramsProps.row.roleId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="最终评测结果" prop="feedback">
        <el-input
          v-model="paramsProps.row.feedback"
          placeholder="请填写最终评测结果"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="是否分享" prop="shareFlag">
        <el-input-number
          v-model="paramsProps.row.shareFlag" :precision="0" :min="1" :max="999999" />
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
    name: 'MockInterviewForm'
})

const rules = reactive({
  sessionId: [{ required: true, message: '请填写coze的会话Id' }],
  companyId: [{ required: true, message: '请填写公司id' }],
  roleId: [{ required: true, message: '请填写角色id' }],
  shareFlag: [{ required: true, message: '请填写是否分享' }],
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