<template>
  <v-container fluid class="goods-page pa-4">
    <v-alert
      v-if="alert.show"
      :type="alert.type"
      variant="tonal"
      closable
      class="mb-4 glass-card"
      density="comfortable"
      @click:close="alert.show = false"
    >
      {{ alert.message }}
    </v-alert>

    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="glass-card pa-4">
          <v-row align="center" no-gutters>
            <v-col cols="12" md="7">
              <div class="d-flex align-center">
                <div class="hero-dot mr-3"></div>
                <div>
                  <div class="text-overline text-brand-muted">Inventory</div>
                  <div class="text-h5 font-weight-bold">耗材样品管理</div>
                  <div class="text-body-2 text-brand-muted mt-1">
                    快速查看、筛选与维护耗材样品，支持标签统计。
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="5" class="d-flex justify-end align-center flex-wrap">
              <div class="d-flex flex-wrap mr-2 mb-2">
                <v-chip color="primary" variant="flat" size="small" class="mr-2 mb-2">
                  总数 {{ pagination.totalItems || goodsData.length }}
                </v-chip>
                <v-chip color="secondary" variant="flat" size="small" class="mr-2 mb-2">
                  标签 {{ stats.tagCount }}
                </v-chip>
                <v-chip color="info" variant="flat" size="small" class="mb-2">
                  位置 {{ stats.locationCount }}
                </v-chip>
              </div>
              <v-btn
                  color="primary"
                  class="glass-card mb-2 mr-2"
                  prepend-icon="mdi-plus"
                  @click="addDialog = true"
              >
                添加样品
              </v-btn>
              <v-btn
                  color="secondary"
                  variant="tonal"
                  class="mb-2"
                  prepend-icon="mdi-refresh"
                  @click="fetchGoods"
                  :loading="loading"
              >
                刷新
              </v-btn>
              <v-btn
                  variant="text"
                  color="primary"
                  class="mb-2"
                  prepend-icon="mdi-filter-variant"
                  @click="showFilters = !showFilters"
              >
                {{ showFilters ? '收起筛选' : '筛选' }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="glass-card mb-4">
      <v-card-text>
        <v-expand-transition>
          <div v-if="showFilters">
            <v-row dense>
              <v-col cols="12" sm="6" md="3">
                <v-text-field
                    v-model="search"
                    label="搜索"
                    prepend-inner-icon="mdi-magnify"
                    density="comfortable"
                    hide-details
                    variant="outlined"
                    clearable
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                    v-model="selectedLocation"
                    :items="locations"
                    label="存放位置"
                    density="comfortable"
                    hide-details
                    variant="outlined"
                    clearable
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                    v-model="selectedTags"
                    :items="tags"
                    label="标签"
                    density="comfortable"
                    hide-details
                    variant="outlined"
                    clearable
                    multiple
                    chips
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6" md="3" class="d-flex align-center">
                <v-btn
                    color="secondary"
                    variant="tonal"
                    append-icon="mdi-text-search"
                    class="mr-2"
                    @click="resetFilters"
                >
                  重置筛选
                </v-btn>
                <v-btn
                    variant="text"
                    color="primary"
                    :title="showFilters ? '收起筛选' : '筛选选项'"
                    @click="showFilters = !showFilters"
                >
                  <v-icon>mdi-filter-variant</v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <v-card class="glass-card">
      <v-data-table
          :headers="headers"
          :items="filteredGoods"
          :loading="loading"
          :items-per-page="pagination.pageSize"
          :page="pagination.currentPage"
          :server-items-length="pagination.totalItems"
          class="elevation-0"
          density="comfortable"
          hide-default-footer
      >
        <!-- Price column -->
        <template v-slot:item.price="{ item }">
          <span>{{ item.price }}</span>
        </template>

        <!-- Tags column -->
        <template v-slot:item.tags="{ item }">
          <v-chip
              v-for="tag in item.Tags"
              :key="tag.id"
              size="small"
              class="mr-1"
              :color="getTagColor(tag.name)"
              text-color="white"
          >
            {{ tag.name }}
          </v-chip>
        </template>

        <!-- Created/Updated date columns -->
        <template v-slot:item.updatedAt="{ item }">
          {{ formatDate(item.updatedAt) }}
        </template>

        <!-- Buyer column -->
        <template v-slot:item.buyer="{ item }">
          <div>
            <div>{{ item.Buyer.name }}</div>
            <div class="text-caption">{{ item.Buyer.department }}</div>
          </div>
        </template>

        <!-- Operations column -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" color="primary" @click="showItemDetails(item)">
            <v-icon>mdi-book-account</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="secondary" @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="openDeleteDialog(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>

        <!-- No data template -->
        <template v-slot:no-data>
          <div class="d-flex align-center justify-center pa-4">
            <v-icon icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
            暂无数据
          </div>
        </template>
      </v-data-table>

      <!-- 分页控件 -->
      <div class="pagination-wrapper pt-2 px-4">
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-subtitle-2 text-brand-muted">
            总共 <span class="font-weight-bold">{{ pagination.totalItems }}</span> 条记录
          </div>

          <v-pagination
            v-model="pagination.currentPage"
            :length="pagination.totalPages"
            total-visible="7"
            rounded
            class="my-2"
            @update:model-value="onPageChange"
          ></v-pagination>

          <div class="d-flex align-center">
            <span class="text-body-2 mr-2">每页显示</span>
            <v-select
              v-model="pagination.pageSize"
              :items="pageSizeOptions"
              variant="outlined"
              density="compact"
              class="d-inline-block"
              style="width: 80px"
              hide-details
              @update:model-value="onPageSizeChange"
            ></v-select>
            <span class="text-body-2 ml-2">条</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Item Details Dialog -->
    <v-dialog v-model="detailDialog" max-width="600px">
      <v-card>
        <v-card-title class="primary white--text py-2 d-flex justify-center">
          <span class="text-h4 font-weight-bold mt-2">样品详情</span>
        </v-card-title>
        <v-card-text class="pt-2">
          <v-container v-if="selectedItem" class="py-0">
            <v-row dense>
              <!-- 基本信息 -->
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">基本信息</v-subheader>
                <v-divider class="my-1" />
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item title="名称" :subtitle="selectedItem.name" class="py-1" />
                  <v-list-item title="价格" :subtitle="selectedItem.price" class="py-1" />
                  <v-list-item title="数量" :subtitle="selectedItem.quantity" class="py-1" />
                  <v-list-item title="存放位置" :subtitle="selectedItem.location" class="py-1" />
                </v-list>
              </v-col>

              <!-- 购买信息 -->
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">购买信息</v-subheader>
                <v-divider class="my-1" />
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item title="购买人" :subtitle="`${selectedItem.Buyer.name} (${selectedItem.Buyer.department})`" class="py-1" />
                  <v-list-item title="联系方式" :subtitle="selectedItem.Buyer.contact" class="py-1" />
                </v-list>
              </v-col>

              <!-- 时间信息 -->
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">时间信息</v-subheader>
                <v-divider class="my-1" />
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item title="更新时间" :subtitle="formatDate(selectedItem.updatedAt)" class="py-1" />
                  <v-list-item title="创建时间" :subtitle="formatDate(selectedItem.createdAt)" class="py-1" />
                </v-list>
              </v-col>

              <!-- 描述 -->
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">描述</v-subheader>
                <v-divider class="my-1" />
                <div class="text-body-1">{{ selectedItem.description || '暂无描述' }}</div>
              </v-col>

              <!-- 标签 -->
              <v-col
                cols="12"
                v-if="selectedItem.Tags && selectedItem.Tags.length"
                class="py-1"
              >
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">标签</v-subheader>
                <v-divider class="my-1" />
                <v-chip
                  v-for="tag in selectedItem.Tags"
                  :key="tag.id"
                  size="small"
                  class="mr-1 mb-1"
                  :color="getTagColor(tag.name)"
                  text-color="white"
                >
                  {{ tag.name }}
                </v-chip>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="px-4 pb-2">
          <v-spacer />
          <v-btn class="mb-2 ml-2" color="primary" variant="elevated" @click="detailDialog = false" small>关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add Sample Dialog -->
    <v-dialog v-model="addDialog" max-width="720px" transition="dialog-bottom-transition">
      <v-card class="pa-4 glass-card">
        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <div class="text-overline text-brand-muted">新增样品</div>
            <div class="text-h6 font-weight-bold">添加样品信息</div>
          </div>
          <v-avatar color="primary" variant="tonal">
            <v-icon>mdi-flask</v-icon>
          </v-avatar>
        </div>
        <v-divider class="mb-4"></v-divider>
        <v-card-text class="pt-0">
          <v-form ref="addFormRef" v-model="addFormValid">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.name" label="样品名称" :rules="[v => !!v || '必填']" required color="primary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.description" label="样品描述" color="primary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="addForm.sample.quantity" label="数量" type="number" :rules="[v => v > 0 || '需大于0']" required color="primary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="addForm.sample.price" label="单价" type="number" :rules="[v => v >= 0 || '需不小于0']" required color="primary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.location" label="存放位置" color="primary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.name" label="购买人姓名" required color="secondary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.contact" label="联系方式" required color="secondary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.department" label="部门" required color="secondary" variant="outlined" density="comfortable"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-4"></v-divider>
            <v-row>
              <v-col cols="12">
                <v-combobox
                    v-model="addForm.tags"
                    label="标签(可多选或输入)"
                    multiple
                    chips
                    clearable
                    :items="tags"
                    item-text="name"
                    item-value="name"
                    small-chips
                    color="secondary"
                    variant="outlined"
                    density="comfortable"
                ></v-combobox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="mt-2">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog = false" class="px-6" style="border-radius:16px;">取消</v-btn>
          <v-btn color="primary" @click="submitAddSample" :loading="addLoading" class="elevation-2 px-6" style="border-radius:16px;">提交</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card elevation="10" class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold mb-2 align-center text-primary">
          <v-icon color="primary" class="mr-2">mdi-pencil</v-icon>
          修改样品
        </v-card-title>
        <v-divider class="mb-4"></v-divider>
        <v-form ref="editFormRef">
          <v-text-field v-model="editForm.sample.name" label="名称" required></v-text-field>
          <v-text-field v-model="editForm.sample.description" label="描述"></v-text-field>
          <v-text-field v-model="editForm.sample.quantity" label="数量" type="number"></v-text-field>
          <v-text-field v-model="editForm.sample.price" label="价格" type="number"></v-text-field>
          <v-text-field v-model="editForm.sample.location" label="存放位置"></v-text-field>
          <v-divider class="my-2"></v-divider>
          <v-text-field v-model="editForm.buyer.name" label="购买人" required></v-text-field>
          <v-text-field v-model="editForm.buyer.contact" label="联系方式"></v-text-field>
          <v-text-field v-model="editForm.buyer.department" label="部门"></v-text-field>
          <v-divider class="my-2"></v-divider>
          <v-combobox
              v-model="editForm.tags"
              :items="tags"
              item-text="name"
              label="标签"
              multiple
              chips
              clearable
              :return-object="true"
              placeholder="输入或选择标签"
          ></v-combobox>
        </v-form>
        <v-card-actions class="mt-2">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="handleEdit" :loading="editLoading" class="elevation-2 px-6" style="border-radius:20px;">保存</v-btn>
          <v-btn text @click="showEditDialog = false" class="px-6" style="border-radius:20px;">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">确认删除</v-card-title>
        <v-card-text>
          <span>确定要删除 <strong>{{ itemToDelete?.name }}</strong> 吗？此操作不可撤销。</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false" :disabled="deleteLoading">取消</v-btn>
          <v-btn color="error" @click="handleDelete" :loading="deleteLoading" :disabled="deleteLoading">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import {ref, onMounted, computed, reactive} from 'vue';
import {getGoods} from '@/api/goods.api';
import {addGoods} from '@/api/goods.api';
import {deleteGoods} from '@/api/goods.api';
import {editGoods} from '@/api/goods.api';

// Date formatting function
const formatDate = (dateString) => {
  if (!dateString) return '未知';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Tag color mapping function
const getTagColor = (tagName) => {
  // Predefined colors for known tags
  const colorMap = {
    '试剂': 'purple',
    '采血管': 'indigo',
    '储存': 'teal',
    '仪器': 'deep-orange',
    '消耗品': 'blue-grey',
    '化学品': 'red',
    '生物制品': 'green'
  };

  // If tag exists in map, return its color
  if (colorMap[tagName]) {
    return colorMap[tagName];
  }

  // For new tags, generate a consistent color based on the tag name
  // This ensures the same tag always gets the same color
  const colors = ['pink', 'blue', 'cyan', 'green', 'amber', 'deep-purple', 'light-blue',
    'lime', 'orange', 'brown', 'blue-grey', 'grey'];

  // Simple hash function to map tag name to a color index
  let hashCode = 0;
  for (let i = 0; i < tagName.length; i++) {
    hashCode = (hashCode + tagName.charCodeAt(i)) % colors.length;
  }

  return colors[hashCode];
};

// Data
const loading = ref(false);
const goodsData = ref([]);
const pagination = ref({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 50,
  hasNextPage: false,
  hasPrevPage: false
});

// 每页条数选项
const pageSizeOptions = [50, 100, 200, 300];

const stats = computed(() => {
  const tagSet = new Set();
  const locationSet = new Set();
  goodsData.value.forEach(item => {
    if (item.Tags) item.Tags.forEach(t => tagSet.add(t.name));
    if (item.location) locationSet.add(item.location);
  });
  return { tagCount: tagSet.size, locationCount: locationSet.size };
});

const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  timeout: 3000
});

