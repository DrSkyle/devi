<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content card">
      <h2>Switch User</h2>
      <div class="pin-display">{{ pin.join('') || '----' }}</div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="keypad">
        <button v-for="n in 9" :key="n" @click="enterDigit(n)">{{ n }}</button>
        <button class="backspace" @click="backspace">⌫</button>
        <button @click="enterDigit(0)">0</button>
        <button class="enter" @click="checkPin">Enter</button>
      </div>
      <button @click="switchToAdmin" class="button-secondary switch-admin-btn">
        Login as Admin
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/supabase'
import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'

const emit = defineEmits(['close'])
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const notification = useNotificationStore()

const pin = ref([])
const error = ref('')

const enterDigit = (digit) => {
  if (pin.value.length < 4) pin.value.push(digit)
}
const clearPin = () => (pin.value = [])
const backspace = () => pin.value.pop()

watch(pin, (newVal) => {
  if (newVal.length === 4) checkPin()
})

const checkPin = async () => {
  if (pin.value.length < 4) return
  const enteredPin = pin.value.join('')

  try {
    const { data: matchedStaff, error: queryError } = await supabase
      .from('staff')
      .select('*')
      .eq('pharmacy_id', profileStore.pharmacyId)
      .eq('pin', enteredPin)
      .single()

    if (queryError || !matchedStaff) throw new Error('Invalid PIN.')
    if (!matchedStaff.is_active) throw new Error('This account is inactive.')

    staffStore.setActiveUser(matchedStaff)
    notification.showNotification(`Switched to ${matchedStaff.name}`)
    emit('close')
  } catch (err) {
    error.value = err.message
    setTimeout(clearPin, 1500)
  }
}

const switchToAdmin = () => {
  // The logic to re-authenticate is complex with Supabase on the client-side.
  // A simpler and secure approach is to log out and log back in as admin.
  notification.showNotification('Please log out and sign in with your admin account.')
  emit('close')
  // For a seamless switch, you would typically need a server-side endpoint.
  // This client-side approach guides the user correctly.
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}
.modal-content {
  max-width: 320px;
  text-align: center;
}
.pin-display {
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 0.5em;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  margin: 1.5rem 0;
  font-family: monospace;
}
.error-message {
  color: var(--color-danger);
  margin-bottom: 1rem;
  height: 1.2em; /* Reserve space to prevent layout shift */
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.keypad button {
  width: 100%;
  height: 60px;
  font-size: 1.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-mute);
  color: var(--color-text);
}
.keypad button:hover {
  background-color: var(--color-slate-gray);
}
.keypad .enter {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
  font-weight: bold;
}
.switch-admin-btn {
  width: 100%;
  margin-top: 1.5rem;
}
</style>
