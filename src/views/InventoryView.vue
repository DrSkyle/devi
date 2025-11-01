<template>
  <div class="inventory-container">
    <header class="view-header">
      <h1 class="title">Inventory</h1>
      <p class="subtitle">Search, filter, and manage your entire stock.</p>
    </header>

    <div class="summary-grid">
      <div
        class="summary-card interactive"
        @click="setActiveFilter('all')"
        :class="{ active: activeFilter === 'all' }"
      >
        <h3>Total Batches</h3>
        <span>{{ allInventory.length }}</span>
      </div>
      <div
        class="summary-card interactive"
        @click="setActiveFilter('low-stock')"
        :class="{ active: activeFilter === 'low-stock' }"
      >
        <h3>Low Stock Items</h3>
        <span class="warning-text">{{ lowStockCount }}</span>
      </div>
      <div
        class="summary-card interactive"
        @click="setActiveFilter('expiring-soon')"
        :class="{ active: activeFilter === 'expiring-soon' }"
      >
        <h3>Expiring Soon (90d)</h3>
        <span class="danger-text">{{ expiringSoonCount }}</span>
      </div>
    </div>

    <div class="actions-header">
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="Search by name or brand..." />
      </div>
      <RouterLink
        v-if="staffStore.activeUserRole !== 'cashier'"
        to="/inventory-alerts"
        class="button button-secondary"
      >
        View Alerts
      </RouterLink>
      <RouterLink
        v-if="staffStore.activeUserRole !== 'cashier'"
        to="/add-inventory"
        class="add-new-button button"
      >
        + Add New Stock
      </RouterLink>
    </div>

    <div class="inventory-card">
      <div v-if="filteredInventory.length > 0" class="table-container">
        <table>
          <thead>
            <tr>
              <th>Medicine Details</th>
              <th>Quantity</th>
              <th>Selling Price</th>
              <th>Expiry Date</th>
              <th v-if="staffStore.activeUserRole !== 'cashier'">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="result in filteredInventory"
              :key="result.item._id"
              :class="{
                'low-stock': result.item.quantity < 10,
                'expiring-soon': isExpiringSoon(result.item.expiry_date, 90),
              }"
            >
              <td data-label="Medicine Details">
                <div class="medicine-details">
                  <span class="medicine-name">{{ result.item.decryptedName }}</span>
                  <span class="medicine-subtext">{{ result.item.decryptedBrand }}</span>
                </div>
              </td>
              <td data-label="Quantity">
                <span class="quantity-pill">{{ result.item.quantity }}</span>
              </td>
              <td data-label="Selling Price">Rs. {{ result.item.selling_price?.toFixed(2) }}</td>
              <td data-label="Expiry Date">{{ formatDate(result.item.expiry_date) }}</td>
              <td v-if="staffStore.activeUserRole !== 'cashier'" data-label="Actions">
                <div class="actions-group">
                  <RouterLink :to="`/inventory/edit/${result.item._id}`" class="action-button edit"
                    >Edit</RouterLink
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty-state">
        <h2>No items match your search or filter.</h2>
        <p>Try a different search term or clear the filter.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { isExpiringSoon } from '../utils/date'
import { RouterLink } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import { useStaffStore } from '@/stores/staff.js'
import { useProfileStore } from '@/stores/profile'
import Fuse from 'fuse.js'

const allInventory = ref([])
const searchQuery = ref('')
const activeFilter = ref('all')
const staffStore = useStaffStore()
const profileStore = useProfileStore()
let fuse

const setupSearch = (inventory) => {
  const searchableInventory = inventory.map((item) => ({
    ...item,
    decryptedName: decryptData(item.name),
    decryptedBrand: decryptData(item.brand_name),
  }))

  const options = {
    keys: ['decryptedName', 'decryptedBrand'],
    includeScore: true,
    threshold: 0.4,
  }
  fuse = new Fuse(searchableInventory, options)
}

