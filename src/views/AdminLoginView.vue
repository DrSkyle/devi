<template>
  <div class="login-container flex align-items-center justify-content-center min-h-screen p-4">
    <div class="glass-panel p-6 w-full max-w-30rem text-center">
      <div class="mb-6">
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Admin Login</h1>
        <p class="text-gray-400">Log in to manage your pharmacy.</p>
      </div>

      <div class="text-center">
        <p class="text-white mb-4">Admin features are now integrated into the main terminal.</p>
        <Button label="Go to Main Terminal" class="glass-button-primary w-full" @click="goToMainLogin" />
      </div>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <!-- Footer links removed -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

const goToMainLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Utility classes handle most styles */
:deep(.p-password input) {
  padding-right: 2.5rem !important;
}
</style>
