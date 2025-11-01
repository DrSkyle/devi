<template>
  <div class="dashboard-container">
    <header class="view-header">
      <h1 class="title">{{ profile.name || 'Dashboard' }}</h1>
      <p class="subtitle">Here is your performance summary for today, {{ todayDate }}.</p>
    </header>

    <div
      v-if="staffStore.activeUserRole && staffStore.activeUserRole !== 'admin'"
      class="card shift-card"
    >
      <div v-if="activeShift">
        <h3>Shift in Progress</h3>
        <p>Started at: {{ new Date(activeShift.start_time).toLocaleTimeString() }}</p>
        <p>Opening Float: Rs. {{ activeShift.opening_float.toFixed(2) }}</p>
        <button @click="endShift" class="button-danger">End Shift & Reconcile</button>
      </div>
      <div v-else-if="shiftCompletedToday">
        <h3>Shift Completed</h3>
        <p>You have already completed a shift today. You can start a new one after midnight.</p>
      </div>
      <div v-else>
        <h3>Start New Shift</h3>
        <p>You must start a shift to record sales and track your time.</p>
        <button @click="startShift" class="button-primary">Start Shift</button>
      </div>
    </div>

    <div v-if="isLoading" class="card loading-state">
      <p>Loading today's stats...</p>
    </div>
    <div v-else>
      <div class="stat-grid primary-stats">
        <div class="stat-card">
          <h2><span class="currency">Rs.</span> {{ dashboardStats.totalRevenue.toFixed(2) }}</h2>
          <p>Today's Revenue</p>
        </div>
        <div class="stat-card">
          <h2>{{ dashboardStats.salesCount }}</h2>
          <p>Sales Today</p>
        </div>
        <div class="stat-card">
          <h2>{{ dashboardStats.customersServed }}</h2>
          <p>Customers Served</p>
        </div>
      </div>
      <div class="stat-grid secondary-stats">
        <div class="stat-card">
          <h2><span class="currency">Rs.</span> {{ dashboardStats.totalProfit.toFixed(2) }}</h2>
          <p>Est. Profit</p>
        </div>
        <RouterLink to="/inventory-alerts" class="stat-card interactive warning">
          <h2>{{ dashboardStats.lowStockCount }}</h2>
          <p>Low Stock</p>
        </RouterLink>
        <RouterLink to="/inventory-alerts" class="stat-card interactive danger">
          <h2>{{ dashboardStats.expiringSoonCount }}</h2>
          <p>Expiring Soon</p>
        </RouterLink>
      </div>
    </div>

    <div class="action-grid">
      <RouterLink
        to="/record-sale"
        class="action-card primary"
        :class="{ disabled: staffStore.activeUserRole !== 'admin' && !activeShift }"
      >
        <span class="card-icon">🛒</span>
        <h3>Record a Sale</h3>
        <p>Start a new transaction and update inventory.</p>
      </RouterLink>
      <RouterLink
        v-if="staffStore.activeUserRole !== 'cashier'"
        to="/add-inventory"
        class="action-card"
      >
        <span class="card-icon">📦</span>
        <h3>Add New Stock</h3>
        <p>Add new medicines to your inventory list.</p>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile.js'
import { useStaffStore } from '@/stores/staff.js'
import { usePromptStore } from '@/stores/prompt'
import { useNotificationStore } from '@/stores/notification'
import { isExpiringSoon } from '@/utils/date.js'

const profile = useProfileStore()
const staffStore = useStaffStore()
const prompt = usePromptStore()
const notification = useNotificationStore()

const isLoading = ref(true)
const activeShift = ref(null)
const shiftCompletedToday = ref(false)

const todayDate = computed(() =>
  new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
)

const dashboardStats = reactive({
  totalRevenue: 0,
  totalProfit: 0,
  salesCount: 0,
  customersServed: 0,
  lowStockCount: 0,
  expiringSoonCount: 0,
})

const resetStats = () => {
  Object.assign(dashboardStats, {
    totalRevenue: 0,
    totalProfit: 0,
    salesCount: 0,
    customersServed: 0,
    lowStockCount: 0,
    expiringSoonCount: 0,
  })
}

const loadDashboardData = async () => {
  isLoading.value = true
  resetStats()

  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId) {
    isLoading.value = false
    return
  }

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [salesRes, inventoryRes] = await Promise.all([
    supabase
      .from('sales')
      .select('items, total, discount, customer_id')
      .eq('pharmacy_id', pharmacyId)
      .neq('status', 'void')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString()),
    supabase
      .from('inventory')
      .select('name, purchase_price, quantity, expiry_date')
      .eq('pharmacy_id', pharmacyId),
  ])

  const todaysSales = salesRes.data || []
  const allInventory = inventoryRes.data || []

  if (todaysSales.length > 0) {
    dashboardStats.salesCount = todaysSales.length
    dashboardStats.totalRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)
    const uniqueCustomers = new Set(todaysSales.map((sale) => sale.customer_id).filter(Boolean))
    dashboardStats.customersServed = uniqueCustomers.size

    const purchasePriceMap = new Map()
    allInventory.forEach((item) => {
      purchasePriceMap.set(item.name, item.purchase_price || 0)
    })

    let calculatedProfit = 0
    todaysSales.forEach((sale) => {
      ;(sale.items || []).forEach((item) => {
        const purchasePrice = purchasePriceMap.get(item.name) || item.price
        const itemProfit = (item.price - purchasePrice) * item.quantity
        calculatedProfit += itemProfit
      })
      calculatedProfit -= sale.discount || 0
    })
    dashboardStats.totalProfit = calculatedProfit
  }

  if (allInventory.length > 0) {
    dashboardStats.lowStockCount = allInventory.filter(
      (item) => item.quantity > 0 && item.quantity < 10,
    ).length
    dashboardStats.expiringSoonCount = allInventory.filter(
      (item) => item.quantity > 0 && isExpiringSoon(item.expiry_date, 90),
    ).length
  }

  if (staffStore.activeUserRole !== 'admin') {
    const { data: shiftsToday } = await supabase
      .from('shifts')
      .select('*')
      .eq('staff_id', staffStore.activeUserId)
      .gte('start_time', todayStart.toISOString())

    if (shiftsToday) {
      activeShift.value = shiftsToday.find((s) => s.status === 'active') || null
      shiftCompletedToday.value = shiftsToday.some((s) => s.status === 'completed')
      staffStore.setActiveShift(activeShift.value)
    }
  }

  isLoading.value = false
}

