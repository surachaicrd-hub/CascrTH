<script setup>
import { computed } from 'vue'
import { useTrackingStore } from '../stores/tracking'

const trackingStore = useTrackingStore()

// Only show if there's history
const hasHistory = computed(() => trackingStore.recentlyViewed.length > 0)
</script>

<template>
  <transition name="fade">
    <router-link 
      to="/recently-viewed"
      class="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-slate-900 to-black hover:from-slate-800 hover:to-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-white shadow-[0_16px_48px_-8px_rgba(0,0,0,0.35)] dark:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.5)] hover:shadow-[0_16px_48px_-8px_rgba(0,0,0,0.55)] hover:scale-110 active:scale-95 transition-all duration-300 group"
      aria-label="ประวัติการดูสินค้า"
    >
      <div class="relative flex items-center justify-center w-full h-full">
        <!-- Beautiful Clock/History Icon -->
        <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <!-- Recently Viewed Count Badge with Pulse -->
        <span v-if="hasHistory" class="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md border-2 border-slate-900 dark:border-black animate-pulse">
          {{ trackingStore.recentlyViewed.length }}
        </span>
      </div>
      
      <!-- Tooltip -->
      <div class="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 whitespace-nowrap shadow-xl border border-gray-800 dark:border-gray-700">
        ประวัติการดูสินค้า
      </div>
    </router-link>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}
</style>

