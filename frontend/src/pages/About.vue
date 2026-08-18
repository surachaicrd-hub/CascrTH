<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getImageUrl } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const loading = ref(true)
const visibleSections = ref(new Set())
let observer = null

const s = ref({
  about_hero_title: '', 
  about_hero_subtitle: '', 
  about_hero_desc: '', 
  about_hero_bg: '',
  about_story_title: '',
  about_story_p1: '',
  about_story_p2: '',
  about_story_check_1: '',
  about_story_check_2: '',
  about_story_check_3: '',
  about_story_check_4: '',
  about_main_img: '', 
  about_quote_title: '', 
  about_quote_text: '',
  about_core_1_title: '', about_core_1_desc: '', about_core_1_img: '',
  about_core_2_title: '', about_core_2_desc: '', about_core_2_img: '',
  about_core_3_title: '', about_core_3_desc: '', about_core_3_img: '',
  about_core_4_title: '', about_core_4_desc: '', about_core_4_img: '',
  about_vision_title: '', about_vision_desc: '', about_vision_img: '',
  about_mission_title: '', about_mission_desc: '',
  about_stat_1_val: '', about_stat_1_label: '',
  about_stat_2_val: '', about_stat_2_label: '',
  about_stat_3_val: '', about_stat_3_label: '',
  about_stat_4_val: '', about_stat_4_label: '',
  about_cta_title: '', about_cta_desc: '',
  about_content_rich: ''
})

const coreValues = ref([])
const stats = ref([])

const selectedCoreValue = ref(null)
const isModalOpen = ref(false)

const openModal = (val) => {
  selectedCoreValue.value = val
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  isModalOpen.value = false
  setTimeout(() => {
    selectedCoreValue.value = null
  }, 300)
  document.body.style.overflow = 'auto'
}

const showRichContent = ref(false)
const displayRichContent = ref('')

const isEmptyHtml = (html) => {
  if (!html) return true
  const clean = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
  return clean === ''
}

// Fallback real default core values
const defaultCoreValues = [
  {
    title: 'คุณภาพมาตรฐานอุตสาหกรรม',
    desc: 'ทุกชิ้นส่วนและผลิตภัณฑ์ผ่านการคัดสรรจากวัสดุเกรดพรีเมียม ทนทานต่อสภาพอากาศ ใช้งานได้ยาวนาน ปลอดภัยคุ้มค่าการลงทุน',
    icon: 'shield',
    tag: 'QUALITY ASSURANCE'
  },
  {
    title: 'บริการให้คำปรึกษาและออกแบบ',
    desc: 'ทีมวิศวกรผู้เชี่ยวชาญพร้อมให้คำปรึกษา คำนวณขนาดพื้นที่ และแนะนำโซลูชั่นที่เหมาะสมกับรูปแบบการใช้งานจริงของลูกค้าแต่ละท่าน',
    icon: 'solution',
    tag: 'EXPERT CONSULTATION'
  },
  {
    title: 'ทีมช่างผู้ชำนาญการติดตั้ง',
    desc: 'เรามีทีมงานช่างติดตั้งมืออาชีพที่ผ่านการฝึกอบรมมาตรฐาน ให้บริการจัดส่งและประกอบติดตั้งอย่างประณีต ครอบคลุมทั่วประเทศ',
    icon: 'wrench',
    tag: 'PROFESSIONAL INSTALLATION'
  },
  {
    title: 'รับประกันและดูแลหลังการขาย',
    desc: 'มั่นใจได้ด้วยการรับประกันสินค้า โครงสร้าง และบริการหลังการขายที่รวดเร็ว พร้อมสต็อกอะไหล่และทีมงานดูแลอย่างต่อเนื่อง',
    icon: 'support',
    tag: 'AFTER-SALES SERVICE'
  }
]

// Fallback real stats for Wire Harness / KODERA
const defaultStats = [
  { val: '20+', label: 'ปีแห่งความเชี่ยวชาญด้าน Wire Harness' },
  { val: '500+', label: 'เครื่องจักรที่ส่งมอบสู่โรงงานอุตสาหกรรม' },
  { val: '±0.1mm', label: 'ความแม่นยำสูงมาตรฐานญี่ปุ่น' },
  { val: '100%', label: 'รับประกันศูนย์ไทยและ On-site Service' }
]

