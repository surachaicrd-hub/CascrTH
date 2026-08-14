<script setup>
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'
import { GoogleLogin } from 'vue3-google-login'
import { useSettingsStore } from '../stores/settingsStore'

const { proxy } = getCurrentInstance()
const pubSettings = proxy.$pubSettings || {}
const googleEnabled = pubSettings.google_login_enabled === 'true'
const lineEnabled = pubSettings.line_login_enabled === 'true'
const lineChannelId = pubSettings.line_channel_id || ''

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const router = useRouter()
const settingsStore = useSettingsStore()

const isLoginTab = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  first_name: '',
  last_name: ''
})

// Anti-bot: multiple choice math challenge
const botNum1 = ref(0)
const botNum2 = ref(0)
const botChoices = ref([])
const botSelected = ref(null)
const generateBotChallenge = () => {
  botNum1.value = Math.floor(Math.random() * 10) + 1
  botNum2.value = Math.floor(Math.random() * 10) + 1
  botSelected.value = null
  const correct = botNum1.value + botNum2.value
  const wrongSet = new Set()
  while (wrongSet.size < 2) {
    const offset = Math.floor(Math.random() * 5) + 1
    const wrong = Math.random() > 0.5 ? correct + offset : correct - offset
    if (wrong !== correct && wrong > 0) wrongSet.add(wrong)
  }
  const all = [correct, ...wrongSet]
  // Shuffle
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]]
  }
  botChoices.value = all
}
generateBotChallenge()

// Email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => !form.email || emailRegex.test(form.email))

// Password strength
const passwordStrength = computed(() => {
  const p = form.password
  if (!p) return { score: 0, label: '', color: '' }
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  if (score <= 1) return { score: 1, label: 'อ่อนมาก', color: 'bg-red-500' }
  if (score === 2) return { score: 2, label: 'อ่อน', color: 'bg-orange-500' }
  if (score === 3) return { score: 3, label: 'ปานกลาง', color: 'bg-yellow-500' }
  if (score === 4) return { score: 4, label: 'แข็งแรง', color: 'bg-emerald-500' }
  return { score: 5, label: 'แข็งแรงมาก', color: 'bg-emerald-600' }
})

const passwordsMatch = computed(() => !form.confirmPassword || form.password === form.confirmPassword)

const switchTab = (toLogin) => {
  isLoginTab.value = toLogin
  errorMessage.value = ''
  successMessage.value = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  form.first_name = ''
  form.last_name = ''
  showPassword.value = false
  showConfirmPassword.value = false
  generateBotChallenge()
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // Frontend validations for registration
  if (!isLoginTab.value) {
    if (!emailRegex.test(form.email)) {
      errorMessage.value = 'กรุณากรอกอีเมลให้ถูกรูปแบบ เช่น user@example.com'
      return
    }
    if (form.password.length < 6) {
      errorMessage.value = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
      return
    }
    if (form.password !== form.confirmPassword) {
      errorMessage.value = 'รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง'
      return
    }
    const correctAnswer = botNum1.value + botNum2.value
    if (botSelected.value === null || botSelected.value !== correctAnswer) {
      errorMessage.value = 'กรุณาเลือกคำตอบที่ถูกต้องเพื่อยืนยันตัวตน'
      generateBotChallenge()
      return
    }
  }

  isLoading.value = true

  try {
    const endpoint = isLoginTab.value ? '/api/users/login' : '/api/users/register'
    const payload = isLoginTab.value
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, first_name: form.first_name, last_name: form.last_name, source: localStorage.getItem('registration_source') || 'organic' }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()

    if (!data.success) {
      errorMessage.value = data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    } else {
      successMessage.value = isLoginTab.value ? 'เข้าสู่ระบบสำเร็จ! กำลังพาท่านไป...' : 'สมัครสมาชิกสำเร็จ! กำลังเข้าสู่ระบบ...'
      authStore.login(data.data, data.data.token)
      
      setTimeout(() => {
        closeModal()
      }, 1500)
    }
  } catch (err) {
    errorMessage.value = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
  } finally {
    isLoading.value = false
  }
}

const closeModal = () => {
  emit('close')
  setTimeout(() => switchTab(true), 300)
}

const handleGoogleLogin = async (response) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const credential = response.credential || response.access_token
    if (!credential) {
      errorMessage.value = 'ไม่ได้รับสิทธิ์จาก Google กรุณาลองใหม่'
      isLoading.value = false
      return
    }

    const res = await fetch('/api/users/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, source: localStorage.getItem('registration_source') || 'organic' })
    })
    const data = await res.json()
    if (data.success) {
      successMessage.value = 'เข้าสู่ระบบด้วย Google สำเร็จ!'
      authStore.login(data.data, data.data.token)
      setTimeout(() => closeModal(), 1500)
    } else {
      errorMessage.value = data.error || 'ตรวจสอบ Token ล้มเหลว'
    }
  } catch(e) {
    errorMessage.value = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
  } finally {
    isLoading.value = false
  }
}

