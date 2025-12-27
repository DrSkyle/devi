<template>
  <div class="compliance-view pb-8">
    <!-- Print Header (Visible only in print) -->
    <div class="print-header">
      <h1>{{ profileStore.pharmacyName || 'Pharmacy Name' }}</h1>
      <p>{{ profileStore.address || 'Address, City' }}</p>
      <p>Phone: {{ profileStore.phone || 'N/A' }}</p>
      <div class="mt-3 pt-2 border-top-1 border-black-alpha-20">
        <h2 class="text-xl m-0 uppercase tracking-widest">
          {{ activeTab === 'dda' ? 'Narcotic Drugs Register' : 'Compliance Report' }}
        </h2>
        <p class="text-xs mt-1">Generated on: {{ new Date().toLocaleString() }}</p>
      </div>
    </div>

    <!-- Header (Hidden in print) -->
    <div class="p-4 border-bottom-1 border-white-alpha-10 no-print">
      <div class="flex align-items-center gap-3 mb-2">
        <Button
          icon="pi pi-arrow-left"
          class="p-button-rounded p-button-text p-button-plain md:hidden"
          @click="router.push('/more')"
        />
        <h1 class="text-2xl font-bold m-0">Compliance & Audit</h1>
      </div>
      <p class="text-gray-400 m-0 pl-7">Government-mandated registers and reports.</p>
    </div>

    <!-- Tabs -->
    <div class="p-3">
      <div class="flex gap-2 mb-4 overflow-x-auto">
        <Button
          v-for="tab in tabs"
          :key="tab.id"
          :label="tab.label"
          :icon="tab.icon"
          class="p-button-sm white-space-nowrap flex-shrink-0"
          :class="
            activeTab === tab.id ? 'p-button-primary' : 'p-button-outlined p-button-secondary'
          "
          @click="activeTab = tab.id"
        />
      </div>

      <!-- DDA Register Tab -->
      <div v-if="activeTab === 'dda'" class="fadein animation-duration-300">
        <div class="glass-panel p-4 mb-4">
          <div class="flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="text-xl font-bold m-0 mb-1">Narcotic (DDA) Register</h2>
              <p class="text-sm text-gray-400 m-0">Official logbook for controlled substances.</p>
            </div>
            <Button
              label="Print Official Log"
              icon="pi pi-print"
              class="p-button-sm"
              @click="printDDA"
            />
          </div>

          <DataTable
            :value="ddaLogs"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            :loading="isLoading"
          >
            <template #empty>No narcotic sales recorded.</template>
            <Column field="date" header="Date">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.created_at) }}
              </template>
            </Column>
            <Column field="medicine_name" header="Medicine"></Column>
            <Column field="quantity_dispensed" header="Qty"></Column>
            <Column field="patient_name" header="Patient"></Column>
            <Column field="doctor_name" header="Prescriber"></Column>
            <Column field="staff_name" header="Dispensed By"></Column>
          </DataTable>
        </div>
      </div>

      <!-- Expiry Disposal Tab -->
      <div v-if="activeTab === 'expiry'" class="fadein animation-duration-300">
        <div class="glass-panel p-4 mb-4">
          <div class="flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="text-xl font-bold m-0 mb-1">Expiry Disposal Form</h2>
              <p class="text-sm text-gray-400 m-0">
                Select expired items to generate disposal request.
              </p>
            </div>
            <Button
              label="Generate Form"
              icon="pi pi-file-pdf"
              class="p-button-danger p-button-sm"
              :disabled="selectedExpiredItems.length === 0"
              @click="generateDisposalForm"
            />
          </div>

          <DataTable
            v-model:selection="selectedExpiredItems"
            :value="expiredInventory"
            dataKey="_id"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            :loading="isLoading"
          >
            <template #empty>No expired items found.</template>
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="name" header="Item">
              <template #body="slotProps">
                {{ decryptData(slotProps.data.name) }}
              </template>
            </Column>
            <Column field="batch_number" header="Batch"></Column>
            <Column field="expiry_date" header="Expiry"></Column>
            <Column field="quantity" header="Stock"></Column>
            <Column field="cost_price" header="Value">
              <template #body="slotProps">
                Rs. {{ ((slotProps.data.cost_price || 0) * slotProps.data.quantity).toFixed(2) }}
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Tax Estimator Tab -->
      <div v-if="activeTab === 'tax'" class="fadein animation-duration-300">
        <div class="glass-panel p-4">
          <div class="flex flex-column md:flex-row justify-content-between align-items-center mb-6">
            <div>
              <h2 class="text-xl font-bold m-0 mb-1">Tax Liability Estimator</h2>
              <p class="text-sm text-gray-400 m-0">Estimated VAT Payable (Output - Input)</p>
            </div>
            <div class="text-right mt-3 md:mt-0">
              <div class="text-3xl font-bold text-primary">
                Rs. {{ taxSummary.payable.toFixed(2) }}
              </div>
              <div class="text-xs text-gray-400">Net Payable</div>
            </div>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="p-4 border-1 border-white-alpha-10 border-round bg-white-alpha-5">
                <div class="text-gray-400 text-sm mb-1">Output VAT (Collected)</div>
                <div class="text-2xl font-bold text-green-400">
                  Rs. {{ taxSummary.outputVat.toFixed(2) }}
                </div>
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="p-4 border-1 border-white-alpha-10 border-round bg-white-alpha-5">
                <div class="text-gray-400 text-sm mb-1">Input VAT (Paid)</div>
                <div class="text-2xl font-bold text-red-400">
                  Rs. {{ taxSummary.inputVat.toFixed(2) }}
                </div>
                <small class="text-gray-500">Estimated based on 0% VAT for medicines.</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Trail Tab -->
      <div v-if="activeTab === 'audit'" class="fadein animation-duration-300">
        <div class="glass-panel p-4">
          <div class="flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="text-xl font-bold m-0 mb-1">Dispensing Log</h2>
              <p class="text-sm text-gray-400 m-0">Track who dispensed what.</p>
            </div>
            <InputText
              v-model="auditSearch"
              placeholder="Search staff or bill..."
              class="p-inputtext-sm"
            />
          </div>

          <DataTable
            :value="filteredDispensingLog"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="date" header="Date">
              <template #body="slotProps">{{ formatDate(slotProps.data.date) }}</template>
            </Column>
            <Column field="bill_no" header="Bill No"></Column>
            <Column field="medicine" header="Medicine">
              <template #body="slotProps">{{ decryptData(slotProps.data.medicine) }}</template>
            </Column>
            <Column field="qty" header="Qty"></Column>
            <Column field="staff" header="Dispensed By">
              <template #body="slotProps">
                <span class="font-bold text-primary">{{ slotProps.data.staff }}</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Stock Audit Tab -->
      <div v-if="activeTab === 'stock'" class="fadein animation-duration-300">
        <div class="glass-panel p-4">
          <div class="flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="text-xl font-bold m-0 mb-1">Stock Audit</h2>
              <p class="text-sm text-gray-400 m-0">Verify physical stock against system stock.</p>
            </div>
            <InputText v-model="stockSearch" placeholder="Search item..." class="p-inputtext-sm" />
          </div>

          <DataTable
            :value="filteredStock"
            :paginator="true"
            :rows="10"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="name" header="Item">
              <template #body="slotProps">{{ decryptData(slotProps.data.name) }}</template>
            </Column>
            <Column field="batch_number" header="Batch"></Column>
            <Column field="quantity" header="System Stock">
              <template #body="slotProps">
                <span
                  :class="{
                    'text-red-400': slotProps.data.quantity <= 0,
                    'text-green-400': slotProps.data.quantity > 0,
                  }"
                >
                  {{ slotProps.data.quantity }}
                </span>
              </template>
            </Column>
            <Column header="Physical Count">
              <template #body>
                <div
                  class="w-4rem h-2rem border-1 border-white-alpha-20 border-round bg-white-alpha-5"
                ></div>
              </template>
            </Column>
            <Column header="Status">
              <template #body>
                <span class="text-gray-500 text-xs">Pending</span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'

