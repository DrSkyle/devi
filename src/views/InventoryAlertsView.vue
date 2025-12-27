<template>
  <div class="max-w-6xl mx-auto p-4">
    <!-- Header -->
    <div
      class="mb-6 flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-4"
    >
      <div>
        <RouterLink
          to="/inventory"
          class="no-underline flex align-items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
        >
          <i class="pi pi-arrow-left"></i>
          <span>Back to Inventory</span>
        </RouterLink>
        <h1 class="text-4xl font-thin text-white mb-2 flex align-items-center gap-3">
          Inventory Alerts
          <Tag
            :value="totalAlerts"
            severity="danger"
            class="text-lg px-3 py-1"
            rounded
            v-if="totalAlerts > 0"
          />
        </h1>
        <p class="text-gray-400">Actionable insights into your stock levels and expiry dates.</p>
      </div>

      <div class="flex gap-2">
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          class="p-button-outlined border-white-alpha-20 text-white"
          @click="fetchData"
          :loading="isLoading"
        />
      </div>
    </div>

    <div v-if="isLoading" class="glass-panel p-8 text-center">
      <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
      <p class="text-gray-400">Analyzing inventory...</p>
    </div>

    <div
      v-else-if="
        lowStockItems.length === 0 && expiringItems.length === 0 && expiredItems.length === 0
      "
      class="glass-panel p-8 text-center flex flex-column align-items-center"
    >
      <div class="bg-green-500-alpha-20 p-4 border-round-circle mb-4 text-green-400">
        <i class="pi pi-check-circle text-5xl"></i>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">All Systems Normal</h2>
      <p class="text-gray-400 max-w-md">
        Your inventory is healthy. No low stock or expiring items detected.
      </p>
      <RouterLink to="/inventory" class="mt-4">
        <Button label="Return to Dashboard" class="p-button-text" />
      </RouterLink>
    </div>

    <div v-else class="grid">
      <!-- Low Stock Alerts -->
      <div class="col-12 lg:col-4">
        <div class="glass-panel h-full p-0 overflow-hidden flex flex-column">
          <div
            class="p-4 border-bottom-1 border-white-alpha-10 bg-white-alpha-5 flex justify-content-between align-items-center"
          >
            <h2 class="text-xl font-bold text-white m-0 flex align-items-center gap-2">
              <i class="pi pi-exclamation-triangle text-orange-500"></i>
              Low Stock
            </h2>
            <Tag :value="lowStockItems.length" severity="warning" rounded />
          </div>

          <div class="p-4 flex-grow-1 overflow-y-auto" style="max-height: 600px">
            <div v-if="lowStockItems.length === 0" class="text-center py-6 text-gray-500">
              No low stock items.
            </div>
            <div v-else class="flex flex-column gap-3">
              <div
                v-for="item in lowStockItems"
                :key="item._id"
                class="surface-ground border-round p-3 flex align-items-center gap-3 hover:surface-hover transition-colors cursor-pointer group"
              >
                <div class="flex-grow-1">
                  <div class="font-bold text-white mb-1">{{ item.name }}</div>
                  <div class="text-sm text-gray-400 flex align-items-center gap-2">
                    <i class="pi pi-box text-xs"></i>
                    {{ item.supplierName || 'Unknown Supplier' }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-orange-500 mb-1">{{ item.quantity }}</div>
                  <div class="text-xs text-gray-500 uppercase">Remaining</div>
                </div>
                <RouterLink :to="`/inventory/edit/${item._id}`">
                  <Button
                    icon="pi pi-arrow-right"
                    class="p-button-rounded p-button-text text-gray-400 hover:text-white hover:bg-white-alpha-10"
                  />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Expiring Alerts -->
      <div class="col-12 lg:col-4">
        <div class="glass-panel h-full p-0 overflow-hidden flex flex-column">
          <div
            class="p-4 border-bottom-1 border-white-alpha-10 bg-white-alpha-5 flex justify-content-between align-items-center"
          >
            <h2 class="text-xl font-bold text-white m-0 flex align-items-center gap-2">
              <i class="pi pi-clock text-red-500"></i>
              Expiring Soon
            </h2>
            <Tag :value="expiringItems.length" severity="danger" rounded />
          </div>

          <div class="p-4 flex-grow-1 overflow-y-auto" style="max-height: 600px">
            <div v-if="expiringItems.length === 0" class="text-center py-6 text-gray-500">
              No expiring items.
            </div>
            <div v-else class="flex flex-column gap-3">
              <div
                v-for="item in expiringItems"
                :key="item._id"
                class="surface-ground border-round p-3 flex align-items-center gap-3 hover:surface-hover transition-colors cursor-pointer group"
              >
                <div class="flex-grow-1">
                  <div class="font-bold text-white mb-1">{{ item.name }}</div>
                  <div class="text-sm text-gray-400 flex align-items-center gap-2">
                    <i class="pi pi-hashtag text-xs"></i>
                    Batch: {{ item.batch_no || 'N/A' }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-red-400 mb-1">
                    {{ formatDate(item.expiry_date) }}
                  </div>
                  <div class="text-xs text-gray-500 uppercase">Expiry Date</div>
                </div>
                <RouterLink :to="`/inventory/edit/${item._id}`">
                  <Button
                    icon="pi pi-arrow-right"
                    class="p-button-rounded p-button-text text-gray-400 hover:text-white hover:bg-white-alpha-10"
                  />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { isExpiringSoon } from '@/utils/dateUtils'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const isLoading = ref(true)
const allInventory = ref([])
const supplierMap = ref(new Map())
const profileStore = useProfileStore()

let inventorySub = null
let suppliersSub = null

const subscribeToData = () => {
  if (inventorySub) inventorySub.unsubscribe()
  if (suppliersSub) suppliersSub.unsubscribe()

  const pharmacyId = profileStore.pharmacyId
  if (!pharmacyId) {
    isLoading.value = false
    return
  }

  isLoading.value = true

  // Suppliers
  suppliersSub = database
    .get('suppliers')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      supplierMap.value = new Map(records.map((s) => [s.id, s.name]))
    })

  // Inventory
  inventorySub = database
    .get('inventory')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      allInventory.value = records.map((item) => ({
        ...item._raw,
        id: item.id,
        name: decryptData(item.name),
        supplierId: item.supplierId,
        quantity: item.quantity,
        expiryDate: item.expiryDate,
        batchNo: item.batchNo,
        _id: item.id,
      }))
      isLoading.value = false
    })
}

