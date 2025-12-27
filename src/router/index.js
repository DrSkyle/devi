import { localAuth } from '@/services/LocalAuthService'

const getUserAndProfile = async () => {
  const profileStore = useProfileStore()
  const staffStore = useStaffStore()

  // 1. Check in-memory session from LocalAuthService
  const currentUser = localAuth.getCurrentUser()

  if (currentUser) {
    // Session is active
    return {
      user: currentUser,
      profile: {
        role: currentUser.role,
        name: currentUser.name,
        pharmacyId: currentUser.pharmacyId
      },
      isStaff: true // In this new model, everyone is "staff" (even admin)
    }
  }

  // 2. If no memory session, try to re-hydrate from PIN (Auto-login not secure for PIN)
  // But maybe we want to check if ANYONE exists to direct to Onboarding vs Login?
  // We can just return null. The guards will handle redirection.

  return { user: null, profile: null, isStaff: false }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Auth & Setup Routes ---
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('../views/OnboardingView.vue'),
      meta: { showNav: false },
    },
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
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/record-sale',
      name: 'record-sale',
      component: () => import('../views/RecordSaleView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/CustomersView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TaskBoardView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    // *** NEW PRESCRIPTION HUB ROUTE ***
    {
      path: '/prescriptions',
      name: 'prescriptions',
      component: () => import('../views/PrescriptionsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/my-pharmacy',
      name: 'my-pharmacy',
      component: () => import('../views/MyPharmacyView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/compliance',
      name: 'compliance',
      component: () => import('../views/ComplianceView.vue'),
      meta: { requiresAuth: true, showNav: true },
    },
    {
      path: '/more',
      name: 'more',
      component: () => import('../views/MoreView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },

    // --- All Other Routes (Unchanged) ---
    {
      path: '/add-inventory',
      name: 'add-inventory',
      component: () => import('../views/AddInventoryView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/inventory-alerts',
      name: 'inventory-alerts',
      component: () => import('../views/InventoryAlertsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/inventory/edit/:id',
      name: 'edit-inventory',
      component: () => import('../views/EditInventoryView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: () => import('../views/SuppliersView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/suppliers/:id',
      name: 'supplier-detail',
      component: () => import('../views/SupplierDetailView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/suppliers/:id/new-po',
      name: 'create-po',
      component: () => import('../views/CreatePurchaseOrderView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/end-of-day-report',
      name: 'end-of-day-report',
      component: () => import('../views/EndOfDayReportView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/receipt/:id',
      name: 'receipt',
      component: () => import('../views/ReceiptView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/credit-note/:id',
      name: 'credit-note',
      component: () => import('../views/CreditNoteView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/sales-history',
      name: 'sales-history',
      component: () => import('../views/SalesHistoryView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },

    {
      path: '/process-return',
      name: 'process-return',
      component: () => import('../views/ProcessReturnView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/medicine-finder',
      name: 'medicine-finder',
      component: () => import('../views/MedicineFinderView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/add-prescription',
      name: 'add-prescription',
      component: () => import('../views/AddPrescriptionView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/prescriptions/edit/:id',
      name: 'edit-prescription',
      component: () => import('../views/EditPrescriptionView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/staff-report',
      name: 'staff-report',
      component: () => import('../views/StaffReportView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/audit-log',
      name: 'audit-log',
      component: () => import('../views/AuditLogView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('../views/NotificationsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },

    {
      path: '/dda-log',
      name: 'dda-log',
      component: () => import('../views/DdaLogView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/analytics',
      name: 'analytics',
      component: () => import('../views/AnalyticsView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/profit-report',
      name: 'profit-report',
      component: () => import('../views/ProfileReportView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin'] },
    },
    {
      path: '/transfers',
      name: 'transfers',
      component: () => import('../views/TransfersView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist'] },
    },
    {
      path: '/customers/:id',
      name: 'customer-detail',
      component: () => import('../views/CustomerDetailView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
    },
    {
      path: '/profile',
      name: 'staff-profile',
      component: () => import('../views/StaffProfileView.vue'),
      meta: { requiresAuth: true, showNav: true, roles: ['admin', 'pharmacist', 'cashier'] },
      beforeEnter: async (to, from, next) => {
        const { profile } = await getUserAndProfile()
        // If Admin, redirect to My Pharmacy
        if (profile && profile.role === 'admin') {
          next({ name: 'my-pharmacy' })
        } else {
          next()
        }
      },
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  // 1. Check if system is initialized (has admin)
  const hasAdmin = await localAuth.hasAdmin()

  // 2. Initial Setup Flow
  if (!hasAdmin) {
    if (to.name === 'signup') return next()
    return next({ name: 'signup' }) // Redirect everything to Setup
  }

  // 3. If setup is done, blocking Signup page
  if (hasAdmin && to.name === 'signup') {
    return next({ name: 'login' })
  }

  // 4. Auth Check
  const { user, profile } = await getUserAndProfile()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !user) {
    return next({ name: 'login' })
  }

  // 5. Already Logged In
  if (user && to.name === 'login') {
    return next({ name: 'home' })
  }

  // 6. Role Checks
  let activeRole = user?.role || 'cashier'
  if (to.meta.roles && !to.meta.roles.includes(activeRole)) {
     // Unauthorized
     return next({ name: 'home' })
  }

  next()
})

export default router
