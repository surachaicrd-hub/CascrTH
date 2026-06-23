<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../utils/apiFetch'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()

const project = ref(null)
const loading = ref(true)

// For recommendations
const recommendedProducts = ref([])
const recommendedArticles = ref([])

// Scroll state for reveal animations
const setupScrollObserver = () => {
  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.06 })

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el)
    })
  }, 600)
}

// Utility to transform oembed to iframe (YouTube embed helper)
const transformOembed = (html) => {
  if (!html) return html;
  
  const buildYouTubeEmbed = (videoId) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div></div>`;
  };

  const extractYouTubeId = (url) => {
    if (url.startsWith('www.')) url = 'https://' + url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    return ytMatch ? ytMatch[1] : null;
  };

  let result = html.replace(/<figure\s+class="media">\s*<oembed\s+url="([^"]+)">\s*<\/oembed>\s*<\/figure>/gi, (match, url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) return buildYouTubeEmbed(videoId);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div></div>`;
  });

  result = result.replace(/<oembed\s+url="([^"]+)"><\/oembed>/gi, (match, url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) return buildYouTubeEmbed(videoId);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div></div>`;
  });

  result = result.replace(/<figure\s+class="media">\s*(<iframe[^>]*?>[\s\S]*?<\/iframe>)\s*<\/figure>/gi, (match, iframeTag) => {
    const ytMatch = iframeTag.match(/src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"/i);
    if (ytMatch) return buildYouTubeEmbed(ytMatch[1]);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner">${iframeTag}</div></div>`;
  });

  result = result.replace(/<iframe([^>]*?)src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"([^>]*?)>(\s*<\/iframe>)?/gi, (match, before, videoId, params, after) => {
    return buildYouTubeEmbed(videoId);
  });

  return result;
};

const fetchProjectDetail = async () => {
  try {
    const param = route.params.slug
    const res = await fetch(`/api/projects/${param}`)
    const data = await res.json()
    if (data.success) {
      project.value = data.data
      
      // Redirect numeric ID to slug URL if slug is available
      if (/^\d+$/.test(param) && project.value.slug) {
        router.replace(`/projects/${project.value.slug}`)
        return
      }
      
      if (project.value.content_rich) {
        project.value.content_rich = transformOembed(project.value.content_rich)
      } else if (project.value.description) {
        project.value.description = transformOembed(project.value.description)
      }
    }
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    loading.value = false
  }
}

const fetchRecommended = async () => {
  try {
    const prodRes = await fetch('/api/products?limit=4&is_active=true')
    const prodData = await prodRes.json()
    if (prodData.success) {
      const excludeId = project.value?.product_id || null
      recommendedProducts.value = prodData.data.filter(p => p.id !== excludeId).slice(0, 4)
    }
    const artRes = await fetch('/api/articles?limit=3&status=published')
    const artData = await artRes.json()
    if (artData.success) {
      recommendedArticles.value = artData.data
    }
  } catch (e) {
    console.error('Failed to fetch recommendations', e)
  }
}

// Contacts Hrefs from Settings Store
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
  await fetchProjectDetail()
  fetchRecommended()
  window.addEventListener('keydown', handleKeydown)
  setupScrollObserver()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

const getImageUrl = (path, width) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const fullUrl = `${import.meta.env.VITE_API_URL || ''}${path}`
  return width ? getOptimizedImageUrl(fullUrl, width) : fullUrl
}

const getProductImage = (prod) => {
  if (!prod) return '';
  if (prod.image_url) return getImageUrl(prod.image_url, 400);
  if (prod.images) {
    try {
      const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getImageUrl(parsed[0], 400);
      }
    } catch (e) {}
  }
  return '';
}

/* ── Lightbox Viewer ── */
const isLightboxOpen = ref(false)
const currentImageIndex = ref(0)

const openLightbox = (index) => {
  currentImageIndex.value = index
  isLightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  document.body.style.overflow = ''
}

const nextImage = () => {
  if (project.value?.gallery_images) {
    currentImageIndex.value = (currentImageIndex.value + 1) % project.value.gallery_images.length
  }
}

const prevImage = () => {
  if (project.value?.gallery_images) {
    currentImageIndex.value = (currentImageIndex.value - 1 + project.value.gallery_images.length) % project.value.gallery_images.length
  }
}

