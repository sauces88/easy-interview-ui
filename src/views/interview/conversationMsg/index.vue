<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      :title="t('message.title')"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
      :key="i18nKey"
    >
      <!-- 表格 header 按钮 -->
      <template #tableHeader="scope">
        <el-button
          v-auth="'conversation.msg.remove'"
          type="danger"
          :icon="Delete"
          plain
          :disabled="!scope.isSelected"
          @click="batchDelete(scope.selectedListIds)"
        >
          {{ t('message.batchDelete') }}
        </el-button>
      </template>
      <template #operation="{ row }">
        <el-button
          type="primary"
          link
          :icon="View"
          @click="openDetail(row)"
        >
          {{ t('table.detail') }}
        </el-button>
        <el-button
          v-auth="'conversation.msg.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          {{ t('table.delete') }}
        </el-button>
      </template>
    </ProTable>
    <ConversationMsgForm ref="conversationMsgRef" />
    <ImportExcel ref="ImportExcelRef" />

    <!-- 修改消息详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="t('message.detail')"
      size="100%"
    >
      <div class="chat-container">
        <el-row :gutter="20" class="h-full">
          <!-- 左侧辅助会话(小助手) -->
          <el-col :span="12" class="h-full">
            <el-card class="chat-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>{{ t('message.assistant') }}</span>
                </div>
              </template>
              <AssistantChatList
                :messages="assistantMessages"
                :is-blurred="false"
              />
            </el-card>
          </el-col>

          <!-- 右侧主会话 -->
          <el-col :span="12" class="h-full">
            <el-card class="chat-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>{{ t('message.mainChat') }}</span>
                </div>
              </template>
              <div class="message-list">
                <div
                  v-for="(msg, index) in mainMessages"
                  :key="index"
                  class="qa-item"
                >
                  <div class="message-content" :class="msg.role">
                    <p>{{ msg.content }}</p>
                  </div>
                  <div class="time-wrapper">
                    <span class="time">{{ formatTime(msg.created_at) }}</span>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Delete, View} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {getConversationMsgListApi, getConversationMsgExtraDetailApi, removeConversationMsgApi} from '@/api/modules/interview/conversationMsg';
import {useHandleData} from '@/hooks/useHandleData';
import ConversationMsgForm from '@/views/interview/conversationMsg/components/ConversationMsgForm.vue';
import type {ColumnProps, ProTableInstance, SearchProps} from '@/components/ProTable/interface';
import type {IConversationMsg} from '@/api/interface/interview/conversationMsg';
import ImportExcel from '@/components/ImportExcel/index.vue';
import ChatList from '@/views/interview/start/components/ChatList.vue'
import AssistantChatList from '@/views/interview/start/components/AssistantChatList.vue'
import dayjs from 'dayjs'
import { useTableI18n } from '@/hooks/useTableI18n'

const { t, i18nKey } = useTableI18n()

const proTableRef = ref<ProTableInstance>();

// 表格配置项 - 改为计算属性
const columns = computed<ColumnProps<IConversationMsg.ListRow>[]>(() => [
  { type: 'selection', width: 80 },
  { prop: 'id', label: t('table.index') },
  { prop: 'conversationId', label: t('table.conversationId') },
  { prop: 'count', label: t('table.count') },
  { prop: 'createId', label: t('system.user.createId') },
  { prop: 'createTime', label: t('table.createTime') },
  { prop: 'operation', label: t('table.operation'), width: 250, fixed: 'right' }
])
// 搜索条件项 - 改为计算属性
const searchColumns = computed<SearchProps[]>(() => [
  { prop: 'conversationId', label: t('interview.conversation.id'), el: 'input' },
  { prop: 'createTime', label: t('table.createTime'), el: 'date-picker', props: { type: 'datetimerange' } },
  { prop: 'createId', label: t('table.createId'), el: 'input' }
])

// 获取table列表
const getTableList = (params: IConversationMsg.Query) => {
  let newParams = formatParams(params);
  return getConversationMsgListApi(newParams);
};
const formatParams = (params: IConversationMsg.Query) =>{
  let newParams = JSON.parse(JSON.stringify(params));
  newParams.createTime && (newParams.createTimeStart = newParams.createTime[0]);
  newParams.createTime && (newParams.createTimeEnd = newParams.createTime[1]);
  delete newParams.createTime;
  newParams.updateTime && (newParams.updateTimeStart = newParams.updateTime[0]);
  newParams.updateTime && (newParams.updateTimeEnd = newParams.updateTime[1]);
  delete newParams.updateTime;
  return newParams;
}
// 打开 drawer(新增、查看、编辑)
const conversationMsgRef = ref<InstanceType<typeof ConversationMsgForm>>()

// 修改消息列表相关的状态
const drawerVisible = ref(false)

// 修改类型定义，确保 created_at 的类型兼容
interface Message extends Omit<IConversationMsg.Message, 'created_at'> {
  created_at: string;
}

// 修改状态的类型
const mainMessages = ref<Message[]>([])
const assistantMessages = ref<Message[]>([])

// 修改时间格式化函数
const formatTime = (timestamp: string) => {
  // 将时间戳转换为毫秒
  const date = new Date(+timestamp * 1000)
  // 使用 dayjs 格式化，显示年月日 时:分:秒
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

// 修改打开详情的方法
const openDetail = async (row: IConversationMsg.ListRow) => {
  try {
    const { data } = await getConversationMsgExtraDetailApi({ id: row.id! })
    const mainConversation = data.find(item => item.id === row.id)
    const assistantConversation = data.find(item => item.id !== row.id)

    // 转换时间戳类型
    mainMessages.value = mainConversation?.messages.map(msg => ({
      ...msg,
      created_at: msg.created_at.toString()
    })) || []
    assistantMessages.value = assistantConversation?.messages.map(msg => ({
      ...msg,
      created_at: msg.created_at.toString()
    })) || []

    drawerVisible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
  }
}

// 删除信息
const deleteInfo = async (params: IConversationMsg.ListRow) => {
  await useHandleData(
    removeConversationMsgApi,
    { ids: [params.id] },
    t('message.deleteConfirm')
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(
    removeConversationMsgApi, 
    { ids }, 
    t('message.deleteConfirm')
  )
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

</script>

<style lang="scss" scoped>
.chat-container {
  height: 100%;
  padding: 20px;

  :deep(.el-row) {
    margin: 0 !important;
    height: 100%;
  }

  :deep(.el-col) {
    height: 100%;
  }

  .chat-card {
    height: 100%;
    display: flex;
    flex-direction: column;

    .card-header {
      font-weight: bold;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 12px;
    }

    :deep(.el-card__body) {
      flex: 1;
      padding: 10px;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }

  .message-list {
    flex: 1;
    padding: 20px;
    overflow-y: auto;

    .qa-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;

      .message-content {
        p {
          margin: 0;
          white-space: pre-line;
          line-height: 1.5;
          padding: 12px;
          border-radius: 8px;
        }

        &.user {
          align-self: flex-end;

          p {
            background-color: #e3f2fd;
          }
        }

        &.assistant {
          align-self: flex-start;

          p {
            background-color: #f5f5f5;
          }
        }
      }

      .time-wrapper {
        display: flex;
        justify-content: flex-end;
        padding: 4px 0;

        .time {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}

// 移除旧的消息样式
</style>
