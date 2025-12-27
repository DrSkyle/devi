<template>
  <div class="medicine-finder-container p-4 max-w-7xl mx-auto">
    <Toast />

    <!-- Header Section -->
    <div class="text-center mb-8 relative z-1">
      <div
        class="inline-flex align-items-center justify-content-center bg-primary-500 border-round-2xl p-3 mb-4 shadow-8"
        style="box-shadow: 0 0 30px rgba(16, 185, 129, 0.3)"
      >
        <i class="pi pi-search text-3xl text-white"></i>
      </div>
      <h1 class="text-5xl font-thin text-white mb-2 tracking-tight">Medicine Finder</h1>
      <p class="text-gray-400 text-lg max-w-2xl mx-auto">
        Instantly locate medicines across your inventory and the entire Devi Network.
      </p>
    </div>

    <!-- Search Command Center -->
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
            ref="searchInput"
            v-model="searchQuery"
            @input="debouncedSearch"
            type="text"
            class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
            placeholder="Search by name, brand, or generic... (Press '/')"
          />
          <div
            v-if="isLoading"
            class="absolute"
            style="top: 50%; right: 1rem; transform: translateY(-50%)"
          >
            <i class="pi pi-spin pi-spinner text-primary text-xl"></i>
          </div>
        </div>

        <!-- Minimal Filter Tabs -->
        <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
          <button
            v-for="filter in filters"
            :key="filter.value"
            @click="activeFilter = filter.value"
            class="bg-transparent border-none cursor-pointer text-sm font-medium transition-colors white-space-nowrap pb-1 border-bottom-2"
            :class="
              activeFilter === filter.value
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            "
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results Section -->
    <transition name="fade" mode="out-in">
      <div v-if="!searchQuery" class="text-center py-8 opacity-50">
        <i class="pi pi-compass text-6xl text-gray-600 mb-4"></i>
        <p class="text-gray-500 text-xl">Start typing to explore the network...</p>
      </div>

      <div v-else class="results-container">
        <!-- Local Inventory -->
        <section class="mb-8">
          <div class="flex align-items-center gap-3 mb-4 px-2">
            <div
              class="w-2rem h-2rem border-round bg-primary flex align-items-center justify-content-center"
            >
              <i class="pi pi-box text-white text-sm"></i>
            </div>
            <h2 class="text-2xl font-bold text-white m-0">Local Inventory</h2>
            <Badge :value="filteredLocalResults.length" severity="success" class="ml-auto" />
          </div>

          <div v-if="filteredLocalResults.length > 0" class="grid">
            <div
              v-for="item in filteredLocalResults"
              :key="item.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <div
                class="glass-panel h-full p-4 relative overflow-hidden group hover:border-primary transition-colors duration-300"
              >
                <!-- Stock Indicator Bar -->
                <div
                  class="absolute top-0 left-0 h-full w-1 transition-all duration-500"
                  :class="
                    item.quantity > 10
                      ? 'bg-primary'
                      : item.quantity > 0
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                  "
                ></div>

                <div class="pl-3">
                  <div class="flex justify-content-between align-items-start mb-2">
                    <div>
                      <h3 class="text-xl font-bold text-white m-0 mb-1">
                        {{ decryptData(item.name) }}
                      </h3>
                      <p class="text-primary text-sm font-medium m-0">
                        {{ decryptData(item.brand_name) }}
                      </p>
                    </div>
                    <Tag
                      :value="item.quantity > 0 ? 'In Stock' : 'Out'"
                      :severity="item.quantity > 0 ? 'success' : 'danger'"
                      class="text-xs"
                    />
                  </div>

                  <div class="flex align-items-center gap-3 text-gray-400 text-sm mb-4">
                    <span v-if="item.shelfLocation" class="flex align-items-center gap-1">
                      <i class="pi pi-map-marker"></i> {{ decryptData(item.shelfLocation) }}
                    </span>
                    <span class="flex align-items-center gap-1">
                      <i class="pi pi-hashtag"></i> Qty: {{ item.quantity }}
                    </span>
                  </div>

                  <div class="flex gap-2 mt-auto">
                    <Button
                      :label="addedItems.has(item.id) ? 'Added' : 'Add to Cart'"
                      :icon="addedItems.has(item.id) ? 'pi pi-check' : 'pi pi-shopping-cart'"
                      class="p-button-sm w-full transition-all duration-200"
                      :class="{ 'p-button-success': addedItems.has(item.id) }"
                      :disabled="item.quantity <= 0"
                      @click="addToCart(item)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="glass-panel p-4 text-center text-gray-500 italic">
            No matches in local inventory.
          </div>
        </section>

        <!-- Network Results -->
        <section v-if="hasNetworkResults">
          <div class="flex align-items-center gap-3 mb-4 px-2 mt-6">
            <div
              class="w-2rem h-2rem border-round bg-purple-500 flex align-items-center justify-content-center"
            >
              <i class="pi pi-globe text-white text-sm"></i>
            </div>
            <h2 class="text-2xl font-bold text-white m-0">Devi Network</h2>
          </div>

          <div class="grid">
            <!-- City Results -->
            <div
              v-for="item in networkResults.city"
              :key="item.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="glass-panel h-full p-4 border-left-3 border-purple-500 flex flex-column">
                <div class="mb-3">
                  <div class="flex justify-content-between">
                    <h3 class="text-lg font-bold text-white m-0">{{ item.decryptedName }}</h3>
                    <Badge value="Same City" severity="info" />
                  </div>
                  <p class="text-gray-400 text-sm mt-1 mb-2">{{ item.decryptedBrand }}</p>
                  <div class="flex align-items-center gap-2 text-sm text-gray-300">
                    <i class="pi pi-building text-purple-400"></i>
                    <span>{{ item.pharmacy_name }}</span>
                  </div>
                </div>
                <div class="flex gap-2 mt-auto">
                  <Button
                    label="Request Transfer"
                    icon="pi pi-send"
                    class="p-button-outlined p-button-secondary flex-1 hover:bg-purple-500 hover:text-white hover:border-purple-500"
                    @click="openTransferDialog(item)"
                  />
                  <Button
                    icon="pi pi-plus"
                    class="p-button-outlined p-button-secondary hover:bg-primary hover:text-white hover:border-primary"
                    v-tooltip.top="'Add to My Stock'"
                    @click="addToMyStock(item)"
                  />
                </div>
              </div>
            </div>

            <!-- District Results -->
            <div
              v-for="item in networkResults.district"
              :key="item.id"
              class="col-12 md:col-6 lg:col-4"
            >
              <div class="glass-panel h-full p-4 border-left-3 border-orange-500 flex flex-column">
                <div class="mb-3">
                  <div class="flex justify-content-between">
                    <h3 class="text-lg font-bold text-white m-0">{{ item.decryptedName }}</h3>
                    <Badge value="District" severity="warning" />
                  </div>
                  <p class="text-gray-400 text-sm mt-1 mb-2">{{ item.decryptedBrand }}</p>
                  <div class="flex align-items-center gap-2 text-sm text-gray-300">
                    <i class="pi pi-map text-orange-400"></i>
                    <span>{{ item.pharmacy_name }} ({{ item.city }})</span>
                  </div>
                </div>
                <div class="flex gap-2 mt-auto">
                  <Button
                    label="Request Transfer"
                    icon="pi pi-send"
                    class="p-button-outlined p-button-secondary flex-1 hover:bg-orange-500 hover:text-white hover:border-orange-500"
                    @click="openTransferDialog(item)"
                  />
                  <Button
                    icon="pi pi-plus"
                    class="p-button-outlined p-button-secondary hover:bg-primary hover:text-white hover:border-primary"
                    v-tooltip.top="'Add to My Stock'"
                    @click="addToMyStock(item)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </transition>

    <!-- Transfer Dialog -->
    <Dialog
      v-model:visible="transferDialog.visible"
      header="Request Transfer"
      modal
      :style="{ width: '400px' }"
      :pt="{
        root: { class: 'glass-panel border-none' },
        header: { class: 'bg-transparent text-white' },
        content: { class: 'bg-transparent' },
        footer: { class: 'bg-transparent border-none' },
      }"
    >
      <div class="flex flex-column gap-4" v-if="transferDialog.item">
        <div class="bg-white-alpha-5 p-3 border-round-xl">
          <p class="m-0 text-gray-300 line-height-3">
            Requesting
            <strong class="text-primary">{{ transferDialog.item.decryptedName }}</strong> from
            <strong class="text-white">{{ transferDialog.item.pharmacy_name }}</strong
            >.
          </p>
        </div>
        <div class="flex flex-column gap-2">
          <label for="qty" class="font-semibold text-gray-300">Quantity Needed</label>
          <InputNumber
            v-model="transferDialog.quantity"
            inputId="qty"
            :min="1"
            showButtons
            buttonLayout="horizontal"
            class="w-full"
            inputClass="text-center bg-transparent text-white border-white-alpha-20"
          >
            <template #incrementbuttonicon><span class="pi pi-plus"></span></template>
            <template #decrementbuttonicon><span class="pi pi-minus"></span></template>
          </InputNumber>
        </div>
        <div
          class="flex align-items-center justify-content-between bg-white-alpha-5 p-3 border-round-xl"
        >
          <div>
            <label class="font-semibold text-white block">Urgent / Stat Request</label>
            <small class="text-gray-400">Runner will be dispatched immediately.</small>
          </div>
          <InputSwitch v-model="transferDialog.isStat" />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          text
          class="text-gray-400 hover:text-white"
          @click="transferDialog.visible = false"
        />
        <Button
          label="Send Request"
          icon="pi pi-send"
          @click="submitTransferRequest"
          :loading="isSubmitting"
          class="bg-primary border-primary hover:bg-primary-600"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { decryptData, encryptData } from '@/utils/cipher'
