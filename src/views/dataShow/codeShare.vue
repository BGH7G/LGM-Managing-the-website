<template>
  <v-container fluid class="pa-6">
    <!-- 页面标题 -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-2">
          <v-icon size="32" class="mr-2">mdi-code-tags</v-icon>
          代码分享中心
        </h1>
        <p class="text-subtitle-1 text-grey">课题组成员代码共享平台 - 支持 R、Python、Shell 脚本</p>
      </v-col>
    </v-row>

    <!-- 搜索和筛选工具栏 -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="搜索代码"
          placeholder="输入文件名或描述..."
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-select
          v-model="selectedLanguage"
          :items="languageOptions"
          label="筛选语言"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-filter"
          hide-details
        ></v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="selectedOmics"
          :items="omicsOptions"
          label="筛选组学"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-dna"
          hide-details
        ></v-select>
      </v-col>

      <v-col cols="12" md="2">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          item-title="title"
          item-value="value"
          label="排序方式"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-sort"
          hide-details
        ></v-select>
      </v-col>

      <v-col cols="12" md="1">
        <v-btn
          color="primary"
          size="large"
          block
          @click="uploadDialog = true"
        >
          <v-icon start>mdi-upload</v-icon>
          上传代码
        </v-btn>
      </v-col>
    </v-row>

    <!-- 代码列表 -->
    <v-row>
      <v-col
        v-for="code in codeList"
        :key="code.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          elevation="2"
          hover
          class="code-card"
        >
          <v-card-title class="d-flex align-center">
            <v-icon :color="getLanguageColor(code.language)" class="mr-2">
              {{ getLanguageIcon(code.language) }}
            </v-icon>
            <span class="text-truncate">{{ code.fileName }}</span>
          </v-card-title>

          <v-card-subtitle class="d-flex align-center flex-wrap mt-1">
            <v-chip size="small" :color="getLanguageColor(code.language)" class="mr-2 mb-1">
              {{ code.language }}
            </v-chip>
            <v-chip size="small" :color="getOmicsColor(code.omicsType)" variant="outlined" class="mr-2 mb-1">
              {{ code.omicsType }}
            </v-chip>
            <span class="text-caption">
              <v-icon size="14">mdi-account</v-icon>
              {{ code.authorName }}
            </span>
            <v-spacer></v-spacer>
            <span class="text-caption">
              <v-icon size="14">mdi-calendar</v-icon>
              {{ formatDate(code.createdAt) }}
            </span>
          </v-card-subtitle>

          <v-card-text>
            <!-- 效果图预览 -->
            <div v-if="getCoverImage(code)" class="mb-3">
              <v-img
                :src="getCoverImage(code)"
                :alt="code.fileName"
                height="180"
                cover
                class="rounded preview-image"
                @click="previewCode(code)"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </div>
                </template>
              </v-img>
            </div>
            
            <p class="text-body-2 text-grey-darken-1 code-description">
              {{ code.description || '暂无描述' }}
            </p>
            
            <div class="mt-3">
              <v-chip size="small" variant="outlined" class="mr-1 mb-1">
                <v-icon start size="14">mdi-download</v-icon>
                {{ code.downloadCount || 0 }}
              </v-chip>
              <v-chip size="small" variant="outlined" class="mr-1 mb-1">
                <v-icon start size="14">mdi-file-code</v-icon>
                {{ formatFileSize(code.fileSize) }}
              </v-chip>
              <v-chip v-if="code.previewImages && code.previewImages.length > 0" size="small" variant="outlined" class="mr-1 mb-1" color="success">
                <v-icon start size="14">mdi-image</v-icon>
                {{ code.previewImages.length }}张图
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              @click="previewCode(code)"
            >
              <v-icon start>mdi-eye</v-icon>
              预览
            </v-btn>
            <v-btn
              variant="text"
              color="success"
              @click="copyCode(code)"
            >
              <v-icon start>mdi-content-copy</v-icon>
              复制
            </v-btn>
            <v-btn
              variant="text"
              color="info"
              @click="downloadCode(code)"
            >
              <v-icon start>mdi-download</v-icon>
              下载
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 空状态 -->
      <v-col v-if="!loading && codeList.length === 0" cols="12">
        <v-card class="text-center pa-8" elevation="0" color="grey-lighten-4">
          <v-icon size="64" color="grey">mdi-code-tags-check</v-icon>
          <h3 class="text-h6 mt-4 mb-2">暂无代码</h3>
          <p class="text-grey">{{ searchQuery ? '未找到匹配的代码' : '开始上传你的第一个代码吧！' }}</p>
        </v-card>
      </v-col>
      
      <!-- 加载中 -->
      <v-col v-if="loading" cols="12">
        <div class="text-center pa-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="text-grey mt-4">加载中...</p>
        </div>
      </v-col>
    </v-row>
    
    <!-- 分页 -->
    <v-row v-if="totalPages > 1" class="mt-4">
      <v-col cols="12" class="d-flex justify-center">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          @update:model-value="loadCodeList"
        ></v-pagination>
      </v-col>
    </v-row>

    <!-- 代码预览对话框 -->
    <v-dialog v-model="previewDialog" max-width="1000px" scrollable>
      <v-card v-if="selectedCode">
        <v-card-title class="d-flex align-center bg-primary">
          <v-icon class="mr-2">{{ getLanguageIcon(selectedCode.language) }}</v-icon>
          {{ selectedCode.fileName }}
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="previewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-subtitle class="pt-3">
          <v-chip size="small" :color="getLanguageColor(selectedCode.language)" class="mr-2">
            {{ selectedCode.language }}
          </v-chip>
          <v-chip size="small" :color="getOmicsColor(selectedCode.omicsType)" variant="outlined" class="mr-2">
            {{ selectedCode.omicsType }}
          </v-chip>
          <span class="text-caption">
            作者: {{ selectedCode.authorName }} | 上传时间: {{ formatDate(selectedCode.createdAt) }}
          </span>
        </v-card-subtitle>

        <v-divider></v-divider>

        <v-card-text style="max-height: 600px;">
          <p class="text-body-2 mb-4">{{ selectedCode.description || '暂无描述' }}</p>
          
          <!-- 效果图展示 -->
          <div v-if="selectedCode.previewImages && selectedCode.previewImages.length > 0" class="mb-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-2">
              <v-icon size="20" class="mr-1">mdi-image-outline</v-icon>
              效果图预览 ({{ selectedCode.previewImages.length }}张)
            </h3>
            <v-row>
              <v-col
                v-for="image in selectedCode.previewImages"
                :key="image.id"
                cols="12"
                md="6"
              >
                <v-card variant="outlined" class="image-card">
                  <v-img
                    :src="image.imagePath"
                    :alt="image.imageFileName"
                    height="250"
                    cover
                    class="rounded"
                    @click="openImagePreview(image.imagePath)"
                    style="cursor: pointer;"
                  >
                    <template v-slot:placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                      </div>
                    </template>
                    
                    <!-- 封面标识 -->
                    <v-chip
                      v-if="image.isCover"
                      class="ma-2"
                      color="success"
                      size="small"
                    >
                      <v-icon start size="16">mdi-star</v-icon>
                      封面
                    </v-chip>
                  </v-img>
                  
                  <v-card-actions>
                    <v-btn
                      v-if="!image.isCover"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="handleSetCover(image.id)"
                    >
                      <v-icon start>mdi-star-outline</v-icon>
                      设为封面
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      size="small"
                      variant="text"
                      color="error"
                      @click="handleDeleteImage(image.id)"
                    >
                      <v-icon start>mdi-delete</v-icon>
                      删除
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <p class="text-caption text-grey mt-2">点击图片查看大图</p>
          </div>
          
          <!-- 代码展示区 -->
          <div v-if="selectedCode.codeContent" class="code-preview-container">
            <div class="code-header d-flex align-center pa-2 bg-grey-lighten-3">
              <v-chip size="small" class="mr-2">{{ selectedCode.language }}</v-chip>
              <v-spacer></v-spacer>
              <v-btn
                size="small"
                variant="text"
                @click="copyCodeContent(selectedCode.codeContent)"
              >
                <v-icon start>mdi-content-copy</v-icon>
                复制代码
              </v-btn>
            </div>
            <pre class="code-content"><code>{{ selectedCode.codeContent }}</code></pre>
          </div>
          <div v-else class="text-center pa-4 text-grey">
            <v-icon size="48">mdi-file-code-outline</v-icon>
            <p class="mt-2">此代码仅提供文件下载，无在线预览</p>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-btn
            color="error"
            variant="text"
            @click="handleDeleteCode(selectedCode.id)"
          >
            <v-icon start>mdi-delete</v-icon>
            删除代码
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="selectedCode.codeContent"
            color="success"
            variant="text"
            @click="copyCodeContent(selectedCode.codeContent)"
          >
            <v-icon start>mdi-content-copy</v-icon>
            复制代码
          </v-btn>
          <v-btn
            v-if="selectedCode.filePath"
            color="primary"
            variant="elevated"
            @click="downloadCode(selectedCode)"
          >
            <v-icon start>mdi-download</v-icon>
            下载文件
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 上传代码对话框 -->
    <v-dialog v-model="uploadDialog" max-width="700px" persistent>
      <v-card>
        <v-card-title class="bg-primary">
          <v-icon class="mr-2">mdi-upload</v-icon>
          上传代码
        </v-card-title>

        <v-card-text class="pt-6">
          <v-form ref="uploadForm" v-model="formValid">
            <v-text-field
              v-model="uploadData.fileName"
              label="文件名 *"
              placeholder="例如: data_cleaning.R"
              variant="outlined"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-file-code"
            ></v-text-field>

            <v-text-field
              v-model="uploadData.authorName"
              label="作者 *"
              placeholder="请输入作者姓名"
              variant="outlined"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-account"
            ></v-text-field>

            <v-select
              v-model="uploadData.language"
              :items="['R', 'Python', 'Shell', 'Other']"
              label="代码语言 *"
              variant="outlined"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-code-tags"
            ></v-select>

            <v-select
              v-model="uploadData.omicsType"
              :items="['转录组', '宏基因组', '代谢组', '16S', '宏转录组', '蛋白组', '其他']"
              label="组学类型 *"
              placeholder="选择代码所属的组学类型"
              variant="outlined"
              :rules="[rules.required]"
              prepend-inner-icon="mdi-dna"
            ></v-select>

            <v-textarea
              v-model="uploadData.description"
              label="代码描述 *"
              placeholder="简要描述代码的功能和用途..."
              variant="outlined"
              :rules="[rules.required]"
              rows="3"
              prepend-inner-icon="mdi-text"
            ></v-textarea>

            <v-file-input
              v-model="uploadData.codeFile"
              label="选择代码文件 *"
              placeholder="点击选择或拖拽文件"
              variant="outlined"
              :rules="[rules.required, rules.fileSize]"
              prepend-icon="mdi-paperclip"
              accept=".r,.R,.py,.sh,.bash,.txt"
              show-size
            >
              <template v-slot:selection="{ fileNames }">
                <v-chip
                  v-for="fileName in fileNames"
                  :key="fileName"
                  size="small"
                  label
                  color="primary"
                >
                  {{ fileName }}
                </v-chip>
              </template>
            </v-file-input>

            <v-file-input
              v-model="uploadData.previewImages"
              label="上传效果图（可选，最多10张）"
              placeholder="选择代码运行效果图或结果图"
              variant="outlined"
              prepend-icon="mdi-image"
              accept="image/*"
              multiple
              show-size
              @change="handleImagePreview"
              :rules="[rules.imageSize]"
            >
              <template v-slot:selection="{ fileNames }">
                <v-chip
                  v-for="(fileName, index) in fileNames"
                  :key="index"
                  size="small"
                  label
                  color="success"
                  class="mr-1 mb-1"
                >
                  {{ fileName }}
                </v-chip>
              </template>
            </v-file-input>

            <!-- 图片预览 -->
            <div v-if="imagePreviewUrls.length > 0" class="mt-2 mb-3">
              <v-card variant="outlined">
                <v-card-text class="pa-2">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-caption font-weight-bold">图片预览 ({{ imagePreviewUrls.length }}张)</span>
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      @click="clearImagePreview"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  <v-row>
                    <v-col
                      v-for="(url, index) in imagePreviewUrls"
                      :key="index"
                      cols="6"
                      md="4"
                    >
                      <v-img
                        :src="url"
                        height="120"
                        cover
                        class="rounded"
                      ></v-img>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </div>

            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-2"
            >
              <div class="text-caption">
                <div>代码文件格式: .r, .R, .py, .sh, .bash, .txt</div>
                <div>效果图格式: jpg, png, gif, svg等图片格式</div>
              </div>
            </v-alert>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeUploadDialog"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :disabled="!formValid || uploadLoading"
            :loading="uploadLoading"
            @click="submitUpload"
          >
            <v-icon start>mdi-upload</v-icon>
            上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示消息 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>


