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
      <el-form-item :label="t('table.conversationId')" prop="conversationId">
        <el-input
          v-model="paramsProps.row.conversationId"
          :placeholder="t('interview.conversation.idPlaceholder')"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="消息列表" prop="messages">
        <el-input
          v-model="paramsProps.row.messages"
          placeholder="请填写消息列表"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="消息数量" prop="count">
        <el-input-number
          v-model="paramsProps.row.count" :precision="0" :min="1" :max="999999" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { type ElForm, ElMessage } from 'element-plus'

const { t } = useI18n()

defineOptions({
    name: 'ConversationMsgForm'
})

const rules = reactive({
  conversationId: [{ required: true, message: '请填写会话id' }],
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