// Dialog for item details
const detailDialog = ref(false);
const selectedItem = ref(null);

// Search and filter
const search = ref('');
const selectedLocation = ref(null);
const selectedTags = ref([]);
const showFilters = ref(false);

// Computed properties for filters
const locations = computed(() => {
  const uniqueLocations = new Set();
  goodsData.value.forEach(item => {
    if (item.location) {
      uniqueLocations.add(item.location);
    }
  });
  return Array.from(uniqueLocations);
});

const tags = computed(() => {
  const uniqueTags = new Set();
  goodsData.value.forEach(item => {
    if (item.Tags && item.Tags.length) {
      item.Tags.forEach(tag => {
        uniqueTags.add(tag.name);
      });
    }
  });
  return Array.from(uniqueTags);
});

// Headers for data table
const headers = [
  {title: '名称', key: 'name', sortable: true},
  {title: '价格', key: 'price', sortable: true},
  {title: '数量', key: 'quantity', sortable: true},
  {title: '描述', key: 'description', sortable: false},
  {title: '存放位置', key: 'location', sortable: true},
  {title: '标签', key: 'tags', sortable: false},
  {title: '更新时间', key: 'updatedAt', sortable: true},
  {title: '购买人', key: 'buyer', sortable: false},
  {title: '操作', key: 'actions', sortable: false},
];

