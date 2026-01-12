<template>
  <div class="home">
    <!-- jinli.gealam.com: 研究项目首页 -->
    <template v-if="isJinli">
      <div
        v-if="hasUserData"
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
              text
              @click="viewPracticeRecords"
            >
              <el-icon style="margin-right: 8px; font-size: 20px">
                <Document />
              </el-icon>
              查看练习记录
            </el-button>
            <el-button
              v-auth="'proj.task.create'"
              :disabled="!selectedProject || !microphoneGranted"
              class="start-practice-btn"
              @click="startPractice"
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
                  <span class="project-credit">
                    <span class="credit-icon">✨</span>
                    {{ project.credit || 0 }}
                  </span>
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
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 面试练习组件 -->
        <ProjPractice ref="projPracticeRef" />
        <!-- 练习记录组件 -->
        <PracticeRecords ref="practiceRecordsRef" />
      </div>

      <!-- 未登录研究用户时的欢迎页 -->
      <div
        v-else
        class="home-bg"
      >
        <img
          src="@/assets/images/welcome.png"
          :alt="t('home.welcome')"
        >
      </div>
    </template>

    <!-- speakx 和 easy-interview: 新首页布局 -->
    <template v-else>
      <div class="new-home-layout">
        <!-- 顶部 -->
        <TopBanner :is-speakx="isSpeakx" />

        <div class="main-content">
          <!-- 左侧区域 -->
          <div class="left-section">
            <!-- 左上：每日挑战卡片 -->
            <DailyChallenge
              ref="dailyChallengeRef"
              :is-speakx="isSpeakx"
              :role-id="countdownRoleId"
              @start-topic-practice="handleStartTopicPractice"
            />

            <!-- 左下：快速练习入口 -->
            <QuickPractice :is-speakx="isSpeakx" />
          </div>

          <!-- 右侧区域 -->
          <div class="right-section">
            <!-- 右上：倒计时卡片 -->
            <CountdownCard
              :is-speakx="isSpeakx"
              @role-change="handleRoleChange"
            />

            <!-- 右下：社区统计 -->
            <CommunityStats :is-speakx="isSpeakx" />
          </div>
        </div>
      </div>

      <!-- QuizDetail 组件用于打开练习 -->
      <QuizDetail ref="quizDetailRef" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { inject, onMounted, ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useShareStore } from '@/stores/modules/share'
import { useRedirectStore } from '@/stores/modules/redirect'
import { getResearchProjListApi } from '@/api/modules/research/researchProj'
import type { IResearchProj } from '@/api/interface/research/researchProj'
import { VideoPlay, Document } from '@element-plus/icons-vue'
import MicrophonePermission from '@/views/ielts/mockExam/components/MicrophonePermission.vue'
import ProjPractice from '@/views/research/researchProj/components/ProjPractice.vue'
import PracticeRecords from '@/views/research/researchProj/components/PracticeRecords.vue'
import type { Ref } from 'vue'

// 新首页组件
import TopBanner from './components/TopBanner.vue'
import DailyChallenge from './components/DailyChallenge.vue'
import CountdownCard from './components/CountdownCard.vue'
import QuickPractice from './components/QuickPractice.vue'
import CommunityStats from './components/CommunityStats.vue'
import QuizDetail from '@/views/ielts/quiz/components/QuizDetail.vue'

const { t } = useI18n()
const router = useRouter()

// 判断当前域名（支持 URL 参数覆盖，方便本地测试）
// 使用方式：?site=speakx 或 ?site=interview 或 ?site=jinli
const hostname = window.location.hostname
const siteParam = new URLSearchParams(window.location.search).get('site')

const isSpeakx = computed(() => {
  if (siteParam) return siteParam === 'speakx'
  return hostname.includes('speakx')
})
const isInterview = computed(() => {
  if (siteParam) return siteParam === 'interview'
  return hostname.includes('easy-interview')
})
const isJinli = computed(() => {
  if (siteParam) return siteParam === 'jinli'
  return hostname.includes('jinli')
})

// 从父组件注入数据 (jinli 专用)
const researchUserData = inject<Ref<any>>('researchUserData')

const hasUserData = ref(false)
const projectList = ref<IResearchProj.Row[]>([])
const selectedProject = ref<IResearchProj.Row>()
const microphoneGranted = ref(false)

// 面试练习组件引用 (jinli 专用)
const projPracticeRef = ref<InstanceType<typeof ProjPractice>>()
const practiceRecordsRef = ref<InstanceType<typeof PracticeRecords>>()

// 新首页相关
const dailyChallengeRef = ref<InstanceType<typeof DailyChallenge>>()
const quizDetailRef = ref<InstanceType<typeof QuizDetail>>()
const countdownRoleId = ref<string>('')

// 加载项目列表 (jinli 专用)
const loadProjectList = async () => {
  const projRes = await getResearchProjListApi({ page: 1, limit: 1000 })
  if (projRes.data && projRes.data.rows) {
    projectList.value = projRes.data.rows
  }
}

// 监听用户数据变化 (jinli 专用)
watch(() => researchUserData?.value, (data) => {
  if (data && Object.keys(data).length > 0) {
    hasUserData.value = true
    loadProjectList()
  } else {
    hasUserData.value = false
    projectList.value = []
  }
}, { immediate: true })

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
})

// 选择项目 (jinli 专用)
const selectProject = (project: IResearchProj.Row) => {
  selectedProject.value = project
}

// 处理麦克风权限变化 (jinli 专用)
const handleMicrophoneChange = (granted: boolean) => {
  microphoneGranted.value = granted
}

// 开始练习 (jinli 专用)
const startPractice = () => {
  if (!selectedProject.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  if (!microphoneGranted.value) {
    ElMessage.warning('请先授权麦克风权限')
    return
  }
  projPracticeRef.value?.open(selectedProject.value)
}

// 查看练习记录 (jinli 专用)
const viewPracticeRecords = () => {
  if (!selectedProject.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }
  practiceRecordsRef.value?.open(selectedProject.value)
}

// 处理倒计时设置的 roleId 变化
const handleRoleChange = (roleId: number) => {
  countdownRoleId.value = roleId ? String(roleId) : ''
  // 通知 DailyChallenge 重新加载
  dailyChallengeRef.value?.reload()
}

// 开始话题练习 (speakx)
const handleStartTopicPractice = (topic: string) => {
  quizDetailRef.value?.openTopicPractice(topic)
}
</script>

<style scoped lang="scss">
@import './index.scss';

.home {
  min-height: 100%;
}

// 新首页布局
.new-home-layout {
  padding: 24px 32px;
  background: #f5f6fa;
  min-height: 100vh;

  .main-content {
    display: flex;
    gap: 24px;
  }

  .left-section {
    flex: 1;
    min-width: 0;
  }

  .right-section {
    width: 420px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

// jinli 专属样式
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

    .project-credit {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: #E6A23C;
      background: #FDF6EC;
      padding: 2px 8px;
      border-radius: 12px;

      .credit-icon {
        font-size: 12px;
      }
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

.home-bg {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 40px;

  img {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
  }
}

// 响应式布局
@media (max-width: 992px) {
  .new-home-layout {
    padding: 16px;

    .main-content {
      flex-direction: column;
    }

    .right-section {
      width: 100%;
    }
  }
}
</style>
