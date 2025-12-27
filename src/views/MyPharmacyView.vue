<template>
  <div class="my-pharmacy-container p-4 max-w-5xl mx-auto min-h-screen">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">
        {{
          staffStore.activeUserRole === 'admin' || profile.role === 'admin'
            ? 'My Pharmacy'
            : 'Pharmacy Details'
        }}
      </h1>
      <p class="text-gray-400 text-lg">
        {{
          staffStore.activeUserRole === 'admin' || profile.role === 'admin'
            ? "Your pharmacy's registered details and staff management."
            : 'Viewing registered details for your pharmacy.'
        }}
      </p>
    </div>

    <!-- User Info Card -->
    <div class="glass-panel p-4 mb-6 border-left-3 border-primary">
      <div class="flex align-items-center gap-3">
        <div class="bg-primary-500 border-round-circle p-2">
          <i class="pi pi-user text-white text-xl"></i>
        </div>
        <div>
          <div class="text-gray-400 text-sm">Logged in as</div>
          <div class="text-white font-bold text-lg">
            {{ staffStore.activeUserName }}
            <span class="text-primary text-sm font-normal">({{ staffStore.activeUserRole }})</span>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-panel p-5 mb-6">
      <div
        class="bg-blue-900 border-blue-500 border-1 border-round p-3 mb-5 flex gap-3 align-items-start"
      >
        <i class="pi pi-lock text-blue-300 mt-1"></i>
        <p class="m-0 text-blue-100 text-sm line-height-3">
          For legal and compliance reasons, your core business details are read-only. This ensures
          all invoices remain consistent and valid.
        </p>
      </div>

      <form>
        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block text-gray-400 text-xs mb-1">Pharmacy Name</label>
            <div class="text-white text-xl font-bold border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.pharmacyName || profile.profile?.pharmacies?.name || 'N/A' }}
            </div>
          </div>
          <div
            v-if="staffStore.activeUserRole === 'admin' || profile.role === 'admin'"
            class="col-12 md:col-6"
          >
            <label class="block text-gray-400 text-xs mb-1">Pharmacy Code</label>
            <div class="text-primary text-xl font-mono border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.pharmacyCode || profile.profile?.pharmacies?.pharmacy_code || 'N/A' }}
            </div>
          </div>
        </div>

        <h3 class="text-lg font-bold text-white mt-5 mb-3 border-top-1 border-white-alpha-10 pt-4">
          Tax Information
        </h3>
        <div class="grid">
          <div class="col-12 md:col-6">
            <label class="block text-gray-400 text-xs mb-1">PAN Number</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.panNumber || profile.profile?.pharmacies?.pan_number || 'N/A' }}
            </div>
          </div>
          <div class="col-12 md:col-6">
            <label class="block text-gray-400 text-xs mb-1">VAT Number</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.vatNumber || profile.profile?.pharmacies?.vat_number || 'N/A' }}
            </div>
          </div>
        </div>

        <h3 class="text-lg font-bold text-white mt-5 mb-3 border-top-1 border-white-alpha-10 pt-4">
          Location
        </h3>
        <div class="grid">
          <div class="col-12 md:col-4">
            <label class="block text-gray-400 text-xs mb-1">Province</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.province || profile.profile?.pharmacies?.province || 'N/A' }}
            </div>
          </div>
          <div class="col-12 md:col-4">
            <label class="block text-gray-400 text-xs mb-1">District</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.district || profile.profile?.pharmacies?.district || 'N/A' }}
            </div>
          </div>
          <div class="col-12 md:col-4">
            <label class="block text-gray-400 text-xs mb-1">Municipality / City</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.city || profile.profile?.pharmacies?.city || 'N/A' }}
            </div>
          </div>
          <div class="col-12">
            <label class="block text-gray-400 text-xs mb-1">Local Area / Tole</label>
            <div class="text-white text-lg border-bottom-1 border-white-alpha-10 pb-2">
              {{ profile.tole || profile.profile?.pharmacies?.tole || 'N/A' }}
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- Network Status Section -->
    <div class="glass-panel p-6 mb-6">
      <div
        class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3"
      >
        <div>
          <h2 class="text-2xl font-bold text-white mb-1">Devi Network Status</h2>
          <p class="text-gray-400 text-sm">Your connectivity with nearby pharmacies.</p>
        </div>
        <Tag value="Active" severity="success" icon="pi pi-wifi" />
      </div>

      <div class="grid">
        <div class="col-12 md:col-4">
          <div
            class="bg-white-alpha-5 border-round p-4 text-center h-full flex flex-column justify-content-center"
          >
            <i class="pi pi-map-marker text-4xl text-primary mb-3"></i>
            <div class="text-2xl font-bold text-white mb-1">{{ nearbyCount }}</div>
            <div class="text-gray-400 text-sm">Pharmacies within 5km</div>
          </div>
        </div>
        <div class="col-12 md:col-8">
          <div class="bg-white-alpha-5 border-round p-4 h-full">
            <h3 class="text-lg font-bold text-white mb-3">Network Radar</h3>
            <div v-if="nearbyPharmacies.length === 0" class="text-center py-4 text-gray-500">
              <i class="pi pi-search text-2xl mb-2"></i>
              <p>No other pharmacies detected nearby yet.</p>
            </div>
            <div v-else class="flex flex-column gap-2">
              <div
                v-for="pharmacy in nearbyPharmacies"
                :key="pharmacy.id"
                class="flex justify-content-between align-items-center border-bottom-1 border-white-alpha-10 pb-2"
              >
                <div class="flex align-items-center gap-2">
                  <i class="pi pi-building text-primary"></i>
                  <span class="text-white">{{ pharmacy.name }}</span>
                </div>
                <Tag
                  :value="`${pharmacy.distance_km.toFixed(1)} km`"
                  severity="info"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Staff Management -->
    <div
      v-if="staffStore.activeUserRole === 'admin' || profile.role === 'admin'"
      class="glass-panel p-5 mb-6"
    >
      <div
        class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-4 gap-3"
      >
        <div>
          <h2 class="text-xl font-bold text-white m-0">Staff Management</h2>
          <p class="text-gray-400 text-sm mt-1">
            Pharmacy Code:
            <span class="text-primary font-mono font-bold">{{ profile.pharmacyCode }}</span>
          </p>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <Button
            label="Broadcast Message"
            icon="pi pi-megaphone"
            class="p-button-sm p-button-outlined p-button-warning flex-1 md:flex-none"
            @click="router.push('/notifications')"
          />
          <Button
            label="Add Staff"
            icon="pi pi-plus"
            class="p-button-sm flex-1 md:flex-none"
            @click="isStaffModalOpen = true"
          />
        </div>
      </div>

      <div v-if="activeStaff.length > 0" class="mb-5">
        <h4 class="text-white text-sm uppercase tracking-wider mb-3 opacity-70">Active Staff</h4>
        <div class="grid">
          <div v-for="staff in activeStaff" :key="staff.id" class="col-12 md:col-6">
            <div
              class="glass-panel p-3 flex justify-content-between align-items-center bg-white-alpha-5"
            >
              <div>
                <div class="font-bold text-white">{{ staff.name }}</div>
                <div class="text-xs text-primary uppercase font-bold mt-1">{{ staff.role }}</div>
                <div class="text-sm text-gray-300 mt-2">
                  ID:
                  <span class="font-mono font-bold text-primary">{{
                    staff.employee_id || 'N/A'
                  }}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <Button
                  icon="pi pi-key"
                  class="p-button-rounded p-button-warning p-button-text"
                  v-tooltip.top="'Reset PIN'"
                  aria-label="Reset PIN"
                  @click="openResetPinModal(staff)"
                />
                <Button
                  icon="pi pi-ban"
                  class="p-button-rounded p-button-danger p-button-text"
                  v-tooltip.top="'Deactivate'"
                  aria-label="Deactivate"
                  @click="toggleStaffStatus(staff)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="inactiveStaff.length > 0">
        <h4 class="text-white text-sm uppercase tracking-wider mb-3 opacity-70">Inactive Staff</h4>
        <div class="grid">
          <div v-for="staff in inactiveStaff" :key="staff.id" class="col-12 md:col-6">
            <div
              class="glass-panel p-3 flex justify-content-between align-items-center bg-white-alpha-5 opacity-60"
            >
              <div>
                <div class="font-bold text-white">{{ staff.name }}</div>
                <div class="text-xs text-gray-400 uppercase font-bold mt-1">{{ staff.role }}</div>
              </div>
              <Button
                icon="pi pi-refresh"
                class="p-button-rounded p-button-success p-button-text"
                v-tooltip.top="'Reactivate'"
                aria-label="Reactivate"
                @click="toggleStaffStatus(staff)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="staffStore.activeUserRole === 'admin' || profile.role === 'admin'"
      class="glass-panel p-4 flex justify-content-between align-items-center"
    >
      <div>
        <h2 class="text-lg font-bold text-white m-0">Account Email</h2>
        <p class="text-gray-400 text-sm m-0 mt-1">{{ userEmail }}</p>
      </div>
    </div>

    <!-- Add Staff Modal -->
    <Dialog
      v-model:visible="isStaffModalOpen"
      modal
      header="Add New Staff Member"
      :style="{ width: '90vw', maxWidth: '400px' }"
      class="glass-dialog"
    >
      <form @submit.prevent="saveStaffMember">
        <div class="field mb-3">
          <label for="staffName" class="block text-gray-300 font-medium mb-2">Staff Name</label>
          <InputText id="staffName" v-model="newStaff.name" class="w-full" required />
        </div>
        <div class="field mb-3">
          <label for="staffRole" class="block text-gray-300 font-medium mb-2">Assign Role</label>
          <Select
            id="staffRole"
            v-model="newStaff.role"
            :options="['cashier', 'pharmacist']"
            class="w-full"
            placeholder="Select a role"
          />
        </div>
        <div class="field mb-3">
          <label for="staffId" class="block text-gray-300 font-medium mb-2">Employee ID</label>
          <InputText
            id="staffId"
            v-model="newStaff.employeeId"
            class="w-full uppercase"
            required
            placeholder="e.g., SARAH or 001"
            v-tooltip="'Unique ID for this pharmacy'"
          />
        </div>
        <div class="field mb-3">
          <label for="staffPin" class="block text-gray-300 font-medium mb-2">4-Digit PIN</label>
          <div class="p-inputgroup">
            <InputText
              id="staffPin"
              v-model="newStaff.pin"
              class="w-full"
              required
              pattern="[0-9]{4}"
              maxlength="4"
              placeholder="e.g., 1234"
            />
            <Button icon="pi pi-refresh" @click="generatePin" v-tooltip="'Generate Random PIN'" />
          </div>
          <small class="text-gray-500">This PIN will be hashed and never shown again.</small>
        </div>
        <!-- Email and Phone removed as per user request -->
        <!-- Staff can update their profile later -->
        <div class="flex justify-content-end gap-2">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-text"
            @click="isStaffModalOpen = false"
          />
          <Button type="submit" label="Save Staff" icon="pi pi-check" />
        </div>
      </form>
    </Dialog>

    <!-- Reset PIN Modal -->
    <Dialog
      v-model:visible="isResetPinModalOpen"
      modal
      header="Reset Staff PIN"
      :style="{ width: '90vw', maxWidth: '400px' }"
      class="glass-dialog"
    >
      <div v-if="selectedStaffForReset">
        <p class="text-gray-300 mb-4">
          Resetting PIN for
          <span class="font-bold text-white">{{ selectedStaffForReset.name }}</span
          >.
        </p>
        <form @submit.prevent="saveNewPin">
          <div class="field mb-4">
            <label class="block text-gray-300 font-medium mb-2">New 4-Digit PIN</label>
            <div class="p-inputgroup">
              <InputText
                v-model="newPinForReset"
                class="w-full text-xl text-center tracking-widest"
                required
                pattern="[0-9]{4}"
                maxlength="4"
                placeholder="----"
                autofocus
              />
              <Button
                icon="pi pi-refresh"
                @click="generateResetPin"
                v-tooltip="'Generate Random PIN'"
              />
            </div>
          </div>
          <div class="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              icon="pi pi-times"
              class="p-button-text"
              @click="isResetPinModalOpen = false"
            />
            <Button type="submit" label="Update PIN" icon="pi pi-check" severity="warning" />
          </div>
        </form>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated, onMounted, computed, watch } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/stores/staff'
