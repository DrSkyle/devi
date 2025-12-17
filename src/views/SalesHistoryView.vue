<template>
  <div class="sales-history-container p-4 max-w-7xl mx-auto relative min-h-screen">
    <!-- Header & Stats -->
    <div class="grid mb-6">
      <div class="col-12 md:col-6 lg:col-4">
        <h1 class="text-5xl font-thin text-white mb-2 tracking-tight">Sales History</h1>
        <p class="text-gray-400 text-lg">A complete record of all transactions.</p>
      </div>

      <!-- Stats Cards -->
      <div class="col-12 md:col-6 lg:col-8 flex flex-column md:flex-row gap-3 justify-content-end">
        <!-- Today's Sales -->
        <div class="glass-panel p-3 flex align-items-center gap-3 flex-grow-1">
          <div class="bg-primary-500 border-round p-2">
            <i class="pi pi-shopping-cart text-white text-xl"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 uppercase font-bold">Today's Sales</div>
            <div class="text-2xl font-bold text-white">{{ todaysSales.length }}</div>
          </div>
        </div>

        <!-- Today's Revenue -->
        <div class="glass-panel p-3 flex align-items-center gap-3 flex-grow-1">
          <div class="bg-green-500 border-round p-2">
            <i class="pi pi-money-bill text-white text-xl"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 uppercase font-bold">Today's Revenue</div>
            <div class="text-2xl font-bold text-white">Rs. {{ todaysRevenue.toFixed(2) }}</div>
          </div>
        </div>

        <!-- Total Sales (All Time) -->
        <div class="glass-panel p-3 flex align-items-center gap-3 flex-grow-1">
          <div class="bg-blue-500 border-round p-2">
            <i class="pi pi-wallet text-white text-xl"></i>
          </div>
          <div>
            <div class="text-xs text-gray-400 uppercase font-bold">Total Sales</div>
            <div class="text-2xl font-bold text-white">{{ allSales.length }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clean Command Bar -->
    <div
      class="mb-6 sticky top-0 z-5 bg-blur py-2"
      style="backdrop-filter: blur(12px); margin: 0 -1rem; padding: 1rem"
    >
      <div class="max-w-7xl mx-auto px-3 flex gap-3 align-items-center">
        <!-- Search Input -->
        <div class="relative w-full">
          <i
            class="pi pi-search absolute text-gray-500 text-xl"
            style="top: 50%; left: 1rem; transform: translateY(-50%); pointer-events: none"
          ></i>
          <input
            v-model="searchQuery"
            type="text"
            class="w-full bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white p-3 pl-7 outline-none text-xl transition-colors"
            placeholder="Search by Bill #, Customer, or Staff..."
          />
        </div>

        <div class="flex gap-2 w-full md:w-auto justify-content-end">
          <!-- Date Filter -->
          <div class="relative">
            <Button
              icon="pi pi-calendar"
              class="p-button-rounded p-button-text text-gray-400 hover:text-white"
              v-tooltip.bottom="'Filter by Date'"
              @click="showDateFilter = !showDateFilter"
            />
            <div
              v-if="showDateFilter"
              class="absolute top-100 right-0 z-5 glass-panel p-3 mt-2"
              style="min-width: 300px"
            >
              <div class="field">
                <label class="block text-sm text-gray-400 mb-2">Date Range</label>
                <Calendar
                  v-model="dateRange"
                  selectionMode="range"
                  :manualInput="false"
                  class="w-full"
                  placeholder="Select Range"
                />
              </div>
              <div class="flex justify-content-end gap-2 mt-3">
                <Button
                  label="Clear"
                  class="p-button-sm p-button-text text-gray-400"
                  @click="clearDateFilter"
                />
                <Button label="Apply" class="p-button-sm" @click="showDateFilter = false" />
              </div>
            </div>
          </div>

          <Button
            icon="pi pi-download"
            class="p-button-rounded p-button-text text-gray-400 hover:text-white"
            v-tooltip.bottom="'Export PDF'"
            @click="exportToPDF"
            :loading="isExporting"
          />
        </div>
      </div>
    </div>

    <!-- Sales List (DataTable) -->
    <div class="glass-panel p-0 overflow-hidden">
      <DataTable
        :value="filteredSales"
        :paginator="true"
        :rows="10"
        responsiveLayout="scroll"
        class="glass-datatable"
        :rowHover="true"
        selectionMode="single"
        @rowSelect="onRowSelect"
      >
        <template #empty>
          <div class="text-center p-4 text-gray-400">No sales found.</div>
        </template>

        <Column field="billNumber" header="Bill #" sortable>
          <template #body="slotProps">
            <span class="font-bold text-white">#{{ slotProps.data.billNumber }}</span>
          </template>
        </Column>

        <Column field="createdAt" header="Date" sortable>
          <template #body="slotProps">
            <span class="text-gray-300">{{ formatDate(slotProps.data.createdAt) }}</span>
          </template>
        </Column>

        <Column field="customerName" header="Customer" sortable>
          <template #body="slotProps">
            <span v-if="slotProps.data.customerName" class="text-primary font-medium">
              {{ decryptData(slotProps.data.customerName) }}
            </span>
            <span v-else class="text-gray-400">Walk-in Customer</span>
          </template>
        </Column>

        <Column field="staffName" header="Staff" sortable>
          <template #body="slotProps">
            <span class="text-gray-300">{{ slotProps.data.staffName || '-' }}</span>
          </template>
        </Column>

        <Column field="status" header="Status" sortable>
          <template #body="slotProps">
            <div class="flex gap-1">
              <Tag
                :value="getStatusText(slotProps.data.status)"
                :severity="getStatusSeverity(slotProps.data.status)"
                class="text-xs uppercase"
              />
              <Tag
                v-if="slotProps.data.hasReturns"
                value="Returned"
                severity="info"
                class="text-xs uppercase"
              />
            </div>
          </template>
        </Column>

        <Column field="total" header="Total" sortable>
          <template #body="slotProps">
            <div class="text-right">
              <div class="font-bold text-white font-mono">
                Rs. {{ (slotProps.data.total - (slotProps.data.returnedValue || 0)).toFixed(2) }}
              </div>
              <div
                v-if="slotProps.data.hasReturns"
                class="text-xs text-gray-500 line-through text-right"
              >
                Orig: Rs. {{ slotProps.data.total.toFixed(2) }}
              </div>
            </div>
          </template>
        </Column>

        <Column header="Action">
          <template #body>
            <Button
              icon="pi pi-chevron-right"
              class="p-button-rounded p-button-text p-button-sm text-gray-400"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="fixed top-0 left-0 w-full h-full flex align-items-center justify-content-center bg-black-alpha-50 z-5"
    >
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>
  </div>
</template>

<script setup>
// Force HMR update
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useRouter } from 'vue-router'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// PrimeVue Components
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const profile = useProfileStore()
const router = useRouter()
const rawSales = ref([])
const customerMap = ref(new Map())
const searchQuery = ref('')
const isLoading = ref(true)
const showDateFilter = ref(false)
const dateRange = ref(null)
const isExporting = ref(false)

