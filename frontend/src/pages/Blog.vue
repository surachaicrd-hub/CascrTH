<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const route = useRoute()
const { setMeta, setStructuredData } = useSEO()
const articles = ref([])
const categories = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const totalArticles = ref(0)
const selectedCategory = ref('all')
const searchQuery = ref('')
const searchInput = ref('')

const loadArticles = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: currentPage.value, limit: 10 })
    if (selectedCategory.value !== 'all') params.append('category', selectedCategory.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    
    const res = await fetch(`/api/articles/published?${params}`)
    const data = await res.json()
    if (data.success) {
      articles.value = data.data
      totalPages.value = data.pagination.totalPages
      totalArticles.value = data.pagination.total
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const paginationRange = computed(() => {
    const range = []
    const total = totalPages.value
    const current = currentPage.value
    const delta = 2
    let left = Math.max(2, current - delta)
    let right = Math.min(total - 1, current + delta)
    
    range.push(1)
    if (left > 2) range.push('...')
    for (let i = left; i <= right; i++) range.push(i)
    if (right < total - 1) range.push('...')
    if (total > 1) range.push(total)
    return range
})

const loadCategories = async () => {
  try {
    const res = await fetch('/api/articles/categories')
    const data = await res.json()
    if (data.success) categories.value = data.data
  } catch (e) { /* */ }
}

const filterCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
  loadArticles()
}

const changePage = (p) => {
  currentPage.value = p
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatArticleDate = (dateString) => {
  if (!dateString) return 'ล่าสุด';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'ล่าสุด';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch(e) {
    return 'ล่าสุด';
  }
}

// Search debouncing
let searchTimeout = null
const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchQuery.value = searchInput.value
    currentPage.value = 1
    loadArticles()
  }, 400)
}

const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
  currentPage.value = 1
  loadArticles()
}

const totalCategoriesCount = computed(() => {
  return categories.value.reduce((acc, cat) => acc + (cat.count || 0), 0)
})

const getImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200'
  if (path.startsWith('http')) return path
  return `${import.meta.env.VITE_API_URL || ''}${path}`
}

const getOptimizedBlogImageUrl = (path, width) => {
  if (!path) return 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200'
  if (path.startsWith('http')) return path
  const fullUrl = `${import.meta.env.VITE_API_URL || ''}${path}`
  return getOptimizedImageUrl(fullUrl, width)
}

// Featured article selection
const featuredArticle = computed(() => {
  if (currentPage.value !== 1 || articles.value.length === 0 || searchQuery.value || selectedCategory.value !== 'all') return null
  const featured = articles.value.find(a => a.is_featured)
  return featured || articles.value[0]
})

const gridArticles = computed(() => {
  const featured = featuredArticle.value
  if (!featured) return articles.value
  return articles.value.filter(a => a.id !== featured.id)
})

// Schema
const addSchema = () => {
  const storeName = settingsStore.storeName || ''
  const baseUrl = window.location.origin
  
  setMeta({
    title: 'บทความและสาระน่ารู้',
    description: settingsStore.storeDescription || 'รวบรวมไอเดีย บทความน่ารู้ เทคนิคการดูแลรักษา และเคล็ดลับการจัดระเบียบพื้นที่',
    canonicalUrl: `${baseUrl}/blog`,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": storeName ? `บทความ ${storeName}`.trim() : 'บทความและสาระน่ารู้',
    "description": settingsStore.storeDescription || "บทความให้ความรู้ การดูแลรักษา และเคล็ดลับจัดพื้นที่",
    "url": `${baseUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": storeName || undefined,
      "url": baseUrl
    }
  }, 'dynamic-structured-data')

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${baseUrl}/` },
      { "@type": "ListItem", "position": 2, "name": "บทความ", "item": `${baseUrl}/blog` }
    ]
  }, 'dynamic-breadcrumb-data')
}

onMounted(() => {
  loadArticles()
  loadCategories()
  addSchema()
})
</script>

