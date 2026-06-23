<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()
const API_BASE = import.meta.env.VITE_API_BASE || ''

const activeTab = ref('subscribers') // 'subscribers' | 'automation'

// ========== Subscribers Logic ==========
const subscribers = ref([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const perPage = ref(20)
const searchQuery = ref('')
const searchTimeout = ref(null)
const stats = ref({ total: 0, active: 0, inactive: 0, this_week: 0 })

const pageNumbers = computed(() => {
  const pages = []
  const total = totalPages.value
  const curr = currentPage.value
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (curr > 3) pages.push('...')
    for (let i = Math.max(2, curr - 1); i <= Math.min(total - 1, curr + 1); i++) pages.push(i)
    if (curr < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

async function fetchSubscribers() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: currentPage.value, limit: perPage.value })
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin?${params}`)
    const data = await res.json()
    if (data.success) {
      subscribers.value = data.data
      totalPages.value = data.totalPages || 1
      totalItems.value = data.total || 0
      if (data.stats) stats.value = data.stats
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1
    fetchSubscribers()
  }, 350)
}

function goToPage(page) {
  if (page === '...' || page === currentPage.value) return
  currentPage.value = page
  fetchSubscribers()
}

async function toggleActive(sub) {
  try {
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin/${sub.id}/toggle`, { method: 'PATCH' })
    const data = await res.json()
    if (data.success) {
      sub.is_active = !sub.is_active
      showToast(sub.is_active ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานแล้ว', 'success')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'error')
  }
}

const deleteSub = async (sub) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบอีเมล',
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบอีเมล ${sub.email} ออกจากรายชื่อผู้ติดตาม?`,
    confirmText: 'ลบข้อมูล',
    type: 'danger'
  })
  
  if (!isConfirmed) return
  try {
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin/${sub.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('ลบเรียบร้อยแล้ว', 'success')
      fetchSubscribers()
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'error')
  }
}

function exportCSV() {
  const token = localStorage.getItem('admin_token')
  window.open(`${API_BASE}/api/newsletter/admin/export?token=${token}`, '_blank')
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
}
function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function copyEmail(email) {
  navigator.clipboard.writeText(email)
  showToast('คัดลอกอีเมลแล้ว', 'success')
}

// ========== Automation Logic ==========
const autoConfig = ref({ enabled: false, time: '09:00', product_ids: [], last_sent_index: 0 })
const allProducts = ref([])
const productSearch = ref('')
const loadingAuto = ref(false)
const savingAuto = ref(false)
const testEmail = ref('')
const testingAuto = ref(false)

const filteredProducts = computed(() => {
  if (!productSearch.value) return allProducts.value
  const s = productSearch.value.toLowerCase()
  return allProducts.value.filter(p => p.name.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s))
})

async function fetchAllProducts() {
  try {
    const res = await apiFetch(`${API_BASE}/api/products?limit=1000`)
    const data = await res.json()
    if (data.success) allProducts.value = data.data || []
  } catch (e) {
    console.error(e)
  }
}

async function fetchAutoConfig() {
  loadingAuto.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin/automation`)
    const data = await res.json()
    if (data.success && data.config) autoConfig.value = data.config
  } catch (e) {
    console.error(e)
  } finally {
    loadingAuto.value = false
  }
}

async function saveAutoConfig() {
  savingAuto.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin/automation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(autoConfig.value)
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกการตั้งค่าแล้ว', 'success')
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'error')
  } finally {
    savingAuto.value = false
  }
}

async function sendTestEmail() {
  if (!testEmail.value) return showToast('กรุณาระบุอีเมลสำหรับทดสอบ', 'warning')
  testingAuto.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/newsletter/admin/automation/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail.value })
    })
    const data = await res.json()
    if (data.success) {
      showToast(`ส่งอีเมลทดสอบสำเร็จ (${data.product})`, 'success')
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาดในการทดสอบ', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาด', 'error')
  } finally {
    testingAuto.value = false
  }
}

function toggleProductSelection(id) {
  if (!autoConfig.value.product_ids) autoConfig.value.product_ids = []
  const idx = autoConfig.value.product_ids.indexOf(id)
  if (idx > -1) {
    autoConfig.value.product_ids.splice(idx, 1)
  } else {
    autoConfig.value.product_ids.push(id)
  }
}

