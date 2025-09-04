<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { 
  getMembers, 
  createMember, 
  updateMember,
  createRole, 
  createExpertise,
  getRoles,
  getExpertises,
  deleteMember
} from '@/api/member.api.js'

// 响应式数据
const members = ref([])
const roles = ref([])
const expertises = ref([])
const loading = ref(false)
const totalItems = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const totalPages = ref(1)

// 对话框状态
const memberDialog = ref(false)
const managementDialog = ref(false)
const managementTab = ref('roles')

// 表单数据
const memberForm = ref({
  name: '',
  slug: '',
  RoleId: null,
  status: 'current',
  bio: '',
  email: '',
  enrollmentYear: new Date().getFullYear(),
  graduationYear: null,
  googleScholarId: '',
  linkedinUrl: '',
  expertiseIds: []
})

const roleForm = ref({
  name: '',
  displayOrder: 1
})

const expertiseForm = ref({
  name: ''
})

// 编辑状态
const isEditingMember = ref(false)
let currentMemberId = null

// 文件上传
const avatarFile = ref(null)

// 表单验证规则
const nameRules = [
  v => !!v || '姓名是必填项',
  v => v.length >= 2 || '姓名至少2个字符'
]

const emailRules = [
  v => !v || /.+@.+\..+/.test(v) || '邮箱格式不正确'
]

const yearRules = [
  v => !v || (v >= 1900 && v <= 2100) || '年份范围应在1900-2100之间'
]

// 获取成员数据
const fetchMembers = async () => {
  loading.value = true
  try {
    const response = await getMembers({
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: 'id',
      sortOrder: 'ASC'
    })

    if (response.data.success) {
      members.value = response.data.items
      totalItems.value = response.data.totalItems
      totalPages.value = response.data.totalPages
      currentPage.value = response.data.currentPage
    }
  } catch (error) {
    console.error('获取成员数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取角色和专业领域数据
const fetchRolesAndExpertises = async () => {
  try {
    const [rolesResponse, expertisesResponse] = await Promise.all([
      getRoles(),
      getExpertises()
    ])

    if (rolesResponse.data.success) {
      roles.value = rolesResponse.data.data
    }

    if (expertisesResponse.data.success) {
      expertises.value = expertisesResponse.data.data
    }
  } catch (error) {
    console.error('获取角色和专业领域数据失败:', error)
  }
}

// 创建/更新成员
const submitMember = async () => {
  try {
    let formData

    // 如果有头像文件，使用 FormData
    if (avatarFile.value) {
      formData = new FormData()
      Object.keys(memberForm.value).forEach(key => {
        if (memberForm.value[key] !== null && memberForm.value[key] !== '') {
          formData.append(key, memberForm.value[key])
        }
      })
      formData.append('avatar', avatarFile.value)
    } else {
      // 否则使用普通对象
      formData = { ...memberForm.value }
      // 清理空值
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null) {
          delete formData[key]
        }
      })
    }

    let response

    if (isEditingMember.value) {
      response = await updateMember(currentMemberId, formData)
    } else {
      response = await createMember(formData)
    }

    if (response.data.success) {
      memberDialog.value = false
      // 更新列表本地避免额外请求
      if (isEditingMember.value) {
        const idx = members.value.findIndex(m => m.id === currentMemberId)
        if (idx !== -1) {
          members.value.splice(idx, 1, response.data.data)
        }
      } else {
        await fetchMembers()
      }
      resetMemberForm()
      isEditingMember.value = false
      currentMemberId = null
      console.log(isEditingMember.value ? '成员更新成功' : '成员创建成功')
    }
  } catch (error) {
    console.error(isEditingMember.value ? '更新成员失败:' : '创建成员失败:', error)
  }
}

// 创建角色
const submitRole = async () => {
  try {
    const response = await createRole(roleForm.value)

    if (response.data.success) {
      managementDialog.value = false
      resetRoleForm()
      await fetchRolesAndExpertises()
      console.log('角色创建成功')
    }
  } catch (error) {
    console.error('创建角色失败:', error)
  }
}

// 创建专业领域
const submitExpertise = async () => {
  try {
    const response = await createExpertise(expertiseForm.value)

    if (response.data.success) {
      managementDialog.value = false
      resetExpertiseForm()
      await fetchRolesAndExpertises()
      console.log('专业领域创建成功')
    }
  } catch (error) {
    console.error('创建专业领域失败:', error)
  }
}

