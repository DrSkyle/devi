<template>
  <div class="transfers-container p-4 max-w-7xl mx-auto min-h-screen">
    <Toast />

    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Stock Transfers</h1>
        <p class="text-gray-400 text-sm">Manage incoming and outgoing stock requests.</p>
      </div>
      <Button
        label="New Transfer Request"
        icon="pi pi-plus"
        class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
        @click="showNewTransferModal = true"
      />
    </div>

    <!-- Tabs & Content -->
    <div class="glass-panel p-0 overflow-hidden">
      <div class="flex border-bottom-1 border-white-alpha-10">
        <button
          @click="activeTab = 'incoming'"
          class="flex-1 p-3 text-center cursor-pointer transition-colors border-none bg-transparent font-medium text-lg outline-none"
          :class="
            activeTab === 'incoming'
              ? 'text-primary border-bottom-2 border-primary bg-white-alpha-5'
              : 'text-gray-400 hover:text-white hover:bg-white-alpha-5'
          "
        >
          Incoming Requests
          <span
            v-if="incomingRequests.length > 0"
            class="ml-2 bg-primary text-white text-xs font-bold px-2 py-1 border-round-xl"
            >{{ incomingRequests.length }}</span
          >
        </button>
        <button
          @click="activeTab = 'outgoing'"
          class="flex-1 p-3 text-center cursor-pointer transition-colors border-none bg-transparent font-medium text-lg outline-none"
          :class="
            activeTab === 'outgoing'
              ? 'text-primary border-bottom-2 border-primary bg-white-alpha-5'
              : 'text-gray-400 hover:text-white hover:bg-white-alpha-5'
          "
        >
          Outgoing Requests
        </button>
      </div>

      <div class="p-0">
        <!-- Incoming Requests Table -->
        <DataTable
          v-if="activeTab === 'incoming'"
          :value="incomingRequests"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm glass-table"
          :rowHover="true"
        >
          <template #empty>
            <div class="p-5 text-center text-gray-400">No incoming requests found.</div>
          </template>
          <Column field="medicine_name" header="Medicine">
            <template #body="{ data }">
              <span class="font-bold text-white">{{ data.medicine_name }}</span>
            </template>
          </Column>
          <Column field="quantity" header="Qty" style="width: 100px">
            <template #body="{ data }">
              <span class="text-white">{{ data.quantity }}</span>
            </template>
          </Column>
          <Column field="from_pharmacy_name" header="From">
            <template #body="{ data }">
              <span class="text-gray-300">{{ data.to_pharmacy_name }}</span>
              <!-- Note: In incoming, 'from' is the requester? Logic check: If I am receiving a request, someone requested FROM me? Or TO me? Usually 'Incoming Request' means someone wants stock FROM me. -->
            </template>
          </Column>
          <Column field="created_at" header="Date">
            <template #body="{ data }">
              <span class="text-gray-400 text-sm">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column header="Status" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
          <Column header="Actions" style="width: 150px">
            <template #body="{ data }">
              <div v-if="data.status === 'pending'" class="flex gap-2">
                <Button
                  icon="pi pi-check"
                  rounded
                  text
                  severity="success"
                  @click="updateRequestStatus(data, 'accepted')"
                  v-tooltip.top="'Accept'"
                />
                <Button
                  icon="pi pi-times"
                  rounded
                  text
                  severity="danger"
                  @click="updateRequestStatus(data, 'rejected')"
                  v-tooltip.top="'Reject'"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <!-- Outgoing Requests Table -->
        <DataTable
          v-if="activeTab === 'outgoing'"
          :value="outgoingRequests"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm glass-table"
          :rowHover="true"
        >
          <template #empty>
            <div class="p-5 text-center text-gray-400">No outgoing requests found.</div>
          </template>
          <Column field="medicine_name" header="Medicine">
            <template #body="{ data }">
              <span class="font-bold text-white">{{ data.medicine_name }}</span>
            </template>
          </Column>
          <Column field="quantity" header="Qty" style="width: 100px">
            <template #body="{ data }">
              <span class="text-white">{{ data.quantity }}</span>
            </template>
          </Column>
          <Column field="to_pharmacy_name" header="To">
            <template #body="{ data }">
              <span class="text-gray-300">{{ data.from_pharmacy_name }}</span>
            </template>
          </Column>
          <Column field="created_at" header="Date">
            <template #body="{ data }">
              <span class="text-gray-400 text-sm">{{ formatDate(data.created_at) }}</span>
            </template>
          </Column>
          <Column header="Status" style="width: 120px">
            <template #body="{ data }">
              <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- New Transfer Modal -->
    <Dialog
      v-model:visible="showNewTransferModal"
      header="New Transfer Request"
      modal
      class="glass-dialog"
      :style="{ width: '450px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="block text-sm font-medium text-gray-300 mb-1">Medicine Name</label>
          <InputText
            v-model="newTransfer.medicine_name"
            class="w-full glass-input"
            placeholder="e.g. Paracetamol"
          />
        </div>
        <div class="field">
          <label class="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
          <InputNumber
            v-model="newTransfer.quantity"
            class="w-full glass-input"
            placeholder="0"
            :min="1"
          />
        </div>
        <div class="field">
          <label class="block text-sm font-medium text-gray-300 mb-1"
            >Target Pharmacy (Name/ID)</label
          >
          <InputText
            v-model="newTransfer.target_pharmacy"
            class="w-full glass-input"
            placeholder="Enter pharmacy name or ID"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="showNewTransferModal = false" />
        <Button label="Send Request" @click="createTransfer" :loading="isSubmitting" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onActivated, computed, reactive } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'

