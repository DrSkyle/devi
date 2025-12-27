<template>
  <Dialog
    v-model:visible="visible"
    modal
    :dismissableMask="true"
    :showHeader="false"
    class="global-search-dialog glass-dialog"
    :style="{ width: '600px', maxWidth: '90vw' }"
    @hide="onHide"
  >
    <div class="flex flex-column gap-3 p-3">
      <!-- Search Input -->
      <div class="relative w-full">
        <i
          class="pi pi-search absolute text-gray-400 text-xl"
          style="top: 50%; left: 1rem; transform: translateY(-50%)"
        ></i>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="w-full bg-transparent border-none text-white p-3 pl-7 outline-none text-xl"
          placeholder="Search inventory, customers..."
          @input="onInput"
          @keydown.down.prevent="navigateResults(1)"
          @keydown.up.prevent="navigateResults(-1)"
          @keydown.enter.prevent="() => selectResult()"
        />
        <div class="absolute right-0 top-0 h-full flex align-items-center pr-3">
          <span class="text-xs text-gray-500 bg-white-alpha-10 px-2 py-1 border-round">ESC</span>
        </div>
      </div>

      <div class="border-top-1 border-white-alpha-10"></div>

      <!-- Local Results -->
      <div
        v-if="results.length > 0"
        class="flex flex-column gap-1 max-h-20rem overflow-y-auto custom-scrollbar"
      >
        <div class="text-xs text-gray-500 uppercase tracking-widest px-3 my-2">Local Results</div>
        <div
          v-for="(result, index) in results"
          :key="result.id"
          class="flex align-items-center p-3 border-round cursor-pointer transition-colors"
          :class="{
            'bg-primary-500 text-white': selectedIndex === index,
            'hover:bg-white-alpha-10 text-gray-300': selectedIndex !== index,
          }"
          @click="selectResult(index)"
          @mouseenter="selectedIndex = index"
        >
          <i :class="[result.icon, 'mr-3 text-xl']"></i>
          <div class="flex-grow-1">
            <div class="font-bold">{{ result.title }}</div>
            <div class="text-xs opacity-70">{{ result.subtitle }}</div>
          </div>
          <i class="pi pi-chevron-right opacity-50"></i>
        </div>
      </div>

      <!-- Network Results Section -->
      <div v-if="networkResults.length > 0" class="flex flex-column gap-1">
         <div class="flex justify-content-between align-items-center px-3 my-2">
            <span class="text-xs text-blue-400 font-bold uppercase tracking-widest">Devi Network Results</span>
            <span class="text-xs text-gray-500 bg-white-alpha-10 px-2 border-round">Live</span>
         </div>
         
         <div
          v-for="(result, idx) in networkResults"
          :key="result.demandId + idx"
          class="flex align-items-center p-3 border-round border-1 border-blue-500-alpha-20 bg-blue-500-alpha-10 mb-1"
        >
          <div class="mr-3 bg-blue-500-alpha-30 border-circle w-2rem h-2rem flex align-items-center justify-content-center">
            <i class="pi pi-globe text-blue-200"></i>
          </div>
          <div class="flex-grow-1">
            <div class="font-bold text-white">{{ result.responderName }}</div>
             <div class="flex align-items-center gap-2 text-xs text-gray-300">
               <span><i class="pi pi-map-marker mr-1"></i>{{ result.distance }}</span>
               <span v-if="result.price" class="text-green-400">Rs. {{ result.price }}</span>
             </div>
          </div>
          <Button 
             label="Refer Patient" 
             icon="pi pi-send" 
             class="p-button-outlined p-button-sm p-button-rounded p-button-info"
             @click="requestReferral(result)"
          />
        </div>
      </div>

      <!-- Empty/Loading States -->
      <div v-else-if="query.length > 1 && !isSearching && results.length === 0" class="text-center p-4 text-gray-500">
        <div v-if="isNetworkSearching" class="flex flex-column align-items-center gap-2">
           <i class="pi pi-spin pi-compass text-2xl text-blue-400"></i>
           <span>Checking nearby pharmacies...</span>
        </div>
        <div v-else>
           No local results found.
        </div>
      </div>
      
      <div v-else-if="query.length === 0" class="text-center p-4 text-gray-500 text-sm">
        Type to start searching...
      </div>
    </div>
  </Dialog>
  
  <!-- Referral Success Dialog -->
  <Dialog v-model:visible="referralDialogVisible" modal :style="{ width: '400px' }" class="glass-dialog">
     <template #header>
        <div class="flex align-items-center gap-2 text-primary">
            <i class="pi pi-check-circle text-xl"></i>
            <span class="font-bold">Referral Generated</span>
        </div>
     </template>
     <div class="flex flex-column align-items-center text-center p-2">
        <span class="text-gray-400 text-sm mb-2">Share this code with the patient:</span>
        <div class="text-4xl font-mono font-bold text-white bg-white-alpha-10 p-4 border-round-xl mb-3 tracking-widest border-1 border-primary-500">
           {{ currentReferralCode }}
        </div>
        <p class="text-sm text-gray-300 line-height-3">
           Direct patient to <strong>{{ currentReferralTarget }}</strong>.
           <br>You will receive <strong>50 Credits</strong> when they use this code.
        </p>
     </div>
     <template #footer>
        <Button label="Done" @click="referralDialogVisible = false" class="w-full" />
     </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { unifiedSearch } from '@/services/UnifiedSearchService'