// 重置表单
const resetMemberForm = () => {
  memberForm.value = {
    name: '',
    slug: '',
    RoleId: null,
    status: 'current',
    bio: '',
    email: '',
    enrollmentYear: new Date().getFullYear(),
    graduationYear: null,
    googleScholarId: '',
    linkedinUrl: '',
    expertiseIds: []
  }
  avatarFile.value = null
}

const resetRoleForm = () => {
  roleForm.value = {
    name: '',
    displayOrder: 1
  }
}

const resetExpertiseForm = () => {
  expertiseForm.value = {
    name: ''
  }
}

// 处理文件选择
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    avatarFile.value = file
  }
}

// 格式化状态显示
const getStatusColor = (status) => {
  switch (status) {
    case 'current': return 'success'
    case 'graduated': return 'info'
    case 'inactive': return 'warning'
    default: return 'grey'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'current': return '在职'
    case 'graduated': return '已毕业'
    case 'inactive': return '离职'
    default: return '未知'
  }
}

// 格式化年份显示
const formatYearRange = (enrollmentYear, graduationYear) => {
  if (graduationYear) {
    return `${enrollmentYear} - ${graduationYear}`
  }
  return `${enrollmentYear} - 至今`
}

// 页面加载时获取数据
onMounted(() => {
  fetchMembers()
  fetchRolesAndExpertises()
})

// 分页处理
const handlePageChange = (page) => {
  currentPage.value = page
  fetchMembers()
}

// 状态选项
const statusOptions = [
  { title: '在职', value: 'current' },
  { title: '校友', value: 'alumnus' }
]

// ===== 删除成员相关 =====
const alert = reactive({
  show: false,
  message: '',
  type: 'success',
  timeout: 3000
})

const deleteDialog = ref(false)
const memberToDelete = ref(null)

const confirmText = computed(() => memberToDelete.value ? `确定删除成员「${memberToDelete.value.name}」吗？` : '确定删除？')

function openDeleteDialog(member) {
  const userInfoString = localStorage.getItem('userInfo')
  let userRole = 'user'

  if (userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString)
      if (userInfo && userInfo.role) {
        userRole = userInfo.role
      }
    } catch (e) {
      console.error('Failed to parse user info from localStorage', e)
    }
  }

  if (userRole !== 'admin') {
    alert.message = '抱歉，您没有权限删除成员。'
    alert.type = 'error'
    alert.show = true
    setTimeout(() => (alert.show = false), alert.timeout)
    return
  }

  memberToDelete.value = member
  deleteDialog.value = true
}

async function handleDeleteOk() {
  if (!memberToDelete.value) return
  try {
    await deleteMember(memberToDelete.value.id)
    members.value = members.value.filter(m => m.id !== memberToDelete.value.id)
    alert.message = '成员已删除'
    alert.type = 'success'
  } catch (err) {
    console.error('删除失败', err)
    alert.message = '删除失败，请重试'
    alert.type = 'error'
  } finally {
    alert.show = true
    setTimeout(() => (alert.show = false), alert.timeout)
    deleteDialog.value = false
    memberToDelete.value = null
  }
}

function openEditDialog(member) {
  isEditingMember.value = true
  currentMemberId = member.id
  memberDialog.value = true
  memberForm.value = {
    name: member.name,
    slug: member.slug || '',
    RoleId: member.RoleId || null,
    status: member.status || 'current',
    bio: member.bio || '',
    email: member.email || '',
    enrollmentYear: member.enrollmentYear || new Date().getFullYear(),
    graduationYear: member.graduationYear || null,
    googleScholarId: member.googleScholarId || '',
    linkedinUrl: member.linkedinUrl || '',
    expertiseIds: member.Expertises ? member.Expertises.map(e => e.id) : []
  }
  avatarFile.value = null
}
</script>

