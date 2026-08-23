<template>
  <div class="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row font-sans">
    <!-- Mobile Header -->
    <header class="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
      <div class="flex items-center gap-3">
        <div class="logo-box flex items-center justify-center bg-emerald-500 rounded-xl w-9 h-9 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <i class="pi pi-heart-fill text-white text-base"></i>
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-sm leading-none tracking-tight">D.E.V.I</span>
          <span class="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-0.5">{{ authStore.user?.pharmacyName || 'Pharmacy OS' }}</span>
        </div>
      </div>
      <button @click="mobileMenuOpen = !mobileMenuOpen" class="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white transition-all">
        <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'" class="text-lg"></i>
      </button>
    </header>

    <!-- Mobile Menu Drawer Overlay -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" @click="mobileMenuOpen = false" class="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"></div>
    </Transition>

    <!-- Mobile Menu Drawer Content -->
    <Transition name="slide">
      <div v-if="mobileMenuOpen" class="md:hidden fixed top-0 bottom-0 left-0 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-white/5 z-50 p-6 flex flex-col justify-between">
        <div>
          <!-- Drawer Header -->
          <div class="flex items-center gap-3 mb-8">
            <div class="logo-box flex items-center justify-center bg-emerald-500 rounded-xl w-10 h-10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <i class="pi pi-heart-fill text-white text-lg"></i>
            </div>
            <div class="flex flex-col">
              <span class="font-bold text-base tracking-tight">D.E.V.I</span>
              <span class="text-xs text-zinc-400 font-medium uppercase tracking-wider mt-0.5">{{ authStore.user?.pharmacyName || 'Pharmacy OS' }}</span>
            </div>
          </div>

          <!-- Drawer Navigation -->
          <nav class="space-y-1.5">
            <template v-for="item in menuItems" :key="item.path">
              <RouterLink
                v-if="hasAccess(item)"
                :to="item.path"
                @click="mobileMenuOpen = false"
                class="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 no-underline"
                :class="isRouteActive(item.path) 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'"
              >
                <i :class="item.icon" class="text-lg"></i>
                <span class="text-sm">{{ item.name }}</span>
              </RouterLink>
            </template>
          </nav>
        </div>

        <!-- Drawer Footer -->
        <div class="border-t border-white/5 pt-6 space-y-4">
          <div class="flex items-center gap-3 px-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/10">
              {{ authStore.user?.name?.charAt(0) || 'P' }}
            </div>
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold truncate leading-tight">{{ authStore.user?.name || 'Pharmacist' }}</span>
              <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">{{ authStore.user?.role }}</span>
            </div>
          </div>
          <button @click="handleLogout" class="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all text-sm font-semibold cursor-pointer">
            <i class="pi pi-sign-out"></i>
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Desktop Sidebar -->
    <aside class="hidden md:flex flex-col w-72 shrink-0 bg-zinc-900/50 backdrop-blur-xl border-r border-white/5 p-6 h-screen sticky top-0 justify-between">
      <div>
        <!-- Brand Header -->
        <div class="flex items-center gap-3.5 mb-10 px-2">
          <div class="logo-box flex items-center justify-center bg-emerald-500 rounded-2xl w-11 h-11 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-105">
            <i class="pi pi-heart-fill text-white text-xl"></i>
          </div>
          <div class="flex flex-col">
            <span class="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">D.E.V.I</span>
            <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-0.5 truncate max-w-[170px]" :title="authStore.user?.pharmacyName">
              {{ authStore.user?.pharmacyName || 'Pharmacy OS' }}
            </span>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="space-y-2">
          <template v-for="item in menuItems" :key="item.path">
            <RouterLink
              v-if="hasAccess(item)"
              :to="item.path"
              class="relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group no-underline border"
              :class="isRouteActive(item.path) 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'"
            >
              <i :class="item.icon" class="text-lg transition-transform duration-300 group-hover:scale-110"></i>
              <span class="text-sm tracking-wide">{{ item.name }}</span>
              <!-- Active Glow Dot -->
              <span v-if="isRouteActive(item.path)" class="absolute right-4 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            </RouterLink>
          </template>
        </nav>
      </div>

      <!-- Desktop Sidebar Footer / User Profile -->
      <div class="border-t border-white/5 pt-6 space-y-5">
        <div class="flex items-center gap-3.5 px-2">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/10 border border-white/10 text-base">
            {{ authStore.user?.name?.charAt(0) || 'P' }}
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold truncate leading-tight bg-gradient-to-r from-white to-zinc-200 bg-clip-text text-transparent">{{ authStore.user?.name || 'Pharmacist' }}</span>
            <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold mt-1">{{ authStore.user?.role }}</span>
          </div>
        </div>

        <button 
          @click="handleLogout" 
          class="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-zinc-800/40 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all duration-300 text-sm font-bold cursor-pointer"
        >
          <i class="pi pi-sign-out text-sm"></i>
          <span>Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Container -->
    <main class="flex-grow flex flex-col min-w-0 overflow-y-auto h-screen">
      <!-- Desktop Top bar / Actions -->
      <header class="hidden md:flex items-center justify-between px-8 py-5 bg-zinc-950 border-b border-white/5 sticky top-0 z-30">
        <div class="flex items-center gap-4">
          <h2 class="text-xl font-bold text-white tracking-tight">{{ activePageName }}</h2>
          <span class="h-4 w-px bg-white/10"></span>
          <span class="text-xs text-zinc-500 font-medium">Terminal Live</span>
        </div>

        <div class="flex items-center gap-4">
          <!-- Live Time -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 text-xs font-mono">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{{ timeString }}</span>
          </div>
        </div>
      </header>

      <!-- View Content Wrapper -->
      <div class="flex-grow p-6 md:p-8 bg-zinc-950/20">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const mobileMenuOpen = ref(false)
const timeString = ref('')

const updateTime = () => {
  const now = new Date()
  timeString.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

let timer: any
onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const menuItems = [
  { name: 'Dashboard', path: '/', icon: 'pi pi-chart-pie', roles: ['OWNER', 'PHARMACIST', 'CASHIER'] },
  { name: 'Inventory', path: '/inventory', icon: 'pi pi-box', roles: ['OWNER', 'PHARMACIST'] },
  { name: 'Point of Sale', path: '/pos', icon: 'pi pi-shopping-cart', roles: ['OWNER', 'PHARMACIST', 'CASHIER'] },
  { name: 'Prescriptions', path: '/prescriptions', icon: 'pi pi-file', roles: ['OWNER', 'PHARMACIST'] },
  { name: 'Compliance', path: '/compliance', icon: 'pi pi-shield', roles: ['OWNER', 'PHARMACIST'] },
  { name: 'Analytics', path: '/analytics', icon: 'pi pi-chart-line', roles: ['OWNER'] },
]

const activePageName = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item ? item.name : 'DEVI Pharmacy'
})

const isRouteActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const hasAccess = (item: any) => {
  const userRole = authStore.user?.role
  if (!userRole) return false
  return item.roles.includes(userRole)
}

const handleLogout = () => {
  authStore.logout()
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
