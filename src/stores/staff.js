// src/stores/staff.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStaffStore = defineStore('staff', () => {
  const activeUser = ref(null)
  const activeShift = ref(null) // <-- ADD THIS LINE

  const activeUserId = computed(
    () => activeUser.value?.id || sessionStorage.getItem('activeStaffId') || localStorage.getItem('persistentStaffId'),
  )
  const activeUserName = computed(
    () => activeUser.value?.name || sessionStorage.getItem('activeStaffName') || localStorage.getItem('persistentStaffName'),
  )
  const activeUserRole = computed(
    () => activeUser.value?.role || sessionStorage.getItem('activeStaffRole') || localStorage.getItem('persistentStaffRole') || 'admin',
  )

  function setActiveUser(staffMember) {
    activeUser.value = staffMember
    activeShift.value = null // Clear shift when user changes
    const id = staffMember.id || staffMember._id
    if (id) {
      sessionStorage.setItem('activeStaffId', id)
      localStorage.setItem('persistentStaffId', id) // Persistent
    }
    if (staffMember.name) {
      sessionStorage.setItem('activeStaffName', staffMember.name)
      localStorage.setItem('persistentStaffName', staffMember.name)
    }
    if (staffMember.role) {
      sessionStorage.setItem('activeStaffRole', staffMember.role)
      localStorage.setItem('persistentStaffRole', staffMember.role)
    }
    localStorage.setItem('isStaffSession', 'true') // Helper flag
  }

  function setInitialUser(profile) {
    activeUser.value = { id: profile.user_id, name: profile.name, role: 'admin' }
    activeShift.value = null
    sessionStorage.removeItem('activeStaffId')
    sessionStorage.removeItem('activeStaffName')
    sessionStorage.removeItem('activeStaffRole')
    // Don't clear persistent if switching to admin? 
    // Actually Admin is a different flow. 
    // Let's ensure we clear staff persistence if we become Admin.
    logout() 
  }

  function logout() {
      activeUser.value = null
      activeShift.value = null
      sessionStorage.clear()
      localStorage.removeItem('persistentStaffId')
      localStorage.removeItem('persistentStaffName')
      localStorage.removeItem('persistentStaffRole')
      localStorage.removeItem('isStaffSession')
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
    logout,
  }
})
