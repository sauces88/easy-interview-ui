import { useAppStore } from '@/stores/modules/app';

export function getMenuTitle(item: any): string {
  const appStore = useAppStore();

  // 特殊处理：如果是首页路由，使用 appStore 中的 homeTitle
  if (item?.name === 'home') {
    return appStore.language === 'en-US' ? appStore.homeTitleUs : appStore.homeTitle;
  }

  // 如果是英文，且有titleUs，则使用titleUs
  if (appStore.language === 'en-US') {
    // 优先使用item.titleUs，如果没有则使用meta.titleUs
    if (item.titleUs || (item.meta && item.meta.titleUs)) {
      return item.titleUs || item.meta.titleUs;
    }
  }
  // 默认使用title (中文)
  // 优先使用item.title，如果没有则使用meta.title
  return item.title || (item.meta && item.meta.title) || '';
}
