import { defineStore as create } from '@/core/zustand'

interface StaffState {
  activeUser: any
  activeShift: any
  activeUserId: string
  activeUserName: string
  activeUserRole: string
  setActiveUser: (staffMember: any) => void
  setInitialUser: (profile: any) => void
  setActiveShift: (shift: any) => void
  clearActiveShift: () => void
  logout: () => void
}

const useStaffStore = create<StaffState>((set, get) => ({
  activeUser: null,
  activeShift: null,
  activeUserId: '',
  activeUserName: '',
  activeUserRole: '',
  setActiveUser: (staffMember) =>
    set({
      activeUser: staffMember,
      activeUserId: staffMember?.id || '',
      activeUserName: staffMember?.name || '',
      activeUserRole: staffMember?.role || 'admin',
    }),
  setInitialUser: (profile) =>
    set({
      activeUser: { id: profile.user_id, name: profile.name, role: 'admin' },
      activeShift: null,
    }),
  setActiveShift: (shift) => set({ activeShift: shift }),
  clearActiveShift: () => set({ activeShift: null }),
  logout: () =>
    set({
      activeUser: null,
      activeShift: null,
      activeUserId: '',
      activeUserName: '',
      activeUserRole: '',
    }),
}))

export { useStaffStore }
