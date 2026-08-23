<template>
  <div
    class="mobile-terminal pos-container flex flex-column h-screen w-full bg-black overflow-hidden relative select-none"
  >
    <!-- Toast for notifications -->
    <Toast />

    <!-- ========================================== -->
    <!-- VIEWPORT AREA: Visuals & Keypad            -->
    <!-- ========================================== -->
    <div class="viewport-area flex flex-column flex-grow-1 relative p-4 gap-4">
      <!-- Header & Search Trigger -->
      <div class="flex justify-content-between align-items-start">
        <div>
          <h1 class="text-3xl font-bold text-white m-0 tracking-tight">Terminal</h1>
          <p class="text-gray-400 text-sm mt-1">Scan, Search, or Calculate</p>
        </div>
        <div class="flex gap-2">
          <Button
            icon="pi pi-camera"
            class="viewfinder-btn glass-button-icon"
            aria-label="Scan Invoice"
            @click="triggerScanInvoice"
          />
          <Button
            icon="pi pi-search"
            class="glass-button-icon"
            aria-label="Search Product"
            @click="openBottomSheet('search')"
          />
        </div>
      </div>

      <!-- Calculator Display (The "Screen") -->
      <div
        class="calculator-display w-full bg-gray-900 border-round-xl p-4 flex flex-column justify-content-end text-right shadow-3"
      >
        <div class="text-gray-400 text-sm font-mono mb-1 h-1rem">
          {{ calculator.currentItem ? calculator.currentItem.name : 'Ready to scan...' }}
        </div>
        <div class="text-primary text-5xl font-black tracking-tighter truncate">
          {{ calculator.displayValue }}
        </div>
      </div>

      <!-- Numeric Keypad (Thumb-Friendly 48px+) -->
      <div class="keypad-grid flex-grow-1 grid grid-nogutter gap-2 mt-2">
        <!-- Row 1 -->
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="1"
          @click="inputDigit('1')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="2"
          @click="inputDigit('2')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="3"
          @click="inputDigit('3')"
        />
        <!-- Row 2 -->
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="4"
          @click="inputDigit('4')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="5"
          @click="inputDigit('5')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="6"
          @click="inputDigit('6')"
        />
        <!-- Row 3 -->
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="7"
          @click="inputDigit('7')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="8"
          @click="inputDigit('8')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="9"
          @click="inputDigit('9')"
        />
        <!-- Row 4 -->
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="C"
          @click="clearCalculator"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-white"
          label="0"
          @click="inputDigit('0')"
        />
        <Button
          class="keypad-btn col-4 text-2xl font-bold text-primary"
          icon="pi pi-backspace"
          @click="removeLastDigit"
        />
      </div>
    </div>

    <!-- ========================================== -->
    <!-- CART MINI-BAR (Bottom Sheet Trigger)       -->
    <!-- ========================================== -->
    <div
      class="cart-mini-bar flex justify-content-between align-items-center p-3 bg-gray-900 border-top-1 border-white-alpha-10 cursor-pointer shadow-8"
      @click="openBottomSheet('cart')"
    >
      <div class="flex align-items-center gap-2">
        <i class="pi pi-shopping-cart text-xl text-primary"></i>
        <span class="text-white font-bold text-lg">{{ cart.length }} items</span>
      </div>
      <div class="text-2xl font-black text-white">Rs. {{ cartTotal.toFixed(2) }}</div>
    </div>

    <!-- ========================================== -->
    <!-- BOTTOM SHEET OVERLAY (Vue Transition)      -->
    <!-- ========================================== -->
    <transition name="slide-up">
      <div
        v-if="bottomSheet.isOpen"
        class="bottom-sheet absolute top-0 left-0 w-full h-full flex flex-column bg-gray-900 z-5 shadow-8"
        :class="{ 'h-full': bottomSheet.type === 'checkout' }"
      >
        <!-- Sheet Header -->
        <div
          class="sheet-header flex justify-content-between align-items-center p-4 border-bottom-1 border-white-alpha-10"
        >
          <div class="flex align-items-center gap-2">
            <Button
              icon="pi pi-arrow-left"
              class="p-button-rounded p-button-text text-white"
              @click="closeBottomSheet"
            />
            <h2 class="text-xl font-bold text-white m-0 capitalize">{{ bottomSheet.type }}</h2>
          </div>
          <Button
            v-if="bottomSheet.type === 'cart'"
            label="Checkout"
            icon="pi pi-credit-card"
            class="p-button-primary"
            @click="openBottomSheet('checkout')"
          />
        </div>

        <!-- Sheet Content Area -->
        <div class="sheet-content flex-grow-1 overflow-y-auto p-3 custom-scrollbar">
          <!-- SEARCH CONTENT -->
          <div v-if="bottomSheet.type === 'search'" class="flex flex-column gap-3">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <InputText
                v-model="searchQuery"
                placeholder="Search product name, SKU, or generic..."
                class="w-full bg-gray-800 border-none text-white p-3 pl-5 border-round-xl"
                autofocus
              />
            </span>

            <div v-if="searchQuery.trim() === ''" class="text-gray-500 text-center mt-4">
              <i class="pi pi-search text-4xl mb-2"></i>
              <p>Type to search the local catalog.</p>
            </div>

            <div v-else-if="searchResults.length === 0" class="text-gray-500 text-center mt-4">
              <i class="pi pi-exclamation-circle text-4xl mb-2"></i>
              <p>No products found.</p>
            </div>

            <div v-else class="flex flex-column gap-2">
              <div
                v-for="item in searchResults"
                :key="item.id"
                class="search-result-item flex justify-content-between align-items-center p-3 bg-gray-800 border-round-xl cursor-pointer hover:bg-gray-700 transition-all"
                @click="startAddingFromSearch(item)"
              >
                <div class="flex flex-column gap-1">
                  <span class="text-white font-bold text-lg">{{ item.name }}</span>
                  <span class="text-gray-400 text-sm"
                    >{{ item.brandName }} • Stock: {{ item.stock }}</span
                  >
                </div>
                <div class="text-right">
                  <div class="text-primary font-bold text-xl">Rs. {{ item.sellingPrice }}</div>
                  <div v-if="item.isDDA" class="text-xs text-orange-400 font-bold mt-1">
                    DDA RESTRICTED
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CART CONTENT -->
          <div v-if="bottomSheet.type === 'cart'" class="flex flex-column gap-3 h-full">
            <div
              v-if="cart.length === 0"
              class="flex flex-column align-items-center justify-content-center flex-grow-1 text-gray-500"
            >
              <i class="pi pi-shopping-cart text-6xl mb-4 opacity-50"></i>
              <p class="text-xl font-medium">Cart is Empty</p>
            </div>

            <div v-else class="flex flex-column gap-2">
              <div
                v-for="(item, index) in cart"
                :key="index"
                class="cart-item flex justify-content-between align-items-center p-3 bg-gray-800 border-round-xl"
              >
                <div class="flex flex-column gap-1">
                  <span class="text-white font-bold">{{ item.name }}</span>
                  <span class="text-gray-400 text-sm"
                    >Rs. {{ item.sellingPrice }} x {{ item.qty }}</span
                  >
                </div>
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center bg-black-alpha-20 border-round-pill">
                    <Button
                      icon="pi pi-minus"
                      class="p-button-rounded p-button-text p-button-sm text-white"
                      @click="updateQty(index, -1)"
                    />
                    <span class="text-white font-bold w-2rem text-center">{{ item.qty }}</span>
                    <Button
                      icon="pi pi-plus"
                      class="p-button-rounded p-button-text p-button-sm text-white"
                      @click="updateQty(index, 1)"
                    />
                  </div>
                  <div class="text-white font-bold text-lg w-4rem text-right">
                    Rs. {{ (item.sellingPrice * item.qty).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CHECKOUT CONTENT -->
          <div v-if="bottomSheet.type === 'checkout'" class="flex flex-column gap-4">
            <!-- Totals -->
            <div class="bg-gray-800 border-round-xl p-4 flex flex-column gap-3">
              <div class="flex justify-content-between text-gray-400">
                <span>Subtotal</span>
                <span>Rs. {{ cartTotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-content-between text-gray-400">
                <span>Tax (18%)</span>
                <span>Rs. {{ (cartTotal * 0.18).toFixed(2) }}</span>
              </div>
              <div
                class="flex justify-content-between align-items-end pt-2 border-top-1 border-white-alpha-10"
              >
                <span class="text-gray-400 text-xl">Total</span>
                <span class="text-primary text-4xl font-black"
                  >Rs. {{ (cartTotal * 1.18).toFixed(2) }}</span
                >
              </div>
            </div>

            <!-- Payment Actions -->
            <div class="flex flex-column gap-3">
              <h3 class="text-white m-0 text-lg">Payment Method</h3>
              <div class="grid gap-2">
                <div class="col-4">
                  <Button
                    label="Cash"
                    icon="pi pi-money-bill"
                    class="w-full p-button-outlined p-button-secondary text-white h-4rem flex-column gap-1"
                  />
                </div>
                <div class="col-4">
                  <Button
                    label="Card"
                    icon="pi pi-credit-card"
                    class="w-full p-button-outlined p-button-secondary text-white h-4rem flex-column gap-1"
                  />
                </div>
                <div class="col-4">
                  <Button
                    label="UPI"
                    icon="pi pi-qrcode"
                    class="w-full p-button-outlined p-button-secondary text-white h-4rem flex-column gap-1"
                  />
                </div>
              </div>
            </div>

            <div class="mt-auto">
              <Button
                :label="isWaitingForDDA ? 'Waiting for Pharmacist...' : 'Complete Sale'"
                :icon="isWaitingForDDA ? 'pi pi-spin pi-spinner' : 'pi pi-check-circle'"
                class="w-full p-button-lg h-4rem text-xl font-bold shadow-4"
                :class="
                  isWaitingForDDA
                    ? 'bg-orange-500 hover:bg-orange-600 border-orange-500'
                    : 'bg-primary hover:bg-primary-600'
                "
                :disabled="cart.length === 0 || isProcessing"
                @click="processSale"
              />
              <p
                v-if="hasDDAItems && !isWaitingForDDA"
                class="text-orange-400 text-center text-sm mt-2"
              >
                <i class="pi pi-exclamation-triangle mr-1"></i> Contains DDA items. Requires
                approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- ========================================== -->
    <!-- FLOATING ACTION BUTTON (One-Handed)      -->
    <!-- ========================================== -->
    <Button
      v-if="calculator.currentItem"
      label="Add to Cart"
      icon="pi pi-plus"
      class="fab-add-to-cart p-button-lg shadow-6 border-circle"
      :disabled="!calculator.displayValue || parseFloat(calculator.displayValue) <= 0"
      @click="confirmAddToCart"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/features/staff/store'
import { database } from '@/database'
import Fuse from 'fuse.js'

// Capacitor Plugins
import { Haptics, ImpactStyle } from '@capacitor/haptics'
// import { Camera, CameraResultType } from '@capacitor/camera'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'

// --- State ---
const notification = useNotificationStore()
const staffStore = useStaffStore()

const cart = ref([])
const fastMovingItems = ref([])
const searchQuery = ref('')
const searchResults = ref([])

const isProcessing = ref(false)
const isWaitingForDDA = ref(false)

// Calculator State
const calculator = ref({
  displayValue: '',
  currentItem: null,
  mode: 'quantity', // 'quantity' or 'price'
})

// Bottom Sheet State
const bottomSheet = ref({
  isOpen: false,
  type: 'search', // 'search', 'cart', 'checkout'
})

// --- Computed ---
const cartTotal = computed(() => {
  return cart.value.reduce((total, item) => total + item.sellingPrice * item.qty, 0)
})

const hasDDAItems = computed(() => {
  return cart.value.some((item) => item.isDDA)
})

// --- Logic ---

let fuse = null

onMounted(async () => {
  // Load initial data for quick search
  try {
    const records = await database.get('inventory').query().fetch()
    const mapped = records.map((item) => ({
      id: item.id,
      name: item.name,
      brandName: item.brandName,
      sellingPrice: item.sellingPrice,
      stock: item.quantity,
      isDDA: item.isControlled,
    }))

    fastMovingItems.value = mapped

    fuse = new Fuse(mapped, {
      keys: ['name', 'brandName'],
      threshold: 0.3,
      distance: 100,
    })
  } catch (e) {
    console.error('Failed to load inventory', e)
  }
})

// Search Logic
watch(searchQuery, (newVal) => {
  if (!newVal || !fuse) {
    searchResults.value = []
    return
  }
  searchResults.value = fuse
    .search(newVal)
    .map((result) => result.item)
    .slice(0, 20)
})

// --- Calculator Logic ---

function inputDigit(digit) {
  hapticLight()
  const current = calculator.value.displayValue
  if (current.length < 6) {
    calculator.value.displayValue += digit
  }
}

function removeLastDigit() {
  hapticLight()
  calculator.value.displayValue = calculator.value.displayValue.slice(0, -1)
}

function clearCalculator() {
  hapticMedium()
  calculator.value.displayValue = ''
  calculator.value.currentItem = null
}

// When user taps a search result, preload it into the calculator
function startAddingFromSearch(item) {
  hapticMedium()
  calculator.value.currentItem = item
  calculator.value.displayValue = '1'
  calculator.value.mode = 'quantity'
  closeBottomSheet()
}

// Confirm adding the calculated amount to the cart
function confirmAddToCart() {
  if (!calculator.value.currentItem) return

  const qty = parseFloat(calculator.value.displayValue) || 1
  const item = calculator.value.currentItem

  const existing = cart.value.find((i) => i.id === item.id)
  if (existing) {
    existing.qty += qty
  } else {
    cart.value.push({ ...item, qty })
  }

  hapticHeavy()
  notification.showNotification(`Added ${qty} x ${item.name}`, 'success')

  // Reset calculator
  calculator.value.displayValue = ''
  calculator.value.currentItem = null
}

// --- Cart Logic ---

function updateQty(index, delta) {
  hapticLight()
  const item = cart.value[index]
  const newQty = item.qty + delta

  if (newQty <= 0) {
    cart.value.splice(index, 1)
  } else if (newQty > item.stock) {
    notification.showNotification('Insufficient stock', 'warning')
  } else {
    item.qty = newQty
  }
}

// --- Bottom Sheet Logic ---

function openBottomSheet(type) {
  bottomSheet.value.type = type
  bottomSheet.value.isOpen = true
}

function closeBottomSheet() {
  bottomSheet.value.isOpen = false
  // Clear search when closing search sheet
  if (bottomSheet.value.type === 'search') {
    searchQuery.value = ''
  }
}

// --- Checkout & AI Integration ---

async function triggerScanInvoice() {
  hapticMedium()
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
    })

    // In a real app, send image.webPath to an Edge AI endpoint
    // Here we simulate the success state
    hapticHeavy()
    notification.showNotification('Edge AI: Invoice scanned. Processing...', 'success')
  } catch (error) {
    // User cancelled or permission denied
    if (!error.message || !error.message.includes('cancel')) {
      notification.showNotification('Camera access denied or unavailable', 'error')
    }
  }
}

async function processSale() {
  if (cart.value.length === 0) return
  isProcessing.value = true

  try {
    // Simulate API/network
    await new Promise((r) => setTimeout(r, 600))

    if (hasDDAItems.value) {
      isWaitingForDDA.value = true
      notification.showNotification('Sale paused. Waiting for Pharmacist approval...', 'warning')

      // Mock approval process
      setTimeout(() => {
        isWaitingForDDA.value = false
        hapticHeavy()
        notification.showNotification('Sale Approved by Pharmacist!', 'success')
        cart.value = []
        closeBottomSheet()
      }, 6000)
    } else {
      hapticHeavy()
      notification.showNotification('Sale Completed Successfully', 'success')
      cart.value = []
      closeBottomSheet()
    }
  } catch (error) {
    notification.showNotification(error.message, 'error')
  } finally {
    isProcessing.value = false
  }
}

// --- Haptics Helpers ---
async function hapticLight() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (e) {}
}
async function hapticMedium() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch (e) {}
}
async function hapticHeavy() {
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy })
  } catch (e) {}
}
</script>

