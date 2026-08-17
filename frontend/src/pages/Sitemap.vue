<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSEO } from '../composables/useSEO'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

const searchQuery = ref('')

const siteSections = [
  {
    id: 'company',
    title: 'หน้าหลัก & เกี่ยวกับบริษัท',
    description: 'ข้อมูลองค์กร วิสัยทัศน์ และช่องทางการติดต่อ',
    icon: 'building',
    links: [
      { name: 'หน้าแรก (Home)', path: '/', desc: 'ภาพรวมเครื่องจักร KODERA และเทคโนโลยีการแปรรูปสายไฟ' },
      { name: 'เกี่ยวกับเรา (About Us)', path: '/about', desc: 'ประวัติบริษัท วิสัยทัศน์ และทีมงานวิศวกรผู้เชี่ยวชาญ' },
      { name: 'บริการและโซลูชัน (Services)', path: '/services', desc: 'บริการติดตั้ง อบรม และงานซ่อมบำรุงเชิงป้องกัน' },
      { name: 'ผลงานและโครงการ (Projects)', path: '/projects', desc: 'ตัวอย่างการติดตั้งและส่งมอบเครื่องจักรให้แก่ลูกค้าอุตสาหกรรม' },
      { name: 'ติดต่อเรา (Contact Us)', path: '/contact', desc: 'แผนที่ตั้ง เบอร์โทรศัพท์ อีเมล และช่องทางติดต่อด่วน' }
    ]
  },
  {
    id: 'products',
    title: 'เครื่องตัดปอกสายไฟ KODERA',
    description: 'รายการเครื่องจักรและอุปกรณ์แปรรูปสายไฟมาตรฐานญี่ปุ่น',
    icon: 'cube',
    links: [
      { name: 'เครื่องจักรทั้งหมด (All Machinery)', path: '/products', desc: 'แคตตาล็อกเครื่องตัดปอกสายไฟ KODERA ทุกรุ่น' },
      { name: 'KODERA C371G CASTING', path: '/products/kodera-c371g-casting-wire-stripping-machine', desc: 'รุ่นมาตรฐานยอดนิยม ตัด ปอก ปั่นเกลียวครบจบในเครื่องเดียว' },
      { name: 'KODERA C370G CASTING', path: '/products/kodera-c370g-wire-stripping-machine', desc: 'รุ่นขนาดกะทัดรัด ความแม่นยำสูง สำหรับสายไฟ AWG#10 ~ AWG#32' },
      { name: 'KODERA C300A CASTING', path: '/products/automatic-wire-stripper-c300a', desc: 'เครื่องตัดปอกขนาดเล็ก น้ำหนักเบา คล่องตัวสูง' },
      { name: 'KODERA C371AF CASTING', path: '/products/casting-c371ag-wire-stripping-machine', desc: 'รุ่นเฉพาะทางสำหรับสายแบน สายแพ และริบบิ้น' },
      { name: 'เปรียบเทียบสเปกเครื่องจักร (Compare)', path: '/compare', desc: 'ตารางเปรียบเทียบความเร็วและความสามารถของแต่ละรุ่น' }
    ]
  },
  {
    id: 'tools',
    title: 'บริการ & เครื่องมือออนไลน์',
    description: 'ระบบขอใบเสนอราคา บริการติดตั้ง และเอกสารสเปกเครื่องจักร',
    icon: 'wrench',
    links: [
      { name: 'ขอใบเสนอราคาด่วน (Request Quotation)', path: '/quotation', desc: 'บริการประเมินราคาพร้อมสเปกทางวิศวกรรมภายใน 24 ชม.' },
      { name: 'บริการติดตั้งและบำรุงรักษา (Services)', path: '/services', desc: 'บริการส่งมอบ ติดตั้ง และบำรุงรักษาเครื่องจักร KODERA' },
      { name: 'ผลงานการติดตั้งเครื่องจักร (Projects)', path: '/projects', desc: 'ตัวอย่างผลงานการส่งมอบและติดตั้งเครื่องจักรในโรงงานจริง' },
      { name: 'คู่มือและวิธีการใช้งาน (Manuals & Guides)', path: '/manual', desc: 'ดาวน์โหลดคู่มือการบำรุงรักษาและเอกสารสเปกเครื่องจักร' }
    ]
  },
  {
    id: 'articles',
    title: 'บทความ & คลังความรู้วิศวกรรม',
    description: 'สาระน่ารู้ เทคนิคการแปรรูปสายไฟ และข่าวสารอุตสาหกรรม',
    icon: 'newspaper',
    links: [
      { name: 'บทความและความรู้ทั้งหมด (Articles & Blog)', path: '/blog', desc: 'รวบรวมสาระความรู้ เทคโนโลยีการตัดปอกสายไฟอัตโนมัติ' }
    ]
  },
  {
    id: 'legal',
    title: 'นโยบาย & เอกสารทางกฎหมาย',
    description: 'ข้อกำหนด การคุ้มครองข้อมูล และนโยบายการรับประกัน',
    icon: 'shield',
    links: [
      { name: 'นโยบายความเป็นส่วนตัว (Privacy Policy)', path: '/privacy-policy', desc: 'การคุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA' },
      { name: 'เงื่อนไขการให้บริการ (Terms of Service)', path: '/terms', desc: 'ข้อกำหนดและข้อตกลงในการใช้งานเว็บไซต์และการสั่งซื้อ' },
      { name: 'นโยบายการใช้คุกกี้ (Cookie Policy)', path: '/cookie-policy', desc: 'แนวทางและการจัดการการใช้งานคุกกี้บนเว็บไซต์' },
      { name: 'นโยบายการรับประกันสินค้า (Warranty Policy)', path: '/warranty', desc: 'เงื่อนไขและระยะเวลาการรับประกันเครื่องจักร KODERA' }
    ]
  },
  {
    id: 'account',
    title: 'ระบบสมาชิก & บริการออนไลน์',
    description: 'การจัดการข้อมูลผู้ใช้งานและคำสั่งซื้อ',
    icon: 'user',
    links: [
      { name: 'เข้าสู่ระบบ / จัดการบัญชี (Login)', path: '/login', desc: 'ระบบสมาชิกเพื่อตรวจสอบคำสั่งซื้อและเอกสาร' },
      { name: 'ตะกร้าสินค้า (Shopping Cart)', path: '/cart', desc: 'รายการสินค้าและเครื่องจักรที่เลือกรอดำเนินการ' }
    ]
  }
]

