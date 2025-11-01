// src/views/RecordSaleView.vue

<template>
  <div class="record-sale-container">
    <header class="view-header">
      <h1 class="title">Record a New Sale</h1>
      <p class="subtitle">Search for products and add them to the sale.</p>
    </header>

    <div class="sale-layout">
      <div class="product-search-panel">
        <div class="card">
          <div class="form-group">
            <label for="search">Search Medicine</label>
            <input
              id="search"
              type="text"
              v-model="searchQuery"
              @input="searchItems"
              placeholder="Type to search..."
            />
          </div>
          <ul v-if="searchResults.length > 0" class="search-results">
            <li
              v-for="result in searchResults"
              :key="result.item.key"
              @click="addToCart(result.item)"
            >
              <div class="item-info">
                <strong>{{ result.item.name }}</strong>
                <span
                  >{{ result.item.totalQuantity }} in stock across
                  {{ result.item.batchCount }} batches</span
                >
              </div>
              <span class="item-price">Rs. {{ (result.item.sellingPrice || 0).toFixed(2) }}</span>
            </li>
          </ul>
          <div v-if="searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
            <p>'{{ searchQuery }}' not found in inventory.</p>
            <button
              v-if="staffStore.activeUserRole !== 'cashier'"
              @click="openQuickAddModal"
              class="button-secondary"
            >
              + Add as New Batch
            </button>
          </div>
        </div>

        <div class="card frequently-sold-card">
          <h3>Frequently Sold</h3>
          <div v-if="frequentlySoldItems.length > 0" class="frequent-items-grid">
            <button
              v-for="item in frequentlySoldItems"
              :key="item.key"
              @click="addToCart(item)"
              class="frequent-item-btn"
            >
              {{ item.name }}
            </button>
          </div>
          <p v-else class="empty-list">No frequently sold items in stock.</p>
        </div>
      </div>

      <div class="current-sale-panel card">
        <h2 class="cart-title">Current Sale</h2>
        <div v-if="preselectedCustomer" class="preselected-customer-banner">
          Sale for: <strong>{{ preselectedCustomer.name }}</strong>
        </div>
        <div v-if="cart.length > 0">
          <ul class="cart-items">
            <li v-for="(item, index) in cart" :key="item.key">
              <div class="cart-item-details">
                <span class="item-name"
                  >{{ item.name }}
                  <small v-if="item.vatPercent > 0">({{ item.vatPercent }}% VAT)</small></span
                >
                <span class="item-price">Rs. {{ (item.sellingPrice || 0).toFixed(2) }}</span>
              </div>
              <div class="cart-item-actions">
                <label :for="'qty-' + item.key">Qty:</label>
                <input
                  :id="'qty-' + item.key"
                  type="number"
                  v-model.number="item.saleQuantity"
                  min="1"
                  :max="item.totalQuantity"
                  class="quantity-input"
                />
                <button @click="removeFromCart(index)" class="remove-button">×</button>
              </div>
            </li>
          </ul>

          <div class="sale-summary">
            <div class="summary-row">
              <span>Subtotal (Taxable Amount)</span>
              <span>Rs. {{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-row">
              <span>VAT Amount</span>
              <span>Rs. {{ totalVat.toFixed(2) }}</span>
            </div>
            <div class="summary-row grand-total-before-discount">
              <span>Total</span>
              <span>Rs. {{ (subtotal + totalVat).toFixed(2) }}</span>
            </div>
            <div v-if="discount > 0" class="summary-row discount">
              <span>Discount</span>
              <span>- Rs. {{ discount.toFixed(2) }}</span>
            </div>
            <div class="summary-row total">
              <h3>Grand Total:</h3>
              <h3 class="total-amount">Rs. {{ grandTotal.toFixed(2) }}</h3>
            </div>
          </div>
          <div class="quick-cash-container">
            <div class="quick-cash-buttons">
              <button @click="setCashReceived(100)">100</button>
              <button @click="setCashReceived(500)">500</button>
              <button @click="setCashReceived(1000)">1000</button>
            </div>
            <div class="change-display">
              <span>Change: Rs. {{ changeDue.toFixed(2) }}</span>
            </div>
          </div>
          <div class="sale-actions">
            <button @click="applyDiscount" class="button-secondary">Apply Discount</button>
            <button @click="openKhataModal" class="button-secondary">Add to Khata</button>
            <button @click="handlePaidSale" :disabled="isProcessing">
              {{ isProcessing ? 'Processing...' : 'Complete Sale (Paid)' }}
            </button>
          </div>
        </div>
        <div v-else class="empty-cart">
          <p>Your cart is empty.</p>
          <span>Add products from the search results to get started.</span>
        </div>
      </div>
    </div>

    <div v-if="isKhataModalOpen" class="modal-overlay" @click.self="isKhataModalOpen = false">
      <div class="modal-content card">
        <h2>Select Customer for Khata</h2>
        <p class="modal-subtitle">Who is this sale for?</p>
        <ul class="customer-list">
          <li
            v-for="customer in customers"
            :key="customer._id"
            @click="
              completeSale({
                isPaid: false,
                customerId: customer._id,
                doctorName: doctorNameForSale,
              })
            "
          >
            {{ customer.name }}
          </li>
        </ul>
        <div v-if="customers.length === 0">
          <p>No customers found. <RouterLink to="/customers">Add a customer</RouterLink> first.</p>
        </div>
        <button @click="isKhataModalOpen = false" class="button-secondary close-modal-btn">
          Cancel
        </button>
      </div>
    </div>

    <div v-if="isQuickAddModalOpen" class="modal-overlay" @click.self="isQuickAddModalOpen = false">
      <div class="modal-content card">
        <h2>Add New Batch to Inventory</h2>
        <p class="modal-subtitle">
          Quickly add '{{ newItem.name }}' to your stock and the current sale.
        </p>
        <form @submit.prevent="saveNewItemAndAddToCart">
          <div class="form-group">
            <label>Brand Name (Optional)</label>
            <input type="text" v-model="newItem.brandName" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantity on Hand</label>
              <input type="number" v-model.number="newItem.quantity" required />
            </div>
            <div class="form-group">
              <label>Expiry Date</label>
              <input type="date" v-model="newItem.expiryDate" required />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Purchase Price (per unit)</label>
              <input type="number" step="0.01" v-model.number="newItem.purchasePrice" required />
            </div>
            <div class="form-group">
              <label>Selling Price (per unit)</label>
              <input type="number" step="0.01" v-model.number="newItem.sellingPrice" required />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="isQuickAddModalOpen = false">
              Cancel
            </button>
            <button type="submit" :disabled="isProcessing">Add to Inventory & Sale</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onActivated, watch } from 'vue'
import { supabase } from '@/supabase'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification.js'
import { usePromptStore } from '@/stores/prompt.js'
import { useStaffStore } from '@/stores/staff.js'
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile.js'
import Fuse from 'fuse.js'
import CryptoJS from 'crypto-js'

const router = useRouter()
const route = useRoute()
const notification = useNotificationStore()
const prompt = usePromptStore()
const staffStore = useStaffStore()
const profileStore = useProfileStore()

const searchQuery = ref('')
const searchResults = ref([])
const cart = ref([])
const isProcessing = ref(false)
const isKhataModalOpen = ref(false)
const customers = ref([])
const discount = ref(0)
const frequentlySoldItems = ref([])
const isSearching = ref(false)
const isQuickAddModalOpen = ref(false)
const preselectedCustomer = ref(null)
const cashReceived = ref(0)
const activeCustomer = ref(null)
const doctorNameForSale = ref(null)

const newItem = reactive({
  name: '',
  brandName: '',
  quantity: null,
  purchasePrice: null,
  sellingPrice: null,
  expiryDate: '',
  vatPercent: 13,
  isControlled: false,
})

let fuse
const searchableInventory = ref([])

const setupFuzzySearch = (inventory) => {
  const groupedItems = Object.values(
    inventory.reduce((acc, item) => {
      if (item.quantity <= 0) return acc
      const name = decryptData(item.name)
      const brandName = decryptData(item.brand_name)
      const key = `${name.trim()}|${brandName ? brandName.trim() : ''}`

      if (!acc[key]) {
        acc[key] = {
          key,
          name,
          brandName,
          sellingPrice: item.selling_price,
          vatPercent: item.vat_percent,
          is_controlled: item.is_controlled,
          totalQuantity: 0,
          batchCount: 0,
        }
      }
      acc[key].totalQuantity += item.quantity
      acc[key].batchCount++
      return acc
    }, {}),
  )

  searchableInventory.value = groupedItems

  const options = {
    keys: ['name', 'brandName'],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2,
  }
  fuse = new Fuse(searchableInventory.value, options)
}

watch(
  [cart, activeCustomer],
  ([newCart, newCustomer]) => {
    if (newCart.length === 0) return
    checkAllergies(newCart, newCustomer)
    checkInteractions(newCart)
  },
  { deep: true },
)

onActivated(async () => {
  preselectedCustomer.value = null
  cart.value = []
  searchQuery.value = ''
  searchResults.value = []
  doctorNameForSale.value = null
  cashReceived.value = 0

  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (pharmacyId) {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
    if (customerData) {
      customers.value = customerData.map((c) => ({ ...c, name: decryptData(c.name) }))
    }

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
    if (inventoryData) {
      setupFuzzySearch(inventoryData)
    }
  }

  await loadFrequentlySoldItems()

  const rxId = route.query.fromRx
  if (rxId && !isNaN(Number(rxId))) {
    const { data: prescription } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('_id', Number(rxId))
      .single()

    if (prescription && prescription.items) {
      preselectedCustomer.value = {
        _id: prescription.customer_id,
        name: prescription.patient_name,
      }
      doctorNameForSale.value = prescription.doctor_name

      await fillCartFromPrescription(prescription.items)

      const newQuery = { ...route.query }
      delete newQuery.fromRx
      router.replace({ query: newQuery })
    }
  }
})

// *** UPDATED DISPENSE LOGIC ***
const fillCartFromPrescription = async (items) => {
  notification.showNotification('Adding available items from prescription...')
  for (const rxItem of items) {
    const decryptedName = decryptData(rxItem.name)
    if (!decryptedName) {
      notification.showNotification(`Could not read item: ${rxItem.name}`, 'error')
      continue
    }

    const matchingItems = fuse.search(decryptedName)
    if (matchingItems.length > 0) {
      const bestMatch = matchingItems[0].item
      if (bestMatch.totalQuantity > 0) {
        // Only add to cart if in stock
        addToCart(bestMatch, rxItem.quantity)
      } else {
        // Show a clear error if out of stock
        notification.showNotification(`'${decryptedName}' is OUT OF STOCK.`, 'error')
      }
    } else {
      // Show a clear error if not found at all
      notification.showNotification(`'${decryptedName}' was NOT FOUND in your inventory.`, 'error')
    }
  }
}

const checkAllergies = (cartItems, customer) => {
  if (!customer || !customer.allergies || customer.allergies.length === 0) return

  const customerAllergies = customer.allergies.map((a) => a.toLowerCase())

  cartItems.forEach((item) => {
    const itemName = item.name.toLowerCase()
    customerAllergies.forEach((allergy) => {
      if (itemName.includes(allergy)) {
        prompt.show({
          type: 'confirm',
          title: '🚨 Patient Allergy Alert 🚨',
          message: `This patient is allergic to "${allergy}". The item "${item.name}" may cause a reaction. Please confirm with the patient before proceeding.`,
        })
      }
    })
  })
}

let interactionCheckDebounce = null
const checkInteractions = (cartItems) => {
  if (cartItems.length < 2) return

  clearTimeout(interactionCheckDebounce)
  interactionCheckDebounce = setTimeout(async () => {
    const drugNames = cartItems.map((item) => item.name.toLowerCase()).join('+AND+')
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name.exact:(${drugNames})&count=drug_interactions.exact`

    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.results && data.results.length > 0) {
        const interactions = data.results.map((i) => i.term).join(', ')
        prompt.show({
          type: 'confirm',
          title: '🚨 Drug Interaction Warning 🚨',
          message: `Potential interaction(s) found between drugs in the cart: ${interactions}. \n\nPlease review the items and advise the patient.`,
        })
      }
    } catch (error) {
      console.error('OpenFDA Interaction Check Failed:', error)
    }
  }, 1500)
}

const loadFrequentlySoldItems = async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (!pharmacyId) return

  const { data: sales } = await supabase
    .from('sales')
    .select('items')
    .eq('pharmacy_id', pharmacyId)
    .neq('status', 'void')

  const allInventory = searchableInventory.value
  if (!sales || allInventory.length === 0) return

  const itemCounts = {}
  sales.forEach((sale) => {
    ;(sale.items || []).forEach((item) => {
      const name = decryptData(item.name)
      const brandName = decryptData(item.brandName)
      const key = `${name ? name.trim() : ''}|${brandName ? brandName.trim() : ''}`
      if (key !== '|') itemCounts[key] = (itemCounts[key] || 0) + 1
    })
  })

  const sortedItems = Object.entries(itemCounts).sort(([, a], [, b]) => b - a)
  const topItems = sortedItems.slice(0, 10)

  frequentlySoldItems.value = topItems
    .map(([key]) => {
      const foundItem = allInventory.find((item) => item.key === key)
      return foundItem
    })
    .filter((item) => item && item.totalQuantity > 0)
}

const subtotal = computed(() =>
  cart.value.reduce(
    (total, item) => total + (item.sellingPrice || 0) * (item.saleQuantity || 0),
    0,
  ),
)

const totalVat = computed(() =>
  cart.value.reduce((vat, item) => {
    const itemSubtotal = (item.sellingPrice || 0) * (item.saleQuantity || 0)
    return vat + itemSubtotal * ((item.vatPercent || 0) / 100)
  }, 0),
)

const grandTotal = computed(() => {
  const total = subtotal.value + totalVat.value - discount.value
  return total > 0 ? total : 0
})

const changeDue = computed(() => {
  const change = cashReceived.value - grandTotal.value
  return change > 0 ? change : 0
})

const searchItems = () => {
  if (!fuse || searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }
  searchResults.value = fuse.search(searchQuery.value, { limit: 10 })
}

const addToCart = (item, quantity = 1) => {
  const key = `${item.name.trim()}|${item.brandName ? item.brandName.trim() : ''}`
  if (cart.value.find((cartItem) => cartItem.key === key)) {
    notification.showNotification(`'${item.name}' is already in the cart.`, 'error')
    return
  }
  if (item.totalQuantity <= 0) {
    notification.showNotification(`'${item.name}' is out of stock.`, 'error')
    return
  }
  cart.value.push({
    key,
    name: item.name,
    brandName: item.brandName,
    sellingPrice: item.sellingPrice || 0,
    vatPercent: item.vatPercent || 0,
    is_controlled: item.is_controlled || false,
    saleQuantity: quantity,
    totalQuantity: item.totalQuantity,
  })
  searchQuery.value = ''
  searchResults.value = []
}

const openQuickAddModal = () => {
  Object.assign(newItem, {
    name: searchQuery.value,
    brandName: '',
    quantity: null,
    purchasePrice: null,
    sellingPrice: null,
    expiryDate: '',
    isControlled: false,
  })
  isQuickAddModalOpen.value = true
}

const saveNewItemAndAddToCart = async () => {
  isProcessing.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  try {
    const pharmacyId = parseInt(profileStore.pharmacyId, 10)
    const itemToSave = {
      name: encryptData(newItem.name),
      brand_name: encryptData(newItem.brandName),
      quantity: newItem.quantity,
      purchase_price: newItem.purchasePrice,
      selling_price: newItem.sellingPrice,
      expiry_date: newItem.expiryDate,
      vat_percent: newItem.vatPercent,
      is_controlled: newItem.isControlled,
      pharmacy_id: pharmacyId,
      user_id: user.id,
    }
    const { data, error } = await supabase.from('inventory').insert([itemToSave]).select()
    if (error) throw error

    await supabase.from('audit_logs').insert([
      {
        action: 'INVENTORY_ADD',
        user_id: staffStore.activeUserId,
        details: { itemName: newItem.name, quantityAdded: newItem.quantity },
      },
    ])

    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
    if (inventoryData) setupFuzzySearch(inventoryData)

    notification.showNotification(`'${newItem.name}' added to inventory.`)
    addToCart({ ...newItem, totalQuantity: newItem.quantity }, 1)
    isQuickAddModalOpen.value = false
    searchQuery.value = ''
    searchResults.value = []
  } catch (err) {
    notification.showNotification('Failed to save new item.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const removeFromCart = (index) => cart.value.splice(index, 1)

const applyDiscount = async () => {
  const totalBeforeDiscount = subtotal.value + totalVat.value
  try {
    const input = await prompt.show({
      title: 'Apply Discount',
      message: `Enter amount or percentage (e.g., 50 or 10%). Total is Rs. ${totalBeforeDiscount.toFixed(2)}`,
    })
    if (input.includes('%')) {
      const percentage = parseFloat(input.replace('%', ''))
      if (!isNaN(percentage)) discount.value = totalBeforeDiscount * (percentage / 100)
    } else {
      const amount = parseFloat(input)
      if (!isNaN(amount)) discount.value = amount
    }
    notification.showNotification('Discount applied!')
  } catch (error) {
    if (error !== 'cancelled') notification.showNotification('Invalid discount format.', 'error')
  }
}

const checkAndGetDoctorName = async () => {
  if (doctorNameForSale.value) return doctorNameForSale.value

  const controlledItems = cart.value.filter((item) => item.is_controlled)
  if (controlledItems.length > 0) {
    try {
      const doctorName = await prompt.show({
        title: 'DDA Requirement',
        message:
          "This sale includes a controlled substance. Please enter the prescribing doctor's name:",
        inputType: 'text',
      })
      if (!doctorName || doctorName.trim() === '') {
        throw new Error('Doctor name is required for controlled items.')
      }
      doctorNameForSale.value = doctorName
      return doctorName
    } catch (error) {
      notification.showNotification(
        'Sale cancelled. Doctor name is required for controlled substances.',
        'error',
      )
      return null
    }
  }
  return 'N/A'
}

const openKhataModal = async () => {
  if (cart.value.length === 0) {
    notification.showNotification('Please add items to the cart first.', 'error')
    return
  }

  const doctorName = await checkAndGetDoctorName()
  if (doctorName === null) return

  if (preselectedCustomer.value) {
    const cust = customers.value.find((c) => c._id === preselectedCustomer.value._id)
    if (cust) activeCustomer.value = cust

    completeSale({
      isPaid: false,
      customerId: preselectedCustomer.value._id,
      doctorName,
    })
    return
  }
  isKhataModalOpen.value = true
}

const setCashReceived = (amount) => {
  cashReceived.value = amount
}

const handlePaidSale = async () => {
  if (cart.value.length === 0) {
    notification.showNotification('Please add items to the cart first.', 'error')
    return
  }

  const doctorName = await checkAndGetDoctorName()
  if (doctorName === null) return
  activeCustomer.value = null

  await completeSale({ isPaid: true, doctorName })
}

const getNextBillNumber = async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (isNaN(pharmacyId)) {
    throw new Error('Invalid Pharmacy ID.')
  }
  const { data, error } = await supabase
    .from('sales')
    .select('bill_number')
    .eq('pharmacy_id', pharmacyId)
    .order('bill_number', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching next bill number:', error)
    throw new Error(`Could not get next bill number. (${error.message})`)
  }

  const lastBillNumber = data && data.length > 0 ? data[0].bill_number : 0
  return lastBillNumber + 1
}

const completeSale = async ({ isPaid, customerId = null, doctorName = null }) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pharmacyId = parseInt(profileStore.pharmacyId, 10)

  if (isNaN(pharmacyId) || cart.value.length === 0 || !user) {
    notification.showNotification('Cannot process sale. Invalid pharmacy configuration.', 'error')
    return
  }

  if (staffStore.activeUserRole !== 'admin' && !staffStore.activeShift) {
    notification.showNotification('You must start a shift to record a sale.', 'error')
    router.push('/')
    return
  }

  isProcessing.value = true
  isKhataModalOpen.value = false

  const cartAtSaleTime = [...cart.value]
  const finalCustomerId = customerId
    ? parseInt(customerId, 10)
    : preselectedCustomer.value?._id
      ? parseInt(preselectedCustomer.value._id, 10)
      : null
  const finalDoctorName = doctorName || doctorNameForSale.value
  const finalShiftId = staffStore.activeShift?._id ? parseInt(staffStore.activeShift._id, 10) : null
  const finalStaffId = staffStore.activeUserRole === 'admin' ? null : staffStore.activeUserId

  try {
    const newBillNumber = await getNextBillNumber()

    const rpcArgs = {
      p_bill_number: newBillNumber,
      p_user_id: user.id,
      p_pharmacy_id: pharmacyId,
      p_staff_name: staffStore.activeUserName,
      p_items: cartAtSaleTime.map((i) => ({
        name: encryptData(i.name),
        brand_name: encryptData(i.brandName), //  FIX: Was brandName        quantity: i.saleQuantity,
        price: i.sellingPrice,
        vatPercent: i.vatPercent,
      })),
      p_subtotal: subtotal.value,
      p_vat_amount: totalVat.value,
      p_discount: discount.value,
      p_total: grandTotal.value,
      p_status: isPaid ? 'paid' : 'unpaid',
      p_staff_id: finalStaffId,
      p_shift_id: finalShiftId,
      p_customer_id: finalCustomerId,
    }

    const { data: saleData, error: saleError } = await supabase.rpc('process_sale', rpcArgs)

    if (saleError) throw saleError

    const newSaleObject = saleData[0]

    sessionStorage.setItem('temp_sale_data', JSON.stringify(newSaleObject))

    router.push({ name: 'receipt', params: { id: newSaleObject._id } })
  } catch (error) {
    console.error('Sale failed:', error)
    notification.showNotification(`Sale failed: ${error.message}`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
/* Styles remain the same */
.quick-cash-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}
.quick-cash-buttons {
  display: flex;
  gap: 0.5rem;
}
.quick-cash-buttons button {
  width: auto;
  padding: 0.5rem 1rem;
}
.change-display {
  font-weight: bold;
  font-size: 1.2rem;
}
.preselected-customer-banner {
  background-color: var(--color-primary-mute);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-weight: 500;
}
.no-results {
  text-align: center;
  margin-top: 1rem;
  padding: 1rem;
}
.no-results p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}
.no-results .button-secondary {
  width: auto;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(5px);
}
.modal-content {
  width: 100%;
  max-width: 500px;
}
.modal-subtitle {
  margin-bottom: 2rem;
  color: var(--color-text-light);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.frequently-sold-card {
  margin-top: 1.5rem;
}
.frequently-sold-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.frequent-items-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.frequent-item-btn {
  width: auto;
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
  border: 1px solid var(--color-border);
  font-weight: 500;
  padding: 0.5rem 1rem;
}
.frequent-item-btn:hover {
  background-color: var(--color-primary-mute);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.empty-list {
  color: var(--color-text-light);
  font-size: 0.9rem;
}
.sale-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.product-search-panel,
.current-sale-panel {
  width: 100%;
}
@media (min-width: 1024px) {
  .sale-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: flex-start;
  }
  .current-sale-panel {
    position: sticky;
    top: 2rem;
  }
}
.summary-row.grand-total-before-discount {
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}
.item-name small {
  color: var(--color-text-light);
  font-weight: normal;
}
.sale-summary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}
.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}
.summary-row.discount span {
  color: var(--color-saffron-orange);
}
.summary-row.total h3 {
  font-size: 1.75rem;
  font-weight: 800;
}
.total-amount {
  color: var(--color-primary);
}
.sale-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1.5rem;
}
.button-secondary {
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
}
.view-header {
  margin-bottom: 2rem;
}
.product-search-panel label {
  font-weight: 600;
  color: var(--color-light-slate);
  margin-bottom: 0.5rem;
  display: block;
}
.search-results {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}
.search-results li {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.search-results li:hover {
  background-color: var(--color-surface-mute);
}
.item-info {
  display: flex;
  flex-direction: column;
}
.item-info span {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.item-price {
  font-weight: 600;
  color: var(--color-accent);
}
.cart-title {
  font-size: 1.5rem;
  font-weight: 700;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.cart-items {
  list-style: none;
  padding: 0;
  margin: 0;
}
.cart-items li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}
.cart-item-details .item-name {
  display: block;
  font-weight: 600;
}
.cart-item-details .item-price {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.cart-item-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.quantity-input {
  width: 60px;
  text-align: center;
  padding: 0.5rem;
}
.remove-button {
  background: transparent;
  border: none;
  color: var(--color-danger);
  font-size: 1.5rem;
  font-weight: bold;
  width: auto;
  padding: 0 0.5rem;
  cursor: pointer;
}
.empty-cart {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-light);
}
.modal-content.card {
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}
.modal-subtitle {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.customer-list {
  list-style: none;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}
.customer-list li {
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}
.customer-list li:hover {
  background-color: var(--color-surface-mute);
}
.close-modal-btn {
  margin-top: 1.5rem;
}
</style>
