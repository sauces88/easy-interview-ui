<template>
  <div class="login-container flx-center">
    <div class="login-box">
      <!--      <SwitchDark class="dark" />-->
      <div class="login-left">
        <img
          class="login-left-img"
          src="@/assets/images/login_left3.png"
          alt="login"
        >
      </div>
      <div class="login-form">
        <div class="login-logo">
          <img
            class="login-icon"
            :src="logoUrl"
            alt=""
          >
        </div>
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SwitchDark from '@/components/SwitchDark/index.vue';
import LoginForm from '@/views/login/components/LoginForm.vue';
import logo from '@/assets/images/logo.png';
import logo2 from '@/assets/images/logo2.png';
import logo3 from '@/assets/images/logo3.png';

const logoUrl = computed(() => {
  const hostname = window.location.hostname;
  if (hostname === 'speakx.gealam.com') return logo2;
  if (hostname === 'jinli.gealam.com') return logo3;
  return logo;
});
</script>

<style scoped lang="scss">
@import './index.scss';
</style>
