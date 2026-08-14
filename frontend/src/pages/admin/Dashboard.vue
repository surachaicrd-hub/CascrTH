<script setup>
import { ref, onMounted, computed } from 'vue'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const loading = ref(true)
const stats = ref({ products: 0, leads: 0, messages: 0, articles: 0, projects: 0, subscribers: 0, orders: 0, pendingOrders: 0, revenue: 0 })
const recentLeads = ref([])
const recentMessages = ref([])
const topProducts = ref([])
const adminName = ref('ผู้ดูแลระบบ')

// Analytics
const analyticsPeriod = ref('week')
const analyticsLoading = ref(false)
const analyticsData = ref(null)

// AI Insights
const aiLoading = ref(false)
const aiInsights = ref(null)
const aiError = ref('')

// Quick action links
const quickActions = [
  { name: 'เพิ่มสินค้า', icon: 'M12 4v16m8-8H4', to: '/admin/products/new', color: 'bg-blue-500' },
  { name: 'จัดการหน้าหลัก', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', to: '/admin/homepage', color: 'bg-emerald-500' },
  { name: 'ดู Leads', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', to: '/admin/leads', color: 'bg-amber-500' },
  { name: 'เขียนบทความ', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', to: '/admin/articles', color: 'bg-purple-500' },
]

const token = localStorage.getItem('adminToken')
const headers = { 'Authorization': `Bearer ${token}` }

const greetingText = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'สวัสดีตอนเช้า'
  if (hour < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
})

const todayStr = computed(() => {
  return new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
})

const periodLabel = computed(() => {
  const map = { today: 'วันนี้', week: '7 วันล่าสุด', month: '30 วันล่าสุด', all: 'ทั้งหมด' }
  return map[analyticsPeriod.value] || 'สัปดาห์นี้'
})

// Analytics helpers
const formatNumber = (n) => {
  if (!n && n !== 0) return '0'
  return Number(n).toLocaleString('th-TH')
}

const formatTime = (secs) => {
  if (!secs) return '0 วิ'
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return m > 0 ? `${m} นาที ${s} วิ` : `${s} วิ`
}

const deviceIcon = (type) => {
  const map = {
    desktop: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    mobile: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    tablet: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
  }
  return map[type] || map.desktop
}

const deviceColor = (type) => {
  const map = { desktop: '#3b82f6', mobile: '#10b981', tablet: '#f59e0b' }
  return map[type] || '#6b7280'
}

const deviceLabel = (type) => {
  const map = { desktop: 'เดสก์ท็อป', mobile: 'มือถือ', tablet: 'แท็บเล็ต' }
  return map[type] || type
}

const totalDeviceCount = computed(() => {
  if (!analyticsData.value?.devices) return 0
  return analyticsData.value.devices.reduce((s, d) => s + d.count, 0)
})

const devicePercentage = (count) => {
  if (!totalDeviceCount.value) return 0
  return Math.round((count / totalDeviceCount.value) * 100)
}

const sourceLabel = (src) => {
  if (!src || src === 'Direct' || src === 'null') return 'เข้าตรง (Direct)'
  try {
    return new URL(src).hostname.replace('www.', '')
  } catch { return src.substring(0, 40) }
}

const maxReferrerCount = computed(() => {
  if (!analyticsData.value?.referrers) return 1
  return Math.max(...analyticsData.value.referrers.map(r => r.count), 1)
})

// Fetch analytics data
const fetchAnalytics = async () => {
  analyticsLoading.value = true
  try {
    const res = await fetch(`/api/analytics/stats?period=${analyticsPeriod.value}`, { headers })
    const data = await res.json()
    if (data.success) {
      analyticsData.value = data.data
    }
  } catch (e) {
    console.error('Analytics fetch error:', e)
  } finally {
    analyticsLoading.value = false
  }
}

// Generate AI insights
const generateAIInsights = async () => {
  if (!analyticsData.value) return
  aiLoading.value = true
  aiError.value = ''
  aiInsights.value = null
  try {
    const res = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stats: analyticsData.value,
        period: periodLabel.value
      })
    })
    const data = await res.json()
    if (data.success) {
      aiInsights.value = data.data
    } else {
      aiError.value = data.error || 'ไม่สามารถวิเคราะห์ข้อมูลได้'
    }
  } catch (e) {
    aiError.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI'
  } finally {
    aiLoading.value = false
  }
}

