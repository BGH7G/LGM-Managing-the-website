<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getClaims, getClaimById, createClaim, updateClaim, deleteClaim, approveClaim, rejectClaim } from '@/api/claim.api';
import { useUserStore } from '@/stores/auth';

const userStore = useUserStore();

// 列表数据
const claims = ref([]);
const total = ref(0);
const loading = ref(false);

// 分页 & 排序参数
const page = ref(1);
const pageSize = ref(10);
const sortBy = ref('updatedAt');
const sortOrder = ref('DESC');

// 过滤参数
const statusFilter = ref('');

// UI 控制
const showFilters = ref(false);

// 详情对话框
const selectedClaim = ref(null);
const dialog = ref(false);

// 新增/编辑表单对话框
const formDialog = ref(false);
const isEdit = ref(false);
const claimForm = ref({
  amount: '',
  purchaseDate: '',
  seller: '',
  description: ''
});

// 当前用户信息
const currentUser = computed(() => {
  let info = userStore.userInfo;
  try {
    if (typeof info === 'string') info = JSON.parse(info);
  } catch (e) {
    /* ignore */
  }
  return info || {};
});

// 是否可编辑（pending 且本人或管理员）
const canEdit = computed(() => {
  if (!selectedClaim.value) return false;
  if (selectedClaim.value.status !== 'pending') return false;
  if (isAdmin.value) return true;
  return selectedClaim.value.userId === currentUser.value.id;
});

// 是否可删除
const canDelete = computed(() => {
  if (!selectedClaim.value) return false;
  if (isAdmin.value) return true;
  return (
    selectedClaim.value.status === 'pending' &&
    selectedClaim.value.userId === currentUser.value.id
  );
});

// 管理员是否可审批行
const canProcessRow = (item) => isAdmin.value && item.status === 'pending';

// 分页控件配置
const pageSizeOptions = [5, 10, 20, 50];
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);

// 判断是否为管理员
const isAdmin = computed(() => {
  if (!userStore.userInfo) return false;
  let info = userStore.userInfo;
  try {
    if (typeof info === 'string') info = JSON.parse(info);
  } catch (e) {
    /* ignore */
  }
  return info?.role === 'admin';
});

// 表头
const headersAdmin = [
  { title: '申请人ID', value: 'userId', sortable: false },
  { title: '描述', value: 'description', sortable: false },
  { title: '金额', value: 'amount', sortable: true },
  { title: '商家', value: 'seller', sortable: false },
  { title: '购买日期', value: 'purchaseDate', sortable: true },
  { title: '状态', value: 'status', sortable: false },
  { title: '创建时间', value: 'createdAt', sortable: true },
  { title: '操作', value: 'actions', sortable: false }
];

const headersUser = headersAdmin.filter(h => h.value !== 'userId');

const headers = computed(() => (isAdmin.value ? headersAdmin : headersUser));

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getClaims({
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      status: statusFilter.value || undefined
    });

    if (res?.data) {
      claims.value = res.data.list || [];
      total.value = res.data.total || 0;
    }
  } catch (err) {
    console.error('获取报账列表失败', err);
  } finally {
    loading.value = false;
  }
};

const showClaimDetails = async (claimId) => {
  try {
    const res = await getClaimById(claimId);
    if (res.data.data) {
      selectedClaim.value = res.data.data;
      dialog.value = true;
    }
  } catch (err) {
    console.error('获取报账详情失败', err);
  }
};

onMounted(fetchData);

// 监听分页 / 过滤变化
watch([page, pageSize, statusFilter], fetchData);

// 刷新
const handleRefresh = () => {
  fetchData();
};

// 打开创建对话框
const openCreate = () => {
  isEdit.value = false;
  claimForm.value = { amount: '', purchaseDate: '', seller: '', description: '' };
  formDialog.value = true;
};

// 打开编辑对话框
const openEdit = () => {
  if (!selectedClaim.value) return;
  isEdit.value = true;
  claimForm.value = {
    amount: selectedClaim.value.amount,
    purchaseDate: selectedClaim.value.purchaseDate?.slice(0, 10), // 取日期部分
    seller: selectedClaim.value.seller,
    description: selectedClaim.value.description
  };
  formDialog.value = true;
};

// 提交表单
const submitForm = async () => {
  try {
    const payload = { ...claimForm.value };
    if (isEdit.value) {
      await updateClaim(selectedClaim.value.id, payload);
    } else {
      await createClaim(payload);
    }
    formDialog.value = false;
    dialog.value = false;
    fetchData();
  } catch (err) {
    console.error('保存报账失败', err);
  }
};

// 删除报账
const handleDelete = () => {
  if (!selectedClaim.value) return;
  openConfirm('确认删除该报账记录吗？', async () => {
    try {
      await deleteClaim(selectedClaim.value.id);
      dialog.value = false;
      fetchData();
    } catch (err) {
      console.error('删除失败', err);
    }
  });
};

