<template>
  <div class="setup-container">
    <div class="card setup-card">
      <div class="card-header">
        <h1 class="title">Welcome to D.E.V.I</h1>
        <p class="subtitle">Let's set up your pharmacy profile to get you started.</p>
      </div>

      <form @submit.prevent="saveProfileAndContinue">
        <div class="lock-warning">
          <p>
            <strong>Important:</strong> Your business details will be used for compliance and
            invoices. Please ensure they are correct.
          </p>
        </div>

        <h2 class="form-section-title">Business Details</h2>

        <div class="form-group">
          <label for="pharmacyCode">Unique Pharmacy Code</label>
          <input
            id="pharmacyCode"
            type="text"
            v-model="profile.pharmacyCode"
            required
            placeholder="e.g., amritmeds (no spaces)"
            autocapitalize="off"
          />
          <p class="input-help">
            5+ characters, no spaces. This is how your staff will log in and **cannot be changed**.
          </p>
        </div>

        <div class="form-group">
          <label for="pharmacyName">Pharmacy Name</label>
          <input
            id="pharmacyName"
            type="text"
            v-model="profile.name"
            placeholder="e.g., Amrit Pharmacy"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="panNumber">PAN Number</label>
            <input
              id="panNumber"
              type="text"
              v-model="profile.panNumber"
              required
              pattern="\d{9}"
              title="PAN must be 9 digits."
            />
          </div>
          <div class="form-group">
            <label for="vatNumber">VAT Number (Optional)</label>
            <input id="vatNumber" type="text" v-model="profile.vatNumber" />
          </div>
        </div>

        <h2 class="form-section-title">Location Address</h2>
        <p class="section-subtitle">This official address will appear on invoices.</p>

        <div class="form-group">
          <label for="province">Province</label>
          <select id="province" v-model="profile.province" required>
            <option disabled value="">Select a Province</option>
            <option v-for="prov in provinces" :key="prov" :value="prov">{{ prov }}</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="district">District</label>
            <select id="district" v-model="profile.district" :disabled="!profile.province" required>
              <option disabled value="">Select a District</option>
              <option v-for="dist in districts" :key="dist" :value="dist">{{ dist }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="city">Municipality / City</label>
            <select id="city" v-model="profile.city" :disabled="!profile.district" required>
              <option disabled value="">Select a City</option>
              <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label for="tole">Local Area / Tole</label>
          <input
            id="tole"
            type="text"
            v-model="profile.tole"
            placeholder="e.g., Main Street"
            required
          />
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Saving...' : 'Finish Setup & Start' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile.js'
import { useNotificationStore } from '@/stores/notification.js'
import { locations } from '@/utils/nepal-locations.js'
import { db } from '@/db' // <-- THIS IS THE FIX

const router = useRouter()
const profileStore = useProfileStore()
const notification = useNotificationStore()
const isLoading = ref(false)

const profile = reactive({
  pharmacyCode: '',
  name: '',
  panNumber: '',
  vatNumber: '',
  province: '',
  district: '',
  city: '',
  tole: '',
})

const provinces = computed(() => Object.keys(locations))
const districts = computed(() => (profile.province ? Object.keys(locations[profile.province]) : []))
const cities = computed(() =>
  profile.province && profile.district ? locations[profile.province][profile.district] : [],
)

watch(
  () => profile.province,
  () => {
    profile.district = ''
    profile.city = ''
  },
)
watch(
  () => profile.district,
  () => {
    profile.city = ''
  },
)

const saveProfileAndContinue = async () => {
  if (confirm('Are you sure you want to save? These details cannot be changed later.')) {
    isLoading.value = true
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      notification.showNotification('You are not logged in. Please log in again.', 'error')
      isLoading.value = false
      return
    }

    try {
      const formattedCode = profile.pharmacyCode.toLowerCase().trim()

      const { data, error } = await supabase.rpc('create_pharmacy_and_admin_profile', {
        p_owner_id: user.id,
        p_pharmacy_name: profile.name,
        p_pharmacy_code: formattedCode,
        p_pan_number: profile.panNumber,
        p_vat_number: profile.vatNumber,
        p_province: profile.province,
        p_district: profile.district,
        p_city: profile.city,
        p_tole: profile.tole,
        p_location: null, // GPS logic removed for simplicity, can be added back if needed
      })

      if (error) throw error

      const newProfile = data[0]
      await db.profiles.put({ ...newProfile, user_id: user.id }) // Save profile locally for offline access

      profileStore.setProfile(newProfile)
      notification.showNotification('Profile created successfully! Welcome.', 'success')
      router.push('/')
    } catch (error) {
      notification.showNotification(error.message, 'error')
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<style scoped>
/* Your existing styles will work perfectly with this standard form */
.setup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem 1rem;
}
.setup-card {
  width: 100%;
  max-width: 700px;
}
.card-header {
  text-align: center;
  margin-bottom: 2rem;
}
.title {
  font-size: 2rem;
}
.lock-warning {
  background-color: var(--color-primary-mute);
  border: 1px solid var(--color-primary);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.lock-warning p {
  color: var(--color-primary);
  font-weight: 500;
  margin: 0;
}
.form-section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
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
.input-help {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
.section-subtitle {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}
.form-actions {
  margin-top: 2.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
@media (min-width: 640px) {
  .form-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
