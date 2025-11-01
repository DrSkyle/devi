<template>
  <div v-if="customer" class="customer-dashboard-container">
    <header class="view-header">
      <RouterLink to="/customers" class="back-link">&larr; Back to Customer Hub</RouterLink>
      <h1 class="title">{{ customer.name }}</h1>
      <p class="subtitle">{{ customer.phone }} &bull; {{ customer.address }}</p>
    </header>

    <div class="dashboard-grid">
      <div class="left-panel">
        <div class="card summary-card">
          <div class="summary-item">
            <span>Balance</span>
            <strong :class="getBalanceClass(customer.balance)">
              Rs. {{ (customer.balance || 0).toFixed(2) }}
            </strong>
          </div>
          <div class="summary-item">
            <span>Saved Prescriptions</span>
            <strong>{{ prescriptions.length }}</strong>
          </div>
        </div>
        <div class="card actions-card">
          <h3>Actions</h3>
          <button @click="isEditModalOpen = true" class="button-secondary">Edit Details</button>
          <button @click="recordPayment" class="button-secondary">Record Payment Received</button>
          <button @click="addCredit" class="button-secondary">Add Credit / Deposit</button>
          <RouterLink :to="`/add-prescription?customerId=${customer._id}`" class="button">
            + Add New Prescription
          </RouterLink>
        </div>
      </div>

      <div class="right-panel">
        <div class="card history-card">
          <div class="tabs">
            <button @click="activeTab = 'ledger'" :class="{ active: activeTab === 'ledger' }">
              Ledger
            </button>
            <button
              @click="activeTab = 'prescriptions'"
              :class="{ active: activeTab === 'prescriptions' }"
            >
              Prescriptions
            </button>
          </div>
          <div class="tab-content">
            <div v-if="activeTab === 'ledger'">
              <CustomerLedger :sales="creditHistory.sales" :payments="creditHistory.payments" />
            </div>
            <div v-if="activeTab === 'prescriptions'">
              <div v-if="prescriptions.length > 0" class="prescription-list">
                <div v-for="rx in prescriptions" :key="rx._id" class="prescription-item">
                  <div class="rx-info">
                    <strong>Dr. {{ rx.doctor_name }}</strong>
                    <span>Saved on: {{ formatDate(rx.created_at) }}</span>
                    <ul>
                      <li v-for="item in rx.items" :key="item.name">
                        {{ decryptData(item.name) }} (Qty: {{ item.quantity }})
                      </li>
                    </ul>
                  </div>
                  <div class="rx-actions">
                    <button @click="dispense(rx)" class="button">Dispense</button>
                  </div>
                </div>
              </div>
              <div v-else class="empty-state">
                <p>No prescriptions found for this patient.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="isEditModalOpen" class="modal-overlay" @click.self="isEditModalOpen = false">
    <div class="modal-content card">
      <h2>Edit Customer Details</h2>
      <form @submit.prevent="updateCustomer">
        <div class="form-group">
          <label>Name</label><input type="text" v-model="editableCustomer.name" required />
        </div>
        <div class="form-group">
          <label>Phone</label><input type="text" v-model="editableCustomer.phone" />
        </div>
        <div class="form-group">
          <label>Address</label><input type="text" v-model="editableCustomer.address" />
        </div>
        <div class="form-group">
          <label>Allergies (comma-separated)</label>
          <input type="text" v-model="editableCustomer.allergies" />
        </div>
        <div class="modal-actions">
          <button type="button" class="button-secondary" @click="isEditModalOpen = false">
            Cancel
          </button>
          <button type="submit">Save Changes</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, reactive } from 'vue'
import { supabase } from '@/supabase'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { usePromptStore } from '@/stores/prompt'
import { decryptData, encryptData } from '@/utils/cipher'
import CustomerLedger from '@/components/CustomerLedger.vue'
import { useProfileStore } from '@/stores/profile'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const prompt = usePromptStore()
const profile = useProfileStore()

const customer = ref(null)
const creditHistory = reactive({ sales: [], payments: [] })
const prescriptions = ref([])
const isEditModalOpen = ref(false)
const editableCustomer = reactive({ name: '', phone: '', address: '' })
const activeTab = ref('ledger')

const fetchData = async () => {
  const customerId = Number(route.params.id)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !customerId) {
    router.push('/customers')
    return
  }

  const { data: fetchedCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('_id', customerId)
    .single()

  if (!fetchedCustomer) {
    notification.showNotification('Customer not found.', 'error')
    router.push('/customers')
    return
  }

  customer.value = {
    _id: fetchedCustomer._id,
    name: decryptData(fetchedCustomer.name),
    phone: decryptData(fetchedCustomer.phone),
    address: decryptData(fetchedCustomer.address),
    balance: fetchedCustomer.balance || 0,
    allergies: (fetchedCustomer.allergies || []).join(', '),
  }

  Object.assign(editableCustomer, customer.value)

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .eq('customer_id', customerId)
    .eq('pharmacy_id', profile.pharmacyId)
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('customer_id', customerId)
    .eq('pharmacy_id', profile.pharmacyId)
  const { data: rx } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('customer_id', customerId)
    .eq('pharmacy_id', profile.pharmacyId)
    .order('created_at', { ascending: false })

  creditHistory.sales = sales || []
  creditHistory.payments = payments || []
  prescriptions.value = rx || []
}

