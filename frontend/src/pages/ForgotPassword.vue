<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <!-- Step 1: Enter Email -->
      <div v-if="!submitted">
        <div class="text-center mb-8">
          <div class="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">ลืมรหัสผ่าน</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้</p>
        </div>
        
        <form @submit.prevent="handleSubmit">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">อีเมล</label>
            <input 
              v-model="email" 
              type="email" 
              required
              placeholder="your@email.com"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>
          
          <button 
            type="submit" 
            :disabled="loading"
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading">กำลังส่ง...</span>
            <span v-else>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
          </button>
        </form>
        
        <p v-if="errorMsg" class="mt-4 text-center text-sm text-red-500">{{ errorMsg }}</p>
      </div>
      
      <!-- Step 2: Success Message -->
      <div v-else class="text-center">
        <div class="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">ตรวจสอบอีเมลของคุณ</h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">
          หากอีเมล <strong>{{ email }}</strong> มีอยู่ในระบบ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้
        </p>
        <router-link 
          to="/?login=true" 
          class="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </router-link>
      </div>
      
      <div class="mt-6 text-center">
        <router-link to="/?login=true" class="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
          ← กลับไปหน้าเข้าสู่ระบบ
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiFetch } from '../utils/apiFetch'

const email = ref('')
const loading = ref(false)
const submitted = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await apiFetch('/api/users/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.value })
    })
    const data = await response.json()
    if (data.success) {
      submitted.value = true
    } else {
      errorMsg.value = data.error || 'เกิดข้อผิดพลาด'
    }
  } catch (err) {
    errorMsg.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
  } finally {
    loading.value = false
  }
}
</script>
