<template>
  <div
    class="daily-challenge-card"
    :class="{ 'speakx-theme': isSpeakx, 'interview-theme': !isSpeakx }"
  >
    <!-- speakx: Topic of the Day -->
    <template v-if="isSpeakx">
      <h3 class="card-title">
        {{ t('home.dailyChallenge.topicOfDay') }}
      </h3>
      <p class="users-count">
        {{ t('home.dailyChallenge.joinUsers', { count: practiceCount }) }}
      </p>
      <p class="topic-text">
        "{{ topicText }}"
      </p>
      <el-button
        class="start-btn"
        @click="handleStartPractice"
      >
        <el-icon style="margin-right: 6px">
          <Microphone />
        </el-icon>
        {{ t('home.dailyChallenge.startSpeaking') }}
      </el-button>
    </template>

    <!-- easy-interview: Daily Challenge -->
    <template v-else>
      <div class="challenge-badge">
        <span class="badge-icon">🔥</span>
        {{ t('home.dailyChallenge.dailyChallenge') }}
      </div>
      <h3 class="question-text">
        "{{ questionText }}"
      </h3>
      <p class="question-hint">
        {{ t('home.dailyChallenge.questionHint', { type: roleTypeName, companies: companyNames }) }}
      </p>
      <el-button
        class="start-btn"
        @click="handleStartInterview"
      >
        <el-icon style="margin-right: 6px">
          <Microphone />
        </el-icon>
        {{ t('home.dailyChallenge.practiceNow') }}
      </el-button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { Microphone } from '@element-plus/icons-vue'
import { random as getRandomTopic } from '@/api/modules/ielts/topicPractice'
import { random as getRandomQuestion, createMockInterviewApi } from '@/api/modules/interview/mockInterview'
import { getAgentIdByIdentifier } from '@/api/modules/interview/personalizedPlan'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  isSpeakx: boolean
  roleId?: string
}>()

const emit = defineEmits(['start-topic-practice'])

const { t } = useI18n()
const router = useRouter()
const appStore = useAppStore()

// speakx 相关数据
const topicText = ref('')
const topicData = ref<any>(null)

// easy-interview 相关数据
const questionText = ref('')
const roleTypeName = ref('')
const companyNames = ref('')
const interviewData = ref<any>(null)

// 随机生成练习人数 (30-80)
const practiceCount = ref(Math.floor(Math.random() * 51) + 30)

// 获取 speakx 的随机话题
const loadRandomTopic = async () => {
  const res = await getRandomTopic()
  if (res.data) {
    topicData.value = res.data
    topicText.value = (res.data as any).topic || ''
  }
}

// 根据当前语言更新显示文本
const updateInterviewTexts = () => {
  if (!interviewData.value) return
  const data = interviewData.value
  if (appStore.language === 'zh-CN') {
    questionText.value = data.content || ''
    roleTypeName.value = data.roleName || ''
    companyNames.value = data.companyName || ''
  } else {
    questionText.value = data.contentUs || data.content || ''
    roleTypeName.value = data.roleNameUs || data.roleName || ''
    companyNames.value = data.companyNameUs || data.companyName || ''
  }
}

// 获取 easy-interview 的随机问题
const loadRandomQuestion = async () => {
  const params = props.roleId ? { roleId: props.roleId } : undefined
  const res = await getRandomQuestion(params)
  if (res.data) {
    interviewData.value = res.data
    updateInterviewTexts()
  }
}

// 监听语言变化，实时更新文本
watch(() => appStore.language, () => {
  if (!props.isSpeakx) {
    updateInterviewTexts()
  }
})

// 开始 speakx 练习
const handleStartPractice = () => {
  if (!topicData.value?.topic) {
    ElMessage.warning(t('home.dailyChallenge.noTopic'))
    return
  }
  emit('start-topic-practice', topicData.value.topic)
}

// 开始 easy-interview 面试
const handleStartInterview = async () => {
  if (!interviewData.value) {
    ElMessage.warning(t('home.dailyChallenge.noQuestion'))
    return
  }

  const data = interviewData.value
  // 获取 botId
  const agentRes = await getAgentIdByIdentifier('mockInterview')
  const botId = agentRes.data

  // 创建面试
  const createParams = {
    companyId: data.companyId || undefined,
    roleId: data.roleId || undefined,
    botId: botId
  }

  const createRes = await createMockInterviewApi(createParams)
  if (createRes.data) {
    // 跳转到面试页面
    router.push({
      path: '/interview/mock',
      query: { mockInterviewId: (createRes.data as any).id }
    })
  }
}

onMounted(() => {
  if (props.isSpeakx) {
    loadRandomTopic()
  } else {
    loadRandomQuestion()
  }
})

// 监听 roleId 变化重新加载
defineExpose({
  reload: () => {
    if (!props.isSpeakx) {
      loadRandomQuestion()
    }
  }
})
</script>

<style scoped lang="scss">
.daily-challenge-card {
  border-radius: 16px;
  padding: 28px;
  color: #fff;
  position: relative;
  overflow: hidden;
  min-height: 200px;

  &.speakx-theme {
    background: linear-gradient(135deg, #00b4a0 0%, #00c9b7 50%, #00d4c0 100%);
  }

  &.interview-theme {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .card-title {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 12px 0;
  }

  .users-count {
    font-size: 14px;
    opacity: 0.9;
    margin: 0 0 12px 0;
  }

  .topic-text {
    font-size: 16px;
    line-height: 1.5;
    margin: 0 0 24px 0;
    font-style: italic;
  }

  .challenge-badge {
    display: inline-flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;

    .badge-icon {
      margin-right: 6px;
    }
  }

  .question-text {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.4;
    margin: 0 0 12px 0;
  }

  .question-hint {
    font-size: 13px;
    opacity: 0.85;
    margin: 0 0 24px 0;
    line-height: 1.5;
  }

  .start-btn {
    background: #fff;
    color: #333;
    border: none;
    border-radius: 24px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
