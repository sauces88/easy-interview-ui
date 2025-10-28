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
      <el-form-item label="问题内容" prop="content">
        <el-input
          v-model="paramsProps.row.content"
          placeholder="请填写问题内容"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="问题内容(英文)" prop="contentUs">
        <el-input
          v-model="paramsProps.row.contentUs"
          placeholder="请填写问题内容(英文)"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-input
          v-model="paramsProps.row.tags"
          placeholder="请填写标签"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="标签(英文)" prop="tagsUs">
        <el-input
          v-model="paramsProps.row.tagsUs"
          placeholder="请填写标签(英文)"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="难度" prop="level">
        <el-input
          v-model="paramsProps.row.level"
          placeholder="请填写难度"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="关联公司id" prop="companyId">
        <el-input-number
          v-model="paramsProps.row.companyId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="关联所属角色id" prop="roleId">
        <el-input-number
          v-model="paramsProps.row.roleId" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number
          v-model="paramsProps.row.sort" :precision="0" :min="0" :max="999999" />
      </el-form-item>
      <el-form-item label="是否展示在题库" prop="isShow">
        <el-radio-group v-model="paramsProps.row.isShow">
          <el-radio label="T">是</el-radio>
          <el-radio label="F">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否用在模拟面试" prop="isEnabled">
        <el-radio-group v-model="paramsProps.row.isEnabled">
          <el-radio label="T">是</el-radio>
          <el-radio label="F">否</el-radio>
        </el-radio-group>
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
    name: 'QuestionForm'
})

const rules = reactive({
  tags: [{ required: true, message: '请填写标签' }],
  tagsUs: [{ required: true, message: '请填写标签(英文)' }],
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
  // 设置默认值
  if (!paramsProps.value.row.sort && paramsProps.value.row.sort !== 0) {
    paramsProps.value.row.sort = 0
  }
  if (!paramsProps.value.row.isShow) {
    paramsProps.value.row.isShow = 'T'
  }
  if (!paramsProps.value.row.isEnabled) {
    paramsProps.value.row.isEnabled = 'T'
  }
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