<template>
  <div v-if="appLoading" class="flex items-center justify-center min-h-screen bg-zinc-950">
    <div class="flex flex-col items-center gap-4">
      <i class="pi pi-spin pi-spinner text-5xl text-emerald-500"></i>
      <h2 class="text-xl font-bold text-white tracking-tight">Initializing DEVI...</h2>
    </div>
  </div>
  <div v-else class="min-h-screen bg-zinc-950">
    <DashboardLayout v-if="authStore.isAuthenticated && !route.meta.public">
      <RouterView />
    </DashboardLayout>
    <RouterView v-else class="flex-grow" />
    
    <Toast position="top-right" />
    <ConfirmDialog />
    <DDAApprovalModal />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import DDAApprovalModal from '@/features/compliance/components/DDAApprovalModal.vue'
import DashboardLayout from '@/components/DashboardLayout.vue'

const route = useRoute()
const authStore = useAuthStore()
const appLoading = computed(() => authStore.isLoading)
const token = authStore.token

onMounted(() => {
  authStore.initSession()
})
</script>
