<template>
  <div class="eod-container p-4 max-w-5xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4 no-print"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Daily Closing Report</h1>
        <p class="text-gray-400 text-sm">Generate a final summary for any given day.</p>
      </div>
      <div class="flex gap-3 align-items-center">
        <div class="flex flex-column">
          <label for="reportDate" class="text-xs text-gray-400 mb-1">Select Date</label>
          <Calendar
            v-model="selectedDate"
            dateFormat="yy-mm-dd"
            showIcon
            class="glass-calendar"
            @date-select="generateReport"
          />
        </div>
        <Button
          label="Print Report"
          icon="pi pi-print"
          class="mt-4"
          :disabled="!hasData"
          @click="printReport"
        />
      </div>
    </div>

    <!-- Report Paper -->
    <div class="glass-panel p-6 report-paper" id="print-area">
      <header class="text-center border-bottom-1 border-white-alpha-10 pb-4 mb-4">
        <h2 class="text-2xl font-bold text-white mb-2">Daily Closing Report (Z-Report)</h2>
        <p v-if="profile.name" class="text-lg text-primary font-medium">{{ profile.name }}</p>
        <p class="text-gray-300 mt-2">
          <strong>Date:</strong>
          {{ new Date(selectedDate).toLocaleDateString('en-GB', { dateStyle: 'full' }) }}
        </p>
      </header>

      <div v-if="isLoading" class="flex flex-column align-items-center justify-content-center py-6">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
        <p class="text-gray-400 mt-3">Generating report...</p>
      </div>

      <div v-else-if="!hasData" class="text-center py-6">
        <i class="pi pi-file-excel text-4xl text-gray-500 mb-3"></i>
        <h3 class="text-xl text-white mb-2">No Transactions Found</h3>
        <p class="text-gray-400">There were no sales or payments recorded on this day.</p>
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
              <span class="font-medium text-white">Rs. {{ report.grossSales.toFixed(2) }}</span>
            </div>
            <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
              <span class="text-gray-300">Discounts</span>
              <span class="font-medium text-red-300"
                >- Rs. {{ report.totalDiscounts.toFixed(2) }}</span
              >
            </div>
            <div class="flex justify-content-between py-2 mt-2 border-top-1 border-white-alpha-20">
              <span class="font-bold text-white">Net Sales</span>
              <span class="font-bold text-primary text-xl"
                >Rs. {{ (report.grossSales - report.totalDiscounts).toFixed(2) }}</span
              >
            </div>
            <div class="flex justify-content-between py-2 mt-2">
              <span class="text-gray-400 text-sm">VAT Collected</span>
              <span class="text-gray-300 text-sm">Rs. {{ report.totalVat.toFixed(2) }}</span>
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
              <span class="font-medium text-white">Rs. {{ report.netCashSales.toFixed(2) }}</span>
            </div>
            <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
              <span class="text-gray-300">Khata Payments Received</span>
              <span class="font-medium text-white">Rs. {{ report.khataPayments.toFixed(2) }}</span>
            </div>
            <div class="flex justify-content-between py-2 border-bottom-1 border-white-alpha-5">
              <span class="text-gray-300">Cash From Returns</span>
              <span class="font-medium text-red-300"
                >- Rs. {{ report.totalReturns.toFixed(2) }}</span
              >
            </div>
            <div
              class="bg-primary-900 border-round p-3 mt-3 flex justify-content-between align-items-center"
            >
              <span class="font-bold text-white">Expected Cash in Drawer</span>
              <span class="font-bold text-white text-xl"
                >Rs. {{ report.expectedCash.toFixed(2) }}</span
              >
            </div>
          </section>
        </div>

        <!-- Transaction Counts -->
        <div class="col-12">
          <section>
            <h3
              class="text-lg font-bold text-white mb-3 border-bottom-1 border-white-alpha-10 pb-2"
            >
              Transaction Counts
            </h3>
            <div class="flex gap-4">
              <div class="glass-panel p-3 flex-1 text-center">
                <div class="text-gray-400 text-sm mb-1">Total Bills Issued</div>
                <div class="text-2xl font-bold text-white">{{ report.totalBills }}</div>
              </div>
              <div class="glass-panel p-3 flex-1 text-center">
                <div class="text-gray-400 text-sm mb-1">Voided Bills</div>
                <div class="text-2xl font-bold text-red-400">{{ report.voidedBills }}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { localAuth } from '@/services/LocalAuthService'

// PrimeVue Components
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'

