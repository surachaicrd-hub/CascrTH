<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()
const router = useRouter()

const customers = ref([])
const avatarErrors = ref({})
const loading = ref(true)
const searchQuery = ref('')
const filterSource = ref('')
const filterBlacklisted = ref('all')
const filterMinSpent = ref('')
const filterMaxSpent = ref('')
const isFilterOpen = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalCustomers = ref(0)
const itemsPerPage = 20

// Search timeout
let searchTimeout = null

const fetchCustomers = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('adminToken')
    const queryParams = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value,
      source: filterSource.value,
      is_blacklisted: filterBlacklisted.value,
      min_spent: filterMinSpent.value,
      max_spent: filterMaxSpent.value
    })
    
    const res = await fetch(`/api/admin/customers?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      customers.value = data.data
      totalPages.value = data.pagination.totalPages
      totalCustomers.value = data.pagination.total
    } else {
      showToast(data.error || 'โหลดข้อมูลลูกค้าไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Fetch customers error:', error)
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  currentPage.value = 1
  fetchCustomers()
  isFilterOpen.value = false
}

const resetFilters = () => {
  searchQuery.value = ''
  filterSource.value = ''
  filterBlacklisted.value = 'all'
  filterMinSpent.value = ''
  filterMaxSpent.value = ''
  currentPage.value = 1
  fetchCustomers()
  isFilterOpen.value = false
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchCustomers()
  }, 500)
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchCustomers()
}

const viewDetails = (customer) => {
  router.push(`/admin/customers/${customer.id}`)
}

const toggleBlacklist = async (customer) => {
  const isBlacklisting = !customer.is_blacklisted
  if (await showConfirm({
    title: isBlacklisting ? 'ขึ้นบัญชีดำลูกค้า' : 'ปลดบัญชีดำ',
    message: isBlacklisting ? `คุณแน่ใจหรือไม่ว่าต้องการขึ้นบัญชีดำ ${customer.first_name}? ลูกค้ารายนี้อาจถูกจำกัดสิทธิ์ในระบบ` : `คุณต้องการปลด ${customer.first_name} ออกจากบัญชีดำใช่หรือไม่?`,
    confirmText: isBlacklisting ? 'ขึ้นบัญชีดำ' : 'ปลดบัญชีดำ',
    type: isBlacklisting ? 'danger' : 'success'
  })) {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/customers/${customer.id}/blacklist`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_blacklisted: isBlacklisting })
      })
      const data = await res.json()
      if (data.success) {
        showToast(data.message, 'success')
        fetchCustomers()
      } else {
        showToast(data.error || 'ดำเนินการไม่สำเร็จ', 'error')
      }
    } catch (error) {
      console.error('Toggle blacklist error:', error)
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }
}

