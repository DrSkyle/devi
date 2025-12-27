<template>
  <div class="reports-container p-4 max-w-7xl mx-auto min-h-screen">
    <h1 class="text-4xl font-thin text-white mb-6 tracking-tight">Reports & Analytics</h1>

    <TabView class="glass-tabs">
      <!-- TAB 1: ANALYTICS (Original ReportsView content) -->
      <TabPanel header="Dashboard">
        <div v-if="!hasData" class="glass-panel p-6 text-center">
          <i class="pi pi-chart-bar text-5xl text-gray-500 mb-3"></i>
          <h2 class="text-xl text-white mb-2">No Sales Data Yet</h2>
          <p class="text-gray-400">Record a few sales to start seeing your financial reports.</p>
        </div>

        <div v-else class="grid">
          <!-- Stats Grid -->
          <div class="col-12 md:col-4">
            <div
              class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
            >
              <div class="absolute top-0 right-0 p-3 opacity-10">
                <i class="pi pi-wallet text-6xl text-primary"></i>
              </div>
              <div>
                <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">
                  All-Time Revenue
                </p>
                <h2 class="text-4xl font-bold text-white mt-2">
                  <span class="text-primary text-2xl mr-1">Rs.</span
                  >{{ allTimeStats.totalRevenue.toFixed(2) }}
                </h2>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div
              class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
            >
              <div class="absolute top-0 right-0 p-3 opacity-10">
                <i class="pi pi-percentage text-6xl text-green-400"></i>
              </div>
              <div>
                <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">
                  Total VAT Collected
                </p>
                <h2 class="text-4xl font-bold text-white mt-2">
                  <span class="text-green-400 text-2xl mr-1">Rs.</span
                  >{{ allTimeStats.totalVat.toFixed(2) }}
                </h2>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-4">
            <div
              class="glass-panel p-4 h-full flex flex-column justify-content-between relative overflow-hidden"
            >
              <div class="absolute top-0 right-0 p-3 opacity-10">
                <i class="pi pi-shopping-cart text-6xl text-blue-400"></i>
              </div>
              <div>
                <p class="text-gray-400 text-sm font-medium uppercase tracking-wider">
                  All-Time Transactions
                </p>
                <h2 class="text-4xl font-bold text-white mt-2">{{ allTimeStats.salesCount }}</h2>
              </div>
            </div>
          </div>

          <!-- Chart -->
          <div class="col-12">
            <div class="glass-panel p-4">
              <h2 class="text-xl font-bold text-white mb-4">Yearly Sales Trend</h2>
              <apexchart
                type="bar"
                height="350"
                :options="chartOptions"
                :series="monthlyChartSeries"
              ></apexchart>
            </div>
          </div>

          <!-- Monthly Summary Table -->
          <div class="col-12">
            <div class="glass-panel p-0 overflow-hidden">
              <div
                class="p-4 border-bottom-1 border-white-alpha-10 flex justify-content-between align-items-center"
              >
                <h2 class="text-xl font-bold text-white m-0">Monthly Performance Summary</h2>
                <DataExporter
                  :data="formattedMonthlyData"
                  :file-name="`Monthly_Report_${new Date().toISOString().split('T')[0]}.csv`"
                  button-text="Export CSV"
                />
              </div>
              <DataTable
                :value="monthlyData"
                responsiveLayout="scroll"
                class="glass-datatable"
                :rowHover="true"
              >
                <Column field="monthYear" header="Month">
                  <template #body="{ data }"
                    ><span class="font-bold text-white">{{ data.monthYear }}</span></template
                  >
                </Column>
                <Column field="revenue" header="Total Revenue">
                  <template #body="{ data }"
                    ><span class="text-primary font-medium"
                      >Rs. {{ data.revenue.toFixed(2) }}</span
                    ></template
                  >
                </Column>
                <Column field="vat" header="VAT Collected">
                  <template #body="{ data }"
                    ><span class="text-green-400">Rs. {{ data.vat.toFixed(2) }}</span></template
                  >
                </Column>
                <Column field="salesCount" header="Sales Count">
                  <template #body="{ data }"
                    ><span class="text-white">{{ data.salesCount }}</span></template
                  >
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- TAB 2: PROFITABILITY -->
      <TabPanel header="Profitability">
        <ProfitReport />
      </TabPanel>

      <!-- TAB 3: STAFF PERFORMANCE -->
      <TabPanel header="Staff Performance">
        <StaffReport />
      </TabPanel>

      <!-- TAB 4: DAILY CLOSING (Z-REPORT) -->
      <TabPanel header="Daily Closing (Z-Report)">
        <div
          class="flex flex-column md:flex-row justify-content-between align-items-center mb-4 gap-3"
        >
          <div class="flex align-items-center gap-2">
            <label class="text-gray-300">Select Date:</label>
            <Calendar
              v-model="selectedDate"
              dateFormat="yy-mm-dd"
              showIcon
              class="glass-calendar"
              @date-select="generateZReport"
            />
          </div>
          <Button
            label="Print Report"
            icon="pi pi-print"
            @click="printReport"
            :disabled="!zReport.hasData"
          />
        </div>

        <div class="glass-panel p-6 report-paper" id="print-area">
          <header class="text-center border-bottom-1 border-white-alpha-10 pb-4 mb-4">
            <h2 class="text-2xl font-bold text-white mb-2">Daily Closing Report</h2>
            <p v-if="profileStore.pharmacyName" class="text-lg text-primary font-medium">
              {{ profileStore.pharmacyName }}
            </p>
            <p class="text-gray-300 mt-2">
              <strong>Date:</strong>
              {{ new Date(selectedDate).toLocaleDateString('en-GB', { dateStyle: 'full' }) }}
            </p>
          </header>

          <div v-if="!zReport.hasData" class="text-center py-6">
            <p class="text-gray-400">No transactions found for this date.</p>
          </div>

          <div v-else class="grid">
            <!-- Financial Summary -->
            <div class="col-12 md:col-6">
              <section class="mb-5">
                <h3
                  class="text-lg font-bold text-white mb-3 border-bottom-1 border-white-alpha-10 pb-2"
                >
                  Financial Summary
                </h3>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Gross Sales</span>
                  <span class="font-medium text-white"
                    >Rs. {{ zReport.grossSales.toFixed(2) }}</span
                  >
                </div>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Credit Sales</span>
                  <span class="font-medium text-orange-300"
                    >Rs. {{ zReport.creditSales.toFixed(2) }}</span
                  >
                </div>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Discounts</span>
                  <span class="font-medium text-red-300"
                    >- Rs. {{ zReport.totalDiscounts.toFixed(2) }}</span
                  >
                </div>
                <div
                  class="flex justify-content-between py-2 mt-2 border-top-1 border-white-alpha-20"
                >
                  <span class="font-bold text-white">Net Sales</span>
                  <span class="font-bold text-primary text-xl"
                    >Rs. {{ (zReport.grossSales - zReport.totalDiscounts).toFixed(2) }}</span
                  >
                </div>
                <div class="flex justify-content-between py-2 mt-2">
                  <span class="text-gray-400 text-sm">VAT Collected</span>
                  <span class="text-gray-300 text-sm">Rs. {{ zReport.totalVat.toFixed(2) }}</span>
                </div>
              </section>
            </div>

            <!-- Cash Reconciliation -->
            <div class="col-12 md:col-6">
              <section class="mb-5">
                <h3
                  class="text-lg font-bold text-white mb-3 border-bottom-1 border-white-alpha-10 pb-2"
                >
                  Cash Reconciliation
                </h3>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Cash Sales</span>
                  <span class="font-medium text-white">Rs. {{ zReport.cashSales.toFixed(2) }}</span>
                </div>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Khata Cash Payments</span>
                  <span class="font-medium text-white">Rs. {{ zReport.khataCash.toFixed(2) }}</span>
                </div>
                <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
                  <span class="text-gray-300">Cash Returns</span>
                  <span class="font-medium text-red-300"
                    >- Rs. {{ zReport.cashReturns.toFixed(2) }}</span
                  >
                </div>
                <div
                  class="bg-primary-900 border-round p-3 mt-3 flex justify-content-between align-items-center"
                >
                  <span class="font-bold text-white">Expected Cash in Drawer</span>
                  <span class="font-bold text-white text-xl"
                    >Rs. {{ zReport.expectedCash.toFixed(2) }}</span
                  >
                </div>
              </section>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import VueApexCharts from 'vue3-apexcharts'
