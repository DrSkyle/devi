<template>
  <div class="app-bottom-nav fixed bottom-0 left-0 w-full z-5 border-top-1 border-white-alpha-10">
    <div class="glass-effect absolute inset-0"></div>

    <div class="relative flex justify-content-around align-items-stretch w-full h-full pb-safe">
      <div
        v-for="item in navItems"
        :key="item.label"
        class="nav-tab flex flex-1 flex-column align-items-center justify-content-center gap-1 cursor-pointer select-none transition-all duration-200"
        :class="{ 'active-tab': isActive(item.to) }"
        @click="handleNavClick(item)"
        v-ripple
      >
        <div class="icon-container relative">
          <i
            :class="[
              item.icon,
              'text-xl transition-all duration-300',
              isActive(item.to) ? '-translate-y-1' : '',
            ]"
          ></i>
          <span
            v-if="isActive(item.to)"
            class="active-indicator absolute -bottom-2 left-0 w-full border-round-xl bg-primary"
            style="height: 3px; box-shadow: 0 0 8px var(--primary-color)"
          ></span>
        </div>

        <span
          class="text-xs font-medium transition-all duration-200"
          :class="isActive(item.to) ? 'text-white' : 'text-gray-400'"
        >
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStaffStore } from '@/features/staff/store'
import { useGlobalSearch } from '@/composables/useGlobalSearch'

// Haptics (Vibration)
const vibrate = () => {
  if (navigator.vibrate) navigator.vibrate(10)
}

const router = useRouter()
const route = useRoute()
const staffStore = useStaffStore()
const { openSearch } = useGlobalSearch()

const navItems = computed(() => {
  const role = staffStore.activeUserRole || 'admin'

  const allItems = [
    { label: 'Home', icon: 'pi pi-home', to: '/', roles: ['admin', 'pharmacist', 'cashier'] },
    {
      label: 'Sales',
      icon: 'pi pi-shopping-bag', // Changed icon for better mobile feel
      to: '/record-sale',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'Finder', // Renamed for "Network" feel
      icon: 'pi pi-search',
      action: () => openSearch(),
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'Patients', // Renamed from Customers
      icon: 'pi pi-users',
      to: '/customers',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
    {
      label: 'More',
      icon: 'pi pi-compass',
      to: '/more',
      roles: ['admin', 'pharmacist', 'cashier'],
    },
  ]

  return allItems.filter((item) => !item.roles || item.roles.includes(role))
})

const handleNavClick = (item) => {
  vibrate() // Tactile feedback
  if (item.action) {
    item.action()
  } else if (item.to) {
    router.push(item.to)
  }
}

const isActive = (path) => {
  if (!path) return false
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.app-bottom-nav {
  height: calc(64px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(10, 10, 10, 0.85); /* Slightly darker for contrast */
}

.glass-effect {
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.nav-tab {
  color: var(--text-secondary);
}

.active-tab {
  color: var(--primary-color);
}

.active-tab i {
  text-shadow: 0 0 12px rgba(var(--primary-rgb), 0.6);
}

/* Touch feedback */
.nav-tab:active {
  transform: scale(0.92);
}
</style>