// Fetch data
const fetchGoods = async () => {
  try {
    loading.value = true;
    const response = await getGoods({
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize
    });
    if (response.data.success) {
      goodsData.value = response.data.data;

      // 更新分页信息
      if (response.data.pagination) {
        const { totalItems, totalPages, currentPage, pageSize, hasNextPage, hasPrevPage } = response.data.pagination;
        pagination.value.totalItems = totalItems;
        pagination.value.totalPages = totalPages;
        pagination.value.currentPage = currentPage;
        pagination.value.pageSize = pageSize;
        pagination.value.hasNextPage = hasNextPage;
        pagination.value.hasPrevPage = hasPrevPage;
      }
    }
  } catch (error) {
    console.error('Failed to load goods data:', error);
  } finally {
    loading.value = false;
  }
};

// 处理每页显示数量变化
const onPageSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  pagination.value.currentPage = 1; // 重置为第一页
  fetchGoods();
};

// 处理页码变化
const onPageChange = (newPage) => {
  fetchGoods();
};

// Filtered data
const filteredGoods = computed(() => {
  let filtered = goodsData.value;

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase();
    filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.location?.toLowerCase().includes(searchLower) ||
        item.Buyer?.name?.toLowerCase().includes(searchLower)
    );
  }

  // Apply location filter
  if (selectedLocation.value) {
    filtered = filtered.filter(item => item.location === selectedLocation.value);
  }

  // Apply tag filter
  if (selectedTags.value && selectedTags.value.length > 0) {
    filtered = filtered.filter(item =>
        item.Tags && item.Tags.some(tag => selectedTags.value.includes(tag.name))
    );
  }

  return filtered;
});

