<template>
  <div class="news-list-page">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>News 管理</span>
        <v-spacer />
        <v-btn variant="tonal" color="primary" @click="refresh" :loading="loading" prepend-icon="mdi-refresh">刷新</v-btn>
      </v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

        <v-row class="mb-3" align="center" dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="keyword"
              label="标题关键词"
              placeholder="输入标题关键词"
              clearable
              prepend-inner-icon="mdi-magnify"
              hide-details
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="状态"
              item-title="label"
              item-value="value"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="categoryFilter"
              :items="categories"
              item-title="name"
              item-value="id"
              label="分类"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select
              v-model="tagFilter"
              :items="tags"
              item-title="name"
              item-value="id"
              label="标签"
              density="comfortable"
              clearable
              hide-details
            />
          </v-col>
          <v-col cols="6" md="1" class="d-flex justify-end">
            <v-btn variant="text" color="grey" @click="clearFilters">清空</v-btn>
          </v-col>
        </v-row>

        <v-data-table
          :headers="headers"
          :items="filteredItems"
          :loading="loading"
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          v-model:sort-by="sortBy"
          item-key="id"
          class="elevation-1"
          density="comfortable"
        >
          <template #item.cover="{ item }">
            <v-img v-if="item.coverImage" :src="item.coverImage" width="72" height="48" cover class="rounded" />
            <v-avatar v-else size="40" color="grey-lighten-2"><v-icon icon="mdi-image-off" /></v-avatar>
          </template>

          <template #item.title="{ item }">
            <div class="d-flex flex-column">
              <div class="text-body-2 font-weight-medium">{{ item.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.slug || '-' }}</div>
            </div>
          </template>

          <template #item.category="{ item }">
            <v-chip v-if="item.newsCategory" size="small" color="primary" variant="tonal">{{ item.newsCategory.name }}</v-chip>
            <span v-else>-</span>
          </template>

          <template #item.tags="{ item }">
            <div class="tags-cell">
              <v-chip v-for="t in item.TagOfNews || []" :key="t.id" size="x-small" variant="tonal" color="secondary">{{ t.name }}</v-chip>
              <span v-if="!item.TagOfNews || item.TagOfNews.length === 0">-</span>
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip
              size="small"
              :color="item.status === 'published' ? 'success' : (item.status === 'draft' ? 'grey' : 'warning')"
              variant="elevated"
            >
              {{ item.status }}
            </v-chip>
          </template>

          <template #item.views="{ item }">
            <span>{{ item.views ?? 0 }}</span>
          </template>

          <template #item.likes="{ item }">
            <span>{{ item.likes ?? 0 }}</span>
          </template>

          <template #item.publishedAt="{ item }">
            <span>{{ formatDate(item.publishedAt || item.createdAt) }}</span>
          </template>

          <template #item.actions="{ item }">
            <v-btn icon size="small" variant="text" color="primary" @click="openDetail(item.id)">
              <v-icon icon="mdi-eye" />
            </v-btn>
            <v-btn v-if="userRole==='admin'" icon size="small" variant="text" color="secondary" @click="openEditById(item.id)">
              <v-icon icon="mdi-pencil" />
            </v-btn>
            <v-btn v-if="userRole==='admin'" icon size="small" variant="text" color="error" @click="askDelete(item)">
              <v-icon icon="mdi-delete" />
            </v-btn>
          </template>

          <template #no-data>
            <div class="text-medium-emphasis pa-6">暂无数据</div>
          </template>
        </v-data-table>

        <!-- 详情弹窗 -->
        <v-dialog v-model="detailDialog" max-width="1000">
          <v-card>
            <v-toolbar flat density="comfortable">
              <v-toolbar-title>{{ detailData?.title || '文章详情' }}</v-toolbar-title>
              <v-spacer />
              <v-btn v-if="userRole==='admin'" variant="text" color="primary" @click="openEditFromDetail">
                <v-icon icon="mdi-pencil" start />编辑内容
              </v-btn>
              <v-btn icon @click="detailDialog = false"><v-icon icon="mdi-close" /></v-btn>
            </v-toolbar>
            <v-divider />

            <v-progress-linear v-if="detailLoading" indeterminate color="primary" />

            <v-card-text v-if="!detailLoading" class="detail-body">
              <v-alert v-if="detailError" type="error" variant="tonal" class="mb-4">{{ detailError }}</v-alert>

              <div v-if="detailData">
                <div class="d-flex flex-wrap align-center mb-3" style="gap:8px">
                  <v-chip
                    size="small"
                    :color="detailData.status === 'published' ? 'success' : (detailData.status === 'draft' ? 'grey' : 'warning')"
                    variant="elevated"
                  >
                    {{ detailData.status }}
                  </v-chip>
                  <v-chip v-if="detailData.newsCategory" size="small" color="primary" variant="tonal">
                    {{ detailData.newsCategory.name }}
                  </v-chip>
                  <div class="d-flex flex-wrap" style="gap:6px">
                    <v-chip v-for="t in detailData.TagOfNews || []" :key="t.id" size="x-small" color="secondary" variant="tonal">{{ t.name }}</v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis ms-auto">
                    {{ formatDate(detailData.publishedAt || detailData.createdAt) }}
                  </div>
                </div>

                <v-img v-if="detailData.coverImage" :src="detailData.coverImage" class="mb-4 rounded" height="220" cover />

                <!-- 富文本内容（HTML） -->
                <div class="article-content" v-html="detailData.content"></div>
              </div>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- 编辑内容弹窗（仅正文） -->
        <v-dialog v-model="editDialog" max-width="1000">
          <v-card>
            <v-toolbar flat density="comfortable">
              <v-toolbar-title>编辑内容</v-toolbar-title>
              <v-spacer />
              <v-btn icon @click="editDialog = false"><v-icon icon="mdi-close" /></v-btn>
            </v-toolbar>
            <v-divider />
            <v-card-text>
              <v-alert v-if="editError" type="error" variant="tonal" class="mb-4">{{ editError }}</v-alert>
              <div v-if="editLoading" class="py-8">
                <v-progress-linear indeterminate color="primary" />
              </div>
              <div v-else>
                <v-row class="mb-4">
                  <v-col cols="12" sm="4">
                    <v-select
                      v-model="editingStatus"
                      :items="statusOptions"
                      item-title="label"
                      item-value="value"
                      label="状态"
                      density="comfortable"
                      :disabled="editingOriginalStatus === 'archived'"
                    />
                  </v-col>
                </v-row>
                <WangEditor v-model="editContent" />
              </div>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-spacer />
              <v-btn variant="text" @click="editDialog = false">取消</v-btn>
              <v-btn color="primary" :loading="savingContent" @click="saveContent">保存</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- 删除确认弹窗 -->
        <v-dialog v-model="showDeleteDialog" max-width="400px">
          <v-card>
            <v-card-title class="text-h6 font-weight-bold">确认删除</v-card-title>
            <v-card-text>
              <span>确定要删除 <strong>{{ itemToDelete?.title }}</strong> 吗？此操作不可撤销。</span>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="showDeleteDialog = false" :disabled="deleteLoading">取消</v-btn>
              <v-btn color="error" @click="handleDelete" :loading="deleteLoading" :disabled="deleteLoading">删除</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- 提示 -->
        <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2000">
          {{ snackbar.text }}
        </v-snackbar>
      </v-card-text>
    </v-card>
  </div>
  
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import dayjs from 'dayjs'
import { getNews, getNewsCategories, getNewsTags, getNewsById, updateNews, deleteNews } from '@/api/news.api'
import WangEditor from '@/components/WangEditor.vue'

