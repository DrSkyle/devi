<template>
  <div class="container add-inventory-container">
    <header class="view-header">
      <RouterLink to="/inventory" class="back-link">&larr; Back to Inventory</RouterLink>
    </header>
    <div class="card" v-if="item">
      <div class="card-header">
        <h1 class="title">Edit Stock</h1>
        <p class="subtitle">Update the details for {{ item.name }}</p>
      </div>

      <form @submit.prevent="updateItem">
        <div class="form-group">
          <label for="name">Medicine Name</label>
          <input id="name" type="text" v-model="item.name" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="brandName">Brand Name</label>
            <input id="brandName" type="text" v-model="item.brandName" />
          </div>
          <div class="form-group">
            <label for="category">Category</label>
            <input id="category" type="text" v-model="item.category" />
          </div>
        </div>

        <div class="form-group">
          <label for="shelfLocation">Shelf Location (Optional)</label>
          <input
            id="shelfLocation"
            type="text"
            v-model="item.shelfLocation"
            placeholder="e.g., Rack 3, Top-Left"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input id="quantity" type="number" v-model.number="item.quantity" required />
          </div>
          <div class="form-group">
            <label for="batchNo">Batch Number (Optional)</label>
            <input id="batchNo" type="text" v-model="item.batchNo" />
          </div>
          <div class="form-group form-group-checkbox">
            <input
              id="is_controlled"
              type="checkbox"
              v-model="item.isControlled"
              class="form-checkbox"
            />
            <label for="is_controlled">Is this a Controlled Substance? (Requires DDA Log)</label>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="purchasePrice">Purchase Price (per unit)</label>
            <input
              id="purchasePrice"
              type="number"
              step="0.01"
              v-model.number="item.purchasePrice"
              required
            />
          </div>
          <div class="form-group">
            <label for="sellingPrice">Selling Price (per unit, VAT Exclusive)</label>
            <input
              id="sellingPrice"
              type="number"
              step="0.01"
              v-model.number="item.sellingPrice"
              required
            />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="expiryDate">Expiry Date</label>
            <input id="expiryDate" type="date" v-model="item.expiryDate" required />
          </div>
          <div class="form-group">
            <label for="vatPercent">VAT %</label>
            <input id="vatPercent" type="number" v-model.number="item.vatPercent" />
          </div>
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Saving Changes...' : 'Save Changes' }}
        </button>
      </form>
    </div>
    <div v-else>
      <p>Loading item details...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { useNotificationStore } from '@/stores/notification'
import { encryptData, decryptData } from '@/utils/cipher'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()

const item = ref(null)
const isLoading = ref(false)

onMounted(async () => {
  const itemId = Number(route.params.id)
  const { data: fetchedItem, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('_id', itemId)
    .single()

  if (fetchedItem) {
    item.value = {
      ...fetchedItem,
      name: decryptData(fetchedItem.name),
      brandName: decryptData(fetchedItem.brand_name),
      category: decryptData(fetchedItem.category),
      shelfLocation: decryptData(fetchedItem.shelf_location),
      batchNo: fetchedItem.batch_no,
      purchasePrice: fetchedItem.purchase_price,
      sellingPrice: fetchedItem.selling_price,
      expiryDate: fetchedItem.expiry_date,
      vatPercent: fetchedItem.vat_percent,
    }
  } else {
    notification.showNotification('Item not found.', 'error')
    router.push('/inventory')
  }
})

const updateItem = async () => {
  isLoading.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  try {
    const itemToSave = {
      name: encryptData(item.value.name),
      brand_name: encryptData(item.value.brandName),
      category: encryptData(item.value.category),
      shelf_location: encryptData(item.value.shelfLocation),
      quantity: item.value.quantity,
      batch_no: item.value.batchNo,
      purchase_price: item.value.purchasePrice,
      selling_price: item.value.sellingPrice,
      expiry_date: item.value.expiryDate,
      vat_percent: item.value.vatPercent,
      is_controlled: item.value.isControlled, // <-- ADD THIS
    }

    const { error } = await supabase.from('inventory').update(itemToSave).eq('_id', item.value._id)
    if (error) throw error

    // Audit Log
    await supabase.from('audit_logs').insert({
      action: 'INVENTORY_UPDATE',
      user_id: user.id,
      details: { itemId: item.value._id, itemName: item.value.name },
    })

    notification.showNotification(`'${item.value.name}' has been updated!`)
    router.push('/inventory')
  } catch (error) {
    notification.showNotification('Failed to update item.', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.back-link {
  color: var(--color-text-light);
  text-decoration: none;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 1rem;
}
.back-link:hover {
  color: var(--color-primary);
}
.add-inventory-container {
  max-width: 700px;
  margin: 0 auto;
}
.card {
  margin-top: 1rem;
}
.card-header {
  text-align: center;
  margin-bottom: 2.5rem;
}
.title {
  font-size: 2.25rem;
  font-weight: 800;
}
.subtitle {
  color: var(--color-text-light);
  margin-top: 0.5rem;
}
.form-group {
  margin-bottom: 1.75rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.6rem;
  font-weight: 500;
  color: var(--color-light-slate);
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}
button:hover:not(:disabled) {
  background-color: #fca5a5;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
