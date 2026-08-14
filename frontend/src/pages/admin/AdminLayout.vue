<script setup>
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useNotifications } from '../../composables/useNotifications'

const router = useRouter()
const route = useRoute()
const adminUser = ref(null)
const showNotifPanel = ref(false)
const showProfilePanel = ref(false)
const systemVersion = ref('v1.0.0')
const sidebarOpen = ref(false)
const isDarkAdmin = ref(false)
const avatarError = ref(false)

watch(() => adminUser.value?.profile_image_url, () => {
  avatarError.value = false
})

const { notifications, refreshNotifications } = useNotifications()

const toggleDarkMode = () => {
  isDarkAdmin.value = !isDarkAdmin.value
  if (isDarkAdmin.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

watch(() => route.path, () => { sidebarOpen.value = false })
function onResize() { if (window.innerWidth >= 1024) sidebarOpen.value = false }

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDarkAdmin.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkAdmin.value = false
    document.documentElement.classList.remove('dark')
  }

  window.addEventListener('resize', onResize)
  const storedUser = localStorage.getItem('adminUser')
  if (storedUser) adminUser.value = JSON.parse(storedUser)
  fetch('/api/system/info').then(r => r.ok ? r.json() : null).then(data => {
    if (data?.success && data.version) systemVersion.value = 'v' + data.version
  }).catch(() => {})
  window.addEventListener('adminProfileUpdated', () => {
    const u = localStorage.getItem('adminUser')
    if (u) {
      adminUser.value = JSON.parse(u)
      avatarError.value = false
    }
  })
})
onBeforeUnmount(() => window.removeEventListener('resize', onResize))

const handleLogout = () => {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUser')
  router.push('/admin/login')
}
function goTo(path) {
  showNotifPanel.value = false
  showProfilePanel.value = false
  sidebarOpen.value = false
  router.push(path)
}
</script>

