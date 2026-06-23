<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { getTrackingUrl, getProviderIcon } from '../../utils/trackingUrls'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const toast = {
  success: (msg) => showToast(msg, 'success'),
  error: (msg) => showToast(msg, 'error'),
  info: (msg) => showToast(msg, 'info')
}

const order = ref(null)
const loading = ref(true)
const confirmAction = ref(null)
const activityLog = ref([])
const companySettings = ref({})
const showSlip = ref(false)

const orderStatusOptions = [
  { value: 'pending', label: 'รอดำเนินการ', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'confirmed', label: 'ยืนยันแล้ว', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  { value: 'processing', label: 'กำลังจัดเตรียม', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { value: 'shipped', label: 'จัดส่งแล้ว', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { value: 'delivered', label: 'ส่งถึงแล้ว', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'cancelled', label: 'ยกเลิก', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400' },
  { value: 'refunded', label: 'คืนเงินแล้ว', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' }
]
const paymentStatusOptions = [
  { value: 'pending', label: 'รอชำระ', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' },
  { value: 'reviewing', label: 'รอตรวจสอบ', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { value: 'paid', label: 'ชำระแล้ว', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { value: 'failed', label: 'ชำระไม่สำเร็จ', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' },
  { value: 'rejected', label: 'ปฏิเสธการชำระ', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  { value: 'refunded', label: 'คืนเงินแล้ว', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' },
  { value: 'cancelled', label: 'ยกเลิก', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400' }
]

const getStatusOpt = (status, type = 'order') => {
  const opts = type === 'order' ? orderStatusOptions : paymentStatusOptions
  return opts.find(o => o.value === status) || { label: status, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' }
}

const availableActions = computed(() => {
  if (!order.value) return []
  const os = order.value.order_status, ps = order.value.payment_status
  const a = []
  if (ps === 'reviewing') {
    a.push({ key: 'approve_pay', label: 'อนุมัติการชำระ', icon: 'check', color: 'emerald', field: 'payment_status', value: 'paid', confirm: true })
    a.push({ key: 'reject_pay', label: 'ปฏิเสธสลิป', icon: 'x', color: 'red', field: 'payment_status', value: 'rejected', confirm: true })
  }
  if (ps === 'pending') {
    a.push({ key: 'mark_paid', label: 'ยืนยันชำระแล้ว', icon: 'check', color: 'emerald', field: 'payment_status', value: 'paid', confirm: true })
    a.push({ key: 'mark_failed', label: 'ชำระไม่สำเร็จ', icon: 'alert', color: 'orange', field: 'payment_status', value: 'failed', confirm: true })
  }
  if (ps === 'rejected' || ps === 'failed') a.push({ key: 'retry_pay', label: 'ให้ชำระใหม่', icon: 'refresh', color: 'blue', field: 'payment_status', value: 'pending' })
  if (os === 'pending' && ps === 'paid') a.push({ key: 'confirm_order', label: 'ยืนยันคำสั่งซื้อ', icon: 'clipboard-check', color: 'blue', field: 'order_status', value: 'confirmed' })
  if ((os === 'confirmed' || (os === 'pending' && ps === 'paid'))) a.push({ key: 'start_proc', label: 'เริ่มจัดเตรียม', icon: 'box', color: 'cyan', field: 'order_status', value: 'processing' })
  if (os === 'processing') a.push({ key: 'mark_ship', label: 'จัดส่งแล้ว', icon: 'truck', color: 'indigo', field: 'order_status', value: 'shipped' })
  if (os === 'shipped') a.push({ key: 'mark_deliver', label: 'ส่งถึงแล้ว', icon: 'home', color: 'emerald', field: 'order_status', value: 'delivered' })
  if (!['cancelled','refunded','delivered'].includes(os)) a.push({ key: 'cancel', label: 'ยกเลิกคำสั่งซื้อ', icon: 'ban', color: 'red', field: 'order_status', value: 'cancelled', confirm: true })
  if ((ps === 'paid' || os === 'cancelled') && ps !== 'refunded') a.push({ key: 'refund', label: 'คืนเงิน', icon: 'currency', color: 'purple', field: 'payment_status', value: 'refunded', confirm: true })
  return a
})

const token = () => localStorage.getItem('adminToken')
const authHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` })

const fetchOrder = async () => {
  loading.value = true
  try {
    const res = await fetch(`/api/orders/${route.params.id}`, { headers: { 'Authorization': `Bearer ${token()}` } })
    const data = await res.json()
    const o = data.order || data.data || data
    if (o && o.id) {
      if (o.shipping_address && typeof o.shipping_address === 'string') try { o.shipping_address_parsed = JSON.parse(o.shipping_address) } catch(e) {}
      if (o.tax_invoice && typeof o.tax_invoice === 'string') try { o.tax_invoice_parsed = JSON.parse(o.tax_invoice) } catch(e) {}
      order.value = o
    } else toast.error('ไม่พบคำสั่งซื้อ')
  } catch(e) { toast.error('โหลดข้อมูลไม่สำเร็จ') }
  finally { loading.value = false }
}

const fetchActivity = async () => {
  try {
    const res = await fetch(`/api/orders/admin/${route.params.id}/activity`, { headers: authHeaders() })
    const data = await res.json()
    activityLog.value = data.data || []
  } catch(e) { activityLog.value = [] }
}

const fetchCompany = async () => {
  try {
    const res = await fetch('/api/orders/admin/company-settings', { headers: authHeaders() })
    const data = await res.json()
    companySettings.value = data.data || {}
  } catch(e) {}
}

const executeAction = async (action) => {
  if (action.confirm && !confirmAction.value) { confirmAction.value = action; return }
  confirmAction.value = null
  await updateStatus(action.field, action.value)
}

const updateStatus = async (field, value) => {
  try {
    const body = {}; body[field] = value
    const res = await fetch(`/api/orders/admin/${order.value.id}/status`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) { toast.success('อัปเดตสถานะเรียบร้อย'); fetchOrder(); fetchActivity() }
    else toast.error(data.error || 'เกิดข้อผิดพลาด')
  } catch(e) { toast.error('เกิดข้อผิดพลาด') }
}

const saveNotes = async () => {
  try {
    const res = await fetch(`/api/orders/admin/${order.value.id}/notes`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ admin_notes: order.value.admin_notes || '' }) })
    const data = await res.json()
    if (data.success) { toast.success('บันทึกหมายเหตุเรียบร้อย'); fetchOrder(); fetchActivity() }
  } catch(e) { toast.error('เกิดข้อผิดพลาด') }
}

const saveTracking = async () => {
  try {
    const res = await fetch(`/api/orders/admin/${order.value.id}/tracking`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ tracking_number: order.value.tracking_number || '', shipping_provider: order.value.shipping_provider || '' }) })
    const data = await res.json()
    if (data.success) { toast.success('บันทึกเลขพัสดุเรียบร้อย'); fetchOrder(); fetchActivity() }
  } catch(e) { toast.error('เกิดข้อผิดพลาด') }
}

const togglePrintLabel = async () => {
  const newVal = !order.value.printed_shipping_label
  try {
    const res = await fetch(`/api/orders/admin/${order.value.id}/print-label`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ printed: newVal }) })
    const data = await res.json()
    if (data.success) { fetchOrder(); fetchActivity() }
  } catch(e) {}
}

const printDocument = (type) => {
  window.open(`/admin/orders/${order.value.id}/print/${type}`, '_blank')
}

const formatPrice = (v) => Number(v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })
const formatDate = (d) => d ? new Date(d).toLocaleString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const formatDateShort = (d) => d ? new Date(d).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const shortId = (id) => id ? id.substring(0, 8).toUpperCase() : '-'
const getCustomerName = (o) => { if (o.user_first_name) return `${o.user_first_name} ${o.user_last_name || ''}`.trim(); const a = o.shipping_address_parsed || {}; return a.first_name ? `${a.first_name} ${a.last_name || ''}`.trim() : 'Guest' }
const getCustomerPhone = (o) => o.user_phone || (o.shipping_address_parsed || {}).phone || '-'
const getCustomerAvatar = (o) => getCustomerName(o).charAt(0).toUpperCase()
const itemsTotal = computed(() => (order.value?.items || []).reduce((s, i) => s + i.price_at_purchase * i.quantity, 0))

const activityIcon = (action) => {
  const map = { status_change: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', payment_change: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', note_updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', tracking_updated: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', label_printed: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' }
  return map[action] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}

const actionIconPath = (icon) => {
  const m = { check:'M5 13l4 4L19 7', x:'M6 18L18 6M6 6l12 12', alert:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', refresh:'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', truck:'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0', home:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', ban:'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', currency:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', 'clipboard-check':'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', box:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' }
  return m[icon] || ''
}

const colorClass = (c, type) => {
  const m = { emerald:{btn:'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',solid:'bg-emerald-600 hover:bg-emerald-700',icon:'bg-emerald-100 text-emerald-600'}, red:{btn:'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',solid:'bg-red-600 hover:bg-red-700',icon:'bg-red-100 text-red-600'}, blue:{btn:'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',solid:'bg-blue-600 hover:bg-blue-700',icon:'bg-blue-100 text-blue-600'}, orange:{btn:'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',solid:'bg-orange-600 hover:bg-orange-700',icon:'bg-orange-100 text-orange-600'}, indigo:{btn:'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',solid:'bg-indigo-600 hover:bg-indigo-700',icon:'bg-indigo-100 text-indigo-600'}, cyan:{btn:'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',solid:'bg-cyan-600 hover:bg-cyan-700',icon:'bg-cyan-100 text-cyan-600'}, purple:{btn:'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',solid:'bg-purple-600 hover:bg-purple-700',icon:'bg-purple-100 text-purple-600'} }
  return (m[c] || m.blue)[type] || ''
}

onMounted(() => { fetchOrder(); fetchActivity(); fetchCompany() })
</script>

<template>
  <div class="w-full">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="order">
      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-4">
          <button @click="router.push('/admin/orders')" class="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all shadow-sm">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h1 class="text-2xl font-black text-gray-900 flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              </div>
              คำสั่งซื้อ #{{ shortId(order.id) }}
            </h1>
            <p class="text-sm text-gray-400 mt-0.5 ml-[52px]">{{ formatDate(order.created_at) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span :class="[getStatusOpt(order.payment_status,'payment').bg, getStatusOpt(order.payment_status,'payment').text, getStatusOpt(order.payment_status,'payment').border, 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border']">
            <span :class="[getStatusOpt(order.payment_status,'payment').dot, 'w-1.5 h-1.5 rounded-full']"></span>
            การชำระ: {{ getStatusOpt(order.payment_status,'payment').label }}
          </span>
          <span :class="[getStatusOpt(order.order_status).bg, getStatusOpt(order.order_status).text, getStatusOpt(order.order_status).border, 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border']">
            <span :class="[getStatusOpt(order.order_status).dot, 'w-1.5 h-1.5 rounded-full']"></span>
            สถานะ: {{ getStatusOpt(order.order_status).label }}
          </span>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="availableActions.length" class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-black text-gray-400 uppercase tracking-wider mr-2">ดำเนินการ</span>
          <button v-for="act in availableActions" :key="act.key" @click="executeAction(act)" :class="['inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border', colorClass(act.color,'btn')]">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="actionIconPath(act.icon)"/></svg>
            {{ act.label }}
          </button>
        </div>
      </div>

      <!-- Confirm Dialog -->
      <Teleport to="body">
        <transition name="modal">
          <div v-if="confirmAction" class="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="confirmAction = null"></div>
            <div class="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
              <div :class="['w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center', colorClass(confirmAction.color,'icon')]">
                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
              </div>
              <h3 class="text-lg font-black text-gray-900 mb-1">ยืนยันการดำเนินการ</h3>
              <p class="text-sm text-gray-500 mb-5">คุณต้องการ <b>{{ confirmAction.label }}</b> ใช่หรือไม่?</p>
              <div class="flex gap-3">
                <button @click="confirmAction = null" class="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">ยกเลิก</button>
                <button @click="executeAction({...confirmAction, confirm: false})" :class="['flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white', colorClass(confirmAction.color,'solid')]">ยืนยัน</button>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- LEFT COLUMN -->
        <div class="lg:col-span-2 space-y-5">
          <!-- Order Items -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">รายการสินค้า ({{ order.items?.length || 0 }})</h2>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
                <img v-if="item.product_image" :src="item.product_image" class="w-14 h-14 rounded-xl object-cover bg-gray-50 border border-gray-100"/>
                <div v-else class="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300"><svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-sm text-gray-900 truncate">{{ item.product_name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ item.quantity }} ชิ้น × ฿{{ formatPrice(item.price_at_purchase) }}</p>
                </div>
                <p class="font-black text-sm text-gray-900">฿{{ formatPrice(item.price_at_purchase * item.quantity) }}</p>
              </div>
            </div>
            <div class="px-5 py-4 bg-gray-50/50 border-t border-gray-100 space-y-2">
              <div class="flex justify-between text-sm"><span class="text-gray-400">ยอดสินค้า</span><span class="font-bold text-gray-700">฿{{ formatPrice(itemsTotal) }}</span></div>
              <div v-if="order.shipping_cost > 0" class="flex justify-between text-sm"><span class="text-gray-400">ค่าจัดส่ง</span><span class="font-bold text-gray-700">฿{{ formatPrice(order.shipping_cost) }}</span></div>
              <div class="flex justify-between text-lg pt-2 border-t border-gray-200"><span class="font-bold text-gray-900">ยอดรวมทั้งสิ้น</span><span class="font-black text-emerald-600">฿{{ formatPrice(order.total_amount) }}</span></div>
            </div>
          </div>

          <!-- Payment Slip -->
          <div v-if="order.payment_slip_url" class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><svg class="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">หลักฐานการชำระเงิน</h2>
              </div>
              <button @click="showSlip = !showSlip" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                <svg :class="showSlip ? 'rotate-180' : ''" class="w-4 h-4 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                {{ showSlip ? 'ซ่อน' : 'แสดงสลิป' }}
              </button>
            </div>
            <div v-if="showSlip" class="p-5 flex justify-center bg-gray-50"><img :src="order.payment_slip_url" class="max-w-xs w-full rounded-xl shadow-lg ring-1 ring-black/5" alt="Slip"/></div>
          </div>

          <!-- Tracking & Shipping -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ข้อมูลจัดส่ง</h2>
            </div>
            <div class="p-5 space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">ขนส่ง</label>
                  <select v-model="order.shipping_provider" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-indigo-400 outline-none bg-white">
                    <option value="">-- เลือกขนส่ง --</option>
                    <option value="Kerry Express">Kerry Express</option>
                    <option value="Flash Express">Flash Express</option>
                    <option value="Thailand Post">ไปรษณีย์ไทย</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="Ninja Van">Ninja Van</option>
                    <option value="Best Express">Best Express</option>
                    <option value="DHL">DHL</option>
                    <option value="จัดส่งเอง">จัดส่งเอง</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">เลขพัสดุ</label>
                  <input v-model="order.tracking_number" type="text" placeholder="กรอกเลขพัสดุ" class="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-indigo-400 outline-none"/>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer" @click="togglePrintLabel">
                  <div :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors', order.printed_shipping_label ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300']">
                    <svg v-if="order.printed_shipping_label" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <span class="text-sm font-medium text-gray-700">พิมพ์ใบปะหน้าพัสดุแล้ว</span>
                </label>
                <button @click="saveTracking" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  บันทึกข้อมูลจัดส่ง
                </button>
              </div>
              <!-- Track Parcel Button -->
              <div v-if="order.tracking_number && order.shipping_provider" class="border-t border-gray-100 pt-3">
                <a :href="getTrackingUrl(order.shipping_provider, order.tracking_number)" target="_blank" rel="noopener noreferrer" class="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <span class="inline-flex items-center shrink-0" v-html="getProviderIcon(order.shipping_provider)"></span> ติดตามพัสดุ {{ order.shipping_provider }}
                </a>
                <p class="text-[11px] text-gray-400 mt-2 text-center">เลขพัสดุ: <span class="font-mono font-bold text-gray-600">{{ order.tracking_number }}</span></p>
              </div>
              <!-- Milestones -->
              <div v-if="order.shipped_at || order.delivered_at" class="border-t border-gray-100 pt-3 space-y-1">
                <div v-if="order.shipped_at" class="flex items-center gap-2 text-xs"><svg class="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="text-gray-500">จัดส่งเมื่อ: <b class="text-gray-700">{{ formatDate(order.shipped_at) }}</b></span></div>
                <div v-if="order.delivered_at" class="flex items-center gap-2 text-xs"><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg><span class="text-gray-500">ส่งถึงเมื่อ: <b class="text-gray-700">{{ formatDate(order.delivered_at) }}</b></span></div>
              </div>
            </div>
          </div>

          <!-- Documents -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ออกเอกสาร</h2>
            </div>
            <div class="p-5 grid grid-cols-3 gap-3">
              <button @click="printDocument('receipt')" class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all group">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors"><svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                <span class="text-xs font-bold text-gray-700">ใบเสร็จรับเงิน</span>
              </button>
              <button @click="printDocument('tax_invoice')" class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                <div class="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center transition-colors"><svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg></div>
                <span class="text-xs font-bold text-gray-700">ใบกำกับภาษี</span>
              </button>
              <button @click="printDocument('shipping_label')" class="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group">
                <div class="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors"><svg class="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg></div>
                <span class="text-xs font-bold text-gray-700">ใบปะหน้าพัสดุ</span>
              </button>
            </div>
          </div>

          <!-- Admin Notes -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">หมายเหตุภายใน</h2>
            </div>
            <div class="p-5">
              <textarea v-model="order.admin_notes" rows="3" placeholder="เพิ่มหมายเหตุสำหรับทีมงาน..." class="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none bg-gray-50 focus:bg-white"></textarea>
              <div class="flex justify-end mt-3">
                <button @click="saveNotes" class="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  บันทึกหมายเหตุ
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="space-y-5">
          <!-- Status Controls -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">จัดการสถานะ</h2>
            </div>
            <div class="p-5 space-y-4">
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">สถานะคำสั่งซื้อ</label>
                <select :value="order.order_status" @change="updateStatus('order_status', $event.target.value)" class="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:border-emerald-500 outline-none bg-white">
                  <option v-for="opt in orderStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">สถานะการชำระเงิน</label>
                <select :value="order.payment_status" @change="updateStatus('payment_status', $event.target.value)" class="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-bold focus:border-emerald-500 outline-none bg-white">
                  <option v-for="opt in paymentStatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ข้อมูลลูกค้า</h2>
            </div>
            <div class="p-5">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center font-black text-indigo-600 text-sm">{{ getCustomerAvatar(order) }}</div>
                <div><p class="font-bold text-gray-900 text-sm">{{ getCustomerName(order) }}</p><p class="text-xs text-gray-400">ลูกค้า</p></div>
              </div>
              <div class="space-y-3 text-sm">
                <div class="flex items-center gap-2.5"><svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg><span class="font-medium text-gray-700">{{ getCustomerPhone(order) }}</span></div>
                <div v-if="order.user_email" class="flex items-center gap-2.5"><svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><span class="font-medium text-gray-700">{{ order.user_email }}</span></div>
                <div class="flex items-center gap-2.5"><svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg><span class="font-medium text-gray-700">{{ order.payment_method || '-' }}</span></div>
                <div v-if="order.tax_invoice_parsed" class="pt-2 mt-1 border-t border-gray-100">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
                    ขอใบกำกับภาษี
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center"><svg class="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ที่อยู่จัดส่ง</h2>
            </div>
            <div class="p-5">
              <p v-if="order.shipping_address_parsed" class="text-sm text-gray-700 leading-relaxed">
                {{ order.shipping_address_parsed.address_line || '' }}
                <template v-if="order.shipping_address_parsed.subdistrict"><br/>ต. {{ order.shipping_address_parsed.subdistrict }}</template>
                <template v-if="order.shipping_address_parsed.district"><br/>อ. {{ order.shipping_address_parsed.district }}</template>
                <template v-if="order.shipping_address_parsed.province"><br/>จ. {{ order.shipping_address_parsed.province }}</template>
                <template v-if="order.shipping_address_parsed.postal_code"><br/>{{ order.shipping_address_parsed.postal_code }}</template>
              </p>
              <p v-else class="text-sm text-gray-400 italic">ไม่มีข้อมูลที่อยู่</p>
            </div>
          </div>

          <!-- Tax Invoice Info -->
          <div v-if="order.tax_invoice_parsed" class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ข้อมูลใบกำกับภาษี</h2>
            </div>
            <div class="p-5 space-y-2 text-sm">
              <div v-if="order.tax_invoice_parsed.company_name" class="flex justify-between"><span class="text-gray-400">บริษัท</span><span class="font-bold text-gray-700">{{ order.tax_invoice_parsed.company_name }}</span></div>
              <div v-if="order.tax_invoice_parsed.tax_id" class="flex justify-between"><span class="text-gray-400">เลขที่ผู้เสียภาษี</span><span class="font-mono font-bold text-gray-700">{{ order.tax_invoice_parsed.tax_id }}</span></div>
              <div v-if="order.tax_invoice_parsed.branch" class="flex justify-between"><span class="text-gray-400">สาขา</span><span class="font-bold text-gray-700">{{ order.tax_invoice_parsed.branch }}</span></div>
              <div v-if="order.tax_invoice_parsed.address_line" class="pt-2 border-t border-gray-100"><span class="text-gray-400 text-xs">ที่อยู่</span><p class="text-gray-700 mt-1">{{ order.tax_invoice_parsed.address_line }} {{ order.tax_invoice_parsed.subdistrict ? 'ต.'+order.tax_invoice_parsed.subdistrict : '' }} {{ order.tax_invoice_parsed.district ? 'อ.'+order.tax_invoice_parsed.district : '' }} {{ order.tax_invoice_parsed.province ? 'จ.'+order.tax_invoice_parsed.province : '' }} {{ order.tax_invoice_parsed.postal_code || '' }}</p></div>
            </div>
          </div>

          <!-- Activity Log -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ประวัติกิจกรรม</h2>
            </div>
            <div class="p-5">
              <div v-if="activityLog.length === 0" class="text-center py-6"><p class="text-sm text-gray-400">ยังไม่มีกิจกรรม</p></div>
              <div v-else class="space-y-0">
                <div v-for="(log, idx) in activityLog" :key="log.id" class="relative flex gap-3 pb-4">
                  <div v-if="idx < activityLog.length - 1" class="absolute left-[14px] top-8 bottom-0 w-px bg-gray-200"></div>
                  <div class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 z-10">
                    <svg class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="activityIcon(log.action)"/></svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-700 font-medium leading-snug">{{ log.details }}</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">{{ log.performed_by }} · {{ formatDateShort(log.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Info -->
          <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"><svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
              <h2 class="text-sm font-black text-gray-900 uppercase tracking-wider">ข้อมูลเพิ่มเติม</h2>
            </div>
            <div class="p-5 space-y-3 text-sm">
              <div class="flex justify-between"><span class="text-gray-400">Order ID</span><span class="font-mono font-bold text-gray-700 text-xs">{{ order.id }}</span></div>
              <div class="flex justify-between"><span class="text-gray-400">วันที่สั่ง</span><span class="font-medium text-gray-700">{{ formatDate(order.created_at) }}</span></div>
              <div v-if="order.updated_at" class="flex justify-between"><span class="text-gray-400">อัปเดตล่าสุด</span><span class="font-medium text-gray-700">{{ formatDate(order.updated_at) }}</span></div>
              <div v-if="order.cancelled_at" class="flex justify-between"><span class="text-gray-400">วันที่ยกเลิก</span><span class="font-medium text-red-600">{{ formatDate(order.cancelled_at) }}</span></div>
              <div v-if="order.cancel_reason" class="pt-2 border-t border-gray-100"><span class="text-gray-400 text-xs">เหตุผลการยกเลิก</span><p class="text-red-600 mt-1 font-medium">{{ order.cancel_reason }}</p></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Print handled in separate tab now -->
    </template>

    <!-- Not found -->
    <div v-else class="text-center py-32">
      <p class="text-gray-400 font-bold text-lg">ไม่พบคำสั่งซื้อนี้</p>
      <button @click="router.push('/admin/orders')" class="mt-4 px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold">กลับไปหน้ารายการ</button>
    </div>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
