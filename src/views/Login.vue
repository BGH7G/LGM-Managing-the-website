<template>
  <div class="login-container">
    <!-- 将警告提示组件移到视窗顶部 -->
    <v-alert
      v-if="alert.show"
      :type="alert.type"
      variant="tonal"
      closable
      class="alert-message"
      @click:close="alert.show = false"
    >
      {{ alert.message }}
    </v-alert>

    <v-card class="login-card" elevation="3" max-width="450">
      <v-card-item class="pb-0">
        <div class="d-flex flex-column align-center">
          <v-avatar class="mb-4" color="primary" size="64">
            <v-icon size="36" color="white">mdi-account</v-icon>
          </v-avatar>
          <h1 class="text-h4 font-weight-medium mb-2">欢迎回来</h1>
          <p class="text-subtitle-1 text-medium-emphasis">请登录您的账户</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form ref="form" @submit.prevent="handleLogin">
          <v-text-field
            v-model="userInfo.email"
            :rules="[rules.required, rules.email]"
            label="电子邮箱"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            class="mb-3 input-field"
            hide-details="auto"
          ></v-text-field>

          <v-text-field
            v-model="userInfo.password"
            :rules="[rules.required, rules.password]"
            :type="showPassword ? 'text' : 'password'"
            label="密码"
            prepend-inner-icon="mdi-lock-outline"
            variant="outlined"
            class="mb-2 input-field"
            hide-details="auto"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>

          <div class="d-flex justify-end mb-4">
            <a href="#" class="text-decoration-none text-primary text-caption">忘记密码?</a>
          </div>

          <v-btn
            block
            color="primary"
            rounded = "xl"
            size="large"
            type="submit"
            :loading="loading"
            class="login-btn mb-4"
            elevation="1"
          >
            登录
          </v-btn>

          <div class="text-center">
            <span class="text-caption text-medium-emphasis">还没有账户? </span>
            <a @click="goToRegister" class="text-decoration-none text-primary text-caption font-weight-medium register-link">立即注册</a>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { login } from '@/api/user.api';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/auth';
import { validateEmail, validatePassword } from '@/utils/validators';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const form = ref(null);
const loading = ref(false);
const showPassword = ref(false);
const alert = reactive({
  show: false,
  type: 'error',
  message: '',
  timeout: 5000
});

const userInfo = reactive({
  email: '',
  password: ''
});

const rules = {
  required: v => !!v || '此字段是必填的',
  email: v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址',
  password: v => v.length >= 3 || '密码长度不能少于3位'
};

const showAlert = (message) => {
  alert.message = message;
  alert.show = true;
  // 自动关闭提示
  setTimeout(() => {
    alert.show = false;
  }, alert.timeout);
};

const handleLogin = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) {
    // 表单验证失败，显示错误信息
    const errors = [];
    
    // 检查邮箱
    const emailResult = validateEmail(userInfo.email);
    if (emailResult !== true) errors.push(emailResult);
    
    // 检查密码
    const passwordResult = validatePassword(userInfo.password);
    if (passwordResult !== true) errors.push(passwordResult);
    
    // 显示第一个错误信息
    if (errors.length > 0) {
      showAlert(errors[0]);
    } else {
      showAlert('请检查输入信息是否正确');
    }
    
    return;
  }
  
  // 表单验证通过，继续登录流程
  loading.value = true;
  try {
    const response = await login(userInfo);
    console.log(response);
    if (response.data.data) {
      const {tokens, userInfo} = response.data.data;
      console.log(tokens, userInfo);
      userStore.setAuth(tokens, userInfo);
      const redirect = route.query.redirect || '/';
      await router.replace(redirect);
    }
    console.log(response.data.data.userInfo);
  } catch (error) {
    console.error('登录失败:', error);
    showAlert('登录失败，请检查您的账号和密码');
  } finally {
    loading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<style lang="scss" scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f7;
  padding: 16px;
}

.login-card {
  border-radius: 16px !important;
  overflow: hidden;
  background-color: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 100%;
  padding: 24px 16px;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12) !important;
  }
}

.input-field {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

.login-btn {
  border-radius: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
}

.register-link {
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: darken(#1867c0, 10%) !important;
    text-decoration: underline !important;
  }
}

// Apple-inspired styling
:deep(.v-field) {
  border-radius: 12px !important;
}

:deep(.v-btn) {
  border-radius: 12px !important;
}

.alert-message {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 300px;
  max-width: 80%;
  border-radius: 12px;
  animation: fadeInDown 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}
</style>