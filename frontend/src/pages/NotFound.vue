<script setup>
import { ref, onMounted } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()
const featuredProducts = ref([])
const categories = ref([])

const fetchFeaturedProducts = async () => {
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) {
      featuredProducts.value = data.data.filter(p => !p.is_out_of_stock).slice(0, 4).map(p => ({
        id: p.id,
        slug: p.slug,
        title: p.name,
        image: p.image_url || '/images/placeholder.png',
        price: p.price,
        original_price: p.original_price,
        category: p.category
      }))
    }
  } catch (e) {
    console.error('Failed to fetch products for 404 page', e)
  }
}

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.success) {
      categories.value = data.data.slice(0, 5)
    }
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

const quickLinks = [
  { name: 'แคตตาล็อกสินค้า', to: '/products', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { name: 'ขอใบเสนอราคา', to: '/quotation', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'ผลงานติดตั้ง', to: '/projects', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'ติดต่อเรา', to: '/contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

const services = [
  { icon: 'M5 13l4 4L19 7', title: 'จัดส่งฟรีทั่วประเทศ', desc: 'สำหรับสินค้าทุกชิ้น' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'รับประกัน 10 ปี', desc: 'มั่นใจทุกโครงสร้าง' },
  { icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', title: 'ติดตั้งโดยช่างมืออาชีพ', desc: 'บริการครบวงจร' },
]

onMounted(() => {
  fetchFeaturedProducts()
  fetchCategories()
})
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0f16] pt-24 md:pt-32 pb-10 md:pb-24 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Hero Error Section -->
      <div class="text-center max-w-3xl mx-auto mb-16 md:mb-20">
        <!-- Animated 404 Badge -->
        <div class="relative w-36 h-36 mx-auto mb-8">
          <div class="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/10 blur-3xl rounded-full animate-pulse-slow"></div>
          <div class="relative z-10 w-full h-full bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-gray-200/50 dark:shadow-none animate-float">
            <span class="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600">404</span>
          </div>
          <!-- Decorative dots -->
          <div class="absolute -top-3 -right-3 w-6 h-6 bg-emerald-400 rounded-full opacity-60 animate-ping-slow"></div>
          <div class="absolute -bottom-2 -left-2 w-4 h-4 bg-teal-400 rounded-full opacity-40 animate-bounce" style="animation-delay: 0.5s;"></div>
        </div>

        <h1 class="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
          ไม่พบหน้าที่คุณค้นหา
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-light text-lg md:text-xl mb-8 max-w-xl mx-auto">
          หน้านี้อาจถูกย้ายหรือลบไปแล้ว แต่ไม่ต้องกังวล — ลองดูสินค้าและบริการด้านล่างนี้แทนได้เลย!
        </p>

        <!-- Quick Action Buttons -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <router-link to="/" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transform hover:-translate-y-0.5">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            กลับหน้าหลัก
          </router-link>
          <router-link to="/products" class="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white dark:bg-[#111827] text-gray-900 dark:text-white font-bold rounded-full border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 transition-all hover:shadow-lg transform hover:-translate-y-0.5">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            ดูสินค้าทั้งหมด
          </router-link>
        </div>
      </div>

      <!-- Services Bar -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 md:mb-20">
        <div v-for="(service, i) in services" :key="i" class="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="service.icon"></path></svg>
          </div>
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white text-sm">{{ service.title }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-xs">{{ service.desc }}</p>
          </div>
        </div>
      </div>

      <!-- Featured Products Section -->
      <div v-if="featuredProducts.length > 0" class="mb-16 md:mb-20">
        <div class="flex items-center justify-between mb-8">
          <div>
            <p class="text-xs font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase mb-2">สินค้าแนะนำ</p>
            <h2 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">สินค้ายอดนิยมของเรา</h2>
          </div>
          <router-link to="/products" class="hidden sm:inline-flex text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 items-center gap-1.5 transition-colors">
            ดูทั้งหมด
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </router-link>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id"
            :product="product"
          />
        </div>
      </div>

      <!-- Quick Links Grid -->
      <div class="mb-16 md:mb-20">
        <p class="text-xs font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase mb-6 text-center">ลิงก์ที่คุณอาจกำลังมองหา</p>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <router-link 
            v-for="link in quickLinks" 
            :key="link.to" 
            :to="link.to"
            class="group bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-50 dark:bg-gray-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 flex items-center justify-center transition-colors">
              <svg class="w-6 h-6 text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="link.icon"></path></svg>
            </div>
            <span class="text-sm font-bold text-gray-900 dark:text-white">{{ link.name }}</span>
          </router-link>
        </div>
      </div>

      <!-- Browse Categories -->
      <div v-if="categories.length > 0">
        <p class="text-xs font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase mb-6 text-center">เลือกดูตามหมวดหมู่</p>
        <div class="flex flex-wrap items-center justify-center gap-2.5">
          <router-link 
            v-for="cat in categories" 
            :key="cat.id"
            :to="'/products/category/' + encodeURIComponent(cat.name)"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-[#111827] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400 hover:shadow-md transition-all"
          >
            <img v-if="cat.icon_url" :src="cat.icon_url" :alt="cat.name" class="w-5 h-5 object-contain filter invert dark:invert-0 opacity-70 group-hover:opacity-100 transition-opacity">
            {{ cat.name }}
          </router-link>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

.animate-pulse-slow {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-ping-slow {
  animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
