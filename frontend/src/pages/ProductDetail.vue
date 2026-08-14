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
import { useSEO } from '../composables/useSEO'
import { apiFetch } from '../utils/apiFetch'
import { getOptimizedImageUrl, onImageError } from '../utils/image'
import CapabilityIcon from '../components/ui/CapabilityIcon.vue'
import WireSample from '../components/ui/WireSample.vue'
import { getWireSampleTitle } from '../utils/wire'

const route = useRoute()
const trackingStore = useTrackingStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const { showToast } = useToast()
const { setMeta, setStructuredData } = useSEO()
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

// Machinery & Card Features computed (Strictly from Admin / Database)
const cardFeatures = computed(() => {
  const cf = product.value?.card_features
  if (!cf) return {}
  return typeof cf === 'string' ? (JSON.parse(cf) || {}) : cf
})

const modelName = computed(() => {
  if (cardFeatures.value?.model_name) return cardFeatures.value.model_name
  if (product.value?.sku) return product.value.sku
  return product.value?.title || product.value?.name || ''
})

const subtitle = computed(() => {
  if (cardFeatures.value?.subtitle) return cardFeatures.value.subtitle
  if (product.value?.subtitle && product.value.subtitle !== 'แนะนำ' && product.value.subtitle !== 'ขายดี') return product.value.subtitle
  return ''
})

const specRange = computed(() => {
  if (cardFeatures.value?.spec_range) return cardFeatures.value.spec_range
  if (product.value?.attributes) {
    try {
      const attrs = typeof product.value.attributes === 'string' ? JSON.parse(product.value.attributes) : product.value.attributes
      const found = attrs?.find(a => a.key?.includes('ขนาดสายไฟ') || a.value?.includes('AWG'))
      if (found) return found.value
    } catch (e) {}
  }
  if (product.value?.size) return product.value.size
  return ''
})

const capabilitiesList = computed(() => {
  if (Array.isArray(cardFeatures.value?.capabilities) && cardFeatures.value.capabilities.length > 0) {
    return cardFeatures.value.capabilities.filter(c => c.enabled !== false)
  }
  return []
})

const wireSamples = computed(() => {
  if (Array.isArray(cardFeatures.value?.wire_samples) && cardFeatures.value.wire_samples.length > 0) {
    return cardFeatures.value.wire_samples
  }
  return []
})

const contactPhonesList = computed(() => {
  if (cardFeatures.value?.service_call || cardFeatures.value?.hotline) {
    const list = []
    if (cardFeatures.value?.service_call) {
      list.push({ name: 'SERVICE', value: cardFeatures.value.service_call, type: 'service' })
    }
    if (cardFeatures.value?.hotline) {
      list.push({ name: 'HOTLINE', value: cardFeatures.value.hotline, type: 'hotline' })
    }
    return list
  }
  // Pull directly from Admin (/admin/contact)
  if (Array.isArray(settingsStore.contactPhones) && settingsStore.contactPhones.length > 0) {
    return settingsStore.contactPhones.filter(p => p && p.value).map((p, idx) => ({
      name: p.name || (idx === 0 ? 'สำนักงาน' : 'โทรศัพท์'),
      value: p.value,
      type: idx === 0 ? 'office' : (idx === 1 ? 'manager' : 'sales')
    }))
  }
  if (settingsStore.storePhone) {
    return [{ name: 'โทรศัพท์', value: settingsStore.storePhone, type: 'office' }]
  }
  return []
})

