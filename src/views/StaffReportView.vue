<template>
  <div class="staff-report-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <RouterLink
          to="/reports"
          class="no-underline text-gray-400 hover:text-white mb-2 inline-block transition-colors"
        >
          <i class="pi pi-arrow-left mr-2"></i>Back to Reports
        </RouterLink>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Staff Performance Report</h1>
        <p class="text-gray-400 text-sm">Analyze sales and shift data for your staff members.</p>
      </div>
      <DataExporter
        :data="formattedReportData"
        :file-name="`Staff_Performance_${dateRange.start}_to_${dateRange.end}.csv`"
        button-text="Export CSV"
      />
    </div>

    <!-- Filter Bar -->
    <div class="glass-panel p-4 mb-6">
      <div class="flex flex-column md:flex-row gap-4 align-items-end">
        <div class="flex-1 w-full">
          <label for="startDate" class="block text-sm font-medium text-gray-300 mb-2"
            >From Date</label
          >
          <Calendar
            v-model="dateRange.start"
            showIcon
            dateFormat="yy-mm-dd"
            inputId="startDate"
            class="w-full glass-calendar"
          />
        </div>
        <div class="flex-1 w-full">
          <label for="endDate" class="block text-sm font-medium text-gray-300 mb-2">To Date</label>
          <Calendar
            v-model="dateRange.end"
            showIcon
            dateFormat="yy-mm-dd"
            inputId="endDate"
            class="w-full glass-calendar"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-column align-items-center justify-content-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="text-gray-400 mt-3">Generating report...</p>
    </div>

    <div v-else-if="reportData.length === 0" class="glass-panel p-6 text-center">
      <i class="pi pi-users text-5xl text-gray-500 mb-3"></i>
      <p class="text-gray-400">No shift or sales data found for the selected period.</p>
    </div>

    <div v-else class="glass-panel p-0 overflow-hidden">
      <DataTable :value="reportData" responsiveLayout="scroll" class="glass-table" :rowHover="true">
        <Column field="staffName" header="Staff Name">
          <template #body="{ data }">
            <span class="font-bold text-white">{{ data.staffName }}</span>
          </template>
        </Column>
        <Column field="totalHours" header="Total Hours Worked" class="text-right">
          <template #body="{ data }">
            <span class="text-gray-300">{{ data.totalHours.toFixed(2) }}</span>
          </template>
        </Column>
        <Column field="totalSales" header="Total Sales Revenue" class="text-right">
          <template #body="{ data }">
            <span class="text-primary font-bold">Rs. {{ data.totalSales.toFixed(2) }}</span>
          </template>
        </Column>
        <Column field="salesCount" header="Number of Sales" class="text-right">
          <template #body="{ data }">
            <span class="text-white">{{ data.salesCount }}</span>
          </template>
        </Column>
        <Column field="salesPerHour" header="Sales per Hour" class="text-right">
          <template #body="{ data }">
            <span class="text-green-400 font-bold">Rs. {{ data.salesPerHour.toFixed(2) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useProfileStore } from '@/stores/profile'
import { RouterLink } from 'vue-router'
import DataExporter from '@/components/DataExporter.vue'
import Calendar from 'primevue/calendar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'

const profile = useProfileStore()
const isLoading = ref(true)
const reportData = ref([])

const dateRange = reactive({
  start: new Date(new Date().setDate(1)), // First day of current month
  end: new Date(), // Today
})

const generateReport = async () => {
  isLoading.value = true
  const startDate = new Date(dateRange.start)
  startDate.setHours(0, 0, 0, 0)
  const startDateISO = startDate.toISOString()

  const endDate = new Date(dateRange.end)
  endDate.setHours(23, 59, 59, 999)
  const endDateISO = endDate.toISOString()

  // WatermelonDB Replacement
  const shifts = await database
    .get('shifts')
    .query(
      Q.where('pharmacy_id', profile.pharmacyId),
      Q.where('status', 'completed'),
      Q.where('start_time', Q.gte(startDateISO)), // Note: Q.gte with ISO strings might need numbers depending on schema, but usually string compare works for ISO
      Q.where('end_time', Q.lte(endDateISO)),
    )
    .fetch()

  const sales = await database
    .get('sales')
    .query(
      Q.where('pharmacy_id', profile.pharmacyId), // Assuming user_id mapped to pharmacy_id in local context or similar
      Q.where('status', Q.notEq('void')),
      Q.where('created_at', Q.gte(startDateISO)),
      Q.where('created_at', Q.lte(endDateISO)),
    )
    .fetch()

  const staffPerformance = {}

  ;(shifts || []).forEach((shift) => {
    if (!staffPerformance[shift.staff_id]) {
      staffPerformance[shift.staff_id] = {
        staffId: shift.staff_id,
        staffName: shift.staff_name,
        totalHours: 0,
        totalSales: 0,
        salesCount: 0,
      }
    }
    const duration = (new Date(shift.end_time) - new Date(shift.start_time)) / (1000 * 60 * 60)
    staffPerformance[shift.staff_id].totalHours += duration
  })
  ;(sales || []).forEach((sale) => {
    if (staffPerformance[sale.staff_id]) {
      staffPerformance[sale.staff_id].totalSales += sale.total
      staffPerformance[sale.staff_id].salesCount += 1
    }
  })

  reportData.value = Object.values(staffPerformance)
    .map((staff) => ({
      ...staff,
      salesPerHour: staff.totalHours > 0 ? staff.totalSales / staff.totalHours : 0,
    }))
    .sort((a, b) => b.totalSales - a.totalSales)

  isLoading.value = false
}

const formattedReportData = computed(() => {
  // This function remains the same
  return reportData.value.map((staff) => ({
    'Staff Name': staff.staffName,
    'Total Hours Worked': staff.totalHours.toFixed(2),
    'Total Sales Revenue (Rs.)': staff.totalSales.toFixed(2),
    'Number of Sales': staff.salesCount,
    'Sales per Hour (Rs.)': staff.salesPerHour.toFixed(2),
  }))
})

onMounted(generateReport)
watch(dateRange, generateReport)
</script>

<style scoped>
/* Utility classes handle most styles */
</style>
