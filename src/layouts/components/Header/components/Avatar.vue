<template>
  <el-dropdown trigger="click">
    <div class="avatar">
      <img :src="avatarSrc || ''" alt="avatar" />
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item @click="openDialog('infoRef')">
          <el-icon>
            <User />
          </el-icon>
          {{ $t('header.personalData') }}
        </el-dropdown-item>
        <el-dropdown-item @click="openDialog('passwordRef')">
          <el-icon>
            <Edit />
          </el-icon>
          {{ $t('header.changePassword') }}
        </el-dropdown-item>
        <el-dropdown-item divided @click="logout">
          <el-icon>
            <SwitchButton />
          </el-icon>
          {{ $t('header.logout') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
  <!-- infoDialog -->
  <InfoDialog ref="infoRef" />
  <!-- passwordDialog -->
  <PasswordDialog ref="passwordRef" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { LOGIN_URL } from '@/config';
import { useRouter } from 'vue-router';
import { logoutApi } from '@/api/modules/system/login';
import { useUserStore } from '@/stores/modules/user';
import { useAuthStore } from '@/stores/modules/auth';
import { useShareStore } from '@/stores/modules/share';
import InfoDialog from './InfoDialog.vue';
import PasswordDialog from './PasswordDialog.vue';
import { Edit, SwitchButton, User } from '@element-plus/icons-vue';
import { useSocketStore } from '@/stores/modules/socket';
import { ElMessage, ElMessageBox } from 'element-plus';
import defaultAvatar from '@/assets/images/avatar.gif';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const userStore = useUserStore();
const shareStore = useShareStore();
const socketStore = useSocketStore();
const authStore = useAuthStore();
const avatarSrc = ref<string | null>(null);
const i18n = useI18n();

/**
 * 预加载图片，判断图片是否可以正常加载
 * @param url
 */
const preloadImage = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = url;
  });
};

const getLogo = async () => {
  const logo = userStore.userInfo.logo || defaultAvatar;
  try {
    await preloadImage(logo);
    avatarSrc.value = logo;
  } catch (error) {
    console.error(`Error loading image: ${logo}`);
    avatarSrc.value = defaultAvatar; // 默认头像地址
  }
};

// 退出登录
const logout = () => {
  ElMessageBox.confirm(i18n.t('logout.logoutConfirm'), i18n.t('logout.logoutTip'), {
    confirmButtonText: i18n.t('common.confirm'),
    cancelButtonText: i18n.t('common.cancel'),
    type: 'warning'
  }).then(async () => {
    // 1.执行退出登录接口
    await logoutApi();

    // 2.清除 Token
    userStore.clear();
    authStore.clear();
    // 清理分享链接
    shareStore.clear();
    // 关闭socket
    socketStore.close();

    // 3.重定向到登陆页
    router.replace(LOGIN_URL);
    ElMessage.success(i18n.t('logout.logoutSuccess'));
  });
};

// 打开修改密码和个人信息弹窗
const infoRef = ref<InstanceType<typeof InfoDialog>>();
const passwordRef = ref<InstanceType<typeof PasswordDialog>>();
const openDialog = (ref: string) => {
  if (ref === 'infoRef') infoRef.value?.openDialog();
  if (ref === 'passwordRef') passwordRef.value?.openDialog();
};
getLogo();
</script>

<style scoped lang="scss">
.avatar {
  width: 40px;
  height: 40px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
  }
}
</style>
