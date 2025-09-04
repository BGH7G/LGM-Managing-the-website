<template>
  <!-- 成功提示 -->
  <v-alert
    v-if="alert.show"
    :type="alert.type"
    variant="tonal"
    closable
    class="mb-4"
    density="comfortable"
    @click:close="alert.show = false"
  >
    {{ alert.message }}
  </v-alert>
  <v-container fluid>
    <v-row>
      <v-col
        v-for="album in albums"
        :key="album.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="album-card" hover>
          <!-- 操作菜单 -->
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn color="accent" icon="mdi-dots-vertical" variant="text" class="menu-btn" @click.stop v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item @click="openEdit(album)">
                <v-list-item-title>编辑</v-list-item-title>
              </v-list-item>
              <v-list-item @click="openDeleteDialog(album)" class="text-error">
                <v-list-item-title>删除</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <div @click="openAlbum(album.id)" style="cursor:pointer">
            <v-img :src="getCover(album.cover)" height="200px" class="white--text align-end" cover>
              <v-chip color="accent" class="ma-2" variant="elevated" rounded="xl">{{ album.imageCount }} 图</v-chip>
            </v-img>
            <v-card-title class="text-h6">{{ album.name }}</v-card-title>
            <v-card-subtitle>{{ formatDate(album.createdAt) }}</v-card-subtitle>
            <v-card-text class="truncate-two-line">{{ album.description }}</v-card-text>
          </div>
        </v-card>
      </v-col>
      <!-- 添加新相册按钮 -->
      <v-col
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="add-album-card" style="height: 100%;" outlined hover @click="addDialog = true">
          <v-row class="fill-height" align="center" justify="center">
            <v-icon size="64">mdi-plus</v-icon>
          </v-row>
          <v-card-title class="text-h6 text-center">新建相册</v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- 分页 -->
    <v-row justify="center" v-if="pagination.totalPages > 1">
      <v-pagination
        v-model="pagination.currentPage"
        :length="pagination.totalPages"
        @update:modelValue="onPageChange"
      />
    </v-row>

    <!-- 新建相册对话框 -->
    <v-dialog v-model="addDialog" max-width="700px" transition="dialog-bottom-transition">
      <v-card elevation="24" class="pa-4">
        <!-- Header -->
        <div class="dialog-header d-flex align-center justify-center mb-6">
          <span class="text-h5 font-weight-medium white--text">{{ isEditing ? '修改相册' : '创建相册' }}</span>
        </div>

        <v-form ref="addFormRef">
          <v-row dense>
            <!-- 左侧表单 -->
            <v-col cols="12" md="6">
              <!-- 隐藏文件选择，仅通过点击预览触发 -->
          <div class="ml-5">
            <v-file-input
                ref="fileInputRef"
                v-model="newAlbum.cover"
                accept="image/*"
                class="d-none"
                required
            />
            <v-text-field
                v-model="newAlbum.name"
                label="名称"
                variant="outlined"
                class="mb-3 input-field"
                hide-details="auto"
                clearable
                :error="nameError"
                :error-messages="nameError ? '名称为必填' : ''"
                @blur="validateName"
                required
            />
            <v-textarea
                v-model="newAlbum.description"
                label="描述"
                variant="outlined"
                rows="3"
                auto-grow
                class="input-field"
                hide-details="auto"
                clearable
            />
          </div>
            </v-col>

            <!-- 右侧预览 -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center">
              <v-img
                v-if="coverPreview"
                :src="coverPreview"
                aspect-ratio="1"
                max-width="260"
                class="preview-img elevation-3 preview-clickable"
                cover
                @click="triggerFileSelect"
              />
              <v-icon
                v-else
                size="96"
                color="grey-lighten-1"
                class="preview-clickable"
                @click="triggerFileSelect"
              >mdi-image-area</v-icon>
            </v-col>
          </v-row>
        </v-form>

        <v-divider class="my-4" />

        <v-card-actions class="justify-end">
          <v-btn text color="grey" @click="addDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="submitLoading" @click="submitAlbum">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="320px">
      <v-card>
        <v-card-title class="text-h6 justify-center">{{ confirmText }}</v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn color="pink-darken-4" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="green-darken-2" text @click="handleDeleteOk">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getAlbums, createAlbum, updateAlbum, deleteAlbum as deleteAlbumApi } from '@/api/album.api';
import dayjs from 'dayjs';

const albums = ref([]);
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  pageSize: 10
});
const loading = ref(false);
const router = useRouter();

// 新建相册对话框相关
const addDialog = ref(false);
const submitLoading = ref(false);
const newAlbum = ref({
  name: '',
  description: '',
  cover: null
});

// 图片预览 URL
const coverPreview = ref('');
const fileInputRef = ref(null);

// 名称校验错误
const nameError = ref(false);

// 编辑状态
const isEditing = ref(false);
let currentAlbumId = null;

// 监听文件选择生成预览
watch(
  () => newAlbum.value.cover,
  (file) => {
    if (coverPreview.value) {
      URL.revokeObjectURL(coverPreview.value);
      coverPreview.value = '';
    }
    if (file && file instanceof File) {
      coverPreview.value = URL.createObjectURL(file);
    }
  }
);

onUnmounted(() => {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value);
});

