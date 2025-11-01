<template>
  <div class="dda-log-container">
    <header class="view-header">
      <h1 class="title">Controlled Substance Log (DDA)</h1>
      <p class="subtitle">An immutable log of all controlled substances dispensed.</p>
    </header>

    <div class="actions-bar">
      <button @click="exportToPDF" class="button-secondary" :disabled="logs.length === 0">
        Export as PDF
      </button>
    </div>

    <div class="card">
      <div v-if="isLoading" class="loading-state">
        <p>Loading logbook...</p>
      </div>
      <div v-else-if="logs.length === 0" class="empty-state">
        <p>No controlled substances have been dispensed yet.</p>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Medicine</th>
              <th>Qty</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Staff</th>
              <th>Hash</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="log in logs"
              :key="log._id"
              @click="viewHash(log)"
              title="Click to verify hash"
            >
              <td data-label="Date">{{ formatDate(log.created_at) }}</td>
              <td data-label="Medicine">{{ log.medicine_name }}</td>
              <td data-label="Qty">{{ log.quantity_dispensed }}</td>
              <td data-label="Patient">{{ log.patient_name }}</td>
              <td data-label="Doctor">{{ log.doctor_name }}</td>
              <td data-label="Staff">{{ log.staff_name }}</td>
              <td data-label="Hash" class="hash-cell">{{ log.current_hash.substring(0, 8) }}...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { usePromptStore } from '@/stores/prompt'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const profile = useProfileStore()
const prompt = usePromptStore()
const isLoading = ref(true)
const logs = ref([])

onActivated(async () => {
  isLoading.value = true
  if (profile.pharmacyId) {
    const { data } = await supabase
      .from('dda_logs')
      .select('*')
      .eq('pharmacy_id', profile.pharmacyId)
      .order('created_at', { ascending: false })
    logs.value = data || []
  }
  isLoading.value = false
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
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
.actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}
.actions-bar .button-secondary {
  width: auto;
}
.card {
  padding: 0;
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
tbody tr {
  cursor: pointer;
}
tbody tr:hover {
  background-color: var(--color-surface-mute);
}
thead {
  background-color: var(--color-surface-mute);
}
.hash-cell {
  font-family: monospace;
  font-size: 0.85rem;
  color: var(--color-text-light);
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  thead {
    display: none;
  }
  tr {
    display: block;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    margin-bottom: 1rem;
    padding: 1rem;
  }
  td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.5rem;
    border-bottom: 1px solid var(--color-surface-mute);
    white-space: normal;
    text-align: right;
  }
  tr td:last-child {
    border-bottom: none;
  }
  td::before {
    content: attr(data-label);
    font-weight: 600;
    color: var(--color-text-light);
    padding-right: 1rem;
    text-align: left;
  }
}
</style>
