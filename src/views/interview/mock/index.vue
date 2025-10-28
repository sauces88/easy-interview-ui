<template>
  <div class="mock-interview-container">
    <!-- 选择阶段 -->
    <div
      v-if="currentStep === 'select'"
      class="interview-step"
    >
      <div class="interview-header">
        <h2>{{ t('interview.mock.title') }}</h2>
        <p>{{ t('interview.mock.subtitle') }}</p>
      </div>

      <div class="interview-content">
        <div class="steps-wrapper">
          <div class="steps">
            <div
              class="step"
              :class="{ active: selectStep === 'company' }"
            >
              <div class="step-number">
                1
              </div>
              <div class="step-title">
                {{ t('interview.mock.selectCompany') }}
              </div>
            </div>
            <div
              class="step"
              :class="{ active: selectStep === 'role' }"
            >
              <div class="step-number">
                2
              </div>
              <div class="step-title">
                {{ t('interview.mock.selectRole') }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="selectStep === 'company'"
          class="selection-panel"
        >
          <h3 class="selection-title">
            {{ t('interview.mock.selectCompanyPrompt') }}
          </h3>

          <!-- 不指定公司选项 -->
          <div
            class="no-company-option"
            @click="selectCompany(null)"
            :class="{ active: isNoCompanySelected }"
          >
            <span>{{ t('interview.mock.noSpecificCompany') }}</span>
          </div>

          <!-- 搜索框 -->
          <div class="search-container">
            <el-input
              v-model="searchCompany"
              :placeholder="t('interview.mock.searchCompany')"
              :prefix-icon="Search"
              clearable
              class="rounded-search"
            >
              <template #prefix>
                <i class="el-icon-search" />
              </template>
            </el-input>
          </div>

          <!-- 公司卡片 -->
          <div class="company-grid">
            <div
              v-for="company in filteredCompanies"
              :key="company.id"
              class="company-card"
              :class="{ active: isCompanyCardActive(company.id) }"
              @click="selectCompany(company)"
            >
              <div class="company-logo">
                <img
                  v-if="company.logo"
                  :src="company.logo"
                  :alt="getLocalizedCompanyName(company)"
                >
                <span v-else>{{ getInitials(getLocalizedCompanyName(company)) }}</span>
              </div>
              <div class="company-name">
                {{ getLocalizedCompanyName(company) }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="selectStep === 'role'"
          class="selection-panel"
        >
          <h3 class="selection-title">
            {{ t('interview.mock.selectRolePrompt') }}
          </h3>

          <!-- 搜索框 -->
          <div class="search-container">
            <el-input
              v-model="searchRole"
              :placeholder="t('interview.mock.searchRole')"
              :prefix-icon="Search"
              clearable
              class="rounded-search"
            >
              <template #prefix>
                <i class="el-icon-search" />
              </template>
            </el-input>
          </div>

          <!-- 职位卡片网格 -->
          <div class="role-grid">
            <div
              v-for="role in filteredRoles"
              :key="role.id"
              class="role-card"
              :class="{ active: isRoleCardActive(role.id) }"
              @click="selectRole(role)"
            >
              <div class="role-icon">
                <Checked style="width: 1em; height: 1em;" />
              </div>
              <div class="role-name">
                {{ getLocalizedRoleName(role) }}
              </div>
            </div>
            <div
              v-if="roleOptions.length > 0 && filteredRoles.length === 0"
              class="no-roles-message"
            >
              {{ t('interview.mock.noMatchingRoles', { search: searchRole }) }}
            </div>
            <div
              v-if="roleOptions.length === 0"
              class="no-roles-message"
            >
              {{ t('interview.mock.noRolesAvailable') }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-buttons-container">
            <el-button
              class="back-button"
              @click="goToCompanySelect"
            >
              <el-icon><ArrowLeftBold /></el-icon>
              {{ t('common.back') }}
            </el-button>
            <el-button
              type="primary"
              class="start-button"
              @click="startInterview"
              :disabled="!isRoleSelected"
            >
              {{ t('interview.mock.startInterview') }}
              <el-icon><ArrowRightBold /></el-icon>
            </el-button>
          </div>
        </div>

        <div class="action-section">
          <div
            v-if="selectStep === 'company'"
            class="action-buttons-container"
          >
            <div />
            <el-button
              type="primary"
              class="start-button"
              @click="goToRoleSelect"
              :disabled="!isCompanySelected"
            >
              {{ t('common.nextStep') }} <el-icon><ArrowRightBold /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 问答阶段 -->
    <div
      v-if="currentStep === 'interview'"
      class="interview-step"
    >
      <QuestionList
        v-if="mockInterviewId && qaList.length > 0"
        :mock-interview-id="mockInterviewId"
        :questions="qaList"
        :company-id="formData.companyId"
        :role-id="formData.roleId"
        @interview-completed="handleInterviewCompleted"
      />
    </div>

    <!-- 完成阶段 - 使用FeedbackResult组件 -->
    <div
      v-if="currentStep === 'completed'"
      class="interview-step"
    >
      <FeedbackResult
        v-if="lastInterview"
        :mock-interview="lastInterview"
        :company-name="selectedCompanyName"
        :company-name-us="selectedCompanyNameUs"
        :role-name="selectedRoleName"
        :role-name-us="selectedRoleNameUs"
        @try-again="restartInterview"
        @retry-analysis="retryAnalysis"
        @refresh-data="refreshMockInterviewData"
      />
    </div>

    <!-- 继续上次面试对话框 -->
    <el-dialog
      v-model="showContinueDialog"
      :title="$t('interview.start.continueInterview')"
      width="480px"
      top="300px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      custom-class="continue-interview-dialog"
    >
      <div class="continue-dialog-content">
        <p class="dialog-title" />

        <div
          class="interview-info-tags"
          v-if="lastInterview"
        >
          <div class="info-tag company-tag">
            <el-icon><OfficeBuilding /></el-icon>
            {{ localizedCompanyName }}
          </div>
          <div
            class="info-tag role-tag"
            v-if="localizedRoleName"
          >
            {{ localizedRoleName }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            class="dialog-button cancel-button"
            @click="startNewInterview"
          >
            {{ $t('interview.start.newInterview') }}
          </el-button>
          <el-button
            type="primary"
            class="dialog-button continue-button"
            @click="continuePreviousInterview"
          >
            {{ $t('interview.start.continueInterview') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <div
      v-if="isLoading"
      class="loading-mask"
      v-loading="true"
      :element-loading-text="loadingText"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElLoading } from 'element-plus';
import { Search, Checked, ArrowRightBold, ArrowLeftBold, OfficeBuilding } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/modules/app';
import QuestionList from './components/QuestionList.vue';
import FeedbackResult from './components/FeedbackResult.vue';
import { getAgentIdByIdentifier } from '@/api/modules/interview/personalizedPlan';
import {
  getLastMockInterviewVO,
  createMockInterviewApi,
  analyseApi,
  getMockInterviewDetailApi
} from '@/api/modules/interview/mockInterview';
import {
  getQuestionCompanyListApi,
  getQuestionCompanyDetailApi
} from '@/api/modules/interview/questionCompany';
import {
  getQuestionRoleListByCompanyIdApi,
  getQuestionRoleDetailApi
} from '@/api/modules/interview/questionRole';
import {
  getMockInterviewQaListApi
} from '@/api/modules/interview/mockInterviewQa';
import type { IQuestionCompany } from '@/api/interface/interview/questionCompany';
import type { IQuestionRole } from '@/api/interface/interview/questionRole';
import type { IMockInterview } from '@/api/interface/interview/mockInterview';
import type { IMockInterviewQa } from '@/api/interface/interview/mockInterviewQa';
import type { IResultData } from '@/api/interface';

const { t } = useI18n();
const appStore = useAppStore();

// 面试阶段
type InterviewStep = 'select' | 'interview' | 'completed';
type SelectStep = 'company' | 'role';

const route = useRoute();
const currentStep = ref<InterviewStep>('select');
const selectStep = ref<SelectStep>('company');
const isLoading = ref(false);
const loadingText = ref('');
const agentId = ref('');
const mockInterviewId = ref<number | undefined>(undefined);
const qaList = ref<IMockInterviewQa.Row[]>([]);
const selectedCompanyName = ref('');
const selectedCompanyNameUs = ref('');
const selectedRoleName = ref('');
const selectedRoleNameUs = ref('');
const searchCompany = ref('');
const searchRole = ref('');
const showContinueDialog = ref(false); // 显示继续上次面试的对话框
const lastInterview = ref<IMockInterview.Row | null>(null); // 存储最后一次面试记录

const formData = ref({
  companyId: undefined as number | undefined,
  roleId: undefined as number | undefined,
  companySelected: false, // 修改初始值为 false
  roleSelected: false    // 默认未选择职位
});

const companyOptions = ref<IQuestionCompany.Row[]>([]);
const roleOptions = ref<IQuestionRole.Row[]>([]);

// 过滤后的公司列表
const filteredCompanies = computed(() => {
  if (!searchCompany.value) return companyOptions.value;
  return companyOptions.value.filter(company =>
    company.name?.toLowerCase().includes(searchCompany.value.toLowerCase())
  );
});

// 过滤后的职位列表
const filteredRoles = computed(() => {
  if (!searchRole.value) return roleOptions.value;
  return roleOptions.value.filter(role =>
    role.name?.toLowerCase().includes(searchRole.value.toLowerCase())
  );
});

// 是否已做出公司选择（包括选择了具体公司或选择了"不指定公司"）
const isCompanySelected = computed(() => {
  // 如果选择过任意选项（包括"不指定公司"），就允许进入下一步
  return formData.value.companySelected === true;
});

// 是否已选择职位
const isRoleSelected = computed(() => {
  return formData.value.roleId !== undefined;
});

// 不指定公司选项的激活状态
const isNoCompanySelected = computed(() => {
  return formData.value.companyId === undefined && formData.value.companySelected;
});

// 公司卡片的激活状态
const isCompanyCardActive = (companyId?: number) => {
  return companyId === formData.value.companyId;
};

// 职位卡片的激活状态
const isRoleCardActive = (roleId?: number) => {
  return roleId === formData.value.roleId;
};

// 获取名称首字母
const getInitials = (name?: string): string => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 获取本地化的公司名称
const getLocalizedCompanyName = (company: IQuestionCompany.Row): string => {
  if (!company) return '';
  return appStore.language === 'zh-CN' ? (company.name || '') : (company.nameUs || company.name || '');
};

// 获取本地化的职位名称
const getLocalizedRoleName = (role: IQuestionRole.Row): string => {
  if (!role) return '';
  return appStore.language === 'zh-CN' ? (role.name || '') : (role.nameUs || role.name || '');
};

// 获取本地化的标签
const getLocalizedTags = (tags: string | undefined, tagsUs: string | undefined): string[] => {
  if (!tags && !tagsUs) return [];
  const tagsString = appStore.language === 'zh-CN' ? tags : (tagsUs || tags);
  if (!tagsString) return [];
  // 先按逗号分割，然后对每个标签再按&分割
  return tagsString.split(',').flatMap(tag => tag.split('&').map(t => t.trim())).filter(Boolean);
};

// 选择公司
const selectCompany = (company: IQuestionCompany.Row | null) => {
  if (company) {
    formData.value.companyId = company.id;
    selectedCompanyName.value = company.name || '';
    selectedCompanyNameUs.value = company.nameUs || company.name || '';
    loadRoleOptions(company.id);
  } else {
    formData.value.companyId = undefined;
    selectedCompanyName.value = '';
    selectedCompanyNameUs.value = '';
    // 如果没有选择具体公司，加载所有职位
    loadRoleOptions();
  }
  // 标记已经做出选择
  formData.value.companySelected = true;
  // 重置职位选择
  formData.value.roleId = undefined;
  formData.value.roleSelected = false;
  selectedRoleName.value = '';
  selectedRoleNameUs.value = '';
};

// 选择职位
const selectRole = (role: IQuestionRole.Row) => {
  if (role) {
    if (!role.id) {
      ElMessage.warning(t('interview.role.invalidData'));
      return;
    }

    formData.value.roleId = role.id;
    selectedRoleName.value = role.name || '';
    selectedRoleNameUs.value = role.nameUs || role.name || '';
    // 标记已经做出职位选择
    formData.value.roleSelected = true;
  }
};

// 去职位选择页面
const goToRoleSelect = () => {
  selectStep.value = 'role';
};

// 返回公司选择页面
const goToCompanySelect = () => {
  selectStep.value = 'company';
};

// 清洗角色数据
const sanitizeRoles = (roles: IQuestionRole.Row[] | undefined) => {
  if (!roles || !Array.isArray(roles)) return [];

  // 过滤掉无效的角色数据
  return roles.filter(role => {
    return role && (role.id || role.name || role.nameUs);
  });
};

// 加载职位选项
const loadRoleOptions = async (companyId?: number) => {
  try {
    // 显示加载中提示
    const loadingInstance = ElLoading.service({
      text: t('interview.mock.loadingRoles'),
      background: 'rgba(255, 255, 255, 0.7)'
    });

    try {
      // 调用接口获取职位列表
      const response = await getQuestionRoleListByCompanyIdApi(companyId);

      // 清洗数据
      roleOptions.value = sanitizeRoles(response.data);

      // 如果没有获取到任何有效职位，显示提示
      if (roleOptions.value.length === 0) {
        ElMessage.warning(formData.value.companyId ?
          t('interview.mock.noRolesForCompany') :
          t('interview.mock.noRolesAvailable'));
      }
    } finally {
      // 关闭加载提示
      loadingInstance.close();
    }
  } catch (error) {
    ElMessage.error(t('interview.mock.failedToLoadRoles'));
    roleOptions.value = [];
  }
};

// 根据ID获取模拟面试记录
const getMockInterviewById = async (id: number) => {
  try {
    isLoading.value = true;
    updateLoadingText('loadingData');

    // 获取指定ID的模拟面试记录
    const response = await getMockInterviewDetailApi({ id });
    if (response.data) {
      lastInterview.value = response.data;
      mockInterviewId.value = id;

      // 加载公司和职位信息
      if (lastInterview.value.companyId) {
        await loadCompanyName(lastInterview.value.companyId);
      }

      if (lastInterview.value.roleId) {
        await loadRoleName(lastInterview.value.roleId);
      }

      // 检查面试状态
      checkInterviewStatus(true); // 传入true表示是指定加载的面试
    } else {
      ElMessage.warning(t('interview.mock.interviewNotFound'));
      await getLastMockInterviewData(); // 加载最新的面试记录作为备选
    }

    isLoading.value = false;
  } catch (error) {
    ElMessage.error(t('interview.mock.failedToLoadInterview'));
    isLoading.value = false;
    await getLastMockInterviewData(); // 出错时仍加载最新的面试
  }
};

// 获取最新的模拟面试记录
const getLastMockInterviewData = async () => {
  try {
    const lastInterviewRes = await getLastMockInterviewVO();
    lastInterview.value = lastInterviewRes.data;

    // 如果有记录，设置面试ID
    if (lastInterview.value?.id) {
      mockInterviewId.value = lastInterview.value.id;
    }

    // 加载公司和职位信息
    if (lastInterview.value?.companyId) {
      await loadCompanyName(lastInterview.value.companyId);
    }

    if (lastInterview.value?.roleId) {
      await loadRoleName(lastInterview.value.roleId);
    }

    // 检查面试状态
    checkInterviewStatus(false);
  } catch (error) {
    ElMessage.error(t('interview.mock.failedToLoadLastInterview'));
    initializeSelectionState();
  }
};

// 检查面试是否完成
const checkInterviewStatus = (isSpecificInterview = false) => {
  // 如果没有面试记录，初始化选择阶段
  if (!lastInterview.value?.id) {
    initializeSelectionState();
    return;
  }

  // 设置当前面试ID
  mockInterviewId.value = lastInterview.value.id;

  // completed 状态码：(0=未结束,1=执行反馈中,2=强制结束,3=正常结束,4=异常)
  const completed = lastInterview.value.completed;
  const qaList = lastInterview.value.mockInterviewQaList || [];

  // 判断面试的不同状态
  if (completed === '0') {
    // 检查是否所有题目都已回答（有url代表已回答）
    const allAnswered = qaList.length > 0 && qaList.every(item => item.url);

    if (allAnswered) {
      // 所有题目已回答，但反馈未生成，直接展示结果页面
      currentStep.value = 'completed';
    } else if (isSpecificInterview) {
      // 如果是从消息指定加载的面试，直接继续面试
      loadQuestionList();
    } else {
      // 有未回答题目，询问是否继续
      showContinueDialog.value = true;
    }
  } else if (completed === '1' || completed === '2' || completed === '3' || completed === '4') {
    // 所有这些状态都应该直接展示结果页面
    currentStep.value = 'completed';
  } else {
    // 其他未知状态，初始化选择阶段
    initializeSelectionState();
  }
};

// 加载面试问题列表
const loadQuestionList = async () => {
  try {
    if (!mockInterviewId.value) return;

    isLoading.value = true;
    updateLoadingText('loadingData');

    const qaResponse = await getMockInterviewQaListApi({
      mockInterviewId: mockInterviewId.value,
      page: 1,
      limit: 999
    });

    qaList.value = qaResponse.data.rows || [];

    if (qaList.value.length > 0) {
      // 切换到面试阶段
      currentStep.value = 'interview';
    } else {
      ElMessage.warning('未找到面试题目');
    }

    isLoading.value = false;
  } catch (error) {
    console.error('加载面试问题失败:', error);
    ElMessage.error('加载面试问题失败');
    isLoading.value = false;
  }
};

// 重新分析面试结果
const retryAnalysis = async () => {
  try {
    if (!mockInterviewId.value) {
      ElMessage.error('没有可分析的面试记录');
      return;
    }

    isLoading.value = true;
    updateLoadingText('reanalyzingData');

    // 调用分析API
    const response = await analyseApi({ id: mockInterviewId.value });

    // 更新面试记录
    if (response.data) {
      lastInterview.value = response.data;
    }

    ElMessage.success('分析请求已提交，请稍后查看结果');
    isLoading.value = false;
  } catch (error) {
    console.error('分析失败:', error);
    ElMessage.error('分析失败，请重试');
    isLoading.value = false;
  }
};

// 更新加载文本的函数
const updateLoadingText = (key: string, params?: Record<string, any>) => {
  loadingText.value = t(`interview.mock.${key}`, params || {});
};

// 初始化加载数据
onMounted(async () => {
  try {
    isLoading.value = true;
    updateLoadingText('loading');

    // 获取智能体ID
    const identifier = 'mockInterview';
    const agentRes = await getAgentIdByIdentifier(identifier);
    agentId.value = agentRes.data;

    // 获取公司列表
    await loadCompanyOptions();

    // 检查URL参数，是否指定了特定的面试ID
    const mockId = Number(route.query.mockInterviewId);
    if (mockId) {
      updateLoadingText('loadingData');
      // 如果指定了面试ID，加载特定面试
      await getMockInterviewById(mockId);
    } else {
      // 否则加载最后一次面试记录
      await getLastMockInterviewData();
    }

    isLoading.value = false;
  } catch (error) {
    ElMessage.error(t('common.systemError'));
    isLoading.value = false;
  }
});

// 初始化选择阶段状态
const initializeSelectionState = async () => {
  try {
    // 如果有公司ID，设置公司选择状态
    if (lastInterview.value?.companyId) {
      formData.value.companyId = lastInterview.value.companyId;
      formData.value.companySelected = true;
      await loadCompanyName(lastInterview.value.companyId);
      await loadRoleOptions(lastInterview.value.companyId);
    } else {
      // 如果没有选择公司，重置选择状态
      formData.value.companyId = undefined;
      formData.value.companySelected = false;
      selectedCompanyName.value = '';
      selectedCompanyNameUs.value = '';
      // 加载所有职位
      await loadRoleOptions();
    }

    // 如果有职位ID，设置职位选择状态
    if (lastInterview.value?.roleId) {
      formData.value.roleId = lastInterview.value.roleId;
      formData.value.roleSelected = true;
      await loadRoleName(lastInterview.value.roleId);
    } else {
      formData.value.roleId = undefined;
      formData.value.roleSelected = false;
      selectedRoleName.value = '';
      selectedRoleNameUs.value = '';
    }
  } catch (error) {
    ElMessage.error(t('interview.mock.failedToInitializeState'));
  }
};

// 继续上次的面试
const continuePreviousInterview = async () => {
  try {
    await loadQuestionList();
    // 关闭对话框
    showContinueDialog.value = false;
  } catch (error) {
    console.error('继续上次面试失败:', error);
    ElMessage.error('加载上次面试失败，请重试');
  }
};

// 清理面试状态
const clearInterviewState = async () => {
  mockInterviewId.value = undefined;
  qaList.value = [];
  lastInterview.value = null;
  currentStep.value = 'select';
  selectStep.value = 'company';
  formData.value = {
    companyId: undefined,
    roleId: undefined,
    companySelected: false, // 修改为 false，不自动选择
    roleSelected: false
  };
  selectedCompanyName.value = '';
  selectedCompanyNameUs.value = '';
  selectedRoleName.value = '';
  selectedRoleNameUs.value = '';
  // 重置后需要加载所有职位
  await loadRoleOptions();
};

// 开始新的面试，忽略上次未完成的面试
const startNewInterview = () => {
  // 重置状态并关闭对话框
  clearInterviewState();
  showContinueDialog.value = false;
};

// 开始模拟面试
const startInterview = async () => {
  try {
    // 检查是否已选择职位
    if (!formData.value.roleId) {
      ElMessage.warning(t('interview.mock.selectRoleFirst'));
      return;
    }

    isLoading.value = true;
    updateLoadingText('preparingInterview');

    // 创建新的面试记录
    const createParams: IMockInterview.Form = {
      companyId: formData.value.companyId || undefined,
      roleId: formData.value.roleId,
      botId: agentId.value
    };

    // 创建新的模拟面试记录
    const createRes = await createMockInterviewApi(createParams);

    // 等待后台处理完成（最多等待30秒）
    let retryCount = 0;
    const maxRetries = 30;
    let interviewReady = false;

    while (retryCount < maxRetries && !interviewReady) {
      updateLoadingText('retryCount', { count: retryCount + 1, max: maxRetries });

      // 获取最新的模拟面试记录
      const newInterviewRes = await getLastMockInterviewVO();
      const newInterview = newInterviewRes.data;

      if (newInterview?.id) {
        mockInterviewId.value = newInterview.id;
        lastInterview.value = newInterview;

        // 检查面试题目是否已生成
        const qaResponse = await getMockInterviewQaListApi({
          mockInterviewId: mockInterviewId.value,
          page: 1,
          limit: 999
        });

        if (qaResponse.data.rows && qaResponse.data.rows.length > 0) {
          qaList.value = qaResponse.data.rows;
          interviewReady = true;
          break;
        }
      }

      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      retryCount++;
    }

    if (!interviewReady) {
      throw new Error(t('interview.mock.preparationTimeout'));
    }

    // 切换到面试阶段
    currentStep.value = 'interview';

    isLoading.value = false;
  } catch (error) {
    console.error('开始模拟面试失败:', error);
    isLoading.value = false;
    // 发生错误时重置状态
    mockInterviewId.value = undefined;
    qaList.value = [];
  }
};

// 加载公司选项
const loadCompanyOptions = async () => {
  try {
    const response = await getQuestionCompanyListApi({ page: 1, limit: 999 });
    companyOptions.value = response.data.rows || [];
  } catch (error) {
    console.error('获取公司列表失败:', error);
    ElMessage.error('获取公司列表失败');
  }
};

// 加载公司名称
const loadCompanyName = async (companyId: number) => {
  try {
    const companyRes = await getQuestionCompanyDetailApi({ id: companyId });
    selectedCompanyName.value = companyRes.data.name || '';
    selectedCompanyNameUs.value = companyRes.data.nameUs || companyRes.data.name || '';
  } catch (error) {
    console.error('获取公司信息失败:', error);
  }
};

// 加载职位名称
const loadRoleName = async (roleId: number) => {
  try {
    const roleRes = await getQuestionRoleDetailApi({ id: roleId });
    selectedRoleName.value = roleRes.data.name || '';
    selectedRoleNameUs.value = roleRes.data.nameUs || roleRes.data.name || '';
  } catch (error) {
    console.error('获取职位信息失败:', error);
  }
};

// 处理面试完成事件
const handleInterviewCompleted = () => {
  currentStep.value = 'completed';
};

// 重新开始模拟面试
const restartInterview = () => {
  clearInterviewState();
};

// 刷新模拟面试数据
const refreshMockInterviewData = async () => {
  try {
    isLoading.value = true;
    updateLoadingText('updatingData');

    // 获取最新的模拟面试记录
    const lastInterviewRes = await getLastMockInterviewVO();
    if (lastInterviewRes.data) {
      lastInterview.value = lastInterviewRes.data;
    }
    isLoading.value = false;
  } catch (error) {
    ElMessage.error(t('common.systemError'));
    isLoading.value = false;
  }
};

// 获取本地化的公司名称
const localizedCompanyName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return selectedCompanyName.value || t('interview.mock.noSpecificCompany');
  }
  return selectedCompanyNameUs.value || selectedCompanyName.value || t('interview.mock.noSpecificCompany');
});

// 获取本地化的职位名称
const localizedRoleName = computed(() => {
  if (appStore.language === 'zh-CN') {
    return selectedRoleName.value || '';
  }
  return selectedRoleNameUs.value || selectedRoleName.value || '';
});
</script>

<style scoped>
.mock-interview-container {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.interview-header {
  margin-bottom: 30px;
  text-align: center;
}

.interview-header h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.interview-header p {
  color: #666;
}

.interview-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 步骤导航 */
.steps-wrapper {
  margin-bottom: 40px;
}

.steps {
  display: flex;
  justify-content: center;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.steps::before {
  content: "";
  position: absolute;
  top: 25px;
  left: calc(25% + 25px);
  right: calc(25% + 25px);
  height: 2px;
  background-color: #e0e0e0;
  z-index: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 150px;
  z-index: 1;
}

.step-number {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #909399;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background-color: #5a6bff;
  color: white;
  box-shadow: 0 4px 12px rgba(90, 107, 255, 0.3);
}

.step-title {
  font-size: 15px;
  color: #606266;
  font-weight: 500;
  transition: all 0.3s ease;
}

.step.active .step-title {
  color: #5a6bff;
  font-weight: 600;
}

/* 公司和职位选择面板 */
.selection-panel {
  margin-bottom: 30px;
}

.selection-title {
  font-size: 24px;
  margin-bottom: 30px;
  text-align: center;
  color: #333;
  font-weight: 600;
}

.selection-subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.selection-subtitle-count {
  font-size: 12px;
  color: #909399;
}

.search-container {
  max-width: 530px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
}

.rounded-search :deep(.el-input__inner) {
  border-radius: 20px;
  height: 44px;
  font-size: 15px;
  padding-left: 40px;
}

.rounded-search :deep(.el-input__prefix) {
  left: 15px;
}

/* 不指定公司选项 */
.no-company-option {
  border: 1px solid #e9ebf0;
  border-radius: 12px;
  padding: 12px 15px;
  margin: 0 auto 20px;
  max-width: 530px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #f9f9f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  color: #555;
}

.no-company-option:hover {
  border-color: #c0c4cc;
  background-color: #f5f7fa;
}

.no-company-option.active {
  border-color: #5a6bff;
  box-shadow: 0 0 0 2px rgba(90, 107, 255, 0.2);
  background-color: #f7f8ff;
}

/* 公司网格 */
.company-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
  max-height: 500px;
  overflow-y: auto;
  padding: 5px;
}

.company-card {
  border: 1px solid #e9ebf0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  min-height: 60px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.company-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.company-card.active {
  border-color: #5a6bff;
  box-shadow: 0 0 0 2px rgba(90, 107, 255, 0.2);
  background-color: #f7f8ff;
}

.company-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #eef1ff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  overflow: hidden;
}

.company-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.company-logo span {
  font-size: 18px;
  font-weight: bold;
  color: #5a6bff;
}

.company-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

/* 职位网格 */
.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
  max-height: 500px;
  overflow-y: auto;
  padding: 5px;
}

.role-card {
  border: 1px solid #e9ebf0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  min-height: 60px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.role-card:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.role-card.active {
  border-color: #5a6bff;
  box-shadow: 0 0 0 2px rgba(90, 107, 255, 0.2);
  background-color: #f7f8ff;
}

.role-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #eef1ff;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
  color: #5a6bff;
  font-size: 18px;
}

