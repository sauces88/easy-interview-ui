<template>
  <div class="feedback-result-container">
    <!-- 标题根据状态动态显示 -->
    <div class="feedback-header">
      <h2>{{ t('interview.feedback.title') }}</h2>
      <p>{{ t('interview.feedback.subtitle') }}</p>
    </div>

    <!-- 公司和职位信息 -->
    <div class="interview-info">
      <div class="info-tags">
        <div class="tag company-tag">
          <el-icon><OfficeBuilding /></el-icon>
          {{ localizedCompanyName }}
        </div>
        <div class="tag role-tag">
          {{ localizedRoleName }}
        </div>
      </div>
    </div>

    <!-- 分数展示 -->
    <div
      class="score-section"
      v-if="!isProcessing && !isForceEnded && !isError && hasCompletedFeedback"
    >
      <div class="score-wrapper">
        <div class="score-display">
          <div class="score-number">
            {{ score || 0 }}
          </div>
          <div class="score-info">
            <div class="score-text">
              {{ t('interview.feedback.score') }}
            </div>
            <div class="score-comment">
              {{ scoreComment }}
            </div>
          </div>
        </div>
      </div>
      <div class="try-again-button">
        <el-button
          type="primary"
          class="primary-action-button"
          @click="$emit('try-again')"
        >
          {{ t('interview.feedback.tryAgain') }}
        </el-button>
      </div>
    </div>

    <!-- 处理中状态 -->
    <div
      class="processing-section"
      v-if="isProcessing"
    >
      <p>{{ t('interview.feedback.analysisInProgress') }}</p>
      <div class="processing-illustration">
        <img
          src="@/assets/images/processing.svg"
          alt="处理中"
          class="processing-image"
        >
      </div>

      <div class="processing-actions">
        <div class="action-buttons">
          <el-button
            class="secondary-action-button"
            @click="$emit('refresh-data')"
          >
            <el-icon class="refresh-icon">
              <Refresh />
            </el-icon>
            {{ t('interview.feedback.refreshData') }}
          </el-button>
          <el-button
            type="primary"
            class="primary-action-button"
            @click="$emit('try-again')"
          >
            {{ t('interview.feedback.tryAgain') }}
          </el-button>
        </div>
        <p class="processing-tip">
          {{ t('interview.feedback.waitingForAnalysis') }}
        </p>
      </div>
    </div>

    <!-- 强制结束状态 -->
    <div
      class="force-ended-section"
      v-if="isForceEnded"
    >
      <div class="force-ended-message">
        {{ t('interview.feedback.forceEnded') }}
      </div>
      <el-button
        type="primary"
        class="primary-action-button"
        @click="$emit('try-again')"
      >
        {{ t('interview.feedback.tryAgain') }}
      </el-button>
    </div>

    <!-- 错误状态 -->
    <div
      class="error-section"
      v-if="isError"
    >
      <div class="error-message">
        {{ t('interview.feedback.analysisError') }}
      </div>
      <div class="error-actions">
        <el-button
          type="primary"
          class="primary-action-button"
          @click="$emit('retry-analysis')"
        >
          {{ t('interview.feedback.retryAnalysis') }}
        </el-button>
        <el-button
          class="secondary-action-button"
          @click="$emit('try-again')"
        >
          {{ t('interview.feedback.tryAgain') }}
        </el-button>
      </div>
    </div>

    <!-- 优势和劣势分析 -->
    <div
      v-if="!isProcessing && !isForceEnded && !isError && hasCompletedFeedback"
      class="strengths-weaknesses"
    >
      <div class="strengths">
        <div class="section-header">
          <div class="icon-wrapper positive">
            <el-icon><Check /></el-icon>
          </div>
          <h3>{{ t('interview.feedback.strengths') }}</h3>
        </div>
        <ul
          class="points-list"
          v-if="strengths && strengths.length"
        >
          <li
            v-for="(strength, index) in strengths"
            :key="index"
          >
            {{ strength }}
          </li>
        </ul>
        <div
          class="empty-list"
          v-else
        >
          {{ t('interview.feedback.noData') }}
        </div>
      </div>

      <div class="weaknesses">
        <div class="section-header">
          <div class="icon-wrapper negative">
            <el-icon><Close /></el-icon>
          </div>
          <h3>{{ t('interview.feedback.weaknesses') }}</h3>
        </div>
        <ul
          class="points-list"
          v-if="weaknesses && weaknesses.length"
        >
          <li
            v-for="(weakness, index) in weaknesses"
            :key="index"
          >
            {{ weakness }}
          </li>
        </ul>
        <div
          class="empty-list"
          v-else
        >
          {{ t('interview.feedback.noData') }}
        </div>
      </div>
    </div>

    <!-- 专家反馈 -->
    <div
      class="expert-feedback"
      v-if="!isProcessing && !isForceEnded && !isError && hasCompletedFeedback"
    >
      <div class="section-header">
        <div class="icon-wrapper info">
          <el-icon><InfoFilled /></el-icon>
        </div>
        <h3>{{ t('interview.feedback.expertFeedback') }}</h3>
      </div>
      <div
        class="feedback-content"
        v-if="feedback"
      >
        {{ feedback }}
      </div>
      <div
        class="empty-feedback"
        v-else
      >
        {{ t('interview.feedback.noFeedbackData') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Check, Close, InfoFilled, OfficeBuilding, Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/modules/app';
import type { IMockInterview } from '@/api/interface/interview/mockInterview';

const props = defineProps<{
  mockInterview: IMockInterview.Row;
  companyName?: string;
  companyNameUs?: string;
  roleName?: string;
  roleNameUs?: string;
}>();

const emit = defineEmits<{
  (e: 'try-again'): void;
  (e: 'retry-analysis'): void;
  (e: 'refresh-data'): void;
}>();

const { t } = useI18n();
const appStore = useAppStore();

// 获取本地化的公司名称
const localizedCompanyName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return props.companyName || t('interview.feedback.noSpecificCompany');
  }
  return props.companyNameUs || props.companyName || t('interview.feedback.noSpecificCompany');
});

