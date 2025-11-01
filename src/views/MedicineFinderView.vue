<template>
  <div class="finder-container">
    <PharmacyMap />
    <header class="view-header">
      <h1 class="title">Medicine Finder</h1>
      <p class="subtitle">Search your local inventory and the Devi Network.</p>
    </header>

    <div class="search-card card">
      <div class="search-box">
        <input
          type="text"
          v-model="searchQuery"
          @input="debouncedSearch"
          placeholder="Search for a medicine..."
        />
        <span class="search-icon">🔍</span>
      </div>
    </div>

    <div class="results-container">
      <div v-if="isLoading" class="loading-state card">
        <p>Searching inventory and Devi Network...</p>
      </div>

      <div v-if="searchQuery && !isLoading">
        <h2 class="results-title">Your Inventory</h2>
        <div v-if="localResults.length > 0" class="results-list">
          <div v-for="item in localResults" :key="item._id" class="result-item card local">
            <div class="item-details">
              <span class="item-name">{{ decryptData(item.name) }}</span>
              <span class="item-brand">{{ decryptData(item.brand_name) }}</span>
              <span v-if="item.shelf_location" class="item-location">
                📍 {{ decryptData(item.shelf_location) }}
              </span>
            </div>
            <div class="item-status" :class="item.quantity > 0 ? 'in-stock' : 'out-of-stock'">
              {{ item.quantity > 0 ? `In Stock (${item.quantity})` : 'Out of Stock' }}
            </div>
          </div>
        </div>
        <div v-else class="empty-state card">
          <p>No matches found in your local inventory.</p>
        </div>

        <h2 class="results-title">Devi Network (Same City)</h2>
        <div v-if="networkResults.city.length > 0" class="results-list">
          <div v-for="item in networkResults.city" :key="item.id" class="result-item card network">
            <div class="item-details">
              <span class="item-name">{{ item.decryptedName }}</span>
              <span class="item-brand">At: {{ item.pharmacy_name }}</span>
            </div>
            <button class="button-secondary" @click="requestTransfer(item)">
              Request Transfer
            </button>
          </div>
        </div>
        <div v-else class="empty-state card">
          <p>No other pharmacies in your city have this medicine in stock.</p>
        </div>

        <h2 class="results-title">Devi Network (Rest of District)</h2>
        <div v-if="networkResults.district.length > 0" class="results-list">
          <div
            v-for="item in networkResults.district"
            :key="item.id"
            class="result-item card network"
          >
            <div class="item-details">
              <span class="item-name">{{ item.decryptedName }}</span>
              <span class="item-brand">At: {{ item.pharmacy_name }} ({{ item.city }})</span>
            </div>
            <button class="button-secondary" @click="requestTransfer(item)">
              Request Transfer
            </button>
          </div>
        </div>
        <div v-else class="empty-state card">
          <p>No other pharmacies in your district have this medicine in stock.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { supabase } from '@/supabase'
import { useProfileStore } from '@/stores/profile'
import { decryptData } from '@/utils/cipher'
import { useNotificationStore } from '@/stores/notification'
import { usePromptStore } from '@/stores/prompt'
import PharmacyMap from '@/components/PharmacyMap.vue' // Adjust path if needed
const profile = useProfileStore()
const notification = useNotificationStore()
const prompt = usePromptStore()
const searchQuery = ref('')
const localResults = ref([])
const networkResults = reactive({ city: [], district: [] })
const isLoading = ref(false)
let debounceTimer = null

const debouncedSearch = () => {
  clearTimeout(debounceTimer)
  isLoading.value = true
  debounceTimer = setTimeout(async () => {
    localResults.value = []
    networkResults.city = []
    networkResults.district = []

    if (searchQuery.value.length < 1) {
      isLoading.value = false
      return
    }

    await Promise.all([
      searchLocalInventory(),
      searchNetworkInventory().catch((err) => console.error('Network search failed:', err)),
    ])

    isLoading.value = false
  }, 500)
}

