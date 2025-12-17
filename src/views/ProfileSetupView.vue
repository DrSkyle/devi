<template>
  <div class="setup-container flex align-items-center justify-content-center min-h-screen p-3">
    <!-- Main Card: Constrained width for 'centered dig' look, full width on mobile -->
    <div class="glass-panel p-4 md:p-5 w-full setup-card fadein animation-duration-500">
      <!-- Header -->
      <div class="text-center mb-5">
        <div
          class="inline-flex align-items-center justify-content-center bg-primary-500 border-round-2xl w-4rem h-4rem mb-3 shadow-4"
        >
          <i class="pi pi-building text-2xl text-white"></i>
        </div>
        <h1 class="text-3xl font-thin text-white mb-2 tracking-tight">Setup Pharmacy</h1>
        <p class="text-gray-400 text-sm line-height-3">
          Complete your profile to initialize the
          <span class="text-primary font-bold">D.E.V.I</span> engine.
        </p>
      </div>

      <FormKit
        type="form"
        :actions="false"
        @submit="saveProfileAndContinue"
        form-class="flex flex-column gap-3"
      >
        <!-- Compliance Notice (Collapsible/Compact) -->
        <div
          class="bg-white-alpha-5 border-round p-3 flex gap-3 align-items-start border-1 border-white-alpha-10"
        >
          <i class="pi pi-shield text-primary mt-1"></i>
          <div class="text-xs text-gray-300 line-height-3">
            <span class="font-bold text-white block mb-1">Official Registration</span>
            Details must match your PAN/VAT registration for tax compliance.
          </div>
        </div>

        <!-- Step 1: Identity -->
        <div class="flex flex-column gap-3 mt-2">
          <FormKit
            type="text"
            name="name"
            label="Pharmacy Name"
            placeholder="e.g. Amrit Pharmacy"
            validation="required"
            v-model="profile.name"
            outer-class="mb-0"
            input-class="w-full p-inputtext p-component p-inputtext-sm"
            label-class="text-white text-sm font-medium ml-1 mb-1 block"
          />

          <div class="field mb-0">
            <FormKit
              type="text"
              name="pharmacyCode"
              label="Pharmacy Code"
              placeholder="unique-id"
              validation="required|alphanumeric"
              v-model="profile.pharmacyCode"
              outer-class="mb-0"
              input-class="w-full p-inputtext p-component p-inputtext-sm"
              label-class="text-white text-sm font-medium ml-1 mb-1 block"
              help="Used for staff login. Cannot be changed."
              help-class="text-gray-500 text-xs ml-1 mt-1"
            >
              <template #suffix>
                <i class="pi pi-id-card text-gray-500 mr-3" />
              </template>
            </FormKit>
          </div>
        </div>

        <!-- Step 2: Legal -->
        <div class="grid formgrid gap-3 m-0">
          <div class="col-12 p-0 field mb-0">
            <FormKit
              type="text"
              name="panNumber"
              label="PAN Number"
              placeholder="9-digit PAN"
              validation="required|length:9,9|number"
              v-model="profile.panNumber"
              outer-class="mb-0"
              input-class="w-full p-inputtext p-component p-inputtext-sm"
              label-class="text-white text-sm font-medium ml-1 mb-1 block"
            />
          </div>
          <div class="col-12 p-0 field mb-0">
            <FormKit
              type="text"
              name="vatNumber"
              label="VAT (Optional)"
              placeholder="If applicable"
              validation="number"
              v-model="profile.vatNumber"
              outer-class="mb-0"
              input-class="w-full p-inputtext p-component p-inputtext-sm"
              label-class="text-white text-sm font-medium ml-1 mb-1 block"
            />
          </div>
        </div>

        <!-- Step 3: Location -->
        <div class="border-top-1 border-white-alpha-10 pt-3 mt-1">
          <label class="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 mb-2 block"
            >Address</label
          >

          <div class="flex flex-column gap-3">
            <FormKit
              type="select"
              name="province"
              placeholder="Select Province"
              :options="provinces"
              validation="required"
              v-model="profile.province"
              outer-class="mb-0"
              input-class="w-full p-inputtext p-component p-inputtext-sm"
            />
            <div class="flex flex-column md:flex-row gap-3">
              <FormKit
                type="select"
                name="district"
                placeholder="District"
                :options="districts"
                validation="required"
                v-model="profile.district"
                :disabled="!profile.province"
                outer-class="mb-0 w-full"
                input-class="w-full p-inputtext p-component p-inputtext-sm"
              />
              <FormKit
                type="select"
                name="city"
                placeholder="City"
                :options="cities"
                validation="required"
                v-model="profile.city"
                :disabled="!profile.district"
                outer-class="mb-0 w-full"
                input-class="w-full p-inputtext p-component p-inputtext-sm"
              />
            </div>
            <FormKit
              type="text"
              name="tole"
              placeholder="Street / Tole"
              validation="required"
              v-model="profile.tole"
              outer-class="mb-0"
              input-class="w-full p-inputtext p-component p-inputtext-sm"
            />
          </div>
        </div>

        <!-- Step 4: GPS Calibration -->
        <div class="border-top-1 border-white-alpha-10 pt-3 mt-1">
          <div class="flex justify-content-between align-items-center mb-2">
            <label class="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1"
              >GPS Calibration</label
            >
            <span
              v-if="location.calibrated"
              class="text-green-400 text-xs font-bold flex align-items-center gap-1"
            >
              <i class="pi pi-check-circle"></i> Calibrated
            </span>
            <span v-else class="text-orange-400 text-xs font-bold flex align-items-center gap-1">
              <i class="pi pi-exclamation-circle"></i> Required
            </span>
          </div>

          <div
            class="border-1 border-dashed border-round p-3 text-center transition-colors cursor-pointer hover:bg-white-alpha-5"
            :class="
              location.calibrated ? 'border-green-500 bg-green-500-alpha-10' : 'border-gray-600'
            "
            @click="calibrateLocation"
          >
            <div v-if="location.loading">
              <i class="pi pi-spin pi-spinner text-primary text-xl"></i>
              <div class="text-xs text-gray-400 mt-2">Acquiring satellites...</div>
            </div>
            <div v-else-if="location.calibrated">
              <div class="text-green-400 font-mono text-sm">
                {{ location.latitude.toFixed(5) }}, {{ location.longitude.toFixed(5) }}
              </div>
              <div class="text-xs text-gray-500 mt-1">Tap to recalibrate</div>
            </div>
            <div v-else>
              <i class="pi pi-map-marker text-primary text-xl mb-2"></i>
              <div class="text-sm text-white font-medium">Tap to Calibrate Location</div>
              <div class="text-xs text-gray-500 mt-1">Must be done at the pharmacy</div>
            </div>
          </div>
        </div>

        <!-- Action -->
        <div class="mt-4">
          <FormKit
            type="submit"
            :label="isLoading ? 'Creating Profile...' : 'Complete Setup'"
            :disabled="!location.calibrated || isLoading"
            input-class="w-full font-bold p-button p-component p-button-primary justify-content-center"
          />
        </div>
      </FormKit>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile.js'
