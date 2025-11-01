// src/stores/profile.js

import { defineStore } from 'pinia'
import { reactive, toRefs } from 'vue'

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
    pharmacyCode: '',
  })

  function setProfile(profileData) {
    if (profileData) {
      state.userId = profileData.user_id || ''

      // --- THIS IS THE CORRECT AND ROBUST FIX ---
      // It correctly handles all cases including an ID of 0, nulls, and strings.
      const id = parseInt(profileData.pharmacy_id, 10)
      state.pharmacyId = isNaN(id) ? null : id
      // ------------------------------------------

      state.name = profileData.name || ''
      state.panNumber = profileData.pan_number || ''
      state.vatNumber = profileData.vat_number || ''
      state.province = profileData.province || ''
      state.district = profileData.district || ''
      state.city = profileData.city || ''
      state.tole = profileData.tole || ''
      state.role = profileData.role || 'cashier'
      state.pharmacyCode = profileData.pharmacy_code || ''
    }
  }

  // Helper to reset the store, useful on logout
  function $reset() {
    Object.assign(state, {
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
      pharmacyCode: '',
    })
  }

  return { ...toRefs(state), setProfile, $reset }
})
