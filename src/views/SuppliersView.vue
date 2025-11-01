<template>
  <div class="suppliers-container">
    <header class="view-header">
      <h1 class="title">Suppliers</h1>
      <p class="subtitle">Manage your drug manufacturers and suppliers.</p>
      <button @click="openAddModal" class="add-supplier-button button">+ Add New Supplier</button>
    </header>

    <div class="card">
      <ul v-if="suppliers.length > 0" class="supplier-list">
        <RouterLink
          v-for="supplier in suppliers"
          :key="supplier._id"
          :to="`/suppliers/${supplier._id}`"
          class="supplier-link"
        >
          <div class="info">
            <span class="name">{{ supplier.name }}</span>
            <span class="contact">{{ supplier.phone || 'No contact info' }}</span>
          </div>
          <span class="arrow">&rarr;</span>
        </RouterLink>
      </ul>
      <div v-else class="empty-state">
        <p>You haven't added any suppliers yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { supabase } from '@/supabase'
import { usePromptStore } from '@/stores/prompt'
import { useNotificationStore } from '@/stores/notification'
import { RouterLink } from 'vue-router'
import { useProfileStore } from '@/stores/profile'

const suppliers = ref([])
const prompt = usePromptStore()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const fetchSuppliers = async () => {
  if (!profileStore.pharmacyId) return
  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', profileStore.pharmacyId)
    .order('name')
  if (data) suppliers.value = data
}

onActivated(fetchSuppliers)

const openAddModal = async () => {
  try {
    const name = await prompt.show({
      title: 'Add New Supplier',
      message: 'Enter the name of the supplier or manufacturer:',
    })

    if (name && name.trim()) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('suppliers').insert({
        name: name.trim(),
        user_id: user.id,
        balance: 0,
      })
      if (error) throw error

      notification.showNotification('Supplier added successfully!')
      fetchSuppliers()
    }
  } catch (error) {
    if (error !== 'cancelled') {
      notification.showNotification('Failed to add supplier.', 'error')
    }
  }
}
</script>
<style scoped>
.add-supplier-button {
  margin-top: 1.5rem;
  width: auto;
}
.card {
  margin-top: 2rem;
  padding: 0;
  overflow: hidden;
}
.supplier-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.supplier-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
  text-decoration: none;
  color: var(--color-text);
  transition: background-color 0.2s;
}
.supplier-link:hover {
  background-color: var(--color-surface-mute);
}
.supplier-link:last-child {
  border-bottom: none;
}
.info {
  display: flex;
  flex-direction: column;
}
.name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--color-soft-cream);
}
.contact {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
.arrow {
  font-size: 1.5rem;
  color: var(--color-text-light);
}
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: var(--color-text-light);
}
</style>
