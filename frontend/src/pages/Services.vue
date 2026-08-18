<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const loading = ref(true)
const visibleSections = ref(new Set())

const heroBg = computed(() => {
  return settings.value.services_hero_bg || settingsStore.servicesHeroBg || '/images/hero/services-hero.jpg'
})

// Steps interactive state
const activeStep = ref(0)
const activeStepMobile = ref(0)
const slider = ref(null)

const settings = ref({
  services_hero_title: '',
  services_hero_subtitle: '',
  services_hero_desc: '',
  services_items: [],
  services_cta_title: '',
  services_cta_desc: '',
  services_content_rich: '',
  services_hero_bg: ''
})

const stats = ref([])
let observer = null

// Real default 6-step workflow for Wire Processing
const defaultSteps = [
  {
    title: 'ปรึกษาสเปกและประเภทสายไฟ',
    desc: 'พูดคุยกับทีมวิศวกรฝ่ายขาย เพื่อเลือกสเปกเครื่องจักร ขนาดสายไฟ (mm²) ความเร็วในการตัดปอก และฟังก์ชันการใช้งานที่ตรงกับความต้องการของท่าน',
    icon: 'chat',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'ทดสอบตัดปอกชิ้นงานจริง (Sample Test)',
    desc: 'ส่งตัวอย่างสายไฟจริงมาทดสอบตัดปอก หรือนัดหมายเข้าชมการสาธิตเครื่องจักร KODERA ณ ศูนย์บริการ พร้อมรับรายงานผลการทดสอบ',
    icon: 'document',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'สรุปสเปกและออกใบเสนอราคาด่วน',
    desc: 'สรุปรายการเครื่องจักร อุปกรณ์เสริม อะไหล่สิ้นเปลือง พร้อมออกใบเสนอราคาอย่างเป็นทางการและถูกต้องตามมาตรฐานภายใน 1-2 ชั่วโมง',
    icon: 'calendar',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'ส่งมอบและจัดส่งอย่างปลอดภัย',
    desc: 'ตรวจเช็กความพร้อมของเครื่องจักร แพ็คกิ้งตามมาตรฐานความปลอดภัย และจัดส่งถึงโรงงานของท่านตรงตามเวลานัดหมายทั่วประเทศ',
    icon: 'truck',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'ติดตั้งและฝึกอบรมการใช้งาน (Training)',
    desc: 'ทีมวิศวกรผู้เชี่ยวชาญเข้าติดตั้งเครื่องจักร เซ็ตโปรแกรมการทำงาน และฝึกอบรมเจ้าหน้าที่ผู้ควบคุมเครื่องจนสามารถใช้งานได้อย่างคล่องแคล่ว',
    icon: 'wrench',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'ตรวจรับงานและบริการหลังการขาย (After-Sales)',
    desc: 'ตรวจสอบความเรียบร้อย มอบคู่มือภาษาไทย/อังกฤษ ใบรับประกันสินค้า 1 ปีเต็ม พร้อมทีมบริการ On-site Service และสต็อกอะไหล่แท้',
    icon: 'check',
    image: 'https://images.unsplash.com/photo-1541888086925-920a0eb46de2?auto=format&fit=crop&w=1200&q=80'
  }
]

// Fallback real stats
const defaultStats = [
  { number: '100%', label: 'มาตรฐานญี่ปุ่นและอะไหล่แท้ KODERA' },
  { number: '77 จังหวัด', label: 'บริการจัดส่ง ติดตั้ง และ On-site ทั่วไทย' },
  { number: '±0.1mm', label: 'ความแม่นยำสูงระดับไมครอน' },
  { number: 'รับประกัน 1 ปี', label: 'พร้อมทีมวิศวกรผู้เชี่ยวชาญดูแลต่อเนื่อง' }
]

