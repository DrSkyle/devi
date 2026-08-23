<template>
  <div class="record-sale-container p-4 max-w-7xl mx-auto min-h-screen pb-8">
    <Toast />

    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">New Sale</h1>
        <p class="text-gray-400 text-sm">Process a new transaction.</p>
      </div>
      <div class="flex align-items-center gap-3">
        <Button
          :label="isLive ? 'Live Cart Active' : 'Go Live'"
          :icon="isLive ? 'pi pi-wifi' : 'pi pi-globe'"
          :severity="isLive ? 'success' : 'secondary'"
          text
          rounded
          @click="toggleLiveMode"
          v-tooltip.bottom="'Enable Multiplayer Cart'"
          :class="{ 'live-pulse': isLive }"
        />
        <div v-if="profile.pharmacyId" class="text-right">
          <span class="text-sm text-gray-500">Pharmacy ID: {{ profile.pharmacyId }}</span>
        </div>
      </div>
    </div>

    <!-- Tab Bar (Juggling Order) -->
    <div class="flex gap-2 overflow-x-auto pb-2 mb-3 custom-scrollbar align-items-center">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="glass-button px-3 py-2 border-round cursor-pointer transition-colors flex align-items-center gap-2 flex-shrink-0"
        :class="{ 'bg-primary-500 text-white border-primary-500': activeTabId === tab.id }"
        @click="switchTab(tab.id)"
        style="min-width: 100px"
      >
        <span class="font-bold text-sm">{{ tab.name }}</span>
        <span
          v-if="tab.cart.length > 0"
          class="text-xs bg-white-alpha-20 px-1 border-round"
          :class="activeTabId === tab.id ? 'text-white' : 'text-gray-400'"
        >
          {{ tab.cart.length }}
        </span>
        <i
          v-if="tabs.length > 1"
          class="pi pi-times text-xs hover:text-red-400 z-5"
          @click.stop="closeTab(tab.id)"
        ></i>
      </div>
      <Button
        icon="pi pi-plus"
        class="p-button-rounded p-button-text p-button-sm flex-shrink-0"
        @click="createNewTab"
        v-tooltip="'New Order'"
      />
    </div>

    <div class="grid">
      <!-- LEFT PANEL: Search & Cart -->
      <div class="col-12 lg:col-8 flex flex-column gap-3">
        <!-- Product Search (Styled like InventoryView) -->
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
            placeholder="Search medicines..."
            @focus="showResults = true"
          />

          <!-- Custom Search Results Dropdown -->
          <div
            v-if="searchQuery && filteredProducts.length > 0 && showResults"
            class="absolute w-full bg-black-alpha-90 border-1 border-white-alpha-10 border-round-bottom shadow-8 z-5 overflow-y-auto custom-scrollbar"
            style="top: 100%; left: 0; max-height: 400px; backdrop-filter: blur(12px)"
          >
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="flex justify-content-between align-items-center p-3 hover:bg-white-alpha-10 cursor-pointer transition-colors border-bottom-1 border-white-alpha-5"
              @click="selectProduct(product)"
            >
              <div>
                <div class="font-bold text-lg text-white">{{ product.name }}</div>
                <div class="text-sm text-gray-400">
                  {{ product.brandName }} • {{ product.shelfLocation }}
                </div>
              </div>
              <div class="text-right ml-3">
                <div class="font-bold text-primary text-lg">Rs. {{ product.sellingPrice }}</div>
                <div
                  class="text-xs font-bold"
                  :class="product.stock < 10 ? 'text-red-400' : 'text-green-400'"
                >
                  Qty: {{ product.stock }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Most Sold Items (New Feature) -->
        <div v-if="mostSoldItems.length > 0" class="glass-panel p-3">
          <div class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">
            Most Sold Items
          </div>
          <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            <div
              v-for="item in mostSoldItems"
              :key="item.id"
              class="glass-button p-2 border-round cursor-pointer hover:bg-white-alpha-10 transition-colors flex-shrink-0"
              style="min-width: 120px"
              @click="selectProduct(item)"
            >
              <div class="font-bold text-sm text-white truncate">{{ item.name }}</div>
              <div class="flex justify-content-between mt-1">
                <span class="text-xs text-gray-400">{{ item.stock }} left</span>
                <span class="text-xs text-primary font-bold">Rs. {{ item.sellingPrice }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cart Items -->
        <div class="glass-panel flex-grow-1 p-0 overflow-hidden flex flex-column cart-panel">
          <div
            class="p-3 border-bottom-1 border-white-alpha-10 flex justify-content-between align-items-center"
          >
            <span class="font-bold text-gray-300">Cart Items ({{ cart.length }})</span>
            <Button
              label="Clear Cart"
              icon="pi pi-trash"
              class="p-button-text p-button-danger p-button-sm"
              @click="clearCart"
              v-if="cart.length > 0"
            />
          </div>

          <div class="flex-grow-1 overflow-y-auto p-3 custom-scrollbar">
            <div
              v-if="cart.length === 0"
              class="h-full flex flex-column align-items-center justify-content-center text-gray-500"
            >
              <i class="pi pi-shopping-cart text-4xl mb-3"></i>
              <p>Cart is empty. Scan or search items.</p>
            </div>

            <div v-else class="flex flex-column gap-2">
              <div
                v-for="(item, index) in cart"
                :key="index"
                class="glass-panel p-3 flex align-items-center gap-3 hover:bg-white-alpha-5 transition-colors cart-item"
              >
                <div class="flex-grow-1">
                  <div class="font-bold text-white">{{ item.name }}</div>
                  <div class="text-xs text-gray-400">Rs. {{ item.price }} x {{ item.qty }}</div>
                </div>

                <div class="flex align-items-center gap-2">
                  <Button
                    icon="pi pi-minus"
                    class="p-button-rounded p-button-text p-button-sm text-gray-400"
                    @click="updateQty(index, -1)"
                  />
                  <span class="font-bold text-lg w-2rem text-center text-white">{{
                    item.qty
                  }}</span>
                  <Button
                    icon="pi pi-plus"
                    class="p-button-rounded p-button-text p-button-sm text-gray-400"
                    @click="updateQty(index, 1)"
                  />
                </div>

                <div class="text-right min-w-max">
                  <div class="font-bold text-primary">
                    Rs. {{ multiplyMoney(item.price, item.qty).toFixed(2) }}
                  </div>
                  <Button
                    icon="pi pi-times"
                    class="p-button-rounded p-button-text p-button-danger p-button-sm -mr-2"
                    @click="removeFromCart(index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Summary & Checkout -->
      <div class="col-12 lg:col-4 flex flex-column gap-4">
        <!-- Customer Selection -->
        <div class="glass-panel p-4">
          <div class="flex justify-content-between align-items-center mb-3">
            <h3 class="text-lg font-bold text-white m-0">Customer</h3>
            <RouterLink to="/customers" class="text-xs text-primary no-underline hover:underline"
              >Manage</RouterLink
            >
          </div>
          <Select
            v-model="selectedCustomer"
            :options="customers"
            optionLabel="name"
            placeholder="Select Customer (Optional)"
            class="w-full glass-dropdown"
            filter
            showClear
          />
          <div v-if="selectedCustomer" class="mt-3 p-3 bg-white-alpha-5 border-round text-sm">
            <div class="flex justify-content-between mb-1">
              <span class="text-gray-400">Balance:</span>
              <span :class="selectedCustomer.balance > 0 ? 'text-orange-500' : 'text-green-500'">
                Rs. {{ (selectedCustomer.balance || 0).toFixed(2) }}
              </span>
            </div>
            <div class="flex justify-content-between">
              <span class="text-gray-400">Phone:</span>
              <span class="text-white">{{ selectedCustomer.phone }}</span>
            </div>
          </div>
        </div>

        <!-- Bill Summary -->
        <div class="glass-panel p-4 flex-grow-1 flex flex-column">
          <h3 class="text-lg font-bold text-white m-0 mb-4">Summary</h3>

          <div class="flex justify-content-between mb-2 text-gray-300">
            <span>Subtotal</span>
            <span>Rs. {{ subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-content-between align-items-center mb-2 text-gray-300">
            <span>Discount</span>
            <div class="w-6rem">
              <InputNumber
                v-model="discount"
                mode="currency"
                currency="NPR"
                locale="en-NP"
                class="w-full glass-input-sm text-right"
                inputClass="text-right p-1 w-full"
                :min="0"
                placeholder="0"
              />
            </div>
          </div>
          <div class="flex justify-content-between mb-4 text-gray-300">
            <span>Tax (VAT)</span>
            <span>Rs. {{ taxTotal.toFixed(2) }}</span>
          </div>

          <div class="border-top-1 border-white-alpha-10 my-3"></div>

          <!-- DDA Requirements -->
          <div
            v-if="hasControlledItems"
            class="glass-panel p-3 mb-3 bg-red-500-alpha-10 border-red-500"
          >
            <div class="flex align-items-center gap-2 text-red-400 mb-2">
              <i class="pi pi-exclamation-triangle"></i>
              <span class="font-bold text-sm">Controlled Substance Detected</span>
            </div>
            <div class="field mb-2">
              <label class="text-gray-300 text-xs block mb-1">Patient Name *</label>
              <InputText
                v-model="patientName"
                class="w-full glass-input-sm text-left"
                placeholder="Required"
              />
            </div>
            <div class="field m-0">
              <label class="text-gray-300 text-xs block mb-1">Doctor Name *</label>
              <InputText
                v-model="doctorName"
                class="w-full glass-input-sm text-left"
                placeholder="Required"
              />
            </div>
          </div>

          <div class="flex justify-content-between align-items-center mb-6">
            <span class="text-xl font-bold text-white">Total</span>
            <span class="text-3xl font-bold text-primary">Rs. {{ grandTotal.toFixed(2) }}</span>
          </div>

          <div
            v-if="!isLocationValid"
            class="mb-2 p-2 bg-red-500-alpha-20 border-round text-red-400 text-xs text-center"
          >
            <i class="pi pi-map-marker mr-1"></i> {{ locationStatus }}
          </div>

          <Button
            :label="isLocationValid ? 'Process Sale' : 'Location Locked'"
            :icon="isLocationValid ? 'pi pi-check' : 'pi pi-lock'"
            class="w-full p-button-lg bg-primary border-none hover:bg-primary-600 shadow-4 font-bold mt-auto"
            :disabled="cart.length === 0 || !isLocationValid"
            @click="validateAndShowPayment"
          />
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <Dialog
      v-model:visible="showPaymentModal"
      header="Confirm Payment"
      modal
      class="glass-dialog"
      :style="{ width: '450px' }"
      :draggable="false"
    >
      <!-- ... content ... -->
    </Dialog>

    <!-- Scholar's Alternative Dialog -->
    <Dialog
      v-model:visible="showAlternativeDialog"
      header="Scholar's Suggestion 💡"
      modal
      class="glass-dialog"
      :style="{ width: '500px' }"
    >
      <div v-if="alternativeProduct && pendingProduct" class="flex flex-column gap-4">
        <div class="bg-primary-500-alpha-20 p-3 border-round border-left-3 border-primary">
          <p class="m-0 text-white line-height-3">
            A cheaper alternative is available for
            <span class="font-bold text-primary">{{ pendingProduct.brandName }}</span
            >.
          </p>
        </div>

        <div class="grid text-center">
          <div class="col-6 border-right-1 border-white-alpha-10">
            <div class="text-xs text-gray-400 uppercase font-bold mb-2">Original</div>
            <div class="text-xl font-bold text-white mb-1">{{ pendingProduct.brandName }}</div>
            <div class="text-2xl text-red-400">Rs. {{ pendingProduct.sellingPrice }}</div>
          </div>
          <div class="col-6 bg-green-500-alpha-10 border-round">
            <div class="text-xs text-green-400 uppercase font-bold mb-2">Suggestion</div>
            <div class="text-xl font-bold text-white mb-1">{{ alternativeProduct.brandName }}</div>
            <div class="text-2xl text-green-400">Rs. {{ alternativeProduct.sellingPrice }}</div>
          </div>
        </div>

        <div class="text-center">
          <div
            class="inline-block px-3 py-1 bg-white-alpha-10 border-round-pill text-xs text-secondary"
          >
            Potential Savings:
            <span class="font-bold text-white"
              >Rs.
              {{ (pendingProduct.sellingPrice - alternativeProduct.sellingPrice).toFixed(2) }}</span
            >
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          label="Keep Original"
          class="p-button-text p-button-secondary"
          @click="confirmOriginal"
        />
        <Button
          label="Switch & Save"
          icon="pi pi-check"
          class="p-button-success"
          @click="confirmAlternative"
          autofocus
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'
import { encryptData, decryptData } from '@/utils/cipher'
import { multiplyMoney } from '@/utils/currency'
import { useMachine } from '@xstate/vue'
import { posMachine } from '@/machines/posMachine'
import { printerService } from '@/services/PrinterService'
import { useAppSounds } from '@/services/SoundService'
import { collaborativeCart } from '@/services/CollaborativeCartService'
import { formatDateTime } from '@/utils/dateUtils'
import { calculateDistance, getCurrentPosition } from '@/utils/geoUtils'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import AutoComplete from 'primevue/autocomplete'

import { useStaffStore } from '@/stores/staff'
import { IMaskDirective } from 'vue-imask'

const vImask = IMaskDirective

const router = useRouter()
const notification = useNotificationStore()
const profile = useProfileStore()
const staffStore = useStaffStore()
const { playBeep, playSuccess, playError, playClick } = useAppSounds()

const isLocationValid = ref(true)
const locationStatus = ref('Checking location...')

// Geofence Check (200 meters)
const checkLocation = async () => {
  // If admin, skip check (Admin is trusted/owner)
  if (staffStore.activeUserRole === 'admin') {
    isLocationValid.value = true
    locationStatus.value = ''
    return
  }

  if (!profile.latitude || !profile.longitude) {
    // If pharmacy has no set location, we can't enforce it. Warn but allow?
    // Or strictly disallow? Let's warn.
    locationStatus.value = 'Pharmacy location not set.'
    isLocationValid.value = true // Allow for now until Admin sets it
    return
  }

  try {
    const coords = await getCurrentPosition()
    const dist = calculateDistance(
      coords.latitude,
      coords.longitude,
      profile.latitude,
      profile.longitude,
    )

    if (dist > 0.2) {
      // 200 meters
      isLocationValid.value = false
      locationStatus.value = `You are too far from pharmacy (${(dist * 1000).toFixed(0)}m). Sales disabled.`
    } else {
      isLocationValid.value = true
      locationStatus.value = ''
    }
  } catch (e) {
    console.warn('Location check failed', e)
    // If GPS fails, security policy: Block or Allow?
    // Blocking is safer for "No Trust" model.
    isLocationValid.value = false
    locationStatus.value = 'GPS signal missing. Enable location to sell.'
  }
}

onMounted(() => {
  checkLocation()
  // Re-check every minute
  setInterval(checkLocation, 60000)
  subscribeToData()
})

// State
import { useCartStore } from '@/features/cart/store'

const cartStore = useCartStore()
const tabs = cartStore.tabs
const activeTabId = cartStore.activeTabId
const activeTab = cartStore.getActiveTab()
const cart = cartStore.getCart()
const selectedCustomer = cartStore.selectedCustomer
const discount = cartStore.discount
const patientName = cartStore.patientName
const doctorName = cartStore.doctorName
const subtotal = cartStore.getSubtotal()
const taxTotal = cartStore.getTaxTotal()
const grandTotal = cartStore.getGrandTotal()
const hasControlledItems = cartStore.hasControlledItems

const { createNewTab, closeTab, switchTab, addToCart, updateQty, removeFromCart, clearCart } =
  cartStore

// Machine Setup
const { snapshot, send } = useMachine(posMachine, {
  services: {
    saveSaleToDatabase: async ({ context }) => {
      // Logic moved from processSale
      const saleData = {
        pharmacyId: profile.pharmacyId,
        customerId: selectedCustomer.value ? selectedCustomer.value.id : null,
        staffName: staffStore.activeUserName || profile.name || 'Unknown',
        total: grandTotal.value,
        subtotal: subtotal.value,
        taxTotal: taxTotal.value,
        discount: discount.value,
        paymentMethod: context.paymentMethod,
        status: context.paymentMethod === 'Credit' ? 'unpaid' : 'paid',
        items: JSON.stringify(
          cart.value.map((item) => ({
            inventory_id: item.id,
            name: encryptData(item.name),
            quantity: item.qty,
            price: item.price,
            total: multiplyMoney(item.price, item.qty),
          })),
        ),
        billNumber: `BILL-${Date.now()}`, // Simple generator for now
        userId: profile.userId,
        createdAt: new Date().getTime(),
      }

      const newSale = await saleRepository.createSale(
        saleData,
        cart.value,
        selectedCustomer.value ? selectedCustomer.value.id : null,
      )

      playSuccess()
      return { ...saleData, id: newSale?.id }
    },
    printReceipt: async ({ context }, params) => {
      try {
        // Use the data returned from saveSaleToDatabase (params.data)
        const sale = params.data
        // Decrypt items for printing
        const items = cart.value.map((item) => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          total: multiplyMoney(item.price, item.qty),
        }))

        await printerService.printReceipt(profile.pharmacyName || 'Pharmacy', {
          items,
          total: sale.total,
          billNumber: sale.billNumber,
          date: formatDateTime(sale.createdAt),
        })
      } catch (e) {
        console.warn('Printing failed', e)
        notification.showNotification('Printing failed, but sale saved.', 'warning')
      }
    },
  },
})

// State
const products = ref([])
const filteredProducts = ref([])
const searchQuery = ref('')
const showResults = ref(false)
const customers = ref([])
const mostSoldItems = ref([])

const amountReceived = ref(0)
const isLive = ref(false)

const toggleLiveMode = () => {
  isLive.value = !isLive.value
  if (isLive.value) {
    collaborativeCart.connect()
    notification.showNotification('Multiplayer Cart Enabled', 'success')
  } else {
    collaborativeCart.disconnect()
    notification.showNotification('Multiplayer Cart Disabled', 'info')
  }
}

// Watch cart changes to push to Yjs when live
watch(
  cart,
  (newCart) => {
    if (isLive.value) {
      collaborativeCart.updateRemoteCart(newCart)
    }
  },
  { deep: true },
)

// Methods
const validateAndShowPayment = () => {
  if (hasControlledItems.value) {
    if (!patientName.value || !doctorName.value) {
      notification.showNotification(
        'Patient and Doctor names are required for controlled substances.',
        'error',
      )
      return
    }
  }
  amountReceived.value = grandTotal.value
  send({ type: 'CHECKOUT' })
}

const confirmPayment = () => {
  if (
    snapshot.value.context.paymentMethod !== 'Credit' &&
    amountReceived.value < grandTotal.value
  ) {
    notification.showNotification('Insufficient payment amount', 'error')
    return
  }
  send({ type: 'CONFIRM_PAYMENT' })
}

// ... (Subscriptions remain same) ...
let inventorySub: any = null
let customersSub: any = null
let salesSub: any = null

import { inventoryRepository } from '@/repositories/InventoryRepository'
import { customerRepository } from '@/repositories/CustomerRepository'
import { saleRepository } from '@/repositories/SaleRepository'

// ...

const subscribeToData = () => {
  if (inventorySub) inventorySub.unsubscribe()
  if (customersSub) customersSub.unsubscribe()
  if (salesSub) salesSub.unsubscribe()

  const pharmacyId = profile.pharmacyId
  if (!pharmacyId) return

  // Inventory
  inventorySub = inventoryRepository
    .query(Q.where('pharmacy_id', pharmacyId), Q.where('quantity', Q.gt(0)))
    .observe()
    .subscribe((records) => {
      products.value = records.map((item: any) => ({
        ...item._raw,
        id: item.id,
        name: decryptData(item.name),
        brandName: decryptData(item.brandName),
        shelfLocation: decryptData(item.shelfLocation),
        stock: item.quantity,
        sellingPrice: item.sellingPrice,
        vatPercent: item.vatPercent,
        isControlled: item.isControlled,
        barcode: item.barcode,
      }))
    })

  // Customers
  customersSub = customerRepository
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      customers.value = records
        .map((c: any) => ({
          ...c._raw,
          id: c.id,
          name: decryptData(c.name),
          phone: decryptData(c.phone),
          balance: c.balance,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    })

  // Sales (for most sold)
  salesSub = saleRepository
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((salesData) => {
      if (salesData && salesData.length > 0) {
        const itemCounts: Record<string, number> = {}
        salesData.forEach((sale: any) => {
          let items = []
          try {
            items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
          } catch {
            items = []
          }

          if (Array.isArray(items)) {
            items.forEach((item: any) => {
              if (item.inventory_id) {
                itemCounts[item.inventory_id] =
                  (itemCounts[item.inventory_id] || 0) + (item.quantity || 1)
              }
            })
          }
        })

        const sortedIds = Object.keys(itemCounts)
          .sort((a, b) => itemCounts[b] - itemCounts[a])
          .slice(0, 10)

        mostSoldItems.value = sortedIds
          .map((id) => products.value.find((p) => p.id === id))
          .filter(Boolean)
      } else {
        mostSoldItems.value = []
      }
    })
}

onMounted(() => {
  subscribeToData()
  // Click outside to close results
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (inventorySub) inventorySub.unsubscribe()
  if (customersSub) customersSub.unsubscribe()
  if (salesSub) salesSub.unsubscribe()
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: any) => {
  const searchContainer = document.querySelector('.relative.w-full.mb-3')
  if (searchContainer && !searchContainer.contains(event.target)) {
    showResults.value = false
  }
}

watch(
  () => profile.pharmacyId,
  (newId) => {
    if (newId) subscribeToData()
  },
)

// Check for query params to add item from Medicine Finder or Prescription
watch(
  () => router.currentRoute.value.query,
  async (newQuery) => {
    // Handle Medicine Finder Add
    if (newQuery.add && products.value.length > 0) {
      const productId = newQuery.add as string
      const product = products.value.find((p) => p.id === productId)
      if (product) {
        selectProduct(product)
        router.replace({ query: {} })
      }
    }

    // Handle Prescription Dispense
    if (newQuery.fromRx && products.value.length > 0 && customers.value.length > 0) {
      const rxId = newQuery.fromRx as string
      try {
        const prescription = (await database.get('prescriptions').find(rxId)) as any
        if (prescription) {
          // 1. Select Customer
          if (prescription.customerId) {
            const customer = customers.value.find((c) => c.id === prescription.customerId)
            if (customer) {
              selectedCustomer.value = customer
            }
          }

          // 2. Add Items to Cart
          // Prescription items store encrypted names. We need to decrypt and match with inventory.
          const rxItems = prescription.items // Already parsed by model

          if (Array.isArray(rxItems)) {
            // Clear existing cart if needed, or just append? Usually dispense implies a fresh start.
            // Let's clear for safety to avoid mixing.
            clearCart()

            for (const item of rxItems) {
              const decryptedName = decryptData(item.name)
              if (!decryptedName) continue

              // Find matching product by name (fuzzy or exact?)
              // Let's try exact match first, then case-insensitive
              const product = products.value.find(
                (p) => p.name.toLowerCase() === decryptedName.toLowerCase(),
              )

              if (product) {
                // Add to cart with specific quantity
                // We can't use addToCart directly because it defaults to 1 and toggles.
                // We need to push to cart manually or use a modified addToCart.
                // Let's use addToCart loop or manual push.
                // Manual push is safer for setting specific quantity.

                // Check stock
                if (product.stock < item.quantity) {
                  notification.showNotification(`Insufficient stock for ${product.name}`, 'warning')
                }

                cart.value.push({
                  ...product,
                  qty: item.quantity,
                  price: product.sellingPrice,
                })
              } else {
                notification.showNotification(
                  `Medicine not found in inventory: ${decryptedName}`,
                  'warning',
                )
              }
            }
          }

          // Clear query
          router.replace({ query: {} })
        }
      } catch (error) {
        console.error('Error loading prescription:', error)
      }
    }
  },
  { immediate: true },
)

// Search Logic
watch(searchQuery, (newQuery) => {
  if (!newQuery) {
    filteredProducts.value = []
    return
  }
  const query = newQuery.toLowerCase()
  filteredProducts.value = products.value.filter(
    (p) =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.brandName && p.brandName.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.includes(query)),
  )
})

// Clear search when switching tabs
watch(activeTabId, () => {
  searchQuery.value = ''
  showResults.value = false
})

const showAlternativeDialog = ref(false)
const pendingProduct = ref<any>(null)
const alternativeProduct = ref<any>(null)

const confirmOriginal = () => {
  if (pendingProduct.value) {
    finalizeSelection(pendingProduct.value)
  }
  showAlternativeDialog.value = false
  pendingProduct.value = null
  alternativeProduct.value = null
}

const confirmAlternative = () => {
  if (alternativeProduct.value) {
    finalizeSelection(alternativeProduct.value)
    notification.showNotification('Savings applied! Good job.', 'success')
  }
  showAlternativeDialog.value = false
  pendingProduct.value = null
  alternativeProduct.value = null
}

const finalizeSelection = (product: any) => {
  const success = addToCart(product)
  if (success) {
    playBeep()
  } else {
    playError()
    notification.showNotification('Max stock reached', 'warning')
  }
  searchQuery.value = '' // Clear search
  showResults.value = false
}

const selectProduct = (product: any) => {
  // Scholar's Alternative Logic
  // Find a product with SAME Generic Name but LOWER Price
  if (product.name) {
    const alternative = products.value.find(
      (p) =>
        p.id !== product.id &&
        p.name.toLowerCase() === product.name.toLowerCase() &&
        p.sellingPrice < product.sellingPrice &&
        p.stock > 0,
    )

    if (alternative) {
      pendingProduct.value = product
      alternativeProduct.value = alternative
      showAlternativeDialog.value = true
      playBeep() // Suggestive beep?
      return
    }
  }

  // Normal flow
  finalizeSelection(product)
}

// Removed local updateQty, removeFromCart, clearCart as they are now from store

watch(grandTotal, (val) => {
  if (snapshot.value.context.paymentMethod === 'Cash') {
    amountReceived.value = Math.ceil(val) // Auto-suggest rounded cash
  } else {
    amountReceived.value = val
  }
})
</script>

<style scoped>
.search-command-center {
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.live-pulse {
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(74, 222, 128, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0);
  }
}

.search-command-center:focus-within {
  box-shadow: none;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  outline: none !important;
}

.glass-input-sm :deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.25rem 0.5rem;
  text-align: right;
}

.glass-input :deep(.p-inputtext) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 0.75rem;
}

.glass-button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media screen and (max-width: 768px) {
  .record-sale-container {
    padding: 1rem !important;
  }

  .cart-panel {
    min-height: 300px !important;
    max-height: 400px;
  }

  .glass-autocomplete-lg :deep(.p-autocomplete-input) {
    font-size: 1rem;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  }

  .cart-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .cart-item .text-right {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }
}
</style>
