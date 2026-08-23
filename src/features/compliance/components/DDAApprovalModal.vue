<template>
  <Dialog
    v-model:visible="visible"
    header="DDA Approval Required"
    :modal="true"
    :closable="true"
    class="w-full md:w-max"
  >
    <div class="p-4 space-y-4">
      <p class="text-lg font-semibold text-gray-800">
        A controlled substance sale has been flagged for review.
      </p>
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p class="text-sm text-gray-600"><strong>Pharmacist:</strong> Dr. Smith</p>
        <p class="text-sm text-gray-600"><strong>Substance:</strong> Morphine 10mg</p>
        <p class="text-sm text-gray-600"><strong>Quantity:</strong> 30 tablets</p>
      </div>
      <div class="flex justify-end space-x-3">
        <Button label="Decline" severity="danger" @click="close" class="px-6" />
        <Button
          label="Approve"
          severity="success"
          @click="approve"
          class="px-6 bg-green-400 hover:bg-green-500 text-white"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const visible = ref(false)

const show = () => {
  visible.value = true
}

const close = () => {
  visible.value = false
}

const approve = () => {
  // In a real app, you'd call an API and update the status
  visible.value = false
}

// Expose a method to trigger the modal from a composable or other component
// For now, we'll keep it simple
</script>
