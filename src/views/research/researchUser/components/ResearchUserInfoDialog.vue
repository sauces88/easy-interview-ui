<template>
  <el-dialog
    v-model="visible"
    :close-on-click-modal="allowCancel"
    :close-on-press-escape="allowCancel"
    :show-close="false"
    width="600px"
    fullscreen
    destroy-on-close
  >
    <div class="research-user-info-container">
      <div class="form-header">
        <button
          v-if="allowCancel"
          class="close-btn"
          @click="visible = false"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <h2>请完善个人信息</h2>
        <p>为了给您提供更好的服务体验，请填写以下信息</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        size="large"
        class="info-form"
      >
        <div class="form-row">
          <el-form-item
            label="姓名"
            prop="name"
          >
            <el-input
              v-model="formData.name"
              placeholder="请输入姓名"
              clearable
            />
          </el-form-item>

          <el-form-item
            label="年龄"
            prop="age"
          >
            <el-input-number
              v-model="formData.age"
              :min="1"
              :max="150"
              controls-position="right"
              placeholder="请输入年龄"
            />
          </el-form-item>

          <el-form-item
            label="性别"
            prop="gender"
          >
            <el-radio-group v-model="formData.gender">
              <el-radio :value="true">
                男
              </el-radio>
              <el-radio :value="false">
                女
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item
          label="邮箱"
          prop="email"
        >
          <el-input
            v-model="formData.email"
            placeholder="测评生成的评估报告会发送到该邮箱."
            clearable
          />
        </el-form-item>

        <el-form-item
          label="教育经历"
          prop="education"
        >
          <el-input
            v-model="formData.education"
            type="textarea"
            :rows="5"
            placeholder="请描述您的教育背景，如：本科毕业于XX大学XX专业"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          label="工作履历"
          prop="work"
        >
          <el-input
            v-model="formData.work"
            type="textarea"
            :rows="5"
            placeholder="请描述您的工作经历，如：曾任职于XX公司XX岗位"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item
          label="学习目标"
          prop="goal"
        >
          <el-input
            v-model="formData.goal"
            type="textarea"
            :rows="5"
            placeholder="请描述您的学习目标和期望，如：提升XX技能，达到XX水平"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="handleSubmit"
          round
        >
          <span v-if="!loading">提交信息</span>
          <span v-else>提交中...</span>
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { type ElForm, ElMessage } from 'element-plus'
import { updateResearchUserApi, getCurrentResearchUserDetailApi } from '@/api/modules/research/researchUser'
import type { IResearchUser } from '@/api/interface/research/researchUser'

const visible = ref(false)
const loading = ref(false)
const allowCancel = ref(false)
const formRef = ref<InstanceType<typeof ElForm>>()

const formData = reactive<IResearchUser.Form>({
  id: undefined,
  name: '',
  email: '',
  age: 18,
  gender: true,
  education: '',
  work: '',
  goal: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  email: [{ type: 'email' as const, message: '请输入正确的邮箱格式', trigger: 'blur' }],
  education: [{ required: true, message: '请输入教育经历', trigger: 'blur' }],
  work: [{ required: true, message: '请输入工作履历', trigger: 'blur' }],
  goal: [{ required: true, message: '请输入学习目标', trigger: 'blur' }]
}

// 打开对话框
const open = async (canCancel = false) => {
  allowCancel.value = canCancel

  // 先获取当前用户的数据，填充id和已有信息
  try {
    const { data } = await getCurrentResearchUserDetailApi()
    if (data && data.id) {
      formData.id = data.id
      formData.name = data.name || ''
      formData.email = data.email || ''
      formData.age = data.age || 18
      formData.gender = typeof data.gender === 'boolean' ? data.gender : true
      formData.education = data.education || ''
      formData.work = data.work || ''
      formData.goal = data.goal || ''
    }
  } catch (error) {
    // 如果获取失败，保持默认值
    console.error('获取用户信息失败', error)
  }

  visible.value = true
}

// 提交表单
const handleSubmit = () => {
  if (!formRef.value) return

  formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await updateResearchUserApi(formData)
      ElMessage.success('信息提交成功！')
      visible.value = false
      // 通知父组件提交成功
      emits('success')
    } catch (error: any) {
      ElMessage.error(error.message || '提交失败，请重试')
    } finally {
      loading.value = false
    }
  })
}

const emits = defineEmits<{
  success: []
}>()

defineExpose({
  open
})
</script>

<style scoped lang="scss">
:deep(.el-dialog__body) {
  padding: 0;
  background: #f5f5f5;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.research-user-info-container {
  max-width: 720px;
  width: 100%;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-header {
  background: #fff;
  padding: 32px 40px 24px;
  border-bottom: 1px solid #e8e8e8;
  position: relative;

  .close-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    background: #fff;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      border-color: #333;
      color: #333;
    }

    &:active {
      background: #f5f5f5;
    }
  }

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }
}

.info-form {
  padding: 32px 40px;

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #333;
  }

  :deep(.el-input__wrapper) {
    border-radius: 4px;
    box-shadow: none;
    border: 1px solid #d9d9d9;
    transition: border-color 0.2s;

    &:hover {
      border-color: #999;
    }

    &.is-focus {
      border-color: #333;
      box-shadow: none;
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 4px;
    border: 1px solid #d9d9d9;
    box-shadow: none;
    padding: 12px;
    line-height: 1.6;
    transition: border-color 0.2s;

    &:hover {
      border-color: #999;
    }

    &:focus {
      border-color: #333;
      box-shadow: none;
    }
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      width: 100%;
    }
  }

  :deep(.el-radio) {
    margin-right: 20px;

    .el-radio__label {
      font-size: 14px;
      color: #333;
    }
  }

  :deep(.el-radio__input.is-checked + .el-radio__label) {
    color: #1a1a1a;
  }

  :deep(.el-radio__input.is-checked .el-radio__inner) {
    background-color: #1a1a1a;
    border-color: #1a1a1a;
  }
}

.form-footer {
  padding: 16px 40px 32px;
  text-align: center;

  .el-button {
    min-width: 160px;
    height: 44px;
    font-size: 15px;
    font-weight: 500;
    background: #1a1a1a;
    border: none;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover {
      background: #333;
    }

    &:active {
      background: #000;
    }
  }
}

// 响应式设计
@media screen and (max-width: 768px) {
  .research-user-info-container {
    margin: 16px;
    border-radius: 4px;
  }

  .form-header {
    padding: 24px 20px 16px;

    h2 {
      font-size: 18px;
    }
  }

  .info-form {
    padding: 24px 20px;

    .form-row {
      grid-template-columns: 1fr;
      gap: 0;
      margin-bottom: 0;

      :deep(.el-form-item) {
        margin-bottom: 18px;
      }
    }
  }

  .form-footer {
    padding: 16px 20px 24px;

    .el-button {
      width: 100%;
    }
  }
}
</style>
