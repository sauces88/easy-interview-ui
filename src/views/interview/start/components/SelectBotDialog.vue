<template>
  <el-dialog
    v-model="dialogVisible"
    width="1250px"
    draggable
  >
    <template #header>
      <div class="dialog-header">
        <span>选择面试官</span>
      </div>
    </template>

    <div class="bot-list">
      <el-scrollbar>
        <div class="bot-grid">
          <div
            v-for="bot in botList"
            :key="bot.bot_id"
            class="bot-item"
          >
            <el-card
              class="bot-card"
              :class="{ 'is-selected': selectedBotId === bot.bot_id }"
              shadow="hover"
              @click="handleSelect(bot)"
            >
              <div class="bot-avatar">
                <img
                  :src="bot.icon_url || '/default-avatar.png'"
                  :alt="bot.bot_name"
                >
                <div
                  class="selected-mask"
                  v-if="selectedBotId === bot.bot_id"
                >
                  <el-icon class="selected-icon">
                    <Check />
                  </el-icon>
                </div>
              </div>
              <div class="bot-info">
                <h3 class="bot-name">
                  {{ bot.bot_name }}
                </h3>
                <el-tooltip
                  :content="bot.description || '暂无描述'"
                  placement="top-start"
                  :show-after="200"
                  :hide-after="0"
                  :enterable="true"
                >
                  <p class="bot-description">
                    {{ bot.description || '暂无描述' }}
                  </p>
                </el-tooltip>
              </div>
            </el-card>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {Check} from '@element-plus/icons-vue'
import type {IBot} from "@/api/interface/interview/bot"
import {getBotListApi, getBotDetailApi} from '@/api/modules/interview/bot'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', bot: IBot.Row, prologue: string): void
}>()

const dialogVisible = ref(props.modelValue)
const botList = ref<IBot.Row[]>([])

// 添加选中状态
const selectedBotId = ref<string>('')

// 监听 props 变化
watch(() => props.modelValue, (val) => {
  if (dialogVisible.value !== val) {
    dialogVisible.value = val
    if (val) {
      getTableList()
    }
  }
})

// 监听内部状态变化
watch(() => dialogVisible.value, (val) => {
  if (val !== props.modelValue) {
    emit('update:modelValue', val)
  }
})

// 获取列表数据
const getTableList = async () => {
  const result = await getBotListApi({page: 1, limit: 99, identifier: "easy.interview.main"})
  botList.value = result.data.rows
}

// 修改选择处理函数
const handleSelect = async (bot: IBot.Row) => {
  try {
    // 获取bot详情
    const { data } = await getBotDetailApi(bot.bot_id)
    // 发送选择事件，包含开场白
    emit('select', bot, data.onboarding_info.prologue)
    selectedBotId.value = bot.bot_id
    dialogVisible.value = false
  } catch (error) {
    console.error('获取面试官详情失败：', error)
  }
}
</script>

<style scoped lang="scss">
.dialog-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;

  span {
    font-size: 16px;
    font-weight: bold;
  }
}

.bot-list {
  height: 60vh;
  padding: 0;

  .bot-grid {
    display: grid;
    grid-template-columns: repeat(4, 280px);
    gap: 22px;
    justify-content: center;
    margin: 0 auto;
    padding: 0 10px;
  }

  .bot-item {
    width: 100%;
  }

  @media screen and (max-width: 1400px) {
    .bot-grid {
      grid-template-columns: repeat(3, 280px);
    }
  }

  @media screen and (max-width: 1100px) {
    .bot-grid {
      grid-template-columns: repeat(2, 280px);
    }
  }

  @media screen and (max-width: 768px) {
    .bot-grid {
      grid-template-columns: repeat(1, 280px);
    }
  }

  .bot-card {
    margin: 5px 0;
    cursor: pointer;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    transition: all 0.3s;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: calc(100% - 10px);
    position: relative;
    z-index: 1;

    &:hover {
      margin-top: 0;
      margin-bottom: 10px;
      border-color: #c0c4cc;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2;
    }

    &.is-selected {
      border-color: var(--el-color-primary);
      border-width: 2px;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      z-index: 3;

      .bot-avatar {
        .selected-mask {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(64, 158, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;

          .selected-icon {
            font-size: 32px;
            color: #fff;
          }
        }
      }
    }

    .bot-avatar {
      position: relative;
      width: 100%;
      padding-bottom: 60%;
      overflow: hidden;
      background-color: #f5f7fa;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 75%;
        height: 75%;
        object-fit: contain;
      }
    }

    .bot-info {
      padding: 16px;
      margin-top: 0;

      .bot-name {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: bold;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .bot-description {
        margin: 0;
        font-size: 14px;
        color: #909399;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.6;
        height: 44px;
      }
    }
  }
}

:deep(.el-dialog__header) {
  padding: 16px !important;
  margin: 0 !important;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-dialog__body) {
  padding: 16px 32px !important;
  margin: 0 !important;
  height: calc(70vh - 100px);
  overflow: hidden;
}

:deep(.el-dialog__header),
:deep(.el-dialog__body) {
  margin: 0 !important;
}

:deep(.el-tooltip__popper) {
  max-width: 300px;
  line-height: 1.6;
  padding: 8px 12px;
}
</style>
