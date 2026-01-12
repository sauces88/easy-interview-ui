<template>
  <div
    ref="containerRef"
    class="user-subscription"
  >
    <!-- 用户信息区域 -->
    <div
      class="user-card"
      @click="toggleExpand"
    >
      <div class="avatar-wrapper">
        <el-avatar
          :size="36"
          class="user-avatar"
        >
          {{ avatarText }}
        </el-avatar>
        <div
          class="status-indicator"
          :class="{ expired: isExpired }"
        />
      </div>
      <div class="user-info">
        <div class="extra-line">
          <span
            class="extra-badge"
            :class="{ free: extra === 'Free', expired: isExpired && extra !== 'Free' }"
          >
            {{ extra }}
          </span>
          <span class="credit-value">{{ formattedCredit }}</span>
        </div>
        <div class="timeout-line">
          {{ formattedTimeout }}
        </div>
      </div>
      <div class="expand-trigger">
        <el-icon
          class="expand-icon"
          :class="{ 'is-expanded': isExpanded }"
        >
          <ArrowRight />
        </el-icon>
      </div>
    </div>

    <!-- 从右侧展开的悬浮卡片 -->
    <transition name="popup">
      <div
        v-show="isExpanded"
        class="popup-card"
        :style="popupStyle"
      >
        <!-- Credits 部分 -->
        <div class="popup-section">
          <div class="section-header">
            <el-icon><Coin /></el-icon>
            <span>剩余积分</span>
          </div>
          <div class="credit-display">
            {{ formattedCredit }}
          </div>
          <el-button
            type="primary"
            size="default"
            class="upgrade-btn"
            @click="handleUpgradeClick"
          >
            {{ isExpired ? '⚡ Upgrade' : '⚡ Renewal' }}
          </el-button>
        </div>

        <!-- Settings 部分 -->
        <div class="popup-section">
          <!--          <div class="section-header">-->
          <!--            <el-icon><Setting /></el-icon>-->
          <!--            <span>设置</span>-->
          <!--          </div>-->
          <div
            class="settings-item"
            @click="handleSettingsClick"
          >
            <el-icon><User /></el-icon>
            <span class="settings-name">{{ displayName }}</span>
            <span class="settings-hover-text">个人信息设置</span>
            <el-icon class="arrow">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
      </div>
    </transition>

    <!-- 点击外部关闭 -->
    <div
      v-show="isExpanded"
      class="popup-overlay"
      @click="toggleExpand"
    />

    <!-- 个人信息弹窗 -->
    <ResearchUserInfoDialog
      ref="userInfoDialogRef"
      @success="handleInfoUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Coin, User} from '@element-plus/icons-vue'
import ResearchUserInfoDialog from '@/views/research/researchUser/components/ResearchUserInfoDialog.vue'

const router = useRouter()

interface Props {
  name: string
  timeout: string
  credit: number
  extra: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'info-updated': []
}>()

const isExpanded = ref(false)
const containerRef = ref<HTMLElement>()
const userInfoDialogRef = ref<InstanceType<typeof ResearchUserInfoDialog>>()

// 显示的用户名
const displayName = computed(() => props.name || '未设置姓名')

// 头像文字（取名字的第一个字）
const avatarText = computed(() => {
  if (props.name) {
    return props.name.charAt(0).toUpperCase()
  }
  return 'U'
})

// 格式化积分显示
const formattedCredit = computed(() => {
  return props.credit.toLocaleString()
})

// 判断是否过期
const isExpired = computed(() => {
  if (!props.timeout) return true
  if (props.credit === 0) return true
  return new Date(props.timeout) < new Date()
})

// 格式化到期时间
const formattedTimeout = computed(() => {
  if (!props.timeout) return ''
  const date = new Date(props.timeout)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
})