const handleKeydown = (e) => {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

const formatPrice = (price) => {
  if (!price) return '0'
  return parseFloat(price).toLocaleString('th-TH')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <div class="pd-root">

    <!-- ═══════════════════════════════════════════
         LOADING STATE
    ═══════════════════════════════════════════ -->
    <div v-if="loading" class="pd-loading">
      <div class="pd-loading__ring"></div>
      <p class="pd-loading__text">กำลังโหลดผลงาน<span class="pd-loading__dots">...</span></p>
    </div>

    <!-- ═══════════════════════════════════════════
         NOT FOUND
    ═══════════════════════════════════════════ -->
    <div v-else-if="!project" class="pd-not-found">
      <div class="pd-not-found__glyph">404</div>
      <h2>ไม่พบผลงานที่ต้องการ</h2>
      <p>ผลงานนี้อาจถูกลบออกหรือไม่มีอยู่ในระบบ</p>
      <router-link to="/projects" class="pd-btn-primary">← กลับหน้ารวมผลงาน</router-link>
    </div>

    <!-- ═══════════════════════════════════════════
         MAIN CONTENT
    ═══════════════════════════════════════════ -->
    <template v-else>
      
      <!-- ══ COMPACT SPLIT HEADER SECTION ══ -->
      <header class="pd-header-split relative overflow-hidden pt-28 pb-12 bg-[#080b10] border-b border-white/[0.03]">
        <div class="absolute inset-0 opacity-[0.02] pointer-events-none"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 30px 30px;">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#080b10] via-[#090e15]/90 to-[#080b10] pointer-events-none"></div>

        <!-- Glowing blobs for premium feel -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Breadcrumb navigation -->
          <nav class="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
            <router-link to="/" class="hover:text-emerald-400 transition-colors">หน้าแรก</router-link>
            <span class="text-slate-600">/</span>
            <router-link to="/projects" class="hover:text-emerald-400 transition-colors">ผลงาน</router-link>
            <span class="text-slate-600">/</span>
            <span class="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{{ project.title }}</span>
          </nav>

          <!-- Split Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <!-- Left Info Panel -->
            <div class="lg:col-span-7">
              <div v-if="project.category" class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-emerald-400 text-[10px] font-bold tracking-wider uppercase">{{ project.category }}</span>
              </div>

              <h1 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight mt-4">
                {{ project.title }}
              </h1>

              <!-- Stats / Metadata Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8">
                <!-- Location -->
                <div v-if="project.location" class="flex items-center gap-3 bg-slate-900/55 dark:bg-slate-900/30 border border-white/5 p-4 rounded-xl">
                  <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">สถานที่</p>
                    <p class="text-sm font-semibold text-slate-200 mt-1 truncate">{{ project.location }}</p>
                  </div>
                </div>

                <!-- Date -->
                <div v-if="project.service_date" class="flex items-center gap-3 bg-slate-900/55 dark:bg-slate-900/30 border border-white/5 p-4 rounded-xl">
                  <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">วันที่ติดตั้ง</p>
                    <p class="text-sm font-semibold text-slate-200 mt-1 truncate">{{ formatDate(project.service_date) }}</p>
                  </div>
                </div>

                <!-- Area -->
                <div v-if="project.area" class="flex items-center gap-3 bg-slate-900/55 dark:bg-slate-900/30 border border-white/5 p-4 rounded-xl">
                  <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/>
                    </svg>
                  </div>
                  <div class="overflow-hidden">
                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">พื้นที่ใช้สอย</p>
                    <p class="text-sm font-semibold text-slate-200 mt-1 truncate">{{ project.area }} ตร.ม.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Cover Image Panel -->
            <div class="lg:col-span-5">
              <div 
                @click="openLightbox(0)"
                class="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950 cursor-pointer group"
              >
                <img 
                  :src="getImageUrl(project.cover_image, 800)" 
                  :alt="project.title" 
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  @error="onImageError"
                />
                <div class="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300"></div>
                <!-- Zoom glass badge -->
                <div class="absolute bottom-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <!-- ══ TWO-COLUMN CONTENT + SIDEBAR LAYOUT ══ -->
      <div class="pd-body max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Left Column (Rich Content & Gallery) -->
          <div class="lg:col-span-8 space-y-12">
            
            <!-- CKEditor rich text body -->
            <article class="pd-content-section reveal">
              <div class="pd-content-body ck-content" v-html="project.content_rich || project.description"></div>
            </article>

            <!-- Image Gallery Grid -->
            <section v-if="project.gallery_images && project.gallery_images.length > 0" class="pd-gallery-section reveal border-t border-slate-200/50 dark:border-white/[0.04] pt-10">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-2.5">
                  <span class="w-2.5 h-1 bg-emerald-500 rounded-full"></span>
                  <h2 class="text-lg font-black text-white dark:text-white uppercase tracking-wider">ภาพบรรยากาศการติดตั้ง</h2>
                </div>
                <span class="text-xs text-slate-500 font-bold tabular-nums bg-slate-900/30 border border-white/5 px-3 py-1 rounded-full">
                  {{ project.gallery_images.length }} รูปภาพ
                </span>
              </div>

              <!-- High density uniform grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                <div
                  v-for="(img, idx) in project.gallery_images"
                  :key="idx"
                  @click="openLightbox(idx)"
                  class="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group bg-slate-900 border border-white/5 shadow-md"
                >
                  <img 
                    :src="getImageUrl(img, 600)" 
                    :alt="`รูปที่ ${idx + 1}`" 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy" 
                    @error="onImageError"
                  />
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-emerald-950/20 transition-all duration-300 flex items-center justify-center">
                    <div class="w-8 h-8 rounded-full bg-slate-950/85 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 shadow-lg">
                      <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>

          <!-- Right Column (Sticky Sidebar) -->
          <div class="lg:col-span-4">
            <aside class="lg:sticky lg:top-[140px] space-y-6">
              
              <!-- Sticky Product Card -->
              <div v-if="project.product" class="sidebar-card bg-slate-900/60 dark:bg-slate-900/40 border border-white/5 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <!-- Glowing corner accent -->
                <div class="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <h4 class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none">สินค้าที่ใช้ในโครงการ</h4>
                
                <div class="relative aspect-[4/3] rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-100 dark:border-white/5 p-3 flex items-center justify-center overflow-hidden mb-4 shadow-inner">
                  <img 
                    :src="getProductImage(project.product)" 
                    :alt="project.product.name" 
                    class="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                    @error="onImageError"
                  />
                </div>

                <p v-if="project.product.category" class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">{{ project.product.category }}</p>
                <h3 class="text-base font-extrabold text-white dark:text-white leading-snug line-clamp-2 hover:text-emerald-400 transition-colors">
                  <router-link :to="'/products/' + (project.product.slug || project.product.id)">{{ project.product.name }}</router-link>
                </h3>
                <p v-if="project.product.short_description || project.product.seo_description" class="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {{ project.product.short_description || project.product.seo_description }}
                </p>

                <!-- Prices -->
                <div class="flex items-baseline gap-2.5 mt-4">
                  <template v-if="project.product.price && project.product.price > 0">
                    <span class="text-xl font-black text-emerald-400">฿{{ formatPrice(project.product.price) }}</span>
                    <span v-if="project.product.original_price && project.product.original_price > project.product.price" class="text-xs text-slate-500 line-through">
                      ฿{{ formatPrice(project.product.original_price) }}
                    </span>
                    <span v-if="project.product.original_price && project.product.original_price > project.product.price" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ลด {{ Math.round((1 - project.product.price / project.product.original_price) * 100) }}%
                    </span>
                  </template>
                  <span v-else class="text-base font-semibold text-slate-400">สอบถามราคาพิเศษ</span>
                </div>

                <!-- Action Button links -->
                <div class="grid grid-cols-1 gap-2 mt-5">
                  <router-link 
                    :to="'/products/' + (project.product.slug || project.product.id)"
                    class="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs text-center transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    ดูรายละเอียดสินค้า
                  </router-link>
                  <router-link 
                    to="/quotation"
                    class="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs text-center transition-all active:scale-95"
                  >
                    ขอใบเสนอราคางานติดตั้ง
                  </router-link>
                </div>
              </div>

              <!-- Inline Contact Widget -->
              <div class="sidebar-card bg-slate-900/60 dark:bg-slate-900/40 border border-emerald-500/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <h4 class="text-base font-black text-white mb-1.5 leading-snug">สนใจงานติดตั้งแบบนี้?</h4>
                <p class="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4">
                  ติดต่อทีมงานผู้เชี่ยวชาญเพื่อประเมินหน้างานฟรี และวางแผนงบประมาณสำหรับคุณ
                </p>
                <div class="grid grid-cols-2 gap-2">
                  <a
                    :href="lineHref"
                    target="_blank"
                    rel="noopener"
                    class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-extrabold text-xs transition-colors"
                  >
                    แชท LINE
                  </a>
                  <a
                    :href="phoneHref"
                    class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors"
                  >
                    โทรหาเรา
                  </a>
                </div>
              </div>

            </aside>
          </div>

        </div>
      </div>

      <!-- ═══════════════════════════════════════════
           RECOMMENDED PRODUCTS
      ═══════════════════════════════════════════ -->
      <section v-if="recommendedProducts.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200/50 dark:border-white/[0.04] reveal">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-1 bg-emerald-500 rounded-full"></span>
            <h2 class="text-lg font-black text-white dark:text-white uppercase tracking-wider">สินค้าอื่นที่เกี่ยวข้อง</h2>
          </div>
          <router-link to="/products" class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            <span>ดูทั้งหมด</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>

        <!-- 4-column product grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <router-link
            v-for="prod in recommendedProducts"
            :key="prod.id"
            :to="prod.slug ? `/products/${prod.slug}` : `/products/${prod.id}`"
            class="prod-card group bg-slate-900/40 border border-white/5 rounded-2xl p-4 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div>
              <div class="aspect-square rounded-xl bg-white dark:bg-slate-950 p-2.5 mb-4 flex items-center justify-center relative overflow-hidden">
                <img 
                  :src="getProductImage(prod)" 
                  :alt="prod.name" 
                  class="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105" 
                  loading="lazy"
                />
                <div v-if="prod.discount_percent > 0" class="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase leading-none shadow">
                  -{{ prod.discount_percent }}%
                </div>
              </div>
              <p v-if="prod.category" class="text-[9px] font-bold text-slate-500 uppercase tracking-wide leading-none mb-1">{{ prod.category }}</p>
              <h3 class="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                {{ prod.name }}
              </h3>
            </div>

            <!-- Price and Action Arrow -->
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.03]">
              <div class="flex flex-col">
                <span v-if="prod.original_price > prod.price" class="text-[9px] text-slate-500 line-through">฿{{ formatPrice(prod.original_price) }}</span>
                <span class="text-sm font-black text-emerald-400">฿{{ formatPrice(prod.price) }}</span>
              </div>
              <div class="w-7 h-7 rounded-full bg-white/5 border border-white/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════
           RECOMMENDED ARTICLES
      ═══════════════════════════════════════════ -->
      <section v-if="recommendedArticles.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-200/50 dark:border-white/[0.04] reveal">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-1 bg-emerald-500 rounded-full"></span>
            <h2 class="text-lg font-black text-white dark:text-white uppercase tracking-wider">บทความน่าอ่าน</h2>
          </div>
          <router-link to="/blog" class="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
            <span>อ่านทั้งหมด</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </router-link>
        </div>

        <!-- 3-column article grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <router-link
            v-for="article in recommendedArticles"
            :key="article.id"
            :to="article.slug ? `/blog/${article.slug}` : `/blog/${article.id}`"
            class="article-card group bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5"
          >
            <div>
              <div class="aspect-[16/10] overflow-hidden bg-slate-950 relative">
                <img 
                  v-if="article.cover_image" 
                  :src="getImageUrl(article.cover_image, 600)" 
                  :alt="article.title" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103" 
                  loading="lazy"
                  @error="onImageError"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <span v-if="article.category" class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-white/10 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-none shadow">
                  {{ article.category }}
                </span>
              </div>
              <div class="p-4.5">
                <time class="block text-[10px] text-slate-500 font-semibold mb-1.5">{{ formatDate(article.published_at || article.created_at) }}</time>
                <h3 class="text-sm font-extrabold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                  {{ article.title }}
                </h3>
                <p v-if="article.excerpt" class="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {{ article.excerpt }}
                </p>
              </div>
            </div>
            
            <div class="px-4.5 pb-4.5 pt-2">
              <span class="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <span>อ่านรายละเอียด</span>
                <svg class="w-3.5 h-3.5 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </router-link>
        </div>
      </section>

      <!-- ══ BOTTOM CTA SECTION ══ -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 reveal">
        <div class="cta-card relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-14">
          <!-- Glowing blobs -->
          <div class="absolute -top-12 -right-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <!-- Grid lines -->
          <div class="absolute inset-0 opacity-[0.08] pointer-events-none"
            style="background-image: linear-gradient(rgba(240,113,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(240,113,0,0.12) 1px, transparent 1px); background-size: 48px 48px;">
          </div>

          <div class="relative z-10 max-w-2xl text-center md:text-left">
            <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">ติดต่อทีมงาน</span>
            </div>
            
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight tracking-tight">
              อยากได้งานติดตั้งผลงานในฝันแบบนี้?
            </h2>
            <p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-md mx-auto md:mx-0">
              ให้คำปรึกษาฟรีเกี่ยวกับงานเตรียมพื้นที่ การเลือกรุ่นสินค้า ขนาดของโรงเรือน และการประเมินราคา
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
                ปรึกษาผ่าน LINE
              </a>
              <a
                :href="phoneHref"
                class="cta-secondary-btn inline-flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs active:scale-95"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                โทรหาเจ้าหน้าที่
              </a>
            </div>
          </div>
        </div>
      </section>

    </template>

    <!-- ═══════════════════════════════════════════
         LIGHTBOX (Cinematic Backdrop)
    ═══════════════════════════════════════════ -->
    <teleport to="body">
      <transition name="lb">
        <div v-if="isLightboxOpen" class="pd-lightbox" @click="closeLightbox">
          <!-- Close Button -->
          <button class="pd-lb-close" @click.stop="closeLightbox" aria-label="ปิด">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <!-- Prev Arrow -->
          <button class="pd-lb-nav pd-lb-nav--prev" @click.stop="prevImage" aria-label="ก่อนหน้า">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <!-- Stage Display Image -->
          <div class="pd-lb-stage" @click.stop>
            <transition name="lb-img" mode="out-in">
              <img :src="getImageUrl(project.gallery_images[currentImageIndex], 1200)" :key="currentImageIndex" class="pd-lb-img" @error="onImageError" />
            </transition>
          </div>

          <!-- Next Arrow -->
          <button class="pd-lb-nav pd-lb-nav--next" @click.stop="nextImage" aria-label="ถัดไป">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <!-- Lightbox Footer -->
          <div class="pd-lb-footer" @click.stop>
            <span class="pd-lb-counter">{{ currentImageIndex + 1 }} / {{ project.gallery_images.length }}</span>
            <div class="pd-lb-dots">
              <button
                v-for="(_, i) in project.gallery_images"
                :key="i"
                class="pd-lb-dot"
                :class="{ 'pd-lb-dot--active': i === currentImageIndex }"
                @click="currentImageIndex = i"
              ></button>
            </div>
          </div>

          <!-- Mobile Swipe Zones -->
          <div class="pd-lb-swipe pd-lb-swipe--left" @click.stop="prevImage"></div>
          <div class="pd-lb-swipe pd-lb-swipe--right" @click.stop="nextImage"></div>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<style scoped>
/* ─── Page Base ─── */
.pd-root {
  min-height: 100vh;
  background-color: #0c0e14;
  color: #f8fafc;
}

/* ─── Loading State ─── */
.pd-loading {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background-color: #0c0e14;
}

.pd-loading__ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(240, 113, 0, 0.15);
  border-top-color: #f07100;
  animation: pd-spin 1s linear infinite;
}

