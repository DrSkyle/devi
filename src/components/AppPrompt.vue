<template>
  <Transition name="fade">
    <div v-if="prompt.isVisible" class="modal-overlay" @click.self="prompt.cancel">
      <div class="modal-content card">
        <h2>{{ prompt.title }}</h2>
        <p v-if="prompt.message">{{ prompt.message }}</p>
        <form @submit.prevent="prompt.confirm">
          <div v-if="prompt.mode === 'prompt'" class="form-group">
            <input
              :type="prompt.inputType"
              v-model="prompt.inputValue"
              ref="inputField"
              step="0.01"
              required
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="button-secondary" @click="prompt.cancel">Cancel</button>
            <button type="submit">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { usePromptStore } from '@/stores/prompt.js'
import { ref, watch, nextTick } from 'vue'

const prompt = usePromptStore()
const inputField = ref(null)

// Automatically focus the input field when the modal opens
watch(
  () => prompt.isVisible,
  (isVisible) => {
    if (isVisible && prompt.mode === 'prompt') {
      nextTick(() => {
        inputField.value?.focus()
      })
    }
  },
)
</script>

<style scoped>
.modal-overlay {
  z-index: 100; /* ... same as before ... */
}
.modal-content {
  max-width: 400px; /* ... same as before ... */
}
.modal-content p {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}
.form-group {
  margin-bottom: 2rem;
}
/* --- Animation --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/* All other styles from KhataView modal can be reused */
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
  z-index: 100;
}
.modal-content h2 {
  margin-bottom: 1rem;
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
