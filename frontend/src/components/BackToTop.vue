<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isVisible = ref(false)

const checkScroll = () => {
  // Show button when scrolled down 300px
  isVisible.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <transition name="fade">
    <button 
      v-show="isVisible" 
      @click="scrollToTop"
      class="fixed bottom-40 right-6 z-40 w-12 h-12 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-800 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:bg-emerald-50 dark:hover:bg-gray-800 transition-all transform hover:-translate-y-1 hover:scale-105"
      aria-label="Back to top"
    >
      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
      </svg>
    </button>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
