<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  position: { type: String, default: 'bottom' } // top, bottom, left, right
})

const isOpen = ref(false)
const tooltipRef = ref(null)
const btnRef = ref(null)

const toggle = (e) => {
  e.stopPropagation()
  isOpen.value = !isOpen.value
}

const closeOnClickOutside = (e) => {
  if (tooltipRef.value && !tooltipRef.value.contains(e.target) && !btnRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', closeOnClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOnClickOutside))
</script>

<template>
  <span class="info-tooltip-wrap relative inline-flex items-center">
    <button
      ref="btnRef"
      @click="toggle"
      type="button"
      :class="[
        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-200 border focus:outline-none shrink-0',
        isOpen
          ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300'
      ]"
      title="คลิกดูคำอธิบาย"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>

    <Transition name="tooltip-pop">
      <div
        v-if="isOpen"
        ref="tooltipRef"
        @click.stop
        :class="[
          'absolute z-[100] w-72 sm:w-80 bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100 overflow-hidden',
          position === 'top' ? 'bottom-8 left-1/2 -translate-x-1/2' : '',
          position === 'bottom' ? 'top-8 left-1/2 -translate-x-1/2' : '',
          position === 'left' ? 'right-8 top-1/2 -translate-y-1/2' : '',
          position === 'right' ? 'left-8 top-1/2 -translate-y-1/2' : '',
        ]"
      >
        <!-- Header -->
        <div class="px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 class="text-sm font-bold text-gray-900">{{ title || 'คำอธิบาย' }}</h4>
          </div>
          <button @click.stop="isOpen = false" type="button" class="w-6 h-6 rounded-lg hover:bg-gray-200/50 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-4 py-3">
          <div class="text-[13px] text-gray-600 leading-relaxed info-content" v-html="description"></div>
        </div>
      </div>
    </Transition>
  </span>
</template>

<style scoped>
.tooltip-pop-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-pop-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.tooltip-pop-enter-from {
  opacity: 0;
  transform: translateY(4px) scale(0.95);
}
.tooltip-pop-leave-to {
  opacity: 0;
  transform: translateY(2px) scale(0.97);
}

.info-content :deep(ul) {
  padding-left: 1rem;
  margin: 0.5rem 0;
  list-style: disc;
}
.info-content :deep(li) {
  margin-bottom: 0.25rem;
}
.info-content :deep(strong) {
  color: #1f2937;
  font-weight: 700;
}
.info-content :deep(code) {
  background: #f3f4f6;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 11px;
  color: #059669;
  font-weight: 600;
}
</style>
