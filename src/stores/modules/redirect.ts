import {defineStore} from 'pinia';
import {ref} from 'vue';
import piniaPersistConfig from '@/stores/helper/persist';

export const useRedirectStore = defineStore(
    'redirect',
    () => {
        const redirectLink = ref('');

        function setRedirectLink(link: string) {
            redirectLink.value = link;
        }

        function getRedirectLink(): string {
            return redirectLink.value;
        }

        function clear() {
            redirectLink.value = '';
        }

        return {
            redirectLink,
            setRedirectLink,
            getRedirectLink,
            clear
        };
    },
    {
        persist: piniaPersistConfig('redirect')
    }
);
