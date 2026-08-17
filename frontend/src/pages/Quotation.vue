<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { isValidThaiPhone, isValidEmail, isValidTaxId } from '../composables/useValidation'
import { searchAddressByDistrict, searchAddressByAmphoe, searchAddressByProvince, searchAddressByZipcode } from 'thai-address-database'
import { useRoute, useRouter } from 'vue-router'
import { useTrackingStore } from '../stores/tracking'
import { useSEO } from '../composables/useSEO'
import { useSettingsStore } from '../stores/settingsStore'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const trackingStore = useTrackingStore()
const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

const heroBg = computed(() => {
  return settingsStore.quotationHeroBg || '/images/hero/quotation-hero.jpg'
})

const form = ref({
  requestType: 'company',
  customerName: '',
  companyName: '',
  taxId: '',
  email: '',
  phone: '',
  addressDetail: '',
  subdistrict: '',
  district: '',
  province: '',
  zipcode: '',
  projectScale: 'งานไลน์ผลิตระดับมาตรฐาน (Standard Production Line)',
  usageType: 'งานตัดและปอกสายไฟทั่วไป (General Cutting & Stripping)',
  needInstallation: true,
  details: '',
  attachedProduct: '',
  botHoneypot: '',
  captchaAnswer: ''
})

const isSubmitting = ref(false)
const submitted = ref(false)
const successContainer = ref(null)

// Thai Address Auto-complete Logic
const suggestions = ref([])
const showSuggestions = ref(false)
const activeSuggestionField = ref('')

const handleAddressInput = (field, value) => {
  if (!value || value.length < 2) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  activeSuggestionField.value = field
  let results = []

  try {
    if (field === 'subdistrict') results = searchAddressByDistrict(value)
    else if (field === 'district') results = searchAddressByAmphoe(value)
    else if (field === 'province') results = searchAddressByProvince(value)
    else if (field === 'zipcode') results = searchAddressByZipcode(value)
  } catch (e) {
    console.error('Address search error:', e)
  }

  suggestions.value = results.slice(0, 20)
  showSuggestions.value = suggestions.value.length > 0
}

const selectSuggestion = (s) => {
  form.value.subdistrict = s.district
  form.value.district = s.amphoe
  form.value.province = s.province
  form.value.zipcode = s.zipcode

  suggestions.value = []
  showSuggestions.value = false
}

const hideSuggestionsDelay = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

// Select Options Logic for Machinery & Processing
const projectScaleOptions = [
  'งานไลน์ผลิตขนาดเริ่มต้น (Low Volume / Prototyping)',
  'งานไลน์ผลิตระดับมาตรฐาน (Standard Production Line)',
  'โรงงานอุตสาหกรรมขนาดใหญ่ (High-Volume 24/7 Industrial)',
  'โครงการติดตั้งระบบอัตโนมัติแบบครบวงจร (Turnkey Automation System)'
]

const usageTypeOptions = [
  'งานตัดและปอกสายไฟทั่วไป (General Cutting & Stripping)',
  'งานสายแพและสายไฟริบบิ้น (Flat & Ribbon Cable)',
  'งานปั่นเกลียวและเข้าหัวเทอร์มินอล (Twisting & Crimping)',
  'งานสายไฟแรงดันสูง / สายเคเบิลมัลติคอร์ (Heavy Duty / Multi-Core Cable)'
]

// Math CAPTCHA logic
const captchaConfig = ref({ num1: 0, num2: 0, operator: '+', options: [] })

const generateCaptcha = () => {
  const n1 = Math.floor(Math.random() * 10) + 1
  const n2 = Math.floor(Math.random() * 10) + 1
  const correct = n1 + n2
  
  let wrong1, wrong2
  do { wrong1 = correct + Math.floor(Math.random() * 5) - 2 } while (wrong1 === correct || wrong1 < 1)
  do { wrong2 = correct + Math.floor(Math.random() * 8) - 4 } while (wrong2 === correct || wrong2 === wrong1 || wrong2 < 1)
  
  const options = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5)
  captchaConfig.value = { num1: n1, num2: n2, operator: '+', options }
  form.value.captchaAnswer = ''
}

