<template>
  <div class="p-4 md:p-6">
    <h1 class="text-3xl font-bold text-primary-700 mb-2">Compliance Dashboard</h1>
    <p class="text-600 mb-6">Drug and Drug Administration (DDA) compliance and audit logs.</p>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <KpiCard
        title="Pending DDA Approvals"
        :value="complianceStore.pendingDDACount"
        icon="pi pi-exclamation-triangle"
        color="red"
      />
      <KpiCard
        title="Approved Today"
        :value="complianceStore.approvedDDAToday"
        icon="pi pi-check"
        color="green"
      />
      <KpiCard
        title="Rejected Today"
        :value="complianceStore.rejectedDDAToday"
        icon="pi pi-times"
        color="orange"
      />
    </div>

    <div class="surface-card p-4 border-round shadow-2">
      <h3 class="text-xl font-semibold mb-4">DDA Audit Log</h3>
      <DataTable :value="complianceStore.auditLogs" paginator :rows="10" stripedRows>
        <Column field="id" header="Log #"></Column>
        <Column field="staffName" header="Pharmacist"></Column>
        <Column field="timestamp" header="Timestamp">
          <template #body="{ data }">{{ new Date(data.timestamp).toLocaleString() }}</template>
        </Column>
        <Column field="status" header="Status">
          <template #body="{ data }"><Tag :value="data.status" severity="info" /></template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button
              v-if="data.status === 'PENDING'"
              label="Approve"
              icon="pi pi-check"
              severity="success"
              class="mr-2"
              size="small"
              @click="complianceStore.approve(data.id)"
            />
            <Button
              v-if="data.status === 'PENDING'"
              label="Reject"
              icon="pi pi-times"
              severity="danger"
              size="small"
              @click="complianceStore.reject(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useComplianceStore } from '@/features/compliance/store'
import KpiCard from '@/shared/ui/KpiCard.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { formatCurrency } from '@/shared/utils'

const complianceStore = useComplianceStore()

onMounted(() => {
  complianceStore.fetchLogs()
})
</script>
