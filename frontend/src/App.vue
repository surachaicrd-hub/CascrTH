<script setup>
import { defineAsyncComponent, onMounted, onUnmounted, ref, watch, computed, provide } from 'vue'
import { useTrackingStore } from './stores/tracking'
import { RouterView, useRoute, useRouter } from 'vue-router'
import CookieBanner from './components/CookieBanner.vue'
import GlobalSearch from './components/GlobalSearch.vue'
import { useAnalytics } from './composables/useAnalytics'
import { useAuthStore } from './stores/authStore'
import { useCartStore } from './stores/cartStore'
import { useSettingsStore } from './stores/settingsStore'
import LoginModal from './components/LoginModal.vue'
import BackToTop from './components/BackToTop.vue'
import AIProductRecommendation from './components/AIProductRecommendation.vue'
import ToastContainer from './components/ToastContainer.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import CompareFloatingBar from './components/CompareFloatingBar.vue'
import HistoryFloatingButton from './components/HistoryFloatingButton.vue'
import { getOptimizedImageUrl, onImageError } from './utils/image'


const Maintenance = defineAsyncComponent(() => import('./pages/Maintenance.vue'))

// Auth state
const authStore = useAuthStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const footerSitemapText = computed(() => {
  const label = settingsStore.footerSitemapLabel
  if (label && typeof label === 'string' && label.trim().length > 0) {
    return label.trim()
  }
  return 'แผนผังเว็บไซต์'
})

const footerDistributorText = computed(() => {
  const label = settingsStore.footerDistributorLabel
  if (label && typeof label === 'string' && label.trim().length > 0) {
    return label.trim()
  }
  return 'ผู้ช่วย AI / ตัวแทนจำหน่าย'
})

const isLoginModalOpen = ref(false)
provide('openLoginModal', () => { isLoginModalOpen.value = true })

const desktopAvatarError = ref(false)
const mobileAvatarError = ref(false)

watch(() => authStore.currentUser?.avatar_url, () => {
  desktopAvatarError.value = false
  mobileAvatarError.value = false
})

watch(() => settingsStore.storeFavicon, (newFavicon) => {
  if (!newFavicon) return
  const links = document.querySelectorAll("link[rel*='icon'], link[rel='shortcut icon']")
  links.forEach(link => {
    link.href = getOptimizedImageUrl(newFavicon, 192)
  })
}, { immediate: true })

// Floating contact hub state
const isContactHubOpen = ref(false)
const contactHubRef = ref(null)

const handleClickOutside = (event) => {
  if (isContactHubOpen.value && contactHubRef.value && !contactHubRef.value.contains(event.target)) {
    isContactHubOpen.value = false
  }
}

// Search state
const isSearchOpen = ref(false)

// Nav categories dropdown
const navCategories = ref([])

const categoryThemes = {
  "บ้านเก็บของพลาสติก HDPE": {
    hexBorderGradient: "from-blue-500 to-blue-400",
    bgClass: "bg-white hover:bg-blue-50/10 dark:bg-[#111827] dark:hover:bg-blue-950/10 border-gray-100 hover:border-blue-200 dark:border-gray-800 dark:hover:border-blue-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(2,32,164,0.08)]",
    arrowClass: "text-blue-500 border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500",
    accentText: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
  },
  "บ้านเก็บของพลาสติก PP": {
    hexBorderGradient: "from-green-500 to-emerald-400",
    bgClass: "bg-white hover:bg-green-50/10 dark:bg-[#111827] dark:hover:bg-green-950/10 border-gray-100 hover:border-green-200 dark:border-gray-800 dark:hover:border-green-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(34,197,94,0.08)]",
    arrowClass: "text-green-600 border border-green-100 dark:border-green-950 bg-green-50/50 dark:bg-green-950/20 group-hover:bg-green-600 group-hover:text-white group-hover:border-green-600",
    accentText: "group-hover:text-green-600 dark:group-hover:text-green-400",
  },
  "บ้านเก็บของโลหะ": {
    hexBorderGradient: "from-blue-500 to-cyan-400",
    bgClass: "bg-white hover:bg-blue-50/10 dark:bg-[#111827] dark:hover:bg-blue-950/10 border-gray-100 hover:border-blue-200 dark:border-gray-800 dark:hover:border-blue-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.08)]",
    arrowClass: "text-blue-600 border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600",
    accentText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  },
  "ตูและกล่องเก็บของกลางแจ้ง": {
    hexBorderGradient: "from-indigo-500 to-purple-400",
    bgClass: "bg-white hover:bg-purple-50/10 dark:bg-[#111827] dark:hover:bg-purple-950/10 border-gray-100 hover:border-purple-200 dark:border-gray-800 dark:hover:border-purple-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(168,85,247,0.08)]",
    arrowClass: "text-purple-600 border border-purple-100 dark:border-purple-950 bg-purple-50/50 dark:bg-purple-950/20 group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-600",
    accentText: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
  },
  "กล่องเก็บเครื่องมือช่าง เกรดพรีเมี่ยม": {
    hexBorderGradient: "from-rose-500 to-pink-400",
    bgClass: "bg-white hover:bg-rose-50/10 dark:bg-[#111827] dark:hover:bg-rose-950/10 border-gray-100 hover:border-rose-200 dark:border-gray-800 dark:hover:border-rose-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(244,63,94,0.08)]",
    arrowClass: "text-rose-600 border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600",
    accentText: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
  },
  "โรงจอดรถ": {
    hexBorderGradient: "from-amber-500 to-yellow-400",
    bgClass: "bg-white hover:bg-amber-50/10 dark:bg-[#111827] dark:hover:bg-amber-950/10 border-gray-100 hover:border-amber-200 dark:border-gray-800 dark:hover:border-amber-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.08)]",
    arrowClass: "text-amber-600 border border-amber-100 dark:border-amber-950 bg-amber-50/50 dark:bg-amber-950/20 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600",
    accentText: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
  },
  "ซุ้มศาลานั่งเล่นและเต็นท์อุปกรณ์เดินป่า": {
    hexBorderGradient: "from-teal-500 to-cyan-400",
    bgClass: "bg-white hover:bg-teal-50/10 dark:bg-[#111827] dark:hover:bg-teal-950/10 border-gray-100 hover:border-teal-200 dark:border-gray-800 dark:hover:border-teal-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(20,184,166,0.08)]",
    arrowClass: "text-teal-600 border border-teal-100 dark:border-teal-950 bg-teal-50/50 dark:bg-teal-950/20 group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600",
    accentText: "group-hover:text-teal-600 dark:group-hover:text-teal-400",
  }
}

const getCategoryTheme = (catName, index) => {
  const themes = Object.keys(categoryThemes)
  const matchKey = themes.find(key => catName.includes(key) || key.includes(catName))
  if (matchKey) {
    return categoryThemes[matchKey]
  }
  const fallbackList = Object.values(categoryThemes)
  return fallbackList[index % fallbackList.length]
}

const isProductsDropdownOpen = ref(false)
const isMobileProductsOpen = ref(false)
let dropdownTimer = null

const openProductsDropdown = () => {
  clearTimeout(dropdownTimer)
  isProductsDropdownOpen.value = true
}
const closeProductsDropdown = () => {
  dropdownTimer = setTimeout(() => {
    isProductsDropdownOpen.value = false
  }, 200)
}
const contactPhones = computed(() => settingsStore.contactPhones)
const contactEmails = computed(() => settingsStore.contactEmails)
const contactLines = computed(() => settingsStore.contactLines)
const contactFacebookUrl = computed(() => settingsStore.contactFacebookUrl)
const contactTiktokUrl = computed(() => settingsStore.contactTiktokUrl)
const contactYoutubeUrl = computed(() => settingsStore.contactYoutubeUrl)

