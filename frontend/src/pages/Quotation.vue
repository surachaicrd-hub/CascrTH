<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useToast } from '../composables/useToast'
import { isValidThaiPhone, isValidEmail, isValidTaxId } from '../composables/useValidation'
import { searchAddressByDistrict, searchAddressByAmphoe, searchAddressByProvince, searchAddressByZipcode } from 'thai-address-database'

import { useRoute } from 'vue-router'
import { useTrackingStore } from '../stores/tracking'
import { useSEO } from '../composables/useSEO'

const route = useRoute()
const { showToast } = useToast()
const trackingStore = useTrackingStore()
const { setMeta, setStructuredData } = useSEO()

const form = ref({
  requestType: 'individual',
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
  projectScale: 'ขนาดเล็ก (งบประหยัด)',
  usageType: 'บ้าน/ที่อยู่อาศัย',
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

  // Limit to 20 suggestions
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

// Select Options Logic
const projectScaleOptions = [
  'ขนาดเล็ก (พื้นที่ 2x2 - 3x3 ม.)',
  'ขนาดกลาง (พื้นที่ 3x4 - 4x5 ม.)',
  'ขนาดใหญ่ (พื้นที่ 5x6 ม. ขึ้นไป)',
  'โครงการอุตสาหกรรม พิเศษ'
]
const isCustomScale = ref(false)

const usageTypeOptions = [
  'ห้องเก็บเศษวัสดุหน้าบ้าน',
  'โรงเรือนปลูกต้นไม้แคคตัส',
  'ห้องทำงานส่วนตัว',
  'โกดังเก็บสินค้าเชิงพาณิชย์'
]
const isCustomUsage = ref(false)

const setProjectScale = (val) => {
  if (val === 'OTHER') {
    isCustomScale.value = true
    form.value.projectScale = ''
  } else {
    isCustomScale.value = false
    form.value.projectScale = val
  }
}

const setUsageType = (val) => {
  if (val === 'OTHER') {
    isCustomUsage.value = true
    form.value.usageType = ''
  } else {
    isCustomUsage.value = false
    form.value.usageType = val
  }
}

// Math CAPTCHA logic
const captchaConfig = ref({ num1: 0, num2: 0, operator: '+', options: [] })

const generateCaptcha = () => {
  const n1 = Math.floor(Math.random() * 10) + 1
  const n2 = Math.floor(Math.random() * 10) + 1
  const correct = n1 + n2
  
  // Generate 2 wrong but plausible answers
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
  // Validate phone & email format
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
    showToast('คำตอบการยืนยันไม่ถูกต้อง กรุณาลองใหม่', 'error')
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
          location: fullLocation, // Override location with concatenated string
          captchaConfig: captchaConfig.value // send config to backend for validation
      })
    })

    if (res.ok) {
      submitted.value = true
      showToast('ส่งใบคำร้องขอใบเสนอราคาเรียบร้อยแล้ว', 'success')
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

onMounted(() => {
  setMeta({
    title: 'ขอใบเสนอราคาด่วน (Request Quotation)',
    description: settingsStore.storeDescription || 'รับบริการประเมินราคาและเสนอราคาสินค้าสำหรับบุคคลและนิติบุคคล ฟรีไม่มีค่าใช้จ่าย',
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
  <div class="relative min-h-screen pt-24 md:pt-32 pb-12 md:pb-24 transition-colors overflow-hidden bg-gray-50 dark:bg-[#0a0f16]">
    <!-- Background Effects -->
    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-emerald-100/50 to-transparent dark:from-emerald-900/20 dark:to-transparent pointer-events-none"></div>
    <div class="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-emerald-400/10 dark:bg-emerald-600/10 blur-[120px] pointer-events-none"></div>
    <div class="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-400/10 dark:bg-teal-600/10 blur-[100px] pointer-events-none"></div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      <!-- Premium Title Section -->
      <div class="text-center mb-10 md:mb-14">
        <div class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/30 shadow-sm mb-6 animate-fade-in-down">
           <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           <span class="text-xs font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase">บริการประเมินราคาฟรี</span>
        </div>
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
          ขอใบเสนอราคาด่วน
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium text-lg max-w-2xl mx-auto">
          กรอกข้อมูลเพื่อให้ผู้เชี่ยวชาญนำเสนอโครงสร้างและงบประมาณที่ดีที่สุด<br class="hidden sm:block"/> กลับไปยังคุณภายใน 24 ชั่วโมง
        </p>
      </div>

      <!-- Main Form Wrapper -->
      <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-gray-800 overflow-hidden text-left transition-colors relative">
        
        <!-- Decoration Line -->
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

        <!-- Form Component -->
        <form @submit.prevent="submitQuotation" v-if="!submitted" class="p-6 sm:p-10 md:p-12 space-y-10">
          
          <!-- Request Type Toggle (Segmented Control) -->
          <div class="flex flex-col items-center">
            <label class="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">คุณต้องการขอใบเสนอราคาในนาม <span class="text-red-500">*</span></label>
            <div class="inline-flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-full sm:w-auto">
              <button type="button" @click="form.requestType = 'individual'"
                :class="[
                  'flex-1 sm:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-bold text-sm',
                  form.requestType === 'individual' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                ]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                บุคคลธรรมดา
              </button>
              <button type="button" @click="form.requestType = 'company'"
                :class="[
                  'flex-1 sm:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 font-bold text-sm',
                  form.requestType === 'company' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                ]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                นิติบุคคล (บริษัท)
              </button>
            </div>
          </div>

          <hr class="border-gray-100 dark:border-gray-800">

          <!-- Section: ข้อมูลติดต่อ -->
          <div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">1</div>
               ข้อมูลผู้ติดต่อ
             </h3>
             
             <!-- Corporate Fields -->
             <div v-if="form.requestType === 'company'" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fade-in-down">
               <div class="space-y-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">ชื่อบริษัท / นิติบุคคล <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                   <input type="text" v-model="form.companyName" required placeholder="บริษัท ตัวอย่าง จำกัด" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all">
                 </div>
               </div>
               <div class="space-y-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">เลขประจำตัวผู้เสียภาษี 13 หลัก <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                   <input type="text" v-model="form.taxId" required placeholder="010xxxxxxxxx" maxlength="13" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all" :class="form.taxId && !isValidTaxId(form.taxId) ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'">
                 </div>
                 <p v-if="form.taxId && !isValidTaxId(form.taxId)" class="text-xs text-red-500 mt-1 font-medium">เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก</p>
               </div>
             </div>
  
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div class="space-y-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">ชื่อผู้ติดต่อ <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
                   <input type="text" v-model="form.customerName" required placeholder="ชื่อ-นามสกุล" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all">
                 </div>
               </div>
               <div class="space-y-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                   <input type="tel" v-model="form.phone" required placeholder="08X-XXX-XXXX" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all" :class="form.phone && !isValidThaiPhone(form.phone) ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'">
                 </div>
                 <p v-if="form.phone && !isValidThaiPhone(form.phone)" class="text-xs text-red-500 mt-1 font-medium">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก</p>
               </div>
               <div class="space-y-2 md:col-span-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">อีเมล (Email) <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                   <input type="email" v-model="form.email" required placeholder="user@example.com" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all" :class="form.email && !isValidEmail(form.email) ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'">
                 </div>
                 <p v-if="form.email && !isValidEmail(form.email)" class="text-xs text-red-500 mt-1 font-medium">รูปแบบอีเมลไม่ถูกต้อง</p>
               </div>
             </div>
          </div>

          <hr class="border-gray-100 dark:border-gray-800">

          <!-- Section: ที่อยู่ -->
          <div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">2</div>
               ที่อยู่สำหรับติดตั้ง / ออกเอกสาร
             </h3>
             <div class="space-y-6 relative">
               <div class="space-y-2">
                 <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">ที่อยู่แบบละเอียด <span class="text-red-500">*</span></label>
                 <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                   <input type="text" v-model="form.addressDetail" required placeholder="เลขที่, หมู่, อาคาร, ซอย, ถนน" class="w-full pl-12 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all">
                 </div>
               </div>
  
               <div>
                 <p class="text-xs text-emerald-600 dark:text-emerald-400 mb-3 font-medium flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 
                    พิมพ์เพียงอย่างใดอย่างหนึ่ง ระบบจะค้นหาให้อัตโนมัติ
                 </p>
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <input type="text" v-model="form.subdistrict" @input="handleAddressInput('subdistrict', form.subdistrict)" @focus="handleAddressInput('subdistrict', form.subdistrict)" @blur="hideSuggestionsDelay" required placeholder="แขวง/ตำบล" class="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all autocomplete-input">
                   <input type="text" v-model="form.district" @input="handleAddressInput('district', form.district)" @focus="handleAddressInput('district', form.district)" @blur="hideSuggestionsDelay" required placeholder="เขต/อำเภอ" class="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all autocomplete-input">
                   <input type="text" v-model="form.province" @input="handleAddressInput('province', form.province)" @focus="handleAddressInput('province', form.province)" @blur="hideSuggestionsDelay" required placeholder="จังหวัด" class="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all autocomplete-input">
                   <input type="text" v-model="form.zipcode" @input="handleAddressInput('zipcode', form.zipcode)" @focus="handleAddressInput('zipcode', form.zipcode)" @blur="hideSuggestionsDelay" required placeholder="รหัสไปรษณีย์" class="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all autocomplete-input">
                 </div>
               </div>
  
               <!-- Autocomplete Dropdown -->
               <div v-if="showSuggestions && suggestions.length > 0" class="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                 <ul class="py-2">
                   <li v-for="(s, idx) in suggestions" :key="idx" @click="selectSuggestion(s)" class="px-5 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                     <div class="flex items-center justify-between">
                       <span class="text-sm font-medium text-gray-800 dark:text-gray-200">
                         <span :class="{'text-emerald-600 dark:text-emerald-400': activeSuggestionField === 'subdistrict'}">ต.{{ s.district }}</span> » 
                         <span :class="{'text-emerald-600 dark:text-emerald-400': activeSuggestionField === 'district'}">อ.{{ s.amphoe }}</span> » 
                         <span :class="{'text-emerald-600 dark:text-emerald-400': activeSuggestionField === 'province'}">จ.{{ s.province }}</span>
                       </span>
                       <span :class="['text-sm font-bold', activeSuggestionField === 'zipcode' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500']">{{ s.zipcode }}</span>
                     </div>
                   </li>
                 </ul>
               </div>
             </div>
          </div>

          <hr class="border-gray-100 dark:border-gray-800">

          <!-- Section: รายละเอียดเพิ่มเติม -->
          <div>
             <h3 class="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
               <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">3</div>
               รายละเอียดอื่นๆ
             </h3>
             
            <!-- Attached Product Display -->
            <div v-if="form.attachedProduct" class="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-4 shadow-sm relative overflow-hidden">
              <div class="absolute -right-4 -top-4 text-emerald-500/10 dark:text-emerald-400/5">
                <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <div class="mt-1 w-12 h-12 rounded-full bg-white dark:bg-emerald-800/50 flex items-center justify-center shrink-0 shadow-sm relative z-10">
                 <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div class="relative z-10">
                <p class="text-xs font-bold text-emerald-800 dark:text-emerald-400 tracking-widest mb-1 uppercase">แนบข้อมูลสินค้าที่สนใจ</p>
                <h4 class="text-xl md:text-2xl font-black text-gray-900 dark:text-white">{{ form.attachedProduct }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">ทีมงานจะคำนวณและทำใบเสนอราคาตามสินค้านี้ให้ครับ</p>
              </div>
            </div>
  
            <div class="space-y-2">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">ฝากข้อความถึงทีมวิศวกร (ถ้ามี)</label>
              <textarea v-model="form.details" rows="4" placeholder="ระบุความต้องการเพิ่มเติม เช่น ต้องการประตูกระจกบานเลื่อน, ให้ปูพื้นด้วย, เป็นพื้นที่เทปูนแล้ว ฯลฯ" class="w-full bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-gray-900 dark:text-white transition-all resize-none"></textarea>
            </div>
          </div>

          <!-- AI Human Verification (Modern CAPTCHA) -->
          <div class="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-900/80 p-6 md:p-8 rounded-[2rem] border border-gray-200/60 dark:border-gray-700/60 shadow-sm relative overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div class="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <label class="block text-base font-bold text-gray-800 dark:text-gray-200 mb-1">ตรวจสอบความปลอดภัย <span class="text-red-500">*</span></label>
                  <p class="text-sm text-gray-500 dark:text-gray-400">เลือกผลลัพธ์ที่ถูกต้องเพื่อยืนยันว่าคุณไม่ใช่บอท</p>
                </div>
              </div>
              
              <div class="flex flex-col sm:flex-row items-center gap-4 bg-white/80 dark:bg-gray-900/80 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full md:w-auto">
                <div class="px-5 py-2 font-mono text-2xl font-black text-gray-800 dark:text-gray-200 tracking-widest flex items-center gap-3">
                  <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num1 }}</span> 
                  <span class="text-gray-400 font-normal">+</span> 
                  <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num2 }}</span> 
                  <span class="text-gray-400 font-normal">=</span>
                </div>
                
                <div class="flex gap-2 w-full sm:w-auto">
                  <button 
                    v-for="opt in captchaConfig.options" :key="opt"
                    type="button"
                    @click="form.captchaAnswer = opt"
                    :class="[
                      'flex-1 sm:flex-none w-14 h-12 rounded-xl text-lg font-bold transition-all duration-300 transform',
                      form.captchaAnswer === opt 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900' 
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                    ]"
                  >
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Honeypot (Hidden) -->
          <div style="position: absolute; left: -9999px;">
             <label for="fax_number">Fax Number</label>
             <input type="text" id="fax_number" name="fax_number" v-model="form.botHoneypot" tabindex="-1" autocomplete="off">
          </div>

          <!-- Submit Button -->
          <div class="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <p class="text-sm text-gray-500 flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              ข้อมูลของคุณจะถูกเก็บรักษาเป็นความลับ
            </p>
            <button :disabled="isSubmitting" type="submit" class="w-full md:w-auto bg-gray-900 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-gray-300 disabled:dark:bg-gray-800 text-white font-bold tracking-widest px-10 py-5 rounded-2xl shadow-xl hover:shadow-emerald-500/30 transition-all font-sans uppercase group flex items-center justify-center gap-3">
               {{ isSubmitting ? 'กำลังส่งคำร้อง...' : 'ยืนยันการขอใบเสนอราคา' }}
               <svg v-if="!isSubmitting" class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
               <svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </button>
          </div>
        </form>

        <!-- Success Animation View -->
        <div ref="successContainer" v-else class="p-10 md:p-20 text-center min-h-[500px] flex flex-col items-center justify-center animate-fade-in-up">
           <div class="relative">
             <div class="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
             <div class="relative w-28 h-28 bg-emerald-50 dark:bg-emerald-900/40 border-4 border-emerald-100 dark:border-emerald-800/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
               <svg class="w-14 h-14 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
             </div>
           </div>
           <h3 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">ส่งคำร้องเรียบร้อยแล้ว!</h3>
           <div class="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 max-w-2xl mx-auto mb-10 border border-gray-100 dark:border-gray-800">
             <p class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
               ข้อมูลของคุณเข้าสู่ระบบฐานข้อมูลเรียบร้อยแล้ว<br/> 
               <span class="font-bold text-gray-900 dark:text-white">เจ้าหน้าที่ฝ่ายประเมินราคาจะทำการติดต่อกลับหาคุณภายใน 24 ชั่วโมง</span><br/>
               ผ่านหมายเลขโทรศัพท์ หรืออีเมลที่คุณได้แจ้งไว้
             </p>
           </div>
           <button @click="submitted = false" class="text-sm font-bold text-gray-500 hover:text-emerald-600 transition flex items-center gap-2 mx-auto">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
             สร้างคำร้องขอใบเสนอราคาอีกครั้ง
           </button>
        </div>

      </div>
    </div>
  </div>
</template>
