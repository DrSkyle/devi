<template>
  <div class="create-po-container p-6 text-center">
    <div class="glass-panel p-6">
      <i class="pi pi-lock text-5xl text-gray-500 mb-4"></i>
      <h1 class="text-2xl font-bold text-white mb-2">Feature Unavailable</h1>
      <p class="text-gray-400 mb-6">
        Purchase Order management is currently unavailable in Offline Mode.
        This feature will be restored in a future update.
      </p>
      <button class="button" @click="goBack">Go Back</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const notification = useNotificationStore()

const goBack = () => router.back()
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