// import { staffService } from '@/services/StaffService' // NUKED
import { localAuth } from '@/services/LocalAuthService'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'

const userEmail = ref('')
const profile = useProfileStore()
const notification = useNotificationStore()
const staffStore = useStaffStore()
const router = useRouter()

const isStaffModalOpen = ref(false)
const staffList = ref([])
// Auto-generate PIN by default
const newStaff = reactive({
  name: '',
  role: 'cashier',
  employeeId: '',
  pin: Math.floor(1000 + Math.random() * 9000).toString(),
  email: '',
  phone: '',
})

watch(isStaffModalOpen, (isOpen) => {
  if (isOpen && !newStaff.pin) {
    generatePin()
  }
})

// Network Status State
const nearbyPharmacies = ref([])
const nearbyCount = ref(0)

const activeStaff = computed(() => staffList.value.filter((s) => s.isActive))
const inactiveStaff = computed(() => staffList.value.filter((s) => !s.isActive))

onActivated(async () => {
  // This hook now ensures we always have the latest user info when the page loads.
  // Local Only: Use profile from store/db
    if (!profile.pharmacyId) {
      // await profile.fetchProfile() // NUKED
      await profile.loadFromLocalDatabase()
    }
  
  if (staffStore.activeUserRole === 'admin') {
    fetchStaff()
  }
})