@keyframes pd-spin {
  to { transform: rotate(360deg); }
}

.pd-loading__text {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.05em;
}

.pd-loading__dots {
  animation: pd-blink 1.4s infinite;
}

@keyframes pd-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* ─── Not Found ─── */
.pd-not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  padding: 32px;
}

.pd-not-found__glyph {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #f07100, #ff8a24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.25;
}

.pd-not-found h2 {
  font-size: 20px;
  font-weight: 800;
  color: #f1f5f9;
}

.pd-not-found p {
  color: #64748b;
  font-size: 13px;
}

/* ─── Scroll entrance reveal animation ─── */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Sidebar Cards ─── */
.sidebar-card {
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
}

/* ─── Rich Content Styling Overrides (ck-content inside scoped) ─── */
.pd-content-body {
  font-size: 15px;
  line-height: 1.8;
  color: #cbd5e1;
}

.pd-content-body :deep(h2) {
  font-size: 24px;
  font-weight: 800;
  color: #f8fafc;
  margin: 36px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.pd-content-body :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 24px 0 12px;
}

.pd-content-body :deep(p) {
  margin-bottom: 16px;
}

.pd-content-body :deep(strong) {
  color: #ffffff;
  font-weight: 700;
}

.pd-content-body :deep(ul) {
  list-style-type: none;
  padding-left: 20px;
  margin-bottom: 20px;
}