onMounted(() => {
  subscribeToData()
})

onUnmounted(() => {
  if (inventorySub) inventorySub.unsubscribe()
  if (suppliersSub) suppliersSub.unsubscribe()
})

watch(() => profileStore.pharmacyId, subscribeToData)

const lowStockItems = computed(() => {
  return allInventory.value
    .filter((item) => item.quantity < 10 && item.quantity > 0)
    .map((item) => ({
      ...item,
      supplierName: supplierMap.value.get(item.supplierId),
    }))
})

const expiringItems = computed(() => {
  const now = new Date()
  return allInventory.value
    .filter(
      (item) =>
        item.expiryDate && new Date(item.expiryDate) >= now && isExpiringSoon(item.expiryDate, 90),
    )
    .map((item) => ({
      ...item,
      expiry_date: item.expiryDate,
      batch_no: item.batchNo,
    }))
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
})

const expiredItems = computed(() => {
  const now = new Date()
  return allInventory.value
    .filter((item) => item.expiryDate && new Date(item.expiryDate) < now)
    .map((item) => ({
      ...item,
      expiry_date: item.expiryDate,
    }))
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
})

const totalAlerts = computed(
  () => lowStockItems.value.length + expiringItems.value.length + expiredItems.value.length,
)

const fetchData = () => {
  // Manual refresh just re-subscribes (or does nothing if already live)
  // Since it's observable, "Refresh" button is less relevant, but we can keep it to force re-sync if needed
  // For now, just re-run subscription setup
  subscribeToData()
}

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
/* Minimal scoped styles */
</style>
