<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'

const content = ref('')
const isLoading = ref(true)

const loadContent = async () => {
    isLoading.value = true
    try {
        const res = await apiFetch('/api/settings/installation_guide')
        const data = await res.json()
        if (data.success && data.data) {
            content.value = data.data
        } else {
            content.value = '<div class="text-center py-20 text-gray-500">ยังไม่มีข้อมูลคู่มือการเตรียมพื้นที่</div>'
        }
    } catch (error) {
        console.error('Failed to load installation guide:', error)
        content.value = '<div class="text-center py-20 text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>'
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    loadContent()
})
</script>

<template>
    <div class="relative bg-gray-50 dark:bg-[#0a0f16] min-h-[80vh] py-24 sm:py-32 overflow-hidden transition-colors duration-500 pt-32 lg:pt-40">
        
        <!-- Decorative Background Elements -->
        <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        <div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 opacity-40 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div class="max-w-4xl mx-auto px-6 relative z-10">
            
            <!-- Page Header -->
            <div class="text-center mb-16">
                <!-- Changed logo/icon to something related to installation -->
                <div class="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 mb-6 border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                    <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <h3 class="text-sm font-bold tracking-[0.2em] text-emerald-600 dark:text-emerald-400 uppercase mb-4">เพื่อความสมบูรณ์แบบตั้งแต่วันแรก</h3>
                <h1 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">คู่มือการเตรียมพื้นที่</h1>
                <p class="text-lg text-emerald-600 dark:text-emerald-400 font-medium tracking-widest uppercase">Installation Guide</p>
                <div class="w-24 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full mx-auto mt-8 opacity-70"></div>
            </div>

            <!-- Content Card -->
            <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-emerald-900/5 dark:shadow-black/40 border border-white dark:border-gray-800 p-8 sm:p-12 md:p-16 relative overflow-hidden">
                
                <!-- Subtle internal border -->
                <div class="absolute inset-0 border border-gray-100 dark:border-white/5 rounded-[2rem] pointer-events-none"></div>

                <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
                    <div class="relative w-16 h-16">
                        <div class="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                        <div class="absolute inset-2 rounded-full border-t-2 border-teal-400 animate-spin opacity-50" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <p class="mt-6 text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                </div>

                <div v-else class="policy-content prose prose-lg prose-emerald dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-loose" v-html="content">
                </div>
            </div>

            <!-- Consultation Banner from old page -->
            <div class="mt-20 relative overflow-hidden bg-emerald-600 dark:bg-[#0a0f16] rounded-3xl p-10 md:p-12 text-center text-white border border-transparent dark:border-emerald-800/30 shadow-2xl shadow-emerald-600/20 dark:shadow-none">
              <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent dark:from-emerald-900/20"></div>
              <div class="relative z-10 w-20 h-20 bg-white/10 dark:bg-emerald-900/40 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 dark:border-emerald-800/50 transform rotate-3">
                <svg class="w-10 h-10 text-white dark:text-emerald-400 transform -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <h3 class="relative z-10 text-2xl md:text-3xl font-black mb-4 tracking-tight">ไม่มั่นใจเรื่องพื้นที่จะต้องทำอย่างไร?</h3>
              <p class="relative z-10 text-emerald-100 dark:text-gray-300 font-light text-lg mb-8 max-w-xl mx-auto">
                ไม่ต้องกังวล! เรามีทีมวิศวกรผู้เชี่ยวชาญพร้อมลงสำรวจหน้างานให้คุณฟรีก่อนตัดสินใจเซ็นสัญญา เพื่อประเมินและวางแผนงานก่อสร้างอย่างรัดกุม 100%
              </p>
              <router-link to="/contact" class="relative z-10 inline-flex bg-white text-emerald-700 font-bold py-4 px-10 rounded-full shadow hover:bg-emerald-50 transition transform hover:-translate-y-1 tracking-widest uppercase">
                นัดหมายวิศวกรสำรวจพื้นที่
              </router-link>
            </div>

            <div class="mt-12 text-center">
                <router-link to="/" class="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    กลับสู่หน้าแรก
                </router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Custom prose styling for premium feel */
.policy-content :deep(h1), 
.policy-content :deep(h2), 
.policy-content :deep(h3) {
    @apply font-black text-gray-900 dark:text-white mt-12 mb-6 tracking-tight;
}
.policy-content :deep(h2) {
    @apply text-2xl sm:text-3xl border-b border-gray-100 dark:border-gray-800 pb-4;
}
.policy-content :deep(h3) {
    @apply text-xl sm:text-2xl text-emerald-800 dark:text-emerald-300;
}
.policy-content :deep(p) {
    @apply mb-6 text-base sm:text-lg;
}
.policy-content :deep(ul),
.policy-content :deep(ol) {
    @apply mb-8 pl-6 space-y-3 bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800/50;
}
.policy-content :deep(li) {
    @apply text-base sm:text-lg relative;
}
.policy-content :deep(li::marker) {
    @apply text-emerald-500 font-bold;
}
.policy-content :deep(strong) {
    @apply font-bold text-gray-900 dark:text-white bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md;
}
.policy-content :deep(a) {
    @apply text-emerald-600 dark:text-emerald-400 font-semibold no-underline border-b-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors;
}
</style>
