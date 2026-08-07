<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { useTrackingStore } from '../stores/tracking'
import SocialShare from '../components/SocialShare.vue'
import RecentlyViewed from '../components/RecentlyViewed.vue'
import FrequentlyBoughtTogether from '../components/FrequentlyBoughtTogether.vue'
import ProductAccessories from '../components/ProductAccessories.vue'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useAuthStore } from '../stores/authStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCompareStore } from '../stores/compareStore'
import { useToast } from '../composables/useToast'
import { apiFetch } from '../utils/apiFetch'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const route = useRoute()
const trackingStore = useTrackingStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const { showToast } = useToast()
const productId = route.params.id

const quantity = ref(1)

const now = ref(Date.now())
let timerInterval = null

const timeRemainingObj = computed(() => {
  if (!product.value || !product.value.sale_end_date) return null
  const total = Date.parse(product.value.sale_end_date) - now.value
  if (total <= 0) return null
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60)
  }
})

const addToCart = async () => {
  if (!product.value) return;
  try {
    await cartStore.addToCart(product.value, quantity.value);
    showToast(`เพิ่ม ${product.value.title} ลงในตะกร้าแล้ว`, 'success');
    trackingStore.trackEvent({
      type: 'add_to_cart',
      productId: product.value.id,
      productName: product.value.title,
      price: product.value.price,
      quantity: quantity.value
    });
    quantity.value = 1; // Reset quantity after adding
  } catch (err) {
    showToast('ไม่สามารถเพิ่มลงตะกร้าได้', 'error');
  }
}

const handleToggleWishlist = async () => {
  if (!authStore.isAuthenticated) {
    showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด', 'warning');
    return;
  }
  if (!product.value) return;
  const result = await wishlistStore.toggleWishlist(product.value);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว', result.isAdded ? 'success' : 'info');
    trackingStore.trackEvent({
      type: result.isAdded ? 'add_to_wishlist' : 'remove_from_wishlist',
      productId: product.value.id,
      productName: product.value.title
    });
  }
}

const product = ref(null)
const relatedProducts = ref([])
const loading = ref(true)
const allBadges = ref([]) // เก็บ master list จาก API
const productBadges = ref([]) // เก็บ badges ของสินค้านี้ แบบ resolve เป็น object แล้ว

const badgeIconMap = {
  check: 'M5 13l4 4L19 7',
  shield: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  thumbsup: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  gift: 'M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 00-2 2v2h6zm0 0V5.5A2.5 2.5 0 0114.5 3 2 2 0 0116 5v3h-4zm-8 4h16M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
}
const getBadgeIconPath = (icon) => badgeIconMap[icon] || badgeIconMap.tag

const loadMasterBadges = async () => {
  try {
    const res = await fetch('/api/badges')
    const data = await res.json()
    if (data.success) allBadges.value = data.data
  } catch (e) { console.error('Error loading master badges', e) }
}

// Utility to format price
const formatPrice = (price) => {
  if (!price) return '0'
  return Number(price).toLocaleString()
}



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

const loadProduct = async () => {
  loading.value = true
  try {
    const res = await fetch(`/api/products/${route.params.id}`)
    const data = await res.json()
    if (data.success) {
      const p = data.data
      
      // Parse images safely
      let parsedImages = []
      if (typeof p.images === 'string') {
        try { parsedImages = JSON.parse(p.images) } catch (e) { parsedImages = [] }
      } else if (Array.isArray(p.images)) {
        parsedImages = p.images
      }

      // Combine main image and gallery
      const allImages = []
      if (p.image_url) allImages.push(p.image_url)
      if (parsedImages.length > 0) allImages.push(...parsedImages)

      // Parse SEO & AI fields
      let parsedAttributes = []
      if (typeof p.attributes === 'string') {
        try { 
          const parsed = JSON.parse(p.attributes) 
          parsedAttributes = Array.isArray(parsed) ? parsed : []
        } catch (e) { parsedAttributes = [] }
      } else if (Array.isArray(p.attributes)) {
        parsedAttributes = p.attributes
      }
      
      let parsedFaq = []
      if (typeof p.faq === 'string') {
        try { 
          const parsed = JSON.parse(p.faq)
          parsedFaq = Array.isArray(parsed) ? parsed : []
        } catch (e) { parsedFaq = [] }
      } else if (Array.isArray(p.faq)) {
        parsedFaq = p.faq
      }

      let parsedBadges = []
      if (typeof p.badges === 'string') {
        try { parsedBadges = JSON.parse(p.badges) || [] } catch (e) { parsedBadges = [] }
      } else if (p.badges !== null && p.badges !== undefined) {
        parsedBadges = p.badges
      }
      if (!Array.isArray(parsedBadges)) {
        parsedBadges = parsedBadges ? [parsedBadges] : []
      }

      let parsedCategories = []
      if (typeof p.categories === 'string') {
        try { parsedCategories = JSON.parse(p.categories) || [] } catch (e) { parsedCategories = [] }
      } else if (Array.isArray(p.categories)) {
        parsedCategories = p.categories
      }
      if (parsedCategories.length === 0 && p.category) {
        parsedCategories = [p.category]
      }

      product.value = {
        ...p,
        title: p.name,
        description: transformOembed(p.description),
        price: p.price > 0 ? `฿${Number(p.price).toLocaleString()}` : 'สอบถามราคา',
        images: allImages.length > 0 ? allImages : ['https://via.placeholder.com/800x600?text=No+Image'],
        attributes: parsedAttributes.filter(a => a.key && a.value),
        faq: parsedFaq.filter(f => f.question && f.answer),
        badgeIds: parsedBadges, // เก็บแค่ ID array
        categories: parsedCategories
      }

      // Fetch category attribute templates to map friendly labels and sort by template order
      const catsToFetch = (product.value.categories && product.value.categories.length > 0) ? product.value.categories : (product.value.category ? [product.value.category] : []);
      const allTemplates = []
      for (const catName of catsToFetch) {
        try {
          const catRes = await fetch(`/api/category-attributes/${encodeURIComponent(catName)}`)
          const catData = await catRes.json()
          if (catData.success && catData.data) {
            allTemplates.push(...catData.data)
          }
        } catch (e) {
          console.error(`Failed to load templates for category ${catName}`, e)
        }
      }

      if (allTemplates.length > 0) {
        // deduplicate templates by attribute_key
        const seenKeys = new Set()
        const templates = []
        allTemplates.forEach(t => {
          if (!seenKeys.has(t.attribute_key)) {
            seenKeys.add(t.attribute_key)
            templates.push(t)
          }
        })

        const templateKeyOrder = templates.map(t => t.attribute_key)
        const attrLabelMap = {}
        templates.forEach(t => {
          attrLabelMap[t.attribute_key] = t.attribute_label
        })

        // Separate template-matched and custom attributes
        const templateAttrs = []
        const customAttrs = []
        
        product.value.attributes.forEach(a => {
          const templateIndex = templateKeyOrder.indexOf(a.key)
          if (templateIndex >= 0) {
            templateAttrs.push({ ...a, label: attrLabelMap[a.key] || a.key, _sortIndex: templateIndex })
          } else {
            customAttrs.push({ ...a, label: a.label || a.key })
          }
        })

        // Sort template attributes by template order, then append custom ones
        templateAttrs.sort((a, b) => a._sortIndex - b._sortIndex)
        product.value.attributes = [...templateAttrs, ...customAttrs].map(({ _sortIndex, ...rest }) => rest)
      }

      // Map resolved badges objects if master list is loaded
      if (allBadges.value.length > 0) {
        productBadges.value = allBadges.value.filter(b => product.value.badgeIds.includes(b.id))
      }

      addStructuredData()

      // Push Insight Tracking
      trackingStore.trackEvent({
        type: 'view_product',
        productId: product.value.id,
        itemName: product.value.title,
        category: product.value.category
      })

      // Add to recently viewed (localStorage for instant display)
      trackingStore.addToRecentlyViewed({
        id: product.value.id,
        name: product.value.title || product.value.name,
        slug: route.params.id,
        image_url: product.value.image_url,
        price: p.price,
        original_price: p.original_price,
        category: product.value.category,
        categories: product.value.categories
      })

      // Fetch Smart Related Products (AI scoring first, category fallback)
      try {
         // Try smart recommendation for personalized results
         let smartProducts = []
         try {
           const smartRes = await fetch(`/api/track-interest/smart-recommendation?sessionId=${trackingStore.sessionId}&currentProductId=${product.value.id}&limit=4`)
           const smartData = await smartRes.json()
           if (smartData.success && smartData.products) {
             smartProducts = smartData.products
               .filter(rp => rp.id !== product.value.id)
               .slice(0, 4)
               .map(rp => ({
                 ...rp,
                 title: rp.name,
                 image: rp.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
                 rating: rp.rating || 5.0,
                 reviews: rp.review_count || 0
               }))
           }
         } catch (e) { /* smart API failed, fallback below */ }

         // Fallback to category-based if smart didn't return enough
         if (smartProducts.length < 2) {
           const relatedRes = await fetch(`/api/products?category=${encodeURIComponent(product.value.category)}`)
           const relatedData = await relatedRes.json()
           if (relatedData.success) {
              const catProducts = relatedData.data
                 .filter(rp => rp.id !== product.value.id && !rp.is_out_of_stock)
                 .slice(0, 4)
                 .map(rp => ({
                    ...rp,
                    title: rp.name,
                    image: rp.image_url || 'https://via.placeholder.com/400x300?text=No+Image',
                    rating: rp.rating || 5.0,
                    reviews: rp.review_count || 0
                 }))
              // Merge: smart first, then category products not already included
              const existingIds = new Set(smartProducts.map(p => p.id))
              const merged = [...smartProducts, ...catProducts.filter(p => !existingIds.has(p.id))]
              relatedProducts.value = merged.slice(0, 4)
           } else {
              relatedProducts.value = smartProducts
           }
         } else {
           relatedProducts.value = smartProducts
         }
      } catch (err) {
         console.error('Fetch related products error:', err)
      }

    }
  } catch (error) {
    console.error('Fetch product error:', error)
  } finally {
    loading.value = false
  }
}

