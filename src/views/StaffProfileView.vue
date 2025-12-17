<template>
  <div class="staff-profile-container max-w-3xl mx-auto p-4">
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-white mb-2">My Profile</h1>
      <p class="text-gray-400">Manage your personal details and view pharmacy association.</p>
    </header>

    <!-- Pharmacy Association Card -->
    <div class="glass-panel p-5 mb-6 border-left-3 border-primary">
      <div class="flex align-items-center gap-4">
        <div class="bg-white-alpha-10 border-round-circle p-3">
          <i class="pi pi-building text-primary text-2xl"></i>
        </div>
        <div>
          <div class="text-gray-400 text-sm mb-1">Linked Pharmacy</div>
          <div class="text-white font-bold text-xl">{{ profileStore.pharmacyName }}</div>
          <div class="text-primary text-sm font-mono mt-1">
            Code: {{ profileStore.pharmacyCode }}
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Details Form -->
    <div class="glass-panel p-6">
      <div class="flex align-items-center justify-content-between mb-5">
        <h2 class="text-xl font-bold text-white m-0">Personal Details</h2>
        <Tag :value="staffStore.activeUserRole" severity="info" class="uppercase" />
      </div>

      <form @submit.prevent="saveProfile">
        <div class="grid">
          <div class="col-12 md:col-6">
            <div class="field mb-4">
              <label class="block text-gray-400 text-sm font-medium mb-2">Full Name</label>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-user text-gray-400"></i>
                <InputText
                  v-model="form.name"
                  class="w-full"
                  readonly
                  v-tooltip="'Name is managed by Admin'"
                />
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field mb-4">
              <label class="block text-gray-400 text-sm font-medium mb-2">Login PIN</label>
              <div class="p-input-icon-left w-full">
                <i class="pi pi-lock text-gray-400"></i>
                <InputText
                  v-model="form.pin"
                  class="w-full font-mono font-bold"
                  readonly
                  v-tooltip="'Contact Admin to reset PIN'"
                />
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field mb-4">
              <label for="email" class="block text-gray-300 text-sm font-medium mb-2"
                >Email Address</label
              >
              <div class="p-input-icon-left w-full">
                <i class="pi pi-envelope text-gray-400"></i>
                <InputText
                  id="email"
                  v-model="form.email"
                  class="w-full"
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6">
            <div class="field mb-4">
              <label for="phone" class="block text-gray-300 text-sm font-medium mb-2"
                >Phone Number</label
              >
              <div class="p-input-icon-left w-full">
                <i class="pi pi-phone text-gray-400"></i>
                <InputText
                  id="phone"
                  v-model="form.phone"
                  class="w-full"
                  placeholder="Enter your phone"
                  type="tel"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-content-end mt-4">
          <Button
            type="submit"
            label="Save Changes"
            icon="pi pi-check"
            :loading="isSaving"
            class="w-full md:w-auto"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { useStaffStore } from '@/stores/staff'
import { useNotificationStore } from '@/stores/notification'
import { database } from '@/database'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

const profileStore = useProfileStore()
const staffStore = useStaffStore()
const notification = useNotificationStore()

const isSaving = ref(false)
const form = reactive({
  name: '',
  email: '',
  phone: '',
  pin: '****', // Default until loaded
})

const staffRecord = ref(null)

onMounted(() => {
  // Populate form with current staff details
  form.name = staffStore.activeUserName
  // We need to fetch the full staff object to get email/phone if not in store
  // Assuming staffStore might not have email/phone yet, or we fetch from DB
  loadStaffDetails()
})

const loadStaffDetails = async () => {
  if (staffStore.activeStaffId) {
    try {
      const staff = await database.get('staff').find(staffStore.activeStaffId)
      if (staff) {
        staffRecord.value = staff
        form.email = staff.email || ''
        form.phone = staff.phone || ''
        form.name = staff.name // Ensure name matches DB
        form.pin = staff.pinHash ? '****' : '****' // Never show pin
      }
    } catch (error) {
      console.error('Failed to load staff details', error)
    }
  }
}

const saveProfile = async () => {
  isSaving.value = true
  try {
    if (!staffStore.activeStaffId) throw new Error('No active staff session')
    if (!staffRecord.value) throw new Error('Staff record not found')

    await database.write(async () => {
      await staffRecord.value.update((record) => {
        record.email = form.email
        record.phone = form.phone
      })
    })

    notification.showNotification('Profile updated successfully!')
  } catch (error) {
    console.error(error)
    notification.showNotification('Failed to update profile', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* Minimal scoped styles */
</style>
