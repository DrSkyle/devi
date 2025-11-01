import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/supabase'
import { db } from '@/db'

const getUserAndProfile = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    return { user: null, profile: null }
  }

  const localProfile = await db.profiles.toCollection().first()

  if (localProfile) {
    return { user, profile: localProfile }
  }

  const { data: remoteProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return { user, profile: remoteProfile }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Auth & Setup Routes ---
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { showNav: false },
    },
    {
      path: '/admin-login',
      name: 'admin-login',
      component: () => import('../views/AdminLoginView.vue'),
      meta: { showNav: false },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/SignupView.vue'),
      meta: { showNav: false },
    },
    {
      path: '/profile-setup',
      name: 'profile-setup',
      component: () => import('../views/ProfileSetupView.vue'),
      meta: { requiresAuth: true, showNav: false },
    },

    // --- Core App Routes ---
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/record-sale',
      name: 'record-sale',
      component: () => import('../views/RecordSaleView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/CustomersView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    // *** NEW PRESCRIPTION HUB ROUTE ***
    {
      path: '/prescriptions',
      name: 'prescriptions',
      component: () => import('../views/PrescriptionsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/my-pharmacy',
      name: 'my-pharmacy',
      component: () => import('../views/MyPharmacyView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('../views/MoreView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },

    // --- All Other Routes (Unchanged) ---
    {
      path: '/add-inventory',
      name: 'add-inventory',
      component: () => import('../views/AddInventoryView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/inventory-alerts',
      name: 'inventory-alerts',
      component: () => import('../views/InventoryAlertsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/inventory/edit/:id',
      name: 'edit-inventory',
      component: () => import('../views/EditInventoryView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: () => import('../views/SuppliersView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/suppliers/:id',
      name: 'supplier-detail',
      component: () => import('../views/SupplierDetailView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/suppliers/:id/new-po',
      name: 'create-po',
      component: () => import('../views/CreatePurchaseOrderView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/end-of-day-report',
      name: 'end-of-day-report',
      component: () => import('../views/EndOfDayReportView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/receipt/:id',
      name: 'receipt',
      component: () => import('../views/ReceiptView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/credit-note/:id',
      name: 'credit-note',
      component: () => import('../views/CreditNoteView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/sales-history',
      name: 'sales-history',
      component: () => import('../views/SalesHistoryView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/my-transactions',
      name: 'my-transactions',
      component: () => import('../views/MyTransactionsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/process-return',
      name: 'process-return',
      component: () => import('../views/ProcessReturnView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/medicine-finder',
      name: 'medicine-finder',
      component: () => import('../views/MedicineFinderView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/add-prescription',
      name: 'add-prescription',
      component: () => import('../views/AddPrescriptionView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/prescriptions/edit/:id',
      name: 'edit-prescription',
      component: () => import('../views/EditPrescriptionView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/staff-report',
      name: 'staff-report',
      component: () => import('../views/StaffReportView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/audit-log',
      name: 'audit-log',
      component: () => import('../views/AuditLogView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },

    {
      path: '/dda-log',
      name: 'dda-log',
      component: () => import('../views/DdaLogView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/forecasting',
      name: 'forecasting',
      component: () => import('../views/ForecastingView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/profit-report',
      name: 'profit-report',
      component: () => import('../views/ProfileReportView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/transfers',
      name: 'transfers',
      component: () => import('../views/TransfersView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: () => import('../views/CustomerDetailView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const { user, profile } = await getUserAndProfile()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const isStaffSession = sessionStorage.getItem('isStaffSession') === 'true'

  if (requiresAuth && !user && !isStaffSession) {
    next({ name: 'login' })
  } else if (user && !profile && to.name !== 'profile-setup') {
    next({ name: 'profile-setup' })
  } else if (user && profile && to.name === 'profile-setup') {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
