<template>
  <div class="process-return-container p-4 max-w-7xl mx-auto min-h-screen">
    <Toast />

    <!-- Header -->
    <div class="flex align-items-center gap-3 mb-6">
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Process Return</h1>
        <p class="text-gray-400 text-sm">Find a sale to process a return or credit note.</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid h-full relative">
      <!-- Left Panel: Search & Recent Sales -->
      <div
        class="col-12 lg:col-4 flex flex-column gap-4 h-full transition-all duration-300"
        :class="{ 'hidden lg:flex': originalSale }"
      >
        <!-- Search Box -->
        <div class="glass-panel p-4">
          <h3 class="text-lg font-bold text-white mb-3">Find Sale</h3>
          <div class="relative w-full">
            <i
              class="pi pi-search absolute text-gray-500 text-xl"
              style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
            ></i>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full bg-transparent border-1 border-white-alpha-20 border-round text-white p-3 pl-7 outline-none text-lg transition-colors focus:border-primary"
              placeholder="Bill #, Customer, or Date..."
              @input="debouncedSearch"
            />
            <div
              v-if="isSearching"
              class="absolute"
              style="top: 50%; right: 1rem; transform: translateY(-50%)"
            >
              <i class="pi pi-spin pi-spinner text-primary"></i>
            </div>
          </div>
          <div class="mt-2 text-xs text-gray-500">Try "INV-2023", "Ram", or "2023-10-25"</div>
        </div>

        <!-- Recent Sales List -->
        <div class="glass-panel p-0 overflow-hidden flex-grow-1 flex flex-column">
          <div class="p-3 border-bottom-1 border-white-alpha-10 bg-white-alpha-5">
            <h3 class="text-lg font-bold text-white m-0">Recent Sales</h3>
          </div>
          <div class="overflow-y-auto custom-scrollbar flex-grow-1" style="max-height: 600px">
            <div v-if="recentSales.length === 0" class="p-4 text-center text-gray-400">
              No recent sales found.
            </div>
            <div
              v-for="sale in recentSales"
              :key="sale.id"
              class="p-3 border-bottom-1 border-white-alpha-5 hover:bg-white-alpha-10 cursor-pointer transition-colors border-l-4 border-transparent"
              :class="{
                'bg-white-alpha-10 border-primary': originalSale && originalSale._id === sale.id,
              }"
              @click="selectSale(sale)"
            >
              <div class="flex justify-content-between align-items-center mb-1">
                <span class="font-bold text-white">{{ sale.billNumber }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(sale.createdAt) }}</span>
              </div>
              <div class="flex justify-content-between align-items-center">
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-user text-xs text-primary"></i>
                  <span class="text-sm text-gray-300">{{
                    sale.customerName || 'Walk-in Customer'
                  }}</span>
                </div>
                <span class="font-bold text-primary">Rs. {{ sale.total.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Return Processing (or Placeholder) -->
      <div
        class="col-12 lg:col-8 h-full transition-all duration-300"
        :class="{ 'hidden lg:block': !originalSale }"
      >
        <div
          v-if="!originalSale"
          class="h-full flex flex-column align-items-center justify-content-center glass-panel p-6 text-gray-500"
        >
          <div class="bg-white-alpha-5 p-4 border-round-circle mb-4">
            <i class="pi pi-receipt text-5xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-white mb-2">Select a Sale</h2>
          <p>Choose a sale from the list or search to start a return.</p>
        </div>

        <div v-else class="glass-panel p-0 overflow-hidden animate-fade-in h-full flex flex-column">
          <!-- Sale Details Header -->
          <div
            class="p-4 border-bottom-1 border-white-alpha-10 flex justify-content-between align-items-center bg-white-alpha-5"
          >
            <div class="flex align-items-center gap-3">
              <!-- Mobile Back Button -->
              <Button
                icon="pi pi-arrow-left"
                text
                rounded
                class="lg:hidden text-white"
                @click="reset"
              />
              <div>
                <div class="flex align-items-center gap-3 mb-1">
                  <h3 class="text-2xl font-bold text-white m-0">{{ originalSale.bill_number }}</h3>
                  <Tag :value="originalSale.status" :severity="getSeverity(originalSale.status)" />
                </div>
                <p class="text-gray-400 text-sm m-0">
                  <i class="pi pi-calendar mr-1"></i>
                  {{ new Date(originalSale.created_at).toLocaleString() }}
                  <span class="mx-2">•</span>
                  <i class="pi pi-user mr-1"></i>
                  {{ originalSale.customerName || 'Walk-in Customer' }}
                </p>
              </div>
            </div>
          </div>

          <!-- RETURN PROCESSING MODE -->
          <div class="p-4 animate-fade-in h-full flex flex-column">
            <div class="flex align-items-center gap-2 mb-3">
              <h4 class="text-white font-medium m-0">Select items to return</h4>
            </div>

            <DataTable
              :value="originalSale.items"
              responsiveLayout="scroll"
              class="glass-datatable mb-4 flex-grow-1"
              :rowHover="true"
              scrollable
              scrollHeight="flex"
            >
              <template #empty>
                <div class="p-4 text-center text-gray-400">No items found in this sale.</div>
              </template>
              <Column field="name" header="Item">
                <template #body="{ data }">
                  <div class="flex flex-column">
                    <span class="font-bold text-white">{{ decryptData(data.name) }}</span>
                    <span class="text-xs text-gray-400"
                      >Sold at Rs. {{ data.price.toFixed(2) }}</span
                    >
                  </div>
                </template>
              </Column>
              <Column header="Returnable Qty" style="width: 150px">
                <template #body="{ data }">
                  <span class="text-white font-mono">{{ data.returnableQuantity }}</span>
                </template>
              </Column>
              <Column header="Return Qty" style="width: 200px">
                <template #body="{ data }">
                  <InputNumber
                    v-model="data.returnQuantity"
                    :min="0"
                    :max="data.returnableQuantity"
                    showButtons
                    buttonLayout="horizontal"
                    class="w-full glass-input-sm"
                    inputClass="text-center w-3rem"
                    :disabled="data.returnableQuantity <= 0"
                  >
                    <template #incrementbuttonicon>
                      <span class="pi pi-plus" />
                    </template>
                    <template #decrementbuttonicon>
                      <span class="pi pi-minus" />
                    </template>
                  </InputNumber>
                </template>
              </Column>
              <Column header="Refund Amount" style="width: 150px" alignFrozen="right" frozen>
                <template #body="{ data }">
                  <span class="font-bold text-primary"
                    >Rs. {{ ((data.returnQuantity || 0) * data.price).toFixed(2) }}</span
                  >
                </template>
              </Column>
            </DataTable>

            <div
              v-if="!canReturnAnything"
              class="p-3 border-round bg-white-alpha-5 text-center text-gray-300 mb-4"
            >
              <i class="pi pi-info-circle mr-2"></i> All items from this bill have already been
              returned.
            </div>

            <!-- Summary & Actions -->
            <div
              class="flex flex-column align-items-end border-top-1 border-white-alpha-10 pt-4 mt-auto"
            >
              <div class="text-right mb-4">
                <span class="text-gray-400 text-lg mr-3">Total Refund Value:</span>
                <span class="text-3xl font-bold text-red-400"
                  >Rs. {{ totalReturnValue.toFixed(2) }}</span
                >
              </div>
              <Button
                label="Process Return"
                icon="pi pi-check-circle"
                severity="danger"
                size="large"
                @click="processReturn"
                :loading="isProcessing"
                :disabled="isProcessing || totalReturnValue <= 0"
                class="w-full md:w-auto font-bold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification.js'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

// PrimeVue Components
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import Toast from 'primevue/toast'
import Tag from 'primevue/tag'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const searchQuery = ref('')
const isSearching = ref(false)
const isProcessing = ref(false)
const originalSale = ref(null)
const recentSales = ref([])
const allSales = ref([]) // Cache for local filtering

// Fetch Recent Sales
const fetchRecentSales = async () => {
  const pharmacyId = profileStore.pharmacyId
  if (!pharmacyId) return

  try {
    // Fetch last 100 sales to allow better local searching/filtering
    const sales = await database
      .get('sales')
      .query(Q.where('pharmacy_id', pharmacyId), Q.sortBy('created_at', Q.desc), Q.take(100))
      .fetch()

    // Enhance with customer names
    const enhancedSales = await Promise.all(
      sales.map(async (sale) => {
        let customerName = 'Walk-in Customer'
        if (sale.customerId) {
          try {
            const customer = await database.get('customers').find(sale.customerId)
            if (customer) {
              customerName = decryptData(customer.name)
            }
          } catch (e) {
            // Customer might be deleted or not synced
          }
        }
        return {
          ...sale._raw,
          id: sale.id,
          customerName,
          createdAt: sale.createdAt,
          total: sale.total,
          billNumber: sale.billNumber,
        }
      }),
    )

    allSales.value = enhancedSales
    recentSales.value = enhancedSales.slice(0, 10)
  } catch (error) {
    console.error('Error fetching recent sales:', error)
  }
}

onMounted(fetchRecentSales)

// Search Logic
let searchTimeout = null
const debouncedSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300)
}