const items = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'publishedAt', order: 'desc' }])
const error = ref('')

// 详情相关（只读）
const detailDialog = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const detailData = ref(null)

// 用户角色（用于控制编辑权限）
const userRole = (() => {
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return info.role || 'user'
  } catch { return 'user' }
})()

// 编辑内容（仅正文）
const editDialog = ref(false)
const editLoading = ref(false)
const editError = ref('')
const editContent = ref('')
const savingContent = ref(false)
const editingId = ref(null)
const editingStatus = ref(null)
const editingOriginalStatus = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

// 删除相关
const showDeleteDialog = ref(false)
const deleteLoading = ref(false)
const itemToDelete = ref(null)

// 筛选与选项
const statusOptions = [
  { label: '已发布', value: 'published' },
  { label: '草稿', value: 'draft' },
  { label: '已归档', value: 'archived' },
]
const statusFilter = ref(null)
const categoryFilter = ref(null)
const tagFilter = ref(null)
const keyword = ref('')
const categories = ref([])
const tags = ref([])

const headers = [
  { title: '封面', key: 'cover', sortable: false, width: 100 },
  { title: '标题', key: 'title', sortable: true },
  { title: '分类', key: 'category', sortable: false, width: 120 },
  { title: '标签', key: 'tags', sortable: false, width: 220 },
  { title: '状态', key: 'status', sortable: false, width: 100 },
  { title: '浏览', key: 'views', sortable: true, width: 90 },
  { title: '点赞', key: 'likes', sortable: true, width: 90 },
  { title: '发布时间', key: 'publishedAt', sortable: true, width: 160 },
  { title: '操作', key: 'actions', sortable: false, width: 120 },
]

