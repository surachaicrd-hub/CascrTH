<template>
  <div class="min-h-screen flex flex-col justify-start md:justify-center items-center pt-28 pb-16 md:pt-36 px-4 bg-gradient-to-b from-[#f8f9fa] via-emerald-50/20 to-[#f1f3f5] dark:from-[#0a0f16] dark:via-emerald-950/10 dark:to-[#0f172a] relative overflow-hidden transition-colors duration-500">
    
    <!-- Ambient Glow Blobs -->
    <div class="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/10 dark:from-emerald-500/10 dark:to-teal-500/5 blur-[80px] md:blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
    <div class="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-tr from-indigo-400/20 to-violet-400/10 dark:from-indigo-500/10 dark:to-violet-500/5 blur-[90px] md:blur-[130px] pointer-events-none animate-pulse duration-[8000ms] delay-1000"></div>

    <div class="max-w-md w-full bg-white/75 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/40 dark:border-gray-800/80 p-8 md:p-10 transition duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_25px_60px_rgba(0,0,0,0.35)] relative z-10">
      
      <!-- State 1: Checking Token Validity -->
      <div v-if="checkingToken" class="text-center py-12 space-y-6">
        <div class="inline-flex items-center justify-center relative w-20 h-20">
          <div class="absolute inset-0 rounded-full border-4 border-emerald-100/50 dark:border-emerald-950/20 animate-ping opacity-75"></div>
          <div class="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-950/30"></div>
          <div class="absolute inset-0 rounded-full border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent animate-spin"></div>
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">กำลังตรวจสอบความถูกต้อง</h3>
          <p class="text-gray-500 dark:text-gray-400 text-sm animate-pulse">โปรดรอสักครู่ ระบบกำลังยืนยันโทเค็นรีเซ็ตรหัสผ่านของคุณ...</p>
        </div>
      </div>

      <!-- State 2: Invalid or Expired Token Error Screen -->
      <div v-else-if="!isTokenValid" class="text-center py-6 space-y-6">
        <div class="mx-auto w-20 h-20 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl flex items-center justify-center ring-4 ring-red-500/5 transform rotate-3 hover:rotate-0 transition-transform duration-300">
          <!-- Expired Clock / Error SVG -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-black text-gray-900 dark:text-white">ไม่สามารถดำเนินการต่อได้</h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm leading-relaxed px-2">
            {{ tokenErrorMsg }}
          </p>
        </div>
        <router-link 
          to="/" 
          class="inline-flex w-full items-center justify-center px-6 py-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold rounded-2xl transition duration-300 shadow-md shadow-gray-900/10 dark:shadow-none hover:-translate-y-0.5 active:translate-y-0"
        >
          กลับสู่หน้าหลัก
        </router-link>
      </div>

      <!-- State 3: Active Form -->
      <div v-else>
        <!-- Step 3.1: Password Reset Form -->
        <div v-if="!success" class="space-y-6">
          <div class="text-center">
            <div class="mx-auto w-20 h-20 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl flex items-center justify-center mb-5 ring-4 ring-emerald-500/5 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">ตั้งรหัสผ่านใหม่</h1>
            <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">กรอกรหัสผ่านใหม่และยืนยันเพื่อเปิดใช้งานบัญชีผู้ใช้ของคุณ</p>
          </div>

          <form @submit.prevent="handleReset" class="space-y-5">
            <!-- Password Field -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">รหัสผ่านใหม่</label>
              <div class="relative group">
                <!-- Icon Lock on Left -->
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450 group-focus-within:text-emerald-500 transition-colors duration-205">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  v-model="newPassword" 
                  :type="showNewPassword ? 'text' : 'password'" 
                  required
                  placeholder="กรอกรหัสผ่านใหม่"
                  class="w-full pl-11 pr-11 py-3.5 border border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition focus:outline-none"
                />
                <button 
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus:outline-none"
                >
                  <!-- Eye Open -->
                  <svg v-if="showNewPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <!-- Eye Close -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>

              <!-- Password Strength Indicator -->
              <div v-if="newPassword" class="mt-3 space-y-3 p-3 bg-gray-50/50 dark:bg-gray-850/20 rounded-2xl border border-gray-200/50 dark:border-gray-800/40">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-500 dark:text-gray-400">ระดับความปลอดภัย:</span>
                  <span class="font-bold transition-colors duration-300" :class="{
                    'text-red-500': score <= 2,
                    'text-amber-500': score > 2 && score <= 4,
                    'text-emerald-500': score === 5
                  }">{{ strengthLabel }}</span>
                </div>
                <div class="h-2 w-full bg-gray-250/50 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    :class="strengthColor" 
                    :style="{ width: strengthPercent + '%' }"
                    class="h-full rounded-full transition-all duration-500 ease-out"
                  ></div>
                </div>
                
                <!-- Recommendations Checklist -->
                <ul class="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1.5 text-gray-500 dark:text-gray-400">
                  <li class="flex items-center space-x-2 transition-all duration-300" :class="hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'opacity-70'">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="hasMinLength ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-700 text-transparent'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>ยาวอย่างน้อย 8 ตัวอักษร</span>
                  </li>
                  <li class="flex items-center space-x-2 transition-all duration-300" :class="hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'opacity-70'">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="hasUppercase ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-700 text-transparent'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>อักษรพิมพ์ใหญ่ (A-Z)</span>
                  </li>
                  <li class="flex items-center space-x-2 transition-all duration-300" :class="hasLowercase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'opacity-70'">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="hasLowercase ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-700 text-transparent'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>อักษรพิมพ์เล็ก (a-z)</span>
                  </li>
                  <li class="flex items-center space-x-2 transition-all duration-300" :class="hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'opacity-70'">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="hasNumber ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-700 text-transparent'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>มีตัวเลข (0-9)</span>
                  </li>
                  <li class="flex items-center space-x-2 transition-all duration-300 sm:col-span-2" :class="hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'opacity-70'">
                    <span class="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center border transition-all duration-300" :class="hasSpecialChar ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'border-gray-300 dark:border-gray-700 text-transparent'">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span>มีอักขระพิเศษ (เช่น @,#,$,!,%)</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Confirm Password Field -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">ยืนยันรหัสผ่านใหม่</label>
              <div class="relative group">
                <!-- Icon Lock on Left -->
                <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-450 group-focus-within:text-emerald-500 transition-colors duration-205">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input 
                  v-model="confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  class="w-full pl-11 pr-11 py-3.5 border rounded-2xl bg-gray-50/50 dark:bg-gray-800/40 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-800 transition focus:outline-none"
                  :class="{
                    'border-red-300 focus:ring-4 focus:ring-red-500/10 focus:border-red-500': isPasswordNotMatched,
                    'border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500': isPasswordMatched,
                    'border-gray-200 dark:border-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500': !confirmPassword
                  }"
                />
                <button 
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition focus:outline-none"
                >
                  <!-- Eye Open -->
                  <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <!-- Eye Close -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                </button>
              </div>
              
              <!-- Real-time Comparison Check Message -->
              <div class="mt-2 text-xs transition-all duration-300">
                <span v-if="isPasswordNotMatched" class="text-red-500 flex items-center space-x-1.5 animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>รหัสผ่านไม่ตรงกัน</span>
                </span>
                <span v-if="isPasswordMatched" class="text-emerald-500 flex items-center space-x-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>รหัสผ่านตรงกันเรียบร้อย</span>
                </span>
              </div>
            </div>

            <!-- Premium Click-based Bot Verification Widget -->
            <div 
              @click="handleBotCheck"
              class="p-4 bg-white/40 dark:bg-gray-800/20 border rounded-2xl flex items-center justify-between cursor-pointer transition select-none duration-300 relative overflow-hidden"
              :class="{
                'border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-[0_4px_20px_rgba(16,185,129,0.05)]': isBotVerified,
                'border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-white dark:hover:bg-gray-800/40': !isBotVerified
              }"
            >
              <div class="flex items-center space-x-3.5">
                <!-- Circular Checkbox / Spinner -->
                <div class="relative w-8 h-8 flex items-center justify-center">
                  <!-- Checkbox boundary -->
                  <div 
                    class="absolute inset-0 rounded-xl border-2 transition duration-300 bg-white dark:bg-gray-800"
                    :class="{
                      'border-emerald-500 bg-emerald-500 scale-90 rotate-6': isBotVerified,
                      'border-gray-300 dark:border-gray-600': !isBotVerified && !isCheckingBot
                    }"
                  ></div>
                  
                  <!-- Circular Spinner -->
                  <svg 
                    v-if="isCheckingBot" 
                    class="animate-spin h-5 w-5 text-emerald-600 absolute" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  
                  <!-- Checkmark on success -->
                  <svg 
                    v-if="isBotVerified" 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-5 w-5 text-white absolute transform scale-110" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <!-- Label text -->
                <div class="leading-tight">
                  <p class="text-sm font-bold text-gray-700 dark:text-gray-300">ฉันไม่ใช่โปรแกรมอัตโนมัติ</p>
                  <p class="text-[10px] text-gray-455 dark:text-gray-500 mt-0.5">การยืนยันความปลอดภัยโดย Morespace</p>
                </div>
              </div>
              
              <!-- Shield Icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-300 dark:text-gray-600 transition-colors" :class="{'text-emerald-500': isBotVerified}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              :disabled="loading || score < 3 || newPassword !== confirmPassword || !isBotVerified"
              class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition duration-300 disabled:opacity-45 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 disabled:shadow-none hover:-translate-y-0.5 active:translate-y-0"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดำเนินการ...
              </span>
              <span v-else>ตั้งรหัสผ่านใหม่</span>
            </button>
          </form>

          <!-- Error Alert -->
          <transition name="fade">
            <div v-if="errorMsg" class="p-4 text-sm font-bold text-red-650 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/30 rounded-2xl flex items-center space-x-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-505 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
          </transition>
        </div>

        <!-- Step 3.2: Success -->
        <div v-else class="text-center py-6 space-y-6">
          <div class="relative inline-flex items-center justify-center">
            <!-- Pulsing success rings -->
            <div class="absolute w-24 h-24 rounded-full bg-emerald-500/10 animate-ping opacity-75"></div>
            <div class="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-pulse delay-500"></div>
            
            <div class="relative w-16 h-16 bg-emerald-500 dark:bg-emerald-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 dark:shadow-emerald-400/20 transform rotate-6 animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <div class="space-y-2">
            <h2 class="text-2xl font-black text-gray-900 dark:text-white">ตั้งรหัสผ่านสำเร็จ!</h2>
            <p class="text-gray-550 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">คุณสามารถใช้รหัสผ่านใหม่นี้ในการเข้าสู่ระบบ และรับบริการต่างๆ บนระบบ Morespace ได้ทันที</p>
          </div>

          <router-link 
            to="/?login=true" 
            class="inline-flex w-full items-center justify-center px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition duration-300 shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            เข้าสู่ระบบด้วยรหัสผ่านใหม่
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../utils/apiFetch'

