<template>
  <div
    class="customers-container p-4 max-w-7xl mx-auto relative h-screen flex flex-column overflow-hidden"
  >
    <!-- Header & Actions -->
    <div class="flex flex-column gap-4 mb-6">
      <div
        class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center gap-4"
      >
        <div>
          <h1 class="text-5xl font-thin text-white mb-2 tracking-tight">Customer Hub</h1>
          <p class="text-gray-400 text-lg">Manage patients and Khata accounts.</p>
        </div>
        <div class="flex gap-3 flex-wrap">
          <Select
            v-model="selectedMonth"
            :options="months"
            optionLabel="name"
            placeholder="This Month"
            class="w-full md:w-10rem glass-dropdown"
          />
          <Button
            label="Export"
            icon="pi pi-download"
            class="p-button-outlined p-button-secondary"
          />
          <Button
            label="New Customer"
            icon="pi pi-plus"
            class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
            @click="isModalOpen = true"
          />
        </div>
      </div>

      <!-- Clean Command Bar -->
      <div
        class="mb-6 sticky top-0 z-5 bg-blur py-2"
        style="backdrop-filter: blur(12px); margin: 0 -1rem; padding: 1rem"
      >
        <div class="max-w-7xl mx-auto px-3">
          <div class="relative w-full">
            <i
              class="pi pi-search absolute text-gray-500 text-xl"
              style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
            ></i>
            <input
              v-model="searchQuery"
              type="text"
              class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
              placeholder="Search customers..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Customers List (DataTable) -->
    <div class="glass-panel p-0 flex-grow-1 min-h-0 flex flex-column overflow-hidden">
      <DataTable
        :value="filteredCustomers"
        :paginator="true"
        :rows="10"
        responsiveLayout="scroll"
        class="glass-datatable"
        :rowHover="true"
        selectionMode="single"
        @rowSelect="onRowSelect"
      >
        <template #empty>
          <div class="text-center p-4 text-gray-400">No customers found.</div>
        </template>

        <Column field="name" header="Name" sortable>
          <template #body="slotProps">
            <div class="flex align-items-center gap-3">
              <Avatar
                :label="slotProps.data.name ? slotProps.data.name.charAt(0).toUpperCase() : '?'"
                shape="circle"
                class="bg-white-alpha-10 text-primary"
              />
              <span class="font-bold text-white">{{ slotProps.data.name }}</span>
            </div>
          </template>
        </Column>

        <Column field="phone" header="Phone">
          <template #body="slotProps">
            <span class="text-gray-300">{{ slotProps.data.phone || '-' }}</span>
          </template>
        </Column>

        <Column field="balance" header="Balance" sortable>
          <template #body="slotProps">
            <span
              class="font-mono font-bold"
              :class="slotProps.data.balance > 0 ? 'text-orange-500' : 'text-primary'"
            >
              Rs. {{ slotProps.data.balance.toFixed(2) }}
            </span>
          </template>
        </Column>

        <Column header="Status">
          <template #body="slotProps">
            <div class="flex gap-1">
              <Tag
                v-if="slotProps.data.balance > 0"
                value="Due"
                severity="warning"
                class="text-xs"
              />
              <Tag v-else value="Clear" severity="success" class="text-xs" />
            </div>
          </template>
        </Column>

        <Column header="Actions">
          <template #body>
            <Button
              icon="pi pi-chevron-right"
              class="p-button-rounded p-button-text p-button-sm text-gray-400"
            />
          </template>
        </Column>
      </DataTable>
    </div>
    <!-- Empty State -->
    <div
      v-if="filteredCustomers.length === 0"
      class="glass-panel p-8 text-center flex flex-column align-items-center justify-content-center"
    >
      <div class="bg-white-alpha-5 p-4 border-round-circle mb-4">
        <i class="pi pi-users text-4xl text-gray-500"></i>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">No customers found</h2>
      <p class="text-gray-400 mb-4">Get started by adding your first customer.</p>
    </div>

    <!-- Add Customer Modal -->
    <Dialog
      v-model:visible="isModalOpen"
      header="New Customer"
      modal
      class="glass-dialog"
      :style="{ width: '450px' }"
      :draggable="false"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Full Name</label>
          <InputText v-model="newCustomer.name" class="w-full glass-input" autofocus />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Phone Number</label>
          <InputText
            v-model="newCustomer.phone"
            class="w-full glass-input"
            v-imask="{ mask: '0000000000' }"
            placeholder="98XXXXXXXX"
          />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Address (Optional)</label>
          <InputText v-model="newCustomer.address" class="w-full glass-input" />
        </div>
        <div class="field">
          <label class="text-gray-300 text-sm mb-2 block">Allergies (Optional)</label>
          <InputText
            v-model="newCustomer.allergies"
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
          @click="isModalOpen = false"
          class="text-gray-400 hover:text-white"
        />
        <Button
          label="Save Customer"
          icon="pi pi-check"
          @click="addCustomer"
          :loading="isProcessing"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated, computed, reactive, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { encryptData, decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import { IMaskDirective } from 'vue-imask'

const vImask = IMaskDirective

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Avatar from 'primevue/avatar'
import Select from 'primevue/select'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const customers = ref([])
const searchQuery = ref('')
const isModalOpen = ref(false)
const isProcessing = ref(false)
const selectedMonth = ref(null)

const months = [
  { name: 'January', code: '01' },
  { name: 'February', code: '02' },
  { name: 'March', code: '03' },
  { name: 'April', code: '04' },
  { name: 'May', code: '05' },
  { name: 'June', code: '06' },
  { name: 'July', code: '07' },
  { name: 'August', code: '08' },
  { name: 'September', code: '09' },
  { name: 'October', code: '10' },
  { name: 'November', code: '11' },
  { name: 'December', code: '12' },
]

const newCustomer = reactive({
  name: '',
  phone: '',
  address: '',
  allergies: '',
})

let subscription = null

const subscribeToCustomers = () => {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }

  if (profileStore.pharmacyId) {
    console.log(
      'Subscribing to customers with pharmacyId:',
      profileStore.pharmacyId,
      typeof profileStore.pharmacyId,
    )
    const query = database.get('customers').query(Q.where('pharmacy_id', profileStore.pharmacyId))
    subscription = query.observe().subscribe((records) => {
      console.log('Customers fetched:', records.length)
      customers.value = records
        .map((c) => ({
          ...c._raw,
          id: c.id,
          name: decryptData(c.name),
          phone: decryptData(c.phone),
          address: decryptData(c.address),
          isKhata: c.balance > 0,
          hasPrescription: false,
          createdAt: c.createdAt,
          balance: c.balance,
        }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })
  } else {
    console.warn('No pharmacyId in profileStore, skipping subscription')
  }
}

onMounted(async () => {
  if (!profileStore.pharmacyId) {
    await profileStore.loadFromLocalDatabase()
  }
  subscribeToCustomers()
})

onActivated(() => {
  console.log('CustomersView activated, refreshing subscription...')
  subscribeToCustomers()
})

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
})

