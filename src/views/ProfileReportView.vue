<template>
  <div class="profit-report-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <RouterLink
          to="/reports"
          class="no-underline text-gray-400 hover:text-white mb-2 inline-block transition-colors"
        >
          <i class="pi pi-arrow-left mr-2"></i>Back to Reports
        </RouterLink>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Profitability Report</h1>
        <p class="text-gray-400 text-sm">Analyze your revenue, costs, and profit margins.</p>
      </div>
      <DataExporter
        :data="formattedItemData"
        :file-name="`Profit_Report_${dateRange.start}_to_${dateRange.end}.csv`"
        button-text="Export CSV"
      />
    </div>

    <!-- Filter Bar -->
    <div class="glass-panel p-4 mb-6">
      <div class="flex flex-column md:flex-row gap-4 align-items-end">
        <div class="flex-1 w-full">
          <label for="startDate" class="block text-sm font-medium text-gray-300 mb-2"
            >From Date</label
          >
          <Calendar
            v-model="dateRange.start"
            showIcon
            dateFormat="yy-mm-dd"
            inputId="startDate"
            class="w-full glass-calendar"
          />
        </div>
        <div class="flex-1 w-full">
          <label for="endDate" class="block text-sm font-medium text-gray-300 mb-2">To Date</label>
          <Calendar
            v-model="dateRange.end"
            showIcon
            dateFormat="yy-mm-dd"
            inputId="endDate"
            class="w-full glass-calendar"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-column align-items-center justify-content-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="text-gray-400 mt-3">Generating report...</p>
    </div>

    <div v-else-if="!hasData" class="glass-panel p-6 text-center">
      <i class="pi pi-info-circle text-5xl text-gray-500 mb-3"></i>
      <p class="text-gray-400">No sales data found for the selected period.</p>
    </div>

    <div v-else>
      <!-- Stat Grid -->
      <div class="grid mb-6">
        <div class="col-12 md:col-3">
          <div
            class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 p-3 opacity-10">
              <i class="pi pi-dollar text-6xl text-primary"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">
                Total Net Revenue
              </p>
              <h2 class="text-3xl font-bold text-white mt-2">
                <span class="text-primary text-xl mr-1">Rs.</span>{{ totalRevenue.toFixed(2) }}
              </h2>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div
            class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 p-3 opacity-10">
              <i class="pi pi-shopping-bag text-6xl text-orange-400"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">Total COGS</p>
              <h2 class="text-3xl font-bold text-white mt-2">
                <span class="text-orange-400 text-xl mr-1">Rs.</span>{{ totalCogs.toFixed(2) }}
              </h2>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div
            class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
            style="border-color: rgba(16, 185, 129, 0.3)"
          >
            <div class="absolute top-0 right-0 p-3 opacity-10">
              <i class="pi pi-wallet text-6xl text-green-400"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Profit</p>
              <h2 class="text-3xl font-bold text-green-400 mt-2">
                <span class="text-green-400 text-xl mr-1">Rs.</span>{{ totalProfit.toFixed(2) }}
              </h2>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div
            class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
          >
            <div class="absolute top-0 right-0 p-3 opacity-10">
              <i class="pi pi-chart-pie text-6xl text-blue-400"></i>
            </div>
            <div>
              <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">
                Net Profit Margin
              </p>
              <h2 class="text-3xl font-bold text-white mt-2">
                {{ profitMargin.toFixed(1) }}<span class="text-blue-400 text-xl ml-1">%</span>
              </h2>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="glass-panel p-4 mb-6">
        <h2 class="text-xl font-bold text-white mb-4">Profit Trend</h2>
        <apexchart
          type="bar"
          height="350"
          :options="profitChartOptions"
          :series="profitChartSeries"
        ></apexchart>
      </div>

      <!-- Tables Grid -->
      <div class="grid">
        <div class="col-12 lg:col-6">
          <div class="glass-panel p-0 overflow-hidden h-full">
            <div class="p-4 border-bottom-1 border-white-alpha-10">
              <h2 class="text-xl font-bold text-white m-0">Most Profitable Items</h2>
            </div>
            <DataTable
              :value="mostProfitable"
              responsiveLayout="scroll"
              class="glass-table"
              :rowHover="true"
            >
              <Column field="name" header="Item Name">
                <template #body="{ data }">
                  <span class="font-bold text-white">{{ data.name }}</span>
                </template>
              </Column>
              <Column field="totalSold" header="Qty Sold" class="text-right">
                <template #body="{ data }">
                  <span class="text-gray-300">{{ data.totalSold }}</span>
                </template>
              </Column>
              <Column field="totalProfit" header="Total Profit" class="text-right">
                <template #body="{ data }">
                  <span class="text-green-400 font-bold"
                    >Rs. {{ data.totalProfit.toFixed(2) }}</span
                  >
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        <div class="col-12 lg:col-6">
          <div class="glass-panel p-0 overflow-hidden h-full">
            <div class="p-4 border-bottom-1 border-white-alpha-10">
              <h2 class="text-xl font-bold text-white m-0">Least Profitable Items</h2>
            </div>
            <DataTable
              :value="leastProfitable"
              responsiveLayout="scroll"
              class="glass-table"
              :rowHover="true"
            >
              <Column field="name" header="Item Name">
                <template #body="{ data }">
                  <span class="font-bold text-white">{{ data.name }}</span>
                </template>
              </Column>
              <Column field="totalSold" header="Qty Sold" class="text-right">
                <template #body="{ data }">
                  <span class="text-gray-300">{{ data.totalSold }}</span>
                </template>
              </Column>
              <Column field="totalProfit" header="Total Profit" class="text-right">
                <template #body="{ data }">
                  <span class="text-red-400 font-bold">Rs. {{ data.totalProfit.toFixed(2) }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useProfileStore } from '@/stores/profile'
