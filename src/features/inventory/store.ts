import { defineStore as create } from '@/core/zustand'
import { apiClient } from '@/core/api'

interface InventoryItem {
  id: string
  brandName: string
  genericName: string
  batchNumber: string
  expiryDate: string
  totalTablets: number
  sellingPriceCents: number
}

interface InventoryState {
  items: InventoryItem[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  searchResults: InventoryItem[]

  fetchInventory: () => Promise<void>
  searchCatalog: (query: string) => Promise<void>
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>
  updateStock: (id: string, quantity: number) => Promise<void>
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  searchResults: [],

  fetchInventory: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/inventory')
      set({ items: response.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  searchCatalog: async (query) => {
    set({ isLoading: true, error: null, searchQuery: query })
    try {
      const response = await apiClient.get('/catalog/search', { params: { q: query } })
      set({ searchResults: response.data, isLoading: false })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  addItem: async (item) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/inventory', item)
      set((state) => ({ items: [...state.items, response.data], isLoading: false }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },

  updateStock: async (id, quantity) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.patch(`/inventory/${id}/stock`, { quantity })
      // Optimistic update or refetch
      get().fetchInventory()
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
    }
  },
}))
