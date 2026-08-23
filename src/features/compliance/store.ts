import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface DdaLog {
  id: string
  staffName: string
  timestamp: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

interface ComplianceState {
  auditLogs: DdaLog[]
  pendingDDACount: number
  approvedDDAToday: number
  rejectedDDAToday: number
  isLoading: boolean
  fetchLogs: () => Promise<void>
  approve: (id: string) => Promise<void>
  reject: (id: string) => Promise<void>
}

export const useComplianceStore = create<ComplianceState>((set, get) => ({
  auditLogs: [],
  pendingDDACount: 0,
  approvedDDAToday: 0,
  rejectedDDAToday: 0,
  isLoading: false,

  fetchLogs: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/compliance/dda-logs')
      set({
        auditLogs: response.data.logs,
        pendingDDACount: response.data.pendingCount,
        approvedDDAToday: response.data.approvedToday,
        rejectedDDAToday: response.data.rejectedToday,
        isLoading: false,
      })
    } catch (error: any) {
      set({ isLoading: false })
    }
  },

  approve: async (id) => {
    try {
      await apiClient.post(`/compliance/dda-logs/${id}/approve`)
      get().fetchLogs()
    } catch (error: any) {
      console.error('Failed to approve DDA', error)
    }
  },

  reject: async (id) => {
    try {
      await apiClient.post(`/compliance/dda-logs/${id}/reject`)
      get().fetchLogs()
    } catch (error: any) {
      console.error('Failed to reject DDA', error)
    }
  },
}))
