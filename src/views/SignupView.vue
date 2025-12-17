<template>
  <div class="signup-container flex align-items-center justify-content-center min-h-screen p-4">
    <div class="glass-panel p-6 w-full max-w-30rem text-center">
      <div class="mb-6">
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">D.E.V.I</h1>
        <p class="text-gray-400">Create your account to get started.</p>
      </div>

      <form @submit.prevent="signUp" class="flex flex-column gap-4">
        <div class="text-left">
          <label for="email" class="block text-white font-medium mb-2">Email Address</label>
          <InputText
            id="email"
            type="email"
            placeholder="you@example.com"
            v-model="email"
            class="w-full"
            required
          />
        </div>
        <div class="text-left">
          <label for="password" class="block text-white font-medium mb-2">Password</label>
          <Password
            id="password"
            v-model="password"
            class="w-full"
            :feedback="false"
            toggleMask
            required
            inputClass="w-full"
          />
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm text-left">{{ errorMessage }}</p>

        <Button
          type="submit"
          :label="isLoading ? 'Creating Account...' : 'Create Account'"
          :loading="isLoading"
          class="w-full"
        />
      </form>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <p class="text-gray-400 text-sm">
          Already have an account?
          <RouterLink to="/login" class="text-primary no-underline hover:underline"
            >Sign In</RouterLink
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const signUp = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // SIMULATION: In Local-First Mode, 'Signup' is just a formality before Profile Setup.
    // We don't actually create a cloud account yet.
    // We just pass the email/password to the next step or ignore them for now 
    // since we are storing everything locally.
    
    // Validate inputs
    if (!email.value || !password.value) {
       throw new Error("Email and Password are required.")
    }

    if (password.value.length < 6) {
       throw new Error("Password must be at least 6 characters.")
    }

    // Simulate network delay
    await new Promise(r => setTimeout(r, 800))

    // In a real local-first app, we might store these creds in a secure vault 
    // or just proceed to create the Pharmacy Profile.
    // We'll proceed to Profile Setup.
    await router.push('/profile-setup')

  } catch (e) {
    console.error('Signup failed:', e)
    errorMessage.value = e.message || "Signup failed"
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
