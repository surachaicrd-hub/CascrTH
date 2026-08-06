<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useToast } from '../composables/useToast'
import { isValidThaiPhone, isValidEmail } from '../composables/useValidation'
import { useTrackingStore } from '../stores/tracking'

const { showToast } = useToast()
const trackingStore = useTrackingStore()

const form = ref({
  name: '',
  phone: '',
  email: '',
  message: '',
  website: '', // Honeypot field for bots
  captchaAnswer: '', // User's answer to the math question
  _ts: Date.now() // Timestamp to check submit speed
})

const isSubmitting = ref(false)
const submitted = ref(false)
const successContainer = ref(null)

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

// Reset form including new timestamp and new CAPTCHA
const resetForm = () => {
  form.value = {
    name: '',
    phone: '',
    email: '',
    message: '',
    website: '',
    captchaAnswer: '',
    _ts: Date.now()
  }
  generateCaptcha()
}

// Dynamic contact info from API
const contact = ref({
  contact_company_name: 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
  contact_address: '75/110 หมู่ 11 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
  contact_map_embed: '',
  contact_working_hours: ''
})

// Multi-entry contact lists
const phones = ref([])
const emails = ref([])
const lines = ref([])
const socialFacebook = ref('')
const socialTiktok = ref('')
const socialYoutube = ref('')

const loadContact = async () => {
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.success) {
      for (const key of Object.keys(contact.value)) {
        if (data.data[key] !== undefined && data.data[key] !== '') {
          contact.value[key] = data.data[key]
        }
      }
      // Parse JSON arrays
      if (data.data.contact_phones) {
        try {
          const parsed = JSON.parse(data.data.contact_phones)
          if (parsed.length > 0) phones.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_emails) {
        try {
          const parsed = JSON.parse(data.data.contact_emails)
          if (parsed.length > 0) emails.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_lines) {
        try {
          const parsed = JSON.parse(data.data.contact_lines)
          if (parsed.length > 0) lines.value = parsed
        } catch (e) { /* keep default */ }
      }
      if (data.data.contact_facebook_url) socialFacebook.value = data.data.contact_facebook_url
      if (data.data.contact_tiktok_url) socialTiktok.value = data.data.contact_tiktok_url
      if (data.data.contact_youtube_url) socialYoutube.value = data.data.contact_youtube_url
    }
  } catch (error) {
    // Silently fail — use defaults
    console.error('Failed to load contact settings:', error)
  }
}

const submitContact = async () => {
  if (!form.value.name || !form.value.phone || !form.value.email || !form.value.message || !form.value.captchaAnswer) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning')
    return
  }

  // Validate phone & email format
  if (!isValidThaiPhone(form.value.phone)) {
    showToast('เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก', 'error')
    return
  }
  if (!isValidEmail(form.value.email)) {
    showToast('รูปแบบอีเมลไม่ถูกต้อง', 'error')
    return
  }

  // Validate math CAPTCHA on frontend first
  const expectedAnswer = captchaConfig.value.num1 + captchaConfig.value.num2
  if (parseInt(form.value.captchaAnswer) !== expectedAnswer) {
    showToast('คำตอบการยืนยันไม่ถูกต้อง กรุณาลองใหม่', 'error')
    generateCaptcha()
    return
  }

  isSubmitting.value = true
  try {
    const res = await fetch('/api/contact-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form.value,
        captchaConfig: captchaConfig.value // send config to backend for validation
      })
    })
    
    if (res.ok) {
      submitted.value = true
      showToast('ส่งข้อความสำเร็จแล้ว เราจะรีบติดต่อกลับโดยเร็วที่สุด', 'success')
      trackingStore.trackEvent({
        type: 'submit_lead',
        leadType: 'contact_form',
        subject: form.value.message.substring(0, 50)
      })
      resetForm()

      await nextTick()
      if (successContainer.value) {
        const y = successContainer.value.getBoundingClientRect().top + window.scrollY - 150
        window.scrollTo({ top: y, behavior: 'smooth' })
      }
    } else {
      const errorData = await res.json().catch(() => null)
      showToast(errorData?.error || 'เกิดข้อผิดพลาดในการส่งข้อความ', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ในขณะนี้', 'error')
  } finally {
    isSubmitting.value = false
  }
}

// Add Structured Data (JSON-LD) for Contact Page
const addStructuredData = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": settingsStore.storeName ? `ติดต่อเรา - ${settingsStore.storeName}` : 'ติดต่อเรา',
    "description": "ติดต่อและสอบถามข้อมูลเพิ่มเติมเกี่ยวกับสินค้าและบริการติดตั้งบ้านเก็บของ",
    "mainEntity": {
      "@type": "LocalBusiness",
      "name": contact.value.contact_company_name,
      "telephone": phones.value.length > 0 ? phones.value[0].value : '',
      "email": emails.value.length > 0 ? emails.value[0].value : '',
      "address": {
        "@type": "PostalAddress",
        "streetAddress": contact.value.contact_address,
        "addressCountry": "TH"
      }
    }
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  script.id = 'json-ld-contact'
  document.head.appendChild(script)
}