const profile = useProfileStore()
const isLoading = ref(true)
const hasData = ref(false)

const selectedDate = ref(new Date())

const report = reactive({
  grossSales: 0,
  totalDiscounts: 0,
  totalVat: 0,
  netCashSales: 0,
  khataPayments: 0,
  totalReturns: 0,
  expectedCash: 0,
  totalBills: 0,
  voidedBills: 0,
})

const resetReport = () => {
  Object.assign(report, {
    grossSales: 0,
    totalDiscounts: 0,
    totalVat: 0,
    netCashSales: 0,
    khataPayments: 0,
    totalReturns: 0,
    expectedCash: 0,
    totalBills: 0,
    voidedBills: 0,
  })
}

const generateReport = async () => {
  isLoading.value = true
  hasData.value = false
  resetReport()

  const user = localAuth.getCurrentUser()
  if (!user) {
    // Should verify logging in?
    // isLoading.value = false
    // return
  }

  const startDate = new Date(selectedDate.value)
  startDate.setHours(0, 0, 0, 0)
  const startTs = startDate.getTime()

  const endDate = new Date(selectedDate.value)
  endDate.setHours(23, 59, 59, 999)
  const endTs = endDate.getTime()

  // Queries
  // Note: WatermelonDB timestamps are numbers.
  const sales = await database.get('sales').query(
      Q.where('created_at', Q.gte(startTs)),
      Q.where('created_at', Q.lte(endTs))
  ).fetch()

  // Transactions (Payments)
  // 'payments' table does not exist in schema. 'transactions' does.
  // Schema has 'transactions' with 'amount', 'type', 'created_at'.
  const payments = await database.get('transactions').query(
      Q.where('created_at', Q.gte(startTs)),
      Q.where('created_at', Q.lte(endTs))
  ).fetch()

  const returns = await database.get('returns').query(
      Q.where('created_at', Q.gte(startTs)),
      Q.where('created_at', Q.lte(endTs))
  ).fetch()


  if ((sales.length === 0) && (payments.length === 0) && (returns.length === 0)) {
    isLoading.value = false
    return
  }

  hasData.value = true
  report.totalReturns = returns.reduce((sum, r) => sum + (r.totalRefund || 0), 0)
  report.totalBills = sales.length

  sales.forEach((sale) => {
    if (sale.status === 'void') {
      report.voidedBills++
      return
    }
    report.grossSales += sale.subtotal || sale.total
    report.totalDiscounts += sale.discount || 0
    report.totalVat += sale.taxTotal || 0 // Schema has tax_total
    if (sale.status === 'paid') {
      report.netCashSales += sale.total
    }
  })

  // Filter payments for Khata (Credit) payments?
  // Usually 'transactions' table has all payments, including those for sales.
  // If 'payments' matches 'transactions' table...
  // Logic in 'EndOfDay': khataPayments = payments.reduce...
  // In `CustomerDetail`, we recorded payment as type='payment'.
  // We should filter transactions where type='payment' (debt repayment) vs type='cash' (sale).
  // I will sum transactions where type == 'payment' (Khata receive) or custom logic.
  // For now, I will sum ALL transactions that appear to be independent payments.
  
  // Logic: Khata payments are when customer pays debt.
  report.khataPayments = payments
      .filter(p => p.type === 'payment') // Assuming 'payment' type is debt repayment
      .reduce((sum, p) => sum + p.amount, 0)

  // Expected Cash = Cash Sales + Khata Received - Cash Returns
  report.expectedCash = report.netCashSales + report.khataPayments - report.totalReturns

  isLoading.value = false
}

const printReport = () => {
  window.print()
}

onMounted(generateReport)
</script>

<style>
@media print {
  body {
    background-color: #fff !important;
    color: #000 !important;
  }
  .no-print,
  .app-sidebar,
  .bottom-nav,
  .p-toast,
  .p-confirm-dialog {
    display: none !important;
  }
  .main-content {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }
  .glass-panel {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    color: #000 !important;
  }
  .text-white,
  .text-gray-300,
  .text-gray-400,
  .text-primary {
    color: #000 !important;
  }
  .text-red-300,
  .text-red-400 {
    color: #d32f2f !important;
  }
  .bg-primary-900 {
    background-color: #f0f0f0 !important;
    color: #000 !important;
    border: 1px solid #ccc;
  }
  .border-white-alpha-10,
  .border-white-alpha-5,
  .border-white-alpha-20 {
    border-color: #ddd !important;
  }
}
</style>