import { RouterLink } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import VueApexCharts from 'vue3-apexcharts'
import DataExporter from '@/components/DataExporter.vue'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const apexchart = VueApexCharts
const profile = useProfileStore()
const isLoading = ref(true)
const hasData = ref(false)

// Report data refs
const totalRevenue = ref(0)
const totalCogs = ref(0)
const totalProfit = ref(0)
const mostProfitable = ref([])
const leastProfitable = ref([])
const allItemStats = ref([])

const dateRange = reactive({
  start: new Date(new Date().setDate(1)), // First day of current month
  end: new Date(), // Today
})

// Chart data
const profitChartSeries = ref([])
const profitChartOptions = reactive({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 4,
    },
  },
  dataLabels: { enabled: false },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent'],
  },
  xaxis: {
    categories: [],
    labels: { style: { colors: '#9ca3af' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    title: { text: 'Rs. (Profit)', style: { color: '#9ca3af' } },
    labels: { style: { colors: '#9ca3af' } },
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val) => `Rs. ${val.toFixed(2)}`,
    },
  },
  colors: ['#10b981'], // Neon Green
  grid: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    strokeDashArray: 4,
  },
})

// Computed properties
const profitMargin = computed(() => {
  return totalRevenue.value > 0 ? (totalProfit.value / totalRevenue.value) * 100 : 0
})

const formattedItemData = computed(() => {
  return allItemStats.value.map((item) => ({
    'Item Name': item.name,
    'Total Quantity Sold': item.totalSold,
    'Total Profit (Rs)': item.totalProfit.toFixed(2),
    'Average Margin (Rs)': item.avgMargin.toFixed(2),
  }))
})

