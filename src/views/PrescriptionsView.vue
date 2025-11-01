<template>
  <div class="prescriptions-container">
    <header class="view-header">
      <h1 class="title">Prescription Hub</h1>
      <p class="subtitle">Search, manage, and dispense all patient prescriptions.</p>
    </header>

    <div class="actions-header">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search by Patient, Doctor, or Medicine..."
        />
      </div>
      <RouterLink to="/add-prescription" class="button">+ New Prescription</RouterLink>
    </div>

    <div class="card">
      <div v-if="isLoading" class="loading-state">
        <p>Loading prescriptions...</p>
      </div>
      <div v-else-if="filteredPrescriptions.length === 0" class="empty-state">
        <h2>No prescriptions found.</h2>
        <p>Click "+ New Prescription" to create the first one.</p>
      </div>
      <div v-else class="table-container">
        <table>
          <thead>
            <tr>
              <th>Patient Details</th>
              <th>Prescribed By</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rx in filteredPrescriptions" :key="rx._id">
              <td data-label="Patient">
                <div class="patient-details">
                  <span class="patient-name">{{ rx.patient_name }}</span>
                  <span class="date">{{ formatDate(rx.created_at) }}</span>
                </div>
              </td>
              <td data-label="Prescribed By">{{ rx.doctor_name }}</td>
              <td data-label="Items">
                <ul class="items-list">
                  <li v-for="item in rx.items" :key="item.name">
                    {{ decryptData(item.name) }} ({{ item.quantity }})
                  </li>
                </ul>
              </td>
              <td data-label="Status">
                <span class="status-badge" :class="rx.status">{{ rx.status }}</span>
              </td>
              <td data-label="Actions">
                <div class="actions-group">
                  <button @click="dispense(rx)" class="action-button dispense">Dispense</button>
                  <RouterLink :to="`/prescriptions/edit/${rx._id}`" class="action-button edit"
                    >Edit</RouterLink
                  >
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import { supabase } from '@/supabase'
import { useRouter, RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'

const router = useRouter()
const profile = useProfileStore()
const allPrescriptions = ref([])
const searchQuery = ref('')
const isLoading = ref(true)

const fetchPrescriptions = async () => {
  isLoading.value = true
  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId) {
    isLoading.value = false
    return
  }
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false })

  if (data) {
    allPrescriptions.value = data
  }
  isLoading.value = false
}

onActivated(fetchPrescriptions)

const filteredPrescriptions = computed(() => {
  if (!searchQuery.value) {
    return allPrescriptions.value
  }
  const lowerQuery = searchQuery.value.toLowerCase()
  return allPrescriptions.value.filter((rx) => {
    const patientMatch = rx.patient_name.toLowerCase().includes(lowerQuery)
    const doctorMatch = rx.doctor_name.toLowerCase().includes(lowerQuery)
    const itemMatch = rx.items.some((item) =>
      decryptData(item.name)?.toLowerCase().includes(lowerQuery),
    )
    return patientMatch || doctorMatch || itemMatch
  })
})

const dispense = (rx) => {
  router.push({ name: 'record-sale', query: { fromRx: rx._id } })
}

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
</script>

<style scoped>
.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  gap: 1rem;
}
.search-box {
  flex-grow: 1;
}
.search-box input {
  width: 100%;
  max-width: 400px;
}
.actions-header .button {
  width: auto;
}
.card {
  padding: 0;
}
.table-container {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}
thead {
  background-color: var(--color-surface-mute);
}
.patient-details {
  display: flex;
  flex-direction: column;
}
.patient-name {
  font-weight: 600;
}
.date {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.items-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.status-badge {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.9rem;
  text-transform: capitalize;
}
.status-badge.pending {
  background-color: var(--color-saffron-orange);
  color: var(--color-midnight-blue);
}
.status-badge.dispensed {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}
.actions-group {
  display: flex;
  gap: 0.5rem;
}
.action-button {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer;
}
.action-button.dispense {
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
}
.action-button.edit {
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
}
.empty-state,
.loading-state {
  text-align: center;
  padding: 3rem;
}
@media (max-width: 768px) {
  /* Mobile table styles */
}
</style>
