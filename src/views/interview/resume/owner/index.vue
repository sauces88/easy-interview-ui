<template>
  <div class="resume-container">
    <el-row :gutter="20">
      <!-- 左侧预览卡片 -->
      <el-col :span="12">
        <el-card class="preview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>简历预览</span>
            </div>
          </template>
          <div class="preview-content">
            <pdf-preview v-if="resumeData.url" :url="resumeData.url"></pdf-preview>
            <el-empty v-else description="暂无简历文件">
              <el-button type="primary" @click="openUploadDialog">上传简历</el-button>
            </el-empty>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧编辑卡片 -->
      <el-col :span="12">
        <el-card class="edit-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>简历信息编辑</span>
              <div class="header-actions">
                <el-button
                  v-if="hasResume"
                  type="primary"
                  link
                  @click="openUploadDialog"
                >
                  重新上传
                </el-button>
              </div>
            </div>
          </template>
          <el-empty v-if="!hasResume" description="请先上传简历文件后再编辑简历信息">
          </el-empty>
          <el-form
              v-else
              ref="ruleFormRef"
              :rules="rules"
              :model="resumeData"
              @submit.enter.prevent="handleSubmit"
          >
            <el-form-item prop="text" class="content-item">
              <el-input
                  v-model="resumeData.text"
                  placeholder="请填写简历内容"
                  type="textarea"
                  :autosize="{ minRows: 16, maxRows: 16 }"
              ></el-input>
            </el-form-item>
            <el-form-item class="button-item">
              <el-button 
                type="primary" 
                @click="handleSubmit"
                :disabled="!isTextModified"
              >
                保存
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadVisible"
      title="上传简历"
      :destroy-on-close="true"
      width="580px"
      draggable
    >
      <el-upload
        v-model:file-list="fileList"
        class="upload-demo"
        drag
        :file-size="3"
        :auto-upload="false"
        :limit="1"
        @change="handleFileUpload"
        :accept="'.pdf'"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          拖拽文件到此处或 <em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 PDF 格式，文件大小不能超过 3M
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { type ElForm, ElMessage, type UploadUserFile } from 'element-plus'
import { getCurrentUserResumeDetailApi, updateResumeApi, createResumeApi } from '@/api/modules/interview/resume'
import { useUserStore } from '@/stores/modules/user'
import PdfPreview from '@/components/PdfPreview/index.vue'
import { UploadFilled } from '@element-plus/icons-vue'

defineOptions({
  name: 'ResumeOwner'
})

const userStore = useUserStore()

const rules = reactive({
  text: [{ required: true, message: '请填写简历内容' }],
})

const resumeData = ref({
  url: '',
  text: '',
  id: undefined
})

const ruleFormRef = ref<InstanceType<typeof ElForm>>()

// 判断是否有简历
const hasResume = computed(() => {
  return resumeData.value.url && resumeData.value.id
})

// 跟踪文本是否被修改
const isTextModified = ref(false)
const initialText = ref('')

// 监听文本内容变化
watch(() => resumeData.value.text, (newVal, oldVal) => {
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
        message: '您还未上传简历，请先上传简历文件',
        duration: 0,
        showClose: true
      })
    }
  } catch (error) {
    console.error('获取简历数据异常：', error)
    ElMessage.error('系统异常，请稍后重试')
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
      ElMessage.success('保存成功！')
      initialText.value = resumeData.value.text  // 更新初始文本
      isTextModified.value = false  // 重置修改状态
    } catch (error) {
      console.error('保存失败：', error)
      ElMessage.error('保存失败')
    }
  })
}

// 上传相关
const uploadVisible = ref(false)
const fileList = ref<UploadUserFile[]>()

const openUploadDialog = () => {
  uploadVisible.value = true
  fileList.value = []
}

const handleFileUpload = async (uploadFile: UploadUserFile) => {
  if (!uploadFile || !uploadFile.raw) {
    return
  }

  try {
    await createResumeApi(uploadFile.raw)
    ElMessage.success('上传成功')
    uploadVisible.value = false
    fileList.value = []
    fetchResumeData() // 重新获取数据
  } catch (error) {
    console.error('上传失败：', error)
    ElMessage.error('上传失败')
  }
}

onMounted(() => {
  fetchResumeData()
})
</script>

<style scoped lang="scss">
.resume-container {
  padding: 20px;
  height: 100%;
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
      overflow: hidden;
    }
  }

  .preview-content {
    flex: 1;
    overflow: hidden;
  }

  .el-form {
    height: 100%;
    display: flex;
    flex-direction: column;

    .content-item {
      flex: 1;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;

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

    .button-item {
      margin-bottom: 0;
      :deep(.el-form-item__content) {
        display: flex;
        justify-content: flex-end;
        margin-left: 0 !important;

        .el-button {
          padding: 12px 30px;
        }
      }
    }
  }

  // 添加上传对话框样式
  :deep(.el-dialog__body) {
    display: flex;
    justify-content: center;
    padding: 20px;
  }

  :deep(.el-upload) {
    width: 100%;

    .el-upload-dragger {
      width: 100%;
      height: 200px;
    }
  }
}
</style>
