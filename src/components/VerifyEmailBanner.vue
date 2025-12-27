<template>
  <div class="verify-email-banner">
    <p>
      Your email is not verified. Please check your inbox for a verification link to unlock all
      features.
    </p>
    <button @click="resendVerification" :disabled="isSending">
      {{ isSending ? 'Sending...' : 'Resend Verification Email' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notification = useNotificationStore()
const isSending = ref(false)

const resendVerification = async () => {
  isSending.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    })
    if (error) throw error
    notification.showNotification('A new verification email has been sent.')
  } catch (error) {
    notification.showNotification(`Error: ${error.message}`, 'error')
  } finally {
    isSending.value = false
  }
}
</script>

<style scoped>
.verify-email-banner {
  background-color: var(--color-danger);
  color: var(--color-soft-cream);
  padding: 1rem;
  text-align: center;
  position: sticky;
  top: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.verify-email-banner p {
  margin: 0;
}
.verify-email-banner button {
  width: auto;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  background-color: var(--color-soft-cream);
  color: var(--color-danger);
  border: none;
}
</style>
