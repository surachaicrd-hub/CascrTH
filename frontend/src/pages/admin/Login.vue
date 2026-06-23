<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const router = useRouter()

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    const data = await res.json()
    
    if (data.success) {
      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminUser', JSON.stringify(data.admin))
      router.push('/admin')
    } else {
      error.value = data.error || 'Login failed'
    }
  } catch (err) {
    console.error('Login error', err)
    error.value = 'Failed to connect to server'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
        <span class="font-black text-3xl">M</span>
      </div>
      <h2 class="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">Admin System</h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        เข้าสู่ระบบจัดการข้อมูลเว็บไซต์ <span class="font-bold text-emerald-600">Morespace</span>
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-10 px-6 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-12">
        <form class="space-y-6" @submit.prevent="handleLogin">
          
          <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold text-center">
            {{ error }}
          </div>

          <div>
            <label for="username" class="block text-sm font-bold tracking-wide text-gray-700">ชื่อผู้ใช้งาน (Username)</label>
            <div class="mt-2">
              <input id="username" v-model="username" type="text" required class="appearance-none block w-full px-4 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors">
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-bold tracking-wide text-gray-700">รหัสผ่าน (Password)</label>
            <div class="mt-2 relative">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required class="appearance-none block w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors">
              <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none" aria-label="Toggle password visibility">
                <svg v-if="!showPassword" class="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="h-5 w-5 text-emerald-500 hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50">
              {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ Admin' }}
            </button>
          </div>
        </form>
        
        <div class="mt-8">
           <router-link to="/" class="flex items-center justify-center w-full px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            กลับสู่หน้าแรกเว็บไซต์
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
