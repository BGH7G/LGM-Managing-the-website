<script setup>
import { ref, onMounted } from 'vue'
import { getPublications, getPublicationById, createPublication, updatePublication, deletePublication,
  getAuthors, createAuthor, updateAuthor,
  getKeywords, createKeyword, updateKeyword,
  getVenues, createVenue, updateVenue,
  getTypes, createType, updateType,
  getCategories, createCategory, updateCategory } from '@/api/publish.api.js'

// 响应式数据
const publications = ref([])
const loading = ref(false)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = 10

// 详情弹窗相关
const detailDialog = ref(false)
const detailLoading = ref(false)
const detail = ref(null)

// 编辑状态
const isEditing = ref(false)
let currentPubId = null

// 表头定义
const headers = [
  { title: '标题', value: 'title', sortable: false },
  { title: '年份', value: 'year', width: '90px' },
  { title: '期刊/会议', value: 'venueDisplay', sortable: false },
  { title: '类型', value: 'typeDisplay', sortable: false },
  { title: '引用量', value: 'citations', width: '90px' },
  { title: 'DOI', value: 'doi', sortable: false }
]

// 获取出版物数据
const fetchPublications = async () => {
  loading.value = true
  try {
    const response = await getPublications({
      page: currentPage.value,
      pageSize,
      sortBy: 'year',
      sortOrder: 'DESC'
    })

    if (response.data.success) {
      publications.value = response.data.items.map(p=>({
        ...p,
        venueDisplay: p.Venue?.abbreviation || p.Venue?.name || '-',
        typeDisplay: p.PublicationType?.name || '-',
      }))
      totalItems.value = response.data.totalItems
      totalPages.value = response.data.totalPages
      currentPage.value = response.data.currentPage
    }
  } catch (error) {
    console.error('获取出版物数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 打开详情弹窗
const openDetailDialog = async (_, { item }) => {
  detailDialog.value = true
  detailLoading.value = true
  detail.value = null
  try {
    const res = await getPublicationById(item.id)
    if (res.data.success) {
      detail.value = res.data.data
    }
  } catch (err) {
    console.error('获取出版物详情失败:', err)
  } finally {
    detailLoading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchPublications()
})

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchPublications()
}

// 用户角色
const userRole = (() => {
  try {
    const info = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return info.role || 'user'
  } catch { return 'user' }
})()

// ===== 资源列表 =====
const authors = ref([])
const keywords = ref([])
const venues = ref([])
const types = ref([])
const categories = ref([])

// ===== 表单 =====
const pubDialog = ref(false)
const pubForm = ref({
  title: '',
  abstract: '',
  year: new Date().getFullYear(),
  citations: 0,
  doi: '',
  pdfUrl: '',
  codeUrl: '',
  VenueId: null,
  PublicationTypeId: null,
  ResearchCategoryId: null,
  AuthorIds: [],
  KeywordIds: []
})

const authorOrder = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const fetchSubResources = async () => {
  const resps = await Promise.all([
    getAuthors(),
    getKeywords(),
    getVenues(),
    getTypes(),
    getCategories()
  ])
  console.log(resps)
  if (resps[0].data.success) authors.value = resps[0].data.data
  if (resps[1].data.success) keywords.value = resps[1].data.data
  if (resps[2].data.success) venues.value = resps[2].data.data
  if (resps[3].data.success) types.value = resps[3].data.data
  if (resps[4].data.success) categories.value = resps[4].data.data
}

onMounted(() => {
  fetchPublications()
  if (userRole === 'admin') fetchSubResources()
})

// ===== 新增资源辅助 =====
async function handleCreateResource(kind, name) {
  try {
    let resp
    switch (kind) {
      case 'author': resp = await createAuthor({ name }); break
      case 'keyword': resp = await createKeyword({ name }); break
      case 'venue': resp = await createVenue({ name }); break
      case 'type': resp = await createType({ name }); break
      case 'category': resp = await createCategory({ name }); break
    }
    if (resp?.data.success) {
      await fetchSubResources()
      snackbar.value = { show: true, text: `${kind} 已创建`, color: 'success' }
    }
  } catch (e) {
    console.error('创建失败', e)
    snackbar.value = { show: true, text: '创建失败', color: 'error' }
  }
}

async function handleUpdateResource(kind, id, name) {
  try {
    let resp
    switch (kind) {
      case 'author': resp = await updateAuthor(id,{ name }); break
      case 'keyword': resp = await updateKeyword(id,{ name }); break
      case 'venue': resp = await updateVenue(id,{ name }); break
      case 'type': resp = await updateType(id,{ name }); break
      case 'category': resp = await updateCategory(id,{ name }); break
    }
    if (resp?.data.success) {
      await fetchSubResources()
      snackbar.value = { show: true, text: `${kind} 已更新`, color: 'success' }
    }
  } catch(e){
    console.error('更新失败', e); snackbar.value={show:true,text:'更新失败',color:'error'} }
}

// 资源新增对话框
const addResDialog = ref(false)
const resDialogMode = ref('add')
const editingResId = ref(null)
const addResKind = ref('')
const newResName = ref('')

function openAddResource(kind) {
  resDialogMode.value = 'add'
  addResKind.value = kind
  newResName.value = ''
  addResDialog.value = true
}

function openEditResource(kind) {
  const idMap = {
    author: pubForm.value.AuthorIds[0], // unused
    keyword: pubForm.value.KeywordIds[0],
    venue: pubForm.value.VenueId,
    type: pubForm.value.PublicationTypeId,
    category: pubForm.value.ResearchCategoryId
  }
  const listMap = { author: authors.value, keyword: keywords.value, venue: venues.value, type: types.value, category: categories.value }
  editingResId.value = idMap[kind]
  if (!editingResId.value) return
  const item = listMap[kind].find(i=>i.id===editingResId.value)
  if (!item) return
  resDialogMode.value = 'edit'
  addResKind.value = kind
  newResName.value = item.name
  addResDialog.value = true
}

async function confirmAddResource() {
  if (!newResName.value.trim()) return
  if (resDialogMode.value==='add') {
    await handleCreateResource(addResKind.value, newResName.value.trim())
  } else {
    await handleUpdateResource(addResKind.value, editingResId.value, newResName.value.trim())
  }
  addResDialog.value = false
  resDialogMode.value = 'add'
}

// 提交出版物
const submitting = ref(false)
const submitPublication = async () => {
  submitting.value = true
  try {
    // 将前端字段映射为后端期望的字段名
    // 保留原有 PascalCase 字段（如 VenueId 等），仅新增 authors/keywords，避免破坏现有可用字段
    const payload = {
      ...pubForm.value,
      authors: Array.isArray(pubForm.value.AuthorIds) ? pubForm.value.AuthorIds.map(Number) : [],
      keywords: Array.isArray(pubForm.value.KeywordIds) ? pubForm.value.KeywordIds.map(Number) : []
    }
    
    let resp
    if (isEditing.value) {
      resp = await updatePublication(currentPubId, payload)
    } else {
      resp = await createPublication(payload)
    }
    if (resp.data.success) {
      pubDialog.value = false
      snackbar.value = { show: true, text: isEditing.value ? '更新成功' : '创建成功', color: 'success' }
      isEditing.value = false
      currentPubId = null
      fetchPublications()
      Object.assign(pubForm.value, {
        title: '', abstract: '', year: new Date().getFullYear(), citations: 0, doi: '', pdfUrl: '', codeUrl: '',
        VenueId: null, PublicationTypeId: null, ResearchCategoryId: null, AuthorIds: [], KeywordIds: [] })
      authorOrder.value = []
    }
  } catch (e) {
    console.error('创建出版物失败', e)
    snackbar.value = { show: true, text: '创建失败', color: 'error' }
  } finally { submitting.value = false }
}

function openEdit() {
  if (!detail.value) return
  isEditing.value = true
  currentPubId = detail.value.id
  Object.assign(pubForm.value, {
    title: detail.value.title,
    abstract: detail.value.abstract || '',
    year: detail.value.year,
    citations: detail.value.citations || 0,
    doi: detail.value.doi || '',
    pdfUrl: detail.value.pdfUrl || '',
    codeUrl: detail.value.codeUrl || '',
    VenueId: detail.value.VenueId,
    PublicationTypeId: detail.value.PublicationTypeId,
    ResearchCategoryId: detail.value.ResearchCategoryId,
    AuthorIds: detail.value.Authors ? detail.value.Authors.map(a=>a.id) : [],
    KeywordIds: detail.value.Keywords ? detail.value.Keywords.map(k=>k.id) : []
  })
  authorOrder.value = [...pubForm.value.AuthorIds]
  detailDialog.value = false
  pubDialog.value = true
}

// 删除相关
const confirmDeleteDialog = ref(false)

function openDelete() {
  confirmDeleteDialog.value = true
}

async function handleDelete() {
  if (!detail.value) return
  try {
    await deletePublication(detail.value.id)
    snackbar.value = { show: true, text: '删除成功', color: 'success' }
    confirmDeleteDialog.value = false
    detailDialog.value = false
    fetchPublications()
  } catch (e) {
    console.error('删除失败', e)
    snackbar.value = { show: true, text: '删除失败', color: 'error' }
  }
}
function handleAuthorSelect(value) {
  const next = Array.isArray(value) ? value : []
  const kept = authorOrder.value.filter(id => next.includes(id))
  const added = next.filter(id => !authorOrder.value.includes(id))
  authorOrder.value = [...kept, ...added]
  pubForm.value.AuthorIds = [...authorOrder.value]
}

</script>

<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="text-h5">出版物列表
        <v-spacer/>
        <v-btn
            v-if="userRole==='admin'"
            color="primary"
            prepend-icon="mdi-plus"
            @click="pubDialog=true">新增出版物</v-btn>
      </v-card-title>
      <v-card-text>
        <!-- 数据表 -->
        <v-data-table
            :headers="headers"
            :items="publications"
            :loading="loading"
            :items-per-page="pageSize"
            loading-text="加载中..."
            no-data-text="暂无数据"
            class="elevation-1"
            @click:row="openDetailDialog"
        />

        <!-- 分页 -->
        <v-row v-if="totalPages > 1" class="mt-4">
          <v-col cols="12" class="d-flex justify-center">
            <v-pagination
                v-model="currentPage"
                :length="totalPages"
                @update:model-value="handlePageChange"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 详情对话框 -->
    <v-dialog v-model="detailDialog" max-width="500px">
      <v-card>
        <v-card-title class="primary white--text py-2 d-flex justify-center">
          <span class="text-h4 font-weight-bold mt-2">出版物详情</span>
        </v-card-title>
        <v-card-text class="pt-2">
          <v-progress-linear v-if="detailLoading" indeterminate color="primary" />
          <template v-else-if="detail">
            <v-container class="py-0">
              <v-row dense>
                <v-col cols="12" class="py-1">
                  <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">基本信息</v-subheader>
                  <v-divider class="my-1"></v-divider>
                </v-col>
                <v-col cols="12" class="py-0">
                  <v-list density="compact" class="py-0">
                    <v-list-item title="标题" :subtitle="detail.title" class="py-1" />
                    <v-list-item title="摘要" class="py-1">
                      <template #subtitle>
                        <div style="white-space: pre-wrap">{{ detail.abstract }}</div>
                      </template>
                    </v-list-item>
                    <v-list-item title="年份" :subtitle="String(detail.year)" class="py-1" />
                    <v-list-item title="引用量" :subtitle="String(detail.citations)" class="py-1" />
                    <v-list-item title="DOI" :subtitle="detail.doi" class="py-1" />
                    <v-list-item v-if="detail.pdfUrl" title="PDF" :subtitle="detail.pdfUrl" class="py-1" />
                    <v-list-item v-if="detail.codeUrl" title="代码" :subtitle="detail.codeUrl" class="py-1" />
                  </v-list>
                </v-col>

                <v-col cols="12" class="py-1">
                  <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">分类信息</v-subheader>
                  <v-divider class="my-1"></v-divider>
                </v-col>
                <v-col cols="12" class="py-0">
                  <v-list density="compact" class="py-0">
                    <v-list-item title="类型" :subtitle="detail.PublicationType?.name" class="py-1" />
                    <v-list-item title="期刊/会议" :subtitle="detail.Venue?.name" class="py-1" />
                    <v-list-item title="研究领域" :subtitle="detail.ResearchCategory?.name" class="py-1" />
                  </v-list>
                </v-col>

                <v-col cols="12" class="py-1">
                  <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">作者与关键词</v-subheader>
                  <v-divider class="my-1"></v-divider>
                </v-col>
                <v-col cols="12" class="py-0">
                  <v-list density="compact" class="py-0">
                    <v-list-item title="作者" class="py-1">
                      <template #subtitle>
                        <v-chip
                          v-for="a in detail.Authors"
                          :key="a.id"
                          class="ma-1"
                          color="primary"
                          variant="tonal"
                          size="small"
                        >
                          {{ a.name }}
                        </v-chip>
                      </template>
                    </v-list-item>
                    <v-list-item title="关键词" class="py-1">
                      <template #subtitle>
                        <v-chip
                          v-for="k in detail.Keywords"
                          :key="k.id"
                          class="ma-1"
                          color="secondary"
                          variant="tonal"
                          size="small"
                        >
                          {{ k.name }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-col>

                <v-col cols="12" class="py-1" v-if="detail.createdAt || detail.updatedAt">
                  <v-subheader class="font-weight-bold pl-0 py-1 d-flex justify-center text-h5">时间信息</v-subheader>
                  <v-divider class="my-1"></v-divider>
                </v-col>
                <v-col cols="12" class="py-0" v-if="detail.createdAt || detail.updatedAt">
                  <v-list density="compact" class="py-0">
                    <v-list-item v-if="detail.createdAt" title="创建时间" :subtitle="new Date(detail.createdAt).toLocaleString()" class="py-1" />
                    <v-list-item v-if="detail.updatedAt" title="更新时间" :subtitle="new Date(detail.updatedAt).toLocaleString()" class="py-1" />
                  </v-list>
                </v-col>
              </v-row>
            </v-container>
          </template>
          <template v-else>加载失败，请重试。</template>
        </v-card-text>
        <v-card-actions class="px-4 pb-2">
          <v-spacer></v-spacer>
          <v-btn class="mb-2 ml-2" v-if="userRole==='admin'" color="teal-darken-3" variant="elevated" @click="openEdit" small>编辑</v-btn>
          <v-btn class="mb-2 ml-2" v-if="userRole==='admin'" color="error" variant="elevated" @click="openDelete" small>删除</v-btn>
          <v-btn class="mb-2 ml-2" color="primary" variant="elevated" @click="detailDialog = false" small>关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增出版物对话框 -->
    <v-dialog v-model="pubDialog" max-width="800px">
      <v-card class="pa-4">
        <v-card-title class="py-2 text-h6 font-weight-bold">{{ isEditing ? '编辑出版物' : '新增出版物' }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="8">
              <v-text-field v-model="pubForm.title" label="标题" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="pubForm.year" label="年份" type="number" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="pubForm.abstract" label="摘要" rows="3" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="pubForm.citations" label="引用量" type="number" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="pubForm.doi" label="DOI" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="pubForm.pdfUrl" label="PDF 链接" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="pubForm.codeUrl" label="代码链接" variant="outlined" density="compact" class="mb-3" />
            </v-col>
            <!-- 关联选择 -->
            <v-col cols="12" sm="4">
              <v-select :items="types" item-title="name" item-value="id" v-model="pubForm.PublicationTypeId" label="类型" chips variant="outlined" density="compact" class="mb-3">
                <template #append>
                  <v-btn icon="mdi-pencil" size="x-small" v-if="pubForm.PublicationTypeId" @click="openEditResource('type')"/>
                  <v-btn icon="mdi-plus" size="x-small" @click="openAddResource('type')"/>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select :items="venues" item-title="name" item-value="id" v-model="pubForm.VenueId" label="期刊/会议" chips variant="outlined" density="compact" class="mb-3">
                <template #append>
                  <v-btn icon="mdi-pencil" size="x-small" v-if="pubForm.VenueId" @click="openEditResource('venue')"/>
                  <v-btn icon="mdi-plus" size="x-small" @click="openAddResource('venue')"/>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select :items="categories" item-title="name" item-value="id" v-model="pubForm.ResearchCategoryId" label="研究分类" chips variant="outlined" density="compact" class="mb-3">
                <template #append>
                  <v-btn icon="mdi-pencil" size="x-small" v-if="pubForm.ResearchCategoryId" @click="openEditResource('category')"/>
                  <v-btn icon="mdi-plus" size="x-small" @click="openAddResource('category')"/>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                :items="authors"
                item-title="name"
                item-value="id"
                v-model="pubForm.AuthorIds"
                @update:model-value="handleAuthorSelect"
                label="作者"
                multiple
                chips
                variant="outlined"
                density="compact"
                class="mb-3"
              >
                <template #append>
                  <v-btn icon="mdi-plus" size="x-small" @click="openAddResource('author')"/>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select :items="keywords" item-title="name" item-value="id" v-model="pubForm.KeywordIds" label="关键词" multiple chips variant="outlined" density="compact" class="mb-3">
                <template #append>
                  <v-btn icon="mdi-pencil" size="x-small" v-if="pubForm.KeywordIds && pubForm.KeywordIds.length" @click="openEditResource('keyword')"/>
                  <v-btn icon="mdi-plus" size="x-small" @click="openAddResource('keyword')"/>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="pubDialog=false">取消</v-btn>
          <v-btn :loading="submitting" color="primary" @click="submitPublication">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增子资源对话框 -->
    <v-dialog v-model="addResDialog" max-width="400px">
      <v-card>
        <v-card-title class="py-2 text-h6 font-weight-bold">{{ resDialogMode==='add' ? '新增' : '编辑' }}{{ addResKind }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="newResName" label="名称" autofocus variant="outlined" density="compact" class="mb-3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="addResDialog=false">取消</v-btn>
          <v-btn color="primary" @click="confirmAddResource">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="confirmDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>您确定要删除吗？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDeleteDialog=false">取消</v-btn>
          <v-btn color="error" @click="handleDelete">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<style scoped>

</style>