const performSearch = () => {
  if (!searchQuery.value) {
    recentSales.value = allSales.value.slice(0, 10)
    return
  }

  const query = searchQuery.value.toLowerCase()

  // Local Search / Filter
  const localMatches = allSales.value.filter(
    (sale) =>
      sale.billNumber.toLowerCase().includes(query) ||
      (sale.customerName && sale.customerName.toLowerCase().includes(query)) ||
      new Date(sale.createdAt).toLocaleDateString().includes(query),
  )

  recentSales.value = localMatches
}

const selectSale = async (saleWrapper) => {
  isSearching.value = true
  originalSale.value = null

  try {
    // Re-fetch full sale object to ensure we have latest state
    const sale = await database.get('sales').find(saleWrapper.id)

    // Check previous returns (from Supabase for now)
    const { data: previousReturns } = await supabase
      .from('returns')
      .select('items')
      .eq('original_sale_id', sale.id)

    const previouslyReturnedQuantities = {}
    ;(previousReturns || []).forEach((ret) => {
      ;(ret.items || []).forEach((item) => {
        const decryptedName = decryptData(item.name)
        previouslyReturnedQuantities[decryptedName] =
          (previouslyReturnedQuantities[decryptedName] || 0) + item.quantity
      })
    })

    // Process items
    const saleItems = sale.items // JSON parsed
    const processedItems = saleItems.map((item) => ({ ...item }))

    processedItems.forEach((item) => {
      const decryptedName = decryptData(item.name)
      const returnedSoFar = previouslyReturnedQuantities[decryptedName] || 0
      item.returnableQuantity = item.quantity - returnedSoFar
      item.returnQuantity = 0
    })

    originalSale.value = {
      ...sale._raw,
      items: processedItems,
      bill_number: sale.billNumber,
      created_at: sale.createdAt,
      _id: sale.id,
      status: sale.status,
      customerName: saleWrapper.customerName,
      subtotal: sale.subtotal,
      discount: sale.discount,
      taxTotal: sale.taxTotal,
      total: sale.total,
    }
  } catch (error) {
    console.error('Error selecting sale:', error)
    notification.showNotification('Failed to load sale details', 'error')
  } finally {
    isSearching.value = false
  }
}

