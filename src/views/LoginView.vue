<template>
  <div class="login-container">
    <div class="card login-card">
      <div v-if="!pharmacy.id">
        <div class="card-header">
          <h1 class="title">D.E.V.I</h1>
          <p class="subtitle">Enter your Pharmacy Code to begin.</p>
        </div>
        <form @submit.prevent="findPharmacy">
          <div class="form-group">
            <label for="pharmacyCode">Pharmacy Code</label>
            <input
              id="pharmacyCode"
              type="text"
              v-model="pharmacyCodeInput"
              placeholder="e.g., amritmeds"
              required
              autocapitalize="off"
            />
          </div>
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Finding...' : 'Find Pharmacy' }}
          </button>
        </form>
        <div class="card-footer">
          <p>Are you the owner? <RouterLink to="/admin-login">Admin Login</RouterLink></p>
        </div>
      </div>

      <div v-else>
        <div class="card-header">
          <h1 class="title">{{ pharmacy.name }}</h1>
          <p class="subtitle">Enter your PIN to log in.</p>
        </div>
        <div class="pin-display">{{ pin.join('') || '----' }}</div>
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div class="keypad">
          <button v-for="n in 9" :key="n" @click="enterDigit(n)">{{ n }}</button>
          <button class="backspace" @click="backspace">⌫</button>
          <button @click="enterDigit(0)">0</button>
          <button class="enter" @click="checkPin">Enter</button>
        </div>
        <div class="card-footer">
          <a href="#" @click.prevent="resetLogin">Switch Pharmacy</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { db } from '@/db' // <-- Import the local Dexie database
import { useStaffStore } from '@/stores/staff'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const staffStore = useStaffStore()
const profileStore = useProfileStore()
const notification = useNotificationStore()

const isLoading = ref(false)
const errorMessage = ref('')
const pharmacyCodeInput = ref('')
const pharmacy = reactive({ id: null, name: null, owner_id: null })
const pin = ref([])

const findPharmacy = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const code = pharmacyCodeInput.value.toLowerCase().trim()
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id, name, owner_id')
      .eq('pharmacy_code', code)
      .single()
    if (error || !data) throw new Error('Pharmacy Code not found.')

    pharmacy.id = data.id
    pharmacy.name = data.name
    pharmacy.owner_id = data.owner_id // Store owner_id for fetching the profile
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

const enterDigit = (digit) => {
  if (pin.value.length < 4) pin.value.push(digit)
}
const backspace = () => pin.value.pop()
const clearPin = () => (pin.value = [])
watch(pin, (newVal) => {
  if (newVal.length === 4) checkPin()
})

const checkPin = async () => {
  if (pin.value.length < 4) return
  const enteredPin = pin.value.join('')
  isLoading.value = true
  errorMessage.value = ''

  try {
    // This step REQUIRES an internet connection to verify the PIN.
    const { data: matchedStaff, error: pinError } = await supabase
      .from('staff')
      .select('*')
      .eq('pharmacy_id', pharmacy.id)
      .eq('pin', enteredPin)
      .single()

    if (pinError || !matchedStaff) throw new Error('Invalid PIN or network error.')
    if (!matchedStaff.is_active) throw new Error('This account is inactive.')

    // --- DEVICE PROVISIONING STEP ---
    // If the PIN is valid, we know we are online.
    // Now, fetch all essential data and save it to the local Dexie database.

    // 1. Fetch the main pharmacy profile.
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', pharmacy.owner_id)
      .single()
    if (profileError || !adminProfile) throw new Error('Could not fetch pharmacy details.')

    // 2. Fetch the complete list of staff for this pharmacy.
    const { data: staffList, error: staffListError } = await supabase
      .from('staff')
      .select('*')
      .eq('pharmacy_id', pharmacy.id)
    if (staffListError) throw new Error('Could not fetch staff list.')

    // 3. Save everything to the local database for future offline use.
    await db.profiles.put(adminProfile)
    if (staffList && staffList.length > 0) {
      await db.staff.bulkPut(staffList)
    }

    // 4. Now that data is saved locally, set up the session and log the user in.
    profileStore.setProfile(adminProfile)
    staffStore.setActiveUser(matchedStaff)

    sessionStorage.setItem('activeStaffId', matchedStaff.id)
    sessionStorage.setItem('isStaffSession', 'true')
    sessionStorage.setItem('pharmacyProfile', JSON.stringify(adminProfile))

    notification.showNotification(
      `Welcome, ${matchedStaff.name}! Device configured for offline use.`,
    )
    router.push('/')
  } catch (err) {
    errorMessage.value = err.message
    isLoading.value = false
    setTimeout(clearPin, 2000)
  }
}

const resetLogin = () => {
  pharmacy.id = null
  pharmacy.name = null
  pharmacy.owner_id = null
  pharmacyCodeInput.value = ''
  sessionStorage.clear()
  clearPin()
  errorMessage.value = ''
}
</script>

<style scoped>
/* Your existing styles are fine and do not need to be changed */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}
.login-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
  background-color: rgba(45, 55, 72, 0.8);
  backdrop-filter: blur(10px);
}
.card-header {
  margin-bottom: 2rem;
}
.title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.subtitle {
  color: var(--color-text-light);
}
.form-group {
  text-align: left;
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-light-slate);
}
.error-message {
  color: var(--color-danger);
  margin-bottom: 1.5rem;
  height: auto;
  min-height: 1.2em;
}
.card-footer {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.card-footer a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
.card-footer a:hover {
  text-decoration: underline;
}
.pin-display {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 0.5em;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  margin: 1.5rem 0;
  text-align: center;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.keypad button {
  width: 100%;
  height: 60px;
  font-size: 1.5rem;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface-mute);
  color: var(--color-text);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.keypad .enter {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
  font-weight: 700;
  grid-column: span 3;
}
.keypad .backspace {
  font-size: 1.8rem;
}
</style>