// Core Services Highlights
const coreServices = [
  {
    title: 'บริการทดสอบตัดปอกชิ้นงานสายไฟ (Sample Cutting)',
    subtitle: 'Sample Testing & Demo',
    desc: 'บริการทดสอบตัดปอกชิ้นงานจริงของลูกค้าเพื่อยืนยันความแม่นยำและประสิทธิภาพก่อนตัดสินใจสั่งซื้อ',
    icon: 'survey'
  },
  {
    title: 'บริการติดตั้งและฝึกอบรมการใช้งาน',
    subtitle: 'On-site Installation & Training',
    desc: 'ทีมวิศวกรผู้ชำนาญการเข้าติดตั้งเครื่องจักร เซ็ตระบบ และเทรนนิ่งทีมงานของท่านถึงโรงงาน',
    icon: 'truck'
  },
  {
    title: 'บริการเตรียมพื้นที่และงานฐานราก',
    subtitle: 'Groundwork & Foundation',
    desc: 'ให้คำแนะนำการเทพื้นคอนกรีต ปรับระดับดิน และงานฐานราก เพื่อให้โครงสร้างอาคารมีความมั่นคงแข็งแรงสูงสุด',
    icon: 'foundation'
  },
  {
    title: 'บริการตรวจรับงานและรับประกัน',
    subtitle: 'Inspection & Warranty Service',
    desc: 'ตรวจเช็คความสมบูรณ์ทุกจุดก่อนส่งมอบงาน พร้อมเอกสารรับประกันและทีมงานดูแลช่วยเหลือตลอดอายุการใช้งาน',
    icon: 'warranty'
  }
]

const setupObserver = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleSections.value.add(entry.target.dataset.section)
      }
    })
  }, { threshold: 0.15 })
  document.querySelectorAll('[data-section]').forEach(el => observer.observe(el))
}

const onScroll = () => {
  if (!slider.value) return
  const scrollLeft = slider.value.scrollLeft
  const children = slider.value.children
  if (children.length === 0) return
  const cardWidth = children[0].offsetWidth
  const gap = 16
  const index = Math.round(scrollLeft / (cardWidth + gap))
  if (index >= 0 && index < children.length) {
    activeStepMobile.value = index
  }
}

const loadSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      if (data.data.services_hero_title !== undefined) settings.value.services_hero_title = data.data.services_hero_title
      if (data.data.services_hero_subtitle !== undefined) settings.value.services_hero_subtitle = data.data.services_hero_subtitle
      if (data.data.services_hero_desc !== undefined) settings.value.services_hero_desc = data.data.services_hero_desc
      
      if (data.data.services_items) {
        try {
          const parsed = typeof data.data.services_items === 'string' ? JSON.parse(data.data.services_items) : data.data.services_items
          if (Array.isArray(parsed) && parsed.length > 0) settings.value.services_items = parsed
        } catch(e) {}
      }
      if (!settings.value.services_items || settings.value.services_items.length === 0) {
        settings.value.services_items = defaultSteps
      }

      if (data.data.services_stats) {
        try {
          const parsed = typeof data.data.services_stats === 'string' ? JSON.parse(data.data.services_stats) : data.data.services_stats
          if (Array.isArray(parsed) && parsed.length > 0) stats.value = parsed
        } catch(e) {}
      }
      if (!stats.value || stats.value.length === 0) {
        stats.value = defaultStats
      }

      if (data.data.services_cta_title !== undefined) settings.value.services_cta_title = data.data.services_cta_title
      if (data.data.services_cta_desc !== undefined) settings.value.services_cta_desc = data.data.services_cta_desc
      if (data.data.services_content_rich !== undefined) settings.value.services_content_rich = data.data.services_content_rich
      if (data.data.services_hero_bg !== undefined) settings.value.services_hero_bg = data.data.services_hero_bg
    } else {
      settings.value.services_items = defaultSteps
      stats.value = defaultStats
    }
  } catch (error) {
    console.error('Failed to load services settings:', error)
    settings.value.services_items = defaultSteps
    stats.value = defaultStats
  } finally {
    loading.value = false
    setTimeout(() => {
      setupObserver()
      if (slider.value) {
        slider.value.addEventListener('scroll', onScroll)
      }
    }, 100)
  }
}

