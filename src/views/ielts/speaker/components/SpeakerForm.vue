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
      <el-form-item label="音色名称" prop="name">
        <el-input
          v-model="paramsProps.row.name"
          placeholder="请填写音色名称"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="音色标识" prop="voiceType">
        <el-select v-model="paramsProps.row.voiceType" clearable placeholder="请选择音色标识">
          <el-option
            v-for="item in optionsStore.getDictOptions('')"
            :key="item.id"
            :label="item.codeName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="音调,取值范围为 [-12, 12],(取值越大,音调越高)" prop="pitchRate">
        <el-input-number
          v-model="paramsProps.row.pitchRate" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="语速,取值范围为 [-50, 100],取值越大,语速越快,(100代表2.0倍速,-50 代表0.5倍速)" prop="speechRate">
        <el-input-number
          v-model="paramsProps.row.speechRate" :precision="0" :min="1" :max="999999" />
      </el-form-item>
      <el-form-item label="试听音频" prop="audio">
        <el-input
          v-model="paramsProps.row.audio"
          placeholder="请填写试听音频"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="paramsProps.row.description"
          placeholder="请填写描述"
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
    name: 'SpeakerForm'
})

const optionsStore = useOptionsStore()
const rules = reactive({
  name: [{ required: true, message: '请填写音色名称' }],
  voiceType: [{ required: true, message: '请填写音色标识' }],
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