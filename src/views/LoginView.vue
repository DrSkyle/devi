<template>
  <div class="login-container flex align-items-center justify-content-center min-h-screen p-4 overflow-hidden relative select-none">
    <!-- Ambient Background -->
    <div class="absolute top-0 left-0 w-full h-full bg-black z-0"></div>
    <div class="absolute w-30rem h-30rem bg-primary-500 opacity-20 border-circle blur-3xl -top-10 -left-10 animation-float"></div>
    <div class="absolute w-20rem h-20rem bg-blue-500 opacity-20 border-circle blur-3xl bottom-0 right-0 animation-float-delayed"></div>

    <!-- The Shared Kiosk Lock Screen -->
    <div class="p-6 w-full max-w-25rem text-center relative z-1">
      
      <!-- Logo / Pharmacy Name -->
      <div class="mb-6 flex flex-column align-items-center">
        <div class="w-4rem h-4rem border-circle bg-white-alpha-10 flex align-items-center justify-content-center mb-4 shadow-4 border-1 border-white-alpha-20">
          <i class="pi pi-lock text-2xl text-primary"></i>
        </div>
        <h1 class="text-3xl font-thin text-white tracking-tight mb-1">{{ pharmacyName }}</h1>
        <p class="text-gray-400 text-sm font-medium tracking-widest uppercase">Select Profile & Unlock</p>
      </div>

      <!-- PIN Dots -->
      <div class="flex justify-content-center gap-4 mb-8">
        <div v-for="i in 4" :key="i"
             class="w-1rem h-1rem border-circle transition-all duration-200"
             :class="pin.length >= i ? 'bg-primary shadow-glow scale-150' : 'bg-white-alpha-20'">
        </div>
      </div>

      <div v-if="errorMessage" class="text-red-400 mb-6 animate-shake font-bold">{{ errorMessage }}</div>

      <!-- Hardware Accelerated Numpad -->
      <div class="grid gap-3 mx-auto px-4">
        <div v-for="n in 9" :key="n" class="col-4 p-0 flex justify-content-center">
          <button
            class="w-5rem h-5rem border-circle glass-numpad text-2xl font-bold text-white transition-all cursor-pointer shadow-4"
            @click="enterDigit(n)"
          >{{ n }}</button>
        </div>
        <div class="col-4 p-0 flex justify-content-center">
          <button class="w-5rem h-5rem border-circle glass-numpad-danger text-xl flex align-items-center justify-content-center shadow-4" @click="backspace">
            <i class="pi pi-delete-left"></i>
          </button>
        </div>
        <div class="col-4 p-0 flex justify-content-center">
          <button class="w-5rem h-5rem border-circle glass-numpad text-2xl font-bold text-white transition-all cursor-pointer shadow-4" @click="enterDigit(0)">0</button>
        </div>
        <div class="col-4 p-0 flex justify-content-center">
          <button class="w-5rem h-5rem border-circle glass-numpad-success text-xl flex align-items-center justify-content-center shadow-4" @click="checkPin" :disabled="pin.length !== 4">
            <i class="pi pi-arrow-right" v-if="!isLoading"></i>
            <i class="pi pi-spin pi-spinner" v-else></i>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { useStaffStore } from '@/stores/staff'
import { useNotificationStore } from '@/stores/notification'
import SHA256 from 'crypto-js/sha256'

const router = useRouter()
const staffStore = useStaffStore()
const notification = useNotificationStore()

const isLoading = ref(false)
const errorMessage = ref('')
const pin = ref([])
const pharmacyName = ref('DEVI Kiosk')
const pharmacyId = ref(null)

onMounted(async () => {
  await checkProvisioning()
  window.addEventListener('keydown', handleGlobalKeypress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeypress)
})

const handleGlobalKeypress = (e) => {
  if (e.key >= '0' && e.key <= '9') {
    enterDigit(parseInt(e.key))
  } else if (e.key === 'Backspace') {
    backspace()
  } else if (e.key === 'Enter' && pin.value.length === 4) {
    checkPin()
  }
}

