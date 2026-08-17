<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from '../composables/useToast'
import { isValidThaiPhone, isValidEmail } from '../composables/useValidation'
import { useTrackingStore } from '../stores/tracking'
import { useSEO } from '../composables/useSEO'
import { useSettingsStore } from '../stores/settingsStore'

const { showToast } = useToast()
const trackingStore = useTrackingStore()
const settingsStore = useSettingsStore()
const { setMeta, setStructuredData } = useSEO()

// Contact form state
const form = ref({
  name: '',
  phone: '',
  email: '',
  subject: 'สอบถามข้อมูลสินค้าและบริการ',
  message: '',
  website: '', // Honeypot field for bot spam prevention
  captchaAnswer: '', // User's answer to the math question
  _ts: Date.now() // Timestamp to check submit speed
})

const subjectOptions = [
  'สอบถามข้อมูลสินค้าและบริการ',
  'ขอใบเสนอราคา / สั่งซื้อสินค้า',
  'ปรึกษาการออกแบบและติดตั้งโรงเก็บของ',
  'บริการหลังการขาย / การรับประกัน',
  'เรื่องอื่นๆ'
]

const isSubmitting = ref(false)
const submitted = ref(false)
const successContainer = ref(null)
const copiedField = ref(null)

// Math CAPTCHA logic
const captchaConfig = ref({ num1: 0, num2: 0, operator: '+', options: [] })

const generateCaptcha = () => {
  const n1 = Math.floor(Math.random() * 8) + 2
  const n2 = Math.floor(Math.random() * 8) + 1
  const correct = n1 + n2
  
  // Generate 2 wrong but plausible answers
  let wrong1, wrong2
  do { 
    wrong1 = correct + (Math.floor(Math.random() * 5) - 2) 
  } while (wrong1 === correct || wrong1 < 1)
  
  do { 
    wrong2 = correct + (Math.floor(Math.random() * 7) - 3) 
  } while (wrong2 === correct || wrong2 === wrong1 || wrong2 < 1)
  
  const options = [correct, wrong1, wrong2].sort(() => Math.random() - 0.5)
  
  captchaConfig.value = { num1: n1, num2: n2, operator: '+', options }
  form.value.captchaAnswer = ''
}

// Generate upfront
generateCaptcha()

// Reset form including new timestamp and new CAPTCHA
const resetForm = () => {
  form.value = {
    name: '',
    phone: '',
    email: '',
    subject: 'สอบถามข้อมูลสินค้าและบริการ',
    message: '',
    website: '',
    captchaAnswer: '',
    _ts: Date.now()
  }
  generateCaptcha()
}

// Dynamic contact info from Admin / API Settings with real fallbacks
const contact = ref({
  contact_company_name: settingsStore.contactCompanyName || settingsStore.companyLegalName || settingsStore.storeName || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
  contact_address: settingsStore.contactAddress || settingsStore.storeAddress || '75/110 หมู่ 11 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
  contact_map_embed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3873.0!2d100.64!3d14.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTTCsDA0JzEyLjAiTiAxMDDCsDM4JzI0LjAiRQ!5e0!3m2!1sth!2sth!4v1600000000000',
  contact_working_hours: settingsStore.contactWorkingHours || 'จันทร์ - ศุกร์ 08:00 - 17:00 น.'
})

// Multi-entry contact lists with verified default values
const defaultPhones = [
  { name: 'ฝ่ายขายและบริการลูกค้า', value: '02-908-1348 ต่อ 9' },
  { name: 'สายด่วนฝ่ายขาย 1', value: '089-199-3873' },
  { name: 'สายด่วนฝ่ายขาย 2', value: '090-886-5389' }
]

const phones = ref(settingsStore.contactPhones?.length > 0 ? settingsStore.contactPhones : defaultPhones)
const emails = ref(settingsStore.contactEmails?.length > 0 ? settingsStore.contactEmails : [])
const lines = ref(settingsStore.contactLines?.length > 0 ? settingsStore.contactLines : [])
const socialFacebook = ref(settingsStore.contactFacebookUrl || '')
const socialTiktok = ref(settingsStore.contactTiktokUrl || '')
const socialYoutube = ref(settingsStore.contactYoutubeUrl || '')

