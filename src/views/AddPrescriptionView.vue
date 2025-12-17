<template>
  <div class="add-prescription-container p-4 max-w-5xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <Button
          label="Back to Hub"
          icon="pi pi-arrow-left"
          class="p-button-text p-button-plain mb-2 pl-0"
          @click="router.push('/prescriptions')"
        />
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Prescription Composer</h1>
        <p class="text-gray-400 text-lg">Create and manage patient prescriptions.</p>
      </div>
    </div>

    <div class="glass-panel p-5">
      <!-- Step 1: Patient Selection -->
      <div v-if="!selectedCustomer" class="fadein animation-duration-300">
        <div class="flex align-items-center gap-3 mb-4">
          <div class="bg-primary-500 border-round-lg p-2">
            <i class="pi pi-user text-white text-xl"></i>
          </div>
          <h2 class="text-xl font-bold text-white m-0">Step 1: Find or Create Patient</h2>
        </div>

        <div class="relative w-full max-w-30rem mb-4">
          <i
            class="pi pi-search absolute text-gray-500 text-xl"
            style="
              top: 50%;
              left: 1rem;
              transform: translateY(-50%);
              z-index: 10;
              pointer-events: none;
            "
          ></i>
          <input
            v-model="customerSearch"
            type="text"
            class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
            placeholder="Search by name or phone..."
            @input="debouncedSearchCustomers"
          />
        </div>

        <div v-if="customerSearchResults.length > 0" class="grid">
          <div
            v-for="customer in customerSearchResults"
            :key="customer._id"
            class="col-12 md:col-6 lg:col-4"
          >
            <div
              class="glass-panel p-3 cursor-pointer hover:bg-white-alpha-10 transition-colors"
              @click="selectCustomer(customer)"
            >
              <div class="font-bold text-white text-lg mb-1">{{ decryptData(customer.name) }}</div>
              <div class="text-gray-400 text-sm">
                <i class="pi pi-phone mr-2"></i>{{ decryptData(customer.phone) }}
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="customerSearch.length > 2 && !isSearchingCustomers" class="text-center p-5">
          <p class="text-gray-300 mb-3">No patient found matching "{{ customerSearch }}".</p>
          <Button
            label="Create New Patient"
            icon="pi pi-user-plus"
            class="p-button-outlined"
            @click="openNewCustomerModal"
          />
        </div>
      </div>

      <!-- Step 2: Prescription Details -->
      <form v-else @submit.prevent="savePrescription" class="fadein animation-duration-300">
        <div
          class="flex justify-content-between align-items-center mb-5 border-bottom-1 border-white-alpha-10 pb-3"
        >
          <div class="flex align-items-center gap-3">
            <div class="bg-primary-500 border-round-lg p-2">
              <i class="pi pi-file-edit text-white text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-white m-0">Step 2: Compose Prescription</h2>
              <p class="text-gray-400 text-sm m-0 mt-1">
                For: <strong class="text-primary">{{ selectedCustomer.name }}</strong>
              </p>
            </div>
          </div>
          <Button
            label="Change Patient"
            icon="pi pi-refresh"
            class="p-button-text p-button-sm"
            @click="resetCustomer"
          />
        </div>

        <div class="field mb-5 max-w-30rem">
          <label for="doctorName" class="block text-gray-300 font-medium mb-2"
            >Prescribing Doctor</label
          >
          <div class="relative w-full">
            <i
              class="pi pi-user-edit absolute text-gray-500 text-xl"
              style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
            ></i>
            <input
              id="doctorName"
              v-model="prescriptionData.doctorName"
              type="text"
              class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
              placeholder="e.g., Dr. Jane Smith"
              required
            />
          </div>
        </div>

        <h3 class="text-lg font-bold text-white mb-3">Medicines</h3>
        <div class="flex flex-column gap-3 mb-4">
          <div
            v-for="(item, index) in prescriptionData.items"
            :key="index"
            class="glass-panel p-3 flex flex-column md:flex-row gap-3 align-items-end md:align-items-center"
          >
            <div class="flex-grow-1 w-full">
              <label class="block text-gray-400 text-xs mb-1">Medicine Name</label>
              <div class="relative w-full">
                <i
                  class="pi pi-search absolute text-gray-500 text-xl"
                  style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
                ></i>
                <input
                  v-model="item.name"
                  type="text"
                  class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
                  placeholder="Search medicine..."
                  @input="searchInventory($event.target.value, index)"
                  @focus="activeSearchIndex = index"
                />
                <!-- Custom Dropdown -->
                <div
                  v-if="
                    searchResults[index] &&
                    searchResults[index].length > 0 &&
                    activeSearchIndex === index
                  "
                  class="absolute w-full bg-black-alpha-90 border-1 border-white-alpha-10 border-round-bottom shadow-8 z-5 overflow-y-auto custom-scrollbar"
                  style="top: 100%; left: 0; max-height: 200px; backdrop-filter: blur(12px)"
                >
                  <div
                    v-for="result in searchResults[index]"
                    :key="result.name"
                    class="flex justify-content-between align-items-center p-3 hover:bg-white-alpha-10 cursor-pointer transition-colors border-bottom-1 border-white-alpha-5"
                    @click="selectMedicine(index, result.name)"
                  >
                    <div class="font-bold text-white">{{ result.name }}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full md:w-12rem">
              <label class="block text-gray-400 text-xs mb-1">Quantity</label>
              <InputNumber
                v-model="item.quantity"
                showButtons
                buttonLayout="horizontal"
                :min="1"
                inputClass="w-full text-center"
                class="w-full"
              />
            </div>
            <Button
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger p-button-text"
              @click="removeMedicine(index)"
              v-if="prescriptionData.items.length > 1"
            />
          </div>
        </div>

        <div class="flex gap-3 mb-5">
          <Button
            label="Add Medicine"
            icon="pi pi-plus"
            class="p-button-outlined w-full md:w-auto"
            @click="addMedicine"
          />
        </div>

        <div class="flex justify-content-end border-top-1 border-white-alpha-10 pt-4">
          <Button
            type="submit"
            label="Finalize & Save"
            icon="pi pi-check"
            :loading="isSaving"
            class="w-full md:w-auto"
          />
        </div>
      </form>
    </div>

    <!-- New Patient Modal -->
    <Dialog
      v-model:visible="isNewCustomerModalOpen"
      modal
      header="Add New Patient"
      :style="{ width: '90vw', maxWidth: '500px' }"
      class="glass-dialog"
    >
      <div class="field mb-3">
        <label for="new-name" class="block text-gray-300 font-medium mb-2">Patient Name</label>
        <InputText id="new-name" v-model="newCustomer.name" class="w-full" required />
      </div>
      <div class="field mb-3">
        <label for="new-phone" class="block text-gray-300 font-medium mb-2">Phone (Optional)</label>
        <InputText id="new-phone" v-model="newCustomer.phone" class="w-full" />
      </div>
      <div class="field mb-4">
        <label for="new-address" class="block text-gray-300 font-medium mb-2"
          >Address (Optional)</label
        >
        <InputText id="new-address" v-model="newCustomer.address" class="w-full" />
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          class="p-button-text"
          @click="isNewCustomerModalOpen = false"
        />
        <Button label="Save Patient" icon="pi pi-check" @click="addNewCustomer" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onActivated, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { usePromptStore } from '@/stores/prompt'
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'