.pd-content-body :deep(ul li) {
  position: relative;
  padding-left: 16px;
  margin-bottom: 8px;
  color: #cbd5e1;
}

.pd-content-body :deep(ul li::before) {
  content: '—';
  position: absolute;
  left: 0;
  color: #f07100;
  font-weight: 700;
}

.pd-content-body :deep(ol) {
  list-style-type: decimal;
  padding-left: 20px;
  margin-bottom: 20px;
}

.pd-content-body :deep(ol li) {
  margin-bottom: 8px;
  color: #cbd5e1;
}

.pd-content-body :deep(a) {
  color: #ff8a24;
  text-decoration: underline;
  text-underline-offset: 4px;
  transition: color 0.2s;
}

.pd-content-body :deep(a:hover) {
  color: #ffa552;
}

.pd-content-body :deep(blockquote) {
  border-left: 3px solid #f07100;
  background-color: rgba(240, 113, 0, 0.04);
  padding: 16px 20px;
  margin: 24px 0;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: #cbd5e1;
}

.pd-content-body :deep(hr) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(240, 113, 0, 0.2), transparent);
  margin: 32px 0;
}

.pd-content-body :deep(figure.image) {
  margin: 32px auto;
  text-align: center;
}

.pd-content-body :deep(figure.image img) {
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  max-width: 100%;
}