watch(
  () => profileStore.pharmacyId,
  () => {
    subscribeToCustomers()
  },
)

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const query = searchQuery.value.toLowerCase()
  return customers.value.filter(
    (c) => c.name.toLowerCase().includes(query) || (c.phone && c.phone.includes(query)),
  )
})

const onRowSelect = (event) => {
  router.push(`/customers/${event.data.id}`)
}

const addCustomer = async () => {
  if (!newCustomer.name) {
    notification.showNotification('Name is required', 'error')
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
    let newCustomerRecord = null
    console.log('Adding customer with pharmacyId:', profileStore.pharmacyId)
    await database.write(async () => {
      newCustomerRecord = await database.get('customers').create((customer) => {
        customer.name = encryptData(newCustomer.name)
        customer.phone = encryptData(newCustomer.phone)
        customer.address = encryptData(newCustomer.address)
        customer.allergies = newCustomer.allergies
        customer.balance = 0
        customer.pharmacyId = profileStore.pharmacyId
        // customer.userId = userId // Not in schema?
      })
    })
    console.log('Customer added:', newCustomerRecord._raw)

    notification.showNotification('Customer added successfully')
    isModalOpen.value = false

    // Reset form
    newCustomer.name = ''
    newCustomer.phone = ''
    newCustomer.address = ''
    newCustomer.allergies = ''

    router.push(`/customers/${newCustomerRecord.id}`)
  } catch (e) {
    console.error(e)
    notification.showNotification('Failed to add customer', 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}
</style>