// Generate upfront
generateCaptcha()

const submitQuotation = async () => {
  if (!isValidThaiPhone(form.value.phone)) {
    showToast('เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก', 'error')
    return
  }
  if (!isValidEmail(form.value.email)) {
    showToast('รูปแบบอีเมลไม่ถูกต้อง', 'error')
    return
  }
  if (form.value.requestType === 'company' && form.value.taxId && !isValidTaxId(form.value.taxId)) {
    showToast('เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก', 'error')
    return
  }

  const expectedAnswer = captchaConfig.value.num1 + captchaConfig.value.num2
  if (parseInt(form.value.captchaAnswer) !== expectedAnswer) {
    showToast('คำตอบการยืนยันไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง', 'error')
    generateCaptcha()
    return
  }

  isSubmitting.value = true
  try {
    const areaLocation = `ต.${form.value.subdistrict || '-'} อ.${form.value.district || '-'} จ.${form.value.province || '-'} ${form.value.zipcode || ''}`.trim()
    const fullLocation = form.value.addressDetail ? `${form.value.addressDetail} ${areaLocation}` : areaLocation;
      
    const res = await fetch('/api/quotation-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          ...form.value,
          location: fullLocation,
          captchaConfig: captchaConfig.value
      })
    })

    if (res.ok) {
      submitted.value = true
      showToast('ส่งคำร้องขอใบเสนอราคาเรียบร้อยแล้ว', 'success')
      trackingStore.trackEvent({
        type: 'submit_lead',
        leadType: 'quotation',
        projectScale: form.value.projectScale,
        attachedProduct: form.value.attachedProduct
      })
      
      await nextTick()
      if (successContainer.value) {
        const y = successContainer.value.getBoundingClientRect().top + window.scrollY - 150
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    } else {
      showToast('เซิร์ฟเวอร์ขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง', 'error')
    }
  } catch (err) {
    console.error(err)
    showToast('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    requestType: 'company',
    customerName: '',
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    addressDetail: '',
    subdistrict: '',
    district: '',
    province: '',
    zipcode: '',
    projectScale: 'งานไลน์ผลิตระดับมาตรฐาน (Standard Production Line)',
    usageType: 'งานตัดและปอกสายไฟทั่วไป (General Cutting & Stripping)',
    needInstallation: true,
    details: '',
    attachedProduct: '',
    botHoneypot: '',
    captchaAnswer: ''
  }
  submitted.value = false
  generateCaptcha()
}

