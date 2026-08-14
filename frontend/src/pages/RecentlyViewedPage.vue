<script setup>
import { useTrackingStore } from '../stores/tracking'
import ProductCard from '../components/ProductCard.vue'

const trackingStore = useTrackingStore()
</script>

<template>
  <div class="px-4 py-8 w-full max-w-7xl mx-auto mt-16 md:mt-24 min-h-[60vh]">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">ประวัติการดูสินค้า</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">สินค้าที่คุณเพิ่งดูทั้งหมด {{ trackingStore.recentlyViewed.length }} รายการ</p>
        </div>
      </div>
      
      <router-link to="/products" class="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        กลับไปช้อปต่อ
      </router-link>
    </div>

    <!-- Empty State -->
    <div v-if="trackingStore.recentlyViewed.length === 0" class="text-center py-20 bg-white dark:bg-[#111827] rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <div class="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">ยังไม่มีประวัติการดูสินค้า</h3>
      <p class="text-gray-500 dark:text-gray-400 mb-8">คุณยังไม่ได้ดูสินค้าใดๆ ลองเลือกชมสินค้าที่น่าสนใจของเราสิ</p>
      <router-link to="/products" class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/30">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        ดูสินค้าทั้งหมด
      </router-link>
    </div>

    <!-- Products Grid (3 columns on desktop) -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      <ProductCard 
        v-for="product in trackingStore.recentlyViewed" 
        :key="product.id" 
        :product="product" 
      />
    </div>
  </div>
</template>