import { networkService } from '@/services/NetworkService'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const profile = useProfileStore()
const toast = useToast()
const router = useRouter()

// State
const searchInput = ref(null)
const searchQuery = ref('')
const debouncedQuery = ref('') // For network search and heavy filtering
const allInventory = ref([])
const networkResults = reactive({ city: [], district: [] })
const isLoading = ref(false)
const isSubmitting = ref(false)
const activeFilter = ref('all')
const addedItems = ref(new Set()) // Track added items for visual feedback
let debounceTimer = null

const filters = [
  { label: 'All', value: 'all' },
  { label: 'In Stock', value: 'instock' },
]

const transferDialog = reactive({
  visible: false,
  item: null,
  quantity: 1,
  fromPharmacyId: null,
  toPharmacyId: null,
  isStat: false,
})

// Computed
const filteredLocalResults = computed(() => {
  if (!debouncedQuery.value) return []

  const lowerCaseQuery = debouncedQuery.value.toLowerCase()
  let results = allInventory.value.filter((item) => {
    const name = decryptData(item.name)?.toLowerCase() || ''
    const brand = decryptData(item.brandName)?.toLowerCase() || ''
    return name.includes(lowerCaseQuery) || brand.includes(lowerCaseQuery)
  })

  if (activeFilter.value === 'instock') {
    results = results.filter((item) => item.quantity > 0)
  }
  return results
})

