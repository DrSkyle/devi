<template>
  <div class="eod-container">
    <header class="view-header no-print">
      <h1 class="title">Daily Closing Report</h1>
      <p class="subtitle">Generate a final summary for any given day.</p>
    </header>

    <div class="actions-bar no-print">
      <div class="date-picker-wrapper">
        <label for="reportDate">Select Report Date:</label>
        <input type="date" id="reportDate" v-model="selectedDate" @change="generateReport" />
      </div>
      <button @click="printReport" class="button" :disabled="!hasData">Print Report</button>
    </div>

    <div class="report-paper card">
      <header class="report-header">
        <h2>Daily Closing Report (Z-Report)</h2>
        <p v-if="profile.name">{{ profile.name }}</p>
        <p>
          <strong>Date:</strong>
          {{ new Date(selectedDate).toLocaleDateString('en-GB', { dateStyle: 'full' }) }}
        </p>
      </header>

      <div v-if="isLoading" class="loading-state">
        <p>Generating report for {{ new Date(selectedDate).toLocaleDateString() }}...</p>
      </div>
      <div v-else-if="!hasData" class="empty-state">
        <h2>No Transactions Found</h2>
        <p>There were no sales or payments recorded on this day.</p>
      </div>
      <div v-else>
        <section class="report-section">
          <h3>Financial Summary</h3>
          <div class="summary-item">
            <span>Gross Sales</span>
            <span class="value">Rs. {{ report.grossSales.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>Discounts</span>
            <span class="value">- Rs. {{ report.totalDiscounts.toFixed(2) }}</span>
          </div>
          <div class="summary-item total-row">
            <span>Net Sales</span>
            <span class="value"
              >Rs. {{ (report.grossSales - report.totalDiscounts).toFixed(2) }}</span
            >
          </div>
          <div class="summary-item">
            <span>VAT Collected</span>
            <span class="value">Rs. {{ report.totalVat.toFixed(2) }}</span>
          </div>
        </section>
        <section class="report-section">
          <h3>Cash Reconciliation</h3>
          <div class="summary-item">
            <span>Cash Sales</span>
            <span class="value">Rs. {{ report.netCashSales.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>Khata Payments Received</span>
            <span class="value">Rs. {{ report.khataPayments.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span>Cash From Returns</span>
            <span class="value">- Rs. {{ report.totalReturns.toFixed(2) }}</span>
          </div>
          <div class="summary-item total-row highlight">
            <span>Expected Cash in Drawer</span>
            <span class="value">Rs. {{ report.expectedCash.toFixed(2) }}</span>
          </div>
        </section>
        <section class="report-section">
          <h3>Transaction Counts</h3>
          <div class="summary-item">
            <span>Total Bills Issued</span>
            <span class="value">{{ report.totalBills }}</span>
          </div>
          <div class="summary-item">
            <span>Voided Bills</span>
            <span class="value danger-text">{{ report.voidedBills }}</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'

const profile = useProfileStore()
const isLoading = ref(true)
const hasData = ref(false)

const selectedDate = ref(new Date().toISOString().split('T')[0])

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

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    isLoading.value = false
    return
  }

  const startDate = new Date(selectedDate.value)
  startDate.setHours(0, 0, 0, 0)
  const startDateISO = startDate.toISOString()

  const endDate = new Date(selectedDate.value)
  endDate.setHours(23, 59, 59, 999)
  const endDateISO = endDate.toISOString()

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDateISO)
    .lte('created_at', endDateISO)
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDateISO)
    .lte('created_at', endDateISO)
  const { data: returns } = await supabase
    .from('returns')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', startDateISO)
    .lte('created_at', endDateISO)

  if ((sales?.length || 0) === 0 && (payments?.length || 0) === 0 && (returns?.length || 0) === 0) {
    isLoading.value = false
    return
  }

  hasData.value = true
  report.totalReturns = (returns || []).reduce((sum, r) => sum + r.total_value, 0)
  report.totalBills = sales?.length || 0

  ;(sales || []).forEach((sale) => {
    if (sale.status === 'void') {
      report.voidedBills++
      return
    }
    report.grossSales += sale.subtotal || sale.total
    report.totalDiscounts += sale.discount || 0
    report.totalVat += sale.vat_amount || 0
    if (sale.status === 'paid') {
      report.netCashSales += sale.total
    }
  })

  report.khataPayments = (payments || []).reduce((sum, p) => sum + p.amount, 0)
  report.expectedCash = report.netCashSales + report.khataPayments - report.totalReturns

  isLoading.value = false
}

const printReport = () => {
  window.print()
}

onMounted(generateReport)
</script>

<style>
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.actions-bar .button {
  width: auto;
}
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.date-picker-wrapper label {
  font-weight: 500;
  color: var(--color-text-light);
}
.date-picker-wrapper input[type='date'] {
  width: auto;
}
.eod-container {
  max-width: 800px;
  margin: 0 auto;
}
.report-paper {
  padding: 2rem;
}
.report-header {
  text-align: center;
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}
.report-header h2 {
  font-size: 1.5rem;
}
.report-header p {
  font-size: 1rem;
  color: var(--color-text-light);
  margin: 0.25rem 0;
}
.report-section {
  margin-bottom: 2rem;
}
.report-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0.5rem;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-surface-mute);
}
.summary-item:last-child {
  border-bottom: none;
}
.summary-item span {
  font-weight: 500;
  color: var(--color-text-light);
}
.summary-item .value {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-soft-cream);
}
.summary-item .danger-text {
  color: var(--color-danger);
}
.total-row {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.total-row span {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--color-soft-cream);
}
.total-row .value {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--color-primary);
}
.highlight {
  background-color: var(--color-primary-mute);
  border-radius: 8px;
  padding: 1rem;
  border-top: none;
  margin-top: 1rem;
}
.highlight .value {
  font-size: 1.5rem;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

@media print {
  body {
    background-color: #fff !important;
  }
  .no-print,
  .app-sidebar,
  .bottom-nav {
    display: none !important;
  }
  .main-content {
    margin: 0 !important;
    padding: 0 !important;
  }
  body * {
    visibility: hidden;
  }
  .report-paper,
  .report-paper * {
    visibility: visible;
  }
  .report-paper {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    margin: 0;
    padding: 1rem;
    border: none;
    box-shadow: none;
    background-color: #fff;
    color: #000;
  }
  .report-paper * {
    color: #000 !important;
  }
}
</style>