.role-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.action-section {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.interview-complete {
  text-align: center;
}

.complete-header {
  margin-bottom: 30px;
}

.complete-header h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.complete-summary {
  margin-bottom: 30px;
}

.summary-card {
  text-align: left;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-content p {
  margin: 10px 0;
}

.complete-actions {
  margin-top: 30px;
}

.no-roles-message {
  text-align: center;
  color: #909399;
  font-size: 14px;
  padding: 30px 0;
  grid-column: 1 / -1;
}

.action-buttons-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding: 0 10px;
}

.back-button {
  border: none;
  border-radius: 30px;
  padding: 12px 25px;
  font-size: 16px;
  font-weight: 500;
  background-color: #f0f2f5;
  color: #606266;
}

.back-button:hover {
  background-color: #e4e7ed;
}

.start-button {
  background-color: #5a6bff;
  border: none;
  border-radius: 30px;
  padding: 18px 25px;
  font-size: 16px;
  font-weight: 500;
  color: white;
  display: flex;
  align-items: center;
}

.start-button:hover {
  background-color: #4657f0;
}

.start-button i {
  margin-left: 8px;
}

.start-button:disabled {
  background-color: #a0a9e4;
  cursor: not-allowed;
}

.continue-dialog-content {
  padding: 10px 0;
  text-align: center;
}

.continue-dialog-content p {
  margin: 10px 0;
  font-size: 16px;
}

.interview-info {
  margin-top: 15px;
  font-size: 14px;
  color: #606266;
  background-color: #f7f8ff;
  padding: 10px 15px;
  border-radius: 6px;
  text-align: left;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
}

.continue-interview-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.continue-interview-dialog :deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  background-color: #f7f8ff;
  border-bottom: 1px solid #eaeaea;
}

.continue-interview-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 18px;
  color: #333;
}

.continue-interview-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.continue-interview-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid #eaeaea;
}

.dialog-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
  text-align: center;
}

.interview-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
}

.info-tag {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.info-tag .el-icon {
  margin-right: 6px;
}

.company-tag {
  background-color: #feefef;
  color: #e74c3c;
}

.role-tag {
  background-color: #e7f5f9;
  color: #29b6f6;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-bottom: 15px;
}

.dialog-button {
  min-width: 120px;
  padding: 18px 24px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 500;
}

.cancel-button {
  border: none;
  background-color: #f0f2f5;
  color: #606266;
}

.continue-button {
  background-color: #5a6bff;
  border: none;
}

.continue-button:hover {
  background-color: #4657f0;
}
</style>
