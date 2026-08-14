<script setup>
import { ref, onMounted, computed } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const projects = ref([])
const loading   = ref(true)
const showAll   = ref(false)

/* ── Categories ── */
const CATS = [
  { key: 'all',                        label: 'ทั้งหมด' },
  { key: 'บ้านเก็บของ',                label: 'บ้านเก็บของ' },
  { key: 'โรงจอดรถ',                   label: 'โรงจอดรถ' },
  { key: 'ตู้และกล่องเก็บของกลางแจ้ง', label: 'ตู้และกล่องเก็บของกลางแจ้ง' },
  { key: 'กล่องเก็บเครื่องมือย่อย',    label: 'กล่องเก็บเครื่องมือย่อย' },
  { key: 'อื่นๆ',                      label: 'อื่นๆ' },
]

/* ── State ── */
const activeCategory = ref('all')
const searchQuery    = ref('')

/* ── Fetch ── */
const fetchProjects = async () => {
  loading.value = true
  try {
    const res  = await fetch('/api/projects/published')
    const data = await res.json()
    if (data.success) projects.value = data.data
  } catch (e) {
    console.error(e)
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
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      (p.title    && p.title.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q))
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
  if (typeof l === 'string') return `https://line.me/ti/p/~${l}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value}` : '/contact')
})