onMounted(async () => {
  await loadContact()
  addStructuredData()
})

onUnmounted(() => {
  const script = document.getElementById('json-ld-contact')
  if (script) {
    document.head.removeChild(script)
  }
})
</script>

<template>
  <div class="bg-white dark:bg-[#0C0E14] min-h-screen transition-colors duration-500">
    
    <!-- ══════════════════════════════════════════════
         HERO HEADER SECTION (Matching Services page style)
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
        <div class="text-center md:text-left">
          <!-- Eyebrow Pill -->
          <div class="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-emerald-400 text-[10px] font-bold tracking-[0.2em] uppercase">GET IN TOUCH</span>
          </div>
          
          <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            ติดต่อสอบถามข้อมูล <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">และร่วมพูดคุยกับเรา</span>
          </h1>
          <p class="mt-3 text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            เราพร้อมให้คำปรึกษา แนะนำ และดูแลท่านโดยทีมงานวิศวกรผู้เชี่ยวชาญ สแตนด์บายทุกวันทำการเพื่อให้บริการคุณอย่างรวดเร็วที่สุด
          </p>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════
         MAIN CONTENT GRID
    ══════════════════════════════════════════════ -->
    <main class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <!-- LEFT COLUMN: Contact Information Card (5 Columns) -->
        <div class="lg:col-span-5 space-y-8">
          
          <!-- Card 1: ช่องทางการติดต่อด่วน -->
          <div class="bg-white dark:bg-[#111622] rounded-3xl shadow-xl border border-slate-200/50 dark:border-white/[0.04] p-8 transition-all duration-300 hover:shadow-2xl">
            <h2 class="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <span class="w-1.5 h-6 rounded-full bg-emerald-500"></span>
              ช่องทางการติดต่อด่วน
            </h2>
            
            <div class="space-y-6">
              <!-- Phone number list -->
              <div v-if="phones.length > 0" class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div class="space-y-2 flex-grow">
                  <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">โทรศัพท์</h3>
                  <div class="divide-y divide-slate-100 dark:divide-white/[0.03]">
                    <div v-for="(phone, i) in phones" :key="'phone-'+i" class="py-2 first:pt-0 last:pb-0 flex items-center justify-between group">
                      <div>
                        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500" v-if="phone.name">{{ phone.name }}</p>
                        <p class="text-base font-bold text-slate-700 dark:text-slate-200 transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400">{{ phone.value }}</p>
                      </div>
                      <a :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')" class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition-all active:scale-95">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Email list -->
              <div v-if="emails.length > 0" class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div class="space-y-2 flex-grow">
                  <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">อีเมล</h3>
                  <div class="divide-y divide-slate-100 dark:divide-white/[0.03]">
                    <div v-for="(email, i) in emails" :key="'email-'+i" class="py-2 first:pt-0 last:pb-0 flex items-center justify-between group">
                      <div>
                        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500" v-if="email.name">{{ email.name }}</p>
                        <p class="text-base font-bold text-slate-700 dark:text-slate-200 transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400 break-all">{{ email.value }}</p>
                      </div>
                      <a :href="'mailto:' + email.value" class="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition-all active:scale-95">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <!-- LINE Official list -->
              <div v-if="lines.length > 0" class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div class="space-y-2 flex-grow">
                  <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">LINE Official</h3>
                  <div class="divide-y divide-slate-100 dark:divide-white/[0.03]">
                    <div v-for="(line, i) in lines" :key="'line-'+i" class="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 group">
                      <div>
                        <p class="text-xs font-semibold text-slate-400 dark:text-slate-500" v-if="line.name">{{ line.name }}</p>
                        <p class="text-base font-bold text-slate-700 dark:text-slate-200 transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400">{{ line.value }}</p>
                      </div>
                      <a v-if="line.url" :href="line.url" target="_blank" class="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-green-500/25 transition-all active:scale-95">
                        <span>เพิ่มเพื่อน</span>
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Card 2: ข้อมูลที่ตั้ง & เวลาทำการ -->
          <div class="bg-white dark:bg-[#111622] rounded-3xl shadow-xl border border-slate-200/50 dark:border-white/[0.04] p-8 transition-all duration-300 hover:shadow-2xl">
            <h2 class="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <span class="w-1.5 h-6 rounded-full bg-emerald-500"></span>
              ที่ตั้งสำนักงานใหญ่
            </h2>
            
            <div class="space-y-6">
              <!-- Company & Address details -->
              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">สำนักงานใหญ่</h3>
                  <h4 class="font-bold text-slate-800 dark:text-white text-base leading-snug">{{ contact.contact_company_name }}</h4>
                  <p class="font-light text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{{ contact.contact_address }}</p>
                </div>
              </div>

              <!-- Working Hours -->
              <div class="flex gap-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <h3 class="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">เวลาเปิดทำการ</h3>
                  <p class="font-bold text-slate-700 dark:text-slate-300 text-sm">{{ contact.contact_working_hours }}</p>
                </div>
              </div>

              <!-- Social Media Links -->
              <div v-if="socialFacebook || socialTiktok || socialYoutube" class="pt-4 border-t border-slate-100 dark:border-white/[0.03]">
                <h3 class="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">ช่องทางติดตามอื่นๆ</h3>
                <div class="flex items-center gap-3">
                  <a v-if="socialFacebook" :href="socialFacebook" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-[#1877F2] dark:hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95" title="Facebook">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a v-if="socialTiktok" :href="socialTiktok" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-950 dark:hover:bg-white dark:hover:text-black hover:text-white hover:border-slate-950 flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95" title="TikTok">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/></svg>
                  </a>
                  <a v-if="socialYoutube" :href="socialYoutube" target="_blank" class="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-[#FF0000] dark:hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] flex items-center justify-center transition-all duration-300 hover:-translate-y-1 active:scale-95" title="YouTube">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Contact Form Container (7 Columns) -->
        <div class="lg:col-span-7">
          
          <div class="bg-white/80 dark:bg-[#111622]/80 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/50 dark:border-white/[0.04] p-8 lg:p-10 transition-all duration-300">
            <h2 class="text-2xl font-black text-slate-800 dark:text-white mb-2">ฝากข้อความถึงเรา</h2>
            <p class="text-sm font-light text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              กรอกข้อมูลติดต่อด้านล่างเพื่อรับการปรึกษาอย่างรวดเร็ว โดยทีมวิศวกรฝ่ายขายจะติดต่อกลับท่านภายใน 1-2 ชั่วโมง
            </p>

            <form @submit.prevent="submitContact" v-if="!submitted" class="space-y-6">
              <!-- Name Input -->
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                  ชื่อ - นามสกุลผู้ติดต่อ <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    v-model="form.name" 
                    required 
                    placeholder="ตัวอย่าง: นายวริทธิ์ อรุณ" 
                    class="w-full pl-11 pr-5 py-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white transition-all duration-300"
                  >
                </div>
              </div>

              <!-- Phone & Email Inputs in responsive grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Phone Input -->
                <div>
                  <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                    เบอร์โทรศัพท์ติดต่อ <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </span>
                    <input 
                      type="tel" 
                      v-model="form.phone" 
                      required 
                      placeholder="08x-xxx-xxxx" 
                      class="w-full pl-11 pr-5 py-3.5 border bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white transition-all duration-300"
                      :class="form.phone && !isValidThaiPhone(form.phone) ? 'border-rose-400 dark:border-rose-500/60 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'"
                    >
                  </div>
                  <p v-if="form.phone && !isValidThaiPhone(form.phone)" class="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                    เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก
                  </p>
                </div>

                <!-- Email Input -->
                <div>
                  <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                    อีเมล <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg class="w-5 h-5 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      v-model="form.email" 
                      required 
                      placeholder="name@example.com" 
                      class="w-full pl-11 pr-5 py-3.5 border bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white transition-all duration-300"
                      :class="form.email && !isValidEmail(form.email) ? 'border-rose-400 dark:border-rose-500/60 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'"
                    >
                  </div>
                  <p v-if="form.email && !isValidEmail(form.email)" class="text-[11px] text-rose-500 dark:text-rose-400 mt-1.5 font-medium flex items-center gap-1">
                    <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                    รูปแบบอีเมลไม่ถูกต้อง
                  </p>
                </div>
              </div>

              <!-- Message Input -->
              <div>
                <label class="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5">
                  เรื่องที่ต้องการติดต่อ / สอบถาม <span class="text-rose-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute top-4 left-4 flex items-start pointer-events-none">
                    <svg class="w-5 h-5 text-slate-400 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                  </span>
                  <textarea 
                    v-model="form.message" 
                    required 
                    rows="5" 
                    placeholder="กรุณาระบุความต้องการหรือเรื่องที่ท่านต้องการติดต่ออย่างละเอียด..." 
                    class="w-full pl-11 pr-5 py-3.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-white transition-all duration-300 resize-none"
                  ></textarea>
                </div>
              </div>
              
              <!-- AI Human Verification (Modern CAPTCHA quiz) -->
              <div class="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/80 dark:to-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-white/[0.03] shadow-inner relative overflow-hidden">
                <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>
                  <div>
                    <label class="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">ตรวจสอบความปลอดภัย <span class="text-rose-500">*</span></label>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 font-light">คำนวณผลลัพธ์และคลิกเลือกข้อที่ถูกต้อง เพื่อปลดล็อคการส่งฟอร์ม</p>
                  </div>
                </div>
                
                <div class="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                  <div class="bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-200/50 dark:border-slate-800 font-mono text-xl font-black text-slate-800 dark:text-slate-200 tracking-wider shadow-sm flex items-center gap-2">
                    <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num1 }}</span> 
                    <span class="text-slate-400 font-normal">+</span> 
                    <span class="text-emerald-600 dark:text-emerald-400">{{ captchaConfig.num2 }}</span> 
                    <span class="text-slate-400 font-normal">=</span>
                  </div>
                  
                  <div class="flex gap-2.5 w-full sm:w-auto">
                    <button 
                      v-for="opt in captchaConfig.options" :key="opt"
                      type="button"
                      @click="form.captchaAnswer = opt"
                      :class="[
                        'flex-1 sm:flex-none w-14 h-12 rounded-xl border text-base font-black transition-all duration-300 transform active:scale-95',
                        form.captchaAnswer === opt 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-white dark:ring-offset-[#111622]' 
                          : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/35 dark:hover:bg-emerald-950/20'
                      ]"
                    >
                      {{ opt }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Honeypot field (hidden from users, visible to bots) -->
              <div class="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <label>Website URL</label>
                <input type="text" v-model="form.website" tabindex="-1" autocomplete="nope">
              </div>
              
              <!-- Submit Button -->
              <button 
                :disabled="isSubmitting" 
                type="submit" 
                class="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-sm tracking-wider uppercase"
              >
                {{ isSubmitting ? 'กำลังส่งข้อมูล...' : 'ส่งข้อความหาทีมงาน' }}
              </button>
              
              <p class="text-[11px] text-center text-slate-400 dark:text-slate-500 font-light mt-4 leading-relaxed">
                ข้อมูลส่วนบุคคลของคุณจะได้รับการปกป้องอย่างเคร่งครัดตามพ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
              </p>
            </form>

            <!-- Success State -->
            <div ref="successContainer" v-else class="text-center py-8 px-4 bg-emerald-50/50 dark:bg-emerald-950/15 rounded-3xl p-10 border border-emerald-100/50 dark:border-emerald-900/25">
              <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-emerald-600 dark:text-emerald-400">
                <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white mb-3">ส่งข้อความสำเร็จเรียบร้อย!</h3>
              <p class="text-slate-600 dark:text-slate-400 mb-8 font-light text-sm max-w-sm mx-auto leading-relaxed">
                ทางเราได้รับข้อความติดต่อของท่านแล้ว ทีมวิศวกรฝ่ายขายจะรีบประเมินข้อมูลและติดต่อกลับภายในช่วงเวลาทำการ 1-2 ชั่วโมง ขอบคุณครับ
              </p>
              <button @click="submitted = false" class="text-emerald-600 dark:text-emerald-400 font-bold hover:text-emerald-500 hover:underline transition-all active:scale-95 text-sm">
                ส่งข้อความใหม่อีกครั้ง
              </button>
            </div>

          </div>
        </div>
        
      </div>
    </main>

    <!-- ══════════════════════════════════════════════
         OFFICE LOCATION MAP SECTION (Window Mockup)
    ══════════════════════════════════════════════ -->
    <section v-if="contact.contact_map_embed" class="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white dark:bg-[#111622] rounded-3xl overflow-hidden border border-slate-200/50 dark:border-white/[0.04] shadow-xl">
        <!-- Window Mockup Title bar -->
        <div class="bg-slate-50 dark:bg-slate-900/60 px-6 py-4 border-b border-slate-100 dark:border-white/[0.03] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-rose-500"></span>
            <span class="w-3 h-3 rounded-full bg-amber-400"></span>
            <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
          </div>
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">Office Location Map</span>
          <div class="w-12"></div>
        </div>
        
        <!-- Google Map Iframe Container -->
        <div class="relative w-full h-[380px] sm:h-[450px]">
          <iframe 
            :src="contact.contact_map_embed" 
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen="" 
            referrerpolicy="no-referrer-when-downgrade" 
            class="absolute inset-0 w-full h-full filter dark:invert-[90%] dark:hue-rotate-180 opacity-90 hover:opacity-100 hover:filter-none transition-all duration-700"
          ></iframe>
        </div>
      </div>
    </section>

  </div>
</template>