<script setup>
// ===== 完整的 script setup 部分 =====
import { ref, onMounted, watch } from 'vue'
import {
  getCodeShareList,
  getCodeShareById,
  createCodeShare,
  deleteCodeShare,
  deletePreviewImage,
  setCoverImage,
  downloadCodeFile
} from '@/api/code.api'

// ===== 数据状态 =====
const searchQuery = ref('')
const selectedLanguage = ref('')
const selectedOmics = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref('DESC')
const previewDialog = ref(false)
const uploadDialog = ref(false)
const selectedCode = ref(null)
const formValid = ref(false)
const loading = ref(false)
const uploadLoading = ref(false)

// ===== 分页状态 =====
const currentPage = ref(1)
const pageSize = ref(9)
const totalItems = ref(0)
const totalPages = ref(0)

// ===== 选项配置 =====
const languageOptions = ['全部', 'R', 'Python', 'Shell', 'Other']
const omicsOptions = ['全部', '转录组', '宏基因组', '代谢组', '16S', '宏转录组', '蛋白组', '其他']
const sortOptions = [
  { title: '最新上传', value: 'createdAt' },
  { title: '最多下载', value: 'downloadCount' },
  { title: '文件名', value: 'fileName' }
]

// ===== 代码列表数据 =====
const codeList = ref([])

