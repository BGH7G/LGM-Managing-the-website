<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/auth';
import { edit } from '@/api/user.api';
import { generateActivationCodes, getActivationCodes, disableActivationCode } from '@/api/actcode.api';

// Get user store
const userStore = useUserStore();
const userInfo = computed(() => {
  // Check if userInfo is a string (from localStorage) and parse it if needed
  if (typeof userStore.userInfo === 'string') {
    try {
      return JSON.parse(userStore.userInfo);
    } catch (e) {
      console.error('Error parsing userInfo:', e);
      return {};
    }
  }
  return userStore.userInfo || {};
});

// 判断是否为管理员
const isAdmin = computed(() => {
  if (!userStore.userInfo) return false;
  let info = userStore.userInfo;
  try {
    if (typeof info === 'string') info = JSON.parse(info);
  } catch (e) { /* ignore */ }
  return info?.role === 'admin';
});

// Avatar placeholder if user doesn't have an avatar
const getAvatarUrl = computed(() => {
  if (userInfo.value && userInfo.value.avatar) {
    // If avatar is a full URL
    if (userInfo.value.avatar.startsWith('http://') || userInfo.value.avatar.startsWith('https://')) {
      return userInfo.value.avatar;
    }
    // If avatar is a relative path
    return `${window.location.origin}/${userInfo.value.avatar.replace(/^public\//, '')}`;
  }
  return 'https://cdn.vuetifyjs.com/images/john.jpg'; // Default avatar
});

// Initialize user data if needed
onMounted(async () => {
  if (userStore.isAuthenticated && !userStore.userInfo) {
    await userStore.initialize();
  }
});

// Edit profile functionality
const editDialog = ref(false);
const isLoading = ref(false);
const avatarLoading = ref(false);
const formErrors = ref({
  username: '',
  email: '',
  phone: ''
});

// Form data for editing
const editForm = ref({
  name: '',
  email: '',
  phone: '',
});

// 激活码管理相关
const actDialog = ref(false);
const generateForm = ref({ count: null, prefix: '' });
const generating = ref(false);
const listLoading = ref(false);
const createdCodes = ref([]);
const codeList = ref([]);
const disablingId = ref(null);

const formatDate = (s) => (s ? new Date(s).toLocaleString() : '-');

const openActDialog = async () => {
  createdCodes.value = [];
  actDialog.value = true;
  await fetchActivationCodes();
};

const fetchActivationCodes = async () => {
  listLoading.value = true;
  try {
    const res = await getActivationCodes({ limit: 50, offset: 0 });
    const list = res?.data?.data;
    codeList.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('获取激活码失败:', e);
    alert('获取激活码失败');
  } finally {
    listLoading.value = false;
  }
};

const handleGenerateCodes = async () => {
  const countNum = Number(generateForm.value.count);
  if (!countNum || isNaN(countNum) || countNum < 1 || countNum > 5) {
    alert('请输入1-5之间的生成数量');
    return;
  }
  generating.value = true;
  try {
    const payload = {
      count: countNum,
      prefix: generateForm.value.prefix || ''
    };
    const res = await generateActivationCodes(payload);
    const created = res?.data?.data;
    createdCodes.value = Array.isArray(created) ? created : [];
    alert('生成成功');
    await fetchActivationCodes();
  } catch (e) {
    console.error('生成激活码失败:', e);
    alert('生成激活码失败');
  } finally {
    generating.value = false;
  }
};

const handleDisableCode = async (id) => {
  if (!id) return;
  disablingId.value = id;
  try {
    await disableActivationCode(id);
    alert('已禁用');
    await fetchActivationCodes();
  } catch (e) {
    console.error('禁用失败:', e);
    alert('禁用失败');
  } finally {
    disablingId.value = null;
  }
};

// File input ref for avatar upload
const fileInputRef = ref(null);

// Trigger avatar file input
const triggerAvatarUpload = () => {
  fileInputRef.value.click();
};

// Handle avatar upload directly
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件');
    return;
  }
  
  try {
    avatarLoading.value = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('avatar', file);
    
    // If we have existing user data, include it to avoid overwriting
    const user = userInfo.value;
    if (user.name || user.username) {
      formData.append('name', user.name || user.username);
    }
    if (user.email) {
      formData.append('email', user.email);
    }
    if (user.phone) {
      formData.append('phone', user.phone);
    }
    
    // Call API to update avatar
    const response = await edit(formData);
    
    // Update user data in Pinia store
    if (response.data && response.data.data) {
      // Update the user info in the store
      const updatedUserInfo = response.data.data;
      userStore.userInfo = updatedUserInfo;
      
      // Also update localStorage
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Show success message
      alert('头像更新成功');
    }
  } catch (error) {
    console.error('Error updating avatar:', error);
    alert('头像更新失败: ' + (error.response?.data?.msg || '未知错误'));
  } finally {
    avatarLoading.value = false;
    // Reset file input
    if (fileInputRef.value) {
      fileInputRef.value.value = '';
    }
  }
};

