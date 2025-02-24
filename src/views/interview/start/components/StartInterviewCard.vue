<template>
  <el-card class="start-interview-card" shadow="hover">
    <div class="card-content">
      <div class="interviewer-section">
        <template v-if="!selectedBot">
          <el-button type="primary" @click="selectBot">选择面试官</el-button>
        </template>
        <template v-else>
          <div class="selected-bot">
            <div class="bot-avatar">
              <img :src="selectedBot.icon_url || '/default-avatar.png'" alt="面试官头像">
            </div>
            <div class="bot-info">
              <span class="name">{{ selectedBot.bot_name }}</span>
              <el-button type="primary" link @click="selectBot">重新选择</el-button>
            </div>
          </div>
        </template>
      </div>

      <div class="action-section" v-if="selectedBot">
        <div class="button-group">
          <template v-if="showNextStep">
            <el-button
              v-if="hasUnfinishedConversation"
              type="primary"
              @click="continueInterview"
            >
              继续上次面试
            </el-button>
            <el-button
              type="primary"
              @click="startNewInterview"
            >
              开始新面试
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="handleNextStep">下一步</el-button>
          </template>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  selectedBot: any
  hasUnfinishedConversation: boolean
}>()

const emit = defineEmits<{
  (e: 'select-bot'): void
  (e: 'start-interview'): void
  (e: 'continue-interview'): void
  (e: 'fetch-last-conversation'): void
}>()

const showNextStep = ref(false)

const selectBot = () => {
  showNextStep.value = false
  emit('select-bot')
}

const handleNextStep = async () => {
  emit('fetch-last-conversation')
  showNextStep.value = true
}

const startNewInterview = () => {
  emit('start-interview')
}

const continueInterview = () => {
  emit('continue-interview')
}
</script>

<style scoped lang="scss">
.start-interview-card {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  .card-content {
    text-align: center;
    width: 100%;
    padding: 20px;

    .interviewer-section {
      margin-bottom: 30px;

      .selected-bot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;

        .bot-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .bot-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          .name {
            font-size: 14px;
            color: #303133;
          }
        }
      }
    }

    .action-section {
      .button-group {
        display: flex;
        gap: 16px;
        justify-content: center;
      }

      .el-button {
        min-width: 120px;
      }
    }
  }
}
</style>
