<template>
  <div class="space-y-8 animate-fade-in">
    <!-- Welcome Header / Mobile Profile Context -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-extrabold text-white tracking-tight leading-none mb-2.5">
          Pharmacy Dashboard
        </h1>
        <p class="text-sm text-zinc-400">
          Welcome back, <span class="text-zinc-200 font-semibold">{{ authStore.user?.name || 'Pharmacist' }}</span>. Here is your pharmacy overview.
        </p>
      </div>

      <!-- Quick stats summary block -->
      <div class="flex items-center gap-3">
        <div class="flex flex-col items-end hidden sm:flex text-right">
          <span class="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Sync Status</span>
          <span class="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Database Connected
          </span>
        </div>
      </div>
    </div>

    <!-- Stats KPI Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <KpiCard
        title="Today's Sales"
        :value="formatCurrency(dashboardStore.stats.todaySales)"
        icon="pi pi-dollar"
        color="green"
      />
      <KpiCard
        title="Active Prescriptions"
        :value="dashboardStore.stats.activePrescriptions"
        icon="pi pi-file"
        color="blue"
      />
      <KpiCard
        title="Low Stock Items"
        :value="dashboardStore.stats.lowStockCount"
        icon="pi pi-box"
        color="red"
      />
    </div>

    <!-- Analytics / Secondary Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Sales Chart -->
      <div class="lg:col-span-2 bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[350px]">
        <div class="flex justify-between items-center mb-6">
          <div class="flex flex-col">
            <h3 class="text-lg font-bold text-white tracking-tight">Sales Analytics</h3>
            <p class="text-xs text-zinc-400 mt-0.5">Performance tracking for current cycle</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-xl bg-zinc-800 border border-white/5 text-zinc-400 font-semibold">Weekly</span>
        </div>

        <div class="flex-grow flex items-center justify-center bg-zinc-950/45 border border-white/5 rounded-2xl p-6 h-64">
          <div class="text-center space-y-2">
            <i class="pi pi-chart-bar text-zinc-600 text-3xl"></i>
            <p class="text-sm text-zinc-400 font-medium">Sales Chart Coming Soon</p>
            <p class="text-xs text-zinc-600">Visual analytics integration in progress</p>
          </div>
        </div>
      </div>

      <!-- DDA Alerts -->
      <div class="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col min-h-[350px]">
        <div class="flex flex-col mb-6">
          <h3 class="text-lg font-bold text-white tracking-tight">DDA Compliance Alerts</h3>
          <p class="text-xs text-zinc-400 mt-0.5">Monitored narcotic and prescription logs</p>
        </div>

        <div class="flex-grow overflow-y-auto custom-scrollbar pr-1">
          <DdaAlertList />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/features/auth/store'
import { useDashboardStore } from '@/features/dashboard/store'
import KpiCard from '@/shared/ui/KpiCard.vue'
import DdaAlertList from '@/features/compliance/components/DdaAlertList.vue'
import { formatCurrency } from '@/shared/utils'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

onMounted(() => {
  dashboardStore.fetchDashboardData()
})
</script>

<style scoped>
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9px;
}
</style>
