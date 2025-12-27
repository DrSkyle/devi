import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { addMoney, multiplyMoney, subtractMoney, calculateTax } from '@/utils/currency'

export const useCartStore = defineStore('cart', () => {
  // State
  const tabs = ref([
    {
      id: 'tab-1',
      name: 'Guest 1',
      cart: [],
      selectedCustomer: null,
      discount: 0,
      patientName: '',
      doctorName: '',
    },
  ])
  const activeTabId = ref('tab-1')

  // Helper to renumber tabs dynamically
  const recalculateTabNames = () => {
    let guestCounter = 1
    tabs.value.forEach((tab) => {
      if (tab.selectedCustomer) {
        tab.name = tab.selectedCustomer.name
      } else {
        tab.name = `Guest ${guestCounter}`
        guestCounter++
      }
    })
  }

  // Getters
  const activeTab = computed(() => tabs.value.find((t) => t.id === activeTabId.value))

  const cart = computed({
    get: () => activeTab.value?.cart || [],
    set: (val) => {
      if (activeTab.value) activeTab.value.cart = val
    },
  })

  const selectedCustomer = computed({
    get: () => activeTab.value?.selectedCustomer,
    set: (val) => {
      if (activeTab.value) {
        activeTab.value.selectedCustomer = val
        recalculateTabNames()
      }
    },
  })

  const discount = computed({
    get: () => activeTab.value?.discount || 0,
    set: (val) => {
      if (activeTab.value) activeTab.value.discount = val
    },
  })

  const patientName = computed({
    get: () => activeTab.value?.patientName || '',
    set: (val) => {
      if (activeTab.value) activeTab.value.patientName = val
    },
  })

  const doctorName = computed({
    get: () => activeTab.value?.doctorName || '',
    set: (val) => {
      if (activeTab.value) activeTab.value.doctorName = val
    },
  })

  const subtotal = computed(() =>
    cart.value.reduce((acc, item) => addMoney(acc, multiplyMoney(item.price, item.qty)), 0),
  )
  const taxTotal = computed(() =>
    cart.value.reduce((acc, item) => {
      const itemTotal = multiplyMoney(item.price, item.qty)
      const itemTax = calculateTax(itemTotal, item.vatPercent)
      return addMoney(acc, itemTax)
    }, 0),
  )
  const grandTotal = computed(() => {
    const totalWithTax = addMoney(subtotal.value, taxTotal.value)
    const final = subtractMoney(totalWithTax, discount.value)
    return Math.max(0, final)
  })
  const hasControlledItems = computed(() => cart.value.some((item) => item.isControlled))

  // Actions
  const createNewTab = () => {
    const newId = `tab-${Date.now()}`
    tabs.value.push({
      id: newId,
      name: 'Guest', // Will be updated by recalculate
      cart: [],
      selectedCustomer: null,
      discount: 0,
      patientName: '',
      doctorName: '',
    })
    recalculateTabNames()
    activeTabId.value = newId
    return newId
  }

  const closeTab = (tabId) => {
    if (tabs.value.length === 1) {
      clearCart()
      return
    }
    const index = tabs.value.findIndex((t) => t.id === tabId)
    tabs.value.splice(index, 1)
    recalculateTabNames()
    if (activeTabId.value === tabId) {
      activeTabId.value = tabs.value[Math.max(0, index - 1)].id
    }
  }

  const switchTab = (tabId) => {
    activeTabId.value = tabId
  }

  const addToCart = (product, tabId = null) => {
    // If tabId is provided, add to that tab.
    // If not, add to active tab.
    const targetId = tabId || activeTabId.value
    const targetTab = tabs.value.find((t) => t.id === targetId)

    if (!targetTab) return

    const existingItem = targetTab.cart.find((item) => item.id === product.id)

    if (existingItem) {
      if (existingItem.qty < product.stock) {
        existingItem.qty++
        return true // Success
      } else {
        return false // Max stock
      }
    } else {
      targetTab.cart.push({
        id: product.id,
        name: product.name,
        price: product.sellingPrice,
        qty: 1,
        maxQty: product.stock,
        vatPercent: product.vatPercent || 0,
        isControlled: product.isControlled || false,
      })
      return true // Success
    }
  }

  const updateQty = (index, change) => {
    const item = cart.value[index]
    const newQty = item.qty + change
    if (newQty > 0 && newQty <= item.maxQty) {
      item.qty = newQty
      return true
    } else if (newQty > item.maxQty) {
      return false // Max stock
    }
  }

  const removeFromCart = (index) => {
    cart.value.splice(index, 1)
  }

  const clearCart = () => {
    if (activeTab.value) {
      activeTab.value.cart = []
      activeTab.value.discount = 0
      activeTab.value.selectedCustomer = null
      activeTab.value.patientName = ''
      activeTab.value.doctorName = ''
      recalculateTabNames()
    }
  }

  return {
    tabs,
    activeTabId,
    activeTab,
    cart,
    selectedCustomer,
    discount,
    patientName,
    doctorName,
    subtotal,
    taxTotal,
    grandTotal,
    hasControlledItems,
    createNewTab,
    closeTab,
    switchTab,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
  }
})
