<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <h2 class="text-h5 font-weight-bold">样品数据展示</h2>
        <v-spacer></v-spacer>
        <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            class="ml-2"
            @click="addDialog = true"
        >
          添加样品
        </v-btn>
        <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            @click="fetchGoods"
            :loading="loading"
        >
          刷新数据
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- 搜索框和筛选开关 -->
        <v-row>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-text-field
                v-model="search"
                label="搜索"
                prepend-inner-icon="mdi-magnify"
                density="compact"
                hide-details
                variant="outlined"
                clearable
                class="mb-2"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="8" lg="9" class="d-flex justify-end align-center">
            <v-btn
                color="primary"
                variant="outlined"
                @click="showFilters = !showFilters"
                class="ml-2"
            >
              <v-icon start>mdi-filter-variant</v-icon>
              {{ showFilters ? '收起筛选' : '高级筛选' }}
            </v-btn>
          </v-col>
        </v-row>

        <!-- 高级筛选面板 -->
        <v-expand-transition>
          <div v-if="showFilters" class="filter-panel bg-grey-lighten-5 mt-3">
            <v-divider></v-divider>
            <v-card-text class="pa-4">
              <h3 class="text-subtitle-1 font-weight-medium mb-3">
                <v-icon small class="mr-1">mdi-tune</v-icon>
                高级筛选选项
              </h3>
              <v-row dense>
                <v-col cols="12" sm="6" md="3">
                  <v-select
                      v-model="filters.location"
                      :items="locations"
                      label="存放位置"
                      density="compact"
                      hide-details
                      variant="outlined"
                      clearable
                      class="mb-3"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-select
                      v-model="filters.tags"
                      :items="tags"
                      label="标签"
                      density="compact"
                      hide-details
                      variant="outlined"
                      clearable
                      multiple
                      chips
                      class="mb-3"
                  ></v-select>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-menu
                      v-model="dateMenu.fromDate"
                      :close-on-content-click="false"
                      location="bottom"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                          v-bind="props"
                          v-model="filters.fromDate"
                          label="创建日期从"
                          readonly
                          variant="outlined"
                          density="compact"
                          hide-details
                          clearable
                          class="mb-3"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                        v-model="filters.fromDate"
                        @update:model-value="dateMenu.fromDate = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-menu
                      v-model="dateMenu.toDate"
                      :close-on-content-click="false"
                      location="bottom"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                          v-bind="props"
                          v-model="filters.toDate"
                          label="创建日期至"
                          readonly
                          variant="outlined"
                          density="compact"
                          hide-details
                          clearable
                          class="mb-3"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                        v-model="filters.toDate"
                        @update:model-value="dateMenu.toDate = false"
                    ></v-date-picker>
                  </v-menu>
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                      v-model="filters.minPrice"
                      label="最低价格"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      type="number"
                      class="mb-3"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                      v-model="filters.maxPrice"
                      label="最高价格"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      type="number"
                      class="mb-3"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                      v-model="filters.buyer"
                      label="购买人"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      class="mb-3"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" sm="6" md="3">
                  <v-text-field
                      v-model="filters.department"
                      label="部门"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      class="mb-3"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row class="mt-2">
                <v-col cols="12" class="d-flex justify-end">
                  <v-btn
                      color="grey-darken-1"
                      variant="text"
                      @click="resetFilters"
                  >
                    重置
                  </v-btn>
                  <v-btn
                      color="primary"
                      class="ml-2"
                      @click="applyFilters"
                  >
                    应用筛选
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
            <v-divider></v-divider>
          </div>
        </v-expand-transition>
      </v-card-text>

      <!-- Data Table -->
      <v-data-table
          :headers="headers"
          :items="goodsData"
          :loading="loading"
          :items-per-page="pagination.pageSize"
          :page="pagination.currentPage"
          :server-items-length="pagination.totalItems"
          class="elevation-1"
          hide-default-footer
          @update:options="handleSortChange"
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
          <v-icon size="small" @click="showItemDetails(item)">mdi-book-account</v-icon>
          <v-icon size="small" class="ml-2" @click="openEditDialog(item)">mdi-pencil-box</v-icon>
          <v-icon size="small" color="error" class="ml-2" @click="openDeleteDialog(item)">mdi-delete</v-icon>
        </template>

        <!-- No data template -->
        <template v-slot:no-data>
          <div class="d-flex align-center justify-center pa-4">
            <v-icon icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
            暂无数据
          </div>
        </template>

        <!-- 加载中状态 -->
        <template v-slot:loader>
          <v-progress-linear indeterminate color="primary"></v-progress-linear>
        </template>
      </v-data-table>

      <!-- 分页控件 -->
      <div class="pagination-wrapper pt-4 px-2">
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-subtitle-2 text-grey-darken-1">
            总共 <span class="font-weight-bold">{{ pagination.totalItems }}</span> 条记录
          </div>

          <v-pagination
              v-model="pagination.currentPage"
              :length="pagination.totalPages"
              total-visible="7"
              rounded
              class="my-2"
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
      <v-card v-if="selectedItem">
        <div class="position-relative">
          <v-btn
              icon
              size="small"
              @click="detailDialog = false"
              class="close-btn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-card-title class="text-h5 font-weight-bold primary--text">
          {{ selectedItem.name }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12">
              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>价格</v-list-item-title>
                <v-list-item-subtitle>{{ selectedItem.price }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>数量</v-list-item-title>
                <v-list-item-subtitle>{{ selectedItem.quantity }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>存放位置</v-list-item-title>
                <v-list-item-subtitle>{{ selectedItem.location }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>购买人</v-list-item-title>
                <v-list-item-subtitle>
                  {{ selectedItem.Buyer.name }} ({{ selectedItem.Buyer.department }})
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>联系方式</v-list-item-title>
                <v-list-item-subtitle>{{ selectedItem.Buyer.contact }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>更新时间</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedItem.updatedAt) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                </template>
                <v-list-item-title>创建时间</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedItem.createdAt) }}</v-list-item-subtitle>
              </v-list-item>
            </v-col>
          </v-row>

          <v-divider class="my-3"></v-divider>

          <v-row>
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-medium mb-2">描述</div>
              <div class="text-body-1">{{ selectedItem.description || '暂无描述' }}</div>
            </v-col>
          </v-row>

          <v-row v-if="selectedItem.Tags && selectedItem.Tags.length">
            <v-col cols="12">
              <div class="text-subtitle-1 font-weight-medium mb-2">标签</div>
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
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Add Sample Dialog -->
    <v-dialog v-model="addDialog" max-width="600px">
      <v-card elevation="10" class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold mb-2 align-center" style="color:#1976d2">
          <v-icon color="primary" class="mr-2">mdi-plus-box-multiple</v-icon>
          添加样品
        </v-card-title>
        <v-divider class="mb-4"></v-divider>
        <v-card-text>
          <v-form ref="addFormRef" v-model="addFormValid">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.name" label="样品名称" :rules="[v => !!v || '必填']" required  color="primary" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.description" label="样品描述"  color="primary" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="addForm.sample.quantity" label="数量" type="number" :rules="[v => v > 0 || '需大于0']" required  color="primary" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model.number="addForm.sample.price" label="单价" type="number" :rules="[v => v >= 0 || '需不小于0']" required  color="primary" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="addForm.sample.location" label="存放位置" color="primary" variant="outlined"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.name" label="购买人姓名" required  color="indigo" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.contact" label="联系方式" required  color="indigo" variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="addForm.buyer.department" label="部门" required color="indigo" variant="outlined"></v-text-field>
              </v-col>
            </v-row>
            <v-divider class="my-2"></v-divider>
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
                    color="deep-purple"
                    variant="outlined"
                ></v-combobox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="mt-2">
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="submitAddSample" :loading="addLoading" class="elevation-2 px-6" style="border-radius:20px;">提交</v-btn>
          <v-btn text @click="addDialog = false" class="px-6" style="border-radius:20px;">取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card elevation="10" class="pa-4 rounded-xl">
        <v-card-title class="text-h6 font-weight-bold mb-2 align-center" style="color:#1976d2">
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
import {ref, onMounted, computed, reactive, watch} from 'vue';
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
const pagination = reactive({
  totalItems: 0,
  totalPages: 0,
  currentPage: 1,
  pageSize: 10,
  hasNextPage: false,
  hasPrevPage: false
});

// Dialog for item details
const detailDialog = ref(false);
const selectedItem = ref(null);

// 筛选面板控制
const showFilters = ref(false);

// Search and filter
const search = ref('');
const selectedLocation = ref(null);
const selectedTags = ref([]);

// 筛选条件
const filters = reactive({
  location: null,
  tags: [],
  fromDate: null,
  toDate: null,
  minPrice: null,
  maxPrice: null,
  buyer: '',
  department: ''
});

// 日期选择器控制
const dateMenu = reactive({
  fromDate: false,
  toDate: false
});

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

// 每页条数选项
const pageSizeOptions = [5, 10, 20, 50];

// 排序参数
const sortParams = reactive({
  sortBy: 'updatedAt',
  sortOrder: 'DESC'
});

// Fetch data with pagination and filters
const fetchGoods = async (params = {}) => {
  loading.value = true;
  try {
    const response = await getGoods({
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      sortBy: sortParams.sortBy,
      sortOrder: sortParams.sortOrder,
      search: search.value,
      location: filters.location,
      tags: filters.tags && filters.tags.length > 0 ? filters.tags.join(',') : null,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      buyer: filters.buyer,
      department: filters.department,
      ...params
    });

    if (response.data.msg === 'successfully!') {
      goodsData.value = response.data.data;

      // 更新分页信息
      if (response.data.pagination) {
        const { totalItems, totalPages, currentPage, pageSize, hasNextPage, hasPrevPage } = response.data.pagination;
        pagination.totalItems = totalItems || 0;
        pagination.totalPages = totalPages || 0;
        pagination.currentPage = currentPage || 1;
        pagination.pageSize = pageSize || 10;
        pagination.hasNextPage = hasNextPage || false;
        pagination.hasPrevPage = hasPrevPage || false;
      }
    }
  } catch (error) {
    console.error('Error fetching goods data:', error);
  } finally {
    loading.value = false;
  }
};

// 处理每页显示数量变化
const onPageSizeChange = (newSize) => {
  pagination.pageSize = newSize;
  pagination.currentPage = 1; // 重置为第一页
  fetchGoods();
};

// 处理排序变化
const handleSortChange = (options) => {
  // 只处理排序变化，页码和每页数量由其他函数处理
  if (options.sortBy && options.sortBy.length > 0) {
    sortParams.sortBy = options.sortBy[0].key;
    sortParams.sortOrder = options.sortBy[0].order.toUpperCase();
    fetchGoods();
  }
};

// 应用筛选条件
const applyFilters = () => {
  pagination.currentPage = 1; // 重置为第一页
  fetchGoods({
    search: search.value,
    location: filters.location,
    tags: filters.tags && filters.tags.length > 0 ? filters.tags.join(',') : null,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    buyer: filters.buyer,
    department: filters.department
  });
};

// 重置筛选条件
const resetFilters = () => {
  // 重置所有筛选条件
  Object.assign(filters, {
    location: null,
    tags: [],
    fromDate: null,
    toDate: null,
    minPrice: null,
    maxPrice: null,
    buyer: '',
    department: ''
  });
  search.value = '';
  pagination.currentPage = 1; // 重置为第一页
  fetchGoods();
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

// 监视分页当前页变化
watch(() => pagination.currentPage, (newPage, oldPage) => {
  if (newPage !== oldPage && !loading.value) {
    fetchGoods();
  }
});

// 监视搜索关键词变化，自动应用筛选
watch(() => search.value, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    applyFilters();
  }
});

// 初始化
onMounted(() => {
  fetchGoods();
});
</script>

<style scoped>
.v-data-table {
  margin-top: 16px;
}

.v-card-title {
  padding-bottom: 0;
}

.position-relative {
  position: relative;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.pagination-wrapper {
  border-top: 1px solid #eeeeee;
  padding-top: 16px;
}

.filter-panel {
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
  border-radius: 8px;
}
</style>