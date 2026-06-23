<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCompareStore } from '../stores/compareStore'

const compareStore = useCompareStore()
const route = useRoute()

const isVisible = computed(() => {
  return compareStore.itemCount > 0 && route.path !== '/compare'
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="isVisible" class="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-4 pointer-events-none">
      <div class="max-w-3xl mx-auto pointer-events-auto">
        <div class="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">

          <!-- Thumbnails -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="flex -space-x-2">
              <div v-for="item in compareStore.items" :key="item.id" class="w-10 h-10 rounded-xl border-2 border-white dark:border-gray-800 overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm flex-shrink-0">
                <img :src="item.image_url" :alt="item.name" class="w-full h-full object-contain">
              </div>
            </div>
            <div class="ml-2 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">
                {{ compareStore.itemCount }} สินค้า
              </p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">เลือกได้สูงสุด 4 ชิ้น</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="compareStore.clearAll()" class="px-3 py-2 text-xs font-bold text-gray-500 hover:text-red-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              ล้าง
            </button>
            <router-link to="/compare" class="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition-all hover:-translate-y-0.5 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
              เปรียบเทียบ
            </router-link>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
