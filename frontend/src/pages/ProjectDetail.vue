<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../utils/apiFetch'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

const project = ref(null)
const loading = ref(true)

// For recommendations
const recommendedProducts = ref([])
const recommendedArticles = ref([])

// Utility to transform oembed to iframe (YouTube embed helper)
const transformOembed = (html) => {
  if (!html) return html

  const buildYouTubeEmbed = (videoId) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}`
    return `<div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-xl"><iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`
  }

  const extractYouTubeId = (url) => {
    if (url.startsWith('www.')) url = 'https://' + url
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i)
    return ytMatch ? ytMatch[1] : null
  }

  let result = html.replace(/<figure\s+class="media">\s*<oembed\s+url="([^"]+)">\s*<\/oembed>\s*<\/figure>/gi, (match, url) => {
    const videoId = extractYouTubeId(url)
    if (videoId) return buildYouTubeEmbed(videoId)
    return `<div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-xl"><iframe src="${url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>`
  })

  result = result.replace(/<oembed\s+url="([^"]+)"><\/oembed>/gi, (match, url) => {
    const videoId = extractYouTubeId(url)
    if (videoId) return buildYouTubeEmbed(videoId)
    return `<div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-xl"><iframe src="${url}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div>`
  })

  result = result.replace(/<figure\s+class="media">\s*(<iframe[^>]*?>[\s\S]*?<\/iframe>)\s*<\/figure>/gi, (match, iframeTag) => {
    const ytMatch = iframeTag.match(/src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"/i)
    if (ytMatch) return buildYouTubeEmbed(ytMatch[1])
    return `<div class="aspect-video w-full rounded-2xl overflow-hidden my-6 shadow-xl">${iframeTag}</div>`
  })

  result = result.replace(/<iframe([^>]*?)src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"([^>]*?)>(\s*<\/iframe>)?/gi, (match, before, videoId, params, after) => {
    return buildYouTubeEmbed(videoId)
  })

  return result
}

const fetchProjectDetail = async () => {
  try {
    const param = route.params.slug
    const res = await fetch(`/api/projects/${param}`)
    const data = await res.json()
    if (data.success && data.data) {
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

      // Update Dynamic SEO & GEO Tags
      const pTitle = `${project.value.title} | ผลงานการติดตั้ง - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด`
      const pDesc = project.value.description ? project.value.description.replace(/<[^>]*>?/gm, '').substring(0, 160) : (settingsStore.storeDescription || 'ผลงานการส่งมอบและประกอบติดตั้งจากลูกค้าที่ไว้วางใจทั่วประเทศ')
      const pImage = project.value.cover_image || ''

      setMeta({
        title: pTitle,
        description: pDesc,
        image: pImage,
        canonicalUrl: window.location.href,
        type: 'article'
      })

      setStructuredData({
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": project.value.title,
        "description": pDesc,
        "image": pImage,
        "provider": {
          "@type": "LocalBusiness",
          "name": settingsStore.storeName || "บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด"
        }
      }, 'dynamic-structured-data')

      setStructuredData({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
          { "@type": "ListItem", "position": 2, "name": "ผลงานการติดตั้ง", "item": `${window.location.origin}/projects` },
          { "@type": "ListItem", "position": 3, "name": project.value.title, "item": window.location.href }
        ]
      }, 'dynamic-breadcrumb-data')
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
    if (prodData.success && Array.isArray(prodData.data)) {
      const excludeId = project.value?.product_id || null
      recommendedProducts.value = prodData.data.filter(p => p.id !== excludeId).slice(0, 4)
    }
    const artRes = await fetch('/api/articles?limit=3&status=published')
    const artData = await artRes.json()
    if (artData.success && Array.isArray(artData.data)) {
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
  if (typeof l === 'string') return `https://line.me/ti/p/~${l.replace(/^@/, '')}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value.replace(/^@/, '')}` : '/contact')
})

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

const allGalleryImages = computed(() => {
  const list = []
  if (project.value?.cover_image) list.push(project.value.cover_image)
  if (project.value?.gallery_images && Array.isArray(project.value.gallery_images)) {
    project.value.gallery_images.forEach(img => {
      if (img && !list.includes(img)) list.push(img)
    })
  }
  return list
})

const nextImage = () => {
  if (allGalleryImages.value.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % allGalleryImages.value.length
  }
}

const prevImage = () => {
  if (allGalleryImages.value.length > 0) {
    currentImageIndex.value = (currentImageIndex.value - 1 + allGalleryImages.value.length) % allGalleryImages.value.length
  }
}

const handleKeydown = (e) => {
  if (!isLightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'ArrowLeft') prevImage()
}

const getImageUrl = (path, width) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const fullUrl = `${import.meta.env.VITE_API_URL || ''}${path}`
  return width ? getOptimizedImageUrl(fullUrl, width) : fullUrl
}

