import { ref } from 'vue'

const isSearchVisible = ref(false)

export function useGlobalSearch() {
  const openSearch = () => {
    isSearchVisible.value = true
  }

  const closeSearch = () => {
    isSearchVisible.value = false
  }

  const toggleSearch = () => {
    isSearchVisible.value = !isSearchVisible.value
  }

  return {
    isSearchVisible,
    openSearch,
    closeSearch,
    toggleSearch,
  }
}