const fetchAlbums = async () => {
  loading.value = true;
  try {
    const { data } = await getAlbums({
      page: pagination.value.currentPage,
      size: pagination.value.pageSize
    });
    albums.value = data.data;
    pagination.value = {
      ...pagination.value,
      ...data.pagination
    };
  } catch (err) {
    console.error('获取相册失败', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchAlbums);

function onPageChange(page) {
  pagination.value.currentPage = page;
  fetchAlbums();
}

function getCover(path, forceRefresh = false) {
  if (!path) return new URL('@/assets/album-placeholder.png', import.meta.url).href;
  // 若已是绝对路径
  if (path.startsWith('http')) return path;
  // 相对路径处理，兼容 Windows 分隔符，并追加随机参数防缓存
  const normalized = path.replace(/\\/g, '/');
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  const timestamp = forceRefresh ? Date.now() : Math.floor(Date.now() / 60000); // 每分钟更新一次缓存键
  return `${base}/${normalized}?v=${timestamp}`;
}

function formatDate(dateStr) {
  return dayjs(dateStr).format('YYYY-MM-DD');
}

function openAlbum(id) {
  router.push({ name: 'photo_detail', params: { id } });
}

function triggerFileSelect() {
  fileInputRef.value?.$el?.querySelector('input')?.click();
}

function validateName() {
  nameError.value = !newAlbum.value.name.trim();
}

function openEdit(album) {
  isEditing.value = true;
  currentAlbumId = album.id;
  addDialog.value = true;
  newAlbum.value = {
    name: album.name,
    description: album.description || '',
    cover: null // 不预填文件
  };
  // 清除之前的预览
  if (coverPreview.value && coverPreview.value.startsWith('blob:')) {
    URL.revokeObjectURL(coverPreview.value);
  }
  // 设置当前封面，强制刷新缓存
  coverPreview.value = getCover(album.cover, true);
  nameError.value = false;
}

// 成功提示
const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  timeout: 3000
});

const deleteDialog = ref(false);
const albumToDelete = ref(null);

const confirmText = computed(() => albumToDelete.value ? `确定删除相册「${albumToDelete.value.name}」吗？` : '确定删除？');

function openDeleteDialog(album) {
  const userInfoString = localStorage.getItem('userInfo');
  let userRole = 'user'; // Default to a non-privileged role

  if (userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString);
      if (userInfo && userInfo.role) {
        userRole = userInfo.role;
      }
    } catch (e) {
      console.error("Failed to parse user info from localStorage", e);
    }
  }

  if (userRole !== 'admin') {
    alert.message = '抱歉，您没有权限删除相册。';
    alert.type = 'error';
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);
    return;
  }

  albumToDelete.value = album;
  deleteDialog.value = true;
}

async function handleDeleteOk() {
  if (!albumToDelete.value) return;
  try {
    await deleteAlbumApi(albumToDelete.value.id);
    albums.value = albums.value.filter(a => a.id !== albumToDelete.value.id);
    alert.message = '相册已删除';
    alert.type = 'success';
  } catch (err) {
    console.error('删除失败', err);
    alert.message = '删除失败，请重试';
    alert.type = 'error';
  } finally {
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);
    deleteDialog.value = false;
    albumToDelete.value = null;
  }
}

/**
 * 提交新建相册
 */
async function submitAlbum() {
  // 校验名称
  if (!newAlbum.value.name.trim()) {
    nameError.value = true;
    alert.message = '请输入相册名称';
    alert.type = 'error';
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);
    return;
  }

  // Only require a cover image when creating a new album
  if (!isEditing.value && !newAlbum.value.cover) {
    alert.message = '请选择一张封面图片';
    alert.type = 'error';
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);
    return;
  }

  submitLoading.value = true;
  try {
    const editingNow = isEditing.value;
    const payload = {
      name: newAlbum.value.name,
      description: newAlbum.value.description
    };
    if (newAlbum.value.cover) payload.cover = newAlbum.value.cover;

    let response;
    if (isEditing.value) {
      response = await updateAlbum(currentAlbumId, payload);
      console.log(response);

      // 修复：使用正确的数据路径 response.data.data
      const albumIndex = albums.value.findIndex(album => album.id === currentAlbumId);
      if (albumIndex !== -1 && response.data && response.data.data) {
        // 强制更新数组，确保响应式更新
        albums.value.splice(albumIndex, 1, {
          ...response.data.data,
          // 添加时间戳确保缓存失效
          _updated: Date.now()
        });
      }
    } else {
      response = await createAlbum(payload);
    }

    addDialog.value = false;
    // 提示
    alert.message = editingNow ? '相册修改成功！' : '相册创建成功！';
    alert.type = 'success';
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);

    // 重置表单
    newAlbum.value = { name: '', description: '', cover: null };
    isEditing.value = false;
    currentAlbumId = null;

    // 如果是新建相册，重新获取列表
    if (editingNow) {
      await fetchAlbums();
    }
  } catch (err) {
    console.error('操作相册失败', err);
    alert.message = '操作失败，请重试';
    alert.type = 'error';
    alert.show = true;
    setTimeout(() => (alert.show = false), alert.timeout);
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.album-card {
  cursor: pointer;
  .truncate-two-line {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .menu-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 10;
  }
}

.add-album-card {
  cursor: pointer;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--v-theme-on-surface);
}

.dialog-header {
  // background: linear-gradient(45deg, #bee0f9, #d6e9f9);
  padding: 16px;
  border-radius: 8px;
}

.preview-img {
  border-radius: 12px;
}

.preview-clickable {
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.8;
  }
}
</style>