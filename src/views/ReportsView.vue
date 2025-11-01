<template>
  <div class="reports-container">
    <header class="view-header">
      <h1 class="title">Financial Reports</h1>
      <p class="subtitle">Analyze your pharmacy's monthly performance and tax liabilities.</p>
    </header>

    <div class="actions-bar">
      <RouterLink to="/profit-report" class="button">View Profit Report</RouterLink>

      <RouterLink to="/staff-report" class="button">View Staff Performance</RouterLink>
      <DataExporter
        :data="formattedMonthlyData"
        :file-name="`Monthly_Report_${new Date().toISOString().split('T')[0]}.csv`"
        button-text="Export Monthly Summary (CSV)"
      />
    </div>

    <div v-if="!hasData" class="empty-state card">
      <h2>No Sales Data Yet</h2>
      <p>Record a few sales to start seeing your financial reports.</p>
    </div>

    <div v-else>
      <div class="stat-grid">
        <div class="stat-card">
          <h2><span class="currency">Rs.</span> {{ allTimeStats.totalRevenue.toFixed(2) }}</h2>
          <p>All-Time Revenue</p>
        </div>
        <div class="stat-card">
          <h2><span class="currency">Rs.</span> {{ allTimeStats.totalVat.toFixed(2) }}</h2>
          <p>Total VAT Collected</p>
        </div>
        <div class="stat-card">
          <h2>{{ allTimeStats.salesCount }}</h2>
          <p>All-Time Transactions</p>
        </div>
      </div>

      <div class="card monthly-summary-card">
        <h2>Monthly Performance Summary</h2>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Revenue</th>
                <th>VAT Collected</th>
                <th>Sales Count</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="month in monthlyData" :key="month.monthYear">
                <td data-label="Month">{{ month.monthYear }}</td>
                <td data-label="Total Revenue">Rs. {{ month.revenue.toFixed(2) }}</td>
                <td data-label="VAT Collected">Rs. {{ month.vat.toFixed(2) }}</td>
                <td data-label="Sales Count">{{ month.salesCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card chart-card">
        <h2>Yearly Sales Trend</h2>
        <apexchart
          type="bar"
          height="350"
          :options="monthlyChartOptions"
          :series="monthlyChartSeries"
        ></apexchart>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { supabase } from '@/supabase'
import VueApexCharts from 'vue3-apexcharts'
import DataExporter from '@/components/DataExporter.vue'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'

const apexchart = VueApexCharts
const hasData = ref(false)
const profileStore = useProfileStore()

let allSales = []

const monthlyData = ref([])
const allTimeStats = reactive({
  totalRevenue: 0,
  totalVat: 0,
  salesCount: 0,
})
const monthlyChartSeries = ref([])
const monthlyChartOptions = ref({})

const processData = () => {
  if (allSales.length === 0) return

  const monthlySummary = allSales.reduce((acc, sale) => {
    const saleDate = new Date(sale.created_at)
    const monthYear = saleDate.toLocaleString('default', { month: 'long', year: 'numeric' })

    if (!acc[monthYear]) {
      acc[monthYear] = { revenue: 0, vat: 0, salesCount: 0, date: saleDate }
    }

    acc[monthYear].revenue += sale.total || 0
    acc[monthYear].vat += sale.vat_amount || 0
    acc[monthYear].salesCount += 1
    return acc
  }, {})

  monthlyData.value = Object.entries(monthlySummary)
    .map(([monthYear, data]) => ({ monthYear, ...data }))
    .sort((a, b) => b.date - a.date)

  allTimeStats.salesCount = allSales.length
  allTimeStats.totalRevenue = monthlyData.value.reduce((sum, m) => sum + m.revenue, 0)
  allTimeStats.totalVat = monthlyData.value.reduce((sum, m) => sum + m.vat, 0)

  const last12Months = monthlyData.value.slice(0, 12).reverse()
  monthlyChartSeries.value = [
    { name: 'Total Revenue', data: last12Months.map((m) => m.revenue.toFixed(2)) },
    { name: 'VAT Collected', data: last12Months.map((m) => m.vat.toFixed(2)) },
  ]
  monthlyChartOptions.value = {
    ...monthlyChartOptions.value,
    xaxis: { categories: last12Months.map((m) => m.monthYear.split(' ')[0]) },
  }
}

onMounted(async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (!pharmacyId) return

  const { data: salesData } = await supabase.from('sales').select('*').eq('pharmacy_id', pharmacyId) // <-- FIX: Was 'user_id'

  if (salesData) {
    allSales = salesData.filter((sale) => sale.status !== 'void')
    hasData.value = allSales.length > 0
    if (hasData.value) {
      processData()
    }
  }
})
</script>

<style scoped>
/* Minor style update to the actions bar */
.actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 2rem;
}
.actions-bar .button,
.actions-bar .button-secondary {
  width: auto;
}
/* All other styles remain unchanged */
.stat-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
@media (min-width: 640px) {
  .stat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
.stat-card {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
}
.stat-card h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-primary);
}
.stat-card .currency {
  font-size: 1.5rem;
  color: var(--color-light-slate);
  margin-right: 0.25rem;
}
.stat-card p {
  color: var(--color-text-light);
  margin-top: 0.25rem;
}
.monthly-summary-card,
.chart-card {
  margin-bottom: 2rem;
}
.monthly-summary-card h2,
.chart-card h2 {
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
  background-color: var(--color-surface-mute);
}
thead th {
  font-weight: 600;
  color: var(--color-light-slate);
}
tbody tr:last-child td {
  border-bottom: none;
}
tbody tr:hover {
  background-color: var(--color-surface-mute);
}
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}
@media (max-width: 768px) {
  thead {
    display: none;
  }
  tbody tr {
    display: block;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    margin-bottom: 1rem;
    padding: 1rem;
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--color-surface-mute);
    white-space: normal;
  }
  tbody tr td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-light);
    padding-right: 1rem;
  }
}
.back-link:hover {
  color: var(--color-primary);
}
</style>
