<template>
  <div class="p-4 md:p-6">
    <h1 class="text-3xl font-bold text-primary-700 mb-2">Prescriptions</h1>
    <p class="text-600 mb-6">Manage patient prescriptions.</p>

    <div class="surface-card p-4 border-round shadow-2">
      <DataTable :value="prescriptionStore.prescriptions" paginator :rows="10" stripedRows>
        <Column field="id" header="Rx #"></Column>
        <Column field="patientName" header="Patient"></Column>
        <Column field="doctorName" header="Doctor"></Column>
        <Column field="status" header="Status">
          <template #body="{ data }">
            <Tag :value="data.status" severity="info" />
          </template>
        </Column>
        <Column header="Actions">
          <template #body="{ data }">
            <Button icon="pi pi-eye" text rounded class="mr-2" />
            <Button icon="pi pi-check" severity="success" text rounded />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { usePrescriptionStore } from '@/features/prescriptions/store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const prescriptionStore = usePrescriptionStore()

onMounted(() => {
  prescriptionStore.fetchPrescriptions()
})
</script>
