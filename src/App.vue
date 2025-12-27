<template>
  <div v-if="isAppLoading" class="flex align-items-center justify-content-center min-h-screen">
    <div class="text-center">
      <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
      <p class="text-xl text-600">{{ loadingMessage }}</p>
    </div>
  </div>

  <div v-else class="min-h-screen flex flex-column md:flex-row">
    <!-- Global Overlays -->
    <Toast />
    <ConfirmDialog />
    <ReloadPWA />
    <GlobalSearchModal />

    <!-- Global Input Prompt Dialog -->
    <Dialog
      v-model:visible="promptDialogVisible"
      :header="promptStore.title"
      modal
      :style="{ width: '400px' }"
      :closable="false"
    >
      <div class="flex flex-column gap-3">
        <p class="m-0">{{ promptStore.message }}</p>
        <InputText
          v-if="promptStore.inputType === 'text'"
          v-model="promptInputValue"
          class="w-full"
          autofocus
          @keyup.enter="handlePromptSubmit"
        />
        <InputNumber
          v-else-if="promptStore.inputType === 'number'"
          v-model="promptInputValue"
          class="w-full"
          autofocus
          @keyup.enter="handlePromptSubmit"
        />
      </div>
      <template #footer>
        <Button label="Cancel" text severity="secondary" @click="handlePromptCancel" />
        <Button label="OK" @click="handlePromptSubmit" />
      </template>
    </Dialog>

    <!-- Desktop Sidebar -->
    <div
      v-if="showNav && isDesktop"
      class="w-18rem flex-shrink-0 fixed top-0 left-0 h-screen z-2 hidden md:flex flex-column p-3"
    >
      <AppSidebar />
    </div>

    <!-- Main Content Area -->
    <main
      class="flex-grow-1 w-full transition-all transition-duration-200"
      :class="{ 'md:ml-7': showNav && isDesktop, 'pb-7': showNav && !isDesktop }"
      style="margin-left: 0"
    >
      <!-- Adjust margin-left for desktop sidebar -->
      <div :style="{ marginLeft: showNav && isDesktop ? '18rem' : '0' }">
        <VerifyEmailBanner
          v-if="
            user &&
            !user.email_confirmed_at &&
            route.meta.showNav &&
            staffStore.activeUserRole === 'admin'
          "
        />

        <!-- Sync Status (Absolute or in Header) -->
        <div v-if="showNav" class="p-3 flex justify-content-end">
          <SyncStatusIndicator />
        </div>

        <RouterView v-slot="{ Component }">
          <KeepAlive exclude="ReceiptView,ReportsView,ProcessReturnView,CreditNoteView">
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      </div>
    </main>

    <!-- Mobile Bottom Nav -->
    <div
      v-if="showNav && !isDesktop"
      class="fixed bottom-0 left-0 w-full z-5 surface-card border-top-1 border-200"
    >
      <AppBottomNav />
    </div>
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { database } from '@/database'
// import { sync } from '@/database/sync' // REMOVED
import { Q } from '@nozbe/watermelondb'
import AppSidebar from './components/AppSidebar.vue'
import AppBottomNav from './components/AppBottomNav.vue'
import VerifyEmailBanner from './components/VerifyEmailBanner.vue'
import ReloadPWA from './components/ReloadPWA.vue'
import SyncStatusIndicator from './components/SyncStatusIndicator.vue'
import GlobalSearchModal from './components/GlobalSearchModal.vue'
import { useProfileStore } from './stores/profile.js'
import { useStaffStore } from './stores/staff.js'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import { useWindowSize } from '@vueuse/core'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const { width } = useWindowSize()
const isDesktop = computed(() => width.value >= 1024)
const profileStore = useProfileStore()
const staffStore = useStaffStore()
const isAppLoading = ref(true)
const loadingMessage = ref('Initializing...')

import { localAuth } from '@/services/LocalAuthService'
import { useIdle } from '@vueuse/core'

const SESSION_TIMEOUT = 15 * 60 * 1000 // 15 Minutes
const { idle } = useIdle(SESSION_TIMEOUT)

watch(idle, (isIdle) => {
  if (isIdle && (user.value || staffStore.activeUserId)) {
    console.warn('[Session] User inactive. Locking session.')
    localAuth.logout()
    staffStore.clearUser()
    profileStore.clearUser() // Optional, depending on if we want to clear pharmacy context too. Usually just staff.
    sessionStorage.clear()
    router.push('/login')
    toast.add({
      severity: 'warn',
      summary: 'Session Locked',
      detail: 'You have been logged out due to inactivity.',
      life: 5000,
    })
  }
})