/* ── Lifecycle ── */
onMounted(async () => {
  setMeta({
    title: 'ผลงานการติดตั้งที่ผ่านๆ มา',
    description: settingsStore.storeDescription || 'ชมตัวอย่างผลงานการติดตั้งสินค้าคุณภาพจากลูกค้าทั่วประเทศ',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "ผลงานติดตั้ง", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')

  await fetchProjects()
})

const getImageUrl = (path) => {
  if (!path) return 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200'
  if (path.startsWith('http')) return path
  return getOptimizedImageUrl(`${import.meta.env.VITE_API_URL || ''}${path}`, 600)
}

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
  <div class="projects-page min-h-screen pb-20">

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
              <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">PORTFOLIO</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              ผลงานการติดตั้งจริง
            </h1>
            <p class="mt-3 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
              {{ settingsStore.storeDescription || 'ภาพผลงานการส่งมอบและติดตั้งสินค้าคุณภาพจากลูกค้าทั่วประเทศ การันตีความสวยงามและมาตรฐานความทนทาน' }}
            </p>
          </div>

          <!-- Stats Strip -->
          <div class="flex items-center justify-center md:justify-end gap-6 sm:gap-8 bg-slate-900/40 border border-white/5 backdrop-blur-md px-6 py-4 rounded-2xl self-center md:self-auto">
            <div class="text-center">
              <p class="text-xl sm:text-2xl font-black text-white tabular-nums">10,000+</p>
              <p class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">งานติดตั้ง</p>
            </div>
            <div class="w-px h-8 bg-white/10"></div>
            <div class="text-center">
              <p class="text-xl sm:text-2xl font-black text-white tabular-nums">100%</p>
              <p class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">ความพึงพอใจ</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════
         STICKY FILTER & SEARCH BAR (Unified Controls)
    ══════════════════════════════════════════════ -->
    <div class="sticky-controls sticky z-30 transition-all duration-300">
      <div class="w-full border-b border-slate-200/80 dark:border-white/[0.05] bg-[#faf9f6]/90 dark:bg-[#080b10]/90 backdrop-blur-md py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            <!-- Category Pills (Horizontal scrollable) -->
            <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 -my-1 -mx-4 px-4 md:mx-0 md:px-0 flex-1">
              <button
                v-for="cat in catsWithData"
                :key="cat.key"
                @click="activeCategory = cat.key; showAll = false"
                :class="[
                  'px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap border',
                  activeCategory === cat.key
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-white/40 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                ]"
              >
                {{ cat.label }}
              </button>
            </div>

            <!-- Search and Count Panel -->
            <div class="flex items-center gap-3 justify-between md:justify-end flex-shrink-0">
              <!-- Result count -->
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                พบ <strong class="text-emerald-500 font-bold dark:text-emerald-400">{{ filteredProjects.length }}</strong> ผลงาน
              </span>

              <!-- Search Input Capsule -->
              <div class="relative w-full max-w-[240px]">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </span>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="ค้นหาผลงาน..."
                  class="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200"
                />
                <!-- Clear Button if search query exists -->
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''"
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
    </div>

    <!-- ══════════════════════════════════════════════
         PROJECTS GRID
    ══════════════════════════════════════════════ -->
    <section class="px-4 sm:px-6 lg:px-8 py-10">
      <div class="max-w-7xl mx-auto">

        <!-- Loading Skeleton -->
        <div v-if="loading" class="projects-grid">
          <div v-for="n in 6" :key="n"
            class="flex flex-col bg-white/5 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.04] rounded-2xl overflow-hidden aspect-[4/3] animate-pulse"
          >
            <div class="aspect-[16/10] bg-slate-200 dark:bg-slate-800"></div>
            <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div class="space-y-2">
                <div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              </div>
              <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredProjects.length === 0" class="text-center py-20 bg-slate-900/10 dark:bg-slate-900/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-8 max-w-lg mx-auto">
          <div class="w-16 h-16 empty-icon-box rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <h3 class="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">ไม่พบผลงานที่ต้องการค้นหา</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mb-6">ลองใช้คำค้นหาอื่น หรือเคลียร์ฟิลเตอร์เพื่อดูผลงานทั้งหมด</p>
          <button
            @click="activeCategory = 'all'; searchQuery = ''"
            class="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-full transition-colors"
          >
            แสดงผลงานทั้งหมด
          </button>
        </div>

        <!-- Projects Grid content -->
        <div v-else class="projects-grid">
          <router-link
            v-for="project in displayedProjects"
            :key="project.id"
            :to="`/projects/${project.slug || project.id}`"
            class="project-card group"
          >
            <!-- Card Image -->
            <div class="card-image-wrapper">
              <img
                :src="getImageUrl(project.cover_image)"
                :alt="project.title"
                class="card-img"
                @error="onImageError"
              />
              <div class="card-overlay"></div>
              
              <!-- Badges on top of Image -->
              <span class="card-badge-cat">
                {{ project.category || 'ผลงาน' }}
              </span>
              
              <span v-if="project.location" class="card-badge-loc">
                <svg class="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="truncate max-w-[80px]">{{ project.location }}</span>
              </span>
            </div>

            <!-- Card Content -->
            <div class="card-body">
              <div class="card-meta">
                <span class="card-date">{{ formatDate(project.created_at) }}</span>
              </div>
              
              <h3 class="card-title">
                {{ project.title }}
              </h3>
              
              <!-- Linked Product details -->
              <div v-if="project.product_name" class="card-product-tag">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <span class="truncate">รุ่น: {{ project.product_name }}</span>
              </div>
              
              <!-- Footer border and action -->
              <div class="card-footer">
                <span class="card-action-text">ดูรายละเอียดผลงาน</span>
                <svg class="card-action-arrow w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
            class="load-more-btn inline-flex items-center gap-3 px-6 py-3.5 rounded-full font-bold text-xs transition-all active:scale-95"
          >
            <span>ดูผลงานเพิ่มเติม</span>
            <span class="load-more-count px-2.5 py-0.5 rounded-full text-[10px] font-black tabular-nums">
              +{{ filteredProjects.length - 9 }}
            </span>
          </button>
        </div>

      </div>
    </section>

    <!-- ══════════════════════════════════════════════
         CTA SECTION
    ══════════════════════════════════════════════ -->
    <section class="px-4 sm:px-6 lg:px-8 mt-12">
      <div class="max-w-7xl mx-auto">
        <div class="cta-card relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-14">
          <!-- Glowing blobs -->
          <div class="absolute -top-12 -right-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <!-- Grid lines -->
          <div class="absolute inset-0 opacity-[0.08] pointer-events-none"
            style="background-image: linear-gradient(rgba(240,113,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(240,113,0,0.12) 1px, transparent 1px); background-size: 48px 48px;">
          </div>

          <div class="relative z-10 max-w-2xl text-center md:text-left">
            <!-- Badge -->
            <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">สนใจติดตั้ง?</span>
            </div>

            <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
              พร้อมเป็นส่วนหนึ่งในบ้านคุณ
            </h2>
            <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
              ติดต่อขอประเมินหน้างานและรับคำแนะนำจากวิศวกรผู้เชี่ยวชาญ พร้อมประเมินราคาฟรีไม่มีค่าใช้จ่าย
            </p>

            <div class="flex flex-wrap justify-center md:justify-start gap-3">
              <a
                :href="lineHref"
                target="_blank"
                rel="noopener"
                class="cta-primary-btn inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs active:scale-95"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                ปรึกษาทาง LINE
              </a>
              <a
                :href="phoneHref"
                class="cta-secondary-btn inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs active:scale-95"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                โทรสอบถามข้อมูล
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ─── Page Base ─── */
.projects-page {
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

/* ─── Grid ─── */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 24px;
}
@media (min-width: 640px) {
  .projects-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 28px;
  }
}
@media (min-width: 1024px) {
  .projects-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 32px;
  }
}

/* ─── Project Card ─── */
.project-card {
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

.project-card:hover {
  transform: translateY(-5px);
  border-color: rgba(240, 113, 0, 0.3); /* Brand Accent Color */
  box-shadow: 0 20px 40px -15px rgba(240, 113, 0, 0.08), 0 0 0 1px rgba(240, 113, 0, 0.2);
}

/* Card Image Wrapper */
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

.project-card:hover .card-img {
  transform: scale(1.05);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(8, 11, 16, 0.4) 0%, rgba(8, 11, 16, 0) 50%);
  pointer-events: none;
}

