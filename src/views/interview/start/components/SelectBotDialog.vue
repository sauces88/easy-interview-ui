<template>
  <el-dialog
    v-model="dialogVisible"
    title="选择面试官"
    width="1000px"
    draggable
  >
    <ProTable
      ref="proTableRef"
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
      <template #operation="{ row }">
        <el-button
          type="primary"
          link
          @click="handleSelect(row)"
        >
          选择
        </el-button>
      </template>
    </ProTable>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import { RefreshRight } from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import { getBotListApi } from '@/api/modules/interview/bot'
import type { ColumnProps, ProTableInstance } from '@/components/ProTable/interface'
import type {IBot} from "@/api/interface/interview/bot";

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', bot : IBot.Row): void
}>()

const dialogVisible = ref(false)
const proTableRef = ref<ProTableInstance>()

// 表格配置项
const columns: ColumnProps[] = [
  { prop: 'bot_id', label: "智能体ID" },
  { prop: 'bot_name', label: '名称' },
  { prop: 'icon_url', label: '图标' },
  { prop: 'description', label: '描述' },
  { prop: 'publish_time', label: '最近发布时间' },
  {
    prop: 'operation',
    label: '操作',
    width: 100,
    fixed: 'right'
  }
]

const CACHE_KEY = 'bot_list_cache'

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

// 监听对话框显示状态变化
watch(() => dialogVisible.value, (val) => {
  emit('update:modelValue', val)
})

// 格式化时间戳
const formatUnixTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm:ss')
}

const getIconHtml = (url: string) => {
  return url ? `<img src="${url}" alt="智能体头像" style="width: 50px; height: 50px;" />` : ''
}

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

// 选择智能体
const handleSelect = (row: any) => {
  emit('select', row)
  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
:deep(.el-dialog__body) {
  padding: 0;
}
</style>
