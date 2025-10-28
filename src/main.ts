import { createApp, watch, nextTick } from 'vue';
import pinia from '@/stores';

import '@/styles/index.scss';

// 动态设置favicon
const setFavicon = () => {
  const hostname = window.location.hostname;
  let faviconPath = '/favicon.ico';
  if (hostname === 'speakx.gealam.com') {
    faviconPath = '/favicon2.ico';
  } else if (hostname === 'jinli.gealam.com') {
    faviconPath = '/favicon3.ico';
  }
  const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'icon';
  link.href = faviconPath;
  if (!document.querySelector("link[rel*='icon']")) {
    document.getElementsByTagName('head')[0].appendChild(link);
  }
};
setFavicon();

// element plus
import ElementPlus from 'element-plus';
// element css
import 'element-plus/dist/index.css';
// element dark css
import 'element-plus/theme-chalk/dark/css-vars.css';

// element icons
import * as Icons from '@element-plus/icons-vue';

// vue i18n
import I18n from '@/languages';

import App from '@/App.vue';
import router from '@/router';

// custom directives
import directives from '@/directives/index';

// errorHandler
import errorHandler from '@/utils/errorHandler';
// svg icons
import 'virtual:svg-icons-register';

// highlight 高亮
import 'highlight.js/styles/atom-one-dark.css';
import 'highlight.js/lib/common';
import hljsVuePlugin from '@highlightjs/vue-plugin';
import { isLocalEnv, getBrowserLang } from '@/utils';
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github';
import '@kangc/v-md-editor/lib/theme/style/github.css';

// 使用 github 主题
VMdPreview.use(githubTheme);

// 导入 Element Plus 的语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn.mjs';
import en from 'element-plus/es/locale/lang/en.mjs';

const app = createApp(App);

if (!isLocalEnv()) {
  app.config.errorHandler = errorHandler;
}

// register the element Icons component
Object.keys(Icons).forEach(key => {
  app.component(key, Icons[key as keyof typeof Icons]);
});

// 先初始化 pinia
app.use(pinia);

// 然后再获取 store
import { useAppStore } from '@/stores/modules/app';
const appStore = useAppStore();

// 获取语言设置
const language = localStorage.getItem('language') || getBrowserLang();

// 修改判断逻辑，确保和getBrowserLang返回值匹配
const isZhCN = ['zh-CN', 'zh-cn', 'zh'].includes(language?.toLowerCase() || '');
const currentLocale = isZhCN ? 'zh-CN' : 'en-US';
const locale = isZhCN ? zhCn : en;

// 设置 appStore 的语言
appStore.changeLanguage(currentLocale);

// 修改 Element Plus 配置
app.use(ElementPlus, {
  locale
});

// 设置 i18n 的语言
app.use(I18n);
// @ts-expect-error ....
I18n.global.locale.value = currentLocale;

// 监听 appStore 的语言变化
watch(() => appStore.language, (newLang) => {
  // 更新 i18n 的语言
  // @ts-expect-error ....
  I18n.global.locale.value = newLang;
  // 更新 Element Plus 的语言
  app.config.globalProperties.$ELEMENT.locale = newLang === 'zh-CN' ? zhCn : en;
  // 更新 localStorage
  localStorage.setItem('language', newLang);
  // 强制重新渲染
  nextTick(() => {
    document.documentElement.lang = newLang;
  });
});

// 全局配置
app.config.globalProperties.$ELEMENT = {
  size: 'default',
  zIndex: 2000,
  locale: locale, // 添加 locale 配置
  pagination: {
    goto: isZhCN ? '前往' : 'Go to',
    pagesize: isZhCN ? '条/页' : '/page',
    total: isZhCN ? '共 {total} 条' : 'Total {total}',
    itemsPerPage: isZhCN ? '条/页' : '/page',
    prevPage: isZhCN ? '上一页' : 'Previous',
    nextPage: isZhCN ? '下一页' : 'Next',
    pageClassifier: isZhCN ? '页' : '',
    deprecationWarning: isZhCN ? '已废弃' : 'Deprecated'
  }
};

app.use(router);
app.use(directives);
app.use(hljsVuePlugin);
app.use(VMdPreview, {
  theme: githubTheme
});

app.mount('#app');