const router = useRouter()
const profileStore = useProfileStore()
const isLoading = ref(false)
const activeTab = ref('dda')

const tabs = [
  { id: 'dda', label: 'DDA Register', icon: 'pi pi-book' },
  { id: 'expiry', label: 'Expiry Disposal', icon: 'pi pi-trash' },
  { id: 'tax', label: 'Tax Estimator', icon: 'pi pi-money-bill' },
  { id: 'audit', label: 'Dispensing Log', icon: 'pi pi-shield' },
  { id: 'stock', label: 'Stock Audit', icon: 'pi pi-box' },
]

// DDA Data
const ddaLogs = ref([])

// Expiry Data
const expiredInventory = ref([])
const selectedExpiredItems = ref([])

// Tax Data
const taxSummary = ref({ outputVat: 0, inputVat: 0, payable: 0 })

// Audit Trail Data
const dispensingLog = ref([])
const auditSearch = ref('')

// Stock Audit Data
const inventory = ref([])
const stockSearch = ref('')

const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      fetchDDALogs(),
      fetchExpiredInventory(),
      calculateTax(),
      fetchDispensingLog(),
      fetchInventory(),
    ])
  } catch (error) {
    console.error('Error loading compliance data', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})

onActivated(() => {
  loadData()
})

const fetchDDALogs = async () => {
  const logs = await database.get('dda_logs').query(Q.sortBy('created_at', Q.desc)).fetch()
  ddaLogs.value = logs.map((log) => ({
    ...log._raw,
    id: log.id,
    created_at: log.createdAt,
  }))
}