// 客户端过滤（关键字、状态、分类、标签）与排序/分页均在前端完成
const filteredItems = computed(() => {
  const arr = Array.isArray(items.value) ? items.value : []
  const kw = (keyword.value || '').trim().toLowerCase()

  const statusVal = statusFilter.value || null
  const categoryIdVal = normalizeId(categoryFilter.value)
  const tagIdVal = normalizeId(tagFilter.value)

  return arr.filter(it => {
    // 关键字匹配
    let kwOk = true
    if (kw) {
      const title = String(it.title || '').toLowerCase()
      const slug = String(it.slug || '').toLowerCase()
      const summary = String(it.summary || '').toLowerCase()
      const categoryName = String(it.newsCategory?.name || '').toLowerCase()
      const tagText = (it.TagOfNews || []).map(t => String(t.name || '').toLowerCase()).join(' ')
      kwOk = (
        title.includes(kw) ||
        slug.includes(kw) ||
        summary.includes(kw) ||
        categoryName.includes(kw) ||
        tagText.includes(kw)
      )
    }

    // 状态匹配
    const statusOk = statusVal ? (it.status === statusVal) : true
    // 分类匹配（优先 newsCategory.id，其次 categoryId 字段）
    const cid = it.newsCategory?.id ?? it.categoryId
    const categoryOk = categoryIdVal != null ? (String(cid) === String(categoryIdVal)) : true
    // 标签匹配（TagOfNews.*.id 或 *.tagId）
    const tagOk = tagIdVal != null ? ((it.TagOfNews || []).some(t => String(t.id ?? t.tagId) === String(tagIdVal))) : true

    return kwOk && statusOk && categoryOk && tagOk
  })
})

function formatDate(val) {
  if (!val) return '-'
  return dayjs(val).format('YYYY-MM-DD HH:mm')
}

// 排序在前端处理，无需映射到 API

function extractArray(res) {
  const d = res?.data ?? {}
  if (Array.isArray(d)) return d
  const arr = d.items || d.data || d.list || d.results
  return Array.isArray(arr) ? arr : []
}

// 将可能的对象/字符串/数字统一拿到 id
function normalizeId(v) {
  if (v === null || v === undefined || v === '') return undefined
  if (typeof v === 'object') return v.id ?? v.categoryId ?? v.tagId ?? v.value ?? v.key
  return v
}

async function loadFilterOptions() {
  try {
    const [catsRes, tagsRes] = await Promise.all([
      getNewsCategories(),
      getNewsTags()
    ])
    categories.value = extractArray(catsRes).map(x => ({
      id: x?.id ?? x?.categoryId ?? x?.value ?? x?.key,
      name: x?.name ?? x?.title ?? x?.label ?? x?.text ?? String(x?.id ?? x?.categoryId ?? '')
    }))
    tags.value = extractArray(tagsRes).map(x => ({
      id: x?.id ?? x?.tagId ?? x?.value ?? x?.key,
      name: x?.name ?? x?.title ?? x?.label ?? x?.text ?? String(x?.id ?? x?.tagId ?? '')
    }))
  } catch (e) {
    console.error(e)
  }
}

async function loadList() {
  // 客户端数据表：一次性加载所有页（依据当前筛选），后续分页/排序/搜索都在前端完成
  loading.value = true
  error.value = ''
  try {
    const pageSize = 50
    let curPage = 1
    let totalPages = 1
    const all = []
    const baseParams = {
      pageSize,
      // 为了稳定性，按发布时间倒序获取，前端可再排序
      sortBy: 'publishedAt',
      sortOrder: 'DESC',
      // 纯前端过滤，这里不向后端传递筛选条件
    }
    while (true) {
      const res = await getNews({ ...baseParams, page: curPage })
      const d = res?.data ?? {}
      const arr = d.items || d.data?.items || []
      if (Array.isArray(arr) && arr.length) all.push(...arr)
      const ti = d.totalItems ?? d.total ?? d.count ?? all.length
      totalPages = (d.totalPages ?? Math.ceil(ti / pageSize)) || 1;
      // 兼容后端未返回总条数/总页数的情况：当返回条数不足一页时停止
      if (!Array.isArray(arr) || arr.length < pageSize) break
      if (curPage >= totalPages) break
      curPage += 1
    }
    items.value = all
    total.value = all.length
  } catch (e) {
    console.error(e)
    error.value = e?.response?.data?.msg || '加载失败'
  } finally {
    loading.value = false
  }
}

function refresh() { loadList() }

function clearFilters() {
  statusFilter.value = null
  categoryFilter.value = null
  tagFilter.value = null
  keyword.value = ''
  page.value = 1
  loadList()
}

// 监听筛选变化（前端过滤，仅重置页码，不请求后端）
watch([statusFilter, categoryFilter, tagFilter], () => {
  page.value = 1
})

// 分页与排序均在前端进行，无需向服务端请求
watch(itemsPerPage, () => { page.value = 1 })

// 关键字仅本地过滤
watch(keyword, () => { page.value = 1 })

