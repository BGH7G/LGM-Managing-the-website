<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="rounded-lg">
          <!-- 标题栏和搜索区域 -->
          <v-card-title class="text-h5 font-weight-bold py-4 px-4 d-flex flex-wrap align-center">
            羊只数据列表
            <v-spacer></v-spacer>
            <div class="d-flex align-center">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="搜索编号"
                single-line
                hide-details
                variant="outlined"
                density="compact"
                class="mr-2"
                style="max-width: 300px"
              ></v-text-field>
              <v-btn
                  icon
                  color="light-blue-lighten-3"
                  title="添加数据"
                  @click="openAddDialog"
                  class="ml-2 mr-2"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn
                icon
                color="blue-grey"
                :title="showFilters ? '收起筛选' : '高级筛选'"
                @click="showFilters = !showFilters"
                class="ml-2 mr-2"
              >
                <v-icon>mdi-filter-variant</v-icon>
              </v-btn>
              <v-btn
                icon
                color="success"
                :loading="downloadingTemplate"
                :disabled="downloadingTemplate"
                title="下载示例"
                @click="downloadExample"
                class="ml-2 mr-2"
              >
                <v-icon>mdi-download-box-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                color="error"
                :title="selectedRows.length ? '批量删除' : '请选择记录'"
                :disabled="selectedRows.length === 0"
                @click="deleteSelectedSheep"
                class="ml-2"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </v-card-title>

          <!-- 高级筛选面板 -->
          <v-expand-transition>
            <div v-if="showFilters" class="filter-panel bg-grey-lighten-5">
              <v-divider></v-divider>
              <v-card-text class="pa-4">
                <h3 class="text-subtitle-1 font-weight-medium mb-3">
                  <v-icon small class="mr-1">mdi-tune</v-icon>
                  高级筛选选项
                </h3>
                <v-row dense>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="filters.gender"
                      label="性别筛选"
                      :items="[
                        { title: '全部', value: null },
                        { title: '公羊', value: 'male' },
                        { title: '母羊', value: 'female' }
                      ]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      class="mb-3"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" sm="6" md="3">
                    <v-select
                      v-model="filters.pregnant"
                      label="怀孕状态"
                      :items="[
                        { title: '全部', value: null },
                        { title: '是', value: true },
                        { title: '否', value: false }
                      ]"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      :disabled="filters.gender === 'male'"
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
                          label="出生日期从"
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
                          label="出生日期至"
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
                <v-row class="mt-2">
                  <v-col cols="12" class="d-flex justify-end">
                    <v-btn
                      color="grey-darken-1"
                      variant="text"
                      @click="resetFilters"
                      class="mr-2"
                      prepend-icon="mdi-refresh"
                    >
                      重置
                    </v-btn>
                    <v-btn
                      color="primary"
                      @click="applyFilters"
                      prepend-icon="mdi-check"
                    >
                      应用筛选
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-divider></v-divider>
            </div>
          </v-expand-transition>

          <v-card-text class="pa-4">
            <!-- 数据表格 -->
            <v-card elevation="1" class="mb-4">
              <v-data-table
                :headers="headers"
                :items="sheep"
                :search="search"
                :loading="loading"
                :items-per-page="pagination.pageSize"
                :server-items-length="pagination.totalItems"
                :page="pagination.currentPage"
                show-select
                return-object
                v-model="selectedRows"
                hide-default-footer
                @update:options="handleSortChange"
                class="sheep-data-table"
                hover
              >
                <template v-slot:loader>
                  <v-progress-linear indeterminate color="primary"></v-progress-linear>
                </template>
                
                <template v-slot:item.birth_date="{ item }">
                  <div class="text-body-2">{{ formatDate(item.birth_date) }}</div>
                </template>

                <template v-slot:item.gender="{ item }">
                  <v-chip
                    :color="item.gender === 'male' ? 'blue' : 'pink'"
                    size="small"
                    label
                    class="font-weight-medium"
                  >
                    {{ item.gender === 'male' ? '公' : '母' }}
                  </v-chip>
                </template>

                <template v-slot:item.pregnant="{ item }">
                  <div v-if="item.gender === 'female'" class="d-flex align-center">
                    <v-icon
                      :color="item.pregnant ? 'green' : 'grey'"
                      class="mr-1"
                    >
                      {{ item.pregnant ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                    <span class="text-caption" :class="item.pregnant ? 'text-green' : 'text-grey'">
                      {{ item.pregnant ? '是' : '否' }}
                    </span>
                  </div>
                  <span v-else class="text-disabled">-</span>
                </template>

                <template v-slot:item.Location="{ item }">
                  <v-chip v-if="item.Location" size="small" variant="outlined" color="blue-grey">
                    {{ item.Location.farm_name }}
                  </v-chip>
                  <span v-else class="text-disabled">未分配</span>
                </template>

                <template v-slot:item.sheep_number="{ item }">
                  <v-btn variant="text" color="primary" size="small" @click="goToDetail(item)">
                    {{ item.sheep_number }}
                  </v-btn>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon
                    variant="text"
                    color="primary"
                    @click="viewDetails(item)"
                    :title="`查看 ${item.sheep_number} 的详情`"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                </template>
                
                <template v-slot:no-data>
                  <div class="d-flex flex-column align-center pa-4">
                    <v-icon size="large" color="grey-lighten-1">mdi-database-off</v-icon>
                    <span class="text-subtitle-1 text-grey mt-2">无数据</span>
                  </div>
                </template>
              </v-data-table>
            </v-card>

            <!-- 分页控件 -->
            <div class="pagination-wrapper pt-2">
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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 详情对话框 -->
    <v-dialog v-model="detailDialog" max-width="800">
      <v-card v-if="selectedSheep">
        <v-btn
          icon
          @click="detailDialog = false"
          style="position: absolute; top: 16px; right: 16px; z-index: 1"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-card-title class="text-h5 font-weight-bold text-center">
          羊只详细信息
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>编号</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSheep.sheep_number }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>出生日期</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedSheep.birth_date) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>性别</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedSheep.gender === 'male' ? 'blue' : 'pink'"
                      size="small"
                    >
                      {{ selectedSheep.gender === 'male' ? '公' : '母' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="selectedSheep.gender === 'female'">
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>怀孕状态</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedSheep.pregnant ? 'green' : 'grey'"
                      size="small"
                    >
                      {{ selectedSheep.pregnant ? '是' : '否' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>备注</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSheep.notes || '无' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  <v-icon class="mr-2">mdi-map-marker</v-icon>
                  所在牧场信息
                </v-card-title>
                <v-card-text v-if="selectedSheep.Location">
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-title>牧场名称</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.farm_name }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>地址</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.address }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>地区</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.region }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>气候信息</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.climate_info }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
                <v-card-text v-else>无牧场信息</v-card-text>
              </v-card>

              <!-- Note: latestIndex data is not directly displayed as per requirements -->
              <v-card v-if="selectedSheep.latestIndex" variant="outlined" color="info">
                <v-card-title class="text-subtitle-1">
                  <v-icon class="mr-2">mdi-chart-line</v-icon>
                  有最新测量数据
                </v-card-title>
                <v-card-text>
                  <v-btn color="primary" variant="tonal" @click="viewIndexDetails">
                    查看详细指标数据
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 指标详情对话框 -->
    <v-dialog v-model="indexDialog" max-width="900">
      <v-card v-if="selectedSheep && selectedSheep.latestIndex">
        <v-toolbar density="compact" color="info" dark>
          <v-toolbar-title class="text-h6">
            <v-icon class="mr-2">mdi-chart-box</v-icon>
            指标详细数据
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="indexDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <div class="mb-4 text-subtitle-1 d-flex align-center">
            <v-chip color="primary" label class="mr-2">{{ selectedSheep.sheep_number }}</v-chip>
            <span>的指标数据</span>
          </div>
          
          <v-tabs v-model="activeTab" slider-color="primary" bg-color="grey-lighten-3" rounded="lg" class="mb-4">
            <v-tab value="basic" class="text-body-1">基本信息</v-tab>
            <v-tab value="rumen" class="text-body-1">瘤胃参数</v-tab>
            <v-tab value="growth" class="text-body-1">生长指标</v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <v-window-item value="basic">
              <v-card variant="outlined" class="pa-2">
                <v-list two-line>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-tag-multiple</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-medium">组别</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1">{{ selectedSheep.latestIndex.group || '未分组' }}</v-list-item-subtitle>
                  </v-list-item>
                  
                  <v-divider inset></v-divider>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-note-text</v-icon>
                    </template>
                    <v-list-item-title class="font-weight-medium">备注</v-list-item-title>
                    <v-list-item-subtitle class="text-body-1 text-pre-wrap">{{ selectedSheep.latestIndex.notes || '无' }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-window-item>

            <v-window-item value="rumen">
              <v-card variant="outlined">
                <v-table>
                  <thead>
                    <tr class="bg-blue-lighten-5">
                      <th class="text-left">参数</th>
                      <th class="text-left">数值</th>
                      <th class="text-left">单位</th>
                      <th class="text-left">参考范围</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-weight-medium">瘤胃pH值</td>
                      <td>{{ selectedSheep.latestIndex.rumen_ph || '-' }}</td>
                      <td></td>
                      <td class="text-caption">5.5-7.0</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">乙酸</td>
                      <td>{{ selectedSheep.latestIndex.acetate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">40-70</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">丙酸</td>
                      <td>{{ selectedSheep.latestIndex.propionate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">15-40</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">异丁酸</td>
                      <td>{{ selectedSheep.latestIndex.isobutyrate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">0.5-2.0</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">丁酸</td>
                      <td>{{ selectedSheep.latestIndex.butyrate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">5-15</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">异戊酸</td>
                      <td>{{ selectedSheep.latestIndex.isovalerate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">0.5-2.0</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">戊酸</td>
                      <td>{{ selectedSheep.latestIndex.valerate || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">0.5-2.0</td>
                    </tr>
                    <tr class="bg-blue-lighten-5">
                      <td class="font-weight-bold">总挥发性脂肪酸</td>
                      <td class="font-weight-bold">{{ selectedSheep.latestIndex.total_vfas || '-' }}</td>
                      <td>mmol/L</td>
                      <td class="text-caption">70-130</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </v-window-item>

            <v-window-item value="growth">
              <v-card variant="outlined">
                <v-table>
                  <thead>
                    <tr class="bg-green-lighten-5">
                      <th class="text-left">参数</th>
                      <th class="text-left">数值</th>
                      <th class="text-left">单位</th>
                      <th class="text-left">参考说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="font-weight-medium">体重</td>
                      <td>{{ selectedSheep.latestIndex.bw || '-' }}</td>
                      <td>kg</td>
                      <td class="text-caption">成年约35-90kg</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">日增重</td>
                      <td>{{ selectedSheep.latestIndex.weight_gain || '-' }}</td>
                      <td>kg/d</td>
                      <td class="text-caption">理想0.2-0.4</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃湿重</td>
                      <td>{{ selectedSheep.latestIndex.rumen_wet_weight || '-' }}</td>
                      <td>kg</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃干重</td>
                      <td>{{ selectedSheep.latestIndex.rumen_dry_weight || '-' }}</td>
                      <td>kg</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃容积</td>
                      <td>{{ selectedSheep.latestIndex.rumen_volume || '-' }}</td>
                      <td>L</td>
                      <td class="text-caption">成年约10-20L</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃相对重量</td>
                      <td>{{ selectedSheep.latestIndex.rumen_relative_weight || '-' }}</td>
                      <td>%</td>
                      <td class="text-caption">占体重百分比</td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃乳头长度</td>
                      <td>{{ selectedSheep.latestIndex.papilla_length || '-' }}</td>
                      <td>mm</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃乳头宽度</td>
                      <td>{{ selectedSheep.latestIndex.papilla_width || '-' }}</td>
                      <td>mm</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">瘤胃乳头表面积</td>
                      <td>{{ selectedSheep.latestIndex.papilla_surface_area || '-' }}</td>
                      <td>mm²</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">乳头数量</td>
                      <td>{{ selectedSheep.latestIndex.papilla_count || '-' }}</td>
                      <td>个/cm²</td>
                      <td class="text-caption"></td>
                    </tr>
                    <tr>
                      <td class="font-weight-medium">吸收表面积</td>
                      <td>{{ selectedSheep.latestIndex.absorptive_surface_area || '-' }}</td>
                      <td>cm²</td>
                      <td class="text-caption">越大吸收能力越强</td>
                    </tr>
                  </tbody>
                </v-table>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- 添加数据对话框 -->
    <v-dialog v-model="addDialog" max-width="900" persistent>
      <v-card>
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          添加湖羊数据
          <v-spacer></v-spacer>
          <v-btn icon @click="closeAddDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text>
          <v-form ref="addForm">
            <!-- 牧场选择部分 -->
            <v-card variant="outlined" class="mb-4 pa-3">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                选择牧场位置
              </div>
              
              <v-radio-group v-model="farmSelection" inline>
                <v-radio label="选择现有牧场" value="existing"></v-radio>
                <v-radio label="创建新牧场" value="new"></v-radio>
              </v-radio-group>
              
              <v-expand-transition>
                <div v-if="farmSelection === 'existing'">
                  <v-select
                    v-model="selectedFarm"
                    :items="farms"
                    item-title="farm_name"
                    item-value="id"
                    label="选择牧场"
                    variant="outlined"
                    density="compact"
                    :rules="[v => !!v || '请选择牧场']"
                  ></v-select>
                </div>
              </v-expand-transition>
              
              <v-expand-transition>
                <div v-if="farmSelection === 'new'">
                  <v-text-field
                    v-model="newFarm.farm_name"
                    label="牧场名称"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                    :rules="[v => !!v || '请输入牧场名称']"
                  ></v-text-field>
                  <v-text-field
                    v-model="newFarm.location"
                    label="牧场位置"
                    variant="outlined"
                    density="compact"
                    class="mb-2"
                  ></v-text-field>
                  <v-textarea
                    v-model="newFarm.description"
                    label="牧场描述"
                    variant="outlined"
                    density="compact"
                    rows="2"
                    auto-grow
                  ></v-textarea>
                </div>
              </v-expand-transition>
            </v-card>
            
            <!-- 羊只数据输入部分 -->
            <v-card variant="outlined" class="mb-4 pa-3">
              <div class="d-flex justify-space-between align-center mb-3">
                <div class="text-subtitle-1 font-weight-bold">
                  羊只数据 ({{ sheepDataList.length }}条)
                </div>
                <v-btn
                  color="primary"
                  variant="text"
                  @click="addSheepDataRow"
                  prepend-icon="mdi-plus"
                >
                  添加一行
                </v-btn>
              </div>
              
              <v-alert
                v-if="sheepDataList.length === 0"
                type="info"
                variant="tonal"
                class="mb-3"
              >
                请添加至少一条羊只数据
              </v-alert>
              
              <v-table v-else>
                <thead>
                  <tr>
                    <th>编号</th>
                    <th>出生日期</th>
                    <th>性别</th>
                    <th>怀孕状态</th>
                    <th>备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in sheepDataList" :key="index">
                    <td>
                      <v-text-field
                        v-model="item.sheep_number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="如: HS-2025-0001"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-menu
                        v-model="item.dateMenu"
                        :close-on-content-click="false"
                        location="bottom"
                      >
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-bind="props"
                            v-model="item.birth_date"
                            variant="outlined"
                            density="compact"
                            hide-details
                            placeholder="选择日期"
                            readonly
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="item.birth_date"
                          @update:model-value="item.dateMenu = false"
                        ></v-date-picker>
                      </v-menu>
                    </td>
                    <td>
                      <v-select
                        v-model="item.gender"
                        :items="[
                          { title: '公羊', value: 'male' },
                          { title: '母羊', value: 'female' }
                        ]"
                        item-title="title"
                        item-value="value"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="onGenderChange(index)"
                      ></v-select>
                    </td>
                    <td>
                      <v-checkbox
                        v-model="item.pregnant"
                        hide-details
                        :disabled="item.gender !== 'female'"
                        density="compact"
                      ></v-checkbox>
                    </td>
                    <td>
                      <v-text-field
                        v-model="item.notes"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="备注信息"
                      ></v-text-field>
                    </td>
                    <td>
                      <v-btn
                        icon
                        variant="text"
                        color="error"
                        density="compact"
                        @click="removeSheepDataRow(index)"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="closeAddDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="success"
            :loading="submitting"
            @click="submitSheepData"
          >
            提交数据
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 详情导航 -->
    <v-dialog v-model="detailDialog" max-width="800">
      <v-card v-if="selectedSheep">
        <v-btn
          icon
          @click="detailDialog = false"
          style="position: absolute; top: 16px; right: 16px; z-index: 1"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-card-title class="text-h5 font-weight-bold text-center">
          羊只详细信息
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>编号</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSheep.sheep_number }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>出生日期</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedSheep.birth_date) }}</v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>性别</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedSheep.gender === 'male' ? 'blue' : 'pink'"
                      size="small"
                    >
                      {{ selectedSheep.gender === 'male' ? '公' : '母' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="selectedSheep.gender === 'female'">
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>怀孕状态</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="selectedSheep.pregnant ? 'green' : 'grey'"
                      size="small"
                    >
                      {{ selectedSheep.pregnant ? '是' : '否' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                  </template>
                  <v-list-item-title>备注</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedSheep.notes || '无' }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title class="text-subtitle-1">
                  <v-icon class="mr-2">mdi-map-marker</v-icon>
                  所在牧场信息
                </v-card-title>
                <v-card-text v-if="selectedSheep.Location">
                  <v-list dense>
                    <v-list-item>
                      <v-list-item-title>牧场名称</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.farm_name }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>地址</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.address }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>地区</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.region }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>气候信息</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSheep.Location.climate_info }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
                <v-card-text v-else>无牧场信息</v-card-text>
              </v-card>

              <!-- Note: latestIndex data is not directly displayed as per requirements -->
              <v-card v-if="selectedSheep.latestIndex" variant="outlined" color="info">
                <v-card-title class="text-subtitle-1">
                  <v-icon class="mr-2">mdi-chart-line</v-icon>
                  有最新测量数据
                </v-card-title>
                <v-card-text>
                  <v-btn color="primary" variant="tonal" @click="viewIndexDetails">
                    查看详细指标数据
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getInfo, getOneInfo, addInfo, deleteInfo, deleteBatchInfo } from '@/api/data.api';
import { getLocation } from '@/api/location.api';
import { getExpIndex } from '@/api/index.api';

export default {
  name: 'HuSheepIndividual',

  setup() {
    const loading = ref(false);
    const search = ref('');
    const sheep = ref([]);
    const selectedSheep = ref(null);
    const detailDialog = ref(false);
    const indexDialog = ref(false);
    const activeTab = ref('basic');
    const showFilters = ref(false);
    const downloadingTemplate = ref(false);
    
    // 添加数据相关变量
    const addDialog = ref(false);
    const submitting = ref(false);
    const addForm = ref(null);
    const farms = ref([]);
    const farmSelection = ref('existing');
    const selectedFarm = ref(null);
    const newFarm = reactive({
      farm_name: '',
      location: '',
      description: ''
    });
    const sheepDataList = ref([]);
    
    // 筛选条件
    const filters = reactive({
      gender: null,
      pregnant: null,
      fromDate: null,
      toDate: null,
      sheepNumber: ''
    });
    
    // 日期选择器控制
    const dateMenu = reactive({
      fromDate: false,
      toDate: false
    });

    const headers = [
      { title: '编号', key: 'sheep_number', sortable: true },
      { title: '出生日期', key: 'birth_date', sortable: true },
      { title: '性别', key: 'gender', sortable: true },
      { title: '怀孕状态', key: 'pregnant', sortable: true },
      { title: '所在牧场', key: 'Location', sortable: false },
      { title: '操作', key: 'actions', sortable: false }
    ];

    const pagination = reactive({
      totalItems: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 10,
      hasNextPage: false,
      hasPrevPage: false
    });

    // 每页条数选项
    const pageSizeOptions = [5, 10, 20, 50];

    // 选中行（用于批量删除）
    const selectedRows = ref([]);

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '暂无数据';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // 加载数据
    const loadData = async (params = {}) => {
      try {
        loading.value = true;
        const response = await getInfo({
          page: pagination.currentPage,
          pageSize: pagination.pageSize,
          sortBy: 'id',
          sortOrder: 'ASC',
          gender: filters.gender,
          pregnant: filters.pregnant,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          sheepNumber: filters.sheepNumber || search.value,
          ...params
        });

        if (response.data.success) {
          sheep.value = response.data.data;

          // 更新分页信息
          const { totalItems, totalPages, currentPage, pageSize, hasNextPage, hasPrevPage } = response.data.pagination;
          pagination.totalItems = totalItems;
          pagination.totalPages = totalPages;
          pagination.currentPage = currentPage;
          pagination.pageSize = pageSize;
          pagination.hasNextPage = hasNextPage;
          pagination.hasPrevPage = hasPrevPage;
        }
      } catch (error) {
        console.error('Failed to load sheep data:', error);
      } finally {
        loading.value = false;
      }
    };

    // 查看详情
    const viewDetails = (item) => {
      selectedSheep.value = item;
      detailDialog.value = true;
    };

    // 查看指标详情
    const viewIndexDetails = () => {
      indexDialog.value = true;
    };

    // 处理每页显示数量变化
    const onPageSizeChange = (newSize) => {
      pagination.pageSize = newSize;
      pagination.currentPage = 1; // 重置为第一页
      loadData();
    };

    // 处理排序变化
    const handleSortChange = (options) => {
      // 只处理排序变化，页码和每页数量由其他函数处理
      if (options.sortBy && options.sortBy.length > 0) {
        const sortBy = options.sortBy[0].key;
        const sortOrder = options.sortBy[0].order.toUpperCase();
        loadData({ sortBy, sortOrder });
      }
    };
    
    // 下载示例 XLSX
    const downloadExample = async () => {
      try {
        downloadingTemplate.value = true;
        const res = await getExpIndex();
        const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // 从响应头解析文件名
        const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
        let filename = 'hu_sheep_index_template.xlsx';
        if (cd) {
          const match = /filename\*=.*?''([^;]+)|filename="?([^";]+)"?/i.exec(cd);
          if (match) {
            filename = decodeURIComponent(match[1] || match[2]);
          }
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'hu_sheep_index_template.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        const backendMsg = err?.response?.data?.msg || err?.response?.data?.message;
        alert(`下载失败: ${backendMsg || err.message || '未知错误'}`);
      } finally {
        downloadingTemplate.value = false;
      }
    };

    // 应用筛选条件
    const applyFilters = () => {
      // 更新搜索框中的编号到筛选条件
      filters.sheepNumber = search.value;
      pagination.currentPage = 1; // 重置为第一页
      loadData();
    };
    
    // 重置筛选条件
    const resetFilters = () => {
      Object.assign(filters, {
        gender: null,
        pregnant: null,
        fromDate: null,
        toDate: null,
        sheepNumber: ''
      });
      search.value = '';
      pagination.currentPage = 1;
      loadData();
    };

    // 监视分页当前页变化
    watch(() => pagination.currentPage, (newPage) => {
      if (!loading.value) {
        loadData();
      }
    });

    // 加载牧场数据
    const loadFarms = async () => {
      try {
        const response = await getLocation();
        if (response.data.success) {
          farms.value = response.data.data;
          if (farms.value.length > 0) {
            selectedFarm.value = farms.value[0].id;
          } else {
            // 如果没有牧场，默认选择创建新牧场
            farmSelection.value = 'new';
          }
        }
      } catch (error) {
        console.error('Failed to load farm locations:', error);
      }
    };

    // 打开添加数据对话框
    const openAddDialog = () => {
      addDialog.value = true;
      loadFarms();
      // 默认添加一行空数据
      if (sheepDataList.value.length === 0) {
        addSheepDataRow();
      }
    };

    // 关闭添加数据对话框
    const closeAddDialog = () => {
      addDialog.value = false;
      // 重置表单
      sheepDataList.value = [];
      selectedFarm.value = farms.value.length > 0 ? farms.value[0].id : null;
      farmSelection.value = farms.value.length > 0 ? 'existing' : 'new';
      Object.assign(newFarm, {
        farm_name: '',
        location: '',
        description: ''
      });
    };

    // 添加一行羊只数据
    const addSheepDataRow = () => {
      sheepDataList.value.push({
        sheep_number: '',
        birth_date: '',
        gender: 'female',
        pregnant: false,
        notes: '',
        dateMenu: false
      });
    };

    // 删除一行羊只数据
    const removeSheepDataRow = (index) => {
      sheepDataList.value.splice(index, 1);
    };

    // 性别变更时处理怀孕状态
    const onGenderChange = (index) => {
      const item = sheepDataList.value[index];
      if (item.gender === 'male') {
        item.pregnant = false;
      }
    };

    // 提交羊只数据
    const submitSheepData = async () => {
      // 表单验证
      if (sheepDataList.value.length === 0) {
        alert('请至少添加一条羊只数据');
        return;
      }

      // 验证必填字段
      for (const item of sheepDataList.value) {
        if (!item.sheep_number || !item.birth_date || !item.gender) {
          alert('请填写所有必填字段（编号、出生日期、性别）');
          return;
        }
      }

      if (farmSelection.value === 'existing' && !selectedFarm.value) {
        alert('请选择牧场');
        return;
      }

      if (farmSelection.value === 'new' && !newFarm.farm_name) {
        alert('请输入新牧场名称');
        return;
      }

      try {
        submitting.value = true;
        
        // 准备提交数据
        const submitData = {
          sheepData: sheepDataList.value.map(item => ({
            sheep_number: item.sheep_number,
            birth_date: item.birth_date,
            gender: item.gender,
            pregnant: item.gender === 'female' ? item.pregnant : undefined,
            notes: item.notes
          })),
          farmInfo: farmSelection.value === 'existing' 
            ? { id: selectedFarm.value } 
            : { ...newFarm, isNew: true }
        };

        // 发送请求
        const response = await addInfo(submitData);

        if (response.data.success) {
          alert('数据添加成功');
          closeAddDialog();
          loadData(); // 重新加载数据
        } else {
          // 优先使用后端返回的 msg/message 字段提示给用户
          const backendMsg = response.data.msg || response.data.message;
          const message = backendMsg || '未知错误';
          alert(`添加失败: ${message}`);
        }
      } catch (error) {
        console.error('Failed to add sheep data:', error);
        // 优先使用后端返回的 msg/message 字段提示给用户
        const backendMsg = error?.response?.data?.msg || error?.response?.data?.message;
        const message = backendMsg || error.message || '未知错误';
        alert(`添加失败: ${message}`);
      } finally {
        submitting.value = false;
      }
    };

    // 批量删除
    const deleteSelectedSheep = async () => {
      if (selectedRows.value.length === 0) return;
      if (!confirm(`确认删除选中的 ${selectedRows.value.length} 条数据?`)) return;
      try {
        const ids = selectedRows.value.map(item => item.id);
        const res = await deleteBatchInfo(ids);
        if (res.data.success) {
          alert('批量删除成功');
          selectedRows.value = [];
          loadData();
        } else {
          alert(`删除失败: ${res.data.msg || res.data.message || '未知错误'}`);
        }
      } catch (err) {
        const backendMsg = err?.response?.data?.msg || err?.response?.data?.message;
        alert(`删除失败: ${backendMsg || err.message || '未知错误'}`);
      }
    };

    const router = useRouter();

    const goToDetail = (item) => {
      router.push({ name: 'huSheep_detail', params: { id: item.id } });
    };

    onMounted(() => {
      loadData();
    });

    return {
      loading,
      search,
      sheep,
      headers,
      pagination,
      pageSizeOptions,
      selectedSheep,
      detailDialog,
      indexDialog,
      activeTab,
      showFilters,
      filters,
      dateMenu,
      formatDate,
      viewDetails,
      viewIndexDetails,
      onPageSizeChange,
      handleSortChange,
      downloadExample,
      downloadingTemplate,
      applyFilters,
      resetFilters,
      // 添加数据相关
      addDialog,
      submitting,
      addForm,
      farms,
      farmSelection,
      selectedFarm,
      newFarm,
      sheepDataList,
      openAddDialog,
      closeAddDialog,
      addSheepDataRow,
      removeSheepDataRow,
      onGenderChange,
      submitSheepData,
      // 删除相关
      selectedRows,
      deleteSelectedSheep,
      goToDetail
    };
  }
};
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.sheep-data-table :deep(th) {
  font-weight: bold !important;
  background-color: #f5f5f5 !important;
}

.sheep-data-table :deep(td) {
  padding: 8px 16px !important;
}

.filter-panel {
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.pagination-wrapper {
  border-top: 1px solid #eeeeee;
  padding-top: 16px;
}

.v-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}
</style>