<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

// Basic layout state
const loading = ref(true)
const loadingAi = ref(false)
const error = ref('')
const aiError = ref('')
const period = ref('today') // today, week, month
const stats = ref(null)
const aiInsights = ref(null)

const fetchStats = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/analytics/stats?period=${period.value}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      }
    })
    const data = await res.json()
    if (data.success) {
      stats.value = data.data
    } else {
      error.value = data.error || 'ไม่สามารถโหลดข้อมูลวิเคราะห์ได้'
    }
  } catch (err) {
    error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ'
  } finally {
    loading.value = false
  }
}

// Watch for date range changes
watch(period, () => {
  aiInsights.value = null // reset AI when date changes
  fetchStats()
})

const fetchAiInsights = async () => {
  if (!stats.value) return;
  loadingAi.value = true;
  aiError.value = '';
  try {
    const res = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({ stats: stats.value, period: period.value })
    });
    const data = await res.json();
    if (data.success) {
      aiInsights.value = data.data;
    } else {
      aiError.value = data.error || 'ไม่สามารถวิเคราะห์ข้อมูลด้วย AI ได้';
    }
  } catch (err) {
    aiError.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI';
  } finally {
    loadingAi.value = false;
  }
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0 วิ'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m} นาที ${s} วิ` : `${s} วิ`
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
    <!-- Header -->
    <div class="sm:flex sm:justify-between sm:items-center mb-8">
      <div class="mb-4 sm:mb-0">
        <h1 class="text-2xl md:text-3xl text-gray-800 font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">แดชบอร์ดวิเคราะห์</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">วิเคราะห์ข้อมูลการเข้าชมเว็บไซต์พฤติกรรมลูกค้า
          <InfoTooltip title="ระบบวิเคราะห์คืออะไร?" description="ระบบเก็บข้อมูลการเข้าชมเว็บไซต์แบบอัตโนมัติ (ไม่ต้องติดตั้งอะไรเพิ่มเติม)<ul><li><strong>ยอดเข้าชมหน้าเว็บ:</strong> จำนวนครั้งที่หน้าเว็บถูกเปิดดู (คนเดียวเข้าหลายหน้านับหลายครั้ง)</li><li><strong>ผู้ใช้งาน:</strong> จำนวนคนที่ไม่ซ้ำกัน (นับจากเครื่อง/เบราว์เซอร์)</li><li><strong>อัตราการออก:</strong> % คนที่เปิดดูหน้าเดียวแล้วออก (ยิ่งต่ำยิ่งดี)</li></ul>" />
        </p>
      </div>

      <!-- Filters -->
      <div class="flex gap-2">
        <select v-model="period" class="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block w-full p-2.5 shadow-sm">
          <option value="today">วันนี้</option>
          <option value="week">7 วันที่ผ่านมา</option>
          <option value="month">30 วันที่ผ่านมา</option>
        </select>
        <button @click="fetchStats" class="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-emerald-600 transition-colors shadow-sm">
          <svg class="w-5 h-5" :class="{'animate-spin text-emerald-500': loading}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-8 flex items-center gap-3">
      <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading && !stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div class="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>

    <div v-else-if="stats">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Pageviews -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100/50 to-blue-50/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500">ยอดเข้าชมหน้าเว็บ</h3>
            <div class="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </div>
          </div>
          <div class="text-3xl font-black text-gray-900 mb-1 lg:text-4xl">{{ parseInt(stats.summary.total_pageviews || 0).toLocaleString() }}</div>
        </div>

        <!-- Unique Visitors -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] relative overflow-hidden group">
           <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100/50 to-emerald-50/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500">จำนวนผู้ใช้งาน</h3>
            <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          <div class="text-3xl font-black text-gray-900 mb-1 lg:text-4xl">{{ parseInt(stats.summary.unique_sessions || 0).toLocaleString() }}</div>
        </div>

        <!-- Avg Time -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(139,92,246,0.1)] relative overflow-hidden group">
           <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-100/50 to-violet-50/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500">เวลาที่อยู่บนเว็บเฉลี่ย</h3>
            <div class="p-2 bg-violet-50 text-violet-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div class="text-3xl font-black text-gray-900 mb-1 lg:text-4xl">{{ formatTime(stats.summary.avg_time_on_page) }}</div>
        </div>

        <!-- Bounce Rate -->
        <div class="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] relative overflow-hidden group">
           <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/50 to-amber-50/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-500">อัตราการออก</h3>
            <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </div>
          </div>
          <div class="text-3xl font-black text-gray-900 mb-1 lg:text-4xl">{{ parseFloat(stats.summary.bounce_rate || 0).toFixed(1) }}%</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- Left Column: Top Pages & Top Products -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- Top Pages Table -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div class="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                หน้ายอดนิยมบนเว็บไซต์
              </h2>
            </div>
            <div class="overflow-x-auto flex-1">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th scope="col" class="px-6 py-4 font-bold">ชื่อหน้า / URL</th>
                    <th scope="col" class="px-6 py-4 font-bold text-right">ยอดเข้าชม</th>
                    <th scope="col" class="px-6 py-4 font-bold text-right">ผู้เข้าชม</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="stats.topPages.length === 0">
                    <td colspan="3" class="px-6 py-8 text-center text-gray-500 font-medium">ยังไม่มีข้อมูลการเข้าชมในช่วงเวลานี้</td>
                  </tr>
                  <tr v-for="(page, i) in stats.topPages" :key="i" class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-bold text-gray-900 mb-0.5 truncate max-w-sm" :title="page.page_title">{{ page.page_title || 'หน้าที่ไม่ทราบชื่อ' }}</div>
                      <div class="text-[11px] text-gray-500 truncate max-w-sm font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">{{ page.page_path }}</div>
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-gray-900">{{ parseInt(page.views).toLocaleString() }}</td>
                    <td class="px-6 py-4 text-right text-gray-600">{{ parseInt(page.unique_visitors).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Top Products Table -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col mt-2">
            <div class="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                สินค้าที่ได้รับความสนใจสูงสุด
              </h2>
            </div>
            <div class="overflow-x-auto flex-1">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th scope="col" class="px-6 py-4 font-bold">สินค้า</th>
                    <th scope="col" class="px-6 py-4 font-bold text-right">ยอดเข้าชม</th>
                    <th scope="col" class="px-6 py-4 font-bold text-right">ผู้สนใจ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="stats.topProducts && stats.topProducts.length === 0">
                    <td colspan="3" class="px-6 py-8 text-center text-gray-500 font-medium">ยังไม่มีข้อมูลสินค้าในช่วงเวลานี้</td>
                  </tr>
                  <tr v-for="(prod, i) in stats.topProducts || []" :key="i" class="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-bold text-indigo-900 mb-0.5 truncate max-w-sm" :title="prod.page_title">{{ prod.page_title ? prod.page_title.replace(/\s*-\s*[^-]+$/, '') : 'สินค้าที่ไม่ทราบชื่อ' }}</div>
                      <div class="text-[11px] text-gray-500 truncate max-w-sm font-mono bg-gray-100 inline-block px-1.5 py-0.5 rounded">{{ prod.page_path }}</div>
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-gray-900">{{ parseInt(prod.views).toLocaleString() }}</td>
                    <td class="px-6 py-4 text-right text-gray-600">{{ parseInt(prod.unique_visitors).toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        <!-- Devices & Browsers Side Panel -->
        <div class="flex flex-col gap-6">
          
          <!-- Devices -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              อุปกรณ์ที่ใช้งาน
            </h2>
            <div class="space-y-4">
               <div v-if="stats.devices.length === 0" class="text-sm text-gray-500 text-center py-4">ไม่มีข้อมูล</div>
               <div v-for="dev in stats.devices" :key="dev.device_type" class="flex items-center justify-between">
                 <div class="flex items-center gap-2">
                   <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                   <span class="text-sm font-medium text-gray-700 capitalize">{{ dev.device_type }}</span>
                 </div>
                 <span class="text-sm font-bold text-gray-900">{{ parseInt(dev.count).toLocaleString() }}</span>
               </div>
            </div>
          </div>

          <!-- Browsers -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
            <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>
              เบราว์เซอร์
            </h2>
            <div class="space-y-4">
               <div v-if="stats.browsers.length === 0" class="text-sm text-gray-500 text-center py-4">ไม่มีข้อมูล</div>
               <div v-for="browser in stats.browsers" :key="browser.browser" class="flex items-center justify-between">
                 <div class="text-sm font-medium text-gray-700">{{ browser.browser || 'ไม่ทราบ' }}</div>
                 <span class="text-sm font-bold text-gray-900">{{ parseInt(browser.count).toLocaleString() }}</span>
               </div>
            </div>
          </div>

          <!-- Referrers -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex-1">
            <h2 class="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              แหล่งที่มา
            </h2>
            <div class="space-y-4">
               <div v-if="stats.referrers.length === 0" class="text-sm text-gray-500 text-center py-4">ไม่มีข้อมูล</div>
               <div v-for="ref in stats.referrers" :key="ref.source" class="flex items-center justify-between">
                 <div class="text-[13px] font-medium text-gray-700 truncate max-w-[150px]" :title="ref.source">{{ ref.source }}</div>
                 <span class="text-sm font-bold text-gray-900 shrink-0">{{ parseInt(ref.count).toLocaleString() }}</span>
               </div>
            </div>
          </div>

        </div>
      </div>

      <!-- AI Insights Section -->
      <div class="mb-12">
        <div class="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
          
          <!-- Decorative Background -->
          <div class="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div class="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

          <div class="relative bg-white/5 rounded-[22px] p-6 lg:p-8 backdrop-blur-sm border border-white/10">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                  <span class="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                    <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </span>
                  AI ที่ปรึกษาการตลาด
                </h2>
                <p class="text-gray-400 mt-2 text-sm">ผู้ช่วยวิเคราะห์ข้อมูลและเสนอแนะกลยุทธ์การตลาดด้วยพฤติกรรมลูกค้าอัจฉริยะ</p>
              </div>
              
              <button 
                @click="fetchAiInsights" 
                :disabled="loadingAi"
                class="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 disabled:opacity-75 disabled:cursor-not-allowed group">
                <svg v-if="loadingAi" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                {{ loadingAi ? 'กำลังวิเคราะห์...' : 'เริ่มต้นวิเคราะห์ข้อมูล' }}
              </button>
            </div>

            <!-- Error -->
            <div v-if="aiError" class="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {{ aiError }}
            </div>

            <!-- Empty State -->
            <div v-if="!aiInsights && !loadingAi && !aiError" class="text-center py-12 px-4 border border-white/5 rounded-2xl bg-white/5">
               <div class="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                 <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
               </div>
               <h3 class="text-lg font-medium text-white mb-2">พร้อมวิเคราะห์สถิติของคุณ</h3>
               <p class="text-gray-400 text-sm max-w-md mx-auto">ให้ AI ช่วยสรุปแนวโน้ม ค้นหาจุดบอด และวางแผนกลยุทธ์การตลาดที่ได้ผลลัพธ์สูงจากพฤติกรรมลูกค้าคลิกที่ปุ่มด้านบนได้เลย</p>
            </div>

            <!-- Results -->
            <div v-if="aiInsights" class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
              
              <!-- Trends -->
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col h-full hover:bg-white/15 transition-colors">
                <div class="flex items-center gap-3 mb-6">
                  <div class="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <h3 class="text-lg font-bold text-white">แนวโน้ม</h3>
                </div>
                <ul class="space-y-4 flex-1">
                  <li v-for="(trend, i) in aiInsights.trends" :key="i" class="flex gap-3 text-gray-300 text-sm leading-relaxed">
                    <span class="text-blue-400 mt-1 shrink-0"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg></span>
                    {{ trend }}
                  </li>
                </ul>
              </div>

              <!-- Warnings -->
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-rose-500/30 flex flex-col h-full hover:bg-white/15 transition-colors">
                <div class="flex items-center gap-3 mb-6">
                  <div class="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <h3 class="text-lg font-bold text-white">จุดน่ากังวล</h3>
                </div>
                <ul class="space-y-4 flex-1">
                  <li v-for="(warning, i) in aiInsights.warnings" :key="i" class="flex gap-3 text-gray-300 text-sm leading-relaxed">
                    <span class="text-rose-400 mt-1 shrink-0"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></span>
                    {{ warning }}
                  </li>
                </ul>
              </div>

              <!-- Recommendations -->
              <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/50 flex flex-col h-full shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-white/15 transition-colors relative">
                <div class="absolute -top-3 -right-3">
                  <span class="relative flex h-6 w-6">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 items-center justify-center"><svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg></span>
                  </span>
                </div>
                <div class="flex items-center gap-3 mb-6">
                  <div class="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                  </div>
                  <h3 class="text-lg font-bold text-white">คำแนะนำการตลาด</h3>
                </div>
                <ul class="space-y-4 flex-1">
                  <li v-for="(rec, i) in aiInsights.recommendations" :key="i" class="flex gap-3 text-gray-300 text-sm leading-relaxed">
                    <span class="text-emerald-400 mt-1 shrink-0"><svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" /></svg></span>
                    {{ rec }}
                  </li>
                </ul>
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}

@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
</style>
