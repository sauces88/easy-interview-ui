import { createI18n } from 'vue-i18n';
import type { I18n } from 'vue-i18n';
import zh from './modules/zh';
import en from './modules/en';
import { getBrowserLang } from '@/utils';

type Locales = 'zh-CN' | 'en-US';

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getBrowserLang() as Locales,
  fallbackLocale: 'zh-CN' as Locales,
  messages: {
    'zh-CN': zh,
    'en-US': en
  }
}) as I18n;

export default i18n;