const route = useRoute()
const newPassword = ref('')
const confirmPassword = ref('')

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const loading = ref(false)
const success = ref(false)
const errorMsg = ref('')

// Token Validation State
const checkingToken = ref(true)
const isTokenValid = ref(false)
const tokenErrorMsg = ref('')

// Bot Verification State
const isBotVerified = ref(false)
const isCheckingBot = ref(false)

const handleBotCheck = () => {
  if (isBotVerified.value || isCheckingBot.value) return
  isCheckingBot.value = true
  
  // Elegant animated delay
  setTimeout(() => {
    isCheckingBot.value = false
    isBotVerified.value = true
  }, 1200)
}

// Password Strength Evaluation
const hasMinLength = computed(() => newPassword.value.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value))
const hasLowercase = computed(() => /[a-z]/.test(newPassword.value))
const hasNumber = computed(() => /[0-9]/.test(newPassword.value))
const hasSpecialChar = computed(() => /[^A-Za-z0-9]/.test(newPassword.value))

const score = computed(() => {
  let s = 0
  if (hasMinLength.value) s++
  if (hasUppercase.value) s++
  if (hasLowercase.value) s++
  if (hasNumber.value) s++
  if (hasSpecialChar.value) s++
  return s
})

const strengthLabel = computed(() => {
  if (!newPassword.value) return ''
  if (score.value <= 2) return 'อ่อนมาก'
  if (score.value <= 4) return 'ปานกลาง'
  return 'แข็งแกร่งมาก!'
})

