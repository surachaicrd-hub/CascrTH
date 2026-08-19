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
  "CASTING": {
    hexBorderGradient: "from-blue-500 to-blue-400",
    bgClass: "bg-white hover:bg-blue-50/10 dark:bg-[#111827] dark:hover:bg-blue-950/10 border-gray-100 hover:border-blue-200 dark:border-gray-800 dark:hover:border-blue-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(2,32,164,0.08)]",
    arrowClass: "text-blue-500 border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500",
    accentText: "group-hover:text-blue-500 dark:group-hover:text-blue-400",
  },
  "CRIMPING MACHINE": {
    hexBorderGradient: "from-indigo-500 to-blue-400",
    bgClass: "bg-white hover:bg-indigo-50/10 dark:bg-[#111827] dark:hover:bg-indigo-950/10 border-gray-100 hover:border-indigo-200 dark:border-gray-800 dark:hover:border-indigo-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(99,102,241,0.08)]",
    arrowClass: "text-indigo-600 border border-indigo-100 dark:border-indigo-950 bg-indigo-50/50 dark:bg-indigo-950/20 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600",
    accentText: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
  },
  "SEMI CRIMPING MACHINE": {
    hexBorderGradient: "from-blue-600 to-cyan-400",
    bgClass: "bg-white hover:bg-blue-50/10 dark:bg-[#111827] dark:hover:bg-blue-950/10 border-gray-100 hover:border-blue-200 dark:border-gray-800 dark:hover:border-blue-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.08)]",
    arrowClass: "text-blue-600 border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600",
    accentText: "group-hover:text-blue-600 dark:group-hover:text-blue-400",
  },
  "DIGITAL CUTTING MACHINE": {
    hexBorderGradient: "from-cyan-500 to-teal-400",
    bgClass: "bg-white hover:bg-cyan-50/10 dark:bg-[#111827] dark:hover:bg-cyan-950/10 border-gray-100 hover:border-cyan-200 dark:border-gray-800 dark:hover:border-cyan-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(6,182,212,0.08)]",
    arrowClass: "text-cyan-600 border border-cyan-100 dark:border-cyan-950 bg-cyan-50/50 dark:bg-cyan-950/20 group-hover:bg-cyan-600 group-hover:text-white group-hover:border-cyan-600",
    accentText: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400",
  },
  "CABLE AND WIRE STRIPPER": {
    hexBorderGradient: "from-sky-500 to-blue-400",
    bgClass: "bg-white hover:bg-sky-50/10 dark:bg-[#111827] dark:hover:bg-sky-950/10 border-gray-100 hover:border-sky-200 dark:border-gray-800 dark:hover:border-sky-900/30",
    shadowClass: "hover:shadow-[0_15px_30px_-5px_rgba(14,165,233,0.08)]",
    arrowClass: "text-sky-600 border border-sky-100 dark:border-sky-950 bg-sky-50/50 dark:bg-sky-950/20 group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-600",
    accentText: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
  },
  "PERIPHERAL": {
    hexBorderGradient: "from-teal-500 to-emerald-400",
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
          ? 'fixed top-0 left-0 w-full bg-[#F8F9FC]/95 dark:bg-[#0C0E14]/95 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] border-b border-gray-100/80 dark:border-white/5 py-0' 
          : 'absolute top-0 left-0 w-full bg-gradient-to-b from-[#070A0F]/90 via-[#070A0F]/50 to-transparent border-transparent py-3'
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
              <!-- High-precision Machine / Automation Icon -->
              <svg class="w-4 h-4 md:w-5 md:h-5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m16-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div class="flex flex-col leading-none">
              <span :class="['text-lg md:text-xl font-black tracking-wider uppercase transition-colors duration-300 group-hover:text-[#0220A4]', isDarkHeader ? 'text-white' : 'text-[#111827] dark:text-white']">
                {{ (settingsStore.storeName || 'CR DISTRIBUTION').split(' ')[0] }}
              </span>
              <span v-if="(settingsStore.storeName || 'CR DISTRIBUTION THAILAND').split(' ').slice(1).join(' ')" :class="['text-[10px] md:text-xs font-black tracking-[0.2em] uppercase transition-colors duration-300', isDarkHeader ? 'text-[#5B7CFF]' : 'text-[#0220A4] dark:text-[#5B7CFF]']">
                {{ (settingsStore.storeName || 'CR DISTRIBUTION THAILAND').split(' ').slice(1).join(' ') }}
              </span>
            </div>
          </template>
        </router-link>
        
        <!-- Desktop Nav -->
        <nav class="hidden lg:flex flex-1 justify-center items-center gap-5 xl:gap-7 mx-2 xl:mx-4">
          <router-link to="/" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            หน้าแรก
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <!-- Products with Dropdown -->
          <div class="relative" @mouseenter="openProductsDropdown" @mouseleave="closeProductsDropdown">
            <router-link to="/products" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group inline-flex items-center gap-1.5', isActiveRoute('/products') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
              <span>สินค้า</span>
              <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="isProductsDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
              <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/products') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
            </router-link>

            <!-- Dropdown (Modern Enterprise Mega Menu) -->
            <transition name="dropdown">
              <div v-if="isProductsDropdownOpen" class="absolute top-full -left-20 pt-3.5 z-50">
                <div class="bg-white dark:bg-[#10141D] rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-black/60 border border-slate-200/80 dark:border-white/[0.08] p-5 sm:p-6 min-w-[320px] sm:min-w-[480px] lg:min-w-[700px] xl:min-w-[780px] overflow-hidden">
                  
                  <!-- Top Bar: View All Header -->
                  <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">หมวดหมู่สินค้าทั้งหมด</h4>
                        <p class="text-[11px] text-slate-400 font-light mt-0.5">เลือกดูสินค้าและอุปกรณ์มาตรฐานสากลครบทุกหมวดหมู่</p>
                      </div>
                    </div>

                    <!-- Direct View All Link -->
                    <router-link 
                      to="/products" 
                      @click="isProductsDropdownOpen = false"
                      class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-colors"
                    >
                      <span>ดูสินค้าทั้งหมด</span>
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                      </svg>
                    </router-link>
                  </div>

                  <!-- Categories Grid (2 Columns) -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
                    <router-link 
                      v-for="cat in navCategories" 
                      :key="cat.id || cat.name" 
                      :to="`/products/category/${encodeURIComponent(cat.name)}`" 
                      @click="isProductsDropdownOpen = false"
                      class="group flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.08] transition-all duration-200"
                    >
                      <div class="flex items-center gap-3.5 min-w-0">
                        <!-- Category Icon / Image -->
                        <div class="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/[0.06] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 group-hover:border-emerald-500/40 transition-all overflow-hidden p-1.5">
                          <img 
                            v-if="cat.icon_url" 
                            :src="getOptimizedImageUrl(cat.icon_url, 64)" 
                            class="w-full h-full object-contain" 
                            :alt="cat.name" 
                            @error="onImageError"
                          />
                          <img 
                            v-else-if="cat.image_url" 
                            :src="getOptimizedImageUrl(cat.image_url, 128)" 
                            class="w-full h-full object-cover rounded-lg" 
                            :alt="cat.name" 
                            @error="onImageError"
                          />
                          <svg v-else class="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        </div>

                        <!-- Category Texts -->
                        <div class="flex-1 min-w-0 text-left">
                          <div class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {{ cat.name }}
                          </div>
                          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-light">
                            {{ cat.description || 'ดูรายการสินค้าในหมวดหมู่นี้' }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Hover Chevron -->
                      <div class="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </router-link>
                  </div>

                  <!-- Bottom Trust Badges Bar (Pure SVG, Zero Emojis) -->
                  <div class="pt-4 border-t border-slate-100 dark:border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <!-- Badge 1: Quality Material -->
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">มาตรฐานสากล</p>
                        <p class="text-[9px] text-slate-400 font-light mt-0.5">วัสดุเกรดพรีเมียม</p>
                      </div>
                    </div>

                    <!-- Badge 2: Expert Team -->
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">ทีมช่างเชี่ยวชาญ</p>
                        <p class="text-[9px] text-slate-400 font-light mt-0.5">พร้อมประกอบติดตั้ง</p>
                      </div>
                    </div>

                    <!-- Badge 3: Durable -->
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">รับประกันสินค้า</p>
                        <p class="text-[9px] text-slate-400 font-light mt-0.5">ใช้งานได้ยาวนาน</p>
                      </div>
                    </div>

                    <!-- Badge 4: Nationwide Delivery -->
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                        </svg>
                      </div>
                      <div>
                        <p class="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">จัดส่งทั่วประเทศ</p>
                        <p class="text-[9px] text-slate-400 font-light mt-0.5">รวดเร็ว ปลอดภัย</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </transition>
          </div>

          <router-link v-if="settingsStore.isProjectsEnabled" to="/projects" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/projects') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            ผลงาน
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/projects') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/blog" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/blog') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            บทความ
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/blog') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/services" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/services') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            บริการ
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/services') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/about" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/about') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            เกี่ยวกับเรา
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/about') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>

          <router-link to="/contact" :class="['text-sm font-semibold tracking-wide transition-colors duration-300 relative group', isActiveRoute('/contact') ? 'text-emerald-400 font-bold' : isDarkHeader ? 'text-white/90 hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400']">
            ติดต่อเรา
            <span :class="['absolute bottom-[-8px] left-1/2 -translate-x-1/2 h-[2px] bg-emerald-500 rounded-full transition-all duration-300', isActiveRoute('/contact') ? 'w-5' : 'w-0 group-hover:w-5']"></span>
          </router-link>
        </nav>
        <!-- Desktop Actions -->
        <div class="hidden lg:flex items-center gap-1.5 xl:gap-2.5 z-10 shrink-0 relative">
          <button @click="isSearchOpen = true" aria-label="ค้นหาสินค้า" :class="['transition-all w-11 h-11 flex items-center justify-center rounded-full duration-300 hover:scale-105 flex-shrink-0', isDarkHeader ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/5']">
            <svg class="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <router-link v-if="settingsStore.isOnlineShoppingEnabled" to="/cart" aria-label="ตะกร้าสินค้า" :class="['relative transition-all w-11 h-11 flex items-center justify-center rounded-full duration-300 hover:scale-105 flex-shrink-0', isDarkHeader ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/5']">
            <svg class="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.cartTotal > 0" class="absolute top-1 right-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0C0E14] shadow-md animate-pulse leading-none">
              {{ cartStore.cartTotal > 99 ? '99+' : cartStore.cartTotal }}
            </span>
          </router-link>
          
          <button @click="toggleDarkMode" aria-label="สลับโหมดมืด" :class="['transition-all w-11 h-11 flex items-center justify-center rounded-full duration-300 hover:scale-105 flex-shrink-0', isDarkHeader ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/5']">
            <svg v-if="!isDark" class="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          
          <!-- Auth / Profile -->
          <div v-if="settingsStore.isOnlineShoppingEnabled && authStore.isAuthenticated" class="relative group">
             <button aria-label="เมนูบัญชีผู้ใช้" class="flex items-center justify-center p-0.5 rounded-full border border-gray-200/80 dark:border-gray-800 hover:border-emerald-500 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:scale-105">
                <img v-if="authStore.currentUser?.avatar_url && !desktopAvatarError" :src="authStore.currentUser?.avatar_url" @error="desktopAvatarError = true" class="w-8 h-8 rounded-full object-cover">
                <div v-else class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                  {{ authStore.currentUser?.first_name?.charAt(0)?.toUpperCase() || authStore.currentUser?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
             </button>
             <div class="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
               <div class="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl py-2 min-w-[220px] border border-gray-100 dark:border-gray-800 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100 transition-transform">
                 <div class="px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-white/5 mb-2">
                   <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ authStore.currentUser?.first_name }} {{ authStore.currentUser?.last_name }}</p>
                   <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ authStore.currentUser?.email }}</p>
                 </div>
                 <router-link to="/profile" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> บัญชีของฉัน
                 </router-link>
                 <router-link to="/profile?tab=orders" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg> การสั่งซื้อของฉัน
                 </router-link>
                 <router-link v-if="settingsStore.isWishlistEnabled" to="/profile?tab=wishlist" class="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg> รายการโปรด
                 </router-link>
                 <div class="my-2 border-t border-gray-100 dark:border-gray-800"></div>
                 <button @click="authStore.logout()" class="w-full text-left px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2">
                   <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg> ออกจากระบบ
                 </button>
               </div>
             </div>
          </div>
          <button @click="isLoginModalOpen = true" v-else-if="settingsStore.isOnlineShoppingEnabled" aria-label="เข้าสู่ระบบ" :class="['transition-all w-11 h-11 flex items-center justify-center rounded-full duration-300 hover:scale-105 flex-shrink-0', isDarkHeader ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-white/5']" title="เข้าสู่ระบบ">
            <svg class="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
 
          <router-link to="/quotation" class="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap ml-1 shadow-md">
            ขอใบเสนอราคา
          </router-link>
        </div>

        <!-- Mobile Menu Toggles -->
        <div class="flex lg:hidden items-center gap-1 sm:gap-2 z-50">
          <button @click="isSearchOpen = true" aria-label="ค้นหาสินค้า" :class="['transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-white/90' : 'text-slate-700 dark:text-slate-300']">
            <svg class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
          <router-link v-if="settingsStore.isOnlineShoppingEnabled" to="/cart" aria-label="ตะกร้าสินค้า" :class="['relative transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-white/90' : 'text-slate-700 dark:text-slate-300']">
            <svg class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span v-if="cartStore.cartTotal > 0" class="absolute top-0.5 right-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0C0E14] shadow-sm animate-pulse leading-none">
              {{ cartStore.cartTotal > 99 ? '99+' : cartStore.cartTotal }}
            </span>
          </router-link>
          <button @click="toggleDarkMode" aria-label="สลับโหมดมืด" :class="['transition-all w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-white/90' : 'text-slate-700 dark:text-slate-300']">
            <svg v-if="!isDark" class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-5 h-5 sm:w-[22px] sm:h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          <button @click="toggleMobileMenu" aria-label="เมนูหลัก" :class="['focus:outline-none w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-all rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex-shrink-0', isDarkHeader ? 'text-white' : 'text-slate-900 dark:text-white']">
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
          <router-link v-if="settingsStore.isProjectsEnabled" to="/projects" :class="['py-2 text-lg font-bold tracking-wide transition-colors', isActiveRoute('/projects') ? 'text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-4' : 'text-gray-900 dark:text-white hover:text-emerald-700']">ผลงาน</router-link>
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

    <!-- =========================================================================
         ENTERPRISE MODERN FOOTER
         ========================================================================= -->
    <footer v-if="!isAdminRoute" class="relative z-0 bg-[#0B0F19] text-slate-300 border-t border-slate-800/80 pt-16 pb-0 overflow-hidden font-sans">
      
      <!-- Subtle Background Atmosphere Glows -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none -z-10">
        <div class="absolute top-[-10%] left-[-5%] w-[450px] h-[450px] bg-emerald-500/5 blur-[120px] rounded-full"></div>
        <div class="absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] bg-teal-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Newsletter Subscription Card (Sleek, Modern, No Emojis) -->
        <div class="relative rounded-3xl overflow-hidden mb-16 border border-slate-800 bg-slate-900/90 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            
            <!-- Left: Icon & Description -->
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <span class="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">NEWSLETTER & UPDATES</span>
                <h3 class="text-base sm:text-lg font-black text-white leading-tight">
                  {{ settingsStore.footerNewsletterTitle || 'ติดตามข้อมูลและสิทธิพิเศษ' }}
                </h3>
                <p class="text-xs text-slate-400 mt-1 font-light">
                  {{ settingsStore.footerNewsletterSubtitle || 'รับข่าวสารผลิตภัณฑ์และโปรโมชั่นใหม่ก่อนใคร' }}
                </p>
              </div>
            </div>

            <!-- Right: Form -->
            <div class="w-full lg:max-w-md">
              <form @submit.prevent="submitNewsletter" class="relative">
                <input type="text" name="b_name" tabindex="-1" v-model="newsletterHoneypot" class="hidden">

                <div v-if="newsletterSuccess" class="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-3 px-5 flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>ขอบคุณที่ลงทะเบียนติดตามข่าวสารเรียบร้อยแล้ว</span>
                </div>

                <div v-else class="flex flex-col sm:flex-row gap-2">
                  <div class="relative flex-1">
                    <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </span>
                    <input
                      type="email"
                      v-model="newsletterEmail"
                      placeholder="กรอกอีเมลของคุณ..."
                      class="w-full pl-10 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                    >
                  </div>
                  <button
                    type="submit"
                    :disabled="newsletterLoading"
                    class="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 shrink-0 transition-all duration-200 active:scale-95 whitespace-nowrap"
                  >
                    <svg v-if="newsletterLoading" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <template v-else>
                      <span>สมัครรับข่าวสาร</span>
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                    </template>
                  </button>
                </div>
                <p v-if="newsletterError" class="text-[11px] text-rose-400 mt-1 font-medium">{{ newsletterError }}</p>
              </form>
              <div class="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span>{{ settingsStore.footerNewsletterPrivacy || 'ข้อมูลปลอดภัยตามมาตรฐาน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)' }}</span>
              </div>
            </div>

          </div>
        </div>

        <!-- Main Links Grid (5 Columns) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-16 relative z-10">
          
          <!-- Column 1: Brand, Company Info & Socials (4 Columns on LG) -->
          <div class="lg:col-span-4 flex flex-col items-start">
            <router-link to="/" :aria-label="settingsStore.storeName ? `${settingsStore.storeName} - หน้าแรก` : 'หน้าแรก'" class="group inline-flex items-center gap-3 mb-4 shrink-0">
              <template v-if="settingsStore.storeLogo">
                <img :src="getOptimizedImageUrl(settingsStore.storeLogo, 300)" alt="Store Logo" class="h-9 w-auto max-w-[180px] object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" @error="onImageError" />
              </template>
              <template v-else>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white font-black flex items-center justify-center text-sm shadow-md shadow-emerald-500/20">
                    CR
                  </div>
                  <span class="text-xl font-black tracking-tight text-white">{{ settingsStore.storeName || 'CAS-CR' }}</span>
                </div>
              </template>
            </router-link>
            
            <p class="text-xs sm:text-sm leading-relaxed text-slate-400 mb-5 font-light">
              {{ settingsStore.storeDescription || 'ผู้นำเข้าและจัดจำหน่ายเครื่องตัดปอกสายไฟ KODERA จากประเทศญี่ปุ่น และโซลูชันระบบ Wire Harness มาตรฐานสากล พร้อมบริการติดตั้งและบำรุงรักษาทั่วประเทศ' }}
            </p>

            <!-- Company Legal & Tax Details -->
            <div class="space-y-3 mb-6 text-xs text-slate-400">
              <div v-if="settingsStore.storeAddress" class="flex items-start gap-2.5">
                <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="leading-relaxed">{{ settingsStore.storeAddress }}</span>
              </div>
              <div v-if="settingsStore.storeTaxId" class="flex items-center gap-2.5">
                <svg class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span class="font-mono">เลขประจำตัวผู้เสียภาษี: {{ settingsStore.storeTaxId }}</span>
              </div>
            </div>

            <!-- Social Media Channels -->
            <div class="flex items-center gap-2.5">
              <a v-if="contactFacebookUrl" :href="contactFacebookUrl" target="_blank" rel="noopener noreferrer" aria-label="Facebook" class="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-[#1877F2] border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a v-if="contactTiktokUrl" :href="contactTiktokUrl" target="_blank" rel="noopener noreferrer" aria-label="TikTok" class="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-black border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.76-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.16-3.44-3.37-3.46-5.7-.02-1.29.3-2.58.95-3.71A5.98 5.98 0 015.65 10.7a6.002 6.002 0 015.54-2.12v4.11c-.57-.02-1.14.07-1.68.25-.92.32-1.74 1.02-2.13 1.91-.32.74-.35 1.56-.16 2.33.15.63.47 1.25.93 1.7.9.89 2.3 1.21 3.52.8.93-.31 1.74-1.09 2.05-2.02.16-.48.26-1.01.24-1.52.01-4.71.01-9.42.01-14.13z"/></svg>
              </a>
              <a v-if="contactYoutubeUrl" :href="contactYoutubeUrl" target="_blank" rel="noopener noreferrer" aria-label="YouTube" class="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-[#FF0000] border border-slate-700/80 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          <!-- Column 2: เมนูหลัก (2 Columns on LG) -->
          <div class="lg:col-span-2 flex flex-col items-start">
            <div class="mb-5 flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider">เมนูหลัก</h4>
            </div>
            <ul class="flex flex-col gap-2.5 w-full text-xs sm:text-sm">
              <li><router-link to="/" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> หน้าแรก</router-link></li>
              <li><router-link to="/products" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> สินค้าทั้งหมด</router-link></li>
              <li><router-link to="/services" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> บริการของเรา</router-link></li>
              <li v-if="settingsStore.isProjectsEnabled"><router-link to="/projects" class="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> ผลงาน</router-link></li>
            </ul>
          </div>

          <!-- Column 3: ข้อมูลช่วยเหลือ (2 Columns on LG) -->
          <div class="lg:col-span-2 flex flex-col items-start">
            <div class="mb-5 flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-teal-500"></span>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider">ข้อมูลช่วยเหลือ</h4>
            </div>
            <ul class="flex flex-col gap-2.5 w-full text-xs sm:text-sm">
              <li><router-link to="/about" class="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> เกี่ยวกับเรา</router-link></li>
              <li><router-link to="/contact" class="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> ติดต่อเรา</router-link></li>
              <li v-if="settingsStore.footerDistributorUrl && settingsStore.footerDistributorUrl !== '/ai-consultant'">
                <router-link :to="settingsStore.footerDistributorUrl" class="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 group" :aria-label="footerDistributorText">
                  <svg class="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                  {{ footerDistributorText }}
                </router-link>
              </li>
              <li><router-link to="/privacy-policy" class="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> นโยบายความเป็นส่วนตัว</router-link></li>
              <li><router-link to="/terms-of-service" class="text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 group"><svg class="w-3 h-3 text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg> เงื่อนไขการใช้งาน</router-link></li>
            </ul>
          </div>

          <!-- Column 4: ติดต่อเรา (2 Columns on LG) -->
          <div class="lg:col-span-2 flex flex-col items-start">
            <div class="mb-5 flex items-center gap-2">
              <span class="w-1.5 h-4 rounded-full bg-emerald-500"></span>
              <h4 class="text-sm font-bold text-white uppercase tracking-wider">ติดต่อเรา</h4>
            </div>
            
            <div class="flex flex-col gap-4 text-xs sm:text-sm w-full">
              <!-- Phones -->
              <div v-if="contactPhones.length > 0 || settingsStore.storePhone" class="space-y-1.5">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  เบอร์โทรศัพท์
                </p>
                <div class="flex flex-col gap-1 pl-5">
                  <a v-for="(phone, i) in contactPhones" :key="i" :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')" class="font-bold text-white hover:text-emerald-400 transition-colors font-mono">
                    {{ phone.value }} <span v-if="phone.name" class="text-[11px] font-normal text-slate-400 block sm:inline">({{ phone.name }})</span>
                  </a>
                  <a v-if="!contactPhones.length && settingsStore.storePhone" :href="'tel:' + settingsStore.storePhone.replace(/[^0-9+]/g, '')" class="font-bold text-white hover:text-emerald-400 transition-colors font-mono">
                    {{ settingsStore.storePhone }}
                  </a>
                </div>
              </div>

              <!-- Emails -->
              <div v-if="contactEmails.length > 0" class="space-y-1.5">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  อีเมลติดต่อ
                </p>
                <div class="flex flex-col gap-1 pl-5">
                  <a v-for="(email, i) in contactEmails" :key="i" :href="'mailto:' + email.value" class="text-slate-300 hover:text-emerald-400 transition-colors font-mono break-all text-xs">
                    {{ email.value }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 5: LINE Official Card (2 Columns on LG) -->
          <div class="lg:col-span-2">
            <div class="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 text-center relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-300 shadow-lg">
              <span class="absolute top-0 right-0 bg-[#06C755] text-emerald-950 text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                LINE OA
              </span>
              
              <p class="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">ช่องทางติดต่อหลัก</p>

              <div class="w-12 h-12 rounded-2xl bg-[#06C755]/10 border border-[#06C755]/20 flex items-center justify-center mx-auto mb-2 text-[#06C755]">
                <svg viewBox="0 0 24 24" class="w-7 h-7" fill="currentColor">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                </svg>
              </div>

              <h5 v-if="contactLines.length > 0" class="text-sm font-bold text-white mb-3.5 font-mono select-all">
                {{ '@' + contactLines[0].value.replace(/^@/, '') }}
              </h5>

              <a 
                v-if="contactLines.length > 0"
                :href="contactLines[0].url || ('https://line.me/ti/p/~' + contactLines[0].value.replace(/^@/, ''))" 
                target="_blank" 
                rel="noopener noreferrer"
                class="w-full h-9 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white text-xs font-bold shadow-md shadow-[#06C755]/20 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>เพิ่มเพื่อน LINE</span>
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        <!-- Trust Badges Bar (100% SVG Icons) -->
        <div v-if="settingsStore.footerTrustBadges && settingsStore.footerTrustBadges.length > 0" class="relative z-10 w-full py-8 border-t border-slate-800/80">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="(badge, idx) in settingsStore.footerTrustBadges" :key="idx" class="flex items-center gap-3.5 group">
              <div class="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-300 shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" :stroke-width="getTrustBadgeIconStrokeWidth(badge.icon)">
                  <path stroke-linecap="round" stroke-linejoin="round" :d="getTrustBadgeIconPath(badge.icon)" />
                </svg>
              </div>
              <div class="text-left min-w-0">
                <h5 class="text-xs sm:text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{{ badge.title }}</h5>
                <p class="text-[11px] text-slate-400 leading-snug truncate font-light">{{ badge.desc }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Copyright Bar -->
      <div class="w-full bg-[#060911] border-t border-slate-800/80 py-4.5 relative z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-xs">
          <p class="font-medium text-center sm:text-left">
            &copy; {{ new Date().getFullYear() }} <span class="font-bold text-white">{{ settingsStore.storeName || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}</span>. สงวนลิขสิทธิ์
          </p>
          
          <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
            <router-link to="/privacy-policy" class="hover:text-emerald-400 transition-colors">นโยบายความเป็นส่วนตัว</router-link>
            <span class="text-slate-700">|</span>
            <router-link to="/terms-of-service" class="hover:text-emerald-400 transition-colors">เงื่อนไขการใช้งาน</router-link>
            <span class="text-slate-700">|</span>
            <router-link :to="settingsStore.footerSitemapUrl || '/sitemap'" class="hover:text-emerald-400 transition-colors" :aria-label="footerSitemapText">{{ footerSitemapText }}</router-link>
          </div>

          <button 
            type="button" 
            @click="scrollToTop" 
            aria-label="Back to top" 
            class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white border border-slate-700 hover:border-emerald-500 flex items-center justify-center active:scale-95 transition-all duration-200 shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
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
