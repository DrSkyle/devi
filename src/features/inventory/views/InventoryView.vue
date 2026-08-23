<template>
  <div class="p-4 md:p-6 surface-card border-round shadow-2">
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0">Inventory Management</h2>
      <Button label="Add Item" icon="pi pi-plus" @click="showAddModal = true" />
    </div>

    <DataTable :value="inventoryStore.items" paginator :rows="10" stripedRows>
      <Column field="brandName" header="Brand Name"></Column>
      <Column field="genericName" header="Generic Name"></Column>
      <Column field="batchNumber" header="Batch #"></Column>
      <Column field="expiryDate" header="Expiry Date">
        <template #body="{ data }">
          <span :class="{ 'text-red-500': new Date(data.expiryDate) < new Date() }">
            {{ data.expiryDate }}
          </span>
        </template>
      </Column>
      <Column field="totalTablets" header="Stock (Tablets)"></Column>
      <Column field="sellingPriceCents" header="Price">
        <template #body="{ data }">
          {{ formatCurrency(data.sellingPriceCents) }}
        </template>
      </Column>
      <Column header="Actions">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" class="mr-2" text rounded @click="editItem(data)" />
          <Button icon="pi pi-trash" severity="danger" text rounded @click="deleteItem(data.id)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useInventoryStore } from '@/features/inventory/store'
import { formatCurrency } from '@/shared/utils'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'

const inventoryStore = useInventoryStore()
const showAddModal = ref(false)

onMounted(() => {
  inventoryStore.fetchInventory()
})

const editItem = (item) => {
  // TODO: Implement edit logic
  console.log('Edit item', item)
}

const deleteItem = (id) => {
  // TODO: Implement delete logic
  console.log('Delete item', id)
}
</script>