const changePeriod = (p) => {
  analyticsPeriod.value = p
  aiInsights.value = null
  fetchAnalytics()
}

onMounted(async () => {
  try {
    // Fetch admin profile  
    try {
      const profileRes = await fetch('/api/admin/profile', { headers })
      const profileData = await profileRes.json()
      if (profileData.success) adminName.value = profileData.data.name || profileData.data.username
    } catch(e) {}

    // Fetch counts in parallel
    const [productsRes, leadsRes, messagesRes, articlesRes, projectsRes, newsletterRes, ordersRes] = await Promise.allSettled([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/quotation-submit', { headers }).then(r => r.json()),
      fetch('/api/contact-messages', { headers }).then(r => r.json()),
      fetch('/api/articles').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/newsletter/admin', { headers }).then(r => r.json()),
      fetch('/api/orders/admin/all', { headers }).then(r => r.json()),
    ])

    if (productsRes.status === 'fulfilled' && productsRes.value.success) {
      const products = productsRes.value.data || []
      stats.value.products = products.length
      topProducts.value = products.slice(0, 5)
    }
    if (leadsRes.status === 'fulfilled' && leadsRes.value.success) {
      const leads = leadsRes.value.data || []
      stats.value.leads = leads.length
      recentLeads.value = leads.slice(0, 5)
    }
    if (messagesRes.status === 'fulfilled' && messagesRes.value.success) {
      const msgs = messagesRes.value.data || []
      stats.value.messages = msgs.length
      recentMessages.value = msgs.slice(0, 5)
    }
    if (articlesRes.status === 'fulfilled') {
      const articles = articlesRes.value.data || articlesRes.value || []
      stats.value.articles = Array.isArray(articles) ? articles.length : 0
    }
    if (projectsRes.status === 'fulfilled' && projectsRes.value.success) {
      stats.value.projects = (projectsRes.value.data || []).length
    }
    if (newsletterRes.status === 'fulfilled' && newsletterRes.value.success) {
      stats.value.subscribers = newsletterRes.value.total || (newsletterRes.value.data || []).length
    }
    if (ordersRes.status === 'fulfilled' && ordersRes.value.success) {
      const ts = ordersRes.value.stats || {}
      stats.value.orders = ts.total_orders || 0
      stats.value.pendingOrders = ts.pending_payment || 0
      stats.value.revenue = ts.total_revenue || 0
    }

    // Also fetch analytics
    await fetchAnalytics()
  } catch (error) {
    console.error('Dashboard load error:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const statusColor = (s) => {
  const map = { 'ใหม่': 'bg-blue-100 text-blue-700', 'กำลังดำเนินการ': 'bg-amber-100 text-amber-700', 'เสร็จสิ้น': 'bg-emerald-100 text-emerald-700', 'ยกเลิก': 'bg-red-100 text-red-700' }
  return map[s] || 'bg-gray-100 text-gray-700'
}
</script>

<template>
  <div>
    <!-- Header with greeting -->
    <div class="mb-8">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ greetingText }}, {{ adminName }}</h1>
          <p class="text-gray-500 mt-1 flex items-center gap-1">{{ todayStr }} — นี่คือภาพรวมระบบของคุณ
            <InfoTooltip title="หน้า Dashboard คืออะไร?" description="หน้านี้แสดงภาพรวมข้อมูลธุรกิจทั้งหมด<ul><li><strong>การ์ดสถิติ:</strong> จำนวนสินค้า, Leads, ข้อความ, บทความ, คำสั่งซื้อ, ยอดรายได้</li><li><strong>AI วิเคราะห์:</strong> กดปุ่มเพื่อให้ Gemini AI สรุปแนวโน้ม ข้อควรระวัง และคำแนะนำ</li><li><strong>สถิติเข้าชม:</strong> กราฟแสดงคนเข้าเว็บ เลือกดูรายสัปดาห์/เดือน</li><li><strong>หน้ายอดนิยม:</strong> 10 หน้าที่มีคนเข้าชมมากที่สุด</li><li><strong>Leads & ข้อความล่าสุด:</strong> ดูลูกค้าใหม่ที่เพิ่งเข้ามาได้ทันที</li></ul>" />
          </p>
        </div>
      </div>
    </div>

    <!-- AI MARKETING INSIGHTS -->
    <div v-if="analyticsData" class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden mb-8">
      <div class="p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            </div>
            <div>
              <h4 class="text-lg font-bold text-white">AI วิเคราะห์การตลาด</h4>
              <p class="text-gray-400 text-xs">วิเคราะห์ข้อมูล{{ periodLabel }}ด้วย Gemini AI</p>
            </div>
          </div>
          <button @click="generateAIInsights" :disabled="aiLoading"
            class="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-violet-600 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/30 flex items-center gap-2">
            <svg v-if="aiLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            {{ aiLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์ด้วย AI' }}
          </button>
        </div>

        <!-- AI Loading Animation -->
        <div v-if="aiLoading" class="mt-6 space-y-4">
          <div v-for="i in 3" :key="i" class="flex gap-3 items-start">
            <div class="w-8 h-8 rounded-lg bg-gray-700 animate-pulse flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-700 rounded animate-pulse" :style="{width: (60 + i * 10) + '%', animationDelay: i * 200 + 'ms'}"></div>
              <div class="h-3 bg-gray-700/50 rounded animate-pulse" :style="{width: (40 + i * 15) + '%', animationDelay: i * 300 + 'ms'}"></div>
            </div>
          </div>
          <p class="text-center text-gray-500 text-xs mt-2">AI กำลังวิเคราะห์ข้อมูลสถิติ {{ periodLabel }}...</p>
        </div>

        <!-- AI Error -->
        <div v-if="aiError" class="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <p class="text-rose-400 text-sm">{{ aiError }}</p>
        </div>

        <!-- AI Results -->
        <div v-if="aiInsights && !aiLoading" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Trends -->
          <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <h5 class="text-emerald-400 font-bold text-sm">แนวโน้มที่น่าสนใจ</h5>
            </div>
            <ul class="space-y-2">
              <li v-for="(trend, i) in aiInsights.trends" :key="i" class="text-gray-300 text-sm leading-relaxed flex gap-2">
                <svg class="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.883c-.77-.564-.37-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                <span>{{ trend }}</span>
              </li>
            </ul>
          </div>

          <!-- Warnings -->
          <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
              </div>
              <h5 class="text-amber-400 font-bold text-sm">ข้อควรระวัง</h5>
            </div>
            <ul class="space-y-2">
              <li v-for="(warn, i) in aiInsights.warnings" :key="i" class="text-gray-300 text-sm leading-relaxed flex gap-2">
                <svg class="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                <span>{{ warn }}</span>
              </li>
            </ul>
          </div>

          <!-- Recommendations -->
          <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <h5 class="text-blue-400 font-bold text-sm">คำแนะนำการตลาด</h5>
            </div>
            <ul class="space-y-2">
              <li v-for="(rec, i) in aiInsights.recommendations" :key="i" class="text-gray-300 text-sm leading-relaxed flex gap-2">
                <svg class="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                <span>{{ rec }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!aiInsights && !aiLoading && !aiError" class="mt-4 text-center py-6">
          <p class="text-gray-500 text-sm">กดปุ่ม "วิเคราะห์ด้วย AI" เพื่อให้ Gemini AI สรุปข้อมูลและแนะนำกลยุทธ์การตลาด</p>
        </div>
      </div>
    </div>


    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div v-for="i in 6" :key="i" class="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gray-200"></div>
          <div class="flex-1">
            <div class="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div class="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- Stat Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.orders }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">คำสั่งซื้อ</p>
        </div>

        <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-white">฿{{ Number(stats.revenue).toLocaleString() }}</p>
          <p class="text-xs font-medium text-emerald-100 mt-1">รายได้รวม</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-blue-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <svg class="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.products }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">สินค้า</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <svg class="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.leads }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">ใบเสนอราคา</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-amber-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
              <svg class="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.messages }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">ข้อความ</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-purple-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <svg class="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.articles }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">บทความ</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-teal-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center group-hover:bg-teal-500 transition-colors">
              <svg class="w-5 h-5 text-teal-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.projects }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">ผลงาน</p>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-rose-200 transition-all group">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
              <svg class="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
            </div>
          </div>
          <p class="text-2xl font-black text-gray-900 dark:text-white">{{ stats.subscribers }}</p>
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">สมาชิกข่าวสาร</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">ทางลัด</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <router-link v-for="action in quickActions" :key="action.name" :to="action.to" class="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 transition-all group">
            <div :class="[action.color, 'w-9 h-9 rounded-lg flex items-center justify-center']">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="action.icon"></path></svg>
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{{ action.name }}</span>
          </router-link>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- ANALYTICS & AI INSIGHTS SECTION            -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            วิเคราะห์การเข้าชมเว็บไซต์
          </h3>
          <div class="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button v-for="p in [{v:'today',l:'วันนี้'},{v:'week',l:'สัปดาห์'},{v:'month',l:'เดือน'},{v:'all',l:'ทั้งหมด'}]" 
              :key="p.v" @click="changePeriod(p.v)"
              :class="[analyticsPeriod === p.v ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:text-gray-700', 'px-3 py-1.5 rounded-lg text-xs transition-all']">
              {{ p.l }}
            </button>
          </div>
        </div>

        <!-- Analytics Loading -->
        <div v-if="analyticsLoading && !analyticsData" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div v-for="i in 5" :key="i" class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 animate-pulse">
            <div class="h-3 bg-gray-200 rounded w-16 mb-3"></div>
            <div class="h-7 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        <template v-if="analyticsData">
          <!-- Analytics Summary Cards -->
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg shadow-indigo-200">
              <p class="text-indigo-200 text-xs font-medium mb-1">ยอดเข้าชม</p>
              <p class="text-2xl font-black">{{ formatNumber(analyticsData.summary?.total_pageviews) }}</p>
            </div>
            <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-200">
              <p class="text-emerald-200 text-xs font-medium mb-1">เซสชัน</p>
              <p class="text-2xl font-black">{{ formatNumber(analyticsData.summary?.unique_sessions) }}</p>
            </div>
            <div class="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-4 text-white shadow-lg shadow-sky-200">
              <p class="text-sky-200 text-xs font-medium mb-1">เวลาเฉลี่ย</p>
              <p class="text-2xl font-black">{{ formatTime(analyticsData.summary?.avg_time_on_page) }}</p>
            </div>
            <div class="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-200">
              <p class="text-amber-200 text-xs font-medium mb-1">ความลึกการเลื่อน</p>
              <p class="text-2xl font-black">{{ Math.round(analyticsData.summary?.avg_scroll_depth || 0) }}%</p>
            </div>
            <div class="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-rose-200">
              <p class="text-rose-200 text-xs font-medium mb-1">อัตราตีกลับ</p>
              <p class="text-2xl font-black">{{ Math.round(analyticsData.summary?.bounce_rate || 0) }}%</p>
            </div>
          </div>

          <!-- Traffic Sources & Device Breakdown -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Traffic Sources -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h4 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                แหล่งที่มาของผู้เข้าชม
              </h4>
              <div v-if="analyticsData.referrers?.length" class="space-y-3">
                <div v-for="ref in analyticsData.referrers.slice(0, 6)" :key="ref.source" class="group">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-[200px]">{{ sourceLabel(ref.source) }}</span>
                    <span class="text-xs font-bold text-gray-500">{{ ref.count }}</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500" :style="{width: Math.max(4, (ref.count / maxReferrerCount) * 100) + '%'}"></div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-400 py-8 text-sm">ยังไม่มีข้อมูลแหล่งที่มา</div>
            </div>

            <!-- Device Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h4 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                อุปกรณ์ที่ใช้งาน
              </h4>
              <div v-if="analyticsData.devices?.length" class="flex items-center gap-6">
                <!-- CSS Donut -->
                <div class="relative w-28 h-28 flex-shrink-0">
                  <svg viewBox="0 0 36 36" class="w-28 h-28 transform -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" stroke-width="3.5"/>
                    <circle v-for="(d, i) in analyticsData.devices" :key="d.device_type" cx="18" cy="18" r="15.915" fill="none"
                      :stroke="deviceColor(d.device_type)" stroke-width="3.5"
                      :stroke-dasharray="devicePercentage(d.count) + ' ' + (100 - devicePercentage(d.count))"
                      :stroke-dashoffset="-(analyticsData.devices.slice(0, i).reduce((s, dd) => s + devicePercentage(dd.count), 0))"
                      class="transition-all duration-700"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-lg font-black text-gray-800 dark:text-white">{{ formatNumber(totalDeviceCount) }}</span>
                  </div>
                </div>
                <!-- Legend -->
                <div class="flex-1 space-y-3">
                  <div v-for="d in analyticsData.devices" :key="d.device_type" class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{backgroundColor: deviceColor(d.device_type) + '15'}">
                      <svg class="w-4 h-4" :style="{color: deviceColor(d.device_type)}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="deviceIcon(d.device_type)"></path></svg>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ deviceLabel(d.device_type) }}</span>
                        <span class="text-sm font-bold text-gray-900 dark:text-white">{{ devicePercentage(d.count) }}%</span>
                      </div>
                      <p class="text-xs text-gray-400">{{ formatNumber(d.count) }} ครั้ง</p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-gray-400 py-8 text-sm">ยังไม่มีข้อมูลอุปกรณ์</div>
            </div>
          </div>

          <!-- Top Pages & Top Products (Interest) -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <!-- Top Pages -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div class="p-5 border-b border-gray-100">
                <h4 class="font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path></svg>
                  หน้าที่ได้รับความนิยม
                </h4>
              </div>
              <div v-if="analyticsData.topPages?.length" class="divide-y divide-gray-50 dark:divide-gray-700/50">
                <div v-for="(page, idx) in analyticsData.topPages.slice(0, 8)" :key="page.page_path" class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    :class="idx < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'">{{ idx + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ page.page_title || page.page_path }}</p>
                    <p class="text-[10px] text-gray-400 font-mono truncate">{{ page.page_path }}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatNumber(page.views) }}</p>
                    <p class="text-[10px] text-gray-400">{{ formatNumber(page.unique_visitors) }} คน</p>
                  </div>
                </div>
              </div>
              <div v-else class="p-10 text-center text-gray-400 text-sm">ยังไม่มีข้อมูล</div>
            </div>

            <!-- Top Products (Interest) -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div class="p-5 border-b border-gray-100 dark:border-gray-700">
                <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z"></path></svg>
                  สินค้าที่ได้รับความสนใจ
                </h4>
              </div>
              <div v-if="analyticsData.topProducts?.length" class="divide-y divide-gray-50">
                <div v-for="(prod, idx) in analyticsData.topProducts.slice(0, 8)" :key="prod.page_path" class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    :class="idx < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">{{ idx + 1 }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 truncate">{{ prod.page_title || prod.page_path }}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-gray-900">{{ formatNumber(prod.views) }}</p>
                    <p class="text-[10px] text-gray-400">{{ formatNumber(prod.unique_visitors) }} คน</p>
                  </div>
                </div>
              </div>
              <div v-else class="p-10 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลสินค้า</div>
            </div>

            <!-- Top Wishlisted Products -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div class="p-5 border-b border-gray-100 dark:border-gray-700">
                <h4 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  สินค้ายอดฮิต (รายการโปรด)
                </h4>
              </div>
              <div v-if="analyticsData.topWishlisted?.length" class="divide-y divide-gray-50">
                <div v-for="(prod, idx) in analyticsData.topWishlisted.slice(0, 8)" :key="prod.id" class="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    :class="idx < 3 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'">{{ idx + 1 }}</span>
                  <div class="flex-1 min-w-0 flex items-center gap-2">
                    <img v-if="prod.image" :src="prod.image.startsWith('[') ? JSON.parse(prod.image)[0] : prod.image" class="w-8 h-8 rounded object-cover shadow-sm flex-shrink-0 border border-gray-100">
                    <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0" v-else>
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-800 truncate leading-tight">{{ prod.page_title }}</p>
                      <p class="text-[10px] text-gray-500 truncate">{{ prod.category }}</p>
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 bg-rose-50 px-2 py-1 rounded-lg">
                    <p class="text-xs font-bold text-rose-600">{{ formatNumber(prod.saves) }}</p>
                    <p class="text-[9px] text-rose-400 tracking-tighter">ครั้ง</p>
                  </div>
                </div>
              </div>
              <div v-else class="p-10 text-center text-gray-400 text-sm">ยังไม่มีข้อมูลสินค้าที่ถูกใจ</div>
            </div>
          </div>

        </template>
      </div>

      <!-- Main Content Grid (Leads & Messages) -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="!loading">
        <!-- Recent Leads -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">ใบเสนอราคาล่าสุด</h3>
              <router-link to="/admin/leads" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                ดูทั้งหมด
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </router-link>
            </div>
          </div>
          <div v-if="recentLeads.length > 0">
            <div v-for="lead in recentLeads" :key="lead.id" class="px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
              <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ lead.customer_name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ lead.phone }} · {{ lead.location || '-' }}</p>
                </div>
                <div class="flex items-center gap-2 ml-3">
                  <span :class="[statusColor(lead.status), 'px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap']">{{ lead.status || 'ใหม่' }}</span>
                  <span class="text-[10px] text-gray-400 whitespace-nowrap">{{ formatDate(lead.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-12 text-center text-gray-400">
            <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <p class="text-sm">ยังไม่มีใบเสนอราคา</p>
          </div>
        </div>

        <!-- Recent Messages -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">ข้อความจากลูกค้า</h3>
              <router-link to="/admin/inbox" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                ดูทั้งหมด
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </router-link>
            </div>
          </div>
          <div v-if="recentMessages.length > 0">
            <div v-for="msg in recentMessages" :key="msg.id" class="px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
              <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">{{ msg.name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 truncate">{{ msg.message || msg.subject || '-' }}</p>
                </div>
                <span class="text-[10px] text-gray-400 whitespace-nowrap ml-3">{{ formatDate(msg.created_at) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="p-12 text-center text-gray-400">
            <svg class="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <p class="text-sm">ยังไม่มีข้อความ</p>
          </div>
        </div>
      </div>

      <!-- Top Products Table -->
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden" v-if="!loading && topProducts.length > 0">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">สินค้าล่าสุด</h3>
            <router-link to="/admin/products" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              จัดการสินค้า
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </router-link>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="text-xs text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                <th class="text-left px-6 py-3">สินค้า</th>
                <th class="text-left px-6 py-3">รหัสสินค้า</th>
                <th class="text-left px-6 py-3">หมวดหมู่</th>
                <th class="text-right px-6 py-3">ราคา</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in topProducts" :key="p.id" class="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-3">
                  <div class="flex items-center gap-3">
                    <img v-if="p.image_url" :src="p.image_url" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                    <div v-else class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <p class="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[200px]">{{ p.name }}</p>
                  </div>
                </td>
                <td class="px-6 py-3 text-xs text-gray-500 font-mono">{{ p.sku || '-' }}</td>
                <td class="px-6 py-3 text-xs text-gray-500">{{ p.category }}</td>
                <td class="px-6 py-3 text-sm font-bold text-emerald-600 text-right">฿{{ Number(p.price || 0).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