// Newsletter state
const newsletterEmail = ref('')
const newsletterHoneypot = ref('')
const newsletterTimestamp = ref(Date.now())
const newsletterLoading = ref(false)
const newsletterSuccess = ref(false)
const newsletterError = ref('')



const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const submitNewsletter = async () => {
  newsletterError.value = ''
  if (!newsletterEmail.value.trim()) {
    newsletterError.value = 'กรุณากรอกอีเมลของคุณ'
    return
  }
  if (!isValidEmail(newsletterEmail.value.trim())) {
    newsletterError.value = 'รูปแบบอีเมลไม่ถูกต้อง'
    return
  }
  newsletterLoading.value = true
  try {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newsletterEmail.value.trim(),
        honeypot: newsletterHoneypot.value,
        timestamp: newsletterTimestamp.value
      })
    })
    const data = await res.json()
    if (data.success) {
      newsletterSuccess.value = true
      newsletterEmail.value = ''
    } else {
      newsletterError.value = data.error || 'เกิดข้อผิดพลาด'
    }
  } catch (e) {
    newsletterError.value = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
  } finally {
    newsletterLoading.value = false
  }
}

// Initialize tracking
const trackingStore = useTrackingStore()
const route = useRoute()
const router = useRouter()

// Watch authentication status for redirection
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    if (route.path !== '/cart' && route.path !== '/checkout') {
      router.push('/profile')
    }
  } else {
    if (route.path === '/profile' || route.path === '/checkout') {
      router.push('/')
    }
  }
})

// Watch route query to open login modal automatically (e.g. from redirect links)
watch(() => route.query.login, (val) => {
  if (val === 'true') {
    isLoginModalOpen.value = true
    // Clean up the query parameter to avoid opening it again on reload/navigation
    const query = { ...route.query }
    delete query.login
    router.replace({ path: route.path, query })
  }
}, { immediate: true })


// Initialize detailed analytics (auto-tracks pageviews, scroll depth, time on page)
const { trackPageView } = useAnalytics()

// Re-track on route change
watch(() => route.fullPath, () => {
  if (!route.path.startsWith('/admin')) {
    trackPageView()
  }
})

// Dark Mode Logic
const isDark = ref(false)
const isMobileMenuOpen = ref(false)
const isScrolled = ref(false)

const handleScroll = () => {
  if (window.scrollY > 50) {
    isScrolled.value = true
  } else {
    isScrolled.value = false
  }
}

const isDarkHeader = computed(() => {
  // If in dark mode, the header background is always dark
  if (isDark.value) return true

  // If scrolled, background is light (#FAF9F6) in light mode
  if (isScrolled.value) return false

  // If not scrolled and in light mode, background is transparent,
  // so it depends on the page's top background color.
  const darkHeroPaths = ['/', '/about', '/blog', '/contact', '/services', '/projects']
  const path = route.path
  const isDarkHeroPage = darkHeroPaths.includes(path) || path.startsWith('/projects/')

  return isDarkHeroPage
})

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin') || window.location.pathname.startsWith('/admin')
})

// Active route detection for nav highlighting
const isActiveRoute = (path) => {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}

const toggleDarkMode = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Close mobile menu on route change
watch(route, () => {
  isMobileMenuOpen.value = false
  isContactHubOpen.value = false
})

onMounted(() => {
  // Global image error fallback: when cached thumbnails 404, fall back to original images
  document.addEventListener('error', (event) => {
    const img = event.target
    if (!img || img.tagName !== 'IMG') return

    const src = img.getAttribute('src') || ''
    const SVG_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Cg transform='translate(276,176)' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Crect x='3' y='3' width='42' height='42' rx='8'/%3E%3Ccircle cx='17' cy='17' r='5'/%3E%3Cpath d='M41 33l-10-10-18 18'/%3E%3C/g%3E%3Ctext x='50%25' y='240' font-family='sans-serif' font-size='14' font-weight='600' fill='%2364748b' text-anchor='middle'%3EImage Not Found%3E%2Ftext%3E%3C%2Fsvg%3E"
    
    // Prevent infinite loops
    if (img.dataset.fallbackAttempted === 'done') return

    if (img.dataset.fallbackAttempted === 'original') {
      img.dataset.fallbackAttempted = 'done'
      img.src = SVG_PLACEHOLDER
      return
    }

    // Extract relative cache path from src (handles standard cache URLs and resize-api paths)
    let cachePath = ''
    if (src.includes('/api/upload/resize?path=')) {
      try {
        const urlParams = new URLSearchParams(src.split('?')[1])
        cachePath = urlParams.get('path') || ''
      } catch (e) {
        img.dataset.fallbackAttempted = 'done'
        img.src = SVG_PLACEHOLDER
        return
      }
    } else {
      if (!src.includes('/uploads/') || !src.includes('/cache/')) {
        img.dataset.fallbackAttempted = 'done'
        img.src = SVG_PLACEHOLDER
        return
      }
      cachePath = src.startsWith('/') ? src.substring(1) : src
    }

    // Parse cache path: uploads[/subfolder]/cache/basename-WIDTH.ext
    const match = cachePath.match(/^uploads\/(?:(.+)\/)?cache\/([^/]+)-(\d+)\.([a-zA-Z0-9]+)$/)
    if (!match) {
      img.dataset.fallbackAttempted = 'done'
      img.src = SVG_PLACEHOLDER
      return
    }

    if (img.dataset.fallbackAttempted !== 'resize-api') {
      // First fallback: try the on-the-fly resize API
      img.dataset.fallbackAttempted = 'resize-api'
      img.src = `/api/upload/resize?path=${encodeURIComponent(cachePath)}`
      return
    }

    // Second fallback: use the original full-size image
    const subfolder = match[1] || ''
    const baseName = match[2]
    const ext = match[4]
    const originalPath = subfolder
      ? `/uploads/${subfolder}/${baseName}.${ext}`
      : `/uploads/${baseName}.${ext}`
    img.dataset.fallbackAttempted = 'original'
    img.src = originalPath
  }, true) // 'true' = capture phase, intercepts before component-level handlers


  // Capture Registration Source
  if (!localStorage.getItem('registration_source')) {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      let source = 'organic'
      if (urlParams.get('utm_source') || urlParams.get('utm_medium')) {
        source = `utm_source=${urlParams.get('utm_source') || 'unknown'}&utm_medium=${urlParams.get('utm_medium') || 'none'}`
      } else if (urlParams.get('fbclid')) {
        source = 'facebook_ad'
      } else if (urlParams.get('ref')) {
        source = `ref=${urlParams.get('ref')}`
      } else if (document.referrer && !document.referrer.includes(window.location.hostname)) {
        source = new URL(document.referrer).hostname
      }
      localStorage.setItem('registration_source', source)
    } catch (e) {
      console.error('Failed to parse registration source', e)
    }
  }

  // Initialize Session
  trackingStore.initSession()
  trackingStore.trackEvent({ type: 'page_view', path: window.location.pathname })

  // Initialize Cart
  if (!window.location.pathname.startsWith('/admin')) {
    cartStore.fetchCart()
  }

  // Load categories for nav dropdown
  fetch('/api/categories')
    .then(r => r.json())
    .then(data => { if (data.success) navCategories.value = data.data })
    .catch(e => console.error('Failed to load nav categories', e))
  
  // Initialize Theme (Check LocalStorage or System Prefs)
  if (localStorage.getItem('theme') === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDark.value = false
    document.documentElement.classList.remove('dark')
  }
  // Handle Scroll
  window.addEventListener('scroll', handleScroll)

  // Handle click outside contact hub
  document.addEventListener('click', handleClickOutside)
})

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getTrustBadgeIconPath = (icon) => {
  switch (icon) {
    case 'shield':
      return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    case 'crown':
      return 'M12 15a3 3 0 100-6 3 3 0 000 6z M19.62 10.4a8.6 8.6 0 00-7.62-5.4 8.6 8.6 0 00-7.62 5.4l2.12 6.6a1 1 0 00.95.7h9.1a1 1 0 00.95-.7l2.12-6.6z M12 15v5m-3-2l3 2 3-2'
    case 'support':
      return 'M3 18v-6a9 9 0 0118 0v6M3 18a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3M21 18a2 2 0 00-2 2h-1a2 2 0 00-2-2v-3a2 2 0 002-2h2m-9 8v-6'
    case 'heart':
      return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    default:
      return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  }
}

