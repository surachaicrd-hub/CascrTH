<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'
import { useSEO } from '../composables/useSEO'
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

const content = ref('')
const isLoading = ref(true)

const loadContent = async () => {
  isLoading.value = true
  try {
    const res = await apiFetch('/api/settings/privacy_policy')
    const data = await res.json()
    if (data.success && data.data) {
      content.value = data.data
    } else {
      content.value = '<div class="text-center py-12 text-slate-500">ยังไม่มีข้อมูลนโยบายความเป็นส่วนตัว</div>'
    }
  } catch (error) {
    console.error('Failed to load privacy policy:', error)
    content.value = '<div class="text-center py-12 text-rose-500">เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง</div>'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadContent()

  setMeta({
    title: 'นโยบายความเป็นส่วนตัว (Privacy Policy) | บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    description: 'นโยบายการคุ้มครองข้อมูลส่วนบุคคลตามมาตรฐาน PDPA ของ บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "นโยบายความเป็นส่วนตัว", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
})
</script>

<template>
  <div class="relative bg-slate-50 dark:bg-[#070A0F] min-h-screen py-24 sm:py-32 overflow-hidden transition-colors duration-300 pt-28 lg:pt-36">
    
    <!-- Background Ambient Lighting -->
    <div class="absolute -top-40 right-1/4 -z-10 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>
    <div class="absolute top-1/3 -left-20 -z-10 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
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
        <span class="text-slate-400">เอกสารทางกฎหมาย</span>
        <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        <span class="text-blue-600 dark:text-blue-400 font-bold">นโยบายความเป็นส่วนตัว</span>
      </nav>

      <!-- Page Header -->
      <div class="text-center mb-10 md:mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 shadow-sm mb-4">
          <svg class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          <span class="text-xs font-extrabold tracking-wider text-blue-700 dark:text-blue-300 uppercase">
            PDPA Compliance & Data Privacy
          </span>
        </div>

        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
          นโยบายความเป็นส่วนตัว
        </h1>

        <p class="text-slate-600 dark:text-slate-300 font-normal text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          มาตรฐานการคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)<br class="hidden sm:inline"/>
          บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด
        </p>

        <!-- Quick Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 text-left">
          <div class="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">การจัดเก็บข้อมูล</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">เฉพาะข้อมูลที่จำเป็นเพื่อการเสนอราคาและบริการหลังการขาย</div>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">ความปลอดภัยสูงสุด</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">เข้ารหัส SSL/TLS และไม่เปิดเผยต่อบุคคลภายนอก</div>
            </div>
          </div>

          <div class="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-start gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">สิทธิของเจ้าของข้อมูล</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ขอเข้าถึง แก้ไข หรือลบข้อมูลส่วนบุคคลได้ตลอดเวลา</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Document Card -->
      <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 md:p-12 relative overflow-hidden text-left">
        
        <!-- Top Tech Gradient Line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0220A4] via-[#1D4ED8] to-[#06B6D4]"></div>

        <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
          <div class="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
          <p class="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">กำลังโหลดข้อมูลเอกสาร...</p>
        </div>

        <div v-else class="policy-content prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed" v-html="content">
        </div>

        <!-- Contact DPO Box -->
        <div class="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                สอบถามเกี่ยวกับนโยบายความเป็นส่วนตัวหรือขอใช้สิทธิ PDPA
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                เจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคล (DPO) • บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด
              </p>
            </div>
            <router-link to="/contact" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all shrink-0 flex items-center gap-2">
              <span>ติดต่อเรา</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </router-link>
          </div>
        </div>

      </div>
      
      <!-- Footer Navigation Links -->
      <div class="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <router-link to="/terms" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
          <span>เงื่อนไขการให้บริการ</span>
        </router-link>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <router-link to="/cookie-policy" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
          <span>นโยบายการใช้คุกกี้</span>
        </router-link>
        <span class="text-slate-300 dark:text-slate-700">•</span>
        <router-link to="/sitemap" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
          <span>แผนผังเว็บไซต์</span>
        </router-link>
      </div>

    </div>
  </div>
</template>

<style scoped>
.policy-content :deep(h1), 
.policy-content :deep(h2), 
.policy-content :deep(h3) {
  font-weight: 800;
  color: #0f172a;
  margin-top: 2rem;
  margin-bottom: 1rem;
  letter-spacing: -0.01em;
}
:deep(.dark) .policy-content h1,
:deep(.dark) .policy-content h2,
:deep(.dark) .policy-content h3 {
  color: #f8fafc;
}
.policy-content :deep(h2) {
  font-size: 1.35rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 0.5rem;
}
:deep(.dark) .policy-content h2 {
  border-bottom-color: #334155;
}
.policy-content :deep(h3) {
  font-size: 1.15rem;
  color: #1e40af;
}
:deep(.dark) .policy-content h3 {
  color: #93c5fd;
}
.policy-content :deep(p) {
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.8;
}
.policy-content :deep(ul),
.policy-content :deep(ol) {
  margin-bottom: 1.5rem;
  padding-left: 1.25rem;
  list-style-type: disc;
}
.policy-content :deep(li) {
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  line-height: 1.7;
}
.policy-content :deep(strong) {
  font-weight: 700;
  color: #0f172a;
}
:deep(.dark) .policy-content strong {
  color: #ffffff;
}
.policy-content :deep(a) {
  color: #2563eb;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
