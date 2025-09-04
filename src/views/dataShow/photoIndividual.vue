<template>
  <v-container>
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

    <v-row align="center" justify="space-between" class="mb-4">
      <v-btn icon @click="router.back()">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-row>
        <v-col cols="12">
          <v-card class="ml-5 mr-5 elevation-0">
            <v-card-title class="text-h4 text-center">{{ album?.name }}</v-card-title>
            <v-card-subtitle class="text-h6 text-center">{{ album?.description }}</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>
      <v-btn color="primary" @click="uploadDialog=true" prepend-icon="mdi-upload">上传图片</v-btn>
    </v-row>
    <v-row>
      <v-col
        v-for="(photo, index) in photos"
        :key="photo.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        xl="2"
        class="d-flex child-flex"
      >
        <div class="photo-item w-100">
          <v-img
            :lazy-src="getSrc(photo.filename ?? photo.path, true)"
            :src="getSrc(photo.filename ?? photo.path)"
            aspect-ratio="1"
            class="bg-grey-lighten-2"
            cover
            @click="openViewer(index)"
          >
            <template #placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey-lighten-5" />
              </v-row>
            </template>
          </v-img>
          <v-btn
            icon
            variant="flat"
            size="x-small"
            class="delete-photo-btn"
            @click.stop="promptDelete(photo.id)"
          >
            <v-icon size="small">mdi-delete</v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- 分页 -->
    <v-row justify="center" v-if="pagination.totalPages > 1">
      <v-pagination v-model="pagination.currentPage" :length="pagination.totalPages" @update:modelValue="onPageChange" />
    </v-row>

    <!-- 查看大图 -->
    <v-dialog v-model="viewer.show" transition="dialog-bottom-transition" fullscreen>
      <v-card flat class="viewer-card d-flex flex-column">
        <v-toolbar dense flat>
          <v-btn icon @click="viewer.show=false"><v-icon>mdi-close</v-icon></v-btn>
          <v-spacer></v-spacer>
          <span class="text-subtitle-1">{{ viewer.title }}</span>
          <v-spacer></v-spacer>
        </v-toolbar>

        <!-- 可点击空白区域关闭，点击图片本身不关闭 -->
        <v-sheet class="d-flex align-center justify-center flex-grow-1" @click="viewer.show=false" color="transparent">
          <v-img :src="viewer.src" contain max-height="90vh" max-width="90vw" @click.stop />
        </v-sheet>
      </v-card>
    </v-dialog>

    <!-- 上传图片对话框 -->
    <v-dialog v-model="uploadDialog" max-width="700px" transition="dialog-bottom-transition" @update:model-value="resetUploadForm">
      <v-card elevation="24" class="pa-4">
        <div class="dialog-header d-flex align-center justify-center mb-6">
          <span class="text-h5 font-weight-medium">上传图片</span>
        </div>

        <v-form ref="uploadFormRef">
          <v-row dense>
            <!-- 左侧表单 -->
            <v-col cols="12" md="6">
              <div class="ml-5">
                <v-file-input
                  ref="fileInputRef"
                  v-model="newPhoto.images"
                  accept="image/*"
                  class="d-none"
                  multiple
                  required
                />
                <v-text-field
                  v-model="newPhoto.name"
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
                  v-model="newPhoto.description"
                  label="描述 (可选)"
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
              <div v-if="imagePreviews.length > 0" class="preview-grid">
                <div v-for="(src, i) in imagePreviews" :key="i" class="preview-item">
                  <v-img
                    :src="src"
                    aspect-ratio="1"
                    class="preview-img elevation-1"
                    cover
                  />
                  <v-btn
                    icon
                    variant="flat"
                    size="x-small"
                    class="remove-btn"
                    @click.stop="removeImage(i)"
                  >
                    <v-icon size="small">mdi-close</v-icon>
                  </v-btn>
                </div>
                <div class="add-more-container d-flex align-center justify-center preview-clickable" @click="triggerFileSelect">
                  <v-icon>mdi-plus-box-multiple-outline</v-icon>
                </div>
              </div>
              <v-icon
                v-else
                size="96"
                color="grey-lighten-1"
                class="preview-clickable"
                @click="triggerFileSelect"
              >mdi-image-multiple-outline</v-icon>
            </v-col>
          </v-row>
        </v-form>

        <v-divider class="my-4" />

        <v-card-actions class="justify-end">
          <v-btn text color="grey" @click="uploadDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="uploading" @click="submitUpload">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Deletion Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除</v-card-title>
        <v-card-text>您确定要删除这张图片吗？此操作无法撤销。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog.show = false">取消</v-btn>
          <v-btn color="error" :loading="deleteDialog.loading" @click="confirmDelete">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAlbumById } from '@/api/album.api';
import { getPhotos, uploadImage, deleteImage } from '@/api/photo.api';

const route = useRoute();
const router = useRouter();
const albumId = ref(route.params.id);

const album = ref(null);
const photos = ref([]);
const pagination = ref({ currentPage: 1, totalPages: 1, pageSize: 18 });

const alert = reactive({ show: false, type: 'success', message: '' });

// 大图查看器状态
const viewer = reactive({ show:false, src:'', title:'' });

// 上传对话框状态
const uploadDialog = ref(false);
const uploading = ref(false);
const uploadFormRef = ref(null);
const fileInputRef = ref(null);
const newPhoto = reactive({ name:'', description:'', images: [] });
const imagePreviews = ref([]);
const nameError = ref(false);