const fetchInventory = async () => {
  if (profileStore.pharmacyId) {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', profileStore.pharmacyId)
      .order('name')
    if (data) {
      allInventory.value = data // This reactive update will trigger the computed property
      setupSearch(data)
    }
  }
}

onActivated(fetchInventory)

const setActiveFilter = (filter) => {
  activeFilter.value = filter
}

const lowStockCount = computed(() => allInventory.value.filter((item) => item.quantity < 10).length)
const expiringSoonCount = computed(
  () => allInventory.value.filter((item) => isExpiringSoon(item.expiry_date, 90)).length,
)

// --- THIS IS THE CORRECTED LOGIC ---
const filteredInventory = computed(() => {
  // Start with the raw, reactive inventory list. This is the key change.
  let items = allInventory.value.map((item) => ({
    ...item,
    decryptedName: decryptData(item.name),
    decryptedBrand: decryptData(item.brand_name),
  }))

  // 1. Apply filters first.
  if (activeFilter.value === 'low-stock') {
    items = items.filter((item) => item.quantity < 10)
  } else if (activeFilter.value === 'expiring-soon') {
    items = items.filter((item) => isExpiringSoon(item.expiry_date, 90))
  }

  // 2. If there's a search query, perform a fuzzy search on the (potentially filtered) list.
  if (searchQuery.value.length > 1) {
    // Create a temporary Fuse instance on the current item set to search within filters.
    const searcher = new Fuse(items, {
      keys: ['decryptedName', 'decryptedBrand'],
      includeScore: true,
      threshold: 0.4,
    })
    return searcher.search(searchQuery.value, { limit: 50 })
  }

  // 3. If no search is active, return the filtered list, wrapped in the Fuse.js result structure for consistency.
  return items.map((item) => ({ item }))
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB')
}
</script>

<style scoped>
/* Your existing styles are perfect and do not need to be changed */
.actions-header .button,
.actions-header .button-secondary {
  width: auto;
  flex-shrink: 0;
}
.summary-card.interactive {
  cursor: pointer;
  transition:
    transform 0.2s,
    border-color 0.2s;
}
.summary-card.interactive:hover {
  transform: translateY(-5px);
  border-color: var(--color-primary);
}
.summary-card.active {
  border-color: var(--color-peacock-teal);
  box-shadow: 0 0 10px var(--color-peacock-teal);
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}
.summary-card {
  background-color: var(--color-surface);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}
.summary-card h3 {
  font-size: 1rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}
.summary-card span {
  font-size: 2rem;
  font-weight: 700;
}
.summary-card .warning-text {
  color: var(--color-saffron-orange);
}
.summary-card .danger-text {
  color: var(--color-danger);
}
.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.search-box {
  flex-grow: 1;
}
.search-box input {
  width: 100%;
  max-width: 400px;
}
.inventory-card {
  padding: 0;
  overflow: hidden;
  background-color: var(--color-surface);
  border-radius: 12px;
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
.medicine-details {
  display: flex;
  flex-direction: column;
}
.medicine-name {
  font-weight: 600;
  color: var(--color-soft-cream);
}
.medicine-subtext {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.quantity-pill {
  background-color: var(--color-slate-gray);
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.9rem;
}
tr.low-stock .quantity-pill {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
}
tr.expiring-soon td[data-label='Expiry Date'] {
  color: var(--color-saffron-orange);
  font-weight: 600;
}
.actions-group {
  display: flex;
  gap: 0.5rem;
}
.action-button {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  border: 1px solid transparent;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  background: none;
  cursor: pointer;
  font-family: inherit;
}
.action-button.edit {
  background-color: var(--color-surface-mute);
  border-color: var(--color-border);
  color: var(--color-text-light);
}
.action-button.edit:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.action-button.restock {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: var(--color-midnight-blue);
}
.action-button.restock:hover {
  background-color: #119c8d;
}
@media (max-width: 768px) {
  .inventory-card {
    background-color: transparent;
    border: none;
  }
  thead {
    display: none;
  }
  tr {
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
  }
  tr td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-light);
  }
  .medicine-details {
    text-align: right;
  }
}
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
}
</style>
