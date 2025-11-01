<template>
  <div class="edit-prescription-container">
    <div v-if="prescription">
      <header class="view-header">
        <RouterLink to="/prescriptions" class="back-link"
          >&larr; Back to Prescription Hub</RouterLink
        >
        <h1 class="title">Edit Prescription</h1>
        <p class="subtitle">Update details for {{ prescription.patient_name }}'s prescription.</p>
      </header>

      <div class="card">
        <form @submit.prevent="updatePrescription">
          <div class="form-row">
            <div class="form-group">
              <label for="patientName">Patient Name</label>
              <input id="patientName" type="text" v-model="prescription.patient_name" required />
            </div>
            <div class="form-group">
              <label for="doctorName">Doctor's Name</label>
              <input id="doctorName" type="text" v-model="prescription.doctor_name" required />
            </div>
          </div>

          <h3 class="medicines-title">Medicines</h3>
          <div class="medicines-list">
            <div v-for="(item, index) in prescription.items" :key="index" class="medicine-item">
              <div class="search-wrapper">
                <label :for="`med-name-${index}`">Medicine Name</label>
                <input
                  :id="`med-name-${index}`"
                  type="text"
                  v-model="item.name"
                  @input="(e) => searchInventory(e.target.value, index)"
                  placeholder="Medicine Name"
                  required
                />
                <ul
                  v-if="searchResults[index] && searchResults[index].length > 0"
                  class="search-results"
                >
                  <li
                    v-for="result in searchResults[index]"
                    :key="result.key"
                    @click="selectMedicine(index, result.name)"
                  >
                    {{ result.name }}
                  </li>
                </ul>
              </div>
              <div class="quantity-wrapper">
                <label :for="`med-qty-${index}`">Quantity</label>
                <input
                  :id="`med-qty-${index}`"
                  type="number"
                  v-model.number="item.quantity"
                  placeholder="Qty"
                  min="1"
                  required
                />
              </div>
              <button type="button" @click="removeMedicine(index)" class="remove-med-btn">
                &times;
              </button>
            </div>
          </div>

          <button type="button" @click="addMedicine" class="button-secondary add-med-btn">
            + Add Another Medicine
          </button>

          <div class="form-actions">
            <button type="submit" class="button" :disabled="isSaving">
              {{ isSaving ? 'Saving Changes...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-else class="loading-state">
      <p>Loading prescription...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'
import { decryptData, encryptData } from '@/utils/cipher'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const prescription = ref(null)
const isSaving = ref(false)
const searchResults = ref([])
let inventorySearchDebounce

onActivated(async () => {
  prescription.value = null
  const prescriptionId = Number(route.params.id)
  const { data } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('_id', prescriptionId)
    .single()

  if (data) {
    // *** DECRYPTION FIX ***
    // Decrypt the medicine names when the data is loaded.
    prescription.value = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        name: decryptData(item.name),
      })),
    }
  } else {
    notification.showNotification('Prescription not found.', 'error')
    router.push('/prescriptions')
  }
})

const addMedicine = () => {
  if (prescription.value) {
    prescription.value.items.push({ name: '', quantity: 1 })
  }
}

const removeMedicine = (index) => {
  if (prescription.value && prescription.value.items.length > 1) {
    prescription.value.items.splice(index, 1)
  } else {
    notification.showNotification('A prescription must have at least one medicine.', 'error')
  }
}

// *** NEW FEATURE: INVENTORY SEARCH ***
const searchInventory = (name, index) => {
  clearTimeout(inventorySearchDebounce)
  inventorySearchDebounce = setTimeout(async () => {
    if (name.length < 2) {
      searchResults.value[index] = []
      return
    }
    const { data } = await supabase
      .from('inventory')
      .select('name')
      .eq('pharmacy_id', profileStore.pharmacyId)
      .ilike('name', `%${encryptData(name)}%`) // Search using encrypted name

    if (data) {
      const uniqueNames = [...new Set(data.map((i) => decryptData(i.name)))]
      searchResults.value[index] = uniqueNames.map((n) => ({ name: n, key: n }))
    }
  }, 300)
}

const selectMedicine = (index, name) => {
  if (prescription.value) {
    prescription.value.items[index].name = name
    searchResults.value[index] = []
  }
}

const updatePrescription = async () => {
  isSaving.value = true
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    isSaving.value = false
    return
  }

  try {
    const updateData = {
      patient_name: prescription.value.patient_name,
      doctor_name: prescription.value.doctor_name,
      // *** ENCRYPTION FIX ***
      // Re-encrypt the medicine names before saving.
      items: prescription.value.items.map((item) => ({
        ...item,
        name: encryptData(item.name),
      })),
    }

    const { error } = await supabase
      .from('prescriptions')
      .update(updateData)
      .eq('_id', prescription.value._id)
    if (error) throw error

    await supabase.from('audit_logs').insert({
      action: 'PRESCRIPTION_UPDATE',
      user_id: user.id,
      details: {
        prescriptionId: prescription.value._id,
        patientName: prescription.value.patient_name,
      },
    })

    notification.showNotification('Prescription updated successfully!')
    router.push('/prescriptions')
  } catch (error) {
    notification.showNotification('Failed to update prescription.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* Using the cleaner styles from AddPrescriptionView */
.edit-prescription-container {
  max-width: 800px;
  margin: 0 auto;
}
.back-link {
  display: block;
  margin-bottom: 1rem;
  color: var(--color-text-light);
  text-decoration: none;
}
.card {
  padding: 2rem 2.5rem;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.medicines-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
.medicine-item {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: var(--color-surface-mute);
  margin-bottom: 1rem;
}
.search-wrapper {
  flex-grow: 1;
  position: relative;
}
.quantity-wrapper {
  width: 100px;
  flex-shrink: 0;
}
.form-group label,
.search-wrapper label,
.quantity-wrapper label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}
.remove-med-btn {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-light);
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
}
.add-med-btn {
  width: 100%;
  margin-top: 0.5rem;
}
.form-actions {
  margin-top: 2.5rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
}
.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  list-style: none;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
}
.search-results li {
  padding: 0.75rem 1rem;
  cursor: pointer;
}
.search-results li:hover {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
}
</style>
