<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCompareStore } from '../stores/compareStore'
import { useAuthStore } from '../stores/authStore'
import { useTrackingStore } from '../stores/tracking'
import { useToast } from '../composables/useToast'
import FeatureIcon from '../components/ui/FeatureIcon.vue'

const props = defineProps({
  product: {
    type: Object,
    required: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const authStore = useAuthStore()
const trackingStore = useTrackingStore()
const { showToast } = useToast()

const addToCart = async (product) => {
  try {
    await cartStore.addToCart(product, 1);
    showToast(`เพิ่ม ${product.title || product.name} ลงในตะกร้าแล้ว`, 'success');
    trackingStore.trackEvent({
      type: 'add_to_cart',
      productId: product.id,
      productName: product.title || product.name,
      price: product.price,
      quantity: 1,
      source: 'product_card'
    });
  } catch (err) {
    showToast('ไม่สามารถเพิ่มลงตะกร้าได้', 'error');
  }
}

const toggleWishlistItem = async (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  if (!authStore.isAuthenticated) {
    showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด', 'warning');
    return;
  }
  const result = await wishlistStore.toggleWishlist(product);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว', result.isAdded ? 'success' : 'info');
    trackingStore.trackEvent({
      type: result.isAdded ? 'add_to_wishlist' : 'remove_from_wishlist',
      productId: product.id,
      productName: product.title || product.name,
      source: 'product_card'
    });
  }
}

const toggleCompareItem = (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  const result = compareStore.toggleCompare(product);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการเปรียบเทียบแล้ว' : 'นำออกจากรายการเปรียบเทียบแล้ว', result.isAdded ? 'success' : 'info');
  } else if (result.error === 'max_reached') {
    showToast('เปรียบเทียบได้สูงสุด 4 ชิ้น', 'warning');
  }
}

const formatPrice = (price) => {
  if (!price) return '0'
  return new Intl.NumberFormat('th-TH').format(price)
}




const sharedNow = ref(Date.now())
let sharedTimer = null
let activeCardCount = 0

function startSharedTimer() {
  if (!sharedTimer) {
    sharedTimer = setInterval(() => {
      sharedNow.value = Date.now()
    }, 60000)
  }
  activeCardCount++
}

function stopSharedTimer() {
  activeCardCount--
  if (activeCardCount <= 0 && sharedTimer) {
    clearInterval(sharedTimer)
    sharedTimer = null
    activeCardCount = 0
  }
}

onMounted(startSharedTimer)
onUnmounted(stopSharedTimer)

const getTimeRemaining = (endTime) => {
  if (!endTime) return null
  const total = Date.parse(endTime) - sharedNow.value
  if (total <= 0) return null
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  
  if (days > 0) return `จบโปรใน ${days} วัน ${hours} ชม.`
  if (hours > 0) return `จบโปรใน ${hours} ชม. ${minutes} นาที`
  return `จบโปรใน ${minutes} นาที`
}
</script>

<template>
  <router-link 
    :to="'/products/' + (product.slug || product.id)" 
    class="group flex flex-col h-full rounded-[2rem] bg-white dark:bg-[#121826] border border-gray-100/80 dark:border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-emerald-200/50 transition-all duration-500 overflow-hidden relative"
    :class="compact ? 'hover:shadow-[0_15px_30px_rgba(240,113,0,0.08)]' : 'hover:shadow-[0_20px_40px_rgba(240,113,0,0.12)]'"
  >
    <!-- Image Section (Top half) -->
    <div 
      class="relative bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden transition-all duration-300"
      :class="compact ? 'h-[180px] sm:h-[200px] lg:h-[220px]' : 'h-[280px] md:h-[320px]'"
    >
      <img :src="getOptimizedImageUrl(product.image || product.image_url, 400)" :alt="product.title || product.name" width="600" height="600" class="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-[1s] relative z-[1]" @error="onImageError">
      
      <!-- Background decoration for image -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent z-[2] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <!-- Badges (Top Left) -->
      <div class="absolute top-4 left-4 z-[4] flex flex-col gap-2">
        <span v-if="product.isBestSeller || product.subtitle === 'ขายดี'" class="bg-gradient-to-r from-red-600 to-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path></svg>
          ขายดี
        </span>
        <span v-else-if="product.subtitle === 'แนะนำ'" class="bg-gradient-to-r from-emerald-500 to-amber-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          แนะนำ
        </span>
        <span v-else-if="product.subtitle === 'ส่งฟรี'" class="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
          ส่งฟรี
        </span>
        <span v-else-if="(product.originalPrice || product.original_price) && Number(product.originalPrice || product.original_price) > Number(product.price)" class="bg-gradient-to-r from-red-600 to-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
          ลดแรง
        </span>
      </div>

      <!-- Wishlist Button (Top Right) -->
      <div class="absolute top-4 right-4 z-[4]">
        <button v-if="settingsStore.isWishlistEnabled" @click.prevent="toggleWishlistItem($event, product)" class="w-9 h-9 rounded-full bg-transparent text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md flex items-center justify-center transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700" :title="wishlistStore.isInWishlist(product.id) ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'" :aria-label="wishlistStore.isInWishlist(product.id) ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'">
          <svg v-if="wishlistStore.isInWishlist(product.id)" class="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
        </button>
      </div>

      <!-- Out of Stock Watermark -->
      <div v-if="product.is_out_of_stock" class="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-[2]">
        <span class="text-4xl font-black text-gray-500/30 dark:text-gray-400/30 tracking-[0.2em] -rotate-12 select-none pointer-events-none">หมดแล้ว</span>
      </div>

      <!-- Feature Icons Stack (Left) - Large Prominent Badges -->
      <div v-if="!compact && product.card_features && product.card_features?.enabled !== false && product.card_features?.show_stack !== false && product.card_features?.stack?.length > 0" class="absolute top-1/2 -translate-y-1/2 left-3 z-[4] flex flex-col gap-2.5 feat-stack">
        <div v-for="(feat, idx) in product.card_features.stack" :key="'stack'+idx" class="feat-badge" :style="`--i: ${idx}`">
          <div class="feat-badge-icon">
             <FeatureIcon v-if="feat.icon" :name="feat.icon" class="w-5 h-5" />
          </div>
          <span class="feat-badge-text">{{ feat.text }}</span>
        </div>
      </div>
      <div v-else-if="!compact && !product.card_features" class="absolute top-1/2 -translate-y-1/2 left-3 z-[4] flex flex-col gap-2.5 feat-stack">
        <div class="feat-badge" style="--i: 0">
          <div class="feat-badge-icon">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </div>
          <span class="feat-badge-text">กันแดด UV</span>
        </div>
        <div class="feat-badge" style="--i: 1">
          <div class="feat-badge-icon">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
          </div>
          <span class="feat-badge-text">กันฝน</span>
        </div>
        <div class="feat-badge" style="--i: 2">
          <div class="feat-badge-icon">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
          </div>
          <span class="feat-badge-text">ทนทาน</span>
        </div>
      </div>

      <!-- Green Strong Badge (Bottom Right Image) -->
      <div v-if="!compact && product.card_features && product.card_features?.enabled !== false && product.card_features?.show_badge !== false && (product.card_features?.badge?.text1 || product.card_features?.badge?.text2)" class="absolute bottom-3 right-3 z-[4] bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <FeatureIcon v-if="product.card_features.badge.icon" :name="product.card_features.badge.icon" class="w-5 h-5" />
        <div class="flex flex-col leading-[1.1]">
          <span class="text-[10px] font-bold tracking-wide">{{ product.card_features.badge.text1 }}</span>
          <span v-if="product.card_features.badge.text2" class="text-[9px] font-light">{{ product.card_features.badge.text2 }}</span>
        </div>
      </div>
      <div v-else-if="!compact && !product.card_features" class="absolute bottom-3 right-3 z-[4] bg-emerald-500 text-white px-2.5 py-1.5 rounded-xl shadow-lg border border-emerald-600 flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        <div class="flex flex-col leading-[1.1]">
          <span class="text-[10px] font-bold tracking-wide">แข็งแรง</span>
          <span class="text-[9px] font-light">ไม่เป็นสนิม</span>
        </div>
      </div>
    </div>

    <!-- Content Section -->
    <div :class="compact ? 'p-4' : 'p-5'" class="flex flex-col flex-1 bg-white dark:bg-[#121826]">
      <div class="mb-2" v-if="product.sku">
        <span class="inline-block text-emerald-700 dark:text-emerald-300 font-black text-[11px] uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
          SKU: {{ product.sku }}
        </span>
      </div>
      <h3 :class="[
        compact ? 'text-sm md:text-base mb-2' : 'text-base md:text-[17px] mb-4',
        'font-black text-gray-900 dark:text-white leading-snug transition-colors flex-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
      ]">
        {{ product.title || product.name }}
      </h3>
      
      <!-- Pricing & Cart Button -->
      <div class="flex items-end justify-between mt-auto pt-2">
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5 mb-0.5" v-if="(product.originalPrice || product.original_price) && Number(product.originalPrice || product.original_price) > Number(product.price)">
            <span class="text-xs text-gray-500 dark:text-gray-400 line-through font-medium">฿{{ Number(product.originalPrice || product.original_price).toLocaleString() }}</span>
            <span class="text-red-700 dark:text-red-400 font-bold text-[11px] bg-red-50 dark:bg-red-900/20 px-1 rounded">-{{ Math.round(((Number(product.originalPrice || product.original_price) - Number(product.price)) / Number(product.originalPrice || product.original_price)) * 100) }}%</span>
          </div>
          <div class="flex items-center gap-1.5 mb-0.5" v-else>
            <span class="text-xs text-gray-400 font-medium opacity-0">฿0</span>
          </div>
          <span class="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none">฿{{ Number(product.price || 0).toLocaleString() }}</span>
        </div>
        
        <div class="flex items-center gap-2">
          <button v-if="!compact && settingsStore.isCompareEnabled && product.compare_enabled !== false && product.compare_enabled !== 0" @click.prevent="toggleCompareItem($event, product)" class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-colors shadow-sm border border-gray-200 dark:border-gray-700" :title="compareStore.isInCompare(product.id) ? 'นำออกจากรายการเปรียบเทียบ' : 'เพิ่มในรายการเปรียบเทียบ'" :aria-label="compareStore.isInCompare(product.id) ? 'นำออกจากรายการเปรียบเทียบ' : 'เพิ่มในรายการเปรียบเทียบ'">
            <svg class="w-5 h-5 transition-colors" :class="compareStore.isInCompare(product.id) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
          </button>
          <button v-if="settingsStore.isOnlineShoppingEnabled && !product.is_out_of_stock" @click.prevent="addToCart(product)" class="w-10 h-10 rounded-full bg-emerald-500 dark:bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-600 flex items-center justify-center transition-colors shadow-sm group/cart border border-transparent" title="เพิ่มลงตะกร้า" aria-label="เพิ่มลงตะกร้า">
             <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </button>
          <div v-else-if="!product.is_out_of_stock" class="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:border-emerald-600 flex items-center justify-center transition-all duration-300 border border-gray-100 dark:border-gray-700 shadow-sm">
             <svg class="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Feature Bar -->
    <div v-if="!compact && product.card_features && product.card_features?.enabled !== false && product.card_features?.show_bottom_bar !== false && product.card_features?.bottom_bar?.length > 0" class="bg-[#f7faf8] dark:bg-gray-800/60 p-3 px-4 border-t border-gray-100 dark:border-gray-800 grid gap-1 divide-x divide-gray-200 dark:divide-gray-700" :style="`grid-template-columns: repeat(${product.card_features.bottom_bar.length}, minmax(0, 1fr))`">
      <div v-for="(bar, idx) in product.card_features.bottom_bar" :key="'bottom'+idx" class="flex items-center justify-center gap-1.5 px-1">
        <FeatureIcon v-if="bar.icon" :name="bar.icon" class="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
        <span class="text-[9px] font-bold text-gray-800 dark:text-gray-200 leading-[1.1]">{{ bar.title }}<br><span v-if="bar.subtitle" class="font-normal text-gray-500 text-[8px]">{{ bar.subtitle }}</span></span>
      </div>
    </div>
    <div v-else-if="!compact && !product.card_features" class="bg-[#f7faf8] dark:bg-gray-800/60 p-3 px-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-1 divide-x divide-gray-200 dark:divide-gray-700">
      <div class="flex items-center justify-center gap-1.5 px-1">
        <svg class="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        <span class="text-[9px] font-bold text-gray-800 dark:text-gray-200 leading-[1.1]">HDPE<br><span class="font-normal text-gray-500">เกรดพรีเมียม</span></span>
      </div>
      <div class="flex items-center justify-center gap-1.5 px-1">
        <svg class="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span class="text-[9px] font-bold text-gray-800 dark:text-gray-200 leading-[1.1]">อายุการใช้งาน<br><span class="font-normal text-gray-500">10+ ปี</span></span>
      </div>
      <div class="flex items-center justify-center gap-1.5 px-1">
        <svg class="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
        <span class="text-[9px] font-bold text-gray-800 dark:text-gray-200 leading-[1.1]">ประกอบง่าย<br><span class="font-normal text-gray-500 text-[8px]">ไม่ต้องใช้เครื่องมือ</span></span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
