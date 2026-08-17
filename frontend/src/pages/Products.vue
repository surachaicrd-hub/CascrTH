<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCompareStore } from '../stores/compareStore'
import { useAuthStore } from '../stores/authStore'
import { useTrackingStore } from '../stores/tracking'
import { useToast } from '../composables/useToast'
import { useSEO } from '../composables/useSEO'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const authStore = useAuthStore()
const trackingStore = useTrackingStore()
const { showToast } = useToast()
const { setMeta, setStructuredData } = useSEO()

const allProducts = ref([])
const activeCategory = ref('ทุกหมวดหมู่')
const categories = ref(['ทุกหมวดหมู่'])
const categoryDetails = ref([])

const activeCategoryData = computed(() => {
  if (activeCategory.value === 'ทุกหมวดหมู่') return null
  return categoryDetails.value.find(c => c.name === activeCategory.value) || null
})

const activeCategoryProductCount = computed(() => {
  if (activeCategory.value === 'ทุกหมวดหมู่') return allProducts.value.length
  return allProducts.value.filter(p => p.categories ? p.categories.includes(activeCategory.value) : p.category === activeCategory.value).length
})

const searchQuery = ref(route.query.search || '')
const loading = ref(true)

let searchTimeout = null
watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (newVal.trim().length >= 2) {
    searchTimeout = setTimeout(() => {
      trackingStore.trackEvent({
        type: 'search_query',
        keyword: newVal.trim()
      })
    }, 1500)
  }
})

// Infinite Scroll State
const visibleCount = ref(24)
const loadMoreTrigger = ref(null)
let observer = null

const filteredProducts = computed(() => {
  let result = allProducts.value

  if (activeCategory.value !== 'ทุกหมวดหมู่') {
    const targetCat = categoryDetails.value.find(c => c.name === activeCategory.value || c.id === activeCategory.value)
    const targetKeys = new Set([
      activeCategory.value,
      targetCat?.id,
      targetCat?.name
    ].filter(Boolean))

    result = result.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.category]
      return pCats.some(c => targetKeys.has(c)) || targetKeys.has(p.category) || (p.category_id && targetKeys.has(p.category_id))
    })
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.category && p.category.toLowerCase().includes(q)))
  }

  // Sort by category order then product order
  result.sort((a, b) => {
    if (a.category_sort_order !== b.category_sort_order) {
      return a.category_sort_order - b.category_sort_order
    }
    return a.sort_order - b.sort_order
  })

  return result
})

const displayedProducts = computed(() => {
  return filteredProducts.value
})

const groupedDisplayedProducts = computed(() => {
  if (activeCategory.value !== 'ทุกหมวดหมู่') {
    return [{
      category: activeCategory.value,
      products: displayedProducts.value
    }]
  }

  const groups = []
  const catNames = categories.value.filter(c => c !== 'ทุกหมวดหมู่')

  catNames.forEach(catName => {
    const productsInCat = displayedProducts.value.filter(p => {
      if (Array.isArray(p.categories)) {
        return p.categories.includes(catName)
      }
      return p.category === catName
    })

    if (productsInCat.length > 0) {
      groups.push({
        category: catName,
        products: productsInCat
      })
    }
  })

  return groups
})

const setupObserver = () => {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && visibleCount.value < filteredProducts.value.length) {
        visibleCount.value += 24
      }
    })
  }, { rootMargin: '400px' })

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
}

