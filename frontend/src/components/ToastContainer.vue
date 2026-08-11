<script setup>
import { useToast } from '../composables/useToast'
import { TransitionGroup } from 'vue'

const { toasts, removeToast } = useToast()

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'error':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    case 'info':
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

const getBgColor = (type) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 text-green-950 border-green-500 border-2'
    case 'error':
      return 'bg-red-50 text-red-950 border-red-500 border-2'
    case 'warning':
      return 'bg-amber-50 text-amber-950 border-amber-500 border-2'
    case 'info':
    default:
      return 'bg-blue-50 text-blue-950 border-blue-500 border-2'
  }
}

const getIconColor = (type) => {
  switch (type) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-red-600'
    case 'warning':
      return 'text-amber-600'
    case 'info':
    default:
      return 'text-blue-600'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
    <TransitionGroup 
      enter-active-class="transform ease-out duration-300 transition" 
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4" 
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0" 
      leave-active-class="transition ease-in duration-200" 
      leave-from-class="opacity-100" 
      leave-to-class="opacity-0"
    >
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        :class="['pointer-events-auto w-full rounded-2xl shadow-xl border p-4 flex items-start gap-3 backdrop-blur-xl transition-all duration-200', getBgColor(toast.type)]"
      >
        <svg :class="['w-6 h-6 shrink-0', getIconColor(toast.type)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIcon(toast.type)" />
        </svg>
        <div class="flex-1 mt-0.5">
          <p class="text-sm font-bold leading-snug">{{ toast.message }}</p>
        </div>
        <button @click="removeToast(toast.id)" class="shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors focus:outline-none">
          <svg class="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
