<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useToast } from '../../composables/useToast'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const leads = ref([])
const loading = ref(true)
const error = ref(null)
const selectedLead = ref(null)

// Product detail for modal
const attachedProductData = ref(null)
const productLoading = ref(false)

// Pagination & search
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const perPage = ref(15)
const searchQuery = ref('')
const filterStatus = ref('all')
const searchTimeout = ref(null)

// Stats from server
const stats = ref({ total: 0, new: 0, contacted: 0, closed: 0 })

// Delete state
const deleteTarget = ref(null)
const deleteLoading = ref(false)

const API_BASE = import.meta.env.VITE_API_BASE || ''
const statusOptions = ['ใหม่', 'ติดต่อแล้ว', 'ปิดการขาย']
const { showToast } = useToast()

// Page numbers for pagination
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

async function fetchLeads() {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: perPage.value,
    })
    if (searchQuery.value.trim()) params.set('search', searchQuery.value.trim())
    if (filterStatus.value !== 'all') params.set('status', filterStatus.value)

    const res = await apiFetch(`${API_BASE}/api/quotation-submit?${params}`)
    const data = await res.json()
    if (data.success) {
      leads.value = data.data
      totalPages.value = data.totalPages || 1
      totalItems.value = data.total || 0
      if (data.stats) stats.value = data.stats
    } else {
      error.value = data.error || 'ไม่สามารถโหลดข้อมูลได้'
    }
  } catch (e) {
    error.value = 'เกิดข้อผิดพลาดในการเชื่อมต่อ API'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    currentPage.value = 1
    fetchLeads()
  }, 350)
}

function setFilter(status) {
  filterStatus.value = status
  currentPage.value = 1
  fetchLeads()
}

function goToPage(page) {
  if (page === '...' || page === currentPage.value) return
  currentPage.value = page
  fetchLeads()
}

