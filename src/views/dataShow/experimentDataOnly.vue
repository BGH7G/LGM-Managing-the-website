<template>
  <v-container fluid class="h-100 d-flex flex-column">
    <!-- 顶部信息栏 -->
    <v-card class="mb-4 flex-shrink-0" elevation="1">
      <v-card-text>
        <div class="d-flex justify-space-between align-start">
          <div>
            <div class="d-flex align-center mb-2">
              <v-btn icon="mdi-arrow-left" variant="text" size="small" class="mr-2" @click="router.back()"></v-btn>
              <h2 class="text-h5 font-weight-bold">{{ experiment.name }} - 数据视图</h2>
              <v-chip size="small" class="ml-3" color="primary" variant="outlined">ID: {{ experiment.id }}</v-chip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-2">{{ experiment.description || '暂无描述' }}</p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-row class="flex-grow-1 overflow-hidden">
      <!-- 数据管理 (全宽) -->
      <v-col cols="12" class="h-100 d-flex flex-column">
        <v-card class="h-100 d-flex flex-column" elevation="2">
          <!-- 数据操作栏 -->
          <v-toolbar density="compact" color="white" class="border-b">
            <v-toolbar-title class="text-subtitle-1 font-weight-bold ml-2">数据列表</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn prepend-icon="mdi-plus" color="primary" variant="flat" class="mr-2" @click="openAddDataDialog">新增数据</v-btn>
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
              @update:sort-by="fetchData"
              :items-per-page="dataLimit"
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
const dataLimit = ref(50);
const dataTotal = ref(0);
const dataTotalPages = ref(0);
const sortBy = ref([]);

const snackbar = reactive({ visible: false, text: '', color: 'success' });

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
  dataDialog.id = item.id; 
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
    const file = Array.isArray(importDialog.file) ? importDialog.file[0] : importDialog.file;
    await importCSVData(experimentId, file);
    showSnackbar('批量导入成功');
    importDialog.visible = false;
    fetchData();
  } catch (error) {
    showSnackbar('导入失败: ' + (error.response?.data?.msg || error.message), 'error');
  } finally {
    importDialog.loading = false;
  }
};

const openExportDialog = () => {
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

onMounted(() => {
  fetchExperimentInfo();
  fetchData();
});
</script>

<style scoped>
</style>
