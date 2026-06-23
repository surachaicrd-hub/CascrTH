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

const addToCart = async (product) => {
  try {
    await cartStore.addToCart(product, 1);
    showToast(`เพิ่ม ${product.title} ลงในตะกร้าแล้ว`, 'success');
    trackingStore.trackEvent({
      type: 'add_to_cart',
      productId: product.id,
      productName: product.title,
      price: product.price,
      quantity: 1,
      source: 'products_grid'
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
      productName: product.title,
      source: 'products_grid'
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

const allProducts = ref([])
const activeCategory = ref('ทุกหมวดหมู่')
const categories = ref(['ทุกหมวดหมู่'])
const categoryDetails = ref([])

const activeCategoryData = computed(() => {
  if (activeCategory.value === 'ทุกหมวดหมู่') return null;
  return categoryDetails.value.find(c => c.name === activeCategory.value) || null;
})

const formattedCategoryTitle = computed(() => {
  if (!activeCategoryData.value) return { part1: '', part2: '', highlight: '' };
  const name = activeCategoryData.value.name || '';
  // Try to split on known suffixes for highlight styling
  const highlightPatterns = [/\s+(PP|HDPE|PE|Metal|Steel|PVC|ABS|WPC)$/i, /\s+(\S+)$/];
  for (const pattern of highlightPatterns) {
    const match = name.match(pattern);
    if (match && match.index > 0) {
      const before = name.slice(0, match.index).trim();
      const hl = match[1];
      // Split 'before' roughly in half by words for two-line display
      const words = before.split(/\s+/);
      if (words.length >= 2) {
        const mid = Math.ceil(words.length / 2);
        return {
          part1: words.slice(0, mid).join(' '),
          part2: words.slice(mid).join(' '),
          highlight: hl
        };
      }
      return { part1: before, part2: '', highlight: hl };
    }
  }
  // Fallback: split name in half by words
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    return {
      part1: words.slice(0, mid).join(' '),
      part2: words.slice(mid).join(' '),
      highlight: ''
    };
  }
  return { part1: name, part2: '', highlight: '' };
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
    result = result.filter(p => {
      if (p.categories && Array.isArray(p.categories)) {
        return p.categories.includes(activeCategory.value)
      }
      return p.category === activeCategory.value
    })
  }

  if (searchQuery.value.trim() !== '') {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.title.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)))
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
  return filteredProducts.value.slice(0, visibleCount.value)
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

  // Observe immediately if already mounted
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

  // Update URL without page reload
  if (cat === 'ทุกหมวดหมู่') {
    router.push('/products')
  } else {
    router.push(`/products/category/${encodeURIComponent(cat)}`)
  }
}

const formatPrice = (price) => {
  if (!price) return '0'
  return new Intl.NumberFormat('th-TH').format(price)
}

const now = ref(Date.now())
let timerInterval = null

const getTimeRemaining = (endTime) => {
  if (!endTime) return null
  const total = Date.parse(endTime) - now.value
  if (total <= 0) return null
  const days = Math.floor(total / (1000 * 60 * 60 * 24))
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  
  if (days > 0) return `จบโปรใน ${days} วัน ${hours} ชม.`
  if (hours > 0) return `จบโปรใน ${hours} ชม. ${minutes} นาที`
  return `จบโปรใน ${minutes} นาที`
}

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.success) {
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
    if (data.success) {
      allProducts.value = data.data.map(p => {
        const catDetails = categoryDetails.value.find(c => c.name === p.category);
        const catSortOrder = catDetails ? (catDetails.sort_order || 0) : 9999;
        
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
  // Support both /products/category/:name and /products?category=name
  const cat = route.params.category 
    ? decodeURIComponent(route.params.category) 
    : (route.query.category ? decodeURIComponent(route.query.category) : null)
  if (cat && categories.value.includes(cat)) {
    activeCategory.value = cat
    document.title = `สินค้าหมวดหมู่ ${cat} - Morespace`
  } else if (cat) {
    // Category from URL not found yet, try matching
    activeCategory.value = cat
    document.title = `สินค้าหมวดหมู่ ${cat} - Morespace`
  } else {
    activeCategory.value = 'ทุกหมวดหมู่'
  }
  
  if (route.query.search !== undefined) {
    searchQuery.value = route.query.search
  }
  
  visibleCount.value = 24
}

// Watch route changes (both params and query)
watch([() => route.params.category, () => route.query.category, () => route.query.search], () => {
  applyCategoryFromRoute()
})

onMounted(async () => {
  await fetchCategories()
  await fetchProducts()
  applyCategoryFromRoute()
  if (authStore.isAuthenticated) {
    await wishlistStore.fetchWishlist()
  }
  setupObserver()
  timerInterval = setInterval(() => { now.value = Date.now() }, 60000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (observer) observer.disconnect()
})

</script>

<template>
  <div class="bg-[#f8f9fa] dark:bg-[#0a0f16] min-h-screen pt-24 md:pt-32 pb-10 md:pb-24 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Category Hero Section (Dynamic) -->
      <div v-if="activeCategoryData" class="category-hero-card mb-16 rounded-[2.5rem] overflow-hidden bg-white dark:bg-[#111827] border border-gray-100 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none relative flex flex-col md:flex-row min-h-[420px]">
        
        <!-- Wavy Background & Decorative Layers (Desktop) -->
        <div class="absolute inset-0 z-0 pointer-events-none hidden md:flex flex-row">
          <!-- Left Side (White/Dark Background) -->
          <div class="w-[52%] lg:w-[55%] bg-white dark:bg-[#111827] relative">
            <!-- Dotted Pattern -->
            <div class="absolute top-8 right-16 w-32 h-32 opacity-30 dark:opacity-15" style="background-image: radial-gradient(#e0a96d 1.5px, transparent 1.5px); background-size: 12px 12px;"></div>
            
            <!-- Curved Wave Extender (White Panel) -->
            <svg class="absolute top-0 bottom-0 -right-[79px] h-full w-[80px] text-white dark:text-[#111827]" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="currentColor">
              <path d="M 0,0 L 85,0 C 65,150 45,280 45,400 C 45,520 85,640 85,760 C 85,880 50,930 90,1000 L 0,1000 Z" />
            </svg>
            
            <!-- Glowing Orange Stroke -->
            <svg class="absolute top-0 bottom-0 -right-[83px] h-full w-[80px] text-[#FFA726]/40 dark:text-[#FFA726]/20" viewBox="0 0 100 1000" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-width="4">
              <path d="M 83,0 C 63,150 43,280 43,400 C 43,520 83,640 83,760 C 83,880 48,930 88,1000" />
            </svg>
            
            <!-- Orange Dot Anchor on Curve -->
            <div class="absolute top-[52%] -right-[3px] w-4 h-4 rounded-full bg-gradient-to-r from-[#FF8A00] to-[#FFB74D] border-[3px] border-white dark:border-[#111827] shadow-md shadow-[#FF8A00]/40 z-30 animate-pulse"></div>

            <!-- Bottom Left Orange Arc/Circle -->
            <div class="absolute -bottom-16 right-0 w-36 h-36 rounded-full bg-gradient-to-tr from-[#FF8A00]/80 to-[#FFB74D]/60 opacity-80 shadow-lg shadow-[#FF8A00]/15 z-20"></div>
          </div>
          <div class="flex-grow"></div>
        </div>

        <!-- Mobile Background -->
        <div class="absolute inset-0 z-0 bg-white dark:bg-[#111827] md:hidden"></div>

        <!-- Left Content Column -->
        <div class="w-full md:w-[52%] lg:w-[55%] p-8 md:p-12 lg:p-14 xl:p-16 flex flex-col justify-center relative z-10 order-2 md:order-1">
          <!-- Small Decorative Mobile Blur -->
          <div class="absolute -top-12 -left-12 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl md:hidden"></div>
          
          <!-- Category Badge / Pill -->
          <div class="flex items-center gap-3 mb-6 relative">
             <div class="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFEAD6] to-[#FFF8F2] dark:from-[#2e241c] dark:to-[#1a1410] flex items-center justify-center border border-[#FFE0B2]/50 dark:border-[#5c4028]/30 shadow-inner flex-shrink-0">
                <img v-if="activeCategoryData.icon_url" :src="getOptimizedImageUrl(activeCategoryData.icon_url, 128)" :alt="activeCategoryData.name" class="w-8 h-8 object-contain invert sepia saturate-[20] hue-rotate-[350deg] opacity-70 dark:invert-0 dark:sepia-0 dark:saturate-100 dark:hue-rotate-0 dark:opacity-90" @error="onImageError">
                <svg v-else class="w-7 h-7 text-[#FF8A00]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
             </div>
             <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF3E0] dark:bg-[#FF8A00]/10 border border-[#FFE0B2]/60 dark:border-[#FF8A00]/25 text-[#E65100] dark:text-[#FF8A00] text-xs font-bold tracking-wide">
               <span class="relative flex h-2 w-2">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8A00] opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-2 w-2 bg-[#FF8A00]"></span>
               </span>
               หมวดหมู่ที่เลือก
             </div>
          </div>
          
          <!-- Dynamic Formatted Title -->
          <h1 class="text-3xl md:text-4xl lg:text-[2.75rem] xl:text-[3.25rem] font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-[1.25] relative">
            <span class="block">{{ formattedCategoryTitle.part1 }}</span>
            <span v-if="formattedCategoryTitle.part2 || formattedCategoryTitle.highlight" class="block text-slate-800 dark:text-slate-200">
              {{ formattedCategoryTitle.part2 }}
              <span v-if="formattedCategoryTitle.highlight" class="text-transparent bg-clip-text bg-gradient-to-r from-[#FF7A00] to-[#FF9E00] font-black"> {{ formattedCategoryTitle.highlight }}</span>
            </span>
          </h1>

          <!-- Accent Line -->
          <div class="w-12 h-1 bg-gradient-to-r from-[#FF7A00] to-[#FFB74D] rounded-full mb-6"></div>
          
          <!-- Description -->
          <p class="text-slate-500 dark:text-slate-400 text-sm md:text-base font-light leading-relaxed mb-8 max-w-lg relative">
            {{ activeCategoryData.description || 'ค้นหาพื้นที่เก็บของในสไตล์คุณ การันตีคุณภาพและความสวยงามระดับพรีเมียม ตอบสนองทุกฟังก์ชันการใช้งาน' }}
          </p>
          

        </div>

        <!-- Right Image Column -->
        <div class="w-full md:w-[48%] lg:w-[45%] min-h-[300px] md:min-h-0 relative order-1 md:order-2 bg-slate-50 dark:bg-slate-900">
          <img v-if="activeCategoryData.image_url" :src="getOptimizedImageUrl(activeCategoryData.image_url, 800)" :alt="activeCategoryData.name" class="absolute inset-0 w-full h-full object-cover" @error="onImageError">
          <div v-else class="absolute inset-0 w-full h-full bg-gradient-to-tr from-orange-100 to-amber-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
             <svg class="w-20 h-20 text-orange-200 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
             </svg>
          </div>
          
          <!-- Subtle Inner Overlay Fade (Mobile Only) -->
          <div class="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent dark:from-[#111827] dark:via-[#111827]/20 md:hidden pointer-events-none"></div>
        </div>
      </div>

      <!-- Category Filter (Flex-Wrap Layout for no scroll) -->
      <div class="relative w-full max-w-7xl mx-auto mb-16 px-4">
        <!-- Glassmorphic premium container background -->
        <div class="bg-[#FCFCFC] dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] p-5 md:p-7 border border-slate-100 dark:border-slate-800/60 shadow-sm shadow-slate-100 dark:shadow-none">
          
          <!-- Subtle header to label the section -->
          <div class="text-center mb-7">
            <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/40 border border-orange-100/60 dark:border-orange-900/30 text-[#FF7A00] text-[11px] font-bold uppercase tracking-wider">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              แยกตามหมวดหมู่สินค้า
            </span>
            <h3 class="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">เลือกประเภทตู้และบ้านเก็บของที่ต้องการ</h3>
          </div>

          <!-- Flex wrap centered container -->
          <div class="flex flex-wrap gap-3.5 justify-center">
            
            <!-- ทุกหมวดหมู่ (All Categories) Card -->
            <div 
              @click="setCategory('ทุกหมวดหมู่')"
              :class="[
                'relative w-[calc(50%-0.5rem)] sm:w-36 md:w-40 lg:w-[155px] xl:w-[165px] h-28 md:h-32 rounded-3xl p-3.5 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 select-none shadow-sm hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-1',
                activeCategory === 'ทุกหมวดหมู่'
                  ? 'bg-gradient-to-br from-[#FF7A00] to-[#FF9E00] text-white scale-[1.03] shadow-lg shadow-[#FF7A00]/25 ring-2 ring-[#FF7A00] ring-offset-2 dark:ring-offset-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-950/80'
              ]"
            >
              <!-- Checkmark badge for active state -->
              <div v-if="activeCategory === 'ทุกหมวดหมู่'" class="absolute -top-1.5 -right-1.5 bg-orange-600 border-2 border-white dark:border-slate-950 rounded-full p-1 text-white shadow z-10">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <!-- Icon -->
              <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-inner mt-1 flex-shrink-0"
                   :class="activeCategory === 'ทุกหมวดหมู่' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>

              <!-- Text & Subtitle/badge -->
              <div class="text-center w-full mb-1">
                <span class="block text-xs font-extrabold" :class="activeCategory === 'ทุกหมวดหมู่' ? 'text-white' : 'text-slate-800 dark:text-slate-200'">
                  ทุกหมวดหมู่
                </span>
                <span 
                  class="inline-block mt-1 px-3 py-0.5 text-[10px] font-bold rounded-full"
                  :class="activeCategory === 'ทุกหมวดหมู่' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
                >
                  ทั้งหมด
                </span>
              </div>
            </div>

            <!-- Dynamic Categories Cards -->
            <div 
              v-for="cat in categories.filter(c => c !== 'ทุกหมวดหมู่')"
              :key="cat"
              @click="setCategory(cat)"
              :class="[
                'relative w-[calc(50%-0.5rem)] sm:w-36 md:w-40 lg:w-[155px] xl:w-[165px] h-28 md:h-32 rounded-3xl p-3.5 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 select-none shadow-sm hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-1',
                activeCategory === cat
                  ? 'bg-gradient-to-br from-[#FF7A00] to-[#FF9E00] text-white scale-[1.03] shadow-lg shadow-[#FF7A00]/25 ring-2 ring-[#FF7A00] ring-offset-2 dark:ring-offset-slate-950'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-950/80'
              ]"
            >
              <!-- Checkmark badge for active state -->
              <div v-if="activeCategory === cat" class="absolute -top-1.5 -right-1.5 bg-orange-600 border-2 border-white dark:border-slate-950 rounded-full p-1 text-white shadow z-10">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>

              <!-- Image Thumbnail -->
              <div class="h-10 md:h-12 flex items-center justify-center mt-1 flex-shrink-0">
                <img 
                  v-if="categoryDetails.find(c => c.name === cat)?.icon_url" 
                  :src="getOptimizedImageUrl(categoryDetails.find(c => c.name === cat).icon_url, 128)" 
                  :alt="cat" 
                  @error="onImageError"
                  :class="[
                    'max-h-full max-w-full object-contain hover:scale-110 transition-all duration-300',
                    activeCategory === cat 
                      ? 'brightness-100 opacity-100' 
                      : 'brightness-0 opacity-50 dark:brightness-100 dark:opacity-80'
                  ]"
                />
                <svg v-else class="w-7 h-7" :class="activeCategory === cat ? 'text-white' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>

              <!-- Text & Subtitle/badge -->
              <div class="text-center w-full mb-1">
                <span class="block text-[11px] md:text-xs font-extrabold truncate px-1" :class="activeCategory === cat ? 'text-white' : 'text-slate-800 dark:text-slate-200'">
                  {{ cat }}
                </span>
                <span 
                  class="inline-block mt-1 px-2.5 py-0.5 text-[9px] md:text-[10px] font-bold rounded-full"
                  :class="activeCategory === cat ? 'bg-white/20 text-white' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'"
                >
                  {{ allProducts.filter(p => p.categories ? p.categories.includes(cat) : p.category === cat).length }} แบบ
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        <div v-for="i in 8" :key="'skeleton-' + i" class="bg-white dark:bg-[#111827] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-full animate-pulse">
          <div class="aspect-square bg-gray-200 dark:bg-gray-800"></div>
          <div class="p-6 flex flex-col flex-grow">
            <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded-md w-3/4 mb-3"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2 mb-6"></div>
            <div class="mt-auto flex justify-between items-end pt-4 border-t border-gray-50 dark:border-gray-800">
              <div>
                <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-12 mb-2"></div>
                <div class="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-24"></div>
              </div>
              <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- State: No Results -->
      <div v-else-if="filteredProducts.length === 0" class="py-20 text-center">
         <div class="mb-4 text-gray-300 dark:text-gray-700"><svg class="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div>
         <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">ไม่พบสินค้าที่คุณค้นหา</h3>
         <p class="text-gray-500 dark:text-gray-400 mb-6">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่ใหม่อีกครั้ง</p>
         <button @click="setCategory('ทุกหมวดหมู่')" class="text-orange-600 dark:text-orange-500 font-bold hover:underline">ดูสินค้าทั้งหมด</button>
      </div>

      <!-- Grouped Products -->
      <div v-else class="space-y-16">
        <div v-for="group in groupedDisplayedProducts" :key="group.category" class="space-y-6">
          <!-- Category Header -->
          <div v-if="activeCategory === 'ทุกหมวดหมู่'" class="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
             <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{{ group.category }}</h2>
             <span class="px-3 py-1 text-sm font-medium bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-full">
              {{ allProducts.filter(p => p.categories ? p.categories.includes(group.category) : p.category === group.category).length }} รายการ
             </span>
          </div>

          <!-- Products Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            <ProductCard 
              v-for="product in group.products" 
              :key="product.id"
              :product="product"
            />
          </div>
        </div>
      </div>

      <!-- Infinite Scroll Trigger -->
      <div v-if="visibleCount < filteredProducts.length" ref="loadMoreTrigger" class="h-20 flex flex-col items-center justify-center mt-12 gap-3 opacity-70">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span class="text-sm text-gray-500 font-medium">กำลังโหลดเพิ่ม...</span>
      </div>
      <div v-else-if="filteredProducts.length > 0" class="mt-16 text-center pb-8">
        <div class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-full text-sm text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          แสดงสินค้าครบทั้งหมด {{ filteredProducts.length }} รายการ
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for horizontal scroll on mobile */
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}
</style>