<template>
  <div class="blog-page min-h-screen pb-20 transition-colors duration-500">

    <!-- ══════════════════════════════════════════════
         COMPACT HEADER SECTION
    ══════════════════════════════════════════════ -->
    <header class="relative overflow-hidden pt-28 pb-14 bg-[#080b10] border-b border-white/[0.03]">
      <!-- Background mesh and radial gradient -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 30px 30px;">
      </div>
      <div class="absolute inset-0 bg-gradient-to-b from-[#080b10] via-[#090e15]/85 to-[#080b10] pointer-events-none"></div>
      
      <!-- Subtle glowing blobs for aesthetic warmth -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div class="text-center md:text-left">
            <!-- Eyebrow Pill -->
            <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">BLOG & KNOWLEDGE</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              บทความและความรู้
            </h1>
            <p class="mt-3 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
              {{ settingsStore.storeDescription || 'เจาะลึกเทคนิคการจัดพื้นที่ เคล็ดลับดูแลรักษา และแรงบันดาลใจในการตกแต่ง' }}
            </p>
          </div>

          <!-- Stats Strip -->
          <div class="flex items-center justify-center md:justify-end gap-6 sm:gap-8 bg-slate-900/40 border border-white/5 backdrop-blur-md px-6 py-4 rounded-2xl self-center md:self-auto">
            <div class="text-center">
              <p class="text-xl sm:text-2xl font-black text-white tabular-nums">{{ totalArticles }}</p>
              <p class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">บทความทั้งหมด</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
              <p class="text-xl sm:text-2xl font-black text-white tabular-nums">{{ categories.length }}</p>
              <p class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">หมวดหมู่</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

      <!-- ══════════════════════════════════════════════
           FEATURED ARTICLE SHOWCASE (Page 1 Only)
      ══════════════════════════════════════════════ -->
      <section v-if="featuredArticle && !loading" class="mb-10">
        <router-link
          :to="'/blog/' + (featuredArticle.slug || featuredArticle.id)"
          class="featured-hero-card group"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Cover Image -->
            <div class="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[16/10] lg:aspect-[1.8/1] bg-slate-950 shadow-inner">
              <img
                :src="getOptimizedBlogImageUrl(featuredArticle.cover_image, 1200)"
                :alt="featuredArticle.title"
                class="w-full h-full object-cover transform group-hover:scale-102 transition-transform duration-[1.2s] ease-out"
                @error="onImageError"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              
              <!-- Badges on image -->
              <div class="absolute top-4 left-4 flex gap-2">
                <span class="bg-gradient-to-r from-blue-400 to-blue-500 text-white px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  แนะนำ
                </span>
                <span class="bg-emerald-500 text-white px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                  {{ featuredArticle.category }}
                </span>
              </div>
            </div>

            <!-- Content Details -->
            <div class="lg:col-span-5 flex flex-col justify-between h-full py-2">
              <div class="space-y-4">
                <span class="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  เผยแพร่เมื่อ {{ formatArticleDate(featuredArticle.published_at || featuredArticle.created_at) }}
                </span>
                
                <h2 class="featured-hero-title">
                  {{ featuredArticle.title }}
                </h2>
                
                <p class="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed line-clamp-4 font-light">
                  {{ featuredArticle.excerpt || featuredArticle.seo_description || 'อ่านรายละเอียดเชิงลึกและเทคนิคต่าง ๆ เพิ่มเติมได้ในบทความพิเศษนี้...' }}
                </p>
              </div>

              <div class="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/[0.05] mt-6">
                <div class="flex items-center gap-4 text-xs text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    {{ featuredArticle.view_count || 0 }} ยอดเข้าชม
                  </span>
                  <span>•</span>
                  <span v-if="featuredArticle.author || settingsStore.storeName">โดย {{ featuredArticle.author || settingsStore.storeName }}</span>
                </div>
                
                <span class="featured-hero-action">
                  <span>อ่านบทความ</span>
                  <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </router-link>
      </section>

      <!-- ══════════════════════════════════════════════
           STICKY FILTER & SEARCH BAR
      ══════════════════════════════════════════════ -->
      <div class="sticky-controls sticky z-30 transition-all duration-300">
        <div class="w-full border-b border-slate-200/80 dark:border-white/[0.05] bg-[#faf9f6]/95 dark:bg-[#0c0e14]/95 backdrop-blur-md py-4">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <!-- Category Pills (Horizontal scrollable) -->
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -my-1 -mx-4 px-4 md:mx-0 md:px-0 flex-1">
              <button
                @click="filterCategory('all')"
                :class="[
                  'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-white/45 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                ]"
              >
                ทั้งหมด
                <span class="ml-1.5 opacity-60 font-semibold">{{ totalArticles }}</span>
              </button>
              
              <button
                v-for="cat in categories"
                :key="cat.category"
                @click="filterCategory(cat.category)"
                :class="[
                  'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                  selectedCategory === cat.category
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-white/45 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                ]"
              >
                {{ cat.category }}
                <span class="ml-1.5 opacity-60 font-semibold">{{ cat.count }}</span>
              </button>
            </div>

            <!-- Search Panel -->
            <div class="flex items-center gap-3 justify-between md:justify-end flex-shrink-0">
              <!-- Result count -->
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                พบ <strong class="text-emerald-500 font-bold dark:text-emerald-400">{{ totalArticles }}</strong> บทความ
              </span>

              <!-- Search Input Capsule -->
              <div class="relative w-full max-w-[240px]">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </span>
                <input
                  v-model="searchInput"
                  @input="onSearchInput"
                  @keyup.enter="onSearchInput"
                  type="text"
                  placeholder="ค้นหาบทความ..."
                  class="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-full pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                />
                <!-- Clear Button -->
                <button
                  v-if="searchInput"
                  @click="clearSearch"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════
           ARTICLES GRID
      ══════════════════════════════════════════════ -->
      <section class="py-8">
        
        <!-- Loading Skeleton -->
        <div v-if="loading" class="articles-grid">
          <div v-for="n in 6" :key="n"
            class="flex flex-col bg-white dark:bg-slate-900/20 border border-slate-200/50 dark:border-white/[0.04] rounded-2xl overflow-hidden aspect-[4/3] animate-pulse"
          >
            <div class="aspect-[16/10] bg-slate-200 dark:bg-slate-800"></div>
            <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3"></div>
              </div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="articles.length === 0" class="text-center py-20 bg-slate-900/10 dark:bg-slate-900/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-8 max-w-lg mx-auto">
          <div class="w-16 h-16 empty-icon-box rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">ยังไม่มีบทความในหมวดหมู่นี้</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mb-6">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นเพื่อค้นหาข้อมูลที่คุณต้องการ</p>
          <button
            @click="filterCategory('all'); clearSearch()"
            class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-full transition-colors"
          >
            แสดงบทความทั้งหมด
          </button>
        </div>

        <!-- Articles Grid Content -->
        <div v-else class="articles-grid">
          <router-link
            v-for="article in gridArticles"
            :key="article.id"
            :to="'/blog/' + (article.slug || article.id)"
            class="article-card group"
          >
            <!-- Card Image -->
            <div class="card-image-wrapper">
              <img
                :src="getOptimizedBlogImageUrl(article.cover_image, 600)"
                :alt="article.title"
                class="card-img"
                @error="onImageError"
              />
              <div class="card-overlay"></div>
              
              <!-- Badges on top of Image -->
              <span class="card-badge-cat">
                {{ article.category || 'ทั่วไป' }}
              </span>
              
              <span v-if="article.is_featured" class="card-badge-featured">
                <svg class="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                แนะนำ
              </span>
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <div class="card-meta">
                <span class="card-date">{{ formatArticleDate(article.published_at || article.created_at) }}</span>
              </div>
              
              <h3 class="card-title">
                {{ article.title }}
              </h3>
              
              <p class="card-excerpt">
                {{ article.excerpt || article.seo_description || 'อ่านรายละเอียดเชิงลึกและข้อมูลที่น่าสนใจเพิ่มเติมในบทความนี้...' }}
              </p>
              
              <!-- Footer border and action -->
              <div class="card-footer">
                <span class="card-views flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  {{ article.view_count || 0 }} วิว
                </span>
                <span class="card-action">
                  <span class="card-action-text">อ่านรายละเอียด</span>
                  <svg class="card-action-arrow w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           PAGINATION
      ══════════════════════════════════════════════ -->
      <div v-if="totalPages > 1 && !loading" class="flex flex-col items-center gap-3 mt-12 pb-8">
        <div class="flex gap-1.5 items-center bg-white dark:bg-slate-900/40 p-1.5 rounded-full border border-slate-200/80 dark:border-white/5 shadow-sm">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            :class="currentPage <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'"
            class="w-9 h-9 rounded-full text-xs font-bold transition-colors flex items-center justify-center"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          
          <template v-for="p in paginationRange" :key="p">
            <span v-if="p === '...'" class="px-2 text-slate-400 font-bold tracking-widest text-xs">…</span>
            <button
              v-else
              @click="changePage(p)" 
              :class="currentPage === p ? 'bg-emerald-500 text-white shadow-sm' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'" 
              class="w-9 h-9 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center"
            >
              {{ p }}
            </button>
          </template>
          
          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            :class="currentPage >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'"
            class="w-9 h-9 rounded-full text-xs font-bold transition-colors flex items-center justify-center"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        <p class="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
          หน้า {{ currentPage }} จาก {{ totalPages }} <span class="mx-1.5 opacity-40">•</span> มีทั้งหมด {{ totalArticles }} บทความ
        </p>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ─── Page Base ─── */
