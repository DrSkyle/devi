<template>
  <div class="add-prescription-container">
    <header class="view-header">
      <RouterLink to="/prescriptions" class="back-link">&larr; Back to Prescription Hub</RouterLink>
      <h1 class="title">Prescription Composer</h1>
      <p class="subtitle">A streamlined process to create and manage patient prescriptions.</p>
    </header>

    <div class="card">
      <div v-if="!selectedCustomer" class="patient-selection-step">
        <h2 class="step-title">Step 1: Find or Create a Patient</h2>
        <div class="search-box">
          <input
            type="search"
            label="Search for an existing patient"
            placeholder="Start typing a name or phone number..."
            v-model="customerSearch"
            @input="debouncedSearchCustomers"
          />
        </div>
        <div class="customer-list-container">
          <ul v-if="customerSearchResults.length > 0" class="customer-list">
            <li
              v-for="customer in customerSearchResults"
              :key="customer._id"
              @click="selectCustomer(customer)"
            >
              <span>{{ decryptData(customer.name) }}</span>
              <small>{{ decryptData(customer.phone) }}</small>
            </li>
          </ul>
          <div v-else-if="customerSearch.length > 2 && !isSearchingCustomers" class="no-results">
            <p>No patient found matching "{{ customerSearch }}".</p>
            <button @click="openNewCustomerModal" class="button">
              + Create New Patient: "{{ customerSearch }}"
            </button>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="savePrescription" class="prescription-form">
        <div class="selected-customer-header">
          <div>
            <h2 class="step-title">Step 2: Compose Prescription</h2>
            <p class="for-patient">
              For: <strong>{{ selectedCustomer.name }}</strong>
            </p>
          </div>
          <button type="button" @click="resetCustomer" class="button-secondary change-btn">
            Change Patient
          </button>
        </div>

        <div class="form-group">
          <label for="doctorName">Prescribing Doctor's Name</label>
          <input
            id="doctorName"
            type="text"
            v-model="prescriptionData.doctorName"
            placeholder="e.g., Dr. Jane Smith"
            required
          />
        </div>

        <h3 class="medicines-title">Medicines</h3>
        <div v-for="(item, index) in prescriptionData.items" :key="index" class="medicine-item">
          <div class="search-wrapper">
            <label :for="`med-name-${index}`">Medicine Name</label>
            <input
              :id="`med-name-${index}`"
              type="text"
              v-model="item.name"
              placeholder="Start typing medicine name..."
              @input="(e) => searchInventory(e.target.value, index)"
              required
            />
            <ul
              v-if="searchResults[index] && searchResults[index].length > 0"
              class="search-results"
            >
              <li
                v-for="result in searchResults[index]"
                :key="result.key"
                @click="selectMedicine(index, result.name)"
              >
                {{ result.name }}
              </li>
            </ul>
          </div>
          <div class="quantity-wrapper">
            <label :for="`med-qty-${index}`">Qty</label>
            <input
              :id="`med-qty-${index}`"
              type="number"
              v-model.number="item.quantity"
              min="1"
              required
            />
          </div>
          <button
            type="button"
            @click="removeMedicine(index)"
            class="remove-med-btn"
            aria-label="Remove Medicine"
          >
            &times;
          </button>
        </div>

        <button type="button" @click="addMedicine" class="button-secondary add-med-btn">
          + Add Another Medicine
        </button>

        <div class="form-actions">
          <button type="submit" class="button" :disabled="isSaving">
            <span class="submit-icon">✓</span>
            {{ isSaving ? 'Saving...' : 'Finalize & Save Prescription' }}
          </button>
        </div>
      </form>
    </div>

    <div
      v-if="isNewCustomerModalOpen"
      class="modal-overlay"
      @click.self="isNewCustomerModalOpen = false"
    >
      <div class="modal-content card">
        <h2>Add New Patient</h2>
        <p class="modal-subtitle">Create a new record for this patient.</p>
        <form @submit.prevent="addNewCustomer" class="modal-form">
          <div class="form-group">
            <label for="new-name">Patient Name</label>
            <input id="new-name" type="text" v-model="newCustomer.name" required />
          </div>
          <div class="form-group">
            <label for="new-phone">Phone (Optional)</label>
            <input id="new-phone" type="tel" v-model="newCustomer.phone" />
          </div>
          <div class="form-group">
            <label for="new-address">Address (Optional)</label>
            <input id="new-address" type="text" v-model="newCustomer.address" />
          </div>
          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="isNewCustomerModalOpen = false">
              Cancel
            </button>
            <button type="submit">Save Patient</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { usePromptStore } from '@/stores/prompt' // Import the prompt store
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'

const isSaving = ref(false)
const router = useRouter()
const route = useRoute()
const notification = useNotificationStore()
const prompt = usePromptStore() // Initialize the prompt store
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
let customerSearchDebounce
let inventorySearchDebounce

