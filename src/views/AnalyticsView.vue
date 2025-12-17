<template>
  <div class="analytics-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Analytics Dashboard</h1>
      <p class="text-gray-400 text-sm">Interactive insights and automated purchase forecasting.</p>
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
        <div class="w-full md:w-auto">
          <Button
            label="Filter Charts"
            icon="pi pi-filter"
            @click="fetchChartData"
            :loading="isLoading.charts"
            class="w-full md:w-auto"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading.charts" class="grid">
      <div class="col-12 lg:col-6">
        <div class="glass-panel p-4 h-full">
          <Skeleton width="60%" height="2rem" class="mb-2 bg-white-alpha-10" />
          <Skeleton width="40%" height="1rem" class="mb-4 bg-white-alpha-10" />
          <Skeleton height="300px" class="bg-white-alpha-10" />
        </div>
      </div>
      <div class="col-12 lg:col-6">
        <div class="glass-panel p-4 h-full">
          <Skeleton width="60%" height="2rem" class="mb-2 bg-white-alpha-10" />
          <Skeleton width="40%" height="1rem" class="mb-4 bg-white-alpha-10" />
          <Skeleton height="300px" class="bg-white-alpha-10" />
        </div>
      </div>
      <div class="col-12">
        <div class="glass-panel p-4">
          <Skeleton width="30%" height="2rem" class="mb-4 bg-white-alpha-10" />
          <div class="flex flex-column gap-3">
            <Skeleton height="3rem" class="bg-white-alpha-10" v-for="i in 5" :key="i" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="grid">
      <!-- Sales by Hour -->
      <div class="col-12 lg:col-6">
        <div class="glass-panel p-4 h-full">
          <h3 class="text-xl font-bold text-white mb-1">Sales by Hour of Day</h3>
          <p class="text-gray-400 text-sm mb-4">Peak times for sales activity.</p>
          <apexchart
            type="bar"
            height="300"
            :options="salesByHourOptions"
            :series="salesByHourSeries"
          ></apexchart>
        </div>
      </div>

      <!-- Most Profitable Items -->
      <div class="col-12 lg:col-6">
        <div class="glass-panel p-4 h-full">
          <h3 class="text-xl font-bold text-white mb-1">Most Profitable Items</h3>
          <p class="text-gray-400 text-sm mb-4">Top 10 items by estimated profit.</p>
          <apexchart
            type="bar"
            height="300"
            :options="profitOptions"
            :series="profitSeries"
          ></apexchart>
        </div>
      </div>

      <!-- Top Customers -->
      <div class="col-12">
        <div class="glass-panel p-0 overflow-hidden">
          <div class="p-4 border-bottom-1 border-white-alpha-10">
            <h3 class="text-xl font-bold text-white m-0">Top 10 Customers</h3>
          </div>
          <DataTable
            :value="topCustomers"
            responsiveLayout="scroll"
            class="glass-table"
            v-if="topCustomers.length > 0"
          >
            <Column field="customer_name" header="Customer Name">
              <template #body="slotProps">
                <span class="font-bold text-white">{{
                  decryptData(slotProps.data.customer_name)
                }}</span>
              </template>
            </Column>
            <Column field="total_spent" header="Total Spent">
              <template #body="slotProps">
                <span class="font-bold text-primary"
                  >Rs. {{ slotProps.data.total_spent.toFixed(2) }}</span
                >
              </template>
            </Column>
          </DataTable>
          <div v-else class="text-center p-6 text-gray-400">No customer data for this period.</div>
        </div>
      </div>
    </div>

    <!-- Forecast Section -->
    <div class="mt-6">
      <div class="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="text-2xl font-bold text-white mb-2">Smart Reorder Suggestions (EOQ)</h2>
          <p class="text-gray-400">
            Items below Reorder Point (ROP) with suggested Economic Order Quantity (EOQ).
          </p>
        </div>
        <Button
          label="Auto Reorder"
          icon="pi pi-shopping-bag"
          class="p-button-success"
          @click="autoReorder"
          :loading="isLoading.reorder"
          :disabled="forecastResults.length === 0"
        />
      </div>

      <div v-if="isLoading.forecast" class="text-center p-6">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p class="text-gray-400 mt-3">Calculating EOQ and ROP...</p>
      </div>

      <div v-else-if="forecastResults.length === 0" class="glass-panel p-6 text-center">
        <i class="pi pi-check-circle text-5xl text-green-400 mb-3"></i>
        <h2 class="text-2xl font-bold text-white mb-2">Inventory is Healthy!</h2>
        <p class="text-gray-400">No items are below their calculated Reorder Point.</p>
      </div>

      <div v-else class="glass-panel p-0 overflow-hidden">
        <DataTable
          :value="forecastResults"
          responsiveLayout="scroll"
          paginator
          :rows="10"
          class="glass-table"
        >
          <Column field="name" header="Medicine" sortable>
            <template #body="{ data }">
              <span class="font-bold text-white">{{ data.name }}</span>
            </template>
          </Column>
          <Column field="stock" header="Stock" sortable class="text-right">
            <template #body="{ data }">
              <span class="text-gray-300">{{ data.stock }}</span>
            </template>
          </Column>
          <Column field="rop" header="Reorder Point" sortable class="text-right">
            <template #body="{ data }">
              <span class="text-orange-400 font-bold">{{ data.rop }}</span>
            </template>
          </Column>
          <Column field="eoq" header="EOQ" sortable class="text-right">
            <template #body="{ data }">
              <span class="text-blue-400">{{ data.eoq }}</span>
            </template>
          </Column>
          <Column field="status" header="Status" sortable>
            <template #body="{ data }">
              <span
                class="px-2 py-1 border-round text-xs font-bold"
                :class="{
                  'bg-red-500 text-white': data.status === 'Out of Stock',
                  'bg-orange-500 text-white': data.status === 'Reorder Now',
                  'bg-yellow-500 text-black': data.status === 'Low Stock',
                }"
              >
                {{ data.status }}
              </span>
            </template>
          </Column>
          <Column field="order_qty" header="Suggested Order" sortable class="text-right">
            <template #body="slotProps">
              <span class="font-bold text-primary text-lg">{{ slotProps.data.order_qty }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import VueApexCharts from 'vue3-apexcharts'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import Skeleton from 'primevue/skeleton'

// Repositories & Utils
import { inventoryRepository } from '@/repositories/InventoryRepository'
import { saleRepository } from '@/repositories/SaleRepository'
import { customerRepository } from '@/repositories/CustomerRepository'
import { encryptData } from '@/utils/cipher'
import { calculateEOQ, calculateROP, getInventoryStatus } from '@/utils/inventoryMath'
import { Q } from '@nozbe/watermelondb'

const apexchart = VueApexCharts
const profile = useProfileStore()

const isLoading = reactive({
  charts: true,
  forecast: true,
  topCustomers: true,
  reorder: false,
})

// --- Date Filter State ---
const dateRange = reactive({
  start: new Date(new Date().setDate(1)), // Default to 1st of current month
  end: new Date(),
})

// --- Chart State ---
const salesByHour = ref([])
const topProfitItems = ref([])
const topCustomers = ref([])
const salesByHourSeries = ref([])
const profitSeries = ref([])

// --- Forecast State ---
const forecastResults = ref([])

// --- Chart Options ---
const baseChartOptions = {
  chart: {
    toolbar: { show: false },
    animations: { enabled: true },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  },
  theme: { mode: 'dark' },
  xaxis: {
    labels: { style: { colors: '#9ca3af' } },
    categories: [],
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: '#9ca3af' } } },
  grid: {
    borderColor: 'rgba(255, 255, 255, 0.05)',
    strokeDashArray: 4,
  },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}