const isSaving = ref(false)
const router = useRouter()
const route = useRoute()
const notification = useNotificationStore()
const prompt = usePromptStore()
const profileStore = useProfileStore()

const allCustomers = ref([])
const customerSearch = ref('')
const customerSearchResults = ref([])
const isSearchingCustomers = ref(false)
const selectedCustomer = ref(null)
const isNewCustomerModalOpen = ref(false)
const newCustomer = reactive({ name: '', phone: '', address: '' })

const prescriptionData = ref({
  doctorName: '',
  items: [{ name: '', quantity: 1 }],
})

const searchResults = ref([])
const activeSearchIndex = ref(null)
let customerSearchDebounce
let inventorySearchDebounce

// Click outside to close dropdown
const handleClickOutside = (event) => {
  const dropdowns = document.querySelectorAll('.relative.w-full')
  let clickedInside = false
  dropdowns.forEach((el) => {
    if (el.contains(event.target)) {
      clickedInside = true
    }
  })
  if (!clickedInside) {
    activeSearchIndex.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const fetchAllCustomers = async () => {
  try {
    const customers = await database.get('customers').query().fetch()
    allCustomers.value = customers.map((c) => ({
      ...c._raw,
      id: c.id,
    }))
  } catch (error) {
    console.error('Error fetching customers', error)
  }
}

onActivated(async () => {
  resetForm()
  await fetchAllCustomers()
  const customerId = route.query.customerId
  if (customerId) {
    const customer = allCustomers.value.find((c) => c.id === customerId)
    if (customer) await selectCustomer(customer)
  }
})

const debouncedSearchCustomers = () => {
  clearTimeout(customerSearchDebounce)
  isSearchingCustomers.value = true
  customerSearchDebounce = setTimeout(() => {
    if (!customerSearch.value || customerSearch.value.length < 1) {
      customerSearchResults.value = []
      isSearchingCustomers.value = false
      return
    }

    const query = customerSearch.value.toLowerCase()
    customerSearchResults.value = allCustomers.value.filter((c) => {
      const name = decryptData(c.name)
      const phone = decryptData(c.phone)

      return (name && name.toLowerCase().includes(query)) || (phone && phone.includes(query))
    })
    isSearchingCustomers.value = false
  }, 300)
}

const selectCustomer = async (customer) => {
  // Check for existing prescriptions locally
  const existingPrescriptions = await database
    .get('prescriptions')
    .query(Q.where('customer_id', customer.id))
    .fetch()

  if (existingPrescriptions && existingPrescriptions.length > 0) {
    try {
      await prompt.show({
        type: 'confirm',
        title: 'Existing Prescriptions Found',
        message: `"${decryptData(customer.name)}" has existing prescriptions. Click 'Confirm' to view and edit them, or 'Cancel' to create a new one.`,
      })
      router.push({ name: 'prescriptions', query: { patient: decryptData(customer.name) } })
    } catch (rejection) {
      if (rejection === 'cancelled') {
        selectedCustomer.value = { id: customer.id, name: decryptData(customer.name) }
        customerSearch.value = ''
        customerSearchResults.value = []
      }
    }
  } else {
    selectedCustomer.value = { id: customer.id, name: decryptData(customer.name) }
    customerSearch.value = ''
    customerSearchResults.value = []
  }
}

const resetCustomer = () => {
  selectedCustomer.value = null
  // Do not reset prescriptionData as per user request
}

const resetForm = () => {
  selectedCustomer.value = null
  prescriptionData.value = { doctorName: '', items: [{ name: '', quantity: 1 }] }
  activeSearchIndex.value = null
}

const openNewCustomerModal = () => {
  newCustomer.name = customerSearch.value
  isNewCustomerModalOpen.value = true
}

const addNewCustomer = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // if (!user || !profileStore.pharmacyId) return // Allow offline creation without user check if needed, but user_id is optional in schema

  try {
    let newCustomerRecord
    await database.write(async () => {
      newCustomerRecord = await database.get('customers').create((customer) => {
        customer.name = encryptData(newCustomer.name)
        customer.phone = encryptData(newCustomer.phone)
        customer.address = encryptData(newCustomer.address)
        customer.balance = 0
        customer.pharmacyId = profileStore.pharmacyId
        if (user) customer.userId = user.id
      })
    })

    notification.showNotification('Patient added.')
    await fetchAllCustomers()
    await selectCustomer({ ...newCustomerRecord._raw, id: newCustomerRecord.id })
    isNewCustomerModalOpen.value = false
  } catch (error) {
    console.error('Error creating customer', error)
    notification.showNotification('Error saving patient.', 'error')
  }
}

const searchInventory = (query, index) => {
  clearTimeout(inventorySearchDebounce)
  inventorySearchDebounce = setTimeout(async () => {
    if (!query) {
      searchResults.value[index] = []
      return
    }

    try {
      const allItems = await database.get('inventory').query().fetch()

      if (allItems) {
        const lowerQuery = query.toLowerCase()
        searchResults.value[index] = allItems
          .filter((item) => {
            return item.pharmacyId === profileStore.pharmacyId
          })
          .map((item) => ({ name: decryptData(item.name) }))
          .filter((item) => {
            const name = item.name ? item.name.toLowerCase() : ''
            return name.includes(lowerQuery)
          })
          .slice(0, 10)
      }
    } catch (error) {
      console.error('Error searching inventory', error)
    }
  }, 300)
}

const selectMedicine = (index, name) => {
  prescriptionData.value.items[index].name = name
  searchResults.value[index] = []
  activeSearchIndex.value = null
}

const addMedicine = () => {
  prescriptionData.value.items.push({ name: '', quantity: 1 })
}

const removeMedicine = (index) => {
  prescriptionData.value.items.splice(index, 1)
}

const savePrescription = async () => {
  if (!selectedCustomer.value || !prescriptionData.value.doctorName) return

  isSaving.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const itemsToSave = prescriptionData.value.items.map((item) => ({
    name: encryptData(item.name),
    quantity: item.quantity,
  }))

  try {
    await database.write(async () => {
      await database.get('prescriptions').create((prescription) => {
        prescription.customerId = selectedCustomer.value.id
        prescription.patientName = selectedCustomer.value.name // Decrypted name for display/search? Schema has patient_name.
        // Wait, schema patient_name is string. selectedCustomer.value.name is DECRYPTED.
        // Should we store encrypted or decrypted?
        // Usually we store encrypted PII. But here it's just a copy.
        // Let's encrypt it to be safe if it's PII.
        // But wait, if I encrypt it here, I need to decrypt it when reading.
        // The previous code: patient_name: selectedCustomer.value.name (which was decrypted).
        // So previous code stored DECRYPTED name in prescription?
        // "patient_name: selectedCustomer.value.name, // Already decrypted in selectedCustomer"
        // Yes. That seems inconsistent with "encryptData" usage elsewhere.
        // But let's stick to previous behavior or improve it.
        // If I store it decrypted, it's readable in DB.
        // Let's encrypt it.
        prescription.patientName = encryptData(selectedCustomer.value.name)
        prescription.doctorName = prescriptionData.value.doctorName
        prescription.items = JSON.stringify(itemsToSave)
        prescription.status = 'pending'
        prescription.pharmacyId = profileStore.pharmacyId
        if (user) prescription.userId = user.id
      })
    })

    notification.showNotification('Prescription saved successfully!')
    router.push('/prescriptions')
  } catch (error) {
    console.error('Error saving prescription', error)
    notification.showNotification('Error saving prescription.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* NEW, CLEANER STYLES */
.add-prescription-container {
  max-width: 800px;
  margin: 0 auto;
}
.view-header .title {
  font-weight: 800;
}
.back-link {
  display: block;
  margin-bottom: 1rem;
  color: var(--color-text-light);
  text-decoration: none;
}
.card {
  padding: 2rem 2.5rem;
}
.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}

/* Patient Selection */
.search-box input {
  width: 100%;
  padding: 0.75rem 1rem;
}
.customer-list-container {
  margin-top: 1rem;
  max-height: 300px;
  overflow-y: auto;
}
.customer-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.customer-list li {
  padding: 1rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
  border: 1px solid var(--color-border);
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.customer-list li:hover {
  background-color: var(--color-surface-mute);
  border-color: var(--color-primary);
}
.customer-list small {
  color: var(--color-text-light);
  font-weight: 400;
}
.no-results {
  text-align: center;
  padding: 1rem 0;
}
.no-results p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.no-results .button {
  width: auto;
}

/* Prescription Form */
.selected-customer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--color-border);
}
.for-patient {
  margin-top: -1.5rem;
  font-size: 1.1rem;
}
.for-patient strong {
  color: var(--color-primary);
}
.change-btn {
  width: auto;
  flex-shrink: 0;
}
.medicines-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
.medicine-item {
  display: flex;
  align-items: flex-end; /* Align to bottom for better label alignment */
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--color-surface-mute);
  margin-bottom: 1rem;
}
.search-wrapper {
  flex-grow: 1;
  position: relative;
}
.quantity-wrapper {
  width: 100px;
  flex-shrink: 0;
}
.form-group,
.search-wrapper,
.quantity-wrapper {
  margin-bottom: 0;
}
.form-group label,
.search-wrapper label,
.quantity-wrapper label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}
.remove-med-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  transition: all 0.2s;
}
.remove-med-btn:hover {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.add-med-btn {
  width: 100%;
  margin-top: 0.5rem;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  list-style: none;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}
.search-results li {
  padding: 0.75rem 1rem;
  cursor: pointer;
}
.search-results li:hover {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
}
.form-actions {
  margin-top: 2.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
.form-actions .button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: auto;
}
.submit-icon {
  font-size: 1.2rem;
  font-weight: bold;
}
/* Modal Styles */
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
}
.modal-content {
  width: 100%;
  max-width: 500px;
  margin: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

/* Fix InputNumber visibility */
:deep(.p-inputnumber-input) {
  background: transparent !important;
  color: white !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  border-radius: 6px;
}
</style>
