<template>
  <div class="audit-log-container p-4 max-w-7xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">Activity Log</h1>
        <p class="text-gray-400 text-sm">A complete history of all actions performed in the app.</p>
      </div>
      <DataExporter
        :data="formattedLogs"
        :file-name="`activity_log_${new Date().toISOString().split('T')[0]}.csv`"
        button-text="Export Log to CSV"
      />
    </div>

    <div v-if="logs.length > 0" class="glass-panel p-0 overflow-hidden">
      <DataTable
        :value="logs"
        responsiveLayout="scroll"
        class="glass-table"
        :paginator="true"
        :rows="10"
        :rowHover="true"
      >
        <Column field="timestamp" header="Timestamp" sortable>
          <template #body="{ data }">
            <span class="text-gray-300">{{ formatDate(data.timestamp) }}</span>
          </template>
        </Column>
        <Column field="action" header="Action" sortable>
          <template #body="{ data }">
            <span class="font-bold text-white">{{ formatAction(data.action) }}</span>
          </template>
        </Column>
        <Column field="userName" header="User" sortable>
          <template #body="{ data }">
            <span class="text-primary">{{ data.userName || 'System' }}</span>
          </template>
        </Column>
        <Column field="details" header="Details">
          <template #body="{ data }">
            <span class="text-gray-400 text-sm">{{ JSON.stringify(data.details) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="glass-panel p-6 text-center">
      <i class="pi pi-history text-5xl text-gray-500 mb-3"></i>
      <p class="text-gray-400">No activity has been recorded yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import DataExporter from '@/components/DataExporter.vue'
// import { useProfileStore } from '@/stores/profile' // Removed unused import
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const logs = ref([])
// const profileStore = useProfileStore() // Removed unused store

const fetchLogs = async () => {
  // REFACTORED: 'audit_logs' table is not yet in local schema.
  // For now, we return empty or placeholder.
  logs.value = []
  
  // Future: Add 'audit_logs' to src/database/schema.js and query it here.
  /*
  const localLogs = await database.get('audit_logs').query().fetch()
  logs.value = localLogs
  */
}

onActivated(fetchLogs)

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-NP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
const formatAction = (action) => {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

const formattedLogs = computed(() => {
  return logs.value.map((log) => ({
    Timestamp: formatDate(log.timestamp),
    User: log.userName,
    Action: formatAction(log.action),
    Details: JSON.stringify(log.details),
  }))
})
</script>

<style scoped>
/* Utility classes handle most styles */
</style>
