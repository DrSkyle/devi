<template>
  <div v-if="supplier" class="create-po-container">
    <header class="view-header">
      <RouterLink :to="`/suppliers/${supplier._id}`" class="back-link"
        >&larr; Back to {{ supplier.name }}</RouterLink
      >
      <h1 class="title">New Purchase Order</h1>
      <p class="subtitle">Log the items you are ordering from {{ supplier.name }}.</p>
    </header>

    <div class="po-items-list">
      <div v-for="(item, index) in poItems" :key="index" class="card po-item-card">
        <div class="card-header">
          <h3>Item #{{ index + 1 }}</h3>
          <button @click="removeItem(index)" class="button-icon danger">×</button>
        </div>
        <div class="form-group">
          <label>Medicine Name</label>
          <input type="text" v-model="item.name" placeholder="e.g., Paracetamol 500mg" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" v-model.number="item.quantity" placeholder="0" />
          </div>
          <div class="form-group">
            <label>Expiry Date</label>
            <input type="date" v-model="item.expiryDate" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Purchase Price</label>
            <input
              type="number"
              step="0.01"
              v-model.number="item.purchasePrice"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label>Selling Price</label>
            <input
              type="number"
              step="0.01"
              v-model.number="item.sellingPrice"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button @click="addItem" class="button-secondary">+ Add Another Item</button>
      <button @click="savePurchaseOrder" class="button" :disabled="isSaving">
        {{ isSaving ? 'Saving...' : 'Save Purchase Order' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, RouterLink, useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const supplierId = Number(route.params.id)

const supplier = ref(null)
const isSaving = ref(false)
const poItems = reactive([
  {
    name: '',
    brandName: '',
    quantity: null,
    purchasePrice: null,
    sellingPrice: null,
    expiryDate: '',
  },
])

onMounted(async () => {
  const { data } = await supabase.from('suppliers').select('*').eq('_id', supplierId).single()
  supplier.value = data

  const { name, brandName } = route.query
  if (name) {
    poItems[0].name = name
    poItems[0].brandName = brandName || ''
  }
})

const addItem = () => {
  poItems.push({
    name: '',
    brandName: '',
    quantity: null,
    purchasePrice: null,
    sellingPrice: null,
    expiryDate: '',
  })
}
const removeItem = (index) => {
  if (poItems.length > 1) {
    poItems.splice(index, 1)
  } else {
    notification.showNotification('You cannot remove the only item.', 'error')
  }
}

const savePurchaseOrder = async () => {
  isSaving.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    isSaving.value = false
    return
  }

  try {
    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_id: supplierId,
        status: 'pending',
        user_id: user.id,
      })
      .select()
      .single()

    if (poError) throw poError

    const itemsToSave = poItems
      .filter((item) => item.name && item.quantity > 0)
      .map((item) => ({
        po_id: poData._id,
        user_id: user.id,
        name: item.name,
        brand_name: item.brandName,
        quantity: item.quantity,
        purchase_price: item.purchasePrice,
        selling_price: item.sellingPrice,
        expiry_date: item.expiryDate,
      }))

    if (itemsToSave.length === 0) {
      notification.showNotification(
        'Please add at least one item with a name and quantity.',
        'error',
      )
      // Rollback the PO creation
      await supabase.from('purchase_orders').delete().eq('_id', poData._id)
      return
    }

    const { error: _itemsError } = await supabase.from('purchase_order_items').insert(itemsToSave)
    if (_itemsError) throw _itemsError

    notification.showNotification('Purchase Order saved!')
    router.push(`/suppliers/${supplierId}`)
  } catch (_error) {
    console.error(_error)
    notification.showNotification('Failed to save Purchase Order.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* All styles are unchanged */
.po-items-list {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.po-item-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.po-item-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (min-width: 640px) {
  .actions {
    flex-direction: row-reverse;
  }
}
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 1rem;
}

/* Scoped style for icon button */
.button-icon.danger {
  background: transparent;
  border: none;
  color: var(--color-danger);
  font-size: 1.5rem;
  font-weight: bold;
  width: auto;
  padding: 0 0.5rem;
  cursor: pointer;
}
.back-link:hover {
  color: var(--color-primary);
}
</style>
