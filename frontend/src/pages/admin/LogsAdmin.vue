<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '../../utils/apiFetch'
import { useConfirm } from '../../composables/useConfirm'
import { useToast } from '../../composables/useToast'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showConfirm } = useConfirm()
const { showToast } = useToast()
const route = useRoute()
const router = useRouter()

// Reactive States computed from URL route path
const currentTab = computed(() => {
  if (route.path.endsWith('/orders')) return 'orders'
  if (route.path.endsWith('/emails')) return 'emails'
  return 'system'
})
const logs = ref([])
const loading = ref(true)
const errorMsg = ref('')
const selectedLog = ref(null)

// Filtering & Pagination States
const page = ref(1)
const limit = ref(50)
const level = ref('') // System logs level filter
const emailStatus = ref('') // Email logs status filter
const searchQuery = ref('')
const searchInput = ref('') // Search input state for manual typing
const totalLogs = ref(0)
const totalPages = ref(0)

// Dynamic Search Input Placeholder
const searchPlaceholder = computed(() => {
  if (currentTab.value === 'system') return 'ค้นหาข้อความ, พาธเว็บไซต์ (URL), IP หรือวันที่...'
  if (currentTab.value === 'orders') return 'ค้นหาเลขที่คำสั่งซื้อ, กิจกรรม, หมายเหตุ หรือผู้บันทึก...'
  return 'ค้นหาอีเมลผู้รับ, หัวข้อจดหมาย, ประเภท หรือข้อผิดพลาด...'
})

// Tab title text
const tabTitle = computed(() => {
  if (currentTab.value === 'system') return 'บันทึกการทำงานของระบบ (System Logs)'
  if (currentTab.value === 'orders') return 'ประวัติกิจกรรมคำสั่งซื้อ (Order Activity Logs)'
  return 'ประวัติการส่งอีเมล (Email Logs)'
})

// Tab description text
const tabDescription = computed(() => {
  if (currentTab.value === 'system') return 'ตรวจสอบประวัติการเข้าใช้งาน กิจกรรมต่างๆ และข้อผิดพลาดที่เกิดขึ้นภายในระบบหลังบ้านแบบ Real-Time (Winston Logs)'
  if (currentTab.value === 'orders') return 'ตรวจสอบประวัติการทำกิจกรรม ลำดับขั้นตอน และการอัปเดตสถานะของคำสั่งซื้อแต่ละรายการในระบบฐานข้อมูล'
  return 'ตรวจสอบประวัติการส่งอีเมลแจ้งเตือนลูกค้า ระบบอีเมลตอบกลับอัตโนมัติ และข้อความแจ้งเตือนที่ผิดพลาดในการจัดส่ง'
})

// Fetch Logs from Backend
const fetchLogs = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const params = new URLSearchParams({
      page: page.value,
      limit: limit.value,
      query: searchQuery.value
    })
    
    let url = ''
    if (currentTab.value === 'system') {
      if (level.value) params.append('level', level.value)
      url = `/api/system/logs?${params.toString()}`
    } else if (currentTab.value === 'orders') {
      url = `/api/system/order-activities?${params.toString()}`
    } else if (currentTab.value === 'emails') {
      if (emailStatus.value) params.append('status', emailStatus.value)
      url = `/api/system/email-logs?${params.toString()}`
    }

    const res = await apiFetch(url)
    
    if (res.status === 401 || res.status === 403) {
      return
    }

    const data = await res.json()
    if (data.success) {
      logs.value = data.data
      totalLogs.value = data.pagination.total
      totalPages.value = data.pagination.totalPages
    } else {
      errorMsg.value = data.error || 'ไม่สามารถโหลดประวัติข้อมูลได้'
    }
  } catch (error) {
    console.error('Failed to fetch logs:', error)
    errorMsg.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
  } finally {
    loading.value = false
  }
}

// Search Trigger
const handleSearch = () => {
  searchQuery.value = searchInput.value
  page.value = 1
  fetchLogs()
}

