<template>
  <div class="table-box">
    <ProTable
      ref="proTableRef"
      title="聊天记录表"
      :indent="20"
      :columns="columns"
      :search-columns="searchColumns"
      :request-api="getTableList"
      row-key="id"
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
          批量删除
        </el-button>
      </template>
      <template #operation="{ row }">
        <el-button
          type="primary"
          link
          :icon="View"
          @click="openDetail(row)"
        >
          详情
        </el-button>
        <el-button
          v-auth="'conversation.msg.remove'"
          type="primary"
          link
          :icon="Delete"
          @click="deleteInfo(row)"
        >
          删除
        </el-button>
      </template>
    </ProTable>
    <ConversationMsgForm ref="conversationMsgRef" />
    <ImportExcel ref="ImportExcelRef" />

    <!-- 添加消息详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="消息详情"
      size="50%"
    >
      <div class="message-list">
        <div
          v-for="(msg, index) in messageList"
          :key="index"
          :class="['message-item', msg.role]"
        >
          <div class="message-content">
            <div class="message-header">
              <span class="time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-text">{{ msg.content }}</div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import {Delete, View} from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import {getConversationMsgListApi, getConversationMsgDetailApi, removeConversationMsgApi} from '@/api/modules/interview/conversationMsg';
import {useHandleData} from '@/hooks/useHandleData';
import ConversationMsgForm from '@/views/interview/conversationMsg/components/ConversationMsgForm.vue';
import type {ColumnProps, ProTableInstance, SearchProps} from '@/components/ProTable/interface';
import type {IConversationMsg} from '@/api/interface/interview/conversationMsg';
import ImportExcel from '@/components/ImportExcel/index.vue';

defineOptions({
  name: 'ConversationMsgView'
})
const proTableRef = ref<ProTableInstance>();

// 表格配置项
const columns: ColumnProps<IConversationMsg.ListRow>[] = [
  { type: 'selection', width: 80 },
  { prop: 'id', label: '主键' },
  { prop: 'conversationId', label: '会话id' },
  { prop: 'count', label: '消息数量' },
  { prop: 'createId', label: '创建人' },
  { prop: 'createTime', label: '创建时间' },
  { prop: 'operation', label: '操作', width: 250, fixed: 'right' }
]
// 搜索条件项
const searchColumns: SearchProps[] = [
  { prop: 'conversationId', label: '会话id', el: 'input' },
  { prop: 'createTime', label: '创建时间', el: 'date-picker', props: { type: 'datetimerange' } },
  { prop: 'createId', label: '创建人', el: 'input' }
]

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

// 添加消息详情相关的状态和方法
const drawerVisible = ref(false)
const messageList = ref<IConversationMsg.Message[]>([])

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString()
}

const openDetail = async (row: IConversationMsg.ListRow) => {
  try {
    const { data } = await getConversationMsgDetailApi({ id: row.id! })
    messageList.value = data.messages
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
    `删除【${params.id}】聊天记录表`
  )
  proTableRef.value?.getTableList()
}
// 批量删除信息
const batchDelete = async (ids: (string | number)[]) => {
  await useHandleData(removeConversationMsgApi, { ids }, '删除所选聊天记录表')
  proTableRef.value?.clearSelection()
  proTableRef.value?.getTableList()
}

</script>

<style lang="scss" scoped>
.message-list {
  padding: 20px;

  .message-item {
    margin-bottom: 20px;
    display: flex;

    &.user {
      justify-content: flex-end;

      .message-content {
        background-color: #e3f2fd;
      }
    }

    &.assistant {
      justify-content: flex-start;

      .message-content {
        background-color: #f5f5f5;
      }
    }
  }

  .message-content {
    max-width: 80%;
    padding: 12px;
    border-radius: 8px;

    .message-header {
      margin-bottom: 8px;
      font-size: 14px;

      .role {
        font-weight: bold;
        margin-right: 10px;
      }

      .time {
        color: #999;
      }
    }

    .message-text {
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
  }
}
</style>