let salesSub = null
let customersSub = null

const subscribeToData = () => {
  if (salesSub) salesSub.unsubscribe()
  if (customersSub) customersSub.unsubscribe()

  const pharmacyId = profile.pharmacyId
  if (!pharmacyId) {
    isLoading.value = false
    return
  }

  isLoading.value = true

  // Customers
  customersSub = database
    .get('customers')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      customerMap.value = new Map(records.map((c) => [c.id, c.name]))
    })

  // Sales
  salesSub = database
    .get('sales')
    .query(Q.where('pharmacy_id', pharmacyId))
    .observe()
    .subscribe((records) => {
      rawSales.value = records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      isLoading.value = false
    })
}

onMounted(() => {
  subscribeToData()
})

onUnmounted(() => {
  if (salesSub) salesSub.unsubscribe()
  if (customersSub) customersSub.unsubscribe()
})

watch(() => profile.pharmacyId, subscribeToData)

const allSales = computed(() => {
  let sales = rawSales.value

  // Filter for Staff (Non-Admin)
  const staffRole = sessionStorage.getItem('activeStaffRole')
  if (staffRole && staffRole !== 'admin') {
    const staffName = sessionStorage.getItem('activeStaffName')
    const staffId = sessionStorage.getItem('activeStaffId')

    if (staffName) {
      sales = sales.filter((s) => {
        return s.staffName === staffName || (s.userId && s.userId === staffId)
      })
    }
  }

  return sales.map((sale) => ({
    _id: sale.id,
    billNumber: sale.billNumber,
    createdAt: sale.createdAt,
    customerName: sale.customerId ? customerMap.value.get(sale.customerId) : null,
    staffName: sale.staffName,
    status: sale.status,
    total: sale.total,
    // hasReturns and returnedValue are not in the current schema/model
    hasReturns: false,
    returnedValue: 0,
  }))
})