import DataExporter from '@/components/DataExporter.vue'
import { useProfileStore } from '@/stores/profile'

// Components
import ProfitReport from '@/components/reports/ProfitReport.vue'
import StaffReport from '@/components/reports/StaffReport.vue'

// PrimeVue Components
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Calendar from 'primevue/calendar'

const apexchart = VueApexCharts
const hasData = ref(false)
const profileStore = useProfileStore()

// --- ANALYTICS STATE ---
let allSales = []
const monthlyData = ref([])
const allTimeStats = reactive({ totalRevenue: 0, totalVat: 0, salesCount: 0 })
const monthlyChartSeries = ref([])

// --- Z-REPORT STATE ---
const selectedDate = ref(new Date())
const zReport = reactive({
  hasData: false,
  grossSales: 0,
  totalDiscounts: 0,
  totalVat: 0,
  cashSales: 0,
  creditSales: 0,
  khataCash: 0,
  cashReturns: 0,
  expectedCash: 0,
})

// --- CHART OPTIONS ---
const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
    background: 'transparent',
    fontFamily: 'Inter, sans-serif',
  },
  colors: ['#10b981', '#3b82f6'],
  plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  xaxis: {
    categories: monthlyData.value
      .slice(0, 12)
      .reverse()
      .map((m) => m.monthYear.split(' ')[0]),
    labels: { style: { colors: '#9ca3af' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    title: { text: 'Amount (Rs)', style: { color: '#9ca3af' } },
    labels: { style: { colors: '#9ca3af' } },
  },
  fill: { opacity: 1 },
  tooltip: { theme: 'dark', y: { formatter: (val) => 'Rs. ' + val.toFixed(2) } },
  grid: { borderColor: 'rgba(255, 255, 255, 0.05)', strokeDashArray: 4 },
  legend: { labels: { colors: '#fff' } },
}))

