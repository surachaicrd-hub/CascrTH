<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const route = useRoute()
const router = useRouter()
const { showToast } = useToast()
const { showConfirm } = useConfirm()

const customerId = route.params.id
const loading = ref(true)
const profile = ref(null)
const orders = ref([])
const addresses = ref([])
const avatarError = ref(false)

const fetchCustomer = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`/api/admin/customers/${customerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (data.success) {
      profile.value = data.data.profile
      orders.value = data.data.orders
      addresses.value = data.data.addresses
      avatarError.value = false
    } else {
      showToast(data.error || 'โหลดข้อมูลลูกค้าไม่สำเร็จ', 'error')
      router.push('/admin/customers')
    }
  } catch (error) {
    console.error('Fetch detail error:', error)
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error')
  } finally {
    loading.value = false
  }
}

const deleteCustomer = async () => {
  if (await showConfirm({
    title: 'ลบข้อมูลลูกค้า',
    message: `คุณต้องการลบข้อมูลของ ${profile.value?.first_name} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
    confirmText: 'ลบทิ้งถาวร',
    type: 'danger'
  })) {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/customers/${customerId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        showToast('ลบข้อมูลลูกค้าสำเร็จ', 'success')
        router.push('/admin/customers')
      } else {
        showToast(data.error || 'ลบไม่สำเร็จ', 'error')
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }
}

