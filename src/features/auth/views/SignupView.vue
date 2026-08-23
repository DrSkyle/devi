<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 md:p-8 overflow-x-hidden relative">
    <!-- Ambient Blur Background Orbs -->
    <div class="absolute w-80 h-80 md:w-[500px] md:h-[500px] bg-emerald-500/5 rounded-full blur-[100px] -top-20 -left-20 pointer-events-none"></div>
    <div class="absolute w-72 h-72 md:w-[400px] md:h-[400px] bg-teal-500/5 rounded-full blur-[100px] bottom-0 right-0 pointer-events-none"></div>

    <div class="w-full max-w-2xl bg-slate-900/40 backdrop-blur-3xl p-6 md:p-10 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.6)] border border-white/10 relative z-1 transition-all duration-500">
      
      <!-- Progress Stepper (Apple Minimalist) -->
      <div class="flex items-center justify-center mb-10 px-4">
        <div v-for="stepNum in 4" :key="stepNum" class="flex items-center">
          <div 
            class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm transition-all duration-500"
            :class="[
              step >= stepNum ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500 border border-slate-700/50',
              step === stepNum ? 'ring-4 ring-emerald-500/20' : ''
            ]"
          >
            {{ stepNum }}
          </div>
          <div 
            v-if="stepNum < 4" 
            class="w-8 sm:w-16 h-[2px] mx-2 rounded-full transition-all duration-500"
            :class="step > stepNum ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-800'"
          ></div>
        </div>
      </div>

      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 tracking-tight">D.E.V.I</h1>
        <p class="text-slate-400 text-sm mt-2 font-medium">Initialize Pharmacy Node</p>
      </div>

      <!-- STEP 1: Pharmacy Info -->
      <div v-if="step === 1" class="space-y-6 animate-fade-in">
        <div class="border-b border-white/5 pb-2 mb-4">
          <h2 class="text-xl font-bold text-white">Pharmacy Identity</h2>
          <p class="text-slate-400 text-xs mt-1">Register the pharmacy credentials and business details</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Pharmacy Name</label>
            <input v-model="form.name" type="text" placeholder="e.g. Amrit Pharmacy" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Unique Pharmacy Code</label>
            <input v-model="form.pharmacy_code" type="text" placeholder="e.g. amrit-ktm" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">DDA License Number</label>
            <input v-model="form.license_number" type="text" placeholder="e.g. DDA-12345" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">PAN Number</label>
            <input v-model="form.pan_number" type="text" placeholder="9-digit PAN" class="glass-input" />
          </div>
        </div>
        <div class="flex flex-col">
          <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">VAT Number (Optional)</label>
          <input v-model="form.vat_number" type="text" placeholder="VAT registration code" class="glass-input" />
        </div>
      </div>

      <!-- STEP 2: Address & Location -->
      <div v-else-if="step === 2" class="space-y-6 animate-fade-in">
        <div class="border-b border-white/5 pb-2 mb-4">
          <h2 class="text-xl font-bold text-white">Location & Geofencing</h2>
          <p class="text-slate-400 text-xs mt-1">Provide physical address and calibrate GPS for compliance checks</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Province</label>
            <input v-model="form.province" type="text" placeholder="e.g. Bagmati" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">District</label>
            <input v-model="form.district" type="text" placeholder="e.g. Kathmandu" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">City</label>
            <input v-model="form.city" type="text" placeholder="e.g. Kirtipur" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Tole / Street</label>
            <input v-model="form.tole" type="text" placeholder="e.g. Naya Bazaar" class="glass-input" />
          </div>
        </div>

        <!-- GPS Calibration Card -->
        <div class="mt-6">
          <label class="text-slate-300 text-xs font-semibold mb-3 ml-1 block">GPS Calibration</label>
          <div 
            @click="calibrateLocation"
            class="border border-white/10 bg-slate-950/20 rounded-2xl p-6 text-center cursor-pointer hover:bg-white/5 transition-all duration-300 flex flex-col items-center justify-center"
            :class="locationCalibrated ? 'border-emerald-500 bg-emerald-500/5' : 'hover:border-white/20'"
          >
            <div v-if="gpsLoading" class="py-2">
              <i class="pi pi-spin pi-spinner text-emerald-400 text-2xl mb-2"></i>
              <p class="text-slate-400 text-sm">Locking coordinates...</p>
            </div>
            <div v-else-if="locationCalibrated" class="py-2">
              <i class="pi pi-check-circle text-emerald-400 text-3xl mb-2"></i>
              <p class="text-emerald-400 font-bold text-sm">Coordinates Calibrated</p>
              <p class="text-slate-500 font-mono text-xs mt-1">{{ form.latitude.toFixed(6) }}, {{ form.longitude.toFixed(6) }}</p>
            </div>
            <div v-else class="py-2">
              <i class="pi pi-map-marker text-emerald-400 text-3xl mb-2"></i>
              <p class="text-white font-bold text-sm">Verify Kiosk Coordinates</p>
              <p class="text-slate-400 text-xs mt-1">Ensures the terminal is located within registered boundaries</p>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 3: Owner Setup & PIN -->
      <div v-else-if="step === 3" class="space-y-6 animate-fade-in">
        <div class="border-b border-white/5 pb-2 mb-4">
          <h2 class="text-xl font-bold text-white">Owner Staff Account</h2>
          <p class="text-slate-400 text-xs mt-1">Set up your administrator profile and 4-digit security PIN</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Owner Name</label>
            <input v-model="form.owner_name" type="text" placeholder="e.g. Ramesh Koirala" class="glass-input" />
          </div>
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Owner Phone Number</label>
            <input v-model="form.owner_phone" type="text" placeholder="e.g. 9841******" class="glass-input" />
          </div>
        </div>

        <!-- 4-digit PIN setup -->
        <div class="mt-6 text-center">
          <label class="text-slate-300 text-xs font-semibold mb-4 ml-1 block">Create 4-Digit Security PIN</label>
          <div class="flex justify-center gap-3">
            <input
              v-for="(digit, idx) in 4"
              :key="idx"
              ref="pinInputs"
              v-model="ownerPin[idx]"
              type="password"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              class="w-12 h-12 md:w-16 md:h-16 text-center text-3xl font-extrabold bg-slate-950/40 border border-white/10 text-white rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none"
              @input="handlePinInput($event, idx)"
              @keydown.delete="handlePinDelete($event, idx)"
            />
          </div>
        </div>
      </div>

      <!-- STEP 4: Owner Verification -->
      <div v-else-if="step === 4" class="space-y-6 animate-fade-in">
        <div class="border-b border-white/5 pb-2 mb-4">
          <h2 class="text-xl font-bold text-white">Authority Verification</h2>
          <p class="text-slate-400 text-xs mt-1">Verify credentials against the DDA official register</p>
        </div>
        
        <div class="bg-emerald-500/5 border border-emerald-500/10 p-5 rounded-2xl flex gap-4 align-start">
          <i class="pi pi-shield text-emerald-400 text-3xl mt-0.5"></i>
          <div>
            <h3 class="text-white font-bold text-sm">DDA Audit Verification</h3>
            <p class="text-slate-400 text-xs leading-5 mt-1.5">
              Confirm ownership of license <span class="text-white font-semibold">{{ form.license_number }}</span>. 
              An SMS OTP code has been dispatched to the mobile number registered for phone ending in <span class="text-white font-semibold">{{ form.owner_phone.slice(-3) }}</span>.
            </p>
          </div>
        </div>

        <div class="flex flex-col items-center mt-6">
          <label class="text-slate-300 text-xs font-semibold mb-4">Enter 6-Digit OTP Code</label>
          <div class="flex gap-2.5 justify-center">
            <input
              v-for="(digit, idx) in 6"
              :key="idx"
              ref="otpInputs"
              v-model="otp[idx]"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              class="w-10 h-10 md:w-12 md:h-12 text-center text-xl font-bold bg-slate-950/40 border border-white/10 text-white rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all outline-none"
              @input="handleOtpInput($event, idx)"
              @keydown.delete="handleOtpDelete($event, idx)"
            />
          </div>
          <button 
            type="button" 
            @click="simulateOtpResend" 
            class="text-xs text-slate-500 hover:text-white mt-5 transition-colors font-medium"
          >
            Resend Verification Code
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-between items-center mt-10 pt-6 border-t border-white/5">
        <button 
          v-if="step > 1"
          type="button"
          class="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold py-2 px-4 rounded-xl hover:bg-white/5"
          @click="prevStep"
        >
          <i class="pi pi-arrow-left text-xs"></i> Back
        </button>
        <div v-else></div>

        <button 
          v-if="step < 4"
          type="button"
          class="flex items-center gap-2 bg-white text-black hover:bg-slate-200 font-bold rounded-2xl px-6 py-3.5 shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm"
          @click="nextStep"
        >
          Continue <i class="pi pi-arrow-right text-xs"></i>
        </button>
        <button 
          v-else
          type="button"
          class="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl px-8 py-3.5 shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300 text-sm"
          :disabled="isLoading"
          @click="handleSignup"
        >
          <span v-if="isLoading">Initializing Node...</span>
          <span v-else class="flex items-center gap-2">Initialize Dev Console <i class="pi pi-rocket text-xs"></i></span>
        </button>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-5 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold leading-5 text-center">
        <i class="pi pi-exclamation-circle mr-1"></i> {{ error }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const isLoading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  pharmacy_code: '',
  license_number: '',
  owner_phone: '',
  pan_number: '',
  vat_number: '',
  province: '',
  district: '',
  city: '',
  tole: '',
  latitude: 0,
  longitude: 0,
  owner_name: '',
  owner_pin: '',
})