onMounted(() => {
  setMeta({
    title: 'ขอใบเสนอราคาเครื่องตัดปอกสายไฟ KODERA (Request Quotation)',
    description: settingsStore.storeDescription || 'รับบริการประเมินราคาและออกใบเสนอราคาเครื่องตัดปอกสายไฟอัตโนมัติ KODERA สำหรับบุคคลและนิติบุคคล จัดส่งเอกสารรวดเร็วภายใน 24 ชม.',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "ขอใบเสนอราคา", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')

  if (route.query.product) {
    form.value.attachedProduct = route.query.product
  }
})
</script>

<template>
  <div class="relative min-h-screen pt-24 md:pt-32 pb-16 md:pb-24 transition-colors overflow-hidden bg-slate-50 dark:bg-[#070A0F]">
    
    <!-- Hero Background Image (Admin Managed) -->
    <div 
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-25 scale-100 pointer-events-none"
      :style="{ backgroundImage: `url(${heroBg})` }"
    ></div>
    <div class="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/90 to-slate-50/75 dark:from-[#070A0F] dark:via-[#070A0F]/90 dark:to-[#070A0F]/75 pointer-events-none"></div>

    <!-- Background Ambient Lighting Accents -->
    <div class="absolute -top-[15%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] pointer-events-none"></div>
    <div class="absolute top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-[120px] pointer-events-none"></div>

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
        <span class="text-blue-600 dark:text-blue-400 font-bold">ขอใบเสนอราคา</span>
      </nav>

      <!-- Header Section -->
      <div class="text-center mb-10 md:mb-12">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 shadow-sm mb-4">
          <span class="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping"></span>
          <span class="text-xs font-extrabold tracking-wider text-blue-700 dark:text-blue-300 uppercase">
            Official Quotation System
          </span>
        </div>
        
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
          ขอใบเสนอราคาเครื่องตัดปอกสายไฟ
        </h1>
        
        <p class="text-slate-600 dark:text-slate-300 font-normal text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          บริการประเมินราคาและออกใบเสนอราคาอย่างเป็นทางการสำหรับบุคคลและนิติบุคคล<br class="hidden sm:inline"/>
          พร้อมตารางสเปกทางวิศวกรรม จัดส่งถึงคุณภายใน 24 ชั่วโมง
        </p>

        <!-- Trust Metrics -->
        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>จัดทำเอกสารด่วนภายใน 24 ชม.</span>
          </div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span>รองรับงานจัดซื้อและหัก ณ ที่จ่าย</span>
          </div>
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            <span>สเปก KODERA Japan แท้ 100%</span>
          </div>
        </div>
      </div>

      <!-- Main Form Wrapper -->
      <div class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden text-left transition-colors relative">
        
        <!-- Top Tech Gradient Line -->
        <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0220A4] via-[#1D4ED8] to-[#06B6D4]"></div>

        <!-- Form Component -->
        <form @submit.prevent="submitQuotation" v-if="!submitted" class="p-6 sm:p-10 md:p-12 space-y-9">
          
          <!-- Request Type Toggle (Compact Standard Segmented Control) -->
          <div class="flex flex-col items-center">
            <label class="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2.5 text-center">
              ประเภทผู้ขอใบเสนอราคา <span class="text-rose-500">*</span>
            </label>
            <div class="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
              <button type="button" @click="form.requestType = 'company'"
                :class="[
                  'px-4 sm:px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-bold text-xs sm:text-sm whitespace-nowrap',
                  form.requestType === 'company' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                ]">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span>นิติบุคคล (บริษัท / องค์กร)</span>
              </button>

              <button type="button" @click="form.requestType = 'individual'"
                :class="[
                  'px-4 sm:px-5 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-bold text-xs sm:text-sm whitespace-nowrap',
                  form.requestType === 'individual' 
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-600' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                ]">
                <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                <span>บุคคลธรรมดา</span>
              </button>
            </div>
          </div>

          <hr class="border-slate-100 dark:border-slate-800">

          <!-- Section 1: ข้อมูลผู้ติดต่อ -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/25">
                01
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  ข้อมูลผู้ติดต่อและองค์กร
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">กรอกข้อมูลสำหรับจัดส่งใบเสนอราคาและติดต่อประสานงาน</p>
              </div>
            </div>
             
            <!-- Corporate Fields -->
            <div v-if="form.requestType === 'company'" class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 transition-all">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ชื่อบริษัท / โรงงาน / หน่วยงาน <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                  </div>
                  <input type="text" v-model="form.companyName" required placeholder="เช่น บริษัท เอสซีจี เทรดดิ้ง จำกัด" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  เลขประจำตัวผู้เสียภาษี 13 หลัก <span class="text-slate-400 font-normal">(ถ้ามี)</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <input type="text" v-model="form.taxId" placeholder="010XXXXXXXXXX" maxlength="13" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all" :class="form.taxId && !isValidTaxId(form.taxId) ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'">
                </div>
                <p v-if="form.taxId && !isValidTaxId(form.taxId)" class="text-[11px] text-rose-500 mt-1 font-medium">เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก</p>
              </div>
            </div>
 
            <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ชื่อ-นามสกุล ผู้ติดต่อ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <input type="text" v-model="form.customerName" required placeholder="ชื่อและนามสกุล" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all">
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  เบอร์โทรศัพท์ติดต่อ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <input type="tel" v-model="form.phone" required placeholder="08X-XXX-XXXX" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all" :class="form.phone && !isValidThaiPhone(form.phone) ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'">
                </div>
                <p v-if="form.phone && !isValidThaiPhone(form.phone)" class="text-[11px] text-rose-500 mt-1 font-medium">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก</p>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  อีเมล (สำหรับส่งเอกสาร) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <input type="email" v-model="form.email" required placeholder="name@company.com" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all" :class="form.email && !isValidEmail(form.email) ? 'border-rose-400 dark:border-rose-500' : 'border-slate-200 dark:border-slate-700'">
                </div>
                <p v-if="form.email && !isValidEmail(form.email)" class="text-[11px] text-rose-500 mt-1 font-medium">รูปแบบอีเมลไม่ถูกต้อง</p>
              </div>
            </div>
          </div>

          <hr class="border-slate-100 dark:border-slate-800">

          <!-- Section 2: สถานที่ติดตั้งและออกเอกสาร -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/25">
                02
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  สถานที่ติดตั้ง / ที่อยู่ออกใบกำกับภาษี
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">ใช้สำหรับการคำนวณการจัดส่งและบริการติดตั้งนอกสถานที่</p>
              </div>
            </div>

            <div class="space-y-4 relative">
              <div class="space-y-1.5">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ที่อยู่โดยละเอียด (เลขที่, อาคาร, ซอย, ถนน, นิคมอุตสาหกรรม) <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>
                  <input type="text" v-model="form.addressDetail" required placeholder="เช่น 99/9 หมู่ 4 นิคมอุตสาหกรรมบางปะอิน ถ.พหลโยธิน" class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all">
                </div>
              </div>

              <div>
                <p class="text-[11px] text-blue-600 dark:text-blue-400 mb-2.5 font-medium flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg> 
                  <span>พิมพ์ตำบล อำเภอ หรือรหัสไปรษณีย์ ระบบจะค้นหาและเติมข้อมูลอัตโนมัติ</span>
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <input type="text" v-model="form.subdistrict" @input="handleAddressInput('subdistrict', form.subdistrict)" @focus="handleAddressInput('subdistrict', form.subdistrict)" @blur="hideSuggestionsDelay" required placeholder="ตำบล / แขวง" class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all">
                  <input type="text" v-model="form.district" @input="handleAddressInput('district', form.district)" @focus="handleAddressInput('district', form.district)" @blur="hideSuggestionsDelay" required placeholder="อำเภอ / เขต" class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all">
                  <input type="text" v-model="form.province" @input="handleAddressInput('province', form.province)" @focus="handleAddressInput('province', form.province)" @blur="hideSuggestionsDelay" required placeholder="จังหวัด" class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all">
                  <input type="text" v-model="form.zipcode" @input="handleAddressInput('zipcode', form.zipcode)" @focus="handleAddressInput('zipcode', form.zipcode)" @blur="hideSuggestionsDelay" required placeholder="รหัสไปรษณีย์" class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white transition-all">
                </div>
              </div>

              <!-- Autocomplete Dropdown -->
              <div v-if="showSuggestions && suggestions.length > 0" class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                <ul class="py-1.5 divide-y divide-slate-100 dark:divide-slate-700/50">
                  <li v-for="(s, idx) in suggestions" :key="idx" @click="selectSuggestion(s)" class="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                    <div class="flex items-center justify-between">
                      <span class="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                        <span :class="{'text-blue-600 dark:text-blue-400 font-bold': activeSuggestionField === 'subdistrict'}">ต.{{ s.district }}</span> &rsaquo; 
                        <span :class="{'text-blue-600 dark:text-blue-400 font-bold': activeSuggestionField === 'district'}">อ.{{ s.amphoe }}</span> &rsaquo; 
                        <span :class="{'text-blue-600 dark:text-blue-400 font-bold': activeSuggestionField === 'province'}">จ.{{ s.province }}</span>
                      </span>
                      <span :class="['text-xs sm:text-sm font-bold', activeSuggestionField === 'zipcode' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400']">{{ s.zipcode }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr class="border-slate-100 dark:border-slate-800">

          <!-- Section 3: รายละเอียดเครื่องจักรและความต้องการ -->
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/25">
                03
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  สเปกเครื่องจักรและความต้องการทางเทคนิค
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">เลือกประเภทงานและระบุข้อกำหนดทางวิศวกรรม</p>
              </div>
            </div>

            <!-- Attached Product Preview if present -->
            <div v-if="form.attachedProduct" class="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/40 flex items-center justify-between gap-4 shadow-sm">
              <div class="flex items-center gap-3.5">
                <div class="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 tracking-wider uppercase">สินค้าที่ระบุในคำร้อง</div>
                  <div class="text-base sm:text-lg font-black text-slate-900 dark:text-white">{{ form.attachedProduct }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">ทีมวิศวกรจะประเมินราคาพร้อมสเปกอุปกรณ์เสริมตรงตามรุ่นนี้</div>
                </div>
              </div>

              <button type="button" @click="form.attachedProduct = ''" class="text-xs text-slate-400 hover:text-rose-500 transition-colors p-1" title="นำรายการออก">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Production Volume & Scale Selection -->
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ระดับกำลังการผลิต / ขนาดโครงการ <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div v-for="scale in projectScaleOptions" :key="scale"
                    @click="form.projectScale = scale"
                    :class="[
                      'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3',
                      form.projectScale === scale 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                    ]"
                  >
                    <div :class="[
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                      form.projectScale === scale ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'
                    ]">
                      <div v-if="form.projectScale === scale" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <span class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {{ scale }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Processing Requirement Task Selection -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  ลักษณะงานแปรรูปสายไฟหลัก <span class="text-rose-500">*</span>
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div v-for="usage in usageTypeOptions" :key="usage"
                    @click="form.usageType = usage"
                    :class="[
                      'p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3',
                      form.usageType === usage 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20' 
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                    ]"
                  >
                    <div :class="[
                      'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors',
                      form.usageType === usage ? 'border-blue-600 bg-blue-600' : 'border-slate-300 dark:border-slate-600'
                    ]">
                      <div v-if="form.usageType === usage" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <span class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {{ usage }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Engineering Notes & Special Requirements -->
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ข้อกำหนดเพิ่มเติมถึงทีมวิศวกร <span class="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <textarea v-model="form.details" rows="3" placeholder="เช่น ขนาดสายไฟ AWG / sqmm ที่ต้องการ, ความยาวตัดปอก (mm), ปริมาณงานต่อวัน หรือต้องการอุปกรณ์เสริมเช่น ชุดป้อนสาย (Feeder) ฯลฯ" class="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm text-slate-900 dark:text-white transition-all resize-none"></textarea>
            </div>
          </div>

          <!-- Section 4: Human Verification CAPTCHA -->
          <div class="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-800/80 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
              <div class="flex items-center gap-3 text-center sm:text-left">
                <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-900 dark:text-white">
                    ยืนยันความปลอดภัย (Anti-Spam Verification) <span class="text-rose-500">*</span>
                  </label>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400">เลือกผลบวกที่ถูกต้องเพื่อยืนยันตัวตน</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto justify-center">
                <div class="font-mono text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span class="text-blue-600 dark:text-blue-400">{{ captchaConfig.num1 }}</span> 
                  <span class="text-slate-400 font-normal">+</span> 
                  <span class="text-blue-600 dark:text-blue-400">{{ captchaConfig.num2 }}</span> 
                  <span class="text-slate-400 font-normal">=</span>
                </div>
                
                <div class="flex gap-2">
                  <button 
                    v-for="opt in captchaConfig.options" :key="opt"
                    type="button"
                    @click="form.captchaAnswer = opt"
                    :class="[
                      'w-10 h-9 rounded-lg text-sm font-bold transition-all duration-200',
                      form.captchaAnswer === opt 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 ring-2 ring-blue-500/50' 
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500'
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Honeypot for bot suppression -->
          <div style="position: absolute; left: -9999px;">
             <label for="fax_number">Fax Number</label>
             <input type="text" id="fax_number" name="fax_number" v-model="form.botHoneypot" tabindex="-1" autocomplete="off">
          </div>

          <!-- Submit Button & Trust Bar -->
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-5">
            <p class="text-xs text-slate-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span>ข้อมูลของคุณได้รับการปกป้องตามมาตรฐานความปลอดภัย PDPA</span>
            </p>

            <button :disabled="isSubmitting" type="submit" class="group relative inline-flex items-center justify-center gap-3 px-9 py-4 text-sm font-bold tracking-wide text-white transition-all duration-300 bg-gradient-to-r from-[#0220A4] via-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#3B82F6] disabled:bg-slate-300 disabled:opacity-60 rounded-xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 overflow-hidden whitespace-nowrap w-full md:w-auto">
               <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out"></span>
               <span class="relative z-10">{{ isSubmitting ? 'กำลังส่งข้อมูลคำร้อง...' : 'ยืนยันการขอใบเสนอราคา' }}</span>
               <svg v-if="!isSubmitting" class="w-4.5 h-4.5 transform group-hover:translate-x-1 transition-transform relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
               </svg>
               <svg v-else class="w-4.5 h-4.5 animate-spin relative z-10" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            </button>
          </div>
        </form>

        <!-- Success Animation View -->
        <div ref="successContainer" v-else class="p-8 sm:p-14 md:p-16 text-center min-h-[480px] flex flex-col items-center justify-center">
           <div class="relative mb-6">
             <div class="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
             <div class="relative w-20 h-20 sm:w-24 sm:h-24 bg-blue-50 dark:bg-blue-950/60 border-4 border-blue-100 dark:border-blue-800/60 rounded-full flex items-center justify-center mx-auto shadow-inner text-blue-600 dark:text-blue-400">
               <svg class="w-10 h-10 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
               </svg>
             </div>
           </div>

           <h3 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
             ส่งคำร้องขอใบเสนอราคาเรียบร้อยแล้ว
           </h3>
           
           <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 max-w-xl mx-auto mb-8 border border-slate-200/80 dark:border-slate-700">
             <p class="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
               ข้อมูลสเปกและรายละเอียดของคุณเข้าสู่ระบบเรียบร้อยแล้ว<br/> 
               <span class="font-bold text-slate-900 dark:text-white">ทีมวิศวกรผู้เชี่ยวชาญจะจัดทำใบเสนอราคาพร้อมเอกสารประกอบ</span><br/>
               และส่งกลับไปยังอีเมลหรือเบอร์โทรศัพท์ที่คุณระบุไว้ภายใน 24 ชั่วโมง
             </p>
           </div>

           <div class="flex flex-wrap items-center justify-center gap-4">
             <router-link to="/products" class="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2">
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
               </svg>
               <span>เลือกชมสินค้าและเครื่องจักรอื่น</span>
             </router-link>

             <button @click="resetForm" class="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700">
               <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                 <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
               </svg>
               <span>สร้างคำร้องขอใบเสนอราคาเพิ่ม</span>
             </button>
           </div>
        </div>

      </div>
    </div>
  </div>
</template>
