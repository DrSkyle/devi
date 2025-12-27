<template>
  <div class="more-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">More Options</h1>
      <p class="text-gray-400 text-sm">Manage reports, suppliers, and your account.</p>
    </div>

    <!-- Menu Grid -->
    <div class="grid">
      <template v-for="(item, index) in navItems" :key="index">
        <!-- Section Header -->
        <div v-if="item.isHeader" class="col-12 mt-2 mb-1">
          <div class="text-xs font-bold text-primary uppercase tracking-wider">
            {{ item.label }}
          </div>
        </div>

        <!-- Menu Item -->
        <div v-else class="col-6 md:col-4 lg:col-3">
          <RouterLink :to="item.to" class="no-underline block h-full">
            <div
              class="glass-panel h-full p-4 flex flex-column align-items-center justify-content-center text-center gap-3 hover:bg-white-alpha-10 transition-all cursor-pointer group"
            >
              <div
                class="w-4rem h-4rem border-circle bg-white-alpha-5 flex align-items-center justify-content-center group-hover:scale-110 transition-transform"
              >
                <i :class="item.icon" class="text-3xl text-white"></i>
              </div>
              <span class="text-white font-medium">{{ item.label }}</span>
            </div>
          </RouterLink>
        </div>
      </template>
    </div>

    <!-- Logout Button -->
    <div class="mt-6">
      <Button
        label="Log Out"
        icon="pi pi-power-off"
        severity="danger"
        outlined
        class="w-full md:w-auto"
        @click="logOut"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { database } from '@/database'
import { usePromptStore } from '@/stores/prompt.js'
import { useStaffStore } from '@/stores/staff'
import Button from 'primevue/button'
import { localAuth } from '@/services/LocalAuthService'

const prompt = usePromptStore()
const staffStore = useStaffStore()

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
    { label: 'Transactions', icon: 'pi pi-history', to: '/my-transactions', roles: ['admin'] },
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

    { label: 'System', isHeader: true, roles: ['admin'] },
    {
      label: 'My Pharmacy',
      icon: 'pi pi-building',
      to: '/my-pharmacy',
      roles: ['admin'],
    },
    { label: 'Settings', icon: 'pi pi-cog', to: '/settings', roles: ['admin'] },
  ]

  const bottomNavPaths = ['/', '/record-sale', '/medicine-finder', '/customers']

  // 1. Filter by Role & Bottom Nav
  const visibleItems = allItems.filter((item) => {
    // Check Role
    if (item.roles && !item.roles.includes(role)) return false

    // Check Bottom Nav (skip headers)
    if (!item.isHeader && bottomNavPaths.includes(item.to)) return false

    return true
  })

  // 2. Filter Empty Headers
  return visibleItems.filter((item, index, array) => {
    if (item.isHeader) {
      const nextItem = array[index + 1]
      // If next item is missing or is also a header, then this header is empty
      if (!nextItem || nextItem.isHeader) {
        return false
      }
    }
    return true
  })
})

const logOut = async () => {
  try {
    await prompt.show({
      type: 'confirm',
      title: 'Confirm Log Out',
      message: 'Are you sure you want to log out?',
    })

    await localAuth.logout()
    await database.unsafeResetDatabase()
    window.location.href = '/login'
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      console.error('Logout failed:', error)
    }
  }
}
</script>

<style scoped>
/* No custom CSS needed, using utility classes */
</style>