const formattedMonthlyData = computed(() => {
  return monthlyData.value.map((item) => ({
    Month: item.monthYear,
    'Total Revenue': item.revenue.toFixed(2),
    'VAT Collected': item.vat.toFixed(2),
    'Sales Count': item.salesCount,
  }))
})

// --- ANALYTICS LOGIC ---
const processAnalytics = () => {
  if (allSales.length === 0) return

  const monthlySummary = allSales.reduce((acc, sale) => {
    const saleDate = new Date(sale.created_at || sale.createdAt)
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
}

// --- Z-REPORT LOGIC ---
const generateZReport = async () => {
  if (!profileStore.pharmacyId) return

  // Reset
  Object.assign(zReport, {
    hasData: false,
    grossSales: 0,
    totalDiscounts: 0,
    totalVat: 0,
    cashSales: 0,
    creditSales: 0,
    khataCash: 0,
    cashReturns: 0,
    expectedCash: 0,
  })

  const start = new Date(selectedDate.value)
  start.setHours(0, 0, 0, 0)
  const startTimestamp = start.getTime()

  const end = new Date(selectedDate.value)
  end.setHours(23, 59, 59, 999)
  const endTimestamp = end.getTime()

  try {
    // Fetch Data Locally
    const [sales, payments, returns] = await Promise.all([
      database
        .get('sales')
        .query(
          Q.where('pharmacy_id', profileStore.pharmacyId),
          Q.where('created_at', Q.gte(startTimestamp)),
          Q.where('created_at', Q.lte(endTimestamp)),
          Q.where('status', Q.notEq('void')),
        )
        .fetch(),
      database
        .get('transactions')
        .query(
          Q.where('pharmacy_id', profileStore.pharmacyId),
          Q.where('type', 'payment'),
          Q.where('created_at', Q.gte(startTimestamp)),
          Q.where('created_at', Q.lte(endTimestamp)),
        )
        .fetch(),
      database
        .get('returns')
        .query(
          Q.where('pharmacy_id', profileStore.pharmacyId),
          Q.where('created_at', Q.gte(startTimestamp)),
          Q.where('created_at', Q.lte(endTimestamp)),
        )
        .fetch(),
    ])

    if (sales.length === 0 && payments.length === 0 && returns.length === 0) {
      zReport.hasData = false
      return
    }

    zReport.hasData = true

    // Calculate Sales
    sales.forEach((sale) => {
      zReport.grossSales += sale.subtotal || sale.total // Assuming subtotal exists or total is gross
      zReport.totalDiscounts += sale.discount || 0
      zReport.totalVat += sale.vatAmount || 0

      // Case-insensitive check for payment method
      const method = (sale.paymentMethod || '').toLowerCase()

      if (method === 'cash') {
        zReport.cashSales += sale.total
      } else if (method === 'credit') {
        zReport.creditSales += sale.total
      }
    })

    // Calculate Khata Payments (Cash only)
    payments.forEach((payment) => {
      // Assuming transaction amount is positive for payment
      // And assuming all 'payment' type transactions are cash for now, or check method if available
      // Transaction model might not have 'method' field explicitly, but let's assume cash if not specified
      // Or check if payment.paymentMode exists
      zReport.khataCash += payment.amount
    })

    // Calculate Returns (Cash refunds only)
    returns.forEach((ret) => {
      zReport.cashReturns += ret.totalRefund || 0
    })

    zReport.expectedCash = zReport.cashSales + zReport.khataCash - zReport.cashReturns
  } catch (error) {
    console.error('Error generating Z-Report', error)
  }
}

const printReport = () => {
  window.print()
}

onMounted(async () => {
  if (!profileStore.pharmacyId) return

  // Load Analytics Data
  try {
    const salesData = await database
      .get('sales')
      .query(Q.where('pharmacy_id', profileStore.pharmacyId), Q.where('status', Q.notEq('void')))
      .fetch()

    if (salesData) {
      allSales = salesData.map((s) => ({
        ...s._raw,
        created_at: s.createdAt,
        vat_amount: s.vatAmount,
        total: s.total,
      }))
      hasData.value = allSales.length > 0
      if (hasData.value) {
        processAnalytics()
      }
    }
  } catch (error) {
    console.error('Error loading analytics data', error)
  }

  // Generate initial Z-Report
  generateZReport()
})
</script>

<style scoped>
/* Print Styles */
@media print {
  body * {
    visibility: hidden;
  }
  #print-area,
  #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }
  .glass-panel {
    background: none !important;
    border: none !important;
  }
  .text-white {
    color: black !important;
  }
  .text-gray-300,
  .text-gray-400 {
    color: #333 !important;
  }
  .bg-primary-900 {
    background: #eee !important;
    color: black !important;
  }
}
</style>
