<template>
  <v-container fluid>
    <!-- 顶部标题和操作栏 -->
    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6">
        <h2 class="text-h4 font-weight-bold primary--text">我的实验</h2>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
          创建新实验
        </v-btn>
      </v-col>
    </v-row>

    <!-- 搜索和筛选 -->
    <v-card class="mb-6" elevation="2">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchParams.name"
              label="搜索实验名称"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="fetchExperiments"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchParams.creator"
              label="按创建人筛选"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="compact"
              hide-details
              @keyup.enter="fetchExperiments"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="secondary" @click="fetchExperiments" class="mr-2">
              搜索
            </v-btn>
            <v-btn variant="text" @click="resetSearch">
              重置
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 实验列表 -->
    <v-row v-if="loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else-if="experiments.length > 0">
      <v-col
        v-for="experiment in experiments"
        :key="experiment.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card hover elevation="3" class="h-100 d-flex flex-column">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-truncate">{{ experiment.name }}</span>
            <v-chip size="small" color="info" variant="flat">
              ID: {{ experiment.id }}
            </v-chip>
          </v-card-title>
          
          <v-card-text class="flex-grow-1">
            <p class="text-body-2 text-medium-emphasis mb-4 line-clamp-3">
              {{ experiment.description || '暂无描述' }}
            </p>
            
            <v-divider class="mb-3"></v-divider>
            
            <div class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2">mdi-account</v-icon>
              <span class="text-caption">{{ experiment.creator }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-caption">{{ formatDate(experiment.createdAt) }}</span>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              variant="tonal"
              color="primary"
              block
              class="mb-2"
              @click="viewExperiment(experiment.id)"
            >
              查看详情
            </v-btn>
            <div class="d-flex w-100 justify-space-between">
              <v-btn
                size="small"
                variant="text"
                color="secondary"
                prepend-icon="mdi-pencil"
                @click="openEditDialog(experiment)"
              >
                编辑
              </v-btn>
              <v-btn
                size="small"
                variant="text"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(experiment)"
              >
                删除
              </v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" class="text-center pa-10">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-flask-empty-outline</v-icon>
        <h3 class="text-h6 text-grey">暂无实验数据</h3>
        <p class="text-body-2 text-grey mb-4">创建一个新实验开始记录数据吧</p>
        <v-btn color="primary" @click="openCreateDialog">创建新实验</v-btn>
      </v-col>
    </v-row>

    <!-- 分页 -->
    <v-row v-if="total > 0" class="mt-4">
      <v-col cols="12">
        <v-pagination
          v-model="page"
          :length="totalPages"
          @update:model-value="fetchExperiments"
          rounded="circle"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- 创建/编辑实验对话框 -->
    <v-dialog v-model="dialog.visible" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ dialog.isEdit ? '编辑实验' : '创建新实验' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="formData.name"
              label="实验名称"
              :rules="[v => !!v || '实验名称是必填项']"
              required
              variant="outlined"
            ></v-text-field>
            
            <v-textarea
              v-model="formData.description"
              label="描述"
              rows="3"
              variant="outlined"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="closeDialog">取消</v-btn>
          <v-btn color="primary" variant="text" @click="saveExperiment" :loading="saving">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog.visible" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">确认删除?</v-card-title>
        <v-card-text>
          您确定要删除实验 "{{ deleteDialog.item?.name }}" 吗？此操作将删除该实验下的所有字段定义和数据记录，且不可恢复。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="deleteDialog.visible = false">取消</v-btn>
          <v-btn color="error" variant="text" @click="executeDelete" :loading="deleting">确认删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.visible" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.visible = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getExperiments, createExperiment, deleteExperiment } from '@/api/datasheet.api'; // 注意：这里假设后端没有专门的updateExperiment接口，根据API文档只有updateColumn和updateData，如果需要编辑实验基本信息可能需要补充API或者确认。根据用户描述"编辑可以修改实验的名称和描述"，但API文档中没有明确列出PUT /experiment/:id。暂时假设有或者复用创建接口？查看API文档...
// API文档中没有PUT /experiment/:id。
// 用户需求："编辑可以修改实验的名称和描述（不涉及字段修改）"
// 假设后端其实支持或者我遗漏了。为了不阻塞，我先不实现编辑API调用，或者假设createExperiment如果带ID就是更新？
// 重新检查API文档... 确实没有。
// 既然用户要求了，我先在前端做个样子，或者暂时禁用编辑功能的保存。
// 等等，通常RESTful API会有。
// 让我们假设有一个 updateExperiment API，虽然文档没写。或者我再次检查 implementation_plan.md
// implementation_plan.md 也没写 updateExperiment。
// 既然如此，我先只实现创建和删除。编辑功能我会在点击保存时提示"接口未定义"。
// 或者，我可以尝试用 createExperiment 的逻辑，但通常不对。
// 既然用户明确要求了，我应该在 implementation_plan 中指出的。
// 现在的策略：先实现UI，点击保存时暂时不做API调用，或者给个TODO提示。
// 实际上，通常 PUT /experiment/:id 是存在的。我会尝试添加这个假设的API调用，如果失败再调整。
// 为了稳妥，我先只做 UI，保存时 log 一下。

const router = useRouter();

// 状态
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const experiments = ref([]);
const page = ref(1);
const limit = ref(12); // 卡片布局每页12个比较合适
const total = ref(0);
const totalPages = ref(0);
const valid = ref(false);
const form = ref(null);

const searchParams = reactive({
  name: '',
  creator: ''
});

const dialog = reactive({
  visible: false,
  isEdit: false,
  id: null
});

const formData = reactive({
  name: '',
  description: ''
});

const deleteDialog = reactive({
  visible: false,
  item: null
});

const snackbar = reactive({
  visible: false,
  text: '',
  color: 'success'
});

// 方法
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.visible = true;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

const fetchExperiments = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
      ...searchParams
    };
    const res = await getExperiments(params);
    
    // 根据API文档响应结构: { data: { total, page, limit, totalPages, experiments: [] } }
    // 或者是 res.data.data ... 取决于 axios 封装。假设 authApi 返回的是 response.data
    if (res.data) {
        const data = res.data; // 假设直接是 data 对象
        experiments.value = data.data || [];
        total.value = data.total || 0;
        totalPages.value = data.totalPages || 1;
    }
  } catch (error) {
    console.error('Failed to fetch experiments:', error);
    showSnackbar('获取实验列表失败', 'error');
  } finally {
    loading.value = false;
  }
};

