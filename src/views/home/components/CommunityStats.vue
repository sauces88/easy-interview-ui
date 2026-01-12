<template>
  <div class="community-stats">
    <div class="stats-header">
      <span class="live-dot" />
      <span class="header-title">{{ isSpeakx ? t('home.community.liveCommunity') : t('home.community.liveCandidates') }}</span>
    </div>

    <div class="stats-count">
      {{ todayPracticeCount.toLocaleString() }}
    </div>
    <p class="stats-desc">
      {{ isSpeakx ? t('home.community.studentsPracticing') : t('home.community.peoplePracticing') }}
    </p>

    <div class="avatar-row">
      <div
        v-for="(avatar, idx) in avatarList"
        :key="idx"
        class="avatar"
        :style="{ backgroundColor: avatar.bgColor }"
      >
        {{ avatar.initial }}
      </div>
      <div class="avatar more">
        +{{ moreCount }}
      </div>
    </div>

    <div class="activity-section">
      <h4 class="activity-title">
        {{ t('home.community.recentActivity') }}
      </h4>
      <div class="activity-list">
        <div
          v-for="(activity, idx) in recentActivities"
          :key="idx"
          class="activity-item"
        >
          <div
            class="activity-avatar"
            :style="{ backgroundColor: activity.avatarColor }"
          >
            {{ activity.avatar }}
          </div>
          <div class="activity-content">
            <span class="activity-icon">{{ activity.icon }}</span>
            <span class="activity-name">{{ activity.name }}</span>
            <span class="activity-action">{{ activity.action }}</span>
          </div>
          <span class="activity-time">{{ activity.time }}</span>
        </div>
      </div>
    </div>

    <el-button
      class="community-btn"
      text
    >
      {{ isSpeakx ? t('home.community.viewLeaderboard') : t('home.community.joinCommunity') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  isSpeakx: boolean
}>()

const { t } = useI18n()

// 根据当天日期生成种子，确保同一天数据一致
const getDaySeed = () => {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

// 简单的伪随机数生成器
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 计算今日练习人数（基于分钟数递增，同一分钟内刷新不变）
const todayPracticeCount = computed(() => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const minutesSinceStart = Math.floor((now.getTime() - startOfDay.getTime()) / (1000 * 60))
  const totalMinutesInDay = 24 * 60

  // 基础人数30，最终人数约1248
  const baseCount = 30
  const maxCount = 1248
  const progress = minutesSinceStart / totalMinutesInDay

  // 使用缓动函数实现自然增长（早上慢，中午快，晚上慢）
  const easedProgress = 1 - Math.pow(1 - progress, 2)

  return Math.floor(baseCount + (maxCount - baseCount) * easedProgress)
})

// 生成随机头像列表
const avatarColors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#52c41a', '#1890ff']
const names = ['Sarah', 'Mike', 'John', 'Emma', 'Alex', 'Yuki', 'Tom', 'Lisa', 'David', 'Anna']

const avatarList = computed(() => {
  const seed = getDaySeed()
  return Array.from({ length: 4 }, (_, i) => {
    const idx = Math.floor(seededRandom(seed + i) * names.length)
    const colorIdx = Math.floor(seededRandom(seed + i + 100) * avatarColors.length)
    return {
      initial: names[idx].charAt(0),
      bgColor: avatarColors[colorIdx]
    }
  })
})

const moreCount = computed(() => {
  const seed = getDaySeed()
  return Math.floor(seededRandom(seed + 200) * 50) + 50
})

// 雅思相关活动
const ieltsActivities = [
  { action: 'completed Part 2', icon: '✅' },
  { action: 'reached Band 7.0', icon: '🏆' },
  { action: 'learned 5 words', icon: '⭐' },
  { action: 'finished mock test', icon: '✅' },
  { action: 'practiced Speaking', icon: '🎤' },
  { action: 'improved fluency', icon: '📈' },
  { action: 'completed Part 3', icon: '✅' },
  { action: 'reached Band 6.5', icon: '🏆' }
]

// 面试相关活动
const interviewActivities = [
  { action: 'practiced "Intro"', icon: '⭐' },
  { action: 'scored 9/10', icon: '🏆' },
  { action: 'uploaded Resume', icon: '📈' },
  { action: 'completed Behavioral', icon: '✅' },
  { action: 'finished mock interview', icon: '🎤' },
  { action: 'practiced Technical', icon: '⭐' },
  { action: 'scored 8/10', icon: '🏆' },
  { action: 'updated profile', icon: '📈' }
]

// 生成近期活动
const recentActivities = computed(() => {
  const seed = getDaySeed()
  const activities = props.isSpeakx ? ieltsActivities : interviewActivities

  return Array.from({ length: 3 }, (_, i) => {
    const nameIdx = Math.floor(seededRandom(seed + i * 10) * names.length)
    const activityIdx = Math.floor(seededRandom(seed + i * 20) * activities.length)
    const colorIdx = Math.floor(seededRandom(seed + i * 30) * avatarColors.length)
    const timeMinutes = [2, 5, 12, 15, 20, 30][Math.floor(seededRandom(seed + i * 40) * 6)]

    return {
      name: names[nameIdx],
      avatar: names[nameIdx].charAt(0),
      avatarColor: avatarColors[colorIdx],
      action: activities[activityIdx].action,
      icon: activities[activityIdx].icon,
      time: `${timeMinutes}m`
    }
  })
})
</script>

<style scoped lang="scss">
.community-stats {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .stats-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #52c41a;
      animation: pulse 2s infinite;
    }

    .header-title {
      font-size: 13px;
      font-weight: 600;
      color: #52c41a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .stats-count {
    font-size: 42px;
    font-weight: 700;
    color: #1a1a2e;
    line-height: 1;
    margin-bottom: 4px;
  }

  .stats-desc {
    font-size: 14px;
    color: #8c8c8c;
    margin: 0 0 16px 0;
  }

  .avatar-row {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      margin-right: -8px;
      border: 2px solid #fff;

      &.more {
        background: #f0f0f0;
        color: #666;
        font-size: 11px;
      }
    }
  }

  .activity-section {
    .activity-title {
      font-size: 13px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 0 0 12px 0;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .activity-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        flex-shrink: 0;
      }

      .activity-content {
        flex: 1;
        font-size: 13px;
        color: #666;
        display: flex;
        align-items: center;
        gap: 4px;

        .activity-icon {
          font-size: 14px;
        }

        .activity-name {
          font-weight: 600;
          color: #333;
        }
      }

      .activity-time {
        font-size: 12px;
        color: #bfbfbf;
      }
    }
  }

  .community-btn {
    width: 100%;
    margin-top: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 20px;
    height: 40px;
    color: #666;

    &:hover {
      background: #f5f5f5;
      border-color: #d9d9d9;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