const fetchExpiredInventory = async () => {
  const allInventory = await database.get('inventory').query().fetch()
  const today = new Date()

  expiredInventory.value = allInventory
    .filter((item) => {
      if (!item.expiryDate) return false
      const expiry = new Date(item.expiryDate)
      return expiry < today && item.quantity > 0
    })
    .map((item) => ({
      ...item._raw,
      id: item.id,
      name: item.name, // Encrypted
      batch_number: item.batchNo,
      expiry_date: item.expiryDate,
      quantity: item.quantity,
      cost_price: item.purchasePrice,
    }))
}

const calculateTax = async () => {
  // Mock implementation for now - strictly Output VAT from sales
  const sales = await database.get('sales').query().fetch()
  let outputVat = 0
  sales.forEach((sale) => {
    outputVat += sale.taxTotal || 0
  })

  // Input VAT would come from purchases, assuming 0 for now as per user instruction (medicines 0%)
  const inputVat = 0

  taxSummary.value = {
    outputVat,
    inputVat,
    payable: outputVat - inputVat,
  }
}

const fetchDispensingLog = async () => {
  const sales = await database.get('sales').query().fetch()
  // Flatten sales to show individual dispensing events if needed, or just sales
  // For dispensing log, we want to see WHO dispensed WHAT
  const log = []
  sales.forEach((sale) => {
    let items = []
    try {
      items = JSON.parse(sale.items)
    } catch {
      items = []
    }

    if (items && Array.isArray(items)) {
      items.forEach((item) => {
        log.push({
          date: sale.createdAt,
          medicine: item.name, // Already decrypted in cart? No, usually stored encrypted.
          qty: item.quantity,
          staff: sale.staffName || 'Unknown',
          bill_no: sale.billNumber,
        })
      })
    }
  })
  dispensingLog.value = log.sort((a, b) => new Date(b.date) - new Date(a.date))
}

const fetchInventory = async () => {
  const items = await database.get('inventory').query().fetch()
  inventory.value = items.map((item) => ({
    ...item._raw,
    id: item.id,
    name: item.name,
    batch_number: item.batchNo,
    quantity: item.quantity,
  }))
}

const filteredDispensingLog = computed(() => {
  if (!auditSearch.value) return dispensingLog.value
  const q = auditSearch.value.toLowerCase()
  return dispensingLog.value.filter(
    (item) => item.staff.toLowerCase().includes(q) || item.bill_no.toLowerCase().includes(q),
  )
})

const filteredStock = computed(() => {
  if (!stockSearch.value) return inventory.value
  const q = stockSearch.value.toLowerCase()
  return inventory.value.filter((item) => decryptData(item.name).toLowerCase().includes(q))
})

const formatDate = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString()
}

const printDDA = () => {
  window.print()
}

const generateDisposalForm = () => {
  // In a real app, this would generate a PDF
  // For now, we'll simulate it by printing the current view (filtered to expiry tab)
  window.print()
}
</script>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* Print Header - Hidden by default */
.print-header {
  display: none;
}

@media print {
  .compliance-view {
    padding: 0;
    background: white;
    color: black;
  }

  /* Hide UI elements */
  .p-button,
  .p-tabview-nav,
  .header-nav,
  .p-inputtext,
  .no-print {
    display: none !important;
  }

  /* Reset Glass Panel for Print */
  .glass-panel {
    background: white !important;
    color: black !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  /* Show Print Header */
  .print-header {
    display: block !important;
    text-align: center;
    margin-bottom: 2rem;
    border-bottom: 2px solid #000;
    padding-bottom: 1rem;
  }

  .print-header h1 {
    font-size: 24px;
    margin: 0 0 5px 0;
    text-transform: uppercase;
  }

  .print-header p {
    margin: 0;
    font-size: 12px;
    color: #333;
  }

  /* Table Styling for Print */
  .p-datatable {
    width: 100%;
    font-size: 12px;
  }

  .p-datatable-thead > tr > th {
    background: #f0f0f0 !important;
    color: black !important;
    border: 1px solid #ccc !important;
    padding: 0.5rem !important;
  }

  .p-datatable-tbody > tr > td {
    border: 1px solid #ccc !important;
    padding: 0.5rem !important;
    color: black !important;
  }

  body {
    background: white !important;
    color: black !important;
  }
}

/* Mobile Optimizations */
@media screen and (max-width: 768px) {
  .compliance-view {
    padding-bottom: 6rem; /* Space for bottom nav */
  }

  .glass-panel {
    padding: 1rem !important;
  }

  h1 {
    font-size: 1.5rem !important;
  }

  .p-datatable-sm .p-datatable-thead > tr > th {
    font-size: 0.8rem;
    padding: 0.5rem;
  }

  .p-datatable-sm .p-datatable-tbody > tr > td {
    font-size: 0.8rem;
    padding: 0.5rem;
  }
}
</style>
