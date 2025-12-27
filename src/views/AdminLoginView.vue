<template>
  <div class="login-container flex align-items-center justify-content-center min-h-screen p-4">
    <div class="glass-panel p-6 w-full max-w-30rem text-center">
      <div class="mb-6">
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Admin Login</h1>
        <p class="text-gray-400">Log in to manage your pharmacy.</p>
      </div>

      <form @submit.prevent="logIn" class="flex flex-column gap-4">
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

        <div v-if="isBiometricAvailable" class="flex align-items-center gap-2">
          <Checkbox v-model="enableFaceID" binary inputId="faceid" />
          <label for="faceid" class="text-white text-sm cursor-pointer"
            >Enable FaceID for next time</label
          >
        </div>

        <p v-if="errorMessage" class="text-red-400 text-sm text-left">{{ errorMessage }}</p>

        <Button
          type="submit"
          :label="isLoading ? 'Signing In...' : 'Sign In'"
          :loading="isLoading"
          class="w-full"
        />

        <Button
          v-if="showFaceIDButton"
          type="button"
          label="Login with FaceID"
          icon="pi pi-face-smile"
          class="w-full p-button-outlined p-button-secondary text-white"
          @click="loginWithFaceID"
          :loading="isLoading"
        />
      </form>

      <div class="mt-6 pt-4 border-top-1 border-white-alpha-10">
        <p class="text-gray-400 text-sm mb-2">
          Are you a staff member?
          <RouterLink to="/login" class="text-primary no-underline hover:underline"
            >Use Pharmacy Code</RouterLink
          >
        </p>
        <p class="text-gray-400 text-sm">
          Don't have an account?
          <RouterLink to="/signup" class="text-primary no-underline hover:underline"
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
/* Utility classes handle most styles */
:deep(.p-password input) {
  padding-right: 2.5rem !important;
}
</style>
