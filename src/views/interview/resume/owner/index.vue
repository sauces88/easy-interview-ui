<template>
  <div class="resume-container">
    <el-row :gutter="20">
      <!-- 左侧预览卡片 -->
      <el-col :span="12">
        <el-card class="preview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ t('interview.resume.preview') }}</span>
            </div>
          </template>
          <div class="preview-content">
            <pdf-preview v-if="resumeData.url" :url="resumeData.url"></pdf-preview>
            <el-empty v-else :description="t('interview.resume.noFile')">
              <el-button type="primary" @click="openUploadDialog">{{ t('interview.resume.upload') }}</el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧编辑卡片 -->
      <el-col :span="12">
        <el-card class="edit-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>{{ t('interview.resume.edit') }}</span>
              <div class="header-actions">
                <el-button
                  v-if="hasResume"
                  type="primary"
                  @click="saveResume"
                  :loading="saving"
                >
                  {{ t('interview.resume.save') }}
                </el-button>
              </div>
            </div>
          </template>
          <div class="edit-content">
            <el-form :model="resumeData" label-position="top">
              <el-form-item class="content-item">
                <el-input
                  v-model="resumeData.text"
                  type="textarea"
                  :rows="20"
                  :disabled="!hasResume"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      :title="t('interview.resume.upload')"
      width="500px"
      destroy-on-close
      :close-on-click-modal="false"
    >
      <div class="upload-wrapper">
        <div class="upload-area">
          <el-upload
            class="upload-demo"
            drag
            ref="uploadRef"
            :auto-upload="false"
            :headers="headers"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            :limit="1"
            accept=".pdf,.doc,.docx"
          >
            <div class="upload-icon">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            </div>
            <div class="el-upload__text">
              {{ t('interview.resume.dropFiles') }} <em>{{ t('interview.resume.clickUpload') }}</em>
            </div>
          </el-upload>
          <div class="el-upload__tip">
            {{ t('interview.resume.uploadTip') }}
          </div>
        </div>
        <div class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">{{ t('interview.resume.submit') }}</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { type ElForm, ElMessage, type UploadUserFile } from 'element-plus'
import { getCurrentUserResumeDetailApi, updateResumeApi, createResumeApi } from '@/api/modules/interview/resume'
import type { IResume } from '@/api/interface/interview/resume'
import { useUserStore } from '@/stores/modules/user'
import PdfPreview from '@/components/PdfPreview/index.vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const userStore = useUserStore()

const rules = reactive({
  text: [{ required: true, message: t('interview.resume.contentRequired'), trigger: 'blur' }],
})

const resumeData = ref<IResume.Row>({
  url: '',
  text: '',
  id: undefined
})

const ruleFormRef = ref<InstanceType<typeof ElForm>>()

// 判断是否有简历
const hasResume = computed(() => {
  return Boolean(resumeData.value.url && resumeData.value.id)
})

// 跟踪文本是否被修改
const isTextModified = ref(false)
const initialText = ref('')

// 监听文本内容变化
watch(() => resumeData.value.text, (newVal) => {
  if (newVal !== initialText.value) {
    isTextModified.value = true
  } else {
    isTextModified.value = false
  }
})

// 获取当前用户简历数据
const fetchResumeData = async () => {
  try {
    const { data } = await getCurrentUserResumeDetailApi()
    if (data && Object.keys(data).length > 0) {
      resumeData.value = data
      initialText.value = data.text || ''  // 记录初始文本
      isTextModified.value = false  // 重置修改状态
    } else {
      ElMessage.info({
        message: t('interview.resume.pleaseUploadFirst'),
        duration: 2500,
        showClose: true
      })
    }
  } catch (error) {
    console.error('获取简历数据异常：', error)
    ElMessage.error(t('common.systemError'))
  }
}

// 提交数据
const handleSubmit = () => {
  ruleFormRef.value!.validate(async (valid) => {
    if (!valid) return
    try {
      await updateResumeApi({
        ...resumeData.value,
        userId: userStore.userInfo.id
      })
      ElMessage.success(t('interview.resume.saveSuccess'))
      initialText.value = resumeData.value.text || ''  // 更新初始文本
      isTextModified.value = false  // 重置修改状态
    } catch (error) {
      console.error('保存失败：', error)
      ElMessage.error(t('interview.resume.saveError'))
    }
  })
}

