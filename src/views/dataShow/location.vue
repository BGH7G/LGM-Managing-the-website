<template>
  <v-container>
    <v-card class="rounded-lg elevation-3">
      <v-card-title class="text-h5 d-flex align-center primary lighten-1 white--text py-3 px-4">
        <v-icon size="large" class="me-2 white--text">mdi-map-marker</v-icon>
        牧场位置信息
        <v-spacer></v-spacer>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="搜索牧场信息"
          single-line
          hide-details
          variant="solo-filled"
          density="compact"
          class="rounded-pill search-field mx-4"
          bg-color="white"
          style="max-width: 300px;"
        ></v-text-field>
        <v-btn
          color="white"
          variant="flat"
          prepend-icon="mdi-refresh"
          @click="fetchLocations"
          :loading="loading"
          class="ml-2"
        >
          刷新
        </v-btn>
      </v-card-title>
      
      <v-card-text class="pa-4">
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="locations"
          :search="search"
          :loading="loading"
          class="elevation-1 rounded-lg"
          :items-per-page-options="[5, 10, 15, 20]"
          :footer-props="{
            'items-per-page-text': '每页显示:',
            'prev-icon': 'mdi-chevron-left',
            'next-icon': 'mdi-chevron-right',
          }"
        >
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          
          <template v-slot:no-data>
            <v-alert
              type="info"
              icon="mdi-alert-circle"
              class="ma-4 rounded-lg"
              border="left"
              variant="tonal"
            >
              暂无牧场位置数据
            </v-alert>
          </template>
          
          <template v-slot:loader>
            <v-progress-linear
              color="primary"
              indeterminate
              height="3"
            ></v-progress-linear>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
      rounded="pill"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getLocation } from '@/api/location.api';

// 数据表格配置
const headers = [
  { title: '牧场名称', align: 'start', key: 'farm_name', width: '20%' },
  { title: '地址', align: 'start', key: 'address', width: '20%' },
  { title: '区域', align: 'start', key: 'region', width: '15%' },
  { title: '气候信息', align: 'start', key: 'climate_info', width: '20%' },
  { title: '数量', align: 'center', key: 'sheepCount', width: '10%' },
  { title: '创建时间', align: 'center', key: 'createdAt', width: '15%' },
];

// 状态变量
const locations = ref([]);
const loading = ref(false);
const search = ref('');
const itemsPerPage = ref(10);
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
});

// 获取位置数据
const fetchLocations = async () => {
  loading.value = true;
  try {
    const response = await getLocation();
    if (response.data && response.data.success) {
      locations.value = response.data.data;
      showSnackbar('牧场位置数据加载成功', 'success');
    } else {
      showSnackbar('牧场位置数据加载失败', 'error');
    }
  } catch (error) {
    console.error('获取位置数据出错:', error);
    showSnackbar('获取牧场位置数据出错', 'error');
  } finally {
    loading.value = false;
  }
};

// 格式化日期显示
const formatDate = (dateString) => {
  if (!dateString) return '暂无';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 显示通知消息
const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  };
};

// 组件挂载时获取数据
onMounted(() => {
  fetchLocations();
});
</script>

<style lang="scss" scoped>
.v-data-table {
  margin-top: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.search-field {
  transition: all 0.3s;
  
  &:focus-within {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
  }
}

.v-card-title {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
</style>