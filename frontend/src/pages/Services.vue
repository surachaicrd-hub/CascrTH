<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()
const loading = ref(true)
const visibleSections = ref(new Set())

// Steps interactive state
const activeStep = ref(0)
const activeStepMobile = ref(0)
const slider = ref(null)

const serviceImages = [
  '/images/services/inspection.webp',
  '/images/services/3d-design.webp',
  '/images/services/prefab.webp',
  '/images/services/installation.webp',
  '/images/services/warranty.webp',
  '/images/services/support.webp'
]

const settings = ref({
   services_hero_title: 'บริการออกแบบและติดตั้ง <br/> แบบครบวงจร',
   services_hero_subtitle: 'บริการระดับมาตรฐานสากลจาก CR Distribution',
   services_hero_desc: 'เราพร้อมส่งมอบประสบการณ์ที่ดีเยี่ยม ตั้งแต่การให้คำปรึกษา การสั่งซื้อ การจัดส่ง จนถึงการติดตั้งด้วยทีมงานมืออาชีพ',
   services_items: [
      { title: "ประเมินพื้นที่ด้วยวิศวกร", desc: "ทีมงานผู้เชี่ยวชาญลงตรวจสอบหน้างานจริงเพื่อวิเคราะห์ทิศทางลม ฐานราก และสภาพแวดล้อมโดยละเอียด ถอดแบบแม่นยำ 100%", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
      { title: "ออกแบบโครงสร้าง 3D", desc: "คุณจะเห็นภาพเสมือนจริงของบ้านก่อนสร้างจริง สามารถปรับเปลี่ยนสีและวัสดุได้ตามความต้องการ", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
      { title: "ผลิตแบบสำเร็จรูปพรีแฟบ", desc: "ชิ้นส่วนถูกตัดแต่งและทำสีฝุ่นบริเวณโรงงานควบคุมคุณภาพ ก่อนส่งประกอบหน้างาน", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
      { title: "ติดตั้งเสร็จสิ้นภายใน 48 ชม.", desc: "ประกอบขึ้นรูปด้วยระบบน็อคดาวน์ นวัตกรรมจากยุโรป ไร้เสียงรบกวน จบงานไวทันใจ", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
      { title: "รับประกันโครงสร้างสูง 10 ปี", desc: "คุณภาพแห่งความเชื่อมั่น เรารับประกันความแข็งแรงของเหล็กกัลวาไนซ์ โครงสร้าง และสีไม่ลอกไม่เป็นสนิม", icon: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" },
      { title: "ศูนย์ดูแลหลังการขาย 24 ชั่วโมง", desc: "พร้อมดูแลเมื่อคุณต้องการต่อเติม ขยับขยายพื้นที่ หรือให้เราช่วยส่งทีมงานเข้าบำรุงรักษา", icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" }
   ],
   services_cta_title: 'เริ่มต้นเนรมิตพื้นที่ของคุณวันนี้',
   services_cta_desc: 'ติดต่อทีมงานเพื่อรับคำปรึกษาฟรี เรายินดีให้บริการและมอบสิ่งที่ดีที่สุดให้แก่คุณเสมอ',
   services_content_rich: '',
   services_hero_bg: ''
 })

const stats = [
  { number: '2,500+', label: 'โปรเจคที่ติดตั้งสำเร็จ' },
  { number: '10 ปี', label: 'รับประกันโครงสร้าง' },
  { number: '48 ชม.', label: 'ติดตั้งเสร็จสิ้น' },
  { number: '98%', label: 'ลูกค้าพึงพอใจ' }
]

let observer = null

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
  const gap = 16 // gap-4 is 16px
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
      if (data.data.services_hero_title) settings.value.services_hero_title = data.data.services_hero_title
      if (data.data.services_hero_subtitle) settings.value.services_hero_subtitle = data.data.services_hero_subtitle
      if (data.data.services_hero_desc) settings.value.services_hero_desc = data.data.services_hero_desc
      if (data.data.services_items) {
         try { settings.value.services_items = JSON.parse(data.data.services_items) } catch(e) {}
      }
      if (data.data.services_cta_title) settings.value.services_cta_title = data.data.services_cta_title
      if (data.data.services_cta_desc) settings.value.services_cta_desc = data.data.services_cta_desc
      if (data.data.services_content_rich) settings.value.services_content_rich = data.data.services_content_rich
      if (data.data.services_hero_bg) settings.value.services_hero_bg = data.data.services_hero_bg
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
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

onMounted(() => loadSettings())
onUnmounted(() => {
  if (observer) observer.disconnect()
  if (slider.value) {
    slider.value.removeEventListener('scroll', onScroll)
  }
})
</script>

<template>
  <div class="services-page min-h-screen pb-20 transition-colors duration-500">
    
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
              <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">SERVICES & PROCESS</span>
              </div>
              
              <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight" v-html="settings.services_hero_title"></h1>
              <p class="mt-3 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                {{ settings.services_hero_desc }}
              </p>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex flex-wrap items-center justify-center md:justify-end gap-3 flex-shrink-0 self-center md:self-auto">
              <router-link to="/quotation" class="group inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-xs">
                ขอใบเสนอราคาฟรี
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
              <router-link to="/space-calculator" class="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-3.5 px-6 rounded-xl border border-white/15 transition-all active:scale-95 text-xs">
                คำนวณพื้นที่
              </router-link>
            </div>
          </div>
        </div>
      </header>

      <!-- ══════════════════════════════════════════════
           STATS BAR
      ══════════════════════════════════════════════ -->
      <section data-section="stats" class="relative -mt-6 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white dark:bg-[#111622] rounded-2xl shadow-xl border border-slate-200/50 dark:border-white/[0.04] p-5 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div v-for="(stat, i) in stats" :key="i" class="text-center border-r border-slate-100 dark:border-white/[0.03] last:border-r-0">
            <p class="text-2xl md:text-3xl font-black text-emerald-500 dark:text-emerald-400 mb-0.5 tabular-nums">{{ stat.number }}</p>
            <p class="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">{{ stat.label }}</p>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           6-STEP SERVICE PROCESS
      ══════════════════════════════════════════════ -->
      <section class="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <span class="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">ขั้นตอนการทำงาน</span>
          <h2 class="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mt-2 tracking-tight">
            กระบวนการ 6 ขั้นตอนสู่ความสมบูรณ์แบบ
          </h2>
          <div class="mt-3 w-12 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>

        <!-- Responsive layout for steps -->
        <!-- ─── DESKTOP VIEW (lg:flex, hidden on mobile/tablet) ─── -->
        <div class="hidden lg:flex gap-12 items-start mt-12">
          <!-- Sticky left column image showcase -->
          <div class="w-1/2 sticky top-28">
            <div class="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 border border-slate-200/50 dark:border-white/5 bg-slate-900">
              <div v-for="(feature, index) in settings.services_items" :key="index"
                   class="absolute inset-0 transition-all duration-700 ease-in-out"
                   :class="[ activeStep === index ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-105 pointer-events-none' ]">
                <img :src="feature.image || serviceImages[index] || serviceImages[0]" :alt="feature.title"
                     class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                
                <!-- Badge overlay -->
                <div class="absolute top-6 left-6 w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                  <span class="text-emerald-500 dark:text-emerald-400 font-black text-xl">{{ String(index + 1).padStart(2, '0') }}</span>
                </div>
                
                <!-- Info overlay -->
                <div class="absolute bottom-6 left-6 right-6">
                  <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">ขั้นตอนที่ {{ index + 1 }}</p>
                  <h4 class="text-lg font-bold text-white">{{ feature.title }}</h4>
                </div>
              </div>
            </div>
          </div>

          <!-- Right column timeline interactive cards -->
          <div class="w-1/2 space-y-4">
            <div v-for="(feature, index) in settings.services_items" :key="index"
                 @mouseenter="activeStep = index"
                 @click="activeStep = index"
                 :class="[
                   'p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-5 items-start',
                   activeStep === index
                     ? 'bg-white dark:bg-[#111622] border-emerald-500/30 shadow-lg shadow-emerald-500/[0.03] translate-x-2'
                     : 'bg-transparent border-transparent hover:border-slate-200 dark:hover:border-white/5 opacity-70 hover:opacity-100'
                 ]">
              <!-- Index Number and Icon -->
              <div class="flex-shrink-0">
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 border',
                  activeStep === index
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200/50 dark:border-white/5 text-slate-400'
                ]">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" :d="feature.icon"></path>
                  </svg>
                </div>
              </div>

              <!-- Content -->
              <div class="flex-grow">
                <h3 :class="[
                  'text-lg font-bold transition-colors duration-300',
                  activeStep === index ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                ]">{{ feature.title }}</h3>
                <p v-show="activeStep === index" class="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed transition-all duration-300">
                  {{ feature.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── MOBILE/TABLET VIEW (lg:hidden, horizontal snap-scroll) ─── -->
        <div class="block lg:hidden mt-8">
          <div class="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-4 pb-6 scrollbar-none" ref="slider">
            <div v-for="(feature, index) in settings.services_items" :key="index"
                 class="snap-center shrink-0 w-[85vw] sm:w-[420px] bg-white dark:bg-[#111622] rounded-3xl overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-md flex flex-col">
              <!-- Image top -->
              <div class="relative h-48 w-full">
                <img :src="feature.image || serviceImages[index] || serviceImages[0]" :alt="feature.title" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                <!-- Badge -->
                <div class="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center shadow-md">
                  <span class="text-emerald-500 dark:text-emerald-400 font-black text-sm">{{ String(index + 1).padStart(2, '0') }}</span>
                </div>
              </div>

              <!-- Body -->
              <div class="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="feature.icon"></path>
                      </svg>
                    </div>
                    <span class="text-xs font-bold text-emerald-500 tracking-wider">ขั้นตอนที่ {{ index + 1 }}</span>
                  </div>
                  <h3 class="text-base font-bold text-slate-800 dark:text-white mb-2">{{ feature.title }}</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ feature.desc }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Swipe Indicator dots -->
          <div class="flex justify-center gap-1.5 mt-4">
            <span v-for="(_, i) in settings.services_items" :key="i"
                  class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  :class="[ activeStepMobile === i ? 'w-4 bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700' ]"></span>
          </div>
        </div>
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
                <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">สนใจติดตั้ง?</span>
              </div>

              <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
                {{ settings.services_cta_title }}
              </h2>
              <p class="text-slate-400 text-sm md:text-base leading-relaxed">
                {{ settings.services_cta_desc }}
              </p>
            </div>

            <div class="flex flex-col sm:flex-row justify-center lg:justify-end gap-3 flex-shrink-0">
              <router-link to="/quotation" class="cta-primary-btn group inline-flex items-center justify-center gap-2 py-3.5 px-7 rounded-xl font-bold text-xs active:scale-95 text-white">
                ขอใบเสนอราคา
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </router-link>
              
              <a v-if="settingsStore.contactLines.length > 0"
                 :href="settingsStore.contactLines[0].url || ('https://line.me/ti/p/~' + (settingsStore.contactLines[0].value || '').replace(/^@/, ''))"
                 target="_blank"
                 class="inline-flex items-center justify-center gap-2 bg-[#00B900] hover:bg-[#009900] text-white font-bold py-3.5 px-7 rounded-xl shadow-lg transition-all active:scale-95 text-xs">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/></svg>
                แชทผ่าน LINE
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- ══════════════════════════════════════════════
           RICH CONTENT SECTION
      ══════════════════════════════════════════════ -->
      <section v-if="settings.services_content_rich" class="py-16 max-w-4xl mx-auto px-4">
        <div class="mb-10 text-center">
          <h2 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">รายละเอียดเพิ่มเติม</h2>
          <div class="mt-3 w-16 h-1 bg-emerald-500 rounded-full mx-auto"></div>
        </div>
        <div class="bg-white dark:bg-[#111622] rounded-3xl p-8 md:p-12 border border-slate-200/50 dark:border-white/[0.04] shadow-sm services-rich-content prose prose-emerald prose-lg dark:prose-invert max-w-none" v-html="settings.services_content_rich"></div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* ─── Page Base styling ─── */
.services-page {
  background-color: #0c0e14;
  color: #f8fafc;
}

/* ─── Scrollbar Hide ─── */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
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
.services-rich-content :deep(h2), .services-rich-content :deep(h3), .services-rich-content :deep(h4) { color: #f07100; font-weight: 800; margin-top: 2rem; margin-bottom: 0.75rem; }
.services-rich-content :deep(p) { color: #cbd5e1; line-height: 1.9; margin-bottom: 1rem; }
.services-rich-content :deep(strong) { color: #ff8a24; }
.services-rich-content :deep(ul), .services-rich-content :deep(ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
.services-rich-content :deep(li) { margin-bottom: 0.5rem; line-height: 1.8; color: #cbd5e1; }
.services-rich-content :deep(li::marker) { color: #f07100; }
.services-rich-content :deep(a) { color: #ff8a24; text-decoration: underline; }
.services-rich-content :deep(table) { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; border-radius: 16px; overflow: hidden; border: 1px solid rgba(240, 113, 0, 0.15) !important; margin: 2rem auto; }
.services-rich-content :deep(table thead) { background: linear-gradient(135deg, #d95f00, #f07100); }
.services-rich-content :deep(table thead th) { color: white; font-weight: 700; padding: 14px 20px; }
.services-rich-content :deep(table tbody tr:nth-child(even)) { background-color: #4d150015; }
.services-rich-content :deep(table tbody tr:hover) { background-color: #4d150025; }
.services-rich-content :deep(table tbody td) { padding: 12px 20px; border-bottom: 1px solid rgba(240, 113, 0, 0.05); color: #cbd5e1; }
.services-rich-content :deep(figure.table) { display: flex; justify-content: center; margin: 2rem auto; width: 100%; }
</style>

<style>
/* ══════════════════════════════════════════════
   LIGHT MODE OVERRIDES
   ══════════════════════════════════════════════ */

html:not(.dark) .services-page {
  background-color: #faf9f6;
  color: #1e293b;
}

/* Timeline Light Mode overrides */
html:not(.dark) .services-page .bg-white {
  background-color: #ffffff;
}

html:not(.dark) .services-page .prose {
  color: #334155;
}

/* Rich Content light mode */
html:not(.dark) .services-rich-content :deep(h2), 
html:not(.dark) .services-rich-content :deep(h3), 
html:not(.dark) .services-rich-content :deep(h4) { color: #d95f00; }
html:not(.dark) .services-rich-content :deep(p) { color: #475569; }
html:not(.dark) .services-rich-content :deep(strong) { color: #c14c00; }
html:not(.dark) .services-rich-content :deep(li) { color: #475569; }
html:not(.dark) .services-rich-content :deep(li::marker) { color: #d95f00; }
html:not(.dark) .services-rich-content :deep(a) { color: #d95f00; }
html:not(.dark) .services-rich-content :deep(table) { border-color: rgba(240, 113, 0, 0.15) !important; }
html:not(.dark) .services-rich-content :deep(table tbody tr:nth-child(even)) { background-color: #fff5eb; }
html:not(.dark) .services-rich-content :deep(table tbody tr:hover) { background-color: #ffdcb840; }
html:not(.dark) .services-rich-content :deep(table tbody td) { border-bottom-color: rgba(240, 113, 0, 0.05); color: #475569; }

/* CTA Card Light Mode */
html:not(.dark) .services-page .cta-card {
  background: linear-gradient(135deg, rgba(255, 245, 235, 0.8) 0%, #ffffff 50%, #ffffff 100%);
  border-color: rgba(240, 113, 0, 0.15);
  box-shadow: 0 10px 40px rgba(240, 113, 0, 0.03);
}

html:not(.dark) .services-page .cta-card h2 {
  color: #0f172a;
}

html:not(.dark) .services-page .cta-card p {
  color: #475569;
}
</style>