.pd-content-body :deep(figure.image figcaption) {
  font-size: 11px;
  color: #64748b;
  margin-top: 10px;
  font-style: italic;
}

/* Video embedded layouts */
.pd-content-body :deep(.yt-embed-wrapper) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  margin: 32px 0;
}

.pd-content-body :deep(.yt-embed-inner) {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
}

.pd-content-body :deep(.yt-embed-inner iframe) {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0;
}

.pd-content-body :deep(figure.media) {
  margin: 32px auto;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  padding-bottom: 56.25%;
  height: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.pd-content-body :deep(figure.media iframe) {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0;
}

/* Tables inside CKEditor */
.pd-content-body :deep(figure.table) {
  display: flex;
  margin: 32px auto;
  width: 100%;
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pd-content-body :deep(table) {
  width: 100% !important;
  border-collapse: collapse;
  font-size: 13px;
}

.pd-content-body :deep(table thead) {
  background: linear-gradient(135deg, #161a22, #1c212b);
}

.pd-content-body :deep(table thead th) {
  color: #ff8a24;
  font-weight: 700;
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid rgba(240, 113, 0, 0.15);
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.pd-content-body :deep(table tbody tr:nth-child(even)) {
  background-color: rgba(255, 255, 255, 0.01);
}

.pd-content-body :deep(table tbody tr:hover) {
  background-color: rgba(240, 113, 0, 0.03);
}

.pd-content-body :deep(table tbody td) {
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #cbd5e1;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .pd-content-body :deep(table) { display: block; overflow-x: auto; }
}

/* ─── CTA Cards ─── */
.cta-card {
  background: linear-gradient(135deg, rgba(77, 21, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(240, 113, 0, 0.15);
}

.cta-primary-btn {
  background-color: #f07100;
  color: #fff;
  box-shadow: 0 8px 24px -4px rgba(240, 113, 0, 0.35);
  transition: all 0.3s ease;
}
.cta-primary-btn:hover {
  background-color: #ff8a24;
  box-shadow: 0 12px 28px -4px rgba(240, 113, 0, 0.45);
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

/* ─── Lightbox Cinematic Styles ─── */
.pd-lightbox {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background-color: rgba(5, 6, 9, 0.98);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pd-lb-close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
}

.pd-lb-close:hover {
  background-color: rgba(240, 113, 0, 0.15);
  border-color: rgba(240, 113, 0, 0.4);
  color: #ff8a24;
  transform: scale(1.08) rotate(90deg);
}

.pd-lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;
}

.pd-lb-nav:hover {
  background-color: rgba(240, 113, 0, 0.15);
  border-color: rgba(240, 113, 0, 0.4);
  color: #ff8a24;
  transform: translateY(-50%) scale(1.08);
}

.pd-lb-nav--prev { left: 24px; }
.pd-lb-nav--next { right: 24px; }

@media (max-width: 640px) {
  .pd-lb-nav { display: none; }
}

.pd-lb-stage {
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pd-lb-img {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  user-select: none;
}

.pd-lb-footer {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}

.pd-lb-counter {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  background-color: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.pd-lb-dots {
  display: flex;
  gap: 6px;
  pointer-events: all;
}

.pd-lb-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.25);
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;
}

.pd-lb-dot--active {
  background-color: #f07100;
  transform: scale(1.4);
  box-shadow: 0 0 8px rgba(240, 113, 0, 0.6);
}

.pd-lb-swipe {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 35%;
  z-index: 5;
}

.pd-lb-swipe--left { left: 0; }
.pd-lb-swipe--right { right: 0; }

@media (min-width: 641px) {
  .pd-lb-swipe { display: none; }
}

/* Transitions */
.lb-enter-active, .lb-leave-active {
  transition: opacity 0.3s ease;
}

.lb-enter-from, .lb-leave-to {
  opacity: 0;
}

.lb-img-enter-active, .lb-img-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.lb-img-enter-from {
  opacity: 0;
  transform: scale(0.97);
}

.lb-img-leave-to {
  opacity: 0;
  transform: scale(1.03);
}
</style>

<style>
/* ══════════════════════════════════════════════
   LIGHT MODE OVERRIDES
══════════════════════════════════════════════ */

html:not(.dark) .pd-root {
  background-color: #f8fafc;
  color: #1e293b;
}

html:not(.dark) .pd-loading {
  background-color: #f8fafc;
}

html:not(.dark) .pd-not-found h2 {
  color: #0f172a;
}

html:not(.dark) .pd-header-split {
  background-color: #ffffff;
  border-bottom-color: rgba(0, 0, 0, 0.05);
}

html:not(.dark) .pd-header-split .absolute {
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px) !important;
}

html:not(.dark) .pd-header-split .bg-gradient-to-b {
  background: linear-gradient(to b, #ffffff 0%, #f8fafc 100%) !important;
}

html:not(.dark) .pd-header-split h1 {
  color: #0f172a;
}

html:not(.dark) .pd-header-split p {
  color: #475569;
}

/* Stats in Split Header */
html:not(.dark) .pd-header-split .bg-slate-900\/55,
html:not(.dark) .pd-header-split .bg-slate-900\/30 {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

html:not(.dark) .pd-header-split p.text-slate-200 {
  color: #1e293b;
}

html:not(.dark) .pd-header-split .text-emerald-400 {
  color: #d95f00;
}

html:not(.dark) .pd-header-split .bg-emerald-500\/10 {
  background-color: rgba(240, 113, 0, 0.08);
  border-color: rgba(240, 113, 0, 0.2);
}

/* Sidebar Product card Light Mode */
html:not(.dark) .sidebar-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06);
}

html:not(.dark) .sidebar-card h3 {
  color: #0f172a;
}

html:not(.dark) .sidebar-card h3 a {
  color: #0f172a;
}

html:not(.dark) .sidebar-card h3 a:hover {
  color: #d95f00;
}

html:not(.dark) .sidebar-card p {
  color: #475569;
}

html:not(.dark) .sidebar-card .text-xl.text-emerald-400 {
  color: #d95f00;
}

html:not(.dark) .sidebar-card .text-slate-500.line-through {
  color: #94a3b8;
}

html:not(.dark) .sidebar-card .bg-emerald-500\/10 {
  background-color: rgba(240, 113, 0, 0.08);
  border-color: rgba(240, 113, 0, 0.2);
  color: #d95f00;
}

html:not(.dark) .sidebar-card .bg-white\/5 {
  background-color: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #475569;
}
html:not(.dark) .sidebar-card .bg-white\/5:hover {
  background-color: rgba(0, 0, 0, 0.06);
  color: #0f172a;
}

html:not(.dark) .sidebar-card.border-emerald-500\/10 {
  border-color: rgba(240, 113, 0, 0.12);
}

html:not(.dark) .sidebar-card h4.text-white {
  color: #0f172a;
}

html:not(.dark) .sidebar-card .bg-emerald-500\/10.text-emerald-400 {
  background-color: rgba(240, 113, 0, 0.08);
  color: #d95f00;
}

/* Rich Content Light Mode */
html:not(.dark) .pd-content-body {
  color: #334155;
}

html:not(.dark) .pd-content-body :deep(h2) {
  color: #0f172a;
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

html:not(.dark) .pd-content-body :deep(h3) {
  color: #1e293b;
}

html:not(.dark) .pd-content-body :deep(strong) {
  color: #000000;
}

html:not(.dark) .pd-content-body :deep(ul li) {
  color: #334155;
}

html:not(.dark) .pd-content-body :deep(ul li::before) {
  color: #d95f00;
}

html:not(.dark) .pd-content-body :deep(ol li) {
  color: #334155;
}

html:not(.dark) .pd-content-body :deep(a) {
  color: #d95f00;
}

html:not(.dark) .pd-content-body :deep(a:hover) {
  color: #f07100;
}

html:not(.dark) .pd-content-body :deep(blockquote) {
  border-left-color: #d95f00;
  background-color: rgba(240, 113, 0, 0.03);
  color: #334155;
}

html:not(.dark) .pd-content-body :deep(hr) {
  background: linear-gradient(90deg, transparent, rgba(240, 113, 0, 0.15), transparent);
}

html:not(.dark) .pd-content-body :deep(figure.image img) {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

html:not(.dark) .pd-content-body :deep(figure.table) {
  border-color: rgba(0, 0, 0, 0.06);
}

html:not(.dark) .pd-content-body :deep(table thead) {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
}

html:not(.dark) .pd-content-body :deep(table thead th) {
  color: #d95f00;
  border-bottom-color: rgba(240, 113, 0, 0.12);
}

html:not(.dark) .pd-content-body :deep(table tbody tr:nth-child(even)) {
  background-color: rgba(0, 0, 0, 0.01);
}

html:not(.dark) .pd-content-body :deep(table tbody tr:hover) {
  background-color: rgba(240, 113, 0, 0.02);
}

html:not(.dark) .pd-content-body :deep(table tbody td) {
  border-bottom-color: rgba(0, 0, 0, 0.04);
  color: #334155;
}

/* Gallery Light Mode */
html:not(.dark) .pd-gallery-section h2 {
  color: #0f172a;
}

html:not(.dark) .pd-gallery-section span.text-slate-500 {
  color: #475569;
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
}

html:not(.dark) .pd-gallery-section .bg-slate-900 {
  background-color: #e2e8f0;
  border-color: rgba(0, 0, 0, 0.06);
}

/* Related sections Light Mode */
html:not(.dark) .projects-page h2 {
  color: #0f172a;
}

html:not(.dark) .prod-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
}

html:not(.dark) .prod-card:hover {
  border-color: rgba(240, 113, 0, 0.2);
  box-shadow: 0 10px 24px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .prod-card .text-slate-200 {
  color: #1e293b;
}

html:not(.dark) .prod-card .text-slate-500.line-through {
  color: #94a3b8;
}

html:not(.dark) .prod-card .text-emerald-400 {
  color: #d95f00;
}

html:not(.dark) .prod-card .bg-white\/5 {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

html:not(.dark) .prod-card:hover .bg-white\/5 {
  background-color: #f07100;
  border-color: #f07100;
  color: #ffffff;
}

/* Article card Light Mode */
html:not(.dark) .article-card {
  background-color: #ffffff;
  border-color: rgba(0, 0, 0, 0.06);
}

html:not(.dark) .article-card:hover {
  border-color: rgba(240, 113, 0, 0.2);
  box-shadow: 0 10px 24px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .article-card h3.text-slate-200 {
  color: #1e293b;
}

html:not(.dark) .article-card p.text-slate-400 {
  color: #475569;
}

html:not(.dark) .article-card .text-emerald-400 {
  color: #d95f00;
}

html:not(.dark) .article-card:hover .text-emerald-400 {
  color: #f07100;
}

html:not(.dark) .article-card .bg-slate-950\/80 {
  background-color: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.06);
  color: #d95f00;
}

/* CTA Card Light Mode */
html:not(.dark) .cta-card {
  background: linear-gradient(135deg, rgba(255, 245, 235, 0.8) 0%, #ffffff 50%, #ffffff 100%);
  border-color: rgba(240, 113, 0, 0.15);
  box-shadow: 0 10px 40px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .cta-card h2 {
  color: #0f172a;
}

html:not(.dark) .cta-card p {
  color: #475569;
}

html:not(.dark) .cta-secondary-btn {
  background-color: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.08);
  color: #475569;
}
html:not(.dark) .cta-secondary-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
  color: #0f172a;
}
</style>