// Deletion dialog state
const deleteDialog = reactive({ show: false, loading: false, id: null });

// 监听文件选择的变化，并更新预览
watch(() => newPhoto.images, (newFiles) => {
  if (newFiles && newFiles.length > 0) {
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    // 清理旧的预览URL以防内存泄漏
    imagePreviews.value.forEach(url => URL.revokeObjectURL(url));
    imagePreviews.value = newPreviews;
    nameError.value = false;
  } else {
    imagePreviews.value = [];
  }
});

function triggerFileSelect() {
  fileInputRef.value?.click();
}

function resetUploadForm(isActive) {
  if (!isActive) {
    // 清理表单和预览
    Object.assign(newPhoto, { name: '', description: '', images: [] });
    uploadFormRef.value?.resetValidation();
    imagePreviews.value.forEach(url => URL.revokeObjectURL(url));
    imagePreviews.value = [];
  }
}

async function fetchAlbum() {
  const { data } = await getAlbumById(albumId.value);
  album.value = data;
}

async function fetchPhotos() {
  const { data } = await getPhotos({
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
    albumId: albumId.value
  });
  photos.value = data.data;
  pagination.value = { ...pagination.value, ...data.pagination };
}

function onPageChange(page) {
  pagination.value.currentPage = page;
  fetchPhotos();
}

function getSrc(path, isThumb = false) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const normalized = path.replace(/\\/g, '/').replace(/^public\//, '');
  const base = import.meta.env.VITE_API_BASE_URL || '/api/v1';
  return `${base}/${normalized}`;
}

function openViewer(idx){
  const p = photos.value[idx];
  viewer.src = getSrc(p.filename ?? p.path);
  viewer.title = p.originalName || p.name || '';
  viewer.show = true;
}

function validateName() {
  nameError.value = !newPhoto.name.trim();
}

function removeImage(index) {
  // Revoke the object URL to free up memory
  URL.revokeObjectURL(imagePreviews.value[index]);

  // Remove from both arrays
  imagePreviews.value.splice(index, 1);
  newPhoto.images.splice(index, 1);
}

async function submitUpload(){
  validateName(); // 触发一次最终校验

  if (!newPhoto.images || newPhoto.images.length===0){
    alert.show = true;
    alert.type = 'error';
    alert.message = '请选择要上传的图片。';
    return;
  }
  if (nameError.value) {
    return; // 如果名称有误，则停止提交
  }
  uploading.value = true;
  try{
    await uploadImage({
      name: newPhoto.name,
      description: newPhoto.description,
      images: newPhoto.images,
      albumId: albumId.value
    });
    uploadDialog.value = false; // 会触发 resetUploadForm

    alert.show = true;
    alert.type = 'success';
    alert.message = '图片上传成功！';

    // refresh list first page
    pagination.value.currentPage = 1;
    fetchPhotos();
  }catch(err){
    console.error('上传失败',err);
    alert.show = true;
    alert.type = 'error';
    alert.message = `上传失败: ${err.message || '请检查网络或联系管理员'}`;
  }finally{
    uploading.value = false;
  }
}

function promptDelete(id) {
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
    alert.show = true;
    alert.type = 'error';
    alert.message = '抱歉，您没有权限删除图片。';
    return;
  }

  deleteDialog.id = id;
  deleteDialog.show = true;
}

async function confirmDelete() {
  if (!deleteDialog.id) return;

  deleteDialog.loading = true;
  try {
    await deleteImage(deleteDialog.id);
    alert.show = true;
    alert.type = 'success';
    alert.message = '图片删除成功！';
    await fetchPhotos(); // Refresh the list
  } catch (err) {
    console.error('删除失败', err);
    alert.show = true;
    alert.type = 'error';
    alert.message = `删除失败: ${err.message || '请重试'}`;
  } finally {
    deleteDialog.loading = false;
    deleteDialog.show = false;
    deleteDialog.id = null;
  }
}

onMounted(() => {
  fetchAlbum();
  fetchPhotos();
});

watch(() => route.params.id, (newId) => {
  albumId.value = newId;
  pagination.value.currentPage = 1;
  fetchAlbum();
  fetchPhotos();
});
</script>

<style scoped>
.viewer-card {
  background-color: rgba(0, 0, 0, 0.6); /* 半透明背景，仅作用于卡片 */
}

.dialog-header {
  padding: 16px 24px;
  border-radius: 4px 4px 0 0;
}

.input-field {
  max-width: 300px;
}

.preview-clickable {
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.preview-clickable:hover {
  transform: scale(1.05);
  filter: brightness(0.9);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  width: 100%;
  max-height: 220px; /* 限制最大高度，超出可滚动 */
  overflow-y: auto;
  padding: 8px;
  border: 1px dashed #ccc;
  border-radius: 4px;
}

.preview-item {
  position: relative;
}

.preview-img {
  border-radius: 4px;
  cursor: pointer;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: white !important;
}

.add-more-container {
  border: 2px dashed #ccc;
  border-radius: 4px;
  min-height: 80px; /* Match min grid item size */
}

.photo-item {
  position: relative;
  cursor: pointer;
}

.delete-photo-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  display: none; /* Hidden by default */
  background-color: rgba(239, 83, 80, 0.8) !important; /* Reddish transparent */
  color: white !important;
}

.photo-item:hover .delete-photo-btn {
  display: inline-flex; /* Show on hover */
}
</style>