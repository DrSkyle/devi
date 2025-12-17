<template>
  <div class="prescriptions-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Prescription Hub</h1>
        <p class="text-gray-400 text-lg">Search, manage, and dispense patient prescriptions.</p>
      </div>
      <Button
        label="New Prescription"
        icon="pi pi-plus"
        class="p-button-primary"
        @click="router.push('/add-prescription')"
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
            placeholder="Search by Patient, Doctor, or Medicine..."
          />
        </div>
      </div>
    </div>

    <!-- Prescriptions List -->
    <div class="glass-panel p-0 overflow-hidden">
      <DataTable
        :value="filteredPrescriptions"
        :loading="isLoading"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="10"
        class="glass-datatable"
        rowHover
      >
        <template #empty>
          <div class="text-center p-6">
            <div class="bg-white-alpha-5 p-4 border-round-circle inline-flex mb-3">
              <i class="pi pi-file text-4xl text-gray-500"></i>
            </div>
            <h3 class="text-xl text-white font-bold mb-2">No prescriptions found</h3>
            <p class="text-gray-400">Create a new prescription to get started.</p>
          </div>
        </template>

        <Column field="patientName" header="Patient Details" sortable>
          <template #body="{ data }">
            <div class="flex align-items-center gap-3">
              <div class="bg-white-alpha-10 p-2 border-round border-1 border-white-alpha-10">
                <i class="pi pi-user text-primary"></i>
              </div>
              <div>
                <div class="font-bold text-white">{{ decryptData(data.patientName) }}</div>
                <div class="text-xs text-gray-400">{{ formatDate(data.createdAt) }}</div>
              </div>
            </div>
          </template>
        </Column>

        <Column field="doctorName" header="Prescribed By" sortable>
          <template #body="{ data }">
            <div class="text-gray-200">{{ data.doctorName }}</div>
          </template>
        </Column>

        <Column header="Items">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="item in data.items.slice(0, 3)"
                :key="item.name"
                :value="`${decryptData(item.name)} (${item.quantity})`"
                class="glass-tag text-xs"
              />
              <Tag
                v-if="data.items.length > 3"
                :value="`+${data.items.length - 3} more`"
                severity="secondary"
                class="text-xs"
              />
            </div>
          </template>
        </Column>

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <Tag
              :value="data.status"
              :severity="getStatusSeverity(data.status)"
              class="uppercase text-xs font-bold"
            />
          </template>
        </Column>

        <Column header="Actions" :exportable="false" style="min-width: 12rem">
          <template #body="{ data }">
            <div class="flex gap-2 justify-content-end">
              <Button
                v-if="data.status !== 'dispensed'"
                label="Dispense"
                icon="pi pi-check"
                class="p-button-sm p-button-outlined p-button-success"
                @click="dispense(data)"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text text-gray-400 hover:text-white"
                v-tooltip.top="'Edit'"
                @click="router.push(`/prescriptions/edit/${data._id}`)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

// PrimeVue Components
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

const router = useRouter()
const profile = useProfileStore()
const allPrescriptions = ref([])
const searchQuery = ref('')
const isLoading = ref(true)

const fetchPrescriptions = async () => {
  isLoading.value = true
  try {
    const prescriptions = await database
      .get('prescriptions')
      .query(Q.where('pharmacy_id', profile.pharmacyId), Q.sortBy('created_at', Q.desc))
      .fetch()

    allPrescriptions.value = prescriptions.map((rx) => ({
      _id: rx.id,
      patientName: rx.patientName,
      doctorName: rx.doctorName,
      items: rx.items,
      status: rx.status,
      createdAt: rx.createdAt,
    }))
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
  } finally {
    isLoading.value = false
  }
}

onActivated(fetchPrescriptions)

const filteredPrescriptions = computed(() => {
  if (!searchQuery.value) {
    return allPrescriptions.value
  }
  const lowerQuery = searchQuery.value.toLowerCase()
  return allPrescriptions.value.filter((rx) => {
    const patientMatch = rx.patientName.toLowerCase().includes(lowerQuery)
    const doctorMatch = rx.doctorName.toLowerCase().includes(lowerQuery)
    const itemMatch = rx.items.some((item) =>
      decryptData(item.name)?.toLowerCase().includes(lowerQuery),
    )
    return patientMatch || doctorMatch || itemMatch
  })
})

const dispense = (rx) => {
  router.push({ name: 'record-sale', query: { fromRx: rx._id } })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusSeverity = (status) => {
  switch (status) {
    case 'dispensed':
      return 'success'
    case 'pending':
      return 'warning'
    default:
      return 'info'
  }
}
</script>

<style scoped>
.glass-tag {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  outline: none !important;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 1.5rem 1rem !important;
  background: rgba(255, 255, 255, 0.05) !important;
}
</style>
