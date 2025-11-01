<template>
  <div class="my-pharmacy-container">
    <header class="view-header">
      <h1 class="title">
        {{ staffStore.activeUserRole === 'admin' ? 'My Pharmacy' : 'Pharmacy Details' }}
      </h1>
      <p class="subtitle">
        {{
          staffStore.activeUserRole === 'admin'
            ? "Your pharmacy's registered details and staff management."
            : 'Viewing registered details for your pharmacy.'
        }}
      </p>
    </header>

    <div class="card user-info-card">
      <h2 class="form-section-title">Active User</h2>
      <div class="display-item">
        <label>You are logged in as</label>
        <p>{{ staffStore.activeUserName }} ({{ staffStore.activeUserRole }})</p>
      </div>
    </div>

    <div class="card">
      <div class="lock-notice">
        <p>
          🔒 For legal and compliance reasons, your core business details are read-only. This
          ensures all invoices remain consistent and valid.
        </p>
      </div>

      <form>
        <div class="form-group">
          <label for="pharmacyName">Pharmacy Name</label>
          <input id="pharmacyName" type="text" v-model="profile.name" readonly />
        </div>

        <div v-if="staffStore.activeUserRole === 'admin'" class="form-group">
          <label for="pharmacyCode">Pharmacy Code (for Staff Login)</label>
          <input id="pharmacyCode" type="text" v-model="profile.pharmacyCode" readonly />
        </div>

        <h2 class="form-section-title">Tax Information</h2>
        <div class="form-row">
          <div class="form-group">
            <label for="panNumber">PAN Number</label>
            <input id="panNumber" type="text" v-model="profile.panNumber" readonly />
          </div>
          <div class="form-group">
            <label for="vatNumber">VAT Number</label>
            <input id="vatNumber" type="text" v-model="profile.vatNumber" readonly />
          </div>
        </div>
        <h2 class="form-section-title">Location</h2>
        <div class="form-group">
          <label for="province">Province</label>
          <select id="province" v-model="profile.province" disabled>
            <option>{{ profile.province }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="district">District</label>
            <select id="district" v-model="profile.district" disabled>
              <option>{{ profile.district }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="city">Municipality / City</label>
            <select id="city" v-model="profile.city" disabled>
              <option>{{ profile.city }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="tole">Local Area / Tole</label>
          <input id="tole" type="text" v-model="profile.tole" readonly />
        </div>
      </form>
    </div>

    <div v-if="staffStore.activeUserRole === 'admin'" class="card staff-card">
      <h2 class="form-section-title">Staff Management</h2>
      <p class="section-subtitle">
        Create and manage PINs for your staff. They will use these PINs to log their actions in the
        app.
      </p>

      <div v-if="activeStaff.length > 0" class="staff-list">
        <h4>Active Staff</h4>
        <div v-for="staff in activeStaff" :key="staff.id" class="staff-item">
          <div class="staff-info">
            <span class="staff-name">{{ staff.name }}</span>
            <span class="staff-role">{{ staff.role }}</span>
          </div>
          <button @click="toggleStaffStatus(staff)" class="button-icon danger">Deactivate</button>
        </div>
      </div>

      <div v-if="inactiveStaff.length > 0" class="staff-list inactive">
        <h4>Inactive Staff</h4>
        <div v-for="staff in inactiveStaff" :key="staff.id" class="staff-item">
          <div class="staff-info">
            <span class="staff-name">{{ staff.name }}</span>
            <span class="staff-role">{{ staff.role }}</span>
          </div>
          <button @click="toggleStaffStatus(staff)" class="button-icon success">Reactivate</button>
        </div>
      </div>

      <button @click="isStaffModalOpen = true" class="button">+ Add New Staff</button>
    </div>

    <div v-if="staffStore.activeUserRole === 'admin'" class="card account-card">
      <h2 class="form-section-title">Account Information</h2>
      <div class="display-item">
        <label>Logged In Email</label>
        <p>{{ userEmail }}</p>
      </div>
    </div>

    <div v-if="isStaffModalOpen" class="modal-overlay" @click.self="isStaffModalOpen = false">
      <div class="modal-content card">
        <h2>Add New Staff Member</h2>
        <form @submit.prevent="saveStaffMember">
          <div class="form-group">
            <label for="staffName">Staff Name</label>
            <input id="staffName" type="text" v-model="newStaff.name" required />
          </div>
          <div class="form-group">
            <label for="staffRole">Assign Role</label>
            <select id="staffRole" v-model="newStaff.role" required>
              <option value="cashier">Cashier</option>
              <option value="pharmacist">Pharmacist</option>
            </select>
          </div>
          <div class="form-group">
            <label for="staffPin">4-Digit PIN</label>
            <input
              id="staffPin"
              type="tel"
              v-model="newStaff.pin"
              required
              pattern="[0-9]{4}"
              maxlength="4"
              title="PIN must be exactly 4 digits."
              placeholder="e.g., 1234"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="isStaffModalOpen = false">
              Cancel
            </button>
            <button type="submit">Save Staff</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { useNotificationStore } from '@/stores/notification'
import { useStaffStore } from '@/stores/staff'

const userEmail = ref('')
const profile = useProfileStore()
const notification = useNotificationStore()
const staffStore = useStaffStore()

const isStaffModalOpen = ref(false)
const staffList = ref([])
const newStaff = reactive({ name: '', role: 'cashier', pin: '' })

const activeStaff = computed(() => staffList.value.filter((s) => s.is_active))
const inactiveStaff = computed(() => staffList.value.filter((s) => !s.is_active))

onActivated(async () => {
  // This hook now ensures we always have the latest user info when the page loads.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    userEmail.value = user.email || 'No email found'
  }
  if (staffStore.activeUserRole === 'admin') {
    fetchStaff()
  }
})

const fetchStaff = async () => {
  if (!profile.pharmacyId) return
  const { data } = await supabase.from('staff').select('*').eq('pharmacy_id', profile.pharmacyId)
  if (data) {
    staffList.value = data
  }
}

const saveStaffMember = async () => {
  const isPinInUse = staffList.value.some((staff) => staff.pin === newStaff.pin && staff.is_active)
  if (isPinInUse) {
    notification.showNotification('This PIN is already in use by an active staff member.', 'error')
    return
  }

  const staffData = {
    name: newStaff.name,
    role: newStaff.role,
    pin: newStaff.pin,
    pharmacy_id: profile.pharmacyId,
    is_active: true,
  }

  try {
    const { error } = await supabase.from('staff').insert(staffData)
    if (error) throw error

    notification.showNotification('Staff member added!')
    isStaffModalOpen.value = false
    Object.assign(newStaff, { name: '', role: 'cashier', pin: '' })
    await fetchStaff()
  } catch (error) {
    notification.showNotification(`Failed to add staff: ${error.message}`, 'error')
  }
}

const toggleStaffStatus = async (staff) => {
  const newStatus = !staff.is_active
  const action = newStatus ? 'reactivate' : 'deactivate'
  if (!confirm(`Are you sure you want to ${action} ${staff.name}?`)) return

  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: newStatus })
      .eq('id', staff.id)
    if (error) throw error

    notification.showNotification(`Staff member ${action}d.`)
    await fetchStaff()
  } catch (error) {
    notification.showNotification(`Failed to ${action} staff.`, 'error')
  }
}
</script>

<style scoped>
/* All styles remain the same, with one addition */
.user-info-card {
  background-color: var(--color-primary-mute);
  border-color: var(--color-primary);
}
.my-pharmacy-container {
  max-width: 700px;
  margin: 0 auto;
}
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
