import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useTableI18n() {
  const { t, locale } = useI18n()
  
  // 创建响应式key，用于强制重新渲染表格
  const i18nKey = computed(() => locale.value)
  
  return {
    t,
    locale,
    i18nKey
  }
} 