<template>
  <div class="login-container flex align-items-center justify-content-center min-h-screen p-4 overflow-hidden relative">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full gradient-bg z-0"></div>
    <div class="absolute w-30rem h-30rem bg-primary-500 opacity-20 border-circle blur-3xl -top-10 -left-10 animation-float"></div>
    <div class="absolute w-20rem h-20rem bg-purple-500 opacity-20 border-circle blur-3xl bottom-0 right-0 animation-float-delayed"></div>

    <div class="glass-panel p-6 w-full max-w-30rem text-center relative z-1 shadow-8">

      <!-- Transitions -->
      <transition name="fade" mode="out-in">

        <!-- STEP 1: Find Pharmacy -->
        <div v-if="step === 1" key="step1">
          <div class="mb-6">
            <div class="inline-block p-3 border-circle bg-white-alpha-10 mb-4 shadow-4">
               <i class="pi pi-building text-3xl text-white"></i>
            </div>
            <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Welcome Back</h1>
            <p class="text-gray-400">Enter your Pharmacy Code to access the network.</p>
          </div>

          <form @submit.prevent="findPharmacy" class="flex flex-column gap-4">
            <div class="text-left">
              <label for="pharmacyCode" class="block text-white font-medium mb-2 pl-1">Pharmacy Code</label>
              <div class="relative">
                 <i class="pi pi-hashtag absolute left-3 top-50 z-2 text-gray-400" style="transform: translateY(-50%)"></i>
                 <InputText
                    id="pharmacyCode"
                    v-model="pharmacyCodeInput"
                    placeholder="e.g., amritmeds"
                    class="w-full glass-input pl-7"
                    :class="{ 'p-invalid': errorMessage }"
                    autocapitalize="off"
                 />
              </div>
            </div>
            <p v-if="errorMessage" class="text-red-400 text-sm text-center bg-red-500-alpha-10 p-2 border-round">{{ errorMessage }}</p>

            <Button
              type="submit"
              :label="isLoading ? 'Locating...' : 'Access Terminal'"
              :loading="isLoading"
              class="w-full font-bold p-3 glass-button-primary"
            />
          </form>

          <div class="mt-6 flex justify-content-between text-sm">
            <RouterLink to="/admin-login" class="text-gray-400 hover:text-white transition-colors no-underline">Admin Login</RouterLink>
            <RouterLink to="/signup" class="text-primary hover:text-white transition-colors no-underline font-bold">Create Pharmacy</RouterLink>
          </div>
        </div>

        <!-- STEP 2: Employee ID -->
        <div v-else-if="step === 2" key="step2">
          <div class="mb-6">
            <div class="inline-block px-3 py-1 border-white-alpha-20 border-1 border-round-pill bg-white-alpha-5 text-gray-300 text-xs mb-4 uppercase tracking-wider">
               {{ pharmacy.name }}
            </div>
            <h1 class="text-3xl font-thin text-white mb-2">Who are you?</h1>
            <p class="text-gray-400">Enter your Employee ID.</p>
          </div>
          <form @submit.prevent="submitEmployeeId" class="flex flex-column gap-4">
            <div class="text-left">
               <InputText
                v-model="employeeIdInput"
                placeholder="ID"
                class="w-full text-center text-4xl bg-transparent border-none border-bottom-1 border-white-alpha-20 text-white focus:border-primary transition-colors outline-none"
                style="letter-spacing: 2px"
                autofocus
                autocapitalize="characters"
              />
            </div>

            <Button label="Identify" type="submit" class="w-full p-3 glass-button-primary font-bold mt-4" :disabled="!employeeIdInput" />
            <Button label="Switch Pharmacy" text class="w-full text-gray-500 hover:text-white" @click="step = 1" />
          </form>
        </div>

        <!-- STEP 3: PIN -->
        <div v-else-if="step === 3" key="step3">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-white mb-2">Hello, {{ employeeIdInput }}</h1>
            <p class="text-gray-400">Authenticate with your PIN.</p>
          </div>

          <div class="flex justify-content-center gap-3 mb-6">
             <div v-for="i in 4" :key="i"
                  class="w-3rem h-3rem border-round-xl flex align-items-center justify-content-center transition-all duration-200"
                  :class="pin.length >= i ? 'bg-primary shadow-glow scale-110' : 'bg-white-alpha-10 border-1 border-white-alpha-20'">
                <div v-if="pin.length >= i" class="w-1rem h-1rem border-circle bg-white"></div>
             </div>
          </div>

          <div v-if="errorMessage" class="text-red-400 mb-4 animate-shake">{{ errorMessage }}</div>

          <div class="grid gap-3 max-w-18rem mx-auto">
            <div v-for="n in 9" :key="n" class="col-4 p-0 flex justify-content-center">
              <button
                class="w-4rem h-4rem border-circle glass-numpad text-xl font-bold text-white transition-all cursor-pointer"
                @click="enterDigit(n)"
              >{{ n }}</button>
            </div>
            <div class="col-4 p-0 flex justify-content-center">
              <button class="w-4rem h-4rem border-circle glass-numpad-danger text-xl flex align-items-center justify-content-center" @click="backspace">
                 <i class="pi pi-arrow-left"></i>
              </button>
            </div>
            <div class="col-4 p-0 flex justify-content-center">
              <button class="w-4rem h-4rem border-circle glass-numpad text-xl font-bold text-white transition-all cursor-pointer" @click="enterDigit(0)">0</button>
            </div>
            <div class="col-4 p-0 flex justify-content-center">
              <button class="w-4rem h-4rem border-circle glass-numpad-success text-xl flex align-items-center justify-content-center" @click="checkPin">
                 <i class="pi pi-check" v-if="!isLoading"></i>
                 <i class="pi pi-spin pi-spinner" v-else></i>
              </button>
            </div>
          </div>

          <div class="mt-4">
            <a href="#" @click.prevent="resetToIdStep" class="text-gray-500 hover:text-white text-xs no-underline transition-colors uppercase tracking-wider font-bold">Not you?</a>
          </div>
        </div>

      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'
