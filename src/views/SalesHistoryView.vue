<template>
  <div class="history-container">
    <header class="view-header">
      <h1 class="title">Sales History</h1>
      <p class="subtitle">A complete record of all your transactions.</p>
    </header>

    <div class="card">
      <div class="filter-bar">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search by Bill #, Customer, or Staff Name..."
        />
      </div>

      <div class="sales-list">
        <div v-if="filteredSales.length > 0">
          <RouterLink
            v-for="sale in filteredSales"
            :key="sale._id"
            :to="`/receipt/${sale._id}?from=history`"
            class="sale-item-link"
            :class="{
              voided: sale.status === 'void',
              'partially-returned':
                sale.hasReturns && sale.total - (sale.returnedValue || 0) > 0.01,
              'fully-returned': sale.hasReturns && sale.total - (sale.returnedValue || 0) <= 0.01,
            }"
          >
            <div class="sale-info">
              <span class="bill-number">Bill #{{ sale.billNumber }}</span>
              <span class="date">{{ formatDate(sale.createdAt) }}</span>
              <span v-if="sale.customerName" class="customer-name">
                To: {{ decryptData(sale.customerName) }}
              </span>
              <span v-if="sale.staffName" class="staff-name">By: {{ sale.staffName }}</span>
            </div>
            <div class="sale-total" :class="sale.status">
              <span v-if="sale.hasReturns && sale.status !== 'void'" class="status-text returned">
                {{ sale.total - (sale.returnedValue || 0) <= 0.01 ? 'Returned' : 'Partial Return' }}
              </span>
              <span class="status-text">{{ getStatusText(sale.status) }}</span>

              <div class="amount-breakdown">
                <span class="amount"
                  >Rs. {{ (sale.total - (sale.returnedValue || 0)).toFixed(2) }}</span
                >
                <span v-if="sale.hasReturns" class="original-amount">
                  (Original: Rs. {{ sale.total.toFixed(2) }})
                </span>
              </div>
            </div>
          </RouterLink>
        </div>
        <div v-else class="empty-state">
          <p>No sales found matching your search.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { RouterLink } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'

const profile = useProfileStore()
const allSales = ref([])
const searchQuery = ref('')
const isLoading = ref(true)

const fetchSalesHistory = async () => {
  isLoading.value = true
  allSales.value = [] // Clear previous results

  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId) {
    // If there's no ID when the component activates, wait.
    // The RLS policy needs a logged-in user anyway.
    isLoading.value = false
    return
  }

  // This query will now succeed because the new RLS policy allows it.
  const { data: salesData, error } = await supabase
    .from('sales')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching sales history:', error)
    isLoading.value = false
    return
  }

  // This handles the case of no sales being found after a successful query
  if (!salesData || salesData.length === 0) {
    allSales.value = []
    isLoading.value = false
    return
  }

  const customerIds = [...new Set(salesData.map((s) => s.customer_id).filter(Boolean))]

  let customerMap = new Map()
  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('_id, name')
      .in('_id', customerIds)
    if (customers) {
      customerMap = new Map(customers.map((c) => [c._id, c.name]))
    }
  }

  allSales.value = salesData.map((sale) => ({
    _id: sale._id,
    billNumber: sale.bill_number,
    createdAt: sale.created_at,
    customerName: sale.customer_id ? customerMap.get(sale.customer_id) : null,
    staffName: sale.staff_name,
    status: sale.status,
    total: sale.total,
    hasReturns: sale.has_returns,
    returnedValue: sale.returned_value,
  }))

  isLoading.value = false
}

// `onActivated` is the most reliable hook for components inside <KeepAlive>.
// It will run every time you navigate to the Sales History page.
onActivated(() => {
  fetchSalesHistory()
})

// The rest of your script (computed properties and formatters) remains the same
const filteredSales = computed(() => {
  if (isLoading.value) return []
  if (!searchQuery.value) return allSales.value
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return allSales.value.filter((sale) => {
    const billMatch = String(sale.billNumber).includes(lowerCaseQuery)
    const customerName = sale.customerName ? decryptData(sale.customerName) : ''
    const customerMatch = customerName && customerName.toLowerCase().includes(lowerCaseQuery)
    const staffMatch = sale.staffName && sale.staffName.toLowerCase().includes(lowerCaseQuery)
    return billMatch || customerMatch || staffMatch
  })
})

const getStatusText = (status) => {
  if (status === 'paid') return 'Paid'
  if (status === 'unpaid') return 'Credit'
  return 'Voided'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })
}
</script>

<style scoped>
/* Minor style update for the new staff name field */
.staff-name {
  font-size: 0.8rem;
  color: var(--color-text-light);
  font-style: italic;
}
/* All other styles are unchanged */
.sale-item-link.partially-returned {
  border-left-color: var(--color-saffron-orange);
}
.sale-item-link.fully-returned {
  border-left-color: var(--color-danger);
  opacity: 0.8;
}
.status-text.returned {
  background-color: var(--color-slate-gray);
  color: var(--color-soft-cream);
  margin-left: 0.5rem;
}
.amount-breakdown {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.original-amount {
  font-size: 0.8rem;
  color: var(--color-text-light);
  text-decoration: line-through;
}
.sale-total {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.sale-item-link.voided {
  background-color: #372e2e;
  text-decoration: line-through;
  opacity: 0.7;
  border-left: 4px solid var(--color-danger);
}
.sale-item-link.voided:hover {
  opacity: 1;
}
.sale-total.void .status-text {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}
.sale-total.void .amount-breakdown {
  opacity: 0.7;
}
.card {
  padding: 0;
}
.filter-bar {
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.sale-item-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  text-decoration: none;
  color: var(--color-text);
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s;
  border-left: 4px solid transparent;
}
.sale-item-link:hover {
  background-color: var(--color-surface-mute);
}
.sale-info {
  display: flex;
  flex-direction: column;
}
.bill-number {
  font-weight: 600;
  font-size: 1.1rem;
}
.date {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.customer-name {
  font-size: 0.9rem;
  color: var(--color-primary);
  font-weight: 500;
}
.amount {
  font-weight: 700;
  font-size: 1.2rem;
}
.status-text {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 99px;
  display: inline-block;
  order: 2;
}
.amount-breakdown {
  order: 1;
}
.sale-total.paid .status-text:not(.returned) {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}
.sale-total.unpaid .status-text:not(.returned) {
  background-color: var(--color-saffron-orange);
  color: var(--color-midnight-blue);
}
</style>
