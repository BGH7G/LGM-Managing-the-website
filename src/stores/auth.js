import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from '@/utils/axios';

export const useUserStore = defineStore('user', () => {
  // state
  const parseJSON = (str) => { try { return JSON.parse(str) } catch { return null } }
  const extractToken = (t) => typeof t === 'string' ? t : (t?.accessToken || t?.token || t?.jwt || t?.access_token || null)
  const token = ref(localStorage.getItem('token') || null)
  const userInfo = ref(parseJSON(localStorage.getItem('userInfo')) || null)

  // Getters
  const isAuthenticated = computed(() =>  !!token.value )
  const username = computed(() => (userInfo.value?.username || userInfo.value?.name || '') )

  // Actions
  const setAuth = (newToken, newUserInfo) => {
    const tokenStr = extractToken(newToken)
    token.value = tokenStr;
    const normalized = typeof newUserInfo === 'string' ? parseJSON(newUserInfo) : newUserInfo;
    userInfo.value = normalized;
    if (tokenStr) {
      localStorage.setItem('token', tokenStr);
    } else {
      localStorage.removeItem('token');
    }
    localStorage.setItem('userInfo', JSON.stringify(normalized || null))
  }
  
  const logout = ()=>{
    token.value = null;
    userInfo.value = null;

    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  }

  const initialize = async () => {
    if (!token.value) return;
    if (userInfo.value && typeof userInfo.value === 'object') return;
    try {
      const res = await authApi.get('/user/profile');
      const profile = res?.data?.data || res?.data || null;
      userInfo.value = profile;
      localStorage.setItem('userInfo', JSON.stringify(profile || null));
    } catch (e) {
      logout(); // token失效时自动退出
    }
  };
  return{
    token,
    userInfo,
    isAuthenticated,
    username,
    setAuth,
    logout,
    initialize
  }
})