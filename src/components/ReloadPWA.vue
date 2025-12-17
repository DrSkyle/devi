<template>
  <div v-if="needRefresh && showReload" class="fixed bottom-0 right-0 m-4 z-5">
    <Message severity="info" :closable="true" @close="showReload = false" class="shadow-4">
      <div class="flex align-items-center gap-3">
        <span>A new version is available.</span>
        <Button label="Reload" size="small" @click="updateServiceWorker()" />
      </div>
    </Message>
  </div>
</template>

<script setup>
import { useRegisterSW } from 'virtual:pwa-register/vue'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { ref } from 'vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()
const showReload = ref(true)
</script>