/* Badges */
.card-badge-cat {
  position: absolute;
  top: 14px;
  left: 14px;
  background-color: rgba(12, 14, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
}

.card-badge-loc {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(12, 14, 20, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  font-size: 10px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 9999px;
}

.project-card:hover .card-badge-cat {
  background-color: rgba(2, 32, 164, 0.15);
  border-color: rgba(2, 32, 164, 0.3);
  color: #2B4FD4;
}

/* Card Body */
.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-meta {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.card-date {
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  color: #f1f5f9;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s ease;
}

.project-card:hover .card-title {
  color: #2B4FD4;
}

/* Product Tag inside Card */
.card-product-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  margin-top: auto;
  margin-bottom: 4px;
}

/* Card Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 14px;
  margin-top: 16px;
}

.card-action-text {
  font-size: 12px;
  font-weight: 700;
  color: #2B4FD4;
  transition: color 0.3s ease;
}

.card-action-arrow {
  color: #2B4FD4;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.project-card:hover .card-action-arrow {
  transform: translateX(4px);
}

.project-card:hover .card-action-text {
  color: #ffa552;
}

/* ─── Load More ─── */
.load-more-btn {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.3s ease;
}

.load-more-btn:hover {
  background-color: rgba(255, 255, 255, 0.06);
  border-color: rgba(2, 32, 164, 0.25);
  color: #f1f5f9;
}

.load-more-count {
  background-color: rgba(2, 32, 164, 0.1);
  color: #2B4FD4;
}

/* ─── Empty State ─── */
.empty-icon-box {
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #475569;
}

/* ─── CTA Section ─── */
.cta-card {
  background: linear-gradient(135deg, rgba(2, 32, 164, 0.2) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(2, 32, 164, 0.15);
}

.cta-primary-btn {
  background-color: #0220A4;
  color: #fff;
  box-shadow: 0 8px 24px -4px rgba(2, 32, 164, 0.35);
  transition: all 0.3s ease;
}
.cta-primary-btn:hover {
  background-color: #01166F;
  box-shadow: 0 12px 28px -4px rgba(2, 32, 164, 0.45);
}

.cta-secondary-btn {
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  transition: all 0.3s ease;
}
.cta-secondary-btn:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
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

html:not(.dark) .projects-page {
  background-color: #F8F9FC;
  color: #1e293b;
}

html:not(.dark) .projects-page .sticky-controls > div {
  background-color: rgba(248, 249, 252, 0.9);
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

/* Project Card Light Mode */
html:not(.dark) .projects-page .project-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
}

html:not(.dark) .projects-page .project-card:hover {
  border-color: rgba(2, 32, 164, 0.3);
  box-shadow: 0 16px 36px -12px rgba(2, 32, 164, 0.08), 0 0 0 1px rgba(2, 32, 164, 0.15);
}

html:not(.dark) .projects-page .card-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 50%);
}

html:not(.dark) .projects-page .card-badge-cat,
html:not(.dark) .projects-page .card-badge-loc {
  background-color: rgba(255, 255, 255, 0.85);
  border-color: rgba(0, 0, 0, 0.05);
  color: #334155;
}

html:not(.dark) .projects-page .project-card:hover .card-badge-cat {
  background-color: rgba(2, 32, 164, 0.08);
  border-color: rgba(2, 32, 164, 0.2);
  color: #01166F;
}

html:not(.dark) .projects-page .card-date {
  color: #64748b;
}

html:not(.dark) .projects-page .card-title {
  color: #1e293b;
}

html:not(.dark) .projects-page .project-card:hover .card-title {
  color: #01166F;
}

html:not(.dark) .projects-page .card-product-tag {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #475569;
}

html:not(.dark) .projects-page .card-footer {
  border-top-color: rgba(0, 0, 0, 0.05);
}

html:not(.dark) .projects-page .card-action-text,
html:not(.dark) .projects-page .card-action-arrow {
  color: #01166F;
}

html:not(.dark) .projects-page .project-card:hover .card-action-text {
  color: #0220A4;
}

/* Load More Light Mode */
html:not(.dark) .projects-page .load-more-btn {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  color: #64748b;
}

html:not(.dark) .projects-page .load-more-btn:hover {
  background-color: rgba(2, 32, 164, 0.04);
  border-color: rgba(2, 32, 164, 0.2);
  color: #1e293b;
}

html:not(.dark) .projects-page .load-more-count {
  background-color: rgba(2, 32, 164, 0.08);
  color: #01166F;
}

/* Empty State Light Mode */
html:not(.dark) .projects-page .empty-icon-box {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  color: #94a3b8;
}

/* CTA Card Light Mode */
html:not(.dark) .projects-page .cta-card {
  background: linear-gradient(135deg, rgba(255, 245, 235, 0.8) 0%, #ffffff 50%, #ffffff 100%);
  border-color: rgba(240, 113, 0, 0.15);
  box-shadow: 0 10px 40px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .projects-page .cta-card h2 {
  color: #0f172a;
}

html:not(.dark) .projects-page .cta-card p {
  color: #475569;
}

html:not(.dark) .projects-page .cta-secondary-btn {
  background-color: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #475569;
}
html:not(.dark) .projects-page .cta-secondary-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
  color: #0f172a;
}
</style>
