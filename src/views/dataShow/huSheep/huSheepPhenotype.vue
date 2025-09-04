<template>
  <v-container fluid>
    <v-card>
      <!-- 标题与工具栏 -->
      <v-card-title class="d-flex align-center">
        <h2 class="text-h5 font-weight-bold">羊只表型数据展示</h2>
        <v-spacer/>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn icon color="light-blue-lighten-3" title="添加数据" class="ml-2 mr-2" v-bind="props">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="openCreate">
              <template #prepend><v-icon>mdi-pencil-plus</v-icon></template>
              <v-list-item-title>手动添加</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="isAdmin" @click="openImportDialog">
              <template #prepend><v-icon>mdi-file-upload-outline</v-icon></template>
              <v-list-item-title>导入XLSX/CSV</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn icon color="indigo-lighten-3" title="刷新数据" @click="handleRefresh" :loading="loading" class="ml-2 mr-4">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
        <v-btn icon color="blue-grey" :title="showFilters ? '收起筛选' : '筛选选项'" @click="showFilters = !showFilters">
          <v-icon>mdi-filter-variant</v-icon>
        </v-btn>
        <v-btn
            icon
            color="teal-darken-2"
            title="查看年龄里程碑"
            @click="openAgeMilestones"
            :loading="ageLoading"
            class="ml-2"
        >
          <v-icon>mdi-human-male-height</v-icon>
        </v-btn>
      </v-card-title>

      <!-- 筛选面板 -->
      <v-card-text>
        <v-expand-transition>
          <div v-if="showFilters">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="groupFilter" :items="groupOptions" label="组别筛选" density="compact" hide-details variant="outlined" clearable/>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-select v-model="ageFilter" :items="ageOptions" label="年龄里程碑筛选" density="compact" hide-details variant="outlined" clearable/>
              </v-col>
              <v-col cols="12" sm="4" md="2">
                <v-btn color="secondary" variant="tonal" block @click="resetFilters">
                  重置筛选
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>

      <!-- 表格包裹 -->
      <div class="table-wrapper">
        <v-data-table
            hover
            :headers="headers"
            :items="tableData"
            :loading="loading"
            :items-per-page="pageSize"
            :page="page"
            class="elevation-1 wide-table"
            hide-default-footer
            density="comfortable"
            @update:page="val => (page = val)"
        >
          <template #item.sheep_number="{ item }">
            <router-link :to="{ name: 'huSheep_detail', params: { id: item.id } }" class="sheep-number-link">
              {{ item.sheep_number }}
            </router-link>
          </template>
          <template #item.ageMilestone="{ item }">
            <div v-if="item.ageMilestone">
              {{ item.ageMilestone.milestone_name }} ({{ item.ageMilestone.age_days }} 天)
            </div>
            <div v-else>未设置</div>
          </template>
          <template #no-data>
            <div class="text-center py-4">暂无数据</div>
          </template>
        </v-data-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper pt-2 px-4">
        <div class="d-flex justify-space-between align-center">
          <div class="text-subtitle-2 text-grey-darken-1">
            总共 <span class="font-weight-bold">{{ total }}</span> 条记录
          </div>
          <v-pagination v-model="page" :length="totalPages" total-visible="7" rounded class="my-2"/>
          <div class="d-flex align-center">
            <span class="text-body-2 mr-2">每页显示</span>
            <v-select v-model="pageSize" :items="pageSizeOptions" variant="outlined" density="compact" class="d-inline-block" style="width:80px" hide-details/>
            <span class="text-body-2 ml-2">条</span>
          </div>
        </div>
      </div>
    </v-card>

    <!-- 年龄里程碑对话框 -->
    <v-dialog v-model="ageDialog" max-width="520">
      <v-card>
        <v-card-title class="primary white--text py-2 d-flex justify-center">
          <span class="text-h4 font-weight-bold">年龄里程碑</span>
        </v-card-title>
        <v-card-text>
          <!-- 添加表单 -->
          <v-expand-transition>
            <v-card v-if="showAddForm" class="add-form-card mb-4 pa-4">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field v-model="newMilestoneName" label="里程碑名称" variant="outlined" density="compact" clearable class="mb-3"/>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field v-model.number="newAgeDays" label="天数" type="number" variant="outlined" density="compact" clearable class="mb-3"/>
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="newDescription" label="描述" variant="outlined" density="compact" clearable/>
                </v-col>
              </v-row>
              <div class="d-flex justify-end">
                <v-btn text class="mr-2" @click="showAddForm = false">取消</v-btn>
                <v-btn color="primary" variant="elevated" :loading="adding" @click="submitNewMilestone">
                  保存
                </v-btn>
              </div>
            </v-card>
          </v-expand-transition>

          <!-- 列表 -->
          <v-container v-if="ageMilestones.length" class="py-0">
            <v-row dense>
              <v-col v-for="(item, idx) in paginatedAgeMilestones" :key="idx" cols="12">
                <v-card :color="idx % 2 === 0 ? '#1F7087' : '#952175'" dark class="mb-2 milestone-card">
                  <v-card-title class="text-h5">{{ item.milestone_name }}</v-card-title>
                  <v-card-subtitle>{{ item.age_days }} 天</v-card-subtitle>
                </v-card>
              </v-col>
            </v-row>
            <v-pagination v-if="pageCount>1" v-model="currentPage" :length="pageCount" circle class="mt-2"/>
          </v-container>
          <div v-else class="text-center py-4">暂无数据</div>
        </v-card-text>
        <v-card-actions class="px-4 pb-3">
          <v-spacer/>
          <v-btn color="success" variant="tonal" @click="openAdd">添加数据</v-btn>
          <v-btn color="primary" variant="elevated" @click="ageDialog=false" :disabled="adding">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 导入 XLSX/CSV 对话框（管理员） -->
    <v-dialog v-model="importDialog" max-width="680">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">导入表型数据（XLSX/CSV）</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-file-input
                v-model="importFiles"
                label="选择文件（.xlsx 或 .csv）"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                density="compact"
                :disabled="uploading"
                show-size
                @update:modelValue="onFileChange"
                hide-details
              />
              <div class="text-caption text-grey mt-1">CSV 需使用 UTF-8 编码；文件大小不超过 20MB。</div>
            </v-col>
            <v-col cols="12" class="d-flex align-center">
              <v-switch
                v-model="dryRun"
                color="primary"
                :disabled="uploading"
                inset
                hide-details
                class="mr-2"
                :label="`空运行（不写入数据库）`"
              />
            </v-col>
            <v-col cols="12" v-if="uploading">
              <v-progress-linear :model-value="uploadProgress" color="primary" height="8" striped>
                <strong class="text-caption">{{ uploadProgress }}%</strong>
              </v-progress-linear>
            </v-col>

            <!-- 结果汇总 -->
            <v-col cols="12" v-if="importResult">
              <v-alert type="success" variant="tonal" v-if="importResult.success" class="mb-3">
                <div class="text-subtitle-2">导入结果（{{ importResult.dryRun ? '空运行' : '已写入' }}）</div>
                <div class="mt-2">
                  <v-chip size="small" color="success" class="mr-2">新增 {{ importResult.summary?.created ?? 0 }}</v-chip>
                  <v-chip size="small" color="info" class="mr-2">更新 {{ importResult.summary?.updated ?? 0 }}</v-chip>
                  <v-chip size="small" color="grey" class="mr-2">跳过 {{ importResult.summary?.skipped ?? 0 }}</v-chip>
                  <v-chip size="small" color="orange">错误 {{ importResult.summary?.errors?.length ?? 0 }}</v-chip>
                </div>
              </v-alert>
              <v-alert type="error" variant="tonal" v-else class="mb-3">
                导入失败
              </v-alert>

              <div v-if="importResult.summary?.errors?.length">
                <div class="text-subtitle-2 mb-1">错误明细</div>
                <v-list density="compact" class="bg-transparent">
                  <v-list-item v-for="(err, idx) in importResult.summary.errors" :key="idx">
                    <template #prepend><v-icon color="error">mdi-alert-circle-outline</v-icon></template>
                    <v-list-item-title>第 {{ err.row }} 行：{{ err.error }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeImportDialog" :disabled="uploading">取消</v-btn>
          <v-btn color="primary" :disabled="!selectedFile || uploading" :loading="uploading" @click="handleUpload">
            上传
          </v-btn>
          <v-btn
            v-if="importResult?.success && importResult?.dryRun"
            color="success"
            :disabled="uploading"
            @click="confirmImport"
          >
            确认导入
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { getAgeMilestones, postAgeMilestone } from '@/api/data.api';
import { useRouter } from 'vue-router';
import { getIndex, importHuSheepIndex } from '@/api/index.api';
import { useUserStore } from '@/stores/auth';

const router = useRouter();
const userStore = useUserStore();
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

const tableData = ref([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const pageSizeOptions = [20, 50, 70, 100];
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1);
const showFilters = ref(false);
const groupFilter = ref('');
const groupOptions = ref([]);
const ageFilter = ref('');
const ageOptions = ref([]);

// 导入相关
const importDialog = ref(false);
const importFiles = ref([]); // v-file-input 绑定，通常为 File[]
const selectedFile = ref(null); // 实际使用的单个文件
const dryRun = ref(false); // 默认 false（直接导入）
const uploading = ref(false);
const uploadProgress = ref(0);
const importResult = ref(null); // 保存后端返回的结果

// 表格列定义
const headers = [
  { title: '羊只编号', key: 'sheep_number', align: 'start', sortable: true },
  { title: '测量组别', key: 'group', align: 'start', sortable: true },
  { title: '备注', key: 'notes', align: 'start', sortable: false },
  { title: '瘤胃pH值', key: 'rumen_ph', align: 'end', sortable: true },
  { title: '乙酸盐(mmol/L)', key: 'acetate', align: 'end', sortable: true },
  { title: '丙酸盐(mmol/L)', key: 'propionate', align: 'end', sortable: true },
  { title: '异丁酸盐(mmol/L)', key: 'isobutyrate', align: 'end', sortable: true },
  { title: '丁酸盐(mmol/L)', key: 'butyrate', align: 'end', sortable: true },
  { title: '异戊酸盐(mmol/L)', key: 'isovalerate', align: 'end', sortable: true },
  { title: '戊酸盐(mmol/L)', key: 'valerate', align: 'end', sortable: true },
  { title: '总VFAs(mmol/L)', key: 'total_vfas', align: 'end', sortable: true },
  { title: '体重(kg)', key: 'bw', align: 'end', sortable: true },
  { title: '增重(kg/d)', key: 'weight_gain', align: 'end', sortable: true },
  { title: '瘤胃湿重(kg)', key: 'rumen_wet_weight', align: 'end', sortable: true },
  { title: '瘤胃干重(kg)', key: 'rumen_dry_weight', align: 'end', sortable: true },
  { title: '瘤胃体积(L)', key: 'rumen_volume', align: 'end', sortable: true },
  { title: '瘤胃相对重量(%)', key: 'rumen_relative_weight', align: 'end', sortable: true },
  { title: '瘤胃体积比例', key: 'rumen_volume_proportion', align: 'end', sortable: true },
  { title: '乳头长度(cm)', key: 'papilla_length', align: 'end', sortable: true },
  { title: '乳头宽度(cm)', key: 'papilla_width', align: 'end', sortable: true },
  { title: '乳头表面积(cm²)', key: 'papilla_surface_area', align: 'end', sortable: true },
  { title: '乳头数量', key: 'papilla_count', align: 'end', sortable: true },
  { title: '吸收表面积(cm²)', key: 'absorptive_surface_area', align: 'end', sortable: true },
  { title: '背囊厚度(mm)', key: 'dorsal_sac_thickness', align: 'end', sortable: true },
  { title: '腹囊厚度(mm)', key: 'ventral_sac_thickness', align: 'end', sortable: true },
  { title: '年龄里程碑', key: 'ageMilestone', align: 'start', sortable: false },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const { data } = await getIndex({ page: page.value, pageSize: pageSize.value });
    const list = data?.data || [];
    total.value = data?.pagination?.totalItems ?? list.length;
    processTableData(list);
  } catch (e) {
    console.error('获取数据出错', e);
  } finally { loading.value = false; }
};

const processTableData = (indexList) => {
  const processed = (indexList || []).map(it => ({
    id: it.sheep_id,
    sheep_number: it.sheep_number,
    notes: it.notes,
    group: it.group,
    rumen_ph: it.rumen_ph,
    acetate: it.acetate,
    propionate: it.propionate,
    isobutyrate: it.isobutyrate,
    butyrate: it.butyrate,
    isovalerate: it.isovalerate,
    valerate: it.valerate,
    total_vfas: it.total_vfas,
    bw: it.bw,
    weight_gain: it.weight_gain,
    rumen_wet_weight: it.rumen_wet_weight,
    rumen_dry_weight: it.rumen_dry_weight,
    rumen_volume: it.rumen_volume,
    rumen_relative_weight: it.rumen_relative_weight,
    rumen_volume_proportion: it.rumen_volume_proportion,
    papilla_length: it.papilla_length,
    papilla_width: it.papilla_width,
    papilla_surface_area: it.papilla_surface_area,
    papilla_count: it.papilla_count,
    absorptive_surface_area: it.absorptive_surface_area,
    dorsal_sac_thickness: it.dorsal_sac_thickness,
    ventral_sac_thickness: it.ventral_sac_thickness,
    ageMilestone: it.AgeMilestone
  }));

  const filtered = processed.filter(item =>
    (!groupFilter.value || item.group === groupFilter.value) &&
    (!ageFilter.value || item.ageMilestone?.milestone_name === ageFilter.value)
  );
  tableData.value = filtered;
  groupOptions.value = [...new Set(processed.map(i => i.group).filter(v => v !== undefined && v !== null))];
  ageOptions.value = [...new Set(processed.map(i => i.ageMilestone?.milestone_name).filter(Boolean))];
};

const resetFilters = () => { groupFilter.value = ''; ageFilter.value = ''; fetchData(); };
const handleRefresh = () => fetchData();
const openCreate = () => router.push({ name: 'huSheep_create' });
watch([page, pageSize, groupFilter, ageFilter], fetchData);

// 打开/关闭导入对话框
const openImportDialog = () => {
  importDialog.value = true;
  importFiles.value = [];
  selectedFile.value = null;
  dryRun.value = false; // 默认 false
  uploading.value = false;
  uploadProgress.value = 0;
  importResult.value = null;
};
const closeImportDialog = () => {
  importDialog.value = false;
};

// 选择文件与校验（大小 <= 20MB）
const onFileChange = (files) => {
  const list = Array.isArray(files) ? files : (files ? [files] : []);
  const f = list[0] || null;
  if (!f) { selectedFile.value = null; return; }
  if (f.size > 20 * 1024 * 1024) {
    alert('文件超过 20MB 限制');
    selectedFile.value = null;
    importFiles.value = [];
    return;
  }
  selectedFile.value = f;
};

// 执行上传
const handleUpload = async () => {
  if (!selectedFile.value) return alert('请先选择文件');
  uploading.value = true;
  uploadProgress.value = 0;
  importResult.value = null;
  try {
    const res = await importHuSheepIndex(selectedFile.value, {
      dryRun: dryRun.value,
      onUploadProgress: (e) => {
        if (e.total) uploadProgress.value = Math.round((e.loaded / e.total) * 100);
      }
    });
    importResult.value = res.data;
    if (!res.data?.dryRun && res.data?.success) {
      // 非空运行导入成功后刷新列表
      handleRefresh();
    }
  } catch (err) {
    const msg = err?.response?.data?.message || err?.response?.data?.msg || err.message || '上传失败';
    alert(msg);
  } finally {
    uploading.value = false;
  }
};

// 确认导入（在 dryRun = true 的情况下）
const confirmImport = async () => {
  if (!selectedFile.value) return;
  dryRun.value = false;
  await handleUpload();
};

// 年龄里程碑
const ageDialog = ref(false);
const ageMilestones = ref([]);
const ageLoading = ref(false);
const currentPage = ref(1);
const paginatedAgeMilestones = computed(() => ageMilestones.value.slice((currentPage.value - 1) * 6, currentPage.value * 6));
const pageCount = computed(() => Math.ceil(ageMilestones.value.length / 6));


// 打开里程碑对话框并加载数据
const openAgeMilestones = async () => {
  ageLoading.value = true;
  try {
    const { data } = await getAgeMilestones({ page: 1, pageSize: 100 });
    ageMilestones.value = data.list || data.data || [];
    currentPage.value = 1;
    ageDialog.value = true;
  } catch (e) {
    console.error('获取里程碑失败', e);
  } finally { ageLoading.value = false; }
};

// 新增里程碑
const showAddForm = ref(false);
const newMilestoneName = ref('');
const newAgeDays = ref(null);
const newDescription = ref('');
const adding = ref(false);
const openAdd = () => { newMilestoneName.value = ''; newAgeDays.value = null; newDescription.value = ''; showAddForm.value = true; };
const submitNewMilestone = async () => {
  if (!newMilestoneName.value || newAgeDays.value == null) return alert('请填写完整名称和天数');
  adding.value = true;
  try {
    await postAgeMilestone({ milestone_name: newMilestoneName.value, age_days: newAgeDays.value, description: newDescription.value });
    await openAgeMilestones();
    showAddForm.value = false;
  } catch (e) {
    console.error('提交失败', e);
    alert('提交失败，请重试');
  } finally { adding.value = false; }
};

onMounted(fetchData);
</script>

<style lang="scss" scoped>
.pagination-wrapper {
  border-top: 1px solid #eee;
}

.sheep-number-link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
    color: #0d47a1;
  }
}

.table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.wide-table {
  min-width: 1300px;
  :deep(th) {
    white-space: nowrap;
  }
  :deep(td) {
    white-space: nowrap;
  }
}

.milestone-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.milestone-card:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(0,0,0,0.25);
  z-index: 10;
  position: relative;
}
</style>