onActivated(fetchData)

const getBalanceClass = (balance) => {
  if (balance > 0) return 'has-balance-debit'
  if (balance < 0) return 'has-balance-credit'
  return ''
}

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB')

const updateCustomer = async () => {
  // Format allergies back into an array
  const allergiesArray = editableCustomer.allergies
    ? editableCustomer.allergies
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)
    : []

  const { error } = await supabase
    .from('customers')
    .update({
      name: encryptData(editableCustomer.name),
      phone: encryptData(editableCustomer.phone),
      address: encryptData(editableCustomer.address),
      allergies: allergiesArray, // SAVE THE ARRAY
    })
    .eq('_id', customer.value._id)

  if (error) {
    notification.showNotification('Failed to update details.', 'error')
  } else {
    notification.showNotification('Customer details updated.')
    isEditModalOpen.value = false
    await fetchData()
  }
}

const recordPayment = async () => {
  try {
    const amountPaid = await prompt.show({
      title: 'Record Payment Received',
      message: `Current outstanding balance is Rs. ${customer.value.balance.toFixed(2)}. How much did the customer pay?`,
      inputType: 'number',
      initialValue: customer.value.balance > 0 ? customer.value.balance.toFixed(2) : '',
    })

    const amount = parseFloat(amountPaid)
    if (isNaN(amount) || amount <= 0) return

    const newBalance = customer.value.balance - amount

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('record_customer_payment', {
      p_customer_id: customer.value._id,
      p_amount: amount,
      p_new_balance: newBalance,
      p_user_id: user.id,
      p_pharmacy_id: profile.pharmacyId,
      p_type: 'debit_payment',
    })
    if (error) throw error

    notification.showNotification('Payment recorded!')
    await fetchData()
  } catch (error) {
    if (error.message !== 'cancelled' && error !== 'cancelled')
      notification.showNotification('Failed to record payment.', 'error')
  }
}

const addCredit = async () => {
  try {
    const amountCredit = await prompt.show({
      title: 'Add Credit / Deposit',
      message: "How much credit or change is being added to this customer's account?",
      inputType: 'number',
    })
    const amount = parseFloat(amountCredit)
    if (isNaN(amount) || amount <= 0) return

    const newBalance = customer.value.balance - amount
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('record_customer_payment', {
      p_customer_id: customer.value._id,
      p_amount: amount,
      p_new_balance: newBalance,
      p_user_id: user.id,
      p_pharmacy_id: profile.pharmacyId,
      p_type: 'credit_deposit',
    })
    if (error) throw error

    notification.showNotification('Credit added to account!')
    await fetchData()
  } catch (error) {
    if (error.message !== 'cancelled' && error !== 'cancelled')
      notification.showNotification('Failed to add credit.', 'error')
  }
}

const dispense = (rx) => {
  router.push({ name: 'record-sale', query: { fromRx: rx._id } })
}
</script>
<style scoped>
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}
.view-header .subtitle {
  margin-top: 0;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-top: 2rem;
}
@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 320px 1fr;
    align-items: start;
  }
}

.left-panel .card {
  margin-bottom: 2rem;
}
.summary-card .summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}
.summary-card .summary-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.summary-card .summary-item:first-child {
  padding-top: 0;
}
.summary-card span {
  color: var(--color-text-light);
}
.summary-card strong {
  font-size: 1.5rem;
  color: var(--color-soft-cream);
}
.summary-card strong.has-balance-debit {
  color: var(--color-saffron-orange);
}
.summary-card strong.has-balance-credit {
  color: var(--color-peacock-teal);
}

.actions-card h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}
.actions-card .button,
.actions-card .button-secondary {
  width: 100%;
  margin-bottom: 1rem;
}
.actions-card .button:last-child,
.actions-card .button-secondary:last-child {
  margin-bottom: 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}
.tabs button {
  background: none;
  border: none;
  color: var(--color-text-light);
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
}
.tabs button.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.prescription-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.prescription-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background-color: var(--color-surface-mute);
  padding: 1rem;
  border-radius: 8px;
}
.rx-info {
  display: flex;
  flex-direction: column;
}
.rx-info span {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-top: 0.25rem;
}
.rx-info ul {
  list-style: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}
.rx-actions .button {
  width: auto;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
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
}
.modal-content {
  width: 100%;
  max-width: 500px;
}
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}
</style>
