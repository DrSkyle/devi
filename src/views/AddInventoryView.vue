<template>
  <div class="max-w-5xl mx-auto p-4">
    <!-- Header -->
    <div class="mb-6">
      <RouterLink
        to="/inventory"
        class="no-underline flex align-items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3"
      >
        <i class="pi pi-arrow-left"></i>
        <span>Back to Inventory</span>
      </RouterLink>
      <h1 class="text-4xl font-thin text-white mb-2">Add New Stock</h1>
      <p class="text-gray-400">Register a new medicine batch into the system.</p>
    </div>

    <form @submit.prevent="saveNewItem" class="grid">
      <!-- Left Column: Basic Info -->
      <div class="col-12 xl:col-8">
        <div class="glass-panel p-4 mb-4">
          <h2 class="text-xl font-bold text-white mb-4 flex align-items-center gap-2">
            <i class="pi pi-info-circle text-primary"></i>
            Product Details
          </h2>

          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Medicine Name</label>
              <InputText
                v-model="newItem.name"
                placeholder="e.g. Paracetamol"
                required
                class="w-full"
              />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Brand Name</label>
              <InputText v-model="newItem.brandName" placeholder="e.g. Niko Plus" class="w-full" />
            </div>

            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Strength / Measurement</label>
              <InputText v-model="newItem.measurement" placeholder="e.g. 500mg" class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Form / Type</label>
              <Select
                v-model="newItem.form"
                :options="formOptions"
                placeholder="Select Form"
                class="w-full"
              />
            </div>

            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Category</label>
              <InputText v-model="newItem.category" placeholder="e.g. Antibiotic" class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-gray-300 mb-2 block">Supplier</label>
              <Select
                v-model="newItem.supplierId"
                :options="suppliers"
                optionLabel="name"
                optionValue="id"
                placeholder="Select Supplier"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="glass-panel p-4">
          <h2 class="text-xl font-bold text-white mb-4 flex align-items-center gap-2">
            <i class="pi pi-tag text-primary"></i>
            Pricing & Stock
          </h2>

          <div class="grid formgrid p-fluid">
            <div class="field col-12 sm:col-6">
              <label class="text-gray-300 mb-2 block">Quantity</label>
              <InputNumber
                v-model="newItem.quantity"
                showButtons
                :min="0"
                placeholder="0"
                class="w-full"
              />
            </div>
            <div class="field col-12 sm:col-6">
              <label class="text-gray-300 mb-2 block">Batch Number</label>
              <InputText v-model="newItem.batchNo" placeholder="Batch #123" class="w-full" />
            </div>

            <div class="field col-12 sm:col-6">
              <label class="text-gray-300 mb-2 block">Purchase Price</label>
              <InputNumber
                v-model="newItem.purchasePrice"
                mode="currency"
                currency="NPR"
                locale="en-IN"
                placeholder="0.00"
                class="w-full"
              />
            </div>
            <div class="field col-12 sm:col-6">
              <label class="text-gray-300 mb-2 block">Selling Price</label>
              <InputNumber
                v-model="newItem.sellingPrice"
                mode="currency"
                currency="NPR"
                locale="en-IN"
                placeholder="0.00"
                class="w-full"
              />
            </div>

            <div class="field col-12">
              <label class="text-gray-300 mb-2 block">Expiry Date</label>
              <Calendar
                v-model="newItem.expiryDate"
                dateFormat="yy-mm-dd"
                showIcon
                class="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Settings & Actions -->
      <div class="col-12 xl:col-4">
        <div class="glass-panel p-4 mb-4">
          <h2 class="text-xl font-bold text-white mb-4 flex align-items-center gap-2">
            <i class="pi pi-cog text-primary"></i>
            More Information
          </h2>

          <div class="field mb-4">
            <label class="text-gray-300 mb-2 block">Shelf Location</label>
            <InputText v-model="newItem.shelfLocation" placeholder="e.g. Rack A1" class="w-full" />
          </div>

          <div class="field mb-4">
            <label class="text-gray-300 mb-2 block">VAT %</label>
            <InputNumber v-model="newItem.vatPercent" suffix="%" placeholder="0" class="w-full" />
          </div>

          <div
            class="field flex align-items-center justify-content-between mb-2 p-3 border-round transition-colors transition-duration-300"
            :class="newItem.isControlled ? 'bg-red-900 border-red-500 border-1' : 'surface-ground'"
          >
            <div>
              <label class="text-white font-medium m-0 block">Controlled Substance (DDA)</label>
              <small v-if="newItem.isControlled" class="text-red-200 block mt-1">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                Strictly tracked in Narcotic Register.
              </small>
            </div>
            <InputSwitch v-model="newItem.isControlled" />
          </div>
          <small v-if="!newItem.isControlled" class="text-gray-500 block mb-4">
            Enable for narcotics/psychotropics.
          </small>
        </div>

        <Button
          type="submit"
          label="Save to Inventory"
          icon="pi pi-check"
          :loading="isLoading"
          class="w-full p-button-lg font-bold shadow-4"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'
