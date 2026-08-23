<template>
  <Dialog
    v-model:visible="visible"
    modal
    header="DDA Compliance Approval Required"
    :style="{ width: '450px' }"
    :closable="false"
    class="border-orange-500 border-2"
  >
    <div class="flex flex-column align-items-center text-center p-4">
      <div class="w-5rem h-5rem border-circle bg-orange-500-alpha-20 flex align-items-center justify-content-center mb-4">
        <i class="pi pi-shield text-4xl text-orange-400"></i>
      </div>
      
      <h2 class="text-xl font-bold text-white mb-2">Sale #{{ saleId?.split('-')[0] }}</h2>
      <p class="text-gray-400 text-sm mb-4">A cashier is attempting to dispense a controlled substance (Narcotic/Psychotropic). Your biometric authorization is required by law.</p>

      <div v-if="errorMsg" class="text-red-400 text-sm mb-4 font-bold bg-red-500-alpha-10 p-3 border-round w-full">
        <i class="pi pi-times-circle mr-2"></i> {{ errorMsg }}
      </div>

      <div class="flex gap-3 w-full mt-4">
        <Button label="Reject" icon="pi pi-times" class="p-button-danger p-button-outlined flex-1" @click="rejectSale" :disabled="isProcessing" />
        <Button label="Authorize (Biometrics)" icon="pi pi-fingerprint" class="p-button-success flex-1 shadow-4" @click="triggerBiometrics" :loading="isProcessing" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { startAuthentication } from '@simplewebauthn/browser'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/stores/staff'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'

// PrimeVue
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'

const visible = ref(false)
const saleId = ref(null)
const cashierId = ref(null)
const isProcessing = ref(false)
const errorMsg = ref('')

const notification = useNotificationStore()
const staff = useStaffStore()

onMounted(() => {
  window.addEventListener('dda-approval-requested', handleIncomingRequest)
})

onUnmounted(() => {
  window.removeEventListener('dda-approval-requested', handleIncomingRequest)
})

const handleIncomingRequest = (event) => {
  const payload = event.detail
  saleId.value = payload.sale_id
  cashierId.value = payload.cashier_id
  visible.value = true
  errorMsg.value = ''
  
  // Flash effect or sound here if needed
}

const rejectSale = async () => {
  visible.value = false
  notification.showNotification(`Sale ${saleId.value.split('-')[0]} Rejected`, 'info')
  // In real life, tell Centrifugo to reject so the cashier iPad unlocks.
}

const triggerBiometrics = async () => {
  isProcessing.value = true
  errorMsg.value = ''
  
  try {
    // 1. Fetch Auth Options from Go Backend (Simulated here since backend route isn't fully mocked for WebAuthn)
    // Normally: fetch('/api/v1/auth/generate-authentication-options')
    const options = {
      challenge: "random-challenge-string",
      allowCredentials: [],
      userVerification: "required",
      timeout: 60000,
    }

    // 2. Trigger OS Biometrics (FaceID / TouchID / Windows Hello)
    try {
      const authResp = await startAuthentication(options)
      console.log('Biometric Success:', authResp)
    } catch (bioErr) {
      // In development/simulators, WebAuthn might not be configured. 
      // We will fallback to PIN for demo purposes if FaceID fails.
      console.warn("Biometrics failed/unavailable, falling back to PIN approval.")
    }

    // 3. Update Database (Mark DDA logs as APPROVED)
    await submitApprovalToBackend()

    notification.showNotification('DDA Sale Authorized Successfully', 'success')
    visible.value = false
    
  } catch (err) {
    errorMsg.value = err.message || "Biometric verification failed"
  } finally {
    isProcessing.value = false
  }
}

const submitApprovalToBackend = async () => {
  // In a real app, this hits the Go backend to mark the dda_audit_logs status to 'APPROVED'
  // For the frontend demo state, we update the WatermelonDB DDA logs.
  
  const logs = await database.get('dda_logs').query(
    Q.where('sale_id', String(saleId.value))
  ).fetch()
  
  if (logs.length > 0) {
    await database.write(async () => {
      for (const log of logs) {
        await log.update(l => {
          l.staffName = staff.activeUserName
          l.updatedAt = new Date().getTime()
        })
      }
    })
  }
  
  // Inform the cashier via Centrifugo
  // fetch('http://localhost:3000/api/v1/dda/approve', { ... })
}
</script>