// Clear Search
const clearSearch = () => {
  searchInput.value = ''
  searchQuery.value = ''
  page.value = 1
  fetchLogs()
}

// Switch Tab by pushing to new route path
const setTab = (tab) => {
  if (tab === 'system') router.push('/admin/logs')
  else if (tab === 'orders') router.push('/admin/logs/orders')
  else if (tab === 'emails') router.push('/admin/logs/emails')
}

// Format Date & Time beautifully
const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })
}

// Clear Log File Action
const handleClearLogs = async () => {
  let title = ''
  let message = ''
  let deleteUrl = ''
  let successMsg = ''

  if (currentTab.value === 'system') {
    title = 'ยืนยันการเคลียร์ประวัติ System Log'
    message = 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการทำงานของระบบทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้ และไฟล์ระบบจะถูกเริ่มบันทึกใหม่ทั้งหมด'
    deleteUrl = '/api/system/logs'
    successMsg = 'เคลียร์บันทึกการใช้งานระบบ (System Logs) เรียบร้อยแล้ว'
  } else if (currentTab.value === 'orders') {
    title = 'ยืนยันการเคลียร์ประวัติกิจกรรมคำสั่งซื้อ'
    message = 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติกิจกรรมคำสั่งซื้อทั้งหมดในระบบฐานข้อมูล? การกระทำนี้ไม่สามารถย้อนกลับได้'
    deleteUrl = '/api/system/order-activities'
    successMsg = 'เคลียร์ประวัติกิจกรรมคำสั่งซื้อเรียบร้อยแล้ว'
  } else if (currentTab.value === 'emails') {
    title = 'ยืนยันการเคลียร์ประวัติการส่งอีเมล'
    message = 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติการส่งอีเมลทั้งหมดในระบบฐานข้อมูล? การกระทำนี้ไม่สามารถย้อนกลับได้'
    deleteUrl = '/api/system/email-logs'
    successMsg = 'เคลียร์ประวัติการส่งอีเมลเรียบร้อยแล้ว'
  }

  const isConfirmed = await showConfirm({
    title,
    message,
    confirmText: 'ยืนยันเคลียร์ข้อมูล',
    type: 'danger'
  })

  if (!isConfirmed) return

  loading.value = true
  try {
    const res = await apiFetch(deleteUrl, {
      method: 'DELETE'
    })
    
    const data = await res.json()
    if (data.success) {
      showToast(successMsg, 'success')
      selectedLog.value = null
      page.value = 1
      fetchLogs()
    } else {
      showToast(data.error || 'ไม่สามารถเคลียร์ข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('Failed to clear logs:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error')
  } finally {
    loading.value = false
  }
}

// Copy Log JSON to clipboard
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showToast('คัดลอกข้อมูล JSON เรียบร้อยแล้ว', 'success')
  }).catch(() => {
    showToast('ไม่สามารถคัดลอกข้อมูลได้', 'error')
  })
}

// Watch tab changes to reset filters and fetch logs
watch(currentTab, () => {
  page.value = 1
  limit.value = 50
  searchInput.value = ''
  searchQuery.value = ''
  level.value = ''
  emailStatus.value = ''
  selectedLog.value = null
  fetchLogs()
}, { immediate: true })

// Watch filters to fetch on change
watch([level, emailStatus, limit], () => {
  page.value = 1
  fetchLogs()
})
</script>

