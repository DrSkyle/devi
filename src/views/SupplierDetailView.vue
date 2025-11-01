<template>
  <div v-if="supplier" class="supplier-detail-container">
    <header class="view-header">
      <RouterLink to="/suppliers" class="back-link">&larr; All Suppliers</RouterLink>
      <h1 class="title">{{ supplier.name }}</h1>
      <p class="subtitle">Manage contact information.</p>
    </header>

    <div class="card">
      <h2>Contact Information</h2>
      <form @submit.prevent="updateSupplier">
        <div class="form-group">
          <label>Phone</label>
          <input type="text" v-model="supplier.phone" placeholder="Enter phone number" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="supplier.email" placeholder="Enter email address" />
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" v-model="supplier.address" placeholder="Enter address" />
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { supabase } from '@/supabase'
import { useNotificationStore } from '@/stores/notification'

const route = useRoute()
const notification = useNotificationStore()
const supplierId = Number(route.params.id)
const supplier = ref(null)

const fetchData = async () => {
  const { data } = await supabase.from('suppliers').select('*').eq('_id', supplierId).single()
  supplier.value = data
}

onActivated(fetchData)

const updateSupplier = async () => {
  try {
    const { error } = await supabase
      .from('suppliers')
      .update({
        phone: supplier.value.phone,
        email: supplier.value.email,
        address: supplier.value.address,
      })
      .eq('_id', supplierId)
    if (error) throw error

    notification.showNotification('Supplier details updated!')
  } catch (error) {
    notification.showNotification('Failed to update details.', 'error')
  }
}
</script>

<style scoped>
.card {
  margin-top: 2rem;
}
.card h2 {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}
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
</style>
