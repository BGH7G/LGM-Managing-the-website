<script setup>
import {ref, computed, reactive, onMounted, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/stores/auth'
import {useTheme} from 'vuetify'

const router = useRouter()
const store = useUserStore()
const drawer = ref(true)
const rail = ref(false)
const currentYear = new Date().getFullYear()
const theme = useTheme()

// Theme names (must match those defined in src/main.js)
const THEME_LIGHT = 'softPastelLight'
const THEME_DARK = 'softPastelDark'

// Track current theme
const isDarkTheme = ref(false)

// Initialize theme based on user preference or system setting
onMounted(() => {
  const savedTheme = localStorage.getItem('selectedTheme')
  if (savedTheme === THEME_LIGHT || savedTheme === THEME_DARK) {
    theme.global.name.value = savedTheme
    isDarkTheme.value = savedTheme === THEME_DARK
  } else {
    // Check if user prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      theme.global.name.value = THEME_DARK
      isDarkTheme.value = true
    } else {
      theme.global.name.value = THEME_LIGHT
      isDarkTheme.value = false
    }
  }
})

// Toggle between light and dark themes
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
  const newTheme = isDarkTheme.value ? THEME_DARK : THEME_LIGHT
  theme.global.name.value = newTheme
  localStorage.setItem('selectedTheme', newTheme)
}

// Get current theme's background color
const backgroundColor = computed(() => theme.current.value.colors.background)

// ===== 用户 & 角色 =====
const parseUser = (val) => {
  if (!val) return {}
  try { return typeof val === 'string' ? JSON.parse(val) : val } catch { return {} }
}

const userData = reactive({
  name: '管理员',
  avatar: 'https://randomuser.me/api/portraits/men/85.jpg', // 默认头像
  role: 'user',
  ...parseUser(store.userInfo)
})

// 显示用头像，若为空用默认
const avatarSrc = computed(() => userData.avatar || 'https://randomuser.me/api/portraits/men/85.jpg')

// 监听登录/角色变化
watch(() => store.userInfo, (val) => Object.assign(userData, parseUser(val)))

// ===== 侧边栏菜单 =====
const baseNav = [
  {title: '首页', icon: 'mdi-home', path: '/'},
  {
    title: '数据',
    icon: 'mdi-chart-bar',
    children: [
      {
        title: '湖羊数据',
        children: [
          {title: '个体信息', path: '/dataShow/huSheep/huSheepIndividual'},
          {title: '表型信息', path: '/dataShow/huSheep/huSheepPhenotype'},
        ]
      },
      {
        title: '荷斯坦奶牛数据',
        children: [
          {title: '个体信息', path: '/dataShow/holstein/holsteinIndividual'},
          {title: '表型信息', path: '/dataShow/holstein/holsteinPhenotype'},
        ]
      },
      {title: '厂址', path: '/dataShow/location'}
    ]
  },
  {
    title: '门户网站管理',
    icon: 'mdi-web',
    children: [
      {title: '成员管理', path: '/member'},
      {title: '新闻管理', path: '/news'},
      {title: '成果管理', path: '/publish'},
    ]
  },
  {title: '图片展示', icon: 'mdi-image-multiple', path: '/photo'},
  {title: '耗材管理', icon: 'mdi-hexagon-multiple', path: '/goods'},
  {title: '文章创作', icon: 'mdi-file-edit', path: '/textEditor'},
  {title: '报账申请', icon: 'mdi-account-cash', path: '/claim'}
]

const adminExtra = [

]

const navItems = computed(() =>
  userData.role === 'admin' ? [...baseNav, ...adminExtra] : baseNav
)

const roleDisplay = computed(() => (userData.role === 'admin' ? '管理员' : '用户'))

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const navigateTo = (item) => {
  if (item.action) {
    item.action()
  } else if (item.path) {
    router.push(item.path)
  }
}

// Logout function
async function logout() {
  store.logout()
  await router.push('/login')
}

// Responsive behavior
const isMobile = computed(() => {
  return window.innerWidth < 960
})

// Auto collapse sidebar on mobile
if (isMobile.value) {
  drawer.value = false
}

