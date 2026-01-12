import {createRouter, createWebHistory} from 'vue-router';
import {errorRouter, staticRouter} from '@/router/modules/staticRouter';
import NProgress from '@/config/nprogress';
import {HOME_URL, LOGIN_URL, ROUTER_WHITE_LIST} from '@/config';
import {useUserStore} from '@/stores/modules/user';
import {useAuthStore} from '@/stores/modules/auth';
import {useShareStore} from '@/stores/modules/share';
import {useRedirectStore} from "@/stores/modules/redirect"
import {initDynamicRouter} from '@/router/modules/dynamicRouter';
import {useOptionsStore} from '@/stores/modules/options';
import {Base64} from "js-base64"
import {ElMessage} from "element-plus";
import {getTitleByHostname} from "@/main";

/**
 * @description 📚 路由参数配置简介
 * @param path ==> 路由菜单访问路径
 * @param name ==> 路由 name (对应页面组件 name, 可用作 KeepAlive 缓存标识 && 按钮权限筛选)
 * @param redirect ==> 路由重定向地址
 * @param component ==> 视图文件路径
 * @param meta ==> 路由菜单元信息
 * @param meta.icon ==> 菜单和面包屑对应的图标
 * @param meta.title ==> 路由标题 (用作 document.title || 菜单的名称)
 * @param meta.activeMenu ==> 当前路由为详情页时，需要高亮的菜单
 * @param meta.isLink ==> 路由外链时填写的访问地址
 * @param meta.isHidden ==> 是否在菜单中隐藏 (通常列表详情页需要隐藏)
 * @param meta.isFull ==> 菜单是否全屏 (示例：数据大屏页面)
 * @param meta.isAffix ==> 菜单是否固定在标签页中 (首页通常是固定项)
 * @param meta.isKeepAlive ==> 当前路由是否缓存
 */
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [...staticRouter, ...errorRouter],
    strict: false,
    scrollBehavior: () => ({left: 0, top: 0})
});

/**
 * @description 路由拦截 beforeEach
 * */
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore();
    const authStore = useAuthStore();
    const optionsStore = useOptionsStore();
    const shareStore = useShareStore();
    const redirectStore = useRedirectStore();

    // 1.NProgress 开始
    NProgress.start();

    // 2.动态设置标题
    const title = getTitleByHostname();
    document.title = to.meta.title ? `${to.meta.title} - ${title}` : title;
    //http://localhost:9848?mockInterviewId=1&shareId=4

    // console.log(from)
    // console.log(to)
    const queryParams = to.query;
    // 只有在非重定向情况下（来源不是home页面）才设置分享链接
    if (Object.keys(queryParams).length === 2
        && queryParams.hasOwnProperty("mockInterviewId")
        && queryParams.hasOwnProperty("shareId")
        && from.path !== "/home"
        && from.path != "/home/index") {  // 避免从首页跳转时再次设置
        // 设置分享链接到localstorage, 在home页加载时跳转到该链接
        shareStore.setShareLink(to.fullPath);
    }

    //重定向到其他网站
    if (Object.keys(queryParams).length === 1
        && queryParams.hasOwnProperty("url")
        && from.path !== "/home"
        && from.path != "/home/index") {
        redirectStore.setRedirectLink(queryParams["url"] + "")
    }

    // 3.判断是访问登陆页，有 Token 就在当前页面，没有 Token 重置路由到登陆页
    if (to.path.toLocaleLowerCase() === LOGIN_URL) {
        // 三方授权登录
        const query = to.query;
        if (query.hasOwnProperty("e")) {
            const errorMessage = Base64.decode(query["e"]);
            ElMessage.error({
                message: errorMessage,
                duration: 3000
            });
            return next({path: LOGIN_URL, replace: true});
        }

        if (query.hasOwnProperty("d")) {
            const decodedData = Base64.decode(query["d"]);
            const data = JSON.parse(decodedData);
            if (data.hasOwnProperty("accessToken") && data.hasOwnProperty("userInfo")) {
                userStore.setToken(data["accessToken"]);
                userStore.setUserInfo(data["userInfo"]);
                // await initDynamicRouter();
                return next(HOME_URL)
            }
        }

        if (userStore.token) {
            return next(from.fullPath);
        }
        resetRouter();
        return next();
    }

    // 4.判断访问页面是否在路由白名单地址(静态路由)中，如果存在直接放行
    if (ROUTER_WHITE_LIST.includes(to.path)) {
        return next();
    }

    // 5.判断是否有 Token，没有重定向到 login 页面
    if (!userStore.token) {
        return next({path: LOGIN_URL, replace: true});
    }

    // 6.如果没有菜单列表，就重新请求菜单列表并添加动态路由
    if (!authStore.isLoaded) {
        await initDynamicRouter();
        return next({...to, replace: true});
    }

    // 7.存储 routerName 做按钮权限筛选
    authStore.setRouteName(to.name as string);

    // 加载所有字典信息
    optionsStore.getAllDictList();

    // 8.正常访问页面
    next();
});

/**
 * @description 重置路由
 * */
export const resetRouter = () => {
    const authStore = useAuthStore();
    authStore.flatMenuListGet.forEach(route => {
        const {name} = route;
        if (name && router.hasRoute(name)) router.removeRoute(name);
    });
};

/**
 * @description 路由跳转错误
 * */
router.onError(error => {
    NProgress.done();
    console.warn('路由错误', error.message);
});

/**
 * @description 路由跳转结束
 * */
router.afterEach(() => {
    NProgress.done();
});

export default router;
