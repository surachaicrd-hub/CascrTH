<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'
import SocialShare from '../components/SocialShare.vue'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const article = ref(null)
const loading = ref(true)
const relatedArticles = ref([])
const recommendedProducts = ref([])
const relatedProducts = ref([])
const recommendedArticles = ref([])

// Utility to transform oembed to iframe
const transformOembed = (html) => {
  if (!html) return html;
  
  const buildYouTubeEmbed = (videoId) => {
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></div>`;
  };

  const extractYouTubeId = (url) => {
    if (url.startsWith('www.')) url = 'https://' + url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
    return ytMatch ? ytMatch[1] : null;
  };

  // 1. Transform <figure class="media"><oembed>...</oembed></figure> (CKEditor full structure)
  let result = html.replace(/<figure\s+class="media">\s*<oembed\s+url="([^"]+)">\s*<\/oembed>\s*<\/figure>/gi, (match, url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) return buildYouTubeEmbed(videoId);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div></div>`;
  });

  // 2. Transform standalone <oembed> tags (without figure wrapper)
  result = result.replace(/<oembed\s+url="([^"]+)"><\/oembed>/gi, (match, url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) return buildYouTubeEmbed(videoId);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner"><iframe src="${url}" frameborder="0" allowfullscreen></iframe></div></div>`;
  });

  // 3. Transform <figure class="media"> wrapping an iframe
  result = result.replace(/<figure\s+class="media">\s*(<iframe[^>]*?>[\s\S]*?<\/iframe>)\s*<\/figure>/gi, (match, iframeTag) => {
    const ytMatch = iframeTag.match(/src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"/i);
    if (ytMatch) return buildYouTubeEmbed(ytMatch[1]);
    return `<div class="yt-embed-wrapper"><div class="yt-embed-inner">${iframeTag}</div></div>`;
  });

  // 4. Fix any remaining standalone youtube iframes not inside figure.media
  result = result.replace(/<iframe([^>]*?)src="https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})([^"]*)"([^>]*?)>(\s*<\/iframe>)?/gi, (match, before, videoId, params, after) => {
    return buildYouTubeEmbed(videoId);
  });

  return result;
};

const loadArticle = async () => {
  loading.value = true
  try {
    const param = route.params.slug
    const res = await fetch(`/api/articles/${param}`)
    const data = await res.json()
    if (data.success) {
      article.value = data.data
      // ถ้าเข้าถึงด้วย numeric ID ให้ redirect ไปยัง slug URL
      if (/^\d+$/.test(param) && article.value.slug) {
        router.replace(`/blog/${article.value.slug}`)
        return
      }
      if (article.value.content) {
        article.value.content = transformOembed(article.value.content)
      }
      addSchema()
      updateMetaTags()
      // Load related
      loadRelated()
    }
  } catch (e) { console.error(e) } finally { loading.value = false }
}

const updateMetaTags = () => {
    const titleText = article.value.seo_title || article.value.title || (settingsStore.storeName ? `${settingsStore.storeName} บทความ` : 'บทความ')
    document.title = titleText

    const setMeta = (name, content, isProp = false) => {
        if (!content) return
        const attr = isProp ? 'property' : 'name'
        let el = document.querySelector(`meta[${attr}="${name}"]`)
        if (!el) {
            el = document.createElement('meta')
            el.setAttribute(attr, name)
            document.head.appendChild(el)
            el.classList.add('dynamic-seo-tag')
        }
        el.setAttribute('content', content)
    }

    const desc = article.value.seo_description || article.value.excerpt || ''
    const keywords = article.value.seo_keywords || article.value.tags || ''
    const url = window.location.href
    const image = article.value.cover_image || ''

    // Standard SEO
    setMeta('description', desc)
    setMeta('keywords', keywords)

    // OpenGraph (Facebook, Line)
    setMeta('og:title', titleText, true)
    setMeta('og:description', desc, true)
    setMeta('og:image', image, true)
    setMeta('og:url', url, true)
    setMeta('og:type', 'article', true)

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', titleText)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', image)

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        canonical.classList.add('dynamic-seo-tag')
        document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
}

const loadRelated = async () => {
  try {
    // 1. Related articles (same category)
    const res = await fetch(`/api/articles/published?limit=6&category=${encodeURIComponent(article.value.category)}`)
    const data = await res.json()
    if (data.success) {
      relatedArticles.value = data.data.filter(a => a.id !== article.value.id).slice(0, 3)
    }

    // 2. Recommended articles (different category or all, excluding current and already-related)
    const recRes = await fetch(`/api/articles/published?limit=8`)
    const recData = await recRes.json()
    if (recData.success) {
      const excludeIds = new Set([article.value.id, ...relatedArticles.value.map(a => a.id)])
      recommendedArticles.value = recData.data.filter(a => !excludeIds.has(a.id)).slice(0, 4)
    }

    // 3. Recommended products (popular / featured)
    const prodRes = await fetch(`/api/products`)
    const prodData = await prodRes.json()
    if (prodData.success) {
      const allProducts = prodData.data.filter(p => p.is_active && !p.is_out_of_stock)
      // Exclude the article's linked product if any
      const excludeProductId = article.value.product_id || null
      const filtered = allProducts.filter(p => p.id !== excludeProductId)
      recommendedProducts.value = filtered.slice(0, 4)

      // 4. Related products (same category as article)
      if (article.value.category) {
        const catProducts = allProducts.filter(p =>
          p.category && p.category.includes(article.value.category.split(',')[0]?.trim()) && p.id !== excludeProductId
        )
        relatedProducts.value = catProducts.slice(0, 4)
        // If not enough category matches, fill with others
        if (relatedProducts.value.length < 2) {
          const existingIds = new Set(relatedProducts.value.map(p => p.id))
          const fillers = filtered.filter(p => !existingIds.has(p.id)).slice(0, 4 - relatedProducts.value.length)
          relatedProducts.value = [...relatedProducts.value, ...fillers]
        }
      }
    }
  } catch (e) { console.error('loadRelated error:', e) }
}

const formatPrice = (price) => {
  if (!price || price <= 0) return 'สอบถามราคา'
  return Number(price).toLocaleString() + ' บาท'
}

const addSchema = () => {
  // Remove existing
  ['json-ld-article', 'json-ld-article-bc', 'json-ld-article-faq'].forEach(id => {
    const existing = document.getElementById(id)
    if (existing) document.head.removeChild(existing)
  })

  const aiDescription = article.value.llm_context
    ? `${article.value.seo_description || article.value.excerpt || ''} [AI Context: ${article.value.llm_context}]`
    : (article.value.seo_description || article.value.excerpt || '')

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.value.title,
    "description": aiDescription,
    "image": article.value.cover_image || '',
    "author": { "@type": "Person", "name": article.value.author || "Admin" },
    "publisher": {
      "@type": "Organization",
      "name": settingsStore.storeName || "",
      "url": window.location.origin
    },
    "datePublished": article.value.created_at,
    "dateModified": article.value.updated_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": window.location.href
    }
  }
  const s = document.createElement('script')
  s.type = 'application/ld+json'
  s.text = JSON.stringify(schema)
  s.id = 'json-ld-article'
  document.head.appendChild(s)

  // Breadcrumb
  const bc = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "บทความ", "item": `${window.location.origin}/blog` },
      { "@type": "ListItem", "position": 3, "name": article.value.title, "item": window.location.href }
    ]
  }
  const bcS = document.createElement('script')
  bcS.type = 'application/ld+json'
  bcS.text = JSON.stringify(bc)
  bcS.id = 'json-ld-article-bc'
  document.head.appendChild(bcS)

  // FAQ Schema
  if (article.value.faq && article.value.faq.length > 0) {
    let parsedFaq = []
    if (typeof article.value.faq === 'string') {
      try { parsedFaq = JSON.parse(article.value.faq) } catch (e) { console.error('Error parsing FAQ schema:', e) }
    } else {
      parsedFaq = article.value.faq
    }

    if (parsedFaq.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": parsedFaq.map(item => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      }
      const faqS = document.createElement('script')
      faqS.type = 'application/ld+json'
      faqS.text = JSON.stringify(faqSchema)
      faqS.id = 'json-ld-article-faq'
      document.head.appendChild(faqS)
    }
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const openFaqIndex = ref(null)
const toggleFaq = (index) => {
  openFaqIndex.value = openFaqIndex.value === index ? null : index
}

// Lightbox state and functions
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
    if (article.value && article.value.gallery_images) {
        currentImageIndex.value = (currentImageIndex.value + 1) % article.value.gallery_images.length
    }
}

const prevImage = () => {
    if (article.value && article.value.gallery_images) {
        currentImageIndex.value = (currentImageIndex.value - 1 + article.value.gallery_images.length) % article.value.gallery_images.length
    }
}

const handleKeydown = (e) => {
    if (!isLightboxOpen.value) return
    if (e.key === 'Escape') closeLightbox()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
}

const parsedFaqList = computed(() => {
  if (!article.value?.faq) return []
  if (typeof article.value.faq === 'string') {
      try { return JSON.parse(article.value.faq) } catch (e) { return [] }
  }
  return article.value.faq || []
})

onMounted(() => {
    loadArticle()
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  ['json-ld-article', 'json-ld-article-bc', 'json-ld-article-faq'].forEach(id => {
    const s = document.getElementById(id)
    if (s) document.head.removeChild(s)
  })
  
  const dynTags = document.querySelectorAll('.dynamic-seo-tag')
  dynTags.forEach(t => document.head.removeChild(t))

  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="bg-white dark:bg-[#0a0f16] min-h-screen pt-24 md:pt-32 pb-20 transition-colors">
    
    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center min-h-[50vh]">
      <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="article" class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Breadcrumb -->
      <nav class="text-sm text-gray-400 dark:text-gray-500 mb-8 font-medium overflow-hidden" aria-label="Breadcrumb">
        <ol class="flex items-center min-w-0 gap-2">
          <li class="flex-shrink-0"><router-link to="/" class="hover:text-indigo-600 transition-colors">หน้าแรก</router-link></li>
          <li class="flex-shrink-0"><span class="text-gray-300 dark:text-gray-700">/</span></li>
          <li class="flex-shrink-0"><router-link to="/blog" class="hover:text-indigo-600 transition-colors">บทความ</router-link></li>
          <li class="flex-shrink-0"><span class="text-gray-300 dark:text-gray-700">/</span></li>
          <li class="min-w-0"><span class="text-gray-900 dark:text-white block truncate">{{ article.title }}</span></li>
        </ol>
      </nav>

      <!-- Article Header -->
      <header class="mb-10">
        <div class="flex items-center gap-3 mb-4">
          <span class="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">{{ article.category }}</span>
          <span class="text-sm text-gray-400">{{ formatDate(article.created_at) }}</span>
          <span class="text-sm text-gray-400 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            {{ article.view_count || 0 }}
          </span>
        </div>
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-4">{{ article.title }}</h1>
        <p v-if="article.excerpt" class="text-lg text-gray-500 dark:text-gray-400 font-light leading-relaxed">{{ article.excerpt }}</p>
        <div class="flex items-center gap-3 mt-6">
          <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">{{ (article.author || 'A')[0] }}</div>
          <div>
            <p class="text-sm font-bold text-gray-900 dark:text-white">{{ article.author || 'Admin' }}</p>
            <p v-if="settingsStore.storeName" class="text-xs text-gray-400">{{ settingsStore.storeName }} Team</p>
          </div>
          <div class="ml-auto">
            <SocialShare />
          </div>
        </div>
      </header>

      <!-- Cover Image -->
      <div v-if="article.cover_image" class="aspect-[16/9] rounded-3xl overflow-hidden mb-8 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
        <img :src="getOptimizedImageUrl(article.cover_image, 1200)" :alt="article.title" class="w-full h-full object-cover" @error="onImageError">
      </div>

      <!-- ═══════════════════════════════════════════════
           FEATURED PRODUCT (Linked to Article)
           ═══════════════════════════════════════════════ -->
      <div v-if="article.product" class="mb-12">
        <router-link :to="'/products/' + (article.product.slug || article.product.id)" class="block group">
          <div class="relative bg-white dark:bg-[#111827] rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
            <!-- Top accent bar -->
            <div class="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>

            <div class="flex flex-col sm:flex-row">
              <!-- Product Image -->
              <div class="sm:w-56 md:w-64 flex-shrink-0 aspect-square sm:aspect-auto overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
                <img v-if="article.product.image_url" :src="getOptimizedImageUrl(article.product.image_url, 400)" :alt="article.product.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
                <template v-else-if="article.product.images && article.product.images[0]">
                   <img :src="getOptimizedImageUrl(article.product.images[0], 400)" :alt="article.product.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
                </template>
                <div v-else class="w-full h-full flex justify-center items-center text-gray-300 dark:text-gray-600 min-h-[200px]">
                   <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                <!-- Discount badge -->
                <div v-if="article.product.original_price && Number(article.product.original_price) > Number(article.product.price)" class="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                  -{{ Math.round((1 - Number(article.product.price) / Number(article.product.original_price)) * 100) }}%
                </div>
              </div>

              <!-- Product Info -->
              <div class="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                <div class="flex items-center gap-2 mb-2">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-black rounded-full uppercase tracking-wider">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                    สินค้าในบทความนี้
                  </span>
                  <span v-if="article.product.category" class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{{ article.product.category }}</span>
                </div>

                <h4 class="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">{{ article.product.name }}</h4>

                <p v-if="article.product.short_description || article.product.excerpt || article.product.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                  {{ article.product.short_description || article.product.excerpt || (article.product.description || '').replace(/<[^>]*>?/gm, '').substring(0, 150) }}
                </p>

                <div class="flex items-center flex-wrap gap-4">
                   <div v-if="article.product.price && Number(article.product.price) > 0" class="flex items-baseline gap-2">
                     <span class="text-2xl font-black text-red-600 dark:text-red-400">฿{{ Number(article.product.price).toLocaleString() }}</span>
                     <span v-if="article.product.original_price && Number(article.product.original_price) > Number(article.product.price)" class="text-sm text-gray-500 dark:text-gray-400 line-through">฿{{ Number(article.product.original_price).toLocaleString() }}</span>
                   </div>
                   <div v-else class="text-lg font-bold text-gray-500">สอบถามราคา</div>

                   <span class="ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl group-hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">
                     ดูรายละเอียดสินค้า
                     <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                   </span>
                </div>
              </div>
            </div>
          </div>
        </router-link>
      </div>

      <!-- Article Content -->
      <article class="prose prose-lg prose-gray dark:prose-invert max-w-none mb-16 font-light leading-relaxed ck-content" v-html="article.content"></article>



      <!-- FAQ Section -->
      <div v-if="parsedFaqList.length > 0" class="mb-16">
        <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
          <div class="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
             <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          คำถามที่พบบ่อย (FAQ)
        </h3>
        <div class="space-y-4">
          <div v-for="(faq, index) in parsedFaqList" :key="index" class="bg-gray-50 dark:bg-gray-800/30 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300">
            <button @click="toggleFaq(index)" class="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 group">
              <span class="font-bold text-gray-900 dark:text-white text-lg pr-8 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ faq.question }}</span>
              <span class="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-700 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
                 <svg class="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-transform duration-300" :class="{'rotate-180': openFaqIndex === index}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </span>
            </button>
            <div v-show="openFaqIndex === index" class="p-5 md:p-6 pt-0 text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>

      <!-- Image Gallery -->
      <div v-if="article.gallery_images && article.gallery_images.length > 0" class="mb-16">
        <h3 class="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <svg class="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          แกลเลอรี่ภาพเพิ่มเติม
        </h3>
        
        <!-- Modern Mosaic Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[150px] sm:auto-rows-[200px]">
            <div 
                v-for="(img, idx) in article.gallery_images" 
                :key="idx" 
                @click="openLightbox(idx)" 
                :class="[
                    'relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-gray-100 dark:border-gray-800 transition-all duration-500 hover:shadow-xl hover:-translate-y-1',
                    idx === 0 && article.gallery_images.length > 2 ? 'col-span-2 row-span-2' : '',
                    idx === 1 && article.gallery_images.length > 3 ? 'col-span-2 row-span-1' : '',
                    idx === 2 && article.gallery_images.length > 3 ? 'col-span-1 row-span-1' : '',
                    idx === 3 && article.gallery_images.length > 4 ? 'col-span-1 row-span-1' : ''
                ]"
            >
                <img :src="getOptimizedImageUrl(img, 600)" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" @error="onImageError">
                
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                    <div class="bg-white/20 text-white rounded-full p-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md shadow-lg border border-white/30">
                        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="article.tags && article.tags !== '[]'" class="flex flex-wrap gap-2 mb-16 pt-8 border-t border-gray-100 dark:border-gray-800">
        <span class="text-sm font-bold text-gray-500 mr-2">แท็ก:</span>
        <span v-for="tag in (typeof article.tags === 'string' ? (article.tags.startsWith('[') ? JSON.parse(article.tags) : article.tags.split(',')) : article.tags)" :key="tag" class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
          {{ typeof tag === 'string' ? tag.trim() : tag }}
        </span>
      </div>

      <!-- Associated Product Block (Bottom) -->
      <div v-if="article.product" class="mb-16 pt-8 border-t border-gray-100 dark:border-gray-800">
        <h3 class="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <svg class="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          สินค้าที่เกี่ยวข้องในบทความนี้
        </h3>
        <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl p-6 border border-emerald-100 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
          <div class="w-32 h-32 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm flex-shrink-0 relative">
            <img v-if="article.product.image_url" :src="getOptimizedImageUrl(article.product.image_url, 400)" class="w-full h-full object-cover" @error="onImageError">
            <template v-else-if="article.product.images && article.product.images[0]">
               <img :src="getOptimizedImageUrl(article.product.images[0], 400)" class="w-full h-full object-cover" @error="onImageError">
            </template>
            <div v-else class="w-full h-full flex justify-center items-center text-gray-300">
               <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <div class="flex-1 text-center sm:text-left">
            <span class="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full mb-3 inline-block">{{ article.product.category }}</span>
            <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{{ article.product.name }}</h4>
            <p v-if="article.product.excerpt || article.product.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
              {{ article.product.excerpt || article.product.description.replace(/<[^>]*>?/gm, '') }}
            </p>
            <div class="flex items-center justify-center sm:justify-start flex-wrap gap-4">
               <div v-if="article.product.price" class="text-lg font-black text-emerald-600 dark:text-emerald-400">
                 {{ Number(article.product.price).toLocaleString() }} <span class="text-sm font-medium">บาท</span>
               </div>
               <router-link :to="'/products/' + (article.product.slug || article.product.id)" class="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none">
                 ดูรายละเอียดสินค้า →
               </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           RECOMMENDED PRODUCTS SECTION
           ═══════════════════════════════════════════════ -->
      <div v-if="recommendedProducts.length > 0" class="border-t border-gray-100 dark:border-gray-800 pt-12 mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div class="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
            </div>
            สินค้าแนะนำ
          </h2>
          <router-link to="/products" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1">
            ดูทั้งหมด
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </router-link>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <router-link v-for="p in recommendedProducts" :key="p.id" :to="'/products/' + (p.slug || p.id)" class="group bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
              <img v-if="p.image_url" :src="getOptimizedImageUrl(p.image_url, 400)" :alt="p.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div v-if="p.original_price && p.original_price > p.price" class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                -{{ Math.round((1 - p.price / p.original_price) * 100) }}%
              </div>
            </div>
            <div class="p-3 md:p-4">
              <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{{ p.category }}</span>
              <h3 class="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">{{ p.name }}</h3>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-base font-black text-red-600 dark:text-red-400">{{ formatPrice(p.price) }}</span>
                <span v-if="p.original_price && p.original_price > p.price" class="text-xs text-gray-500 dark:text-gray-400 line-through">{{ Number(p.original_price).toLocaleString() }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           RELATED PRODUCTS (Same Category) SECTION
           ═══════════════════════════════════════════════ -->
      <div v-if="relatedProducts.length > 0" class="border-t border-gray-100 dark:border-gray-800 pt-12 mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div class="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            สินค้าที่เกี่ยวข้อง
          </h2>
          <router-link to="/products" class="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
            ดูสินค้าทั้งหมด
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </router-link>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <router-link v-for="p in relatedProducts" :key="p.id" :to="'/products/' + (p.slug || p.id)" class="group bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800 relative">
              <img v-if="p.image_url" :src="getOptimizedImageUrl(p.image_url, 400)" :alt="p.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
            </div>
            <div class="p-3 md:p-4">
              <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{{ p.category }}</span>
              <h3 class="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">{{ p.name }}</h3>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-base font-black text-red-600 dark:text-red-400">{{ formatPrice(p.price) }}</span>
                <span v-if="p.original_price && p.original_price > p.price" class="text-xs text-gray-500 dark:text-gray-400 line-through">{{ Number(p.original_price).toLocaleString() }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           RECOMMENDED ARTICLES SECTION
           ═══════════════════════════════════════════════ -->
      <div v-if="recommendedArticles.length > 0" class="border-t border-gray-100 dark:border-gray-800 pt-12 mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div class="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            บทความแนะนำ
          </h2>
          <router-link to="/blog" class="text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1">
            ดูบทความทั้งหมด
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </router-link>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <router-link v-for="ra in recommendedArticles" :key="ra.id" :to="'/blog/' + (ra.slug || ra.id)" class="group bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
              <img v-if="ra.cover_image" :src="getOptimizedImageUrl(ra.cover_image, 600)" :alt="ra.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
              <div v-else class="w-full h-full bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center">
                <svg class="w-10 h-10 text-amber-300 dark:text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
              </div>
              <div class="absolute top-2 left-2">
                <span class="px-2 py-0.5 bg-white/90 dark:bg-black/70 backdrop-blur-sm text-[10px] font-bold text-gray-700 dark:text-gray-300 rounded-full">{{ ra.category }}</span>
              </div>
            </div>
            <div class="p-3 md:p-4">
              <h3 class="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">{{ ra.title }}</h3>
              <p v-if="ra.excerpt" class="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2">{{ ra.excerpt }}</p>
              <div class="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                <span>{{ formatDate(ra.created_at) }}</span>
                <span v-if="ra.view_count" class="flex items-center gap-0.5">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  {{ ra.view_count }}
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════
           RELATED ARTICLES (Same Category) SECTION
           ═══════════════════════════════════════════════ -->
      <div v-if="relatedArticles.length > 0" class="border-t border-gray-100 dark:border-gray-800 pt-12">
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3">
          <div class="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
          </div>
          บทความที่เกี่ยวข้อง
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <router-link v-for="ra in relatedArticles" :key="ra.id" :to="'/blog/' + (ra.slug || ra.id)" class="group bg-white dark:bg-[#111827] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div class="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img v-if="ra.cover_image" :src="getOptimizedImageUrl(ra.cover_image, 600)" :alt="ra.title" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" @error="onImageError">
            </div>
            <div class="p-4">
              <span class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{{ ra.category }}</span>
              <h3 class="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 mt-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ ra.title }}</h3>
              <p class="text-xs text-gray-400 mt-2">{{ formatDate(ra.created_at) }}</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Back to Blog -->
      <div class="text-center mt-16">
        <router-link to="/blog" class="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          กลับไปหน้าบทความทั้งหมด
        </router-link>
      </div>
    </div>

    <!-- 404 -->
    <div v-else class="text-center py-20">
      <p class="text-gray-400 text-lg">ไม่พบบทความนี้</p>
      <router-link to="/blog" class="inline-block mt-4 text-indigo-600 font-bold hover:underline">กลับหน้าบทความ</router-link>
    </div>
  </div>

  <!-- Lightbox Modal -->
  <teleport to="body">
    <div v-if="isLightboxOpen" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-sm" @click="closeLightbox">
    
    <!-- Close Button -->
    <button @click.stop="closeLightbox" class="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[10000] focus:outline-none">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>

    <!-- Previous Button -->
    <button @click.stop="prevImage" class="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all z-[10000] focus:outline-none hidden md:block">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
    </button>

    <!-- Next Button -->
    <button @click.stop="nextImage" class="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-all z-[10000] focus:outline-none hidden md:block">
        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
    </button>
    
    <!-- Main Image Detail -->
    <div class="relative max-w-7xl max-h-[90vh] mx-auto px-4 w-full h-full flex items-center justify-center" @click.stop>
        <img :src="getOptimizedImageUrl(article.gallery_images[currentImageIndex], 1200)" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl select-none" @error="onImageError" />
        
        <!-- Mobile Navigation Area Overlays -->
        <div class="absolute inset-y-0 left-0 w-1/3 z-40 md:hidden" @click="prevImage"></div>
        <div class="absolute inset-y-0 right-0 w-1/3 z-40 md:hidden" @click="nextImage"></div>
    </div>

    <!-- Image Counter -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 font-medium text-sm px-4 py-2 bg-black/50 rounded-full backdrop-blur-md pointer-events-none">
        {{ currentImageIndex + 1 }} / {{ article.gallery_images.length }}
    </div>
    </div>
  </teleport>
</template>

<style scoped>
/* ══════════════════════════════════════════════════
   CKEditor Content Styling - BlogDetail
   ══════════════════════════════════════════════════ */

/* ── Headings ── */
.ck-content :deep(h2) {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
  border-left: 4px solid #10b981;
  padding-left: 1rem;
}

.ck-content :deep(h3) {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.ck-content :deep(h4) {
  font-size: 1.15rem;
  font-weight: 700;
  color: #374151;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

:global(.dark) .ck-content :deep(h2) {
  color: #f3f4f6;
  border-left-color: #059669;
}
:global(.dark) .ck-content :deep(h3) { color: #f3f4f6; }
:global(.dark) .ck-content :deep(h4) { color: #e5e7eb; }

/* ── Paragraphs ── */
.ck-content :deep(p) {
  color: #374151;
  line-height: 1.9;
  margin-bottom: 1.25rem;
  font-weight: 300;
}

:global(.dark) .ck-content :deep(p) {
  color: #d1d5db;
}

/* ── Strong / Bold ── */
.ck-content :deep(strong) {
  color: #111827;
  font-weight: 700;
}

:global(.dark) .ck-content :deep(strong) {
  color: #f9fafb;
}

/* ── Lists ── */
.ck-content :deep(ul),
.ck-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.ck-content :deep(ul) {
  list-style-type: disc;
}

.ck-content :deep(ol) {
  list-style-type: decimal;
}

.ck-content :deep(li) {
  margin-bottom: 0.6rem;
  line-height: 1.8;
  color: #374151;
  padding-left: 0.25rem;
}

:global(.dark) .ck-content :deep(li) {
  color: #d1d5db;
}

.ck-content :deep(li::marker) {
  color: #10b981;
  font-weight: 700;
}

/* ── Links ── */
.ck-content :deep(a) {
  color: #059669;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: #a7f3d0;
  transition: all 0.2s;
}

.ck-content :deep(a:hover) {
  color: #047857;
  text-decoration-color: #059669;
}

:global(.dark) .ck-content :deep(a) {
  color: #34d399;
  text-decoration-color: #065f46;
}

/* ── Blockquote ── */
.ck-content :deep(blockquote) {
  border-left: 4px solid #10b981;
  background-color: #f9fafb;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: #374151;
}

:global(.dark) .ck-content :deep(blockquote) {
  background-color: #1f2937;
  border-left-color: #059669;
  color: #d1d5db;
}

/* ── Media (Video/YouTube) ── */
.ck-content :deep(.yt-embed-wrapper) {
  max-width: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);

  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
.ck-content :deep(.yt-embed-wrapper:hover) {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.ck-content :deep(.yt-embed-inner) {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
  height: 0;
  overflow: hidden;
}
.ck-content :deep(.yt-embed-inner iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.ck-content :deep(figure.media) {
  margin: 2rem auto;
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;

}
:global(.dark) .ck-content :deep(figure.media) {

}
.ck-content :deep(figure.media iframe) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* ── Images ── */
.ck-content :deep(figure.image) {
  margin: 2rem auto;
  text-align: center;
}

.ck-content :deep(figure.image img) {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  max-width: 100%;
  height: auto;
}

.ck-content :deep(figure.image figcaption) {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.75rem;
  font-style: italic;
}

:global(.dark) .ck-content :deep(figure.image figcaption) {
  color: #9ca3af;
}

/* ── Horizontal Rule ── */
.ck-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #d1fae5, transparent);
  margin: 2.5rem 0;
}

:global(.dark) .ck-content :deep(hr) {
  background: linear-gradient(90deg, transparent, #064e3b, transparent);
}

/* ══════════════════════════════════════════════════
   Tables
   ══════════════════════════════════════════════════ */

.ck-content :deep(figure.table) {
  display: flex;
  justify-content: center;
  margin: 2rem auto;
  width: 100%;
}

.ck-content :deep(table) {
  width: 100% !important;
  table-layout: auto;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
  border: 1px solid #d1fae5 !important;
  margin: 2rem auto;
  font-size: 0.95rem;
}

.ck-content :deep(table thead) {
  background: linear-gradient(135deg, #059669, #10b981);
}

.ck-content :deep(table thead th) {
  color: white;
  font-weight: 700;
  padding: 14px 20px;
  text-align: left;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #047857;
  white-space: nowrap;
}

.ck-content :deep(table thead th:first-child) {
  border-top-left-radius: 16px;
}

.ck-content :deep(table thead th:last-child) {
  border-top-right-radius: 16px;
}

.ck-content :deep(table tbody tr) {
  transition: background-color 0.2s ease;
}

.ck-content :deep(table tbody tr:nth-child(even)) {
  background-color: #f0fdf4;
}

.ck-content :deep(table tbody tr:hover) {
  background-color: #dcfce7;
}

.ck-content :deep(table tbody td) {
  padding: 12px 20px;
  border-bottom: 1px solid #ecfdf5;
  color: #374151;
  line-height: 1.6;
  vertical-align: top;
  min-width: 120px;
}

.ck-content :deep(table tbody td:first-child) {
  font-weight: 600;
  color: #065f46;
  min-width: 160px;
}

.ck-content :deep(table tbody td:last-child) {
  /* removed forced width: 100% to prevent squashing other columns */
}

.ck-content :deep(table tbody tr:last-child td) {
  border-bottom: none;
}

.ck-content :deep(table tbody tr:last-child td:first-child) {
  border-bottom-left-radius: 16px;
}

.ck-content :deep(table tbody tr:last-child td:last-child) {
  border-bottom-right-radius: 16px;
}

/* ── Dark Mode Tables ── */
:global(.dark) .ck-content :deep(table) {
  border-color: #064e3b;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2);
}

:global(.dark) .ck-content :deep(table thead) {
  background: linear-gradient(135deg, #047857, #059669);
}

:global(.dark) .ck-content :deep(table thead th) {
  border-bottom-color: #065f46;
}

:global(.dark) .ck-content :deep(table tbody tr:nth-child(even)) {
  background-color: #022c22;
}

:global(.dark) .ck-content :deep(table tbody tr:hover) {
  background-color: #064e3b;
}

:global(.dark) .ck-content :deep(table tbody td) {
  border-bottom-color: #1e293b;
  color: #cbd5e1;
}

:global(.dark) .ck-content :deep(table tbody td:first-child) {
  color: #a7f3d0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .ck-content :deep(table) {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
</style>

