<template>
  <div class="p-4 md:p-6">
    <h2 class="text-2xl font-bold text-white mb-6">Pharmacy Analytics</h2>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-surface-800 rounded-xl p-6 border border-surface-700">
        <div class="text-gray-400 text-sm mb-2">Total Revenue</div>
        <div class="text-3xl font-bold text-primary-400">
          ${{ stats.totalRevenue.toLocaleString() }}
        </div>
        <div class="text-green-400 text-sm mt-1"><i class="pi pi-arrow-up"></i> 12%</div>
      </div>
      <div class="bg-surface-800 rounded-xl p-6 border border-surface-700">
        <div class="text-gray-400 text-sm mb-2">Prescriptions</div>
        <div class="text-3xl font-bold text-white">{{ stats.totalPrescriptions }}</div>
        <div class="text-green-400 text-sm mt-1"><i class="pi pi-arrow-up"></i> 5%</div>
      </div>
      <div class="bg-surface-800 rounded-xl p-6 border border-surface-700">
        <div class="text-gray-400 text-sm mb-2">Avg. Sale Value</div>
        <div class="text-3xl font-bold text-white">${{ stats.averageSaleValue }}</div>
      </div>
      <div class="bg-surface-800 rounded-xl p-6 border border-surface-700">
        <div class="text-gray-400 text-sm mb-2">Stock Value</div>
        <div class="text-3xl font-bold text-yellow-400">
          ${{ stats.stockValue.toLocaleString() }}
        </div>
        <div class="text-red-400 text-sm mt-1"><i class="pi pi-arrow-down"></i> 3%</div>
      </div>
    </div>

    <!-- Charts Placeholder -->
    <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700 mb-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-white">Sales vs. Revenue</h3>
        <div class="flex items-center space-x-2">
          <Button label="Week" class="p-button-sm p-button-outlined" />
          <Button label="Month" class="p-button-sm p-button-outlined p-button-secondary" />
          <Button label="Year" class="p-button-sm p-button-outlined p-button-secondary" />
        </div>
      </div>
      <div class="h-96 flex items-center justify-center bg-surface-900 rounded-xl">
        <div class="text-center">
          <i class="pi pi-chart-line text-6xl text-gray-500 mb-4"></i>
          <p class="text-gray-400">Interactive charts will appear here</p>
        </div>
      </div>
    </div>

    <!-- Product vs Prescription Analysis -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h3 class="text-xl font-bold text-white mb-4">Top Selling Products</h3>
        <div class="space-y-4">
          <div
            v-for="product in stats.topProducts"
            :key="product.id"
            class="flex items-center justify-between p-3 bg-surface-900 rounded-lg"
          >
            <div>
              <p class="text-white font-medium">{{ product.name }}</p>
              <p class="text-sm text-gray-400">{{ product.sold }} units sold</p>
            </div>
            <div class="text-right">
              <p class="text-primary-400 font-bold">${{ product.revenue.toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700">
        <h3 class="text-xl font-bold text-white mb-4">Most Prescribed Items</h3>
        <div class="space-y-4">
          <div
            v-for="prescription in stats.topPrescriptions"
            :key="prescription.id"
            class="flex items-center justify-between p-3 bg-surface-900 rounded-lg"
          >
            <div>
              <p class="text-white font-medium">{{ prescription.name }}</p>
              <p class="text-sm text-gray-400">{{ prescription.count }} prescriptions</p>
            </div>
            <div class="text-right">
              <p class="text-primary-400 font-bold">{{ prescription.percentage }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/features/analytics/store'
import Button from 'primevue/button'

const analyticsStore = useAnalyticsStore()
const stats = analyticsStore.stats

onMounted(() => {
  analyticsStore.fetchDashboardData()
})
</script>