// Add Structured Data (JSON-LD) for Product Page with AI LLM Context Optimization
const addStructuredData = () => {
  if (!product.value) return

  // Clean up any existing JSON-LD script tags first to avoid duplicates
  const existingProduct = document.getElementById('json-ld-product')
  if (existingProduct) document.head.removeChild(existingProduct)

  const existingFaq = document.getElementById('json-ld-faq')
  if (existingFaq) document.head.removeChild(existingFaq)

  const existingBc = document.getElementById('json-ld-breadcrumb')
  if (existingBc) document.head.removeChild(existingBc)

  // Merge regular SEO description with the LLM context for AI search visibility
  const aiDescription = product.value.llm_context 
    ? `${product.value.seo_description || product.value.description} [AI Context: ${product.value.llm_context}]`
    : (product.value.seo_description || product.value.description)

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.value.title,
    "image": product.value.images,
    "description": aiDescription,
    "sku": product.value.sku || `${product.value.id}`,
    "brand": settingsStore.storeName ? {
      "@type": "Brand",
      "name": settingsStore.storeName
    } : undefined,
    "offers": {
      "@type": "AggregateOffer",
      "url": window.location.href,
      "priceCurrency": "THB",
      "lowPrice": product.value.price.replace(/[^0-9]/g, '') || "0",
      "offerCount": "1",
      "availability": product.value.is_active && !product.value.is_out_of_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด"
      }
    }
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  script.id = 'json-ld-product'
  document.head.appendChild(script)

  // Inject FAQ Schema if available
  if (product.value.faq && product.value.faq.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": product.value.faq.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    }
    const faqScript = document.createElement('script')
    faqScript.type = 'application/ld+json'
    faqScript.text = JSON.stringify(faqSchema)
    faqScript.id = 'json-ld-faq'
    document.head.appendChild(faqScript)
  }

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "หน้าแรก",
        "item": `${window.location.origin}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "สินค้า",
        "item": `${window.location.origin}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.value.title,
        "item": window.location.href
      }
    ]
  }
  const bcScript = document.createElement('script')
  bcScript.type = 'application/ld+json'
  bcScript.text = JSON.stringify(breadcrumbSchema)
  bcScript.id = 'json-ld-breadcrumb'
  document.head.appendChild(bcScript)

  // Update page title and meta for this product
  document.title = settingsStore.storeName ? `${product.value.title} — ${settingsStore.storeName}` : product.value.title
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', product.value.seo_description || product.value.short_description || product.value.description?.substring(0, 160) || '')
  }

  // Update canonical URL
  let canonicalLink = document.querySelector('link[rel="canonical"]')
  if (!canonicalLink) {
    canonicalLink = document.createElement('link')
    canonicalLink.setAttribute('rel', 'canonical')
    document.head.appendChild(canonicalLink)
  }
  canonicalLink.setAttribute('href', `${window.location.origin}/products/${route.params.id}`)
  
  // Update OG Tags
  const ogTitle = document.querySelector('meta[property="og:title"]')
  if (ogTitle) ogTitle.setAttribute('content', product.value.seo_title || product.value.title)
  
  const ogImage = document.querySelector('meta[property="og:image"]')
  if (ogImage && product.value.images && product.value.images[0]) {
    ogImage.setAttribute('content', product.value.images[0].startsWith('http') ? product.value.images[0] : `${window.location.origin}${product.value.images[0]}`)
  }
  const ogDesc = document.querySelector('meta[property="og:description"]')
  if (ogDesc) ogDesc.setAttribute('content', product.value.seo_description || product.value.description?.substring(0, 160) || '')
}

// Image Gallery State
const activeImageIndex = ref(0)
const isGalleryZoomed = ref(false)

const setActiveImage = (index) => {
  activeImageIndex.value = index
}

