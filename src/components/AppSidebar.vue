<template>
  <aside class="app-sidebar glass-panel flex flex-column h-full relative overflow-hidden">
    <!-- Logo Section -->
    <div class="sidebar-header p-4 mb-2 flex align-items-center gap-3">
      <div
        class="logo-icon flex align-items-center justify-content-center bg-primary border-round-lg"
        style="width: 40px; height: 40px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4)"
      >
        <i class="pi pi-heart-fill text-white text-xl"></i>
      </div>
      <div class="flex flex-column">
        <span class="text-xl font-bold text-white tracking-tight">D.E.V.I</span>
        <span class="text-xs text-gray-400 uppercase tracking-wider">{{
          profileStore.pharmacyName || 'Pharmacy OS'
        }}</span>
      </div>
    </div>

    <!-- Navigation Menu -->
    <div class="flex-grow-1 overflow-y-auto custom-scrollbar px-3">
      <div class="flex flex-column gap-1">
        <template v-for="(item, index) in navItems" :key="index">
          <!-- Section Header -->
          <div
            v-if="item.isHeader"
            class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-4 mb-2 px-3"
          >
            {{ item.label }}
          </div>

          <!-- Menu Item -->
          <RouterLink
            v-else
            :to="item.to"
            class="nav-item flex align-items-center gap-3 px-3 py-3 border-round-xl transition-all duration-200 no-underline mb-1"
            :class="{ 'active-nav-item': isRouteActive(item.to) }"
          >
            <i :class="[item.icon, 'text-lg transition-colors duration-200']"></i>
            <span class="font-medium text-sm">{{ item.label }}</span>
            <i
              v-if="isRouteActive(item.to)"
              class="pi pi-chevron-right ml-auto text-xs opacity-50"
            ></i>
          </RouterLink>
        </template>
      </div>
    </div>

    <!-- Bottom "System" Section -->
    <div class="p-3 mt-auto">
      <!-- System Links (My Pharmacy & Settings) -->
      <div class="flex flex-column gap-1 mb-3 border-top-1 border-white-alpha-10 pt-3">
        <RouterLink
          v-if="staffStore.activeUserRole === 'admin'"
          to="/my-pharmacy"
          class="flex align-items-center p-3 text-gray-400 hover:text-white hover:bg-white-alpha-10 border-round transition-colors no-underline"
          :class="{ 'active-nav-item': isRouteActive('/my-pharmacy') }"
        >
          <i class="pi pi-building mr-3 text-xl"></i>
          <span class="font-medium">My Pharmacy</span>
        </RouterLink>

        <RouterLink
          v-if="staffStore.activeUserRole === 'admin'"
          to="/settings"
          class="flex align-items-center p-3 text-gray-400 hover:text-white hover:bg-white-alpha-10 border-round transition-colors no-underline"
          :class="{ 'active-nav-item': isRouteActive('/settings') }"
        >
          <i class="pi pi-cog mr-3 text-xl"></i>
          <span class="font-medium">Settings</span>
        </RouterLink>
      </div>

      <!-- Logout Button -->
      <div
        class="flex align-items-center p-3 text-gray-400 hover:text-white hover:bg-white-alpha-10 border-round transition-colors cursor-pointer mb-2"
        @click="logOut"
      >
        <i class="pi pi-sign-out mr-3 text-xl"></i>
        <span class="font-medium">Log Out</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'

import { useConfirm } from 'primevue/useconfirm'

import { useStaffStore } from '@/features/staff/store'
import { useProfileStore } from '@/features/profile/store'

const router = useRouter()
const route = useRoute()
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const confirm = useConfirm()

const navItems = computed(() => {
  const role = staffStore.activeUserRole || 'admin'

  const allItems = [
    { label: 'Overview', isHeader: true, roles: ['admin', 'pharmacist', 'cashier'] },
    { label: 'Dashboard', icon: 'pi pi-home', to: '/', roles: ['admin', 'pharmacist', 'cashier'] },
    {
      label: 'Medicine Finder',
      icon: 'pi pi-search',
      to: '/medicine-finder',
      roles: ['admin', 'pharmacist', 'cashier'],
    },

    { label: 'Management', isHeader: true, roles: ['admin', 'pharmacist', 'cashier'] },
    {
      label: 'Inventory',
      icon: 'pi pi-box',
      to: '/inventory',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'Sales & Orders',
      icon: 'pi pi-shopping-cart',
      to: '/record-sale',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'Customers',
      icon: 'pi pi-users',
      to: '/customers',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'Suppliers',
      icon: 'pi pi-truck',
      to: '/suppliers',
      roles: ['admin', 'pharmacist'],
    },
    {
      label: 'Stock Transfers',
      icon: 'pi pi-arrow-right-arrow-left',
      to: '/transfers',
      roles: ['admin', 'pharmacist'],
    },
    {
      label: 'Prescriptions',
      icon: 'pi pi-file',
      to: '/prescriptions',
      roles: ['admin', 'pharmacist'],
    },
    {
      label: 'Process Return',
      icon: 'pi pi-replay',
      to: '/process-return',
      roles: ['admin', 'pharmacist'],
    },

    { label: 'Reports', isHeader: true, roles: ['admin', 'pharmacist', 'cashier'] },
    { label: 'Reports', icon: 'pi pi-chart-line', to: '/reports', roles: ['admin'] },

    {
      label: 'Sales History',
      icon: 'pi pi-history',
      to: '/sales-history',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    { label: 'Activity Log', icon: 'pi pi-shield', to: '/audit-log', roles: ['admin'] },
    {
      label: 'Compliance & Audit',
      icon: 'pi pi-briefcase',
      to: '/compliance',
      roles: ['admin', 'pharmacist'],
    },
  ]

  return allItems.filter((item) => !item.roles || item.roles.includes(role))
})

const isRouteActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const logOut = () => {
  confirm.require({
    message: 'Are you sure you want to log out?',
    header: 'Confirm Logout',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      sessionStorage.clear()
      await supabase.auth.signOut()
      router.push('/login')
    },
  })
}
</script>

<style scoped>
.app-sidebar {
  background: rgba(2, 6, 23, 0.8); /* Deep slate, almost black */
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-item {
  color: var(--text-secondary);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
}

.active-nav-item {
  background: rgba(16, 185, 129, 0.15); /* Green tint */
  color: var(--accent-glow) !important;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.active-nav-item i {
  color: var(--accent-glow);
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.upgrade-card {
  background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Custom Scrollbar for sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
</style>