watch(loadMoreTrigger, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

watch(visibleCount, async () => {
  if (observer && loadMoreTrigger.value) {
    observer.unobserve(loadMoreTrigger.value)
    await nextTick()
    if (loadMoreTrigger.value) {
      observer.observe(loadMoreTrigger.value)
    }
  }
})

const setCategory = (cat) => {
  activeCategory.value = cat
  visibleCount.value = 24

  if (cat === 'ทุกหมวดหมู่') {
    router.push('/products')
  } else {
    router.push(`/products/category/${encodeURIComponent(cat)}`)
  }
}

watch(activeCategory, (cat) => {
  const isAll = !cat || cat === 'ทุกหมวดหมู่'
  const titleText = isAll ? 'รายการสินค้าทั้งหมด - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' : `สินค้าหมวดหมู่ ${cat} - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด`
  const descText = isAll 
    ? (settingsStore.storeDescription || 'รวมรายการสินค้าคุณภาพสูงระดับพรีเมียมทุกประเภท โรงเก็บของสำเร็จรูป และอุปกรณ์มาตรฐานอุตสาหกรรม')
    : `เลือกซื้อ ${cat} คุณภาพพรีเมียม ทนทาน พร้อมบริการประกอบและติดตั้งทั่วประเทศ โดย บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด`

  setMeta({
    title: titleText,
    description: descText,
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": titleText, "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
}, { immediate: true })

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      categories.value = ['ทุกหมวดหมู่', ...data.data.map(c => c.name)]
      categoryDetails.value = data.data
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

const fetchProducts = async () => {
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      allProducts.value = data.data.map(p => {
        const catDetails = categoryDetails.value.find(c => c.name === p.category || c.id === p.category || c.id === p.category_id)
        const catSortOrder = catDetails ? (catDetails.sort_order || 0) : 9999
        
        let parsedCategories = []
        if (typeof p.categories === 'string') {
          try { parsedCategories = JSON.parse(p.categories) || [] } catch (e) { parsedCategories = [] }
        } else if (Array.isArray(p.categories)) {
          parsedCategories = p.categories
        }
        if (parsedCategories.length === 0 && p.category) {
          parsedCategories = [p.category]
        }

        return {
          id: p.id,
          sku: p.sku || '',
          slug: p.slug,
          category: p.category || 'ไม่มีหมวดหมู่',
          category_id: p.category_id || (catDetails ? catDetails.id : null),
          categories: parsedCategories,
          title: p.name,
          image: p.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
          price: p.price,
          original_price: p.original_price,
          rating: Number(p.rating || 5).toFixed(1),
          reviews: p.review_count || 0,
          is_out_of_stock: p.is_out_of_stock || false,
          sale_end_date: p.sale_end_date,
          stock_quantity: p.stock_quantity,
          card_features: p.card_features || null,
          compare_enabled: p.compare_enabled !== false,
          sort_order: p.sort_order || 0,
          category_sort_order: catSortOrder
        }
      })
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    loading.value = false
  }
}

const applyCategoryFromRoute = () => {
  const cat = route.params.category 
    ? decodeURIComponent(route.params.category) 
    : (route.query.category ? decodeURIComponent(route.query.category) : null)
  if (cat && categories.value.includes(cat)) {
    activeCategory.value = cat
  } else if (cat) {
    activeCategory.value = cat
  } else {
    activeCategory.value = 'ทุกหมวดหมู่'
  }
  
  if (route.query.search !== undefined) {
    searchQuery.value = route.query.search
  }
  
  visibleCount.value = 24
}

watch([() => route.params.category, () => route.query.category, () => route.query.search], () => {
  applyCategoryFromRoute()
})

const lineHref = computed(() => {
  const l = settingsStore.contactLines?.[0]
  if (!l) return '/contact'
  if (typeof l === 'string') return `https://line.me/ti/p/~${l.replace(/^@/, '')}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value.replace(/^@/, '')}` : '/contact')
})

const heroBg = computed(() => {
  if (activeCategoryData.value?.image_url) return activeCategoryData.value.image_url
  return settingsStore.productsHeroBg || '/images/hero/products-hero.jpg'
})

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
  applyCategoryFromRoute()
  if (authStore.isAuthenticated) {
    await wishlistStore.fetchWishlist()
  }
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-20">

    <!-- =========================================================================
         HERO HEADER SECTION (Enterprise Dark Aesthetic - Redesigned)
         ========================================================================= -->
    <header class="relative overflow-hidden pt-28 pb-14 lg:pb-16 bg-[#070A0F] border-b border-white/[0.05]">
      <!-- Hero Background Image (Admin Managed) -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-60 scale-100 pointer-events-none"
        :style="{ backgroundImage: `url(${heroBg})` }"
      ></div>
      <!-- Directional Gradient Overlays: Dark on text area, clear and luminous on image -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/70 to-[#070A0F]/20 pointer-events-none"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/40 pointer-events-none"></div>

      <!-- Background Mesh Pattern -->
      <div class="absolute inset-0 opacity-[0.035] pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px); background-size: 28px 28px;">
      </div>
      
      <!-- Ambient Glows -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Breadcrumb Navigation -->
        <nav class="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumb">
          <router-link to="/" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>หน้าแรก</span>
          </router-link>
          
          <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          
          <router-link to="/products" :class="activeCategory === 'ทุกหมวดหมู่' ? 'text-emerald-400 font-semibold' : 'hover:text-emerald-400 transition-colors'">
            สินค้าทั้งหมด
          </router-link>

          <template v-if="activeCategory !== 'ทุกหมวดหมู่'">
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-emerald-400 font-semibold truncate max-w-[200px]">{{ activeCategory }}</span>
          </template>
        </nav>

        <!-- Two-Column Balanced Hero Layout -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <!-- Left Column: Title, Eyebrow, Description & Actions -->
          <div class="lg:col-span-7 space-y-5 text-center sm:text-left">
            
            <!-- Eyebrow Pill -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span class="text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                {{ activeCategory === 'ทุกหมวดหมู่' ? 'PRODUCT CATALOG' : `หมวดหมู่สินค้า • ${activeCategoryProductCount} รายการ` }}
              </span>
            </div>
            
            <!-- Main Headline -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              <template v-if="activeCategory === 'ทุกหมวดหมู่'">
                คลังสินค้าและผลิตภัณฑ์พรีเมียม <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400">
                  มาตรฐานความปลอดภัยระดับสากล
                </span>
              </template>
              <template v-else>
                สินค้าหมวดหมู่ <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400">
                  {{ activeCategory }}
                </span>
              </template>
            </h1>
            
            <!-- Description -->
            <p class="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              {{ activeCategoryData?.description || 'เลือกชมและสั่งซื้อโรงเก็บของสำเร็จรูปพรีเมียม โรงจอดรถ ตู้และกล่องเก็บของกลางแจ้ง และอุปกรณ์มาตรฐานอุตสาหกรรม พร้อมบริการจัดส่งและประกอบติดตั้งทั่วประเทศ' }}
            </p>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <router-link 
                to="/quotation" 
                class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>ขอใบเสนอราคาด่วน</span>
              </router-link>

              <a 
                :href="lineHref"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 backdrop-blur-sm transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>ปรึกษาผู้เชี่ยวชาญ</span>
              </a>
            </div>

          </div>

          <!-- Right Column: Visual Feature Showcase & Stats Card -->
          <div class="lg:col-span-5">
            <div class="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-white/10 shadow-2xl p-6 sm:p-7 backdrop-blur-md">
              
              <!-- Ambient card glow -->
              <div class="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

              <!-- Top Visual / Badge Row -->
              <div class="flex items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <img 
                      v-if="activeCategoryData?.icon_url" 
                      :src="getOptimizedImageUrl(activeCategoryData.icon_url, 128)" 
                      :alt="activeCategory" 
                      class="w-6 h-6 object-contain"
                      @error="onImageError"
                    />
                    <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-tight">หมวดหมู่</p>
                    <h3 class="text-base font-bold text-white leading-snug truncate max-w-[180px]">{{ activeCategory }}</h3>
                  </div>
                </div>

                <span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {{ activeCategoryProductCount }} รายการ
                </span>
              </div>

              <!-- Category Cover Image (if present) -->
              <div v-if="activeCategoryData?.image_url" class="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 border border-white/5 bg-slate-950">
                <img 
                  :src="getOptimizedImageUrl(activeCategoryData.image_url, 600)" 
                  :alt="activeCategory" 
                  class="w-full h-full object-cover"
                  @error="onImageError"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              </div>

              <!-- 3-Column Stats Strip inside Card -->
              <div class="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.08] text-center">
                <div class="p-2.5 rounded-xl bg-white/[0.03]">
                  <p class="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
                    {{ activeCategoryProductCount }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium mt-0.5">สินค้าในหมวด</p>
                </div>
                
                <div class="p-2.5 rounded-xl bg-white/[0.03]">
                  <p class="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">
                    {{ categories.length - 1 }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium mt-0.5">หมวดหมู่รวม</p>
                </div>

                <div class="p-2.5 rounded-xl bg-white/[0.03]">
                  <p class="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                    100%
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium mt-0.5">รับประกันสินค้า</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </header>

    <!-- =========================================================================
         CATEGORY CARDS SELECTOR & SEARCH
         ========================================================================= -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
      
      <!-- Category Grid Cards -->
      <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20 mb-10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">เลือกหมวดหมู่สินค้าที่ต้องการ</h3>
          </div>

          <!-- Search Bar -->
          <div class="relative w-full sm:w-64">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="ค้นหาชื่อสินค้า, รหัส SKU..."
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Horizontal Scrollable / Flex Wrap Category Badges -->
        <div class="flex flex-wrap gap-3">
          <!-- All Categories Badge -->
          <button
            @click="setCategory('ทุกหมวดหมู่')"
            :class="[
              'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border',
              activeCategory === 'ทุกหมวดหมู่'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800'
            ]"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
            <span>ทุกหมวดหมู่</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="activeCategory === 'ทุกหมวดหมู่' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'">
              {{ allProducts.length }}
            </span>
          </button>

          <!-- Dynamic Category Badges -->
          <button
            v-for="cat in categories.filter(c => c !== 'ทุกหมวดหมู่')"
            :key="cat"
            @click="setCategory(cat)"
            :class="[
              'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 border',
              activeCategory === cat
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800'
            ]"
          >
            <span>{{ cat }}</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono" :class="activeCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'">
              {{ allProducts.filter(p => p.categories ? p.categories.includes(cat) : p.category === cat).length }}
            </span>
          </button>
        </div>
      </div>

      <!-- =========================================================================
           PRODUCTS LIST / GRID
           ========================================================================= -->
      
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div v-for="i in 6" :key="'skel-'+i" class="bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-sm animate-pulse flex flex-col">
          <div class="aspect-square bg-slate-200 dark:bg-slate-800"></div>
          <div class="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div class="space-y-2.5">
              <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            </div>
            <div class="h-5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProducts.length === 0" class="text-center py-20 bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">ไม่พบสินค้าที่คุณค้นหา</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 font-light">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นเพื่อดูสินค้า</p>
        <button
          @click="setCategory('ทุกหมวดหมู่'); searchQuery = ''"
          class="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
        >
          แสดงสินค้าทั้งหมด
        </button>
      </div>

      <!-- Grouped Products Grid (Using existing ProductCard component untouched) -->
      <div v-else class="space-y-16">
        <div v-for="group in groupedDisplayedProducts" :key="group.category" class="space-y-6">
          <!-- Category Section Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/[0.06]">
            <div class="flex items-center gap-3">
              <span class="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{{ group.category }}</h2>
            </div>
            <span class="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
              {{ group.products.length }} รายการ
            </span>
          </div>

          <!-- Products Grid (Using original ProductCard component untouched) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <ProductCard 
              v-for="product in group.products" 
              :key="product.id"
              :product="product"
            />
          </div>
        </div>
      </div>

      <!-- Infinite Scroll Trigger / End Notice -->
      <div v-if="visibleCount < filteredProducts.length" ref="loadMoreTrigger" class="h-20 flex flex-col items-center justify-center mt-12 gap-3 opacity-70">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        <span class="text-xs text-slate-500 font-medium">กำลังโหลดสินค้าเพิ่มเติม...</span>
      </div>
      <div v-else-if="filteredProducts.length > 0" class="mt-16 text-center">
        <div class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#10141D] rounded-full text-xs text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-white/[0.06] shadow-sm">
          <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          <span>แสดงสินค้าครบทั้งหมด {{ filteredProducts.length }} รายการแล้ว</span>
        </div>
      </div>

    </div>

    <!-- =========================================================================
         CTA BANNER (Start Your Project)
         ========================================================================= -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
      <div class="rounded-3xl p-8 sm:p-12 lg:p-14 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-white/[0.08] shadow-2xl relative overflow-hidden">
        
        <!-- Ambient Glows -->
        <div class="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>NEED CUSTOM SIZING?</span>
            </div>

            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              ต้องการขนาดพิเศษ หรือสั่งผลิตตามพื้นที่?
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
              ส่งแบบร่าง ขนาดพื้นที่ หรือติดต่อทีมวิศวกรฝ่ายขาย เพื่อประเมินราคาและรับข้อเสนอพิเศษสำหรับโครงการของคุณ
            </p>
          </div>

          <!-- Standard CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <router-link 
              to="/quotation" 
              class="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 min-w-[160px]"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>ขอใบเสนอราคา</span>
            </router-link>

            <a 
              :href="lineHref"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-sm shadow-lg shadow-[#06C755]/25 transition-all duration-200 active:scale-95 min-w-[160px]"
            >
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
              </svg>
              <span>ปรึกษาผ่าน LINE</span>
            </a>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>