// Main data fetching function
const generateReport = async () => {
  isLoading.value = true
  hasData.value = false
  if (!profile.pharmacyId) {
    isLoading.value = false
    return
  }

  const startDate = new Date(dateRange.start)
  startDate.setHours(0, 0, 0, 0)
  const startDateISO = startDate.toISOString()

  const endDate = new Date(dateRange.end)
  endDate.setHours(23, 59, 59, 999)
  const endDateISO = endDate.toISOString()

  try {
    // 1. Fetch sales and inventory in parallel
    // 1. Fetch sales and inventory in parallel
    // We fetch ALL sales/inventory for range.
    // Optimization: query only necessary fields if possible, but WatermelonDB fetches whole objects usually.

    // Sales Query
    const salesPromise = database
      .get('sales')
      .query(
        Q.where('pharmacy_id', profile.pharmacyId),
        Q.where('status', Q.notEq('void')),
        Q.where('created_at', Q.gte(startDateISO)),
        Q.where('created_at', Q.lte(endDateISO)),
      )
      .fetch()

    // Inventory Query
    const inventoryPromise = database
      .get('inventory')
      .query(Q.where('pharmacy_id', profile.pharmacyId))
      .fetch()

    const [sales, inventory] = await Promise.all([salesPromise, inventoryPromise])

    // const sales = salesRes.data || [] // Already array from WDB
    // const inventory = inventoryRes.data || [] // Already array from WDB

    if (sales.length === 0) {
      hasData.value = false
      isLoading.value = false
      return
    }
    hasData.value = true

    // 2. Create a purchase price lookup map
    const purchasePriceMap = new Map()
    inventory.forEach((item) => {
      const name = decryptData(item.name)
      if (name) {
        // Use the latest purchase price as an approximation
        purchasePriceMap.set(name, item.purchase_price)
      }
    })

    // 3. Process data
    let netRevenue = 0
    let cogs = 0
    const itemProfitMap = new Map()
    const dailyProfitMap = new Map()

    sales.forEach((sale) => {
      netRevenue += sale.total
      const saleDate = new Date(sale.created_at).toISOString().split('T')[0]
      let saleCogs = 0

      ;(sale.items || []).forEach((item) => {
        const itemName = decryptData(item.name)
        if (!itemName) return

        const purchasePrice = purchasePriceMap.get(itemName) || 0 // Default to 0 if not found
        const itemCogs = purchasePrice * item.quantity
        const itemRevenue = item.price * item.quantity
        const itemProfit = itemRevenue - itemCogs

        saleCogs += itemCogs

        // Aggregate for item tables
        const stats = itemProfitMap.get(itemName) || {
          name: itemName,
          totalProfit: 0,
          totalSold: 0,
          totalMargin: 0,
        }
        stats.totalProfit += itemProfit
        stats.totalSold += item.quantity
        stats.totalMargin += item.price - purchasePrice // Sum of unit margins
        itemProfitMap.set(itemName, stats)
      })

      const saleProfit = sale.total - saleCogs
      dailyProfitMap.set(saleDate, (dailyProfitMap.get(saleDate) || 0) + saleProfit)
      cogs += saleCogs
    })

    // 4. Finalize calculations and update refs
    totalRevenue.value = netRevenue
    totalCogs.value = cogs
    totalProfit.value = netRevenue - cogs

    const allItems = Array.from(itemProfitMap.values())
    allItems.forEach(
      (item) => (item.avgMargin = item.totalSold > 0 ? item.totalMargin / item.totalSold : 0),
    )
    allItemStats.value = allItems.sort((a, b) => b.totalProfit - a.totalProfit)

    mostProfitable.value = allItemStats.value.slice(0, 10)
    leastProfitable.value = allItemStats.value.slice(-10).reverse()

    // 5. Update Chart
    const sortedDailyProfits = new Map(
      [...dailyProfitMap.entries()].sort((a, b) => new Date(a[0]) - new Date(b[0])),
    )
    const dates = Array.from(sortedDailyProfits.keys())
    const profits = Array.from(sortedDailyProfits.values())

    profitChartSeries.value = [{ name: 'Profit', data: profits }]
    profitChartOptions.xaxis.categories = dates
  } catch (error) {
    console.error('Error generating profit report:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(generateReport)
watch(dateRange, generateReport)
</script>

<style scoped>
/* Utility classes handle most styles */
</style>
