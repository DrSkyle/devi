<template>
  <div class="signup-container flex align-items-center justify-content-center min-h-screen p-4 overflow-hidden relative">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full gradient-bg z-0"></div>
    <div class="absolute w-30rem h-30rem bg-primary-500 opacity-20 border-circle blur-3xl -top-10 -left-10 animation-float"></div>
    <div class="absolute w-20rem h-20rem bg-blue-500 opacity-20 border-circle blur-3xl bottom-0 right-0 animation-float-delayed"></div>

    <div class="glass-panel p-6 w-full max-w-30rem text-center relative z-1 shadow-8">
      <div class="mb-6">
        <div class="inline-block p-3 border-circle bg-white-alpha-10 mb-4 shadow-4">
             <i class="pi pi-user-plus text-3xl text-white"></i>
        </div>
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">D.E.V.I</h1>
        <p class="text-gray-400">Create your account to get started.</p>
      </div>

      <form @submit.prevent="signUp" class="flex flex-column gap-4">
        <div class="text-left">
          <label for="email" class="block text-white font-medium mb-2 pl-1">Email Address</label>
           <div class="relative">
             <i class="pi pi-at absolute left-3 top-50 z-2 text-gray-400" style="transform: translateY(-50%)"></i>
             <InputText
                id="email"
                type="email"
                placeholder="you@example.com"
                v-model="email"
                class="w-full glass-input pl-7"
                required
             />
           </div>
        </div>
        <div class="text-left">
          <label for="password" class="block text-white font-medium mb-2 pl-1">Password</label>
          <div class="relative">
             <i class="pi pi-lock absolute left-3 top-50 z-2 text-gray-400" style="transform: translateY(-50%)" :style="{top: '25px'}"></i>
             <Password
                id="password"
                v-model="password"
                class="w-full"
                :feedback="false"
                toggleMask
                required
                inputClass="w-full glass-input pl-7"
             />
           </div>
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm text-center bg-red-500-alpha-10 p-2 border-round">{{ errorMessage }}</p>

        <Button
          type="submit"
          :label="isLoading ? 'Creating Account...' : 'Create Account'"
          :loading="isLoading"
          class="w-full font-bold p-3 glass-button-primary"
        />
      </form>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <p class="text-gray-400 text-sm">
          Already have an account?
          <RouterLink to="/login" class="text-primary hover:text-white transition-colors no-underline font-bold"
            >Sign In</RouterLink
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
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
.gradient-bg {
  background: radial-gradient(circle at 50% 50%, #111827 0%, #000000 100%);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}

.glass-input {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: white !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
}

.glass-button-primary {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
}

/* Animations */
.blur-3xl {
  filter: blur(80px);
}

.animation-float {
  animation: float 10s ease-in-out infinite;
}

.animation-float-delayed {
  animation: float 12s ease-in-out infinite reverse;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(20px, -20px); }
  100% { transform: translate(0, 0); }
}

:deep(.p-password input) {
  padding-right: 2.5rem !important;
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
}
</style>
```
