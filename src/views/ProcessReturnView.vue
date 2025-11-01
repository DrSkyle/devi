<template>
  <div class="process-return-container">
    <header class="view-header">
      <h1 class="title">Process a Sales Return</h1>
      <p class="subtitle">Find the original sale by bill number to process a return.</p>
    </header>

    <div class="card find-bill-card" v-if="!originalSale">
      <form @submit.prevent="findSale" class="find-bill-form">
        <div class="form-group">
          <label for="billNumber">Enter Bill Number</label>
          <input
            id="billNumber"
            type="number"
            v-model.number="billNumberQuery"
            placeholder="e.g., 101"
            required
          />
        </div>
        <button type="submit" :disabled="isSearching">
          {{ isSearching ? 'Searching...' : 'Find Bill' }}
        </button>
      </form>
    </div>

    <div v-else class="card process-items-card">
      <div class="sale-details">
        <h3>Returning items from Bill #{{ originalSale.bill_number }}</h3>
        <p>Sold on: {{ new Date(originalSale.created_at).toLocaleString() }}</p>
      </div>

      <div class="items-to-return">
        <h4>Select items and quantities to return:</h4>
        <template v-for="item in originalSale.items" :key="decryptData(item.name)">
          <div class="return-item" v-if="item && item.returnableQuantity > 0">
            <div class="item-info">
              <span class="item-name">{{ decryptData(item.name) }}</span>
              <span class="item-price">Sold at Rs. {{ item.price.toFixed(2) }}</span>
            </div>
            <div class="item-actions">
              <label>Return Qty:</label>
              <input
                type="number"
                v-model.number="item.returnQuantity"
                min="0"
                :max="item.returnableQuantity"
                placeholder="0"
              />
              <span>/ {{ item.returnableQuantity }} returnable</span>
            </div>
          </div>
        </template>
        <p v-if="!canReturnAnything" class="empty-list">
          All items from this bill have already been returned.
        </p>
      </div>

      <div class="return-summary">
        <div class="summary-row total">
          <h3>Total Return Value:</h3>
          <h3 class="total-amount">Rs. {{ totalReturnValue.toFixed(2) }}</h3>
        </div>
      </div>

      <div class="return-actions">
        <button @click="reset" class="button-secondary">Find Another Bill</button>
        <button @click="processReturn" :disabled="isProcessing || totalReturnValue <= 0">
          {{ isProcessing ? 'Processing...' : 'Process Return' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification.js'
import { decryptData } from '@/utils/cipher'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const billNumberQuery = ref(null)
const isSearching = ref(false)
const isProcessing = ref(false)
const originalSale = ref(null)

const totalReturnValue = computed(() => {
  if (!originalSale.value) return 0
  return originalSale.value.items.reduce((total, item) => {
    if (!item) return total
    const returnQty =
      (item.returnQuantity || 0) > item.returnableQuantity
        ? item.returnableQuantity
        : item.returnQuantity || 0
    return total + returnQty * item.price
  }, 0)
})

const canReturnAnything = computed(() => {
  if (!originalSale.value) return false
  return originalSale.value.items.some((item) => item && item.returnableQuantity > 0)
})

const findSale = async () => {
  if (!billNumberQuery.value) return
  isSearching.value = true
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (!pharmacyId) {
    isSearching.value = false
    return
  }

  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .select('*')
      .eq('bill_number', billNumberQuery.value)
      .eq('pharmacy_id', pharmacyId) // <-- FIX: Was 'user_id'
      .single()

    if (!sale || error) {
      notification.showNotification(`Bill #${billNumberQuery.value} not found.`, 'error')
      return
    }
    if (sale.status === 'void') {
      notification.showNotification(
        `Bill #${sale.bill_number} is voided and cannot be returned.`,
        'error',
      )
      return
    }

    const { data: previousReturns } = await supabase
      .from('returns')
      .select('items')
      .eq('original_sale_id', sale._id)
    const previouslyReturnedQuantities = {}
    ;(previousReturns || []).forEach((ret) => {
      ;(ret.items || []).forEach((item) => {
        const decryptedName = decryptData(item.name)
        previouslyReturnedQuantities[decryptedName] =
          (previouslyReturnedQuantities[decryptedName] || 0) + item.quantity
      })
    })
    ;(sale.items || []).forEach((item) => {
      const decryptedName = decryptData(item.name)
      const returnedSoFar = previouslyReturnedQuantities[decryptedName] || 0
      item.returnableQuantity = item.quantity - returnedSoFar
      item.returnQuantity = 0
    })

    originalSale.value = sale
  } catch (error) {
    notification.showNotification('An error occurred while searching.', 'error')
  } finally {
    isSearching.value = false
  }
}

// src/views/ProcessReturnView.vue

const processReturn = async () => {
  isProcessing.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const itemsToReturn = originalSale.value.items
    .filter(
      (item) => item && item.returnQuantity > 0 && item.returnQuantity <= item.returnableQuantity,
    )
    .map((i) => ({
      name: i.name,
      brand_name: i.brandName, // FIX: Was brandName      quantity: i.returnQuantity,
      price: i.price,
    }))

  if (itemsToReturn.length === 0) {
    notification.showNotification('No valid items selected for return.', 'error')
    isProcessing.value = false
    return
  }

  try {
    const { data: returnId, error } = await supabase.rpc('process_return', {
      p_original_sale_id: originalSale.value._id,
      p_bill_number: originalSale.value.bill_number,
      p_user_id: user.id,
      p_pharmacy_id: parseInt(profileStore.pharmacyId, 10),
      p_items_to_return: itemsToReturn,
      p_total_return_value: totalReturnValue.value,
    })

    if (error) {
      console.error('Supabase RPC Error:', error)
      throw error
    }

    notification.showNotification('Return processed successfully!')
    router.push({ name: 'credit-note', params: { id: returnId } })
  } catch (error) {
    notification.showNotification('Error processing return. Check console for details.', 'error')
  } finally {
    isProcessing.value = false
  }
}

const reset = () => {
  originalSale.value = null
  billNumberQuery.value = null
}
</script>

<style scoped>
/* The styles are unchanged */
.process-return-container {
  max-width: 700px;
  margin: 0 auto;
}
.find-bill-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
@media (min-width: 640px) {
  .find-bill-form {
    flex-direction: row;
    align-items: flex-end;
  }
  .find-bill-form .form-group {
    flex-grow: 1;
    margin-bottom: 0;
  }
}
.sale-details {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.sale-details h3 {
  margin-bottom: 0.5rem;
}
.sale-details p {
  color: var(--color-text-light);
}
.items-to-return h4 {
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--color-text-light);
}
.return-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--color-surface-mute);
  border-radius: 8px;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.item-info .item-name {
  font-weight: 600;
}
.item-info .item-price {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.item-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.item-actions label {
  font-weight: 500;
}
.item-actions input {
  width: 70px;
  text-align: center;
}
.back-link:hover {
  color: var(--color-primary);
}
.return-summary {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.summary-row h3 {
  font-size: 1.25rem;
  font-weight: 800;
}
.total-amount {
  color: var(--color-danger);
}
.return-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;
}
.return-actions button {
  width: auto;
}
.empty-list {
  color: var(--color-text-light);
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem 0;
}
</style>
