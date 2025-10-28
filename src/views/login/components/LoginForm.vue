<template>
  <el-form
    ref="loginFormRef"
    :model="loginForm"
    :rules="loginRules"
    size="large"
  >
    <el-form-item prop="username">
      <el-input
        v-model="loginForm.username"
        :placeholder="isEmailLogin ? t('system.user.emailPlaceholder') : t('system.user.usernamePlaceholder')"
      >
        <template #prefix>
          <el-icon class="el-input__icon">
            <message v-if="isEmailLogin" />
            <user v-else />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item
      prop="password"
      style="margin-bottom: 0"
    >
      <div class="password-container">
        <el-input
          v-model="loginForm.password"
          :type="isEmailLogin ? 'text' : 'password'"
          :placeholder="isEmailLogin ? t('system.user.verificationCode') : t('system.user.passwordPlaceholder')"
          :show-password="!isEmailLogin"
          autocomplete="new-password"
        >
          <template #prefix>
            <el-icon class="el-input__icon">
              <lock />
            </el-icon>
          </template>
        </el-input>
        <el-button
          v-if="isEmailLogin"
          type="primary"
          class="send-code-btn"
          :disabled="isCodeButtonDisabled"
          round
          @click="sendCode"
        >
          {{ codeButtonText }}
        </el-button>
      </div>
    </el-form-item>
  </el-form>
  <div class="login-btn">
    <el-button
      :icon="CircleClose"
      round
      size="large"
      @click="resetForm"
    >
      {{ t('common.reset') }}
    </el-button>
    <el-button
      :icon="UserFilled"
      round
      size="large"
      type="primary"
      :loading="loading"
      @click="login"
    >
      {{ t('login.loginButton') }}
    </el-button>
  </div>

  <div class="login-mode-selector">
    <div class="divider">
      <span>{{ t('system.user.loginMethods') }}</span>
    </div>
    <div
      class="login-modes"
      :class="{ 'two-items': isJinliDomain }"
    >
      <div
        class="login-mode-item"
        :class="{ active: !isEmailLogin && !isGoogleLogin }"
        @click="switchToPasswordLogin"
      >
        <el-icon><Avatar /></el-icon>
        <span>{{ t('system.user.passwordLogin') }}</span>
      </div>
      <div
        v-if="!isJinliDomain"
        class="login-mode-item"
        :class="{ active: isEmailLogin && !isGoogleLogin }"
        @click="switchToEmailLogin"
      >
        <el-icon><Message /></el-icon>
        <span>{{ t('system.user.emailLogin') }}</span>
      </div>
      <div
        class="login-mode-item"
        :class="{ disabled: isJinliDomain }"
        @click="!isJinliDomain && googleLogin()"
      >
        <el-icon><Position /></el-icon>
        <span>{{ t('system.user.googleLogin') }}</span>
      </div>
    </div>
  </div>

  <div
    v-if="IS_PREVIEW"
    style="margin-top: 20px; color: var(--el-color-warning)"
  >
    <span>{{ t('login.contactMessage') }}</span>
  </div>
  <SliderCaptcha
    ref="captchaRef"
    @success="onSliderSuccess"
    @close="onCaptchaClose"
  />
  <ResearchUserInfoDialog
    ref="researchUserInfoDialogRef"
    @success="handleResearchUserInfoSuccess"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { HOME_URL, IS_PREVIEW } from '@/config';
import { getTimeState } from '@/utils';
import {emailLoginApi, loginApi} from '@/api/modules/system/login';
import { useUserStore } from '@/stores/modules/user';
import { useTabsStore } from '@/stores/modules/tabs';
import { useKeepAliveStore } from '@/stores/modules/keepAlive';
import { useAppStore } from '@/stores/modules/app';
import {
  CircleClose,
  Lock,
  User,
  UserFilled,
  Message,
  Avatar,
  Position
} from '@element-plus/icons-vue';
import { initDynamicRouter } from '@/router/modules/dynamicRouter';