const filteredSections = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return siteSections

  return siteSections.map(sec => {
    const matchedLinks = sec.links.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.path.toLowerCase().includes(q) || 
      (l.desc && l.desc.toLowerCase().includes(q))
    )
    if (matchedLinks.length > 0 || sec.title.toLowerCase().includes(q)) {
      return {
        ...sec,
        links: matchedLinks.length > 0 ? matchedLinks : sec.links
      }
    }
    return null
  }).filter(Boolean)
})

onMounted(() => {
  setMeta({
    title: 'แผนผังเว็บไซต์ (Sitemap Directory) | บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    description: 'แผนผังโครงสร้างเว็บไซต์และสารบัญลิงก์ทั้งหมดของ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด ผู้แทนจำหน่ายเครื่องตัดปอกสายไฟ KODERA',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "แผนผังเว็บไซต์", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
})
</script>

<template>
  <div class="relative bg-slate-50 dark:bg-[#070A0F] min-h-screen py-24 sm:py-32 overflow-hidden transition-colors duration-300 pt-28 lg:pt-36">
    
    <!-- Background Ambient Lighting -->
    <div class="absolute -top-40 right-1/4 -z-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>
    <div class="absolute top-1/3 -left-20 -z-10 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
        <router-link to="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span>หน้าแรก</span>
        </router-link>
        <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span class="text-blue-600 dark:text-blue-400 font-bold">แผนผังเว็บไซต์</span>
      </nav>

      <!-- Page Header -->
      <div class="text-center mb-10 md:mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 shadow-sm mb-4">
          <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
          </svg>
          <span class="text-xs font-extrabold tracking-wider text-blue-700 dark:text-blue-300 uppercase">
            Website Structure & Directory
          </span>
        </div>

        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
          แผนผังเว็บไซต์
        </h1>

        <p class="text-slate-600 dark:text-slate-300 font-normal text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          สารบัญโครงสร้างหน้าเว็บและบริการทั้งหมดของ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด<br class="hidden sm:inline"/>
          เพื่อการเข้าถึงข้อมูลที่สะดวกรวดเร็วและเป็นระเบียบ
        </p>

        <!-- Search Bar in Sitemap -->
        <div class="max-w-md mx-auto mt-6">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="ค้นหาหน้าเว็บ, รุ่นเครื่องจักร หรือบริการ..." 
              class="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs sm:text-sm text-slate-900 dark:text-white transition-all"
            />
            <button v-if="searchQuery" @click="searchQuery = ''" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Bento Grid of Sitemap Sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="section in filteredSections" 
          :key="section.id"
          class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-lg shadow-slate-900/5 transition-all hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 flex flex-col justify-between group"
        >
          <div>
            <!-- Section Header -->
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <svg v-if="section.icon === 'building'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <svg v-else-if="section.icon === 'cube'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
                <svg v-else-if="section.icon === 'calculator'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
                <svg v-else-if="section.icon === 'newspaper'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                </svg>
                <svg v-else-if="section.icon === 'shield'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>

              <div>
                <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {{ section.title }}
                </h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ section.description }}
                </p>
              </div>
            </div>

            <!-- Links List -->
            <ul class="space-y-2.5">
              <li v-for="(item, itemIdx) in section.links" :key="itemIdx">
                <router-link 
                  :to="item.path" 
                  class="group/link flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                  <div>
                    <div class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors">
                      {{ item.name }}
                    </div>
                    <div v-if="item.desc" class="text-[11px] text-slate-400 dark:text-slate-500 leading-normal mt-0.5">
                      {{ item.desc }}
                    </div>
                  </div>
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- No Search Results -->
      <div v-if="filteredSections.length === 0" class="text-center py-16 bg-white/60 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 mt-6">
        <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <p class="text-slate-600 dark:text-slate-300 font-bold text-base">ไม่พบหน้าเว็บที่ตรงกับ "{{ searchQuery }}"</p>
        <button @click="searchQuery = ''" class="mt-3 text-xs font-bold text-blue-600 hover:underline">
          ล้างการค้นหา
        </button>
      </div>

      <!-- XML Sitemap & Technical Info Card -->
      <div class="mt-12 p-6 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
            <span>XML Sitemap สำหรับ Search Engines & Web Crawlers</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            แผนผังเว็บไซต์รูปแบบ XML สำหรับ Google Search Console และระบบสืบค้นอัตโนมัติ
          </p>
        </div>

        <a 
          href="/sitemap.xml" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold transition-colors border border-slate-200 dark:border-slate-700 flex items-center gap-2"
        >
          <span>/sitemap.xml</span>
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      </div>

    </div>
  </div>
</template>
