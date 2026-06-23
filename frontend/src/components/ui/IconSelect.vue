<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FeatureIcon from './FeatureIcon.vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  options: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const dropdownRef = ref(null)

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue) || props.options[0] || { value: 'check', label: 'เครื่องหมายถูก (Check)' }
})

const selectOption = (value) => {
  emit('update:modelValue', value)
  isOpen.value = false
}

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = (e) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', close)
})

onUnmounted(() => {
  document.removeEventListener('click', close)
})
</script>

<template>
  <div class="relative" ref="dropdownRef">
    <!-- Trigger -->
    <button 
      type="button" 
      @click="toggle"
      class="w-full flex items-center justify-between border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white shadow-sm transition-all"
      :class="isOpen ? 'ring-2 ring-emerald-500 border-emerald-500' : ''"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <FeatureIcon :name="selectedOption.value" class="w-5 h-5" />
        </div>
        <span class="font-bold text-gray-700 truncate">{{ selectedOption.label }}</span>
      </div>
      <svg class="w-4 h-4 text-gray-400 transition-transform duration-200" :class="isOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col focus:outline-none"
      >
        <ul class="py-2 overflow-y-auto flex-1 custom-scrollbar">
          <li 
            v-for="opt in options" 
            :key="opt.value"
            @click="selectOption(opt.value)"
            class="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors group"
            :class="modelValue === opt.value ? 'bg-emerald-50/50' : 'hover:bg-gray-50'"
          >
            <div 
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
              :class="modelValue === opt.value ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-gray-700 group-hover:shadow-sm border border-transparent group-hover:border-gray-200'"
            >
              <FeatureIcon :name="opt.value" class="w-5 h-5" />
            </div>
            <span 
              class="text-sm transition-colors"
              :class="modelValue === opt.value ? 'font-bold text-emerald-700' : 'font-medium text-gray-700 group-hover:text-gray-900'"
            >
              {{ opt.label }}
            </span>
            <svg 
              v-if="modelValue === opt.value" 
              class="w-4 h-4 text-emerald-600 ml-auto" 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