<template>
  <v-container fluid>
    <v-alert
        v-if="alert.show"
        :type="alert.type"
        variant="tonal"
        closable
        class="mb-4"
        density="comfortable"
        @click:close="alert.show = false"
    >
      {{ alert.message }}
    </v-alert>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span class="text-h5">成员管理</span>
            <div class="d-flex gap-2">
              <v-btn
                  icon
                  color="light-blue-lighten-3"
                  title="添加数据"
                  class="ml-2 mr-2"
                  @click="memberDialog = true">
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn
                  icon
                  color="light-green-lighten-4"
                  class="ml-2 mr-2"
                  @click="managementDialog = true">
                <v-icon>mdi-account-cog-outline</v-icon>
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- 加载状态 -->
            <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

            <!-- 成员列表 -->
            <v-row v-if="!loading">
              <v-col
                v-for="member in members"
                :key="member.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
                xl="2"
              >
                <v-card class="member-card compact pa-3" elevation="1">
                  <div class="d-flex align-start">
                    <v-avatar size="64" class="mr-4">
                      <v-img
                        v-if="member.avatarUrl"
                        :src="member.avatarUrl"
                        :alt="member.name"
                      ></v-img>
                      <v-icon v-else size="28">mdi-account-circle</v-icon>
                    </v-avatar>

                    <div class="flex-grow-1 d-flex flex-column">
                      <div class="d-flex align-center justify-space-between mb-1">
                        <div class="text-subtitle-1 font-weight-medium mr-2 text-truncate">
                          {{ member.name }}
                        </div>
                        <v-chip :color="getStatusColor(member.status)" size="x-small" variant="flat">
                          {{ getStatusText(member.status) }}
                        </v-chip>
                      </div>

                      <div class="d-flex align-center flex-wrap text-caption text-medium-emphasis mb-1">
                        <span v-if="member.Role" class="mr-2">{{ member.Role.name }}</span>
                        <span v-if="member.email" class="mr-2 d-flex align-center">
                          <v-icon size="14" class="mr-1">mdi-email</v-icon>{{ member.email }}
                        </span>
                        <span class="d-flex align-center">
                          <v-icon size="14" class="mr-1">mdi-calendar</v-icon>
                          {{ formatYearRange(member.enrollmentYear, member.graduationYear) }}
                        </span>
                      </div>

                      <div v-if="member.bio" class="text-body-2 text-clamp-2 mb-1">
                        {{ member.bio }}
                      </div>

                      <div v-if="member.Expertises && member.Expertises.length" class="d-flex flex-wrap">
                        <v-chip
                          v-for="e in member.Expertises.slice(0,2)"
                          :key="e.id"
                          size="x-small"
                          color="secondary"
                          variant="outlined"
                          class="mr-1 mb-1"
                        >
                          {{ e.name }}
                        </v-chip>
                        <v-chip v-if="member.Expertises.length > 2" size="x-small" variant="text" class="mb-1">
                          +{{ member.Expertises.length - 2 }}
                        </v-chip>
                      </div>

                      <div class="mt-2 d-flex">
                        <v-btn
                          v-if="member.googleScholarId"
                          icon
                          size="small"
                          variant="text"
                          :href="`https://scholar.google.com/citations?user=${member.googleScholarId}`"
                          target="_blank"
                        >
                          <v-icon size="18">mdi-school</v-icon>
                        </v-btn>
                        <v-btn
                          v-if="member.linkedinUrl"
                          icon
                          size="small"
                          variant="text"
                          :href="member.linkedinUrl"
                          target="_blank"
                        >
                          <v-icon size="18" color="blue">mdi-linkedin</v-icon>
                        </v-btn>
                      </div>

                      <div class="action-bottom d-flex justify-end mt-auto pt-1">
                        <v-btn icon size="small" variant="text" color="primary" @click="openEditDialog(member)">
                          <v-icon size="18">mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn icon size="small" variant="text" color="error" @click="openDeleteDialog(member)">
                          <v-icon size="18">mdi-delete</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <!-- 分页 -->
            <v-row v-if="totalPages > 1" class="mt-4">
              <v-col cols="12" class="d-flex justify-center">
                <v-pagination
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="7"
                  @update:model-value="handlePageChange"
                ></v-pagination>
              </v-col>
            </v-row>

            <!-- 空状态 -->
            <v-row v-if="!loading && members.length === 0">
              <v-col cols="12" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-account-group-outline</v-icon>
                <div class="text-h6 text-grey-lighten-1 mt-2">暂无成员数据</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  
    <!-- 添加/编辑成员对话框 -->
    <v-dialog v-model="memberDialog" max-width="600px">
      <v-card elevation="24" class="pa-4">
        <v-card-title class="py-2 text-h6 font-weight-bold">{{ isEditingMember ? '编辑成员' : '添加新成员' }}</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitMember">
            <v-row>
              <!-- 基本信息 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberForm.name"
                  label="姓名 *"
                  :rules="nameRules"
                  required
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberForm.slug"
                  label="标识符"
                  hint="用于URL，留空自动生成"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-select
                  v-model="memberForm.RoleId"
                  :items="roles"
                  item-title="name"
                  item-value="id"
                  label="角色"
                  clearable
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-select>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-select
                  v-model="memberForm.status"
                  :items="statusOptions"
                  label="状态"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-select>
              </v-col>
  
              <!-- 联系信息 -->
              <v-col cols="12">
                <v-text-field
                  v-model="memberForm.email"
                  label="邮箱"
                  :rules="emailRules"
                  type="email"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12">
                <v-textarea
                  v-model="memberForm.bio"
                  label="个人简介"
                  rows="3"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-textarea>
              </v-col>
  
              <!-- 年份信息 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="memberForm.enrollmentYear"
                  label="入学年份"
                  type="number"
                  :rules="yearRules"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="memberForm.graduationYear"
                  label="毕业年份"
                  type="number"
                  :rules="yearRules"
                  hint="在职人员可留空"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <!-- 外部链接 -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberForm.googleScholarId"
                  label="Google Scholar ID"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="memberForm.linkedinUrl"
                  label="LinkedIn URL"
                  type="url"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-text-field>
              </v-col>
  
              <!-- 专业领域 -->
              <v-col cols="12">
                <v-select
                  v-model="memberForm.expertiseIds"
                  :items="expertises"
                  item-title="name"
                  item-value="id"
                  label="专业领域"
                  multiple
                  chips
                  clearable
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-select>
              </v-col>
  
              <!-- 头像上传 -->
              <v-col cols="12">
                <v-file-input
                  label="头像"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  @change="handleFileSelect"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="memberDialog = false">取消</v-btn>
          <v-btn color="primary" @click="submitMember">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 角色和专业领域管理对话框 -->
    <v-dialog v-model="managementDialog" max-width="800px" transition="dialog-bottom-transition">
      <v-card elevation="24" class="pa-4">
        <div class="dialog-header d-flex align-center justify-center mb-6">
          <span class="text-h5 font-weight-medium white--text">管理角色和专业领域</span>
        </div>
        <v-card-text>
          <v-tabs v-model="managementTab">
            <v-tab value="roles">角色</v-tab>
            <v-tab value="expertises">专业领域</v-tab>
          </v-tabs>
          <v-window v-model="managementTab" class="mt-4">
            <v-window-item value="roles">
              <v-form @submit.prevent="submitRole">
                <v-text-field
                  v-model="roleForm.name"
                  label="角色名称 *"
                  required
                ></v-text-field>
                <v-text-field
                  v-model.number="roleForm.displayOrder"
                  label="显示顺序"
                  type="number"
                ></v-text-field>
              </v-form>
            </v-window-item>
            <v-window-item value="expertises">
              <v-form @submit.prevent="submitExpertise">
                <v-text-field
                  v-model="expertiseForm.name"
                  label="专业领域名称 *"
                  required
                ></v-text-field>
              </v-form>
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="managementDialog = false">取消</v-btn>
          <v-btn color="primary" @click="managementTab === 'roles' ? submitRole() : submitExpertise()">保存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="320px" transition="dialog-bottom-transition">
      <v-card elevation="24" class="pa-4">
        <div class="dialog-header d-flex align-center justify-center mb-4">
          <span class="text-h6 font-weight-medium white--text">{{ confirmText }}</span>
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn color="pink-darken-4" text @click="deleteDialog = false">取消</v-btn>
          <v-btn color="green-darken-2" text @click="handleDeleteOk">确定</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.member-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.member-card:hover {
  transform: translateY(-2px);
}

.v-chip {
  font-size: 0.75rem;
}
/* Compact card layout additions */
.compact .v-card-title,
.compact .v-card-text,
.compact .v-card-actions {
  padding-top: 0;
  padding-bottom: 0;
}

.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.text-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.action-bottom .v-btn { opacity: 0; pointer-events: none; transition: opacity .2s ease; }
.member-card:hover .action-bottom .v-btn { opacity: 1; pointer-events: auto; }

/* On touch devices (no hover), always show action buttons */
@media (hover: none) {
  .action-bottom .v-btn { opacity: 1; pointer-events: auto; }
}

.dialog-header {
  padding: 16px;
  border-radius: 8px;
  background: var(--v-theme-primary);
}
</style>