<template>
  <div class="alerts-container">
    <header class="view-header">
      <RouterLink to="/inventory" class="back-link">&larr; Back to Inventory</RouterLink>
      <h1 class="title">Inventory Alerts</h1>
      <p class="subtitle">Actionable insights into your stock levels and expiry dates.</p>
    </header>

    <div v-if="isLoading" class="card empty-state">
      <p>Loading alerts...</p>
    </div>
    <div
      v-else-if="lowStockItems.length === 0 && expiringItems.length === 0"
      class="card empty-state all-clear"
    >
      <h2>All Clear!</h2>
      <p>
        Your inventory is in great shape. There are no low stock or expiring items that need your
        attention right now.
      </p>
    </div>

    <div v-else class="alerts-layout">
      <div class="card">
        <h2>
          Low Stock Items <span class="count-badge warning">{{ lowStockItems.length }}</span>
        </h2>
        <p class="card-subtitle">Items with quantity below 10 units.</p>
        <div v-if="lowStockItems.length > 0" class="items-list">
          <div v-for="item in lowStockItems" :key="item._id" class="alert-item">
            <div class="item-details">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-subtext">Supplier: {{ item.supplierName || 'N/A' }}</span>
            </div>
            <div class="item-status">
              <span class="quantity">{{ item.quantity }} left</span>
            </div>
          </div>
        </div>
        <p v-else class="empty-list">No items are currently low on stock.</p>
      </div>

      <div class="card">
        <h2>
          Expiring Soon <span class="count-badge danger">{{ expiringItems.length }}</span>
        </h2>
        <p class="card-subtitle">Items expiring in the next 90 days, sorted by nearest date.</p>
        <div v-if="expiringItems.length > 0" class="items-list">
          <div v-for="item in expiringItems" :key="item._id" class="alert-item">
            <div class="item-details">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-subtext">Batch: {{ item.batch_no || 'N/A' }}</span>
            </div>
            <div class="item-status">
              <span class="expiry-date">{{ formatDate(item.expiry_date) }}</span>
            </div>
          </div>
        </div>
        <p v-else class="empty-list">No items are expiring soon.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { isExpiringSoon } from '../utils/date'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'

const isLoading = ref(true)
const lowStockItems = ref([])
const expiringItems = ref([])
const profileStore = useProfileStore()

onMounted(async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (!pharmacyId) {
    isLoading.value = false
    return
  }

  try {
    const { data: inventory } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId) // <-- FIX: Was 'user_id'

    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('_id, name')
      .eq('pharmacy_id', pharmacyId) // <-- FIX: Was 'user_id', now correctly targets pharmacy

    if (inventory) {
      const supplierMap = new Map((suppliers || []).map((s) => [s._id, s.name]))

      lowStockItems.value = inventory
        .filter((item) => item.quantity < 10 && item.quantity > 0)
        .map((item) => ({
          ...item,
          name: decryptData(item.name),
          supplierName: supplierMap.get(item.supplier_id),
        }))

      const now = new Date()
      expiringItems.value = inventory
        .filter(
          (item) =>
            item.expiry_date &&
            new Date(item.expiry_date) >= now &&
            isExpiringSoon(item.expiry_date, 90),
        )
        .map((item) => ({ ...item, name: decryptData(item.name) }))
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
    }
  } catch (error) {
    console.error('Failed to load inventory alerts:', error)
  } finally {
    isLoading.value = false
  }
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 1rem;
}
.back-link:hover {
  color: var(--color-primary);
}
.alerts-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2rem;
}
@media (min-width: 1024px) {
  .alerts-layout {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
.card h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}
.card-subtitle {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.count-badge {
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 99px;
  color: var(--color-midnight-blue);
}
.count-badge.warning {
  background-color: var(--color-saffron-orange);
}
.count-badge.danger {
  background-color: var(--color-danger);
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
}
.item-details {
  display: flex;
  flex-direction: column; /* This stacks the name and subtext */
  gap: 0.25rem; /* Adds a small space between them */
}
.item-details .item-name {
  font-weight: 600;
}
.item-details .item-subtext {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.item-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}
.quantity {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-saffron-orange);
}
.expiry-date {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--color-danger);
}
.empty-list {
  text-align: center;
  padding: 2rem 0;
  color: var(--color-text-light);
}
.empty-state.all-clear {
  padding: 3rem 2rem;
  border: 2px dashed var(--color-peacock-teal);
  background-color: var(--color-surface-mute);
}
.all-clear h2 {
  color: var(--color-peacock-teal);
  justify-content: center;
}
</style>