const searchLocalInventory = async () => {
  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId) return

  const lowerCaseQuery = searchQuery.value.toLowerCase()

  const { data } = await supabase.from('inventory').select('*').eq('pharmacy_id', pharmacyId)

  if (data) {
    localResults.value = data.filter(
      (item) =>
        decryptData(item.name)?.toLowerCase().includes(lowerCaseQuery) ||
        decryptData(item.brand_name)?.toLowerCase().includes(lowerCaseQuery),
    )
  }
}

const searchNetworkInventory = async () => {
  const pharmacyId = parseInt(profile.pharmacyId, 10)
  if (!pharmacyId || !profile.city || !profile.district) return

  const { data, error } = await supabase.rpc('search_network_inventory', {
    p_query: searchQuery.value,
    p_city: profile.city,
    p_district: profile.district,
    p_pharmacy_id: pharmacyId, // <-- FIX: Ensured this is a number
  })

  if (data) {
    networkResults.city = data.city_results.map((item) => ({
      ...item,
      decryptedName: decryptData(item.name),
      decryptedBrand: decryptData(item.brand_name),
    }))
    networkResults.district = data.district_results.map((item) => ({
      ...item,
      decryptedName: decryptData(item.name),
      decryptedBrand: decryptData(item.brand_name),
    }))
  }
}

const requestTransfer = async (item) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  try {
    const quantity = await prompt.show({
      title: 'Request Transfer',
      message: `How many units of ${item.decryptedName} do you want to request from ${item.pharmacy_name}?`,
      inputType: 'number',
      initialValue: '1',
    })

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      notification.showNotification('Invalid quantity entered.', 'error')
      return
    }

    const transferRequest = {
      from_pharmacy_id: item.pharmacy_id,
      from_pharmacy_name: item.pharmacy_name,
      to_pharmacy_id: parseInt(profile.pharmacyId, 10), // <-- FIX: Ensured this is a number
      to_pharmacy_name: profile.name,
      medicine_name: item.decryptedName,
      brand_name: item.decryptedBrand,
      quantity: Number(quantity),
      status: 'pending',
      user_id: user.id,
    }

    const { error } = await supabase.from('transfers').insert(transferRequest)
    if (error) throw error

    notification.showNotification('Transfer request sent successfully!', 'success')
  } catch (error) {
    if (error !== 'cancelled' && error.message !== 'cancelled') {
      notification.showNotification('Failed to send request.', 'error')
    }
  }
}
</script>

<style scoped>
/* All styles are the same */
.result-item.local {
  border-left: 4px solid var(--color-primary);
}
.item-location {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-accent);
  margin-top: 0.5rem;
}
.result-item.network {
  border-left: 4px solid var(--color-peacock-teal);
}
.finder-container {
  max-width: 800px;
  margin: 0 auto;
}
.search-card {
  padding: 1.5rem;
}
.search-box {
  position: relative;
}
.search-box input {
  width: 100%;
  padding: 1rem 1.5rem;
  padding-right: 4rem;
  font-size: 1.2rem;
  border-radius: 12px;
}
.search-icon {
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  opacity: 0.5;
}
.results-container {
  margin-top: 2rem;
}
.results-title {
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--color-text-light);
  font-size: 1.2rem;
  font-weight: 600;
}
.results-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.item-details {
  display: flex;
  flex-direction: column;
}
.item-name {
  font-weight: 600;
  font-size: 1.1rem;
}
.item-brand {
  color: var(--color-text-light);
}
.result-item .button-secondary {
  width: auto;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.empty-state,
.loading-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-light);
}

.item-status {
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.9rem;
}
.item-status.in-stock {
  background-color: var(--color-peacock-teal);
  color: var(--color-midnight-blue);
}
.item-status.out-of-stock {
  background-color: var(--color-slate-gray);
  color: var(--color-soft-cream);
}
</style>
