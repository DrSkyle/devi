<template>
  <div>
    <Button
      rounded
      class="switch-user-fab shadow-4"
      @click="isPinModalOpen = true"
      v-tooltip.left="'Switch User'"
    >
      <div class="flex align-items-center gap-2 px-2">
        <i class="pi pi-user text-xl"></i>
        <span class="hidden md:inline font-bold">{{ staffStore.activeUserName }}</span>
      </div>
    </Button>

    <PinLoginModal v-if="isPinModalOpen" @close="isPinModalOpen = false" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useStaffStore } from '@/stores/staff.js'
import PinLoginModal from './PinLoginModal.vue'
import Button from 'primevue/button'

const staffStore = useStaffStore()
const isPinModalOpen = ref(false)
</script>

<style scoped>
.switch-user-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  height: 3.5rem;
}
@media (max-width: 768px) {
  .switch-user-fab {
    bottom: 80px; /* Move up to avoid bottom nav */
    width: 3.5rem;
    padding: 0 !important;
    justify-content: center;
  }
}
</style>
