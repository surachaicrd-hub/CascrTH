<script setup>
import { ref, onMounted } from 'vue'

const isVisible = ref(false)
const showSettings = ref(false)

const availablePurposes = ref({
  analytics: false,
  marketing: false,
  personalization: false
})

const userConsent = ref({
  necessary: true,
  analytics: false,
  marketing: false,
  personalization: false
})

const parseCookieConsent = () => {
  try {
    const saved = localStorage.getItem('cookie_consent_preferences')
    if (saved) return JSON.parse(saved)
  } catch (e) { }
  return null
}

const acceptAllCookies = () => {
  const fullConsent = {
    necessary: true,
    analytics: availablePurposes.value.analytics,
    marketing: availablePurposes.value.marketing,
    personalization: availablePurposes.value.personalization
  }
  saveConsent(fullConsent)
}

const saveSelectedCookies = () => {
  saveConsent(userConsent.value)
}

const saveConsent = (preferences) => {
  localStorage.setItem('cookie_consent', 'accepted')
  localStorage.setItem('cookie_consent_preferences', JSON.stringify(preferences))
  isVisible.value = false
  showSettings.value = false
  
  // Dispatch custom event for tracking scripts to update
  window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: preferences }))
}

onMounted(async () => {
  const consent = localStorage.getItem('cookie_consent')
  
  if (!consent) {
    try {
      // Fetch settings to check if banner is enabled and what purposes are active
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.data) {
          if (data.data.show_cookie_consent === 'false') {
            return // Disabled by admin
          }
          
          availablePurposes.value.analytics = data.data.cookie_purpose_analytics === 'true'
          availablePurposes.value.marketing = data.data.cookie_purpose_marketing === 'true'
          availablePurposes.value.personalization = data.data.cookie_purpose_personalization === 'true'
        }
      }
    } catch (e) {
      console.error('Failed to get cookie settings', e)
    }

    // Small delay for better UX
    setTimeout(() => {
      isVisible.value = true
    }, 1500)
  }
})
</script>

<template>
  <transition name="slide-up">
    <div v-if="isVisible" class="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
      <div class="max-w-4xl mx-auto bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 shadow-2xl pointer-events-auto flex flex-col md:flex-row items-center justify-between gap-6 transform transition-all duration-500">
        
        <!-- Banner Mode -->
        <div v-if="!showSettings" class="flex flex-col md:flex-row items-center justify-between gap-6 w-full">
          <div class="flex items-start gap-4 flex-1">
            <div class="flex-shrink-0 w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
               <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
               </svg>
            </div>
            <div>
              <h4 class="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">เราใช้คุกกี้เพื่อประสบการณ์ที่ดีขึ้น</h4>
              <p class="text-gray-500 dark:text-gray-400 text-sm font-light leading-relaxed">
                เว็บไซต์นี้ใช้คุกกี้ (Cookies) เพื่อยกระดับประสบการณ์การใช้งานของท่าน รวมถึงเพื่อเก็บข้อมูลสถิติและการตลาด 
                คลิกเพื่อดู <router-link to="/privacy-policy" class="text-emerald-700 dark:text-emerald-400 hover:underline font-medium">นโยบายความเป็นส่วนตัว (Privacy Policy)</router-link>
              </p>
            </div>
          </div>

          <div class="flex-shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button @click="showSettings = true" class="w-full sm:w-auto px-6 py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-full transition-colors tracking-wide text-sm whitespace-nowrap">
              ตั้งค่าคุกกี้
            </button>
            <button @click="acceptAllCookies" class="w-full sm:w-auto px-8 py-3.5 bg-gray-900 dark:bg-emerald-600 hover:bg-gray-800 dark:hover:bg-emerald-500 text-white font-bold rounded-full transition-colors tracking-wide text-sm shadow-lg whitespace-nowrap">
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>

        <!-- Settings Mode -->
        <div v-else class="w-full flex flex-col gap-6">
          <div class="flex justify-between items-start">
             <div>
               <h4 class="text-lg font-bold text-gray-900 dark:text-white mb-1">การตั้งค่าคุกกี้ (Cookie Preferences)</h4>
               <p class="text-sm text-gray-500 dark:text-gray-400">ท่านสามารถเลือกกำหนดการใช้งานคุกกี้แต่ละประเภทได้ตามต้องการ</p>
             </div>
             <button @click="showSettings = false" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white">
               <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
             </button>
          </div>

          <div class="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
             <!-- Necessary (Always On) -->
             <div class="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
               <div class="pr-4">
                 <h5 class="text-sm font-bold text-gray-900 dark:text-white">คุกกี้ที่จำเป็น (Strictly Necessary)</h5>
                 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">คุกกี้ที่จำเป็นต่อการทำงานของระบบเว็บไซต์หลัก ไม่สามารถปิดการใช้งานได้</p>
               </div>
               <div class="shrink-0 text-gray-400 dark:text-gray-500 font-medium text-sm mt-0.5">เปิดเสมอ</div>
             </div>

             <!-- Analytics -->
             <label v-if="availablePurposes.analytics" class="flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
               <div class="pr-4">
                 <h5 class="text-sm font-bold text-gray-900 dark:text-white">การวิเคราะห์และสถิติ (Analytics)</h5>
                 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ช่วยให้เราเข้าใจการใช้งานเว็บไซต์ของท่าน เพื่อนำไปปรับปรุงประสบการณ์ให้ดียิ่งขึ้น</p>
               </div>
               <div class="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                 <input type="checkbox" v-model="userConsent.analytics" class="sr-only peer">
                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </div>
             </label>

             <!-- Marketing -->
             <label v-if="availablePurposes.marketing" class="flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
               <div class="pr-4">
                 <h5 class="text-sm font-bold text-gray-900 dark:text-white">การตลาดและการโฆษณา (Marketing)</h5>
                 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">ใช้ติดตามพฤติกรรมเพื่อนำเสนอเนื้อหาโฆษณา โปรโมชันที่ตรงตามความสนใจของท่าน</p>
               </div>
               <div class="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                 <input type="checkbox" v-model="userConsent.marketing" class="sr-only peer">
                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </div>
             </label>

             <!-- Personalization -->
             <label v-if="availablePurposes.personalization" class="flex items-start justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors">
               <div class="pr-4">
                 <h5 class="text-sm font-bold text-gray-900 dark:text-white">การปรับแต่งส่วนบุคคล (Personalization)</h5>
                 <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">จดจำการตั้งค่า ข้อมูลที่ท่านเคยเลือกไว้ เพื่ออำนวยความสะดวกในการใช้งานครั้งต่อไป</p>
               </div>
               <div class="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
                 <input type="checkbox" v-model="userConsent.personalization" class="sr-only peer">
                 <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
               </div>
             </label>
          </div>

          <div class="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800 gap-3">
             <button @click="saveSelectedCookies" class="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl transition-colors text-sm">
                บันทึกการตั้งค่าข้าพเจ้า
             </button>
             <button @click="acceptAllCookies" class="px-6 py-2.5 bg-gray-900 dark:bg-emerald-600 hover:bg-gray-800 dark:hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm shadow-md">
                อนุญาตทั้งหมด
             </button>
          </div>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
