<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import WangEditor from '@/components/WangEditor.vue'
import {
  getNews,
  getNewsCategories,
  getNewsTags,
  createNewsCategory,
  createNewsTag,
  createNews
} from '@/api/news.api'

// 富文本内容（对应后端 News.content）
const content = ref('')

// 表单与校验
const formRef = ref(null)
const valid = ref(false)

// 表单数据
const form = reactive({
  title: '',
  slug: '',
  summary: '',
  categoryId: null,
  tagIds: [],
  relatedIds: [],
  coverFile: null,
  status: 'draft', // 默认草稿
})

// 资源数据
const categories = ref([])
const tags = ref([])
const relatedOptions = ref([])

// 新建分类/标签
const newCategoryName = ref('')
const newTagName = ref('')

// UI 状态
const loading = ref(false)
const snackbar = ref(false)
const message = ref('')
const messageColor = ref('success')
const coverPreview = ref('')

// 规则
const rules = {
  required: v => (v !== undefined && v !== null && String(v).trim().length > 0) || '必填',
}

// slug 自动生成（允许手改）
const slugTouched = ref(false)
watch(() => form.title, (val) => {
  if (!slugTouched.value) form.slug = genSlug(val)
})
function onSlugInput() { slugTouched.value = true }

function genSlug(input) {
  const base = String(input || '').toLowerCase().trim()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // 若全为非拉丁字符导致为空，或最终为空，追加时间戳保证可用
  const slug = base || `news-${Date.now()}`
  return slug
}

// 从 axios 响应中尽量提取数组
function extractList(res) {
  const d = res?.data ?? {}
  if (Array.isArray(d)) return d
  const candidates = [d.data, d.rows, d.items, d.list, d.result, d.results]
  for (const c of candidates) if (Array.isArray(c)) return c
  return []
}

async function loadMeta() {
  try {
    const [catsRes, tagsRes, relRes] = await Promise.all([
      getNewsCategories(),
      getNewsTags(),
      getNews({ page: 1, pageSize: 100, sortBy: 'publishedAt', sortOrder: 'DESC' })
    ])
    categories.value = extractList(catsRes)
    tags.value = extractList(tagsRes)
    relatedOptions.value = extractList(relRes)
  } catch (e) {
    console.error(e)
  }
}

onMounted(loadMeta)

function onCoverChange(files) {
  // 释放旧预览
  if (coverPreview.value) {
    URL.revokeObjectURL(coverPreview.value)
    coverPreview.value = ''
  }
  // Vuetify v-file-input v-model 可能返回 File[] 或 null
  if (Array.isArray(files)) form.coverFile = files[0] || null
  else form.coverFile = files || null
  // 生成新预览
  if (form.coverFile instanceof File) {
    coverPreview.value = URL.createObjectURL(form.coverFile)
  }
}

onBeforeUnmount(() => {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
})

// 限制相关文章最多两个，保留最新的两个
watch(() => form.relatedIds, (val) => {
  if (Array.isArray(val) && val.length > 2) {
    form.relatedIds = val.slice(-2)
  }
}, { deep: true })

function resetForm() {
  form.title = ''
  form.slug = ''
  form.summary = ''
  form.categoryId = null
  form.tagIds = []
  form.relatedIds = []
  form.coverFile = null
  form.status = 'draft'
  content.value = ''
  slugTouched.value = false
  if (coverPreview.value) {
    URL.revokeObjectURL(coverPreview.value)
    coverPreview.value = ''
  }
}