// Open edit dialog
const openEditDialog = () => {
  // Reset form and errors
  formErrors.value = {
    username: '',
    email: '',
    phone: ''
  };
  
  // Populate form with current user data
  const user = userInfo.value;
  editForm.value = {
    name: user.name || user.username || '',
    email: user.email || '',
    phone: user.phone || '',
  };
  
  // Open dialog
  editDialog.value = true;
};

// Validate form
const validateForm = () => {
  let isValid = true;
  formErrors.value = {
    username: '',
    email: '',
    phone: ''
  };
  
  // Validate username
  if (!editForm.value.name.trim()) {
    formErrors.value.username = '请输入用户名';
    isValid = false;
  }
  
  // Validate email
  if (editForm.value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.email)) {
    formErrors.value.email = '请输入有效的邮箱地址';
    isValid = false;
  }
  
  // Validate phone (simple validation)
  if (editForm.value.phone.trim() && !/^\d{11}$/.test(editForm.value.phone)) {
    formErrors.value.phone = '请输入有效的手机号码';
    isValid = false;
  }
  
  return isValid;
};

// Submit form
const submitForm = async () => {
  if (!validateForm()) return;
  
  try {
    isLoading.value = true;
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', editForm.value.name);
    formData.append('email', editForm.value.email);
    formData.append('phone', editForm.value.phone);
    
    // Call API to update user data
    const response = await edit(formData);
    
    // Update user data in Pinia store
    if (response.data && response.data.data) {
      // Update the user info in the store
      const updatedUserInfo = response.data.data;
      userStore.userInfo = updatedUserInfo;
      
      // Also update localStorage
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Close dialog
      editDialog.value = false;
      
      // Show success message
      alert('个人资料更新成功');
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('更新失败: ' + (error.response?.data?.msg || '未知错误'));
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <v-container class="profile-container">
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center mb-6">
        <h1 class="text-h4 gradient-text">个人资料</h1>
      </v-col>
    </v-row>

    <v-row v-if="userStore.isAuthenticated" justify="center">
      <v-col cols="6" md="4" lg="3">
        <v-card class="profile-card elevation-10" rounded="xl">
          <!-- Avatar Section at the top -->
          <div class="profile-avatar-section text-center">
            <div class="avatar-container">
              <v-avatar size="180" class="profile-avatar">
                <v-img :src="getAvatarUrl" alt="User Avatar"></v-img>
                <v-overlay
                  v-model="avatarLoading"
                  contained
                  persistent
                  class="align-center justify-center"
                >
                  <v-progress-circular indeterminate size="64"></v-progress-circular>
                </v-overlay>
              </v-avatar>
              <div class="avatar-overlay" @click="triggerAvatarUpload">
                <v-icon icon="mdi-camera" size="large"></v-icon>
                <div class="avatar-hint">点击更换头像</div>
              </div>
            </div>
            <!-- Hidden file input for avatar upload -->
            <input
              type="file"
              ref="fileInputRef"
              accept="image/*"
              class="d-none"
              @change="handleAvatarUpload"
            />
            <h2 class="text-h4 mt-4 font-weight-bold">{{ userInfo.username || userInfo.name || userStore.username }}</h2>
            <v-chip class="mt-2 mb-4 user-role-chip" color="primary" variant="elevated">
              <v-icon start icon="mdi-shield-account" class="mr-1"></v-icon>
              {{ userInfo.role || '用户' }}
            </v-chip>
            
            <!-- Edit button -->
            <v-btn 
              color="primary" 
              variant="tonal" 
              prepend-icon="mdi-account-edit" 
              block
              class="mt-2"
              @click="openEditDialog"
            >
              编辑资料
            </v-btn>
            <v-btn 
              v-if="isAdmin"
              color="secondary" 
              variant="tonal" 
              prepend-icon="mdi-key-plus" 
              block
              class="mt-2"
              @click="openActDialog"
            >
              创建激活码
            </v-btn>
          </div>
          
          <v-divider></v-divider>
          
          <!-- User Information Section below -->
          <v-card-text class="profile-info-section">
            <h3 class="text-h5 mb-4 d-flex align-center">
              <v-icon icon="mdi-account-details" color="primary" class="mr-2"></v-icon>
              个人信息
            </h3>
            
            <v-row dense>
              <v-col cols="12">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon icon="mdi-account" color="primary" class="mr-2"></v-icon>
                    用户名
                  </div>
                  <div class="info-value">{{ userInfo.username || userInfo.name || '未设置' }}</div>
                </div>
              </v-col>
              
              <v-col cols="12">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon icon="mdi-email" color="primary" class="mr-2"></v-icon>
                    邮箱
                  </div>
                  <div class="info-value">{{ userInfo.email || '未设置' }}</div>
                </div>
              </v-col>
              
              <v-col cols="12">
                <div class="info-item">
                  <div class="info-label">
                    <v-icon icon="mdi-phone" color="primary" class="mr-2"></v-icon>
                    电话
                  </div>
                  <div class="info-value">{{ userInfo.phone || '未设置' }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-alert type="info" title="未登录" text="请先登录以查看个人资料" variant="tonal" border="start" class="login-alert"></v-alert>
      </v-col>
    </v-row>
    
    <!-- Edit Profile Dialog -->
    <v-dialog v-model="editDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon icon="mdi-account-edit" color="primary" class="mr-2"></v-icon>
          编辑个人资料
          <v-spacer></v-spacer>
          <v-btn icon @click="editDialog = false" :disabled="isLoading">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pt-4">
          <v-form @submit.prevent="submitForm">
            <v-row>
              <!-- Form fields -->
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.name"
                  label="用户名"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="formErrors.username"
                  prepend-inner-icon="mdi-account"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.email"
                  label="邮箱"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="formErrors.email"
                  prepend-inner-icon="mdi-email"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="editForm.phone"
                  label="电话"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="formErrors.phone"
                  prepend-inner-icon="mdi-phone"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="editDialog = false"
            :disabled="isLoading"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            @click="submitForm"
            :loading="isLoading"
            :disabled="isLoading"
          >
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Activation Code Dialog -->
    <v-dialog v-model="actDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="text-h5 d-flex align-center">
          <v-icon icon="mdi-key" color="primary" class="mr-2"></v-icon>
          激活码管理
          <v-spacer></v-spacer>
          <v-btn icon @click="actDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <h3 class="text-h6 mb-3">生成激活码</h3>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="generateForm.count"
                type="number"
                label="生成数量（1-5）"
                variant="outlined"
                density="comfortable"
                min="1"
                max="5"
                prepend-inner-icon="mdi-counter"
                hide-details="auto"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="generateForm.prefix"
                label="前缀"
                variant="outlined"
                density="comfortable"
                placeholder="例如 ACT"
                prepend-inner-icon="mdi-form-textbox"
                hide-details="auto"
              ></v-text-field>
            </v-col>
          </v-row>
          <div class="d-flex">
            <v-spacer></v-spacer>
            <v-btn color="primary" :loading="generating" :disabled="generating" @click="handleGenerateCodes">
              生成
            </v-btn>
          </div>
          <v-divider class="my-4"></v-divider>
          <div v-if="createdCodes.length">
            <h3 class="text-h6 mb-3">本次生成的激活码列表</h3>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th class="text-left">激活码</th>
                  <th class="text-left">状态</th>
                  <th class="text-left">过期时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in createdCodes" :key="'created-' + (c.id || c.code)">
                  <td>{{ c.code || '-' }}</td>
                  <td>{{ c.status || '-' }}</td>
                  <td>{{ formatDate(c.expiresAt) }}</td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <h3 class="text-h6 mb-3 mt-4">全部激活码</h3>
          <div v-if="listLoading" class="d-flex justify-center my-4">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
          <v-table v-else density="comfortable">
            <thead>
              <tr>
                <th class="text-left">激活码</th>
                <th class="text-left">状态</th>
                <th class="text-left">过期时间</th>
                <th class="text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in codeList" :key="item.id">
                <td>{{ item.code }}</td>
                <td>{{ item.status }}</td>
                <td>{{ formatDate(item.expiresAt) }}</td>
                <td>
                  <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    :loading="disablingId === item.id"
                    :disabled="disablingId === item.id || item.status !== 'enabled'"
                    @click="handleDisableCode(item.id)"
                  >
                    禁用
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="actDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.profile-container {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.gradient-text {
  background: linear-gradient(45deg, var(--v-theme-primary), var(--v-theme-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
}

.profile-card {
  transition: transform 0.3s, box-shadow 0.3s;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.profile-avatar-section {
  position: relative;
  padding: 2.5rem 1rem;
  background: linear-gradient(to bottom, rgba(var(--v-theme-primary), 0.05), rgba(var(--v-theme-surface), 1));
}

.profile-info-section {
  padding: 2rem;
  background-color: rgba(var(--v-theme-surface), 1);
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin: 0 auto;
}

.profile-avatar {
  border: 5px solid rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.avatar-overlay:hover {
  opacity: 1;
}

.avatar-hint {
  color: white;
  font-size: 12px;
  margin-top: 8px;
}

.user-role-chip {
  font-weight: 500;
}

.info-item {
  margin-bottom: 1.5rem;
}

.info-label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 1.1rem;
  padding-left: 1.8rem;
}

.login-alert {
  max-width: 500px;
  margin: 0 auto;
  border-radius: 12px;
}

@media (max-width: 960px) {
  .profile-avatar-section {
    padding-bottom: 1.5rem;
  }
  
  .profile-info-section {
    padding-top: 1.5rem;
  }
}

/* Fix for file input */
.d-none {
  display: none !important;
}
</style>