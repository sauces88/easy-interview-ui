import { defineStore } from 'pinia';
import { ref } from 'vue';
import piniaPersistConfig from '@/stores/helper/persist';

export const useShareStore = defineStore(
  'share',
  () => {
    const shareLink = ref('');

    function setShareLink(link: string) {
      shareLink.value = link;
    }

    function getShareLink(): string {
      return shareLink.value;
    }

    function clear() {
      shareLink.value = '';
    }

    return {
      shareLink,
      setShareLink,
      getShareLink,
      clear
    };
  },
  {
    persist: piniaPersistConfig('share')
  }
);