<template>
  <div class="h-screen flex bg-gray-50 dark:bg-[#0a0f16] text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">

    <!-- Mobile Backdrop -->
    <Transition name="fade">
      <div v-if="sidebarOpen" class="fixed inset-0 bg-black/50 z-[45] lg:hidden" @click="sidebarOpen = false"></div>
    </Transition>

    <!-- Sidebar -->
    <aside :class="['bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-transform duration-300 ease-in-out shrink-0', 'fixed inset-y-0 left-0 w-72 lg:w-64 lg:relative lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full']">
      <div class="h-16 flex items-center justify-between px-6 border-b border-gray-800">
        <div class="flex flex-col">
          <span class="text-xl font-black text-white tracking-widest uppercase leading-none">ผู้ดูแลระบบ</span>
          <span class="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-wider pl-0.5">System <span class="text-emerald-500 font-mono">{{ systemVersion }}</span></span>
        </div>
        <button @click="sidebarOpen = false" class="lg:hidden p-1 text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">

        <!-- Overview Group -->
        <div>
          <h3 class="px-4 text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">ภาพรวม & สถิติ</h3>
          <div class="space-y-1">
            <router-link to="/admin" exact-active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
              หน้าหลักแอดมิน
            </router-link>
            
            <router-link to="/admin/analytics" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              สถิติการเข้าชม
            </router-link>
          </div>
        </div>

        <!-- E-Commerce Group -->
        <div>
          <h3 class="px-4 text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">ร้านค้า & ลูกค้า</h3>
          <div class="space-y-1">
            <router-link to="/admin/products" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              จัดการสินค้า
            </router-link>

            <router-link to="/admin/categories" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
              หมวดหมู่สินค้า
            </router-link>

            <router-link to="/admin/wires" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              จัดการข้อมูลสายไฟ
            </router-link>

            <router-link to="/admin/leads" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                ขอใบเสนอราคา
              </span>
              <span v-if="notifications.newQuotations > 0" class="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 animate-pulse">
                {{ notifications.newQuotations > 99 ? '99+' : notifications.newQuotations }}
              </span>
            </router-link>

            <router-link to="/admin/orders" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
                คำสั่งซื้อ
              </span>
              <span v-if="notifications.pendingOrders > 0" class="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold bg-emerald-500 text-white rounded-full px-1.5 animate-pulse">
                {{ notifications.pendingOrders > 99 ? '99+' : notifications.pendingOrders }}
              </span>
            </router-link>

            <router-link to="/admin/customers" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              จัดการลูกค้าสมาชิก
            </router-link>

            <router-link to="/admin/reviews" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                รีวิวสินค้า
              </span>
            </router-link>

            <router-link to="/admin/coupons" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              โค้ดส่วนลด (Coupon)
            </router-link>

            <router-link to="/admin/users" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              ผู้ดูแลระบบ
            </router-link>
          </div>
        </div>



        <!-- Communication Group -->
        <div>
          <h3 class="px-4 text-[10px] font-black tracking-widest text-gray-500 uppercase mb-3">กล่องข้อความ & ติดต่อ</h3>
          <div class="space-y-1">
            <router-link to="/admin/inbox" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <span class="flex items-center">
                <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                ข้อความลูกค้า
              </span>
              <span v-if="notifications.unreadMessages > 0" class="min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 animate-pulse">
                {{ notifications.unreadMessages > 99 ? '99+' : notifications.unreadMessages }}
              </span>
            </router-link>

            <router-link to="/admin/newsletter" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              อีเมลติดตามข่าวสาร
            </router-link>

            <router-link to="/admin/line" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path></svg>
              Line Official
            </router-link>

            <router-link to="/admin/contact" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              ช่องทางโซเชียล & ที่อยู่
            </router-link>
          </div>
        </div>

        <!-- System & Setup Group -->
        <div class="pt-4 border-t border-gray-800/50">
          <h3 class="px-4 text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-3 text-center">ระบบหลังบ้าน</h3>
          <div class="space-y-1">
            <router-link to="/admin/manual" active-class="bg-emerald-600/20 text-emerald-400 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-emerald-500/80 hover:bg-emerald-500/10 hover:text-emerald-400 transition-colors border border-emerald-500/10">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              คู่มือการจัดการระบบ
            </router-link>

            <router-link to="/admin/settings" active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              ตั้งค่าระบบ
            </router-link>

            <router-link to="/admin/logs" exact-active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              บันทึกระบบ (System Logs)
            </router-link>

            <router-link to="/admin/logs/orders" exact-active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              ประวัติกิจกรรมคำสั่งซื้อ
            </router-link>

            <router-link to="/admin/logs/emails" exact-active-class="bg-emerald-600/10 text-emerald-500 font-bold" class="flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 hover:bg-gray-800 hover:text-white transition-colors">
              <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              ประวัติส่งอีเมล (Email Logs)
            </router-link>
          </div>
        </div>
      
      </nav>

    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-full relative overflow-y-auto min-w-0">
      <!-- Top Bar -->
      <div class="sticky top-0 z-40 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-4 lg:px-8 py-3 flex items-center justify-between gap-3 transition-colors duration-300">
        <button @click="sidebarOpen = true" class="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="flex-1"></div>
        <div class="flex items-center gap-2 sm:gap-3 lg:gap-4">
          <!-- Open Website -->
          <a href="/" target="_blank" class="hidden sm:flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg shadow-sm transition-all hover:shadow group">
            <svg class="w-3.5 h-3.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            เปิดเว็บไซต์
          </a>

          <div class="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <!-- Dark Mode Toggle -->
          <button @click="toggleDarkMode" aria-label="สลับโหมดมืด" class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-gray-800 transition-all">
            <svg v-if="!isDarkAdmin" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>

          <!-- Notification bell -->
          <div class="relative">
            <button @click="showNotifPanel = !showNotifPanel" class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              <span v-if="notifications.total > 0" class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 ring-2 ring-white dark:ring-[#111827] transition-all animate-pulse">
                {{ notifications.total > 99 ? '99+' : notifications.total }}
              </span>
            </button>

            <!-- Notification dropdown panel -->
            <Transition name="notif">
              <div v-if="showNotifPanel" class="absolute right-0 top-12 w-80 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 class="text-sm font-extrabold text-gray-900 dark:text-white">การแจ้งเตือน</h3>
                  <span v-if="notifications.total > 0" class="text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-500/20 px-2 py-0.5 rounded-full">{{ notifications.total }} รายการ</span>
                  <span v-else class="text-[11px] text-gray-400">ไม่มีรายการใหม่</span>
                </div>
                <div class="divide-y divide-gray-50 dark:divide-gray-800/50">
                  <button @click="goTo('/admin/leads')" class="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="notifications.newQuotations > 0 ? 'bg-amber-100 dark:bg-amber-500/20' : 'bg-gray-100 dark:bg-gray-800'">
                      <svg :class="notifications.newQuotations > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold" :class="notifications.newQuotations > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'">ใบเสนอราคาใหม่</p>
                      <p class="text-xs mt-0.5" :class="notifications.newQuotations > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-gray-400'">
                        {{ notifications.newQuotations > 0 ? `${notifications.newQuotations} รายการรอดำเนินการ` : 'ไม่มีรายการใหม่' }}
                      </p>
                    </div>
                    <span v-if="notifications.newQuotations > 0" class="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{{ notifications.newQuotations > 99 ? '99+' : notifications.newQuotations }}</span>
                  </button>
                  <button @click="goTo('/admin/orders')" class="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="notifications.pendingOrders > 0 ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-gray-100 dark:bg-gray-800'">
                      <svg :class="notifications.pendingOrders > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold" :class="notifications.pendingOrders > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'">คำสั่งซื้อใหม่</p>
                      <p class="text-xs mt-0.5" :class="notifications.pendingOrders > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400'">
                        {{ notifications.pendingOrders > 0 ? `${notifications.pendingOrders} รายการรอดำเนินการ` : 'ไม่มีคำสั่งซื้อใหม่' }}
                      </p>
                    </div>
                    <span v-if="notifications.pendingOrders > 0" class="w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{{ notifications.pendingOrders > 99 ? '99+' : notifications.pendingOrders }}</span>
                  </button>
                  <button @click="goTo('/admin/inbox')" class="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" :class="notifications.unreadMessages > 0 ? 'bg-rose-100 dark:bg-rose-500/20' : 'bg-gray-100 dark:bg-gray-800'">
                      <svg :class="notifications.unreadMessages > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold" :class="notifications.unreadMessages > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-500'">ข้อความยังไม่อ่าน</p>
                      <p class="text-xs mt-0.5" :class="notifications.unreadMessages > 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-gray-400'">
                        {{ notifications.unreadMessages > 0 ? `${notifications.unreadMessages} ข้อความรอตอบกลับ` : 'ไม่มีข้อความใหม่' }}
                      </p>
                    </div>
                    <span v-if="notifications.unreadMessages > 0" class="w-6 h-6 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{{ notifications.unreadMessages > 99 ? '99+' : notifications.unreadMessages }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Divider -->
          <div class="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

          <!-- User Profile Dropdown -->
          <div class="relative">
            <button @click="showProfilePanel = !showProfilePanel" class="flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl p-1 pr-3 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/50">
              <div class="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200 dark:border-emerald-500/30 overflow-hidden">
                <img v-if="adminUser?.profile_image_url && !avatarError" :src="adminUser.profile_image_url" @error="avatarError = true" class="w-full h-full object-cover">
                <span v-else>{{ adminUser?.name?.charAt(0)?.toUpperCase() || 'A' }}</span>
              </div>
              <div class="flex flex-col hidden sm:flex text-left">
                <span class="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[100px]">{{ adminUser?.name || 'ผู้ดูแลระบบ' }}</span>
                <span class="text-[10px] text-gray-500 dark:text-gray-400 font-medium">ดูโปรไฟล์</span>
              </div>
              <svg class="hidden sm:block w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            <!-- Dropdown Panel -->
            <Transition name="notif">
              <div v-if="showProfilePanel" class="absolute right-0 top-12 w-56 bg-white dark:bg-[#111827] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-0.5">
                  <span class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ adminUser?.name || 'ผู้ดูแลระบบ' }}</span>
                  <span class="text-[11px] text-gray-500 dark:text-gray-400 truncate">{{ adminUser?.email || 'admin@system.com' }}</span>
                </div>
                <div class="py-1">
                  <button @click="goTo('/admin/profile')" class="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left font-medium">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    จัดการโปรไฟล์
                  </button>
                  <div class="my-1 border-t border-gray-100 dark:border-gray-800"></div>
                  <button @click="handleLogout" class="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left font-medium">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </Transition>
          </div>

        </div>
      </div>

      <!-- Click outside to close -->
      <div v-if="showNotifPanel || showProfilePanel" class="fixed inset-0 z-[35]" @click="showNotifPanel = false; showProfilePanel = false"></div>

      <div class="p-4 md:p-6 lg:p-8 flex-1">
        <router-view></router-view>
      </div>
    </main>

  </div>
</template>

<style scoped>
.notif-enter-active, .notif-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.notif-enter-from, .notif-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
