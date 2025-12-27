<template>
  <div class="edit-inventory-container p-4 max-w-7xl mx-auto relative min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <RouterLink
          to="/inventory"
          class="no-underline text-gray-400 hover:text-white transition-colors mb-2 inline-block flex align-items-center gap-2"
        >
          <i class="pi pi-arrow-left text-sm"></i> Back to Inventory
        </RouterLink>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Edit Stock</h1>
        <p class="text-gray-400 text-sm">Update details for {{ item?.name || 'item' }}</p>
      </div>

      <div class="flex gap-3">
        <Button
          label="Save Changes"
          icon="pi pi-check"
          class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
          :loading="isLoading"
          @click="updateItem"
        />
      </div>
    </div>

    <div v-if="item" class="grid">
      <!-- Left Column: Product Details -->
      <div class="col-12 lg:col-8">
        <div class="glass-panel p-4 mb-4">
          <div class="flex align-items-center gap-2 mb-4">
            <i class="pi pi-box text-primary text-xl"></i>
            <h2 class="text-xl font-semibold text-white m-0">Product Details</h2>
          </div>

          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 text-sm mb-2 block">Medicine Name</label>
              <InputText
                v-model="item.name"
                class="w-full glass-input"
                placeholder="e.g. Paracetamol"
              />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 text-sm mb-2 block">Brand Name</label>
              <InputText
                v-model="item.brandName"
                class="w-full glass-input"
                placeholder="e.g. Cetamol"
              />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 text-sm mb-2 block">Category</label>
              <InputText
                v-model="item.category"
                class="w-full glass-input"
                placeholder="e.g. Analgesic"
              />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 text-sm mb-2 block">Batch Number</label>
              <InputText
                v-model="item.batchNo"
                class="w-full glass-input"
                placeholder="Batch #123"
              />
            </div>
            <div class="field col-12">
              <label class="text-gray-300 text-sm mb-2 block">Shelf Location</label>
              <InputText
                v-model="item.shelfLocation"
                class="w-full glass-input"
                placeholder="e.g. Rack A, Shelf 2"
              />
            </div>
          </div>
        </div>

        <!-- Pricing & Stock -->
        <div class="glass-panel p-4">
          <div class="flex align-items-center gap-2 mb-4">
            <i class="pi pi-tag text-primary text-xl"></i>
            <h2 class="text-xl font-semibold text-white m-0">Pricing & Stock</h2>
          </div>

          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-4">
              <label class="text-gray-300 text-sm mb-2 block">Quantity</label>
              <InputNumber
                v-model="item.quantity"
                class="w-full glass-input"
                showButtons
                :min="0"
              />
            </div>
            <div class="field col-12 md:col-4">
              <label class="text-gray-300 text-sm mb-2 block">Purchase Price</label>
              <InputNumber
                v-model="item.purchasePrice"
                mode="currency"
                currency="NPR"
                locale="en-NP"
                class="w-full glass-input"
                :min="0"
              />
            </div>
            <div class="field col-12 md:col-4">
              <label class="text-gray-300 text-sm mb-2 block">Selling Price</label>
              <InputNumber
                v-model="item.sellingPrice"
                mode="currency"
                currency="NPR"
                locale="en-NP"
                class="w-full glass-input"
                :min="0"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Settings -->
      <div class="col-12 lg:col-4">
        <div class="glass-panel p-4 h-full">
          <div class="flex align-items-center gap-2 mb-4">
            <i class="pi pi-cog text-primary text-xl"></i>
            <h2 class="text-xl font-semibold text-white m-0">Settings</h2>
          </div>

          <div class="field mb-4">
            <label class="text-gray-300 text-sm mb-2 block">Expiry Date</label>
            <Calendar
              v-model="item.expiryDate"
              dateFormat="yy-mm-dd"
              class="w-full glass-input"
              showIcon
            />
          </div>

          <div class="field mb-4">
            <label class="text-gray-300 text-sm mb-2 block">VAT %</label>
            <InputNumber
              v-model="item.vatPercent"
              suffix="%"
              class="w-full glass-input"
              :min="0"
              :max="100"
            />
          </div>

          <div
            class="field-checkbox flex align-items-center gap-2 p-3 border-1 border-white-alpha-10 border-round bg-white-alpha-5"
          >
            <InputSwitch v-model="item.isControlled" inputId="controlled" />
            <label for="controlled" class="text-white text-sm cursor-pointer select-none"
              >Controlled Substance</label
            >
          </div>
          <small class="block mt-2 text-gray-500">Requires DDA logging if enabled.</small>
        </div>
      </div>
    </div>

    <div v-else class="flex align-items-center justify-content-center min-h-screen">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { database } from '@/database'
