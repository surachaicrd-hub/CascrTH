<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCompareStore } from '../stores/compareStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import CapabilityIcon from './ui/CapabilityIcon.vue'
import WireSample from './ui/WireSample.vue'
import { getWireSampleTitle } from '../utils/wire'

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
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const authStore = useAuthStore()
const { showToast } = useToast()

// Extract structured card data with smart fallbacks
const cardFeatures = computed(() => {
  const cf = props.product?.card_features || {}
  return typeof cf === 'string' ? (JSON.parse(cf) || {}) : cf
})

// 1. Model Name
const modelName = computed(() => {
  if (cardFeatures.value?.model_name) return cardFeatures.value.model_name
  if (props.product?.sku) return props.product.sku
  return props.product?.title || props.product?.name || ''
})

// 2. Subtitle
const subtitle = computed(() => {
  if (cardFeatures.value?.subtitle) return cardFeatures.value.subtitle
  if (props.product?.subtitle && props.product.subtitle !== 'แนะนำ' && props.product.subtitle !== 'ขายดี') return props.product.subtitle
  return ''
})

// 3. Machine image URL
const productImageUrl = computed(() => {
  if (props.product?.image_url) return props.product.image_url
  if (props.product?.image) return props.product.image
  if (Array.isArray(props.product?.images) && props.product.images.length > 0) return props.product.images[0]
  return ''
})

// 4. Spec Range Badge
const specRange = computed(() => {
  if (cardFeatures.value?.spec_range) return cardFeatures.value.spec_range
  if (props.product?.attributes) {
    try {
      const attrs = typeof props.product.attributes === 'string' ? JSON.parse(props.product.attributes) : props.product.attributes
      const found = attrs?.find(a => a.key?.includes('ขนาดสายไฟ') || a.value?.includes('AWG'))
      if (found) return found.value
    } catch (e) {}
  }
  if (props.product?.size) return props.product.size
  return ''
})

// 5. Capabilities List (Managed via Admin)
const capabilitiesList = computed(() => {
  if (Array.isArray(cardFeatures.value?.capabilities) && cardFeatures.value.capabilities.length > 0) {
    return cardFeatures.value.capabilities.filter(c => c.enabled !== false)
  }
  return []
})

// 6. Summary / Description (Managed via Admin)
const summaryText = computed(() => {
  if (cardFeatures.value?.summary) return cardFeatures.value.summary
  if (props.product?.short_description) return props.product.short_description
  if (props.product?.description) {
    return props.product.description.replace(/<[^>]*>?/gm, '').slice(0, 110)
  }
  return ''
})

// 7. Wire Samples (Managed via Admin)
const wireSamples = computed(() => {
  if (Array.isArray(cardFeatures.value?.wire_samples) && cardFeatures.value.wire_samples.length > 0) {
    return cardFeatures.value.wire_samples
  }
  if (cardFeatures.value?.wire_sample_image) {
    return [{ image: cardFeatures.value.wire_sample_image }]
  }
  return []
})

// Wishlist & Compare actions
const toggleWishlistItem = async (e, prod) => {
  e.preventDefault();
  e.stopPropagation();
  if (!authStore.isAuthenticated) {
    showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด', 'warning');
    return;
  }
  const result = await wishlistStore.toggleWishlist(prod);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว', result.isAdded ? 'success' : 'info');
  }
}

const toggleCompareItem = (e, prod) => {
  e.preventDefault();
  e.stopPropagation();
  const result = compareStore.toggleCompare(prod);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการเปรียบเทียบแล้ว' : 'นำออกจากรายการเปรียบเทียบแล้ว', result.isAdded ? 'success' : 'info');
  } else if (result.error === 'max_reached') {
    showToast('เปรียบเทียบได้สูงสุด 4 ชิ้น', 'warning');
  }
}
</script>

