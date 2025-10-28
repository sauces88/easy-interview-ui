<template>
  <el-config-provider :locale="currentLocale" :size="assemblySize" :button="buttonConfig">
    <RouterView />
  </el-config-provider>
</template>

<script setup lang="ts">
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/stores/modules/app';
import { getBrowserLang } from '@/utils';
import en from 'element-plus/es/locale/lang/en';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import type { LanguageType } from '@/stores/interface/app';
import { computed, onMounted, reactive } from 'vue';
import i18n from '@/languages';

const appStore = useAppStore();

// init theme
const { initTheme } = useTheme();
initTheme();

// element language
const currentLocale = computed(() => {
  return appStore.language === 'zh-CN' ? zhCn : en;
});

// element assemblySize
const assemblySize = computed(() => appStore.assemblySize);

// element button config
const buttonConfig = reactive({ autoInsertSpace: false });

onMounted(() => {
  const language = appStore.language ?? getBrowserLang();
  appStore.changeLanguage(language as LanguageType);
});
</script>