const handleLineLogin = () => {
  if (!lineChannelId) {
    errorMessage.value = 'ระบบ LINE Login ยังไม่ได้ตั้งค่า Channel ID กรุณาติดต่อแอดมิน'
    return
  }
  
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/line/callback`)
  const state = Math.random().toString(36).substring(2, 15)
  localStorage.setItem('line_oauth_state', state)
  
  const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${lineChannelId}&redirect_uri=${redirectUri}&state=${state}&scope=profile%20openid%20email`
  
  window.location.href = lineAuthUrl
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <!-- Modal Content -->
    <div class="relative bg-white dark:bg-[#111827] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto" style="scrollbar-width: none; -ms-overflow-style: none;">
      
      <!-- Header Background -->
      <div class="h-28 bg-[#0220A4] relative flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 opacity-20">
          <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="modal-pattern" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" stroke-width="2" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#modal-pattern)"/></svg>
        </div>
        <div class="z-10 flex items-center gap-3">
          <template v-if="settingsStore.storeLogo">
            <img :src="settingsStore.storeLogo" alt="Store Logo" class="h-10 w-auto max-w-[120px] object-contain bg-white rounded-xl p-1.5 shadow-lg" />
          </template>
          <template v-else>
            <div class="w-10 h-10 bg-white text-[#0220A4] rounded-xl flex items-center justify-center shadow-lg">
              <span class="font-black text-xl">{{ (settingsStore.storeName || 'M')[0].toUpperCase() }}</span>
            </div>
          </template>
          <span v-if="settingsStore.storeName" class="text-xl md:text-2xl font-black tracking-widest uppercase text-white">{{ settingsStore.storeName }}</span>
        </div>
        
        <button @click="closeModal" class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-20">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-100 dark:border-gray-800">
        <button 
          @click="switchTab(true)" 
          class="flex-1 py-4 text-center font-bold text-sm transition-colors relative"
          :class="isLoginTab ? 'text-[#0220A4] dark:text-[#5B7CFF]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
        >
          เข้าสู่ระบบ
          <div v-if="isLoginTab" class="absolute bottom-0 left-0 w-full h-0.5 bg-[#0220A4] dark:bg-[#5B7CFF]"></div>
        </button>
        <button 
          @click="switchTab(false)" 
          class="flex-1 py-4 text-center font-bold text-sm transition-colors relative"
          :class="!isLoginTab ? 'text-[#0220A4] dark:text-[#5B7CFF]' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
        >
          สมัครสมาชิกใหม่
          <div v-if="!isLoginTab" class="absolute bottom-0 left-0 w-full h-0.5 bg-[#0220A4] dark:bg-[#5B7CFF]"></div>
        </button>
      </div>

      <div class="p-6 sm:p-8">
        <!-- Messages -->
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-center gap-2">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Register Only: Name Fields -->
          <div v-if="!isLoginTab" class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อ <span class="text-red-500">*</span></label>
              <input v-model="form.first_name" type="text" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0220A4] focus:border-[#0220A4] outline-none transition-colors dark:text-white sm:text-sm">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">นามสกุล</label>
              <input v-model="form.last_name" type="text" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0220A4] focus:border-[#0220A4] outline-none transition-colors dark:text-white sm:text-sm">
            </div>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">อีเมล</label>
            <input v-model="form.email" type="email" required class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-[#0220A4] focus:border-[#0220A4] outline-none transition-colors dark:text-white sm:text-sm" :class="form.email && !isEmailValid ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'" placeholder="your@email.com">
            <p v-if="form.email && !isEmailValid" class="mt-1 text-xs text-red-500">กรุณากรอกอีเมลให้ถูกรูปแบบ</p>
          </div>

          <!-- Password -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300">รหัสผ่าน</label>
              <button type="button" v-if="isLoginTab" @click.prevent="closeModal(); router.push('/forgot-password')" class="text-xs text-[#0220A4] dark:text-[#5B7CFF] hover:underline cursor-pointer">ลืมรหัสผ่าน?</button>
            </div>
            <div class="relative">
              <input v-model="form.password" :type="showPassword ? 'text' : 'password'" required minlength="6" class="w-full pl-4 pr-11 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#0220A4] focus:border-[#0220A4] outline-none transition-colors dark:text-white sm:text-sm" placeholder="••••••••">
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 flex items-center pr-3 z-10 focus:outline-none">
                <svg v-if="showPassword" class="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 9c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.13-5.24m5.94-2.285a9.35 9.35 0 013.468 1.058M21 12a10.024 10.024 0 01-4.13 5.24M3 3l18 18" />
                </svg>
              </button>
            </div>
            
            <!-- Password Strength Meter (Register only) -->
            <div v-if="!isLoginTab && form.password" class="mt-2">
              <div class="flex gap-1 mb-1">
                <div v-for="i in 5" :key="i" class="h-1.5 flex-1 rounded-full transition-all duration-300" :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700'"></div>
              </div>
              <p class="text-xs" :class="passwordStrength.score <= 2 ? 'text-red-500' : passwordStrength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'">
                ความแข็งแรง: {{ passwordStrength.label }}
              </p>
              <p v-if="passwordStrength.score <= 2" class="text-[10px] text-gray-400 mt-0.5">แนะนำ: ใช้ตัวพิมพ์ใหญ่ ตัวเลข อักขระพิเศษ ≥10 ตัว</p>
            </div>
          </div>

          <!-- Confirm Password (Register only) -->
          <div v-if="!isLoginTab">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">ยืนยันรหัสผ่าน <span class="text-red-500">*</span></label>
            <div class="relative">
              <input v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" required class="w-full pl-4 pr-11 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-[#0220A4] focus:border-[#0220A4] outline-none transition-colors dark:text-white sm:text-sm" :class="form.confirmPassword && !passwordsMatch ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-gray-700'" placeholder="••••••••">
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 flex items-center pr-3 z-10 focus:outline-none">
                <svg v-if="showConfirmPassword" class="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-400 dark:text-gray-500 hover:text-[#0220A4] dark:hover:text-[#5B7CFF] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.13-5.24m5.94-2.285a9.35 9.35 0 013.468 1.058M21 12a10.024 10.024 0 01-4.13 5.24M3 3l18 18" />
                </svg>
              </button>
            </div>
            <p v-if="form.confirmPassword && !passwordsMatch" class="mt-1 text-xs text-red-500">รหัสผ่านไม่ตรงกัน</p>
          </div>

          <!-- Bot Protection (Register only) -->
          <div v-if="!isLoginTab" class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 bg-[#F3F5FF] dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-700">
              <svg class="w-4 h-4 text-[#0220A4] dark:text-[#5B7CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span class="text-xs font-bold text-[#0220A4] dark:text-[#5B7CFF]">ตรวจสอบความเป็นคน <span class="text-red-500">*</span></span>
            </div>
            <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
              <p class="text-[11px] text-gray-500 dark:text-gray-400 mb-3">เลือกผลลัพธ์ที่ถูกต้องเพื่อปลดล็อคการสมัครสมาชิก</p>
              <div class="flex items-center gap-3">
                <span class="text-lg font-bold font-mono text-gray-800 dark:text-gray-200 tracking-wider">
                  {{ botNum1 }} <span class="text-[#0220A4]">+</span> {{ botNum2 }} <span class="text-[#0220A4]">=</span>
                </span>
                <div class="flex gap-2">
                  <button 
                    v-for="choice in botChoices" 
                    :key="choice" 
                    type="button" 
                    @click="botSelected = choice"
                    class="w-11 h-11 rounded-xl text-sm font-bold transition-all duration-200 border-2"
                    :class="botSelected === choice 
                      ? 'bg-[#0220A4] text-white border-[#0220A4] shadow-lg shadow-blue-900/30 scale-105' 
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:text-[#0220A4]'"
                  >
                    {{ choice }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isLoading || successMessage || (!isLoginTab && (!isEmailValid || !passwordsMatch || botSelected === null))"
            class="w-full mt-2 bg-[#0220A4] hover:bg-[#01166F] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            {{ isLoginTab ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก' }}
          </button>
        </form>

        <div class="mt-6" v-if="googleEnabled || lineEnabled">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-800"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-[#111827] text-gray-500 dark:text-gray-400 text-xs">หรือดำเนินการต่อด้วย</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-3" :class="{ 'grid-cols-2': googleEnabled && lineEnabled }">
            <GoogleLogin v-if="googleEnabled" :callback="handleGoogleLogin" popup-type="TOKEN">
              <button 
                type="button" 
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                title="Google Sign-In"
              >
                <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                <span>Google</span>
              </button>
            </GoogleLogin>
            <button 
              v-if="lineEnabled"
              type="button" 
              @click="handleLineLogin"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-transparent rounded-xl shadow-sm bg-[#06C755] hover:bg-[#05b04c] text-sm font-medium text-white transition-colors"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              <span>LINE</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