const toggleGalleryZoom = () => {
  isGalleryZoomed.value = !isGalleryZoomed.value
  if (isGalleryZoomed.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Dynamic LINE Inquiry URL from Admin Settings
const getLineInquiryUrl = (productTitle) => {
  let baseUrl = ''
  if (settingsStore.contactLines && settingsStore.contactLines.length > 0) {
    const firstLine = settingsStore.contactLines[0]
    if (typeof firstLine === 'string' && firstLine.trim()) {
      const val = firstLine.trim()
      baseUrl = val.startsWith('http') ? val : `https://line.me/ti/p/~${val.replace(/^@/, '')}`
    } else if (firstLine && typeof firstLine === 'object') {
      if (firstLine.url && firstLine.url.trim()) {
        baseUrl = firstLine.url.trim()
      } else if (firstLine.value && firstLine.value.trim()) {
        const val = firstLine.value.trim()
        baseUrl = val.startsWith('http') ? val : `https://line.me/ti/p/~${val.replace(/^@/, '')}`
      } else if (firstLine.id && firstLine.id.trim()) {
        const val = firstLine.id.trim()
        baseUrl = val.startsWith('http') ? val : `https://line.me/ti/p/~${val.replace(/^@/, '')}`
      }
    }
  }

  if (!baseUrl) {
    baseUrl = settingsStore.contactLines?.[0]?.url || ''
  }

  const connector = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${connector}text=${encodeURIComponent('สอบถามสินค้า: ' + (productTitle || ''))}`
}

// Interactive State
const activeTab = ref('description') // 'description', 'specs', 'faq'

// ===== Reviews System =====
const reviews = ref([])
const reviewsSummary = ref({ total: 0, average: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
const reviewPage = ref(1)
const hasMoreReviews = ref(false)
const fetchingReviews = ref(false)

const reviewForm = ref({ rating: 5, comment: '', images: [] })
const reviewSubmitting = ref(false)
const reviewHoverRating = ref(0)
const reviewImageInput = ref(null)
const uploadingReviewImage = ref(false)

const fetchReviews = async (prodId, isLoadMore = false) => {
  if (!isLoadMore) {
      reviewPage.value = 1
      reviews.value = []
  }
  fetchingReviews.value = true
  try {
    const res = await fetch(`/api/reviews/${prodId}?page=${reviewPage.value}&limit=10`)
    const data = await res.json()
    if (data.success) {
      if (isLoadMore) {
          reviews.value = [...reviews.value, ...data.data.reviews]
      } else {
          reviews.value = data.data.reviews
          reviewsSummary.value = data.data.summary
      }
      if(data.data.pagination) hasMoreReviews.value = data.data.pagination.hasMore
    }
  } catch (e) { console.error('Fetch reviews error:', e) } finally {
      fetchingReviews.value = false
  }
}

const loadMoreReviews = async () => {
    if (!hasMoreReviews.value || fetchingReviews.value || !product.value) return
    reviewPage.value++
    await fetchReviews(product.value.id, true)
}

const submitReview = async () => {
  if (!product.value) return
  reviewSubmitting.value = true
  try {
    const res = await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        product_id: product.value.id,
        rating: reviewForm.value.rating,
        comment: reviewForm.value.comment,
        images: reviewForm.value.images
      })
    })
    const data = await res.json()
    if (data.success) {
      showToast(data.message, 'success')
      reviewForm.value = { rating: 5, comment: '', images: [] }
      await fetchReviews(product.value.id)
    } else {
      showToast(data.error || 'ไม่สามารถส่งรีวิวได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดเน็ตเวิร์ก', 'error')
  } finally {
    reviewSubmitting.value = false
  }
}

const getReviewerInitials = (r) => {
  const f = r.first_name ? r.first_name.charAt(0) : ''
  const l = r.last_name ? r.last_name.charAt(0) : ''
  return (f + l).toUpperCase() || '?'
}

const getReviewerName = (r) => {
  if (r.first_name) {
    return r.first_name + (r.last_name ? ' ' + r.last_name.charAt(0) + '.' : '')
  }
  return 'ลูกค้า'
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} นาทีที่แล้ว`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} วันที่แล้ว`
  const months = Math.floor(days / 30)
  return `${months} เดือนที่แล้ว`
}

const handleReviewImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return
  
  if (reviewForm.value.images.length + files.length > 3) {
    showToast('อัปโหลดรูปภาพได้สูงสุด 3 รูปเท่านั้น', 'error')
    return
  }

  uploadingReviewImage.value = true
  try {
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 5 * 1024 * 1024) {
            showToast(`รูปภาพ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 5MB)`, 'error')
            continue
        }
        
        const formData = new FormData()
        formData.append('image', file)
        
        const token = localStorage.getItem('token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            headers
        })
        
        const data = await res.json()
        if (data.success) {
            reviewForm.value.images.push(data.imageUrl)
        } else {
            showToast(`อัปโหลด ${file.name} ไม่สำเร็จ: ${data.error}`, 'error')
        }
    }
  } catch (error) {
    console.error('Review image upload error:', error)
    showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error')
  } finally {
    uploadingReviewImage.value = false
    if (reviewImageInput.value) reviewImageInput.value.value = ''
  }
}

const removeReviewImage = (index) => {
  reviewForm.value.images.splice(index, 1)
}

const openGalleryFromReview = (images, startIndex = 0) => {
  if (!images || images.length === 0) return
  
  // Temporarily replace product images to use the existing modal
  // Note: For a robust solution, consider a dedicated modal for reviews
  // but since we have a gallery modal already, we can reuse it functionally.
  const originalImages = [...product.value.images]
  product.value.images = images
  activeImageIndex.value = startIndex
  isGalleryZoomed.value = true
  
  // Watcher to restore original images when modal closes
  const unwatch = watch(isGalleryZoomed, (newVal) => {
    if (!newVal) {
      product.value.images = originalImages
      activeImageIndex.value = 0
      unwatch()
    }
  })
}

onMounted(async () => {
  await loadMasterBadges()
  await loadProduct()
  if (product.value?.id) await fetchReviews(product.value.id)
  if (authStore.isAuthenticated) await wishlistStore.fetchWishlist()
  timerInterval = setInterval(() => { now.value = Date.now() }, 1000)
})

// Watch for route changes to reload product if user clicks a related product
watch(() => route.params.id, async (newId) => {
  if (newId) {
     window.scrollTo({ top: 0, behavior: 'smooth' })
     await loadProduct()
     if (product.value?.id) await fetchReviews(product.value.id)
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  document.body.style.overflow = '' // Ensure scrolling is restored
  const script = document.getElementById('json-ld-product')
  if (script) {
    document.head.removeChild(script)
  }
  const faqScript = document.getElementById('json-ld-faq')
  if (faqScript) {
    document.head.removeChild(faqScript)
  }
  const bcScript = document.getElementById('json-ld-breadcrumb')
  if (bcScript) {
    document.head.removeChild(bcScript)
  }
  // Reset canonical to homepage
  const canonicalLink = document.querySelector('link[rel="canonical"]')
  if (canonicalLink) {
    canonicalLink.setAttribute('href', `${window.location.origin}/`)
  }
})
</script>

<template>
  <div class="bg-[#FAF9F6] dark:bg-[#0C0E14] min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 transition-colors relative selection:bg-emerald-500/30">
    <div v-if="loading" class="flex flex-col justify-center items-center min-h-[60vh] gap-4">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
        <div class="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
      </div>
      <p class="text-sm font-bold text-gray-500 dark:text-gray-400 animate-pulse tracking-widest uppercase">กำลังโหลดข้อมูลสินค้า</p>
    </div>
    
    <div v-else-if="product" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Modern Breadcrumb -->
      <nav class="flex text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide font-medium" aria-label="Breadcrumb">
        <ol class="flex items-center space-x-2">
          <li>
            <router-link to="/" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1" aria-label="หน้าแรก">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </router-link>
          </li>
          <li><span class="text-gray-500 dark:text-gray-500" aria-hidden="true">/</span></li>
          <li>
            <router-link to="/products" class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">แคตตาล็อกสินค้า</router-link>
          </li>
          <li><span class="text-gray-500 dark:text-gray-500" aria-hidden="true">/</span></li>
          <li>
            <span class="text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-xs block px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              {{ product.title }}
            </span>
          </li>
        </ol>
      </nav>

      <div class="lg:grid lg:grid-cols-12 lg:gap-12 xl:gap-16 items-start">
        <!-- Interactive Image Gallery (Left Column) -->
        <div class="lg:col-span-7 xl:col-span-7 flex flex-col md:flex-row gap-4 lg:sticky lg:top-24 mb-10 lg:mb-0">
          
          <!-- Thumbnails (Desktop: Vertical Left, Mobile: Horizontal Bottom) -->
          <div v-if="product.images.length > 1" class="order-2 md:order-1 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-hide py-1 md:py-0 w-full md:w-20 lg:w-24 xl:w-28 flex-none max-h-[600px]">
            <button 
              v-for="(img, idx) in product.images" 
              :key="idx" 
              @click="setActiveImage(idx)"
              class="relative aspect-square w-20 md:w-full rounded-2xl overflow-hidden bg-white dark:bg-[#111827] border-2 transition-all duration-300 flex-none group shadow-sm"
              :class="activeImageIndex === idx ? 'border-emerald-500 shadow-md transform scale-[1.02]' : 'border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 opacity-60 hover:opacity-100'"
              :aria-label="'ดูรูปภาพที่ ' + (idx + 1)"
            >
              <img :src="getOptimizedImageUrl(img, 150)" :alt="'รูปภาพย่อยที่ ' + (idx + 1)" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" @error="onImageError">
              <div class="absolute inset-0 bg-black/10 transition-opacity" :class="activeImageIndex === idx ? 'opacity-0' : 'opacity-20'"></div>
            </button>
          </div>

          <!-- Main Stage -->
          <div class="order-1 md:order-2 relative w-full aspect-square bg-white dark:bg-[#111827] rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/50 dark:shadow-emerald-900/10 border border-gray-100 dark:border-gray-800 group cursor-zoom-in flex-1" @click="toggleGalleryZoom">
             <img :key="activeImageIndex" :src="getOptimizedImageUrl(product.images[activeImageIndex], 700)" :alt="product.image_alt || product.title" fetchpriority="high" loading="eager" class="absolute inset-0 w-full h-full object-contain transform scale-100 group-hover:scale-105 transition-all duration-700 ease-out" @error="onImageError">
             
             <!-- Category Badge -->
             <div class="absolute top-6 left-6 z-10 flex flex-wrap gap-2">
               <span v-for="cat in product.categories" :key="cat" class="bg-white/95 dark:bg-black/95 backdrop-blur-md text-gray-900 dark:text-white text-[10px] sm:text-xs font-black tracking-widest px-4 py-2 rounded-full uppercase shadow-lg shadow-black/5 border border-white/20 dark:border-gray-700/50">
                 {{ cat }}
               </span>
             </div>

             <!-- Prev/Next Arrows (only when multiple images) -->
             <template v-if="product.images.length > 1">
               <button 
                 @click.stop="setActiveImage((activeImageIndex - 1 + product.images.length) % product.images.length)"
                 class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-200/60 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                 aria-label="รูปก่อนหน้า"
               >
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
               </button>
               <button 
                 @click.stop="setActiveImage((activeImageIndex + 1) % product.images.length)"
                 class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-200/60 dark:border-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                 aria-label="รูปถัดไป"
               >
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
               </button>

               <!-- Dot indicators -->
               <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   v-for="(_, idx) in product.images" 
                   :key="idx"
                   @click.stop="setActiveImage(idx)"
                   class="w-1.5 h-1.5 rounded-full transition-all"
                   :class="activeImageIndex === idx ? 'bg-emerald-500 w-4' : 'bg-white/60 hover:bg-white'"
                   :aria-label="'ไปยังรูปภาพที่ ' + (idx + 1)"
                 ></button>
               </div>
             </template>

             <!-- Expand Hint -->
             <div class="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-white/90 dark:bg-gray-900/90 p-3 rounded-full backdrop-blur-sm shadow-lg border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
             </div>
          </div>
        </div>

        <!-- Sticky Product Info (Right Column) -->
        <div class="lg:col-span-5 xl:col-span-5 flex flex-col pt-2 lg:pt-0">
          
            <!-- Dynamic Tags Above Title (Only Marketing & Installation Badges) -->
            <div class="flex flex-wrap gap-2 mb-3" v-if="productBadges.filter(b => ['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id)).length > 0">
              <div v-for="badge in productBadges.filter(b => ['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id))" :key="badge.id" 
                   :class="`group relative inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full text-${badge.color}-700 dark:text-${badge.color}-300 bg-white/70 dark:bg-${badge.color}-950/40 border border-${badge.color}-200/70 dark:border-${badge.color}-800/70 shadow-2xs backdrop-blur-md hover:shadow-xs transition-all`">
                <span v-if="badge.icon === 'cog' || badge.id === 'badge-installation'" class="relative flex h-2 w-2">
                  <span :class="`animate-ping absolute inline-flex h-full w-full rounded-full bg-${badge.color}-400 opacity-75`"></span>
                  <span :class="`relative inline-flex rounded-full h-2 w-2 bg-${badge.color}-500`"></span>
                </span>
                
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" :d="getBadgeIconPath(badge.icon)"></path></svg>
                <span>{{ badge.name }}</span>
              </div>
            </div>
            
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3 leading-tight">
              {{ product.title }}
              <span v-if="product.sku" class="inline-flex items-center gap-1 px-2.5 py-0.5 ml-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 text-[11px] font-bold border border-slate-200/80 dark:border-slate-700/80 align-middle shadow-2xs">
                <svg class="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"></path></svg>
                <span>SKU: <span class="text-slate-800 dark:text-slate-200 font-extrabold">{{ product.sku }}</span></span>
              </span>
            </h1>
            
            <div class="flex items-center gap-2.5 mb-4" v-if="product.review_count > 0 && (settingsStore.showProductRating || settingsStore.showProductReview)">
               <div class="flex items-center bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md border border-amber-100 dark:border-amber-800/30 text-xs font-bold" :title="`${product.rating || 5} ดาว`" v-if="settingsStore.showProductRating">
                  <span class="text-amber-600 dark:text-amber-400 font-black mr-1">{{ product.rating || 5.0 }}</span>
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" v-for="i in 5" :key="i" :class="i <= Math.round(product.rating || 5) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
               </div>
               <span class="text-xs font-medium text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400" :class="{ 'border-b': settingsStore.showProductReview }" @click="settingsStore.showProductReview ? activeTab = 'reviews' : null" v-if="settingsStore.showProductReview">อ่านรีวิวผู้ใช้งาน ({{ product.review_count || 0 }})</span>
            </div>

            <!-- Compact & Modern Price Block -->
            <div class="bg-gradient-to-b from-white to-gray-50/60 dark:from-[#1A1A1A] dark:to-[#252525] rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 dark:border-gray-800 relative overflow-hidden mb-5 group/pricebox">
               <!-- Decorative Subtle Glow -->
               <div class="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-amber-100/30 to-amber-50/5 dark:from-amber-900/10 dark:to-transparent rounded-full blur-2xl pointer-events-none"></div>
               
               <div class="relative z-10">
                 <!-- Flash Sale Banner -->
                 <div v-if="timeRemainingObj" class="mb-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-2.5 flex flex-col sm:flex-row items-center justify-between shadow-xs text-white relative overflow-hidden">
                   <div class="flex items-center gap-1.5 relative z-10 mb-2 sm:mb-0">
                      <svg class="w-4 h-4 animate-pulse shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/></svg>
                      <span class="font-extrabold uppercase text-xs">Flash Sale</span>
                   </div>
                    <div class="flex items-center gap-2 relative z-10">
                      <span class="text-[10px] font-bold opacity-90 uppercase hidden sm:inline-block">Ends in</span>
                      <div class="flex gap-1 text-center font-mono">
                         <div v-if="timeRemainingObj.days > 0" class="bg-black/20 rounded-md min-w-[30px] py-0.5 px-1 border border-white/10">
                            <span class="block text-xs font-black">{{ timeRemainingObj.days }}</span>
                            <span class="block text-[7px] uppercase opacity-80">วัน</span>
                         </div>
                         <div class="bg-black/20 rounded-md min-w-[30px] py-0.5 px-1 border border-white/10">
                            <span class="block text-xs font-black">{{ String(timeRemainingObj.hours).padStart(2, '0') }}</span>
                            <span class="block text-[7px] uppercase opacity-80">ชม.</span>
                         </div>
                         <div class="text-white/50 font-black self-start pt-0.5 text-xs animate-pulse">:</div>
                         <div class="bg-black/20 rounded-md min-w-[30px] py-0.5 px-1 border border-white/10">
                             <span class="block text-xs font-black">{{ String(timeRemainingObj.minutes).padStart(2, '0') }}</span>
                             <span class="block text-[7px] uppercase opacity-80">นาที</span>
                          </div>
                          <div class="text-white/50 font-black self-start pt-0.5 text-xs animate-pulse">:</div>
                          <div class="bg-black/20 rounded-md min-w-[30px] py-0.5 px-1 border border-white/10">
                             <span class="block text-xs font-black">{{ String(timeRemainingObj.seconds).padStart(2, '0') }}</span>
                             <span class="block text-[7px] uppercase opacity-80">วิ</span>
                          </div>
                      </div>
                    </div>
                 </div>

                 <!-- Original Price & Discount Tag (No Emoji) -->
                 <div v-if="product.original_price && Number(product.original_price) > Number(product.price.replace(/[^0-9.-]+/g,'')) && product.price !== 'สอบถามราคา'" class="flex items-center gap-2.5 mb-1">
                   <span class="text-base text-gray-400 dark:text-gray-500 line-through font-bold">฿{{ Number(product.original_price).toLocaleString() }}</span>
                   <span class="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 to-red-500 text-white text-[11px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                      <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
                      <span>ลด {{ Math.round(((product.original_price - product.price.replace(/[^0-9.-]+/g,'')) / product.original_price) * 100) }}%</span>
                   </span>
                 </div>
                 
                 <!-- Main Price Display -->
                 <div class="flex items-baseline gap-2 mb-1">
                   <strong class="text-3xl sm:text-4xl md:text-[2.75rem] font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">{{ product.price }}</strong>
                   <span v-if="product.price !== 'สอบถามราคา'" class="text-gray-500 dark:text-gray-400 font-bold text-sm">/ ชุด</span>
                 </div>

                 <!-- Stock Urgency -->
                 <div v-if="product.stock_quantity !== null && product.stock_quantity > 0 && product.stock_quantity <= 10" class="mt-3 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 bg-rose-50/80 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40">
                   <div class="relative flex h-2.5 w-2.5 shrink-0">
                     <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                   </div>
                    <span>ด่วน! สินค้าเหลือเพียง <strong class="font-black">{{ product.stock_quantity }}</strong> ชิ้นสุดท้าย</span>
                 </div>

                  <!-- Service & Warranty Badges Bar (Clean SVG Icons, Compact Pills) -->
                  <div class="mt-4 pt-3.5 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center gap-2 text-xs flex-wrap" v-if="product.free_install_bkk || product.badge_free_shipping || product.free_shipping_bkk || productBadges.filter(b => !['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id)).length > 0">
                     
                     <!-- Free Installation Badge -->
                     <div v-if="product.free_install_bkk" class="inline-flex items-center gap-1.5 bg-teal-50/90 dark:bg-teal-950/40 px-2.5 py-1 rounded-lg border border-teal-200/80 dark:border-teal-800/60 text-teal-700 dark:text-teal-300 font-bold shadow-2xs cursor-default">
                        <svg class="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <span>ฟรีติดตั้ง {{ settingsStore.freeInstallProvinces.length <= 4 ? settingsStore.freeInstallProvinces.join(', ') : settingsStore.freeInstallProvinces.slice(0, 3).join(', ') + ' +' + (settingsStore.freeInstallProvinces.length - 3) + ' จังหวัด' }}</span>
                     </div>

                     <!-- Free Shipping Nationwide Badge -->
                     <div v-if="product.badge_free_shipping" class="inline-flex items-center gap-1.5 bg-emerald-50/90 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs cursor-default">
                        <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                        <span>จัดส่งฟรีทั่วประเทศ</span>
                     </div>

                     <!-- Free Shipping BKK Badge -->
                     <div v-if="product.free_shipping_bkk" class="inline-flex items-center gap-1.5 bg-blue-50/90 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-bold shadow-2xs cursor-default">
                        <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                        <span>ส่งฟรีกทม.และปริมณฑล</span>
                     </div>

                     <!-- Dynamic Badges -->
                     <div v-for="badge in productBadges.filter(b => !['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id))" :key="badge.id" 
                          :class="`inline-flex items-center gap-1.5 bg-${badge.color}-50/90 dark:bg-${badge.color}-950/40 px-2.5 py-1 rounded-lg border border-${badge.color}-200/80 dark:border-${badge.color}-800/60 text-${badge.color}-700 dark:text-${badge.color}-300 font-bold shadow-2xs cursor-default`">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" :d="getBadgeIconPath(badge.icon)"></path></svg>
                        <span>{{ badge.name }}</span>
                     </div>
                  </div>

               </div>
            </div>

            <!-- Add to Cart & Action Section (Compact & Sleek) -->
            <div class="flex flex-col gap-3 mb-5">
              <!-- Quantity Selector -->
              <div v-if="product.price !== 'สอบถามราคา' && !product.is_out_of_stock" class="flex items-center gap-3">
                <span class="text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">จำนวน</span>
                <div class="inline-flex items-center bg-gray-50 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-2xs">
                  <button @click="quantity > 1 ? quantity-- : null" class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-black text-base" aria-label="ลดจำนวน">−</button>
                  <span class="w-10 text-center font-black text-gray-900 dark:text-white text-sm border-x border-gray-200 dark:border-gray-700 py-1.5">{{ quantity }}</span>
                  <button @click="product.stock_quantity === null || quantity < product.stock_quantity ? quantity++ : null" class="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors font-black text-base" aria-label="เพิ่มจำนวน">+</button>
                </div>
                <span v-if="product.stock_quantity !== null" class="text-xs text-gray-600 dark:text-gray-400">มีสินค้า {{ product.stock_quantity }} ชิ้น</span>
              </div>

              <!-- Out of Stock -->
              <div v-if="product.is_out_of_stock" class="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl border border-red-100 dark:border-red-800/30">
                <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="font-bold text-sm">สินค้าหมด — กรุณาติดต่อสอบถาม</span>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2.5">
                <!-- Add to Cart -->
                <button
                  v-if="!product.is_out_of_stock && product.price !== 'สอบถามราคา'"
                  @click="addToCart"
                  id="add-to-cart-btn"
                  class="flex-1 group relative flex items-center justify-center gap-2 bg-[#b45309] hover:bg-[#92400e] active:bg-[#78350f] text-white font-extrabold text-sm sm:text-base py-3 px-5 rounded-xl shadow-md shadow-amber-700/20 transition-all duration-200 overflow-hidden"
                >
                  <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  <span>เพิ่มลงตะกร้า</span>
                </button>

                <!-- Inquiry via LINE -->
                <a
                  v-if="product.is_out_of_stock || product.price === 'สอบถามราคา'"
                  :href="getLineInquiryUrl(product.title)"
                  target="_blank" rel="noopener"
                  class="flex-1 flex items-center justify-center gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-sm sm:text-base py-3 px-5 rounded-xl shadow-md shadow-green-500/20 transition-all duration-200"
                >
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                  <span>สอบถามผ่าน LINE</span>
                </a>

                <!-- Wishlist Button -->
                <button
                  v-if="settingsStore.isWishlistEnabled !== false"
                  @click="handleToggleWishlist"
                  :class="wishlistStore.isInWishlist(product.id) ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/50 text-rose-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-rose-200 hover:text-rose-500 dark:hover:border-rose-700'"
                  class="w-11 h-11 flex items-center justify-center border rounded-xl transition-all duration-200 hover:shadow-2xs shrink-0"
                  :aria-label="wishlistStore.isInWishlist(product.id) ? 'ลบจากรายการโปรด' : 'เพิ่มในรายการโปรด'"
                  id="wishlist-btn"
                >
                  <svg class="w-5 h-5" :fill="wishlistStore.isInWishlist(product.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </button>

                <!-- Compare Button -->
                <button
                  v-if="settingsStore.isCompareEnabled !== false"
                  @click="compareStore.toggleCompare(product)"
                  :class="compareStore.isInCompare(product.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-500' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-200 hover:text-blue-500 dark:hover:border-blue-700'"
                  class="w-11 h-11 flex items-center justify-center border rounded-xl transition-all duration-200 hover:shadow-2xs shrink-0"
                  aria-label="เปรียบเทียบสินค้า"
                  id="compare-btn"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </button>
              </div>

              <!-- LINE secondary CTA -->
              <a
                v-if="!product.is_out_of_stock && product.price !== 'สอบถามราคา'"
                :href="getLineInquiryUrl(product.title)"
                target="_blank" rel="noopener"
                class="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#047857] dark:text-emerald-400 hover:underline py-1"
              >
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                <span>หรือสอบถามเพิ่มเติมผ่าน LINE</span>
              </a>
            </div>

            <!-- Social Share -->
            <SocialShare :title="product.title" :url="$route.fullPath" class="mt-1" />
        </div>
      </div>

      <div class="mt-12 md:mt-16">
        <div class="flex items-center justify-start border-b border-gray-200/80 dark:border-gray-800 pb-4 overflow-x-auto scrollbar-hide">
          <div class="inline-flex items-center gap-1.5 p-1.5 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200/70 dark:border-gray-700/70 shadow-inner max-w-full">
            
            <!-- Description Tab -->
            <button
              v-if="product.description"
              @click="activeTab = 'description'"
              :class="activeTab === 'description' 
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-950/5 border border-gray-200/60 dark:border-gray-700/60 font-bold scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-gray-700/50'"
              class="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 whitespace-nowrap shrink-0"
              id="tab-description"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>รายละเอียด</span>
            </button>

            <!-- Specs Tab -->
            <button
              v-if="product.attributes && product.attributes.length > 0"
              @click="activeTab = 'specs'"
              :class="activeTab === 'specs' 
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-950/5 border border-gray-200/60 dark:border-gray-700/60 font-bold scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-gray-700/50'"
              class="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 whitespace-nowrap shrink-0"
              id="tab-specs"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              <span>ข้อมูลจำเพาะ</span>
            </button>

            <!-- FAQ Tab -->
            <button
              v-if="product.faq && product.faq.length > 0"
              @click="activeTab = 'faq'"
              :class="activeTab === 'faq' 
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-950/5 border border-gray-200/60 dark:border-gray-700/60 font-bold scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-gray-700/50'"
              class="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 whitespace-nowrap shrink-0"
              id="tab-faq"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>คำถามที่พบบ่อย</span>
            </button>

            <!-- Reviews Tab -->
            <button
              v-if="settingsStore.showProductReview"
              @click="activeTab = 'reviews'"
              :class="activeTab === 'reviews' 
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-950/5 border border-gray-200/60 dark:border-gray-700/60 font-bold scale-[1.02]' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-gray-700/50'"
              class="flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm rounded-xl transition-all duration-200 whitespace-nowrap shrink-0"
              id="tab-reviews"
            >
              <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
              <span>รีวิว</span>
              <span 
                :class="activeTab === 'reviews' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-400'"
                class="px-2 py-0.5 text-xs rounded-full font-bold transition-colors ml-0.5"
              >
                {{ product.review_count || 0 }}
              </span>
            </button>
          </div>
        </div>

        <div class="mt-8 md:mt-12">
          <!-- Description -->
          <div v-show="activeTab === 'description'" class="ck-content prose prose-gray dark:prose-invert max-w-none" v-html="product.description"></div>

          <!-- Specs: 1-Column Space-Saving Compact Table -->
          <div v-show="activeTab === 'specs'">
            <div class="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm">
              <div 
                v-for="(attr, i) in product.attributes" 
                :key="i" 
                class="flex flex-col sm:flex-row sm:items-center py-3 px-5 sm:px-6 border-b border-gray-100 dark:border-gray-800/80 last:border-b-0 even:bg-gray-50/50 dark:even:bg-gray-800/20 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors duration-150 gap-1 sm:gap-6"
              >
                <div class="sm:w-2/5 shrink-0 flex items-center">
                  <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{{ attr.label || attr.key }}</span>
                </div>
                <div class="sm:w-3/5 text-sm font-black text-gray-900 dark:text-white leading-relaxed">
                  {{ attr.value }}
                </div>
              </div>
            </div>
          </div>

          <!-- FAQ: Full-Width Space-Saving Compact Accordion Container -->
          <div v-show="activeTab === 'faq'" class="w-full">
            <div class="overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/60 shadow-sm">
              <details 
                v-for="(item, i) in product.faq" 
                :key="i" 
                class="group border-b border-gray-100 dark:border-gray-800/80 last:border-b-0 even:bg-gray-50/50 dark:even:bg-gray-800/20 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-colors duration-150"
              >
                <summary class="flex items-center justify-between gap-4 py-3.5 px-5 sm:px-6 cursor-pointer select-none list-none font-bold text-gray-900 dark:text-white text-sm md:text-base hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  <span>{{ item.question }}</span>
                  <svg class="w-5 h-5 text-amber-500 shrink-0 transition-transform duration-300 group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                </summary>
                <div class="px-5 sm:px-6 pb-4 pt-2 text-sm text-gray-700 dark:text-gray-200 leading-relaxed border-t border-gray-100 dark:border-gray-800/60">
                  {{ item.answer }}
                </div>
              </details>
            </div>
          </div>

          <!-- Reviews -->
          <div v-show="activeTab === 'reviews' && settingsStore.showProductReview">
            <div v-if="reviewsSummary.total > 0" class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 bg-white dark:bg-gray-900/60 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <div class="text-center shrink-0">
                <p class="text-6xl font-black text-gray-900 dark:text-white">{{ reviewsSummary.average?.toFixed(1) }}</p>
                <div class="flex justify-center gap-0.5 mt-1">
                  <svg v-for="i in 5" :key="i" class="w-4 h-4" :class="i <= Math.round(reviewsSummary.average) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ reviewsSummary.total }} รีวิว</p>
              </div>
              <div class="flex-1 w-full space-y-2">
                <div v-for="star in [5,4,3,2,1]" :key="star" class="flex items-center gap-2">
                  <span class="text-xs font-bold text-gray-500 w-3">{{ star }}</span>
                  <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <div class="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div class="bg-amber-400 h-2 rounded-full transition-all duration-700" :style="`width: ${reviewsSummary.total > 0 ? (reviewsSummary.distribution[star] / reviewsSummary.total * 100) : 0}%`"></div>
                  </div>
                  <span class="text-xs text-gray-600 dark:text-gray-400 w-6 text-right">{{ reviewsSummary.distribution[star] || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-4 mb-8">
              <div v-for="review in reviews" :key="review.id" class="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-sm shrink-0">{{ getReviewerInitials(review) }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                      <p class="font-bold text-gray-900 dark:text-white text-sm">{{ getReviewerName(review) }}</p>
                      <span class="text-xs text-gray-600 dark:text-gray-400">{{ timeAgo(review.created_at) }}</span>
                    </div>
                    <div class="flex gap-0.5 my-1">
                      <svg v-for="i in 5" :key="i" class="w-3.5 h-3.5" :class="i <= review.rating ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{{ review.comment }}</p>
                    <div v-if="review.images && review.images.length > 0" class="flex flex-wrap gap-2 mt-3">
                      <button v-for="(img, idx) in review.images" :key="idx" @click="openGalleryFromReview(review.images, idx)" class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:opacity-90 transition-opacity">
                        <img :src="getOptimizedImageUrl(img, 150)" :alt="`รีวิวรูปภาพ ${idx+1}`" class="absolute inset-0 w-full h-full object-cover" @error="onImageError">
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="hasMoreReviews" class="text-center mt-4">
                <button @click="loadMoreReviews" :disabled="fetchingReviews" class="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors disabled:opacity-50">{{ fetchingReviews ? 'กำลังโหลด...' : 'โหลดรีวิวเพิ่มเติม' }}</button>
              </div>
              <p v-if="reviews.length === 0 && !fetchingReviews" class="text-center text-gray-400 dark:text-gray-600 text-sm py-8">ยังไม่มีรีวิวสำหรับสินค้านี้</p>
            </div>

            <div v-if="settingsStore.showProductReview" class="bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
              <h3 class="font-black text-gray-900 dark:text-white mb-5">เขียนรีวิว</h3>
              <div v-if="!authStore.isAuthenticated" class="text-center py-4">
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">กรุณาเข้าสู่ระบบก่อนเขียนรีวิว</p>
                <router-link to="/login" class="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl transition-colors">เข้าสู่ระบบ</router-link>
              </div>
              <form v-else @submit.prevent="submitReview" class="space-y-4">
                <div class="flex items-center gap-1">
                  <button v-for="star in 5" :key="star" type="button" @click="reviewForm.rating = star" @mouseover="reviewHoverRating = star" @mouseleave="reviewHoverRating = 0" class="focus:outline-none">
                    <svg class="w-8 h-8 transition-colors" :class="star <= (reviewHoverRating || reviewForm.rating) ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  </button>
                </div>
                <textarea v-model="reviewForm.comment" rows="4" placeholder="แชร์ประสบการณ์ของคุณ..." class="w-full px-4 py-3 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" required></textarea>
                <div class="flex flex-wrap gap-2 items-center">
                  <div v-for="(img, idx) in reviewForm.images" :key="idx" class="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <img :src="getOptimizedImageUrl(img, 150)" :alt="`review-upload-${idx}`" class="absolute inset-0 w-full h-full object-cover" @error="onImageError">
                    <button type="button" @click="removeReviewImage(idx)" class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">x</button>
                  </div>
                  <label v-if="reviewForm.images.length < 3" class="w-16 h-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    <span class="text-[10px] text-gray-400 mt-1">รูปภาพ</span>
                    <input ref="reviewImageInput" type="file" accept="image/*" multiple class="hidden" @change="handleReviewImageUpload" :disabled="uploadingReviewImage">
                  </label>
                </div>
                <button type="submit" :disabled="reviewSubmitting || !reviewForm.comment" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span v-if="reviewSubmitting">กำลังส่ง...</span>
                  <span v-else>ส่งรีวิว</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Frequently Bought Together -->
      <FrequentlyBoughtTogether :product-id="product.id" class="mt-16 md:mt-24" />

      <!-- Product Accessories -->
      <ProductAccessories :product="product" class="mt-10" />

      <!-- Related Products -->
      <div v-if="relatedProducts.length > 0" class="mt-16 md:mt-24">
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-8">สินค้าที่เกี่ยวข้อง</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <ProductCard v-for="rp in relatedProducts" :key="rp.id" :product="rp" />
        </div>
      </div>

      <!-- Recently Viewed -->
      <RecentlyViewed :current-product-id="product.id" class="mt-16 md:mt-24" />
    </div>

    <!-- Product Not Found -->
    <div v-else-if="!loading" class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h1 class="text-2xl font-black text-gray-900 dark:text-white mb-3">ไม่พบสินค้า</h1>
      <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">ขออภัย ไม่พบสินค้าที่คุณค้นหา อาจถูกลบออกหรือ URL ไม่ถูกต้อง</p>
      <router-link to="/products" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3 rounded-2xl transition-colors shadow-lg shadow-emerald-500/25">ดูสินค้าทั้งหมด</router-link>
    </div>
  </div>

  <!-- Gallery Lightbox Modal -->
  <teleport to="body">
    <transition name="fade">
      <div v-if="isGalleryZoomed && product" class="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center" @click.self="toggleGalleryZoom">
        <button @click="toggleGalleryZoom" class="absolute top-4 right-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10" aria-label="ปิด">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full border border-white/10">{{ activeImageIndex + 1 }} / {{ product.images.length }}</div>
        <div class="relative max-w-5xl max-h-[85vh] w-full mx-4 flex items-center justify-center">
          <transition name="fade" mode="out-in">
            <img :key="activeImageIndex" :src="getOptimizedImageUrl(product.images[activeImageIndex], 1200)" :alt="product.image_alt || product.title" class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" @error="onImageError">
          </transition>
          <button v-if="product.images.length > 1" @click="setActiveImage((activeImageIndex - 1 + product.images.length) % product.images.length)" class="absolute left-0 -translate-x-14 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10" aria-label="รูปก่อนหน้า">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button v-if="product.images.length > 1" @click="setActiveImage((activeImageIndex + 1) % product.images.length)" class="absolute right-0 translate-x-14 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10" aria-label="รูปถัดไป">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div v-if="product.images.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-hide px-4">
          <button v-for="(img, idx) in product.images" :key="idx" @click="setActiveImage(idx)" :class="idx === activeImageIndex ? 'border-emerald-400 opacity-100 scale-110' : 'border-white/20 opacity-50 hover:opacity-80'" class="w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all duration-300 bg-black/40" :aria-label="`ดูรูปภาพที่ ${idx + 1}`">
            <img :src="getOptimizedImageUrl(img, 100)" :alt="`thumbnail-${idx}`" class="w-full h-full object-cover" @error="onImageError">
          </button>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<style scoped>
/* Scrollbar Hiding */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* Transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Accordion Animation */
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 1000px;
  overflow: hidden;
}
.accordion-enter-from, .accordion-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Tab Fade Animation */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* CKEditor Text Content Styling */

/* Headings */
:deep(.ck-content h2) {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1f2937;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  line-height: 1.3;
}
:deep(.ck-content h3) {
  font-size: 1.375rem;
  font-weight: 700;
  color: #374151;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}
:deep(.ck-content h4) {
  font-size: 1.125rem;
  font-weight: 700;
  color: #4b5563;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
:deep(.dark .ck-content h2) { color: #f9fafb; }
:deep(.dark .ck-content h3) { color: #e5e7eb; }
:deep(.dark .ck-content h4) { color: #d1d5db; }

/* Paragraphs */
:deep(.ck-content p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
  color: #374151;
  font-size: 1rem;
}
:deep(.dark .ck-content p) {
  color: #d1d5db;
}

/* Strong / Bold */
:deep(.ck-content strong) {
  color: #111827;
  font-weight: 700;
}
:deep(.dark .ck-content strong) {
  color: #f9fafb;
}

/* Lists */
:deep(.ck-content ul),
:deep(.ck-content ol) {
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}
:deep(.ck-content ul) { list-style-type: disc; }
:deep(.ck-content ol) { list-style-type: decimal; }

:deep(.ck-content li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
  color: #374151;
}
:deep(.dark .ck-content li) { color: #d1d5db; }

/* Links */
:deep(.ck-content a) {
  color: #059669;
  text-decoration: underline;
  text-decoration-color: #a7f3d0;
  transition: all 0.2s;
}
:deep(.ck-content a:hover) {
  color: #047857;
  text-decoration-color: #059669;
}
:deep(.dark .ck-content a) {
  color: #34d399;
  text-decoration-color: #065f46;
}

/* Blockquote */
:deep(.ck-content blockquote) {
  border-left: 4px solid #10b981;
  background-color: #f9fafb;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
  border-radius: 0 12px 12px 0;
  font-style: italic;
  color: #374151;
}
:deep(.dark .ck-content blockquote) {
  background-color: #1f2937;
  border-left-color: #059669;
  color: #d1d5db;
}

/* Horizontal Rule */
:deep(.ck-content hr) {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2.5rem 0;
}
:deep(.dark .ck-content hr) {
  border-top-color: #374151;
}

/* Tables */
:deep(.ck-content table) {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
:deep(.ck-content th) {
  background-color: #f3f4f6;
  font-weight: 700;
  padding: 0.75rem 1rem;
  text-align: left;
  color: #111827;
  border-bottom: 2px solid #e5e7eb;
}
:deep(.dark .ck-content th) {
  background-color: #1f2937;
  color: #f9fafb;
  border-bottom-color: #374151;
}
:deep(.ck-content td) {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}
:deep(.dark .ck-content td) {
  color: #d1d5db;
  border-bottom-color: #374151;
}
:deep(.ck-content tr:last-child td) { border-bottom: none; }
:deep(.ck-content tr:nth-child(even) td) { background-color: #fafafa; }
:deep(.dark .ck-content tr:nth-child(even) td) { background-color: #1f2937; }

/* Images */
:deep(.ck-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 1.5rem auto;
  display: block;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Media (YouTube embeds) */
:deep(.ck-content figure.media) {
  @apply mx-auto my-8 w-full relative overflow-hidden rounded-2xl;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1);
  padding-bottom: 56.25%;
  height: 0;
}
:deep(.ck-content figure.media iframe) {
  @apply absolute top-0 left-0 w-full h-full;
  border: 0;
}

:deep(.ck-content figure.image) {
  @apply mx-auto text-center my-8 flex flex-col justify-center items-center w-full max-w-full overflow-hidden;
}

:deep(.ck-content figure.image > a) {
  @apply block max-w-full;
}

:deep(.ck-content figcaption) {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-3 italic bg-gray-50 px-4 py-1.5 rounded-full inline-block;
}

/* Image grid support */
:deep(.ck-content .image-style-side) {
  @apply float-right ml-6 mb-6 max-w-[50%];
}
:deep(.ck-content .image-style-align-left) {
  @apply float-left mr-6 mb-6 max-w-[50%];
}
:deep(.ck-content .image-style-align-center) {
  @apply mx-auto block;
}
</style>



