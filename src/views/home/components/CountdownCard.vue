<template>
  <div class="countdown-card">
    <div class="card-header">
      <div class="header-left">
        <el-icon class="calendar-icon">
          <Calendar />
        </el-icon>
        <span class="header-title">{{ isSpeakx ? t('home.countdown.examCountdown') : t('home.countdown.nextInterview') }}</span>
      </div>
      <el-icon
        v-if="hasCountdown && !isExpired"
        class="edit-icon"
        @click="showSettingDialog = true"
      >
        <Edit />
      </el-icon>
    </div>

    <div class="card-content">
      <!-- 已设置倒计时 -->
      <template v-if="hasCountdown && !isExpired">
        <div class="countdown-display">
          <div class="days-number">
            {{ daysLeft }}
          </div>
          <div class="days-label">
            {{ t('home.countdown.daysLeft') }}
          </div>
          <div class="target-date">
            {{ formattedTargetDate }}
          </div>
        </div>
        <div
          v-if="!isSpeakx && displayRoleName"
          class="interview-info"
        >
          <span class="role-dot" />
          <span class="role-name">{{ displayRoleName }}</span>
          <span
            v-if="displayCompanyName"
            class="company-name"
          >{{ t('home.countdown.at') }} {{ displayCompanyName }}</span>
        </div>
      </template>

      <!-- 未设置倒计时 -->
      <template v-else-if="!hasCountdown">
        <div class="empty-state">
          <div
            class="plus-circle"
            @click="showSettingDialog = true"
          >
            <el-icon><Plus /></el-icon>
          </div>
          <p class="empty-text">
            {{ isSpeakx ? t('home.countdown.noExamScheduled') : t('home.countdown.noInterviewScheduled') }}
          </p>
          <el-button
            class="add-btn"
            @click="showSettingDialog = true"
          >
            {{ t('home.countdown.addTargetDate') }}
          </el-button>
        </div>
      </template>

      <!-- 超时状态 -->
      <template v-else>
        <div class="expired-state">
          <div class="success-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="expired-date">
            {{ formattedTargetDate }}
          </div>
          <h4 class="expired-title">
            {{ t('home.countdown.howDidItGo') }}
          </h4>
          <p
            v-if="!isSpeakx && displayCompanyName"
            class="expired-info"
          >
            {{ displayCompanyName }} - {{ displayRoleName }}
          </p>
          <div class="feedback-buttons">
            <el-button
              circle
              class="feedback-btn bad"
              @click="handleFeedback('bad')"
            >
              <el-icon><Close /></el-icon>
            </el-button>
            <el-button
              circle
              class="feedback-btn neutral"
              @click="handleFeedback('neutral')"
            >
              <el-icon><Minus /></el-icon>
            </el-button>
            <el-button
              circle
              class="feedback-btn good"
              @click="handleFeedback('good')"
            >
              <el-icon><Check /></el-icon>
            </el-button>
          </div>
          <a
            href="javascript:void(0)"
            class="log-link"
            @click="handleLogResult"
          >
            {{ t('home.countdown.logDetailedResult') }} >
          </a>
        </div>
      </template>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettingDialog"
      :title="isSpeakx ? t('home.countdown.setExamDate') : t('home.countdown.setInterviewDate')"
      width="420px"
      destroy-on-close
      class="countdown-dialog"
    >
      <div class="setting-form">
        <div class="form-item">
          <label class="form-label">
            <el-icon><Calendar /></el-icon>
            {{ t('home.countdown.targetDate') }}
          </label>
          <el-date-picker
            v-model="formData.targetDate"
            type="date"
            :placeholder="t('home.countdown.selectDate')"
            style="width: 100%"
            size="large"
            :disabled-date="disabledDate"
          />
        </div>

        <!-- easy-interview 额外字段 -->
        <template v-if="!isSpeakx">
          <div class="form-item">
            <label class="form-label">
              <el-icon><OfficeBuilding /></el-icon>
              {{ t('home.countdown.company') }}
            </label>
            <el-select
              v-model="formData.companyId"
              :placeholder="t('home.countdown.selectCompany')"
              style="width: 100%"
              size="large"
              filterable
              clearable
              @change="handleCompanyChange"
            >
              <el-option
                v-for="company in companyList"
                :key="company.id!"
                :label="getLocalizedName(company.name, company.nameUs)"
                :value="company.id!"
              />
            </el-select>
          </div>
          <div class="form-item">
            <label class="form-label">
              <el-icon><User /></el-icon>
              {{ t('home.countdown.role') }}
            </label>
            <el-select
              v-model="formData.roleId"
              :placeholder="t('home.countdown.selectRole')"
              style="width: 100%"
              size="large"
              filterable
              clearable
            >
              <el-option
                v-for="role in roleList"
                :key="role.id!"
                :label="getLocalizedName(role.name, role.nameUs)"
                :value="role.id!"
              />
            </el-select>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            size="large"
            round
            @click="showSettingDialog = false"
          >
            {{ t('common.cancel') }}
          </el-button>
          <el-button
            type="primary"
            size="large"
            round
            @click="handleSave"
          >
            {{ t('common.save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/modules/app'
import { Calendar, Edit, Plus, CircleCheck, Close, Minus, Check, OfficeBuilding, User } from '@element-plus/icons-vue'
import { getQuestionCompanyListApi } from '@/api/modules/interview/questionCompany'
import { getQuestionRoleListApi } from '@/api/modules/interview/questionRole'
import { ElMessage } from 'element-plus'
import type { IQuestionCompany } from '@/api/interface/interview/questionCompany'
import type { IQuestionRole } from '@/api/interface/interview/questionRole'

const props = defineProps<{
  isSpeakx: boolean
}>()

const emit = defineEmits(['role-change'])

const { t } = useI18n()
const appStore = useAppStore()

const STORAGE_KEY = computed(() => props.isSpeakx ? 'speakx_countdown' : 'interview_countdown')

const showSettingDialog = ref(false)
const companyList = ref<IQuestionCompany.Row[]>([])
const roleList = ref<IQuestionRole.Row[]>([])

const formData = ref({
  targetDate: null as Date | null,
  companyId: undefined as number | undefined,
  roleId: undefined as number | undefined
})

interface SavedSettings {
  targetDate: string | null
  companyId?: number
  companyName?: string
  companyNameUs?: string
  roleId?: number
  roleName?: string
  roleNameUs?: string
}

const savedSettings = ref<SavedSettings>({
  targetDate: null
})

const hasCountdown = computed(() => !!savedSettings.value.targetDate)

const daysLeft = computed(() => {
  if (!savedSettings.value.targetDate) return 0
  const target = new Date(savedSettings.value.targetDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

const isExpired = computed(() => daysLeft.value < 0)

const formattedTargetDate = computed(() => {
  if (!savedSettings.value.targetDate) return ''
  const date = new Date(savedSettings.value.targetDate)
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  const prefix = props.isSpeakx ? t('home.countdown.exam') + ': ' : ''
  return prefix + date.toLocaleDateString(appStore.language === 'zh-CN' ? 'zh-CN' : 'en-US', options)
})

const getLocalizedName = (name?: string, nameUs?: string) => {
  if (appStore.language === 'zh-CN') {
    return name || ''
  }
  return nameUs || name || ''
}

// 动态获取当前语言的公司名称
const displayCompanyName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return savedSettings.value.companyName || ''
  }
  return savedSettings.value.companyNameUs || savedSettings.value.companyName || ''
})

// 动态获取当前语言的角色名称
const displayRoleName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return savedSettings.value.roleName || ''
  }
  return savedSettings.value.roleNameUs || savedSettings.value.roleName || ''
})

