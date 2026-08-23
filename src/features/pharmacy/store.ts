import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface Pharmacy {
  id: string
  name: string
  address: string
  phone: string
  // Add other pharmacy properties as needed
  [key: string]: any
}

interface PharmacyState {
  pharmacies: Pharmacy[]
  currentPharmacy: Pharmacy | null
  loading: boolean
  error: string | null
  getPharmacyById: (id: string) => Pharmacy | undefined
  fetchPharmacies: () => Promise<void>
  createPharmacy: (data: any) => Promise<any>
  setCurrentPharmacy: (pharmacy: Pharmacy) => void
}

export const usePharmacyStore = create<PharmacyState>((set, get) => ({
  pharmacies: [],
  currentPharmacy: null,
  loading: false,
  error: null,

  getPharmacyById: (id: string) => {
    const pharmacies = get().pharmacies
    const found = pharmacies.find((p: Pharmacy) => p.id === id)
    return found
  },

  fetchPharmacies: async () => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.get('/pharmacies')
      set({ pharmacies: response.data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  createPharmacy: async (data) => {
    set({ loading: true, error: null })
    try {
      const response = await apiClient.post('/pharmacies', data)
      const { pharmacies } = get()
      set({
        pharmacies: [...pharmacies, response.data],
        loading: false,
      })
      return response.data
    } catch (err: any) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  setCurrentPharmacy: (pharmacy) => {
    set({ currentPharmacy: pharmacy })
  },
}))
