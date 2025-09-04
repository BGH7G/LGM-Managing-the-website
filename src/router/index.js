import {createRouter, createWebHistory} from 'vue-router'
import HomeView from '../views/Home.vue'
import DefaultLayout from '../layout/DefaultLayout.vue'
import {useUserStore} from '@/stores/auth'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: DefaultLayout,
            children: [
                {
                    path: '',
                    name: 'Home',
                    component: HomeView,
                    meta: {requiresAuth: true}
                },
                {
                    path: '/profile',
                    name: 'profile',
                    component: () => import("@/views/profile.vue"),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/dataShow/huSheep/huSheepIndividual',
                    name: 'huSheep_Individual',
                    component: () => import('@/views/dataShow/huSheep/huSheepIndividual.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/dataShow/huSheep/:id',
                    name: 'huSheep_detail',
                    component: () => import('@/views/dataShow/huSheep/huSheepDetail.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/dataShow/huSheep/huSheepPhenotype',
                    name: 'huSheep_phenotype',
                    component: () => import('@/views/dataShow/huSheep/huSheepPhenotype.vue'),
                    meta: {requiresAuth: true}
                }, {
                    path: '/dataShow/holstein/holsteinIndividual',
                    name: 'holstein_Individual',
                    component: () => import('@/views/dataShow/holstein/holsteinIndividual.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    //phenotype
                    path: '/dataShow/holstein/holsteinPhenotype',
                    name: 'holstein_phenotype',
                    component: () => import('@/views/dataShow/holstein/holsteinPhenotype.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    // location
                    path: '/dataShow/location',
                    name: 'location',
                    component: () => import('@/views/dataShow/location.vue'),
                    meta: {requiresAuth: true}
                }, {
                    // ageMilestone
                    path: '/dataShow/ageMilestone',
                    name: 'ageMilestone',
                    component: () => import('@/views/dataShow/ageMilestone.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/goods',
                    name: 'goods',
                    component: () => import('../views/dataShow/goods.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/photo',
                    name: 'photos',
                    component: () => import('../views/dataShow/photo.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path:'/textEditor',
                    name: 'textEditor',
                    component: () => import('../views/textEditor.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path:'/approval',
                    name: 'approval',
                    component: () => import('../views/dataShow/approval.vue'),
                    meta: {requiresAuth: true, role: ['admin']}
                },
                {
                    path:'/claim',
                    name: 'claim',
                    component: () => import('../views/dataShow/claim.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/photo/:id',
                    name: 'photo_detail',
                    component: () => import('@/views/dataShow/photoIndividual.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path:'/news',
                    name: 'news',
                    component: () => import('../views/webM/news.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/member',
                    name: 'member',
                    component: () => import('../views/webM/member.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/publish',
                    name: 'publish',
                    component: () => import('../views/webM/publish.vue'),
                    meta: {requiresAuth: true}
                },
                {
                    path: '/help',
                    name: 'help',
                    component: () => import('../views/help.vue'),
                }
            ]
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
            meta: {requiresAuth: false}
        },
        {
            path: '/register',
            name: 'register',
            component: () => import('../views/Register.vue'),
            meta: {requiresAuth: false}
        }
    ],
})

router.beforeEach(async (to) => {
    const authStore = useUserStore()
    // Redirect authenticated users away from login
    if (to.name === 'login' && authStore.isAuthenticated) {
        return { path: '/' }
    }

    if (to.meta.requiresAuth) {
        if (!authStore.isAuthenticated) {
            // 未登录：跳登录页并记录原目标
            return {
                name: 'login',
                query: { redirect: to.fullPath }
            }
        }

        // 确保已加载用户信息后再进行角色校验
        await authStore.initialize();

        // 角色访问控制：仅当当前角色包含于允许列表时放行
        const allowedRoles = to.meta.role;
        const role = authStore.userInfo?.role;
        if (Array.isArray(allowedRoles) && allowedRoles.length) {
            if (!allowedRoles.includes(role)) {
                return { name: 'Home' }
            }
        }
    }
})

export default router