onMounted(async () => {
  // Initialize Realtime Service
  // realtimeService.initialize()

  const initializeSession = async () => {
    // Local-First: We check if we have a locally saved profile or active staff session.
    // We do NOT check Supabase session anymore.

    // Check if we are in "Admin/Owner" mode (usually profile exists in local DB)
    // or "Staff" mode (sessionStorage has flag).

    const isStaffSession = sessionStorage.getItem('isStaffSession') === 'true'

    if (!isStaffSession) {
      loadingMessage.value = 'Loading Profile...'
      await profileStore.loadFromLocalDatabase()

      if (profileStore.userId) {
        // We have a local profile, set it as "User" context effectively
        user.value = { id: profileStore.userId, email: 'local@admin' }

        staffStore.setInitialUser({
          id: profileStore.userId,
          role: profileStore.role,
          name: profileStore.name,
        })
      }
    } else {
      // --- STAFF LOGIC (Works OFFLINE) ---
      loadingMessage.value = 'Loading Staff Session...'
      const staffId = sessionStorage.getItem('activeStaffId')

      if (staffId) {
        let staffMember = null
        try {
          staffMember = await database.get('staff').find(staffId)
        } catch {
          const results = await database.get('staff').query(Q.where('id', staffId)).fetch()
          if (results.length > 0) staffMember = results[0]
        }

        const profiles = await database.get('profiles').query().fetch()
        const adminProfile = profiles.length > 0 ? profiles[0] : null

        if (staffMember && adminProfile) {
          profileStore.setProfile(adminProfile)
          staffStore.setActiveUser(staffMember)
        } else {
          sessionStorage.clear()
          router.push('/login')
        }
      }
    }
    isAppLoading.value = false
  }

  await initializeSession()
  // The onAuthStateChange listener is for handling logins/logouts AFTER the app has started.
  // supabase.auth.onAuthStateChange Removed
})

const showNav = computed(() => {
  const hasUser =
    user.value || staffStore.activeUserId || sessionStorage.getItem('isStaffSession') === 'true'
  return hasUser && route.meta.showNav
})

// --- BRIDGE LOGIC: Connect Legacy Stores to PrimeVue ---
import { useNotificationStore } from './stores/notification'
import { usePromptStore } from './stores/prompt'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { watch } from 'vue'

const notificationStore = useNotificationStore()
const promptStore = usePromptStore()
const toast = useToast()
const confirm = useConfirm()

// Watch Notification Store
watch(
  () => notificationStore.isVisible,
  (visible) => {
    if (visible) {
      toast.add({
        severity: notificationStore.type,
        summary: notificationStore.type === 'error' ? 'Error' : 'Success',
        detail: notificationStore.message,
        life: 4000,
      })
      // We don't need to manually set isVisible to false because the store does it with setTimeout,
      // but PrimeVue handles the closing. We just let the store reset itself.
    }
  },
)

// Watch Prompt Store (For Confirms only - Prompts with input need a custom Dialog in App.vue or refactor)
// The prompt store handles both 'confirm' and 'prompt' (input).
// PrimeVue ConfirmDialog handles 'confirm'.
// For 'prompt', we need a Dialog.
const promptDialogVisible = ref(false)
const promptInputValue = ref('')

watch(
  () => promptStore.isVisible,
  (visible) => {
    if (visible) {
      if (promptStore.mode === 'confirm') {
        confirm.require({
          header: promptStore.title,
          message: promptStore.message,
          icon: 'pi pi-exclamation-triangle',
          accept: () => promptStore.confirm(),
          reject: () => promptStore.cancel(),
        })
      } else {
        // It's an input prompt
        promptInputValue.value = promptStore.inputValue
        promptDialogVisible.value = true
      }
    } else {
      promptDialogVisible.value = false
    }
  },
)

const handlePromptSubmit = () => {
  promptStore.inputValue = promptInputValue.value
  promptStore.confirm()
  promptDialogVisible.value = false
}

const handlePromptCancel = () => {
  promptStore.cancel()
  promptDialogVisible.value = false
}
</script>

<style>
body {
  margin: 0;
  background-color: var(--surface-ground);
  font-family: var(--font-family);
}
</style>
