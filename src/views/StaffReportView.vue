<template>
  <div class="staff-report-container">
    <header class="view-header">
      <RouterLink to="/reports" class="back-link">&larr; Back to Reports</RouterLink>
      <h1 class="title">Staff Performance Report</h1>
      <p class="subtitle">Analyze sales and shift data for your staff members.</p>
    </header>

    <div class="card">
      <div class="filter-bar">
        <div class="date-picker-wrapper">
          <label for="startDate">From:</label>
          <input type="date" id="startDate" v-model="dateRange.start" />
        </div>
        <div class="date-picker-wrapper">
          <label for="endDate">To:</label>
          <input type="date" id="endDate" v-model="dateRange.end" />
        </div>
        <DataExporter
          :data="formattedReportData"
          :file-name="`Staff_Performance_${dateRange.start}_to_${dateRange.end}.csv`"
          button-text="Export CSV"
        />
      </div>

      <div v-if="isLoading" class="loading-state">
        <p>Generating report...</p>
      </div>
      <div v-else-if="reportData.length === 0" class="empty-state">
        <p>No shift or sales data found for the selected period.</p>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Staff Name</th>
              <th class="text-right">Total Hours Worked</th>
              <th class="text-right">Total Sales Revenue</th>
              <th class="text-right">Number of Sales</th>
              <th class="text-right">Sales per Hour</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in reportData" :key="staff.staffId">
              <td data-label="Staff Name">{{ staff.staffName }}</td>
              <td data-label="Total Hours" class="text-right">{{ staff.totalHours.toFixed(2) }}</td>
              <td data-label="Total Revenue" class="text-right">
                Rs. {{ staff.totalSales.toFixed(2) }}
              </td>
              <td data-label="Number of Sales" class="text-right">{{ staff.salesCount }}</td>
              <td data-label="Sales per Hour" class="text-right highlight">
                Rs. {{ staff.salesPerHour.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { RouterLink } from 'vue-router'
import DataExporter from '@/components/DataExporter.vue'

const profile = useProfileStore()
const isLoading = ref(true)
const reportData = ref([])

const dateRange = reactive({
  start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0],
})

const generateReport = async () => {
  isLoading.value = true
  const startDate = new Date(dateRange.start)
  startDate.setHours(0, 0, 0, 0)
  const startDateISO = startDate.toISOString()

  const endDate = new Date(dateRange.end)
  endDate.setHours(23, 59, 59, 999)
  const endDateISO = endDate.toISOString()

  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('pharmacy_id', profile.pharmacyId)
    .eq('status', 'completed')
    .gte('start_time', startDateISO)
    .lte('end_time', endDateISO)

  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .eq('user_id', profile.pharmacyId)
    .neq('status', 'void')
    .gte('created_at', startDateISO)
    .lte('created_at', endDateISO)

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
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: block;
  margin-bottom: 0.5rem;
}
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}
.date-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.date-picker-wrapper label {
  font-weight: 500;
}
.filter-bar .button-secondary {
  width: auto;
  margin-left: auto;
}
.table-container {
  width: 100%;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
thead {
  background-color: var(--color-surface-mute);
}
.text-right {
  text-align: right;
}
.highlight {
  font-weight: bold;
  color: var(--color-primary);
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}
</style>