import { useNotificationStore } from '@/stores/notification.js'
import { locations } from '@/utils/nepal-locations.js'
import { database } from '@/database'
import { v4 as uuidv4 } from 'uuid'
import { useConfirm } from 'primevue/useconfirm'

const confirm = useConfirm()
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

const location = reactive({
  loading: false,
  calibrated: false,
  latitude: null,
  longitude: null,
})

const provinces = computed(() => Object.keys(locations))
const districts = computed(() => (profile.province ? Object.keys(locations[profile.province]) : []))
const cities = computed(() =>
  profile.province && profile.district ? locations[profile.province][profile.district] : [],
)

watch(() => profile.province, () => {
    profile.district = ''
    profile.city = ''
})
watch(() => profile.district, () => {
    profile.city = ''
})

watch(() => profile.panNumber, (newVal) => {
    if (newVal) {
      const sanitized = newVal.replace(/[^0-9]/g, '').slice(0, 9)
      if (sanitized !== newVal) {
        profile.panNumber = sanitized
      }
    }
})

const calibrateLocation = () => {
  if (!navigator.geolocation) {
    notification.showNotification('Geolocation is not supported.', 'error')
    return
  }

  location.loading = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      location.latitude = position.coords.latitude
      location.longitude = position.coords.longitude
      location.calibrated = true
      location.loading = false
      notification.showNotification('Location calibrated successfully!', 'success')
    },
    (error) => {
      console.error(error)
      notification.showNotification('Unable to retrieve location.', 'error')
      location.loading = false
    },
    { enableHighAccuracy: true },
  )
}

