<template>
  <div class="container add-inventory-container">
    <div class="card">
      <div class="card-header">
        <h1 class="title">Add New Stock</h1>
        <p class="subtitle">Enter the details for the new medicine batch.</p>
      </div>

      <form @submit.prevent="saveNewItem">
        <div class="form-row">
          <div class="form-group">
            <label for="name">Medicine Name</label>
            <input
              id="name"
              type="text"
              v-model="newItem.name"
              required
              placeholder="e.g., Paracetamol"
            />
          </div>
          <div class="form-group">
            <label for="measurement">Strength / Measurement</label>
            <input
              id="measurement"
              type="text"
              v-model="newItem.measurement"
              placeholder="e.g., 500mg, 10ml/5ml"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="brandName">Brand Name (e.g., Niko Plus)</label>
            <input id="brandName" type="text" v-model="newItem.brandName" />
          </div>
          <div class="form-group">
            <label for="form">Form / Type</label>
            <select id="form" v-model="newItem.form">
              <option disabled value="">Select a form</option>
              <option>Tablet</option>
              <option>Capsule</option>
              <option>Syrup</option>
              <option>Injection</option>
              <option>Ointment</option>
              <option>Drops</option>
              <option>Powder</option>
              <option>Sample</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="shelfLocation">Shelf Location (Optional)</label>
          <input
            id="shelfLocation"
            type="text"
            v-model="newItem.shelfLocation"
            placeholder="e.g., Rack 3, Top-Left"
          />
        </div>
        <div class="form-group form-group-checkbox">
          <input
            id="is_controlled"
            type="checkbox"
            v-model="newItem.isControlled"
            class="form-checkbox"
          />
          <label for="is_controlled">Is this a Controlled Substance? (Requires DDA Log)</label>
        </div>
        <div class="form-group">
          <label for="category">Category (Optional)</label>
          <input
            id="category"
            type="text"
            v-model="newItem.category"
            placeholder="e.g., Antibiotic, Painkiller"
          />
        </div>

        <div class="form-group">
          <label for="supplier">Supplier / Manufacturer</label>
          <select id="supplier" v-model.number="newItem.supplierId">
            <option :value="null" disabled>Select a supplier</option>
            <option v-for="supplier in suppliers" :key="supplier._id" :value="supplier._id">
              {{ supplier.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="quantity">Quantity</label>
            <input id="quantity" type="number" v-model.number="newItem.quantity" required />
          </div>
          <div class="form-group">
            <label for="batchNo">Batch Number (Optional)</label>
            <input id="batchNo" type="text" v-model="newItem.batchNo" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="purchasePrice">Purchase Price (per unit)</label>
            <input
              id="purchasePrice"
              type="number"
              step="0.01"
              v-model.number="newItem.purchasePrice"
              required
            />
          </div>
          <div class="form-group">
            <label for="sellingPrice">Selling Price (per unit, VAT Exclusive)</label>
            <input
              id="sellingPrice"
              type="number"
              step="0.01"
              v-model.number="newItem.sellingPrice"
              required
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="expiryDate">Expiry Date</label>
            <input id="expiryDate" type="date" v-model="newItem.expiryDate" required />
          </div>
          <div class="form-group">
            <label for="vatPercent">VAT % (e.g., 0 or 13)</label>
            <input
              id="vatPercent"
              type="number"
              v-model.number="newItem.vatPercent"
              placeholder="13"
            />
          </div>
        </div>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : 'Save to Inventory' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { supabase } from '@/supabase'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'
import { encryptData } from '@/utils/cipher'

const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()
const isLoading = ref(false)
const suppliers = ref([])

const newItem = reactive({
  name: '',
  measurement: '',
  brandName: '',
  form: '',
  category: '',
  batchNo: '',
  quantity: null,
  purchasePrice: null,
  sellingPrice: null,
  expiryDate: '',
  supplierId: null,
  vatPercent: 13,
  shelfLocation: '',
  isControlled: false,
})

onMounted(async () => {
  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (pharmacyId) {
    const { data } = await supabase.from('suppliers').select('*').eq('pharmacy_id', pharmacyId)
    if (data) {
      suppliers.value = data
    }
  }
})

const saveNewItem = async () => {
  if (!newItem.name || !newItem.expiryDate) {
    notification.showNotification('Please fill in all required fields.', 'error')
    return
  }
  isLoading.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    isLoading.value = false
    notification.showNotification('Authentication error.', 'error')
    return
  }

  const pharmacyId = parseInt(profileStore.pharmacyId, 10)
  if (isNaN(pharmacyId)) {
    notification.showNotification('Invalid Pharmacy ID.', 'error')
    isLoading.value = false
    return
  }

  try {
    const itemToSave = {
      pharmacy_id: pharmacyId,
      user_id: user.id,
      name: encryptData(newItem.name + (newItem.measurement ? ` ${newItem.measurement}` : '')),
      brand_name: encryptData(newItem.brandName),
      form: encryptData(newItem.form),
      category: encryptData(newItem.category),
      shelf_location: encryptData(newItem.shelfLocation),
      supplier_id: newItem.supplierId,
      quantity: newItem.quantity,
      batch_no: newItem.batchNo,
      purchase_price: newItem.purchasePrice,
      selling_price: newItem.sellingPrice,
      expiry_date: newItem.expiryDate,
      vat_percent: newItem.vatPercent,
      is_controlled: newItem.isControlled,
    }

    const { error } = await supabase.from('inventory').insert(itemToSave)
    if (error) throw error

    await supabase.from('audit_logs').insert({
      pharmacy_id: pharmacyId,
      user_id: user.id,
      action: 'INVENTORY_ADD',
      details: { itemName: newItem.name, quantityAdded: newItem.quantity },
    })

    notification.showNotification(`New batch for '${newItem.name}' added to inventory!`)
    router.push('/inventory')
  } catch (err) {
    notification.showNotification('Failed to save item. Please try again.', 'error')
    console.error('Error saving new inventory item:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Your existing styles will work perfectly */
select {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface-mute);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}
select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-mute);
}
.add-inventory-container {
  max-width: 700px;
  margin: 0 auto;
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
@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
