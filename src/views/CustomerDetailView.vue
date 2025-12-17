<template>
  <div class="customer-detail-container p-4 max-w-7xl mx-auto relative min-h-screen">
    <!-- Header & Actions -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <RouterLink
          to="/customers"
          class="no-underline text-gray-400 hover:text-white transition-colors mb-2 inline-block flex align-items-center gap-2"
        >
          <i class="pi pi-arrow-left text-sm"></i> Back to Customers
        </RouterLink>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">
          {{ customer?.name || 'Loading...' }}
        </h1>
        <p class="text-gray-400 text-sm flex align-items-center gap-3">
          <span><i class="pi pi-phone text-xs mr-1"></i> {{ customer?.phone || 'No phone' }}</span>
          <span v-if="customer?.address"
            ><i class="pi pi-map-marker text-xs mr-1"></i> {{ customer.address }}</span
          >
        </p>
      </div>

      <div class="flex gap-3">
        <Button
          label="Record Payment"
          icon="pi pi-wallet"
          class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
          @click="openPaymentModal"
        />
        <Button
          icon="pi pi-pencil"
          class="p-button-rounded p-button-text text-gray-400 hover:text-white"
          v-tooltip.bottom="'Edit Customer'"
          aria-label="Edit Customer"
          @click="showEditModal = true"
        />
        <Button
          icon="pi pi-trash"
          class="p-button-rounded p-button-text text-red-400 hover:text-red-300"
          v-tooltip.bottom="'Delete Customer'"
          aria-label="Delete Customer"
          @click="confirmDelete"
        />
      </div>
    </div>

    <div v-if="customer" class="grid">
      <!-- Left Column: Stats & Info -->
      <div class="col-12 lg:col-4">
        <!-- Balance Card -->
        <div class="glass-panel p-4 mb-4 text-center">
          <div class="text-gray-400 text-sm uppercase font-bold mb-2">Current Balance</div>
          <div
            class="text-4xl font-mono font-bold mb-2"
            :class="customer.balance > 0 ? 'text-orange-500' : 'text-primary'"
          >
            Rs. {{ customer.balance.toFixed(2) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ customer.balance > 0 ? 'Payment Due' : 'All Cleared' }}
          </div>
        </div>

        <!-- Allergies Card -->
        <div class="glass-panel p-4 mb-4">
          <div class="flex align-items-center gap-2 mb-3">
            <i class="pi pi-exclamation-circle text-red-400"></i>
            <span class="font-bold text-white">Allergies</span>
          </div>
          <div
            v-if="customer.allergies && customer.allergies.length > 0"
            class="flex flex-wrap gap-2"
          >
            <Tag
              v-for="allergy in customer.allergies"
              :key="allergy"
              :value="allergy"
              severity="danger"
            />
          </div>
          <p v-else class="text-gray-500 text-sm m-0">No known allergies.</p>
        </div>
      </div>

      <!-- Right Column: Tabs (Ledger / Prescriptions) -->
      <div class="col-12 lg:col-8">
        <div class="glass-panel p-0 overflow-hidden min-h-full flex flex-column">
          <!-- Custom Tabs -->
          <div class="flex border-bottom-1 border-white-alpha-10">
            <button
              class="flex-1 p-3 text-center font-bold cursor-pointer transition-colors border-none bg-transparent outline-none"
              :class="
                activeTab === 'ledger'
                  ? 'text-primary border-bottom-2 border-primary bg-white-alpha-5'
                  : 'text-gray-400 hover:text-white hover:bg-white-alpha-5'
              "
              @click="activeTab = 'ledger'"
            >
              <i class="pi pi-list mr-2"></i> Ledger
            </button>
            <button
              class="flex-1 p-3 text-center font-bold cursor-pointer transition-colors border-none bg-transparent outline-none"
              :class="
                activeTab === 'prescriptions'
                  ? 'text-primary border-bottom-2 border-primary bg-white-alpha-5'
                  : 'text-gray-400 hover:text-white hover:bg-white-alpha-5'
              "
              @click="activeTab = 'prescriptions'"
            >
              <i class="pi pi-file mr-2"></i> Prescriptions
            </button>
          </div>

          <!-- Tab Content -->
          <div class="p-4 flex-grow-1">
            <CustomerLedger v-if="activeTab === 'ledger'" :customerId="customer.id" />
            <PrescriptionsList v-else :customerId="customer.id" />
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex align-items-center justify-content-center min-h-screen">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <!-- Payment Modal -->
    <Dialog
      v-model:visible="showPaymentModal"
      header="Record Payment"
      modal
      class="glass-dialog"
      :style="{ width: '400px' }"
      :draggable="false"
    >
      <div class="field">
        <label class="text-gray-300 text-sm mb-2 block">Amount (Rs.)</label>
        <InputNumber
          v-model="paymentAmount"
          mode="currency"
          currency="NPR"
          locale="en-NP"
          class="w-full glass-input"
          :min="0"
          autofocus
        />
      </div>
      <div class="field">
        <label class="text-gray-300 text-sm mb-2 block">Remarks (Optional)</label>
        <InputText
          v-model="paymentRemarks"
          class="w-full glass-input"
          placeholder="e.g. Bank Transfer"
        />
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showPaymentModal = false"
          class="text-gray-400 hover:text-white"
        />
        <Button
          label="Confirm Payment"
          icon="pi pi-check"
          @click="processPayment"
          :loading="isProcessing"
        />
      </template>
    </Dialog>

    <!-- Edit Customer Modal -->
    <Dialog
      v-model:visible="showEditModal"
      header="Edit Customer"
      modal
      class="glass-dialog"
      :style="{ width: '450px' }"
      :draggable="false"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Customer Name</label>
          <InputText v-model="editForm.name" class="w-full glass-input" />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Phone Number</label>
          <InputText v-model="editForm.phone" class="w-full glass-input" />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Address</label>
          <InputText v-model="editForm.address" class="w-full glass-input" />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Allergies</label>
          <InputText
            v-model="editForm.allergies"
            class="w-full glass-input"
            placeholder="Comma separated"
          />
        </div>
      </div>
      <template #footer>
        <Button
          label="Cancel"
          icon="pi pi-times"
          text
          @click="showEditModal = false"
          class="text-gray-400 hover:text-white"
        />
        <Button
          label="Save Changes"
          icon="pi pi-check"
          @click="updateCustomer"
          :loading="isProcessing"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { database } from '@/database'
