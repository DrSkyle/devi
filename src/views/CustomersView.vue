<template>
  <div class="customers-container">
    <header class="view-header">
      <h1 class="title">Customer Hub</h1>
      <p class="subtitle">A unified view of all your patients and Khata accounts.</p>
    </header>

    <div class="actions-header">
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="Search by name or phone..." />
      </div>
      <button @click="isModalOpen = true" class="button">+ New Customer</button>
    </div>

    <div v-if="filteredCustomers.length > 0" class="customers-grid">
      <RouterLink
        v-for="customer in filteredCustomers"
        :key="customer._id"
        :to="`/customers/${customer._id}`"
        class="customer-card card"
      >
        <div class="card-header">
          <span class="customer-name">{{ customer.name }}</span>
          <div class="customer-tags">
            <span v-if="customer.isKhata" class="tag khata">Khata</span>
            <span v-if="customer.hasPrescription" class="tag prescription">Rx</span>
          </div>
        </div>
        <div class="card-content">
          <span class="customer-phone">{{ customer.phone || 'No contact info' }}</span>
        </div>
        <div class="card-footer" v-if="customer.isKhata">
          <span class="balance-label">Balance</span>
          <span :class="['balance-amount', { 'has-balance': customer.balance > 0 }]">
            Rs. {{ customer.balance.toFixed(2) }}
          </span>
        </div>
      </RouterLink>
    </div>
    <div v-else class="empty-state card">
      <h2>No customers found.</h2>
      <p>Click "+ New Customer" to add your first one.</p>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content card">
        <h2>Add New Customer</h2>
        <p class="modal-subtitle">Create a new record for a customer or patient.</p>

        <FormKit type="form" v-model="newCustomer" @submit="addCustomer" :actions="false">
          <FormKit
            type="text"
            name="name"
            label="Customer Name"
            placeholder="John Doe"
            validation="required|length:3"
          />
          <FormKit
            type="tel"
            name="phone"
            label="Phone Number (Optional)"
            placeholder="98********"
            validation="matches:/^[0-9]{10}$/"
            :validation-messages="{
              matches: 'Phone number must be 10 digits.',
            }"
          />
          <FormKit
            type="text"
            name="address"
            label="Address (Optional)"
            placeholder="Dhangadhi, Kailali"
          />
          <FormKit
            type="text"
            name="allergies"
            label="Allergies (Optional)"
            placeholder="e.g., Penicillin, Aspirin"
            help="Separate allergies with a comma."
          />

          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="closeModal">Cancel</button>
            <FormKit type="submit" :disabled="isProcessing">
              {{ isProcessing ? 'Saving...' : 'Save Customer' }}
            </FormKit>
          </div>
        </FormKit>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'

const customers = ref([])
const isModalOpen = ref(false)
const isProcessing = ref(false)
const notification = useNotificationStore()
const searchQuery = ref('')
const profileStore = useProfileStore()

const newCustomer = reactive({ name: '', phone: '', address: '', allergies: '' })

const fetchCustomers = async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (!pharmacyId) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: khataCustomersData } = await supabase
    .from('customers')
    .select('*')
    .eq('pharmacy_id', pharmacyId)

  const { data: prescriptionCustomersData } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('pharmacy_id', pharmacyId)

  const khataCustomers = khataCustomersData || []
  const prescriptionCustomers = prescriptionCustomersData || []
  const customerMap = new Map()

  khataCustomers.forEach((c) => {
    const name = decryptData(c.name)
    if (name) {
      customerMap.set(name.toLowerCase(), {
        _id: c._id,
        name: name,
        phone: decryptData(c.phone),
        isKhata: true,
        hasPrescription: false,
        balance: c.balance || 0,
      })
    }
  })

  prescriptionCustomers.forEach((p) => {
    const nameKey = p.patient_name.toLowerCase()
    const existingCustomer = customerMap.get(nameKey)
    if (existingCustomer) {
      existingCustomer.hasPrescription = true
    } else {
      customerMap.set(nameKey, {
        _id: p.customer_id,
        name: p.patient_name,
        phone: 'Prescription Only',
        isKhata: false,
        hasPrescription: true,
        balance: 0,
      })
    }
  })

  customers.value = Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

onActivated(fetchCustomers)

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const lowerQuery = searchQuery.value.toLowerCase()
  return customers.value.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      (c.phone && c.phone.toLowerCase().includes(lowerQuery)),
  )
})

const addCustomer = async () => {
  if (!newCustomer.name.trim()) return
  isProcessing.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)

  if (!user || !pharmacyId) {
    notification.showNotification('Cannot save customer. Please log in again.', 'error')
    isProcessing.value = false
    return
  }

  try {
    const customerToAdd = {
      name: encryptData(newCustomer.name),
      phone: encryptData(newCustomer.phone),
      address: encryptData(newCustomer.address),
      balance: 0,
      user_id: user.id,
      pharmacy_id: pharmacyId,
      allergies: newCustomer.allergies ? newCustomer.allergies.split(',').map((a) => a.trim()) : [],
    }
    const { error } = await supabase.from('customers').insert(customerToAdd)
    if (error) throw error

    notification.showNotification('Customer saved.')
    await fetchCustomers()
    closeModal()
  } catch (e) {
    console.error('Error saving customer:', e)
    notification.showNotification('Error saving customer.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const closeModal = () => {
  isModalOpen.value = false
  Object.assign(newCustomer, { name: '', phone: '', address: '', allergies: '' })
}
</script>
<style scoped>
.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.search-box {
  flex-grow: 1;
}
.search-box input {
  width: 100%;
  max-width: 400px;
}
.actions-header .button {
  width: auto;
}

.customers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.customer-card {
  padding: 0;
  text-decoration: none;
  color: var(--color-text);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}
.customer-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.customer-name {
  font-weight: 600;
  font-size: 1.2rem;
}
.customer-tags {
  display: flex;
  gap: 0.5rem;
}
.tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.6rem;
  border-radius: 99px;
}
.tag.khata {
  background-color: var(--color-saffron-orange);
  color: var(--color-midnight-blue);
}
.tag.prescription {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}

.card-content {
  padding: 1.25rem;
  flex-grow: 1;
}
.customer-phone {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.card-footer {
  padding: 1rem 1.25rem;
  background-color: var(--color-surface-mute);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--color-border);
}
.balance-label {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.balance-amount {
  font-weight: 700;
  font-size: 1.1rem;
}
.balance-amount.has-balance {
  color: var(--color-saffron-orange);
}

.empty-state {
  text-align: center;
  padding: 3rem;
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

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

/* This makes sure the FormKit submit button behaves like a regular button in the flex container */
.modal-actions .formkit-outer {
  margin-bottom: 0;
}

.modal-actions .button-secondary {
  /* You can add specific styles if needed, but flex alignment is the key */
  width: auto;
  padding: 0.75rem 1.5rem;
}
</style>
