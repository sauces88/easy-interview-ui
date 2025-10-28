<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('interview.bot.title')"
      :indent="20"
      :columns="columns"
      :request-api="getTableList"
      row-key="bot_id"
      :key="i18nKey"
    >
      <template #publish_time="{ row }">
        {{ formatUnixTime(row.publish_time) }}
      </template>
      <template #icon_url="{ row }">
        <div v-html="getIconHtml(row.icon_url)" />
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import { useTableI18n } from '@/hooks/useTableI18n'
import dayjs from 'dayjs'
import ProTable from '@/components/ProTable/index.vue'
import {getBotListApi} from '@/api/modules/interview/bot';
import type {ColumnProps, ProTableInstance} from '@/components/ProTable/interface';

const { t, i18nKey } = useTableI18n()

const proTableRef = ref<ProTableInstance>();

// 格式化时间戳
const formatUnixTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
}

const getIconHtml = (url: string) => {
  return url ? `<img src="${url}" alt="智能体头像" style="width: 50px; height: 50px;" />` : '';
}

// 表格配置项 - 改为计算属性
const columns = computed<ColumnProps[]>(() => [
  {prop: 'bot_id', label: t('interview.bot.id')},
  {prop: 'bot_name', label: t('interview.bot.name')},
  {prop: 'icon_url', label: t('interview.bot.icon')},
  {prop: 'description', label: t('interview.bot.description')},
  {prop: 'publish_time', label: t('interview.bot.publishTime')},
])

// 获取table列表
const getTableList = async () => {
  return await getBotListApi({identifier: "easy.interview.main"})
}

</script>