const notification = useNotificationStore()
const profileStore = useProfileStore()
const activeTab = ref('incoming')
const allTransfers = ref([])
const showNewTransferModal = ref(false)
const isSubmitting = ref(false)

const newTransfer = reactive({
  medicine_name: '',
  quantity: null,
  target_pharmacy: '',
})

const fetchTransfers = async () => {
  if (!profileStore.pharmacyId) return

  // Combine Queries: (from = me OR to = me)
  // WatermelonDB doesn't support easy OR between columns directly in one query usually,
  // but we can query the 'transfers' collection.
  // Actually, we can fetch two queries or use raw sql if needed, but two queries is safer.

  try {
    const fromMe = await database
      .get('transfers')
      .query(Q.where('from_pharmacy_id', profileStore.pharmacyId))
      .fetch()
    const toMe = await database
      .get('transfers')
      .query(Q.where('to_pharmacy_id', profileStore.pharmacyId))
      .fetch()

    const combined = [...fromMe, ...toMe]
    // Deduplicate if needed (though IDs should be unique so overlap theoretically impossible if strictly from!=to)
    const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values())

    allTransfers.value = unique
      .map((t) => t._raw || t)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) {
    console.error('Error fetching transfers', e)
  }
}

onActivated(fetchTransfers)

const incomingRequests = computed(() => {
  // Incoming Stock: I am the Requester (from_pharmacy_id === me)
  // This means I asked for stock, and I am waiting for it to come IN.
  return allTransfers.value.filter((t) => t.from_pharmacy_id === profileStore.pharmacyId)
})

const outgoingRequests = computed(() => {
  // Outgoing Stock: I am the Provider (to_pharmacy_id === me)
  // This means someone asked me for stock, and it will go OUT.
  return allTransfers.value.filter((t) => t.to_pharmacy_id === profileStore.pharmacyId)
})

const updateRequestStatus = async (request, newStatus) => {
  try {
    // WatermelonDB Update
    await database.write(async () => {
      const rec = await database.get('transfers').find(request.id)
      await rec.update((r) => {
        r.status = newStatus
      })
    })

    notification.showNotification(`Request has been ${newStatus}.`)
    await fetchTransfers()
  } catch {
    notification.showNotification('Failed to update request status.', 'error')
  }
}

const createTransfer = async () => {
  if (!newTransfer.medicine_name || !newTransfer.quantity || !newTransfer.target_pharmacy) {
    notification.showNotification('Please fill in all fields.', 'error')
    return
  }

  isSubmitting.value = true

  try {
    // 1. Find Target Pharmacy
    let targetId = null
    let targetName = ''

    // Check if input is a valid UUID (direct ID match)
    const isUUID =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        newTransfer.target_pharmacy,
      )

    if (isUUID) {
      try {
        const profile = await database.get('profiles').find(newTransfer.target_pharmacy)
        if (profile) {
          targetId = profile.userId || profile.id // Schema dependent
          targetName = profile.name
        }
      } catch {
        // Not found
      }
    } else {
      // Search by name
      const results = await database
        .get('profiles')
        .query(
          Q.where('name', Q.like(`%${newTransfer.target_pharmacy}%`)),
          Q.where('user_id', Q.notEq(profileStore.pharmacyId)),
          Q.take(1),
        )
        .fetch()

      if (results.length > 0) {
        targetId = results[0].userId || results[0].id
        targetName = results[0].name
      }
    }

    if (!targetId) {
      notification.showNotification('Target pharmacy not found.', 'error')
      isSubmitting.value = false
      return
    }

    // 2. Create Transfer Request
    await database.write(async () => {
      await database.get('transfers').create((t) => {
        t.from_pharmacy_id = profileStore.pharmacyId
        t.from_pharmacy_name = profileStore.name || 'Unknown'
        t.to_pharmacy_id = targetId
        t.to_pharmacy_name = targetName
        t.medicine_name = newTransfer.medicine_name
        t.quantity = newTransfer.quantity
        t.status = 'pending'
        // t.created_at = new Date().toISOString() // managed by created_at column usually
      })
    })

    // if (error) throw error // No error throwing needed for DB write unless catch block catches it

    notification.showNotification('Transfer request sent successfully!', 'success')
    showNewTransferModal.value = false

    // Reset form
    newTransfer.medicine_name = ''
    newTransfer.quantity = null
    newTransfer.target_pharmacy = ''

    await fetchTransfers()
  } catch (error) {
    console.error('Error creating transfer:', error)
    notification.showNotification('Failed to send transfer request.', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (dateString) => new Date(dateString).toLocaleDateString()

const getStatusSeverity = (status) => {
  switch (status) {
    case 'accepted':
      return 'success'
    case 'rejected':
      return 'danger'
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped>
/* Utility classes */
</style>