<template>
  <div class="h-full flex flex-col pt-0 sm:pt-4">
    
    <!-- Tabbed Navigation Panel -->
    <div class="flex flex-wrap border-b border-gray-200 dark:border-gray-700/80 mb-6 bg-white dark:bg-gray-800 rounded-t-2xl shadow-sm overflow-hidden">
      <button 
        @click="setTab('system')"
        :class="[
          'px-6 py-3.5 font-bold text-xs sm:text-sm transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start',
          currentTab === 'system' 
            ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40'
        ]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        บันทึกระบบ (System Logs)
      </button>

      <button 
        @click="setTab('orders')"
        :class="[
          'px-6 py-3.5 font-bold text-xs sm:text-sm transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start',
          currentTab === 'orders' 
            ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40'
        ]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        กิจกรรมสั่งซื้อ (Order Logs)
      </button>

      <button 
        @click="setTab('emails')"
        :class="[
          'px-6 py-3.5 font-bold text-xs sm:text-sm transition-all duration-200 border-b-2 -mb-px flex items-center gap-2 flex-1 sm:flex-none justify-center sm:justify-start',
          currentTab === 'emails' 
            ? 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5' 
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/40'
        ]"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        ประวัติส่งอีเมล (Email Logs)
      </button>
    </div>

    <!-- Header Section -->
    <div class="mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <svg v-if="currentTab === 'system'" class="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <svg v-else-if="currentTab === 'orders'" class="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <svg v-else class="w-8 h-8 text-emerald-600 dark:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {{ tabTitle }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium flex items-center gap-1.5 flex-wrap">
          {{ tabDescription }}
          <InfoTooltip :title="currentTab === 'system' ? 'System Logs' : currentTab === 'orders' ? 'Order Logs' : 'Email Logs'" :description="tabDescription" />
        </p>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-3 w-full md:w-auto">
        <button 
          id="btn-clear-logs"
          @click="handleClearLogs" 
          class="flex-1 md:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-500/20 rounded-xl font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          ล้างบันทึกทั้งหมด
        </button>

        <button 
          id="btn-refresh-logs"
          @click="fetchLogs" 
          class="group px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl font-bold shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg :class="['w-4 h-4 transition-transform duration-500', loading ? 'animate-spin' : 'group-hover:rotate-180']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          ดึงข้อมูลล่าสุด
        </button>
      </div>
    </div>

    <!-- Filters and Search Toolbar -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700/80 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
      
      <!-- Search Input -->
      <form @submit.prevent="handleSearch" class="flex-1 flex gap-2">
        <div class="relative flex-1">
          <svg class="absolute left-3.5 top-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            id="input-log-search"
            v-model="searchInput" 
            type="text" 
            :placeholder="searchPlaceholder" 
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 pl-10 pr-10 text-sm font-medium transition-all"
          />
          <button 
            v-if="searchInput" 
            type="button" 
            @click="clearSearch" 
            class="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <button 
          id="btn-log-search-submit"
          type="submit" 
          class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 dark:shadow-none transition-all"
        >
          ค้นหา
        </button>
      </form>

      <!-- Advanced Select Dropdowns -->
      <div class="flex flex-wrap sm:flex-nowrap items-center gap-3">
        <!-- Log Level Select (System Tab only) -->
        <div v-if="currentTab === 'system'" class="w-full sm:w-48 flex flex-col gap-1">
          <select 
            id="select-log-level"
            v-model="level" 
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 px-3 text-sm font-medium transition-all"
          >
            <option value="">ระดับ Log (ทั้งหมด)</option>
            <option value="info">Info (ทั่วไป)</option>
            <option value="warn">Warn (เตือนภัย)</option>
            <option value="error">Error (ผิดพลาด)</option>
            <option value="debug">Debug (ตรวจสอบระบบ)</option>
          </select>
        </div>

        <!-- Email Status Select (Emails Tab only) -->
        <div v-if="currentTab === 'emails'" class="w-full sm:w-48 flex flex-col gap-1">
          <select 
            id="select-email-status"
            v-model="emailStatus" 
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 px-3 text-sm font-medium transition-all"
          >
            <option value="">สถานะการส่ง (ทั้งหมด)</option>
            <option value="success">Success (สำเร็จ)</option>
            <option value="failed">Failed (ล้มเหลว)</option>
          </select>
        </div>

        <!-- Limit Select -->
        <div class="w-full sm:w-36 flex flex-col gap-1">
          <select 
            id="select-log-limit"
            v-model="limit" 
            class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 px-3 text-sm font-medium transition-all"
          >
            <option :value="20">แสดง 20 รายการ</option>
            <option :value="50">แสดง 50 รายการ</option>
            <option :value="100">แสดง 100 รายการ</option>
            <option :value="200">แสดง 200 รายการ</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Logs Listing & Visual Layout -->
    <div class="flex-1 flex gap-6 min-h-0 bg-transparent relative">
      
      <!-- Logs Table Section -->
      <div class="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden h-full">
        
        <!-- Table Header Info bar -->
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
          <h3 class="font-bold text-gray-900 dark:text-white text-base">บันทึกกิจกรรมล่าสุด</h3>
          <span class="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/80 px-2.5 py-1 rounded-lg">
            พบทั้งหมด {{ totalLogs }} รายการ
          </span>
        </div>

        <!-- Scrollable Table Container -->
        <div class="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr v-if="currentTab === 'system'" class="bg-gray-50/50 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                <th class="py-3 px-5 w-24">ระดับ (Level)</th>
                <th class="py-3 px-5 w-48">วัน-เวลา (Timestamp)</th>
                <th class="py-3 px-5">รายละเอียดประวัติระบบ (Message)</th>
              </tr>
              <tr v-else-if="currentTab === 'orders'" class="bg-gray-50/50 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                <th class="py-3 px-5 w-48">เลขที่คำสั่งซื้อ (Order ID)</th>
                <th class="py-3 px-5 w-28">ผู้บันทึก (By)</th>
                <th class="py-3 px-5 w-40">กิจกรรม (Action)</th>
                <th class="py-3 px-5">รายละเอียด (Details)</th>
                <th class="py-3 px-5 w-44">วัน-เวลา (Created At)</th>
              </tr>
              <tr v-else-if="currentTab === 'emails'" class="bg-gray-50/50 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700 text-[11px] font-black uppercase text-gray-400 tracking-wider">
                <th class="py-3 px-5 w-52">ผู้รับ (Recipient)</th>
                <th class="py-3 px-5">หัวข้อจดหมาย (Subject)</th>
                <th class="py-3 px-5 w-36">ประเภท (Type)</th>
                <th class="py-3 px-5 w-28">สถานะ (Status)</th>
                <th class="py-3 px-5 w-44">วัน-เวลา (Sent At)</th>
              </tr>
            </thead>
            
            <tbody>
              <!-- Loading State -->
              <tr v-if="loading">
                <td colspan="5" class="py-16 text-center text-gray-400">
                  <div class="flex flex-col items-center justify-center gap-3">
                    <svg class="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>กำลังประมวลผลข้อมูลบันทึกประวัติ...</span>
                  </div>
                </td>
              </tr>

              <!-- Error State -->
              <tr v-else-if="errorMsg">
                <td colspan="5" class="py-16 text-center">
                  <div class="inline-flex flex-col items-center justify-center gap-3 max-w-md">
                    <div class="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p class="text-rose-500 font-bold leading-relaxed">{{ errorMsg }}</p>
                  </div>
                </td>
              </tr>

              <!-- Empty State -->
              <tr v-else-if="logs.length === 0">
                <td colspan="5" class="py-16 text-center">
                  <div class="flex flex-col items-center justify-center gap-4">
                    <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-400 dark:text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100/50 dark:border-emerald-500/20 shadow-inner">
                      <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 class="text-gray-900 dark:text-white font-bold text-base">ไม่พบข้อมูลประวัติการบันทึก</h3>
                    <p class="text-sm text-gray-400">ยังไม่มีกิจกรรมที่สอดคล้องกับตัวกรองที่ระบุ</p>
                  </div>
                </td>
              </tr>

              <!-- Log Rows -->
              <template v-else>
                <!-- System Logs Rows -->
                <template v-if="currentTab === 'system'">
                  <tr 
                    v-for="(log, idx) in logs" 
                    :key="'sys-' + idx"
                    @click="selectedLog = log"
                    :class="[
                      'border-b border-gray-100/80 dark:border-gray-700/60 hover:bg-gray-50/55 dark:hover:bg-gray-700/30 transition-all duration-150 cursor-pointer group',
                      selectedLog === log ? 'bg-emerald-50/20 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : ''
                    ]"
                  >
                    <td class="py-3.5 px-5 font-bold text-xs uppercase align-middle">
                      <span 
                        v-if="log.level === 'info'" 
                        class="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10 rounded-full"
                      >
                        Info
                      </span>
                      <span 
                        v-else-if="log.level === 'warn' || log.level === 'warning'" 
                        class="px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/10 rounded-full"
                      >
                        Warning
                      </span>
                      <span 
                        v-else-if="log.level === 'error'" 
                        class="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/10 rounded-full"
                      >
                        Error
                      </span>
                      <span 
                        v-else 
                        class="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/10 rounded-full"
                      >
                        {{ log.level }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400 font-mono align-middle">
                      {{ formatDateTime(log.timestamp) }}
                    </td>
                    <td class="py-3.5 px-5 align-middle">
                      <div class="flex justify-between items-start gap-4">
                        <div class="text-xs text-gray-800 dark:text-gray-200 font-medium font-mono break-all line-clamp-2 leading-relaxed">
                          {{ log.message }}
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-emerald-600 dark:text-emerald-400">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                </template>

                <!-- Order Activity Logs Rows -->
                <template v-else-if="currentTab === 'orders'">
                  <tr 
                    v-for="log in logs" 
                    :key="'ord-' + log.id"
                    @click="selectedLog = log"
                    :class="[
                      'border-b border-gray-100/80 dark:border-gray-700/60 hover:bg-gray-50/55 dark:hover:bg-gray-700/30 transition-all duration-150 cursor-pointer group',
                      selectedLog === log ? 'bg-emerald-50/20 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : ''
                    ]"
                  >
                    <td class="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400 font-mono align-middle">
                      {{ log.order_id }}
                    </td>
                    <td class="py-3.5 px-5 font-bold text-xs align-middle">
                      <span 
                        :class="[
                          'px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border',
                          log.performed_by === 'admin' 
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200/30' 
                            : log.performed_by === 'system'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/30'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300/30'
                        ]"
                      >
                        {{ log.performed_by }}
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-xs font-bold text-gray-800 dark:text-gray-200 align-middle">
                      <span class="font-mono text-emerald-600 dark:text-emerald-500">{{ log.action }}</span>
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-700 dark:text-gray-300 align-middle">
                      <div class="line-clamp-2 leading-relaxed">{{ log.details }}</div>
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400 font-mono align-middle">
                      {{ formatDateTime(log.created_at) }}
                    </td>
                  </tr>
                </template>

                <!-- Email Logs Rows -->
                <template v-else-if="currentTab === 'emails'">
                  <tr 
                    v-for="log in logs" 
                    :key="'eml-' + log.id"
                    @click="selectedLog = log"
                    :class="[
                      'border-b border-gray-100/80 dark:border-gray-700/60 hover:bg-gray-50/55 dark:hover:bg-gray-700/30 transition-all duration-150 cursor-pointer group',
                      selectedLog === log ? 'bg-emerald-50/20 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400' : ''
                    ]"
                  >
                    <td class="py-3.5 px-5 text-xs text-gray-800 dark:text-gray-200 font-semibold font-mono align-middle">
                      {{ log.recipient }}
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-700 dark:text-gray-300 font-medium align-middle">
                      <div class="line-clamp-2 leading-relaxed">{{ log.subject }}</div>
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400 font-mono align-middle">
                      {{ log.email_type }}
                    </td>
                    <td class="py-3.5 px-5 font-bold text-xs uppercase align-middle">
                      <span 
                        v-if="log.status === 'success'" 
                        class="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/10 rounded-full"
                      >
                        Success
                      </span>
                      <span 
                        v-else 
                        class="px-2.5 py-1 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/10 rounded-full"
                      >
                        Failed
                      </span>
                    </td>
                    <td class="py-3.5 px-5 text-xs text-gray-500 dark:text-gray-400 font-mono align-middle">
                      {{ formatDateTime(log.created_at) }}
                    </td>
                  </tr>
                </template>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls Footer -->
        <div 
          v-if="totalPages > 1 && !loading" 
          class="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-600 dark:text-gray-400"
        >
          <span>
            แสดงหน้า {{ page }} จากทั้งหมด {{ totalPages }} หน้า ({{ limit }} รายการต่อหน้า)
          </span>

          <div class="flex items-center gap-1.5">
            <!-- First Page -->
            <button 
              id="btn-pagination-first"
              @click="page = 1; fetchLogs()" 
              :disabled="page === 1"
              class="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            >
              &laquo; หน้าแรก
            </button>

            <!-- Prev Page -->
            <button 
              id="btn-pagination-prev"
              @click="page = Math.max(1, page - 1); fetchLogs()" 
              :disabled="page === 1"
              class="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            >
              &lsaquo; ก่อนหน้า
            </button>

            <span class="px-2 text-gray-400 font-medium">
              หน้า {{ page }}
            </span>

            <!-- Next Page -->
            <button 
              id="btn-pagination-next"
              @click="page = Math.min(totalPages, page + 1); fetchLogs()" 
              :disabled="page === totalPages"
              class="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            >
              ถัดไป &rsaquo;
            </button>

            <!-- Last Page -->
            <button 
              id="btn-pagination-last"
              @click="page = totalPages; fetchLogs()" 
              :disabled="page === totalPages"
              class="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            >
              หน้าสุดท้าย &raquo;
            </button>
          </div>
        </div>

      </div>

      <!-- Right Panel: slide out Drawer for Detailed JSON inspect -->
      <Transition name="drawer">
        <div 
          v-if="selectedLog" 
          class="w-full lg:w-[480px] bg-gray-900 border-l border-gray-800 flex flex-col h-full absolute inset-y-0 right-0 lg:relative z-30 shadow-2xl text-gray-200"
        >
          <!-- Drawer Header -->
          <div class="px-5 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/80">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 class="font-extrabold text-sm text-white tracking-wide">โครงสร้างรายละเอียด (JSON)</h3>
            </div>
            <button 
              id="btn-close-log-drawer"
              @click="selectedLog = null" 
              class="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Drawer Body -->
          <div class="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-950/30 flex flex-col">
            <!-- Time Info callout -->
            <div class="mb-4 bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex flex-col gap-1.5">
              <span class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">วันเวลาที่บันทึก</span>
              <span class="text-sm font-semibold text-white font-mono">
                {{ formatDateTime(selectedLog.timestamp || selectedLog.created_at) }}
              </span>
            </div>

            <!-- Email Failed Warning banner -->
            <div v-if="currentTab === 'emails' && selectedLog.status === 'failed' && selectedLog.error_message" class="mb-4 bg-rose-950/30 border border-rose-900/50 rounded-xl p-3.5 text-xs text-rose-400 leading-relaxed font-mono">
              <strong class="block text-rose-300 font-black mb-1 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-rose-400 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                ERROR MESSAGE:
              </strong>
              {{ selectedLog.error_message }}
            </div>

            <!-- JSON Pre block -->
            <div class="relative flex-1 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col min-h-[300px]">
              <div class="absolute right-3 top-3 z-10">
                <button 
                  id="btn-copy-log-json"
                  @click="copyToClipboard(JSON.stringify(selectedLog, null, 2))" 
                  class="bg-gray-800 hover:bg-emerald-600 hover:text-white border border-gray-700 text-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  คัดลอกข้อมูล
                </button>
              </div>

              <!-- Pretty Formatted Code -->
              <pre class="flex-1 p-5 overflow-auto font-mono text-[11px] leading-relaxed text-emerald-400 custom-scrollbar selection:bg-emerald-500/30">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </Transition>
      
    </div>
  </div>
</template>

<style scoped>
/* Slide transition for JSON Drawer */
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
}
.drawer-enter-from, .drawer-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom Webkit Scrollbars for responsive panels */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent; 
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #374151; 
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #4b5563; 
}
</style>
