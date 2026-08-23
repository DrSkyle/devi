<template>
  <div
    class="relative overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:translate-y-[-2px] hover:bg-zinc-900/60 hover:border-white/10 group"
  >
    <!-- Accent line -->
    <div 
      class="absolute top-0 left-0 bottom-0 w-1.5"
      :class="colorClasses[color]"
    ></div>

    <div class="flex justify-between items-start pl-2">
      <div class="flex flex-col">
        <span class="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">{{ title }}</span>
        <span class="text-3xl font-extrabold text-white tracking-tight leading-none">{{ value }}</span>
      </div>
      
      <div class="p-3.5 rounded-2xl bg-zinc-800/60 border border-white/5 text-zinc-300 group-hover:text-emerald-400 transition-colors duration-300">
        <i :class="icon" class="text-xl"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: String,
  value: [String, Number],
  icon: String,
  color: {
    type: String,
    default: 'blue',
  },
})

const colorClasses: Record<string, string> = {
  green: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
  blue: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  red: 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]',
  orange: 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
}
</script>
