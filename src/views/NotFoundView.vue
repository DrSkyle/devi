<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-surface-900 text-center p-4"
  >
    <h1 class="text-9xl font-extrabold text-primary-400 mb-4">404</h1>
    <h2 class="text-4xl font-bold text-white mb-4">Page Not Found</h2>
    <p class="text-xl text-gray-400 mb-8 max-w-md">
      Oops! The page you are looking for does not exist. It might have been moved or deleted.
    </p>
    <router-link
      to="/"
      class="px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-primary-500/50"
    >
      Return to Home
    </router-link>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
</script>