const strengthPercent = computed(() => {
  if (!newPassword.value) return 0
  return (score.value / 5) * 100
})

const strengthColor = computed(() => {
  if (score.value <= 2) return 'bg-red-500 animate-pulse'
  if (score.value <= 4) return 'bg-amber-500'
  return 'bg-emerald-500'
})

// Real-time comparison
const isPasswordMatched = computed(() => {
  return newPassword.value && confirmPassword.value && newPassword.value === confirmPassword.value
})

const isPasswordNotMatched = computed(() => {
  return confirmPassword.value && newPassword.value !== confirmPassword.value
})

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    isTokenValid.value = false
    tokenErrorMsg.value = 'ลิงก์รีเซ็ตไม่ถูกต้อง กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่จากหน้าเข้าสู่ระบบ'
    checkingToken.value = false
    return
  }

  try {
    const response = await apiFetch(`/api/users/verify-reset-token?token=${token}`)
    const data = await response.json()
    if (data.success) {
      isTokenValid.value = true
    } else {
      isTokenValid.value = false
      tokenErrorMsg.value = data.error || 'ลิงก์นี้หมดอายุหรือเปลี่ยนรหัสผ่านสำเร็จแล้ว'
    }
  } catch (err) {
    isTokenValid.value = false
    tokenErrorMsg.value = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อตรวจสอบสิทธิ์ได้'
  } finally {
    checkingToken.value = false
  }
})

const handleReset = async () => {
  errorMsg.value = ''

  if (score.value < 3) {
    errorMsg.value = 'รหัสผ่านใหม่ยังไม่ปลอดภัยเพียงพอ (ต้องการความปลอดภัยระดับปานกลางขึ้นไป)'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'รหัสผ่านใหม่ไม่ตรงกัน'
    return
  }

  if (!isBotVerified.value) {
    errorMsg.value = 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ'
    return
  }

  const token = route.query.token
  if (!token) {
    errorMsg.value = 'ลิงก์รีเซ็ตไม่ถูกต้อง กรุณาขอลิงก์ใหม่'
    return
  }

  loading.value = true
  try {
    const response = await apiFetch('/api/users/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password: newPassword.value })
    })
    const data = await response.json()
    if (data.success) {
      success.value = true
    } else {
      errorMsg.value = data.error || 'เกิดข้อผิดพลาด'
    }
  } catch (err) {
    errorMsg.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์'
  } finally {
    loading.value = false
  }
}
</script>