const buildComputed = () => {
  const dynamicCores = [1, 2, 3, 4]
    .map((i, idx) => {
      const title = s.value[`about_core_${i}_title`] || ''
      const desc = s.value[`about_core_${i}_desc`] || ''
      const imgUrl = s.value[`about_core_${i}_img`] || ''
      const defaultItem = defaultCoreValues[idx] || {}
      
      if (!title) return null
      return {
        title,
        desc,
        img: imgUrl,
        icon: defaultItem.icon || 'shield',
        tag: defaultItem.tag || 'CORE VALUE'
      }
    })
    .filter(Boolean)

  coreValues.value = dynamicCores.length > 0 ? dynamicCores : defaultCoreValues

  const dynamicStats = [1, 2, 3, 4]
    .map(i => ({
      val: s.value[`about_stat_${i}_val`] || '',
      label: s.value[`about_stat_${i}_label`] || ''
    }))
    .filter(st => st.val || st.label)

  stats.value = dynamicStats.length > 0 ? dynamicStats : defaultStats

  if (s.value.about_content_rich && !isEmptyHtml(s.value.about_content_rich)) {
    showRichContent.value = true
    displayRichContent.value = s.value.about_content_rich
  } else {
    showRichContent.value = false
    displayRichContent.value = ''
  }
}

const setupObserver = () => {
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        visibleSections.value.add(entry.target.dataset.section)
      }
    })
  }, { threshold: 0.1, rootMargin: "0px 0px -100px 0px" })
  
  document.querySelectorAll('[data-section]').forEach(el => observer.observe(el))
}

const loadSettings = async () => {
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      Object.keys(s.value).forEach(key => {
        if (data.data[key] !== undefined && data.data[key] !== null) {
          s.value[key] = data.data[key]
        }
      })
      buildComputed()
    } else {
      buildComputed()
    }
  } catch (e) {
    console.error('Failed to load about settings:', e)
    buildComputed()
  } finally {
    loading.value = false
    setTimeout(setupObserver, 100)
  }
}

onMounted(() => {
  setMeta({
    title: 'เกี่ยวกับเรา (About Us) - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    description: 'ทำความรู้จัก บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ผู้เชี่ยวชาญด้านการจำหน่ายและติดตั้งโรงเก็บของสำเร็จรูปพรีเมียม และอุปกรณ์มาตรฐานอุตสาหกรรม ด้วยประสบการณ์กว่า 20 ปี',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "เกี่ยวกับเรา - บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด",
    "description": "ประวัติความเป็นมา วิสัยทัศน์ พันธกิจ และมาตรฐานการให้บริการของ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด",
    "mainEntity": {
      "@type": "Organization",
      "name": "บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "75/110 หมู่ 11 ตำบลคลองหนึ่ง",
        "addressLocality": "อำเภอคลองหลวง",
        "addressRegion": "จังหวัดปทุมธานี",
        "postalCode": "12120",
        "addressCountry": "TH"
      }
    }
  }, 'dynamic-about-data')

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "เกี่ยวกับเรา", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')

  loadSettings()
})

const heroBg = computed(() => {
  return s.value.about_hero_bg || settingsStore.aboutHeroBg || '/images/hero/about-hero.jpg'
})

