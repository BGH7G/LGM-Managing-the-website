<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <!-- 顶部信息栏 -->
    <v-card class="mb-4 flex-shrink-0" elevation="1">
      <v-card-text>
        <div class="d-flex justify-space-between align-start">
          <div>
            <div class="d-flex align-center mb-2">
              <v-btn icon="mdi-arrow-left" variant="text" size="small" class="mr-2" @click="router.back()"></v-btn>
              <h2 class="text-h5 font-weight-bold">{{ experiment.name }}</h2>
              <v-chip size="small" class="ml-3" color="primary" variant="outlined">ID: {{ experiment.id }}</v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-2">{{ experiment.description || '暂无描述' }}</p>
            <div class="d-flex text-caption text-grey">
              <span class="mr-4"><v-icon size="small" class="mr-1">mdi-account</v-icon> {{ experiment.creator }}</span>
              <span class="mr-4"><v-icon size="small" class="mr-1">mdi-clock-outline</v-icon> 创建: {{ formatDate(experiment.createdAt) }}</span>
              <span><v-icon size="small" class="mr-1">mdi-update</v-icon> 更新: {{ formatDate(experiment.updatedAt) }}</span>
            </div>
          </div>
          <div>
            <v-btn variant="outlined" color="primary" class="mr-2" prepend-icon="mdi-pencil" @click="openEditInfoDialog">编辑信息</v-btn>
            <v-btn variant="outlined" color="error" prepend-icon="mdi-delete" @click="confirmDeleteExperiment">删除实验</v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-row class="flex-grow-1 overflow-hidden">
      <!-- 左侧：字段定义 -->
      <v-col cols="12" md="3" class="h-100 d-flex flex-column">
        <v-card class="h-100 d-flex flex-column" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center py-3 px-4 bg-grey-lighten-4">
            <span class="text-subtitle-1 font-weight-bold">字段定义</span>
            <v-btn size="small" color="primary" variant="text" prepend-icon="mdi-plus" @click="openAddColumnDialog">添加</v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <div class="flex-grow-1 overflow-y-auto pa-0">
            <v-list lines="two" density="compact">
              <v-list-item
                v-for="col in columns"
                :key="col.id"
                :title="col.displayName"
                :subtitle="`${col.fieldName} (${col.dataType})`"
              >
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" size="x-small" variant="text" color="grey" @click="openEditColumnDialog(col)"></v-btn>
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="grey" @click="confirmDeleteColumn(col)"></v-btn>
                </template>
              </v-list-item>
              <v-list-item v-if="columns.length === 0">
                <v-list-item-title class="text-grey text-center text-caption">暂无字段定义</v-list-item-title>
              </v-list-item>
            </v-list>
          </div>
        </v-card>
      </v-col>

      <!-- 右侧：数据管理 -->
      <v-col cols="12" md="9" class="h-100 d-flex flex-column">
        <v-card class="h-100 d-flex flex-column" elevation="2">
          <!-- 数据操作栏 -->
          <v-toolbar density="compact" color="white" class="border-b">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold ml-2">数据管理</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-plus" color="primary" variant="flat" class="mr-2" @click="openAddDataDialog">新增数据</v-btn>
            <v-btn prepend-icon="mdi-table-eye" color="info" variant="tonal" class="mr-2" @click="goToDataView">数据视图</v-btn>
            <v-btn prepend-icon="mdi-upload" variant="text" class="mr-2" @click="openImportDialog">导入</v-btn>
            <v-btn prepend-icon="mdi-download" variant="text" class="mr-2" @click="openExportDialog">导出</v-btn>
            <v-btn icon="mdi-refresh" variant="text" @click="fetchData"></v-btn>
          </v-toolbar>

          <!-- 数据表格 -->
          <div class="flex-grow-1 overflow-auto">
            <v-data-table
              :headers="tableHeaders"
              :items="dataList"
              :loading="dataLoading"
              v-model:sort-by="sortBy"
              :items-per-page="dataLimit"
              @update:sort-by="fetchData"
              class="h-100"
              fixed-header
              hover
              density="compact"
            >
              <!-- 动态渲染单元格 -->
              <template v-for="col in columns" :key="col.fieldName" v-slot:[`item.${col.fieldName}`]="{ item }">
                {{ formatCellValue(item.data[col.fieldName], col.dataType) }}
              </template>

              <template v-slot:item.actions="{ item }">
                <div class="d-flex">
                  <v-btn icon="mdi-pencil" size="x-small" variant="text" color="primary" @click="openEditDataDialog(item)"></v-btn>
                  <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="confirmDeleteData(item)"></v-btn>
                </div>
              </template>
              
              <template v-slot:bottom>
                 <!-- 自定义分页 -->
                 <div class="d-flex align-center justify-end pa-2 border-t">
                    <span class="text-caption mr-4">共 {{ dataTotal }} 条</span>
                    <v-pagination
                      v-model="dataPage"
                      :length="dataTotalPages"
                      total-visible="5"
                      density="compact"
                      rounded="circle"
                      @update:model-value="fetchData"
                    ></v-pagination>
                 </div>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 字段定义对话框 -->
    <v-dialog v-model="columnDialog.visible" max-width="500px">
      <v-card>
        <v-card-title>{{ columnDialog.isEdit ? '编辑字段' : '添加字段' }}</v-card-title>
        <v-card-text>
          <v-form ref="columnForm" v-model="columnValid">
            <v-text-field
              v-model="columnFormData.fieldName"
              label="字段名 (Key)"
              :rules="[v => !!v || '必填', v => /^[a-zA-Z0-9_]+$/.test(v) || '仅限字母数字下划线']"
              :disabled="columnDialog.isEdit"
              hint="用于程序识别，不可重复，创建后不可改"
              persistent-hint
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model="columnFormData.displayName"
              label="显示名"
              :rules="[v => !!v || '必填']"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-text-field>
            <v-select
              v-model="columnFormData.dataType"
              label="数据类型"
              :items="['string', 'number', 'date', 'boolean', 'text']"
              :disabled="columnDialog.isEdit"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-select>
            <v-checkbox
              v-model="columnFormData.isRequired"
              label="是否必填"
              density="compact"
              hide-details
            ></v-checkbox>
            <v-textarea
              v-model="columnFormData.constraints"
              label="约束条件 (JSON)"
              hint='例如: {"min": 0, "max": 100}'
              persistent-hint
              rows="2"
              variant="outlined"
              density="compact"
              class="mt-2"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="columnDialog.visible = false">取消</v-btn>
          <v-btn color="primary" variant="text" @click="saveColumn">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 数据记录对话框 -->
    <v-dialog v-model="dataDialog.visible" max-width="600px">
      <v-card>
        <v-card-title>{{ dataDialog.isEdit ? '编辑数据' : '新增数据' }}</v-card-title>
        <v-card-text>
          <v-form ref="dataForm" v-model="dataValid">
            <v-row>
              <v-col cols="12" v-for="col in columns" :key="col.fieldName">
                <!-- Number -->
                <v-text-field
                  v-if="col.dataType === 'number'"
                  v-model.number="dataFormData[col.fieldName]"
                  :label="col.displayName"
                  type="number"
                  :rules="getRules(col)"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
                
                <!-- Boolean -->
                <v-switch
                  v-else-if="col.dataType === 'boolean'"
                  v-model="dataFormData[col.fieldName]"
                  :label="col.displayName"
                  color="primary"
                  density="compact"
                ></v-switch>
                
                <!-- Date -->
                <v-text-field
                  v-else-if="col.dataType === 'date'"
                  v-model="dataFormData[col.fieldName]"
                  :label="col.displayName"
                  type="date"
                  :rules="getRules(col)"
                  variant="outlined"
                  density="compact"
                  shrink
                ></v-text-field>
                
                <!-- Text (Textarea) -->
                <v-textarea
                  v-else-if="col.dataType === 'text'"
                  v-model="dataFormData[col.fieldName]"
                  :label="col.displayName"
                  :rules="getRules(col)"
                  variant="outlined"
                  density="compact"
                  rows="3"
                ></v-textarea>
                
                <!-- String (Default) -->
                <v-text-field
                  v-else
                  v-model="dataFormData[col.fieldName]"
                  :label="col.displayName"
                  :rules="getRules(col)"
                  variant="outlined"
                  density="compact"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dataDialog.visible = false">取消</v-btn>
          <v-btn color="primary" variant="text" @click="saveData">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 导入对话框 -->
    <v-dialog v-model="importDialog.visible" max-width="600px">
      <v-card>
        <v-card-title>批量导入数据</v-card-title>
        <v-card-text>
          <v-file-input
            v-model="importDialog.file"
            label="选择CSV或Excel文件"
            accept=".csv, .xlsx"
            prepend-icon="mdi-file-excel"
            variant="outlined"
            show-size
            :rules="[v => !!v || '请选择文件']"
          ></v-file-input>
          <p class="text-caption text-grey">支持 .csv 和 .xlsx 格式，第一行必须是列标题。</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="importDialog.visible = false">取消</v-btn>
          <v-btn color="primary" variant="text" @click="executeImport" :loading="importDialog.loading">导入</v-btn>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  getExperimentById, 
  deleteExperiment, 
  addColumnDefinition, 
  updateColumnDefinition, 
  deleteColumnDefinition,
  getExperimentData,
  addDataRecord,
  updateDataRecord,
  deleteDataRecord,
  batchImportData,
  exportData,
  importCSVData
} from '@/api/datasheet.api';