async function updateStatus(lead, newStatus) {
  try {
    const res = await apiFetch(`${API_BASE}/api/quotation-submit/${lead.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      lead.status = newStatus
      if (selectedLead.value?.id === lead.id) selectedLead.value.status = newStatus
      showToast(`อัปเดตสถานะเป็น "${newStatus}" แล้ว`, 'success')
      // Refresh stats
      fetchLeads()
    } else {
      showToast(data.error || 'ไม่สามารถอัปเดตสถานะได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  }
}

async function openDetail(lead) {
  selectedLead.value = lead
  attachedProductData.value = null
  if (lead.attached_product) {
    productLoading.value = true
    try {
      const searchName = lead.attached_product.trim()
      const res = await apiFetch(`${API_BASE}/api/products?search=${encodeURIComponent(searchName)}`)
      const data = await res.json()
      if (data.success && data.data?.length > 0) {
        // Find best match
        const match = data.data.find(p => p.name === searchName) || data.data[0]
        attachedProductData.value = match
      }
    } catch (e) {
      console.error('Failed to fetch attached product:', e)
    } finally {
      productLoading.value = false
    }
  }
}
function closeDetail() {
  selectedLead.value = null
  attachedProductData.value = null
}

function openDeleteConfirm(lead) {
  deleteTarget.value = lead
}
function cancelDelete() {
  deleteTarget.value = null
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    const res = await apiFetch(`${API_BASE}/api/quotation-submit/${deleteTarget.value.id}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (data.success) {
      if (selectedLead.value?.id === deleteTarget.value.id) selectedLead.value = null
      showToast('ลบรายการเรียบร้อยแล้ว', 'success')
      cancelDelete()
      searchQuery.value = ''
      currentPage.value = 1
      fetchLeads()
    } else {
      showToast(data.error || 'ไม่สามารถลบได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    deleteLoading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

const statusMeta = {
  'ใหม่':        { color: 'bg-blue-100 text-blue-700 ring-blue-200',   dot: 'bg-blue-500' },
  'ติดต่อแล้ว': { color: 'bg-amber-100 text-amber-700 ring-amber-200', dot: 'bg-amber-500' },
  'ปิดการขาย':  { color: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
}

// CSV Export
async function exportCSV() {
  try {
    const res = await apiFetch(`${API_BASE}/api/quotation-submit?limit=9999`)
    const data = await res.json()
    if (!data.success || !data.data?.length) { showToast('ไม่มีข้อมูลสำหรับ export', 'error'); return }
    const headers = ['ชื่อลูกค้า','เบอร์โทร','อีเมล','บริษัท','เลขภาษี','สถานที่','ขนาดโครงการ','พื้นที่(ตร.ม.)','งบประมาณ','ต้องการติดตั้ง','สินค้าที่สนใจ','รายละเอียด','สถานะ','ประเภท','วันที่']
    const rows = data.data.map(l => [
      l.customer_name, l.phone, l.email || '', l.company_name || '', l.tax_id || '',
      l.location || '', l.project_scale || '', l.area_size || '', l.budget || '',
      l.need_installation ? 'ใช่' : 'ไม่', l.attached_product || '', l.details || '',
      l.status || 'ใหม่', l.request_type || 'individual',
      l.created_at ? new Date(l.created_at).toLocaleDateString('th-TH') : ''
    ])
    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads_export_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`Export สำเร็จ ${data.data.length} รายการ`, 'success')
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการ export', 'error')
  }
}

onMounted(fetchLeads)
</script>

<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-extrabold text-gray-900 tracking-tight">ใบเสนอราคา</h1>
        <p class="text-sm text-gray-400 mt-1 flex items-center gap-1">จัดการและติดตามผลลูกค้าที่ยื่นขอใบเสนอราคา
          <InfoTooltip title="ระบบ Lead คืออะไร?" description="ระบบ Lead เก็บข้อมูลลูกค้าที่กรอกฟอร์มขอใบเสนอราคาบนหน้าเว็บ<ul><li><strong>ใหม่:</strong> เพิ่งเข้ามา ยังไม่ได้ติดต่อ</li><li><strong>ติดต่อแล้ว:</strong> โทรหาลูกค้าแล้ว รอปิดการขาย</li><li><strong>ปิดการขาย:</strong> ลูกค้าตกลงซื้อแล้ว</li></ul>คลิกที่แถวเพื่อดูรายละเอียด หรือกด Export CSV เพื่อดึงข้อมูลออกไปใช้งาน" />
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="exportCSV" class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 bg-white border border-gray-200 hover:border-emerald-300 px-4 py-2 rounded-xl shadow-sm transition-all">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Export CSV
        </button>
        <button @click="fetchLeads" class="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emerald-600 bg-white border border-gray-200 hover:border-emerald-300 px-4 py-2 rounded-xl shadow-sm transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          รีเฟรช
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-4 gap-4">
      <button @click="setFilter('all')" :class="['rounded-2xl p-4 text-left border-2 transition-all shadow-sm', filterStatus === 'all' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-transparent hover:border-gray-200']">
        <p :class="['text-xs font-semibold uppercase tracking-wider mb-1', filterStatus === 'all' ? 'text-gray-400' : 'text-gray-400']">ทั้งหมด</p>
        <p :class="['text-3xl font-extrabold', filterStatus === 'all' ? 'text-white' : 'text-gray-900']">{{ stats.total }}</p>
      </button>
      <button @click="setFilter('ใหม่')" :class="['rounded-2xl p-4 text-left border-2 transition-all shadow-sm', filterStatus === 'ใหม่' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-transparent hover:border-blue-200']">
        <p :class="['text-xs font-semibold uppercase tracking-wider mb-1', filterStatus === 'ใหม่' ? 'text-blue-200' : 'text-blue-400']">ใหม่</p>
        <p :class="['text-3xl font-extrabold', filterStatus === 'ใหม่' ? 'text-white' : 'text-gray-900']">{{ stats.new }}</p>
      </button>
      <button @click="setFilter('ติดต่อแล้ว')" :class="['rounded-2xl p-4 text-left border-2 transition-all shadow-sm', filterStatus === 'ติดต่อแล้ว' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-transparent hover:border-amber-200']">
        <p :class="['text-xs font-semibold uppercase tracking-wider mb-1', filterStatus === 'ติดต่อแล้ว' ? 'text-amber-100' : 'text-amber-500']">ติดต่อแล้ว</p>
        <p :class="['text-3xl font-extrabold', filterStatus === 'ติดต่อแล้ว' ? 'text-white' : 'text-gray-900']">{{ stats.contacted }}</p>
      </button>
      <button @click="setFilter('ปิดการขาย')" :class="['rounded-2xl p-4 text-left border-2 transition-all shadow-sm', filterStatus === 'ปิดการขาย' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-transparent hover:border-emerald-200']">
        <p :class="['text-xs font-semibold uppercase tracking-wider mb-1', filterStatus === 'ปิดการขาย' ? 'text-emerald-100' : 'text-emerald-500']">ปิดการขาย</p>
        <p :class="['text-3xl font-extrabold', filterStatus === 'ปิดการขาย' ? 'text-white' : 'text-gray-900']">{{ stats.closed }}</p>
      </button>
    </div>

    <!-- Search bar -->
    <div class="relative">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input
        v-model="searchQuery"
        @input="onSearch"
        type="text"
        autocomplete="off"
        name="lead-search"
        placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, อีเมล, บริษัท, สถานที่..."
        class="w-full pl-12 pr-12 py-3 text-sm bg-white border border-gray-200 hover:border-gray-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 rounded-2xl outline-none transition-all shadow-sm placeholder-gray-400"
      />
      <button v-if="searchQuery" @click="searchQuery = ''; onSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
      </button>
    </div>

    <!-- Result count -->
    <div v-if="!loading && !error" class="flex items-center justify-between text-xs text-gray-400">
      <p>แสดง {{ leads.length }} จาก {{ totalItems }} รายการ</p>
      <p v-if="searchQuery" class="flex items-center gap-1">
        ค้นหา: <span class="font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">{{ searchQuery }}</span>
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <svg class="animate-spin h-8 w-8 mb-3 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      <p class="text-sm">กำลังโหลดข้อมูล...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
      <p class="text-red-600 font-medium">{{ error }}</p>
      <button @click="fetchLeads" class="mt-3 text-sm text-red-500 underline">ลองใหม่</button>
    </div>

    <!-- Empty -->
    <div v-else-if="leads.length === 0" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
      <div class="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
      </div>
      <p class="text-gray-400 text-sm">{{ searchQuery ? 'ไม่พบรายการที่ตรงกับการค้นหา' : 'ไม่มีรายการในหมวดนี้' }}</p>
      <button v-if="searchQuery" @click="searchQuery = ''; onSearch()" class="mt-3 text-sm text-emerald-500 underline">ล้างการค้นหา</button>
    </div>

    <!-- Lead List -->
    <template v-else>
      <div class="space-y-3">
        <TransitionGroup name="list">
          <div
            v-for="lead in leads"
            :key="lead.id"
            class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden group"
          >
            <div class="flex items-stretch">
              <!-- Color indicator stripe -->
              <div class="w-1 flex-shrink-0 rounded-l-2xl" :class="{
                'bg-blue-400':    (lead.status || 'ใหม่') === 'ใหม่',
                'bg-amber-400':   lead.status === 'ติดต่อแล้ว',
                'bg-emerald-400': lead.status === 'ปิดการขาย',
              }"></div>

              <div class="flex-1 px-5 py-4 flex items-center gap-5 min-w-0">

                <!-- Date column -->
                <div class="flex-shrink-0 w-24 text-center">
                  <p class="text-xs font-bold text-gray-700">{{ formatDate(lead.created_at) }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(lead.created_at) }}</p>
                  <span v-if="lead.request_type === 'company'" class="mt-1.5 inline-block text-[10px] font-bold text-purple-600 bg-purple-50 ring-1 ring-purple-200 px-2 py-0.5 rounded-full">นิติบุคคล</span>
                  <span v-else class="mt-1.5 inline-block text-[10px] font-bold text-sky-600 bg-sky-50 ring-1 ring-sky-200 px-2 py-0.5 rounded-full">บุคคลธรรมดา</span>
                </div>

                <!-- Divider -->
                <div class="w-px h-12 bg-gray-100 flex-shrink-0"></div>

                <!-- Customer -->
                <div class="flex-shrink-0 w-44 min-w-0">
                  <p class="font-bold text-gray-900 text-sm truncate">{{ lead.customer_name }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                    {{ lead.phone }}
                  </p>
                  <p v-if="lead.email" class="text-xs text-gray-400 mt-0.5 truncate">{{ lead.email }}</p>
                  <p v-if="lead.company_name" class="text-[11px] text-purple-500 font-medium mt-0.5 truncate">{{ lead.company_name }}</p>
                </div>

                <!-- Divider -->
                <div class="w-px h-12 bg-gray-100 flex-shrink-0"></div>

                <!-- Project -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 font-medium truncate">{{ lead.location || lead.usage_type || 'ไม่ระบุสถานที่' }}</p>
                  <div class="flex items-center gap-3 mt-1 flex-wrap">
                    <span v-if="lead.project_scale" class="text-xs text-gray-500 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                      {{ lead.project_scale }}
                    </span>
                    <span v-if="lead.area_size" class="text-xs text-gray-500">{{ lead.area_size }} ตร.ม.</span>
                    <span v-if="lead.budget" class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
                      {{ lead.budget }}
                    </span>
                  </div>
                </div>

                <!-- Status dropdown -->
                <div class="flex-shrink-0">
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" :class="statusMeta[lead.status || 'ใหม่']?.dot"></span>
                    <select
                      :value="lead.status || 'ใหม่'"
                      @change="updateStatus(lead, $event.target.value)"
                      class="appearance-none pl-6 pr-7 py-1.5 text-xs font-bold rounded-full ring-1 border-0 focus:outline-none focus:ring-2 cursor-pointer transition-all bg-transparent"
                      :class="statusMeta[lead.status || 'ใหม่']?.color"
                    >
                      <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                    </select>
                    <svg class="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
                  </div>
                </div>

                <!-- Action buttons -->
                <div class="flex-shrink-0 flex items-center gap-2">
                  <button @click="openDetail(lead)" title="ดูรายละเอียด" class="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                  </button>
                  <button @click="openDeleteConfirm(lead)" title="ลบรายการ" class="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-2">
        <p class="text-xs text-gray-400">หน้า {{ currentPage }} / {{ totalPages }}</p>
        <div class="flex items-center gap-1">
          <!-- Prev -->
          <button
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            :class="currentPage > 1 ? 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50' : 'border-gray-100 text-gray-300'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>

          <!-- Page numbers -->
          <template v-for="p in pageNumbers" :key="p">
            <span v-if="p === '...'" class="w-9 h-9 flex items-center justify-center text-gray-400 text-xs">···</span>
            <button
              v-else
              @click="goToPage(p)"
              class="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold border transition-all"
              :class="p === currentPage
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200'
                : 'border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50'"
            >
              {{ p }}
            </button>
          </template>

          <!-- Next -->
          <button
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="w-9 h-9 rounded-xl flex items-center justify-center border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            :class="currentPage < totalPages ? 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50' : 'border-gray-100 text-gray-300'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </template>

    <!-- ─── Detail Modal ─── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selectedLead" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closeDetail">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <!-- Header gradient -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-3xl px-6 py-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-emerald-100 text-xs font-medium mb-1">{{ formatDate(selectedLead.created_at) }} · {{ formatTime(selectedLead.created_at) }}</p>
                  <h2 class="text-xl font-extrabold text-white">{{ selectedLead.customer_name }}</h2>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span v-if="selectedLead.request_type === 'company'" class="text-[11px] font-bold text-emerald-100 bg-white/20 px-2.5 py-0.5 rounded-full">นิติบุคคล</span>
                    <span v-else class="text-[11px] font-bold text-emerald-100 bg-white/20 px-2.5 py-0.5 rounded-full">บุคคลธรรมดา</span>
                    <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full" :class="statusMeta[selectedLead.status || 'ใหม่']?.color">{{ selectedLead.status || 'ใหม่' }}</span>
                  </div>
                </div>
                <button @click="closeDetail" class="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors -mt-1 -mr-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>
                </button>
              </div>
            </div>

            <!-- Body -->
            <div class="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-2xl p-4">
                  <p class="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">ข้อมูลติดต่อ</p>
                  <div class="space-y-1.5 text-sm">
                    <div class="flex items-center gap-2 text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                      <span class="font-medium">{{ selectedLead.phone }}</span>
                    </div>
                    <div v-if="selectedLead.email" class="flex items-center gap-2 text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                      <span>{{ selectedLead.email }}</span>
                    </div>
                    <div v-if="selectedLead.company_name" class="flex items-center gap-2 text-gray-700">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/></svg>
                      <span class="font-medium text-purple-600">{{ selectedLead.company_name }}</span>
                    </div>
                    <div v-if="selectedLead.tax_id" class="flex items-center gap-2 text-gray-500 text-xs">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>
                      <span>เลขภาษี: {{ selectedLead.tax_id }}</span>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 rounded-2xl p-4">
                  <p class="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-2">ข้อมูลโครงการ</p>
                  <div class="space-y-1.5 text-sm">
                    <div v-if="selectedLead.location" class="text-gray-700"><span class="text-gray-400 text-xs">สถานที่ · </span>{{ selectedLead.location }}</div>
                    <div v-if="selectedLead.project_scale" class="text-gray-700"><span class="text-gray-400 text-xs">ขนาด · </span>{{ selectedLead.project_scale }}</div>
                    <div v-if="selectedLead.area_size" class="text-gray-700"><span class="text-gray-400 text-xs">พื้นที่ · </span>{{ selectedLead.area_size }} ตร.ม.</div>
                    <div v-if="selectedLead.usage_type" class="text-gray-700"><span class="text-gray-400 text-xs">การใช้งาน · </span>{{ selectedLead.usage_type }}</div>
                    <div v-if="selectedLead.budget" class="font-semibold text-emerald-600"><span class="text-gray-400 text-xs font-normal">งบประมาณ · </span>{{ selectedLead.budget }}</div>
                    <div class="text-gray-700">
                      <span class="text-gray-400 text-xs">ติดตั้ง · </span>
                      <span :class="selectedLead.need_installation ? 'text-emerald-600 font-medium' : 'text-gray-500'">{{ selectedLead.need_installation ? 'ต้องการ' : 'ไม่ต้องการ' }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="selectedLead.details" class="bg-amber-50 rounded-2xl p-4 ring-1 ring-amber-100">
                <p class="text-[11px] text-amber-500 font-semibold uppercase tracking-wider mb-2">รายละเอียดเพิ่มเติม</p>
                <p class="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{{ selectedLead.details }}</p>
              </div>
              <!-- Product Detail Card -->
              <div v-if="selectedLead.attached_product" class="rounded-2xl overflow-hidden ring-1 ring-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
                <div class="px-4 py-2.5 bg-emerald-100/60 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
                  <p class="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">สินค้าที่สนใจ</p>
                </div>

                <!-- Loading -->
                <div v-if="productLoading" class="px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  กำลังโหลดข้อมูลสินค้า...
                </div>

                <!-- Product found -->
                <div v-else-if="attachedProductData" class="p-4">
                  <div class="flex gap-4">
                    <!-- Product Image -->
                    <div class="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200 shadow-sm">
                      <img 
                        :src="attachedProductData.image_url || 'https://via.placeholder.com/200x200?text=No+Image'" 
                        :alt="attachedProductData.name" 
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <!-- Product Info -->
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{{ attachedProductData.name }}</h4>
                      <div class="flex flex-wrap items-center gap-2 mt-1.5">
                        <span v-if="attachedProductData.category" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ring-1 ring-indigo-100">{{ attachedProductData.category }}</span>
                        <span v-if="attachedProductData.is_active" class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100">เปิดขาย</span>
                        <span v-else class="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ปิดการขาย</span>
                      </div>
                      <div class="mt-2 flex items-baseline gap-1.5">
                        <span v-if="attachedProductData.price && Number(attachedProductData.price) > 0" class="text-lg font-extrabold text-emerald-600">฿{{ Number(attachedProductData.price).toLocaleString() }}</span>
                        <span v-else class="text-sm font-medium text-gray-500">สอบถามราคา</span>
                        <span v-if="attachedProductData.original_price && Number(attachedProductData.original_price) > Number(attachedProductData.price)" class="text-xs text-gray-400 line-through">฿{{ Number(attachedProductData.original_price).toLocaleString() }}</span>
                      </div>
                      <p v-if="attachedProductData.short_description" class="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{{ attachedProductData.short_description }}</p>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 mt-3 pt-3 border-t border-emerald-100">
                    <a 
                      :href="'/products/' + (attachedProductData.slug || attachedProductData.id)" 
                      target="_blank" 
                      class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                      ดูหน้าสินค้า
                    </a>
                    <router-link 
                      :to="'/admin/products/' + attachedProductData.id + '/edit'" 
                      class="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-3 py-2 rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      จัดการสต็อก
                    </router-link>
                  </div>
                </div>

                <!-- Product not found: Fallback to name only -->
                <div v-else class="px-4 py-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"/></svg>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">{{ selectedLead.attached_product }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">ไม่พบข้อมูลสินค้าในระบบ</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50 rounded-b-3xl">
              <button @click="() => { closeDetail(); openDeleteConfirm(selectedLead) }" class="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 bg-white hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                ลบรายการนี้
              </button>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 font-medium">เปลี่ยนสถานะ:</span>
                <div class="relative">
                  <span class="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none" :class="statusMeta[selectedLead.status || 'ใหม่']?.dot"></span>
                  <select :value="selectedLead.status || 'ใหม่'" @change="updateStatus(selectedLead, $event.target.value)" class="appearance-none pl-6 pr-8 py-2 text-sm font-bold rounded-xl ring-1 border-0 focus:outline-none focus:ring-2 cursor-pointer" :class="statusMeta[selectedLead.status || 'ใหม่']?.color">
                    <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
                  </select>
                  <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Delete Confirm Modal ─── -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="deleteTarget" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="cancelDelete">
          <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div class="h-1.5 bg-gradient-to-r from-red-500 to-rose-500"></div>
            <div class="px-6 pt-6 pb-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-11 h-11 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                </div>
                <div>
                  <h3 class="text-base font-extrabold text-gray-900">ยืนยันการลบ</h3>
                  <p class="text-xs text-gray-400 mt-0.5">รายการของ <span class="font-semibold text-gray-600">{{ deleteTarget.customer_name }}</span></p>
                </div>
              </div>
              <p class="text-sm text-gray-500 leading-relaxed mb-5">คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? <span class="font-semibold text-red-500">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span></p>
              <div class="flex gap-2.5 mt-5">
                <button @click="cancelDelete" class="flex-1 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl transition-colors">ยกเลิก</button>
                <button @click="confirmDelete" :disabled="deleteLoading" class="flex-1 text-sm font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-60 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                  <svg v-if="deleteLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  {{ deleteLoading ? 'กำลังลบ...' : 'ยืนยันลบ' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.list-move, .list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-10px); }
.list-leave-active { position: absolute; width: 100%; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
select.appearance-none { -webkit-appearance: none; -moz-appearance: none; }
</style>