const todaysSales = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return allSales.value.filter((s) => new Date(s.createdAt) >= today)
})

const todaysRevenue = computed(() => {
  return todaysSales.value.reduce((acc, s) => acc + (s.total || 0), 0)
})

const filteredSales = computed(() => {
  if (isLoading.value) return []

  let filtered = allSales.value

  // Search Filter
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase()
    filtered = filtered.filter((sale) => {
      const billMatch = String(sale.billNumber).includes(lowerCaseQuery)
      const customerName = sale.customerName ? decryptData(sale.customerName) : ''
      const customerMatch = customerName && customerName.toLowerCase().includes(lowerCaseQuery)
      const staffMatch = sale.staffName && sale.staffName.toLowerCase().includes(lowerCaseQuery)
      return billMatch || customerMatch || staffMatch
    })
  }

  // Date Filter
  if (dateRange.value && dateRange.value[0]) {
    const startDate = new Date(dateRange.value[0])
    startDate.setHours(0, 0, 0, 0)

    const endDate = dateRange.value[1] ? new Date(dateRange.value[1]) : new Date(startDate)
    endDate.setHours(23, 59, 59, 999)

    filtered = filtered.filter((sale) => {
      const saleDate = new Date(sale.createdAt)
      return saleDate >= startDate && saleDate <= endDate
    })
  }

  return filtered
})

const clearDateFilter = () => {
  dateRange.value = null
  showDateFilter.value = false
}

const getStatusText = (status) => {
  if (status === 'paid') return 'Paid'
  if (status === 'unpaid') return 'Credit'
  return 'Voided'
}

const getStatusSeverity = (status) => {
  if (status === 'paid') return 'success'
  if (status === 'unpaid') return 'warning'
  return 'danger'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })
}

const onRowSelect = (event) => {
  router.push(`/receipt/${event.data._id}?from=history`)
}

const exportToPDF = () => {
  isExporting.value = true
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Sales History Report', 14, 22)

  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30)

  const tableData = filteredSales.value.map((sale) => [
    sale.billNumber,
    formatDate(sale.createdAt),
    sale.customerName ? decryptData(sale.customerName) : 'Walk-in',
    sale.staffName || '-',
    getStatusText(sale.status),
    `Rs. ${(sale.total - (sale.returnedValue || 0)).toFixed(2)}`,
  ])

  doc.autoTable({
    startY: 40,
    head: [['Bill #', 'Date', 'Customer', 'Staff', 'Status', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }, // Primary color
  })

  doc.save('sales-history.pdf')
  isExporting.value = false
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
input:focus {
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  outline: none !important;
}
</style>