const route = useRoute();
const router = useRouter();
const experimentId = route.params.id;

// 状态
const experiment = ref({});
const columns = ref([]);
const dataList = ref([]);
const dataLoading = ref(false);
const dataPage = ref(1);
const dataLimit = ref(30);
const dataTotal = ref(0);

const dataTotalPages = ref(0);
const sortBy = ref([]);

const snackbar = reactive({ visible: false, text: '', color: 'success' });

const columnDialog = reactive({ visible: false, isEdit: false, id: null });
const columnFormData = reactive({ fieldName: '', displayName: '', dataType: 'string', isRequired: false, constraints: '' });
const columnForm = ref(null);
const columnValid = ref(false);

const dataDialog = reactive({ visible: false, isEdit: false, id: null });
const dataFormData = reactive({});
const dataForm = ref(null);
const dataValid = ref(false);

const importDialog = reactive({ visible: false, file: null, loading: false });

// 计算属性
const tableHeaders = computed(() => {
  const headers = columns.value.map(col => ({
    title: col.displayName,
    key: col.fieldName,
    sortable: true
  }));
  headers.push({ title: '操作', key: 'actions', sortable: false, width: '100px', align: 'end' });
  return headers;
});

// 方法
const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.visible = true;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
};

const formatCellValue = (value, type) => {
  if (value === null || value === undefined) return '-';
  if (type === 'boolean') return value ? '是' : '否';
  if (type === 'date') return new Date(value).toLocaleDateString();
  return value;
};