// 上传相关
const uploadDialogVisible = ref(false)
const fileList = ref<UploadUserFile[]>([])
const uploadRef = ref()
const uploading = ref(false)

const openUploadDialog = () => {
  uploadDialogVisible.value = true
  fileList.value = []
}

// 处理文件变化
const handleFileChange = (file: UploadUserFile) => {
  if (file) {
    fileList.value = [file]
  }
}

// 提交上传
const submitUpload = async () => {
  if (!fileList.value?.length || !fileList.value[0].raw) {
    ElMessage.warning(t('interview.resume.pleaseSelectFile'))
    return
  }

  uploading.value = true
  try {
    await createResumeApi(fileList.value[0].raw)
    ElMessage.success(t('interview.resume.uploadSuccess'))
    uploadDialogVisible.value = false
    fileList.value = []
    fetchResumeData() // 重新获取数据
  } catch (error) {
    console.error('上传失败：', error)
    ElMessage.error(t('interview.resume.uploadError'))
  } finally {
    uploading.value = false
  }
}

// 上传相关变量
const saving = ref(false)
const headers = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 处理文件上传
// const handleUploadSuccess = (response: any) => {
//   if (response.code === 200) {
//     ElMessage.success(t('interview.resume.uploadSuccess'))
//     uploadDialogVisible.value = false
//     fetchResumeData()
//   } else {
//     ElMessage.error(response.msg || t('interview.resume.uploadError'))
//   }
// }

// const handleUploadError = (error: any) => {
//   console.error('上传失败：', error)
//   ElMessage.error(t('interview.resume.uploadError'))
// }

const beforeUpload = (file: File) => {
  const isValidType = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error(t('interview.resume.fileTypeError'))
    return false
  }
  if (!isLt10M) {
    ElMessage.error(t('interview.resume.fileSizeError'))
    return false
  }
  return true
}

// 保存简历
const saveResume = async () => {
  if (!resumeData.value.text?.trim()) {
    ElMessage.warning(t('interview.resume.contentRequired'))
    return
  }

  saving.value = true
  try {
    await updateResumeApi({
      ...resumeData.value,
      userId: userStore.userInfo.id
    })
    ElMessage.success(t('interview.resume.saveSuccess'))
    initialText.value = resumeData.value.text || ''
    isTextModified.value = false
  } catch (error) {
    console.error('保存失败：', error)
    ElMessage.error(t('interview.resume.saveError'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchResumeData()
})
</script>

<style scoped lang="scss">
.resume-container {
  padding: 20px;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;

  :deep(.el-row) {
    flex: 1;
    margin: 0 !important;

    .el-col {
      height: 100%;
    }
  }

  .preview-card, .edit-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    .card-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
    }

    :deep(.el-card__body) {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
  }

  .preview-content {
    flex: 1;
    overflow: auto;
  }

  .edit-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .el-form {
    height: 100%;
    display: flex;
    flex-direction: column;

    .content-item {
      flex: 1;
      margin-bottom: 0;
      display: flex;
      flex-direction: column;

      :deep(.el-form-item__content) {
        flex: 1;
        display: flex;
        flex-direction: column;
      }

      :deep(.el-textarea) {
        height: 100%;
        display: flex;
        flex-direction: column;

        .el-textarea__inner {
          height: 100% !important;
          flex: 1;
          resize: none;
          font-size: 14px;
          line-height: 1.5;
          padding: 12px;
        }
      }
    }
  }

  // 添加上传对话框样式
  :deep(.el-dialog__body) {
    padding: 20px;
  }

  .upload-wrapper {
    display: flex;
    flex-direction: column;
  }

  .upload-area {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  :deep(.el-upload) {
    width: 100%;

    .el-upload-dragger {
      width: 100%;
      height: 180px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .upload-icon {
      margin-bottom: 10px;
      .el-icon--upload {
        font-size: 48px;
        color: #c0c4cc;
      }
    }

    .el-upload__text {
      font-size: 14px;
      color: #606266;
      margin-bottom: 10px;
    }
  }
  
  .el-upload__tip {
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: #909399;
    margin-top: 10px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
  }
  
  .upload-actions {
    display: none; // 隐藏之前的按钮区域
  }
}
</style>