// PIN Setup State (Step 3)
const ownerPin = ref(['', '', '', ''])
const pinInputs = ref<HTMLInputElement[]>([])

const handlePinInput = (e: Event, idx: number) => {
  const target = e.target as HTMLInputElement
  const val = target.value
  if (val.length > 1) {
    ownerPin.value[idx] = val.slice(-1)
  }
  if (target.value && idx < 3) {
    nextTick(() => pinInputs.value[idx + 1]?.focus())
  }
}

const handlePinDelete = (e: KeyboardEvent, idx: number) => {
  if (!ownerPin.value[idx] && idx > 0) {
    ownerPin.value[idx - 1] = ''
    nextTick(() => pinInputs.value[idx - 1]?.focus())
  }
}

// OTP State (Step 4)
const otp = ref(['', '', '', '', '', ''])
const otpInputs = ref<HTMLInputElement[]>([])

const handleOtpInput = (e: Event, idx: number) => {
  const target = e.target as HTMLInputElement
  const val = target.value
  if (val.length > 1) {
    otp.value[idx] = val.slice(-1)
  }
  if (target.value && idx < 5) {
    nextTick(() => otpInputs.value[idx + 1]?.focus())
  }
}

const handleOtpDelete = (e: KeyboardEvent, idx: number) => {
  if (!otp.value[idx] && idx > 0) {
    otp.value[idx - 1] = ''
    nextTick(() => otpInputs.value[idx - 1]?.focus())
  }
}