const disabledDate = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

// 加载公司列表
const loadCompanyList = async () => {
  if (props.isSpeakx) return
  const res = await getQuestionCompanyListApi({ page: 1, limit: 999 })
  if (res.data?.rows) {
    companyList.value = res.data.rows
  }
}

// 加载职位列表
const loadRoleList = async () => {
  if (props.isSpeakx) return
  const res = await getQuestionRoleListApi({ page: 1, limit: 999 })
  if (res.data?.rows) {
    roleList.value = res.data.rows
  }
}

// 公司变化时重新加载职位
const handleCompanyChange = () => {
  formData.value.roleId = undefined
}

// 加载保存的设置
const loadSavedSettings = () => {
  const saved = localStorage.getItem(STORAGE_KEY.value)
  if (saved) {
    savedSettings.value = JSON.parse(saved)
    // 通知父组件 roleId 变化
    if (savedSettings.value.roleId) {
      emit('role-change', savedSettings.value.roleId)
    }
  }
}

// 保存设置
const handleSave = () => {
  if (!formData.value.targetDate) {
    ElMessage.warning(t('home.countdown.pleaseSelectDate'))
    return
  }

  const settings: SavedSettings = {
    targetDate: formData.value.targetDate.toISOString()
  }

  if (!props.isSpeakx) {
    settings.companyId = formData.value.companyId
    settings.roleId = formData.value.roleId

    if (formData.value.companyId) {
      const company = companyList.value.find(c => c.id === formData.value.companyId) as any
      if (company) {
        settings.companyName = company.companyName || company.name || ''
        settings.companyNameUs = company.companyNameUs || company.nameUs || ''
      }
    }

    if (formData.value.roleId) {
      const role = roleList.value.find(r => r.id === formData.value.roleId) as any
      if (role) {
        settings.roleName = role.roleName || role.name || ''
        settings.roleNameUs = role.roleNameUs || role.nameUs || ''
      }
    }
  }

  localStorage.setItem(STORAGE_KEY.value, JSON.stringify(settings))
  savedSettings.value = settings
  showSettingDialog.value = false

  // 通知父组件 roleId 变化
  if (settings.roleId) {
    emit('role-change', settings.roleId)
  }

  ElMessage.success(t('common.save') + ' ' + t('message.success'))
}

