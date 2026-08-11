<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getImageUrl } from '../utils/image'
import { useSettingsStore } from '../stores/settingsStore'
import { useSEO } from '../composables/useSEO'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()
const loading = ref(true)
const visibleSections = ref(new Set())
let observer = null

const s = ref({
  about_hero_title: '', about_hero_subtitle: '', about_hero_desc: '', about_hero_bg: '',
  about_main_img: '', about_quote_title: '', about_quote_text: '',
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
  }, 300) // wait for animation
  document.body.style.overflow = 'auto'
}

const isRichContentSet = ref(false)
const showRichContent = ref(true)
const displayRichContent = ref('')

const isEmptyHtml = (html) => {
  if (!html) return true
  const clean = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim()
  return clean === ''
}

const coreIcons = [
  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  'M13 10V3L4 14h7v7l9-11h-7z',
  'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
]

const buildComputed = () => {
  coreValues.value = [1, 2, 3, 4]
    .map(i => {
      const title = s.value[`about_core_${i}_title`] || ''
      const desc = s.value[`about_core_${i}_desc`] || ''
      const imgUrl = s.value[`about_core_${i}_img`] || ''
      
      return {
        title,
        desc,
        img: imgUrl,
        icon: coreIcons[i - 1]
      }
    })
    .filter(v => v.title)

  stats.value = [1, 2, 3, 4]
    .map(i => ({
      val: s.value[`about_stat_${i}_val`] || '',
      label: s.value[`about_stat_${i}_label`] || ''
    }))
    .filter(st => st.val || st.label)

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
      isRichContentSet.value = 'about_content_rich' in data.data
      Object.keys(s.value).forEach(key => {
        if (data.data[key] !== undefined && data.data[key] !== null) {
          s.value[key] = data.data[key]
        }
      })
      buildComputed()
    }
  } catch (e) {
    console.error('Failed to load about settings:', e)
  } finally {
    loading.value = false
    setTimeout(setupObserver, 100)
  }
}

