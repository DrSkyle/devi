<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-4 md:p-8 overflow-x-hidden relative">
    <!-- Ambient Blur Background Orbs -->
    <div class="absolute w-72 h-72 md:w-[450px] md:h-[450px] bg-primary-500/5 rounded-full blur-[100px] -top-10 -left-10 pointer-events-none"></div>
    <div class="absolute w-72 h-72 md:w-[400px] md:h-[400px] bg-emerald-500/5 rounded-full blur-[100px] bottom-0 right-0 pointer-events-none"></div>

    <div class="w-full max-w-md bg-slate-900/40 backdrop-blur-3xl p-6 md:p-10 rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.6)] border border-white/10 relative z-1 transition-all duration-500">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_8px_25px_rgba(16,185,129,0.3)]">
          <i class="pi pi-shield text-3xl text-white"></i>
        </div>
        <h1 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">D.E.V.I</h1>
        <p class="text-slate-400 text-xs mt-2 font-medium">Pharmacy Kiosk Authentication</p>
      </div>

      <!-- STATE 1: Connect Pharmacy Code (If not bound yet) -->
      <div v-if="!isBound" class="space-y-6 animate-fade-in">
        <div class="text-center mb-2">
          <h2 class="text-lg font-bold text-white">Link Kiosk Terminal</h2>
          <p class="text-slate-400 text-xs mt-1.5 leading-5">
            Enter your unique Pharmacy Code to associate this workstation with your branch.
          </p>
        </div>
        <div class="flex flex-col">
          <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Pharmacy Code</label>
          <input 
            v-model="tempCode" 
            type="text"
            placeholder="e.g. amrit-ktm" 
            class="glass-input text-center uppercase tracking-widest font-mono" 
          />
        </div>
        <button 
          type="button"
          class="w-full py-4 bg-white text-black hover:bg-slate-200 font-bold rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
          :disabled="isFetchingStaff"
          @click="bindPharmacy"
        >
          <i v-if="isFetchingStaff" class="pi pi-spin pi-spinner text-black"></i>
          <span v-else class="flex items-center gap-2">Link Kiosk <i class="pi pi-link text-xs"></i></span>
        </button>
        
        <div class="text-center mt-6 pt-5 border-t border-white/5">
          <p class="text-xs text-slate-500 font-medium">
            New node initialization? 
            <RouterLink to="/signup" class="text-emerald-400 hover:text-emerald-300 hover:underline font-bold transition-colors">Register Pharmacy</RouterLink>
          </p>
        </div>
      </div>

      <!-- STATE 2: Staff Selection & PIN Login -->
      <div v-else class="space-y-6 animate-fade-in">
        <div class="text-center bg-slate-950/20 p-4 border border-white/5 rounded-2xl">
          <p class="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Kiosk Terminal Active</p>
          <h2 class="text-lg font-bold text-white mt-1">{{ pharmacyName }}</h2>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          
          <!-- Staff Selector Dropdown -->
          <div class="flex flex-col">
            <label class="text-slate-300 text-xs font-semibold mb-2 ml-1">Identify Staff Profile</label>
            <div class="relative">
              <select 
                v-model="selectedStaffId" 
                class="w-full p-4 bg-slate-950/40 border border-white/10 text-white rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all text-sm cursor-pointer appearance-none"
              >
                <option value="" disabled>Select your staff profile...</option>
                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                  {{ staff.name }} ({{ staff.role }})
                </option>
              </select>
              <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <i class="pi pi-chevron-down text-xs"></i>
              </div>
            </div>
          </div>

          <!-- 4-digit PIN input -->
          <div class="flex flex-col text-center">
            <label class="text-slate-300 text-xs font-semibold mb-4 ml-1 block">Kiosk Passcode</label>
            <div class="flex justify-center gap-3">
              <input
                v-for="(digit, idx) in 4"
                :key="idx"
                ref="pinInputs"
                v-model="pin[idx]"
                type="password"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                class="w-12 h-12 md:w-14 md:h-14 text-center text-3xl font-extrabold bg-slate-950/40 border border-white/10 text-white rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all outline-none"
                @input="handleInput($event, idx)"
                @keydown.delete="handleDelete($event, idx)"
                :disabled="!selectedStaffId"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-[0_8px_25px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all duration-300 text-sm flex items-center justify-center gap-2"
            :disabled="!selectedStaffId || pin.join('').length < 4 || isLoading"
          >
            <i v-if="isLoading" class="pi pi-spin pi-spinner text-white"></i>
            <span v-else class="flex items-center gap-2">Verify & Authenticate <i class="pi pi-arrow-right text-xs"></i></span>
          </button>
        </form>

        <div class="flex justify-between items-center text-xs mt-6 pt-5 border-t border-white/5">
          <button @click="unbindPharmacy" type="button" class="text-slate-500 hover:text-white font-semibold transition-colors flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-white/5">
            <i class="pi pi-sign-out"></i> Switch Pharmacy
          </button>
          <RouterLink to="/signup" class="text-emerald-400 hover:text-emerald-300 font-bold transition-colors">
            Onboard New
          </RouterLink>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-5 p-4 bg-red-950/40 border border-red-500/20 rounded-2xl text-red-400 text-xs font-semibold leading-5 text-center">
        <i class="pi pi-exclamation-circle mr-1"></i> {{ error }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'
import { apiClient } from '@/core/api'

const router = useRouter()
const authStore = useAuthStore()

// State
const isBound = ref(false)
const pharmacyName = ref('')
const pharmacyCode = ref('')
const tempCode = ref('')
const selectedStaffId = ref('')
const staffList = ref<Array<{ id: string; name: string; role: string }>>([])

const pin = ref(['', '', '', ''])
const pinInputs = ref<HTMLInputElement[]>([])

const isFetchingStaff = ref(false)
const isLoading = ref(false)
const error = ref('')

onMounted(async () => {
  const savedCode = localStorage.getItem('pharmacyCode')
  if (savedCode) {
    pharmacyCode.value = savedCode
    await loadStaffList(savedCode)
  }
})

// Load active staff members for a pharmacy code
const loadStaffList = async (code: string) => {
  isFetchingStaff.value = true
  error.value = ''
  try {
    const response = await apiClient.get('/auth/staff-list', { params: { code } })
    staffList.value = response.data.staff
    pharmacyName.value = response.data.pharmacyName
    pharmacyCode.value = code
    isBound.value = true
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to fetch staff members. Please verify code.'
    localStorage.removeItem('pharmacyCode')
    isBound.value = false
  } finally {
    isFetchingStaff.value = false
  }
}

// Bind terminal using Pharmacy Code
const bindPharmacy = async () => {
  if (!tempCode.value.trim()) {
    error.value = 'Please input a Pharmacy Code.'
    return
  }
  await loadStaffList(tempCode.value.trim().toLowerCase())
}

const unbindPharmacy = () => {
  localStorage.removeItem('pharmacyCode')
  localStorage.removeItem('pharmacyName')
  isBound.value = false
  pharmacyCode.value = ''
  pharmacyName.value = ''
  selectedStaffId.value = ''
  staffList.value = []
  pin.value = ['', '', '', '']
}

// PIN Autofocus Shifts
const handleInput = (e: Event, idx: number) => {
  const target = e.target as HTMLInputElement
  const val = target.value
  
  if (val.length > 1) {
    pin.value[idx] = val.slice(-1)
  }
  
  if (target.value && idx < 3) {
    nextTick(() => pinInputs.value[idx + 1]?.focus())
  }
}

const handleDelete = (e: KeyboardEvent, idx: number) => {
  if (!pin.value[idx] && idx > 0) {
    pin.value[idx - 1] = ''
    nextTick(() => pinInputs.value[idx - 1]?.focus())
  }
}

// Login execution
const handleLogin = async () => {
  const pinCode = pin.value.join('')
  if (pinCode.length < 4) {
    error.value = 'PIN code must be 4 digits.'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    await authStore.login(pharmacyCode.value, selectedStaffId.value, pinCode)
    router.push('/')
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Authentication failed. Incorrect PIN.'
    pin.value = ['', '', '', '']
    nextTick(() => pinInputs.value[0]?.focus())
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