// ===== 上传表单数据 =====
const uploadData = ref({
  fileName: '',
  authorName: '',
  language: '',
  omicsType: '',
  description: '',
  codeFile: null,
  previewImages: []
})

const imagePreviewUrls = ref([])

// ===== 表单验证规则 =====
const rules = {
  required: value => !!value || '此项为必填项',
  fileSize: value => {
    if (!value || value.length === 0) return true
    const file = Array.isArray(value) ? value[0] : value
    const maxSize = 50 * 1024 * 1024 // 50MB
    return !file || file.size <= maxSize || '文件大小不能超过50MB'
  },
  imageSize: value => {
    if (!value || value.length === 0) return true
    const files = Array.isArray(value) ? value : [value]
    if (files.length > 10) return '最多只能上传10张图片'
    const maxSize = 10 * 1024 * 1024 // 10MB
    for (const file of files) {
      if (file && file.size > maxSize) {
        return `图片 ${file.name} 大小超过10MB`
      }
    }
    return true
  }
}

// ===== 提示消息 =====
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

// ===== 辅助方法 =====
function getCoverImage(code) {
  if (!code.previewImages || code.previewImages.length === 0) return null
  const coverImage = code.previewImages.find(img => img.isCover)
  return coverImage ? coverImage.imagePath : code.previewImages[0].imagePath
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function getLanguageIcon(language) {
  const icons = {
    'R': 'mdi-language-r',
    'Python': 'mdi-language-python',
    'Shell': 'mdi-bash',
    'Other': 'mdi-file-code'
  }
  return icons[language] || 'mdi-file-code'
}

function getLanguageColor(language) {
  const colors = {
    'R': 'blue',
    'Python': 'green',
    'Shell': 'orange',
    'Other': 'grey'
  }
  return colors[language] || 'grey'
}

function getOmicsColor(omics) {
  const colors = {
    '转录组': 'purple',
    '宏基因组': 'teal',
    '代谢组': 'pink',
    '16S': 'indigo',
    '宏转录组': 'cyan',
    '蛋白组': 'amber',
    '其他': 'grey'
  }
  return colors[omics] || 'grey'
}

// ===== API调用方法 =====
async function loadCodeList() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }
    
    if (selectedLanguage.value && selectedLanguage.value !== '全部') {
      params.language = selectedLanguage.value
    }
    if (selectedOmics.value && selectedOmics.value !== '全部') {
      params.omicsType = selectedOmics.value
    }
    if (searchQuery.value) {
      params.authorName = searchQuery.value
    }
    
    const response = await getCodeShareList(params)
    if (response.data.success) {
      codeList.value = response.data.items
      totalItems.value = response.data.totalItems
      totalPages.value = response.data.totalPages
      currentPage.value = response.data.currentPage
    }
  } catch (error) {
    console.error('加载代码列表失败:', error)
    showSnackbar('加载代码列表失败', 'error')
  } finally {
    loading.value = false
  }
}

