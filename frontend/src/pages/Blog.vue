<script setup>
import { ref, onMounted, computed } from 'vue'
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
    if (data.success && Array.isArray(data.data)) {
      articles.value = data.data
      totalPages.value = data.pagination?.totalPages || 1
      totalArticles.value = data.pagination?.total || 0
    }
  } catch (e) {
    console.error('Failed to load articles:', e)
  } finally {
    loading.value = false
  }
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
    if (data.success && Array.isArray(data.data)) {
      categories.value = data.data
    }
  } catch (e) {
    console.error('Failed to load categories:', e)
  }
}

const filterCategory = (cat) => {
  selectedCategory.value = cat
  currentPage.value = 1
  loadArticles()
}

const changePage = (p) => {
  if (p === '...' || p === currentPage.value) return
  currentPage.value = p
  loadArticles()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const formatArticleDate = (dateString) => {
  if (!dateString) return 'ล่าสุด'
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'ล่าสุด'
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch(e) {
    return 'ล่าสุด'
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

const lineHref = computed(() => {
  const l = settingsStore.contactLines?.[0]
  if (!l) return '/contact'
  if (typeof l === 'string') return `https://line.me/ti/p/~${l.replace(/^@/, '')}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value.replace(/^@/, '')}` : '/contact')
})

// Schema
const addSchema = () => {
  const storeName = settingsStore.storeName || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด'
  const baseUrl = window.location.origin
  
  setMeta({
    title: 'บทความและสาระน่ารู้ - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    description: settingsStore.storeDescription || 'รวบรวมบทความน่ารู้ คู่มือการเลือกซื้อโรงเก็บของสำเร็จรูป การเตรียมงานฐานราก และเคล็ดลับการจัดระเบียบพื้นที่มาตรฐานสากล',
    canonicalUrl: `${baseUrl}/blog`,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": `บทความและความรู้ - ${storeName}`,
    "description": settingsStore.storeDescription || "บทความให้ความรู้ การดูแลรักษา และเคล็ดลับการเลือกใช้โรงเก็บของมาตรฐาน",
    "url": `${baseUrl}/blog`,
    "publisher": {
      "@type": "Organization",
      "name": storeName,
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

const heroBg = computed(() => {
  return settingsStore.blogHeroBg || '/images/hero/blog-hero.jpg'
})

onMounted(() => {
  loadArticles()
  loadCategories()
  addSchema()
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-20">

    <!-- =========================================================================
         HERO HEADER SECTION (Enterprise Dark Aesthetic)
         ========================================================================= -->
    <header class="relative overflow-hidden pt-28 pb-16 bg-[#070A0F] border-b border-white/[0.05]">
      <!-- Hero Background Image (Admin Managed) -->
      <div 
        class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-60 scale-100 pointer-events-none"
        :style="{ backgroundImage: `url(${heroBg})` }"
      ></div>
      <!-- Directional Gradient Overlays: Dark on text area, clear and luminous on image -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/70 to-[#070A0F]/20 pointer-events-none"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/40 pointer-events-none"></div>

      <!-- Mesh Pattern Background -->
      <div class="absolute inset-0 opacity-[0.035] pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px); background-size: 28px 28px;">
      </div>
      
      <!-- Ambient Atmospheric Glows -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumb Bar -->
        <nav class="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6" aria-label="Breadcrumb">
          <router-link to="/" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>หน้าแรก</span>
          </router-link>
          <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-emerald-400 font-semibold">บทความและความรู้</span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div class="max-w-3xl">
            <!-- Eyebrow Pill -->
            <div class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span class="text-emerald-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                KNOWLEDGE & ARTICLES
              </span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              คลังบทความและสาระน่ารู้ <br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400">
                คู่มือการเลือกใช้และดูแลรักษาพื้นที่
              </span>
            </h1>
            
            <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              เจาะลึกเทคนิคการเลือกซื้อโรงเก็บของสำเร็จรูป การเตรียมความพร้อมงานฐานราก การบำรุงรักษาโครงสร้าง และเกร็ดความรู้มาตรฐานอุตสาหกรรมจากทีมวิศวกรผู้เชี่ยวชาญ
            </p>
          </div>

          <!-- Key Stats Strip -->
          <div class="flex items-center justify-center lg:justify-end gap-6 sm:gap-8 bg-slate-900/60 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl shrink-0">
            <div class="text-center">
              <p class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">{{ totalArticles }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">บทความทั้งหมด</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
              <p class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-mono">{{ categories.length }}</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">หมวดหมู่ความรู้</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">

      <!-- =========================================================================
           FEATURED ARTICLE SHOWCASE (Page 1 Only)
           ========================================================================= -->
      <section v-if="featuredArticle && !loading" class="mb-12">
        <router-link
          :to="'/blog/' + (featuredArticle.slug || featuredArticle.id)"
          class="group block bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20 hover:border-emerald-500/40 hover:shadow-2xl transition-all duration-300"
        >
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center p-6 sm:p-8">
            <!-- Cover Image -->
            <div class="lg:col-span-7 relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900 shadow-inner">
              <img
                :src="getOptimizedBlogImageUrl(featuredArticle.cover_image, 1200)"
                :alt="featuredArticle.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                @error="onImageError"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              
              <!-- Badges on image -->
              <div class="absolute top-4 left-4 flex items-center gap-2">
                <span class="bg-emerald-600 text-white px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <svg class="w-3 h-3 text-emerald-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  บทความแนะนำ
                </span>
                <span v-if="featuredArticle.category" class="bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md">
                  {{ featuredArticle.category }}
                </span>
              </div>
            </div>

            <!-- Content Details -->
            <div class="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div class="space-y-3">
                <div class="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ formatArticleDate(featuredArticle.published_at || featuredArticle.created_at) }}</span>
                </div>
                
                <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ featuredArticle.title }}
                </h2>
                
                <p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3 font-light">
                  {{ featuredArticle.excerpt || featuredArticle.seo_description || 'อ่านรายละเอียดเชิงลึกและคำแนะนำสำคัญเพิ่มเติมได้ในบทความพิเศษนี้' }}
                </p>
              </div>

              <div class="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-white/[0.04] mt-2">
                <div class="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                  </svg>
                  <span>{{ featuredArticle.view_count || 0 }} ยอดเข้าชม</span>
                </div>
                
                <span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>อ่านบทความฉบับเต็ม</span>
                  <svg class="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </router-link>
      </section>

      <!-- =========================================================================
           STICKY FILTER & SEARCH BAR
           ========================================================================= -->
      <div class="sticky top-[60px] lg:top-[72px] z-30 transition-all duration-300 bg-white/80 dark:bg-[#090C12]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.06] py-3.5 mb-10 shadow-sm rounded-2xl">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <!-- Category Pills (Horizontal scrollable) -->
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -my-1 -mx-4 px-4 md:mx-0 md:px-0 flex-1">
              <button
                @click="filterCategory('all')"
                :class="[
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-[#10141D] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                ทั้งหมด
                <span class="ml-1.5 opacity-70 font-mono">{{ totalArticles }}</span>
              </button>
              
              <button
                v-for="cat in categories"
                :key="cat.category"
                @click="filterCategory(cat.category)"
                :class="[
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                  selectedCategory === cat.category
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-[#10141D] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                ]"
              >
                {{ cat.category }}
                <span class="ml-1.5 opacity-70 font-mono">{{ cat.count }}</span>
              </button>
            </div>

            <!-- Search Panel -->
            <div class="flex items-center gap-4 justify-between md:justify-end shrink-0">
              <!-- Result count -->
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
                พบ <strong class="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{{ totalArticles }}</strong> บทความ
              </span>

              <!-- Search Input -->
              <div class="relative w-full max-w-[240px]">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </span>
                <input
                  v-model="searchInput"
                  @input="onSearchInput"
                  type="text"
                  placeholder="ค้นหาบทความ..."
                  class="w-full bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
                <button
                  v-if="searchInput"
                  @click="clearSearch"
                  class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- =========================================================================
           ARTICLES GRID
           ========================================================================= -->
      <section>
        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div v-for="n in 6" :key="'art-skel-'+n" class="bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-sm animate-pulse flex flex-col">
            <div class="aspect-[16/10] bg-slate-200 dark:bg-slate-800"></div>
            <div class="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div class="space-y-2.5">
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="gridArticles.length === 0 && !featuredArticle" class="text-center py-20 bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
          <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">ไม่พบบทความที่ต้องการค้นหา</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 font-light">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อดูบทความ</p>
          <button
            @click="filterCategory('all'); clearSearch()"
            class="h-10 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all"
          >
            แสดงบทความทั้งหมด
          </button>
        </div>

        <!-- Articles Grid Content -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <router-link
            v-for="article in gridArticles"
            :key="article.id"
            :to="'/blog/' + (article.slug || article.id)"
            class="group bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-emerald-500/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
          >
            <!-- Card Image -->
            <div>
              <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
                <img
                  :src="getOptimizedBlogImageUrl(article.cover_image, 600)"
                  :alt="article.title"
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  @error="onImageError"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <!-- Category Badge -->
                <span v-if="article.category" class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-900/80 text-emerald-400 border border-emerald-500/20 backdrop-blur-md">
                  {{ article.category }}
                </span>
              </div>

              <!-- Card Body -->
              <div class="p-6">
                <div class="flex items-center gap-2 mb-2 text-slate-400 text-[11px] font-medium">
                  <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ formatArticleDate(article.published_at || article.created_at) }}</span>
                </div>
                
                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 line-clamp-2 leading-snug mb-2.5">
                  {{ article.title }}
                </h3>
                
                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-light">
                  {{ article.excerpt || article.seo_description || 'อ่านรายละเอียดและข้อแนะนำเพิ่มเติมในบทความ...' }}
                </p>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="px-6 pb-6 pt-2">
              <div class="pt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>อ่านบทความ</span>
                <svg class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </router-link>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 mt-12">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage === 1"
            class="w-10 h-10 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500/40"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <button
            v-for="(p, index) in paginationRange"
            :key="'page-'+index"
            @click="changePage(p)"
            :disabled="p === '...'"
            :class="[
              'w-10 h-10 rounded-xl font-bold text-xs transition-all font-mono',
              p === currentPage
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : p === '...'
                  ? 'cursor-default text-slate-400'
                  : 'bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:text-emerald-600'
            ]"
          >
            {{ p }}
          </button>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="w-10 h-10 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500/40"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </section>

    </div>

    <!-- =========================================================================
         CTA BANNER (Start Your Installation Project)
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
              <span>EXPERT CONSULTATION</span>
            </div>

            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              ต้องการคำปรึกษาเพิ่มเติมด้านเทคนิค?
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
              ทีมวิศวกรฝ่ายเทคนิคและทีมงานผู้เชี่ยวชาญพร้อมตอบทุกข้อสงสัย ให้คำแนะนำโครงสร้าง และประเมินราคาฟรี
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

<style scoped>
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
