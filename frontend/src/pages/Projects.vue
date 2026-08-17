<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const projects = ref([])
const loading = ref(true)
const showAll = ref(false)

/* ── Categories ── */
const CATS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'ยานยนต์ & ไวร์ริ่งฮาร์เนส', label: 'ยานยนต์ & ไวร์ริ่งฮาร์เนส' },
  { key: 'เครื่องใช้ไฟฟ้า & อิเล็กทรอนิกส์', label: 'เครื่องใช้ไฟฟ้า & อิเล็กทรอนิกส์' },
  { key: 'ระบบควบคุมอัตโนมัติ & หุ่นยนต์', label: 'ระบบควบคุมอัตโนมัติ & หุ่นยนต์' },
  { key: 'อื่นๆ', label: 'อื่นๆ' }
]

/* ── State ── */
const activeCategory = ref('all')
const searchQuery = ref('')

/* ── Fetch ── */
const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/projects/published')
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      projects.value = data.data
    }
  } catch (e) {
    console.error('Failed to fetch projects:', e)
  } finally {
    loading.value = false
  }
}

/* ── Computed ── */
const catsWithData = computed(() => {
  const set = new Set(projects.value.map(p => p.category || 'อื่นๆ'))
  return CATS.filter(c => c.key === 'all' || set.has(c.key))
})

const filteredProjects = computed(() => {
  let list = projects.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(p =>
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      (p.product_name && p.product_name.toLowerCase().includes(q)) ||
      (p.client_name && p.client_name.toLowerCase().includes(q))
    )
  }
  if (activeCategory.value !== 'all') {
    list = list.filter(p => (p.category || 'อื่นๆ') === activeCategory.value)
  }
  return list
})

const displayedProjects = computed(() =>
  showAll.value ? filteredProjects.value : filteredProjects.value.slice(0, 9)
)

const hasMore = computed(() => filteredProjects.value.length > 9 && !showAll.value)

/* ── Contact Hrefs ── */
const phoneHref = computed(() => {
  const p = settingsStore.contactPhones?.[0]
  if (!p) return '/contact'
  const num = typeof p === 'string' ? p : (p.value || '')
  return num ? `tel:${num.replace(/[^0-9+]/g, '')}` : '/contact'
})

const lineHref = computed(() => {
  const l = settingsStore.contactLines?.[0]
  if (!l) return '/contact'
  if (typeof l === 'string') return `https://line.me/ti/p/~${l.replace(/^@/, '')}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value.replace(/^@/, '')}` : '/contact')
})

