import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePrescriptionCartStore = defineStore('prescriptionCart', () => {
  // Now stores objects like { name: 'Paracetamol', quantity: 2 }
  const itemsToDispense = ref([])

  function setItems(items) {
    itemsToDispense.value = items
  }

  function clearItems() {
    itemsToDispense.value = []
  }

  return { itemsToDispense, setItems, clearItems }
})
