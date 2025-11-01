// src/stores/staff.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStaffStore = defineStore('staff', () => {
  const activeUser = ref(null)
  const activeShift = ref(null) // <-- ADD THIS LINE

  const activeUserId = computed(() => activeUser.value?.id || null)
  const activeUserName = computed(() => activeUser.value?.name || 'Admin')
  const activeUserRole = computed(() => activeUser.value?.role || 'admin')

  function setActiveUser(staffMember) {
    activeUser.value = staffMember
    activeShift.value = null // Clear shift when user changes
    sessionStorage.setItem('activeStaffId', staffMember.id)
  }

  function setInitialUser(profile) {
    activeUser.value = { id: profile.user_id, name: profile.name, role: 'admin' }
    activeShift.value = null
    sessionStorage.removeItem('activeStaffId')
  }

  // --- ADD THESE TWO NEW FUNCTIONS ---
  function setActiveShift(shift) {
    activeShift.value = shift
  }
  function clearActiveShift() {
    activeShift.value = null
  }

  return {
    activeUser,
    activeShift, // <-- EXPOSE IT
    setActiveUser,
    setInitialUser,
    setActiveShift, // <-- EXPOSE IT
    clearActiveShift, // <-- EXPOSE IT
    activeUserId,
    activeUserName,
    activeUserRole,
  }
})
