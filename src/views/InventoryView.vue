<template>
  <div
    class="inventory-container p-4 max-w-7xl mx-auto relative h-screen flex flex-column overflow-hidden"
  >
    <!-- Header & Stats -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Inventory</h1>
        <p class="text-gray-400 text-sm">Manage stock & pricing</p>
      </div>

      <!-- Desktop Actions -->
      <div class="hidden md:flex gap-3">
        <RouterLink to="/inventory-alerts" v-if="staffStore.activeUserRole !== 'cashier'">
          <Button
            icon="pi pi-bell"
            class="p-button-rounded p-button-text text-gray-400 hover:text-white hover:bg-white-alpha-10"
            v-tooltip.bottom="'View Alerts'"
            :badge="totalAlerts > 0 ? totalAlerts.toString() : null"
            badgeSeverity="danger"
          />
        </RouterLink>
        <RouterLink to="/add-inventory">
          <Button
            label="Add Stock"
            icon="pi pi-plus"
            class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
          />
        </RouterLink>
      </div>
    </div>

    <!-- Clean Command Bar -->
    <div
      class="mb-6 sticky top-0 z-5 bg-blur py-2"
      style="backdrop-filter: blur(12px); margin: 0 -1rem; padding: 1rem"
    >
      <div class="max-w-7xl mx-auto px-3">
        <!-- Search Input -->
        <div class="relative w-full mb-3">
          <i
            class="pi pi-search absolute text-gray-500 text-xl"
            style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
          ></i>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
          />
        </div>

        <!-- Minimal Filter Tabs -->
        <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <button
            @click="activeFilter = 'all'"
            class="bg-transparent border-none cursor-pointer text-sm font-medium transition-colors white-space-nowrap pb-1 border-bottom-2"
            :class="
              activeFilter === 'all'
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            In Stock <span class="text-xs opacity-70 ml-1">({{ allInventory.length }})</span>
          </button>

          <button
            @click="activeFilter = 'low-stock'"
            class="bg-transparent border-none cursor-pointer text-sm font-medium transition-colors white-space-nowrap pb-1 border-bottom-2"
            :class="
              activeFilter === 'low-stock'
                ? 'text-orange-500 border-orange-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            Low Stock
            <span class="text-xs opacity-70 ml-1" v-if="lowStockCount > 0"
              >({{ lowStockCount }})</span
            >
          </button>

          <button
            @click="activeFilter = 'expiring-soon'"
            class="bg-transparent border-none cursor-pointer text-sm font-medium transition-colors white-space-nowrap pb-1 border-bottom-2"
            :class="
              activeFilter === 'expiring-soon'
                ? 'text-red-500 border-red-500'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            Expiring
            <span class="text-xs opacity-70 ml-1" v-if="expiringSoonCount > 0"
              >({{ expiringSoonCount }})</span
            >
          </button>

          <button
            @click="activeFilter = 'expired'"
            class="bg-transparent border-none cursor-pointer text-sm font-medium transition-colors white-space-nowrap pb-1 border-bottom-2"
            :class="
              activeFilter === 'expired'
                ? 'text-red-600 border-red-600'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            Expired
            <span class="text-xs opacity-70 ml-1" v-if="expiredCount > 0"
              >({{ expiredCount }})</span
            >
          </button>
        </div>
      </div>
    </div>

    <!-- Inventory List (Virtualized) -->
    <div class="glass-panel p-0 flex-grow-1 min-h-0 flex flex-column overflow-hidden">
      <div v-if="isLoading" class="p-4">
        <div class="flex flex-column gap-3">
          <div class="flex justify-content-between mb-3">
            <Skeleton width="10rem" height="2rem" class="bg-white-alpha-10" />
            <Skeleton width="5rem" height="2rem" class="bg-white-alpha-10" />
          </div>
          <Skeleton height="3rem" class="bg-white-alpha-10" v-for="i in 5" :key="i" />
        </div>
      </div>

      <div v-else class="flex-grow-1 overflow-auto" ref="parentRef">
        <!-- Hybrid Rendering: Standard for small lists, Virtualized for large -->
        <div v-if="filteredInventory.length <= 50">
          <div
            v-for="item in filteredInventory"
            :key="item.id"
            class="flex align-items-center p-3 border-bottom-1 border-white-alpha-10 hover:bg-white-alpha-5 transition-colors"
          >
            <!-- Product Name -->
            <div class="flex-grow-1">
              <div class="font-bold text-white">
                {{ item.decryptedName }}
              </div>
              <div class="text-xs text-gray-400">
                {{ item.decryptedBrand }}
              </div>
            </div>

            <!-- Stock -->
            <div class="w-2rem text-center mr-4">
              <Tag
                :value="item.quantity"
                :severity="getStockSeverity(item.quantity)"
                class="font-mono"
              />
            </div>

            <!-- Price -->
            <div class="w-6rem text-right mr-4">
              <span class="text-primary font-bold">Rs. {{ item.sellingPrice }}</span>
            </div>

            <!-- Expiry -->
            <div class="w-6rem text-right mr-4 hidden md:block">
              <span :class="getExpiryClass(item.expiryDate)">
                {{ formatDate(item.expiryDate) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-sm text-gray-400 hover:text-white"
                @click="editItem(item)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-sm text-red-400 hover:text-red-300"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          :style="{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }"
        >
          <div
            v-for="virtualRow in rowVirtualizer.getVirtualItems()"
            :key="virtualRow.key"
            class="flex align-items-center p-3 border-bottom-1 border-white-alpha-10 hover:bg-white-alpha-5 transition-colors"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }"
          >
            <!-- Product Name -->
            <div class="flex-grow-1">
              <div class="font-bold text-white">
                {{ filteredInventory[virtualRow.index].decryptedName }}
              </div>
              <div class="text-xs text-gray-400">
                {{ filteredInventory[virtualRow.index].decryptedBrand }}
              </div>
            </div>

            <!-- Stock -->
            <div class="w-2rem text-center mr-4">
              <Tag
                :value="filteredInventory[virtualRow.index].quantity"
                :severity="getStockSeverity(filteredInventory[virtualRow.index].quantity)"
                class="font-mono"
              />
            </div>

            <!-- Price -->
            <div class="w-6rem text-right mr-4">
              <span class="text-primary font-bold"
                >Rs. {{ filteredInventory[virtualRow.index].sellingPrice }}</span
              >
            </div>

            <!-- Expiry -->
            <div class="w-6rem text-right mr-4 hidden md:block">
              <span :class="getExpiryClass(filteredInventory[virtualRow.index].expiryDate)">
                {{ formatDate(filteredInventory[virtualRow.index].expiryDate) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-sm text-gray-400 hover:text-white"
                @click="editItem(filteredInventory[virtualRow.index])"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-sm text-red-400 hover:text-red-300"
                @click="confirmDelete(filteredInventory[virtualRow.index])"
              />
            </div>
          </div>
        </div>

        <div v-if="filteredInventory.length === 0" class="text-center p-4 text-gray-400">
          No items found.
        </div>
      </div>
    </div>

    <!-- Mobile Floating Actions -->
    <div class="md:hidden fixed bottom-0 right-0 p-3 pb-7 z-5 flex flex-column gap-3 mb-4">
      <RouterLink to="/inventory-alerts">
        <Button
          icon="pi pi-bell"
          class="p-button-rounded p-button-secondary shadow-6 w-3rem h-3rem"
          :badge="totalAlerts > 0 ? totalAlerts.toString() : null"
          badgeSeverity="danger"
        />
      </RouterLink>
      <RouterLink to="/add-inventory">
        <Button
          icon="pi pi-plus"
          class="p-button-rounded bg-primary border-none shadow-6 w-4rem h-4rem text-xl"
        />
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

import { isExpiringSoon } from '@/utils/dateUtils'
import { RouterLink, useRouter } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import { useStaffStore } from '@/stores/staff.js'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'
import Fuse from 'fuse.js'
import { useConfirm } from 'primevue/useconfirm'

import { useVirtualizer } from '@tanstack/vue-virtual'

// PrimeVue Components
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'

const allInventory = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const activeFilter = ref('all')
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const notification = useNotificationStore()
const router = useRouter()
const confirm = useConfirm()

let subscription = null

const subscribeToInventory = () => {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }

  if (profileStore.pharmacyId) {
    const query = database.get('inventory').query(Q.where('pharmacy_id', profileStore.pharmacyId))
    subscription = query.observe().subscribe((records) => {
      allInventory.value = records.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      isLoading.value = false
    })
  } else {
    isLoading.value = false
    allInventory.value = []
  }
}

onMounted(async () => {
  if (!profileStore.pharmacyId) {
    if (!profileStore.pharmacyId) {
      await profileStore.loadFromLocalDatabase()
    }
  }
  subscribeToInventory()
})

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
})

