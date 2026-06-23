<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true }, // [{ value, label, icon? }]
  icon: { type: String, default: '' }, // SVG path for the trigger icon
  color: { type: String, default: 'gray' }, // emerald, blue, violet, orange, gray
  placeholder: { type: String, default: '' },
  minWidth: { type: String, default: '160px' }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const dropRef = ref(null)
const listRef = ref(null)

const selected = computed(() => props.options.find(o => o.value === props.modelValue))
const isActive = computed(() => props.modelValue !== props.options[0]?.value)

const colorMap = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-800', hover: 'hover:bg-emerald-50', dot: 'bg-emerald-500', ring: 'ring-emerald-500/20' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', hover: 'hover:bg-blue-50', dot: 'bg-blue-500', ring: 'ring-blue-500/20' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-800', hover: 'hover:bg-violet-50', dot: 'bg-violet-500', ring: 'ring-violet-500/20' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', hover: 'hover:bg-orange-50', dot: 'bg-orange-500', ring: 'ring-orange-500/20' },
  gray: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', hover: 'hover:bg-gray-50', dot: 'bg-gray-500', ring: 'ring-gray-500/20' },
}

const colors = computed(() => colorMap[props.color] || colorMap.gray)

function toggle() { open.value = !open.value }

function selectOption(opt) {
  emit('update:modelValue', opt.value)
  open.value = false
}

function onClickOutside(e) {
  if (dropRef.value && !dropRef.value.contains(e.target)) {
    open.value = false
  }
}

// Keyboard navigation
const focusedIndex = ref(-1)
function onKeydown(e) {
  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open.value = true
      focusedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
    }
    return
  }
  if (e.key === 'Escape') { open.value = false; return }
  if (e.key === 'ArrowDown') { e.preventDefault(); focusedIndex.value = Math.min(focusedIndex.value + 1, props.options.length - 1) }
  if (e.key === 'ArrowUp') { e.preventDefault(); focusedIndex.value = Math.max(focusedIndex.value - 1, 0) }
  if (e.key === 'Enter' && focusedIndex.value >= 0) { e.preventDefault(); selectOption(props.options[focusedIndex.value]) }
}

watch(open, (v) => { if (!v) focusedIndex.value = -1 })

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="dropRef" class="fancy-select relative" :style="{ minWidth }" tabindex="0" @keydown="onKeydown">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggle"
      :class="[
        'w-full flex items-center gap-2 pl-3 pr-8 py-2.5 text-sm rounded-xl border transition-all outline-none cursor-pointer font-medium relative',
        open ? `${colors.bg} ${colors.border} ${colors.text} ring-2 ${colors.ring}` :
        isActive ? `${colors.bg} ${colors.border} ${colors.text}` :
        'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
      ]"
    >
      <!-- Icon -->
      <svg v-if="icon" class="w-4 h-4 shrink-0" :class="isActive || open ? colors.text : 'text-gray-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
      </svg>
      <!-- Label -->
      <span class="truncate text-left">{{ selected?.label || placeholder }}</span>
      <!-- Chevron -->
      <svg class="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200 text-gray-400" :class="{ 'rotate-180': open }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Panel -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-1 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1 scale-95"
    >
      <div v-if="open" ref="listRef" class="absolute z-50 mt-1.5 left-0 w-full min-w-max bg-white rounded-xl shadow-lg shadow-gray-200/60 border border-gray-200 py-1.5 max-h-[280px] overflow-auto fancy-scrollbar">
        <button
          v-for="(opt, i) in options"
          :key="opt.value"
          type="button"
          @click="selectOption(opt)"
          @mouseenter="focusedIndex = i"
          :class="[
            'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-all text-left relative group',
            opt.value === modelValue ? `font-semibold ${colors.text} ${colors.bg}` : 'text-gray-700',
            focusedIndex === i && opt.value !== modelValue ? 'bg-gray-50' : '',
          ]"
        >
          <!-- Color dot or check -->
          <span v-if="opt.value === modelValue" class="flex items-center justify-center w-5 h-5 shrink-0">
            <svg class="w-4 h-4" :class="colors.text" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <span v-else class="flex items-center justify-center w-5 h-5 shrink-0">
            <span class="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"></span>
          </span>
          <!-- Label -->
          <span class="truncate">{{ opt.label }}</span>
          <!-- Optional icon -->
          <svg v-if="opt.icon" class="w-3.5 h-3.5 ml-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="opt.icon" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fancy-select:focus { outline: none; }
.fancy-scrollbar::-webkit-scrollbar { width: 4px; }
.fancy-scrollbar::-webkit-scrollbar-track { background: transparent; }
.fancy-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
.fancy-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