const salesByHourOptions = ref({
  ...baseChartOptions,
  plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
  xaxis: {
    ...baseChartOptions.xaxis,
    title: { text: 'Hour of Day (24h)', style: { color: '#9ca3af' } },
  },
  yaxis: {
    ...baseChartOptions.yaxis,
    title: { text: 'Total Sales (Rs)', style: { color: '#9ca3af' } },
  },
  colors: ['#10b981'], // Neon Green
})

const profitOptions = ref({
  ...baseChartOptions,
  plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
  xaxis: {
    ...baseChartOptions.xaxis,
    title: { text: 'Estimated Profit (Rs)', style: { color: '#9ca3af' } },
  },
  colors: ['#3b82f6'], // Blue
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val, { dataPointIndex }) => {
        const item = topProfitItems.value[dataPointIndex]
        return `Profit: Rs. ${val.toFixed(2)} | Units Sold: ${item.units_sold}`
      },
    },
  },
})

// --- 1. Load ALL Data on Page Activate ---
onActivated(async () => {
  if (!profile.pharmacyId) return
  isLoading.charts = true
  isLoading.forecast = true

  // Fetch chart data AND forecast data in parallel
  await Promise.all([fetchChartData(), fetchAndRunForecast()])

  isLoading.charts = false
  isLoading.forecast = false
})