onMounted(() => {
  fetchNetworkStatus()
})

const fetchNetworkStatus = async () => {
  if (!profile.pharmacyId) return

  try {
    // Replaced Cloud Query with P2P Discovery
    const myLat = profile.profile?.pharmacies?.latitude || profile.latitude 
    const myLong = profile.profile?.pharmacies?.longitude || profile.longitude

    if (myLat && myLong) {
        const { networkService } = await import('@/services/NetworkService')
        const nearby = await networkService.getNearbyPharmacies(myLat, myLong, 50)
        
        nearbyPharmacies.value = nearby // already formatted by service
        nearbyCount.value = nearby.length
    }
  } catch (e) {
    console.error('Error fetching network status', e)
  }
}

// Haversine Formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null
  const R = 6371
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

const fetchStaff = async () => {
  if (!profile.pharmacyId) return

  const staffCollection = database.get('staff')
  const staffData = await staffCollection.query(Q.where('pharmacy_id', profile.pharmacyId)).fetch()

  staffList.value = staffData
}

const saveStaffMember = async () => {
  // Use unified hashing from LocalAuthService
  const hashedPin = await localAuth.hashPin(newStaff.pin)

  const isPinInUse = staffList.value.some(
    (staff) => staff.pinHash === hashedPin && staff.isActive,
  )

  if (isPinInUse) {
    notification.showNotification('This PIN is already in use by an active staff member.', 'error')
    return
  }

  try {
    await database.write(async () => {
      await database.get('staff').create((staff) => {
        staff.name = newStaff.name
        staff.role = newStaff.role
        staff.employeeId = newStaff.employeeId.toUpperCase()
        staff.pinHash = hashedPin
        staff.email = newStaff.email
        staff.phone = newStaff.phone
        staff.pharmacyId = profile.pharmacyId
        staff.isActive = true
      })
    })

    notification.showNotification('Staff member added locally!')
    isStaffModalOpen.value = false
    Object.assign(newStaff, {
      name: '',
      role: 'cashier',
      employeeId: '',
      pin: '',
      email: '',
      phone: '',
    })
    await fetchStaff()
  } catch (error) {
    notification.showNotification(`Failed to add staff: ${error.message}`, 'error')
  }
}