/* ── Lifecycle ── */
onMounted(async () => {
  setMeta({
    title: 'ผลงานการติดตั้งและส่งมอบเครื่องจักร - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    description: settingsStore.storeDescription || 'รวมผลงานจริงการส่งมอบและติดตั้งเครื่องตัดปอกสายไฟ KODERA สำหรับโรงงานอุตสาหกรรมทั่วประเทศไทย',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "ผลงานการติดตั้ง", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')

  await fetchProjects()
})

const getImageUrl = (path) => {
  if (!path) return '/images/hero/projects-hero.jpg'
  if (path.startsWith('http')) return path
  return getOptimizedImageUrl(`${import.meta.env.VITE_API_URL || ''}${path}`, 600)
}

const heroBg = computed(() => {
  return settingsStore.projectsHeroBg || '/images/hero/projects-hero.jpg'
})

/* ── Date formatting ── */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })
  } catch (e) {
    return ''
  }
}
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
      <!-- Directional Gradient Overlays -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/70 to-[#070A0F]/20 pointer-events-none"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/40 pointer-events-none"></div>

      <!-- Background Mesh Pattern -->
      <div class="absolute inset-0 opacity-[0.035] pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px); background-size: 28px 28px;">
      </div>
      
      <!-- Ambient Atmospheric Glows -->
      <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div class="absolute top-1/2 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Breadcrumb Bar -->
        <nav class="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6" aria-label="Breadcrumb">
          <router-link to="/" class="hover:text-blue-400 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span>หน้าแรก</span>
          </router-link>
          <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          <span class="text-blue-400 font-semibold">ผลงานการติดตั้ง</span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div class="max-w-3xl">
            <!-- Eyebrow Pill -->
            <div class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
              <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span class="text-blue-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                REAL INSTALLATION PORTFOLIO
              </span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              ผลงานการส่งมอบและติดตั้งจริง <br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-400">
                โดยทีมวิศวกรผู้เชี่ยวชาญ KODERA
              </span>
            </h1>
            
            <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              รวบรวมภาพผลงานจริงการส่งมอบ ติดตั้ง และอบรมการใช้งานเครื่องตัดปอกสายไฟ KODERA Japan จากโรงงานชั้นนำทั่วประเทศ การันตีความแม่นยำสูงและได้มาตรฐานวิศวกรรม
            </p>
          </div>

          <!-- Key Stats Strip -->
          <div class="flex items-center justify-center lg:justify-end gap-6 sm:gap-8 bg-slate-900/60 border border-white/10 backdrop-blur-md px-6 py-4 rounded-2xl shrink-0">
            <div class="text-center">
              <p class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-mono">500+</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">เครื่องที่ส่งมอบ</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
              <p class="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 font-mono">77</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">จังหวัดทั่วไทย</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
              <p class="text-2xl sm:text-3xl font-black text-blue-400 font-mono">100%</p>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">รับประกันศูนย์ไทย</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- =========================================================================
         STICKY FILTER & SEARCH BAR
         ========================================================================= -->
    <div class="sticky top-[60px] lg:top-[72px] z-30 transition-all duration-300 bg-white/80 dark:bg-[#090C12]/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.06] py-3.5 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <!-- Category Pills (Horizontal scrollable) -->
          <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -my-1 -mx-4 px-4 md:mx-0 md:px-0 flex-1">
            <button
              v-for="cat in catsWithData"
              :key="cat.key"
              @click="activeCategory = cat.key; showAll = false"
              :class="[
                'px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                activeCategory === cat.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-white dark:bg-[#10141D] text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Search and Count Panel -->
          <div class="flex items-center gap-4 justify-between md:justify-end shrink-0">
            <!-- Result count -->
            <span class="text-xs font-medium text-slate-500 dark:text-slate-400">
              พบ <strong class="text-blue-600 dark:text-blue-400 font-bold font-mono">{{ filteredProjects.length }}</strong> ผลงาน
            </span>

            <!-- Search Input -->
            <div class="relative w-full max-w-[240px]">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="ค้นหาผลงาน, สถานที่..."
                class="w-full bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <!-- Clear Button -->
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

        </div>
      </div>
    </div>

    <!-- =========================================================================
         PROJECTS GALLERY GRID
         ========================================================================= -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <!-- Loading Skeleton -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div v-for="n in 6" :key="'skel-'+n" class="bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-sm animate-pulse flex flex-col">
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
      <div v-else-if="filteredProjects.length === 0" class="text-center py-20 bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">ไม่พบผลงานที่ต้องการค้นหา</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-6 font-light">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อดูผลงาน</p>
        <button
          @click="activeCategory = 'all'; searchQuery = ''"
          class="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-500/20"
        >
          แสดงผลงานทั้งหมด
        </button>
      </div>

      <!-- Projects Grid Content -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <router-link
          v-for="project in displayedProjects"
          :key="project.id"
          :to="`/projects/${project.slug || project.id}`"
          class="group bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-blue-500/40 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between"
        >
          <!-- Card Image Container -->
          <div>
            <div class="relative aspect-[16/10] overflow-hidden bg-slate-900">
              <img
                :src="getImageUrl(project.cover_image)"
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                @error="onImageError"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              
              <!-- Badges on top of Image -->
              <span class="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-900/80 text-blue-400 border border-blue-500/20 backdrop-blur-md">
                {{ project.category || 'ผลงาน' }}
              </span>
              
              <span v-if="project.location" class="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <svg class="w-3 h-3 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="truncate max-w-[90px]">{{ project.location }}</span>
              </span>
            </div>

            <!-- Card Body -->
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2 text-slate-400 text-[11px] font-medium">
                <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{{ formatDate(project.service_date || project.created_at) }}</span>
              </div>
              
              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 leading-snug mb-3">
                {{ project.title }}
              </h3>
              
              <!-- Linked Product Tag -->
              <div v-if="project.product_name" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/[0.04] text-xs text-slate-600 dark:text-slate-300 font-medium">
                <svg class="w-3.5 h-3.5 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span class="truncate">รุ่น: {{ project.product_name }}</span>
              </div>
            </div>
          </div>

          <!-- Card Footer Action -->
          <div class="px-6 pb-6 pt-2">
            <div class="pt-4 border-t border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>ดูรายละเอียดผลงาน</span>
              <svg class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore" class="flex justify-center mt-12">
        <button
          @click="showAll = true"
          class="inline-flex items-center gap-3 h-12 px-7 rounded-xl bg-white dark:bg-[#10141D] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200/80 dark:border-white/[0.08] shadow-md transition-all active:scale-95"
        >
          <span>ดูผลงานเพิ่มเติม</span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
            +{{ filteredProjects.length - 9 }}
          </span>
        </button>
      </div>

    </section>

    <!-- =========================================================================
         CTA BANNER (Start Your Installation Project)
         ========================================================================= -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      <div class="rounded-3xl p-8 sm:p-12 lg:p-14 bg-gradient-to-br from-[#0220A4] via-[#01166F] to-[#011055] text-white border border-white/[0.08] shadow-2xl relative overflow-hidden">
        
        <!-- Ambient Glows -->
        <div class="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div class="max-w-2xl">
            <div class="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>PROFESSIONAL MACHINERY SERVICE</span>
            </div>

            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              สนใจติดตั้งเครื่องตัดปอกสายไฟ KODERA ในโรงงานของคุณ?
            </h2>
            <p class="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-light">
              ติดต่อทีมวิศวกรและฝ่ายบริการลูกค้า เพื่อทดสอบชิ้นงานตัวอย่าง (Wire Sample Test) และรับใบเสนอราคาอย่างเป็นทางการ
            </p>
          </div>

          <!-- Standard CTA Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <router-link 
              to="/quotation" 
              class="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-white hover:bg-slate-100 text-[#0220A4] font-bold text-sm shadow-lg shadow-black/10 transition-all duration-200 active:scale-95 min-w-[160px]"
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
              <span>ปรึกษาทาง LINE</span>
            </a>
          </div>

        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* Scrollbar hide */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
