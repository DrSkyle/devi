<template>
  <Dialog
    visible
    modal
    :closable="false"
    :style="{ width: '500px' }"
    header="Set Your Pharmacy Code"
  >
    <div class="flex flex-column gap-3">
      <p class="m-0 text-600">
        To enable your staff to log in, you must create a unique, memorable code for your pharmacy.
        This can only be done once.
      </p>

      <div class="flex flex-column gap-2">
        <label for="pharmacyCode" class="font-bold">New Pharmacy Code</label>
        <InputText
          id="pharmacyCode"
          v-model="pharmacyCodeInput"
          placeholder="e.g., amritmeds (no spaces)"
        />
        <small class="text-500"
          >This is what your staff will use to log in. It cannot be changed.</small
        >
      </div>

      <div v-if="errorMessage" class="text-red-500" v-html="errorMessage"></div>
    </div>

    <template #footer>
      <Button
        label="Save and Continue"
        icon="pi pi-check"
        @click="savePharmacyCode"
        :loading="isLoading"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref } from 'vue'
import { database } from '@/database'
import { useProfileStore } from '@/features/profile/store'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const emit = defineEmits(['code-set'])
const profileStore = useProfileStore()
const toast = useToast()

const pharmacyCodeInput = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const savePharmacyCode = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const formattedCode = pharmacyCodeInput.value.toLowerCase().trim()

    if (!formattedCode || formattedCode.length < 3) {
      throw new Error('Pharmacy Code must be at least 3 characters long.')
    }

    // Check Uniqueness via Supabase
    const { data: existing, error: checkError } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('pharmacy_code', formattedCode)
      .maybeSingle()

    if (checkError) throw checkError

    if (existing) {
      const suggestion1 = `${formattedCode}${Math.floor(Math.random() * 90 + 10)}`
      const suggestion2 = `${formattedCode}_pharma`
      throw new Error(
        `Code "${formattedCode}" is taken.<br/>Try: <strong>${suggestion1}</strong> or <strong>${suggestion2}</strong>`,
      )
    }

    // Update Supabase
    const { error: updateError } = await supabase
      .from('pharmacies')
      .update({ pharmacy_code: formattedCode })
      .eq('id', profileStore.pharmacyId)

    if (updateError) throw updateError

    // Update Local WatermelonDB
    await database.write(async () => {
      const pharmacies = database.get('pharmacies')
      try {
        const pharmacy = await pharmacies.find(profileStore.pharmacyId)
        await pharmacy.update((rec) => {
          rec.pharmacyCode = formattedCode
        })
      } catch (e) {
        // If pharmacy not found locally, we might need to create it or ignore
        console.warn('Pharmacy not found locally to update code', e)
      }

      // Also update profile if we store it there (we don't seem to in Model, but maybe in local storage or store)
    })

    profileStore.setProfile({ ...profileStore.$state, pharmacyCode: formattedCode })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Pharmacy Code has been set!',
      life: 3000,
    })
    emit('code-set')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* PrimeFlex handles layout */
</style>
