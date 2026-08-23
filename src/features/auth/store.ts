import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface User {
  id: string
  name: string
  role: 'OWNER' | 'PHARMACIST' | 'CASHIER'
  pharmacyId: string
  pharmacyName: string
  [key: string]: any
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (pharmacyCode: string, staffId: string, pin: string) => Promise<void>
  signup: (payload: any) => Promise<void>
  addStaff: (payload: any) => Promise<void>
  logout: () => void
  initSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (pharmacyCode, staffId, pin) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post('/auth/login', {
        pharmacy_code: pharmacyCode,
        staff_id: staffId,
        pin,
      })
      const { token, user } = response.data
      set({ token, user, isAuthenticated: true, isLoading: false })
      localStorage.setItem('authToken', token)
      localStorage.setItem('pharmacyCode', pharmacyCode)
      localStorage.setItem('pharmacyName', user.pharmacyName)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signup: async (payload) => {
    set({ isLoading: true })
    try {
      const response = await apiClient.post('/auth/signup', payload)
      const { token, user } = response.data
      set({ token, user, isAuthenticated: true, isLoading: false })
      localStorage.setItem('authToken', token)
      localStorage.setItem('pharmacyCode', payload.pharmacy_code)
      localStorage.setItem('pharmacyName', payload.name)
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  addStaff: async (payload) => {
    set({ isLoading: true })
    try {
      await apiClient.post('/auth/staff', payload)
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false })
    localStorage.removeItem('authToken')
    window.location.href = '/login'
  },

  initSession: async () => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      try {
        const response = await apiClient.get('/auth/me')
        const user = response.data
        set({ token: storedToken, user, isAuthenticated: true })
      } catch (error) {
        localStorage.removeItem('authToken')
        set({ token: null, user: null, isAuthenticated: false })
      }
    } else {
      set({ isAuthenticated: false })
    }
  },
}))