// User profile menu items
const profileItems = [
  {title: '个人资料', icon: 'mdi-account', path: '/profile'},
  {title: '退出登录', icon: 'mdi-logout', action: logout},
]
</script>

<template>
  <v-app>
    <!-- App Bar / Header -->
    <v-app-bar
        color="primary"
        density="compact"
        elevation="2"
    >
      <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>

      <v-app-bar-title class="text-uppercase font-weight-bold">
        管理系统
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <!-- Theme Toggle Button -->
      <v-btn icon @click="toggleTheme" class="mr-2" variant="text">
        <v-icon>{{ isDarkTheme ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          切换{{ isDarkTheme ? '亮色' : '暗色' }}主题
        </v-tooltip>
      </v-btn>

      <!-- User Menu -->
      <v-menu
          min-width="200px"
          rounded
      >
        <template v-slot:activator="{ props }">
          <v-btn
              icon
              v-bind="props"
          >
            <v-avatar
                color="accent"
                size="small"
            >
              <span class="text-h6">{{ (userData.name || '用户').charAt(0) }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <div class="d-flex align-center flex-column mb-2">
              <v-avatar
                  color="accent"
                  size="64"
                  class="mb-2"
              >
                <span class="text-h5">{{ (userData.name || '用户').charAt(0) }}</span>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold">{{ userData.name || '用户' }}</div>
              <div class="text-caption text-grey">{{ roleDisplay }}</div>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-list>
            <v-list-item
                v-for="(item, index) in profileItems"
                :key="index"
                :value="index"
                @click="item.action ? item.action() : navigateTo(item)"
            >
              <template v-slot:prepend>
                <v-icon :icon="item.icon"></v-icon>
              </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer / Sidebar -->
    <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
    >
      <v-list-item :title="userData.name || '用户'" :subtitle="roleDisplay">
        <template #prepend>
          <v-avatar size="36">
            <v-img :src="avatarSrc"cover alt="avatar"/>
          </v-avatar>
        </template>
        <template #append>
          <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="(item, index) in navItems" :key="index">
          <!-- Items with children (sub-menu) -->
          <v-list-group v-if="item.children">
            <template v-slot:activator="{ props }">
              <v-list-item
                  v-bind="props"
                  :prepend-icon="item.icon"
                  :title="item.title"
              ></v-list-item>
            </template>
            
            <template v-for="(child, i) in item.children" :key="i">
              <!-- Items with children (sub-menu) -->
              <v-list-group v-if="child.children">
                <template v-slot:activator="{ props }">
                  <v-list-item
                      v-bind="props"
                      :prepend-icon="child.icon"
                      :title="child.title"
                  ></v-list-item>
                </template>
                
                <v-list-item
                    v-for="(grandchild, j) in child.children"
                    :key="j"
                    :value="grandchild.title"
                    :title="grandchild.title"
                    @click="navigateTo(grandchild)"
                    class="pl-4"
                ></v-list-item>
              </v-list-group>
              
              <!-- Regular items without children -->
              <v-list-item
                  v-else
                  :value="i"
                  :prepend-icon="child.icon"
                  :title="child.title"
                  @click="navigateTo(child)"
              ></v-list-item>
            </template>
          </v-list-group>
          
          <!-- Regular items without children -->
          <v-list-item
              v-else
              :value="index"
              :prepend-icon="item.icon"
              :title="item.title"
              @click="navigateTo(item)"
          ></v-list-item>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
              block
              color="primary"
              to="/help"
          >
            <v-icon start>mdi-help-circle</v-icon>
            帮助中心
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <v-main>
      <div class="main-content" :style="{ backgroundColor: backgroundColor }">
        <v-container fluid>
          <router-view/>
        </v-container>
      </div>
    </v-main>

    <!-- Footer -->
    <v-footer app color="primary" class="text-center d-flex justify-center px-4">
      <span class="text-caption white--text">
        &copy; {{ currentYear }} 管理系统 - 版权所有
      </span>
    </v-footer>
  </v-app>
</template>

<style scoped>
.v-navigation-drawer {
  transition: 0.2s ease-in-out;
}

.main-content {
  min-height: 100%;
  width: 100%;
}

.v-footer {
  min-height: 48px;
}
</style>