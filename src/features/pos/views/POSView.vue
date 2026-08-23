<template>
  <div class="p-4 md:p-6">
    <h2 class="text-2xl font-bold text-white mb-6">Point of Sale</h2>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Product Search & Cart -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Search Bar -->
        <div class="relative">
          <InputText
            v-model="searchQuery"
            placeholder="Search for medicines, brands, or generic names..."
            class="w-full h-14 bg-surface-800 border-0 rounded-xl text-white pl-14"
          />
          <i
            class="pi pi-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
          ></i>
        </div>

        <!-- Product Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            class="bg-surface-800 rounded-xl p-4 border border-surface-700 hover:border-primary-500 transition-all cursor-pointer"
            @click="addToCart(product)"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h3 class="text-white font-semibold">{{ product.name }}</h3>
                <p class="text-gray-400 text-sm">{{ product.genericName }}</p>
              </div>
              <span class="text-primary-400 font-bold text-lg">
                ${{ (product.priceCents / 100).toFixed(2) }}
              </span>
            </div>
            <div class="flex items-center justify-between mt-3">
              <span
                class="text-sm px-2 py-1 rounded-full"
                :class="
                  product.stock > 10
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-red-900/50 text-red-300'
                "
              >
                Stock: {{ product.stock }}
              </span>
              <Button icon="pi pi-plus" class="p-button-primary p-button-sm" label="Add" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Cart & Payment -->
      <div class="bg-surface-800 rounded-2xl p-6 border border-surface-700 h-fit">
        <h3 class="text-xl font-bold text-white mb-4">Cart</h3>

        <div v-if="cart.length === 0" class="text-center py-8 text-gray-400">
          <i class="pi pi-shopping-cart text-4xl mb-2"></i>
          <p>Your cart is empty</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(item, index) in cart"
            :key="item.id"
            class="flex justify-between items-center bg-surface-900 rounded-lg p-3"
          >
            <div>
              <p class="text-white font-medium">{{ item.name }}</p>
              <p class="text-gray-400 text-sm">
                {{ item.qty }} x ${{ item.price.toFixed(2) }}
              </p>
            </div>
            <div class="flex items-center space-x-2">
              <Button
                icon="pi pi-minus"
                class="p-button-text p-button-sm text-gray-400"
                @click="decrementCart(index)"
              />
              <span class="text-white font-mono w-6 text-center">{{ item.qty }}</span>
              <Button
                icon="pi pi-plus"
                class="p-button-text p-button-sm text-gray-400"
                @click="incrementCart(index)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-text p-button-sm text-red-500"
                @click="removeFromCart(index)"
              />
            </div>
          </div>

          <div class="border-t border-surface-700 pt-4 space-y-2">
            <div class="flex justify-between text-gray-400">
              <span>Subtotal</span><span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-400">
              <span>Tax (15%)</span><span>${{ tax.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-white font-bold text-xl">
              <span>Total</span><span>${{ total.toFixed(2) }}</span>
            </div>

            <Button
              label="Process Payment"
              class="w-full mt-4 p-button-success p-button-lg"
              @click="processSale"
              :loading="isLoading"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePOSStore } from '@/features/pos/store'
import { useInventoryStore } from '@/features/inventory/store'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const posStore = usePOSStore()
const inventoryStore = useInventoryStore()

const searchQuery = ref('')

onMounted(() => {
  inventoryStore.fetchInventory()
})

const mappedProducts = computed(() => {
  return inventoryStore.items.map((item) => ({
    id: item.id,
    name: item.brandName || 'Unknown Medicine',
    genericName: item.genericName || '',
    priceCents: item.sellingPriceCents,
    sellingPrice: item.sellingPriceCents / 100,
    stock: item.totalTablets,
    vatPercent: 0,
    isControlled: false,
  }))
})

const filteredProducts = computed(() => {
  if (!searchQuery.value) return mappedProducts.value
  const query = searchQuery.value.toLowerCase()
  return mappedProducts.value.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.genericName.toLowerCase().includes(query)
  )
})

const cart = computed(() => posStore.getCart())
const isLoading = computed(() => posStore.isProcessing)

const subtotal = computed(() => posStore.getSubtotal())
const tax = computed(() => posStore.getTaxTotal())
const total = computed(() => posStore.getGrandTotal())

const addToCart = (product: any) => {
  posStore.addToCart(product)
}

const incrementCart = (index: number) => {
  posStore.updateQty(index, 1)
}

const decrementCart = (index: number) => {
  posStore.updateQty(index, -1)
}

const removeFromCart = (index: number) => {
  posStore.removeFromCart(index)
}

const processSale = async () => {
  try {
    await posStore.processSale()
  } catch (error) {
    console.error('Sale failed:', error)
  }
}
</script>