import { networkService } from '@/services/NetworkService'
import { referralService } from '@/services/ReferralService'
import { useMagicKeys, whenever, useDebounceFn } from '@vueuse/core'

import { useGlobalSearch } from '@/composables/useGlobalSearch'

const { isSearchVisible: visible } = useGlobalSearch()
const query = ref('')
const results = ref<any[]>([])
const networkResults = ref<any[]>([])
const selectedIndex = ref(0)
const isSearching = ref(false)
const isNetworkSearching = ref(false)
const searchInput = ref(null)
const router = useRouter()

// Referral UI State
const referralDialogVisible = ref(false)
const currentReferralCode = ref('')
const currentReferralTarget = ref('')

// Keyboard Shortcuts (Command+K)
const { Meta_K, Ctrl_K } = useMagicKeys()

whenever(
  () => Meta_K.value || Ctrl_K.value,
  () => {
    visible.value = true
    nextTick(() => {
      ;(searchInput.value as any)?.focus()
    })
  },
)

// Trigger Network Search after silence
const triggerNetworkSearch = useDebounceFn(async (searchTerm) => {
    if (results.value.length === 0 && searchTerm.length > 2) {
        isNetworkSearching.value = true
        networkResults.value = [] // Clear previous
        
        await networkService.broadcastDemand(searchTerm, (response) => {
            // Add unique responses only
            networkResults.value.push(response)
            isNetworkSearching.value = false
        })
    }
}, 800)

const onInput = async () => {
  isSearching.value = true
  isNetworkSearching.value = false
  networkResults.value = []
  selectedIndex.value = 0
  
  try {
    results.value = await unifiedSearch.search(query.value)
    
    // If no results, trigger network check
    if (results.value.length === 0) {
        triggerNetworkSearch(query.value)
    }
    
  } finally {
    isSearching.value = false
  }
}

const navigateResults = (direction: number) => {
  if (results.value.length === 0) return
  selectedIndex.value =
    (selectedIndex.value + direction + results.value.length) % results.value.length
}

const selectResult = (index?: number) => {
  const idx = typeof index === 'number' ? index : selectedIndex.value
  if ((results.value as any)[idx]) {
    const result = (results.value as any)[idx]
    router.push(result.route)
    visible.value = false
  }
}

const requestReferral = async (result: any) => {
    const referral = await referralService.createReferral(result.pharmacyId, query.value)
    currentReferralCode.value = referral.code
    currentReferralTarget.value = result.responderName
    referralDialogVisible.value = true
}

const onHide = () => {
  query.value = ''
  results.value = []
  networkResults.value = []
  isNetworkSearching.value = false
}
</script>

<style scoped>
.global-search-dialog :deep(.p-dialog-content) {
  padding: 0;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
