<template>
  <nav class="bottom-nav">
    <RouterLink to="/">
      <span class="nav-icon">🏠</span>
      <span class="nav-text">Dashboard</span>
    </RouterLink>
    <RouterLink to="/inventory">
      <span class="nav-icon">📦</span>
      <span class="nav-text">Inventory</span>
    </RouterLink>
    <RouterLink to="/record-sale" class="primary-action">
      <span class="nav-icon">🛒</span>
      <span class="nav-text">Record Sale</span>
    </RouterLink>
    <RouterLink to="/more">
      <span class="nav-icon">⚙️</span>
      <span class="nav-text">More</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 65px;
  background-color: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}
.bottom-nav a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--color-text-light);
  flex-grow: 1;
  height: 100%;
  padding: 0.25rem 0;
}
.nav-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}
.nav-text {
  font-size: 0.7rem;
  font-weight: 500;
}
.bottom-nav a.router-link-exact-active {
  color: var(--color-primary);
}
.bottom-nav a.primary-action {
  color: var(--color-primary);
}
.bottom-nav a.primary-action .nav-icon {
    font-size: 1.8rem;
}
</style>