const getProductImage = (prod) => {
  if (!prod) return ''
  if (prod.image_url) return getImageUrl(prod.image_url, 400)
  if (prod.images) {
    try {
      const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getImageUrl(parsed[0], 400)
      }
    } catch (e) {}
  }
  return ''
}

const formatPrice = (price) => {
  if (!price) return '0'
  return parseFloat(price).toLocaleString('th-TH')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch (e) {
    return dateString
  }
}

/* ── Lifecycle ── */
onMounted(async () => {
  await fetchProjectDetail()
  fetchRecommended()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-20">

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col justify-center items-center min-h-[60vh] gap-3">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      <p class="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลผลงาน...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!project" class="max-w-md mx-auto my-32 text-center p-8 bg-white dark:bg-[#10141D] rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xl">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 font-mono font-black text-xl">
        404
      </div>
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1">ไม่พบผลงานที่ต้องการ</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">ผลงานนี้อาจถูกลบหรือย้ายออกจากระบบแล้ว</p>
      <router-link 
        to="/projects" 
        class="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>กลับหน้ารวมผลงาน</span>
      </router-link>
    </div>

    <!-- Main Content -->
    <template v-else>
      
      <!-- =========================================================================
           HERO SPLIT HEADER (Enterprise Dark Aesthetic)
           ========================================================================= -->
      <header class="relative overflow-hidden pt-28 pb-16 bg-[#070A0F] border-b border-white/[0.05]">
        <!-- Mesh Background -->
        <div class="absolute inset-0 opacity-[0.035] pointer-events-none"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px); background-size: 28px 28px;">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#070A0F]/60 to-[#070A0F] pointer-events-none"></div>

        <!-- Ambient Glows -->
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <!-- Breadcrumb Navigation -->
          <nav class="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumb">
            <router-link to="/" class="hover:text-blue-400 transition-colors flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>หน้าแรก</span>
            </router-link>
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <router-link to="/projects" class="hover:text-blue-400 transition-colors">ผลงานการติดตั้ง</router-link>
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-blue-400 font-semibold truncate max-w-[200px] sm:max-w-xs">{{ project.title }}</span>
          </nav>

          <!-- Split Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <!-- Left Info Panel -->
            <div class="lg:col-span-7">
              <div v-if="project.category" class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
                <svg class="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span class="text-blue-400 text-[11px] font-bold tracking-wider uppercase">{{ project.category }}</span>
              </div>

              <h1 class="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                {{ project.title }}
              </h1>

              <!-- Stats / Metadata Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8">
                <!-- Location -->
                <div v-if="project.location" class="flex items-center gap-3 bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl">
                  <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สถานที่ติดตั้ง</p>
                    <p class="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">{{ project.location }}</p>
                  </div>
                </div>

                <!-- Date -->
                <div v-if="project.service_date" class="flex items-center gap-3 bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl">
                  <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">วันที่ส่งมอบงาน</p>
                    <p class="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">{{ formatDate(project.service_date) }}</p>
                  </div>
                </div>

                <!-- Client Name / Industry -->
                <div v-if="project.client_name" class="flex items-center gap-3 bg-slate-900/60 border border-white/10 p-3.5 rounded-2xl">
                  <div class="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กลุ่มลูกค้า</p>
                    <p class="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">{{ project.client_name }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Cover Image Panel -->
            <div class="lg:col-span-5">
              <div 
                @click="openLightbox(0)"
                class="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 cursor-pointer group"
              >
                <img 
                  :src="getImageUrl(project.cover_image, 800)" 
                  :alt="project.title" 
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  @error="onImageError"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <!-- Zoom glass badge -->
                <div class="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md border border-white/15 text-white p-2.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200">
                  <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/>
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      <!-- =========================================================================
           TWO-COLUMN BODY + SIDEBAR LAYOUT
           ========================================================================= -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Left Column (Rich Content & Gallery) -->
          <div class="lg:col-span-8 space-y-12">
            
            <!-- CKEditor rich text body -->
            <article class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
              <div class="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
                <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">รายละเอียดโครงการและข้อมูลการติดตั้ง</h2>
              </div>
              <div class="ck-content prose prose-blue dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed" v-html="project.content_rich || project.description"></div>
            </article>

            <!-- Image Gallery Grid -->
            <section v-if="project.gallery_images && project.gallery_images.length > 0" class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
              <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.04]">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">ภาพบรรยากาศการติดตั้งเพิ่มเติม</h2>
                </div>
                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 font-mono">
                  {{ project.gallery_images.length }} รูปภาพ
                </span>
              </div>

              <!-- Gallery Grid -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div
                  v-for="(img, idx) in project.gallery_images"
                  :key="'gal-'+idx"
                  @click="openLightbox(idx + (project.cover_image ? 1 : 0))"
                  class="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group bg-slate-900 border border-slate-200/60 dark:border-white/[0.06] shadow-sm"
                >
                  <img 
                    :src="getImageUrl(img, 600)" 
                    :alt="`รูปที่ ${idx + 1}`" 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    @error="onImageError"
                  />
                  <!-- Hover Overlay -->
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div class="w-8 h-8 rounded-full bg-slate-900/90 text-white flex items-center justify-center shadow-md">
                      <svg class="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
            <aside class="lg:sticky lg:top-[120px] space-y-6">
              
              <!-- Sticky Product Card -->
              <div v-if="project.product" class="bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
                <div class="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-wider uppercase">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <span>เครื่องจักรที่ใช้ในโครงการนี้</span>
                </div>
                
                <div class="relative aspect-[4/3] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-white/[0.04] p-4 flex items-center justify-center overflow-hidden mb-4">
                  <img 
                    :src="getProductImage(project.product)" 
                    :alt="project.product.name" 
                    class="max-h-full max-w-full object-contain" 
                    @error="onImageError"
                  />
                </div>

                <p v-if="project.product.category" class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">{{ project.product.category }}</p>
                <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  <router-link :to="'/products/' + (project.product.slug || project.product.id)">{{ project.product.name }}</router-link>
                </h3>
                <p v-if="project.product.short_description || project.product.seo_description" class="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-light">
                  {{ project.product.short_description || project.product.seo_description }}
                </p>

                <!-- Prices -->
                <div class="flex items-baseline gap-2.5 mt-4">
                  <template v-if="project.product.price && project.product.price > 0">
                    <span class="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">฿{{ formatPrice(project.product.price) }}</span>
                    <span v-if="project.product.original_price && project.product.original_price > project.product.price" class="text-xs text-slate-400 line-through font-mono">
                      ฿{{ formatPrice(project.product.original_price) }}
                    </span>
                  </template>
                  <span v-else class="text-sm font-semibold text-slate-500">ติดต่อสอบถามราคาพิเศษ</span>
                </div>

                <!-- Action Button links -->
                <div class="grid grid-cols-1 gap-2.5 mt-6">
                  <router-link 
                    :to="'/products/' + (project.product.slug || project.product.id)"
                    class="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center transition-all shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    ดูรายละเอียดสินค้า
                  </router-link>
                  <router-link 
                    to="/quotation"
                    class="w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center transition-all active:scale-95"
                  >
                    ขอใบเสนอราคางานติดตั้ง
                  </router-link>
                </div>
              </div>

              <!-- Inline Contact Widget -->
              <div class="bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
                <h4 class="text-base font-bold text-slate-900 dark:text-white mb-1.5">สนใจงานติดตั้งแบบนี้?</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 font-light">
                  ปรึกษาทีมวิศวกรผู้เชี่ยวชาญเพื่อประเมินหน้างานจริงและออกใบเสนอราคาฟรี
                </p>

                <div class="space-y-2.5">
                  <a 
                    :href="lineHref"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-xs transition-all shadow-md active:scale-95"
                  >
                    <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                    </svg>
                    <span>ปรึกษาผ่าน LINE</span>
                  </a>

                  <a 
                    :href="phoneHref"
                    class="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all active:scale-95"
                  >
                    <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>โทรติดต่อสอบถาม</span>
                  </a>
                </div>
              </div>

              <!-- Back to projects link -->
              <div class="text-center pt-2">
                <router-link 
                  to="/projects" 
                  class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  <span>กลับหน้ารวมผลงานทั้งหมด</span>
                </router-link>
              </div>

            </aside>
          </div>

        </div>
      </div>

      <!-- =========================================================================
           LIGHTBOX MODAL
           ========================================================================= -->
      <transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-if="isLightboxOpen" 
          class="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 bg-slate-950/95 backdrop-blur-md"
          @click="closeLightbox"
        >
          <!-- Close Button -->
          <button 
            @click="closeLightbox"
            class="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-20 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Prev Button -->
          <button 
            v-if="allGalleryImages.length > 1"
            @click.stop="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-20 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Image Container -->
          <div class="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl" @click.stop>
            <img 
              :src="getImageUrl(allGalleryImages[currentImageIndex])" 
              class="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl" 
              alt="ภาพขยายผลงาน"
            />
            
            <!-- Index Counter -->
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-mono font-bold">
              {{ currentImageIndex + 1 }} / {{ allGalleryImages.length }}
            </div>
          </div>

          <!-- Next Button -->
          <button 
            v-if="allGalleryImages.length > 1"
            @click.stop="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-20 transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </transition>

    </template>
  </div>
</template>
