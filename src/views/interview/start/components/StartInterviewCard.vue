<template>
  <el-card class="start-interview-card" shadow="hover">
    <div class="card-content">
      <div class="interviewer-section">
        <template v-if="!selectedBot">
          <el-button type="primary" @click="selectBot">
            {{ t('interview.start.selectBot') }}
          </el-button>
        </template>
        <template v-else>
          <div class="selected-bot">
            <div class="bot-avatar">
              <img :src="selectedBot.icon_url || '/default-avatar.png'" :alt="t('interview.start.botAvatar')">
            </div>
            <div class="bot-info">
              <span class="name">{{ selectedBot.bot_name }}</span>
              <el-button type="primary" link @click="selectBot">
                {{ t('interview.start.reselect') }}
              </el-button>
            </div>
          </div>
        </template>
      </div>

      <div class="action-section" v-if="selectedBot">
        <div class="button-group">
          <el-button
            v-if="hasUnfinishedConversation"
            type="primary"
            @click="continueInterview"
          >
            {{ t('interview.start.continueInterview') }}
          </el-button>
          <el-button
            type="primary"
            @click="startNewInterview"
            :disabled="loading"
          >
            {{ t('interview.start.startButton') }}
          </el-button>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const loading = ref(false)

const props = defineProps<{
  selectedBot: any
  hasUnfinishedConversation: boolean
}>()

const emit = defineEmits<{
  (e: 'select-bot'): void
  (e: 'start-interview'): void
  (e: 'continue-interview'): void
  (e: 'fetch-last-conversation'): void
}>()

const selectBot = async () => {
  emit('select-bot')
  emit('fetch-last-conversation')
}

const startNewInterview = () => {
  emit('start-interview')
}

const continueInterview = () => {
  emit('continue-interview')
}

watch(() => props.selectedBot, (newBot) => {
  if (newBot) {
    emit('fetch-last-conversation')
  }
})
</script>

<style scoped lang="scss">
.start-interview-card {
  height: 100%;

  :deep(.el-card__body) {
    height: 100%;
    padding: 0;
  }

  .card-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 20px;

    .interviewer-section {
      margin-bottom: 40px;
      width: 100%;
      text-align: center;

      .selected-bot {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;

        .bot-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid #ebeef5;

          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            background-color: #f5f7fa;
          }
        }

        .bot-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;

          .name {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }
        }
      }
    }

    .action-section {
      width: 100%;
      
      .button-group {
        display: flex;
        gap: 16px;
        justify-content: center;

        .el-button {
          min-width: 140px;
          height: 40px;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