async function previewCode(code) {
  loading.value = true
  try {
    const response = await getCodeShareById(code.id)
    if (response.data.success) {
      selectedCode.value = response.data.data
      previewDialog.value = true
    }
  } catch (error) {
    console.error('加载代码详情失败:', error)
    showSnackbar('加载代码详情失败', 'error')
  } finally {
    loading.value = false
  }
}

function copyCode(code) {
  if (code.codeContent) {
    copyCodeContent(code.codeContent)
  } else {
    showSnackbar('此代码无在线内容可复制', 'warning')
  }
}

function copyCodeContent(content) {
  navigator.clipboard.writeText(content).then(() => {
    showSnackbar('代码已复制到剪贴板', 'success')
  }).catch(() => {
    showSnackbar('复制失败，请手动复制', 'error')
  })
}

async function downloadCode(code) {
  try {
    // 调用下载 API，获取文件流
    const response = await downloadCodeFile(code.id)
    
    // 从响应头中获取文件名（如果后端设置了 Content-Disposition）
    const contentDisposition = response.headers['content-disposition']
    let fileName = code.fileName
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '')
        // 处理 UTF-8 编码的文件名
        if (fileName.includes('UTF-8')) {
          fileName = decodeURIComponent(fileName.split("''")[1])
        }
      }
    }
    
    // 创建 Blob URL
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    
    // 创建下载链接并触发下载
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    // 更新下载计数
    code.downloadCount = (code.downloadCount || 0) + 1
    if (selectedCode.value && selectedCode.value.id === code.id) {
      selectedCode.value.downloadCount = code.downloadCount
    }
    
    showSnackbar('文件下载成功', 'success')
  } catch (error) {
    console.error('下载失败:', error)
    showSnackbar(error.response?.data?.msg || '下载失败', 'error')
  }
}

