<template>
  <Dialog
    visible
    modal
    :style="{ width: '450px' }"
    header="Generate Invite Code"
    @update:visible="$emit('close')"
  >
    <div class="flex flex-column gap-3">
      <div v-if="!generatedCode">
        <p class="m-0 text-600">
          Select a role for the new staff member.
        </p>

        <div class="flex flex-column gap-2 mt-3">
          <label for="staffRole" class="font-bold">Assign Role</label>
          <Select
            id="staffRole"
            v-model="role"
            :options="roles"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <div v-else class="text-center">
          <p class="text-gray-400 mb-2">Ask the staff member to enter this code on their device:</p>
          <div class="text-4xl font-mono font-bold text-primary mb-3 bg-white-alpha-10 p-3 border-round">
              {{ generatedCode }}
          </div>
          <p class="text-sm text-yellow-500"><i class="pi pi-exclamation-triangle"></i> Keep this screen open until they join.</p>
          <div class="flex align-items-center justify-content-center gap-2 mt-4">
               <i class="pi pi-spin pi-spinner text-primary"></i>
               <span class="text-gray-400">Waiting for connection...</span>
          </div>
      </div>
    </div>

    <template #footer>
      <div v-if="!generatedCode">
        <Button label="Cancel" text severity="secondary" @click="$emit('close')" />
        <Button label="Generate Invite" icon="pi pi-key" @click="handleGenerate" :loading="isLoading" />
      </div>
      <div v-else>
         <Button label="Done" @click="$emit('close')" severity="success" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Select from 'primevue/select'
import { networkService } from '@/services/NetworkService'
import { useProfileStore } from '@/stores/profile'

const emit = defineEmits(['close', 'send-invite'])
const role = ref('cashier')
const isLoading = ref(false)
const generatedCode = ref(null)
const profileStore = useProfileStore()

const roles = [
  { label: 'Cashier', value: 'cashier' },
  { label: 'Pharmacist', value: 'pharmacist' },
  { label: 'Admin', value: 'admin' },
]

const handleGenerate = () => {
    isLoading.value = true
    // 1. Generate Code
    const code = 'JOIN-' + Math.floor(1000 + Math.random() * 9000)
    generatedCode.value = code
    
    // 2. Configure Host Data
    networkService.setHostConfig({
        pharmacyId: profileStore.pharmacyId,
        pharmacyName: profileStore.pharmacyName,
        pharmacyCode: profileStore.pharmacyCode
    })

    // 3. Start Hosting
    networkService.startHosting(code)
    
    // Not emitting send-invite yet, effectively we are "inviting" via P2P
    isLoading.value = false
}
</script>

<style scoped>
/* PrimeFlex handles layout */
</style>
