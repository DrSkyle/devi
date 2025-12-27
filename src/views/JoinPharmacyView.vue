<template>
  <div class="join-container">
    <div class="card join-card">
      <div class="card-header">
        <h1 class="title">Join a Pharmacy</h1>
        <p class="subtitle">Enter the invite code provided by your pharmacy's administrator.</p>
      </div>

      <form @submit.prevent="joinPharmacy">
        <div class="form-group">
          <label for="inviteCode">Invite Code</label>
          <input
            id="inviteCode"
            type="text"
            v-model="inviteCode"
            required
            placeholder="e.g., PHARM-123456"
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Joining...' : 'Join Pharmacy' }}
        </button>
      </form>
      <div class="card-footer">
        <p>
          Are you the pharmacy owner?
          <a href="#" @click.prevent="logOutAndGoToSetup">Log out and start setup</a>.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { database } from '@/database'

const inviteCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()
const notification = useNotificationStore()

const joinPharmacy = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
      // P2P Handshake
      const { networkService } = await import('@/services/NetworkService')
      
      networkService.joinAsGuest(inviteCode.value.trim().toUpperCase(), async (credentialData) => {
          isLoading.value = false
          
          if (!credentialData.success) {
              errorMessage.value = "Invite rejected by host."
              return
          }

          // Save Received Credentials
          // Ideally we save this to a 'pharmacy_config' or similar
          localStorage.setItem('lastPharmacyCode', credentialData.pharmacyCode)
          localStorage.setItem('joinedPharmacyName', credentialData.pharmacyName)
          localStorage.setItem('joinedPharmacyId', credentialData.pharmacyId)

          notification.showNotification(`Joined ${credentialData.pharmacyName}!`, 'success')
          
          // Redirect to Login to enter Employee ID (which the Admin just verbally told them or sent)
          setTimeout(() => router.push('/login'), 1000)
      })

      // Timeout if no host found
      setTimeout(() => {
          if (isLoading.value) {
              isLoading.value = false
              errorMessage.value = "No pharmacy hosting this code found nearby. Ask Admin to keep the Invite screen open."
          }
      }, 15000)

  } catch (error) {
    errorMessage.value = error.message
    isLoading.value = false
  }
}

const logOutAndGoToSetup = async () => {
  await database.unsafeResetDatabase()
  router.push('/signup')
}
</script>

<style scoped>
.join-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}
.join-card {
  width: 100%;
  max-width: 420px;
  text-align: center;
}
.card-header {
  margin-bottom: 2.5rem;
}
.title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.subtitle {
  color: var(--color-text-light);
}
.form-group {
  text-align: left;
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-light-slate);
}
.error-message {
  color: var(--color-danger);
  margin-bottom: 1.5rem;
}
.card-footer {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.card-footer a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
</style>