async function submitUpload() {
  uploadLoading.value = true
  try {
    const formData = {
      fileName: uploadData.value.fileName,
      authorName: uploadData.value.authorName,
      language: uploadData.value.language,
      omicsType: uploadData.value.omicsType,
      description: uploadData.value.description
    }
    
    if (uploadData.value.codeFile && uploadData.value.codeFile.length > 0) {
      formData.codeFile = uploadData.value.codeFile[0]
    }
    
    if (uploadData.value.previewImages && uploadData.value.previewImages.length > 0) {
      formData.images = uploadData.value.previewImages
    }
    
    const response = await createCodeShare(formData)
    if (response.data.success) {
      showSnackbar('代码上传成功！', 'success')
      closeUploadDialog()
      currentPage.value = 1
      await loadCodeList()
    }
  } catch (error) {
    console.error('上传失败:', error)
    showSnackbar(error.response?.data?.msg || '上传失败', 'error')
  } finally {
    uploadLoading.value = false
  }
}

function closeUploadDialog() {
  uploadDialog.value = false
  uploadData.value = {
    fileName: '',
    authorName: '',
    language: '',
    omicsType: '',
    description: '',
    codeFile: null,
    previewImages: []
  }
  imagePreviewUrls.value = []
}

function handleImagePreview(event) {
  const files = uploadData.value.previewImages
  if (files && files.length > 0) {
    imagePreviewUrls.value = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        imagePreviewUrls.value.push(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  } else {
    imagePreviewUrls.value = []
  }
}

function clearImagePreview() {
  uploadData.value.previewImages = []
  imagePreviewUrls.value = []
}

function openImagePreview(imageUrl) {
  window.open(imageUrl, '_blank')
}

async function handleDeleteCode(codeId) {
  if (!confirm('确定要删除这个代码吗？')) return
  
  try {
    await deleteCodeShare(codeId)
    showSnackbar('删除成功', 'success')
    previewDialog.value = false
    await loadCodeList()
  } catch (error) {
    console.error('删除失败:', error)
    showSnackbar('删除失败', 'error')
  }
}

async function handleDeleteImage(imageId) {
  if (!confirm('确定要删除这张图片吗？')) return
  
  try {
    await deletePreviewImage(imageId)
    showSnackbar('图片删除成功', 'success')
    if (selectedCode.value) {
      const response = await getCodeShareById(selectedCode.value.id)
      if (response.data.success) {
        selectedCode.value = response.data.data
      }
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    showSnackbar('删除图片失败', 'error')
  }
}

async function handleSetCover(imageId) {
  try {
    await setCoverImage(selectedCode.value.id, imageId)
    showSnackbar('封面设置成功', 'success')
    const response = await getCodeShareById(selectedCode.value.id)
    if (response.data.success) {
      selectedCode.value = response.data.data
      const index = codeList.value.findIndex(c => c.id === selectedCode.value.id)
      if (index !== -1) {
        codeList.value[index] = { ...codeList.value[index], previewImages: selectedCode.value.previewImages }
      }
    }
  } catch (error) {
    console.error('设置封面失败:', error)
    showSnackbar('设置封面失败', 'error')
  }
}

function showSnackbar(text, color = 'success') {
  snackbar.value = {
    show: true,
    text,
    color
  }
}

// ===== 生命周期和监听器 =====
onMounted(() => {
  loadCodeList()
})

watch([selectedLanguage, selectedOmics, searchQuery, sortBy], () => {
  currentPage.value = 1
  loadCodeList()
})
</script>

<style scoped>
.code-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s;
}

.code-card:hover {
  transform: translateY(-4px);
}

.code-description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 60px;
}

.code-preview-container {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.code-header {
  border-bottom: 1px solid #e0e0e0;
}

.code-content {
  margin: 0;
  padding: 16px;
  background-color: #f5f5f5;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  max-height: 500px;
  overflow-y: auto;
}

.code-content code {
  color: #333;
}

.preview-image {
  cursor: pointer;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.02);
}
</style>
