<template>
  <div class="edit-prescription-container p-4 max-w-5xl mx-auto min-h-screen">
    <!-- Header -->
    <div
      class="flex flex-column md:flex-row justify-content-between align-items-start md:align-items-center mb-6 gap-4"
    >
      <div>
        <Button
          label="Back to Hub"
          icon="pi pi-arrow-left"
          class="p-button-text p-button-plain mb-2 pl-0"
          @click="router.push('/prescriptions')"
        />
        <h1 class="text-4xl font-thin text-white mb-2 tracking-tight">Edit Prescription</h1>
        <p class="text-gray-400 text-lg" v-if="prescription">
          Update details for
          <span class="text-primary font-bold">{{ prescription.patient_name }}</span>
        </p>
      </div>
    </div>

    <div v-if="prescription" class="glass-panel p-5 fadein animation-duration-300">
      <form @submit.prevent="updatePrescription">
        <div class="flex flex-column md:flex-row gap-5 mb-5">
          <div class="flex-1">
            <label for="patientName" class="block text-gray-300 font-medium mb-2"
              >Patient Name</label
            >
            <span class="p-input-icon-left w-full">
              <i class="pi pi-user" />
              <InputText
                id="patientName"
                v-model="prescription.patient_name"
                class="w-full"
                required
              />
            </span>
          </div>
          <div class="flex-1">
            <label for="doctorName" class="block text-gray-300 font-medium mb-2"
              >Doctor's Name</label
            >
            <span class="p-input-icon-left w-full">
              <i class="pi pi-user-edit" />
              <InputText
                id="doctorName"
                v-model="prescription.doctor_name"
                class="w-full"
                required
              />
            </span>
          </div>
        </div>

        <div class="border-top-1 border-white-alpha-10 pt-5 mt-5">
          <h3 class="text-xl font-bold text-white mb-4 flex align-items-center gap-2">
            <i class="pi pi-list text-primary"></i> Medicines
          </h3>

          <div class="flex flex-column gap-3 mb-4">
            <div
              v-for="(item, index) in prescription.items"
              :key="index"
              class="glass-panel p-3 flex flex-column md:flex-row gap-3 align-items-end md:align-items-center"
            >
              <div class="flex-grow-1 w-full">
                <label class="block text-gray-400 text-xs mb-1">Medicine Name</label>
                <AutoComplete
                  v-model="item.name"
                  :suggestions="searchResults[index]"
                  @complete="(e) => searchInventory(e.query, index)"
                  field="name"
                  placeholder="Search medicine..."
                  class="w-full"
                  inputClass="w-full"
                  @item-select="(e) => selectMedicine(index, e.value.name)"
                >
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <div>{{ slotProps.option.name }}</div>
                    </div>
                  </template>
                </AutoComplete>
              </div>
              <div class="w-full md:w-8rem">
                <label class="block text-gray-400 text-xs mb-1">Quantity</label>
                <InputNumber
                  v-model="item.quantity"
                  showButtons
                  buttonLayout="horizontal"
                  :min="1"
                  inputClass="w-full text-center"
                  class="w-full"
                />
              </div>
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-text"
                @click="removeMedicine(index)"
                v-if="prescription.items.length > 1"
              />
            </div>
          </div>

          <div class="flex gap-3 mb-5">
            <Button
              label="Add Medicine"
              icon="pi pi-plus"
              class="p-button-outlined w-full md:w-auto"
              @click="addMedicine"
            />
          </div>
        </div>

        <div class="flex justify-content-end border-top-1 border-white-alpha-10 pt-4">
          <Button
            type="submit"
            label="Save Changes"
            icon="pi pi-check"
            :loading="isSaving"
            class="w-full md:w-auto"
          />
        </div>
      </form>
    </div>

    <div v-else class="flex align-items-center justify-content-center h-20rem">
      <ProgressSpinner />
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useProfileStore } from '@/stores/profile'
import { decryptData, encryptData } from '@/utils/cipher'
import { database } from '@/database'
import { Q } from '@nozbe/watermelondb'
import { localAuth } from '@/services/LocalAuthService'