const getRules = (col) => {
  const rules = [];
  if (col.isRequired) {
    rules.push(v => (v !== null && v !== undefined && v !== '') || `${col.displayName}是必填项`);
  }
  return rules;
};

// API 调用
const fetchExperimentInfo = async () => {
  try {
    const res = await getExperimentById(experimentId);
    if (res.data && res.data.data) {
      experiment.value = res.data.data;
      columns.value = res.data.data.ColumnDefinitions || [];
      // 初始化数据表单对象
      columns.value.forEach(col => {
        if (!(col.fieldName in dataFormData)) {
          dataFormData[col.fieldName] = null;
        }
      });
    }
  } catch (error) {
    showSnackbar('获取实验详情失败', 'error');
  }
};

const fetchData = async () => {
  dataLoading.value = true;
  try {
    const params = { page: dataPage.value, limit: dataLimit.value };
    if (sortBy.value.length) {
      params.sortBy = sortBy.value[0].key;
      params.sortOrder = sortBy.value[0].order === 'asc' ? 'ASC' : 'DESC';
    }
    const res = await getExperimentData(experimentId, params);
    console.log(res.data.data);
    
    if (res.data && res.data.data) {
      dataList.value = res.data.data || [];
      dataTotal.value = res.data.data.length || 0;
      dataTotalPages.value = res.data.totalPages || 1;
    }
  } catch (error) {
    showSnackbar('获取数据失败', 'error');
  } finally {
    dataLoading.value = false;
  }
};

// 字段管理
const openAddColumnDialog = () => {
  columnDialog.isEdit = false;
  columnDialog.id = null;
  Object.assign(columnFormData, { fieldName: '', displayName: '', dataType: 'string', isRequired: false, constraints: '' });
  columnDialog.visible = true;
};

const openEditColumnDialog = (col) => {
  columnDialog.isEdit = true;
  columnDialog.id = col.id;
  Object.assign(columnFormData, { 
    fieldName: col.fieldName, 
    displayName: col.displayName, 
    dataType: col.dataType, 
    isRequired: col.isRequired, 
    constraints: col.constraints ? JSON.stringify(col.constraints) : '' 
  });
  columnDialog.visible = true;
};