const reset = () => {
  originalSale.value = null
  searchQuery.value = ''
  recentSales.value = allSales.value.slice(0, 10)
}

const totalReturnValue = computed(() => {
  if (!originalSale.value) return 0
  return originalSale.value.items.reduce((total, item) => {
    if (!item) return total
    const returnQty =
      (item.returnQuantity || 0) > item.returnableQuantity
        ? item.returnableQuantity
        : item.returnQuantity || 0
    return total + returnQty * item.price
  }, 0)
})

const canReturnAnything = computed(() => {
  if (!originalSale.value) return false
  return originalSale.value.items.some((item) => item && item.returnableQuantity > 0)
})

const processReturn = async () => {
  isProcessing.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userId = user?.id
  if (!userId && profileStore.userId) {
    userId = profileStore.userId
  }

  if (!userId) {
    notification.showNotification('User not authenticated', 'error')
    isProcessing.value = false
    return
  }

  const itemsToReturn = originalSale.value.items
    .filter(
      (item) => item && item.returnQuantity > 0 && item.returnQuantity <= item.returnableQuantity,
    )
    .map((i) => ({
      id: i.id, // Inventory ID
      name: i.name,
      brand_name: i.brandName,
      quantity: i.returnQuantity,
      price: i.price,
    }))

  if (itemsToReturn.length === 0) {
    notification.showNotification('No valid items selected for return.', 'error')
    isProcessing.value = false
    return
  }

  try {
    const { data: returnId, error } = await supabase.rpc('process_return_v2', {
      p_original_sale_id: originalSale.value._id,
      p_bill_number: originalSale.value.bill_number,
      p_user_id: userId,
      p_pharmacy_id: parseInt(profileStore.pharmacyId, 10),
      p_items_to_return: itemsToReturn,
      p_total_return_value: totalReturnValue.value,
    })

    if (error) {
      throw error
    }

    notification.showNotification('Return processed successfully!')
    router.push({ name: 'credit-note', params: { id: returnId } })
  } catch (e) {
    console.error(e)
    notification.showNotification('Error processing return. Check console for details.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}

const getSeverity = (status) => {
  switch (status) {
    case 'paid':
      return 'success'
    case 'unpaid':
      return 'warning'
    case 'void':
      return 'danger'
    default:
      return 'info'
  }
}
</script>

<style scoped>
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  outline: none !important;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
