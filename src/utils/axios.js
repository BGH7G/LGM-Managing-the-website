import axios from 'axios'
import {useUserStore} from '@/stores/auth'
import router from '@/router'

export const authApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

authApi.interceptors.request.use(config => {
    const authStore = useUserStore();
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    // 检测是否为 FormData 类型，如果是则自动设置正确的 Content-Type
    if (config.data instanceof FormData) {
        // 对于 FormData，不需要设置 Content-Type，axios 会自动设置为 multipart/form-data 并添加正确的 boundary
        delete config.headers['Content-Type'];
    }

    return config;
});

// 添加响应拦截器处理 401 错误（token 过期）
authApi.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            const authStore = useUserStore();
            // 清除本地存储的 token 和用户信息
            authStore.logout();
            // 跳转到登录页面，并保存当前路径用于登录后返回
            const currentPath = router.currentRoute.value.fullPath;
            router.push({
                name: 'login',
                query: { redirect: currentPath }
            });
        }
        return Promise.reject(error);
    }
);

export const baseApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    headers: {
        'Content-Type': 'application/json'
    }
});

// 为 baseApi 也添加 FormData 支持
// baseApi.interceptors.request.use(config => {
//         // 检测是否为 FormData 类型，如果是则自动设置正确的 Content-Type
//         if (config.data instanceof FormData) {
//             // 对于 FormData，不需要设置 Content-Type，axios 会自动设置为 multipart/form-data 并添加正确的 boundary
//             delete config.headers['Content-Type'];
//         }
//
//         return config;
//     }
// );
