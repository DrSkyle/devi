<template>
  <div class="prescriptions-list">
    <div v-if="isLoading" class="text-center p-4">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <div v-else-if="prescriptions.length > 0">
      <DataTable
        :value="prescriptions"
        class="p-datatable-sm glass-datatable"
        responsiveLayout="scroll"
        :paginator="true"
        :rows="5"
        :rowHover="true"
      >
        <Column field="created_at" header="Date" sortable>
          <template #body="slotProps">
            <span class="text-gray-300">{{ formatDate(slotProps.data.created_at) }}</span>
          </template>
        </Column>

        <Column field="doctor_name" header="Doctor" sortable>
          <template #body="slotProps">
            <span class="text-white">{{ slotProps.data.doctor_name }}</span>
          </template>
        </Column>

        <Column header="Medicines">
          <template #body="slotProps">
            <div class="flex flex-wrap gap-2">
              <Tag
                v-for="(item, idx) in slotProps.data.items"
                :key="idx"
                :value="`${decryptData(item.name)} (${item.quantity})`"
                severity="info"
                class="text-xs"
              />
            </div>
          </template>
        </Column>

        <Column header="Action">
          <template #body="slotProps">
            <Button
              label="Dispense"
              icon="pi pi-shopping-cart"
              class="p-button-rounded p-button-sm p-button-outlined"
              @click="dispense(slotProps.data)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <div v-else class="text-center p-6 text-gray-500">
      <i class="pi pi-file text-4xl mb-3 block"></i>
      No prescriptions found.
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { decryptData } from '@/utils/cipher'

// PrimeVue Components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'

const props = defineProps({
  customerId: {
    type: Number,
    required: true,
  },
})

const router = useRouter()
const prescriptions = ref([])
const isLoading = ref(true)

const fetchPrescriptions = async () => {
  isLoading.value = true
  const { data } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('customer_id', props.customerId)
    .order('created_at', { ascending: false })

  if (data) {
    prescriptions.value = data
  }
  isLoading.value = false
}

watch(() => props.customerId, fetchPrescriptions, { immediate: true })

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-NP', { dateStyle: 'medium' })
}

const dispense = (rx) => {
  router.push({ name: 'record-sale', query: { fromRx: rx._id } })
}
</script>

<style scoped>
/* Scoped styles are minimal as we use utility classes and global glass-panel */
</style>
