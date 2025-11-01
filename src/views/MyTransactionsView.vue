<template>
  <div class="history-container">
    <header class="view-header">
      <h1 class="title">My Recent Transactions</h1>
      <p class="subtitle">A record of sales you have processed today.</p>
    </header>

    <div class="card">
      <div v-if="isLoading" class="loading-state">
        <p>Loading your transactions...</p>
      </div>
      <div v-else class="sales-list">
        <div v-if="todaysSales.length > 0">
          <RouterLink
            v-for="sale in todaysSales"
            :key="sale._id"
            :to="`/receipt/${sale._id}`"
            class="sale-item-link"
            :class="{
              voided: sale.status === 'void',
              'partially-returned': sale.hasReturns && sale.returnedValue > 0,
            }"
          >
            <div class="sale-info">
              <span class="bill-number">Bill #{{ sale.bill_number }}</span>
              <span class="date">{{ formatDate(sale.created_at) }}</span>
              <span v-if="sale.customerName" class="customer-name">
                To: {{ decryptData(sale.customerName) }}
              </span>
            </div>
            <div class="sale-total" :class="sale.status">
              <span class="status-text">{{ getStatusText(sale.status) }}</span>
              <span class="amount">Rs. {{ sale.total.toFixed(2) }}</span>
            </div>
          </RouterLink>
        </div>
        <div v-else class="empty-state">
          <p>You have not recorded any sales today.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile' // <-- Import Profile Store
import { RouterLink } from 'vue-router'
import { decryptData } from '@/utils/cipher'

const staffStore = useStaffStore()
const profileStore = useProfileStore() // <-- Initialize Profile Store
const todaysSales = ref([])
const isLoading = ref(true)

onActivated(async () => {
  isLoading.value = true

  // *** THIS IS THE FIX ***
  // We check the user's role to decide how to query the database.
  const isUserAdmin = staffStore.activeUserRole === 'admin'
  const userIdToQuery = isUserAdmin ? profileStore.userId : staffStore.activeUserId
  const columnToQuery = isUserAdmin ? 'user_id' : 'staff_id'

  if (!userIdToQuery) {
    isLoading.value = false
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data: salesData, error } = await supabase
    .from('sales')
    .select('*')
    .gte('created_at', todayISO)
    .eq(columnToQuery, userIdToQuery) // <-- The query is now dynamic
    .order('created_at', { ascending: false })

  if (salesData) {
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

    todaysSales.value = salesData.map((sale) => ({
      ...sale,
      customerName: sale.customer_id ? customerMap.get(sale.customer_id) : null,
    }))
  }
  isLoading.value = false
})

const getStatusText = (status) => {
  const statusMap = {
    paid: 'Paid',
    unpaid: 'Credit',
    void: 'Voided',
  }
  return statusMap[status] || 'Unknown'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
</script>

<style scoped>
/* These styles are adapted from SalesHistoryView for a consistent look */
.card {
  padding: 0;
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
}
.sale-item-link:hover {
  background-color: var(--color-surface-mute);
}
.sale-item-link:last-child {
  border-bottom: none;
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
.sale-total {
  display: flex;
  align-items: center;
  gap: 1rem;
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
}
.sale-total.paid .status-text {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}
.sale-total.unpaid .status-text {
  background-color: var(--color-saffron-orange);
  color: var(--color-midnight-blue);
}
.sale-total.void .status-text {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}
.sale-item-link.voided {
  opacity: 0.7;
}
.sale-item-link.partially-returned {
  border-left: 4px solid var(--color-saffron-orange);
}
.empty-state,
.loading-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-light);
}
</style>
