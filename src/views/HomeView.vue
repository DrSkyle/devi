<template>
  <div class="dashboard-container p-4 max-w-7xl mx-auto">
    <Toast />

    <!-- Header -->
    <div class="flex flex-column gap-4 mb-6">
      <!-- Top Bar -->
      <div class="flex justify-content-between align-items-center">
        <div
          class="relative cursor-pointer hover:bg-white-alpha-10 p-2 border-round-circle transition-colors"
          @click="router.push('/notifications')"
        >
          <i class="pi pi-bell text-xl text-white"></i>
          <span
            v-if="notificationStore.unreadCount > 0"
            class="absolute top-0 right-0 block w-2 h-2 border-round-circle bg-red-500"
          ></span>
        </div>

        <!-- Right: User Profile Dropdown -->
        <div
          class="flex align-items-center gap-3 bg-white-alpha-5 border-1 border-white-alpha-10 border-round-3xl pl-3 pr-2 py-1 cursor-pointer hover:bg-white-alpha-10 transition-colors"
          @click="toggleProfileMenu"
        >
          <div class="flex flex-column align-items-end mr-2 hidden md:flex">
            <span class="text-sm font-bold text-white">{{
              staffStore.activeUserName || profile.name || 'User'
            }}</span>
            <span class="text-xs text-gray-400 uppercase">{{
              profile.pharmacyName || 'D.E.V.I'
            }}</span>
          </div>
          <Avatar
            :label="profile.name ? profile.name[0] : 'U'"
            shape="circle"
            class="bg-primary text-white"
          />
          <i class="pi pi-chevron-down text-xs text-gray-400"></i>

          <Menu ref="profileMenu" :model="profileMenuItems" :popup="true" class="glass-menu" />
        </div>
      </div>

      <!-- Stats Row -->
      <div class="flex align-items-center gap-4 overflow-x-auto pb-2">
        <div class="glass-panel px-4 py-3 flex align-items-center gap-3 min-w-max">
          <div
            class="bg-primary-500 border-round-2xl p-2 flex align-items-center justify-content-center"
          >
            <i class="pi pi-shopping-cart text-white text-xl"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 uppercase font-bold">Total Orders</div>
            <div class="text-2xl font-bold text-white">{{ stats.totalSales || 0 }}</div>
          </div>
        </div>
        <!-- Add more summary stats here if needed -->
      </div>
    </div>

    <!-- Premium Dashboard Layout -->
    <div class="grid nested-grid">
      <!-- Left Column: Stats & Actions -->
      <div class="col-12 lg:col-8">
        <div class="flex flex-column gap-4">
          <!-- Hero Stats Row -->
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="glass-panel p-4 relative overflow-hidden h-full">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                  <i class="pi pi-wallet text-8xl text-white"></i>
                </div>
                <div class="relative z-1">
                  <div class="text-gray-400 font-medium mb-2 uppercase tracking-wider text-xs">
                    Today's Revenue
                  </div>
                  <div class="text-5xl font-thin text-white mb-2">
                    <span class="text-2xl align-top opacity-50 mr-1">Rs.</span
                    >{{ dashboardStats.totalRevenue.toLocaleString() }}
                  </div>
                  <div class="flex align-items-center gap-2 text-green-400 text-sm">
                    <i class="pi pi-arrow-up"></i>
                    <span>{{ dashboardStats.salesCount }} transactions</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="glass-panel p-4 relative overflow-hidden h-full">
                <div class="absolute top-0 right-0 p-4 opacity-10">
                  <i class="pi pi-users text-8xl text-white"></i>
                </div>
                <div class="relative z-1">
                  <div class="text-gray-400 font-medium mb-2 uppercase tracking-wider text-xs">
                    Customers Served
                  </div>
                  <div class="text-5xl font-thin text-white mb-2">
                    {{ dashboardStats.customersServed }}
                  </div>
                  <div class="text-gray-400 text-sm">Unique visitors today</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Grid -->
          <div class="grid">
            <div class="col-12 md:col-4">
              <RouterLink to="/record-sale" class="no-underline block h-full">
                <div
                  class="glass-panel p-4 h-full hover:bg-white-alpha-10 transition-all cursor-pointer flex flex-column align-items-center text-center gap-3"
                >
                  <div
                    class="bg-primary-500 border-round-circle w-4rem h-4rem flex align-items-center justify-content-center shadow-4"
                  >
                    <i class="pi pi-shopping-cart text-xl text-white"></i>
                  </div>
                  <div>
                    <div class="font-bold text-white mb-1">New Sale</div>
                    <div class="text-xs text-gray-400">Record transaction</div>
                  </div>
                </div>
              </RouterLink>
            </div>
            <div class="col-12 md:col-4" v-if="staffStore.activeUserRole !== 'cashier'">
              <RouterLink to="/add-inventory" class="no-underline block h-full">
                <div
                  class="glass-panel p-4 h-full hover:bg-white-alpha-10 transition-all cursor-pointer flex flex-column align-items-center text-center gap-3"
                >
                  <div
                    class="bg-white-alpha-10 border-round-circle w-4rem h-4rem flex align-items-center justify-content-center"
                  >
                    <i class="pi pi-box text-xl text-white"></i>
                  </div>
                  <div>
                    <div class="font-bold text-white mb-1">Add Stock</div>
                    <div class="text-xs text-gray-400">Update inventory</div>
                  </div>
                </div>
              </RouterLink>
            </div>
            <div class="col-12 md:col-4">
              <RouterLink to="/medicine-finder" class="no-underline block h-full">
                <div
                  class="glass-panel p-4 h-full hover:bg-white-alpha-10 transition-all cursor-pointer flex flex-column align-items-center text-center gap-3"
                >
                  <div
                    class="bg-white-alpha-10 border-round-circle w-4rem h-4rem flex align-items-center justify-content-center"
                  >
                    <i class="pi pi-search text-xl text-white"></i>
                  </div>
                  <div>
                    <div class="font-bold text-white mb-1">Find Meds</div>
                    <div class="text-xs text-gray-400">Search network</div>
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Alerts & Shift -->
      <div class="col-12 lg:col-4">
        <div class="flex flex-column gap-4 h-full">
          <!-- Shift Command Center -->
          <ShiftManager v-if="staffStore.activeUserRole !== 'admin'" />

          <!-- Alerts Panel -->
          <div class="glass-panel flex-grow-1 p-0 overflow-hidden flex flex-column">
            <div class="p-3 bg-white-alpha-5 border-bottom-1 border-white-alpha-10">
              <div class="font-bold text-white flex align-items-center gap-2">
                <i class="pi pi-bell text-orange-400"></i> Attention Needed
              </div>
            </div>
            <div class="p-0 flex-grow-1 overflow-y-auto custom-scrollbar">
              <RouterLink
                to="/inventory-alerts"
                class="no-underline block p-3 hover:bg-white-alpha-5 border-bottom-1 border-white-alpha-5 transition-colors"
              >
                <div class="flex justify-content-between align-items-center">
                  <div class="flex align-items-center gap-3">
                    <div
                      class="w-2rem h-2rem border-round bg-red-500/20 flex align-items-center justify-content-center"
                    >
                      <span class="font-bold text-red-400">{{
                        dashboardStats.expiringSoonCount
                      }}</span>
                    </div>
                    <span class="text-gray-300 text-sm">Expiring Soon</span>
                  </div>
                  <i class="pi pi-chevron-right text-xs text-gray-500"></i>
                </div>
              </RouterLink>
              <RouterLink
                to="/inventory-alerts"
                class="no-underline block p-3 hover:bg-white-alpha-5 transition-colors"
              >
                <div class="flex justify-content-between align-items-center">
                  <div class="flex align-items-center gap-3">
                    <div
                      class="w-2rem h-2rem border-round bg-orange-500/20 flex align-items-center justify-content-center"
                    >
                      <span class="font-bold text-orange-400">{{
                        dashboardStats.lowStockCount
                      }}</span>
                    </div>
                    <span class="text-gray-300 text-sm">Low Stock</span>
                  </div>
                  <i class="pi pi-chevron-right text-xs text-gray-500"></i>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Shift Dialogs (Using PrimeVue Dialog/ConfirmDialog instead of custom prompts) -->
    <!-- Shift Dialogs Removed -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { RouterLink, useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile.js'
import { useStaffStore } from '@/stores/staff.js'
import { useNotificationStore } from '@/stores/notification.js'
import { isExpiringSoon } from '@/utils/dateUtils'

import Avatar from 'primevue/avatar'
import Menu from 'primevue/menu'
import Toast from 'primevue/toast'
import ShiftManager from '@/components/ShiftManager.vue'

const router = useRouter()
const profile = useProfileStore()
const staffStore = useStaffStore()
const notificationStore = useNotificationStore()

const isLoading = ref(true)

// Profile Menu
const profileMenu = ref(null)
const profileMenuItems = computed(() => [
  {
    label: 'My Profile',
    icon: 'pi pi-user',
    command: () => {
      const target = staffStore.activeUserRole === 'admin' ? '/settings' : '/profile'
      router.push(target)
    },
  },
  {
    label: 'Logout',
    icon: 'pi pi-sign-out',
    command: () => handleLogout(),
  },
])

const toggleProfileMenu = (event) => {
  profileMenu.value.toggle(event)
}

const handleLogout = async () => {
  // Local Logout
  staffStore.logout()
  // profile.clear() // If profile store has clear method
  router.push('/login')
}
const stats = ref({
  totalSales: 0,
})
const dashboardStats = ref({
  totalRevenue: 0,
  salesCount: 0,
  customersServed: 0,
  totalProfit: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
})

const resetStats = () => {
  Object.assign(dashboardStats.value, {
    totalRevenue: 0,
    totalProfit: 0,
    salesCount: 0,
    customersServed: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
  })
}

let salesSub = null
let inventorySub = null

const subscribeToStats = () => {
  if (salesSub) salesSub.unsubscribe()
  if (inventorySub) inventorySub.unsubscribe()

  const pharmacyId = profile.pharmacyId
  if (!pharmacyId) return

  isLoading.value = true
  resetStats()

  // Sales Stats (Today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  salesSub = database
    .get('sales')
    .query(Q.where('pharmacy_id', pharmacyId), Q.where('created_at', Q.gte(todayTimestamp)))
    .observe()
    .subscribe((records) => {
      const filtered = records.filter((sale) => {
        if (sale.status === 'void') return false

        // Filter by Staff if not Admin
        if (staffStore.activeUserRole !== 'admin') {
          const staffName = staffStore.activeUserName
          const staffId = staffStore.activeUserId
          return sale.staff_name === staffName || (sale.user_id && sale.user_id === staffId)
        }
        return true
      })

      dashboardStats.value.salesCount = filtered.length
      dashboardStats.value.totalRevenue = filtered.reduce((sum, sale) => sum + (sale.total || 0), 0)
      dashboardStats.value.customersServed = filtered.length
      stats.value.totalSales = filtered.length
    })

  // Inventory Stats
  inventorySub = database
    .get('inventory')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      dashboardStats.value.lowStockCount = records.filter(
        (item) => item.quantity < (item.min_stock_level || 10),
      ).length
      dashboardStats.value.expiringSoonCount = records.filter((item) =>
        isExpiringSoon(item.expiry_date),
      ).length
      isLoading.value = false
    })

  if (profile.pharmacyId) {
    notificationStore.checkUnreadMessages(profile.pharmacyId)
  }
}

onMounted(() => {
  subscribeToStats()
})

onUnmounted(() => {
  if (salesSub) salesSub.unsubscribe()
  if (inventorySub) inventorySub.unsubscribe()
})

watch(() => profile.pharmacyId, subscribeToStats)
</script>

<style scoped>
/* PrimeFlex handles most layout. Custom tweaks here if needed. */
</style>
