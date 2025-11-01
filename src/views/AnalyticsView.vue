<template>
  <div class="analytics-container">
    <header class="view-header">
      <h1 class="title">Analytics Dashboard</h1>
      <p class="subtitle">Interactive insights and automated purchase forecasting.</p>
    </header>

    <div class="card filter-bar">
      <div class="date-picker-wrapper">
        <label for="startDate">From:</label>
        <input type="date" id="startDate" v-model="dateRange.start" />
      </div>
      <div class="date-picker-wrapper">
        <label for="endDate">To:</label>
        <input type="date" id="endDate" v-model="dateRange.end" />
      </div>
      <button @click="fetchChartData" class="button" :disabled="isLoading.charts">
        {{ isLoading.charts ? 'Loading...' : 'Filter Charts' }}
      </button>
    </div>

    <div v-if="isLoading.charts" class="card loading-state">
      <p>Loading analytics data...</p>
    </div>

    <div v-if="!isLoading.charts" class="dashboard-grid">
      <div class="card chart-card">
        <h3>Sales by Hour of Day</h3>
        <p>Peak times for sales activity.</p>
        <apexchart
          type="bar"
          height="300"
          :options="salesByHourOptions"
          :series="salesByHourSeries"
        ></apexchart>
      </div>

      <div class="card chart-card">
        <h3>Most Profitable Items</h3>
        <p>Top 10 items by estimated profit.</p>
        <apexchart
          type="bar"
          height="300"
          :options="profitOptions"
          :series="profitSeries"
        ></apexchart>
      </div>

      <div class="card list-card">
        <h3>Top 10 Customers</h3>
        <ul class="item-list">
          <li v-for="customer in topCustomers" :key="customer.customer_id">
            <span>{{ decryptData(customer.customer_name) }}</span>
            <strong>Rs. {{ customer.total_spent.toFixed(2) }}</strong>
          </li>
        </ul>
        <p v-if="topCustomers.length === 0" class="empty-list">No customer data for this period.</p>
      </div>
    </div>

    <div class="card forecast-card">
      <h2>Automated Purchase Forecast</h2>
      <p class="section-subtitle">
        This automatically shows items you may need to re-order for the next 30 days based on
        current sales velocity.
      </p>

      <div v-if="isLoading.forecast" class="loading-state">
        <p>Analyzing your sales history and inventory...</p>
      </div>
      <div v-else-if="forecastResults.length === 0" class="empty-state">
        <h2>Your stock is looking good!</h2>
        <p>Based on current sales trends, no critical items need to be re-ordered right now.</p>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine</th>
              <th class="text-right">Current Stock</th>
              <th class="text-right">Predicted 30-Day Sales</th>
              <th class="text-right highlight">Suggested Order Qty</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in forecastResults" :key="item.name">
              <td data-label="Medicine">{{ item.name }}</td>
              <td data-label="Current Stock" class="text-right">{{ item.stock }}</td>
              <td data-label="Predicted Sales" class="text-right">{{ item.predicted_sales }}</td>
              <td data-label="Suggested Order" class="text-right highlight">
                <strong>{{ item.order_qty }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import VueApexCharts from 'vue3-apexcharts'

const apexchart = VueApexCharts
const profile = useProfileStore()

const isLoading = reactive({
  charts: true,
  forecast: true,
})

// --- Date Filter State ---
const dateRange = reactive({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
})

// --- Chart State ---
const salesByHour = ref([])
const topProfitItems = ref([])
const topCustomers = ref([])
const salesByHourSeries = ref([])
const profitSeries = ref([])

// --- Forecast State ---
const forecastResults = ref([])
let allSales = []
let allInventory = []

// --- Chart Options (Unchanged) ---
const baseChartOptions = {
  chart: { toolbar: { show: false }, animations: { enabled: true } },
  theme: { mode: 'dark' },
  tooltip: { theme: 'dark' },
  xaxis: {
    labels: { style: { colors: '#a0aec0' } },
    categories: [],
  },
  yaxis: { labels: { style: { colors: '#a0aec0' } } },
  grid: { borderColor: '#4a5568' },
  dataLabels: { enabled: false },
}
const salesByHourOptions = ref({
  ...baseChartOptions,
  plotOptions: { bar: { horizontal: false, columnWidth: '50%' } },
  xaxis: {
    ...baseChartOptions.xaxis,
    title: { text: 'Hour of Day (24h)', style: { color: '#a0aec0' } },
  },
  yaxis: {
    ...baseChartOptions.yaxis,
    title: { text: 'Total Sales (Rs)', style: { color: '#a0aec0' } },
  },
})
const profitOptions = ref({
  ...baseChartOptions,
  plotOptions: { bar: { horizontal: true } },
  xaxis: {
    ...baseChartOptions.xaxis,
    title: { text: 'Estimated Profit (Rs)', style: { color: '#a0aec0' } },
  },
  tooltip: {
    y: {
      formatter: (val, { series, seriesIndex, dataPointIndex, w }) => {
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

// --- 2. Function for Historical Charts ---
const fetchChartData = async () => {
  if (!profile.pharmacyId) return
  isLoading.charts = true

  const [salesHourData, profitData, customerData] = await Promise.all([
    supabase.rpc('get_sales_by_hour', {
      p_pharmacy_id: profile.pharmacyId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
    }),
    supabase.rpc('get_most_profitable_items', {
      p_pharmacy_id: profile.pharmacyId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
      p_limit: 10,
    }),
    supabase.rpc('get_top_customers', {
      p_pharmacy_id: profile.pharmacyId,
      p_start_date: dateRange.start,
      p_end_date: dateRange.end,
      p_limit: 10,
    }),
  ])

  // Process Sales by Hour
  if (salesHourData.data) {
    salesByHour.value = salesHourData.data
    const hours = Array.from({ length: 24 }, (_, i) => i) // 0-23
    const salesData = hours.map((hour) => {
      const found = salesHourData.data.find((d) => d.hour_of_day === hour)
      return found ? found.total_sales.toFixed(2) : 0
    })
    salesByHourSeries.value = [{ name: 'Total Sales', data: salesData }]
    salesByHourOptions.value = {
      ...salesByHourOptions.value,
      xaxis: { ...salesByHourOptions.value.xaxis, categories: hours },
    }
  }

  // Process Profitable Items
  if (profitData.data) {
    topProfitItems.value = profitData.data
      .map((item) => ({ ...item, item_name: decryptData(item.item_name) }))
      .reverse()
    profitSeries.value = [
      {
        name: 'Estimated Profit',
        data: topProfitItems.value.map((i) => i.total_profit.toFixed(2)),
      },
    ]
    profitOptions.value = {
      ...profitOptions.value,
      xaxis: {
        ...profitOptions.value.xaxis,
        categories: topProfitItems.value.map((i) => i.item_name),
      },
    }
  }

  // Process Top Customers
  if (customerData.data) {
    topCustomers.value = customerData.data
  }

  isLoading.charts = false
}

// --- 3. Functions for Purchase Forecast ---
const fetchAndRunForecast = async () => {
  isLoading.forecast = true

  // 3a. Fetch all sales and inventory data
  const [salesData, inventoryData] = await Promise.all([
    supabase
      .from('sales')
      .select('created_at, items')
      .eq('pharmacy_id', profile.pharmacyId)
      .neq('status', 'void'),
    supabase.from('inventory').select('*').eq('pharmacy_id', profile.pharmacyId),
  ])
  allSales = salesData.data || []
  allInventory = inventoryData.data || []

  // 3b. Run the forecast generation
  generatePurchaseForecast()
  isLoading.forecast = false
}

const generatePurchaseForecast = () => {
  const criticalItems = new Map()
  allInventory
    .filter((item) => item.quantity < 20) // Low stock threshold
    .forEach((item) => {
      const name = decryptData(item.name)
      if (name) {
        criticalItems.set(name, {
          name: name,
          stock: item.quantity,
        })
      }
    })

  const salesCounts = {}
  allSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const name = decryptData(item.name)
      if (name) {
        salesCounts[name] = (salesCounts[name] || 0) + 1
      }
    })
  })

  const topSellers = Object.entries(salesCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)

  topSellers.forEach(([name]) => {
    if (!criticalItems.has(name)) {
      const stock = allInventory
        .filter((i) => decryptData(i.name) === name)
        .reduce((sum, i) => sum + i.quantity, 0)
      criticalItems.set(name, { name, stock })
    }
  })

  const salesByDay = {}
  criticalItems.forEach((item) => {
    salesByDay[item.name] = {}
  })

  allSales.forEach((sale) => {
    const date = new Date(sale.created_at).toISOString().split('T')[0]
    sale.items.forEach((item) => {
      const name = decryptData(item.name)
      if (criticalItems.has(name)) {
        salesByDay[name][date] = (salesByDay[name][date] || 0) + item.quantity
      }
    })
  })

  const results = []
  criticalItems.forEach((item) => {
    const itemSalesHistory = salesByDay[item.name]
    const sortedDates = Object.keys(itemSalesHistory).sort()
    if (sortedDates.length === 0) return

    const startDate = new Date(sortedDates[0])
    const endDate = new Date()
    const timeSeries = []
    let currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      timeSeries.push(itemSalesHistory[dateStr] || 0)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    if (timeSeries.length < 3) return

    const forecast = runStatisticalForecast(timeSeries, 30)
    const totalPredictedSales = forecast.reduce((sum, day) => sum + day.sales, 0)
    const suggestedOrder = totalPredictedSales - item.stock

    if (suggestedOrder > 0) {
      results.push({
        name: item.name,
        stock: item.stock,
        predicted_sales: Math.round(totalPredictedSales),
        order_qty: Math.ceil(suggestedOrder / 10) * 10,
      })
    }
  })

  forecastResults.value = results.sort((a, b) => b.order_qty - a.order_qty)
}

const runStatisticalForecast = (data, daysToForecast) => {
  const alpha = 0.3
  let smoothed = [data[0] || 0]
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1])
  }

  const forecastValue = smoothed[smoothed.length - 1]
  const predictions = []
  for (let i = 0; i < daysToForecast; i++) {
    predictions.push({
      sales: forecastValue < 0 ? 0 : forecastValue,
    })
  }
  return predictions
}
</script>