// Reset filters
const resetFilters = () => {
  search.value = '';
  selectedLocation.value = null;
  selectedTags.value = [];
};

// Function to show item details
const showItemDetails = (item) => {
  selectedItem.value = item;
  detailDialog.value = true;
};

// 删除相关
const showDeleteDialog = ref(false);
const itemToDelete = ref(null);
const deleteLoading = ref(false);

function openDeleteDialog(item) {
  itemToDelete.value = item;
  showDeleteDialog.value = true;
}

async function handleDelete() {
  if (!itemToDelete.value) return;
  deleteLoading.value = true;
  try {
    await deleteGoods(itemToDelete.value.id);
    showDeleteDialog.value = false;
    itemToDelete.value = null;
    fetchGoods();
  } catch (e) {
    // 可根据需要弹窗提示
    console.error('删除失败', e);
  } finally {
    deleteLoading.value = false;
  }
}

// 编辑相关
const showEditDialog = ref(false);
const editForm = ref({
  sample: { name: '', description: '', quantity: null, price: null, location: '' },
  buyer: { name: '', contact: '', department: '' },
  tags: []
});
const editFormRef = ref(null);
const editLoading = ref(false);
const editingId = ref(null);

function openEditDialog(item) {
  editingId.value = item.id;
  // 预填充表单
  editForm.value = {
    sample: {
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      location: item.location
    },
    buyer: {
      name: item.Buyer?.name || '',
      contact: item.Buyer?.contact || '',
      department: item.Buyer?.department || ''
    },
    tags: (item.Tags || []).map(tag => ({ name: tag.name }))
  };
  showEditDialog.value = true;
}

