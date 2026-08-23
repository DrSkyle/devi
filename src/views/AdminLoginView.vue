<template>
  <div
    class="login-container flex align-items-center justify-content-center min-h-screen p-4 overflow-hidden relative"
  >
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full gradient-bg z-0"></div>
    <div
      class="absolute w-30rem h-30rem bg-primary-500 opacity-20 border-circle blur-3xl -top-10 -left-10 animation-float"
    ></div>
    <div
      class="absolute w-20rem h-20rem bg-purple-500 opacity-20 border-circle blur-3xl bottom-0 right-0 animation-float-delayed"
    ></div>

    <div class="glass-panel p-6 w-full max-w-30rem text-center relative z-1 shadow-8">
      <div class="mb-6">
        <div class="inline-block p-3 border-circle bg-white-alpha-10 mb-4 shadow-4">
          <i class="pi pi-shield text-3xl text-white"></i>
        </div>
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Admin Login</h1>
        <p class="text-gray-400">Log in to manage your pharmacy.</p>
      </div>

      <form @submit.prevent="logIn" class="flex flex-column gap-4">
        <div class="text-left">
          <label for="email" class="block text-white font-medium mb-2 pl-1">Email Address</label>
          <div class="relative">
            <i
              class="pi pi-at absolute left-3 top-50 z-2 text-gray-400"
              style="transform: translateY(-50%)"
            ></i>
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
            <i
              class="pi pi-lock absolute left-3 top-50 z-2 text-gray-400"
              style="transform: translateY(-50%)"
              :style="{ top: '25px' }"
            ></i>
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

        <div v-if="isBiometricAvailable" class="flex align-items-center gap-2 pl-1">
          <Checkbox v-model="enableFaceID" binary inputId="faceid" class="glass-checkbox" />
          <label for="faceid" class="text-gray-300 text-sm cursor-pointer hover:text-white"
            >Enable FaceID for next time</label
          >
        </div>

        <p
          v-if="errorMessage"
          class="text-red-400 text-sm text-center bg-red-500-alpha-10 p-2 border-round"
        >
          {{ errorMessage }}
        </p>

        <Button
          type="submit"
          :label="isLoading ? 'Signing In...' : 'Sign In'"
          :loading="isLoading"
          class="w-full font-bold p-3 glass-button-primary"
        />

        <Button
          v-if="showFaceIDButton"
          type="button"
          label="Login with FaceID"
          icon="pi pi-face-smile"
          class="w-full p-button-text text-white hover:bg-white-alpha-10"
          @click="loginWithFaceID"
          :loading="isLoading"
        />
      </form>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <p class="text-gray-400 text-sm mb-2">
          Are you a staff member?
          <RouterLink
            to="/login"
            class="text-primary hover:text-white transition-colors no-underline font-bold"
            >Use Pharmacy Code</RouterLink
          >
        </p>
        <p class="text-gray-400 text-sm">
          Don't have an account?
          <RouterLink
            to="/signup"
            class="text-primary hover:text-white transition-colors no-underline font-bold"
            >Create Pharmacy</RouterLink
          >
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { database } from '@/database'
import { useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { BiometricService } from '@/services/BiometricService'
// import { supabase } from '@/supabase' // Ensure supabase import is present

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const enableFaceID = ref(false)
const showFaceIDButton = ref(false)
const isBiometricAvailable = ref(false)

const router = useRouter()
const notification = useNotificationStore()

onMounted(async () => {
  isBiometricAvailable.value = await BiometricService.isAvailable()
  const storedToken = localStorage.getItem('biometric_token')
  if (isBiometricAvailable.value && storedToken) {
    showFaceIDButton.value = true
    // Optional: Auto-trigger
    // loginWithFaceID()
  }
})

const loginWithFaceID = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const verified = await BiometricService.verifyUser()
    if (!verified) {
      throw new Error('FaceID verification failed.')
    }

    const storedToken = localStorage.getItem('biometric_token')
    if (!storedToken) throw new Error('No credentials stored.')

    const [storedEmail, storedPass] = atob(storedToken).split(':')

    const { error } = await supabase.auth.signInWithPassword({
      email: storedEmail,
      password: storedPass,
    })

    if (error) throw error

    await handleLoginSuccess()
  } catch (e) {
    errorMessage.value = e.message || 'Biometric login failed.'
    // If failed, maybe clear token?
    // localStorage.removeItem('biometric_token')
    // showFaceIDButton.value = false
  } finally {
    isLoading.value = false
  }
}

const logIn = async () => {
  isLoading.value = true
  errorMessage.value = ''

  // NOTE: In local-first mode, we might want to support local admin login (without Supabase)
  // But for now, Admin Login assumes Cloud Account.
  // If we wanted local, we'd check 'profiles' table first like we did in LoginView.
  // Keeping Supabase logic for now as it handles the "Cloud" part of Hybrid.

  const { error, data } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    errorMessage.value = 'Invalid email or password.'
    isLoading.value = false
  } else {
    // Handle FaceID Registration
    if (enableFaceID.value && isBiometricAvailable.value) {
      const registered = await BiometricService.createCredential(data.user.id, 'register')
      if (registered) {
        const token = btoa(`${email.value}:${password.value}`)
        localStorage.setItem('biometric_token', token)
        notification.showNotification('FaceID enabled for next time!', 'success')
      } else {
        notification.showNotification('Failed to enable FaceID.', 'error')
      }
    }

    await handleLoginSuccess()
  }
}

const handleLoginSuccess = async () => {
  // Pre-fetch profile to ensure router doesn't redirect to setup
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        await database.write(async () => {
          // Save Profile
          const profilesCollection = database.get('profiles')
          const profileToSave = { ...profile }
          delete profileToSave.pharmacies // Remove nested object

          try {
            const existing = await profilesCollection.find(profile.id)
            await existing.update((rec) => {
              Object.keys(profileToSave).forEach((key) => {
                if (key !== 'id') rec[key] = profileToSave[key]
              })
            })
          } catch {
            await profilesCollection.create((rec) => {
              rec._raw.id = profile.id
              Object.keys(profileToSave).forEach((key) => {
                if (key !== 'id') rec[key] = profileToSave[key]
              })
            })
          }
        })
      } else {
        // HANDLE ORPHANED ADMIN CASE (Has Pharmacy, No Profile)
        const { data: pharmacy } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (pharmacy) {
          console.log('Found orphaned pharmacy. Re-creating profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              pharmacy_id: pharmacy.id,
              name: 'Admin', // Default name
              role: 'admin',
            })
            .select()
            .single()

          if (newProfile && !createError) {
            await database.write(async () => {
              const profilesCollection = database.get('profiles')
              await profilesCollection.create((rec) => {
                rec._raw.id = newProfile.id
                Object.keys(newProfile).forEach((key) => {
                  if (key !== 'id') rec[key] = newProfile[key]
                })
              })
            })
            notification.showNotification('Profile restored!', 'success')
          } else {
            console.error('Failed to restore profile:', createError)
          }
        }
      }
    }
  } catch (e) {
    console.error('Profile pre-fetch failed', e)
  }

  notification.showNotification('Admin login successful!', 'success')
  router.push('/')
  isLoading.value = false
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
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, -20px);
  }
  100% {
    transform: translate(0, 0);
  }
}

:deep(.p-password input) {
  padding-right: 2.5rem !important;
  /* Allow glass-input class to style the input */
  width: 100%;
}

:deep(.p-password) {
  width: 100%;
}
</style>
