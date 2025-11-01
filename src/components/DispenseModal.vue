<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content card">
      <h2>Dispense Options</h2>
      <p class="subtitle">Some items on this prescription are out of stock.</p>

      <div v-if="inStockItems.length > 0">
        <h4>In Stock:</h4>
        <ul class="item-list in-stock">
          <li v-for="(item, i) in inStockItems" :key="i">
            {{ item.name }} (Qty: {{ item.quantity }})
          </li>
        </ul>
      </div>

      <div v-if="outOfStockItems.length > 0">
        <h4>Out of Stock:</h4>
        <ul class="item-list out-of-stock">
          <li v-for="(item, i) in outOfStockItems" :key="i">
            {{ item.name }} (Need: {{ item.quantity }}, Have: {{ item.have }})
          </li>
        </ul>
      </div>

      <div class="modal-actions">
        <button class="button-secondary" @click="$emit('close')">Cancel</button>
        <button
          class="button-secondary"
          v-if="inStockItems.length > 0"
          @click="$emit('dispense-partial')"
        >
          Dispense In-Stock Only
        </button>
        <button class="button" @click="$emit('find-network')">Find & Order From Network</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  inStockItems: { type: Array, required: true },
  outOfStockItems: { type: Array, required: true },
})
defineEmits(['close', 'dispense-partial', 'find-network'])
</script>

<style scoped>
.modal-content {
  width: 100%;
  max-width: 500px;
}
.subtitle {
  color: var(--color-text-light);
  margin-bottom: 2rem;
}
h4 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.item-list {
  list-style: none;
  padding: 0;
  margin-bottom: 1.5rem;
}
.item-list li {
  background-color: var(--color-surface-mute);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}
.in-stock li {
  border-left: 3px solid var(--color-peacock-teal);
}
.out-of-stock li {
  border-left: 3px solid var(--color-danger);
}
.modal-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
.modal-actions button {
  width: auto;
  flex-grow: 1;
}
</style>