import { useNotificationStore } from '@/stores/notification'
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import CustomerLedger from '@/components/CustomerLedger.vue'
import PrescriptionsList from '@/components/PrescriptionsList.vue'
import { useConfirm } from 'primevue/useconfirm'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()
const confirm = useConfirm()

const customer = ref(null)
const activeTab = ref('ledger')
const showPaymentModal = ref(false)
const showEditModal = ref(false)
const isProcessing = ref(false)
const paymentAmount = ref(0)
const paymentRemarks = ref('')

const editForm = reactive({
  name: '',
  phone: '',
  address: '',
  allergies: '',
})

const fetchCustomerDetails = async () => {
  const customerId = route.params.id
  try {
    const data = await database.get('customers').find(customerId)

    customer.value = {
      ...data._raw,
      id: data.id,
      name: decryptData(data.name),
      phone: decryptData(data.phone),
      address: decryptData(data.address),
      allergies: data.allergies ? data.allergies.split(',').filter(Boolean) : [], // Schema has string, not array
      balance: data.balance || 0,
      pharmacyId: data.pharmacyId,
    }

    // Populate edit form
    editForm.name = customer.value.name
    editForm.phone = customer.value.phone
    editForm.address = customer.value.address
    editForm.allergies = customer.value.allergies.join(', ')
  } catch (error) {
    console.error('Customer not found', error)
    notification.showNotification('Customer not found', 'error')
    router.push('/customers')
  }
}

onMounted(fetchCustomerDetails)

const openPaymentModal = () => {
  if (customer.value && customer.value.balance > 0) {
    paymentAmount.value = customer.value.balance
  } else {
    paymentAmount.value = 0
  }
  showPaymentModal.value = true
}

const processPayment = async () => {
  if (paymentAmount.value <= 0) {
    notification.showNotification('Enter a valid amount', 'error')
    return
  }

  isProcessing.value = true
  let userId = null
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    userId = user.id
  } else if (profileStore.userId) {
    userId = profileStore.userId
  }

  if (!userId) {
    notification.showNotification('User not logged in', 'error')
    isProcessing.value = false
    return
  }

  try {
    await database.write(async () => {
      // 1. Create Transaction Record
      await database.get('transactions').create((txn) => {
        txn.customerId = customer.value.id
        txn.amount = paymentAmount.value
        txn.type = 'payment'
        txn.remarks = paymentRemarks.value || 'Balance Payment'
        txn.pharmacyId = customer.value.pharmacyId
        txn.userId = userId
      })

      // 2. Update Customer Balance
      const customerRecord = await database.get('customers').find(customer.value.id)
      await customerRecord.update((rec) => {
        rec.balance -= paymentAmount.value
      })
    })

    notification.showNotification(`Payment of Rs. ${paymentAmount.value} recorded!`)
    showPaymentModal.value = false
    paymentAmount.value = 0
    paymentRemarks.value = ''
    await fetchCustomerDetails() // Refresh data
  } catch (e) {
    console.error(e)
    notification.showNotification('Failed to record payment', 'error')
  } finally {
    isProcessing.value = false
  }
}

const updateCustomer = async () => {
  isProcessing.value = true
  try {
    await database.write(async () => {
      const customerRecord = await database.get('customers').find(customer.value.id)
      await customerRecord.update((rec) => {
        rec.name = encryptData(editForm.name)
        rec.phone = encryptData(editForm.phone)
        rec.address = encryptData(editForm.address)
        rec.allergies = editForm.allergies
      })
    })

    notification.showNotification('Customer details updated')
    showEditModal.value = false
    await fetchCustomerDetails()
  } catch (e) {
    console.error(e)
    notification.showNotification('Failed to update customer', 'error')
  } finally {
    isProcessing.value = false
  }
}

const confirmDelete = () => {
  confirm.require({
    message: 'Are you sure you want to delete this customer? This cannot be undone.',
    header: 'Delete Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await database.write(async () => {
          const customerRecord = await database.get('customers').find(customer.value.id)
          await customerRecord.markAsDeleted()
        })
        notification.showNotification('Customer deleted')
        router.push('/customers')
      } catch (error) {
        console.error(error)
        notification.showNotification('Failed to delete customer', 'error')
      }
    },
  })
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
</style>
