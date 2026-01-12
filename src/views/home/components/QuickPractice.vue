<template>
  <div class="quick-practice">
    <h3 class="section-title">
      {{ t('home.quickPractice.title') }}
    </h3>
    <div class="practice-grid">
      <div
        v-for="item in practiceItems"
        :key="item.key"
        class="practice-card"
        @click="handleNavigate(item)"
      >
        <div
          class="card-icon"
          :style="{ backgroundColor: item.bgColor }"
        >
          <component
            :is="item.icon"
            :style="{ color: item.iconColor }"
          />
        </div>
        <div class="card-info">
          <h4 class="card-title">
            {{ item.title }}
          </h4>
          <p class="card-desc">
            {{ item.desc }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ChatDotRound, Timer, ChatLineSquare, EditPen, User, Monitor, QuestionFilled, Document } from '@element-plus/icons-vue'

const props = defineProps<{
  isSpeakx: boolean
}>()

const { t } = useI18n()
const router = useRouter()

interface PracticeItem {
  key: string
  title: string
  desc: string
  icon: any
  iconColor: string
  bgColor: string
  path: string
}

const speakxItems = computed<PracticeItem[]>(() => [
  {
    key: 'realtime',
    title: t('home.quickPractice.speakx.realtime'),
    desc: t('home.quickPractice.speakx.realtimeDesc'),
    icon: ChatDotRound,
    iconColor: '#1890ff',
    bgColor: '#e6f7ff',
    path: '/labs/ielts/index'
  },
  {
    key: 'quiz',
    title: t('home.quickPractice.speakx.quiz'),
    desc: t('home.quickPractice.speakx.quizDesc'),
    icon: Timer,
    iconColor: '#eb2f96',
    bgColor: '#fff0f6',
    path: '/ielts/quiz/card'
  },
  {
    key: 'mockExam',
    title: t('home.quickPractice.speakx.mockExam'),
    desc: t('home.quickPractice.speakx.mockExamDesc'),
    icon: ChatLineSquare,
    iconColor: '#52c41a',
    bgColor: '#f6ffed',
    path: '/ielts/mockExam/speaking'
  },
  {
    key: 'repeat',
    title: t('home.quickPractice.speakx.repeat'),
    desc: t('home.quickPractice.speakx.repeatDesc'),
    icon: EditPen,
    iconColor: '#722ed1',
    bgColor: '#f9f0ff',
    path: '/ielts/sentencePractice/repeat'
  }
])

const interviewItems = computed<PracticeItem[]>(() => [
  {
    key: 'mock',
    title: t('home.quickPractice.interview.mock'),
    desc: t('home.quickPractice.interview.mockDesc'),
    icon: User,
    iconColor: '#1890ff',
    bgColor: '#e6f7ff',
    path: '/interview/mock'
  },
  {
    key: 'personalizedPlan',
    title: t('home.quickPractice.interview.personalizedPlan'),
    desc: t('home.quickPractice.interview.personalizedPlanDesc'),
    icon: QuestionFilled,
    iconColor: '#fa8c16',
    bgColor: '#fff7e6',
    path: '/interview/personalizedPlan'
  },
  {
    key: 'training',
    title: t('home.quickPractice.interview.training'),
    desc: t('home.quickPractice.interview.trainingDesc'),
    icon: Monitor,
    iconColor: '#1890ff',
    bgColor: '#e6f7ff',
    path: '/interview/start'
  },
  {
    key: 'resume',
    title: t('home.quickPractice.interview.resume'),
    desc: t('home.quickPractice.interview.resumeDesc'),
    icon: Document,
    iconColor: '#52c41a',
    bgColor: '#f6ffed',
    path: '/interview/resume/owner'
  }
])

const practiceItems = computed(() => props.isSpeakx ? speakxItems.value : interviewItems.value)

const handleNavigate = (item: PracticeItem) => {
  router.push(item.path)
}
</script>

<style scoped lang="scss">
.quick-practice {
  margin-top: 24px;

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 16px 0;
  }

  .practice-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .practice-card {
    background: #fff;
    border-radius: 12px;
    padding: 25px;
    min-height: 140px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;

      .el-icon {
        font-size: 22px;
      }
    }

    .card-info {
      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 6px 0;
      }

      .card-desc {
        font-size: 13px;
        color: #999;
        margin: 0;
        line-height: 1.4;
      }
    }
  }
}

@media (max-width: 768px) {
  .quick-practice {
    .practice-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