onMounted(() => {
  setMeta({
    title: 'บริการติดตั้ง ฝึกอบรม และดูแลรักษา - ' + (settingsStore.storeName || 'KODERA Machines'),
    description: 'บริการติดตั้งเครื่องจักร ฝึกอบรมการใช้งาน ทดสอบชิ้นงานสายไฟ และซ่อมบำรุงเครื่องตัดปอกสายไฟ KODERA โดยทีมวิศวกรผู้เชี่ยวชาญทั่วประเทศไทย',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "บริการติดตั้ง ฝึกอบรม และดูแลรักษา - " + (settingsStore.storeName || 'KODERA Machines'),
    "description": "บริการให้คำปรึกษา ทดสอบตัดปอกชิ้นงาน ติดตั้ง และซ่อมบำรุงเครื่องตัดปอกสายไฟ KODERA มาตรฐานญี่ปุ่น",
    "provider": {
      "@type": "LocalBusiness",
      "name": settingsStore.storeName || "บริษัท แคส-ซีอาร์ จำกัด"
    }
  }, 'dynamic-services-data')

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "บริการของเรา", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')

  loadSettings()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
  if (slider.value) {
    slider.value.removeEventListener('scroll', onScroll)
  }
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100 pb-20">
    
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-[60vh]">
       <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
    </div>
    
    <div v-else>

      <!-- =========================================================================
           HERO HEADER SECTION (Enterprise Dark Aesthetic)
           ========================================================================= -->
      <header class="relative overflow-hidden pt-28 pb-16 bg-[#070A0F] border-b border-white/[0.05]">
        <!-- Hero Background Image (Admin Managed) -->
        <div 
          class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-60 scale-100 pointer-events-none"
          :style="{ backgroundImage: `url(${heroBg})` }"
        ></div>
        <!-- Directional Gradient Overlays: Dark on text area, clear and luminous on image -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#070A0F] via-[#070A0F]/70 to-[#070A0F]/20 pointer-events-none"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#070A0F] via-transparent to-[#070A0F]/40 pointer-events-none"></div>

        <!-- Background Mesh Pattern -->
        <div class="absolute inset-0 opacity-[0.035] pointer-events-none"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px); background-size: 28px 28px;">
        </div>
        
        <!-- Ambient Atmospheric Glows -->
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <!-- Breadcrumb Bar -->
          <nav class="flex items-center gap-2 text-xs font-medium text-slate-400 mb-6" aria-label="Breadcrumb">
            <router-link to="/" class="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              <span>หน้าแรก</span>
            </router-link>
            <svg class="w-3 h-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
            <span class="text-emerald-400 font-semibold">บริการของเรา</span>
          </nav>

          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div class="max-w-3xl">
              <!-- Eyebrow Pill -->
              <div class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span class="text-emerald-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                  {{ settings.services_hero_subtitle || 'SERVICES & INSTALLATION' }}
                </span>
              </div>
              
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                {{ settings.services_hero_title || 'บริการติดตั้ง ฝึกอบรมการใช้งาน' }} <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400">
                  และดูแลหลังการขายครบวงจร
                </span>
              </h1>
              
              <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
                {{ settings.services_hero_desc || 'บริการติดตั้ง ฝึกอบรมการใช้งาน ตรวจเช็กสภาพ และซ่อมบำรุงเครื่องตัดปอกสายไฟอัตโนมัติ KODERA โดยทีมวิศวกรผู้เชี่ยวชาญ พร้อมการรับประกันและบริการ On-site Service ครอบคลุมทั่วประเทศไทย' }}
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 shrink-0">
              <router-link 
                to="/quotation" 
                class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>ขอใบเสนอราคาฟรี</span>
              </router-link>

              <router-link 
                to="/projects" 
                class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span>ดูผลงานการติดตั้ง</span>
              </router-link>
            </div>
          </div>
        </div>
      </header>

      <!-- =========================================================================
           STATS BAR (Key Highlights)
           ========================================================================= -->
      <section data-section="stats" class="relative -mt-8 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06]">
            <div v-for="(stat, i) in stats" :key="i" class="text-center pt-4 sm:pt-0 first:pt-0 px-2 sm:px-4">
              <p class="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 font-mono tracking-tight mb-1">
                {{ stat.number || stat.val }}
              </p>
              <p class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================================
           CORE SERVICES SECTION (4 Services Grid)
           ========================================================================= -->
      <section class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-2xl mx-auto mb-14">
          <div class="inline-flex items-center gap-2 mb-3.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            <span>OUR CORE SERVICES</span>
          </div>
          
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            บริการหลักที่ครอบคลุมทุกความต้องการ
          </h2>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-light">
            ดูแลตั้งแต่เริ่มต้นวางแผน จัดส่ง ประกอบติดตั้ง จนถึงการตรวจรับงานและบริการหลังการขาย
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div 
            v-for="(srv, idx) in coreServices" 
            :key="'srv-'+idx"
            class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5">
                <!-- Survey Icon -->
                <svg v-if="srv.icon === 'survey'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
                <!-- Truck Icon -->
                <svg v-else-if="srv.icon === 'truck'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 11-4 0m4 0H17m-4-6h5l2 5"/>
                </svg>
                <!-- Foundation Icon -->
                <svg v-else-if="srv.icon === 'foundation'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <!-- Warranty Icon -->
                <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>

              <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                {{ srv.subtitle }}
              </span>

              <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2.5">
                {{ srv.title }}
              </h3>

              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                {{ srv.desc }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>มาตรฐาน ซีอาร์</span>
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================================
           6-STEP SERVICE PROCESS SECTION
           ========================================================================= -->
      <section class="py-16 md:py-24 bg-slate-100/60 dark:bg-[#0B0F19] border-t border-b border-slate-200/60 dark:border-white/[0.04]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <div class="inline-flex items-center gap-2 mb-3.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>WORKFLOW & PROCESS</span>
            </div>
            
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              กระบวนการทำงาน 6 ขั้นตอนสู่ความสมบูรณ์แบบ
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-light">
              ขั้นตอนการทำงานที่เป็นระบบและได้มาตรฐาน เพื่อให้ผลงานมีคุณภาพ ตรงเวลา และตอบโจทย์สูงสุด
            </p>
          </div>

          <!-- DESKTOP VIEW (lg:flex) -->
          <div class="hidden lg:flex gap-12 items-start">
            
            <!-- Sticky Left: Image Preview -->
            <div class="w-1/2 sticky top-28">
              <div class="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-900">
                <div 
                  v-for="(step, index) in settings.services_items" 
                  :key="'step-img-'+index"
                  class="absolute inset-0 transition-all duration-700 ease-in-out"
                  :class="[ activeStep === index ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none' ]"
                >
                  <img :src="step.image || defaultSteps[index]?.image || defaultSteps[0].image" :alt="step.title" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                  
                  <!-- Step Number Badge -->
                  <div class="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-mono font-black text-lg shadow-lg shadow-emerald-500/25">
                    {{ String(index + 1).padStart(2, '0') }}
                  </div>
                  
                  <!-- Bottom Step Caption -->
                  <div class="absolute bottom-6 left-6 right-6">
                    <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">ขั้นตอนที่ {{ index + 1 }}</p>
                    <h4 class="text-xl font-black text-white leading-tight">{{ step.title }}</h4>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Interactive Steps List -->
            <div class="w-1/2 space-y-3.5">
              <div 
                v-for="(step, index) in settings.services_items" 
                :key="'step-list-'+index"
                @mouseenter="activeStep = index"
                @click="activeStep = index"
                class="p-5 sm:p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4.5 items-start"
                :class="[
                  activeStep === index
                    ? 'bg-white dark:bg-[#10141D] border-emerald-500/40 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5 translate-x-2'
                    : 'bg-white/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.04] opacity-75 hover:opacity-100 hover:border-slate-300'
                ]"
              >
                <!-- Number Badge / Icon -->
                <div class="shrink-0">
                  <div 
                    class="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-300"
                    :class="activeStep === index ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'"
                  >
                    {{ String(index + 1).padStart(2, '0') }}
                  </div>
                </div>

                <!-- Text Content -->
                <div class="flex-1 min-w-0">
                  <h3 
                    class="text-base font-bold transition-colors duration-300"
                    :class="activeStep === index ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'"
                  >
                    {{ step.title }}
                  </h3>
                  <p 
                    v-show="activeStep === index" 
                    class="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light transition-all duration-300"
                  >
                    {{ step.desc }}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <!-- MOBILE / TABLET VIEW (Horizontal Snap Scroll) -->
          <div class="block lg:hidden">
            <div class="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pb-6 scrollbar-none" ref="slider">
              <div 
                v-for="(step, index) in settings.services_items" 
                :key="'mobile-step-'+index"
                class="snap-center shrink-0 w-[85vw] sm:w-[400px] bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-lg flex flex-col"
              >
                <div class="relative h-48 w-full bg-slate-900">
                  <img :src="step.image || defaultSteps[index]?.image || defaultSteps[0].image" :alt="step.title" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                  
                  <div class="absolute top-4 left-4 w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-mono font-bold text-sm shadow-md">
                    {{ String(index + 1).padStart(2, '0') }}
                  </div>
                </div>

                <div class="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span class="text-xs font-bold text-emerald-500 uppercase tracking-wider block mb-1">
                      ขั้นตอนที่ {{ index + 1 }}
                    </span>
                    <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">{{ step.title }}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-light">{{ step.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Indicator Dots -->
            <div class="flex justify-center gap-1.5 mt-2">
              <span 
                v-for="(_, i) in settings.services_items" 
                :key="'dot-'+i"
                class="h-1.5 rounded-full transition-all duration-300"
                :class="[ activeStepMobile === i ? 'w-5 bg-emerald-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700' ]"
              ></span>
            </div>
          </div>

        </div>
      </section>

      <!-- =========================================================================
           WHY CHOOSE US (Trust & Quality Highlights)
           ========================================================================= -->
      <section class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#10141D] rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div class="lg:col-span-5 space-y-4 text-center lg:text-left">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <span>WHY CLIENTS TRUST US</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                เหตุผลที่ลูกค้าทั่วประเทศ <br/>
                เลือกใช้บริการกับเรา
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">
                เรามุ่งมั่นรักษามาตรฐานสูงสุดในทุกกระบวนการ เพื่อความมั่นใจ ความปลอดภัย และความคุ้มค่าสูงสุดสำหรับลูกค้าทุกท่าน
              </p>
            </div>

            <div class="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-3.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">ช่างผู้ชำนาญการเฉพาะทาง</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">ผ่านการอบรมการประกอบตามมาตรฐานโครงสร้างอย่างถูกต้อง</p>
                </div>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-3.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">จัดส่งตรงเวลานัดหมาย</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">ระบบประสานงานและทีมขนส่งมืออาชีพครอบคลุมทุกภูมิภาค</p>
                </div>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-3.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">เครื่องมือติดตั้งมาตรฐาน</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">ใช้อุปกรณ์ยึดและเครื่องมือติดตั้งเกรดอุตสาหกรรม ปลอดภัย</p>
                </div>
              </div>

              <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/[0.04] flex items-start gap-3.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-slate-900 dark:text-white">ออกใบกำกับภาษี & ใบรับประกัน</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-light">เอกสารครบถ้วน ถูกต้องตามกฎหมาย สำหรับบุคคลและนิติบุคคล</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- =========================================================================
           RICH CONTENT (Optional Admin Extended Details)
           ========================================================================= -->
      <section v-if="settings.services_content_rich" class="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">รายละเอียดบริการเพิ่มเติม</h2>
          <div class="mt-2.5 w-12 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>
        <div class="bg-white dark:bg-[#10141D] rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-white/[0.06] shadow-xl prose prose-emerald dark:prose-invert max-w-none text-sm leading-relaxed" v-html="settings.services_content_rich"></div>
      </section>

      <!-- =========================================================================
           CTA BANNER (Start Your Installation Project)
           ========================================================================= -->
      <section data-section="cta" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div class="rounded-3xl p-8 sm:p-12 lg:p-14 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-white/[0.08] shadow-2xl relative overflow-hidden">
          
          <!-- Ambient Glows -->
          <div class="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div class="max-w-2xl">
              <div class="inline-flex items-center gap-2 mb-3.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <span>START YOUR PROJECT</span>
              </div>

              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
                {{ settings.services_cta_title || 'สนใจบริการประกอบและติดตั้ง?' }}
              </h2>
              <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                {{ settings.services_cta_desc || 'ส่งรายละเอียดหน้างาน ขนาดพื้นที่ หรือติดต่อทีมวิศวกรเพื่อประเมินราคาและจองคิวติดตั้งได้ทันที' }}
              </p>
            </div>

            <!-- Standard CTA Buttons -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <router-link 
                to="/quotation" 
                class="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95 min-w-[160px]"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>ขอใบเสนอราคา</span>
              </router-link>

              <a 
                v-if="settingsStore.contactLines.length > 0"
                :href="settingsStore.contactLines[0].url || ('https://line.me/ti/p/~' + (settingsStore.contactLines[0].value || '').replace(/^@/, ''))"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center justify-center gap-2.5 h-12 px-6 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-sm shadow-lg shadow-[#06C755]/25 transition-all duration-200 active:scale-95 min-w-[160px]"
              >
                <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                </svg>
                <span>แชทผ่าน LINE</span>
              </a>
            </div>

          </div>
        </div>
      </section>

    </div>
  </div>
</template>
