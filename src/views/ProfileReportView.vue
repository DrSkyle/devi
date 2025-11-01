<template>
  <div class="profit-report-container">
    <header class="view-header">
      <RouterLink to="/reports" class="back-link">&larr; Back to Reports</RouterLink>
      <h1 class="title">Profitability Report</h1>
      <p class="subtitle">Analyze your revenue, costs, and profit margins.</p>
    </header>

    <div class="card">
      <div class="filter-bar">
        <div class="date-picker-wrapper">
          <label for="startDate">From:</label>
          <input type="date" id="startDate" v.model="dateRange.start" />
        </div>
        <div class="date-picker-wrapper">
          <label for="endDate">To:</label>
          <input type="date" id="endDate" v.model="dateRange.end" />
        </div>
        <DataExporter
          :data="formattedItemData"
          :file-name="`Profit_Report_${dateRange.start}_to_${dateRange.end}.csv`"
          button-text="Export Item Data (CSV)"
        />
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Generating report...</p>
      </div>
      <div v-else-if="!hasData" class="empty-state">
        <p>No sales data found for the selected period.</p>
      </div>
      <div v-else>
        <div class="stat-grid">
          <div class="stat-card">
            <h2><span class="currency">Rs.</span> {{ totalRevenue.toFixed(2) }}</h2>
            <p>Total Net Revenue</p>
          </div>
          <div class="stat-card">
            <h2><span class="currency">Rs.</span> {{ totalCogs.toFixed(2) }}</h2>
            <p>Total Cost of Goods (COGS)</p>
          </div>
          <div class="stat-card profit-card">
            <h2><span class="currency">Rs.</span> {{ totalProfit.toFixed(2) }}</h2>
            <p>Total Profit</p>
          </div>
          <div class="stat-card">
            <h2>{{ profitMargin.toFixed(1) }}<span class="currency">%</span></h2>
            <p>Net Profit Margin</p>
          </div>
        </div>

        <div class="card chart-card">
          <h2>Profit Trend</h2>
          <apexchart
            type="bar"
            height="350"
            :options="profitChartOptions"
            :series="profitChartSeries"
          ></apexchart>
        </div>

        <div class="tables-grid">
          <div class="card">
            <h2>Most Profitable Items</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th class="text-right">Qty Sold</th>
                    <th class="text-right">Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in mostProfitable" :key="item.name">
                    <td data-label="Item Name">{{ item.name }}</td>
                    <td data-label="Qty Sold" class="text-right">{{ item.totalSold }}</td>
                    <td data-label="Total Profit" class="text-right highlight">
                      Rs. {{ item.totalProfit.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card">
            <h2>Least Profitable Items</h2>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th class="text-right">Qty Sold</th>
                    <th class="text-right">Total Profit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in leastProfitable" :key="item.name">
                    <td data-label="Item Name">{{ item.name }}</td>
                    <td data-label="Qty Sold" class="text-right">{{ item.totalSold }}</td>
                    <td data-label="Total Profit" class="text-right lowlight">
                      Rs. {{ item.totalProfit.toFixed(2) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { RouterLink } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import VueApexCharts from 'vue3-apexcharts'
import DataExporter from '@/components/DataExporter.vue'

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
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
  end: new Date().toISOString().split('T')[0], // Today
})

// Chart data
const profitChartSeries = ref([])
const profitChartOptions = reactive({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
    foreColor: '#a0aec0', // --color-light-slate
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
  },
  yaxis: {
    title: { text: 'Rs. (Profit)' },
  },
  fill: { opacity: 1 },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (val) => `Rs. ${val.toFixed(2)}`,
    },
  },
  colors: ['#14b8a6', '#f59e0b'], // --color-peacock-teal, --color-saffron-orange
  grid: {
    borderColor: '#4a5568', // --color-slate-gray
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
    const [salesRes, inventoryRes] = await Promise.all([
      supabase
        .from('sales')
        .select('items, created_at, total, status')
        .eq('pharmacy_id', profile.pharmacyId)
        .neq('status', 'void')
        .gte('created_at', startDateISO)
        .lte('created_at', endDateISO),
      supabase
        .from('inventory')
        .select('name, purchase_price')
        .eq('pharmacy_id', profile.pharmacyId),
    ])

    const sales = salesRes.data || []
    const inventory = inventoryRes.data || []

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
/* Stealing styles from ReportsView.vue and StaffReportView.vue */
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.date-picker-wrapper label {
  font-weight: 500;
}
.filter-bar .button-secondary {
  width: auto;
  margin-left: auto;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}

/* Stat Grid */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin: 1.5rem;
}
@media (min-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.stat-card {
  background-color: var(--color-surface-mute);
  padding: 1.5rem;
  border-radius: 12px;
}
.stat-card h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-soft-cream);
}
.stat-card.profit-card h2 {
  color: var(--color-peacock-teal);
}
.stat-card .currency {
  font-size: 1.5rem;
  color: var(--color-light-slate);
  margin-right: 0.25rem;
}
.stat-card h2 .currency {
  font-size: 1.5rem;
  margin-left: 0.25rem;
}
.stat-card p {
  color: var(--color-text-light);
  margin-top: 0.25rem;
}

/* Tables */
.tables-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin: 1.5rem;
}
@media (min-width: 1024px) {
  .tables-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.tables-grid .card {
  padding: 1.5rem;
  background-color: var(--color-surface-mute);
}
.tables-grid h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
.table-container {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
thead {
  background-color: var(--color-surface);
}
thead th {
  font-weight: 600;
}
tbody tr:last-child td {
  border-bottom: none;
}
.text-right {
  text-align: right;
}
.highlight {
  font-weight: bold;
  color: var(--color-peacock-teal);
}
.lowlight {
  font-weight: bold;
  color: var(--color-danger);
}

.chart-card {
  background-color: var(--color-surface-mute);
  padding: 1.5rem;
  margin: 1.5rem;
}
.chart-card h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
}
</style>
