import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useProfileStore } from '@/stores/profile'
import { useStaffStore } from '@/stores/staff'

const getUserAndProfile = async () => {
  const profileStore = useProfileStore()
  const staffStore = useStaffStore()

  // 1. Check for Staff Session (Offline/Local)
  let isStaffSession = sessionStorage.getItem('isStaffSession') === 'true'
  let staffId = sessionStorage.getItem('activeStaffId')

  if (!isStaffSession) {
      staffId = localStorage.getItem('persistentStaffId')
      if (staffId) isStaffSession = true
  }

  if (isStaffSession && staffId) {
    if (staffId) {
      let staffMember = null
      try {
        staffMember = await database.get('staff').find(staffId)
      } catch {
        const results = await database.get('staff').query(Q.where('id', staffId)).fetch()
        if (results.length > 0) staffMember = results[0]
      }

      const profiles = await database.get('profiles').query().fetch()
      const adminProfile = profiles.length > 0 ? profiles[0] : null

      if (staffMember && adminProfile) {
        profileStore.setProfile(adminProfile)
        staffStore.setActiveUser(staffMember)
        return { user: { id: staffMember.id }, profile: adminProfile, isStaff: true }
      }
    }
  }

  // 2. Check for Admin/Owner Session (Local database only)
  // We assume if there is a profile in the local DB, we might be "logged in"
  // pending a real local auth check. For now, we strictly check for a local session token
  // or just default to check if a profile exists and we have an 'adminAuthenticated' flag.

  const isAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true'

  if (isAdminAuthenticated) {
    try {
      const profiles = await database.get('profiles').query().fetch()
      if (profiles.length > 0) {
         const localProfile = profiles[0]
         profileStore.setProfile(localProfile)
         return { user: { id: localProfile.userId }, profile: localProfile, isStaff: false }
      }
    } catch (e) {
      console.error("Error fetching local profile", e)
    }
  }

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
  const { user, profile, isStaff } = await getUserAndProfile()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // Determine active role
  let activeRole = 'admin' // Default for owner
  if (isStaff) {
    const staffRole = sessionStorage.getItem('activeStaffRole')
    if (staffRole) activeRole = staffRole
  } else if (profile && profile.role) {
    activeRole = profile.role
  }

  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')

  if (!hasSeenOnboarding && to.name !== 'onboarding') {
    next({ name: 'onboarding' })
  } else if (requiresAuth && !user && !isStaff) {
    next({ name: 'login' })
  } else {
    // Legacy Checks
    // ...
    // Note: I will preserve the existing checks but nested correctly outside the first IF
    // Actually, I can just insert the onboarding check as the TOP priority
    // But I must be careful not to create infinite loop if 'onboarding' is blocked by something else (it isn't).

    // Existing logic continues...
    if (isStaff && to.name === 'profile-setup') {
       // ... existing
       next({ name: 'home' })
    } else if (user && !profile && to.name !== 'profile-setup' && !isStaff) {
       next({ name: 'profile-setup' })
    } else if (user && profile && to.name === 'profile-setup') {
       next({ name: 'home' })
    } else {
       // Role Check
       if (to.meta.roles && !to.meta.roles.includes(activeRole)) {
         next({ name: 'home' })
       } else {
         next()
       }
    }
  }
})

export default router
