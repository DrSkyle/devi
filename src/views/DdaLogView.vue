<template>
  <div class="dda-log-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">
          Controlled Substance Log (DDA)
        </h1>
        <p class="text-gray-400 text-sm">
          An immutable log of all controlled substances dispensed.
        </p>
      </div>
      <Button
        label="Export as PDF"
        icon="pi pi-file-pdf"
        @click="exportToPDF"
        :disabled="logs.length === 0"
        class="p-button-outlined p-button-secondary"
      />
    </div>

    <div v-if="isLoading" class="flex flex-column align-items-center justify-content-center p-6">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="text-gray-400 mt-3">Loading logbook...</p>
    </div>

    <div v-else-if="logs.length === 0" class="glass-panel p-6 text-center">
      <i class="pi pi-shield text-5xl text-gray-500 mb-3"></i>
      <p class="text-gray-400">No controlled substances have been dispensed yet.</p>
    </div>

    <div v-else class="glass-panel p-0 overflow-hidden">
      <DataTable
        :value="logs"
        responsiveLayout="scroll"
        class="glass-table"
        :paginator="true"
        :rows="10"
        :rowHover="true"
        @row-click="onRowClick"
      >
        <Column field="created_at" header="Date & Time" sortable>
          <template #body="{ data }">
            <span class="text-gray-300">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>
        <Column field="medicine_name" header="Medicine" sortable>
          <template #body="{ data }">
            <span class="font-bold text-white">{{ data.medicine_name }}</span>
          </template>
        </Column>
        <Column field="quantity_dispensed" header="Qty" sortable class="text-right">
          <template #body="{ data }">
            <span class="text-primary font-bold">{{ data.quantity_dispensed }}</span>
          </template>
        </Column>
        <Column field="patient_name" header="Patient" sortable>
          <template #body="{ data }">
            <span class="text-white">{{ data.patient_name }}</span>
          </template>
        </Column>
        <Column field="doctor_name" header="Doctor" sortable>
          <template #body="{ data }">
            <span class="text-gray-300">{{ data.doctor_name }}</span>
          </template>
        </Column>
        <Column field="staff_name" header="Staff" sortable>
          <template #body="{ data }">
            <span class="text-gray-400">{{ data.staff_name }}</span>
          </template>
        </Column>
        <Column field="current_hash" header="Hash">
          <template #body="{ data }">
            <span class="font-mono text-xs text-gray-500"
              >{{ data.current_hash.substring(0, 8) }}...</span
            >
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useProfileStore } from '@/stores/profile'
import { usePromptStore } from '@/stores/prompt'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const profile = useProfileStore()
const prompt = usePromptStore()
const isLoading = ref(true)
const logs = ref([])

onActivated(async () => {
  isLoading.value = true
  if (profile.pharmacyId) {
    try {
      const ddaLogs = await database
        .get('dda_logs')
        .query(Q.where('pharmacy_id', profile.pharmacyId), Q.sortBy('created_at', Q.desc))
        .fetch()

      logs.value = ddaLogs.map((log) => ({
        ...log._raw,
        id: log.id,
        created_at: log.createdAt,
        medicine_name: log.medicineName,
        quantity_dispensed: log.quantityDispensed,
        patient_name: log.patientName,
        doctor_name: log.doctorName,
        staff_name: log.staffName,
        current_hash: log.currentHash,
        previous_hash: log.previousHash,
      }))
    } catch (error) {
      console.error('Error fetching DDA logs', error)
      logs.value = []
    }
  }
  isLoading.value = false
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const onRowClick = (event) => {
  viewHash(event.data)
}

const viewHash = (log) => {
  prompt.show({
    type: 'confirm',
    title: 'Verify Log Entry (Chain Hash)',
    message: `This entry's unique hash is:\n${log.current_hash}\n\nIt is linked to the previous entry's hash:\n${log.previous_hash}\n\nThis chain ensures the log is tamper-proof.`,
  })
}

const exportToPDF = () => {
  const doc = new jsPDF()
  doc.text(`Controlled Substance Log (DDA) - ${profile.name}`, 14, 15)
  doc.text(`Exported on: ${new Date().toLocaleDateString('en-NP')}`, 14, 22)

  const tableColumn = ['Date', 'Medicine', 'Qty', 'Patient', 'Doctor', 'Staff']
  const tableRows = []

  logs.value.forEach((log) => {
    const logData = [
      formatDate(log.created_at),
      log.medicine_name,
      log.quantity_dispensed,
      log.patient_name,
      log.doctor_name,
      log.staff_name,
    ]
    tableRows.push(logData)
  })

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30,
  })

  doc.save(`DDA_Log_${profile.name}_${new Date().toISOString().split('T')[0]}.pdf`)
}
</script>

<style scoped>
/* Utility classes handle most styles */
</style>
