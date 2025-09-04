  <script setup>
  import { ref, onMounted, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { getOneInfo } from '@/api/data.api';

  // 数据状态
  const sheepData = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const selectedIndexData = ref(null);
  const selectedMilestoneIndex = ref(0);

  // 获取路由参数
  const route = useRoute();

  // 获取羊只详细数据
  const fetchSheepDetail = async () => {
    try {
      loading.value = true;
      const sheepId = route.params.id;

      if (!sheepId) {
        error.value = '未找到羊只ID';
        return;
      }

      const response = await getOneInfo(sheepId);
      if (response.data && response.data.msg === 'successfully!') {
        sheepData.value = response.data.data;
        // 默认选择第一组数据
        if (sheepData.value.indexData && sheepData.value.indexData.length > 0) {
          selectedIndexData.value = sheepData.value.indexData[0];
        }
      } else {
        error.value = response.data?.msg || '获取数据失败';
      }
    } catch (err) {
      error.value = '获取数据时发生错误';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  // 选择不同的年龄组数据
  const selectMilestoneData = (index) => {
    selectedMilestoneIndex.value = index;
    selectedIndexData.value = sheepData.value.indexData[index];
  };

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  // 计算羊只年龄
  const calculateAge = (birthDate) => {
    if (!birthDate) return '未知';

    const birth = new Date(birthDate);
    const now = new Date();

    const diffTime = Math.abs(now - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays}天`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)}个月`;
    } else {
      return `${Math.floor(diffDays / 365)}岁${Math.floor((diffDays % 365) / 30)}个月`;
    }
  };

  // 检查数值是否存在
  const hasValue = (value) => {
    return value !== null && value !== undefined;
  };

  // 当前选项卡 - 只保留乳头参数作为单独选项卡
  const currentTab = ref(0);
  const tabs = ['综合信息', '乳头参数'];

  // 计算年龄组数据是否有多组
  const hasMilestoneData = computed(() => {
    return sheepData.value &&
           sheepData.value.indexData &&
           sheepData.value.indexData.length > 0;
  });

  // 计算年龄组数据是否有多组
  const hasMultipleMilestones = computed(() => {
    return sheepData.value &&
           sheepData.value.indexData &&
           sheepData.value.indexData.length > 1;
  });

  onMounted(() => {
    fetchSheepDetail();
  });
  </script>

  <template>
    <v-container fluid>
      <v-row justify="center">
        <v-col cols="12" lg="10">
          <!-- 加载状态 -->
          <v-overlay v-if="loading" class="align-center justify-center">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </v-overlay>

          <!-- 错误提示 -->
          <v-alert v-if="error" type="error" class="mb-4">
            {{ error }}
          </v-alert>

          <template v-if="sheepData && !loading">
            <!-- 羊只基本信息卡片 -->
            <v-card class="mb-4">
              <v-card-title class="text-h5 d-flex align-center">
                <span>{{ sheepData.sheep.sheep_number }}</span>
                <v-chip
                  :color="sheepData.sheep.gender === 'male' ? 'blue' : 'pink'"
                  class="ml-2"
                  size="small"
                >
                  {{ sheepData.sheep.gender === 'male' ? '公羊' : '母羊' }}
                </v-chip>
                <v-chip
                  v-if="sheepData.sheep.gender === 'female' && sheepData.sheep.pregnant"
                  color="purple"
                  class="ml-2"
                  size="small"
                >
                  怀孕中
                </v-chip>
              </v-card-title>

              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>出生日期</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(sheepData.sheep.birth_date) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>年龄</v-list-item-title>
                      <v-list-item-subtitle>{{ calculateAge(sheepData.sheep.birth_date) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>所在牧场</v-list-item-title>
                      <v-list-item-subtitle>{{ sheepData.location?.farm_name || '未知' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>地区</v-list-item-title>
                      <v-list-item-subtitle>{{ sheepData.location?.region || '未知' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>气候信息</v-list-item-title>
                      <v-list-item-subtitle>{{ sheepData.location?.climate_info || '未知' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>

                  <v-col cols="12" sm="6" md="4">
                    <v-list-item>
                      <template v-slot:prepend>
                      </template>
                      <v-list-item-title>记录时间</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(sheepData.sheep.createdAt) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <v-row v-if="sheepData.sheep.notes">
                  <v-col cols="12">
                    <v-alert type="info" variant="tonal">
                      <strong>备注：</strong> {{ sheepData.sheep.notes }}
                    </v-alert>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- 表型数据展示 -->
            <v-card v-if="hasMilestoneData">
              <v-card-title class="d-flex align-center">
                <span>表型数据</span>
                <v-spacer></v-spacer>
                <v-chip
                  v-if="selectedIndexData && selectedIndexData.group"
                  color="secondary"
                  class="ml-2"
                >
                  {{ selectedIndexData.group }}
                </v-chip>
              </v-card-title>

              <v-card-text>
                <!-- 年龄组选择器 -->
                <v-row v-if="hasMultipleMilestones">
                  <v-col cols="12">
                    <v-card color="primary" variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <span>选择年龄组数据</span>
                      </v-card-title>
                      <v-card-text>
                        <v-chip-group
                          v-model="selectedMilestoneIndex"
                          @update:model-value="selectMilestoneData"
                          mandatory
                          selected-class="primary"
                        >
                          <v-chip
                            v-for="(indexItem, index) in sheepData.indexData"
                            color="primary"
                            :key="index"
                            :value="index"
                            filter
                            variant="elevated"
                          >
                            {{ indexItem.milestone ? `${indexItem.milestone.age_days}天 - ${indexItem.milestone.milestone_name}` : '未知年龄组' }}
                          </v-chip>
                        </v-chip-group>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- 年龄组展示 -->
                <v-row v-if="selectedIndexData && selectedIndexData.milestone">
                  <v-col cols="12">
                    <v-card color="info" variant="outlined" class="mb-4">
                      <v-card-title class="d-flex align-center">
                        <span>年龄组</span>
                      </v-card-title>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" sm="6" md="4">
                            <v-card variant="tonal" color="info" class="milestone-card">
                              <v-card-title class="text-subtitle-1">年龄组</v-card-title>
                              <v-card-text class="text-h6 text-center">
                                {{ selectedIndexData.milestone.milestone_name }}
                              </v-card-text>
                            </v-card>
                          </v-col>

                          <v-col cols="12" sm="6" md="4">
                            <v-card variant="tonal" color="info" class="milestone-card">
                              <v-card-title class="text-subtitle-1">天数</v-card-title>
                              <v-card-text class="text-h6 text-center">
                                {{ selectedIndexData.milestone.age_days }} 天
                              </v-card-text>
                            </v-card>
                          </v-col>

                          <v-col cols="12" sm="12" md="4">
                            <v-card variant="tonal" color="info" class="milestone-card">
                              <v-card-title class="text-subtitle-1">描述</v-card-title>
                              <v-card-text class="text-body-1">
                                {{ selectedIndexData.milestone.description || '无描述' }}
                              </v-card-text>
                            </v-card>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>

                <v-row v-if="selectedIndexData && selectedIndexData.notes">
                  <v-col cols="12">
                    <v-alert
                      type="info"
                      variant="tonal"
                    >
                      <strong>测量备注：</strong> {{ selectedIndexData.notes }}
                    </v-alert>
                  </v-col>
                </v-row>

                <v-tabs
                  v-model="currentTab"
                  bg-color="primary"
                  centered
                  grow
                  class="mt-4"
                >
                  <v-tab
                    v-for="(tab, index) in tabs"
                    :key="index"
                    :value="index"
                  >
                    {{ tab }}
                  </v-tab>
                </v-tabs>

                <v-window v-model="currentTab" class="mt-4">
                  <!-- 综合信息 -->
                  <v-window-item :value="0">
                    <!-- 基本信息 -->
                    <v-row>
                      <v-col cols="12">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3">基本信息</h3>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" color="primary">
                          <v-card-title class="text-subtitle-1">测量日期</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ formatDate(selectedIndexData.createdAt) }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" color="primary">
                          <v-card-title class="text-subtitle-1">实验组别</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ selectedIndexData.group || '未分组' }}
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <!-- 瘤胃参数 -->
                    <v-row class="mt-4">
                      <v-col cols="12">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3">瘤胃参数</h3>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.rumen_ph) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">瘤胃pH值</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.rumen_ph) ? selectedIndexData.rumen_ph : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.acetate) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">乙酸 (mmol/L)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.acetate) ? selectedIndexData.acetate : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.propionate) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">丙酸 (mmol/L)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.propionate) ? selectedIndexData.propionate : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.butyrate) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">丁酸 (mmol/L)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.butyrate) ? selectedIndexData.butyrate : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.total_vfas) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">总VFAs (mmol/L)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.total_vfas) ? selectedIndexData.total_vfas : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <!-- 体重数据 -->
                    <v-row class="mt-4">
                      <v-col cols="12">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3">体重数据</h3>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.bw) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">体重 (kg)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.bw) ? selectedIndexData.bw : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.weight_gain) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">日增重 (kg/d)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.weight_gain) ? selectedIndexData.weight_gain : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <!-- 瘤胃形态学 -->
                    <v-row class="mt-4">
                      <v-col cols="12">
                        <h3 class="text-subtitle-1 font-weight-bold mb-3">瘤胃形态学</h3>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.rumen_wet_weight) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">瘤胃湿重 (kg)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.rumen_wet_weight) ? selectedIndexData.rumen_wet_weight : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.rumen_dry_weight) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">瘤胃干重 (kg)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.rumen_dry_weight) ? selectedIndexData.rumen_dry_weight : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.rumen_volume) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">瘤胃容积 (L)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.rumen_volume) ? selectedIndexData.rumen_volume : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="3">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.rumen_relative_weight) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">瘤胃相对重量 (%BW)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.rumen_relative_weight) ? selectedIndexData.rumen_relative_weight : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-window-item>

                  <!-- 乳头参数 -->
                  <v-window-item :value="1">
                    <v-row>
                      <v-col cols="12" sm="6" md="4">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.papilla_length) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">乳头长度 (mm)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.papilla_length) ? selectedIndexData.papilla_length : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="4">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.papilla_width) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">乳头宽度 (mm)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.papilla_width) ? selectedIndexData.papilla_width : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="4">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.papilla_surface_area) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">乳头表面积 (mm²)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.papilla_surface_area) ? selectedIndexData.papilla_surface_area : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="4">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.papilla_count) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">乳头数量 (个/cm²)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.papilla_count) ? selectedIndexData.papilla_count : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col cols="12" sm="6" md="4">
                        <v-card variant="outlined" :color="hasValue(selectedIndexData.absorptive_surface_area) ? 'primary' : 'grey lighten-1'">
                          <v-card-title class="text-subtitle-1">吸收表面积 (cm²/cm²)</v-card-title>
                          <v-card-text class="text-h6 text-center">
                            {{ hasValue(selectedIndexData.absorptive_surface_area) ? selectedIndexData.absorptive_surface_area : '无数据' }}
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>

            <!-- 无表型数据提示 -->
            <v-card v-else class="text-center pa-6">
              <v-icon icon="mdi-alert" size="large" color="warning" class="mb-4"></v-icon>
              <h3 class="text-h5 mb-2">暂无表型数据</h3>
              <p class="text-body-1">该羊只目前没有相关的表型数据记录</p>
            </v-card>
          </template>
        </v-col>
      </v-row>
    </v-container>
  </template>

  <style scoped>
  .v-card-title {
    font-weight: 500;
  }

  .v-list-item-title {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
  }

  .text-subtitle-1 {
    font-weight: 500;
  }

  .font-weight-bold {
    font-weight: 700 !important;
  }

  .milestone-card {
    height: 100%;
  }
  </style>