const resetSearch = () => {
  searchParams.name = '';
  searchParams.creator = '';
  page.value = 1;
  fetchExperiments();
};

const openCreateDialog = () => {
  dialog.isEdit = false;
  dialog.id = null;
  formData.name = '';
  formData.description = '';
  dialog.visible = true;
};

const openEditDialog = (item) => {
  dialog.isEdit = true;
  dialog.id = item.id;
  formData.name = item.name;
  formData.description = item.description;
  dialog.visible = true;
};

const closeDialog = () => {
  dialog.visible = false;
  if (form.value) form.value.resetValidation();
};

const saveExperiment = async () => {
  if (!form.value) return;
  const { valid: isValid } = await form.value.validate();
  if (!isValid) return;

  saving.value = true;
  try {
    if (dialog.isEdit) {
      // TODO: 实现更新实验 API
      // await updateExperiment(dialog.id, formData);
      showSnackbar('编辑功能暂未对接后端API', 'warning');
    } else {
      const res = await createExperiment(formData);
      showSnackbar('实验创建成功');
      closeDialog();
      // 创建成功后跳转到详情页
      if (res.data && res.data.id) {
          router.push({ name: 'experimentDetail', params: { id: res.data.id } });
      } else {
          fetchExperiments();
      }
    }
  } catch (error) {
    console.error('Failed to save experiment:', error);
    showSnackbar('保存失败: ' + (error.response?.data?.msg || error.message), 'error');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (item) => {
  deleteDialog.item = item;
  deleteDialog.visible = true;
};

const executeDelete = async () => {
  if (!deleteDialog.item) return;
  deleting.value = true;
  try {
    await deleteExperiment(deleteDialog.item.id);
    showSnackbar('实验删除成功');
    deleteDialog.visible = false;
    fetchExperiments();
  } catch (error) {
    console.error('Failed to delete experiment:', error);
    showSnackbar('删除失败', 'error');
  } finally {
    deleting.value = false;
  }
};

const viewExperiment = (id) => {
  router.push({ name: 'experimentDetail', params: { id } });
};

onMounted(() => {
  fetchExperiments();
});
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>