const hasNetworkResults = computed(() => {
  return networkResults.city.length > 0 || networkResults.district.length > 0
})

// Keyboard Shortcuts
const handleKeydown = (e) => {
  if (e.key === '/' && document.activeElement !== searchInput.value) {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

let inventorySub = null

const subscribeToInventory = () => {
  if (inventorySub) inventorySub.unsubscribe()

  const pharmacyId = profile.pharmacyId
  if (!pharmacyId) return

  inventorySub = database
    .get('inventory')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      allInventory.value = records.map((item) => ({
        ...item._raw,
        id: item.id,
        name: item.name,
        brandName: item.brandName,
        quantity: item.quantity,
        shelfLocation: item.shelfLocation,
        pharmacyId: item.pharmacy_id,
        sellingPrice: item.sellingPrice,
        vatPercent: item.vatPercent,
        isControlled: item.isControlled,
      }))
    })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  subscribeToInventory()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (inventorySub) inventorySub.unsubscribe()
})

watch(() => profile.pharmacyId, subscribeToInventory)

// Search Logic
const debouncedSearch = () => {
  clearTimeout(debounceTimer)
  isLoading.value = true

  debounceTimer = setTimeout(async () => {
    debouncedQuery.value = searchQuery.value
    networkResults.city = []
    networkResults.district = []

    if (searchQuery.value.length < 1) {
      isLoading.value = false
      return
    }

    // Local search is handled by computed filteredLocalResults
    // We only need to trigger network search
    await searchNetworkInventory().catch((err) => console.error('Network search failed:', err))

    // Unmet Demand Tracking
    if (
      filteredLocalResults.value.length === 0 &&
      networkResults.city.length === 0 &&
      networkResults.district.length === 0
    ) {
      const pharmacyId = profile.pharmacyId
      if (pharmacyId) {
        try {
          await database.write(async () => {
            await database.get('unmet_demand').create((demand) => {
              demand.name = encryptData(searchQuery.value)
              demand.pharmacyId = pharmacyId
              demand.count = 1
            })
          })
        } catch (error) {
          console.error('Error logging unmet demand', error)
        }
      }
    }

    isLoading.value = false
  }, 500)
}