const getTrustBadgeIconStrokeWidth = (icon) => {
  return (icon === 'support' || icon === 'heart') ? '2.2' : '2.5'
}

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans transition-colors duration-500 bg-[#F8F9FC] dark:bg-[#0C0E14] text-gray-900 dark:text-gray-100 selection:bg-emerald-200 dark:selection:bg-emerald-800/50">
    
    <!-- Maintenance Mode -->
    <Maintenance v-if="settingsStore.maintenanceModeEnabled && !isAdminRoute" />

    <template v-else>
      <!-- Holiday Banner is now inside Home.vue -->

      <!-- Premium Navigation -->
    <header v-if="!isAdminRoute"
      :class="[
        'z-50 transition-all duration-500 ease-in-out',
        isScrolled 
          ? 'fixed top-0 left-0 w-full bg-[#F8F9FC]/90 dark:bg-[#0C0E14]/90 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] dark:shadow-none border-b border-gray-100/80 dark:border-white/5 py-0' 
          : 'absolute top-0 left-0 w-full bg-transparent border-transparent py-3'
      ]"
    >
      <div 
        :class="[
          'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center transition-all duration-300',
          isScrolled ? 'py-3 lg:py-4' : 'py-5 lg:py-6'
        ]"
      >
        
        <!-- Logo -->
        <router-link to="/" :aria-label="settingsStore.storeName ? `${settingsStore.storeName} - หน้าแรก` : 'หน้าแรก'" class="group flex items-center gap-2 md:gap-2.5 z-50 transition-all duration-300 active:scale-95 shrink-0">
          <template v-if="settingsStore.storeLogo">
            <img :src="getOptimizedImageUrl(settingsStore.storeLogo, 300)" alt="Store Logo" class="h-8 md:h-10 w-auto max-w-[130px] sm:max-w-[160px] md:max-w-[200px] object-contain transition-all duration-300" @error="onImageError" />
          </template>
          <template v-else>
            <div class="w-8 h-8 md:w-10 md:h-10 border border-[#0220A4]/80 bg-white dark:bg-gray-900 text-[#0220A4] rounded-lg md:rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:border-[#0220A4] transition-all duration-300 transform group-hover:-translate-y-0.5 overflow-hidden shrink-0">
              <!-- House Icon with Chimney -->
              <svg class="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 21v-6a1 1 0 011-1h4a1 1 0 011 1v6" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 5.5V8M16.5 5.5h2" />
              </svg>
            </div>
            <div class="flex flex-col leading-none">
              <span :class="['text-lg md:text-xl font-black tracking-wider uppercase transition-colors duration-300 group-hover:text-[#0220A4]', isDarkHeader ? 'text-white' : 'text-[#111827] dark:text-white']">
                {{ (settingsStore.storeName || 'STORAGE').split(' ')[0] }}
              </span>
              <span v-if="(settingsStore.storeName || 'STORAGE HOUSE').split(' ').slice(1).join(' ')" :class="['text-[10px] md:text-xs font-black tracking-[0.2em] uppercase transition-colors duration-300', isDarkHeader ? 'text-[#5B7CFF]' : 'text-[#0220A4] dark:text-[#5B7CFF]']">
                {{ (settingsStore.storeName || 'STORAGE HOUSE').split(' ').slice(1).join(' ') }}
              </span>
            </div>
          </template>
        </router-link>
        
        <!-- Desktop Nav -->
        <nav class="hidden lg:flex flex-1 justify-center items-center gap-4 xl:gap-6 mx-2 xl:mx-4">
          <router-link to="/" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            หน้าแรก
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <!-- Products with Dropdown -->
          <div class="relative" @mouseenter="openProductsDropdown" @mouseleave="closeProductsDropdown">
            <router-link to="/products" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group inline-flex items-center gap-1', isActiveRoute('/products') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
              สินค้า
              <svg class="w-3 h-3 transition-transform duration-200" :class="isProductsDropdownOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
              <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/products') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
            </router-link>
            <!-- Dropdown (Premium Mega Menu) -->
            <transition name="dropdown">
              <div v-if="isProductsDropdownOpen" class="absolute top-full -left-20 pt-4 z-50">
                <div class="bg-white dark:bg-[#111827] rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-100/80 dark:border-gray-800 p-4 sm:p-4.5 min-w-[320px] sm:min-w-[480px] lg:min-w-[680px] xl:min-w-[760px] overflow-hidden">
                  
                  <!-- View All Banner -->
                  <router-link to="/products" class="group relative flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-slate-50/80 via-gray-50/50 to-blue-50/30 dark:from-gray-900/60 dark:via-gray-900/40 dark:to-blue-950/20 border border-gray-100/50 dark:border-gray-800 hover:shadow-inner transition-all duration-300 mb-3 overflow-hidden">
                    <!-- Subtle contour map lines SVG -->
                    <svg class="absolute bottom-0 right-0 h-full w-[60%] text-blue-500/10 pointer-events-none" viewBox="0 0 400 120" fill="none">
                      <path d="M 0 120 C 100 80, 200 100, 400 30" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M 0 120 C 120 70, 240 90, 400 20" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M 0 120 C 140 60, 280 80, 400 10" stroke="currentColor" stroke-width="1.5"/>
                    </svg>

                    <!-- Catalog Illustration -->
                    <img src="/images/home/catalog_banner.webp" class="absolute right-[10%] -bottom-1 h-[130%] w-auto object-contain pointer-events-none select-none z-0 mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105" />

                    <div class="relative flex items-center gap-4 z-10">
                      <div class="w-11 h-11 rounded-full bg-[#0220A4] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 transform group-hover:scale-105 transition-all duration-300">
                        <svg class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                        </svg>
                      </div>
                      <div class="text-left">
                        <div class="font-black text-lg text-gray-900 dark:text-white transition-colors duration-300">ดูสินค้าทั้งหมด</div>
                        <div class="text-[11px] text-gray-500/80 dark:text-gray-400 mt-0.5 font-semibold">เลือกดูสินค้าและบริการของเราทั้งหมดครบทุกหมวดหมู่</div>
                      </div>
                    </div>
                    
                    <div class="relative z-10 w-9 h-9 rounded-full bg-white dark:bg-gray-800 text-[#0220A4] dark:text-[#5B7CFF] flex items-center justify-center shadow-md border border-gray-100/50 dark:border-gray-700/50 group-hover:scale-110 group-hover:shadow-lg group-hover:border-blue-200 transition-all duration-300">
                      <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </router-link>

                  <!-- Categories Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-1 mb-1">
                    <router-link 
                      v-for="(cat, idx) in navCategories" 
                      :key="cat.id || cat.name" 
                      :to="`/products/category/${encodeURIComponent(cat.name)}`" 
                      class="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition-all duration-300 bg-white"
                      :class="[
                        getCategoryTheme(cat.name, idx).bgClass, 
                        getCategoryTheme(cat.name, idx).shadowClass
                      ]"
                    >
                      <div class="flex items-center gap-4 min-w-0">
                        <!-- Hexagon outer container (border effect) -->
                        <div class="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                          <!-- Hexagon border -->
                          <div 
                            class="absolute inset-0 bg-gradient-to-tr transition-transform duration-500 group-hover:rotate-12"
                            :class="getCategoryTheme(cat.name, idx).hexBorderGradient"
                            style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);"
                          ></div>
                          <!-- Hexagon inner container -->
                          <div 
                            class="absolute inset-[2px] bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden"
                            style="clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);"
                          >
                            <img v-if="cat.icon_url" :src="getOptimizedImageUrl(cat.icon_url, 64)" class="w-6.5 h-6.5 object-contain transition-transform duration-500 group-hover:scale-110 filter invert dark:invert-0 opacity-80 group-hover:opacity-100" :alt="cat.name" @error="onImageError">
                            <img v-else-if="cat.image_url" :src="getOptimizedImageUrl(cat.image_url, 128)" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" :alt="cat.name" @error="onImageError">
                            <svg v-else class="w-5 h-5 sm:w-[22px] sm:h-[22px] text-gray-400 transition-colors" :class="getCategoryTheme(cat.name, idx).accentText" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                            </svg>
                          </div>
                        </div>
                        <div class="flex-1 min-w-0 text-left">
                          <div class="text-xs sm:text-sm font-bold text-gray-900 dark:text-white transition-colors duration-300" :class="getCategoryTheme(cat.name, idx).accentText">{{ cat.name }}</div>
                          <div class="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 leading-relaxed font-light">{{ cat.description || 'ดูรายละเอียดสินค้าในหมวดหมู่นี้เพิ่มเติม' }}</div>
                        </div>
                      </div>
                      
                      <!-- Dynamic themed arrow button -->
                      <div 
                        class="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0"
                        :class="getCategoryTheme(cat.name, idx).arrowClass"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </router-link>
                  </div>

                  <!-- Bottom Trust Badges Bar -->
                  <div class="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/60 grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-1">
                    <!-- Badge 1 -->
                    <div class="flex items-center gap-3 justify-center sm:justify-start sm:border-r last:border-r-0 border-gray-100/80 dark:border-gray-800/60 sm:pr-3">
                      <div class="w-8 h-8 rounded-xl bg-[#F3F5FF] dark:bg-blue-950/20 flex items-center justify-center text-[#0220A4] flex-shrink-0">
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div class="flex flex-col min-w-0 text-left">
                        <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-tight truncate">วัสดุคุณภาพสูง</span>
                        <span class="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5 leading-none truncate">แข็งแรง ทนทาน</span>
                      </div>
                    </div>

                    <!-- Badge 2 -->
                    <div class="flex items-center gap-3 justify-center sm:justify-start sm:border-r last:border-r-0 border-gray-100/80 dark:border-gray-800/60 sm:px-3">
                      <div class="w-8 h-8 rounded-xl bg-[#F3F5FF] dark:bg-blue-950/20 flex items-center justify-center text-[#0220A4] flex-shrink-0">
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                      </div>
                      <div class="flex flex-col min-w-0 text-left">
                        <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-tight truncate">ติดตั้งง่าย</span>
                        <span class="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5 leading-none truncate">สะดวก รวดเร็ว</span>
                      </div>
                    </div>

                    <!-- Badge 3 -->
                    <div class="flex items-center gap-3 justify-center sm:justify-start sm:border-r last:border-r-0 border-gray-100/80 dark:border-gray-800/60 sm:px-3">
                      <div class="w-8 h-8 rounded-xl bg-[#F3F5FF] dark:bg-blue-950/20 flex items-center justify-center text-[#0220A4] flex-shrink-0">
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
                          <path d="M8 16v4" />
                          <path d="M12 16v4" />
                          <path d="M16 16v4" />
                        </svg>
                      </div>
                      <div class="flex flex-col min-w-0 text-left">
                        <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-tight truncate">ทนทุกสภาพอากาศ</span>
                        <span class="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5 leading-none truncate">ใช้งานได้ยาวนาน</span>
                      </div>
                    </div>

                    <!-- Badge 4 -->
                    <div class="flex items-center gap-3 justify-center sm:justify-start sm:pl-3">
                      <div class="w-8 h-8 rounded-xl bg-[#F3F5FF] dark:bg-blue-950/20 flex items-center justify-center text-[#0220A4] flex-shrink-0">
                        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polygon points="12 8 13.09 11.36 16.64 11.36 13.73 13.45 14.82 16.82 12 14.73 9.18 16.82 10.27 13.45 7.36 11.36 10.91 11.36" />
                        </svg>
                      </div>
                      <div class="flex flex-col min-w-0 text-left">
                        <span class="text-[11px] font-bold text-gray-900 dark:text-white leading-tight truncate">มาตรฐานการผลิต</span>
                        <span class="text-[9px] text-gray-500 dark:text-gray-400 font-light mt-0.5 leading-none truncate">เชื่อมั่นในคุณภาพ</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </transition>
          </div>

          <router-link to="/projects" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/projects') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            ผลงาน
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/projects') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/blog" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/blog') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            บทความ
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/blog') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/services" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/services') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            บริการ
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/services') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/about" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/about') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            เกี่ยวกับเรา
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/about') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/contact" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/contact') ? 'text-[#0220A4] dark:text-[#5B7CFF]' : isDarkHeader ? 'text-gray-300 hover:text-[#5B7CFF]' : 'text-gray-700 dark:text-gray-300 hover:text-[#0220A4] dark:hover:text-[#5B7CFF]']">
            ติดต่อเรา
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2.5px] bg-[#0220A4] dark:bg-[#5B7CFF] rounded-full transition-all duration-300', isActiveRoute('/contact') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>
        </nav>
        <!-- Desktop Actions -->
        <div class="hidden lg:flex items-center gap-1.5 xl:gap-2.5 z-10 shrink-0 relative">
          <button @click="isSearchOpen = true" aria-label="ค้นหาสินค้า" :class="['transition-all w-12 h-12 flex items-center justify-center rounded-full duration-300 hover:scale-105 hover:bg-[#0220A4]/10 dark:hover:bg-white/5 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg class="w-[20px] h-[20px] xl:w-[22px] xl:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <router-link v-if="settingsStore.isOnlineShoppingEnabled" to="/cart" aria-label="ตะกร้าสินค้า" :class="['relative transition-all w-12 h-12 flex items-center justify-center rounded-full duration-300 hover:scale-105 hover:bg-[#0220A4]/10 dark:hover:bg-white/5 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg class="w-[20px] h-[20px] xl:w-[22px] xl:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.cartTotal > 0" class="absolute top-1.5 right-1.5 bg-gradient-to-r from-[#0220A4] to-[#4169E1] text-white text-[9px] xl:text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0C0E14] shadow-md animate-pulse leading-none">
              {{ cartStore.cartTotal > 99 ? '99+' : cartStore.cartTotal }}
            </span>
          </router-link>
          
          <button @click="toggleDarkMode" aria-label="สลับโหมดมืด" :class="['transition-all w-12 h-12 flex items-center justify-center rounded-full duration-300 hover:scale-105 hover:bg-[#0220A4]/10 dark:hover:bg-white/5 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg v-if="!isDark" class="w-[20px] h-[20px] xl:w-[22px] xl:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-[20px] h-[20px] xl:w-[22px] xl:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          
          <!-- Auth / Profile -->
          <div v-if="settingsStore.isOnlineShoppingEnabled && authStore.isAuthenticated" class="relative group">
             <button aria-label="เมนูบัญชีผู้ใช้" class="flex items-center justify-center p-0.5 rounded-full border border-gray-200/80 dark:border-gray-800 hover:border-[#0220A4] dark:hover:border-[#5B7CFF] bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:scale-105">
                <img v-if="authStore.currentUser?.avatar_url && !desktopAvatarError" :src="authStore.currentUser?.avatar_url" @error="desktopAvatarError = true" class="w-8 h-8 rounded-full object-cover">
                <div v-else class="w-8 h-8 rounded-full bg-[#0220A4] flex items-center justify-center text-white text-xs font-black">
                  {{ authStore.currentUser?.first_name?.charAt(0)?.toUpperCase() || authStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
             </button>
             <div class="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
               <div class="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl py-2 min-w-[220px] border border-gray-100 dark:border-gray-800 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100 transition-transform">
                 <div class="px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-white/5 mb-2">
                   <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ authStore.currentUser?.first_name }} {{ authStore.currentUser?.last_name }}</p>
                   <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ authStore.currentUser?.email }}</p>
                 </div>
                 <router-link to="/profile" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] hover:bg-[#F3F5FF] dark:hover:bg-blue-900/10 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> บัญชีของฉัน
                 </router-link>
                 <router-link to="/profile?tab=orders" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] hover:bg-[#F3F5FF] dark:hover:bg-blue-900/10 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> การสั่งซื้อของฉัน
                 </router-link>
                 <router-link v-if="settingsStore.isWishlistEnabled" to="/profile?tab=wishlist" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] hover:bg-[#F3F5FF] dark:hover:bg-blue-900/10 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg> รายการโปรด
                 </router-link>
                 <div class="my-2 border-t border-gray-100 dark:border-gray-800"></div>
                 <button @click="authStore.logout()" class="w-full text-left px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> ออกจากระบบ
                 </button>
               </div>
             </div>
          </div>
          <button @click="isLoginModalOpen = true" v-else-if="settingsStore.isOnlineShoppingEnabled" aria-label="เข้าสู่ระบบ" :class="['transition-all p-2.5 rounded-full duration-300 hover:scale-105 hover:bg-[#0220A4]/10 dark:hover:bg-white/5 hover:text-[#0220A4] dark:hover:text-[#0220A4]', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']" title="เข้าสู่ระบบ">
            <svg class="w-[20px] h-[20px] xl:w-[22px] xl:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
 
          <router-link to="/quotation" class="px-6 py-2.5 rounded-full text-xs xl:text-sm font-black tracking-wider text-white bg-gradient-to-r from-[#0220A4] to-[#4169E1] hover:from-[#01166F] hover:to-[#0220A4] hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap ml-2">
            ขอใบเสนอราคา
          </router-link>
        </div>

        <!-- Mobile Menu Toggles -->
        <div class="flex lg:hidden items-center gap-1 sm:gap-2 z-50">
          <button @click="isSearchOpen = true" aria-label="ค้นหาสินค้า" :class="['transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <router-link v-if="settingsStore.isOnlineShoppingEnabled" to="/cart" aria-label="ตะกร้าสินค้า" :class="['relative transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.cartTotal > 0" class="absolute top-0.5 right-0.5 bg-gradient-to-r from-[#0220A4] to-[#4169E1] text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0C0E14] shadow-sm animate-pulse leading-none">
              {{ cartStore.cartTotal > 99 ? '99+' : cartStore.cartTotal }}
            </span>
          </router-link>
          <button @click="toggleDarkMode" aria-label="สลับโหมดมืด" :class="['transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-gray-300' : 'text-gray-600 dark:text-gray-300']">
            <svg v-if="!isDark" class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          <button @click="toggleMobileMenu" aria-label="เมนูหลัก" :class="['focus:outline-none w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-all rounded-full hover:bg-gray-100 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-white' : 'text-gray-900 dark:text-white']">
            <svg v-if="!isMobileMenuOpen" class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <svg v-else class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <transition name="slide-down">
        <div v-if="isMobileMenuOpen" class="lg:hidden absolute top-full left-0 w-full bg-[#FAF9F6] dark:bg-[#0C0E14] border-b border-gray-100 dark:border-white/10 shadow-2xl py-6 flex flex-col px-6 space-y-4 z-40">
          <div>
            <button @click="isMobileProductsOpen = !isMobileProductsOpen" :class="['py-2 text-lg font-bold tracking-wide transition-colors flex items-center justify-between w-full', isActiveRoute('/products') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">
              สินค้า
              <svg class="w-4 h-4 transition-transform duration-200" :class="isMobileProductsOpen ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <div v-if="isMobileProductsOpen" class="pl-6 pb-2 space-y-1">
              <router-link to="/products" class="block py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">ดูทั้งหมด</router-link>
              <router-link v-for="cat in navCategories" :key="cat.id || cat.name" :to="`/products/category/${encodeURIComponent(cat.name)}`" class="block py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium">
                {{ cat.name }}
              </router-link>
            </div>
          </div>
          <router-link to="/services" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/services') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">บริการ</router-link>
          <router-link to="/space-calculator" @click="isMobileMenuOpen = false" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/space-calculator') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">คำนวณพื้นที่</router-link>
          <router-link to="/projects" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/projects') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">ผลงาน</router-link>
          <router-link to="/blog" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/blog') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">บทความ</router-link>
          <router-link to="/about" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/about') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">เกี่ยวกับเรา</router-link>
          <router-link to="/contact" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/contact') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">ติดต่อเรา</router-link>
          <div class="pt-6 mt-4 border-t border-gray-100 dark:border-white/10 flex flex-col gap-4">
             <template v-if="settingsStore.isOnlineShoppingEnabled">
               <template v-if="authStore.isAuthenticated">
                 <div class="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                    <img v-if="authStore.currentUser?.avatar_url && !mobileAvatarError" :src="authStore.currentUser?.avatar_url" @error="mobileAvatarError = true" class="w-12 h-12 rounded-full object-cover shadow-sm bg-white">
                    <div v-else class="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white text-lg font-black shadow-sm">
                      {{ authStore.currentUser?.first_name?.charAt(0)?.toUpperCase() || authStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
                    </div>
                   <div class="overflow-hidden">
                     <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ authStore.currentUser?.first_name }} {{ authStore.currentUser?.last_name }}</p>
                     <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.currentUser?.email }}</p>
                   </div>
                 </div>
                 <router-link to="/profile" @click="isMobileMenuOpen = false" class="block w-full text-left py-2 text-base font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">บัญชีของฉัน</router-link>
                 <router-link to="/profile?tab=orders" @click="isMobileMenuOpen = false" class="block w-full text-left py-2 text-base font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">การสั่งซื้อของฉัน</router-link>
                 <router-link v-if="settingsStore.isWishlistEnabled" to="/profile?tab=wishlist" @click="isMobileMenuOpen = false" class="block w-full text-left py-2 text-base font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">รายการโปรด</router-link>
                 <button @click="authStore.logout()" class="w-full text-left py-2 text-base font-bold text-red-500 hover:text-red-600 transition-colors">ออกจากระบบ</button>
               </template>
               <template v-else>
                 <button @click="isLoginModalOpen = true; isMobileMenuOpen = false" class="block w-full text-center py-3.5 rounded-xl border-2 border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 font-bold tracking-wide transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/10">
                   เข้าสู่ระบบ / สมัครสมาชิก
                 </button>
               </template>
             </template>
             <router-link to="/quotation" @click="isMobileMenuOpen = false" class="flex justify-center items-center py-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg shadow-gray-900/10 active:scale-95 transition-transform uppercase tracking-widest text-sm">
               ขอใบเสนอราคาด่วน
             </router-link>
          </div>
        </div>
      </transition>
    </header>
    <!-- Page Content -->
    <main class="flex-grow min-h-screen relative z-10 flex flex-col">
      <router-view v-slot="{ Component, route }">
        <div :key="route.path" class="flex-grow flex flex-col w-full">
          <component :is="Component" />
        </div>
      </router-view>
    </main>

    <!-- Global Utilities -->
    <ToastContainer />
    <ConfirmModal />
    <AIProductRecommendation v-if="!isAdminRoute && route.path !== '/about'" />
    <CookieBanner v-if="!isAdminRoute" />
    <GlobalSearch v-model="isSearchOpen" />
    <LoginModal :isOpen="isLoginModalOpen" @close="isLoginModalOpen = false" />
    <BackToTop v-if="!isAdminRoute" />
    <CompareFloatingBar v-if="!isAdminRoute" />
    
    <!-- Floating Contact Hub -->
    <div 
      v-if="!isAdminRoute"
      ref="contactHubRef"
      class="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2.5"
    >
      <!-- Expanded Contact Channels -->
      <transition name="contact-hub">
        <div v-if="isContactHubOpen" class="flex flex-col items-end gap-2 mb-1">
          

          <!-- LINE entries -->
          <a v-for="(line, i) in contactLines" :key="'line-'+i"
            :href="line.url || 'https://line.me/ti/p/~' + line.value"
            target="_blank" rel="noopener noreferrer"
            class="flex items-center gap-3 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 pl-4 pr-5 py-2.5 min-w-[200px] bg-[#06C755] hover:bg-[#05b04c]"
          >
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
            </div>
            <div class="leading-tight">
              <div class="text-xs font-black tracking-wide">{{ line.name ? 'LINE — ' + line.name : 'LINE' }}</div>
              <div class="text-[10px] opacity-80">{{ line.value }}</div>
            </div>
          </a>

          <!-- Phone entries -->
          <a v-for="(phone, i) in contactPhones" :key="'phone-'+i"
            :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')"
            class="flex items-center gap-3 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 pl-4 pr-5 py-2.5 min-w-[200px] bg-emerald-600 hover:bg-emerald-500"
          >
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.22 2 2 0 012.1 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
            </div>
            <div class="leading-tight">
              <div class="text-xs font-black tracking-wide">{{ phone.name ? 'โทร — ' + phone.name : 'โทรศัพท์' }}</div>
              <div class="text-[10px] opacity-80">{{ phone.value }}</div>
            </div>
          </a>

          <!-- Email entries -->
          <a v-for="(email, i) in contactEmails" :key="'email-'+i"
            :href="'mailto:' + email.value"
            class="flex items-center gap-3 text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 pl-4 pr-5 py-2.5 min-w-[200px] bg-gray-700 hover:bg-gray-600"
          >
            <div class="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div class="leading-tight">
              <div class="text-xs font-black tracking-wide">{{ email.name ? 'อีเมล — ' + email.name : 'อีเมล' }}</div>
              <div class="text-[10px] opacity-80">{{ email.value }}</div>
            </div>
          </a>

        </div>
      </transition>

      <!-- Main Toggle Button -->
      <button 
        @click="isContactHubOpen = !isContactHubOpen"
        aria-label="ติดต่อเราด่วน"
        class="relative w-[52px] h-[52px] bg-gradient-to-tr from-emerald-600 to-emerald-400 dark:from-emerald-700 dark:to-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 text-white flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 z-50 overflow-hidden"
      >
        <transition name="fade">
          <svg v-if="!isContactHubOpen" class="w-6 h-6 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
          <svg v-else class="w-6 h-6 absolute" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </transition>
        <div class="absolute inset-0 bg-white/20 animate-ping rounded-full pointer-events-none origin-center opacity-30"></div>
      </button>
    </div>

    <!-- Ultra Modern Premium Footer v4 -->
    <footer v-if="!isAdminRoute" class="relative z-0 bg-gradient-to-tr from-[#FFF7ED] via-[#FFFBF9] to-white dark:from-[#110c08] dark:via-[#0c0a08] dark:to-[#050505] border-t border-gray-100 dark:border-white/5 pt-24 pb-0 overflow-hidden">
      <!-- Glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none -z-10">
        <div class="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 blur-[120px] rounded-full"></div>
      </div>

      <!-- Background Decor -->
      <div class="absolute top-0 right-0 w-64 h-64 pointer-events-none overflow-hidden select-none z-0">
        <svg class="absolute -top-12 -right-12 w-48 h-48 text-[#0220A4]/15 dark:text-[#0220A4]/10 transform -rotate-12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 2c-3.87 0-7.74 1.46-10.61 4.39C7.53 9.27 6.07 13.14 6.07 17.01H2c0 2.76 2.24 5 5 5h10.01c3.87 0 7.74-1.46 10.61-4.39 2.86-2.88 4.32-6.75 4.32-10.62L21 2zm-3.99 15.01H8.08c.55-3.03 1.74-5.91 3.51-8.48 1.76 2.57 2.95 5.45 3.51 8.48z" />
        </svg>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Newsletter Banner: Compact horizontal strip -->
        <div class="relative rounded-3xl overflow-hidden mb-12 border border-blue-100/60 dark:border-white/5 bg-gradient-to-r from-[#F3F5FF] via-white to-[#E8EDFF] dark:from-[#080D1A] dark:via-[#0f0f0f] dark:to-[#051a16]">
          <!-- Subtle glow blobs -->
          <div class="absolute inset-0 pointer-events-none">
            <div class="absolute -top-12 -left-12 w-48 h-48 bg-[#0220A4]/8 dark:bg-[#0220A4]/5 blur-3xl rounded-full"></div>
            <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-[#4169E1]/8 dark:bg-[#4169E1]/5 blur-3xl rounded-full"></div>
          </div>

          <div class="relative z-10 flex flex-col lg:flex-row items-center gap-6 px-8 py-7">

            <!-- Left: Icon + Text -->
            <div class="flex items-center gap-4 flex-shrink-0">
              <!-- Icon circle -->
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0220A4] to-[#01166F] shadow-lg shadow-blue-900/20 flex items-center justify-center flex-shrink-0">
                <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p class="text-[11px] font-bold text-[#0220A4] dark:text-[#5B7CFF] uppercase tracking-widest mb-0.5">ติดตามข่าวสาร</p>
                <h2 class="text-[17px] font-black text-gray-900 dark:text-white leading-tight">
                  {{ settingsStore.footerNewsletterTitle }}
                  <svg class="inline w-4 h-4 text-blue-400 animate-pulse ml-1 -mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 7.2L22 11.6l-7.6 2.4L12 22l-2.4-7.2L2 11.6l7.6-2.4L12 2z" />
                  </svg>
                </h2>
                <p class="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">{{ settingsStore.footerNewsletterSubtitle }}</p>
              </div>
            </div>

            <!-- Divider (desktop) -->
            <div class="hidden lg:block w-px h-10 bg-gray-200 dark:bg-white/10 flex-shrink-0 mx-2"></div>

            <!-- Right: Form -->
            <div class="flex-1 w-full max-w-xl">
              <form @submit.prevent="submitNewsletter" class="relative">
                <input type="text" name="b_name" tabindex="-1" v-model="newsletterHoneypot" class="hidden">

                <template v-if="newsletterSuccess">
                  <div class="w-full bg-[#E8EDFF] dark:bg-[#080D1A]/40 border border-[#C7D4FF] dark:border-blue-900/30 rounded-full py-3 px-6 flex items-center justify-center gap-2.5">
                    <svg class="w-5 h-5 text-[#0220A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    <span class="text-sm font-bold text-[#0220A4] dark:text-[#5B7CFF]">ขอบคุณที่ติดตามข่าวสาร!</span>
                  </div>
                </template>

                <template v-else>
                  <div class="flex items-center bg-white dark:bg-gray-900 border-2 border-[#0220A4]/70 rounded-full overflow-hidden pl-4 focus-within:ring-4 focus-within:ring-[#0220A4]/10 transition-all duration-300 shadow-sm">
                    <svg class="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      v-model="newsletterEmail"
                      placeholder="อีเมลของคุณ..."
                      class="flex-1 py-3 text-sm bg-transparent border-none focus:ring-0 outline-none text-gray-900 dark:text-white placeholder:text-gray-400 font-medium min-w-0"
                    >
                    <button
                      type="submit"
                      :disabled="newsletterLoading"
                      class="m-1 px-5 py-2.5 bg-[#0220A4] text-white hover:bg-[#01166F] text-xs font-black tracking-wide rounded-full transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60 flex-shrink-0 shadow-md"
                    >
                      <svg v-if="newsletterLoading" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <template v-else>
                        <span>สมัครเลย</span>
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </template>
                    </button>
                  </div>
                  <p v-if="newsletterError" class="absolute -bottom-5 left-4 text-xs text-red-500 font-medium">{{ newsletterError }}</p>
                </template>
              </form>
            </div>

            <!-- Privacy note -->
            <div class="hidden xl:flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-[#0220A4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="whitespace-pre-line">{{ settingsStore.footerNewsletterPrivacy }}</span>
            </div>

          </div>
        </div>

        <div class="w-full h-px bg-gray-250/60 dark:bg-white/10 mb-16 relative z-10"></div>

        <!-- Main Links Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 relative z-10">
          
          <!-- Column 1: Brand & Address -->
          <div class="lg:col-span-3 flex flex-col items-start">
            <router-link to="/" :aria-label="settingsStore.storeName ? `${settingsStore.storeName} - หน้าแรก` : 'หน้าแรก'" class="group inline-flex items-center gap-4 mb-6 shrink-0">
              <template v-if="settingsStore.storeLogo">
                 <img :src="getOptimizedImageUrl(settingsStore.storeLogo, 300)" alt="Store Logo" class="h-8 md:h-10 w-auto max-w-[130px] sm:max-w-[160px] md:max-w-[200px] object-contain grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" @error="onImageError" />
              </template>
              <template v-else>
                <span class="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">{{ settingsStore.storeName || '' }}</span>
              </template>
            </router-link>
            
            <p class="text-[14px] leading-relaxed text-gray-500 dark:text-gray-400 mb-6">
              {{ settingsStore.storeDescription || 'แพลตฟอร์มการช้อปปิ้งและบริการระดับพรีเมียม ตอบโจทย์ทุกไลฟ์สไตล์อย่างลงตัว' }}
            </p>

            <div v-if="settingsStore.storeAddress || settingsStore.storeTaxId" class="space-y-3.5 mb-6 text-gray-600 dark:text-gray-400 text-[14px] text-left">
              <div v-if="settingsStore.storeAddress" class="flex items-start gap-3">
                <svg class="w-5 h-5 text-[#0220A4] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span class="leading-relaxed">{{ settingsStore.storeAddress }}</span>
              </div>
              <div v-if="settingsStore.storeTaxId" class="flex items-center gap-3">
                <svg class="w-5 h-5 text-[#0220A4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>เลขประจำตัวผู้เสียภาษี: {{ settingsStore.storeTaxId }}</span>
              </div>
            </div>

            <!-- Social Media Buttons -->
            <div class="flex items-center gap-3 mb-6 lg:mb-0">
              <a v-if="contactFacebookUrl" :href="contactFacebookUrl" target="_blank" aria-label="Facebook" class="w-9 h-9 rounded-full border border-[#0220A4]/30 hover:border-[#0220A4] flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#0220A4] dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#0220A4] transition-all duration-300">
                <svg class="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a v-if="contactTiktokUrl" :href="contactTiktokUrl" target="_blank" aria-label="TikTok" class="w-9 h-9 rounded-full border border-[#0220A4]/30 hover:border-[#0220A4] flex items-center justify-center text-gray-500 hover:text-white hover:bg-black dark:hover:bg-white dark:hover:text-black dark:text-gray-400 transition-all duration-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.76-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.16-3.44-3.37-3.46-5.7-.02-1.29.3-2.58.95-3.71A5.98 5.98 0 015.65 10.7a6.002 6.002 0 015.54-2.12v4.11c-.57-.02-1.14.07-1.68.25-.92.32-1.74 1.02-2.13 1.91-.32.74-.35 1.56-.16 2.33.15.63.47 1.25.93 1.7.9.89 2.3 1.21 3.52.8.93-.31 1.74-1.09 2.05-2.02.16-.48.26-1.01.24-1.52.01-4.71.01-9.42.01-14.13z"/></svg>
              </a>
              <a v-if="contactYoutubeUrl" :href="contactYoutubeUrl" target="_blank" aria-label="YouTube" class="w-9 h-9 rounded-full border border-[#0220A4]/30 hover:border-[#0220A4] flex items-center justify-center text-gray-500 hover:text-white hover:bg-red-600 hover:border-red-600 hover:text-white dark:text-gray-400 dark:hover:text-white dark:hover:bg-red-600 transition-all duration-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <!-- Column 2: เมนูหลัก -->
          <div class="lg:col-span-2 flex flex-col items-start text-left">
            <div class="mb-6 relative pb-2">
              <h3 class="text-[17px] font-black text-gray-900 dark:text-white">เมนูหลัก</h3>
              <span class="absolute bottom-0 left-0 w-8 h-1 bg-[#0220A4] rounded-full"></span>
            </div>
            <ul class="flex flex-col gap-3.5 w-full">
              <li><router-link to="/" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> หน้าแรก</router-link></li>
              <li><router-link to="/products" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> สินค้าทั้งหมด</router-link></li>
              <li><router-link to="/services" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> บริการของเรา</router-link></li>
              <li><router-link to="/space-calculator" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> คำนวณพื้นที่</router-link></li>
              <li><router-link to="/projects" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> ผลงาน</router-link></li>
            </ul>
          </div>

          <!-- Column 3: ข้อมูลช่วยเหลือ -->
          <div class="lg:col-span-2 flex flex-col items-start text-left">
            <div class="mb-6 relative pb-2">
              <h3 class="text-[17px] font-black text-gray-900 dark:text-white">ข้อมูลช่วยเหลือ</h3>
              <span class="absolute bottom-0 left-0 w-8 h-1 bg-[#0220A4] rounded-full"></span>
            </div>
            <ul class="flex flex-col gap-3.5 w-full">
              <li><router-link to="/about" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> เกี่ยวกับเรา</router-link></li>
              <li><router-link to="/contact" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> ติดต่อเรา</router-link></li>
              <li v-if="settingsStore.footerDistributorUrl && settingsStore.footerDistributorUrl !== '/ai-consultant'"><router-link :to="settingsStore.footerDistributorUrl" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group" :aria-label="footerDistributorText"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> {{ footerDistributorText }}</router-link></li>
              <li><router-link to="/privacy-policy" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> นโยบายความเป็นส่วนตัว</router-link></li>
              <li><router-link to="/terms-of-service" class="text-[14px] font-semibold text-gray-600 dark:text-gray-400 hover:text-[#0220A4] dark:hover:text-[#0220A4] transition-colors flex items-center gap-1.5 group"><span class="text-[#0220A4] font-black transform group-hover:translate-x-1 transition-transform">&gt;</span> เงื่อนไขการใช้งาน</router-link></li>
            </ul>
          </div>

          <!-- Column 4: ติดต่อเรา (Direct Contacts) -->
          <div class="lg:col-span-2 flex flex-col items-start text-left">
            <div class="mb-6 relative pb-2">
              <h3 class="text-[17px] font-black text-gray-900 dark:text-white">ติดต่อเรา</h3>
              <span class="absolute bottom-0 left-0 w-8 h-1 bg-[#0220A4] rounded-full"></span>
            </div>
            <div class="flex flex-col gap-4 text-[14px] w-full">
              <div v-if="contactPhones.length > 0 || settingsStore.storePhone" class="flex flex-col gap-2">
                <p class="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#0220A4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  เบอร์โทรศัพท์:
                </p>
                <div class="flex flex-col gap-1.5 pl-6">
                  <a v-for="(phone, i) in contactPhones" :key="i" :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')" class="font-bold text-gray-900 dark:text-white hover:text-[#0220A4] transition-colors">
                    {{ phone.value }} <span v-if="phone.name" class="text-[12px] font-normal text-gray-500 ml-1">({{ phone.name }})</span>
                  </a>
                  <a v-if="!contactPhones.length && settingsStore.storePhone" :href="'tel:' + settingsStore.storePhone.replace(/[^0-9+]/g, '')" class="font-bold text-gray-900 dark:text-white hover:text-[#0220A4] transition-colors">
                    {{ settingsStore.storePhone }}
                  </a>
                </div>
              </div>

              <div v-if="contactEmails.length > 0" class="flex flex-col gap-2">
                <p class="font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#0220A4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  อีเมลติดต่อ:
                </p>
                <div class="flex flex-col gap-1 pl-6">
                  <a v-for="(email, i) in contactEmails" :key="i" :href="'mailto:' + email.value" class="font-bold text-gray-900 dark:text-white hover:text-[#0220A4] transition-colors break-all">
                    {{ email.value }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 5: LINE Official custom card -->
          <div class="lg:col-span-3 col-span-1">
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col items-center text-center relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 z-10">
              <!-- LINE Official Badge -->
              <span class="absolute top-0 right-0 bg-[#06C755] text-emerald-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">LINE ID</span>
              
              <!-- Header Text -->
              <div class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1.5">
                <span>ช่องทางติดต่อหลัก</span>
              </div>

              <!-- LINE Logo Circle -->
              <div class="w-14 h-14 rounded-full bg-[#06C755]/10 flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" class="w-8 h-8 text-[#06C755]" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.63 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
              </div>

              <!-- LINE ID Label -->
              <h4 v-if="contactLines.length > 0" class="text-[17px] font-black text-gray-900 dark:text-white mb-5 select-all">
                {{ '@' + contactLines[0].value.replace(/^@/, '') }}
              </h4>

              <!-- Add Friend Button -->
              <a 
                v-if="contactLines.length > 0"
                :href="contactLines[0].url || 'https://line.me/ti/p/~' + contactLines[0].value.replace(/^@/, '')" 
                target="_blank" 
                class="w-full py-2.5 px-4 border-2 border-[#0220A4] dark:border-blue-500 text-[#0220A4] dark:text-[#5B7CFF] hover:bg-[#0220A4] hover:text-white dark:hover:bg-blue-500 text-sm font-black rounded-full transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-105"
              >
                <span>เพิ่มเพื่อน</span>
                <svg class="w-4 h-4 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        <!-- Trust Badge Bar -->
        <div class="relative z-10 w-full py-8 border-t border-gray-200/60 dark:border-white/5 mt-8 mb-12">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            <!-- Dynamic Cards -->
            <div v-for="(badge, idx) in settingsStore.footerTrustBadges" :key="idx" class="flex items-center gap-4 group">
              <div class="relative flex-shrink-0">
                <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-[#0220A4] to-blue-500 opacity-20 group-hover:opacity-45 blur transition-all duration-300"></div>
                <div class="relative w-11 h-11 rounded-full bg-white dark:bg-gray-800 border-2 border-[#0220A4] flex items-center justify-center text-[#0220A4] shadow-md shadow-[#0220A4]/10 group-hover:scale-110 transition-all duration-300">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :stroke-width="getTrustBadgeIconStrokeWidth(badge.icon)">
                    <path stroke-linecap="round" stroke-linejoin="round" :d="getTrustBadgeIconPath(badge.icon)" />
                  </svg>
                </div>
              </div>
              <div class="text-left">
                <h4 class="text-[15px] font-black text-gray-900 dark:text-white mb-0.5 group-hover:text-[#0220A4] transition-colors">{{ badge.title }}</h4>
                <p class="text-[12px] text-gray-500 dark:text-gray-400 leading-snug">{{ badge.desc }}</p>
              </div>
            </div>

          </div>
        </div>

      </div>

      <!-- Bottom Copyright Bar -->
      <div class="w-full bg-[#00105A] py-5 mt-4 relative z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
          <p class="text-xs md:text-sm font-medium">
            &copy; {{ new Date().getFullYear() }} <span class="font-black">{{ settingsStore.storeName || 'STORAGE HOUSE' }}</span>. สงวนลิขสิทธิ์
          </p>
          
          <div class="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 text-xs font-bold">
            <router-link to="/privacy-policy" class="hover:text-blue-100 transition-colors">นโยบายความเป็นส่วนตัว</router-link>
            <span class="opacity-50">|</span>
            <router-link to="/terms-of-service" class="hover:text-blue-100 transition-colors">เงื่อนไขการใช้งาน</router-link>
            <span class="opacity-50">|</span>
            <router-link :to="settingsStore.footerSitemapUrl || '/'" class="hover:text-blue-100 transition-colors" :aria-label="footerSitemapText">{{ footerSitemapText }}</router-link>
          </div>

          <button 
            type="button" 
            @click="scrollToTop" 
            aria-label="Back to top" 
            class="w-9 h-9 rounded-full bg-white text-[#0220A4] flex items-center justify-center hover:bg-blue-50 hover:scale-105 active:scale-95 shadow-md transition-all duration-300"
          >
            <svg class="w-4.5 h-4.5 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
    <HistoryFloatingButton v-if="!isAdminRoute" />
    </template>
  </div>
</template>

<style>

/* Global Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Base custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent; 
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.dark ::-webkit-scrollbar-thumb {
  background: #334155; 
}
</style>