<style scoped>
.analytics-container {
  max-width: 1200px;
  margin: 0 auto;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 2rem;
}
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.date-picker-wrapper label {
  font-weight: 500;
}
.filter-bar .button {
  width: auto;
  margin-left: auto;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard-grid .list-card {
    /* Make the customer list take up a full row on large screens */
    grid-column: 1 / -1;
  }
}
.chart-card {
  padding: 1.5rem;
}
.chart-card h3,
.list-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}
.chart-card p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}
.list-card {
  padding: 1.5rem;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
}
.item-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}
.item-list li:last-child {
  border-bottom: none;
}
.item-list span {
  font-weight: 500;
}
.item-list strong {
  color: var(--color-primary);
}
.empty-list {
  text-align: center;
  color: var(--color-text-light);
  padding: 1rem 0;
}

/* Forecast Card Styles */
.forecast-card {
  margin-top: 2rem;
}
.forecast-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.section-subtitle {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
  font-size: 1rem;
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
  background-color: var(--color-surface-mute);
}
.text-right {
  text-align: right;
}
.highlight {
  font-weight: bold;
  color: var(--color-primary);
}
.highlight strong {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  thead {
    display: none;
  }
  tbody tr {
    display: block;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    margin-bottom: 1rem;
    padding: 1rem;
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.5rem;
    border-bottom: 1px solid var(--color-surface-mute);
    white-space: normal;
    text-align: right;
  }
  tr td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-light);
    padding-right: 1rem;
    text-align: left;
  }
}
</style>
