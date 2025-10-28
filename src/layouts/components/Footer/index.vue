<template>
  <div class="footer flx-center">
    <a href="#" target="_blank">
      Easy-Interview v{{ version }} | Copyright © 2022-{{ new Date().getFullYear() }}
    </a>
  </div>
</template>
<script setup lang="ts">
import pkg from 'package.json';
const version: string = pkg.version;
</script>
<style scoped lang="scss">
@import './index.scss';
</style>
