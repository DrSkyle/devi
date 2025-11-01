<template>
  <div>
    <button @click="isPinModalOpen = true" class="switch-user-fab">
      <span class="fab-icon">👤</span>
      <span class="fab-text">{{ staffStore.activeUserName }}</span>
    </button>

    <PinLoginModal v-if="isPinModalOpen" @close="isPinModalOpen = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStaffStore } from '@/stores/staff.js'
import PinLoginModal from './PinLoginModal.vue'

const staffStore = useStaffStore()
const isPinModalOpen = ref(false)
</script>

<style scoped>
.switch-user-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: auto;
  min-width: 60px;
  height: 60px;
  background-color: var(--color-primary);
  color: var(--color-midnight-blue);
  border-radius: 999px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  gap: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease-in-out;
  z-index: 100;
}

.switch-user-fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.fab-icon {
  font-size: 1.5rem;
}

.fab-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* Prevents long names from breaking the layout */
}

/* On smaller screens (mobile), hide the text to save space */
@media (max-width: 768px) {
  .switch-user-fab {
    width: 60px; /* Make it a perfect circle */
    padding: 0;
  }
  .fab-text {
    display: none;
  }
}
</style>