/* ── Premium Feature Badge — Single Container ── */
.feat-stack {
  pointer-events: none;
}

.feat-badge {
  display: flex;
  align-items: center;
  gap: 0;
  height: 44px;
  width: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06),
              0 1px 3px rgba(0, 0, 0, 0.04),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  pointer-events: auto;
  cursor: default;
  opacity: 0;
  transform: translateX(-8px);
  animation: feat-badge-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 100ms + 200ms);
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.group:hover .feat-badge {
  width: auto;
  box-shadow: 0 6px 20px rgba(240, 113, 0, 0.15),
              0 2px 6px rgba(0, 0, 0, 0.06),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

:deep(.dark) .feat-badge,
.dark .feat-badge {
  background: rgba(18, 24, 38, 0.88);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(240, 113, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

@keyframes feat-badge-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.feat-badge-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f07100;
  flex-shrink: 0;
}

:deep(.dark) .feat-badge-icon,
.dark .feat-badge-icon {
  color: #d2a578;
}

.feat-badge-text {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  letter-spacing: 0.01em;
  max-width: 0;
  opacity: 0;
  padding-right: 0;
  overflow: hidden;
  transition: max-width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.25s ease,
              padding-right 0.3s ease;
}

.group:hover .feat-badge-text {
  max-width: 140px;
  opacity: 1;
  padding-right: 14px;
}

:deep(.dark) .feat-badge-text,
.dark .feat-badge-text {
  color: #e5e7eb;
}
</style>
