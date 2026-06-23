<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const statusText = ref('กำลังเชื่อมต่อข้อมูลกับ LINE...')
const isLoading = ref(true)
const errorMessage = ref('')

let hasCalled = false

onMounted(async () => {
  if (hasCalled) return
  hasCalled = true
  try {
    const { code, state, error, error_description } = route.query
    
    if (error) {
      throw new Error(error_description || 'ถูกยกเลิก หรือไม่ได้รับอนุญาตให้ใช้ LINE Login')
    }

    if (!code) {
      throw new Error('ไม่พบข้อมูล Authorization Code')
    }

    // Verify CSRF state
    const savedState = localStorage.getItem('line_oauth_state')
    localStorage.removeItem('line_oauth_state')
    
    if (savedState && state !== savedState) {
       console.warn('State mismatch. Possible CSRF attack.')
    }

    const redirectUri = `${window.location.origin}/auth/line/callback`

    const res = await fetch('/api/users/auth/line', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirectUri })
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.error || 'การยืนยันตัวตนล้มเหลว')
    }

    // Success login
    authStore.login(data.data, data.data.token)
    statusText.value = 'เข้าสู่ระบบสำเร็จ! กำลังพาท่านกลับสู่หน้าหลัก...'
    
    setTimeout(() => {
        router.push('/')
    }, 1500)

  } catch(err) {
    statusText.value = ''
    errorMessage.value = err.message || 'เกิดข้อผิดพลาดจากระบบ'
    isLoading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-md rounded-3xl p-8 shadow-xl text-center border border-gray-100">
      
      <!-- Logo Display -->
      <div class="flex items-center justify-center gap-4 mb-8">
          <div class="w-16 h-16 bg-[#06C755] rounded-2xl flex items-center justify-center shadow-lg">
              <svg class="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
          </div>
          <div class="h-1 w-12 bg-gray-200 mx-2 relative overflow-hidden rounded-full">
              <div v-if="isLoading" class="absolute inset-0 bg-[#06C755] w-full animate-pulse"></div>
          </div>
          <div class="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-2xl">
              M
          </div>
      </div>

      <h1 class="text-2xl font-black text-gray-900 mb-2">LINE Login</h1>
      
      <div v-if="isLoading" class="space-y-4">
          <svg class="animate-spin h-10 w-10 text-[#06C755] mx-auto" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-600">{{ statusText }}</p>
      </div>

      <div v-if="!isLoading && errorMessage" class="space-y-6">
          <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 class="font-bold text-red-800 mb-1">เกิดข้อผิดพลาด</h3>
              <p class="text-red-600 text-sm">{{ errorMessage }}</p>
          </div>
          <button @click="router.push('/')" class="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md mt-4 hover:shadow-lg hover:-translate-y-0.5">
              กลับสู่หน้าหลัก
          </button>
      </div>
      
    </div>
  </div>
</template>