import { useNotificationStore } from '@/stores/notification'
import { encryptData, decryptData } from '@/utils/cipher'
import { localAuth } from '@/services/LocalAuthService'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'

import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const staffStore = useStaffStore()
const profileStore = useProfileStore()

const item = ref(null)
const isLoading = ref(false)
const inventoryItem = ref(null) // Hold the WatermelonDB model instance

onMounted(async () => {
  const itemId = route.params.id
  try {
    const fetchedItem = await database.get('inventory').find(itemId)
    inventoryItem.value = fetchedItem

    const raw = fetchedItem._raw || {}
    const name = fetchedItem.name || raw.name
    const brandName = fetchedItem.brandName || raw.brand_name
    const category = fetchedItem.category || raw.category
    const shelfLocation = fetchedItem.shelfLocation || raw.shelf_location
    const quantity = fetchedItem.quantity !== undefined ? fetchedItem.quantity : raw.quantity
    const purchasePrice =
      fetchedItem.purchasePrice !== undefined ? fetchedItem.purchasePrice : raw.purchase_price
    const sellingPrice =
      fetchedItem.sellingPrice !== undefined ? fetchedItem.sellingPrice : raw.selling_price
    const expiryDate = fetchedItem.expiryDate || raw.expiry_date
    const vatPercent =
      fetchedItem.vatPercent !== undefined ? fetchedItem.vatPercent : raw.vat_percent
    const isControlled =
      fetchedItem.isControlled !== undefined ? fetchedItem.isControlled : raw.is_controlled
    const pharmacyId = fetchedItem.pharmacyId || raw.pharmacy_id
    const batchNo = fetchedItem.batchNo || raw.batch_no

    item.value = {
      ...raw,
      id: fetchedItem.id,
      name: decryptData(name),
      brandName: decryptData(brandName),
      category: decryptData(category),
      shelfLocation: decryptData(shelfLocation),
      batchNo: batchNo,
      purchasePrice: purchasePrice,
      sellingPrice: sellingPrice,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      vatPercent: vatPercent,
      isControlled: isControlled,
      pharmacyId: pharmacyId,
      quantity: quantity,
    }
  } catch (error) {
    console.error('Error fetching item:', error)
    notification.showNotification('Item not found.', 'error')
    router.push('/inventory')
  }
})

const updateItem = async () => {
  if (!item.value.name || !item.value.sellingPrice) {
    notification.showNotification('Name and Selling Price are required.', 'error')
    return
  }

  isLoading.value = true

  let userId = null
  const user = localAuth.getCurrentUser()

  if (user) {
    userId = user.id
  } else if (staffStore.activeUser || profileStore.userId) {
    userId = profileStore.userId
  }

  if (!userId) {
    isLoading.value = false
    notification.showNotification('Authentication error.', 'error')
    return
  }

  try {
    await database.write(async () => {
      await inventoryItem.value.update((record) => {
        // Direct write to _raw to bypass broken decorators
        record._raw.name = encryptData(item.value.name)
        record._raw.brand_name = encryptData(item.value.brandName)
        record._raw.category = encryptData(item.value.category)
        record._raw.shelf_location = encryptData(item.value.shelfLocation)
        record._raw.quantity = item.value.quantity
        record._raw.batch_no = item.value.batchNo
        record._raw.purchase_price = item.value.purchasePrice
        record._raw.selling_price = item.value.sellingPrice
        record._raw.expiry_date = item.value.expiryDate
          ? new Date(item.value.expiryDate).getTime()
          : null
        record._raw.vat_percent = item.value.vatPercent
        record._raw.is_controlled = item.value.isControlled
      })
    })

    // Audit Log - TODO: Add audit_logs to WatermelonDB
    // await dataService.create('audit_logs', { ... })

    notification.showNotification(`'${item.value.name}' has been updated!`)
    router.push('/inventory')
  } catch (error) {
    console.error(error)
    notification.showNotification('Failed to update item.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
</style>
