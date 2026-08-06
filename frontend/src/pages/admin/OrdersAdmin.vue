<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const router = useRouter()

const toast = useToast()
const { showConfirm } = useConfirm()

const orders = ref([])
const stats = ref({})
const pagination = ref({ total: 0, page: 1, limit: 20, totalPages: 0 })
const loading = ref(false)

// Filters
const filters = ref({
  search: '',
  status: 'all',
  payment_status: 'all',
  start_date: '',
  end_date: ''
})

// Quick filter tabs
const activeQuickFilter = ref('all')
const quickFilters = [
  { key: 'all', label: 'ทั้งหมด', svgIcon: 'clipboard' },
  { key: 'action', label: 'ต้องดำเนินการ', svgIcon: 'bell' },
  { key: 'reviewing', label: 'รอตรวจสลิป', svgIcon: 'search' },
  { key: 'processing', label: 'กำลังจัดส่ง', svgIcon: 'truck' },
  { key: 'completed', label: 'สำเร็จ', svgIcon: 'check' },
  { key: 'cancelled', label: 'ยกเลิก', svgIcon: 'x' }
]

const setQuickFilter = (key) => {
  activeQuickFilter.value = key
  if (key === 'all') {
    filters.value.status = 'all'
    filters.value.payment_status = 'all'
  } else if (key === 'action') {
    filters.value.status = 'all'
    filters.value.payment_status = 'pending'
  } else if (key === 'reviewing') {
    filters.value.status = 'all'
    filters.value.payment_status = 'reviewing'
  } else if (key === 'processing') {
    filters.value.status = 'processing'
    filters.value.payment_status = 'all'
  } else if (key === 'completed') {
    filters.value.status = 'delivered'
    filters.value.payment_status = 'all'
  } else if (key === 'cancelled') {
    filters.value.status = 'cancelled'
    filters.value.payment_status = 'all'
  }
  pagination.value.page = 1
  fetchOrders()
}

