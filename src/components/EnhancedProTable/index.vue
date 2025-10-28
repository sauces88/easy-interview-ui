<template>
  <ProTable
    v-bind="$attrs"
    :columns="processedColumns"
    :key="i18nKey"
  >
    <slot></slot>
  </ProTable>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ProTable from '@/components/ProTable/index.vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  }
})

const { t, locale } = useI18n()
const i18nKey = computed(() => locale.value)

// 处理列配置，确保标签都通过t函数处理
const processedColumns = computed(() => {
  return props.columns.map(col => {
    // 如果col.label是一个i18n键（通常包含'.'），则使用t()函数处理
    if (col.label && typeof col.label === 'string' && col.label.includes('.')) {
      return { ...col, label: t(col.label) }
    }
    return col
  })
})
</script> 