const deleteCustomer = async (customer) => {
  if (await showConfirm({
    title: 'ลบข้อมูลลูกค้า',
    message: `คุณต้องการลบข้อมูลของ ${customer.first_name} ${customer.last_name || ''} ใช่หรือไม่?\nการกระทำนี้ไม่สามารถย้อนกลับได้รวมถึงข้อมูลที่อยู่การจัดส่ง`,
    confirmText: 'ลบลูกค้า',
    type: 'danger'
  })) {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/customers/${customer.id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        showToast('ลบข้อมูลลูกค้าสำเร็จ', 'success')
        fetchCustomers()
      } else {
        showToast(data.error || 'ลบไม่สำเร็จ', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

// Format Registration Source
const formatSource = (sourceText) => {
  if (!sourceText || sourceText === 'organic') return { label: 'เข้าชมโดยตรง', color: 'bg-gray-100 text-gray-600' }
  if (sourceText === 'facebook_ad') return { label: 'โฆษณา Facebook', color: 'bg-blue-100 text-blue-700' }
  if (sourceText.includes('utm_source=facebook')) return { label: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2]' }
  if (sourceText.includes('utm_source=tiktok')) return { label: 'TikTok', color: 'bg-black/10 text-black' }
  if (sourceText.includes('utm_source=google')) return { label: 'Google', color: 'bg-red-100 text-red-600' }
  return { label: sourceText, color: 'bg-indigo-100 text-indigo-700' }
}

const exportLoading = ref(false)
const exportCustomersCSV = async () => {
  exportLoading.value = true
  try {
    const token = localStorage.getItem('adminToken')
    const queryParams = new URLSearchParams({
      search: searchQuery.value,
      source: filterSource.value,
      is_blacklisted: filterBlacklisted.value
    })
    const res = await fetch(`/api/export/customers?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers_report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('ดาวน์โหลดรายงานสำเร็จ', 'success')
  } catch (e) {
    console.error('Export error:', e)
    showToast('ไม่สามารถ export ได้', 'error')
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24 w-full">
    <!-- Header -->
    <div class="mb-8 flex justify-between items-end flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">การจัดการลูกค้าสมาชิก</h1>
        <p class="text-sm text-gray-500 mt-2 font-medium flex items-center gap-1">ดูรายชื่อและข้อมูลผู้ใช้ที่สมัครสมาชิกผ่านหน้าเว็บไซต์ (ทั้งหมด {{ totalCustomers }} ราย)
          <InfoTooltip title="ระบบลูกค้าคืออะไร?" description="ระบบรวบรวมข้อมูลลูกค้าที่สมัครสมาชิกผ่านการชำระเงินบนเว็บ<ul><li><strong>ช่องทางสมัคร (Source):</strong> ดูว่าลูกค้ามาจาก Facebook/TikTok/Google/Organic</li><li><strong>บัญชีดำ:</strong> ขึ้นบัญชีดำเพื่อจำกัดสิทธิ์ (เช่น ลูกค้าที่ส่อแวมหรือยกเลิกบ่อยครั้ง)</li><li><strong>Export CSV:</strong> ดาวน์โหลดรายชื่อลูกค้าทั้งหมดเพื่อนำไปใช้งานต่อ</li><li><strong>ตัวกรองขั้นสูง:</strong> กรองตามช่องทาง, ยอดสั่งซื้อ, สถานะบัญชี</li></ul>" />
        </p>
      </div>
      
      <!-- Search and Filter Actions -->
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <button @click="exportCustomersCSV" :disabled="exportLoading" class="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-60 shrink-0">
          <svg v-if="!exportLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Export CSV
        </button>
        <div class="relative w-full sm:w-80">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery" 
            @input="onSearchInput"
            type="text" 
            class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow" 
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..." 
          />
        </div>
        
        <div class="relative">
          <button @click="isFilterOpen = !isFilterOpen" class="p-2.5 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20" :class="{'ring-2 ring-emerald-500 border-emerald-500': isFilterOpen || filterSource || filterBlacklisted !== 'all' || filterMinSpent || filterMaxSpent}">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          
          <!-- Dropdown Filter Panel -->
          <div v-if="isFilterOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-5 flex flex-col gap-4">
            <h3 class="font-bold text-gray-900 border-b pb-2">ตัวกรองขั้นสูง</h3>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">ช่องทางการสมัคร (Source)</label>
              <select v-model="filterSource" class="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-2 px-3 bg-gray-50">
                <option value="">ทั้งหมด</option>
                <option value="organic">Organic (เข้าชมโดยตรง)</option>
                <option value="facebook_ad">Facebook Ads</option>
                <option value="utm_source=facebook&utm_medium=none">Facebook (ทั่วไป)</option>
                <option value="utm_source=tiktok&utm_medium=none">TikTok</option>
                <option value="utm_source=google&utm_medium=none">Google</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">สถานะบัญชี</label>
              <select v-model="filterBlacklisted" class="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 py-2 px-3 bg-gray-50">
                <option value="all">ทั้งหมด</option>
                <option value="false">ปกติ</option>
                <option value="true">ติดบัญชีดำ (Blacklisted)</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">ยอดสั่งซื้อรวม (บาท)</label>
              <div class="flex items-center gap-2">
                <input v-model="filterMinSpent" type="number" placeholder="0" class="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 bg-gray-50" />
                <span class="text-gray-400">-</span>
                <input v-model="filterMaxSpent" type="number" placeholder="ไม่จำกัด" class="w-full text-sm border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2 bg-gray-50" />
              </div>
            </div>
            
            <div class="flex items-center gap-2 pt-2 border-t mt-1">
              <button @click="resetFilters" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                รีเซ็ต
              </button>
              <button @click="applyFilters" class="flex-1 px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition-colors">
                นำไปใช้
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && customers.length === 0" class="flex-1 flex items-center justify-center min-h-[400px]">
      <div class="text-center flex flex-col items-center text-gray-400">
        <svg class="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>กำลังโหลดข้อมูลลูกค้า...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="customers.length === 0" class="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <svg class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">ไม่พบลูกค้า</h3>
      <p class="text-gray-500 max-w-sm">{{ searchQuery ? 'ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหาของคุณ ลองเปลี่ยนคำค้นหาใหม่' : 'ยังไม่มีลูกค้าสมัครสมาชิกในระบบ' }}</p>
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full flex flex-col">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-gray-50/80 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
            <tr>
              <th class="px-6 py-4">ลูกค้า</th>
              <th class="px-6 py-4">ติดต่อ</th>
              <th class="px-6 py-4">ช่องทางสมัคร</th>
              <th class="px-6 py-4">สถิติ</th>
              <th class="px-6 py-4">วันที่สมัคร</th>
              <th class="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="customer in customers" :key="customer.id" class="hover:bg-gray-50/50 transition-colors group">
              <!-- Profile -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold overflow-hidden border border-emerald-200 shrink-0" :class="{'bg-red-100 text-red-700 border-red-200': customer.is_blacklisted}">
                    <img v-if="customer.avatar_url && !avatarErrors[customer.id]" :src="customer.avatar_url" @error="avatarErrors[customer.id] = true" class="w-full h-full object-cover">
                    <span v-else>{{ (customer.first_name || 'U').substring(0, 1).toUpperCase() }}</span>
                  </div>
                  <div>
                    <div class="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                      {{ customer.first_name }} {{ customer.last_name }}
                    </div>
                    <div v-if="customer.is_blacklisted" class="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-widest">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      แบล็คลิสต์
                    </div>
                  </div>
                </div>
              </td>
              <!-- Contact -->
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-1.5 text-gray-600 text-xs">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    {{ customer.email || '-' }}
                  </div>
                  <div class="flex items-center gap-1.5 text-gray-600 text-xs" v-if="customer.phone">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    {{ customer.phone }}
                  </div>
                </div>
              </td>
              <!-- Source -->
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" :class="formatSource(customer.registration_source).color">
                  {{ formatSource(customer.registration_source).label }}
                </span>
              </td>
              <!-- Stats -->
              <td class="px-6 py-4">
                <div class="flex flex-col">
                  <span class="text-sm font-bold text-gray-900">{{ formatCurrency(customer.total_spent) }}</span>
                  <span class="text-xs text-gray-500">{{ customer.orders_count }} ออเดอร์</span>
                </div>
              </td>
              <!-- Date -->
              <td class="px-6 py-4 text-gray-500 text-sm font-medium">
                {{ formatDate(customer.created_at) }}
              </td>
              <!-- Actions -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                  <button @click="viewDetails(customer)" title="ดูรายละเอียด" class="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button @click="toggleBlacklist(customer)" :title="customer.is_blacklisted ? 'ปลดบัญชีดำ' : 'ขึ้นบัญชีดำ'" :class="customer.is_blacklisted ? 'text-orange-500 hover:text-gray-500 hover:bg-gray-100' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'" class="p-2 rounded-xl transition-all">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path v-if="customer.is_blacklisted" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                  <button @click="deleteCustomer(customer)" title="ลบทิ้ง" class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="customers.length > 0" class="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 mt-auto">
        <span class="text-sm text-gray-500 font-medium">หน้า {{ currentPage }} จาก {{ totalPages }}</span>
        <div class="flex gap-1">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
          >
            ก่อนหน้า
          </button>
          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