import { onMounted, reactive, ref } from 'vue';
import { ElNotification, ElMessage } from 'element-plus';
import SliderCaptcha from '@/components/Captcha/SliderCaptcha.vue';
import { getCaptchaStatus, sendVerificationCode } from '@/api/modules/system/captcha';
import ResearchUserInfoDialog from '@/views/research/researchUser/components/ResearchUserInfoDialog.vue';
import { getCurrentResearchUserDetailApi } from '@/api/modules/research/researchUser';

const i18n = useI18n();
const { t } = i18n;

const router = useRouter();
const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();
const appStore = useAppStore();

// 判断是否是jinli域名
const isJinliDomain = window.location.hostname === 'jinli.gealam.com';

// 登录方式切换
const isEmailLogin = ref(!isJinliDomain);
const isGoogleLogin = ref(false);

const loginFormRef = ref();
const loginRules = reactive({
  username: [
    {
      required: true,
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback(new Error(isEmailLogin.value ? t('system.user.emailRequired') : t('system.user.usernamePlaceholder')));
          return;
        }
        if (isEmailLogin.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            callback(new Error(t('system.user.emailFormatError')));
            return;
          }
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  password: [
    {
      required: true,
      validator: (rule: any, value: string, callback: Function) => {
        if (!value) {
          callback(new Error(isEmailLogin.value ? t('system.user.codeRequired') : t('system.user.passwordPlaceholder')));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
});

const loading = ref(false);
const loginForm = reactive({
  username: '',
  password: '',
  clientId: '',
  grantType: '',
  code: ''
});

// 验证码按钮相关
const codeButtonText = ref(t('system.user.getVerificationCode'));
const isCodeButtonDisabled = ref(false);
let countdownTimer: number | null = null;

// 个人信息完善对话框
const researchUserInfoDialogRef = ref<InstanceType<typeof ResearchUserInfoDialog>>();

const onSliderSuccess = async () => {
  await performLogin();
};

const performLogin = async () => {
  loading.value = true;
  try {
    // 如果是邮箱登录，调整参数
    if (isEmailLogin.value) {
      loginForm.code = loginForm.password;
      // 清除密码字段，因为邮箱登录不需要密码
      const tempPassword = loginForm.password;
      loginForm.password = '';

      const { data } = await emailLoginApi({ ...loginForm });

      // 恢复密码/验证码字段，以便UI显示
      loginForm.password = tempPassword;

      userStore.setToken(data.accessToken);
      userStore.setUserInfo(data.userInfo);
    } else {
      // 常规账号密码登录
      const { data } = await loginApi({ ...loginForm });
      userStore.setToken(data.accessToken);
      userStore.setUserInfo(data.userInfo);
    }

    await initDynamicRouter();

    await tabsStore.closeMultipleTab();
    await keepAliveStore.setKeepAliveName();

    // 检查是否已完善个人信息
    const { data } = await getCurrentResearchUserDetailApi();
    // 如果没有数据或name为空，弹出个人信息完善对话框
    if (Object.keys(data).length > 0 && !data.name) {
      researchUserInfoDialogRef.value?.open();
      return; // 等待用户完善信息后再跳转
    }

    // 跳转到首页
    router.push(HOME_URL);
    ElNotification({
      title: getTimeState(),
      type: 'success',
      duration: 3000
    });
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || t('system.error.loginFailed');
    if (!document.querySelector('.el-message')) {
      ElMessage.error({
        message: errorMessage,
        duration: 3000
      });
    }
  } finally {
    loading.value = false;
  }
};

const captchaRef = ref<InstanceType<typeof SliderCaptcha>>();
const login = () => {
  if (!loginFormRef.value) {
    return;
  }

  if (!localStorage.getItem('language')) {
    appStore.language = 'zh-CN';
    localStorage.setItem('language', 'zh-CN');
  }

  loginFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    try {
      loading.value = true;

      // 邮箱登录不需要验证码
      if (isEmailLogin.value) {
        await performLogin();
      } else {
        // 常规登录可能需要验证码
        const { data } = await getCaptchaStatus();
        if (data) {
          captchaRef.value?.acceptParams();
        } else {
          await performLogin();
        }
      }
    } catch (error: any) {
      loading.value = false;
    }
  });
};

const resetForm = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.resetFields();
};

const onCaptchaClose = () => {
  resetForm();
};

// 切换到账号密码登录
const switchToPasswordLogin = () => {
  if (isEmailLogin.value || isGoogleLogin.value) {
    isEmailLogin.value = false;
    isGoogleLogin.value = false;
    loginForm.username = '';
    loginForm.password = '';
    loginForm.grantType = '';
    loginForm.clientId = '';
    loginForm.code = '';
    resetForm();
  }
};

// 切换到邮箱登录
const switchToEmailLogin = () => {
  if (!isEmailLogin.value || isGoogleLogin.value) {
    isEmailLogin.value = true;
    isGoogleLogin.value = false;
    loginForm.username = '';
    loginForm.password = '';
    resetForm();
  }
};

// 发送验证码
const sendCode = async () => {
  if (!loginForm.username) {
    ElMessage.warning(t('system.user.emailRequired'));
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(loginForm.username)) {
    ElMessage.warning(t('system.user.emailFormatError'));
    return;
  }

  try {
    isCodeButtonDisabled.value = true;
    await sendVerificationCode({ email: loginForm.username });
    ElMessage.success(t('system.user.sendCodeSuccess'));

    // 倒计时
    let countdown = 60;
    codeButtonText.value = `${countdown}秒`;

    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    countdownTimer = window.setInterval(() => {
      countdown--;
      codeButtonText.value = `${countdown}秒`;
      if (countdown <= 0) {
        clearInterval(countdownTimer!);
        codeButtonText.value = t('system.user.getVerificationCode');
        isCodeButtonDisabled.value = false;
      }
    }, 1000);
  } catch (error: any) {
    ElMessage.error(t('system.user.sendCodeFailed'));
    isCodeButtonDisabled.value = false;
  }
};

onMounted(() => {
  document.onkeydown = (e: KeyboardEvent) => {
    e = (window.event as KeyboardEvent) || e;
    if (e.code === 'Enter' || e.code === 'enter' || e.code === 'NumpadEnter') {
      if (loading.value || captchaRef.value?.dialogVisible) return;
      login();
    }
  };
});

const googleLogin = () => {
  window.location.href = '/api/admin/auth/render/google';
};

// 个人信息提交成功后跳转首页
const handleResearchUserInfoSuccess = () => {
  router.push(HOME_URL);
  ElNotification({
    title: getTimeState(),
    type: 'success',
    duration: 3000
  });
};
</script>

<style scoped lang="scss">
@import '../index.scss';

.password-container {
  display: flex;
  align-items: center;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .send-code-btn {
    margin-left: 10px;
    min-width: 110px;
    white-space: nowrap;
  }
}

.login-mode-selector {
  margin-top: 30px;

  .divider {
    display: flex;
    align-items: center;
    margin: 20px 0;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: #dcdfe6;
    }

    span {
      padding: 0 15px;
      font-size: 14px;
      color: #909399;
    }
  }

  .login-modes {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;

    &.two-items {
      justify-content: center;
      gap: 20px;
      .login-mode-item {
        width: 45%;
      }
    }

    .login-mode-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 15px 0;
      transition: all 0.3s;
      border-radius: 4px;
      width: 32%;
      background-color: #f5f7fa;

      .el-icon {
        font-size: 22px;
        margin-bottom: 8px;
      }

      span {
        font-size: 14px;
      }

      &.active {
        color: #409eff;
        background-color: #ecf5ff;
      }

      &:hover:not(.active):not(.disabled) {
        opacity: 0.9;
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@media screen and (max-width: 450px) {
  .login-modes {
    flex-direction: column;
    gap: 15px;

    .login-mode-item {
      width: 100% !important;
    }
  }

  .password-container {
    flex-direction: column;
    align-items: stretch;

    .send-code-btn {
      margin-left: 0;
      margin-top: 10px;
      width: 100%;
    }
  }
}
</style>

