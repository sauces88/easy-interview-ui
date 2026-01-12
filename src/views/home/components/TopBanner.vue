<template>
  <div class="top-banner">
    <!-- speakx: 日期 + 欢迎文字 -->
    <template v-if="isSpeakx">
      <div class="date-badge">
        {{ t('home.topBanner.today') }}: {{ formattedDate }}
      </div>
      <h1 class="banner-title">
        {{ t('home.topBanner.keepSpeaking', { name: nickname }) }}
      </h1>
    </template>
    <!-- easy-interview: 固定文字 -->
    <template v-else>
      <h1 class="banner-title">
        {{ t('home.topBanner.readyToAce') }}
      </h1>
      <p class="banner-subtitle">
        {{ t('home.topBanner.trackProgress') }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/modules/user'
import { useAppStore } from '@/stores/modules/app'

defineProps<{
  isSpeakx: boolean
}>()

const { t, locale } = useI18n()
const userStore = useUserStore()
const appStore = useAppStore()

const nickname = computed(() => userStore.userInfo?.nickname || 'User')

const formattedDate = computed(() => {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  return now.toLocaleDateString(appStore.language === 'zh-CN' ? 'zh-CN' : 'en-US', options)
})
</script>

<style scoped lang="scss">
.top-banner {
  margin-bottom: 24px;

  .date-badge {
    display: inline-block;
    background: #e6f7ff;
    color: #1890ff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .banner-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
    line-height: 1.3;
  }

  .banner-subtitle {
    font-size: 14px;
    color: #8c8c8c;
    margin: 8px 0 0 0;
  }
}
</style>