onMounted(() => {
  fetchSubscribers()
  fetchAllProducts()
  fetchAutoConfig()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header & Tabs -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            การตลาดผ่านอีเมล
          </h1>
          <div class="text-sm text-gray-500 mt-1 ml-[52px] flex items-center gap-1">จัดการรายชื่อผู้ติดตามและระบบส่งอีเมลอัตโนมัติ
            <InfoTooltip title="Email Marketing" description="ส่งข่าวสารอัปเดตและโปรโมชั่นให้ลูกค้าเพื่อเพิ่มโอกาสการขายซ้ำ" />
          </div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="flex border-b border-gray-200 gap-6">
        <button 
          @click="activeTab = 'subscribers'" 
          class="pb-3 text-sm font-bold border-b-2 transition-all"
          :class="activeTab === 'subscribers' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          รายชื่อสมาชิก
        </button>
        <button 
          @click="activeTab = 'automation'" 
          class="pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2"
          :class="activeTab === 'automation' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          แคมเปญอัตโนมัติ (AI)
        </button>
      </div>
    </div>

    <!-- TAB: SUBSCRIBERS -->
    <template v-if="activeTab === 'subscribers'">
      <div class="flex justify-end mb-4">
        <button @click="exportCSV" class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          ส่งออก CSV
        </button>
      </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">ทั้งหมด</p>
        <p class="text-2xl font-black text-gray-900 mt-1">{{ stats.total || 0 }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p class="text-[11px] text-emerald-500 font-bold uppercase tracking-wider">ใช้งานอยู่</p>
        <p class="text-2xl font-black text-emerald-600 mt-1">{{ stats.active || 0 }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p class="text-[11px] text-gray-400 font-bold uppercase tracking-wider">ปิดใช้งาน</p>
        <p class="text-2xl font-black text-gray-400 mt-1">{{ stats.inactive || 0 }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <p class="text-[11px] text-violet-500 font-bold uppercase tracking-wider">สัปดาห์นี้</p>
        <p class="text-2xl font-black text-violet-600 mt-1">{{ stats.this_week || 0 }}</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input
          v-model="searchQuery"
          @input="onSearch"
          placeholder="ค้นหาอีเมล..."
          class="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
      <div class="text-center">
        <div class="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mx-auto mb-3"></div>
        <p class="text-sm text-gray-400">กำลังโหลดข้อมูล...</p>
      </div>
    </div>

    <!-- Table -->
    <template v-else>
      <div v-if="subscribers.length === 0" class="flex-1 flex items-center justify-center py-20">
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <p class="text-gray-400 font-medium">ยังไม่มีสมาชิกข่าวสาร</p>
        </div>
      </div>

      <div v-else class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">#</th>
                <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">อีเมล</th>
                <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">สถานะ</th>
                <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">วันที่สมัคร</th>
                <th class="text-left px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">IP</th>
                <th class="text-right px-5 py-3.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(sub, idx) in subscribers" :key="sub.id" class="hover:bg-violet-50/30 transition-colors group">
                <td class="px-5 py-3.5 text-gray-400 text-xs">{{ (currentPage - 1) * perPage + idx + 1 }}</td>
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-black text-violet-600">{{ sub.email.charAt(0).toUpperCase() }}</span>
                    </div>
                    <span class="font-semibold text-gray-800">{{ sub.email }}</span>
                    <button @click="copyEmail(sub.email)" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-600 transition-all" title="คัดลอก">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    </button>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <button @click="toggleActive(sub)" class="group/btn">
                    <span v-if="sub.is_active" class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer">
                      <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      ใช้งาน
                    </span>
                    <span v-else class="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">
                      <span class="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                      ปิด
                    </span>
                  </button>
                </td>
                <td class="px-5 py-3.5 text-gray-500 text-xs">
                  <div>{{ formatDate(sub.subscribed_at) }}</div>
                  <div class="text-gray-400">{{ formatTime(sub.subscribed_at) }}</div>
                </td>
                <td class="px-5 py-3.5 text-gray-400 text-xs font-mono">{{ sub.ip_address || '-' }}</td>
                <td class="px-5 py-3.5 text-right">
                  <button @click="deleteSub(sub)" class="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50" title="ลบ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <p class="text-xs text-gray-400">แสดง {{ subscribers.length }} จาก {{ totalItems }} รายการ</p>
        <div class="flex items-center gap-1">
          <button @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1" class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30" :class="currentPage > 1 ? 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50' : 'border-gray-100 text-gray-300'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">···</span>
            <button v-else @click="goToPage(p)" class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold border transition-all" :class="p === currentPage ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'">
              {{ p }}
            </button>
          </template>
          <button @click="goToPage(currentPage + 1)" :disabled="currentPage >= totalPages" class="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-30" :class="currentPage < totalPages ? 'border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50' : 'border-gray-100 text-gray-300'">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </template>
    </template>

    <!-- TAB: AUTOMATION -->
    <template v-if="activeTab === 'automation'">
      <div v-if="loadingAuto" class="flex items-center justify-center py-20">
        <div class="w-10 h-10 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
      
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Settings -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <!-- General Setup -->
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">ตั้งค่าระบบส่งอัตโนมัติ</h3>
                <p class="text-sm text-gray-500 mt-1">ให้ AI สุ่มหยิบสินค้า 1 ชิ้นในรายการที่เลือกไปสร้างเป็นอีเมลแนะนำสินค้า</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="autoConfig.enabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                <span class="ml-3 text-sm font-bold" :class="autoConfig.enabled ? 'text-emerald-600' : 'text-gray-400'">{{ autoConfig.enabled ? 'เปิดใช้งาน' : 'ปิด' }}</span>
              </label>
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-bold text-gray-700 mb-2">เวลาที่ส่ง (รายวัน)</label>
              <input type="time" v-model="autoConfig.time" class="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 font-medium">
            </div>
            
            <button @click="saveAutoConfig" :disabled="savingAuto" class="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 mt-4">
              <svg v-if="savingAuto" class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              {{ savingAuto ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
            </button>
          </div>

          <!-- Product Selection -->
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 flex-1 flex flex-col min-h-[400px]">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-900">สินค้าในแคมเปญ ({{ autoConfig.product_ids.length }} รายการ)</h3>
                <p class="text-sm text-gray-500 mt-1">เลือกสินค้าที่ต้องการให้ระบบนำมาสุ่มสร้างอีเมล</p>
              </div>
              <button @click="saveAutoConfig" :disabled="savingAuto" class="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50">
                <svg v-if="savingAuto" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                บันทึกสินค้า
              </button>
            </div>
            
            <div class="relative mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input v-model="productSearch" type="text" placeholder="ค้นหาสินค้า (ชื่อ, SKU)..." class="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30">
            </div>
            
            <div class="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-2 max-h-[400px]">
              <div v-if="filteredProducts.length === 0" class="text-center py-10 text-gray-400 text-sm">ไม่พบสินค้า</div>
              <div v-for="product in filteredProducts" :key="product.id" @click="toggleProductSelection(product.id)" class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center border rounded-md transition-colors" :class="autoConfig.product_ids.includes(product.id) ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-300 text-transparent'">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
                </div>
                <div class="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover">
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-300"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 truncate">{{ product.name }}</p>
                  <p class="text-xs text-gray-500 truncate">SKU: {{ product.sku || '-' }} • ฿{{ product.price }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sidebar Test Send -->
        <div class="flex flex-col gap-6">
          <div class="bg-violet-50 border border-violet-100 rounded-2xl p-6">
            <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 text-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">ทดสอบแคมเปญ</h3>
            <p class="text-sm text-gray-600 mb-6">กรอกอีเมลของคุณเพื่อทดลองรับอีเมลแคมเปญ ระบบจะสุ่ม 1 สินค้าจากที่คุณเลือกมาสร้างเป็นเนื้อหาโดย AI</p>
            
            <input v-model="testEmail" type="email" placeholder="example@email.com" class="w-full px-4 py-2.5 bg-white border border-violet-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-3">
            <button @click="sendTestEmail" :disabled="testingAuto || !testEmail || autoConfig.product_ids.length === 0" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50">
              <svg v-if="testingAuto" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              {{ testingAuto ? 'กำลังเขียนและส่งอีเมล...' : 'ทดสอบส่งอีเมล' }}
            </button>
            <p v-if="autoConfig.product_ids.length === 0" class="text-xs text-red-500 mt-2 text-center">กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นก่อนทดสอบ</p>
          </div>
          
          <div class="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
            <h3 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              คำแนะนำการใช้งาน
            </h3>
            <ul class="text-xs text-gray-500 space-y-2 list-disc pl-4">
              <li>ระบบจะทำงานตามเวลาที่คุณตั้งไว้ทุกวัน (วันละ 1 ครั้ง)</li>
              <li>การเขียนเนื้อหาและดึงรูปมาใส่กระทำโดย AI อัตโนมัติ</li>
              <li>ควรเลือกสินค้าให้หลากหลาย เพื่อไม่ให้ผู้รับรู้สึกเบื่อหากได้รับอีเมลซ้ำๆ</li>
              <li>โปรดตั้งค่า SMTP (Email Server) ในหน้า 'ตั้งค่าระบบ' ให้เรียบร้อยก่อนเปิดใช้งาน</li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