const toggleStaffStatus = async (staff) => {
  const newStatus = !staff.isActive
  const action = newStatus ? 'reactivate' : 'deactivate'
  if (!confirm(`Are you sure you want to ${action} ${staff.name}?`)) return

  try {
    await database.write(async () => {
      await staff.update((record) => {
        record.isActive = newStatus
      })
    })

    notification.showNotification(`Staff member ${action}d.`)
    await fetchStaff()
  } catch (_error) {
    console.error(_error)
    notification.showNotification(`Failed to ${action} staff.`, 'error')
  }
}

// --- Reset PIN Logic ---
const isResetPinModalOpen = ref(false)
const selectedStaffForReset = ref(null)
const newPinForReset = ref('')

const openResetPinModal = (staff) => {
  selectedStaffForReset.value = staff
  newPinForReset.value = ''
  // generateResetPin() // Auto-generate for convenience
  isResetPinModalOpen.value = true
}

const generateResetPin = () => {
  newPinForReset.value = Math.floor(1000 + Math.random() * 9000).toString()
}

const saveNewPin = async () => {
  if (!selectedStaffForReset.value || !newPinForReset.value) return

  try {
    const hashedPin = await localAuth.hashPin(newPinForReset.value)

    await database.write(async () => {
      await selectedStaffForReset.value.update((record) => {
        record.pinHash = hashedPin
      })
    })

    notification.showNotification(`PIN updated for ${selectedStaffForReset.value.name}.`)
    isResetPinModalOpen.value = false
    selectedStaffForReset.value = null
    newPinForReset.value = ''
  } catch (e) {
    console.error(e)
    notification.showNotification('Failed to update PIN.', 'error')
  }
}

