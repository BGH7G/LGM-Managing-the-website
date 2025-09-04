<template>
  <div class="register-container">
    <!-- 警告提示组件 -->
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

    <v-card class="register-card" elevation="3" max-width="500">
      <v-card-item class="pb-0">
        <div class="d-flex flex-column align-center">
          <v-avatar class="mb-4" color="primary" size="64">
            <v-icon size="36" color="white">mdi-account-plus</v-icon>
          </v-avatar>
          <h1 class="text-h4 font-weight-medium mb-2">创建账户</h1>
          <p class="text-subtitle-1 text-medium-emphasis">请填写以下信息完成注册</p>
        </div>
      </v-card-item>

      <v-card-text>
        <v-form ref="form" @submit.prevent="handleRegister">
          <v-text-field
            v-model="userInfo.name"
            :rules="[rules.required, rules.name]"
            label="姓名"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            class="mb-3 input-field"
            hide-details="auto"
          ></v-text-field>

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
            v-model="userInfo.phone"
            :rules="[rules.required, rules.phone]"
            label="手机号码"
            prepend-inner-icon="mdi-phone-outline"
            variant="outlined"
            class="mb-3 input-field"
            hide-details="auto"
          ></v-text-field>

          <v-text-field
            v-model="userInfo.activationCode"
            :rules="[rules.required]"
            label="激活码"
            prepend-inner-icon="mdi-key-outline"
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
            class="mb-3 input-field"
            hide-details="auto"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
          ></v-text-field>

          <v-text-field
            v-model="confirmPassword"
            :rules="[rules.required, passwordMatch]"
            :type="showConfirmPassword ? 'text' : 'password'"
            label="确认密码"
            prepend-inner-icon="mdi-lock-check-outline"
            variant="outlined"
            class="mb-4 input-field"
            hide-details="auto"
            :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showConfirmPassword = !showConfirmPassword"
          ></v-text-field>

          <v-btn
            block
            color="primary"
            size="large"
            type="submit"
            :loading="loading"
            rounded = "lg"
            class="register-btn mb-4 "
            elevation="1"
          >
            注册
          </v-btn>

          <div class="text-center">
            <span class="text-caption text-medium-emphasis">已有账户? </span>
            <a @click="goToLogin" class="text-decoration-none text-primary text-caption font-weight-medium login-link">立即登录</a>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { register } from "@/api/user.api.js";
import { useRouter } from 'vue-router';
import { validateEmail, validatePassword, validateName, validatePhone } from '@/utils/validators';

const router = useRouter();
const form = ref(null);
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const confirmPassword = ref('');
const alert = reactive({
  show: false,
  type: 'error',
  message: '',
  timeout: 5000
});

const userInfo = reactive({
  name: '',
  password: '',
  email: '',
  phone: '',
  activationCode: ''
});

const rules = {
  required: v => !!v || '此字段是必填的',
  name: v => v.length >= 2 || '姓名长度不能少于2位',
  email: v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址',
  password: v => v.length >= 3 || '密码长度不能少于3位',
  phone: v => /^1[3-9]\d{9}$/.test(v) || '请输入正确的手机号码'
};

// 确认密码验证规则
const passwordMatch = v => v === userInfo.password || '两次输入的密码不一致';

const showAlert = (message, type = 'error') => {
  alert.message = message;
  alert.type = type;
  alert.show = true;
  // 自动关闭提示
  setTimeout(() => {
    alert.show = false;
  }, alert.timeout);
};

const handleRegister = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) {
    // 表单验证失败，显示错误信息
    const errors = [];
    
    // 检查姓名
    const nameResult = validateName(userInfo.name);
    if (nameResult !== true) errors.push(nameResult);
    
    // 检查邮箱
    const emailResult = validateEmail(userInfo.email);
    if (emailResult !== true) errors.push(emailResult);
    
    // 检查手机号
    const phoneResult = validatePhone(userInfo.phone);
    if (phoneResult !== true) errors.push(phoneResult);
    
    // 检查激活码
    if (!userInfo.activationCode) {
      errors.push('激活码不能为空');
    }
    
    // 检查密码
    const passwordResult = validatePassword(userInfo.password);
    if (passwordResult !== true) errors.push(passwordResult);
    
    // 检查确认密码
    if (confirmPassword.value !== userInfo.password) {
      errors.push('两次输入的密码不一致');
    }
    
    // 显示第一个错误信息
    if (errors.length > 0) {
      showAlert(errors[0]);
    } else {
      showAlert('请检查输入信息是否正确');
    }
    
    return;
  }
  
  // 表单验证通过，继续注册流程
  loading.value = true;
  try {
    const response = await register(userInfo);
    if (response.data.data) {
      showAlert('注册成功！即将跳转到登录页面...', 'success');
      // 延迟跳转到登录页面
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else {
      showAlert(response.data?.message || '注册失败，请稍后再试');
    }
  } catch (error) {
    console.error('注册失败:', error);
    const errorMessage = error.response?.data?.message || '注册失败，请稍后再试';
    showAlert(errorMessage);
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<style lang="scss" scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f7;
  padding: 16px;
}

.register-card {
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

.register-btn {
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

.login-link {
  cursor: pointer;
  transition: color 0.2s ease;
  
  &:hover {
    color: darken(#1867c0, 10%) !important;
    text-decoration: underline !important;
  }
}

.alert-message {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  min-width: 300px;
  max-width: 90%;
}
</style>