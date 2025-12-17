import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProfileStore } from '../../src/stores/profile'
import { useStaffStore } from '../../src/stores/staff'

describe('Store: Profile', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should set profile data correctly', () => {
    const store = useProfileStore()
    const profileData = {
      id: 'user-123',
      name: 'Test User',
      role: 'admin',
      pharmacies: {
        name: 'Test Pharmacy',
        pharmacy_code: 'PH-001',
        city: 'Kathmandu',
        tole: 'Thamel',
      },
    }

    store.setProfile(profileData)

    expect(store.userId).toBe('user-123')
    expect(store.name).toBe('Test User')
    expect(store.pharmacyName).toBe('Test Pharmacy')
    expect(store.address).toContain('Kathmandu')
  })

  it('should reset state correctly', () => {
    const store = useProfileStore()
    store.name = 'Dirty State'
    store.$reset()
    expect(store.name).toBe('')
  })
})

describe('Store: Staff', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('should set active user and update session storage', () => {
    const store = useStaffStore()
    const staffMember = { id: 'staff-1', name: 'Staff 1', role: 'pharmacist' }

    store.setActiveUser(staffMember)

    expect(store.activeUser).toEqual(staffMember)
    expect(sessionStorage.getItem('activeStaffId')).toBe('staff-1')
  })

  it('should set active shift', () => {
    const store = useStaffStore()
    const shift = { id: 'shift-1', start: new Date() }

    store.setActiveShift(shift)
    expect(store.activeShift).toEqual(shift)

    store.clearActiveShift()
    expect(store.activeShift).toBeNull()
  })
})