watch(
  () => profileStore.pharmacyId,
  () => {
    subscribeToInventory()
  },
)

const lowStockCount = computed(() => allInventory.value.filter((item) => item.quantity < 10).length)
const expiringSoonCount = computed(
  () =>
    allInventory.value.filter(
      (item) => isExpiringSoon(item.expiryDate, 90) && !isExpired(item.expiryDate),
    ).length,
)
const expiredCount = computed(
  () => allInventory.value.filter((item) => isExpired(item.expiryDate)).length,
)
const totalAlerts = computed(
  () => lowStockCount.value + expiringSoonCount.value + expiredCount.value,
)

const filteredInventory = computed(() => {
  let items = allInventory.value.map((item) => {
    const raw = item._raw || {}
    // Fallback to raw fields if model getters fail
    const name = item.name || raw.name
    const brandName = item.brandName || raw.brand_name
    const quantity = item.quantity !== undefined ? item.quantity : raw.quantity
    const sellingPrice = item.sellingPrice !== undefined ? item.sellingPrice : raw.selling_price
    const expiryDate = item.expiryDate || raw.expiry_date

    const dName = decryptData(name)
    const dBrand = decryptData(brandName)

    return {
      ...raw,
      id: item.id,
      name: name,
      brandName: brandName,
      quantity: quantity,
      sellingPrice: sellingPrice,
      expiryDate: expiryDate,
      decryptedName: dName || name || 'Unknown Item',
      decryptedBrand: dBrand || brandName,
    }
  })

  // Deduplicate items based on Name + Brand + BatchNo
  const uniqueItems = []
  const seenKeys = new Set()

  items.forEach((item) => {
    // Create a unique key for the item
    const key = `${item.decryptedName}|${item.decryptedBrand}|${item.batchNo}`.toLowerCase()

    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      uniqueItems.push(item)
    }
  })

  items = uniqueItems

  if (activeFilter.value === 'low-stock') {
    items = items.filter((item) => item.quantity < 10)
  } else if (activeFilter.value === 'expiring-soon') {
    items = items.filter(
      (item) => isExpiringSoon(item.expiryDate, 90) && !isExpired(item.expiryDate),
    )
  } else if (activeFilter.value === 'expired') {
    items = items.filter((item) => isExpired(item.expiryDate))
  }

  if (searchQuery.value.length > 1) {
    const searcher = new Fuse(items, {
      keys: ['decryptedName', 'decryptedBrand'],
      includeScore: true,
      threshold: 0.4,
    })
    items = searcher.search(searchQuery.value, { limit: 50 }).map((result) => result.item)
  }

  console.log('InventoryView: Filtered items count:', items.length)
  return items
})

const parentRef = ref(null)

const rowVirtualizer = useVirtualizer({
  count: computed(() => filteredInventory.value.length),
  getScrollElement: () => parentRef.value,
  estimateSize: () => 72, // Estimated row height
  overscan: 5,
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB')
}

const getStockSeverity = (stock) => {
  if (stock < 10) return 'danger'
  if (stock < 50) return 'warning'
  return 'success'
}

const getExpiryClass = (date) => {
  if (isExpired(date)) return 'text-red-600 font-bold'
  if (isExpiringSoon(date, 90)) return 'text-orange-400 font-bold'
  return 'text-gray-300'
}

const isExpired = (dateString) => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

const editItem = (item) => {
  router.push(`/inventory/edit/${item.id}`)
}

const confirmDelete = (item) => {
  confirm.require({
    message: `Are you sure you want to delete ${item.decryptedName}?`,
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await database.write(async () => {
          const itemToDelete = await database.get('inventory').find(item.id)
          await itemToDelete.markAsDeleted() // Syncable delete
        })
        notification.showNotification('Item deleted successfully')
      } catch (error) {
        console.error(error)
        notification.showNotification('Failed to delete item', 'error')
      }
    },
  })
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