import SHA256 from 'crypto-js/sha256'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const router = useRouter()
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const notification = useNotificationStore()

const isLoading = ref(false)
const errorMessage = ref('')
const pharmacyCodeInput = ref('')
const pharmacy = reactive({ id: null, name: null, owner_id: null, code: null })
const pin = ref([])
const step = ref(1) // 1: Pharmacy Code, 2: Employee ID, 3: PIN
const employeeIdInput = ref('')

onMounted(async () => {
  await checkProvisioning()
})

// --- DEVICE PROVISIONING LOGIC ---
const checkProvisioning = async () => {
  try {
    const profiles = await database.get('profiles').query().fetch()
    const localProfile = profiles.length > 0 ? profiles[0] : null

    if (localProfile) {
      pharmacy.id = localProfile.pharmacyId || localProfile.id
      pharmacy.name = localProfile.pharmacyName || localProfile.name
      pharmacy.owner_id = localProfile.userId || localProfile.id
      pharmacy.code = localProfile.pharmacyCode || localStorage.getItem('lastPharmacyCode')

      const lastId = localStorage.getItem('lastEmployeeId')
      if (lastId) {
        employeeIdInput.value = lastId
        step.value = 3
      } else {
        step.value = 2
      }
    } else {
      const lastCode = localStorage.getItem('lastPharmacyCode')
      if (lastCode) {
        pharmacyCodeInput.value = lastCode
      }
      await resetLogin()
    }
  } catch (e) {
    console.error('Provisioning check failed:', e)
  }
}

const findPharmacy = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    // In Local-First, we check if we have ANY pharmacy stored locally.
    const pharmacies = await database.get('pharmacies').query().fetch()

    if (pharmacies.length > 0) {
      // If we have a local pharmacy, we just use it.
      // We ignore the input for now unless we support multi-tenancy locally.
      const localP = pharmacies[0]
      pharmacy.id = localP.id
      pharmacy.name = localP.name
      pharmacy.code = localP.pharmacy_code || 'LOCAL'
      step.value = 2
      return
    }

    // If no local pharmacy, we can't "find" one online.
    throw new Error('No pharmacy found on this device. Please Create Pharmacy.')

  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

const submitEmployeeId = () => {
  if (!employeeIdInput.value) return
  step.value = 3
  localStorage.setItem('lastEmployeeId', employeeIdInput.value)
}

const resetToIdStep = () => {
  step.value = 2
  pin.value = []
  errorMessage.value = ''
}

const enterDigit = (digit) => {
  if (pin.value.length < 4) pin.value.push(digit)
}
const backspace = () => pin.value.pop()
const clearPin = () => (pin.value = [])
watch(
  pin,
  (newVal) => {
    if (newVal.length === 4) checkPin()
  },
  { deep: true },
)

const checkPin = async () => {
  if (pin.value.length < 4) return
  const enteredPin = pin.value.join('')
  const hashedPin = SHA256(enteredPin).toString()

  isLoading.value = true
  errorMessage.value = ''

  try {
    // --- STEP 1: OFFLINE / LOCAL CHECK (Priority) ---
    const staffList = await database
      .get('staff')
      .query(
        Q.where('employee_id', employeeIdInput.value.toUpperCase()),
        Q.where('pharmacy_id', String(pharmacy.id)),
      )
      .fetch()

    const localStaff = staffList.length > 0 ? staffList[0] : null

    if (localStaff) {
      // Verify Hash
      if (localStaff.pinHash === hashedPin) {
        if (!localStaff.isActive) throw new Error('This account is inactive.')
        await loginSuccess(localStaff)
        return
      } else if (localStaff.pin === enteredPin) {
         // Legacy cleartext pin check if needed
      }
      throw new Error('Invalid PIN.')
    }

    // --- STEP 2: ONLINE CHECK REMOVED ---
    throw new Error('Staff not found locally. Cloud login is disabled.')

  } catch (err) {
    errorMessage.value = err.message
    isLoading.value = false
    setTimeout(clearPin, 500)
  }
}

// provisionDevice removed - requires Cloud Relay

const loginSuccess = async (staffMember) => {
  const profiles = await database.get('profiles').query().fetch()
  const adminProfile = profiles.length > 0 ? profiles[0] : null

  if (adminProfile) {
    profileStore.setProfile(adminProfile)
  }

  staffStore.setActiveUser(staffMember)

  sessionStorage.setItem('activeStaffId', staffMember.id || staffMember._id)
  sessionStorage.setItem('isStaffSession', 'true')

  notification.showNotification(`Welcome, ${staffMember.name}!`)
  try {
    await router.push('/')
  } catch (e) {
    console.error('loginSuccess: router push failed', e)
  }
}

const resetLogin = async () => {
  pharmacy.id = null
  pharmacy.name = null
  pharmacy.owner_id = null
  pharmacy.code = null
  pharmacyCodeInput.value = ''
  step.value = 1
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

.glass-numpad {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.glass-numpad:active {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

.glass-numpad-danger {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
.glass-numpad-danger:active {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(0.95);
}

.glass-numpad-success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
}
.glass-numpad-success:active {
  background: rgba(16, 185, 129, 0.2);
  transform: scale(0.95);
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

.animate-shake {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

/* Slide Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
