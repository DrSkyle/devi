<template>
  <Dialog
    visible
    modal
    :closable="false"
    :style="{ width: '320px' }"
    header="Switch User"
    @update:visible="$emit('close')"
  >
    <div class="flex flex-column align-items-center gap-4">
      <div class="text-center">
        <p class="text-600 mb-3">Enter your 4-digit PIN</p>
        <InputOtp v-model="pin" :length="4" integerOnly mask />
      </div>

      <div v-if="error" class="text-red-500">{{ error }}</div>

      <div class="flex flex-column w-full gap-2">
        <Button label="Login" icon="pi pi-check" @click="checkPin" :disabled="pin.length !== 4" />
        <Button label="Login as Admin" text @click="switchToAdmin" />
        <Button label="Cancel" text severity="secondary" @click="$emit('close')" />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useStaffStore } from '@/features/staff/store'
import { useProfileStore } from '@/features/profile/store'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputOtp from 'primevue/inputotp'
import SHA256 from 'crypto-js/sha256'

const emit = defineEmits(['close'])
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const toast = useToast()

const pin = ref('')
const error = ref('')

const checkPin = async () => {
  if (pin.value.length < 4) return

  try {
    const hashedPin = SHA256(pin.value).toString()

    const { data: staffMember, error: matchError } = await supabase
      .from('staff')
      .select('*')
      .eq('pharmacy_id', profileStore.pharmacyId)
      .eq('pin_hash', hashedPin)
      .eq('is_active', true)
      .maybeSingle()

    if (matchError || !staffMember) throw new Error('Invalid PIN.')

    staffStore.setActiveUser(staffMember)
    toast.add({
      severity: 'success',
      summary: 'Switched User',
      detail: `Switched to ${staffMember.name}`,
      life: 3000,
    })
    emit('close')
  } catch (err) {
    error.value = err.message
    setTimeout(() => {
      pin.value = ''
      error.value = ''
    }, 1500)
  }
}

const switchToAdmin = () => {
  toast.add({
    severity: 'info',
    summary: 'Admin Login',
    detail: 'Please log out and sign in with your admin account.',
    life: 5000,
  })
  emit('close')
}
</script>

<style scoped>
/* PrimeFlex handles layout */
</style>
