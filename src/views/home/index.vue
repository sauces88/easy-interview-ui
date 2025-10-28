<template>
  <div class="home card">
    <!-- 如果没有用户数据，显示欢迎图片 -->
    <div
      v-if="!hasUserData"
      class="home-bg"
    >
      <img
        src="@/assets/images/welcome.png"
        :alt="t('home.welcome')"
      >
    </div>

    <!-- 如果有用户数据，显示项目列表 -->
    <div
      v-else
      class="project-list"
    >
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="banner-content">
          <div class="banner-text">
            <h1 class="banner-title">
              欢迎来到锦鲤教育申研面试训练平台
            </h1>
            <p class="banner-desc">
              AI智能模拟面试，实时反馈与进度跟踪，助你在真实面试中自信从容
            </p>
          </div>
        </div>
      </div>

      <!-- 项目列表标题和操作按钮 -->
      <div class="course-header">
        <h2 class="course-title">
          所有项目
        </h2>
        <div class="course-actions">
          <MicrophonePermission @permission-changed="handleMicrophoneChange" />
          <el-button
            :disabled="!selectedProject"
            @click="viewPracticeRecords"
            text
          >
            <el-icon style="margin-right: 8px; font-size: 20px">
              <Document />
            </el-icon>
            查看练习记录
          </el-button>

          <el-button
            v-auth="'proj.task.create'"
            :disabled="!selectedProject || !microphoneGranted"
            @click="startPractice"
            class="start-practice-btn"
          >
            <el-icon style="margin-right: 8px; font-size: 20px">
              <VideoPlay />
            </el-icon>
            开始练习
          </el-button>
        </div>
      </div>

      <!-- 空状态提示 -->
      <div
        v-if="projectList.length === 0"
        class="empty-state"
      >
        <el-empty description="暂未被分配任何项目，请联系管理员" />
      </div>

      <!-- 项目列表 -->
      <el-row
        v-else
        :gutter="20"
      >
        <el-col
          v-for="project in projectList"
          :key="project.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <el-card
            :class="['project-card', { 'selected': selectedProject?.id === project.id }]"
            shadow="hover"
            @click="selectProject(project)"
          >
            <template #header>
              <div class="card-header">
                <span class="project-name">{{ project.name }}</span>
              </div>
            </template>
            <div class="project-content">
              <div class="project-item">
                <span class="label">所属院校：</span>
                <span class="value">{{ project.academy }}</span>
              </div>
              <div
                v-if="project.intro"
                class="project-item"
              >
                <span class="label">项目简介：</span>
                <span class="value">{{ project.intro }}</span>
              </div>
              <div
                v-if="project.direction"
                class="project-item"
              >
                <span class="label">学习方向：</span>
                <span class="value">{{ project.direction }}</span>
              </div>
              <div
                v-if="project.skill"
                class="project-item"
              >
                <span class="label">掌握技能：</span>
                <span class="value">{{ project.skill }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 面试练习组件 -->
    <ProjPractice ref="projPracticeRef" />

    <!-- 练习记录组件 -->
    <PracticeRecords ref="practiceRecordsRef" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useShareStore } from '@/stores/modules/share'
import { useRedirectStore } from '@/stores/modules/redirect'
import { getCurrentResearchUserDetailApi } from '@/api/modules/research/researchUser'
import { getResearchProjListApi } from '@/api/modules/research/researchProj'
import type { IResearchProj } from '@/api/interface/research/researchProj'
import { VideoPlay, Document } from '@element-plus/icons-vue'
import MicrophonePermission from '@/views/ielts/mockExam/components/MicrophonePermission.vue'
import ProjPractice from '@/views/research/researchProj/components/ProjPractice.vue'
import PracticeRecords from '@/views/research/researchProj/components/PracticeRecords.vue'

const { t } = useI18n()
const router = useRouter()

