<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const article = ref(null)
const loading = ref(true)
const relatedArticles = ref([])
const recommendedProducts = ref([])
const copied = ref(false)

// Utility to transform oembed to iframe
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

const loadArticle = async () => {
  loading.value = true
  try {
    const param = route.params.slug
    const res = await fetch(`/api/articles/${param}`)
    const data = await res.json()
    if (data.success && data.data) {
      article.value = data.data
      
      // Redirect numeric ID to slug URL if slug is available
      if (/^\d+$/.test(param) && article.value.slug) {
        router.replace(`/blog/${article.value.slug}`)
        return
      }
      if (article.value.content) {
        article.value.content = transformOembed(article.value.content)
      }
      updateMetaTags()
      loadRelated()
    }
  } catch (e) {
    console.error('Failed to load article:', e)
  } finally {
    loading.value = false
  }
}

const updateMetaTags = () => {
  if (!article.value) return
  const titleText = `${article.value.seo_title || article.value.title} - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด`
  const desc = article.value.seo_description || article.value.excerpt || (article.value.content ? article.value.content.replace(/<[^>]*>?/gm, '').substring(0, 160) : '')
  const keywords = article.value.seo_keywords || article.value.tags || ''
  const image = article.value.cover_image || ''

  setMeta({
    title: titleText,
    description: desc,
    image,
    keywords,
    canonicalUrl: window.location.href,
    type: 'article'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.value.title,
    "description": desc,
    "image": image ? [image] : [],
    "datePublished": article.value.published_at || article.value.created_at,
    "dateModified": article.value.updated_at || article.value.published_at || article.value.created_at,
    "author": {
      "@type": "Organization",
      "name": article.value.author || settingsStore.storeName || "บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด"
    },
    "publisher": {
      "@type": "Organization",
      "name": settingsStore.storeName || "บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด",
      "url": window.location.origin
    }
  }, 'dynamic-article-data')

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "บทความ", "item": `${window.location.origin}/blog` },
      { "@type": "ListItem", "position": 3, "name": article.value.title, "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
}

const loadRelated = async () => {
  try {
    if (article.value?.category) {
      const res = await fetch(`/api/articles/published?limit=4&category=${encodeURIComponent(article.value.category)}`)
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        relatedArticles.value = data.data.filter(a => a.id !== article.value.id).slice(0, 3)
      }
    }

    const prodRes = await fetch(`/api/products?limit=4&is_active=true`)
    const prodData = await prodRes.json()
    if (prodData.success && Array.isArray(prodData.data)) {
      const excludeProductId = article.value?.product_id || null
      recommendedProducts.value = prodData.data.filter(p => p.id !== excludeProductId).slice(0, 4)
    }
  } catch (e) {
    console.error('Failed to load related content:', e)
  }
}

const formatArticleDate = (dateString) => {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
  } catch(e) {
    return dateString
  }
}

const getOptimizedBlogImageUrl = (path, width) => {
  if (!path) return 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=1200'
  if (path.startsWith('http')) return path
  const fullUrl = `${import.meta.env.VITE_API_URL || ''}${path}`
  return getOptimizedImageUrl(fullUrl, width)
}

const getProductImage = (prod) => {
  if (!prod) return ''
  if (prod.image_url) return getOptimizedBlogImageUrl(prod.image_url, 400)
  if (prod.images) {
    try {
      const parsed = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getOptimizedBlogImageUrl(parsed[0], 400)
      }
    } catch (e) {}
  }
  return ''
}

const formatPrice = (price) => {
  if (!price) return '0'
  return parseFloat(price).toLocaleString('th-TH')
}

const lineHref = computed(() => {
  const l = settingsStore.contactLines?.[0]
  if (!l) return '/contact'
  if (typeof l === 'string') return `https://line.me/ti/p/~${l.replace(/^@/, '')}`
  return l.url || (l.value ? `https://line.me/ti/p/~${l.value.replace(/^@/, '')}` : '/contact')
})

const phoneHref = computed(() => {
  const p = settingsStore.contactPhones?.[0]
  if (!p) return '/contact'
  const num = typeof p === 'string' ? p : (p.value || '')
  return num ? `tel:${num.replace(/[^0-9+]/g, '')}` : '/contact'
})