// 获取本地化的职位名称
const localizedRoleName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return props.roleName || t('interview.feedback.noSpecificRole');
  }
  return props.roleNameUs || props.roleName || t('interview.feedback.noSpecificRole');
});

// 判断面试状态
const isProcessing = computed(() => {
  // 状态0或1表示正在处理中
  return props.mockInterview.completed === '0' || props.mockInterview.completed === '1';
});

const isForceEnded = computed(() => props.mockInterview.completed === '2');
const isError = computed(() => props.mockInterview.completed === '4');
const isCompleted = computed(() => props.mockInterview.completed === '3');

// 判断是否有完整的反馈数据
const hasCompletedFeedback = computed(() => {
  return isCompleted.value && !!props.mockInterview.feedback;
});

// 从反馈中解析出分数、优势、劣势和专家反馈
const parsedFeedback = computed(() => {
  try {
    if (props.mockInterview.feedback) {
      return JSON.parse(props.mockInterview.feedback);
    }
    return null;
  } catch (e) {
    console.error('解析反馈数据失败:', e);
    return null;
  }
});

// 提取分数
const score = computed(() => {
  return parsedFeedback.value?.score || 0;
});

// 提取评价文字
const scoreComment = computed(() => {
  if (score.value < 30) return t('interview.feedback.continueEffort');
  if (score.value < 60) return t('interview.feedback.progress');
  if (score.value < 80) return t('interview.feedback.goodPerformance');
  return t('interview.feedback.excellent');
});

// 提取优势
const strengths = computed(() => {
  return parsedFeedback.value?.strengths || [];
});

// 提取劣势
const weaknesses = computed(() => {
  return parsedFeedback.value?.weaknesses || [];
});

// 提取专家反馈
const feedback = computed(() => {
  return parsedFeedback.value?.feedback || '';
});
</script>

<style scoped>
.feedback-result-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0;
}

.feedback-header {
  text-align: center;
  margin-bottom: 24px;
}

.feedback-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
}

.feedback-header p {
  color: #666;
  font-size: 16px;
}

.interview-info {
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.tag .el-icon {
  margin-right: 6px;
  font-size: 14px;
}

.company-tag {
  background-color: #feefef;
  color: #e74c3c;
}

.role-tag {
  background-color: #e7f5f9;
  color: #29b6f6;
}

.score-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.score-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: white;
  border-radius: 12px;
  padding-left: 30px;
  padding-right: 30px;
  padding-top: 5px;
  padding-bottom: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.score-display {
  display: flex;
  align-items: center;
  width: 100%;
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  color: #e74c3c;
  margin-right: 20px;
}

.score-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.score-text {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.score-comment {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

/* 新的按钮样式，参考QuestionItem.vue */
.primary-action-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 20px 30px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-bottom: 20px;
}

.primary-action-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.secondary-action-button {
  background-color: #ffffff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 50px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.secondary-action-button:hover {
  background-color: #f2f6fc;
  border-color: #c6e2ff;
}

.processing-section {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  margin: 0 0 32px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  min-height: 350px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.processing-illustration {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

.processing-image {
  max-width: 200px;
  height: auto;
  opacity: 0.8;
}

.processing-actions {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.refresh-icon {
  margin-right: 6px;
}

.processing-tip {
  margin-top: 15px;
  color: #909399;
  font-size: 14px;
  max-width: 500px;
}

.strengths-weaknesses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 32px;
}

.strengths, .weaknesses {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 12px;
}

.icon-wrapper.positive {
  background-color: #d4edda;
  color: #28a745;
}

.icon-wrapper.negative {
  background-color: #feefef;
  color: #e74c3c;
}

.icon-wrapper.info {
  background-color: #e7f5f9;
  color: #17a2b8;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.points-list {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
}

.points-list li {
  margin-bottom: 10px;
  color: #495057;
  line-height: 1.5;
}

.empty-list, .empty-feedback {
  color: #6c757d;
  font-style: italic;
}

.expert-feedback {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.feedback-content {
  color: #495057;
  line-height: 1.6;
  white-space: pre-line;
}

.force-ended-section, .error-section {
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  margin: 32px 0;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.force-ended-message, .error-message {
  font-size: 18px;
  color: #e74c3c;
  margin-bottom: 20px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}
</style>