// 处理反馈
const handleFeedback = (type: 'bad' | 'neutral' | 'good') => {
  ElMessage.success(t('home.countdown.feedbackReceived'))
  // 清除设置，显示未设置状态
  localStorage.removeItem(STORAGE_KEY.value)
  savedSettings.value = { targetDate: null }
}

// 记录详细结果
const handleLogResult = () => {
  //ElMessage.info(t('home.countdown.logFeatureComingSoon'))
}

// 监听对话框打开时初始化表单
watch(showSettingDialog, (val) => {
  if (val && savedSettings.value.targetDate) {
    formData.value.targetDate = new Date(savedSettings.value.targetDate)
    formData.value.companyId = savedSettings.value.companyId
    formData.value.roleId = savedSettings.value.roleId
  }
})

onMounted(() => {
  loadSavedSettings()
  loadCompanyList()
  loadRoleList()
})
</script>

<style scoped lang="scss">
.countdown-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100%;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;

      .calendar-icon {
        color: #00b4a0;
        font-size: 18px;
      }

      .header-title {
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }
    }

    .edit-icon {
      color: #999;
      cursor: pointer;
      font-size: 16px;

      &:hover {
        color: #00b4a0;
      }
    }
  }

  .countdown-display {
    text-align: center;
    padding: 20px 0;

    .days-number {
      font-size: 56px;
      font-weight: 700;
      color: #00b4a0;
      line-height: 1;
    }

    .days-label {
      font-size: 14px;
      color: #666;
      margin: 8px 0;
    }

    .target-date {
      display: inline-block;
      background: #f5f5f5;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 13px;
      color: #666;
    }
  }

  .interview-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
    margin-top: 12px;

    .role-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #1890ff;
    }

    .role-name {
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .company-name {
      font-size: 13px;
      color: #999;
    }
  }

  .empty-state {
    text-align: center;
    padding: 30px 0;

    .plus-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #e6f7ff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      cursor: pointer;
      transition: all 0.3s;

      .el-icon {
        font-size: 28px;
        color: #1890ff;
      }

      &:hover {
        background: #bae7ff;
        transform: scale(1.05);
      }
    }

    .empty-text {
      font-size: 15px;
      color: #666;
      margin: 0 0 16px 0;
    }

    .add-btn {
      border-radius: 20px;
      padding: 10px 24px;
    }
  }

  .expired-state {
    text-align: center;
    padding: 16px 0;

    .success-icon {
      .el-icon {
        font-size: 32px;
        color: #52c41a;
      }
    }

    .expired-date {
      font-size: 13px;
      color: #999;
      margin: 8px 0;
    }

    .expired-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 12px 0 8px;
    }

    .expired-info {
      font-size: 13px;
      color: #666;
      margin: 0 0 16px 0;
    }

    .feedback-buttons {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 16px;

      .feedback-btn {
        width: 30px;
        height: 30px;

        &.bad {
          border-color: #ff4d4f;
          color: #ff4d4f;

          &:hover {
            background: #fff1f0;
          }
        }

        &.neutral {
          border-color: #d9d9d9;
          color: #999;

          &:hover {
            background: #fafafa;
          }
        }

        &.good {
          border-color: #52c41a;
          color: #52c41a;

          &:hover {
            background: #f6ffed;
          }
        }
      }
    }

    .log-link {
      color: #1890ff;
      font-size: 13px;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// 对话框样式
:deep(.countdown-dialog) {
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    margin-right: 0;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }

  .el-dialog__body {
    padding: 24px;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #f0f0f0;
  }
}

.setting-form {
  .form-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 10px;

      .el-icon {
        color: #667eea;
        font-size: 16px;
      }
    }

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      border-radius: 10px;
      box-shadow: 0 0 0 1px #e4e7ed inset;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px #667eea inset;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    min-width: 100px;

    &--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        opacity: 0.9;
      }
    }
  }
}
</style>