const orderStatusOptions = [
  { value: 'pending', label: 'รอดำเนินการ', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'confirmed', label: 'ยืนยันแล้ว', color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { value: 'processing', label: 'กำลังจัดเตรียม', color: 'cyan', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { value: 'shipped', label: 'จัดส่งแล้ว', color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { value: 'delivered', label: 'ส่งถึงแล้ว', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'cancelled', label: 'ยกเลิก', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
  { value: 'refunded', label: 'คืนเงินแล้ว', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' }
]

const paymentStatusOptions = [
  { value: 'pending', label: 'รอชำระ', color: 'gray', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  { value: 'reviewing', label: 'รอตรวจสอบ', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'paid', label: 'ชำระแล้ว', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'failed', label: 'ชำระไม่สำเร็จ', color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { value: 'rejected', label: 'ปฏิเสธการชำระ', color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  { value: 'refunded', label: 'คืนเงินแล้ว', color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { value: 'cancelled', label: 'ยกเลิก', color: 'gray', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' }
]

const getStatusOpt = (status, type = 'order') => {
  const options = type === 'order' ? orderStatusOptions : paymentStatusOptions
  return options.find(o => o.value === status) || { label: status, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
}

// Selected rows for bulk actions
const selectedRows = ref([])
const selectAll = ref(false)

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedRows.value = orders.value.map(o => o.id)
  } else {
    selectedRows.value = []
  }
}
const toggleRow = (id) => {
  const idx = selectedRows.value.indexOf(id)
  if (idx > -1) selectedRows.value.splice(idx, 1)
  else selectedRows.value.push(id)
  selectAll.value = selectedRows.value.length === orders.value.length
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', pagination.value.page)
    params.set('limit', pagination.value.limit)
    if (filters.value.search) params.set('search', filters.value.search)
    if (filters.value.status !== 'all') params.set('status', filters.value.status)
    if (filters.value.payment_status !== 'all') params.set('payment_status', filters.value.payment_status)
    if (filters.value.start_date) params.set('start_date', filters.value.start_date)
    if (filters.value.end_date) params.set('end_date', filters.value.end_date)

    const token = localStorage.getItem('adminToken')
    const res = await fetch(`/api/orders/admin/all?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      orders.value = data.data
      pagination.value = data.pagination
      stats.value = data.stats
      selectedRows.value = []
      selectAll.value = false
    }
  } catch (e) {
    console.error('Fetch orders error:', e)
    toast.error('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้')
  } finally {
    loading.value = false
  }
}

let searchDebounce = null
watch(() => filters.value.search, () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    pagination.value.page = 1
    fetchOrders()
  }, 400)
})

const applyFilter = () => {
  activeQuickFilter.value = 'all'
  pagination.value.page = 1
  fetchOrders()
}

const resetFilters = () => {
  filters.value = { search: '', status: 'all', payment_status: 'all', start_date: '', end_date: '' }
  activeQuickFilter.value = 'all'
  pagination.value.page = 1
  fetchOrders()
}

const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.status !== 'all' || filters.value.payment_status !== 'all' || filters.value.start_date || filters.value.end_date
})

const changePage = (p) => {
  if (p < 1 || p > pagination.value.totalPages) return
  pagination.value.page = p
  fetchOrders()
}

// Computed: visible page numbers
const visiblePages = computed(() => {
  const total = pagination.value.totalPages
  const current = pagination.value.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

const openDetail = (order) => {
  router.push(`/admin/orders/${order.id}`)
}

const updateStatus = async (orderId, field, value) => {
  try {
    const token = localStorage.getItem('adminToken')
    const body = {}
    body[field] = value
    const res = await fetch(`/api/orders/admin/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (data.success) {
      toast.success('อัปเดตสถานะเรียบร้อย')
      fetchOrders()
    } else {
      toast.error(data.error)
    }
  } catch (e) {
    toast.error('เกิดข้อผิดพลาด')
  }
}

// Bulk update
const bulkStatus = ref('')
const bulkUpdate = async () => {
  if (!bulkStatus.value || selectedRows.value.length === 0) return
  for (const id of selectedRows.value) {
    await updateStatus(id, 'order_status', bulkStatus.value)
  }
  bulkStatus.value = ''
  selectedRows.value = []
  selectAll.value = false
}

// Single delete order
const deleteOrder = async (orderId) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบคำสั่งซื้อ',
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อ #${shortId(orderId)}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
    confirmText: 'ลบคำสั่งซื้อ',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return

  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`/api/orders/admin/${orderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message || 'ลบคำสั่งซื้อเรียบร้อยแล้ว')
      fetchOrders()
    } else {
      toast.error(data.error || 'ไม่สามารถลบคำสั่งซื้อได้')
    }
  } catch (e) {
    console.error('Delete order error:', e)
    toast.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ')
  }
}

// Bulk delete orders
const bulkDeleteOrders = async () => {
  if (selectedRows.value.length === 0) return
  const count = selectedRows.value.length
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบคำสั่งซื้อหลายรายการ',
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่งซื้อที่เลือกจำนวน ${count} รายการ? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
    confirmText: `ลบ ${count} รายการ`,
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return

  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch('/api/orders/admin/bulk-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: selectedRows.value })
    })
    const data = await res.json()
    if (data.success) {
      toast.success(data.message || 'ลบคำสั่งซื้อที่เลือกเรียบร้อยแล้ว')
      selectedRows.value = []
      selectAll.value = false
      fetchOrders()
    } else {
      toast.error(data.error || 'ไม่สามารถลบคำสั่งซื้อได้')
    }
  } catch (e) {
    console.error('Bulk delete orders error:', e)
    toast.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ')
  }
}




const formatPrice = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const formatDateShort = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '-'

const getCustomerName = (order) => {
  if (order.user_first_name) return `${order.user_first_name} ${order.user_last_name || ''}`.trim()
  const addr = order.shipping_address_parsed || {}
  if (addr.first_name) return `${addr.first_name} ${addr.last_name || ''}`.trim()
  return 'Guest'
}

const getCustomerPhone = (order) => {
  if (order.user_phone) return order.user_phone
  const addr = order.shipping_address_parsed || {}
  return addr.phone || '-'
}

const getCustomerAvatar = (order) => {
  const name = getCustomerName(order)
  return name.charAt(0).toUpperCase()
}



// Show/hide advanced filters
const showAdvanced = ref(false)

// Per-page size control
const pageSizes = [10, 20, 50, 100]

const exportLoading = ref(false)
const exportCSV = async () => {
  exportLoading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.value.search) params.set('search', filters.value.search)
    if (filters.value.status !== 'all') params.set('status', filters.value.status)
    if (filters.value.payment_status !== 'all') params.set('payment_status', filters.value.payment_status)
    if (filters.value.start_date) params.set('start_date', filters.value.start_date)
    if (filters.value.end_date) params.set('end_date', filters.value.end_date)

    const token = localStorage.getItem('adminToken')
    const res = await fetch(`/api/export/orders?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('ดาวน์โหลดรายงานสำเร็จ')
  } catch (e) {
    console.error('Export error:', e)
    toast.error('ไม่สามารถ export ได้')
  } finally {
    exportLoading.value = false
  }
}

onMounted(fetchOrders)
</script>

<template>
  <div class="w-full space-y-5">
    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          จัดการคำสั่งซื้อ
        </h1>
        <p class="text-sm text-gray-400 mt-1 ml-[52px] flex items-center gap-1">ติดตาม จัดการ และอัปเดตสถานะคำสั่งซื้อทั้งหมด
          <InfoTooltip title="ขั้นตอนการจัดการคำสั่งซื้อ" description="<strong>ลำดับสถานะคำสั่งซื้อ:</strong><ul><li><strong>รอชำระ</strong> → ลูกค้ายังไม่ได้แนบสลิป</li><li><strong>รอตรวจสอบ</strong> → แนบสลิปแล้ว รอแอดมินเช็ค</li><li><strong>ยืนยันแล้ว</strong> → เงินถูกต้อง เตรียมสินค้า</li><li><strong>จัดส่งแล้ว</strong> → ส่งออกจากคลังสินค้า</li><li><strong>ส่งถึงแล้ว</strong> → ลูกค้ารับของแล้ว เสร็จสิ้น</li></ul>คลิกที่แถวคำสั่งซื้อเพื่อดูรายละเอียด ตรวจสลิป และเปลี่ยนสถานะได้" />
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="exportCSV" :disabled="exportLoading" class="h-10 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-sm font-bold text-white hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-2 shadow-sm shadow-emerald-500/20 disabled:opacity-60">
          <svg v-if="!exportLoading" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Export CSV
        </button>
        <button @click="fetchOrders" :disabled="loading" class="h-10 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
          <svg :class="loading ? 'animate-spin' : ''" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          รีเฟรช
        </button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="setQuickFilter('all')">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
        </div>
        <p class="text-2xl font-black text-gray-900">{{ stats.total_orders || 0 }}</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">คำสั่งซื้อทั้งหมด</p>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="setQuickFilter('action')">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <span v-if="(stats.pending_payment || 0) > 0" class="text-[10px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md animate-pulse">ใหม่</span>
        </div>
        <p class="text-2xl font-black text-amber-600">{{ stats.pending_payment || 0 }}</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">รอชำระเงิน</p>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="setQuickFilter('reviewing')">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </div>
          <span v-if="(stats.reviewing_payment || 0) > 0" class="text-[10px] font-black bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md animate-pulse">เครื่องมือ</span>
        </div>
        <p class="text-2xl font-black text-orange-600">{{ stats.reviewing_payment || 0 }}</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">รอตรวจสอบสลิป</p>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="setQuickFilter('processing')">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
          </div>
        </div>
        <p class="text-2xl font-black text-blue-600">{{ stats.paid_orders || 0 }}</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">ชำระแล้ว</p>
      </div>

      <div class="bg-white rounded-2xl p-4 border border-red-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="setQuickFilter('cancelled')">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          </div>
        </div>
        <p class="text-2xl font-black text-gray-500">{{ stats.cancelled_orders || 0 }}</p>
        <p class="text-xs text-gray-400 font-semibold mt-0.5">ยกเลิก</p>
      </div>

      <div class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-lg shadow-emerald-500/15 hover:shadow-xl transition-shadow">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
        </div>
        <p class="text-2xl font-black text-white">฿{{ formatPrice(stats.total_revenue) }}</p>
        <p class="text-xs text-emerald-100 font-semibold mt-0.5">ยอดขายรวม</p>
      </div>
    </div>

    <!-- Quick Filter Tabs + Search -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <!-- Quick filter tabs -->
      <div class="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto no-scrollbar">
        <button
          v-for="qf in quickFilters"
          :key="qf.key"
          @click="setQuickFilter(qf.key)"
          :class="[
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all',
            activeQuickFilter === qf.key
              ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          ]"
        >
          <!-- SVG icons for quick filters -->
          <svg v-if="qf.svgIcon === 'clipboard'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <svg v-else-if="qf.svgIcon === 'bell'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <svg v-else-if="qf.svgIcon === 'search'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <svg v-else-if="qf.svgIcon === 'truck'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
          <svg v-else-if="qf.svgIcon === 'check'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <svg v-else-if="qf.svgIcon === 'x'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
          {{ qf.label }}
          <span v-if="qf.key === 'action' && (stats.pending_payment || 0) > 0" class="ml-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black bg-amber-500 text-white rounded-full px-1">{{ stats.pending_payment }}</span>
          <span v-if="qf.key === 'reviewing' && (stats.reviewing_payment || 0) > 0" class="ml-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black bg-orange-500 text-white rounded-full px-1">{{ stats.reviewing_payment }}</span>
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="px-4 pb-4 pt-2">
        <div class="flex items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 max-w-md">
            <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input v-model="filters.search" type="text" placeholder="ค้นหา Order ID, ชื่อลูกค้า, เบอร์โทร, อีเมล..." class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white" />
          </div>

          <!-- Toggle advanced filters -->
          <button @click="showAdvanced = !showAdvanced" :class="['h-10 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all', showAdvanced || hasActiveFilters ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100']">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>
            ฟิลเตอร์
            <span v-if="hasActiveFilters" class="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>

          <!-- Reset filters -->
          <button v-if="hasActiveFilters" @click="resetFilters" class="h-10 px-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            ล้าง
          </button>

          <!-- Per page -->
          <div class="flex items-center gap-2 ml-auto">
            <span class="text-xs text-gray-400 font-medium">แสดง</span>
            <select v-model="pagination.limit" @change="applyFilter" class="h-10 px-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-gray-50 outline-none focus:border-gray-400">
              <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
            </select>
            <span class="text-xs text-gray-400 font-medium">รายการ</span>
          </div>
        </div>

        <!-- Advanced filter row -->
        <transition name="slide">
          <div v-if="showAdvanced" class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">สถานะคำสั่งซื้อ</label>
              <select v-model="filters.status" @change="applyFilter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-gray-400 outline-none bg-gray-50">
                <option value="all">— ทั้งหมด —</option>
                <option v-for="opt in orderStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">สถานะการชำระ</label>
              <select v-model="filters.payment_status" @change="applyFilter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-gray-400 outline-none bg-gray-50">
                <option value="all">— ทั้งหมด —</option>
                <option v-for="opt in paymentStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">ตั้งแต่วันที่</label>
              <input v-model="filters.start_date" type="date" @change="applyFilter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 outline-none bg-gray-50" />
            </div>
            <div>
              <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">ถึงวันที่</label>
              <input v-model="filters.end_date" type="date" @change="applyFilter" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-gray-400 outline-none bg-gray-50" />
            </div>
          </div>
        </transition>
      </div>

      <!-- Bulk action bar -->
      <transition name="slide">
        <div v-if="selectedRows.length > 0" class="px-4 py-3 bg-gray-900 flex items-center gap-3 flex-wrap">
          <span class="text-sm font-bold text-white">เลือก {{ selectedRows.length }} รายการ</span>
          <div class="flex items-center gap-2">
            <select v-model="bulkStatus" class="h-8 px-3 rounded-lg border-0 text-sm font-bold bg-gray-700 text-white outline-none">
              <option value="">— เปลี่ยนสถานะ —</option>
              <option v-for="opt in orderStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button v-if="bulkStatus" @click="bulkUpdate" class="h-8 px-4 bg-emerald-500 text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors">ยืนยัน</button>
          </div>
          <button @click="bulkDeleteOrders" class="h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            ลบที่เลือก
          </button>
          <button @click="selectedRows = []; selectAll = false" class="ml-auto text-sm text-gray-400 hover:text-white transition-colors font-medium">ยกเลิกการเลือก</button>
        </div>
      </transition>

      <!-- Table -->
      <div v-if="loading" class="p-20 text-center">
        <div class="inline-flex items-center gap-3">
          <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-sm text-gray-400 font-medium">กำลังโหลดข้อมูล...</span>
        </div>
      </div>

      <div v-else-if="orders.length === 0" class="p-20 text-center">
        <div class="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-3xl flex items-center justify-center">
          <svg class="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </div>
        <p class="text-gray-400 font-bold text-lg">ยังไม่มีคำสั่งซื้อ</p>
        <p class="text-gray-400 text-sm mt-1" v-if="hasActiveFilters">ลองเปลี่ยนเงื่อนไขการค้นหา</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-t border-gray-100">
              <th class="text-left pl-4 pr-2 py-3 w-10">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              </th>
              <th class="text-left px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">คำสั่งซื้อ</th>
              <th class="text-left px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">ลูกค้า</th>
              <th class="text-right px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">ยอดรวม</th>
              <th class="text-center px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">การชำระ</th>
              <th class="text-center px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">สถานะ</th>
              <th class="text-center px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">สลิป</th>
              <th class="text-right px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider">วันที่สั่งซื้อ</th>
              <th class="text-center px-3 py-3 font-bold text-gray-400 uppercase text-[10px] tracking-wider pr-4">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="order in orders"
              :key="order.id"
              @click="openDetail(order)"
              :class="['border-t border-gray-50 hover:bg-emerald-50/30 transition-colors cursor-pointer group', selectedRows.includes(order.id) ? 'bg-emerald-50/50' : '']"
            >
              <td class="pl-4 pr-2 py-3" @click.stop>
                <input type="checkbox" :checked="selectedRows.includes(order.id)" @change="toggleRow(order.id)" class="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col">
                    <span class="font-mono font-black text-gray-900 text-xs">#{{ shortId(order.id) }}</span>
                    <span class="text-[11px] text-gray-400">{{ order.items?.length || 0 }} รายการ</span>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-black text-gray-500 shrink-0">
                    {{ getCustomerAvatar(order) }}
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-gray-800 text-sm truncate max-w-[160px]">{{ getCustomerName(order) }}</p>
                    <p class="text-[11px] text-gray-400 font-medium">{{ getCustomerPhone(order) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-3 py-3 text-right">
                <span class="font-black text-gray-900 text-sm">฿{{ formatPrice(order.total_amount) }}</span>
                <p v-if="order.shipping_cost > 0" class="text-[10px] text-gray-400">(+ค่าส่ง ฿{{ formatPrice(order.shipping_cost) }})</p>
              </td>
              <td class="px-3 py-3 text-center">
                <span :class="[getStatusOpt(order.payment_status, 'payment').bg, getStatusOpt(order.payment_status, 'payment').text, getStatusOpt(order.payment_status, 'payment').border, 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border']">
                  <span :class="[getStatusOpt(order.payment_status, 'payment').dot, 'w-1.5 h-1.5 rounded-full']"></span>
                  {{ getStatusOpt(order.payment_status, 'payment').label }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <span :class="[getStatusOpt(order.order_status).bg, getStatusOpt(order.order_status).text, getStatusOpt(order.order_status).border, 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border']">
                  <span :class="[getStatusOpt(order.order_status).dot, 'w-1.5 h-1.5 rounded-full']"></span>
                  {{ getStatusOpt(order.order_status).label }}
                </span>
              </td>
              <td class="px-3 py-3 text-center">
                <div v-if="order.payment_slip_url" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mx-auto" title="มีสลิป">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
              <td class="px-3 py-3 text-right">
                <span class="text-xs text-gray-500 font-medium">{{ formatDateShort(order.created_at) }}</span>
              </td>
              <td class="px-3 py-3 text-center pr-4" @click.stop>
                <button @click.stop="deleteOrder(order.id)" class="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors inline-flex items-center justify-center group-hover:scale-105" title="ลบคำสั่งซื้อ">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 0" class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-400 font-medium">
          แสดง <b class="text-gray-600">{{ (pagination.page - 1) * pagination.limit + 1 }}</b> - <b class="text-gray-600">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</b> จาก <b class="text-gray-600">{{ pagination.total }}</b> คำสั่งซื้อ
        </p>
        <div class="flex items-center gap-1" v-if="pagination.totalPages > 1">
          <button @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1" :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors', pagination.page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100']">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">...</span>
            <button v-else @click="changePage(p)" :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all', p === pagination.page ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100']">{{ p }}</button>
          </template>
          <button @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages" :class="['w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors', pagination.page === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100']">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; overflow: hidden; }
.slide-enter-to, .slide-leave-from { opacity: 1; max-height: 200px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