onActivated(loadDashboardData)

const startShift = async () => {
  try {
    const floatAmount = await prompt.show({
      title: 'Start Shift',
      message: 'Enter the starting cash amount in your drawer (opening float):',
      inputType: 'number',
      initialValue: '0',
    })

    const openingFloat = parseFloat(floatAmount)
    if (isNaN(openingFloat) || openingFloat < 0) {
      notification.showNotification('Invalid amount entered.', 'error')
      return
    }

    const newShift = {
      staff_id: staffStore.activeUserId,
      staff_name: staffStore.activeUserName,
      pharmacy_id: profile.pharmacyId,
      start_time: new Date().toISOString(),
      opening_float: openingFloat,
      status: 'active',
    }

    const { data, error } = await supabase.from('shifts').insert(newShift).select().single()
    if (error) throw error

    notification.showNotification('Shift started successfully!')
    await loadDashboardData()
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      notification.showNotification('Could not start shift.', 'error')
    }
  }
}

const endShift = async () => {
  if (!activeShift.value) return

  try {
    const countedAmount = await prompt.show({
      title: 'End Shift & Reconcile',
      message: `Please count the cash in your drawer and enter the final amount:`,
      inputType: 'number',
    })

    const closingCash = parseFloat(countedAmount)
    if (isNaN(closingCash) || closingCash < 0) {
      notification.showNotification('Invalid amount entered.', 'error')
      return
    }

    const { data, error } = await supabase.rpc('end_shift_and_reconcile', {
      p_shift_id: activeShift.value._id,
      p_closing_cash: closingCash,
    })

    if (error) throw error

    const { expected_cash, variance } = data[0]

    await prompt.show({
      type: 'confirm',
      title: 'Shift Summary',
      message: `Expected Cash: Rs. ${expected_cash.toFixed(2)}\nYou Counted: Rs. ${closingCash.toFixed(2)}\nDifference (Variance): Rs. ${variance.toFixed(2)}\n\nYour shift has been successfully ended.`,
    })

    notification.showNotification('Shift ended successfully!')
    staffStore.clearActiveShift()
    await loadDashboardData()
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      notification.showNotification('Could not end shift.', 'error')
    }
  }
}
</script>

<style scoped>
/* *** THIS IS THE NEW LAYOUT LOGIC *** */
.stat-grid {
  display: grid;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

/* On mobile, all cards are in a 2-column grid */
.stat-grid {
  grid-template-columns: 1fr 1fr;
}

/* On medium screens and up (laptops), the layout changes */
@media (min-width: 768px) {
  .primary-stats {
    grid-template-columns: repeat(3, 1fr); /* 3 cards in a row */
  }
  .secondary-stats {
    grid-template-columns: repeat(3, 1fr); /* 3 cards in a row */
  }
}

.stat-card {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
}

.stat-card.interactive {
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.stat-card.interactive:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.stat-card h2 {
  font-size: 2.2rem; /* Slightly smaller for better fit */
  font-weight: 700;
  color: var(--color-soft-cream);
  white-space: nowrap; /* Prevent numbers from wrapping */
}

.stat-card .currency {
  font-size: 1.3rem; /* Adjusted for balance */
  font-weight: 500;
  color: var(--color-text-light);
  margin-right: 0.25rem;
}

.stat-card p {
  color: var(--color-text-light);
  margin-top: 0.25rem;
  font-weight: 500;
  font-size: 0.9rem; /* Smaller text for clarity */
}

.stat-card.warning h2 {
  color: var(--color-saffron-orange);
}

.stat-card.danger h2 {
  color: var(--color-danger);
}

/* Existing Styles (Unchanged) */
.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}

.action-card.disabled {
  pointer-events: none;
  opacity: 0.5;
  background-color: var(--color-slate-gray);
  cursor: not-allowed;
}

.shift-card {
  background-color: var(--color-surface-mute);
  text-align: center;
  margin-bottom: 2rem;
}
.shift-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.shift-card p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.shift-card .button-primary,
.shift-card .button-danger {
  width: 100%;
  max-width: 300px;
  margin: 0 auto;
}
.button-danger {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}

.view-header {
  margin-bottom: 2rem;
}
.title {
  font-size: 2.2rem;
  font-weight: 800;
}
.subtitle {
  color: var(--color-text-light);
  font-size: 1rem;
  margin-top: 0.25rem;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 2.5rem; /* Added margin to separate from stats */
}
.action-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: var(--color-text);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.action-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--color-primary);
}
.action-card.primary {
  background-color: var(--color-primary-mute);
}
.card-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
}
.action-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--color-heading);
}
.action-card p {
  color: var(--color-text-light);
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