onUnmounted(() => { 
  if (observer) observer.disconnect() 
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
            <span class="text-emerald-400 font-semibold">เกี่ยวกับเรา</span>
          </nav>

          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div class="max-w-3xl">
              <!-- Eyebrow Pill -->
              <div class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span class="text-emerald-400 text-[11px] font-bold tracking-[0.2em] uppercase">
                  {{ s.about_hero_subtitle || 'ABOUT CR DISTRIBUTION' }}
                </span>
              </div>
              
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight whitespace-pre-line" v-html="s.about_hero_title || `ประวัติความเป็นมาของ <br/><span class='text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400'>${settingsStore.storeName || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด'}</span>`">
              </h1>
              
              <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
                {{ s.about_hero_desc || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด เป็นผู้นำในการนำเข้าและตัวแทนจำหน่ายสินค้าสำเร็จรูปพรีเมียมและอุปกรณ์จัดเก็บมาตรฐานอุตสาหกรรม ด้วยประสบการณ์และความเชี่ยวชาญกว่า 20 ปี เรามุ่งมั่นสรรหาสินค้าคุณภาพสูงสุดเพื่อตอบโจทย์ทุกความต้องการของลูกค้าอย่างยั่งยืน' }}
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 shrink-0">
              <router-link 
                to="/contact" 
                class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
                <span>ติดต่อเรา</span>
              </router-link>

              <router-link 
                to="/products" 
                class="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/15 backdrop-blur-sm transition-all duration-200 active:scale-95"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7"/>
                </svg>
                <span>ดูสินค้าทั้งหมด</span>
              </router-link>
            </div>
          </div>
        </div>
      </header>

      <!-- =========================================================================
           STATS BAR (Enterprise Highlights)
           ========================================================================= -->
      <section data-section="stats" class="relative -mt-8 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/[0.06]">
            <div v-for="(stat, i) in stats" :key="i" class="text-center pt-4 sm:pt-0 first:pt-0 px-2 sm:px-4">
              <p class="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400 font-mono tracking-tight mb-1">
                {{ stat.val }}
              </p>
              <p class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {{ stat.label }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- =========================================================================
           COMPANY STORY & OVERVIEW SECTION (Split Layout)
           ========================================================================= -->
      <section data-section="story" class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          <!-- Left: Main Visual / Facility Image -->
          <div class="lg:col-span-5">
            <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-white/[0.08] bg-slate-900 group">
              <img 
                v-if="s.about_main_img" 
                :src="getImageUrl(s.about_main_img)" 
                class="w-full h-[380px] sm:h-[460px] object-cover transition-transform duration-700 group-hover:scale-105" 
                alt="CR Distribution Headquarters" 
              />
              <div v-else class="w-full h-[380px] sm:h-[460px] bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center p-8 text-center">
                <div>
                  <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <h4 class="text-white font-bold text-base mb-1">บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด</h4>
                  <p class="text-xs text-slate-400">สำนักงานใหญ่และคลังสินค้า อำเภอคลองหลวง จังหวัดปทุมธานี</p>
                </div>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              
              <!-- Bottom Badge -->
              <div class="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold leading-tight">นำเข้าและจัดจำหน่ายมาตรฐานสากล</p>
                  <p class="text-[11px] text-slate-300 font-light">มีสถานที่จริง พร้อมทีมงานวิศวกรดูแล</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Text & Key Highlights -->
          <div class="lg:col-span-7 space-y-6">
            <div>
              <div class="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>COMPANY BACKGROUND</span>
              </div>
              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight whitespace-pre-line">
                {{ s.about_story_title || 'มุ่งมั่นส่งมอบโซลูชั่นที่ดีที่สุด เพื่อความคุ้มค่าและความแม่นยำสูงสุด' }}
              </h2>
            </div>

            <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-light whitespace-pre-line" v-html="s.about_story_p1 || '<strong>บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด</strong> ดำเนินธุรกิจด้วยความมุ่งมั่นในการเป็นผู้นำด้านการจัดจำหน่ายและให้บริการเครื่องตัดปอกสายไฟอัตโนมัติ เครื่องย้ำคอร์เนคเตอร์ และอุปกรณ์ Wire Harness Processing คุณภาพสูงมาตรฐานญี่ปุ่น แบรนด์ KODERA โดยให้ความสำคัญสูงสุดกับความแม่นยำ ประสิทธิภาพ และความคุ้มค่าในการผลิตของลูกค้า'"></p>

            <p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-light whitespace-pre-line" v-html="s.about_story_p2 || 'ด้วยประสบการณ์และความเชี่ยวชาญในอุตสาหกรรมสายไฟกว่า 20 ปี เรามีทีมวิศวกรและช่างผู้ชำนาญพร้อมให้คำปรึกษา ทดสอบตัดปอกชิ้นงานตัวอย่าง สาธิตการทำงานจริง ไปจนถึงบริการติดตั้ง ฝึกอบรมการใช้งาน และการดูแลซ่อมบำรุงหลังการขายอย่างครบวงจร'"></p>

            <!-- Feature Checkpoints -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/60 dark:border-white/[0.04]">
                <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {{ s.about_story_check_1 || 'ตัวแทนจำหน่ายมาตรฐาน KODERA Japan แท้ 100%' }}
                </span>
              </div>

              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/60 dark:border-white/[0.04]">
                <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {{ s.about_story_check_2 || 'มีศูนย์บริการและคลังเครื่องจักร/อะไหล่ในไทย' }}
                </span>
              </div>

              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/60 dark:border-white/[0.04]">
                <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {{ s.about_story_check_3 || 'ทีมวิศวกรผู้เชี่ยวชาญ On-site Service ทั่วประเทศ' }}
                </span>
              </div>

              <div class="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-[#10141D] border border-slate-200/60 dark:border-white/[0.04]">
                <svg class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {{ s.about_story_check_4 || 'รับประกันตัวเครื่อง 1 ปีเต็ม พร้อมบริการตรวจเช็ก' }}
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- =========================================================================
           CORE VALUES & STRENGTHS SECTION
           ========================================================================= -->
      <section data-section="core" class="py-16 md:py-20 bg-slate-100/60 dark:bg-[#0B0F19] border-t border-b border-slate-200/60 dark:border-white/[0.04]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div class="text-center max-w-2xl mx-auto mb-14">
            <div class="inline-flex items-center gap-2 mb-3.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              <span>OUR CORE VALUES</span>
            </div>
            
            <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              หัวใจสำคัญในการส่งมอบคุณค่าแก่ลูกค้า
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-light">
              หลักการทำงานและความมุ่งมั่นที่เรายึดถือในทุกขั้นตอน เพื่อให้ลูกค้าได้รับความพึงพอใจสูงสุด
            </p>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              v-for="(val, index) in coreValues" 
              :key="index"
              @click="openModal(val)"
              class="group bg-white dark:bg-[#10141D] border border-slate-200/80 dark:border-white/[0.06] rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-900/5 dark:shadow-black/20 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <!-- Icon Box -->
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                  <svg v-if="val.icon === 'shield'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <svg v-else-if="val.icon === 'solution'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                  <svg v-else-if="val.icon === 'wrench'" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <svg v-else class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>

                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 mb-2 inline-block">
                  {{ val.tag }}
                </span>

                <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ val.title }}
                </h3>

                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light line-clamp-4">
                  {{ val.desc }}
                </p>
              </div>

              <div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>อ่านรายละเอียด</span>
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- =========================================================================
           VISION & MISSION (Two-Column Feature Card)
           ========================================================================= -->
      <section data-section="vision" class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Vision Card -->
          <div class="bg-white dark:bg-[#10141D] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20 relative overflow-hidden">
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </div>

            <span class="text-[11px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">OUR VISION</span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">
              {{ s.about_vision_title || 'วิสัยทัศน์ของเรา' }}
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              {{ s.about_vision_desc || 'มุ่งมั่นสู่การเป็นผู้นำอันดับหนึ่งในการนำเข้า จัดจำหน่าย และให้บริการโซลูชั่นจัดเก็บสินค้าและโรงเก็บของสำเร็จรูปมาตรฐานสากล ที่ได้รับความไว้วางใจสูงสุดจากลูกค้าทั้งภาคครัวเรือนและภาคธุรกิจอุตสาหกรรมทั่วประเทศไทย' }}
            </p>
          </div>

          <!-- Mission Card -->
          <div class="bg-white dark:bg-[#10141D] rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20 relative overflow-hidden">
            <div class="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-6">
              <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>

            <span class="text-[11px] font-bold text-teal-500 uppercase tracking-widest block mb-1">OUR MISSION</span>
            <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-4">
              {{ s.about_mission_title || 'พันธกิจของเรา' }}
            </h3>
            
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              {{ s.about_mission_desc || 'คัดสรรและส่งมอบผลิตภัณฑ์ที่มีคุณภาพสูงสุด พัฒนาการบริการคำปรึกษาและติดตั้งให้มีประสิทธิภาพ รวดเร็ว ตรงเวลา พร้อมดูแลและรับประกันหลังการขายด้วยความซื่อสัตย์ จริงใจ เพื่อสร้างความคุ้มค่าและความพึงพอใจสูงสุดให้แก่ลูกค้าทุกท่าน' }}
            </p>
          </div>

        </div>
      </section>

      <!-- =========================================================================
           RICH CONTENT (Optional Admin Extended Details)
           ========================================================================= -->
      <section v-if="showRichContent" class="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ข้อมูลรายละเอียดเพิ่มเติม</h2>
          <div class="mt-2.5 w-12 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>
        <div class="bg-white dark:bg-[#10141D] rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-white/[0.06] shadow-xl prose prose-emerald dark:prose-invert max-w-none text-sm leading-relaxed" v-html="displayRichContent"></div>
      </section>

      <!-- =========================================================================
           CTA BANNER (Start Your Project)
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
                <span>GET IN TOUCH WITH US</span>
              </div>

              <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-3">
                {{ s.about_cta_title || 'พร้อมรับคำปรึกษาและใบเสนอราคาด่วนแล้วหรือยัง?' }}
              </h2>
              <p class="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                {{ s.about_cta_desc || 'ทีมวิศวกรและฝ่ายบริการลูกค้าพร้อมให้คำแนะนำ ประเมินขนาดพื้นที่ และนำเสนอโซลูชั่นที่คุ้มค่าที่สุดสำหรับคุณ' }}
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
                <span>ติดต่อผ่าน LINE</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      <!-- =========================================================================
           CORE VALUE MODAL (Detailed Pop-up View)
           ========================================================================= -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="opacity-0" 
        enter-to-class="opacity-100" 
        leave-active-class="transition duration-200 ease-in" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
      >
        <div v-if="isModalOpen && selectedCoreValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer" @click="closeModal"></div>
          
          <div class="relative bg-white dark:bg-[#111622] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/[0.08]" @click.stop>
            <button @click="closeModal" class="absolute top-4 right-4 w-9 h-9 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 transition-colors">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            
            <div class="p-6 sm:p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-white/[0.06]">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-slate-900 dark:text-white">{{ selectedCoreValue.title }}</h3>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-1">{{ selectedCoreValue.tag }}</p>
            </div>
            
            <div class="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm font-light">
                {{ selectedCoreValue.desc }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