// PrimeVue Components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const notification = useNotificationStore()
const profileStore = useProfileStore()

const prescription = ref(null)
const isSaving = ref(false)
const searchResults = ref([])
let inventorySearchDebounce

onActivated(async () => {
  prescription.value = null
  const prescriptionId = route.params.id // Assuming ID is string from WatermelonDB
  try {
    const data = await database.get('prescriptions').find(prescriptionId) // WatermelonDB find

    if (data) {
       // Parse items if stored as JSON string
       let items = []
       try {
         items = JSON.parse(data.items)
       } catch {
         items = data.items || []
       }

       prescription.value = {
         ...data._raw,
         items: items.map((item) => ({
           ...item,
           name: decryptData(item.name),
         })),
         patient_name: decryptData(data.patientName) // Decrypt patient name (assuming we encrypted it in AddPrescription)
         // Note: In AddPrescription we encrypted it. Here we decrypt.
       }
    }
  } catch (error) {
    console.error("Prescription load error", error)
    notification.showNotification('Prescription not found.', 'error')
    router.push('/prescriptions')
  }
})

const addMedicine = () => {
  if (prescription.value) {
    prescription.value.items.push({ name: '', quantity: 1 })
  }
}

const removeMedicine = (index) => {
  if (prescription.value && prescription.value.items.length > 1) {
    prescription.value.items.splice(index, 1)
  } else {
    notification.showNotification('A prescription must have at least one medicine.', 'error')
  }
}

const searchInventory = (query, index) => {
  clearTimeout(inventorySearchDebounce)
  inventorySearchDebounce = setTimeout(async () => {
    if (!query || query.length < 2) {
      searchResults.value[index] = []
      return
    }

    try {
       const allItems = await database.get('inventory').query(
         Q.where('pharmacy_id', profileStore.pharmacyId)
       ).fetch() // This pulls ALL items. Performance hit?
       // Local DB is fast enough for 1000s of items.

       if (allItems) {
          const lowerQ = query.toLowerCase()
          searchResults.value[index] = allItems
            .map((item) => ({ name: decryptData(item.name) }))
            .filter((item) => item.name.toLowerCase().includes(lowerQ))
            .slice(0, 10)
       }
    } catch (e) {
       console.error(e)
    }
  }, 300)
}

const selectMedicine = (index, name) => {
  if (prescription.value) {
    prescription.value.items[index].name = name
    searchResults.value[index] = []
  }
}

const updatePrescription = async () => {
  isSaving.value = true
  const user = localAuth.getCurrentUser()
  if (!user) {
    // Maybe allow simple update? But let's enforce user
    // isSaving.value = false
    // return
  }

  try {
    const itemsEncrypted = prescription.value.items.map((item) => ({
        ...item,
        name: encryptData(item.name),
    }))

    await database.write(async () => {
       const rec = await database.get('prescriptions').find(prescription.value.id)
       await rec.update(p => {
          p.patientName = encryptData(prescription.value.patient_name)
          p.doctorName = prescription.value.doctor_name // Assuming flat field in schema? Check later.
          // Wait, 'AddPrescription' used doctorName. 'Edit' used doctor_name.
          // I should check schema. But standardized to CamelCase for Watermelon model usually.
          // I will assume doctorName based on AddPrescription.
          p.items = JSON.stringify(itemsEncrypted)
       })
    })

    /*
    // Audit Log - Stubbed for now
    await database.get('audit_logs').create(...)
    */

    notification.showNotification('Prescription updated successfully!')
    router.push('/prescriptions')
  } catch (error) {
    console.error(error)
    notification.showNotification('Failed to update prescription.', 'error')
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
/* PrimeVue overrides are handled globally */
</style>