// 计算弹出卡片位置
const popupStyle = computed(() => {
  if (!containerRef.value) return {}
  const rect = containerRef.value.getBoundingClientRect()
  const cardWidth = 240
  const gap = 8
  const viewportWidth = window.innerWidth

  // 计算期望的左侧位置
  let left = rect.right + gap

  // 如果超出右侧，则显示在左侧
  if (left + cardWidth > viewportWidth) {
    left = rect.left - cardWidth - gap
  }

  // 底部对齐父容器
  const bottom = window.innerHeight - rect.bottom

  return {
    bottom: `${bottom}px`,
    left: `${left}px`
  }
})

// 切换展开/收起
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 点击 Upgrade/Renewal 按钮
const handleUpgradeClick = () => {
  toggleExpand()
  router.push('/pay/commodity/card')
}

// 点击设置
const handleSettingsClick = () => {
  userInfoDialogRef.value?.open(true) // 允许取消
  toggleExpand()
}

// 信息更新成功回调
const handleInfoUpdated = () => {
  emit('info-updated')
}
</script>

<style scoped lang="scss">
.user-subscription {
  padding: 5px;
  background: var(--el-menu-bg-color);
  flex-shrink: 0;
  position: relative;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.1);
  }
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;

  .user-avatar {
    background: #2c3e50;
    color: #ecf0f1;
    font-weight: 600;
  }

  .status-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #52c41a;
    border: 2px solid var(--el-menu-bg-color);

    &.expired {
      background: #ff4d4f;
    }
  }
}

.user-info {
  flex: 1;
  margin-left: 10px;
  min-width: 0;
  padding: 2px 0;

  .extra-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .extra-badge {
      font-weight: 600;
      font-size: 13px;
      padding: 2px 8px;
      background: #262626;
      color: #fff;
      border-radius: 4px;

      &.free {
        background: #d9d9d9;
        color: #8c8c8c;
      }

      &.expired {
        background: #d9d9d9;
        color: #8c8c8c;
      }
    }

    .credit-value {
      display: inline-block;
      font-size: 12px;
      color: #262626;
      padding: 2px 8px;
      background: #f5f5f5;
      border-radius: 4px;
      border: 1px solid #e8e8e8;
      white-space: nowrap;

      &::before {
        content: '✨ ';
        color: #8c8c8c;
        font-weight: 500;
      }
    }
  }

  .timeout-line {
    margin-top: 11px;
    font-size: 11px;
    color: #8c8c8c;
    line-height: 1.4;
  }
}

.expand-trigger {
  flex-shrink: 0;
  margin-left: 8px;
  align-self: flex-end;

  .expand-icon {
    color: #8c8c8c;
    transition: transform 0.5s;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

// 悬浮卡片
.popup-card {
  position: fixed;
  width: 240px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 2001;
  overflow: hidden;
}

.popup-section {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #595959;
  margin-bottom: 12px;

  .el-icon {
    color: #262626;
  }
}

.credit-display {
  font-size: 32px;
  font-weight: 700;
  color: #262626;
  text-align: center;
  margin-bottom: 12px;
}

.upgrade-btn {
  width: 100%;
  background: #262626;
  border-color: #262626;
  color: #fff;

  &:hover,
  &:focus {
    background: #434343;
    border-color: #434343;
  }

  &:active {
    background: #262626;
    border-color: #262626;
  }
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.06);

  .el-icon:first-child {
    color: #262626;
  }

  position: relative;

  .settings-name {
    flex: 1;
    font-size: 13px;
    color: #262626;
    opacity: 1;
    transition: opacity 0.3s ease;
  }

  .settings-hover-text {
    position: absolute;
    left: 38px;
    right: 32px;
    font-size: 13px;
    color: #262626;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.1);

    .settings-name {
      opacity: 0;
    }

    .settings-hover-text {
      opacity: 1;
    }
  }

  .arrow {
    color: #8c8c8c;
    font-size: 12px;
  }
}

// 遮罩层
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: transparent;
}

// 动画
.popup-enter-active,
.popup-leave-active {
  transition: all 0.2s;
}

.popup-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.popup-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