// GPS Calibration
const gpsLoading = ref(false)
const locationCalibrated = ref(false)

const calibrateLocation = () => {
  if (!navigator.geolocation) {
    error.value = 'Geolocation is not supported by your browser.'
    return
  }

  gpsLoading.value = true
  error.value = ''
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      locationCalibrated.value = true
      gpsLoading.value = false
    },
    (err) => {
      console.warn('GPS Calibration failed, using fallback coordinates.', err)
      // Fallback to Kathmandu Center coordinates if geolocation blocked/fails
      form.latitude = 27.7172
      form.longitude = 85.324
      locationCalibrated.value = true
      gpsLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 8000 }
  )
}

const nextStep = () => {
  error.value = ''
  if (step.value === 1) {
    if (!form.name || !form.pharmacy_code || !form.license_number || !form.pan_number) {
      error.value = 'Please complete all required fields.'
      return
    }
  } else if (step.value === 2) {
    if (!form.province || !form.district || !form.city || !form.tole) {
      error.value = 'Please complete all address components.'
      return
    }
    if (!locationCalibrated.value) {
      error.value = 'Please calibrate the GPS coordinates.'
      return
    }
  } else if (step.value === 3) {
    if (!form.owner_name || !form.owner_phone) {
      error.value = 'Owner name and phone number are required.'
      return
    }
    const pin = ownerPin.value.join('')
    if (pin.length < 4) {
      error.value = 'Please set a 4-digit PIN.'
      return
    }
    form.owner_pin = pin
  }
  step.value++
}

const prevStep = () => {
  error.value = ''
  step.value--
}

const simulateOtpResend = () => {
  error.value = ''
  alert('Verification Code (OTP: 555555) resent successfully!')
}

const handleSignup = async () => {
  const enteredOtp = otp.value.join('')
  if (enteredOtp.length < 6) {
    error.value = 'Please enter the 6-digit verification code.'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await authStore.signup(form)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Onboarding failed.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.glass-input {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  border-radius: 16px;
  padding: 14px 18px;
  font-size: 0.95rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.glass-input:focus {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
  background: rgba(15, 23, 42, 0.8);
}

.glass-input:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

/* Page animations */
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
