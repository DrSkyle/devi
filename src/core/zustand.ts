import { createStore as createVanillaStore } from 'zustand/vanilla'
import { reactive } from 'vue'

export function defineStore<TState>(createState: any) {
  const store = createVanillaStore<TState>(createState)
  
  const state = reactive(store.getState() as any)
  
  store.subscribe((newState) => {
    Object.assign(state, newState)
  })
  
  const useStore = () => state as TState
  
  useStore.getState = () => state as TState // Returning the reactive state for getState might be safer, but zustand expects raw state. Let's return store.getState()
  useStore.getState = store.getState
  useStore.setState = store.setState
  useStore.subscribe = store.subscribe
  
  return useStore
}