const checkProvisioning = async () => {
  try {
    // A device must have a pharmacy record to be provisioned
    const pharmacies = await database.get('pharmacies').query().fetch()
    if (pharmacies.length > 0) {
      pharmacyId.value = pharmacies[0].id
      pharmacyName.value = pharmacies[0].name
    } else {
      // Hardware is not provisioned. In production, show a Setup Screen.
      // For now, we mock the initial binding so the POS is usable immediately.
      await seedDemoEnvironment()
    }
  } catch (e) {
    console.error('Provisioning check failed:', e)
  }
}

const seedDemoEnvironment = async () => {
  await database.write(async () => {
    const newPharmacy = await database.get('pharmacies').create(p => {
      p.name = 'Patan Hospital Pharmacy'
      p.pharmacyCode = 'patan01'
    })
    
    // Seed Owner (PIN: 1111)
    await database.get('staff').create(s => {
      s.pharmacyId = newPharmacy.id
      s.name = 'Dr. Sharma (Owner)'
      s.role = 'OWNER'
      s.pinHash = SHA256('1111').toString()
      s.isActive = true
    })

    // Seed Cashier (PIN: 2222)
    await database.get('staff').create(s => {
      s.pharmacyId = newPharmacy.id
      s.name = 'Ram (Cashier)'
      s.role = 'CASHIER'
      s.pinHash = SHA256('2222').toString()
      s.isActive = true
    })

    pharmacyId.value = newPharmacy.id
    pharmacyName.value = newPharmacy.name
  })
}

const enterDigit = (digit) => {
  if (pin.value.length < 4) {
    pin.value.push(digit)
    // Optional: Trigger Haptic Feedback via Capacitor here
  }
}

const backspace = () => pin.value.pop()
const clearPin = () => (pin.value = [])

watch(
  pin,
  (newVal) => {
    errorMessage.value = ''
    if (newVal.length === 4) {
      // Auto-submit when 4 digits are reached
      setTimeout(checkPin, 100)
    }
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
    // The query finds ANY active staff in this pharmacy with this exact PIN hash.
    const staffList = await database
      .get('staff')
      .query(
        Q.where('pharmacy_id', String(pharmacyId.value)),
        Q.where('pin_hash', hashedPin),
        Q.where('is_active', true)
      )
      .fetch()

    if (staffList.length > 0) {
      const staffMember = staffList[0]
      await loginSuccess(staffMember)
    } else {
      throw new Error('Invalid PIN')
    }
  } catch (err) {
    errorMessage.value = err.message
    setTimeout(clearPin, 400)
  } finally {
    isLoading.value = false
  }
}

const loginSuccess = async (staffMember) => {
  // Update Pinia state
  staffStore.setActiveUser(staffMember)
  sessionStorage.setItem('activeStaffId', staffMember.id)
  sessionStorage.setItem('isStaffSession', 'true')

  notification.showNotification(`Welcome back, ${staffMember.name}`)
  router.push('/mobile-terminal')
}
</script>

<style scoped>
.glass-numpad {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.glass-numpad:active {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(0.92);
}

.glass-numpad-danger {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
.glass-numpad-danger:active {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(0.92);
}

.glass-numpad-success {
  background: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
}
.glass-numpad-success:active {
  background: rgba(16, 185, 129, 0.2);
  transform: scale(0.92);
}

.shadow-glow {
  box-shadow: 0 0 15px var(--primary-color);
}

.animate-shake {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.blur-3xl { filter: blur(80px); }
.animation-float { animation: float 10s ease-in-out infinite; }
.animation-float-delayed { animation: float 12s ease-in-out infinite reverse; }

@keyframes float {
  0% { transform: translate(0, 0); }
  50% { transform: translate(20px, -20px); }
  100% { transform: translate(0, 0); }
}
</style>