<template>
  <router-link 
    :to="'/products/' + (product.slug || product.id)" 
    class="group relative flex flex-col h-full bg-white dark:bg-[#111827] rounded-[1.75rem] border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_rgba(0,40,85,0.12)] hover:border-[#002855]/30 dark:hover:border-blue-500/40 transition-all duration-400 overflow-hidden font-sans select-none text-left p-5 md:p-6"
  >
    <!-- Top Header: Model Name on Left, Compare & Wishlist on Right -->
    <div class="flex items-center justify-between gap-2 mb-2">
      <h2 class="text-2xl md:text-3xl font-black text-[#002855] dark:text-white tracking-tight leading-none transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {{ modelName }}
      </h2>

      <!-- Compare & Wishlist Action Buttons -->
      <div class="flex items-center gap-1.5 shrink-0">
        <button 
          v-if="settingsStore.isCompareEnabled && product.compare_enabled !== false"
          @click="toggleCompareItem($event, product)"
          class="w-7 h-7 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          :title="compareStore.isInCompare(product.id) ? 'นำออกจากเปรียบเทียบ' : 'เปรียบเทียบ'"
        >
          <svg class="w-3.5 h-3.5" :class="compareStore.isInCompare(product.id) ? 'text-blue-600 font-bold' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>

        <button 
          v-if="settingsStore.isWishlistEnabled"
          @click="toggleWishlistItem($event, product)"
          class="w-7 h-7 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
          :title="wishlistStore.isInWishlist(product.id) ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'"
        >
          <svg v-if="wishlistStore.isInWishlist(product.id)" class="w-3.5 h-3.5 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
          </svg>
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Machine Image Container (1:1 Square, seamless blend with card) -->
    <div class="relative w-full aspect-square flex items-center justify-center my-1.5 p-0.5 overflow-hidden">
      <img 
        :src="productImageUrl" 
        :alt="modelName" 
        class="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500 ease-out" 
        @error="onImageError"
      />
    </div>

    <!-- Subtitle (Centered below image) -->
    <div class="text-center my-1">
      <p class="text-xs md:text-sm text-slate-700 dark:text-slate-300 font-medium">
        {{ subtitle }}
      </p>
    </div>

    <!-- Main Spec Capsule (Dark Navy Pill with Cable Icon & Wire Gauge Range) -->
    <div class="my-2">
      <div class="w-full bg-[#002855] dark:bg-[#0c2340] text-white py-2 px-3.5 rounded-full flex items-center justify-center gap-2 shadow-md shadow-blue-950/20 group-hover:bg-[#003366] transition-colors">
        <!-- Cable Spool / Wire Icon -->
        <div class="w-4 h-4 rounded-full bg-white/15 flex items-center justify-center shrink-0">
          <svg class="w-2.5 h-2.5 text-blue-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <circle cx="8" cy="12" r="2" />
          </svg>
        </div>
        <span class="text-xs md:text-[13px] font-bold tracking-wide text-center truncate">
          {{ specRange }}
        </span>
      </div>
    </div>

    <!-- Capabilities Badges (Smart single-row display for all functions) -->
    <div class="my-2.5 flex items-center justify-center gap-2 sm:gap-3 md:gap-3.5 flex-nowrap w-full">
      <div 
        v-for="(cap, idx) in capabilitiesList" 
        :key="'cap-'+idx" 
        class="flex flex-col items-center gap-1 shrink-0"
      >
        <CapabilityIcon :name="cap.icon || cap.id || cap.label" :size="32" />
        <span class="text-[9px] md:text-[10.5px] font-medium text-slate-700 dark:text-slate-300 leading-none whitespace-nowrap">
          {{ cap.label }}
        </span>
      </div>
    </div>

    <!-- Short Description / Summary Paragraph -->
    <div class="my-2 min-h-[44px] flex items-center">
      <p class="text-xs md:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 text-left">
        {{ summaryText }}
      </p>
    </div>

    <!-- Supported Wire Samples Section ("ตัวอย่างสายไฟที่รองรับ") -->
    <div v-if="wireSamples.length > 0" class="mt-auto pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
      <div class="flex items-center justify-between gap-1.5 mb-2">
        <div class="flex items-center gap-1.5 text-[11px] md:text-xs font-bold text-slate-800 dark:text-slate-200">
          <svg class="w-3.5 h-3.5 text-[#002855] dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>ตัวอย่างสายไฟที่รองรับ</span>
        </div>
        <span class="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
          {{ wireSamples.length }} แบบ
        </span>
      </div>

      <div class="space-y-1.5">
        <div 
          v-for="(sample, sIdx) in wireSamples" 
          :key="'sample-'+sIdx"
          class="group/wire flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <!-- Left: Wire Name Header with bullet indicator -->
          <div class="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[48%]">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500/80 dark:bg-blue-400 shrink-0 group-hover/wire:scale-125 transition-transform duration-200"></span>
            <span class="text-[10px] md:text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate" :title="getWireSampleTitle(sample)">
              {{ getWireSampleTitle(sample) }}
            </span>
          </div>

          <!-- Right: Wire Graphic (Same Row) -->
          <div class="flex-1 min-w-[70px] max-w-[52%] flex items-center justify-end">
            <WireSample :sample="sample" :height="14" />
          </div>
        </div>
      </div>
    </div>
  </router-link>
</template>
