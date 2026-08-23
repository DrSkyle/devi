import { defineStore as create } from '@/core/zustand'

interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  maxQty: number
  vatPercent: number
  isControlled: boolean
}

interface CartTab {
  id: string
  name: string
  cart: CartItem[]
  selectedCustomer: any
  discount: number
  patientName: string
  doctorName: string
}

interface CartStoreState {
  tabs: CartTab[]
  activeTabId: string
  createNewTab: () => string
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  addToCart: (product: any, tabId?: string) => boolean
  updateQty: (index: number, change: number) => boolean
  removeFromCart: (index: number) => void
  clearCart: () => void
  setSelectedCustomer: (customer: any) => void
  setDiscount: (discount: number) => void
  setPatientName: (name: string) => void
  setDoctorName: (name: string) => void
  getActiveTab: () => CartTab | undefined
  getCart: () => CartItem[]
  getSubtotal: () => number
  getTaxTotal: () => number
  getGrandTotal: () => number
  hasControlledItems: () => boolean
}

const useCartStore = create<CartStoreState>((set, get) => ({
  tabs: [
    {
      id: 'tab-1',
      name: 'Guest 1',
      cart: [],
      selectedCustomer: null,
      discount: 0,
      patientName: '',
      doctorName: '',
    },
  ],
  activeTabId: 'tab-1',
  createNewTab: () => {
    const newId = `tab-${Date.now()}`
    set((state) => ({
      tabs: [
        ...state.tabs,
        {
          id: newId,
          name: 'Guest',
          cart: [],
          selectedCustomer: null,
          discount: 0,
          patientName: '',
          doctorName: '',
        },
      ],
    }))
    // Recalculate tab names
    const { tabs } = get()
    let guestCounter = 1
    const updatedTabs = tabs.map((tab: any) => {
      if (tab.selectedCustomer) {
        tab.name = tab.selectedCustomer.name
      } else {
        tab.name = `Guest ${guestCounter}`
        guestCounter++
      }
      return tab
    })
    set({ tabs: updatedTabs, activeTabId: newId })
    return newId
  },
  closeTab: (tabId) => {
    set((state) => {
      if (state.tabs.length === 1) {
        // If only one tab, clear it instead of closing
        const updatedTabs = state.tabs.map((tab: any) =>
          tab.id === tabId
            ? {
                ...tab,
                cart: [],
                discount: 0,
                selectedCustomer: null,
                patientName: '',
                doctorName: '',
              }
            : tab,
        )
        // Recalculate tab names
        let guestCounter = 1
        const updatedTabs2 = updatedTabs.map((tab: any) => {
          if (tab.selectedCustomer) {
            tab.name = tab.selectedCustomer.name
          } else {
            tab.name = `Guest ${guestCounter}`
            guestCounter++
          }
          return tab
        })
        return { tabs: updatedTabs2 }
      } else {
        // Remove the tab
        const index = state.tabs.findIndex((t: any) => t.id === tabId)
        const newTabs = [...state.tabs]
        newTabs.splice(index, 1)
        // Recalculate tab names
        let guestCounter = 1
        const updatedTabs = newTabs.map((tab: any) => {
          if (tab.selectedCustomer) {
            tab.name = tab.selectedCustomer.name
          } else {
            tab.name = `Guest ${guestCounter}`
            guestCounter++
          }
          return tab
        })
        // Switch to previous tab if closing active tab
        let newActiveTabId = state.activeTabId
        if (state.activeTabId === tabId) {
          newActiveTabId = updatedTabs[Math.max(0, index - 1)].id
        }
        return { tabs: updatedTabs, activeTabId: newActiveTabId }
      }
    })
  },
  switchTab: (tabId) => {
    set({ activeTabId: tabId })
  },
  addToCart: (product, tabId = null) => {
    const targetId = tabId || get().activeTabId
    const { tabs } = get()

    const targetTab = tabs.find((t: any) => t.id === targetId)
    if (!targetTab) return false

    const existingItem = targetTab.cart.find((item: any) => item.id === product.id)

    if (existingItem) {
      if (existingItem.qty < product.stock) {
        // Update existing item quantity
        set((state) => ({
          tabs: state.tabs.map((tab: any) =>
            tab.id === targetId
              ? {
                  ...tab,
                  cart: tab.cart.map((item: any) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
                  ),
                }
              : tab,
          ),
        }))
        return true
      } else {
        return false // Max stock
      }
    } else {
      // Add new item
      set((state) => ({
        tabs: state.tabs.map((tab: any) =>
          tab.id === targetId
            ? {
                ...tab,
                cart: [
                  ...tab.cart,
                  {
                    id: product.id,
                    name: product.name,
                    price: product.sellingPrice,
                    qty: 1,
                    maxQty: product.stock,
                    vatPercent: product.vatPercent || 0,
                    isControlled: product.isControlled || false,
                  },
                ],
              }
            : tab,
        ),
      }))
      return true
    }
  },
  updateQty: (index, change) => {
    const { tabs, activeTabId } = get()
    const activeTab = tabs.find((t: any) => t.id === activeTabId)
    if (!activeTab) return false

    const item = activeTab.cart[index]
    const newQty = item.qty + change

    if (newQty > 0 && newQty <= item.maxQty) {
      set((state) => ({
        tabs: state.tabs.map((tab: any) =>
          tab.id === activeTabId
            ? {
                ...tab,
                cart: tab.cart.map((cartItem: any, i: number) =>
                  i === index ? { ...cartItem, qty: newQty } : cartItem,
                ),
              }
            : tab,
        ),
      }))
      return true
    } else if (newQty > item.maxQty) {
      return false // Max stock
    }
    return false
  },
  removeFromCart: (index) => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) =>
        tab.id === activeTabId
          ? {
              ...tab,
              cart: tab.cart.filter((_: any, i: number) => i !== index),
            }
          : tab,
      ),
    }))
  },
  clearCart: () => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) =>
        tab.id === activeTabId
          ? {
              ...tab,
              cart: [],
              discount: 0,
              selectedCustomer: null,
              patientName: '',
              doctorName: '',
            }
          : tab,
      ),
    }))
  },
  setSelectedCustomer: (customer) => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) =>
        tab.id === activeTabId ? { ...tab, selectedCustomer: customer } : tab,
      ),
    }))
    // Recalculate tab names
    const { tabs } = get()
    let guestCounter = 1
    const updatedTabs = tabs.map((tab: any) => {
      if (tab.selectedCustomer) {
        tab.name = tab.selectedCustomer.name
      } else {
        tab.name = `Guest ${guestCounter}`
        guestCounter++
      }
      return tab
    })
    set({ tabs: updatedTabs })
  },
  setDiscount: (discount) => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) => (tab.id === activeTabId ? { ...tab, discount } : tab)),
    }))
  },
  setPatientName: (name) => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) =>
        tab.id === activeTabId ? { ...tab, patientName: name } : tab,
      ),
    }))
  },
  setDoctorName: (name) => {
    const { activeTabId } = get()
    set((state) => ({
      tabs: state.tabs.map((tab: any) =>
        tab.id === activeTabId ? { ...tab, doctorName: name } : tab,
      ),
    }))
  },
  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find((t: any) => t.id === activeTabId)
  },
  getCart: () => {
    const activeTab = get().getActiveTab()
    return activeTab?.cart || []
  },
  getSubtotal: () => {
    const cart = get().getCart()
    // Implementation would go here
    return cart.reduce((acc: number, item: any) => acc + item.price * item.qty, 0)
  },
  getTaxTotal: () => {
    const cart = get().getCart()
    // Implementation would go here
    return cart.reduce((acc: number, item: any) => {
      const itemTotal = item.price * item.qty
      const itemTax = itemTotal * (item.vatPercent / 100)
      return acc + itemTax
    }, 0)
  },
  getGrandTotal: () => {
    const { getSubtotal, getTaxTotal, getActiveTab } = get()
    const activeTab = getActiveTab()
    if (!activeTab) return 0

    const totalWithTax = getSubtotal() + getTaxTotal()
    const final = totalWithTax - activeTab.discount
    return Math.max(0, final)
  },
  hasControlledItems: () => {
    const cart = get().getCart()
    return cart.some((item: any) => item.isControlled)
  },
}))

export { useCartStore }
