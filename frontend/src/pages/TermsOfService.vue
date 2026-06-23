<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../utils/apiFetch'

const content = ref('')
const isLoading = ref(true)

const loadContent = async () => {
    isLoading.value = true
    try {
        const res = await apiFetch('/api/settings/terms_of_service')
        const data = await res.json()
        if (data.success && data.data) {
            content.value = data.data
        } else {
            content.value = '<div class="text-center py-20 text-gray-500">ยังไม่มีข้อมูลเงื่อนไขการให้บริการ</div>'
        }
    } catch (error) {
        console.error('Failed to load terms of service:', error)
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
            <div class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 opacity-60 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        <div class="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
            <div class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 opacity-40 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div class="max-w-4xl mx-auto px-6 relative z-10">
            
            <!-- Page Header -->
            <div class="text-center mb-16">
                <div class="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 mb-6 border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
                    <svg class="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
                <h1 class="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">เงื่อนไขการให้บริการ</h1>
                <p class="text-lg text-indigo-600 dark:text-indigo-400 font-medium tracking-widest uppercase">Terms of Service</p>
                <div class="w-24 h-1.5 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mx-auto mt-8 opacity-70"></div>
            </div>

            <!-- Content Card -->
            <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-indigo-900/5 dark:shadow-black/40 border border-white dark:border-gray-800 p-8 sm:p-12 md:p-16 relative overflow-hidden">
                
                <!-- Subtle internal border -->
                <div class="absolute inset-0 border border-gray-100 dark:border-white/5 rounded-[2rem] pointer-events-none"></div>

                <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
                    <div class="relative w-16 h-16">
                        <div class="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                        <div class="absolute inset-2 rounded-full border-t-2 border-purple-400 animate-spin opacity-50" style="animation-direction: reverse; animation-duration: 1.5s;"></div>
                    </div>
                    <p class="mt-6 text-sm font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">กำลังโหลดข้อมูล...</p>
                </div>

                <div v-else class="policy-content prose prose-lg prose-indigo dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-loose" v-html="content">
                </div>
            </div>

            <div class="mt-12 text-center">
                <router-link to="/" class="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
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
    @apply text-xl sm:text-2xl text-indigo-800 dark:text-indigo-300;
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
    @apply text-indigo-500 font-bold;
}
.policy-content :deep(strong) {
    @apply font-bold text-gray-900 dark:text-white bg-indigo-50 dark:bg-indigo-900/20 px-1.5 py-0.5 rounded-md;
}
.policy-content :deep(a) {
    @apply text-indigo-600 dark:text-indigo-400 font-semibold no-underline border-b-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors;
}
</style>