const fetchAllCustomers = async () => {
  if (profileStore.pharmacyId) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('pharmacy_id', profileStore.pharmacyId)
    if (data) allCustomers.value = data
  }
}

onActivated(async () => {
  resetCustomer()
  await fetchAllCustomers()
  const customerId = route.query.customerId
  if (customerId) {
    const customer = allCustomers.value.find((c) => c._id === Number(customerId))
    if (customer) await selectCustomer(customer)
  }
})

const debouncedSearchCustomers = () => {
  clearTimeout(customerSearchDebounce)
  isSearchingCustomers.value = true
  customerSearchDebounce = setTimeout(() => {
    if (customerSearch.value.length < 1) {
      customerSearchResults.value = []
      isSearchingCustomers.value = false
      return
    }
    customerSearchResults.value = allCustomers.value.filter(
      (c) =>
        decryptData(c.name)?.toLowerCase().includes(customerSearch.value.toLowerCase()) ||
        decryptData(c.phone)?.includes(customerSearch.value),
    )
    isSearchingCustomers.value = false
  }, 300)
}

const selectCustomer = async (customer) => {
  const { data: existingPrescriptions } = await supabase
    .from('prescriptions')
    .select('_id')
    .eq('customer_id', customer._id)

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
        selectedCustomer.value = { _id: customer._id, name: decryptData(customer.name) }
        customerSearch.value = ''
        customerSearchResults.value = []
      }
    }
  } else {
    selectedCustomer.value = { _id: customer._id, name: decryptData(customer.name) }
    customerSearch.value = ''
    customerSearchResults.value = []
  }
}

const resetCustomer = () => {
  selectedCustomer.value = null
  prescriptionData.value = { doctorName: '', items: [{ name: '', quantity: 1 }] }
}

const openNewCustomerModal = () => {
  newCustomer.name = customerSearch.value
  isNewCustomerModalOpen.value = true
}

const addNewCustomer = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !profileStore.pharmacyId) return

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: encryptData(newCustomer.name),
      phone: encryptData(newCustomer.phone),
      address: encryptData(newCustomer.address),
      balance: 0,
      user_id: user.id,
      pharmacy_id: profileStore.pharmacyId,
    })
    .select()
    .single()

  if (error) {
    notification.showNotification('Error saving patient.', 'error')
    return
  }

  notification.showNotification('Patient added.')
  await fetchAllCustomers()
  await selectCustomer(data)
  isNewCustomerModalOpen.value = false
}

const searchInventory = (name, index) => {
  clearTimeout(inventorySearchDebounce)
  inventorySearchDebounce = setTimeout(async () => {
    if (!name || name.length < 2) {
      searchResults.value[index] = []
      return
    }
    const { data } = await supabase
      .from('inventory')
      .select('name')
      .eq('pharmacy_id', profileStore.pharmacyId)
      .ilike('name', `%${encryptData(name)}%`)

    if (data) {
      const uniqueNames = [...new Set(data.map((i) => decryptData(i.name)))]
      searchResults.value[index] = uniqueNames.map((n) => ({ name: n, key: n }))
    }
  }, 300)
}

const selectMedicine = (index, name) => {
  prescriptionData.value.items[index].name = name
  searchResults.value[index] = []
}

const addMedicine = () => {
  prescriptionData.value.items.push({ name: '', quantity: 1 })
}

const removeMedicine = (index) => {
  if (prescriptionData.value.items.length > 1) {
    prescriptionData.value.items.splice(index, 1)
  } else {
    notification.showNotification('A prescription must have at least one medicine.', 'error')
  }
}

const savePrescription = async () => {
  isSaving.value = true
  const formData = prescriptionData.value
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !profileStore.pharmacyId) {
    notification.showNotification('Cannot save, please log in again.', 'error')
    isSaving.value = false
    return
  }

  try {
    const cleanedItems = formData.items.filter(
      (item) => item.name && item.name.trim() !== '' && item.quantity > 0,
    )
    if (cleanedItems.length === 0) {
      notification.showNotification('Please add at least one medicine.', 'error')
      isSaving.value = false
      return
    }

    const { error } = await supabase.from('prescriptions').insert({
      customer_id: selectedCustomer.value._id,
      patient_name: selectedCustomer.value.name,
      doctor_name: formData.doctorName,
      items: cleanedItems.map((i) => ({ name: encryptData(i.name), quantity: i.quantity })),
      user_id: user.id,
      pharmacy_id: profileStore.pharmacyId,
    })
    if (error) throw error

    notification.showNotification('Prescription saved!')
    router.push(`/customers/${selectedCustomer.value._id}`)
  } catch (error) {
    console.error('Error saving prescription:', error)
    notification.showNotification('Failed to save prescription.', 'error')
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
</style>