// --- 2. Function for Historical Charts (Local Aggregation) ---
const fetchChartData = async () => {
  if (!profile.pharmacyId) return
  isLoading.charts = true

  const startDate = dateRange.start.getTime()
  const endDate = dateRange.end.getTime() + 86400000 // Include full end day

  try {
    // 1. Fetch Data
    const [sales, inventory, customers] = await Promise.all([
      saleRepository
        .query(
          Q.where('pharmacy_id', profile.pharmacyId),
          Q.where('created_at', Q.between(startDate, endDate)),
        )
        .fetch(),
      inventoryRepository.query(Q.where('pharmacy_id', profile.pharmacyId)).fetch(),
      customerRepository.query(Q.where('pharmacy_id', profile.pharmacyId)).fetch(),
    ])

    // 2. Process Sales by Hour
    const hourCounts = new Array(24).fill(0)
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt)
      const hour = date.getHours()
      hourCounts[hour] += sale.total || 0
    })

    salesByHourSeries.value = [
      { name: 'Total Sales', data: hourCounts.map((v) => Number(v.toFixed(2))) },
    ]
    salesByHourOptions.value = {
      ...salesByHourOptions.value,
      xaxis: {
        ...salesByHourOptions.value.xaxis,
        categories: Array.from({ length: 24 }, (_, i) => i),
      },
    }

    // 3. Process Profitable Items
    // Map inventory for cost lookup
    const inventoryMap = new Map()
    inventory.forEach((item) => {
      inventoryMap.set(item.id, {
        cost: item.purchasePrice || 0,
        name: decryptData(item.name),
      })
    })

    const itemProfits = new Map() // { itemId: { profit: 0, units: 0, name: '' } }

    sales.forEach((sale) => {
      let items = []
      try {
        items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
      } catch {
        return
      }

      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (!item.inventory_id) return

          const inv = inventoryMap.get(item.inventory_id)
          const cost = inv ? inv.cost : 0
          const name = inv ? inv.name : item.name ? decryptData(item.name) : 'Unknown'
          const sellingPrice = item.price || 0
          const qty = item.quantity || 0
          const profit = (sellingPrice - cost) * qty

          if (!itemProfits.has(item.inventory_id)) {
            itemProfits.set(item.inventory_id, { profit: 0, units: 0, name })
          }
          const entry = itemProfits.get(item.inventory_id)
          entry.profit += profit
          entry.units += qty
        })
      }
    })

    const sortedProfits = Array.from(itemProfits.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10)

    topProfitItems.value = sortedProfits.map((p) => ({
      item_name: p.name,
      total_profit: p.profit,
      units_sold: p.units,
    }))

    profitSeries.value = [
      {
        name: 'Estimated Profit',
        data: sortedProfits.map((p) => Number(p.profit.toFixed(2))),
      },
    ]
    profitOptions.value = {
      ...profitOptions.value,
      xaxis: {
        ...profitOptions.value.xaxis,
        categories: sortedProfits.map((p) => p.name),
      },
    }

    // 4. Process Top Customers
    const customerMap = new Map()
    customers.forEach((c) => {
      customerMap.set(c.id, decryptData(c.name))
    })

    const customerSpending = new Map() // { customerId: total }

    sales.forEach((sale) => {
      if (sale.customerId) {
        const current = customerSpending.get(sale.customerId) || 0
        customerSpending.set(sale.customerId, current + (sale.total || 0))
      }
    })

    const sortedCustomers = Array.from(customerSpending.entries())
      .map(([id, total]) => ({
        customer_name: encryptData(customerMap.get(id) || 'Unknown'), // Re-encrypt for template compatibility
        total_spent: total,
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10)

    topCustomers.value = sortedCustomers
  } catch (e) {
    console.error('Local analytics failed', e)
  }

  isLoading.charts = false
}