async function handleSubmit(targetStatus = 'draft') {
  // 校验必填：title、summary
  const r = await formRef.value?.validate?.()
  if (r && r.valid === false) return

  loading.value = true
  try {
    const fd = new FormData()
    fd.append('title', form.title)
    fd.append('slug', form.slug || genSlug(form.title))
    fd.append('summary', form.summary)
    fd.append('content', content.value || '')
    if (form.categoryId !== null && form.categoryId !== '' && form.categoryId !== undefined) {
      fd.append('categoryId', form.categoryId)
    }
    fd.append('status', targetStatus)
    if (Array.isArray(form.tagIds)) form.tagIds.forEach(id => fd.append('tagIds', id))
    if (Array.isArray(form.relatedIds)) form.relatedIds.forEach(id => fd.append('relatedIds', id))
    if (form.coverFile) fd.append('cover', form.coverFile)

    await createNews(fd)
    message.value = targetStatus === 'published' ? '发布成功' : '草稿已保存'
    messageColor.value = 'success'
    snackbar.value = true
    resetForm()
  } catch (e) {
    console.error(e)
    message.value = e?.response?.data?.msg || '提交失败'
    messageColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

async function addCategory() {
  if (!newCategoryName.value.trim()) return
  try {
    const payload = { name: newCategoryName.value.trim(), slug: genSlug(newCategoryName.value) }
    const res = await createNewsCategory(payload)
    await loadMeta()
    const created = res?.data?.data || res?.data
    if (created?.id) form.categoryId = created.id
    newCategoryName.value = ''
    message.value = '分类已创建'
    messageColor.value = 'success'
    snackbar.value = true
  } catch (e) {
    console.error(e)
    message.value = e?.response?.data?.msg || '创建分类失败'
    messageColor.value = 'error'
    snackbar.value = true
  }
}

async function addTag() {
  if (!newTagName.value.trim()) return
  try {
    const payload = { name: newTagName.value.trim(), slug: genSlug(newTagName.value) }
    const res = await createNewsTag(payload)
    await loadMeta()
    const created = res?.data?.data || res?.data
    if (created?.id) form.tagIds = Array.from(new Set([...(form.tagIds || []), created.id]))
    newTagName.value = ''
    message.value = '标签已创建'
    messageColor.value = 'success'
    snackbar.value = true
  } catch (e) {
    console.error(e)
    message.value = e?.response?.data?.msg || '创建标签失败'
    messageColor.value = 'error'
    snackbar.value = true
  }
}
</script>

<template>
  <div class="news-editor-page">
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="8">
          <div class="editor-wrap">
            <WangEditor v-model="content" />
          </div>
        </v-col>
        <v-col cols="12" md="4">
          <v-card class="sticky-card">
            <v-card-title class="text-h6">文章信息</v-card-title>
            <v-card-text>
              <v-form ref="formRef" v-model="valid">
                <v-text-field
                  v-model="form.title"
                  label="标题*"
                  :rules="[rules.required]"
                  clearable
                  class="mb-2"
                />

                <v-text-field
                  v-model="form.slug"
                  label="Slug（自动生成，可修改）"
                  hint="若不填将基于标题自动生成"
                  @update:model-value="onSlugInput"
                  clearable
                  class="mb-2"
                />

                <v-textarea
                  v-model="form.summary"
                  label="摘要*"
                  :rules="[rules.required]"
                  auto-grow
                  rows="3"
                  clearable
                  class="mb-4"
                />

                <v-select
                  v-model="form.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="分类"
                  clearable
                  class="mb-2"
                />

                <div class="d-flex gap-2 mb-4">
                  <v-text-field v-model="newCategoryName" label="新建分类名称" hide-details class="flex-1" />
                  <v-btn color="secondary" @click="addCategory">新增分类</v-btn>
                </div>

                <v-select
                  v-model="form.tagIds"
                  :items="tags"
                  item-title="name"
                  item-value="id"
                  label="标签"
                  clearable
                  chips
                  multiple
                  class="mb-2"
                />

                <div class="d-flex gap-2 mb-4">
                  <v-text-field v-model="newTagName" label="新建标签名称" hide-details class="flex-1" />
                  <v-btn color="secondary" @click="addTag">新增标签</v-btn>
                </div>

                <v-select
                  v-model="form.relatedIds"
                  :items="relatedOptions"
                  :item-title="item => item?.title || item?.slug || ('#' + item?.id)"
                  item-value="id"
                  label="相关文章（最多选择2个）"
                  multiple
                  chips
                  clearable
                  class="mb-4"
                />

                <v-file-input
                  label="封面（可选）"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  show-size
                  @update:model-value="onCoverChange"
                  class="mb-2"
                />
                <v-img
                  v-if="coverPreview"
                  :src="coverPreview"
                  max-height="160"
                  class="mb-4"
                  cover
                />
              </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions>
              <v-spacer />
              <v-btn :loading="loading" color="grey" @click="handleSubmit('draft')">保存草稿</v-btn>
              <v-btn :loading="loading" color="primary" @click="handleSubmit('published')">发布</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-snackbar v-model="snackbar" :color="messageColor" timeout="3000">{{ message }}</v-snackbar>
    </v-container>
  </div>
</template>

<style scoped>
.news-editor-page {
  padding-bottom: 24px;
}
.editor-wrap {
  border: 1px dashed transparent;
}
.sticky-card {
  position: sticky;
  top: 16px;
}
.gap-2 { gap: 8px; }
.flex-1 { flex: 1; }
</style>