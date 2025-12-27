<template>
  <div class="suppliers-container p-4 max-w-7xl mx-auto min-h-screen">
    <Toast />

    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Suppliers</h1>
        <p class="text-gray-400 text-sm">Manage your drug manufacturers and suppliers.</p>
      </div>
      <Button
        label="Add New Supplier"
        icon="pi pi-plus"
        class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
        @click="showAddModal = true"
      />
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
            placeholder="Search suppliers..."
          />
        </div>
      </div>
    </div>

    <!-- Suppliers List -->
    <div class="glass-panel p-0 overflow-hidden">
      <DataTable
        :value="filteredSuppliers"
        :paginator="true"
        :rows="10"
        responsiveLayout="scroll"
        class="glass-datatable"
        :rowHover="true"
        selectionMode="single"
        @rowSelect="onRowSelect"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 25, 50]"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} suppliers"
      >
        <template #empty>
          <div class="p-4 text-center text-gray-400">
            <i class="pi pi-box text-4xl mb-3 block"></i>
            No suppliers found. Add one to get started.
          </div>
        </template>

        <Column field="name" header="Supplier Name" sortable style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex align-items-center gap-3">
              <Avatar
                :label="data.name ? data.name.charAt(0).toUpperCase() : '?'"
                shape="circle"
                class="bg-white-alpha-10 text-primary"
              />
              <span class="font-bold text-white">{{ data.name }}</span>
            </div>
          </template>
        </Column>
        <Column field="phone" header="Contact" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-gray-300">{{ data.phone || 'N/A' }}</span>
          </template>
        </Column>
        <Column field="balance" header="Balance" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <span
              :class="data.balance > 0 ? 'text-red-400' : 'text-green-400'"
              class="font-mono font-bold"
            >
              Rs. {{ (data.balance || 0).toFixed(2) }}
            </span>
          </template>
        </Column>
        <Column header="Actions" :exportable="false" style="min-width: 4rem; text-align: right">
          <template #body>
            <Button
              icon="pi pi-chevron-right"
              text
              rounded
              severity="secondary"
              class="text-white-alpha-50 hover:text-white"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Add Supplier Dialog -->
    <Dialog
      v-model:visible="showAddModal"
      header="Add New Supplier"
      modal
      class="glass-dialog"
      :style="{ width: '400px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label for="name" class="block text-sm font-medium text-gray-300 mb-1"
            >Supplier Name</label
          >
          <InputText
            id="name"
            v-model="newSupplier.name"
            class="w-full glass-input"
            placeholder="e.g. Nepal Pharmaceuticals"
            autofocus
          />
        </div>
        <div class="field">
          <label for="phone" class="block text-sm font-medium text-gray-300 mb-1"
            >Phone (Optional)</label
          >
          <InputText
            id="phone"
            v-model="newSupplier.phone"
            class="w-full glass-input"
            placeholder="Contact number"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showAddModal = false" />
        <Button label="Add Supplier" @click="addSupplier" :loading="isSubmitting" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, onUnmounted, reactive, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { useStaffStore } from '@/stores/staff'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import Avatar from 'primevue/avatar'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()
const staffStore = useStaffStore()

const suppliers = ref([])
const searchQuery = ref('')

const filteredSuppliers = computed(() => {
  if (!searchQuery.value) return suppliers.value
  const query = searchQuery.value.toLowerCase()
  return suppliers.value.filter((s) => s.name.toLowerCase().includes(query))
})
const showAddModal = ref(false)
const isSubmitting = ref(false)

const newSupplier = reactive({
  name: '',
  phone: '',
})

let subscription = null

const subscribeToSuppliers = () => {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }

  if (profileStore.pharmacyId) {
    const query = database.get('suppliers').query(Q.where('pharmacy_id', profileStore.pharmacyId))
    subscription = query.observe().subscribe((records) => {
      suppliers.value = records.sort((a, b) => a.name.localeCompare(b.name))
    })
  }
}

onMounted(async () => {
  if (!profileStore.pharmacyId) {
    await profileStore.loadFromLocalDatabase()
  }
  subscribeToSuppliers()
})

onActivated(() => {
  console.log('SuppliersView activated, refreshing subscription...')
  subscribeToSuppliers()
})

onUnmounted(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
})

watch(
  () => profileStore.pharmacyId,
  () => {
    subscribeToSuppliers()
  },
)

const addSupplier = async () => {
  if (!newSupplier.name.trim()) {
    notification.showNotification('Please enter a supplier name', 'error')
    return
  }

  isSubmitting.value = true
  try {
    let userId = null
    // Local Check
    if (staffStore.activeUserId) {
      userId = staffStore.activeUserId
    } else if (profileStore.userId) {
      userId = profileStore.userId
    }

    if (!userId) {
      notification.showNotification('User not logged in', 'error')
      return
    }

    await database.write(async () => {
      await database.get('suppliers').create((supplier) => {
        supplier.name = newSupplier.name.trim()
        supplier.phone = newSupplier.phone.trim()
        supplier.pharmacyId = profileStore.pharmacyId
        supplier.balance = 0
        // supplier.userId = userId // Not in schema?
      })
    })

    notification.showNotification('Supplier added successfully!')
    showAddModal.value = false
    newSupplier.name = ''
    newSupplier.phone = ''
  } catch (error) {
    console.error('Error adding supplier:', error)
    notification.showNotification('Failed to add supplier.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const onRowSelect = (event) => {
  router.push(`/suppliers/${event.data.id}`)
}
</script>

<style scoped>
/* Utility classes handle most styles */
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  outline: none !important;
}
</style>