// --- 3. Functions for Purchase Forecast (Offline First via Repositories) ---
const fetchAndRunForecast = async () => {
  isLoading.forecast = true

  try {
    // Fetch local data
    const [inventoryRecords, saleRecords] = await Promise.all([
      inventoryRepository.query(Q.where('pharmacy_id', profile.pharmacyId)).fetch(),
      saleRepository.query(Q.where('pharmacy_id', profile.pharmacyId)).fetch(),
    ])

    const allInventory = inventoryRecords.map((i) => i._raw)
    const allSales = saleRecords.map((s) => s._raw)

    generatePurchaseForecast(allInventory, allSales)
  } catch (e) {
    console.error('Forecast generation failed', e)
  }

  isLoading.forecast = false
}

const generatePurchaseForecast = (allInventory, allSales) => {
  const results = []

  // Constants for EOQ/ROP (Could be configurable later)
  const ORDERING_COST = 500 // Rs per order
  const HOLDING_COST_PERCENT = 0.2 // 20% of unit price
  const LEAD_TIME_DAYS = 7
  const SAFETY_STOCK_DAYS = 3

  // 1. Calculate Sales Velocity per Item
  const itemStats = new Map() // { itemId: { totalSold: 0, firstSaleDate: timestamp, lastSaleDate: timestamp } }

  allSales.forEach((sale) => {
    let items = []
    try {
      items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
    } catch {}

    if (Array.isArray(items)) {
      items.forEach((item) => {
        if (!item.inventory_id) return

        if (!itemStats.has(item.inventory_id)) {
          itemStats.set(item.inventory_id, {
            totalSold: 0,
            firstSaleDate: sale.created_at,
            lastSaleDate: sale.created_at,
          })
        }

        const stats = itemStats.get(item.inventory_id)
        stats.totalSold += item.quantity || 1
        if (sale.created_at < stats.firstSaleDate) stats.firstSaleDate = sale.created_at
        if (sale.created_at > stats.lastSaleDate) stats.lastSaleDate = sale.created_at
      })
    }
  })

  // 2. Process Inventory Items
  allInventory.forEach((item) => {
    const stats = itemStats.get(item.id)
    const name = decryptData(item.name)

    // Defaults if no sales history
    let dailyUsage = 0
    let annualDemand = 0

    if (stats) {
      const daysDiff = Math.max(
        1,
        (new Date().getTime() - stats.firstSaleDate) / (1000 * 60 * 60 * 24),
      )
      dailyUsage = stats.totalSold / daysDiff
      annualDemand = dailyUsage * 365
    }

    const holdingCost = (item.purchase_price || item.selling_price * 0.7) * HOLDING_COST_PERCENT

    // Calculate Metrics
    const eoq = calculateEOQ({
      annualDemand,
      orderingCost: ORDERING_COST,
      holdingCost: holdingCost || 1, // Avoid div by zero
    })

    const rop = calculateROP({
      dailyUsage,
      leadTime: LEAD_TIME_DAYS,
      safetyStock: dailyUsage * SAFETY_STOCK_DAYS,
    })

    const status = getInventoryStatus(item.quantity, rop)

    // Only suggest if we need to reorder or it's low
    if (status === 'Reorder Now' || status === 'Low Stock' || status === 'Out of Stock') {
      results.push({
        id: item.id,
        name: name,
        stock: item.quantity,
        rop: rop,
        eoq: eoq,
        daily_usage: dailyUsage.toFixed(2),
        status: status,
        order_qty: Math.max(eoq, rop - item.quantity + 10), // Ensure we order enough to cover gap
      })
    }
  })

  forecastResults.value = results.sort((a, b) => {
    // Sort by urgency: Out of Stock > Reorder Now > Low Stock
    const priority = { 'Out of Stock': 3, 'Reorder Now': 2, 'Low Stock': 1, Healthy: 0 }
    return priority[b.status] - priority[a.status]
  })
}

const autoReorder = () => {
  isLoading.reorder = true
  setTimeout(() => {
    isLoading.reorder = false
    alert('Purchase Order Generated! (Simulation)')
  }, 1500)
}
</script>

<style scoped>
/* Utility classes handle most styles */
</style>
