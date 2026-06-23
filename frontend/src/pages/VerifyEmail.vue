<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isVerifying = ref(true)
const statusMessage = ref('กำลังตรวจสอบความถูกต้องของรหัสยืนยัน...')
const isSuccess = ref(false)

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    statusMessage.value = 'ไม่พบรหัสยืนยัน (Token)'
    isVerifying.value = false
    return
  }

  try {
    const res = await fetch('/api/users/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    const data = await res.json()

    if (data.success) {
      isSuccess.value = true
      statusMessage.value = 'ยืนยันอีเมลสำเร็จ! บัญชีของคุณใช้งานได้ 100% แล้ว'
      if (authStore.user) {
        authStore.updateProfile({ is_email_verified: 1 })
      }
    } else {
      isSuccess.value = false
      statusMessage.value = data.error || 'การยืนยันอีเมลล้มเหลว'
    }
  } catch (error) {
    statusMessage.value = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ โปรดลองใหม่อีกครั้ง'
  } finally {
    isVerifying.value = false
  }
})

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-[70vh] flex items-center justify-center p-4 bg-gray-50 dark:bg-[#0a0f16]">
    <div class="bg-white dark:bg-[#111827] rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg w-full text-center border border-gray-100 dark:border-gray-800">
      
      <div v-if="isVerifying" class="flex flex-col items-center">
        <svg class="animate-spin h-16 w-16 text-emerald-500 mb-6" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-2">กำลังยืนยันอีเมล...</h2>
        <p class="text-gray-500 dark:text-gray-400">{{ statusMessage }}</p>
      </div>

      <div v-else-if="isSuccess" class="flex flex-col items-center">
        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 text-emerald-500">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-2">ยืนยันอีเมลสำเร็จ!</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-8">{{ statusMessage }}</p>
        <button @click="goHome" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full transition-transform hover:-translate-y-1 shadow-lg shadow-emerald-500/30">
          กลับสู่หน้าหลัก
        </button>
      </div>

      <div v-else class="flex flex-col items-center">
        <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 text-red-500">
          <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </div>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-2">พบข้อผิดพลาด</h2>
        <p class="text-red-500 dark:text-red-400 mb-8">{{ statusMessage }}</p>
        <button @click="goHome" class="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:-translate-y-1">
          กลับสู่หน้าหลัก
        </button>
      </div>

    </div>
  </div>
</template>
