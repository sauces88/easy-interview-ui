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
      <el-form-item label="主题" prop="topic">
        <el-input
            v-model="paramsProps.row.topic"
            placeholder="请填写主题"
            clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="问题" prop="text">
        <el-input
          v-model="paramsProps.row.text"
          placeholder="请填写问题"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="音频" prop="audio">
        <el-input
          v-model="paramsProps.row.audio"
          placeholder="请填写音频"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="答题思路" prop="tips">
        <el-input
          v-model="paramsProps.row.tips"
          placeholder="请填写答题思路"
          :rows="2"
          type="textarea"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="标签（例：新题）" prop="tags">
        <el-input
          v-model="paramsProps.row.tags"
          placeholder="请填写标签（例：新题）"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="来源" prop="source">
        <el-input
          v-model="paramsProps.row.source"
          placeholder="请填写来源"
          clearable
        ></el-input>
      </el-form-item>
      <el-form-item label="part" prop="part">
        <el-select v-model="paramsProps.row.part" clearable placeholder="请选择Part">
          <el-option
              v-for="item in optionsStore.getDictOptions('ielts_part')"
              :key="item.id"
              :label="item.codeName"
              :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="类型" prop="type">
        <el-select v-model="paramsProps.row.type" clearable placeholder="请选择类型">
          <el-option
            v-for="item in optionsStore.getDictOptions('ielts_type')"
            :key="item.id"
            :label="item.codeName"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="分类" prop="category">
        <el-select v-model="paramsProps.row.category" clearable placeholder="请选择分类">
          <el-option
            v-for="item in optionsStore.getDictOptions('ielts_category')"
            :key="item.id"
            :label="item.codeName"
            :value="item.id"
          />
        </el-select>
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
    name: 'QuizForm'
})

const optionsStore = useOptionsStore()
const rules = reactive({
  text: [{ required: true, message: '请填写问题' }],
  audio: [{ required: true, message: '请填写音频' }],
  part: [{ required: true, message: '请填写part' }],
  type: [{ required: true, message: '请填写类型' }],
  category: [{ required: true, message: '请填写分类' }],
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
