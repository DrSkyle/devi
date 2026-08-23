import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface Prescription {
  id: string
  patientName: string
  doctorName: string
  medications: any[]
  status: 'pending' | 'filled' | 'cancelled'
  createdAt: string
}

interface PrescriptionState {
  prescriptions: Prescription[]
  isLoading: boolean
  error: string | null
  fetchPrescriptions: () => Promise<void>
  createPrescription: (data: any) => Promise<void>
}

export const usePrescriptionStore = create<PrescriptionState>((set, get) => ({
  prescriptions: [],
  isLoading: false,
  error: null,

  fetchPrescriptions: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/prescriptions')
      set({ prescriptions: response.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  createPrescription: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/prescriptions', data)
      set((state) => ({ prescriptions: [...state.prescriptions, response.data], isLoading: false }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
}))
