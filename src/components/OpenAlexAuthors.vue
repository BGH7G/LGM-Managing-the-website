<template>
  <v-card class="glass-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-account-search</v-icon>
      <span class="text-h5 font-weight-bold">作者检索</span>
      <v-spacer></v-spacer>
      <v-chip variant="outlined" size="small">
        OpenAlex 作者数据库
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- 搜索栏和筛选工具栏 -->
      <div class="search-toolbar mb-4">
        <v-text-field
          v-model="searchQuery"
          label="搜索作者姓名或关键词"
          placeholder="例如：John Smith, 张三"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          @keyup.enter="handleSearch"
        >
          <template #prepend-inner>
            <!-- 端点选择器 -->
            <v-menu offset-y max-width="320">
              <template #activator="{ props }">
                <v-btn
                  variant="text"
                  v-bind="props"
                  class="endpoint-selector-btn"
                >
                  <v-icon :icon="currentEndpoint.icon" class="mr-2" size="20"></v-icon>
                  <span class="endpoint-selector-text">{{ currentEndpoint.title }}</span>
                  <v-icon icon="mdi-chevron-down" size="20" class="ml-1"></v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="endpoint-menu">
                <v-list-item
                  v-for="option in endpointOptions"
                  :key="option.value"
                  :active="option.value === selectedEndpoint"
                  :disabled="option.disabled"
                  @click="!option.disabled && switchEndpoint(option.value)"
                >
                  <template #prepend>
                    <v-icon :icon="option.icon" size="20"></v-icon>
                  </template>
                  <v-list-item-title>{{ option.title }}</v-list-item-title>
                  <v-list-item-subtitle class="text-caption">{{ option.description }}</v-list-item-subtitle>
                  <template #append>
                    <v-icon v-if="option.value === selectedEndpoint" icon="mdi-check" size="20"></v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-divider vertical class="mx-2"></v-divider>
            <v-icon icon="mdi-magnify" class="mr-2"></v-icon>
          </template>
          <template #append-inner>
            <!-- 排序菜单 -->
            <v-menu offset-y>
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  v-bind="props"
                  class="toolbar-icon"
                >
                  <v-badge
                    v-if="sortBy !== 'cited_by_count' || sortOrder !== 'desc'"
                    color="primary"
                    dot
                  >
                    <v-icon>mdi-sort</v-icon>
                  </v-badge>
                  <v-icon v-else>mdi-sort</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" class="filter-menu">
                <v-list-subheader>Sort by</v-list-subheader>
                <v-list-item
                  v-for="option in sortOptions"
                  :key="option.value"
                  :active="sortBy === option.value"
                  @click="sortBy = option.value; handleSearch()"
                >
                  <v-list-item-title>{{ option.title }}</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortBy === option.value">mdi-check</v-icon>
                  </template>
                </v-list-item>
                <v-divider class="my-1"></v-divider>
                <v-list-item
                  :active="sortOrder === 'desc'"
                  @click="sortOrder = 'desc'; handleSearch()"
                >
                  <v-list-item-title>降序</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortOrder === 'desc'">mdi-check</v-icon>
                  </template>
                </v-list-item>
                <v-list-item
                  :active="sortOrder === 'asc'"
                  @click="sortOrder = 'asc'; handleSearch()"
                >
                  <v-list-item-title>升序</v-list-item-title>
                  <template #append>
                    <v-icon v-if="sortOrder === 'asc'">mdi-check</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>

            <!-- 筛选菜单 -->
            <v-menu offset-y max-width="400">
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  v-bind="props"
                  class="toolbar-icon"
                >
                  <v-badge
                    v-if="hasActiveFilters"
                    :content="activeFiltersCount"
                    color="primary"
                  >
                    <v-icon>mdi-filter-variant</v-icon>
                  </v-badge>
                  <v-icon v-else>mdi-filter-variant</v-icon>
                </v-btn>
              </template>
              <v-card class="filter-menu">
                <v-card-title class="text-subtitle-1 pa-3 pb-2">
                  Filters
                  <v-btn
                    v-if="hasActiveFilters"
                    variant="text"
                    size="small"
                    color="primary"
                    @click="clearFilters"
                  >
                    Clear all
                  </v-btn>
                </v-card-title>
                <v-divider></v-divider>
                <v-card-text class="pa-3">
                  <!-- 文章数范围 -->
                  <div class="filter-section">
                    <div class="filter-label">Works count</div>
                    <div class="d-flex gap-2">
                      <v-text-field
                        v-model.number="filters.minWorksCount"
                        label="Min"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="10"
                      ></v-text-field>
                      <v-text-field
                        v-model.number="filters.maxWorksCount"
                        label="Max"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="1000"
                      ></v-text-field>
                    </div>
                  </div>

                  <!-- 引用数范围 -->
                  <div class="filter-section">
                    <div class="filter-label">Citation count</div>
                    <div class="d-flex gap-2">
                      <v-text-field
                        v-model.number="filters.minCitations"
                        label="Min"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="100"
                      ></v-text-field>
                      <v-text-field
                        v-model.number="filters.maxCitations"
                        label="Max"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        placeholder="10000"
                      ></v-text-field>
                    </div>
                  </div>

                  <!-- 应用按钮 -->
                  <v-btn
                    color="primary"
                    block
                    class="mt-3"
                    :loading="loading"
                    @click="handleSearch"
                  >
                    Apply filters
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-menu>

            <!-- 搜索按钮 -->
            <v-btn
              color="primary"
              :loading="loading"
              class="ml-2"
              @click="handleSearch"
            >
              搜索
            </v-btn>
          </template>
        </v-text-field>
      </div>

      <!-- 搜索结果统计 -->
      <div v-if="searchResults" class="mb-4">
        <v-alert
          variant="tonal"
          color="primary"
          density="compact"
          icon="mdi-information"
        >
          找到 {{ totalResults?.toLocaleString() || 0 }} 位作者
          <span v-if="searchQuery">
            (关键词: "{{ searchQuery }}")
          </span>
        </v-alert>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
        <p class="text-body-2 text-brand-muted mt-4">搜索中...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!searchResults && !error"
        class="text-center py-12"
      >
      </div>

      <!-- 错误状态 -->
      <v-alert
        v-else-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="error = null"
      >
        {{ error }}
      </v-alert>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchResults && searchResults.length > 0">
        <!-- 顶部分页器 -->
        <div class="d-flex justify-center mb-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>

        <v-card
          v-for="author in searchResults"
          :key="author.id"
          class="mb-3 author-card"
          variant="outlined"
          @click="handleAuthorClick(author)"
        >
          <v-card-text>
            <!-- 作者名称和头像 -->
            <div class="d-flex align-items-start mb-3">
              <v-avatar
                size="56"
                color="primary"
                class="mr-4"
              >
                <span class="text-h6">{{ getAuthorInitials(author.display_name) }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <h3 class="text-h6 mb-1 author-name">
                  {{ author.display_name }}
                </h3>
                <div v-if="author.orcid" class="text-caption text-brand-muted mb-1">
                  <v-icon size="small" class="mr-1">mdi-identifier</v-icon>
                  ORCID: {{ author.orcid }}
                </div>
              </div>
            </div>

            <!-- 统计信息 -->
            <div class="d-flex flex-wrap gap-2 mb-3">
              <!-- 文章数 -->
              <v-chip
                size="small"
                variant="outlined"
                prepend-icon="mdi-file-document-multiple"
                color="primary"
              >
                文章: {{ author.works_count?.toLocaleString() || 0 }}
              </v-chip>

              <!-- 引用数 -->
              <v-chip
                size="small"
                variant="outlined"
                prepend-icon="mdi-format-quote-close"
                color="success"
              >
                引用: {{ author.cited_by_count?.toLocaleString() || 0 }}
              </v-chip>

              <!-- H-Index -->
              <v-chip
                v-if="author.summary_stats?.h_index"
                size="small"
                variant="outlined"
                prepend-icon="mdi-chart-line"
                color="warning"
              >
                H-Index: {{ author.summary_stats.h_index }}
              </v-chip>

              <!-- i10-Index -->
              <v-chip
                v-if="author.summary_stats?.i10_index"
                size="small"
                variant="outlined"
                prepend-icon="mdi-chart-bar"
              >
                i10-Index: {{ author.summary_stats.i10_index }}
              </v-chip>
            </div>

            <!-- 机构信息 -->
            <div
              v-if="author.last_known_institutions && author.last_known_institutions.length > 0"
              class="mb-2"
            >
              <div class="text-caption text-brand-muted mb-1">
                <v-icon size="small" class="mr-1">mdi-domain</v-icon>
                所属机构:
              </div>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="inst in author.last_known_institutions.slice(0, 3)"
                  :key="inst.id"
                  size="x-small"
                  variant="tonal"
                  @click.stop="handleInstitutionClick(inst)"
                >
                  {{ inst.display_name }}
                  <span v-if="inst.country_code" class="ml-1">({{ inst.country_code }})</span>
                </v-chip>
              </div>
            </div>

            <!-- 研究领域 -->
            <div v-if="author.x_concepts && author.x_concepts.length > 0" class="mb-2">
              <div class="text-caption text-brand-muted mb-1">
                <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
                研究领域:
              </div>
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="concept in author.x_concepts.slice(0, 5)"
                  :key="concept.id"
                  size="x-small"
                  variant="flat"
                  color="grey-lighten-3"
                >
                  {{ concept.display_name }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- 分页器 -->
        <div class="d-flex justify-center mt-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="handlePageChange"
          ></v-pagination>
        </div>
      </div>

      <!-- 无结果状态 -->
      <div
        v-else-if="searchResults && searchResults.length === 0"
        class="text-center py-12"
      >
        <v-icon size="64" color="grey-lighten-1">mdi-account-search-outline</v-icon>
        <p class="text-h6 text-brand-muted mt-4">未找到相关作者</p>
        <p class="text-body-2 text-brand-muted">请尝试其他关键词或调整筛选条件</p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { searchAuthors } from '@/api/openalex.api'

// 定义组件 props
const props = defineProps({
  selectedEndpoint: {
    type: String,
    default: 'authors'
  }
})

// 定义组件 emit
const emit = defineEmits(['entity-click', 'update:selected-endpoint'])

// 端点选项
const endpointOptions = [
  {
    title: 'Works',
    value: 'works',
    icon: 'mdi-file-document-multiple',
    description: 'Scholarly papers, books, datasets, etc.'
  },
  {
    title: 'Authors',
    value: 'authors',
    icon: 'mdi-account-multiple',
    description: 'Creators of scholarly works'
  },
  {
    title: 'Sources',
    value: 'sources',
    icon: 'mdi-book-open-page-variant',
    description: 'Journals, conferences, and repositories',
    disabled: true
  },
  {
    title: 'Funders',
    value: 'funders',
    icon: 'mdi-cash-multiple',
    description: 'Organization that funds research',
    disabled: true
  },
  {
    title: 'Institutions',
    value: 'institutions',
    icon: 'mdi-domain',
    description: 'Universities and research centers',
    disabled: true
  }
]

// 获取当前选中的端点信息
const currentEndpoint = computed(() => {
  return endpointOptions.find(opt => opt.value === props.selectedEndpoint) || endpointOptions[1]
})

// 切换端点
const switchEndpoint = (value) => {
  emit('update:selected-endpoint', value)
}

// 搜索相关状态
const searchQuery = ref('')
const searchResults = ref(null)
const loading = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalResults = ref(0)
const perPage = ref(25)

// 筛选条件
const filters = ref({
  minWorksCount: null,
  maxWorksCount: null,
  minCitations: null,
  maxCitations: null
})

// 排序
const sortBy = ref('cited_by_count')
const sortOrder = ref('desc')

const sortOptions = [
  { title: '相关性', value: 'relevance_score' },
  { title: '文章数', value: 'works_count' },
  { title: '引用数', value: 'cited_by_count' },
  { title: 'H-Index', value: 'summary_stats.h_index' },
  { title: '2年引用数', value: 'summary_stats.2yr_mean_citedness' }
]

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(totalResults.value / perPage.value)
})