.blog-page {
  background-color: #0c0e14;
  color: #f8fafc;
}

/* ─── Sticky Controls ─── */
.sticky-controls {
  top: 60px;
}
@media (min-width: 1024px) {
  .sticky-controls {
    top: 72px;
  }
}

/* ─── Featured Hero Card ─── */
.featured-hero-card {
  display: block;
  background-color: #111622;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
}

.featured-hero-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.featured-hero-title {
  font-size: 24px;
  font-weight: 900;
  line-height: 1.3;
  color: #ffffff;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

@media (min-width: 768px) {
  .featured-hero-title {
    font-size: 28px;
  }
}

.featured-hero-card:hover .featured-hero-title {
  color: #10b981;
}

.featured-hero-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #10b981;
  transition: color 0.3s ease;
}

.featured-hero-card:hover .featured-hero-action {
  color: #34d399;
}

/* ─── Grid Layout ─── */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 20px;
}
@media (min-width: 640px) {
  .articles-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
  }
}
@media (min-width: 1024px) {
  .articles-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 28px;
  }
}

/* ─── Article Card ─── */
.article-card {
  display: flex;
  flex-direction: column;
  background-color: #111622;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
}

.article-card:hover {
  transform: translateY(-4px);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.2);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background-color: #080b10;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-card:hover .card-img {
  transform: scale(1.04);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8, 11, 16, 0.35) 0%, rgba(8, 11, 16, 0) 50%);
  pointer-events: none;
}

