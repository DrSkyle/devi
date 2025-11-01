<template>
  <div v-if="isAppLoading" class="loading-overlay">
    <p>{{ loadingMessage }}</p>
  </div>
  <div v-else class="app-layout">
    <ReloadPWA />
    <SyncStatusIndicator /> <AppSidebar v-if="showNav && isDesktop" />
    <AppPrompt />
    <main
      class="main-content"
      :class="{ 'with-sidebar': showNav && isDesktop, 'with-bottom-nav': showNav && !isDesktop }"
    >
      <VerifyEmailBanner
        v-if="
          user &&
          !user.email_confirmed_at &&
          route.meta.showNav &&
          staffStore.activeUserRole === 'admin'
        "
      />
      <RouterView v-slot="{ Component }">
        <KeepAlive exclude="ReceiptView,ReportsView,ProcessReturnView,CreditNoteView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
    <AppBottomNav v-if="showNav && !isDesktop" />
    <AppNotification />
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { supabase } from '@/supabase'
import { db } from '@/db' // <-- Import Dexie
import AppSidebar from './components/AppSidebar.vue'
import AppBottomNav from './components/AppBottomNav.vue'
import AppNotification from './components/AppNotification.vue'
import AppPrompt from './components/AppPrompt.vue'
import VerifyEmailBanner from './components/VerifyEmailBanner.vue'
import ReloadPWA from './components/ReloadPWA.vue'
import SyncStatusIndicator from './components/SyncStatusIndicator.vue'
import { useProfileStore } from './stores/profile.js'
import { useStaffStore } from './stores/staff.js'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const isDesktop = ref(window.innerWidth >= 1024)
const profileStore = useProfileStore()
const staffStore = useStaffStore()
const isAppLoading = ref(true)
const loadingMessage = ref('Initializing...')

onMounted(async () => {
  const initializeSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const isStaffSession = sessionStorage.getItem('isStaffSession') === 'true'
    user.value = session?.user

    if (user.value && !isStaffSession) {
      // --- ADMIN/OWNER LOGIC (Works Online) ---
      loadingMessage.value = 'Loading Profile...'
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.value.id)
        .single()
      if (profile) {
        await db.profiles.put(profile) // Cache the profile locally
        profileStore.setProfile(profile)
        staffStore.setInitialUser(profile)
      }
    } else if (isStaffSession) {
      // --- STAFF LOGIC (Works OFFLINE) ---
      loadingMessage.value = 'Loading Staff Session...'
      const staffId = sessionStorage.getItem('activeStaffId')

      if (staffId) {
        // We now ONLY check the local database, which is guaranteed to have the data.
        const staffMember = await db.staff.get(staffId)
        const adminProfile = await db.profiles.toCollection().first() // Get the first (and only) profile

        if (staffMember && adminProfile) {
          profileStore.setProfile(adminProfile)
          staffStore.setActiveUser(staffMember)
        } else {
          // This would happen if the local DB is cleared. It's a fail-safe.
          sessionStorage.clear()
          router.push('/login')
        }
      }
    }
    isAppLoading.value = false
  }

  await initializeSession()

  // The onAuthStateChange listener is for handling logins/logouts AFTER the app has started.
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
      // On any auth change, re-run the whole initialization
      initializeSession()
    }
  })
})

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 1024
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const showNav = computed(() => {
  return (user.value || sessionStorage.getItem('isStaffSession') === 'true') && route.meta.showNav
})
</script>

<style>
/* Styles remain the same */
.app-layout {
  display: flex;
  min-height: 100vh;
}
.main-content {
  flex-grow: 1;
  width: 100%;
}
@media (min-width: 1024px) {
  .main-content.with-sidebar {
    margin-left: 250px;
    padding: 2rem;
  }
}
.main-content.with-bottom-nav {
  padding: 1.5rem;
  padding-bottom: 80px;
}
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: var(--color-primary);
}
</style>