const saveColumn = async () => {
  const { valid } = await columnForm.value.validate();
  if (!valid) return;

  try {
    const payload = { ...columnFormData };
    if (payload.constraints) {
      try {
        payload.constraints = JSON.parse(payload.constraints);
      } catch (e) {
        showSnackbar('约束条件JSON格式错误', 'error');
        return;
      }
    } else {
        delete payload.constraints;
    }

    if (columnDialog.isEdit) {
      await updateColumnDefinition(experimentId, columnDialog.id, payload);
      showSnackbar('字段更新成功');
    } else {
      // API 要求 columns 数组
      await addColumnDefinition(experimentId, { columns: [payload] });
      showSnackbar('字段添加成功');
    }
    columnDialog.visible = false;
    fetchExperimentInfo(); // 刷新字段列表
    fetchData(); // 刷新数据表（列可能变了）
  } catch (error) {
    showSnackbar('保存字段失败', 'error');
  }
};

const confirmDeleteColumn = async (col) => {
  if (!confirm(`确定删除字段 "${col.displayName}" 吗？这将删除所有相关数据！`)) return;
  try {
    await deleteColumnDefinition(experimentId, col.id);
    showSnackbar('字段删除成功');
    fetchExperimentInfo();
    fetchData();
  } catch (error) {
    showSnackbar('删除字段失败', 'error');
  }
};

// 数据管理
const openAddDataDialog = () => {
  dataDialog.isEdit = false;
  dataDialog.id = null;
  // 重置表单
  columns.value.forEach(col => {
    dataFormData[col.fieldName] = col.dataType === 'boolean' ? false : null;
  });
  dataDialog.visible = true;
};

const openEditDataDialog = (item) => {
  dataDialog.isEdit = true;
  dataDialog.id = item.id; // 注意：这里假设item.id是数据记录的ID，而不是行号
  // 填充表单
  Object.assign(dataFormData, item.data);
  dataDialog.visible = true;
};

const saveData = async () => {
  const { valid } = await dataForm.value.validate();
  if (!valid) return;

  try {
    if (dataDialog.isEdit) {
      await updateDataRecord(experimentId, dataDialog.id, dataFormData);
      showSnackbar('数据更新成功');
    } else {
      await addDataRecord(experimentId, dataFormData);
      showSnackbar('数据添加成功');
    }
    dataDialog.visible = false;
    fetchData();
  } catch (error) {
    showSnackbar('保存数据失败', 'error');
  }
};

const confirmDeleteData = async (item) => {
  if (!confirm('确定删除这条数据吗？')) return;
  try {
    await deleteDataRecord(experimentId, item.id);
    showSnackbar('数据删除成功');
    fetchData();
  } catch (error) {
    showSnackbar('删除数据失败', 'error');
  }
};

// 导入导出
const openImportDialog = () => {
  importDialog.file = null;
  importDialog.visible = true;
};

const executeImport = async () => {
  if (!importDialog.file) {
      showSnackbar('请选择文件', 'warning');
      return;
  }
  
  importDialog.loading = true;
  try {
    // importDialog.file 是一个数组（v-file-input 默认行为）或单个文件对象
    // Vuetify 3 v-file-input model value depends on 'multiple' prop. Default is array? 
    // Let's assume it might be array or object.
    const file = Array.isArray(importDialog.file) ? importDialog.file[0] : importDialog.file;
    
    await importCSVData(experimentId, file);
    showSnackbar('导入成功');
    importDialog.visible = false;
    fetchData();
  } catch (error) {
    showSnackbar('导入失败: ' + (error.response?.data?.msg || error.message), 'error');
  } finally {
    importDialog.loading = false;
  }
};

const openExportDialog = () => {
  // 简单实现直接导出
  exportData(experimentId).then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `experiment_${experimentId}_data.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  }).catch(() => {
      showSnackbar('导出失败', 'error');
  });
};

const goToDataView = () => {
  router.push({ name: 'experimentDataOnly', params: { id: experimentId } });
};

// 实验操作
const openEditInfoDialog = () => {
    showSnackbar('编辑实验信息功能暂未实现', 'warning');
};

const confirmDeleteExperiment = async () => {
    if (!confirm('确定删除整个实验吗？此操作不可恢复！')) return;
    try {
        await deleteExperiment(experimentId);
        showSnackbar('实验删除成功');
        router.push({ name: 'dataSheet' });
    } catch (error) {
        showSnackbar('删除实验失败', 'error');
    }
};

onMounted(() => {
  fetchExperimentInfo();
  fetchData();
});
</script>

<style scoped>
/* 样式微调 */
</style>