/* Badges */
.card-badge-cat {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: rgba(12, 14, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.card-badge-featured {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 3px;
  background-color: rgba(12, 14, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fbbf24;
  font-size: 9px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.article-card:hover .card-badge-cat {
  background-color: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #34d399;
}

/* Card Body */
.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.card-date {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: #f1f5f9;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.article-card:hover .card-title {
  color: #10b981;
}

.card-excerpt {
  font-size: 13px;
  line-height: 1.5;
  color: #94a3b8;
  font-weight: 300;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 12px;
  margin-top: auto;
}

.card-views {
  font-size: 11px;
  color: #64748b;
}

.card-action {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-action-text {
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
  transition: color 0.3s ease;
}

.card-action-arrow {
  color: #10b981;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.article-card:hover .card-action-arrow {
  transform: translateX(3px);
}

.article-card:hover .card-action-text {
  color: #34d399;
}

/* ─── Empty State ─── */
.empty-icon-box {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #475569;
}

/* ─── Scrollbar hide ─── */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>

<style>
/* ══════════════════════════════════════════════
   LIGHT MODE OVERRIDES
══════════════════════════════════════════════ */

html:not(.dark) .blog-page {
  background-color: #faf9f6;
  color: #1e293b;
}

html:not(.dark) .blog-page .sticky-controls > div {
  background-color: rgba(250, 249, 246, 0.92);
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

/* Featured Hero Card Light Mode */
html:not(.dark) .blog-page .featured-hero-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
}

html:not(.dark) .blog-page .featured-hero-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 16px 36px -12px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.15);
}

html:not(.dark) .blog-page .featured-hero-card h2 {
  color: #1e293b;
}

html:not(.dark) .blog-page .featured-hero-card:hover h2 {
  color: #10b981;
}

/* Article Card Light Mode */
html:not(.dark) .blog-page .article-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
}

html:not(.dark) .blog-page .article-card:hover {
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 16px 36px -12px rgba(16, 185, 129, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.15);
}

html:not(.dark) .blog-page .card-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0) 50%);
}

html:not(.dark) .blog-page .card-badge-cat,
html:not(.dark) .blog-page .card-badge-featured {
  background-color: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 0, 0, 0.05);
  color: #334155;
}

html:not(.dark) .blog-page .article-card:hover .card-badge-cat {
  background-color: rgba(16, 185, 129, 0.08);
  border-color: rgba(16, 185, 129, 0.2);
  color: #059669;
}

html:not(.dark) .blog-page .article-card .card-badge-featured {
  color: #d97706;
}

html:not(.dark) .blog-page .card-date {
  color: #64748b;
}

html:not(.dark) .blog-page .card-title {
  color: #1e293b;
}

html:not(.dark) .blog-page .article-card:hover .card-title {
  color: #10b981;
}

html:not(.dark) .blog-page .card-excerpt {
  color: #475569;
}

html:not(.dark) .blog-page .card-footer {
  border-top-color: rgba(0, 0, 0, 0.05);
}

html:not(.dark) .blog-page .card-views {
  color: #64748b;
}

/* Empty State Light Mode */
html:not(.dark) .blog-page .empty-icon-box {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  color: #94a3b8;
}
</style>