const contactEmailsList = computed(() => {
  if (Array.isArray(settingsStore.contactEmails) && settingsStore.contactEmails.length > 0) {
    return settingsStore.contactEmails.filter(e => e && e.value)
  }
  return []
})

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

      // Update Dynamic SEO & GEO Tags
      const seoTitle = p.seo_title || p.name
      const seoDesc = p.seo_description || p.short_description || (p.description ? p.description.replace(/<[^>]*>?/gm, '').substring(0, 160) : '')
      const seoImg = p.image_url || (allImages.length > 0 ? allImages[0] : '')

      setMeta({
        title: seoTitle,
        description: seoDesc,
        image: seoImg,
        keywords: p.seo_keywords || '',
        llmContext: p.llm_context || '',
        canonicalUrl: window.location.href,
        type: 'product'
      })

      // Set Product JSON-LD Schema
      const origin = window.location.origin
      setStructuredData({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": p.name,
        "image": allImages.map(img => img.startsWith('http') ? img : `${origin}${img}`),
        "description": p.llm_context ? `${seoDesc} [AI Context: ${p.llm_context}]` : seoDesc,
        "sku": p.sku || `PROD-${p.id}`,
        "brand": { "@type": "Brand", "name": p.brand || settingsStore.storeName || '' },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": "THB",
          "price": String(p.price || 0),
          "availability": p.is_active && !p.is_out_of_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          "seller": { "@type": "Organization", "name": settingsStore.companyLegalName || settingsStore.storeName || '' }
        }
      }, 'dynamic-structured-data')

      // Set Breadcrumb JSON-LD Schema
      setStructuredData({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${origin}/` },
          { "@type": "ListItem", "position": 2, "name": "สินค้า", "item": `${origin}/products` },
          { "@type": "ListItem", "position": 3, "name": p.name, "item": window.location.href }
        ]
      }, 'dynamic-breadcrumb-data')

      // Set FAQ JSON-LD Schema
      if (parsedFaq.length > 0) {
        setStructuredData({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": parsedFaq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
          }))
        }, 'dynamic-faq-data')
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
        <div class="lg:col-span-7 xl:col-span-7 flex flex-col gap-4 lg:sticky lg:top-24 mb-10 lg:mb-0">
          
          <!-- Main Stage -->
          <div class="relative w-full aspect-square bg-white dark:bg-[#111827] rounded-3xl overflow-hidden shadow-xl shadow-slate-200/60 dark:shadow-black/40 border border-slate-200/80 dark:border-slate-800 group cursor-zoom-in flex items-center justify-center p-3 sm:p-6" @click="toggleGalleryZoom">
             <img 
               :key="activeImageIndex" 
               :src="getOptimizedImageUrl(product.images[activeImageIndex], 1200)" 
               :alt="product.image_alt || product.title" 
               fetchpriority="high" 
               loading="eager" 
               class="w-full h-full object-contain transform scale-100 group-hover:scale-105 transition-all duration-700 ease-out select-none" 
               @error="onImageError"
             >
             
             <!-- Category Badge -->
             <div class="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex flex-wrap gap-2 pointer-events-none">
               <span v-for="cat in product.categories" :key="cat" class="bg-white/95 dark:bg-black/95 backdrop-blur-md text-gray-900 dark:text-white text-[10px] sm:text-xs font-black tracking-widest px-3.5 py-1.5 rounded-full uppercase shadow-lg shadow-black/5 border border-white/20 dark:border-gray-700/50">
                 {{ cat }}
               </span>
             </div>

             <!-- Prev/Next Arrows (only when multiple images) -->
             <template v-if="product.images.length > 1">
               <button 
                 @click.stop="setActiveImage((activeImageIndex - 1 + product.images.length) % product.images.length)"
                 class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-gray-200/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 hover:text-[#0220A4] dark:hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                 aria-label="รูปก่อนหน้า"
               >
                 <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
               </button>
               <button 
                 @click.stop="setActiveImage((activeImageIndex + 1) % product.images.length)"
                 class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-gray-200/80 dark:border-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 hover:text-[#0220A4] dark:hover:text-blue-400 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer"
                 aria-label="รูปถัดไป"
               >
                 <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
               </button>

               <!-- Dot indicators -->
               <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   v-for="(_, idx) in product.images" 
                   :key="idx"
                   @click.stop="setActiveImage(idx)"
                   class="h-1.5 rounded-full transition-all duration-300"
                   :class="activeImageIndex === idx ? 'bg-[#0220A4] dark:bg-blue-400 w-5' : 'bg-slate-300 dark:bg-slate-700 w-1.5 hover:bg-slate-400'"
                   :aria-label="'ไปยังรูปภาพที่ ' + (idx + 1)"
                 ></button>
               </div>
             </template>

             <!-- Expand Hint -->
             <div class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-white/90 dark:bg-gray-900/90 p-2.5 rounded-full backdrop-blur-md shadow-lg border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 pointer-events-none">
                <svg class="w-4 h-4 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
             </div>
          </div>

          <!-- Thumbnails Row (Placed Underneath Main Image) -->
          <div v-if="product.images.length > 1" class="w-full">
            <div class="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1.5 px-0.5">
              <button 
                v-for="(img, idx) in product.images" 
                :key="idx" 
                @click="setActiveImage(idx)"
                class="relative aspect-square w-20 sm:w-24 rounded-2xl overflow-hidden bg-white dark:bg-[#111827] border-2 transition-all duration-300 flex-none group shadow-xs p-1.5 flex items-center justify-center cursor-pointer"
                :class="activeImageIndex === idx ? 'border-[#0220A4] dark:border-blue-500 shadow-md ring-2 ring-[#0220A4]/20 scale-[1.03]' : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 opacity-60 hover:opacity-100'"
                :aria-label="'ดูรูปภาพที่ ' + (idx + 1)"
              >
                <img :src="getOptimizedImageUrl(img, 200)" :alt="'รูปภาพย่อยที่ ' + (idx + 1)" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" @error="onImageError">
                <div class="absolute inset-0 bg-black/5 transition-opacity pointer-events-none" :class="activeImageIndex === idx ? 'opacity-0' : 'opacity-10'"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- Sticky Product Info (Right Column: Compact & Space Saving) -->
        <div class="lg:col-span-5 xl:col-span-5 flex flex-col pt-2 lg:pt-0 space-y-3.5">
          
          <!-- Header Area: Title, SKU, Subtitle & Spec Badge -->
          <div class="space-y-1.5">
            <!-- Dynamic Tags Above Title -->
            <div class="flex flex-wrap gap-1.5" v-if="productBadges.filter(b => ['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id)).length > 0">
              <div v-for="badge in productBadges.filter(b => ['badge-new', 'badge-bestseller', 'badge-recommended', 'badge-installation'].includes(b.id))" :key="badge.id" 
                   :class="`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full text-${badge.color}-700 dark:text-${badge.color}-300 bg-white/80 dark:bg-${badge.color}-950/40 border border-${badge.color}-200/70 dark:border-${badge.color}-800/70 shadow-2xs`">
                <svg class="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" :d="getBadgeIconPath(badge.icon)"></path></svg>
                <span>{{ badge.name }}</span>
              </div>
            </div>
<div class="flex items-start justify-between gap-3">
              <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {{ product.title }}
              </h1>
              <span v-if="product.sku" class="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-xs font-black border border-slate-200 dark:border-slate-700 shadow-2xs">
                {{ product.sku }}
              </span>
            </div>

            <!-- Subtitle & Navy Wire Spec Pill (Rendered only when data exists in Admin) -->
            <div class="flex flex-wrap items-center gap-2.5 pt-0.5" v-if="subtitle || specRange">
              <span v-if="subtitle" class="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                {{ subtitle }}
              </span>
              <div v-if="specRange" class="inline-flex items-center gap-2 bg-[#002855] text-white px-3.5 py-1 rounded-full text-xs sm:text-sm font-extrabold shadow-xs">
                <svg class="w-3.5 h-3.5 text-blue-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="6" width="20" height="12" rx="6" />
                  <circle cx="8" cy="12" r="2" />
                </svg>
                <span>{{ specRange }}</span>
              </div>
            </div>
          </div>

          <!-- Price, Action & Contacts Card (Compact & High-Density Space-Saving Design) -->
          <div class="bg-white dark:bg-[#111827] rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5">
            <!-- Top Row: Price & Social Share -->
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-baseline gap-1">
                <template v-if="product.price === 'สอบถามราคา'">
                  <span class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">สอบถาม</span>
                  <span class="text-xl sm:text-2xl font-black text-[#E65100] dark:text-amber-500 tracking-tight">ราคา</span>
                </template>
                <template v-else>
                  <strong class="text-xl sm:text-2xl font-black text-[#E65100] dark:text-amber-400 tracking-tight">{{ product.price }}</strong>
                  <span class="text-gray-500 dark:text-gray-400 font-bold text-xs ml-1">/ ชุด</span>
                </template>
              </div>
              <div class="flex items-center gap-2">
                <SocialShare :title="product.title" :url="$route.fullPath" />
              </div>
            </div>

            <!-- Action Buttons Row (LINE / Cart + Wishlist + Compare) -->
            <div class="flex items-center gap-2">
              <!-- Main CTA (LINE or Add to Cart) - Sleek & Single Line -->
              <a
                v-if="product.is_out_of_stock || product.price === 'สอบถามราคา'"
                :href="getLineInquiryUrl(product.title)"
                target="_blank" rel="noopener"
                class="flex-1 h-11 px-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-between group overflow-hidden"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-white text-[#06C755] flex items-center justify-center font-black text-[8.5px] uppercase shrink-0 shadow-xs">
                    LINE
                  </div>
                  <span class="tracking-wide whitespace-nowrap truncate">สอบถามผ่าน LINE</span>
                </div>
                <svg class="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>

              <button
                v-if="!product.is_out_of_stock && product.price !== 'สอบถามราคา'"
                @click="addToCart"
                class="flex-1 h-11 px-3 bg-[#b45309] hover:bg-[#92400e] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all duration-200 flex items-center justify-between group overflow-hidden"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-6 h-6 rounded-full bg-white text-[#b45309] flex items-center justify-center shrink-0 shadow-xs">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  </div>
                  <span class="tracking-wide whitespace-nowrap truncate">เพิ่มลงตะกร้า</span>
                </div>
                <svg class="w-4 h-4 text-white/90 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Wishlist Button with Subtitle Underneath (Compact) -->
              <button
                v-if="settingsStore.isWishlistEnabled !== false"
                @click="handleToggleWishlist"
                :class="wishlistStore.isInWishlist(product.id) ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-rose-500 hover:border-rose-300'"
                class="h-11 w-13 sm:w-15 flex flex-col items-center justify-center border rounded-xl transition-all shrink-0 p-0.5 shadow-2xs"
                :title="wishlistStore.isInWishlist(product.id) ? 'ลบจากรายการโปรด' : 'บันทึกรายการโปรด'"
              >
                <svg class="w-4 h-4" :fill="wishlistStore.isInWishlist(product.id) ? 'currentColor' : 'none'" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                <span class="text-[8px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 leading-none text-center whitespace-nowrap">บันทึกรายการโปรด</span>
              </button>

              <!-- Compare Button with Subtitle Underneath (Compact) -->
              <button
                v-if="settingsStore.isCompareEnabled !== false"
                @click="compareStore.toggleCompare(product)"
                :class="compareStore.isInCompare(product.id) ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-500 hover:border-blue-300'"
                class="h-11 w-13 sm:w-15 flex flex-col items-center justify-center border rounded-xl transition-all shrink-0 p-0.5 shadow-2xs"
                title="เปรียบเทียบสินค้า"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                <span class="text-[8px] font-bold text-slate-600 dark:text-slate-400 mt-0.5 leading-none text-center whitespace-nowrap">เปรียบเทียบสินค้า</span>
              </button>
            </div>

            <!-- Phone Numbers Section (Unified Professional Palette - Clean & Calm) -->
            <div v-if="contactPhonesList.length > 0" class="space-y-1.5 pt-0.5">
              <!-- Primary / First Phone (Full Width Clean Pill) -->
              <a
                v-if="contactPhonesList[0]"
                :href="'tel:' + contactPhonesList[0].value.replace(/[^\d+]/g, '')"
                class="w-full flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl py-1.5 px-3 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-[#002855]/40 dark:hover:border-blue-400/50 hover:shadow-2xs"
              >
                <div class="w-6.5 h-6.5 rounded-full bg-[#002855]/10 dark:bg-blue-500/20 text-[#002855] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </div>
                <div class="flex items-baseline gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <span class="font-bold text-slate-700 dark:text-slate-300">{{ contactPhonesList[0].name }} :</span>
                  <span class="font-black text-[#002855] dark:text-blue-400 text-sm sm:text-[14.5px]">{{ contactPhonesList[0].value }}</span>
                </div>
              </a>

              <!-- Secondary & Tertiary Phones (2 Columns Grid - Unified Styling) -->
              <div v-if="contactPhonesList.length > 1" class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <!-- Phone 2 -->
                <a
                  v-if="contactPhonesList[1]"
                  :href="'tel:' + contactPhonesList[1].value.replace(/[^\d+]/g, '')"
                  class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl py-1.5 px-2.5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-[#002855]/40 dark:hover:border-blue-400/50 hover:shadow-2xs overflow-hidden"
                >
                  <div class="w-6 h-6 rounded-full bg-[#002855]/10 dark:bg-blue-500/20 text-[#002855] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  <div class="flex items-baseline gap-1 text-[11.5px] sm:text-xs whitespace-nowrap min-w-0">
                    <span class="font-bold text-slate-700 dark:text-slate-300 shrink-0">{{ contactPhonesList[1].name }} :</span>
                    <span class="font-black text-[#002855] dark:text-blue-400 text-xs sm:text-[12.5px]">{{ contactPhonesList[1].value }}</span>
                  </div>
                </a>

                <!-- Phone 3 -->
                <a
                  v-if="contactPhonesList[2]"
                  :href="'tel:' + contactPhonesList[2].value.replace(/[^\d+]/g, '')"
                  class="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-xl py-1.5 px-2.5 transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-[#002855]/40 dark:hover:border-blue-400/50 hover:shadow-2xs overflow-hidden"
                >
                  <div class="w-6 h-6 rounded-full bg-[#002855]/10 dark:bg-blue-500/20 text-[#002855] dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </div>
                  <div class="flex items-baseline gap-1 text-[11.5px] sm:text-xs whitespace-nowrap min-w-0">
                    <span class="font-bold text-slate-700 dark:text-slate-300 shrink-0">{{ contactPhonesList[2].name }} :</span>
                    <span class="font-black text-[#002855] dark:text-blue-400 text-xs sm:text-[12.5px]">{{ contactPhonesList[2].value }}</span>
                  </div>
                </a>
              </div>
            </div>

            <!-- Email Section (Unified Professional Palette) -->
            <div v-if="contactEmailsList.length > 0" class="flex items-center gap-2.5 pt-0.5">
              <!-- Email Badge on Left (Compact) -->
              <div class="flex flex-col items-center justify-center shrink-0 w-8">
                <div class="w-7 h-7 rounded-full border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-2xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <span class="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-none">อีเมล</span>
              </div>

              <!-- Email Pills Stack on Right (Unified & Clean) -->
              <div class="flex-1 space-y-1">
                <a
                  v-for="(em, eIdx) in contactEmailsList"
                  :key="'detail-email-card-'+eIdx"
                  :href="'mailto:' + em.value"
                  class="w-full flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 rounded-lg px-2.5 py-1 text-[11.5px] sm:text-xs transition-all hover:bg-white dark:hover:bg-slate-800 hover:border-[#002855]/40 dark:hover:border-blue-400/50 hover:shadow-2xs"
                >
                  <span class="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">{{ em.name }} : </span>
                  <span class="font-bold text-slate-900 dark:text-white break-all">{{ em.value }}</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Compact Industrial Machine Specs & Wires Box (Rendered only when configured in Admin) -->
          <div v-if="capabilitiesList.length > 0 || wireSamples.length > 0" class="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
            
            <!-- Capabilities (Single Compact Row) -->
            <div v-if="capabilitiesList.length > 0">
              <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002855] dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-[#002855] dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                <span>ฟังก์ชันการทำงานของเครื่อง</span>
              </div>
              <div class="flex items-center justify-start gap-3 sm:gap-4 flex-nowrap overflow-x-auto py-1 scrollbar-hide">
                <div 
                  v-for="(cap, idx) in capabilitiesList" 
                  :key="'detail-cap-'+idx" 
                  class="flex flex-col items-center gap-1 shrink-0"
                >
                  <CapabilityIcon :name="cap.icon || cap.id || cap.label" :size="34" />
                  <span class="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {{ cap.label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Supported Wire Samples (Compact & Beautiful) -->
            <div v-if="wireSamples.length > 0" :class="{ 'pt-3 border-t border-slate-100 dark:border-slate-800': capabilitiesList.length > 0 }">
              <div class="flex items-center justify-between gap-1.5 mb-2.5">
                <div class="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002855] dark:text-blue-400 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-[#002855] dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  <span>ตัวอย่างสายไฟที่รองรับ</span>
                </div>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
                  {{ wireSamples.length }} รูปแบบ
                </span>
              </div>
              <div class="space-y-1.5">
                <div 
                  v-for="(sample, sIdx) in wireSamples" 
                  :key="'detail-sample-'+sIdx"
                  class="group/wire flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-all duration-200"
                >
                  <div class="flex items-center gap-2 min-w-0 shrink-0 max-w-[55%]">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 group-hover/wire:scale-125 transition-transform duration-200"></span>
                    <span class="text-xs sm:text-[13px] font-bold text-slate-800 dark:text-slate-200 truncate" :title="getWireSampleTitle(sample)">
                      {{ getWireSampleTitle(sample) }}
                    </span>
                  </div>
                  <div class="flex-1 min-w-[100px] max-w-[45%] flex items-center justify-end">
                    <WireSample :sample="sample" :height="16" />
                  </div>
                </div>
              </div>
            </div>

          </div>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
        <button @click="toggleGalleryZoom" class="absolute top-4 right-4 z-10 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 cursor-pointer" aria-label="ปิด">
          <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
        <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full border border-white/10">{{ activeImageIndex + 1 }} / {{ product.images.length }}</div>
        <div class="relative max-w-5xl max-h-[85vh] w-full mx-4 flex items-center justify-center">
          <transition name="fade" mode="out-in">
            <img :key="activeImageIndex" :src="getOptimizedImageUrl(product.images[activeImageIndex], 1600)" :alt="product.image_alt || product.title" class="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" @error="onImageError">
          </transition>
          <button v-if="product.images.length > 1" @click="setActiveImage((activeImageIndex - 1 + product.images.length) % product.images.length)" class="absolute left-0 -translate-x-14 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 cursor-pointer" aria-label="รูปก่อนหน้า">
            <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button v-if="product.images.length > 1" @click="setActiveImage((activeImageIndex + 1) % product.images.length)" class="absolute right-0 translate-x-14 w-11 h-11 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all border border-white/10 cursor-pointer" aria-label="รูปถัดไป">
            <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <div v-if="product.images.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto scrollbar-hide px-4">
          <button v-for="(img, idx) in product.images" :key="idx" @click="setActiveImage(idx)" :class="idx === activeImageIndex ? 'border-blue-400 opacity-100 scale-110 ring-2 ring-blue-500/30' : 'border-white/20 opacity-50 hover:opacity-80'" class="w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all duration-300 bg-black/40 p-1 flex items-center justify-center cursor-pointer" :aria-label="`ดูรูปภาพที่ ${idx + 1}`">
            <img :src="getOptimizedImageUrl(img, 200)" :alt="`thumbnail-${idx}`" class="w-full h-full object-contain" @error="onImageError">
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



