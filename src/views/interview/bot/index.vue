<template>
  <div class="table-box">
    <ProTable
        ref="proTableRef"
        title="智能体表"
        :indent="20"
        :columns="columns"
        :request-api="getTableList"
        row-key="bot_id"
    >
      <template #tableHeader>
        <el-button
          type="primary"
          :icon="RefreshRight"
          plain
          @click="clearCache"
        >
          清除缓存
        </el-button>
      </template>
      <template #publish_time="{ row }">
        {{ formatUnixTime(row.publish_time) }}
      </template>
      <template #icon_url="{ row }">
        <div v-html="getIconHtml(row.icon_url)"></div>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import dayjs from 'dayjs'
import { RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import {getBotListApi} from '@/api/modules/interview/bot';
import type {ColumnProps, ProTableInstance} from '@/components/ProTable/interface';

defineOptions({
  name: 'BotView'
})

const proTableRef = ref<ProTableInstance>();

// 格式化时间戳
const formatUnixTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
}

const getIconHtml = (url: string) => {
  return url ? `<img src="${url}" alt="智能体头像" style="width: 50px; height: 50px;" />` : '';
}

// 表格配置项
const columns: ColumnProps[] = [
  {prop: 'bot_id', label: "智能体ID"},
  {prop: 'bot_name', label: '名称'},
  {prop: 'icon_url', label: '图标'},
  {prop: 'description', label: '描述'},
  {prop: 'publish_time', label: '最近发布时间'},
]

const CACHE_KEY = 'bot_list_cache'

// 获取table列表
const getTableList = async () => {
  // 尝试从缓存获取数据
  const cachedData = localStorage.getItem(CACHE_KEY)
  
  if (cachedData) {
    return JSON.parse(cachedData)
  }
  
  // 如果没有缓存，获取新数据并缓存
  const result = await getBotListApi()
  localStorage.setItem(CACHE_KEY, JSON.stringify(result))
  return result
}

// 清除缓存
const clearCache = () => {
  localStorage.removeItem(CACHE_KEY)
  proTableRef.value?.getTableList()
  ElMessage.success('缓存已清除')
}
</script>