// 检查是否有活跃筛选
const hasActiveFilters = computed(() => {
  return (
    filters.value.minWorksCount !== null ||
    filters.value.maxWorksCount !== null ||
    filters.value.minCitations !== null ||
    filters.value.maxCitations !== null
  )
})

// 计算活跃筛选数量
const activeFiltersCount = computed(() => {
  let count = 0
  if (filters.value.minWorksCount !== null) count++
  if (filters.value.maxWorksCount !== null) count++
  if (filters.value.minCitations !== null) count++
  if (filters.value.maxCitations !== null) count++
  return count
})

// 执行搜索
const fetchAuthors = async () => {
  if (!searchQuery.value.trim()) {
    error.value = '请输入搜索关键词'
    return
  }

  loading.value = true
  error.value = null

  try {
    const params = {
      search: searchQuery.value,
      page: currentPage.value,
      perPage: perPage.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...filters.value
    }

    const response = await searchAuthors(params)
    searchResults.value = response.data.results
    totalResults.value = response.data.meta.count
  } catch (err) {
    console.error('搜索失败:', err)
    error.value = '搜索失败，请稍后重试。错误信息: ' + (err.message || '未知错误')
    searchResults.value = null
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchAuthors()
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchAuthors()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 清除筛选
const clearFilters = () => {
  filters.value = {
    minWorksCount: null,
    maxWorksCount: null,
    minCitations: null,
    maxCitations: null
  }
  sortBy.value = 'cited_by_count'
  sortOrder.value = 'desc'
}

// 获取作者姓名首字母
const getAuthorInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// 从 OpenAlex URL 中提取 ID
const extractId = (url) => {
  if (!url) return ''
  return url.split('/').pop()
}

// 处理作者点击
const handleAuthorClick = (author) => {
  emit('entity-click', {
    type: 'author',
    id: extractId(author.id)
  })
}

// 处理机构点击
const handleInstitutionClick = (institution) => {
  emit('entity-click', {
    type: 'institution',
    id: extractId(institution.id)
  })
}
</script>

<style scoped>
.glass-card {
  backdrop-filter: blur(10px);
}

.gap-2 {
  gap: 8px;
}

/* 搜索工具栏样式 */
.search-toolbar {
  position: relative;
}

/* 端点选择器样式 */
.endpoint-selector-btn {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
  padding: 0 8px;
  min-width: auto;
  height: 32px;
}

.endpoint-selector-text {
  font-size: 14px;
}

.endpoint-menu {
  min-width: 280px;
}

.endpoint-menu .v-list-item {
  padding: 12px 16px;
}

.endpoint-menu .v-list-item-title {
  font-weight: 500;
  font-size: 14px;
}

.endpoint-menu .v-list-item-subtitle {
  margin-top: 2px;
  opacity: 0.7;
  font-size: 12px;
}

.toolbar-icon {
  margin: 0 4px;
}

/* 筛选菜单样式 */
.filter-menu {
  min-width: 280px;
  max-height: 600px;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.7);
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.author-card {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.author-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 122, 255, 0.3);
  transform: translateY(-2px);
}

.author-name {
  color: rgba(0, 122, 255, 0.9);
  transition: color 0.2s ease;
}

.author-card:hover .author-name {
  color: rgba(0, 122, 255, 1);
}
</style>
