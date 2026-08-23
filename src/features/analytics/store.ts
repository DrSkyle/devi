import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface AnalyticsState {
  ytdRevenue: number
  avgSaleValue: number
  totalCustomers: number
  inventoryTurnover: number
  lowStockForecast: any[]
  isLoading: boolean
  fetchAnalyticsData: () => Promise<void>
  createPO: (id: string) => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  ytdRevenue: 0,
  avgSaleValue: 0,
  totalCustomers: 0,
  inventoryTurnover: 0,
  lowStockForecast: [],
  isLoading: false,

  fetchAnalyticsData: async () => {
    set({ isLoading: true })
    try {
      const response = await apiClient.get('/analytics/dashboard')
      set({
        ytdRevenue: response.data.ytdRevenue,
        avgSaleValue: response.data.avgSaleValue,
        totalCustomers: response.data.totalCustomers,
        inventoryTurnover: response.data.inventoryTurnover,
        lowStockForecast: response.data.lowStockForecast,
        isLoading: false,
      })
    } catch (error: any) {
      set({ isLoading: false })
    }
  },

  createPO: async (id) => {
    try {
      await apiClient.post('/procurement/purchase-orders', { id })
      get().fetchAnalyticsData()
    } catch (error: any) {
      console.error('Failed to create PO', error)
    }
  },
}))