const searchNetworkInventory = async () => {
  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId) return

  const myLat = profile.profile?.pharmacies?.latitude || profile.latitude
  const myLong = profile.profile?.pharmacies?.longitude || profile.longitude

  const data = await networkService.searchNetwork(searchQuery.value, pharmacyId, myLat, myLong)

  if (data) {
    // Assuming the RPC returns a structure like { city_results: [], district_results: [] }
    // If the RPC returns a flat list, we might need to filter by city/district here.
    // For now, let's assume the RPC structure matches what we expect.
    networkResults.city = (data.city_results || []).map((item) => ({
      ...item,
      decryptedName: decryptData(item.name),
      decryptedBrand: decryptData(item.brand_name),
    }))
    networkResults.district = (data.district_results || []).map((item) => ({
      ...item,
      decryptedName: decryptData(item.name),
      decryptedBrand: decryptData(item.brand_name),
    }))
  }
}

import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

// Actions
const addToCart = (item) => {
  const success = cartStore.addToCart({
    id: item.id,
    name: decryptData(item.name),
    sellingPrice: item.sellingPrice || 0,
    stock: item.quantity,
    vatPercent: item.vatPercent || 0,
    isControlled: item.isControlled || false,
  })

  if (success) {
    // Visual Feedback
    addedItems.value.add(item.id)
    setTimeout(() => {
      addedItems.value.delete(item.id)
    }, 1500)

    toast.add({
      severity: 'success',
      summary: 'Added to Cart',
      detail: `${decryptData(item.name)} added to current order.`,
      life: 2000,
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Max Stock',
      detail: 'Cannot add more of this item.',
      life: 2000,
    })
  }
}

const openTransferDialog = (item) => {
  transferDialog.item = item
  transferDialog.quantity = 1
  transferDialog.fromPharmacyId = item.pharmacy_id
  transferDialog.toPharmacyId = parseInt(profile.pharmacyId, 10)
  transferDialog.visible = true
}

const submitTransferRequest = async () => {
  if (!transferDialog.item) return
  isSubmitting.value = true

  try {
    await networkService.requestTransfer(
      transferDialog.item.inventory_id || transferDialog.item.id,
      transferDialog.fromPharmacyId,
      transferDialog.toPharmacyId,
      transferDialog.quantity,
      transferDialog.isStat ? 'stat' : 'standard',
    )

    toast.add({
      severity: 'success',
      summary: transferDialog.isStat ? 'Stat Request Sent' : 'Request Sent',
      detail: transferDialog.isStat
        ? 'Urgent transfer request sent! Runner dispatch initiated.'
        : 'Transfer request sent successfully!',
      life: 3000,
    })
    transferDialog.visible = false
  } catch (error) {
    console.error(error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to send request.',
      life: 3000,
    })
  } finally {
    isSubmitting.value = false
  }
}

const addToMyStock = (item) => {
  // Navigate to Add Inventory with pre-filled data
  // Note: item.decryptedName might contain measurement (e.g. "Paracetamol 500mg")
  // We might want to parse it or just pass it as name.
  // For now, passing as name.

  // We need to be careful with what we pass.
  // item.decryptedName, item.decryptedBrand

  router.push({
    path: '/add-inventory',
    query: {
      name: item.decryptedName,
      brand: item.decryptedBrand,
      // form: item.form, // If available in network result
      // category: item.category // If available
    },
  })
}
</script>

<style scoped>
.search-command-center {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.search-command-center:focus-within {
  box-shadow: none;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important; /* Keep same as default */
  outline: none !important;
}
</style>