// 审批通过
const approveRow = async (id) => {
  openConfirm('确认审批通过该报账单吗？', async () => {
    try {
      await approveClaim(id);
      fetchData();
    } catch (err) {
      console.error('审批失败', err);
    }
  });
};

// 驳回
const rejectRow = async (id) => {
  pendingRejectId.value = id;
  rejectReason.value = '';
  rejectDialog.value = true;
};

// ---- 确认 / 驳回弹窗状态 ----
const confirmDialog = ref(false);
const confirmText = ref('');
let confirmCallback = null;

const openConfirm = (text, cb) => {
  confirmText.value = text;
  confirmCallback = cb;
  confirmDialog.value = true;
};

const handleConfirmOk = async () => {
  confirmDialog.value = false;
  if (confirmCallback) await confirmCallback();
};

// 驳回对话框
const rejectDialog = ref(false);
const rejectReason = ref('');
const pendingRejectId = ref(null);

const handleRejectConfirm = async () => {
  if (!rejectReason.value.trim()) return;
  try {
    await rejectClaim(pendingRejectId.value, { reason: rejectReason.value });
    fetchData();
    rejectDialog.value = false;
  } catch (err) {
    console.error('驳回失败', err);
  }
};
</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center">
        <h2 class="text-h5 font-weight-bold">报账数据展示</h2>
        <v-spacer></v-spacer>
        <v-btn icon color="light-blue-lighten-3" title="添加数据" @click="openCreate" :loading="loading" class="ml-2 mr-2">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
        <v-btn icon color="indigo-lighten-3" title="刷新数据" @click="handleRefresh" :loading="loading" class="ml-2 mr-4">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn icon color="blue-grey" :title="showFilters ? '收起筛选' : '筛选选项'" @click="showFilters = !showFilters">
          <v-icon>mdi-filter-variant</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <!-- Filters -->
        <v-expand-transition>
          <div v-if="showFilters">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="statusFilter"
                  :items="['pending', 'approved', 'rejected']"
                  label="状态筛选"
                  density="compact"
                  hide-details
                  variant="outlined"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="4" md="2">
                <v-btn
                    color="secondary"
                    variant="tonal"
                    append-icon="mdi-text-search"
                    block
                    @click="statusFilter = ''"
                >
                  重置筛选
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>

      <!-- Data Table -->
      <v-data-table
          hover
        :headers="headers"
        :items="claims"
        :loading="loading"
        :items-per-page="pageSize"
        :page="page"
        :server-items-length="total"
        class="elevation-1"
        hide-default-footer
        density="comfortable"
        @click:row="(event, { item }) => showClaimDetails(item.id)"
      >
        <!-- 状态显示为彩色 Chip -->
        <template #item.status="{ item }">
          <v-chip
            :color="item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'primary'"
            class="rounded-xl"
            size="small"
            draggable
          >
            {{ item.status }}
          </v-chip>
        </template>
        <!-- 购买日期格式化 -->
        <template #item.purchaseDate="{ item }">
          {{ new Date(item.purchaseDate).toLocaleDateString() }}
        </template>
        <!-- 创建时间格式化 -->
        <template #item.createdAt="{ item }">
          {{ new Date(item.createdAt).toLocaleString() }}
        </template>
        <!-- 操作列 -->
        <template #item.actions="{ item }">
          <v-btn class="mr-2" v-if="canProcessRow(item)" icon color="light-green-lighten-3" size="x-small" @click.stop="approveRow(item.id)">
            <v-icon size="18">mdi-check</v-icon>
          </v-btn>
          <v-btn v-if="canProcessRow(item)" icon color="deep-orange-lighten-3" size="x-small" @click.stop="rejectRow(item.id)">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <!-- 分页控件 -->
      <div class="pagination-wrapper pt-2 px-4">
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-subtitle-2 text-grey-darken-1">
            总共 <span class="font-weight-bold">{{ total }}</span> 条记录
          </div>

          <v-pagination
            v-model="page"
            :length="totalPages"
            total-visible="7"
            rounded
            class="my-2"
          ></v-pagination>

          <div class="d-flex align-center">
            <span class="text-body-2 mr-2">每页显示</span>
            <v-select
              v-model="pageSize"
              :items="pageSizeOptions"
              variant="outlined"
              density="compact"
              class="d-inline-block"
              style="width: 80px"
              hide-details
            ></v-select>
            <span class="text-body-2 ml-2">条</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- 详情对话框 -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="primary white--text py-2 d-flex justify-center">
          <span class="text-h4 font-weight-bold mt-2">报账详情</span>
        </v-card-title>
        <v-card-text class="pt-2">
          <v-container v-if="selectedClaim" class="py-0">
            <v-row dense>
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">基本信息</v-subheader>
                <v-divider class="my-1"></v-divider>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item 
                    title="ID"
                    :subtitle="String(selectedClaim.id)"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    title="金额"
                    :subtitle="selectedClaim.amount"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    title="购买日期"
                    :subtitle="new Date(selectedClaim.purchaseDate).toLocaleDateString()"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    title="商家"
                    :subtitle="selectedClaim.seller"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    title="描述"
                    :subtitle="selectedClaim.description"
                    class="py-1"
                  ></v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">状态信息</v-subheader>
                <v-divider class="my-1"></v-divider>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item 
                    title="状态"
                    class="py-1"
                  >
                    <template v-slot:subtitle>
                      <v-btn 
                        :color="selectedClaim.status === 'approved' ? 'green' : selectedClaim.status === 'rejected' ? 'red' : 'primary'"
                        variant="tonal"
                        size="small"
                        class="mt-1 mb-2 rounded-xl"
                      >
                        {{ selectedClaim.status }}
                      </v-btn>
                    </template>
                  </v-list-item>
                  <v-list-item 
                    v-if="selectedClaim.status === 'rejected' && selectedClaim.rejectReason"
                    color="error"
                    title="拒绝原因"
                    :subtitle="selectedClaim.rejectReason"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    v-if="selectedClaim.approvedAt"
                    title="批准时间"
                    :subtitle="new Date(selectedClaim.approvedAt).toLocaleString()"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    v-if="selectedClaim.rejectedAt"
                    title="拒绝时间"
                    :subtitle="new Date(selectedClaim.rejectedAt).toLocaleString()"
                    class="py-1"
                  ></v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="12" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">时间信息</v-subheader>
                <v-divider class="my-1"></v-divider>
              </v-col>
              <v-col cols="12" class="py-0">
                <v-list density="compact" class="py-0">
                  <v-list-item 
                    title="创建时间"
                    :subtitle="new Date(selectedClaim.createdAt).toLocaleString()"
                    class="py-1"
                  ></v-list-item>
                  <v-list-item 
                    title="更新时间"
                    :subtitle="new Date(selectedClaim.updatedAt).toLocaleString()"
                    class="py-1"
                  ></v-list-item>
                </v-list>
              </v-col>
              
              <v-col cols="12" v-if="isAdmin && selectedClaim.UserId" class="py-1">
                <v-subheader class="font-weight-bold pl-0 py-1">管理员信息</v-subheader>
                <v-divider class="my-1"></v-divider>
                <v-list density="compact" class="py-0">
                  <v-list-item 
                    title="申请人ID"
                    :subtitle="String(selectedClaim.UserId)"
                    class="py-1"
                  ></v-list-item>
                </v-list>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="px-4 pb-2">
          <v-spacer></v-spacer>
          <v-btn class="mb-2 ml-2" v-if="canEdit" color="teal-darken-3" variant="elevated" @click="openEdit" small>编辑</v-btn>
          <v-btn class="mb-2 ml-2" v-if="canDelete" color="error" variant="elevated" @click="handleDelete" small>删除</v-btn>
          <v-btn class="mb-2 ml-2" color="primary" variant="elevated" @click="dialog = false" small>关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增/编辑对话框 -->
    <v-dialog v-model="formDialog" max-width="500px">
      <v-card>
        <v-card-title class="py-2 text-h6 font-weight-bold">{{ isEdit ? '修改报账' : '新增报账' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model.number="claimForm.amount" label="金额" type="number" variant="outlined" density="compact" class="mb-3" />
          <v-text-field v-model="claimForm.purchaseDate" label="购买日期" type="date" variant="outlined" density="compact" class="mb-3" />
          <v-text-field v-model="claimForm.seller" label="商家" variant="outlined" density="compact" class="mb-3" />
          <v-textarea v-model="claimForm.description" label="描述" variant="outlined" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="formDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitForm">{{ isEdit ? '保存' : '提交' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 通用确认对话框 -->
    <v-dialog v-model="confirmDialog" max-width="300px">
      <v-card>
        <v-card-title class="text-h6 justify-center">{{ confirmText }}</v-card-title>
        <v-card-actions >
          <v-spacer />
          <v-btn color="pink-darken-4" text @click="confirmDialog = false">取消</v-btn>
          <v-btn color="green-darken-2" text @click="handleConfirmOk">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 驳回理由对话框 -->
    <v-dialog v-model="rejectDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">请输入驳回原因</v-card-title>
        <v-card-text>
          <v-textarea v-model="rejectReason" rows="3" auto-grow variant="outlined"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="pink-darken-4" text @click="rejectDialog = false">取消</v-btn>
          <v-btn color="orange-lighten-1" text :disabled="!rejectReason.trim()" @click="handleRejectConfirm">驳回</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.w-25 {
  max-width: 220px;
}
</style>