const generatePin = () => {
  const pin = Math.floor(1000 + Math.random() * 9000).toString()
  newStaff.pin = pin
}
</script>

<style scoped>
.card {
  margin-top: 2rem;
}
.staff-card,
.account-card {
  margin-top: 1.5rem;
}
.section-subtitle {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.staff-card .button {
  width: auto;
}
.lock-notice {
  background-color: var(--color-primary-mute);
  border: 1px solid var(--color-primary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}
.lock-notice p {
  color: var(--color-primary);
  font-weight: 500;
  margin: 0;
}
.form-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.card > form > .form-section-title:first-of-type,
.card > .form-section-title:first-of-type {
  margin-top: 0;
}
.form-group {
  margin-bottom: 1.25rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 500;
  color: var(--color-light-slate);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}
input[readonly],
select:disabled {
  background-color: var(--color-surface);
  border-color: transparent;
  padding-left: 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-soft-cream);
  cursor: default;
  opacity: 1;
  -webkit-appearance: none;
  appearance: none;
}
input[readonly]:focus {
  box-shadow: none;
}
select:disabled {
  background-image: none;
}
.display-item label {
  color: var(--color-text-light);
  font-weight: 500;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
  display: block;
}
.display-item p {
  font-size: 1.1rem;
  color: var(--color-soft-cream);
  word-wrap: break-word;
  text-transform: capitalize;
}
.staff-list {
  margin-bottom: 1.5rem;
}
.staff-list.inactive {
  opacity: 0.6;
}
.staff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}
.staff-name {
  font-weight: 600;
}
.staff-role {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  max-width: 500px;
  margin: 1rem;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}
.button-icon.danger {
  background-color: var(--color-danger-mute);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}
.button-icon.success {
  background-color: var(--color-peacock-teal);
  color: white;
  border: 1px solid var(--color-peacock-teal);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
}
</style>