const toggleBlacklist = async () => {
  const isBlacklisting = !profile.value.is_blacklisted
  if (await showConfirm({
    title: isBlacklisting ? 'ขึ้นบัญชีดำลูกค้า' : 'ปลดบัญชีดำ',
    message: isBlacklisting ? `คุณแน่ใจหรือไม่ว่าต้องการขึ้นบัญชีดำ ${profile.value.first_name}? ลูกค้ารายนี้อาจถูกจำกัดสิทธิ์ในระบบ` : `คุณต้องการปลด ${profile.value.first_name} ออกจากบัญชีดำใช่หรือไม่?`,
    confirmText: isBlacklisting ? 'ขึ้นบัญชีดำ' : 'ปลดบัญชีดำ',
    type: isBlacklisting ? 'danger' : 'success'
  })) {
    try {
      const token = localStorage.getItem('adminToken')
      const res = await fetch(`/api/admin/customers/${customerId}/blacklist`, {
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
        profile.value.is_blacklisted = isBlacklisting
      } else {
        showToast(data.error || 'ดำเนินการไม่สำเร็จ', 'error')
      }
    } catch (error) {
      console.error('Toggle blacklist error:', error)
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0)
}

const formatDate = (dateString, withTime = false) => {
  if (!dateString) return '-'
  const opts = { year: 'numeric', month: 'short', day: 'numeric' }
  if (withTime) {
    opts.hour = '2-digit'
    opts.minute = '2-digit'
  }
  return new Date(dateString).toLocaleDateString('th-TH', opts)
}

const formatSource = (sourceText) => {
  if (!sourceText || sourceText === 'organic') return { label: 'เข้าชมโดยตรง', color: 'bg-gray-100 text-gray-600', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' }
  if (sourceText === 'facebook_ad') return { label: 'โฆษณา Facebook', color: 'bg-blue-100 text-blue-700', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' }
  if (sourceText.includes('utm_source=facebook')) return { label: 'Facebook', color: 'bg-[#1877F2]/10 text-[#1877F2]' }
  if (sourceText.includes('utm_source=tiktok')) return { label: 'TikTok', color: 'bg-black/10 text-black' }
  if (sourceText.includes('utm_source=google')) return { label: 'Google', color: 'bg-red-100 text-red-600' }
  return { label: sourceText, color: 'bg-indigo-100 text-indigo-700' }
}

const getOrderStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'shipped': return 'bg-emerald-100 text-emerald-800'
    case 'delivered': return 'bg-emerald-100 text-emerald-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getOrderStatusLabel = (status) => {
  switch (status) {
    case 'pending': return 'รอดำเนินการ'
    case 'processing': return 'กำลังเตรียมจัดส่ง'
    case 'shipped': return 'จัดส่งแล้ว'
    case 'delivered': return 'ส่งมอบสำเร็จ'
    case 'cancelled': return 'ยกเลิก'
    default: return status
  }
}

onMounted(() => {
  fetchCustomer()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24 w-full">
    <!-- Header Controls -->
    <div class="mb-6 flex items-center justify-between">
      <button @click="router.push('/admin/customers')" class="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        กลับไปหน้ารายการ
      </button>
      <div class="flex items-center gap-2">
        <button v-if="profile" @click="toggleBlacklist" class="flex items-center gap-2 transition-colors font-bold text-sm px-4 py-2 rounded-xl" :class="profile.is_blacklisted ? 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50' : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'">
          <svg v-if="profile.is_blacklisted" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
          {{ profile.is_blacklisted ? 'ปลดบัญชีดำ' : 'ขึ้นบัญชีดำ' }}
        </button>
        <button @click="deleteCustomer" class="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors font-bold text-sm px-4 py-2 rounded-xl" v-if="profile">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          ลบบัญชีลูกค้านี้
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <svg class="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Content -->
    <div v-else-if="profile" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Left Column: Profile Card -->
      <div class="lg:col-span-1 space-y-6">
        <div v-if="profile?.is_blacklisted" class="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-start gap-3 text-red-700 shadow-sm animate-pulse-once">
          <svg class="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <div>
            <p class="font-bold text-sm">ลูกค้ารายนี้อยู่ในบัญชีดำ</p>
            <p class="text-xs mt-1 text-red-600/80">อาจถูกจำกัดสิทธิ์ในการสั่งซื้อ หรือถูกระงับบัญชี ข้อมูลที่เกี่ยวข้องอาจได้รับผลกระทบ</p>
          </div>
        </div>

        <!-- Main Info -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full flex items-center justify-center font-bold overflow-hidden border-4 shadow-inner mb-4 shrink-0 transition-colors" :class="profile.is_blacklisted ? 'bg-red-100 text-red-700 border-red-50' : 'bg-emerald-100 text-emerald-700 border-emerald-50'">
            <img v-if="profile.avatar_url && !avatarError" :src="profile.avatar_url" @error="avatarError = true" class="w-full h-full object-cover">
            <span v-else class="text-3xl">{{ (profile.first_name || 'U').substring(0, 1).toUpperCase() }}</span>
          </div>
          <h2 class="text-2xl font-black text-gray-900">{{ profile.first_name }} {{ profile.last_name }}</h2>
          <p class="text-gray-500 text-sm mt-1">{{ profile.email || 'ไม่มีอีเมล' }}</p>
          
          <div class="w-full mt-6 pt-6 border-t border-gray-100 space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 font-medium">เบอร์โทรศัพท์</span>
              <span class="font-bold text-gray-900">{{ profile.phone || '-' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 font-medium">วันที่สมัคร</span>
              <span class="font-bold text-gray-900">{{ formatDate(profile.created_at) }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 font-medium">ยืนยันอีเมล</span>
              <span class="font-bold flex items-center gap-1" :class="profile.is_email_verified ? 'text-emerald-600' : 'text-yellow-600'">
                <svg v-if="profile.is_email_verified" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                {{ profile.is_email_verified ? 'ยืนยันแล้ว' : 'รอการยืนยัน' }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500 font-medium">ช่องทางการสมัคร (Source)</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" :class="formatSource(profile.registration_source).color">
                {{ formatSource(profile.registration_source).label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Linked Accounts -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4 border-l-4 border-emerald-500 pl-3">การเชื่อมต่อบัญชี</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-[#EA4335]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                <span class="font-bold text-sm text-gray-700">Google Auth</span>
              </div>
              <span v-if="profile.google_id" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">เชื่อมต่อแล้ว</span>
              <span v-else class="text-xs text-gray-400">ยังไม่เชื่อมต่อ</span>
            </div>
            
            <div class="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-[#06C755]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                <span class="font-bold text-sm text-gray-700">LINE Auth</span>
              </div>
              <span v-if="profile.line_id" class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">เชื่อมต่อแล้ว</span>
              <span v-else class="text-xs text-gray-400">ยังไม่เชื่อมต่อ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Orders & Addresses -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Stats Summary -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden">
            <svg class="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd"></path></svg>
            <p class="text-emerald-100 font-medium text-sm mb-1 z-10 relative">ยอดซื้อสะสมทั้งหมด</p>
            <h4 class="text-3xl font-black tracking-tight z-10 relative">{{ formatCurrency(profile.total_spent) }}</h4>
          </div>
          
          <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
            <svg class="absolute -right-4 -bottom-4 w-32 h-32 text-gray-50 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clip-rule="evenodd"></path></svg>
            <p class="text-gray-500 font-medium text-sm mb-1 z-10 relative">จำนวนออเดอร์</p>
            <h4 class="text-3xl font-black tracking-tight text-gray-900 z-10 relative">{{ profile.orders_count }} <span class="text-lg font-bold text-gray-300 ml-1">รายการ</span></h4>
          </div>
        </div>

        <!-- Order History -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">ประวัติการสั่งซื้อ</h3>
          </div>
          <div class="p-0">
            <div v-if="orders.length === 0" class="p-8 text-center text-gray-400">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              ยังไม่มีประวัติการสั่งซื้อ
            </div>
            <div v-else class="overflow-x-auto w-full">
              <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th class="px-6 py-3">รหัสออเดอร์</th>
                    <th class="px-6 py-3">วันที่</th>
                    <th class="px-6 py-3">ยอดรวม</th>
                    <th class="px-6 py-3">สถานะ</th>
                    <th class="px-6 py-3 text-center">ดูรายละเอียด</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  <tr v-for="order in orders" :key="order.id" class="hover:bg-gray-50 transition-colors group">
                    <td class="px-6 py-3 font-mono text-xs font-bold text-gray-900">#{{ order.id.split('-')[0].toUpperCase() }}</td>
                    <td class="px-6 py-3 text-gray-500">{{ formatDate(order.created_at, true) }}</td>
                    <td class="px-6 py-3 font-bold text-emerald-600">{{ formatCurrency(order.total_amount) }}</td>
                    <td class="px-6 py-3">
                      <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider" :class="getOrderStatusColor(order.order_status)">
                        {{ getOrderStatusLabel(order.order_status) }}
                      </span>
                    </td>
                    <td class="px-6 py-3 text-center">
                      <button @click="router.push(`/admin/orders/${order.id}`)" class="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
                        ดูออเดอร์
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Saved Addresses -->
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 class="text-lg font-bold text-gray-900 border-l-4 border-emerald-500 pl-3">ที่อยู่ที่บันทึกไว้</h3>
          </div>
          <div class="p-6">
            <div v-if="addresses.length === 0" class="text-center text-gray-400 py-4">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              ไม่มีข้อมูลที่อยู่
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="address in addresses" :key="address.id" class="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex flex-col relative text-sm">
                <span v-if="address.is_default" class="absolute top-4 right-4 bg-emerald-100 text-emerald-600 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">ค่าเริ่มต้น</span>
                
                <h4 class="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <svg v-if="address.type === 'shipping'" class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                  <svg v-else class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  {{ address.title || (address.type === 'shipping' ? 'ที่อยู่จัดส่ง' : 'ที่อยู่ออกใบกำกับภาษี') }}
                </h4>
                
                <p class="font-bold text-gray-700 mt-2">{{ address.first_name }} {{ address.last_name }} <span class="font-normal text-gray-500 ml-2">{{ address.phone }}</span></p>
                <p class="text-gray-500 mt-1 leading-relaxed">{{ address.address_line }}</p>
                <p class="text-gray-500 leading-relaxed">{{ address.subdistrict }}, {{ address.district }}, {{ address.province }} {{ address.postal_code }}</p>
                
                <div v-if="address.type === 'tax' && address.company_name" class="mt-3 pt-3 border-t border-gray-200">
                  <p class="font-semibold text-gray-700"><span class="text-gray-500 font-normal">บริษัท:</span> {{ address.company_name }}</p>
                  <p class="font-semibold text-gray-700 text-xs"><span class="text-gray-500 font-normal">เลขประจำตัวผู้เสียภาษี:</span> {{ address.tax_id || '-' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
