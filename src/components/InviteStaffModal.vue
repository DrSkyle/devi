<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content card">
      <h2>Generate Invite Code</h2>
      <p>
        Select a role for the new staff member. A unique, one-time-use code will be generated for
        them to join your pharmacy.
      </p>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="staffRole">Assign Role</label>
          <select id="staffRole" v-model="role" required>
            <option value="cashier">Cashier</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="button-secondary" @click="$emit('close')">Cancel</button>
          <button type="submit" :disabled="isLoading">
            {{ isLoading ? 'Generating...' : 'Generate Code' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['close', 'send-invite'])
const role = ref('cashier')
const isLoading = ref(false)

const handleSubmit = () => {
  emit('send-invite', { role: role.value })
}
</script>

<style scoped>
/* Styles are unchanged */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  width: 100%;
  max-width: 500px;
  margin: 1rem;
}
.modal-content h2 {
  margin-bottom: 1rem;
}
.modal-content p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 2rem;
}
select {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: var(--color-surface-mute);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text);
  font-size: 0.95rem;
}
.modal-actions {
  display: flex;
  gap: 1rem;
}
.button-secondary {
  background-color: var(--color-surface-mute);
  color: var(--color-text-light);
}
.button-secondary:hover {
  background-color: var(--color-slate-gray);
}
</style>
