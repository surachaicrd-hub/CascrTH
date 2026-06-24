<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const props = defineProps({
  product: { type: Object, required: true }
})

const accessories = ref([])
const loading = ref(true)
const showAll = ref(false)

const displayedAccessories = computed(() => {
  return showAll.value ? accessories.value : accessories.value.slice(0, 6)
})

const getDiscount = (original_price, price) => {
  if (!original_price || !price || price === 'สอบถามราคา') return 0;
  const orig = Number(original_price);
  const current = Number(String(price).replace(/[^0-9.-]+/g, ''));
  if (orig > current) {
    return Math.round(((orig - current) / orig) * 100);
  }
  return 0;
}



onMounted(async () => {
  try {
    let relatedIds = []
    if (props.product && props.product.related_products) {
      try {
        relatedIds = typeof props.product.related_products === 'string' 
          ? JSON.parse(props.product.related_products) 
          : props.product.related_products
      } catch(e) {}
    }
    if (!Array.isArray(relatedIds)) relatedIds = []

    if (relatedIds.length === 0) {
      loading.value = false
      return
    }

    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) {
      accessories.value = data.data.filter(p => {
        return relatedIds.some(id => String(id) === String(p.id))
      }).map(p => ({
        id: p.id,
        sku: p.sku || '',
        slug: p.slug,
        title: p.name,
        image: p.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
        price: p.price,
        original_price: p.original_price,
      }))
    }
  } catch (error) {
    console.error('Failed to load accessories:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="!loading && accessories.length > 0" class="mt-14 mb-10">
    <div class="bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-[1.5rem] shadow-sm p-5 md:p-6 relative overflow-hidden">
      
      <!-- Subtle Background Accent -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none z-0"></div>

      <!-- Compact Header -->
      <div class="flex items-center justify-between mb-5 relative z-10">
        <div class="flex items-center gap-3 md:gap-4">
          <div>
            <h2 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1">อะไหล่และอุปกรณ์เสริม</h2>
            <p class="text-[11px] md:text-xs text-gray-500 dark:text-gray-400 font-medium">ยกระดับการใช้งานให้สมบูรณ์แบบยิ่งขึ้นด้วยอุปกรณ์เสริมแท้</p>
          </div>
        </div>
        
        <button 
          v-if="accessories.length > 6" 
          @click="showAll = !showAll"
          class="shrink-0 text-[11px] md:text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {{ showAll ? 'แสดงน้อยลง' : 'ดูทั้งหมด' }}
          <span class="bg-white/60 dark:bg-black/20 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[9px]">{{ accessories.length }}</span>
        </button>
      </div>
      
      <!-- Compact Minimal Cards Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 relative z-10">
        <router-link 
          v-for="item in displayedAccessories" 
          :key="item.id" 
          :to="`/products/${item.slug || item.id}`"
          class="group flex flex-col bg-white dark:bg-[#151c27] border border-gray-100 dark:border-gray-800/80 rounded-2xl overflow-hidden hover:shadow-[0_8px_25px_rgba(79,70,229,0.1)] dark:hover:shadow-[0_8px_25px_rgba(79,70,229,0.2)] hover:-translate-y-1 transition-all duration-300"
        >
          <!-- Image Box (Compact) -->
          <div class="relative w-full aspect-square bg-gray-50/60 dark:bg-gray-800/20 flex items-center justify-center overflow-hidden">
             <img 
                :src="getOptimizedImageUrl(item.image, 200)" 
                :alt="item.title" 
                class="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transform group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                @error="onImageError"
             />
             <!-- Discount Tag -->
             <div v-if="getDiscount(item.original_price, item.price) > 0" class="absolute top-2 left-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-10">
               -{{ getDiscount(item.original_price, item.price) }}%
             </div>
          </div>
          
          <!-- Details Box (Compact) -->
          <div class="p-3 flex flex-col flex-1 border-t border-gray-50 dark:border-gray-800/40">
             <span v-if="item.sku" class="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">{{ item.sku }}</span>
             <h3 class="text-xs leading-snug font-bold text-gray-800 dark:text-gray-200 line-clamp-2 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ item.title }}</h3>
             
             <div class="mt-auto flex items-end justify-between gap-1">
                <div class="flex-1">
                   <div v-if="getDiscount(item.original_price, item.price) > 0" class="text-[9px] text-gray-500 dark:text-gray-400 line-through mb-0.5">
                     ฿{{ Number(item.original_price).toLocaleString() }}
                   </div>
                   <div class="text-[13px] md:text-sm font-black tracking-tight" :class="item.price === 'สอบถามราคา' ? 'text-gray-600 dark:text-gray-400' : 'text-indigo-600 dark:text-indigo-400'">
                     {{ item.price !== 'สอบถามราคา' && item.price !== null ? (isNaN(item.price) && String(item.price).includes('฿') ? item.price : '฿' + Number(String(item.price).replace(/[^0-9.-]+/g, '')).toLocaleString()) : 'สอบถามราคา' }}
                   </div>
                </div>
                <!-- Mini Action Icon -->
                <div class="w-6 h-6 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white text-gray-400 flex items-center justify-center transition-colors shrink-0">
                   <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </div>
             </div>
          </div>
        </router-link>
      </div>

    </div>
  </div>
</template>
