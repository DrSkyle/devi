<template>
  <Dialog
    visible
    modal
    :style="{ width: '500px' }"
    header="Dispense Options"
    @update:visible="$emit('close')"
  >
    <div class="flex flex-column gap-4">
      <p class="m-0 text-600">Some items on this prescription are out of stock.</p>

      <div v-if="inStockItems.length > 0">
        <div class="font-bold mb-2">In Stock:</div>
        <div class="flex flex-column gap-2">
          <div
            v-for="(item, i) in inStockItems"
            :key="i"
            class="p-3 surface-100 border-round border-left-3 border-teal-500"
          >
            <span class="font-medium">{{ item.name }}</span>
            <span class="text-600 ml-2">(Qty: {{ item.quantity }})</span>
          </div>
        </div>
      </div>

      <div v-if="outOfStockItems.length > 0">
        <div class="font-bold mb-2">Out of Stock:</div>
        <div class="flex flex-column gap-2">
          <div
            v-for="(item, i) in outOfStockItems"
            :key="i"
            class="p-3 surface-100 border-round border-left-3 border-red-500"
          >
            <span class="font-medium">{{ item.name }}</span>
            <span class="text-600 ml-2">(Need: {{ item.quantity }}, Have: {{ item.have }})</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-column sm:flex-row gap-2 w-full">
        <Button label="Cancel" text severity="secondary" @click="$emit('close')" class="flex-1" />
        <Button
          v-if="inStockItems.length > 0"
          label="Dispense In-Stock Only"
          icon="pi pi-check"
          severity="warning"
          @click="$emit('dispense-partial')"
          class="flex-1"
        />
        <Button
          label="Find in Network"
          icon="pi pi-search"
          @click="$emit('find-network')"
          class="flex-1"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

defineProps({
  inStockItems: { type: Array, required: true },
  outOfStockItems: { type: Array, required: true },
})
defineEmits(['close', 'dispense-partial', 'find-network'])
</script>

<style scoped>
/* PrimeFlex handles layout */
</style>