async function handleEdit() {
  if (!editFormRef.value) return;
  const valid = await editFormRef.value.validate();
  if (!valid) return;
  editLoading.value = true;
  // tags 转换为对象数组
  const tagsArr = editForm.value.tags.map(tag => typeof tag === 'string' ? { name: tag } : tag);
  const payload = {
    sample: editForm.value.sample,
    buyer: editForm.value.buyer,
    tags: tagsArr
  };
  try {
    await editGoods(editingId.value, payload);
    showEditDialog.value = false;
    fetchGoods();
  } catch (e) {
    console.error('修改失败', e);
  } finally {
    editLoading.value = false;
  }
}

// Add sample dialog
const addDialog = ref(false);
const addFormValid = ref(false);
const addFormRef = ref(null);
const addLoading = ref(false);
const addForm = ref({
  sample: {
    name: '',
    description: '',
    quantity: null,
    price: null,
    location: ''
  },
  buyer: {
    name: '',
    contact: '',
    department: ''
  },
  tags: []
});

function resetAddForm() {
  addForm.value = {
    sample: { name: '', description: '', quantity: null, price: null, location: '' },
    buyer: { name: '', contact: '', department: '' },
    tags: []
  };
}

async function submitAddSample() {
  if (!addFormRef.value) return;
  const valid = await addFormRef.value.validate();
  if (!valid) return;
  addLoading.value = true;
  // 组装tags为对象数组
  const tagsArr = addForm.value.tags.map(tag => typeof tag === 'string' ? { name: tag } : tag);
  const payload = {
    sample: addForm.value.sample,
    buyer: addForm.value.buyer,
    tags: tagsArr
  };
  try {
    await addGoods(payload);
    addDialog.value = false;
    resetAddForm();
    fetchGoods();
  } catch (e) {
    // 可根据需要弹窗提示
    console.error('添加失败', e);
  } finally {
    addLoading.value = false;
  }
}

// Initialize
onMounted(() => {
  fetchGoods();
});
</script>

<style scoped>
.goods-page {
  min-height: calc(100vh - 120px);
}

.hero-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(120deg, #5ba6a6, #2d3a8c);
  box-shadow: 0 0 12px rgba(45, 58, 140, 0.35);
}

.v-data-table {
  margin-top: 8px;
}
</style>
