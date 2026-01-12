<!-- 纵向布局 -->
<template>
  <el-container class="layout">
    <el-aside>
      <div
        class="aside-box"
        :style="{ width: isCollapse ? '65px' : '240px' }"
      >
        <div class="logo flx-center">
          <img
            class="logo-img"
            :src="logoUrl"
            alt="logo"
          >
          <span
            v-show="!isCollapse"
            class="logo-text"
          />
        </div>
        <el-scrollbar class="menu-scrollbar">
          <el-menu
            :router="false"
            :default-active="activeMenu"
            :collapse="isCollapse"
            :unique-opened="accordion"
            :collapse-transition="false"
          >
            <el-menu-item
              v-if="homeRoute"
              :index="homeRoute.path"
              @click="handleClickHome"
            >
              <el-icon>
                <component :is="homeRoute.meta?.icon" />
              </el-icon>
              <template #title>
                <span class="sle">{{ getMenuTitle(homeRoute) }}</span>
              </template>
            </el-menu-item>
            <SubMenu :menu-list="menuList" />
          </el-menu>
        </el-scrollbar>
        <UserSubscription
          v-if="showUserSubscription"
          :name="subscriptionData.name"
          :timeout="subscriptionData.timeout"
          :credit="subscriptionData.credit"
          :extra="subscriptionData.extra"
          @info-updated="handleInfoUpdated"
        />
      </div>
    </el-aside>
    <el-container>
      <el-header>
        <ToolBarLeft />
        <ToolBarRight />
      </el-header>
      <Main />
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/modules/auth';
import Main from '@/layouts/components/Main/index.vue';
import ToolBarLeft from '@/layouts/components/Header/ToolBarLeft.vue';
import ToolBarRight from '@/layouts/components/Header/ToolBarRight.vue';
import SubMenu from '@/layouts/components/Menu/SubMenu.vue';
import UserSubscription from '@/layouts/components/UserSubscription/index.vue';
import { useAppStore } from '@/stores/modules/app';
import { getMenuTitle } from '@/utils/i18n';
import logo from '@/assets/images/logo.png';
import logo2 from '@/assets/images/logo2.png';
import logo3 from '@/assets/images/logo3.png';
import type { Ref } from 'vue';

defineOptions({
  name: 'LayoutVertical'
});

const title = import.meta.env.VITE_APP_TITLE;
const logoUrl = computed(() => {
  const hostname = window.location.hostname;
  if (hostname === 'speakx.gealam.com') return logo2;
  if (hostname === 'jinli.gealam.com') return logo3;
  return logo;
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();
const homeRoute = computed(() => {
  const routes = router.getRoutes();
  return routes.find(item => item.name === 'home');
});
const handleClickHome = () => {
  if (!homeRoute.value) return;
  if (homeRoute.value.meta.isLink) return window.open(homeRoute.value.meta.isLink as string, '_blank');
  router.push(homeRoute.value.path);
};
const accordion = computed(() => appStore.accordion);
const isCollapse = computed(() => appStore.isCollapse);
const menuList = computed(() => authStore.showMenuListGet);
const activeMenu = computed(() => (route.meta.activeMenu ? route.meta.activeMenu : route.path) as string);

// 从父组件注入数据
const researchUserData = inject<Ref<any>>('researchUserData');
const researchSubscriptionData = inject<Ref<any>>('researchSubscriptionData');
const reloadResearchData = inject<() => Promise<void>>('reloadResearchData');

// 学员订阅数据
const showUserSubscription = ref(false)
const subscriptionData = ref({
  name: '',
  timeout: '',
  credit: 0,
  extra: ''
})

// 监听注入的数据变化
watch([researchUserData, researchSubscriptionData], () => {
  if (!researchSubscriptionData?.value || Object.keys(researchSubscriptionData.value).length === 0) {
    showUserSubscription.value = false
    return
  }

  subscriptionData.value = {
    name: researchUserData?.value?.name || '',
    timeout: researchSubscriptionData.value.timeout || '',
    credit: researchSubscriptionData.value.credit || 0,
    extra: researchSubscriptionData.value.extra || ''
  }
  showUserSubscription.value = true
}, { immediate: true, deep: true })

// 信息更新后重新加载数据
const handleInfoUpdated = () => {
  reloadResearchData?.()
}
</script>

<style scoped lang="scss">
@import './index.scss';
</style>