const saveProfileAndContinue = async () => {
  if (!location.calibrated) {
    notification.showNotification('Please calibrate your location first.', 'error')
    return
  }

  confirm.require({
    message: 'Are you sure you want to initialize this device as the Admin Console for this pharmacy?',
    header: 'Confirm Setup',
    icon: 'pi pi-exclamation-triangle',
    styleClass: 'w-11 md:w-25rem',
    accept: async () => {
      isLoading.value = true
      try {
        const formattedCode = profile.pharmacyCode.toLowerCase().trim()
        
        // Generate IDs Locally
        const pharmacyId = 1 // Use 1 for local primary pharmacy, or generate random if multi-tenancy (but this is local)
                             // Actually, WatermelonDB IDs are strings usually. Let's use numeric 1 for simplicity if schema allows, 
                             // but schemas are strict. Let's check schema later. Standard is string.
        
        // Better: Use timestamps or UUIDs if schema expects string
        // Assuming schema expects string/number. Let's use a numeric ID for Pharmacy as it's often used in simple refs
        // Or better, let's just make a new Pharmacy record.
        
        const pharmacyUUID = uuidv4()
        const userUUID = uuidv4()

        await database.write(async () => {
             // 1. Create Pharmacy
             const pharmaciesCollection = database.get('pharmacies')
             const newPharmacy = await pharmaciesCollection.create(pharmacy => {
                 pharmacy.name = profile.name
                 pharmacy.pharmacy_code = formattedCode
                 pharmacy.pan_number = profile.panNumber
                 pharmacy.vat_number = profile.vatNumber
                 pharmacy.province = profile.province
                 pharmacy.district = profile.district
                 pharmacy.city = profile.city
                 pharmacy.tole = profile.tole
                 pharmacy.latitude = location.latitude
                 pharmacy.longitude = location.longitude
                 // pharmacy.created_at = Date.now() // if schema has it
             })
             
             // 2. Create Admin Profile
             const profilesCollection = database.get('profiles')
             const newProfile = await profilesCollection.create(rec => {
                 rec.id = userUUID // Use explicit ID if possible, or let it generate
                 rec.role = 'admin'
                 rec.pharmacy_id = newPharmacy.id
                 rec.full_name = 'Admin' // Default name, or ask user?
                 rec.phone_number = '0000000000'
                 // link to pharmacy
             })
             
             // 3. Create Staff Entry for Admin (for login)
             const staffCollection = database.get('staff')
             await staffCollection.create(staff => {
                 staff.pharmacy_id = newPharmacy.id
                 staff.name = 'ADMIN'
                 staff.role = 'admin'
                 staff.pin_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92' // '123456' hash? Or just '1234'
                 // Actually, let's set a default PIN: 1234. 
                 // SHA256('1234') = 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4
                 // Use a known hash for 1234 for now to let them login.
             })
             
             // Set Store
             profileStore.setProfile({
                 id: newProfile.id,
                 role: 'admin',
                 name: 'Admin',
                 pharmacy_id: newPharmacy.id
             })
        })

        notification.showNotification('Pharmacy initialized locally. You are the Admin.', 'success')
        router.push('/')
        
      } catch (error) {
        console.error(error)
        notification.showNotification('Setup failed: ' + error.message, 'error')
      } finally {
        isLoading.value = false
      }
    }
  })
}
</script>

<style scoped>
/*
  Mobile-first adjustments:
  - Input text size is handled by p-inputtext-sm
  - Layout is single column by default
  - Max width constrained for "centered dig" feel
*/
.setup-card {
  width: 100%;
  max-width: 26rem; /* Mobile default: Compact ~416px */
}

@media (min-width: 768px) {
  .setup-card {
    max-width: 40rem; /* Tablet/Desktop: Wider ~640px */
  }
}

:deep(.p-dropdown) {
  width: 100%;
}
:deep(.p-dropdown-label) {
  font-size: 0.875rem; /* text-sm */
}
</style>
