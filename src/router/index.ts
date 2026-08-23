import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import HomeView from '@/views/HomeView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true, roles: ['OWNER', 'PHARMACIST', 'CASHIER'] },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/features/auth/views/SignupView.vue'),
    meta: { public: true },
  },
  {
    path: '/inventory',
    name: 'inventory',
    component: () => import('@/features/inventory/views/InventoryView.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'PHARMACIST'] },
  },
  {
    path: '/pos',
    name: 'pos',
    component: () => import('@/features/pos/views/POSView.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'PHARMACIST', 'CASHIER'] },
  },
  {
    path: '/compliance',
    name: 'compliance',
    component: () => import('@/features/compliance/views/ComplianceView.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'PHARMACIST'] },
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: () => import('@/features/analytics/views/AnalyticsView.vue'),
    meta: { requiresAuth: true, roles: ['OWNER'] },
  },
  {
    path: '/prescriptions',
    name: 'prescriptions',
    component: () => import('@/features/prescriptions/views/PrescriptionsView.vue'),
    meta: { requiresAuth: true, roles: ['OWNER', 'PHARMACIST'] },
  },
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const token = authStore.token
  const user = authStore.user
  
  const pharmacyCode = localStorage.getItem('pharmacyCode')

  // 1. Force signup if no pharmacy is registered yet
  if (!pharmacyCode && to.path !== '/signup') {
    return next('/signup')
  }

  // 2. Prevent routing to signup if already registered but not logged in (allow login instead)
  if (pharmacyCode && to.path === '/signup' && !token) {
    return next('/login')
  }

  // 3. Normal auth guard
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
    // Redirect to home if user doesn't have the required role
    next('/')
  } else {
    next()
  }
})

export default router
