<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [Number, String],
    default: 36
  },
  className: {
    type: String,
    default: ''
  }
})

const iconKey = computed(() => {
  const n = (props.name || '').toLowerCase().trim()
  if (n === 'cut' || n === 'ตัด') return 'cut'
  if (n === 'strip_end' || n === 'strip' || n === 'ปอกปลาย' || n === 'ปอก') return 'strip_end'
  if (n === 'strip_mid' || n === 'strip_middle' || n === 'ปอกกลางสาย' || n === 'ปอกกลาง') return 'strip_mid'
  if (n === 'twist' || n === 'ปั่นเกลียว' || n === 'ตีเกลียว') return 'twist'
  if (n === 'ribbon' || n === 'แยกสายแพ' || n === 'สายแพ') return 'ribbon'
  if (n === 'crimp' || n === 'ย้ำหัว' || n === 'ย้ำหางปลา') return 'crimp'
  return n
})
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-[0_2px_6px_rgba(0,0,0,0.06)] shrink-0 transition-transform duration-300 group-hover:scale-105"
    :style="`width: ${size}px; height: ${size}px;`"
    :class="className"
  >
    <!-- 1. ตัด (Cut / Rotary Blade) -->
    <svg v-if="iconKey === 'cut'" class="w-[62%] h-[62%]" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke="#002855" stroke-width="1.8" class="dark:stroke-blue-400" />
      <circle cx="16" cy="16" r="3.5" fill="#002855" class="dark:fill-blue-400" />
      <path d="M16 3 L16 9" stroke="#002855" stroke-width="1.8" stroke-linecap="round" class="dark:stroke-blue-400" />
      <path d="M25 10 L20 14" stroke="#002855" stroke-width="1.8" stroke-linecap="round" class="dark:stroke-blue-400" />
      <path d="M27 20 L21 18" stroke="#002855" stroke-width="1.8" stroke-linecap="round" class="dark:stroke-blue-400" />
      <path d="M10 24 L14 19" stroke="#002855" stroke-width="1.8" stroke-linecap="round" class="dark:stroke-blue-400" />
      <circle cx="23" cy="22" r="1.5" fill="#f97316" />
    </svg>

    <!-- 2. ปอกปลาย (Strip End) -->
    <svg v-else-if="iconKey === 'strip_end'" class="w-[62%] h-[62%]" viewBox="0 0 32 32" fill="none">
      <!-- Outer jacket -->
      <rect x="3" y="10" width="13" height="12" rx="3" fill="#002855" class="dark:fill-blue-400" />
      <!-- Inner core layer -->
      <rect x="16" y="12" width="5" height="8" rx="1.5" fill="#94a3b8" />
      <!-- Copper exposed conductor -->
      <rect x="21" y="13.5" width="8" height="5" rx="1" fill="#f97316" />
      <!-- Cut groove lines -->
      <line x1="16" y1="8" x2="16" y2="24" stroke="#f97316" stroke-width="1.2" stroke-dasharray="2 2" />
    </svg>

    <!-- 3. ปอกกลางสาย (Middle Window Strip) -->
    <svg v-else-if="iconKey === 'strip_mid'" class="w-[62%] h-[62%]" viewBox="0 0 32 32" fill="none">
      <!-- Left jacket -->
      <rect x="3" y="11" width="8" height="10" rx="2" fill="#002855" class="dark:fill-blue-400" />
      <!-- Middle exposed copper -->
      <rect x="11" y="13" width="10" height="6" fill="#f97316" />
      <!-- Right jacket -->
      <rect x="21" y="11" width="8" height="10" rx="2" fill="#002855" class="dark:fill-blue-400" />
      <!-- Window highlight indicator -->
      <line x1="11" y1="9" x2="21" y2="9" stroke="#f97316" stroke-width="1.2" stroke-linecap="round" />
      <line x1="11" y1="23" x2="21" y2="23" stroke="#f97316" stroke-width="1.2" stroke-linecap="round" />
    </svg>

    <!-- 4. ปั่นเกลียว (Twist) -->
    <svg v-else-if="iconKey === 'twist'" class="w-[62%] h-[62%]" viewBox="0 0 32 32" fill="none">
      <!-- Left pair base -->
      <rect x="3" y="8" width="8" height="5" rx="1.5" fill="#002855" class="dark:fill-blue-400" />
      <rect x="3" y="19" width="8" height="5" rx="1.5" fill="#3b82f6" />
      <!-- Twisted copper strands -->
      <path d="M11 10.5 C15 10.5, 16 16, 20 16 C24 16, 25 12, 29 12" stroke="#ea580c" stroke-width="2.2" stroke-linecap="round" fill="none" />
      <path d="M11 21.5 C15 21.5, 16 16, 20 16 C24 16, 25 20, 29 20" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" fill="none" />
    </svg>

    <!-- 5. แยกสายแพ (Ribbon / Flat Cable Split) -->
    <svg v-else-if="iconKey === 'ribbon'" class="w-[62%] h-[62%]" viewBox="0 0 32 32" fill="none">
      <!-- Flat ribbon base -->
      <rect x="3" y="10" width="10" height="12" rx="2" fill="#64748b" />
      <line x1="3" y1="14" x2="13" y2="14" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />
      <line x1="3" y1="18" x2="13" y2="18" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />
      <!-- Separated multi-color fingers -->
      <path d="M13 11 L28 7" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />
      <path d="M13 14 L29 13" stroke="#eab308" stroke-width="2" stroke-linecap="round" />
      <path d="M13 18 L29 19" stroke="#10b981" stroke-width="2" stroke-linecap="round" />
      <path d="M13 21 L28 25" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" />
      <!-- Stripped copper tips -->
      <circle cx="28" cy="7" r="1" fill="#ea580c" />
      <circle cx="29" cy="13" r="1" fill="#ea580c" />
      <circle cx="29" cy="19" r="1" fill="#ea580c" />
      <circle cx="28" cy="25" r="1" fill="#ea580c" />
    </svg>

    <!-- Fallback / Generic Gear/Check Icon -->
    <svg v-else class="w-[55%] h-[55%] text-[#002855] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
  </div>
</template>