onMounted(() => {
  setMeta({
    title: 'เกี่ยวกับเรา (About Us)',
    description: 'ทำความรู้จัก Morespace ผู้เชี่ยวชาญด้านการออกแบบ จำหน่าย และติดตั้งบ้านเก็บของสำเร็จรูประดับพรีเมียม',
    canonicalUrl: window.location.href,
    type: 'website'
  })

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
onUnmounted(() => { 
  if (observer) observer.disconnect() 
})
</script>

<template>
  <div class="about-page min-h-screen pb-20 transition-colors duration-500 overflow-x-hidden">

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
       <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
    </div>

    <div v-else>
      <!-- ══════════════════════════════════════════════
           COMPACT HEADER SECTION
      ══════════════════════════════════════════════ -->
      <header class="relative overflow-hidden pt-28 pb-14 bg-[#080b10] border-b border-white/[0.03]">
        <!-- Background mesh and radial gradient -->
        <div class="absolute inset-0 opacity-[0.03] pointer-events-none"
          style="background-image: radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px); background-size: 30px 30px;">
        </div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#080b10] via-[#090e15]/85 to-[#080b10] pointer-events-none"></div>
        
        <!-- Subtle glowing blobs for aesthetic warmth -->
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div class="text-center md:text-left">
              <!-- Eyebrow Pill -->
              <div v-if="s.about_hero_subtitle" class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">{{ s.about_hero_subtitle }}</span>
              </div>
              
              <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight" v-html="s.about_hero_title || 'ผู้เชี่ยวชาญด้านโรงเก็บของพรีเมียม'"></h1>
              <p class="mt-3 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed whitespace-pre-line">
                {{ s.about_hero_desc || 'เราคือผู้นำในการรังสรรค์และติดตั้งโรงเก็บของพรีเมียมคุณภาพสูง ที่ไม่เพียงแต่ตอบสนองความต้องการด้านการจัดเก็บ แต่ยังยกระดับความสวยงามและเพิ่มมูลค่าให้กับพื้นที่ของคุณ' }}
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center justify-center md:justify-end gap-3 flex-shrink-0 self-center md:self-auto">
              <router-link to="/contact" class="group inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-xs">
                ติดต่อเรา
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
              <router-link to="/services" class="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-3.5 px-6 rounded-xl border border-white/15 transition-all active:scale-95 text-xs">
                ดูบริการ
              </router-link>
            </div>
          </div>
        </div>
      </header>

      <!-- ══════════════════════════════════════════════
           STATS BAR
      ══════════════════════════════════════════════ -->
      <section v-if="stats.length" data-section="stats" class="relative -mt-6 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#111622] rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/[0.04] p-5 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div v-for="(stat, i) in stats" :key="i" class="text-center border-r border-slate-100 dark:border-white/[0.03] last:border-r-0">
            <p class="text-2xl md:text-3xl font-black text-emerald-500 dark:text-emerald-400 mb-0.5 tabular-nums">{{ stat.val }}</p>
            <p class="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase whitespace-pre-line px-2">{{ stat.label }}</p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           CORE VALUES
      ══════════════════════════════════════════════ -->
      <section v-if="coreValues.length" class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">Why Choose Us</span>
          <h2 class="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">
            หัวใจสำคัญในการสร้างสรรค์ผลงาน
          </h2>
          <div class="mt-3 w-12 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <div v-for="(val, index) in coreValues" :key="index"
               @click="openModal(val)"
               class="group bg-white dark:bg-[#111622] border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 shadow-md hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between h-full">
            <div>
              <!-- Icon Frame -->
              <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mb-5 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="val.icon"></path>
                </svg>
              </div>

              <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-3 group-hover:text-emerald-500 transition-colors duration-300">
                {{ val.title }}
              </h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {{ val.desc }}
              </p>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.03] flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-500 group-hover:text-emerald-400 transition-colors">อ่านรายละเอียดเพิ่มเติม</span>
              <svg class="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           QUOTE & MAIN VISUAL (Split Layout)
      ══════════════════════════════════════════════ -->
      <section data-section="quote" class="py-16 md:py-24 bg-slate-50 dark:bg-[#0a0f16] border-t border-b border-slate-200/40 dark:border-white/[0.03]">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col lg:flex-row gap-12 items-center">
            
            <!-- Left Side: Main Visual Image -->
            <div v-if="s.about_main_img" class="w-full lg:w-5/12">
              <div class="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-[6px] border-white dark:border-[#111622]">
                <img :src="getImageUrl(s.about_main_img)" class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-1000" alt="Main Visual" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>

            <!-- Right Side: Quote Card -->
            <div class="w-full" :class="s.about_main_img ? 'lg:w-7/12' : 'max-w-3xl mx-auto text-center'">
              <div class="relative p-6 sm:p-10">
                <!-- Giant Quote Icon Watermark -->
                <svg class="absolute top-0 left-0 w-32 h-32 text-emerald-500/5 dark:text-emerald-500/5 rotate-180 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>

                <div class="relative z-10">
                  <span class="text-xs font-bold text-emerald-500 tracking-widest uppercase block mb-3">
                    {{ s.about_quote_title || 'แรงบันดาลใจที่ส่งต่อสู่พันธกิจ' }}
                  </span>
                  <h3 class="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-snug italic whitespace-pre-line">
                    "{{ s.about_quote_text || 'ด้วยความเข้าใจอย่างลึกซึ้งในความต้องการของลูกค้าและประสบการณ์อันยาวนาน เรามุ่งมั่นที่จะนำเสนอโซลูชั่นที่เหนือกว่าในทุกด้าน' }}"
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           VISION & MISSION
      ══════════════════════════════════════════════ -->
      <section data-section="vision" class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#111622] border border-slate-200/50 dark:border-white/5 rounded-3xl overflow-hidden shadow-md">
          <div class="flex flex-col lg:flex-row">
            
            <!-- Left: Visual Image Frame -->
            <div class="w-full lg:w-5/12 relative min-h-[300px] lg:min-h-full">
              <img v-if="s.about_vision_img" :src="getImageUrl(s.about_vision_img)" class="absolute inset-0 w-full h-full object-cover" @error="$event.target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'" />
              <img v-else src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-white dark:lg:to-[#111622]"></div>
            </div>

            <!-- Right: Content -->
            <div class="w-full lg:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center gap-10">
              <!-- Vision -->
              <div v-if="s.about_vision_title || s.about_vision_desc" class="flex gap-5 items-start">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">{{ s.about_vision_title || 'วิสัยทัศน์ของเรา' }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{{ s.about_vision_desc }}</p>
                </div>
              </div>

              <!-- Mission -->
              <div v-if="s.about_mission_title || s.about_mission_desc" class="flex gap-5 items-start">
                <div class="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">{{ s.about_mission_title || 'พันธกิจของเรา' }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">{{ s.about_mission_desc }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           RICH CONTENT SECTION
      ══════════════════════════════════════════════ -->
      <section v-if="showRichContent" class="py-16 max-w-4xl mx-auto px-4">
        <div class="mb-10 text-center">
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">รายละเอียดเพิ่มเติม</h2>
          <div class="mt-3 w-16 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>
        <div class="bg-white dark:bg-[#111622] rounded-3xl p-8 md:p-12 border border-slate-200/50 dark:border-white/[0.04] shadow-sm about-rich-content prose prose-emerald prose-lg dark:prose-invert max-w-none" v-html="displayRichContent"></div>
      </section>

      <!-- ══════════════════════════════════════════════
           CTA BANNER
      ══════════════════════════════════════════════ -->
      <section data-section="cta" class="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div class="max-w-7xl mx-auto cta-card relative rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-14 border border-emerald-500/10">
          <!-- Glowing blobs -->
          <div class="absolute -top-12 -right-12 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-12 -left-12 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <!-- Grid lines overlay -->
          <div class="absolute inset-0 opacity-[0.05] pointer-events-none"
            style="background-image: linear-gradient(rgba(240,113,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(240,113,0,0.12) 1px, transparent 1px); background-size: 48px 48px;">
          </div>
          
          <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div class="max-w-2xl text-center lg:text-left">
              <!-- Eyebrow Pill -->
              <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">เริ่มต้นสร้างพื้นที่ในฝัน</span>
              </div>

              <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                {{ s.about_cta_title || 'พร้อมที่จะเริ่มต้นโครงการของคุณหรือยัง?' }}
              </h2>
              <p class="text-slate-400 text-sm md:text-base leading-relaxed">
                {{ s.about_cta_desc || 'ติดต่อเราวันนี้เพื่อรับคำปรึกษาและใบเสนอราคาฟรี ทีมงานผู้เชี่ยวชาญของเราพร้อมที่จะเนรมิตพื้นที่ในฝันของคุณให้เป็นจริง' }}
              </p>
            </div>

            <div class="flex flex-col sm:flex-row justify-center lg:justify-end gap-3 flex-shrink-0">
              <router-link to="/quotation" class="cta-primary-btn group inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl font-bold text-xs active:scale-95 text-white">
                ประเมินราคาฟรี
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
              
              <a v-if="settingsStore.contactLines.length > 0"
                 :href="settingsStore.contactLines[0].url || ('https://line.me/ti/p/~' + (settingsStore.contactLines[0].value || '').replace(/^@/, ''))"
                 target="_blank"
                 class="inline-flex items-center justify-center gap-2 bg-[#00B900] hover:bg-[#009900] text-white font-bold py-3.5 px-7 rounded-xl shadow-lg transition-all active:scale-95 text-xs">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/></svg>
                ติดต่อผ่าน LINE
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Core Value Modal -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="opacity-0" 
        enter-to-class="opacity-100" 
        leave-active-class="transition duration-200 ease-in" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0">
        <div v-if="isModalOpen && selectedCoreValue" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer" @click="closeModal"></div>
          
          <div class="relative bg-white dark:bg-[#111622] rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200/50 dark:border-white/5" @click.stop>
            <button @click="closeModal" class="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div class="h-48 relative">
              <img v-if="selectedCoreValue.img" :src="getImageUrl(selectedCoreValue.img)" :alt="selectedCoreValue.title" class="w-full h-full object-cover" @error="$event.target.src = selectedCoreValue.fallbackImg" />
              <div v-else class="w-full h-full bg-slate-200 dark:bg-slate-800"></div>
              
              <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
              
              <div class="absolute bottom-5 left-6 right-6 flex items-center gap-3 z-10">
                 <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="selectedCoreValue.icon"></path></svg>
                  </div>
                  <h3 class="text-xl font-bold text-white drop-shadow-md">{{ selectedCoreValue.title }}</h3>
              </div>
            </div>
            
            <div class="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#111622]">
              <p class="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                {{ selectedCoreValue.desc }}
              </p>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
/* ─── Page Base styling ─── */
.about-page {
  background-color: #0c0e14;
  color: #f8fafc;
}

/* ─── Scrollbar Hide / Custom ─── */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #334155;
}

/* ─── CTA Card Custom Styling ─── */
.cta-card {
  background: linear-gradient(135deg, rgba(77, 21, 0, 0.2) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%);
  border-color: rgba(240, 113, 0, 0.15);
}

.cta-primary-btn {
  background-color: #f07100;
  box-shadow: 0 8px 24px -4px rgba(240, 113, 0, 0.35);
  transition: all 0.3s ease;
}
.cta-primary-btn:hover {
  background-color: #ff8a24;
  box-shadow: 0 12px 28px -4px rgba(240, 113, 0, 0.45);
}

/* ─── Rich Content Styles ─── */
.about-rich-content :deep(h2), .about-rich-content :deep(h3), .about-rich-content :deep(h4) { color: #f07100; font-weight: 800; margin-top: 2rem; margin-bottom: 0.75rem; }
.about-rich-content :deep(p) { color: #cbd5e1; line-height: 1.9; margin-bottom: 1rem; }
.about-rich-content :deep(strong) { color: #ff8a24; }
.about-rich-content :deep(ul), .about-rich-content :deep(ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
.about-rich-content :deep(li) { margin-bottom: 0.5rem; line-height: 1.8; color: #cbd5e1; }
.about-rich-content :deep(li::marker) { color: #f07100; }
.about-rich-content :deep(a) { color: #ff8a24; text-decoration: underline; }
.about-rich-content :deep(table) { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; border-radius: 16px; overflow: hidden; border: 1px solid rgba(240, 113, 0, 0.15) !important; margin: 2rem auto; }
.about-rich-content :deep(table thead) { background: linear-gradient(135deg, #d95f00, #f07100); }
.about-rich-content :deep(table thead th) { color: white; font-weight: 700; padding: 14px 20px; }
.about-rich-content :deep(table tbody tr:nth-child(even)) { background-color: #4d150015; }
.about-rich-content :deep(table tbody tr:hover) { background-color: #4d150025; }
.about-rich-content :deep(table tbody td) { padding: 12px 20px; border-bottom: 1px solid rgba(240, 113, 0, 0.05); color: #cbd5e1; }
.about-rich-content :deep(figure.table) { display: flex; justify-content: center; margin: 2rem auto; width: 100%; }
</style>

<style>
/* ══════════════════════════════════════════════
   LIGHT MODE OVERRIDES
   ══════════════════════════════════════════════ */

html:not(.dark) .about-page {
  background-color: #faf9f6;
  color: #1e293b;
}

html:not(.dark) .about-page .bg-white {
  background-color: #ffffff;
}

html:not(.dark) .about-page .prose {
  color: #334155;
}

/* Rich Content light mode */
html:not(.dark) .about-rich-content :deep(h2), 
html:not(.dark) .about-rich-content :deep(h3), 
html:not(.dark) .about-rich-content :deep(h4) { color: #d95f00; }
html:not(.dark) .about-rich-content :deep(p) { color: #475569; }
html:not(.dark) .about-rich-content :deep(strong) { color: #c14c00; }
html:not(.dark) .about-rich-content :deep(li) { color: #475569; }
html:not(.dark) .about-rich-content :deep(li::marker) { color: #d95f00; }
html:not(.dark) .about-rich-content :deep(a) { color: #d95f00; }
html:not(.dark) .about-rich-content :deep(table) { border-color: rgba(240, 113, 0, 0.15) !important; }
html:not(.dark) .about-rich-content :deep(table tbody tr:nth-child(even)) { background-color: #fff5eb; }
html:not(.dark) .about-rich-content :deep(table tbody tr:hover) { background-color: #ffdcb840; }
html:not(.dark) .about-rich-content :deep(table tbody td) { border-bottom-color: rgba(240, 113, 0, 0.05); color: #475569; }

/* CTA Card Light Mode */
html:not(.dark) .about-page .cta-card {
  background: linear-gradient(135deg, rgba(255, 245, 235, 0.8) 0%, #ffffff 50%, #ffffff 100%);
  border-color: rgba(240, 113, 0, 0.15);
  box-shadow: 0 10px 40px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .about-page .cta-card h2 {
  color: #0f172a;
}

html:not(.dark) .about-page .cta-card p {
  color: #475569;
}
</style>