// Real-time Business Hours Checker (ICT / UTC+7)
const isBusinessOpen = computed(() => {
  try {
    const now = new Date()
    // Convert to Thai time (UTC+7)
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
    const thaiDate = new Date(utc + (3600000 * 7))
    const day = thaiDate.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = thaiDate.getHours()
    const minute = thaiDate.getMinutes()
    const currentTime = hour * 60 + minute

    // Monday (1) to Friday (5), 08:00 (480 mins) to 17:00 (1020 mins)
    const isOpenDay = day >= 1 && day <= 5
    const isOpenTime = currentTime >= 480 && currentTime < 1020
    return isOpenDay && isOpenTime
  } catch (e) {
    return true
  }
})

// Copy text utility with visual feedback
const copyToClipboard = async (text, fieldKey) => {
  if (!text) return
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-999999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copiedField.value = fieldKey
    showToast('คัดลอกข้อมูลเรียบร้อยแล้ว', 'success')
    setTimeout(() => {
      if (copiedField.value === fieldKey) {
        copiedField.value = null
      }
    }, 2500)
  } catch (err) {
    console.error('Failed to copy:', err)
    showToast('ไม่สามารถคัดลอกได้ กรุณาลองใหม่', 'error')
  }
}

// Load dynamic settings from API
const loadContact = async () => {
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      settingsStore.initializeSettings(data.data)
      
      if (data.data.contact_company_name) contact.value.contact_company_name = data.data.contact_company_name
      if (data.data.contact_address) contact.value.contact_address = data.data.contact_address
      if (data.data.contact_working_hours) contact.value.contact_working_hours = data.data.contact_working_hours
      if (data.data.contact_map_embed) contact.value.contact_map_embed = data.data.contact_map_embed

      if (data.data.contact_phones) {
        try {
          const parsed = typeof data.data.contact_phones === 'string' ? JSON.parse(data.data.contact_phones) : data.data.contact_phones
          if (Array.isArray(parsed) && parsed.length > 0) phones.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_emails) {
        try {
          const parsed = typeof data.data.contact_emails === 'string' ? JSON.parse(data.data.contact_emails) : data.data.contact_emails
          if (Array.isArray(parsed) && parsed.length > 0) emails.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_lines) {
        try {
          const parsed = typeof data.data.contact_lines === 'string' ? JSON.parse(data.data.contact_lines) : data.data.contact_lines
          if (Array.isArray(parsed) && parsed.length > 0) lines.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_facebook_url) socialFacebook.value = data.data.contact_facebook_url
      if (data.data.contact_tiktok_url) socialTiktok.value = data.data.contact_tiktok_url
      if (data.data.contact_youtube_url) socialYoutube.value = data.data.contact_youtube_url
    }
  } catch (error) {
    console.error('Failed to load contact settings:', error)
  }
}

// Submit contact form
const submitContact = async () => {
  if (!form.value.name || !form.value.phone || !form.value.email || !form.value.message || !form.value.captchaAnswer) {
    showToast('กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมายดอกจัน (*)', 'warning')
    return
  }

  // Validate phone & email format
  if (!isValidThaiPhone(form.value.phone)) {
    showToast('เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมีความยาว 9-10 หลัก', 'error')
    return
  }
  if (!isValidEmail(form.value.email)) {
    showToast('รูปแบบที่อยู่อีเมลไม่ถูกต้อง', 'error')
    return
  }

  // Validate math CAPTCHA on frontend
  const expectedAnswer = captchaConfig.value.num1 + captchaConfig.value.num2
  if (parseInt(form.value.captchaAnswer) !== expectedAnswer) {
    showToast('คำตอบการยืนยันความปลอดภัยไม่ถูกต้อง กรุณาเลือกใหม่', 'error')
    generateCaptcha()
    return
  }

  isSubmitting.value = true
  try {
    const combinedMessage = `[หัวข้อ: ${form.value.subject}]\n\n${form.value.message}`
    const res = await fetch('/api/contact-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        message: combinedMessage,
        captchaConfig: captchaConfig.value
      })
    })
    
    if (res.ok) {
      submitted.value = true
      showToast('ส่งข้อความสำเร็จแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด', 'success')
      trackingStore.trackEvent({
        type: 'submit_lead',
        leadType: 'contact_form',
        subject: form.value.subject
      })
      resetForm()

      await nextTick()
      if (successContainer.value) {
        const y = successContainer.value.getBoundingClientRect().top + window.scrollY - 120
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    } else {
      const errorData = await res.json().catch(() => null)
      showToast(errorData?.error || 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้ กรุณาติดต่อผ่านโทรศัพท์หรือ LINE', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Structured Data (JSON-LD) for SEO
const addStructuredData = () => {
  const companyName = contact.value.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด'
  setMeta({
    title: `ติดต่อเรา - ${companyName}`,
    description: 'ช่องทางการติดต่อ สอบถามข้อมูลสินค้า โรงเก็บของพรีเมียม เบอร์โทรศัพท์ LINE อีเมล และที่อยู่สำนักงานใหญ่',
    canonicalUrl: window.location.href,
    type: 'website'
  })

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": `ติดต่อเรา - ${companyName}`,
    "description": "ช่องทางการติดต่อ สอบถามข้อมูลสินค้าและบริการ ขอใบเสนอราคา",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": companyName,
      "telephone": phones.value.length > 0 ? phones.value[0].value : '02-908-1348',
      "email": emails.value.length > 0 ? emails.value[0].value : '',
      "address": {
        "@type": "PostalAddress",
        "streetAddress": contact.value.contact_address,
        "addressCountry": "TH"
      }
    }
  }, 'dynamic-structured-data')

  setStructuredData({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${window.location.origin}/` },
      { "@type": "ListItem", "position": 2, "name": "ติดต่อเรา", "item": window.location.href }
    ]
  }, 'dynamic-breadcrumb-data')
}

// FAQ Items State with Real Operational Data
const faqs = ref([
  {
    q: 'ต้องการเข้ามาชมสินค้าตัวจริงที่โชว์รูม ต้องทำการนัดหมายล่วงหน้าหรือไม่?',
    a: 'ท่านสามารถเดินทางเข้ามาชมสินค้าตัวอย่างได้ในวันและเวลาทำการ (จันทร์ - ศุกร์ 08:00 - 17:00 น.) ณ สำนักงานใหญ่และคลังสินค้า อำเภอคลองหลวง จังหวัดปทุมธานี ทั้งนี้เพื่อความสะดวกรวดเร็วและให้เจ้าหน้าที่ผู้เชี่ยวชาญเตรียมข้อมูลต้อนรับ แนะนำให้นัดหมายล่วงหน้าผ่านทาง LINE หรือโทรศัพท์',
    icon: 'building',
    tag: 'การเข้าชมโชว์รูม',
    open: true
  },
  {
    q: 'การขอใบเสนอราคาใช้เวลานานเท่าใด และมีค่าใช้จ่ายหรือไม่?',
    a: 'การขอใบเสนอราคาไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น สำหรับสินค้ามาตรฐานทางฝ่ายขายสามารถจัดส่งเอกสารใบเสนอราคาพร้อมรายละเอียดให้ท่านผ่านทางอีเมลหรือ LINE ภายใน 1-2 ชั่วโมงทำการ สำหรับโครงการสั่งทำพิเศษหรือมีงานฐานรากเพิ่มเติมจะใช้เวลาประเมินไม่เกิน 24 ชั่วโมง',
    icon: 'document',
    tag: 'ใบเสนอราคา',
    open: false
  },
  {
    q: 'มีบริการจัดส่งและประกอบติดตั้งทั่วประเทศหรือไม่?',
    a: 'เรามีทีมช่างผู้ชำนาญการพร้อมให้บริการจัดส่งและติดตั้งครอบคลุมทั่วประเทศไทย พร้อมการรับประกันงานติดตั้งและโครงสร้างมาตรฐาน โดยท่านสามารถแจ้งพื้นที่หน้างานเพื่อให้ฝ่ายขายตรวจสอบคิวงานและค่าบริการจัดส่งติดตั้งตามระยะทางได้โดยตรง',
    icon: 'truck',
    tag: 'การจัดส่งและติดตั้ง',
    open: false
  },
  {
    q: 'สามารถออกใบกำกับภาษีเต็มรูปแบบได้หรือไม่?',
    a: 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด จดทะเบียนภาษีมูลค่าเพิ่มถูกต้องตามกฎหมาย สามารถออกใบกำกับภาษีเต็มรูปแบบ (e-Tax / เอกสารตัวจริง) สำหรับลูกค้านิติบุคคล บริษัท องค์กร หน่วยงานราชการ และบุคคลธรรมดาได้ทุกคำสั่งซื้อ',
    icon: 'receipt',
    tag: 'ใบกำกับภาษี',
    open: false
  }
])

const toggleFaq = (index) => {
  faqs.value[index].open = !faqs.value[index].open
}

const heroBg = computed(() => {
  return contact.value.contact_hero_bg || settingsStore.contactHeroBg || '/images/hero/contact-hero.jpg'
})

onMounted(async () => {
  await loadContact()
  addStructuredData()
})
</script>

<template>
  <div class="bg-slate-50/50 dark:bg-[#090C12] min-h-screen transition-colors duration-500 font-sans text-slate-800 dark:text-slate-100">
    
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
      
      <!-- Subtle Atmospheric Ambient Glows -->
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
          <span class="text-emerald-400 font-semibold">ติดต่อเรา</span>
        </nav>

        <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div class="max-w-3xl">
            <!-- Eyebrow Pill -->
            <div class="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
              <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"/>
              </svg>
              <span class="text-emerald-400 text-[11px] font-bold tracking-[0.2em] uppercase">OFFICIAL CONTACT CHANNELS</span>
            </div>
            
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
              ศูนย์บริการและติดต่อ <br/>
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-teal-400">
                {{ contact.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}
              </span>
            </h1>
            
            <p class="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl font-light">
              ยินดีต้อนรับสู่ช่องทางติดต่ออย่างเป็นทางการ ทีมวิศวกรและฝ่ายบริการลูกค้าพร้อมให้คำปรึกษา แนะนำขนาดพื้นที่ ประเมินราคา และประสานงานจัดส่งติดตั้งอย่างรวดเร็วและมืออาชีพ
            </p>
          </div>

          <!-- Real-Time Business Status Card -->
          <div class="bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 sm:p-6 lg:max-w-xs w-full shrink-0">
            <div class="flex items-center justify-between gap-3 mb-3">
              <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะเวลาทำการ</span>
              <span 
                v-if="isBusinessOpen" 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
              >
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                เปิดทำการอยู่
              </span>
              <span 
                v-else 
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30"
              >
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                ปิดทำการขณะนี้
              </span>
            </div>
            <div class="flex items-start gap-2.5 text-xs text-slate-300">
              <svg class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p class="font-bold text-white">{{ contact.contact_working_hours }}</p>
                <p class="text-[11px] text-slate-400 mt-0.5">หยุดวันเสาร์ - อาทิตย์ และวันหยุดนักขัตฤกษ์</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- =========================================================================
         VALUE PROPOSITION / HIGHLIGHTS BAR
         ========================================================================= -->
    <section class="relative z-20 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div class="bg-white dark:bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 flex items-center gap-3.5 transition-transform duration-300 hover:-translate-y-1">
          <div class="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ให้คำปรึกษาฟรี</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">แนะนำรุ่นและขนาดที่เหมาะสม</p>
          </div>
        </div>

        <div class="bg-white dark:bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 flex items-center gap-3.5 transition-transform duration-300 hover:-translate-y-1">
          <div class="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">ใบเสนอราคาด่วน</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">ออกเอกสารครบถ้วน รวดเร็ว</p>
          </div>
        </div>

        <div class="bg-white dark:bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 flex items-center gap-3.5 transition-transform duration-300 hover:-translate-y-1">
          <div class="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">โชว์รูมและคลังสินค้า</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">มีสถานที่จริง พร้อมสต็อกสินค้า</p>
          </div>
        </div>

        <div class="bg-white dark:bg-[#10141D] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-white/[0.06] shadow-lg shadow-slate-900/5 dark:shadow-black/20 flex items-center gap-3.5 transition-transform duration-300 hover:-translate-y-1">
          <div class="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">รับประกันสินค้า</h4>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">ดูแลและบริการหลังการขาย</p>
          </div>
        </div>

      </div>
    </section>

    <!-- =========================================================================
         MAIN CONTENT: 2-COLUMN GRID (Direct Channels + Inquiry Form)
         ========================================================================= -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        <!-- LEFT COLUMN: Contact Details & Office (5 Columns) -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Card 1: Direct Fast Contact Channels -->
          <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span class="w-2 h-5 rounded-full bg-emerald-500"></span>
                ช่องทางการติดต่อโดยตรง
              </h2>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">DIRECT CHANNELS</span>
            </div>
            
            <div class="space-y-6">
              <!-- Phone Numbers -->
              <div v-if="phones.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                  </div>
                  <h3 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">เบอร์โทรศัพท์</h3>
                </div>

                <div class="space-y-2.5">
                  <div 
                    v-for="(phone, i) in phones" 
                    :key="'phone-'+i" 
                    class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between gap-3 group transition-colors hover:border-emerald-500/40"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate" v-if="phone.name">{{ phone.name }}</p>
                      <p class="text-sm sm:text-base font-bold text-slate-800 dark:text-white font-mono tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                        {{ phone.value }}
                      </p>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <!-- Copy Button -->
                      <button 
                        type="button"
                        @click="copyToClipboard(phone.value, 'phone-'+i)"
                        class="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95 text-xs"
                        :title="copiedField === 'phone-'+i ? 'คัดลอกแล้ว' : 'คัดลอกเบอร์โทร'"
                      >
                        <svg v-if="copiedField === 'phone-'+i" class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </button>

                      <!-- Call Button -->
                      <a 
                        :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')" 
                        class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                        <span>โทรออก</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- LINE Official -->
              <div v-if="lines.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-[#06C755]/10 text-[#06C755] flex items-center justify-center">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                    </svg>
                  </div>
                  <h3 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">LINE Official</h3>
                </div>

                <div class="space-y-2.5">
                  <div 
                    v-for="(line, i) in lines" 
                    :key="'line-'+i" 
                    class="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-3 group"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate" v-if="line.name">{{ line.name }}</p>
                      <p class="text-sm font-bold text-slate-800 dark:text-white font-mono">
                        {{ line.value }}
                      </p>
                    </div>

                    <a 
                      :href="line.url || ('https://line.me/ti/p/~' + (line.value || '').replace(/^@/, ''))" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white font-bold text-xs shadow-md shadow-[#06C755]/25 transition-all active:scale-95 shrink-0"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
                      </svg>
                      <span>เพิ่มเพื่อน LINE</span>
                    </a>
                  </div>
                </div>
              </div>

              <!-- Emails -->
              <div v-if="emails.length > 0">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <h3 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">อีเมลติดต่อ</h3>
                </div>

                <div class="space-y-2.5">
                  <div 
                    v-for="(email, i) in emails" 
                    :key="'email-'+i" 
                    class="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between gap-3 group transition-colors hover:border-blue-500/40"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate" v-if="email.name">{{ email.name }}</p>
                      <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white font-mono break-all group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                        {{ email.value }}
                      </p>
                    </div>

                    <div class="flex items-center gap-1.5 shrink-0">
                      <button 
                        type="button"
                        @click="copyToClipboard(email.value, 'email-'+i)"
                        class="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 transition-all active:scale-95"
                        :title="copiedField === 'email-'+i ? 'คัดลอกแล้ว' : 'คัดลอกอีเมล'"
                      >
                        <svg v-if="copiedField === 'email-'+i" class="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      </button>

                      <a 
                        :href="'mailto:' + email.value" 
                        class="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95"
                        title="ส่งอีเมล"
                      >
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Social Media Channels -->
              <div v-if="socialFacebook || socialTiktok || socialYoutube" class="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                <h3 class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">ติดตามข่าวสารและรีวิว</h3>
                <div class="flex items-center gap-3">
                  <a 
                    v-if="socialFacebook" 
                    :href="socialFacebook" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="w-11 h-11 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white border border-[#1877F2]/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    title="Facebook Page"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>

                  <a 
                    v-if="socialTiktok" 
                    :href="socialTiktok" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="w-11 h-11 rounded-2xl bg-slate-900/10 dark:bg-white/10 hover:bg-black dark:hover:bg-white text-slate-900 dark:text-white dark:hover:text-black hover:text-white border border-slate-300 dark:border-white/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    title="TikTok Account"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
                    </svg>
                  </a>

                  <a 
                    v-if="socialYoutube" 
                    :href="socialYoutube" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="w-11 h-11 rounded-2xl bg-[#FF0000]/10 hover:bg-[#FF0000] text-[#FF0000] hover:text-white border border-[#FF0000]/20 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
                    title="YouTube Channel"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>

            </div>
          </div>

          <!-- Card 2: Company Headquarters & Location Details -->
          <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span class="w-2 h-5 rounded-full bg-teal-500"></span>
                ที่ตั้งสำนักงานใหญ่
              </h2>
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">HEADQUARTERS</span>
            </div>

            <div class="space-y-5">
              <!-- Company Name & Address -->
              <div class="flex gap-3.5">
                <div class="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 mt-1">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div class="space-y-1 flex-1">
                  <h4 class="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                    {{ contact.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }}
                  </h4>
                  <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {{ contact.contact_address || '75/110 หมู่ 11 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120' }}
                  </p>
                  <p v-if="settingsStore.storeTaxId" class="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                    เลขประจำตัวผู้เสียภาษี: {{ settingsStore.storeTaxId }}
                  </p>
                </div>
              </div>

              <!-- Quick Action Buttons for Address -->
              <div class="flex flex-wrap gap-2 pt-2">
                <button 
                  type="button"
                  @click="copyToClipboard(contact.contact_address, 'address')"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all active:scale-95"
                >
                  <svg v-if="copiedField === 'address'" class="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ copiedField === 'address' ? 'คัดลอกที่อยู่แล้ว' : 'คัดลอกที่อยู่' }}</span>
                </button>

                <a 
                  :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((contact.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด') + ' ' + (contact.contact_address || ''))"
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200/60 dark:border-teal-800/40 text-xs font-semibold transition-all active:scale-95"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  <span>เปิด Google Maps นำทาง</span>
                </a>
              </div>

              <!-- Working Schedule -->
              <div class="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-start gap-3.5">
                <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">วันและเวลาเปิดทำการ</h4>
                  <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                    {{ contact.contact_working_hours }}
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    (ปิดทำการวันเสาร์ - อาทิตย์ และวันหยุดตามประเพณี)
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: Contact & Inquiry Form (7 Columns) -->
        <div class="lg:col-span-7">
          <div class="bg-white dark:bg-[#10141D] rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
            
            <div class="mb-8">
              <div class="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold tracking-wider uppercase">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <span>ONLINE INQUIRY FORM</span>
              </div>
              <h2 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                ฝากข้อความถึงฝ่ายขายและบริการ
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                กรอกข้อมูลความต้องการของท่านด้านล่าง ทีมวิศวกรฝ่ายขายจะประเมินรายละเอียดและติดต่อกลับท่านภายใน 1-2 ชั่วโมงทำการ
              </p>
            </div>

            <!-- Contact Form -->
            <form @submit.prevent="submitContact" v-if="!submitted" class="space-y-6">
              
              <!-- Full Name -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  ชื่อ - นามสกุล ผู้ติดต่อ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    v-model="form.name" 
                    required 
                    placeholder="ระบุชื่อและนามสกุลของคุณ" 
                    class="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                </div>
              </div>

              <!-- Phone & Email (2 Columns) -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <!-- Phone -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    เบอร์โทรศัพท์ติดต่อ <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </span>
                    <input 
                      type="tel" 
                      v-model="form.phone" 
                      required 
                      placeholder="08X-XXX-XXXX" 
                      class="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                      :class="form.phone && !isValidThaiPhone(form.phone) ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-slate-800'"
                    >
                  </div>
                  <p v-if="form.phone && !isValidThaiPhone(form.phone)" class="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก
                  </p>
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    อีเมล <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      v-model="form.email" 
                      required 
                      placeholder="yourname@example.com" 
                      class="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                      :class="form.email && !isValidEmail(form.email) ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-slate-800'"
                    >
                  </div>
                  <p v-if="form.email && !isValidEmail(form.email)" class="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    รูปแบบอีเมลไม่ถูกต้อง
                  </p>
                </div>
              </div>

              <!-- Subject Selector -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  เรื่องที่ต้องการติดต่อ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                  </span>
                  <select 
                    v-model="form.subject" 
                    required 
                    class="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option v-for="opt in subjectOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </span>
                </div>
              </div>

              <!-- Message Detail -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  รายละเอียดข้อความ / ความต้องการ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute top-3.5 left-4 flex items-start pointer-events-none text-slate-400">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                    </svg>
                  </span>
                  <textarea 
                    v-model="form.message" 
                    required 
                    rows="4" 
                    placeholder="ระบุรุ่นสินค้า ขนาดพื้นที่จัดเก็บ หรือคำถามที่ท่านต้องการสอบถามทีมงาน..." 
                    class="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <!-- Security Math Verification Quiz -->
              <div class="p-4 sm:p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      ระบบยืนยันความปลอดภัย <span class="text-rose-500">*</span>
                    </label>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400">เลือกคำตอบที่ถูกต้องเพื่อยืนยันว่าท่านไม่ใช่โปรแกรมอัตโนมัติ</p>
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3">
                  <!-- Math Problem Box -->
                  <div class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-base font-black text-slate-800 dark:text-slate-200 tracking-wider shadow-sm flex items-center justify-center gap-2">
                    <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num1 }}</span> 
                    <span class="text-slate-400 font-normal">+</span> 
                    <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num2 }}</span> 
                    <span class="text-slate-400 font-normal">=</span>
                    <span class="text-slate-400">?</span>
                  </div>
                  
                  <!-- Option Buttons -->
                  <div class="flex gap-2 w-full sm:w-auto">
                    <button 
                      v-for="opt in captchaConfig.options" 
                      :key="opt"
                      type="button"
                      @click="form.captchaAnswer = opt"
                      :class="[
                        'flex-1 sm:flex-none w-12 sm:w-14 h-11 rounded-xl border text-sm font-black transition-all duration-200 active:scale-95',
                        form.captchaAnswer === opt 
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500'
                      ]"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Honeypot Field (Invisible to human users, traps spam bots) -->
              <div class="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <label for="contact-website">Website URL</label>
                <input id="contact-website" type="text" v-model="form.website" tabindex="-1" autocomplete="off">
              </div>

              <!-- Submit Button -->
              <div>
                <button 
                  :disabled="isSubmitting" 
                  type="submit" 
                  class="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <svg v-if="isSubmitting" class="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                  <span>{{ isSubmitting ? 'กำลังดำเนินการส่งข้อมูล...' : 'ส่งข้อความติดต่อฝ่ายขาย' }}</span>
                </button>
              </div>

              <!-- Privacy Notice with Icon -->
              <div class="flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-light text-center">
                <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
                <span>ข้อมูลติดต่อของท่านจะได้รับการดูแลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) อย่างเคร่งครัด</span>
              </div>

            </form>

            <!-- Success State Screen -->
            <div ref="successContainer" v-else class="text-center py-10 px-4 bg-emerald-500/5 dark:bg-emerald-950/20 rounded-3xl border border-emerald-500/20">
              <div class="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-600 dark:text-emerald-400">
                <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
                ส่งข้อความสำเร็จเรียบร้อยแล้ว
              </h3>
              
              <p class="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6 font-light">
                ทางเราได้รับข้อความติดต่อของท่านแล้ว เจ้าหน้าที่ฝ่ายขายและวิศวกรจะตรวจสอบรายละเอียดและติดต่อกลับท่านตามเบอร์โทรหรืออีเมลที่ระบุไว้โดยเร็วที่สุด
              </p>

              <button 
                type="button"
                @click="submitted = false" 
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-md"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>ส่งข้อความเรื่องอื่นเพิ่มเติม</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </main>

    <!-- =========================================================================
         OFFICE LOCATION MAP SECTION
         ========================================================================= -->
    <section v-if="contact.contact_map_embed" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="bg-white dark:bg-[#10141D] rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/[0.06] shadow-xl shadow-slate-900/5 dark:shadow-black/20">
        
        <!-- Header Bar -->
        <div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">แผนที่ตั้งสำนักงานใหญ่และคลังสินค้า</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ contact.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด' }} - ปทุมธานี</p>
            </div>
          </div>

          <a 
            :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((contact.contact_company_name || 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด') + ' ' + (contact.contact_address || ''))"
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <svg class="w-3.5 h-3.5 text-teal-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            <span>เปิดแอปแผนที่ขนาดใหญ่</span>
          </a>
        </div>
        
        <!-- Google Map Iframe Container -->
        <div class="relative w-full h-[360px] sm:h-[440px] bg-slate-100 dark:bg-slate-900">
          <iframe 
            :src="contact.contact_map_embed" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade" 
            class="absolute inset-0 w-full h-full"
          ></iframe>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         FREQUENTLY ASKED QUESTIONS (Elevated Enterprise Accordion)
         ========================================================================= -->
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <!-- Section Title & Subtitle -->
      <div class="text-center max-w-2xl mx-auto mb-12">
        <div class="inline-flex items-center gap-2 mb-3.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wider uppercase backdrop-blur-sm">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span>คำถามที่พบบ่อย (FAQ)</span>
        </div>
        
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          ข้อสงสัยเกี่ยวกับการติดต่อและรับบริการ
        </h2>
        <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed font-light">
          รวบรวมข้อมูลสำคัญสำหรับลูกค้า เพื่อความสะดวกรวดเร็วในการติดต่อ สอบถามขนาด และขอรับบริการ
        </p>
      </div>

      <!-- FAQ Accordion Cards Grid -->
      <div class="space-y-4">
        <div 
          v-for="(faq, i) in faqs" 
          :key="'faq-'+i"
          class="rounded-2xl border transition-all duration-300 overflow-hidden"
          :class="faq.open 
            ? 'bg-white dark:bg-[#111622] border-emerald-500/40 dark:border-emerald-500/30 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
            : 'bg-white dark:bg-[#10141D] border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md'"
        >
          <button 
            type="button"
            @click="toggleFaq(i)"
            class="w-full px-5 sm:px-7 py-5 text-left flex items-center justify-between gap-4 group transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-3.5 sm:gap-4.5 min-w-0 flex-1">
              <!-- Item Dedicated Icon -->
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                :class="faq.open 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25' 
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'"
              >
                <!-- Building Icon (Showroom) -->
                <svg v-if="faq.icon === 'building'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <!-- Document Icon (Quotation) -->
                <svg v-else-if="faq.icon === 'document'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <!-- Truck Icon (Delivery) -->
                <svg v-else-if="faq.icon === 'truck'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 11-4 0m4 0H17m-4-6h5l2 5"/>
                </svg>
                <!-- Receipt / Tax Icon -->
                <svg v-else-if="faq.icon === 'receipt'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                </svg>
                <!-- Default Help -->
                <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>

              <!-- Question & Tag -->
              <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {{ faq.tag }}
                  </span>
                </div>
                <h3 
                  class="font-bold text-sm sm:text-base leading-snug transition-colors"
                  :class="faq.open ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'"
                >
                  {{ faq.q }}
                </h3>
              </div>
            </div>

            <!-- Toggle Arrow Indicator -->
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 border"
              :class="faq.open 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rotate-180' 
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-emerald-500/30 group-hover:text-emerald-500'"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </button>

          <!-- Accordion Answer Area -->
          <div 
            v-show="faq.open" 
            class="px-5 sm:px-7 pb-6 pt-2 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-slate-900/30 transition-all"
          >
            <div class="sm:pl-14">
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">
                {{ faq.a }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Direct Support Prompt Card -->
      <div class="mt-10 rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-white/[0.08] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-4 text-center sm:text-left">
          <div class="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <div>
            <h4 class="text-base sm:text-lg font-bold text-white">ยังมีคำถามหรือข้อสงสัยเพิ่มเติม?</h4>
            <p class="text-xs sm:text-sm text-slate-400 font-light mt-0.5">
              ทีมวิศวกรและเจ้าหน้าที่ฝ่ายขายพร้อมให้คำแนะนำและตอบทุกคำถาม
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 shrink-0 w-full sm:w-auto">
          <a 
            v-if="phones.length > 0"
            :href="'tel:' + phones[0].value.replace(/[^0-9+]/g, '')"
            class="inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/15 backdrop-blur-sm transition-all duration-200 active:scale-95 shadow-sm min-w-[160px]"
          >
            <svg class="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <span class="whitespace-nowrap">โทรสายด่วน</span>
          </a>

          <a 
            v-if="lines.length > 0"
            :href="lines[0].url || ('https://line.me/ti/p/~' + (lines[0].value || '').replace(/^@/, ''))"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center justify-center gap-2.5 px-6 h-12 rounded-xl bg-[#06C755] hover:bg-[#05B34C] text-white text-sm font-bold shadow-lg shadow-[#06C755]/25 transition-all duration-200 active:scale-95 min-w-[160px]"
          >
            <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.966 8.887 9.539 9.613.385.082.906.262 1.042.6.12.3.05.748.024 1.036l-.16 1.94c-.039.232-.178 1.066.938.595 1.114-.47 6.012-3.542 8.441-6.234 2.802-3.09 4.176-5.834 4.176-7.55z"/>
            </svg>
            <span class="whitespace-nowrap">สอบถามผ่าน LINE</span>
          </a>
        </div>
      </div>

    </section>

  </div>
</template>