const hasUserData = ref(false)
const projectList = ref<IResearchProj.Row[]>([])
const selectedProject = ref<IResearchProj.Row>()
const microphoneGranted = ref(false)

// 面试练习组件引用
const projPracticeRef = ref<InstanceType<typeof ProjPractice>>()

// 练习记录组件引用
const practiceRecordsRef = ref<InstanceType<typeof PracticeRecords>>()

// 加载用户数据和项目列表
const loadData = async () => {
  const { data } = await getCurrentResearchUserDetailApi()

  if (Object.keys(data).length > 0) {
    hasUserData.value = true

    // 加载项目列表
    const projRes = await getResearchProjListApi({ page: 1, limit: 1000 })
    if (projRes.data && projRes.data.rows) {
      projectList.value = projRes.data.rows
    }
  }
}

onMounted(async () => {
  const redirectStore = useRedirectStore()
  const redirectUrl = redirectStore.getRedirectLink()
  // 跳转外部链接
  if (redirectUrl) {
    redirectStore.clear()
    window.location.href = redirectUrl
    return
  }

  // 跳转用户分享链接
  const shareStore = useShareStore()
  const shareLink = shareStore.getShareLink()
  if (shareLink) {
    shareStore.clear()
    router.push(shareLink)
    return
  }

  // 加载数据
  await loadData()
})

// 选择项目
const selectProject = (project: IResearchProj.Row) => {
  selectedProject.value = project
}

// 处理麦克风权限变化
const handleMicrophoneChange = (granted: boolean) => {
  microphoneGranted.value = granted
}

// 开始练习
const startPractice = () => {
  if (!selectedProject.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  if (!microphoneGranted.value) {
    ElMessage.warning('请先授权麦克风权限')
    return
  }
  // 打开面试练习组件
  projPracticeRef.value?.open(selectedProject.value)
}

// 查看练习记录
const viewPracticeRecords = () => {
  if (!selectedProject.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  // 打开练习记录组件
  practiceRecordsRef.value?.open(selectedProject.value)
}

</script>

<style scoped lang="scss">
@import './index.scss';

.project-list {
  padding: 20px;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .banner-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 40px;
  }

  .banner-text {
    flex: 1;

    .banner-title {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }

    .banner-desc {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      line-height: 1.6;
    }
  }

  @media (max-width: 768px) {
    padding: 30px 20px;

    .banner-content {
      flex-direction: column;
      text-align: center;
    }

    .banner-text .banner-title {
      font-size: 24px;
    }

    .banner-text .banner-desc {
      font-size: 14px;
    }
  }
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-left: 12px;
  border-left: 4px solid #409EFF;

  .course-title {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    margin: 0;
  }

  .course-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .start-practice-btn {
      background: #2E8BFA;
      border: none;
      border-radius: 8px;
      height: 38px;
      padding: 0 20px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(46, 139, 250, 0.2);

      &:hover:not(:disabled) {
        background: #1E7AE0;
        box-shadow: 0 4px 12px rgba(46, 139, 250, 0.3);
        transform: translateY(-1px);
      }

      &:active:not(:disabled) {
        transform: scale(0.98) translateY(0);
      }

      &:disabled {
        background: #c0c4cc;
        box-shadow: none;
        cursor: not-allowed;
      }
    }

    .view-records-btn {
      background: #67C23A;

      &:hover:not(:disabled) {
        background: #5DAF34;
      }
    }
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 40px 20px;
}

:deep(.el-row) {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: stretch;
}

:deep(.el-col) {
  display: flex;
  margin-bottom: 20px;
}

.project-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #409EFF;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  }

  :deep(.el-card__header) {
    padding: 16px;
  }

  :deep(.el-card__body) {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .project-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .project-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    .project-item {
      margin-bottom: 12px;
      line-height: 1.6;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: #909399;
        font-size: 14px;
        font-weight: 600;
      }

      .value {
        color: #606266;
        font-size: 14px;
        word-break: break-word;
      }
    }
  }
}
</style>
