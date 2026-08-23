import { defineStore } from 'pinia'
import { reactive, toRefs, computed, watch } from 'vue'
import { localAuth } from '@/services/LocalAuthService'

export const useProfileStore = defineStore('profile', () => {
  const state = reactive({
    userId: '',
    name: '',
    panNumber: '',
    vatNumber: '',
    province: '',
    district: '',
    city: '',
    tole: '',
    role: null,
    pharmacyId: null,
    pharmacyName: '',
    pharmacyCode: '',
    phone: '',
    latitude: null,
    longitude: null,
  })

  // Getters
  const address = computed(() => {
    const parts = [state.tole, state.city, state.district, state.province]
    return parts.filter((p) => p).join(', ')
  })

  // Sync with Local Auth
  async function loadFromLocalDatabase() {
     // For V1, this is simple local auth sync
     // In future, this might query WatermelonDB 'pharmacies' table
     const user = localAuth.getCurrentUser()
     if (user) {
         state.userId = user.id
         state.name = user.name
         state.role = user.role
         state.pharmacyId = user.pharmacyId
         state.pharmacyName = 'My Local Pharmacy'
         return true
     }
     return false
  }

  function syncWithAuth() {
    loadFromLocalDatabase()
  }

  function setProfile(profileData) {
    if (!profileData) return

    // Normalize common shapes (legacy Supabase profile vs local profile)
    const pharmacies = profileData.pharmacies || profileData.pharmacy || {}

    state.userId = profileData.userId || profileData.id || state.userId
    state.name = profileData.name || state.name
    state.role = profileData.role ?? state.role

    state.pharmacyId = profileData.pharmacyId || pharmacies.id || state.pharmacyId
    state.pharmacyName = profileData.pharmacyName || pharmacies.name || state.pharmacyName
    state.pharmacyCode = profileData.pharmacyCode || pharmacies.pharmacy_code || state.pharmacyCode

    state.province = profileData.province || pharmacies.province || state.province
    state.district = profileData.district || pharmacies.district || state.district
    state.city = profileData.city || pharmacies.city || state.city
    state.tole = profileData.tole || pharmacies.tole || state.tole
    state.phone = profileData.phone || pharmacies.phone || state.phone
  }

  function $reset() {
    localAuth.logout()
    Object.assign(state, {
      userId: '',
      name: '',
      role: null,
      pharmacyId: null
    })
  }

  // Persistence
  const savedState = localStorage.getItem('profile_store')
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState)
      Object.assign(state, parsed)
    } catch (e) {
      console.error('Failed to load profile from storage', e)
    }
  }

  // Watch and save
  watch(
    () => state,
    (newVal) => {
      localStorage.setItem('profile_store', JSON.stringify(newVal))
    },
    { deep: true },
  )

  return { ...toRefs(state), address, setProfile, syncWithAuth, loadFromLocalDatabase, $reset }
})
