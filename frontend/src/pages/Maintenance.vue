<script setup>
import { useSettingsStore } from '../stores/settingsStore'

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="min-h-screen bg-[#fafbfc] flex flex-col justify-between items-center relative overflow-hidden font-sans">
    
    <!-- Performant Animated Background Elements -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-[10%] -right-[5%] w-[50vh] h-[50vh] md:w-[800px] md:h-[800px] rounded-full bg-gradient-to-bl from-emerald-100/60 to-teal-50/20 opacity-70 animate-float-slow mix-blend-multiply"></div>
      <div class="absolute -bottom-[10%] -left-[5%] w-[50vh] h-[50vh] md:w-[800px] md:h-[800px] rounded-full bg-gradient-to-tr from-indigo-100/60 to-blue-50/20 opacity-70 animate-float-medium mix-blend-multiply"></div>
      
      <!-- Graphic Grid pattern for a modern "technical" feel -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNlN2U1ZTQiLz48L3N2Zz4=')] opacity-30"></div>
    </div>

    <!-- Main Full-Screen Container -->
    <div class="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow p-6 md:p-12 animate-fade-in-up">
      
      <!-- Store Logo -->
      <div class="flex justify-center mb-12 opacity-0 animate-fade-in-up delay-100 fill-mode-forwards">
        <template v-if="settingsStore.storeLogo">
          <img :src="settingsStore.storeLogo" alt="Store Logo" class="h-16 md:h-24 w-auto object-contain drop-shadow-sm" />
        </template>
        <template v-else>
          <div class="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            <span class="font-black text-3xl md:text-4xl">{{ settingsStore.storeName ? settingsStore.storeName.charAt(0).toUpperCase() : 'M' }}</span>
          </div>
        </template>
      </div>

      <!-- Animated Hero Icon -->
      <div class="flex justify-center mb-10 opacity-0 animate-fade-in-up delay-200 fill-mode-forwards">
        <div class="relative flex items-center justify-center w-32 h-32 md:w-40 md:h-40">
          <!-- Outer Spinning Rings -->
          <svg class="absolute inset-0 w-full h-full text-emerald-500/20 animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="16 8" />
          </svg>
          <svg class="absolute inset-2 w-[84%] h-[84%] text-indigo-500/20 animate-spin-reverse" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 6" />
          </svg>
          
          <!-- Inner Glowing Core -->
          <div class="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] relative group">
            <svg class="w-10 h-10 md:w-12 md:h-12 text-white relative z-10 animate-pulse-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <!-- Sparkle -->
            <svg class="w-6 h-6 md:w-8 md:h-8 text-yellow-300 absolute -top-3 -right-3 animate-bounce-custom" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
          </div>
        </div>
      </div>

      <!-- Title & Message -->
      <div class="opacity-0 animate-fade-in-up delay-300 fill-mode-forwards mb-16 text-center">
        <h1 class="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">อยู่ระหว่างปิดปรับปรุงระบบ</h1>
        
        <!-- Animated loading dots -->
        <div class="flex justify-center items-center gap-2 mb-8">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot delay-150"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot delay-300"></div>
        </div>

        <p class="text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto font-medium">
          {{ settingsStore.maintenanceMessage || 'ขออภัยค่ะ ขณะนี้เว็บไซต์อยู่ระหว่างการปรับปรุงระบบชั่วคราว กรุณาติดต่อทางไลน์หรือโทรศัพท์' }}
        </p>
      </div>

      <!-- Explicit Contact Information (Full Width Grid) -->
      <div class="w-full text-left opacity-0 animate-fade-in-up delay-400 fill-mode-forwards max-w-3xl mx-auto">
        <div class="flex items-center justify-center gap-6 mb-10">
          <div class="h-px bg-gradient-to-r from-transparent to-gray-300 flex-1"></div>
          <h3 class="text-sm font-black text-gray-400 tracking-[0.2em] uppercase">ช่องทางติดต่อหลัก</h3>
          <div class="h-px bg-gradient-to-l from-transparent to-gray-300 flex-1"></div>
        </div>
        
        <div class="space-y-4 md:space-y-6">
          <!-- Address -->
          <div v-if="settingsStore.storeAddress" class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-6 md:p-8 w-full rounded-[2rem] hover:bg-white hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
            <div class="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
              <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div class="flex-1 text-center sm:text-left mt-2 sm:mt-0">
              <p class="font-bold text-gray-900 text-lg mb-1.5">ที่อยู่ติดต่อ</p>
              <p class="text-gray-500 text-base leading-relaxed">{{ settingsStore.storeAddress }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <!-- Phones -->
            <a v-for="(phone, i) in settingsStore.contactPhones" :key="'mp-'+i" :href="'tel:' + phone.value.replace(/[^0-9+]/g, '')" class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5 p-6 md:p-8 rounded-[2rem] border border-white/80 backdrop-blur-md bg-white/60 hover:bg-white hover:border-emerald-200 hover:shadow-[0_12px_40px_rgba(16,185,129,0.1)] transform hover:-translate-y-1 transition-all duration-300 group">
              <div class="flex-shrink-0 w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                 <svg viewBox="0 0 24 24" class="w-7 h-7 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.22 2 2 0 012.1 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/></svg>
              </div>
              <div class="flex-1 min-w-0 pt-1">
                <p class="text-[13px] text-gray-400 font-bold mb-1 tracking-widest uppercase">{{ phone.name || 'โทรศัพท์' }}</p>
                <p class="text-lg font-black text-gray-800 truncate group-hover:text-emerald-600 transition-colors">{{ phone.value }}</p>
              </div>
            </a>
            
            <!-- LINE -->
            <a v-for="(line, i) in settingsStore.contactLines" :key="'ml-'+i" :href="line.url || 'https://line.me/ti/p/~' + line.value" target="_blank" class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5 p-6 md:p-8 rounded-[2rem] border border-white/80 backdrop-blur-md bg-white/60 hover:bg-white hover:border-[#06C755]/40 hover:shadow-[0_12px_40px_rgba(6,199,85,0.1)] transform hover:-translate-y-1 transition-all duration-300 group">
              <div class="flex-shrink-0 w-16 h-16 rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center shadow-inner group-hover:bg-[#06C755] group-hover:text-white transition-colors duration-300">
                <svg viewBox="0 0 24 24" class="w-8 h-8 transition-transform group-hover:scale-110 duration-300" fill="currentColor"><path d="M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
              </div>
              <div class="flex-1 min-w-0 pt-1">
                <p class="text-[13px] text-gray-400 font-bold mb-1 tracking-widest uppercase">{{ line.name || 'LINE' }}</p>
                <p class="text-lg font-black text-gray-800 truncate group-hover:text-[#06C755] transition-colors">{{ line.value }}</p>
              </div>
            </a>

            <!-- EMAILS -->
            <a v-for="(email, i) in settingsStore.contactEmails" :key="'me-'+i" :href="'mailto:' + email.value" class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5 p-6 md:p-8 rounded-[2rem] border border-white/80 backdrop-blur-md bg-white/60 hover:bg-white hover:border-gray-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transform hover:-translate-y-1 transition-all duration-300 group sm:col-span-2">
              <div class="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shadow-inner group-hover:bg-gray-800 group-hover:text-white transition-colors duration-300">
                <svg viewBox="0 0 24 24" class="w-7 h-7 transition-transform group-hover:scale-110 duration-300" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div class="flex-1 min-w-0 pt-1">
                <p class="text-[13px] text-gray-400 font-bold mb-1 tracking-widest uppercase">{{ email.name || 'อีเมล' }}</p>
                <p class="text-lg font-black text-gray-800 truncate group-hover:text-gray-900 transition-colors">{{ email.value }}</p>
              </div>
            </a>

            <!-- FACEBOOK -->
            <a v-if="settingsStore.contactFacebookUrl" :href="settingsStore.contactFacebookUrl" target="_blank" class="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-5 p-6 md:p-8 rounded-[2rem] border border-white/80 backdrop-blur-md bg-white/60 hover:bg-white hover:border-[#1877F2]/40 hover:shadow-[0_12px_40px_rgba(24,119,242,0.1)] transform hover:-translate-y-1 transition-all duration-300 group sm:col-span-2">
              <div class="flex-shrink-0 w-16 h-16 rounded-full bg-[#1877F2]/10 text-[#1877F2] flex items-center justify-center shadow-inner group-hover:bg-[#1877F2] group-hover:text-white transition-colors duration-300">
                <svg viewBox="0 0 24 24" class="w-7 h-7 transition-transform group-hover:scale-110 duration-300" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </div>
              <div class="flex-1 min-w-0 pt-1">
                <p class="text-[13px] text-gray-400 font-bold mb-1 tracking-widest uppercase">Facebook</p>
                <p class="text-lg font-black text-gray-800 truncate group-hover:text-[#1877F2] transition-colors">เพจหลักของเรา</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Minimum Footer -->
    <div class="w-full text-center px-4 py-8 opacity-0 animate-fade-in-up delay-500 fill-mode-forwards z-10">
      <p class="text-[12px] text-gray-400 font-medium tracking-[0.2em] uppercase">
        &copy; {{ new Date().getFullYear() }} {{ settingsStore.storeName || 'MORESPACE' }}. All rights reserved.
      </p>
    </div>
  </div>
</template>

<style scoped>
/* Keyframes for High-Performance CSS Animations */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -40px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(0.95); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

@keyframes bounce-custom {
  0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
  50% { transform: translateY(-4px) scale(1.1); opacity: 0.8; }
}

/* Utility Classes for Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-float-slow {
  animation: float 25s ease-in-out infinite;
  will-change: transform;
}

.animate-float-medium {
  animation: float 20s ease-in-out infinite reverse;
  will-change: transform;
}

.animate-spin-slow {
  animation: spin-slow 20s linear infinite;
  will-change: transform;
}

.animate-spin-reverse {
  animation: spin-reverse 25s linear infinite;
  will-change: transform;
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;
}

.animate-pulse-dot {
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.animate-bounce-custom {
  animation: bounce-custom 3s ease-in-out infinite;
}

/* Delays */
.delay-100 { animation-delay: 100ms; }
.delay-150 { animation-delay: 150ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-400 { animation-delay: 400ms; }
.delay-500 { animation-delay: 500ms; }

.fill-mode-forwards {
  animation-fill-mode: forwards;
}
</style>
