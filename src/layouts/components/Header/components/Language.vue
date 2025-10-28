<template>
  <el-dropdown trigger="click" @command="handleSetLanguage">
    <div class="language">
      <el-tooltip :content="t('header.language')" placement="bottom">
        <i :class="'iconfont icon-zhongyingwen'"></i>
      </el-tooltip>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN">
          <span>简体中文</span>
        </el-dropdown-item>
        <el-dropdown-item command="en-US">
          <span>English</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/modules/app'
import type { LanguageType } from '@/stores/interface/app'

const appStore = useAppStore()
const { t, locale } = useI18n()

// 优先从localStorage中读取语言设置，如果没有则使用当前locale值
const language = computed(() => {
  const savedLanguage = localStorage.getItem('lang')
  return savedLanguage || locale.value
})

const handleSetLanguage = (lang: LanguageType) => {
  // 确保lang不为null，设置默认值为'zh-CN'
  const selectedLang = lang || 'zh-CN';
  locale.value = selectedLang;
  appStore.changeLanguage(selectedLang);

  // 将选择的语言保存到localStorage
  localStorage.setItem('lang', selectedLang);

  // 更新 HTML 标签的语言属性
  document.documentElement.lang = selectedLang;
}
</script>

<style scoped lang="scss">
.language {
  i {
    font-size: 20px;
  }
}
</style>
