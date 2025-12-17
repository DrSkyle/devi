<template>
  <div class="supplier-detail-container p-4 max-w-7xl mx-auto relative min-h-screen">
    <div v-if="supplier">
      <!-- Header & Actions -->
      <div
        class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
      >
        <div>
          <RouterLink
            to="/suppliers"
            class="no-underline text-gray-400 hover:text-white transition-colors mb-2 inline-block flex align-items-center gap-2"
          >
            <i class="pi pi-arrow-left text-sm"></i> Back to Suppliers
          </RouterLink>
          <h1 class="text-4xl font-thin text-white mb-1 tracking-tight">{{ supplier.name }}</h1>
          <p class="text-gray-400 text-sm flex align-items-center gap-3">
            <span><i class="pi pi-phone text-xs mr-1"></i> {{ supplier.phone || 'No phone' }}</span>
            <span
              :class="supplier.balance > 0 ? 'text-red-400' : 'text-green-400'"
              class="font-bold ml-2"
            >
              Balance: Rs. {{ (supplier.balance || 0).toFixed(2) }}
            </span>
          </p>
        </div>
        <div class="flex gap-3">
          <Button
            label="Create Purchase Order"
            icon="pi pi-shopping-cart"
            class="p-button-rounded bg-primary border-none hover:bg-primary-600 shadow-4 font-bold px-4"
            @click="router.push(`/suppliers/${supplier.id}/new-po`)"
          />
        </div>
      </div>

      <div class="grid">
        <!-- Left Column: Edit Form -->
        <div class="col-12 lg:col-4">
          <div class="glass-panel p-4">
            <h2 class="text-xl font-bold text-white mb-4">Edit Details</h2>
            <form @submit.prevent="updateSupplier" class="flex flex-column gap-3">
              <div class="field">
                <label class="text-gray-300 text-sm mb-2 block">Phone</label>
                <InputText v-model="supplier.phone" class="w-full glass-input" />
              </div>
              <!-- Add other fields if schema supports them later -->
              <Button
                type="submit"
                label="Save Changes"
                icon="pi pi-check"
                class="w-full mt-2"
                :loading="isSaving"
              />
            </form>
          </div>
        </div>

        <!-- Right Column: Placeholder for History -->
        <div class="col-12 lg:col-8">
          <div class="glass-panel p-4 min-h-full flex align-items-center justify-content-center">
            <div class="text-center text-gray-500">
              <i class="pi pi-history text-4xl mb-3"></i>
              <p>Purchase History coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex align-items-center justify-content-center min-h-screen">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { database } from '@/database'
import { useNotificationStore } from '@/stores/notification'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const supplierId = route.params.id
const supplier = ref(null)
const isSaving = ref(false)

const fetchData = async () => {
  try {
    const data = await database.get('suppliers').find(supplierId)
    supplier.value = {
      ...data._raw,
      id: data.id,
    }
  } catch (error) {
    console.error('Supplier not found', error)
    notification.showNotification('Supplier not found', 'error')
    router.push('/suppliers')
  }
}

onActivated(fetchData)

const updateSupplier = async () => {
  isSaving.value = true
  try {
    await database.write(async () => {
      const supplierRecord = await database.get('suppliers').find(supplier.value.id)
      await supplierRecord.update((rec) => {
        rec.phone = supplier.value.phone
      })
    })
    notification.showNotification('Supplier details updated!')
  } catch (_error) {
    console.error(_error)
    notification.showNotification('Failed to update details.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
</style>