const copyCurrentUrl = () => {
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2500)
  }
}

const shareToFacebook = () => {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')
}

const shareToLine = () => {
  window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400')
}

watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    loadArticle()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

onMounted(() => {
  loadArticle()
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-20">

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col justify-center items-center min-h-[60vh] gap-3">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      <p class="text-xs text-slate-400 font-medium">กำลังโหลดเนื้อหาบทความ...</p>
    </div>

    <!-- Not Found State -->
    <div v-else-if="!article" class="max-w-md mx-auto my-32 text-center p-8 bg-white dark:bg-[#10141D] rounded-3xl border border-slate-200 dark:border-white/[0.06] shadow-xl">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 font-mono font-black text-xl">
        404
      </div>
      <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-1">ไม่พบบทความที่ต้องการ</h2>
      <p class="text-xs text-slate-500 dark:text-slate-400 mb-6">บทความนี้อาจถูกลบหรือย้ายออกจากระบบแล้ว</p>
      <router-link 
        to="/blog" 
        class="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
        </svg>
        <span>กลับหน้ารวมบทความ</span>
      </router-link>
    </div>

    <!-- Main Content -->
    <template v-else>
      
      <!-- =========================================================================
           ARTICLE HEADER HERO (Cover Image Background + Enterprise Dark Aesthetic)
           ========================================================================= -->
      <header class="relative overflow-hidden pt-28 pb-16 sm:pb-20 bg-[#070A0F] border-b border-white/[0.08]">
        
        <!-- Cover Image Backdrop -->
        <div v-if="article.cover_image" class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img 
            :src="getOptimizedBlogImageUrl(article.cover_image, 1600)" 
            :alt="article.title" 
            class="w-full h-full object-cover object-center scale-105 filter blur-[2px] opacity-25 dark:opacity-20 transform-gpu"
          />
          <!-- Multi-gradient overlays for maximum text legibility and aesthetic depth -->
          <div class="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-[#070A0F]/80 to-[#070A0F]/70"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-[#070A0F]/90 via-transparent to-[#070A0F]/90"></div>
        </div>

        <!-- Ambient Glows -->
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          
          <!-- Breadcrumbs -->
          <nav class="flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-slate-400 mb-6 flex-wrap" aria-label="Breadcrumb">
            <router-link to="/" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>หน้าแรก</span>
            </router-link>
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <router-link to="/blog" class="hover:text-emerald-400 transition-colors">บทความ</router-link>
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-emerald-400 font-semibold truncate max-w-[180px] sm:max-w-xs">{{ article.title }}</span>
          </nav>

          <!-- Category Pill -->
          <div v-if="article.category" class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span class="text-emerald-400 text-[11px] font-bold tracking-wider uppercase">{{ article.category }}</span>
          </div>

          <!-- Main Title -->
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
            {{ article.title }}
          </h1>

          <!-- Meta Bar & Share Buttons -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-white/[0.06]">
            <!-- Meta details -->
            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <span>{{ formatArticleDate(article.published_at || article.created_at) }}</span>
              </span>

              <span class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <span>{{ article.view_count || 0 }} ยอดเข้าชม</span>
              </span>

              <span v-if="article.author || settingsStore.storeName" class="text-slate-400">
                โดย {{ article.author || settingsStore.storeName }}
              </span>
            </div>

            <!-- Share Buttons -->
            <div class="flex items-center justify-center sm:justify-end gap-2">
              <button 
                @click="shareToLine"
                title="แชร์ไปยัง LINE"
                class="w-8 h-8 rounded-lg bg-[#06C755] hover:bg-[#05B34C] text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                </svg>
              </button>

              <button 
                @click="shareToFacebook"
                title="แชร์ไปยัง Facebook"
                class="w-8 h-8 rounded-lg bg-[#1877F2] hover:bg-[#0C63D4] text-white flex items-center justify-center transition-all active:scale-95 shadow-sm"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>

              <button 
                @click="copyCurrentUrl"
                :title="copied ? 'คัดลอกลิงก์สำเร็จ' : 'คัดลอกลิงก์'"
                class="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 text-xs font-bold transition-all border border-white/10"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <span>{{ copied ? 'คัดลอกแล้ว' : 'คัดลอก' }}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      <!-- =========================================================================
           BODY SECTION (Two-Column Layout)
           ========================================================================= -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Left Main Content Column -->
          <div class="lg:col-span-8 space-y-8">
            
            <!-- Cover Image Container -->
            <div class="rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-900 aspect-[16/9]">
              <img
                :src="getOptimizedBlogImageUrl(article.cover_image, 1200)"
                :alt="article.title"
                class="w-full h-full object-cover"
                @error="onImageError"
              />
            </div>

            <!-- Rich Text Body -->
            <article class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-10 lg:p-12 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
              <div class="prose prose-emerald dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed" v-html="article.content"></div>
            </article>

            <!-- Tags list -->
            <div v-if="article.tags" class="flex items-center gap-2 flex-wrap pt-2">
              <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">แท็ก:</span>
              <span 
                v-for="tag in article.tags.split(',')" 
                :key="tag"
                class="px-3 py-1 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400"
              >
                #{{ tag.trim() }}
              </span>
            </div>

            <!-- Linked Product Box -->
            <div v-if="article.product" class="bg-white dark:bg-[#10141D] border border-emerald-500/20 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div class="flex flex-col sm:flex-row items-center gap-6">
                <div class="w-full sm:w-44 aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 p-3 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-white/[0.04]">
                  <img :src="getProductImage(article.product)" :alt="article.product.name" class="max-h-full max-w-full object-contain" />
                </div>
                <div class="flex-1 text-center sm:text-left space-y-2">
                  <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">สินค้าที่เกี่ยวข้องในบทความ</span>
                  <h4 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{{ article.product.name }}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{{ article.product.short_description }}</p>
                  
                  <div class="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <span v-if="article.product.price" class="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">฿{{ formatPrice(article.product.price) }}</span>
                    <router-link 
                      :to="'/products/' + (article.product.slug || article.product.id)"
                      class="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center transition-all"
                    >
                      ดูรายละเอียดสินค้า
                    </router-link>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Sidebar Column -->
          <div class="lg:col-span-4">
            <aside class="lg:sticky lg:top-[120px] space-y-6">
              
              <!-- Quick Contact Widget -->
              <div class="bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
                <div class="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>EXPERT CONSULTATION</span>
                </div>
                
                <h4 class="text-base font-bold text-slate-900 dark:text-white mb-1.5">ต้องการปรึกษาทีมวิศวกร?</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5 font-light">
                  สอบถามข้อมูลเพิ่มเติมเรื่องการจัดเก็บ ขนาดโครงสร้าง และการเตรียมพื้นที่ติดตั้งได้ฟรี
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
                    <svg class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>โทรติดต่อสอบถาม</span>
                  </a>
                </div>
              </div>

              <!-- Related Articles (Same category) -->
              <div v-if="relatedArticles.length > 0" class="bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 shadow-xl shadow-slate-900/5 dark:shadow-black/20">
                <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-white/[0.04]">
                  บทความในหมวดหมู่นี้
                </h4>

                <div class="space-y-4">
                  <router-link 
                    v-for="rel in relatedArticles" 
                    :key="'rel-'+rel.id"
                    :to="'/blog/' + (rel.slug || rel.id)"
                    class="group flex gap-3 items-start"
                  >
                    <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-200/60 dark:border-white/[0.04]">
                      <img :src="getOptimizedBlogImageUrl(rel.cover_image, 200)" :alt="rel.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mb-0.5">{{ formatArticleDate(rel.published_at || rel.created_at) }}</p>
                      <h5 class="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 transition-colors">
                        {{ rel.title }}
                      </h5>
                    </div>
                  </router-link>
                </div>
              </div>

              <!-- Back to Articles Button -->
              <div class="text-center pt-2">
                <router-link 
                  to="/blog" 
                  class="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                  </svg>
                  <span>กลับหน้ารวมบทความทั้งหมด</span>
                </router-link>
              </div>

            </aside>
          </div>

        </div>
      </div>

    </template>
  </div>
</template>