import { encryptData } from '@/utils/cipher'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'

import { useStaffStore } from '@/stores/staff'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()
const staffStore = useStaffStore()
const isLoading = ref(false)
const suppliers = ref([])

const formOptions = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment',
  'Drops',
  'Powder',
  'Sample',
  'Other',
]

const newItem = reactive({
  name: '',
  measurement: '',
  brandName: '',
  form: '',
  category: '',
  batchNo: '',
  quantity: null,
  purchasePrice: null,
  sellingPrice: null,
  expiryDate: null,
  supplierId: null,
  vatPercent: 0,
  shelfLocation: '',
  isControlled: false,
})

onMounted(async () => {
  const pharmacyId = profileStore.pharmacyId
  if (pharmacyId) {
    const suppliersCollection = database.get('suppliers')
    const suppliersData = await suppliersCollection
      .query(Q.where('pharmacy_id', pharmacyId))
      .fetch()
    suppliers.value = suppliersData.map((s) => ({
      id: s.id,
      name: s.name,
      pharmacyId: s.pharmacyId,
    }))
  }

  // Pre-fill from query params (Crowdsourced Catalog)
  const { query } = router.currentRoute.value
  if (query.name) newItem.name = query.name
  if (query.brand) newItem.brandName = query.brand
  if (query.form) newItem.form = query.form
  if (query.category) newItem.category = query.category
})

const saveNewItem = async () => {
  if (!newItem.name || !newItem.expiryDate) {
    notification.showNotification('Please fill in all required fields.', 'error')
    return
  }

  if (newItem.isControlled && !newItem.batchNo) {
    notification.showNotification('Batch Number is required for Controlled Substances.', 'error')
    return
  }

  isLoading.value = true

  // Auth check with fallback for offline staff
  // Use persistent staff store or profile store
  const userId = staffStore.activeUserId || profileStore.userId

  if (!userId) {
    isLoading.value = false
    notification.showNotification('Authentication error.', 'error')
    return
  }

  let pharmacyId = profileStore.pharmacyId

  // Robust Fallback: If ID is missing, try to re-fetch or load from local DB
  if (!profileStore.pharmacyId) {
    console.warn('Pharmacy ID missing in store, attempting to recover...')
    await profileStore.loadFromLocalDatabase()
  }
  pharmacyId = profileStore.pharmacyId


  if (!pharmacyId) {
    notification.showNotification(
      'Invalid Pharmacy ID. Please check your internet connection or re-login.',
      'error',
    )
    isLoading.value = false
    return
  }

  try {
    console.log('AddInventoryView: Saving new item...', newItem)
    await database.write(async () => {
      const createdItem = await database.get('inventory').create((item) => {
        // Direct write to _raw to bypass broken decorators
        item._raw.pharmacy_id = pharmacyId
        item._raw.supplier_id = newItem.supplierId
        item._raw.name = encryptData(
          newItem.name + (newItem.measurement ? ` ${newItem.measurement}` : ''),
        )
        item._raw.brand_name = encryptData(newItem.brandName)
        item._raw.form = encryptData(newItem.form)
        item._raw.category = encryptData(newItem.category)
        item._raw.shelf_location = encryptData(newItem.shelfLocation)
        item._raw.quantity = newItem.quantity
        item._raw.batch_no = newItem.batchNo
        item._raw.purchase_price = newItem.purchasePrice
        item._raw.selling_price = newItem.sellingPrice
        item._raw.vat_percent = newItem.vatPercent
        item._raw.expiry_date = newItem.expiryDate ? new Date(newItem.expiryDate).getTime() : null
        item._raw.is_controlled = newItem.isControlled

        // Also set model props just in case (though likely ignored if decorators are broken)
        item.pharmacyId = pharmacyId
        item.supplierId = newItem.supplierId
        item.quantity = newItem.quantity
      })
      console.log('AddInventoryView: Item created:', createdItem._raw)
    })

    // Audit Log - TODO: Add audit_logs table to WatermelonDB schema
    // await dataService.create('audit_logs', { ... })

    notification.showNotification(`New batch for '${newItem.name}' added to inventory!`)
    router.push('/inventory')
  } catch (err) {
    notification.showNotification('Failed to save item. Please try again.', 'error')
    console.error('Error saving new inventory item:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Minimal scoped styles, relying on PrimeVue and utility classes */
</style>
