import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface DashboardStats {
  todaySales: number
  activePrescriptions: number
  lowStockCount: number
  totalRevenue: number
  salesCount: number
  customersServed: number
  totalPrescriptions: number
  averageSaleValue: number
  stockValue: number
}

interface DashboardStore {
  stats: DashboardStats
  isLoading: boolean
  error: string | null
  fetchDashboardData: () => Promise<void>
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  stats: {
    todaySales: 0,
    activePrescriptions: 0,
    lowStockCount: 0,
    totalRevenue: 0,
    salesCount: 0,
    customersServed: 0,
    totalPrescriptions: 0,
    averageSaleValue: 0,
    stockValue: 0,
  },
  isLoading: false,
  error: null,
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null })
    try {
      // In a real app, this would be a single API call: /api/v1/analytics/dashboard
      const response = await apiClient.get('/analytics/dashboard')
      set({ stats: response.data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      console.error('Failed to fetch dashboard data:', err)
    }
  },
}))
