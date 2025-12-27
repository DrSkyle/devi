<template>
  <div class="signup-container flex align-items-center justify-content-center min-h-screen p-4">
    <div class="glass-panel p-6 w-full max-w-30rem text-center">
      <div class="mb-6">
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">System Setup</h1>
        <p class="text-gray-400">Initialize your local pharmacy node.</p>
      </div>

      <form @submit.prevent="initializeSystem" class="flex flex-column gap-4">
        <div class="text-left">
          <label for="pharmacyName" class="block text-white font-medium mb-2">Pharmacy Name</label>
          <InputText
            id="pharmacyName"
            v-model="form.pharmacyName"
            placeholder="e.g. City Care Pharmacy"
            class="w-full glass-input"
            required
            autocomplete="off"
          />
        </div>

        <div class="text-left">
          <label for="adminName" class="block text-white font-medium mb-2">Admin Name</label>
          <InputText
            id="adminName"
            v-model="form.adminName"
            placeholder="Your Name"
            class="w-full glass-input"
            required
            autocomplete="name"
          />
        </div>

        <div class="text-left">
          <label for="pin" class="block text-white font-medium mb-2">Create Admin PIN (4-6 digits)</label>
          <InputText
            id="pin"
            v-model="form.pin"
            type="tel"
            maxlength="6"
            placeholder="1234"
            class="w-full glass-input text-center text-2xl tracking-widest"
            required
            pattern="[0-9]*"
            inputmode="numeric"
          />
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm text-left bg-red-500-alpha-10 p-2 border-round">
          {{ errorMessage }}
        </p>

        <Button
          type="submit"
          :label="isLoading ? 'Initializing...' : 'Initialize System'"
          :loading="isLoading"
          class="w-full glass-button-primary font-bold p-3"
        />
      </form>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <RouterLink to="/login" class="text-gray-400 hover:text-white text-sm no-underline"
          >Return to Login</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { localAuth } from '@/services/LocalAuthService'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

const form = reactive({
  pharmacyName: '',
  adminName: '',
  pin: ''
})

const initializeSystem = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    if (form.pin.length < 4) {
      throw new Error("PIN must be at least 4 digits.")
    }

    // Initialize Local Admin & Pharmacy
    await localAuth.initializeAdmin(
        form.adminName,
        form.pin,
        form.pharmacyName
    )

    // Redirect to home on success
    await router.push('/')

  } catch (e) {
    console.error('Initialization failed:', e)
    errorMessage.value = e.message || "Setup failed"
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.signup-container {
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}

:deep(.p-password input) {
  padding-right: 2.5rem !important;
}
</style>