async function openDetail(id) {
  if (!id) return
  detailDialog.value = true
  detailLoading.value = true
  detailError.value = ''
  detailData.value = null
  try {
    const res = await getNewsById(id)
    const d = res?.data
    detailData.value = d?.data || d?.item || d || null
  } catch (e) {
    console.error(e)
    detailError.value = e?.response?.data?.msg || '获取失败'
  } finally {
    detailLoading.value = false
  }
}

// 打开编辑（从表格图标）
async function openEditById(id) {
  if (userRole !== 'admin') return
  if (!id) return
  editDialog.value = true
  editLoading.value = true
  editError.value = ''
  editContent.value = ''
  editingId.value = id
  try {
    const res = await getNewsById(id)
    const d = res?.data?.data || res?.data?.item || res?.data || null
    if (!d) throw new Error('未获取到详情')
    editContent.value = d.content || ''
    editingStatus.value = d.status || null
    editingOriginalStatus.value = d.status || null
  } catch (e) {
    console.error(e)
    editError.value = e?.response?.data?.msg || e?.message || '加载失败'
  } finally {
    editLoading.value = false
  }
}

// 打开编辑（从详情弹窗）
function openEditFromDetail() {
  if (userRole !== 'admin') return
  const d = detailData.value
  if (!d?.id) return
  editDialog.value = true
  editLoading.value = false
  editError.value = ''
  editingId.value = d.id
  editContent.value = d.content || ''
  editingStatus.value = d.status || null
  editingOriginalStatus.value = d.status || null
}

// 询问删除
function askDelete(item) {
  if (userRole !== 'admin') return
  itemToDelete.value = item
  showDeleteDialog.value = true
}

// 执行删除
async function handleDelete() {
  if (userRole !== 'admin') return
  const id = itemToDelete.value?.id
  if (!id) { showDeleteDialog.value = false; return }
  deleteLoading.value = true
  try {
    await deleteNews(id)
    // 本地移除已删除项
    items.value = (items.value || []).filter(it => it.id !== id)
    total.value = items.value.length
    // 若当前页因删除变空，且存在上一页，则回退一页
    if (filteredItems.value.length === 0 && page.value > 1) {
      page.value = page.value - 1
    }
    // 若详情弹窗打开且为同一条，关闭
    if (detailDialog.value && detailData.value?.id === id) {
      detailDialog.value = false
    }
    snackbar.value = { show: true, text: '删除成功', color: 'success' }
  } catch (e) {
    console.error(e)
    snackbar.value = { show: true, text: (e?.response?.data?.msg || '删除失败'), color: 'error' }
  } finally {
    deleteLoading.value = false
    showDeleteDialog.value = false
    itemToDelete.value = null
  }
}

// 保存正文内容
async function saveContent() {
  if (userRole !== 'admin') return
  if (!editingId.value) return
  savingContent.value = true
  editError.value = ''
  try {
    const fd = new FormData()
    fd.append('content', editContent.value || '')
    // 归档为只读：原始状态为 archived 时不允许变更状态
    if (editingOriginalStatus.value !== 'archived') {
      // 若选择了新状态则一并提交
      if (editingStatus.value) fd.append('status', editingStatus.value)
    }
    const resp = await updateNews(editingId.value, fd)
    // 本地乐观更新：更新当前项与详情（若打开）
    const id = editingId.value
    const nextStatus = editingOriginalStatus.value === 'archived' ? editingOriginalStatus.value : (editingStatus.value || editingOriginalStatus.value)
    items.value = (items.value || []).map(it => it.id === id ? { ...it, status: nextStatus } : it)
    if (detailDialog.value && detailData.value?.id === id) {
    console.log(editContent.value);
    
      detailData.value = { ...detailData.value, content: editContent.value, status: nextStatus }
    }
    snackbar.value = { show: true, text: '保存成功', color: 'success' }
    editDialog.value = false
  } catch (e) {
    console.error(e)
    editError.value = e?.response?.data?.msg || '保存失败'
    snackbar.value = { show: true, text: editError.value, color: 'error' }
  } finally {
    savingContent.value = false
  }
}

onMounted(async () => {
  await loadFilterOptions()
  await loadList()
})
</script>

<style lang="scss" scoped>
.news-list-page {
  padding: 8px;
}
.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.detail-body {
  max-height: 70vh;
  overflow: auto;
}
/* 文章内容渲染样式 */
.article-content {
  font-size: 14px;
  line-height: 1.8;
}
.article-content :deep(img) {
  max-width: 100%;
  height: auto;
}
.article-content :deep(pre) {
  padding: 12px;
  background: #f6f6f7;
  overflow: auto;
}
.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3),
.article-content :deep(h4),
.article-content :deep(h5) {
  margin: 16px 0 8px;
}
.article-content :deep(p) { margin: 8px 0; }
</style>