<style scoped>
/* UnoCSS Utilities and Overrides */
.pos-container {
  background-color: #000000;
  color: #ffffff;
}

.viewport-area {
  background: linear-gradient(180deg, #111111 0%, #000000 100%);
}

/* Calculator Display */
.calculator-display {
  min-height: 120px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: linear-gradient(145deg, #1a1a1a, #111111);
}

/* Keypad Styling */
.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 0.75rem;
}

.keypad-btn {
  background-color: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: #ffffff !important;
  border-radius: 1rem !important;
  height: auto !important;
  min-height: 48px; /* Accessibility requirement */
  transition: all 0.1s ease;
}

.keypad-btn:active {
  background-color: rgba(255, 255, 255, 0.15) !important;
  transform: scale(0.96);
}

/* Floating Action Button (FAB) */
.fab-add-to-cart {
  position: absolute;
  bottom: 5.5rem; /* Above the cart mini-bar */
  right: 1.5rem;
  z-index: 10;
  background-color: var(--primary-color) !important;
  border: none !important;
  color: #000000 !important;
  padding: 1.25rem 2rem !important;
  font-weight: 900 !important;
}

/* Cart Mini Bar */
.cart-mini-bar {
  min-height: 60px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Bottom Sheet Transitions */
.bottom-sheet {
  background-color: #0f0f0f;
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
}

/* Search Results */
.search-result-item {
  transition: background-color 0.2s;
}

/* Glassmorphism Button */
.glass-button-icon {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  width: 3rem !important;
  height: 3rem !important;
}

.viewfinder-btn {
  position: relative;
  overflow: hidden;
}

.viewfinder-btn::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* Custom Scrollbar for dark theme */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}
</style>
