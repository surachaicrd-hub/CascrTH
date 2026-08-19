<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useToast } from '../composables/useToast'
import ReviewModal from '../components/ReviewModal.vue'
import { getTrackingUrl } from '../utils/trackingUrls'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const { showToast } = useToast()

const avatarError = ref(false)
watch(() => authStore.user?.avatar_url, () => {
  avatarError.value = false
})

const activeTab = ref(route.query.tab || 'orders')

watch(() => route.query.tab, (newTab) => {
  if (newTab) activeTab.value = newTab
})

watch(activeTab, (newTab) => {
  router.push({ query: { ...route.query, tab: newTab } })
})

// Orders state
const orders = ref([])
const loadingOrders = ref(true)
const ordersCurrentPage = ref(1)
const ordersPerPage = ref(5)

const fetchOrders = async () => {
  loadingOrders.value = true
  try {
    const response = await fetch('/api/orders/user', {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    if (response.ok) {
      const result = await response.json()
      orders.value = result.success ? result.data || [] : []
    }
  } catch (error) {
    console.error('Error fetching orders:', error)
  } finally {
    loadingOrders.value = false
  }
}

const paginatedOrders = computed(() => {
  const start = (ordersCurrentPage.value - 1) * ordersPerPage.value
  const end = start + ordersPerPage.value
  return orders.value.slice(start, end)
})

const totalOrderPages = computed(() => {
  return Math.ceil(orders.value.length / ordersPerPage.value) || 1
})

const changeOrderPage = (page) => {
  if (page >= 1 && page <= totalOrderPages.value) {
    ordersCurrentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Security & Password state
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const updatePasswordLoading = ref(false)

const updatePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    showToast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error')
    return
  }
  if (passwordForm.value.new_password.length < 6) {
    showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร', 'error')
    return
  }
  updatePasswordLoading.value = true
  try {
    const response = await fetch('/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authStore.token}`
      },
      body: JSON.stringify({
        currentPassword: passwordForm.value.current_password,
        newPassword: passwordForm.value.new_password
      })
    })

    const data = await response.json()
    if (response.ok) {
      showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย', 'success')
      passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    } else {
      showToast(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error')
    }
  } catch (error) {
    console.error(error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error')
  } finally {
    updatePasswordLoading.value = false
  }
}

const showDeleteConfirmModal = ref(false)
const confirmDeleteText = ref('')
const deleteAccountLoading = ref(false)

const deleteAccount = async () => {
  if (confirmDeleteText.value !== 'DELETE') return
  deleteAccountLoading.value = true
  try {
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })
    
    if (response.ok) {
      showToast('ลบบัญชีสำเร็จเรียบร้อย', 'success')
      showDeleteConfirmModal.value = false
      authStore.logout()
      router.push('/')
    } else {
      showToast('ไม่สามารถลบบัญชีได้ กรุณาติดต่อแอดมิน', 'error')
    }
  } catch (err) {
    console.error(err)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    deleteAccountLoading.value = false
  }
}

const logout = () => {
  authStore.logout()
  showToast('ออกจากระบบสำเร็จ', 'info')
  router.push('/')
}

const isReviewModalOpen = ref(false)
const selectedProductForReview = ref(null)

const openReviewModal = (item) => {
  selectedProductForReview.value = item
  isReviewModalOpen.value = true
}

const handleReviewSubmitted = () => {
  fetchOrders()
  isReviewModalOpen.value = false
}

// Profile & Address Management Logic
const userProfile = ref({ first_name: '', last_name: '', phone: '', email: '' })
const isEditingProfile = ref(false)
const updateProfileLoading = ref(false)

const avatarLoading = ref(false)
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    showToast('ไฟล์รูปต้องมีขนาดไม่เกิน 5MB', 'error')
    return
  }

  const formData = new FormData()
  formData.append('avatar', file)
  
  avatarLoading.value = true
  try {
    const res = await fetch('/api/users/avatar', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authStore.token}` },
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      if (authStore.user) {
        authStore.updateProfile({ avatar_url: data.avatar_url })
      }
      showToast('อัปเดตรูปโปรไฟล์สำเร็จ', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้', 'error')
    }
  } catch (err) {
    console.error('Avatar upload failed:', err)
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  } finally {
    avatarLoading.value = false
    event.target.value = ''
  }
}

const userAddresses = ref([])
const showAddressModal = ref(false)
const addressForm = ref({ type: 'shipping', company_name: '', tax_id: '', branch: '', title: '', first_name: '', last_name: '', address_line: '', subdistrict: '', district: '', province: '', postal_code: '', phone: '', is_default: false })
const saveAddressLoading = ref(false)
const editingAddress = ref(null)
const showShippingSelector = ref(false)

const isValidTaxId = (taxId) => /^\d{13}$/.test(taxId)
const isValidThaiPhone = (phone) => /^0\d{8,9}$/.test(phone)

const getShippingAddresses = computed(() => userAddresses.value.filter(a => a.type === 'shipping'))
const getTaxAddresses = computed(() => userAddresses.value.filter(a => a.type === 'tax'))

const fetchProfile = async () => {
  try {
    const res = await fetch('/api/users/profile', { headers: { 'Authorization': `Bearer ${authStore.token}` }})
    const data = await res.json()
    if (data.success) {
      userProfile.value = { 
        first_name: data.data.first_name || '', 
        last_name: data.data.last_name || '', 
        phone: data.data.phone || '',
        email: data.data.email || ''
      }
      
      authStore.updateProfile({
        first_name: data.data.first_name,
        last_name: data.data.last_name,
        avatar_url: data.data.avatar_url,
        email: data.data.email,
        phone: data.data.phone,
        line_id: data.data.line_id,
        google_id: data.data.google_id
      })
    }
  } catch (e) {}
}

const updateProfile = async () => {
  updateProfileLoading.value = true
  try {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(userProfile.value)
    })
    const data = await res.json()
    if (data.success) {
      showToast(data.message || 'บันทึกข้อมูลส่วนตัวสำเร็จ', 'success')
      isEditingProfile.value = false
      await fetchProfile()
    } else {
      showToast(data.error || 'บันทึกไม่สำเร็จ', 'error')
    }
  } catch (e) {
    console.error('Update profile error:', e)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    updateProfileLoading.value = false
  }
}

const fetchAddresses = async () => {
  try {
    const res = await fetch('/api/users/addresses', { headers: { 'Authorization': `Bearer ${authStore.token}` }})
    const data = await res.json()
    if (data.success) {
      userAddresses.value = data.data || []
    }
  } catch (e) {}
}

const openAddressModal = (type = 'shipping', addr = null) => {
  showAddressModal.value = true
  editingAddress.value = addr
  showShippingSelector.value = false
  if (addr) {
    addressForm.value = { ...addr }
  } else {
    addressForm.value = { 
      type, 
      company_name: '', 
      tax_id: '', 
      branch: '', 
      title: '', 
      first_name: userProfile.value.first_name || '', 
      last_name: userProfile.value.last_name || '', 
      address_line: '', 
      subdistrict: '', 
      district: '', 
      province: '', 
      postal_code: '', 
      phone: userProfile.value.phone || '', 
      is_default: (type === 'shipping' ? getShippingAddresses.value.length === 0 : getTaxAddresses.value.length === 0)
    }
  }
}

const saveAddress = async () => {
  if (addressForm.value.type === 'tax' && addressForm.value.tax_id && !isValidTaxId(addressForm.value.tax_id)) {
    showToast('เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก', 'error')
    return
  }
  if (addressForm.value.phone && !isValidThaiPhone(addressForm.value.phone)) {
    showToast('เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก', 'error')
    return
  }
  
  saveAddressLoading.value = true
  try {
    const method = editingAddress.value ? 'PUT' : 'POST'
    const url = editingAddress.value ? `/api/users/addresses/${editingAddress.value.id}` : '/api/users/addresses'
    
    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm.value)
    })
    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลที่อยู่สำเร็จ', 'success')
      showAddressModal.value = false
      await fetchAddresses()
    } else {
      showToast(data.error || 'ไม่สามารถบันทึกข้อมูลที่อยู่ได้', 'error')
    }
  } catch (e) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    saveAddressLoading.value = false
  }
}

const deleteAddress = async (id) => {
  if (!confirm('คุณต้องการลบข้อมูลที่อยู่นี้ใช่หรือไม่?')) return
  try {
    const res = await fetch(`/api/users/addresses/${id}`, { 
      method: 'DELETE', 
      headers: { 'Authorization': `Bearer ${authStore.token}` } 
    })
    if (res.ok) {
      showToast('ลบข้อมูลที่อยู่เรียบร้อยแล้ว', 'success')
      await fetchAddresses()
    }
  } catch (e) {}
}

const setAddressDefault = async (addr) => {
  try {
    const res = await fetch(`/api/users/addresses/${addr.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addr, is_default: true })
    })
    if (res.ok) {
      showToast('ตั้งเป็นที่อยู่หลักเรียบร้อยแล้ว', 'success')
      await fetchAddresses()
    }
  } catch (e) {}
}

const copyFromShippingAddress = (addr) => {
  addressForm.value = {
    ...addressForm.value,
    first_name: addr.first_name,
    last_name: addr.last_name,
    phone: addr.phone,
    address_line: addr.address_line,
    subdistrict: addr.subdistrict,
    district: addr.district,
    province: addr.province,
    postal_code: addr.postal_code
  }
  showShippingSelector.value = false
  showToast('ดึงข้อมูลจากที่อยู่จัดส่งเรียบร้อยแล้ว', 'info')
}

const copyTracking = (text) => {
  navigator.clipboard.writeText(text)
  showToast('คัดลอกเลขพัสดุแล้ว', 'success')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }
  fetchOrders()
  wishlistStore.fetchWishlist(authStore.user?.id)
  fetchProfile()
  fetchAddresses()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/60 dark:bg-slate-950 pb-20 pt-28 sm:pt-32 md:pt-36">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <router-link to="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          หน้าหลัก
        </router-link>
        <svg class="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        <span class="text-slate-900 dark:text-white font-bold">บัญชีของฉัน</span>
      </nav>

      <!-- Hero Profile Header Card -->
      <div class="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/20 overflow-hidden border border-white/10">
        <!-- Ambient Decorative Glow -->
        <div class="absolute -right-10 -top-10 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-10 -bottom-10 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          
          <!-- Left: User Identity -->
          <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <!-- Avatar with Upload Action -->
            <div 
              class="relative w-24 h-24 rounded-2xl ring-4 ring-white/10 shadow-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-600 shrink-0 group cursor-pointer"
              @click="$refs.avatarInput.click()"
              title="คลิกเพื่อเปลี่ยนรูปโปรไฟล์"
            >
              <img 
                v-if="authStore.user?.avatar_url && !avatarError" 
                :src="authStore.user?.avatar_url" 
                @error="avatarError = true" 
                alt="Profile" 
                class="w-full h-full object-cover" 
              />
              <div v-else class="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                {{ authStore.user?.first_name?.charAt(0) || authStore.user?.username?.charAt(0) || 'U' }}
              </div>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-6 h-6 text-white mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span class="text-[10px] text-white font-medium">เปลี่ยนรูป</span>
              </div>
              
              <!-- Loading Spinner -->
              <div v-if="avatarLoading" class="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                <svg class="animate-spin w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              </div>
            </div>
            <input type="file" ref="avatarInput" accept="image/*" class="hidden" @change="handleAvatarUpload" />

            <!-- User Text Details -->
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 class="text-2xl font-black text-white tracking-tight">
                  {{ authStore.user?.first_name ? `${authStore.user.first_name} ${authStore.user.last_name || ''}` : 'ผู้ใช้งานสมาชิก' }}
                </h1>
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                  <svg class="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  สมาชิกที่ยืนยันแล้ว
                </span>
              </div>
              <p class="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                {{ authStore.user?.email || 'ยังไม่ได้ระบุอีเมล' }}
              </p>
              <p v-if="authStore.user?.phone" class="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                {{ authStore.user.phone }}
              </p>
            </div>
          </div>

          <!-- Right: Summary Stat Capsules -->
          <div class="flex items-center gap-3 w-full md:w-auto justify-center">
            <button 
              type="button" 
              @click="activeTab = 'orders'"
              class="flex-1 md:flex-initial px-4 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl border border-white/15 text-center transition-all group"
            >
              <div class="flex items-center justify-center gap-1.5 text-blue-300 text-xs font-bold mb-0.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                คำสั่งซื้อ
              </div>
              <span class="text-lg font-black text-white">{{ orders.length }}</span>
            </button>

            <button 
              type="button" 
              @click="activeTab = 'wishlist'"
              class="flex-1 md:flex-initial px-4 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl border border-white/15 text-center transition-all group"
            >
              <div class="flex items-center justify-center gap-1.5 text-rose-300 text-xs font-bold mb-0.5">
                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                รายการโปรด
              </div>
              <span class="text-lg font-black text-white">{{ wishlistStore.items.length }}</span>
            </button>

            <button 
              type="button" 
              @click="activeTab = 'addresses'"
              class="flex-1 md:flex-initial px-4 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl border border-white/15 text-center transition-all group"
            >
              <div class="flex items-center justify-center gap-1.5 text-emerald-300 text-xs font-bold mb-0.5">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                สมุดที่อยู่
              </div>
              <span class="text-lg font-black text-white">{{ userAddresses.length }}</span>
            </button>
          </div>

        </div>
      </div>

      <!-- Main Layout: Sidebar & Content -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Left Column: Navigation Menu -->
        <div class="lg:col-span-4 space-y-6">
          <div class="bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-1">
            
            <button 
              type="button"
              @click="activeTab = 'orders'" 
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left"
              :class="activeTab === 'orders' 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <span>ประวัติคำสั่งซื้อ & ติดตามพัสดุ</span>
              </div>
              <span v-if="orders.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                {{ orders.length }}
              </span>
            </button>

            <button 
              type="button"
              @click="activeTab = 'profile'" 
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left"
              :class="activeTab === 'profile' 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="activeTab === 'profile' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </div>
                <span>ข้อมูลส่วนตัว & บัญชี</span>
              </div>
            </button>

            <button 
              type="button"
              @click="activeTab = 'addresses'" 
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left"
              :class="activeTab === 'addresses' 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="activeTab === 'addresses' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <span>สมุดที่อยู่ & ใบกำกับภาษี</span>
              </div>
              <span v-if="userAddresses.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {{ userAddresses.length }}
              </span>
            </button>

            <button 
              type="button"
              @click="activeTab = 'wishlist'" 
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left"
              :class="activeTab === 'wishlist' 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="activeTab === 'wishlist' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                </div>
                <span>รายการโปรด</span>
              </div>
              <span v-if="wishlistStore.items.length > 0" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                {{ wishlistStore.items.length }}
              </span>
            </button>

            <button 
              type="button"
              @click="activeTab = 'security'" 
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-bold transition-all text-left"
              :class="activeTab === 'security' 
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'"
            >
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" :class="activeTab === 'security' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <span>ความปลอดภัย & รหัสผ่าน</span>
              </div>
            </button>

            <div class="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                type="button"
                @click="logout" 
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
              >
                <div class="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                </div>
                <span>ออกจากระบบ</span>
              </button>
            </div>

          </div>

          <!-- Real Customer Support Card -->
          <div class="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 space-y-3">
            <div class="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              <span>ฝ่ายบริการลูกค้า CR Distribution</span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              ต้องการสอบถามข้อมูลสินค้า KODERA ใบเสนอราคา หรือแจ้งปัญหาการใช้งาน
            </p>
            <div class="space-y-1.5 pt-1 text-xs">
              <div v-if="settingsStore.storePhone" class="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                <span>โทร: {{ settingsStore.storePhone }}</span>
              </div>
              <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                <svg class="w-3.5 h-3.5 text-[#06C755]" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                <span>LINE: @crdistribution</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Right Column: Content Area -->
        <div class="lg:col-span-8 min-w-0">
          
          <!-- ============================================ -->
          <!-- TAB 1: ORDERS & TRACKING -->
          <!-- ============================================ -->
          <div v-if="activeTab === 'orders'" class="space-y-6 animate-fade-in-up">
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                    ประวัติการสั่งซื้อและสถานะจัดส่ง
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">ติดตามขั้นตอนการดำเนินงาน คำสั่งซื้อ และเลขพัสดุจัดส่งสินค้า</p>
                </div>
                <router-link to="/products" class="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  สั่งซื้อสินค้าเพิ่ม
                </router-link>
              </div>

              <!-- Loading State -->
              <div v-if="loadingOrders" class="py-16 text-center space-y-3">
                <div class="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-xs font-bold text-slate-500">กำลังดึงข้อมูลคำสั่งซื้อของคุณ...</p>
              </div>

              <!-- Empty State -->
              <div v-else-if="orders.length === 0" class="py-16 text-center space-y-4">
                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">ยังไม่มีประวัติการสั่งซื้อ</h3>
                  <p class="text-xs text-slate-500 max-w-sm mx-auto">คุณยังไม่มีรายการสั่งซื้อใดๆ สามารถเริ่มเลือกชมเครื่องตัดปอกสายไฟและอุปกรณ์ได้ทันที</p>
                </div>
                <router-link to="/products" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  เลือกชมสินค้าแคตตาล็อก
                </router-link>
              </div>

              <!-- Orders List -->
              <div v-else class="space-y-5">
                <router-link 
                  :to="'/order-success/' + order.id" 
                  v-for="order in paginatedOrders" 
                  :key="order.id" 
                  class="block border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-slate-900 group"
                >
                  <!-- Card Header -->
                  <div class="bg-slate-50/80 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-4 text-xs">
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">วันที่ทำรายการ</span>
                        <span class="font-bold text-slate-800 dark:text-slate-200">
                          {{ new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                        </span>
                      </div>
                      <div class="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div>
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ยอดรวมสุทธิ</span>
                        <span class="font-black text-emerald-600 dark:text-emerald-400">
                          ฿{{ Number(order.total_amount).toLocaleString() }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <span class="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        #{{ (order.id || '').split('-')[0].toUpperCase() }}
                      </span>
                    </div>
                  </div>

                  <!-- Item Rows -->
                  <div class="p-6 space-y-3">
                    <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4">
                      <div class="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 relative flex items-center justify-center">
                        <img v-if="item.product_image" :src="item.product_image" :alt="item.product_name" class="w-full h-full object-cover" />
                        <svg v-else class="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{{ item.product_name }}</h4>
                        <p class="text-xs text-slate-500 mt-0.5">จำนวน {{ item.quantity }} ชิ้น</p>
                      </div>
                      <div class="text-right shrink-0">
                        <p class="font-black text-xs sm:text-sm text-slate-900 dark:text-white">฿{{ Number(item.price_at_purchase * item.quantity).toLocaleString() }}</p>
                        <button 
                          v-if="settingsStore.showProductReview && (order.order_status === 'completed' || order.order_status === 'delivered') && !item.is_reviewed" 
                          @click.prevent="openReviewModal(item)" 
                          class="mt-1 px-2.5 py-1 text-[11px] font-bold border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 rounded-lg transition-colors inline-block"
                        >
                          เขียนรีวิวสินค้า
                        </button>
                        <span 
                          v-else-if="settingsStore.showProductReview && (order.order_status === 'completed' || order.order_status === 'delivered') && item.is_reviewed" 
                          class="mt-1 px-2.5 py-1 text-[11px] font-bold border border-slate-200 text-slate-400 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-lg inline-block"
                        >
                          รีวิวแล้ว
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- 5-Step Order Progress Timeline -->
                  <div v-if="order.payment_status !== 'cancelled' && order.order_status !== 'cancelled'" class="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                    <div class="flex items-center justify-between relative py-2">
                      <!-- Background Progress Bar -->
                      <div class="absolute top-1/2 -translate-y-1/2 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-700 rounded-full pointer-events-none"></div>
                      <!-- Active Progress Bar -->
                      <div 
                        class="absolute top-1/2 -translate-y-1/2 left-6 h-1 bg-emerald-500 rounded-full transition-all duration-500 pointer-events-none"
                        :style="{ width: order.order_status === 'completed' || order.order_status === 'delivered' ? 'calc(100% - 48px)' : order.order_status === 'shipped' ? 'calc(75% - 36px)' : order.order_status === 'processing' || order.order_status === 'confirmed' ? 'calc(50% - 24px)' : order.payment_status === 'paid' ? 'calc(25% - 12px)' : '0%' }"
                      ></div>
                      
                      <!-- Step 1: Placed -->
                      <div class="relative z-10 flex flex-col items-center gap-1.5">
                        <div class="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        </div>
                        <span class="text-[10px] font-bold text-slate-700 dark:text-slate-300">สั่งซื้อ</span>
                      </div>

                      <!-- Step 2: Payment -->
                      <div class="relative z-10 flex flex-col items-center gap-1.5">
                        <div 
                          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors"
                          :class="order.payment_status === 'paid' || order.payment_status === 'reviewing' ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'"
                        >
                          <svg v-if="order.payment_status === 'paid'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          <svg v-else-if="order.payment_status === 'reviewing'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          <span v-else>2</span>
                        </div>
                        <span class="text-[10px] font-bold" :class="order.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : order.payment_status === 'reviewing' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'">
                          {{ order.payment_status === 'reviewing' ? 'ตรวจสลิป' : 'ชำระเงิน' }}
                        </span>
                      </div>

                      <!-- Step 3: Processing -->
                      <div class="relative z-10 flex flex-col items-center gap-1.5">
                        <div 
                          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors"
                          :class="['processing','confirmed','shipped','delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'"
                        >
                          <svg v-if="['shipped','delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          <svg v-else-if="['processing','confirmed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                          <span v-else>3</span>
                        </div>
                        <span class="text-[10px] font-bold" :class="['processing','confirmed','shipped','delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                          จัดเตรียม
                        </span>
                      </div>

                      <!-- Step 4: Shipped -->
                      <div class="relative z-10 flex flex-col items-center gap-1.5">
                        <div 
                          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors"
                          :class="['shipped','delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'"
                        >
                          <svg v-if="['delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          <svg v-else-if="order.order_status === 'shipped'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"/></svg>
                          <span v-else>4</span>
                        </div>
                        <span class="text-[10px] font-bold" :class="['shipped','delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                          จัดส่งแล้ว
                        </span>
                      </div>

                      <!-- Step 5: Completed -->
                      <div class="relative z-10 flex flex-col items-center gap-1.5">
                        <div 
                          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-colors"
                          :class="['delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'"
                        >
                          <svg v-if="['delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          <span v-else>5</span>
                        </div>
                        <span class="text-[10px] font-bold" :class="['delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                          สำเร็จ
                        </span>
                      </div>
                    </div>

                    <!-- Tracking Number Card -->
                    <div v-if="order.tracking_number" class="mt-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                      <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        </div>
                        <div>
                          <p class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            เลขติดตามพัสดุ {{ order.shipping_provider ? `(${order.shipping_provider})` : '' }}
                          </p>
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-black font-mono text-slate-900 dark:text-white">{{ order.tracking_number }}</span>
                            <button 
                              type="button" 
                              @click.prevent.stop="copyTracking(order.tracking_number)" 
                              class="text-slate-400 hover:text-blue-600 transition-colors"
                              title="คัดลอกเลขพัสดุ"
                            >
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <a 
                        v-if="order.shipping_provider" 
                        :href="getTrackingUrl(order.shipping_provider, order.tracking_number)" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        @click.stop 
                        class="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        ติดตามพัสดุ
                      </a>
                    </div>
                  </div>

                  <!-- Cancelled Notice -->
                  <div v-if="order.payment_status === 'cancelled' || order.order_status === 'cancelled'" class="px-6 py-3 bg-rose-50 dark:bg-rose-950/20 border-t border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                  </div>

                  <!-- Card Footer Action -->
                  <div class="px-6 py-3 bg-slate-50/40 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span class="text-slate-500 font-medium">
                      {{ order.items ? `${order.items.length} รายการ` : '' }}
                    </span>
                    <span class="font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      ดูรายละเอียดคำสั่งซื้อ
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </router-link>

                <!-- Pagination -->
                <div v-if="totalOrderPages > 1" class="pt-4 flex justify-center">
                  <div class="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
                    <button 
                      type="button" 
                      @click="changeOrderPage(ordersCurrentPage - 1)" 
                      :disabled="ordersCurrentPage === 1" 
                      class="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300 px-3">
                      หน้า {{ ordersCurrentPage }} / {{ totalOrderPages }}
                    </span>
                    <button 
                      type="button" 
                      @click="changeOrderPage(ordersCurrentPage + 1)" 
                      :disabled="ordersCurrentPage === totalOrderPages" 
                      class="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ============================================ -->
          <!-- TAB 2: PERSONAL INFO -->
          <!-- ============================================ -->
          <div v-else-if="activeTab === 'profile'" class="space-y-6 animate-fade-in-up">
            
            <!-- Warning Banner for LINE users without email -->
            <div v-if="!authStore.user?.email && authStore.user?.line_id" class="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-3xl flex items-start gap-4">
              <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div class="space-y-1">
                <h4 class="text-xs font-bold text-amber-900 dark:text-amber-300">โปรดระบุอีเมลในระบบของคุณ</h4>
                <p class="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  เนื่องจากคุณเข้าสู่ระบบผ่านบัญชี LINE กรุณาระบุอีเมลเพื่อรับเอกสารใบเสนอราคา ใบเสร็จรับเงิน และแจ้งเตือนสถานะคำสั่งซื้ออัตโนมัติ
                </p>
              </div>
            </div>

            <!-- Profile Info Form Card -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    ข้อมูลส่วนตัวและผู้ติดต่อ
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">จัดการชื่อ เบอร์โทรศัพท์ติดต่อ และข้อมูลบัญชีของคุณ</p>
                </div>
                <button 
                  v-if="!isEditingProfile" 
                  type="button" 
                  @click="isEditingProfile = true" 
                  class="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  แก้ไขข้อมูล
                </button>
              </div>

              <form @submit.prevent="updateProfile" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      ชื่อ <span class="text-rose-500">*</span>
                    </label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      </div>
                      <input 
                        v-model="userProfile.first_name" 
                        type="text" 
                        required 
                        :disabled="!isEditingProfile" 
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:text-slate-500"
                        placeholder="ชื่อ"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">นามสกุล</label>
                    <input 
                      v-model="userProfile.last_name" 
                      type="text" 
                      :disabled="!isEditingProfile" 
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:text-slate-500"
                      placeholder="นามสกุล"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">เบอร์โทรศัพท์ติดต่อ</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </div>
                      <input 
                        v-model="userProfile.phone" 
                        type="tel" 
                        :disabled="!isEditingProfile" 
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white disabled:bg-slate-100 disabled:dark:bg-slate-900 disabled:text-slate-500"
                        placeholder="08XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div class="md:col-span-2">
                    <div class="flex items-center justify-between mb-1.5">
                      <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">อีเมลประจำบัญชี</label>
                      <span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        อีเมลล็อกอินหลัก
                      </span>
                    </div>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                      </div>
                      <input 
                        :value="authStore.user?.email || 'ยังไม่ได้ระบุอีเมล'" 
                        type="email" 
                        disabled 
                        class="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <!-- Action Buttons when editing -->
                <div v-if="isEditingProfile" class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="submit" 
                    :disabled="updateProfileLoading" 
                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg v-if="updateProfileLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    <span>{{ updateProfileLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว' }}</span>
                  </button>
                  <button 
                    type="button" 
                    @click="isEditingProfile = false; fetchProfile()" 
                    class="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>

            <!-- Linked Social Accounts Card -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 class="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                สถานะการเชื่อมต่อบัญชีเข้าสู่ระบบ
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- LINE Linked Status -->
                <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-[#06C755] text-white flex items-center justify-center shrink-0 shadow-sm">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61V9.86h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.205 0 .391.09.51.253l2.444 3.317V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">LINE Account</h4>
                      <p class="text-[11px] text-slate-400">
                        {{ authStore.user?.line_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ' }}
                      </p>
                    </div>
                  </div>
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="authStore.user?.line_id ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                  >
                    {{ authStore.user?.line_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ' }}
                  </span>
                </div>

                <!-- Google Linked Status -->
                <div class="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-sm">
                      <svg class="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                    <div>
                      <h4 class="text-xs font-bold text-slate-800 dark:text-slate-200">Google Account</h4>
                      <p class="text-[11px] text-slate-400">
                        {{ authStore.user?.google_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ' }}
                      </p>
                    </div>
                  </div>
                  <span 
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    :class="authStore.user?.google_id ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                  >
                    {{ authStore.user?.google_id ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ' }}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <!-- ============================================ -->
          <!-- TAB 3: ADDRESSES & TAX -->
          <!-- ============================================ -->
          <div v-else-if="activeTab === 'addresses'" class="space-y-6 animate-fade-in-up">
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              
              <div class="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    สมุดที่อยู่จัดส่งและใบกำกับภาษี
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">จัดการที่อยู่เพื่อใช้ในการสั่งซื้อและการออกเอกสารทางการค้า</p>
                </div>
                
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    @click="openAddressModal('shipping')" 
                    class="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    เพิ่มที่อยู่จัดส่ง
                  </button>
                  <button 
                    type="button" 
                    @click="openAddressModal('tax')" 
                    class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    เพิ่มใบกำกับภาษี
                  </button>
                </div>
              </div>

              <!-- Shipping Addresses Section -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                    ที่อยู่สำหรับจัดส่งสินค้า ({{ getShippingAddresses.length }})
                  </h3>
                </div>

                <div v-if="getShippingAddresses.length === 0" class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <svg class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                  <p class="text-xs text-slate-500 font-medium">ยังไม่มีข้อมูลที่อยู่สำหรับจัดส่ง</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    v-for="addr in getShippingAddresses" 
                    :key="addr.id" 
                    class="p-5 rounded-2xl border transition-all flex flex-col justify-between relative bg-white dark:bg-slate-800/60"
                    :class="addr.is_default ? 'border-blue-500 dark:border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-black text-slate-900 dark:text-white">
                            {{ addr.first_name }} {{ addr.last_name }}
                          </span>
                          <span v-if="addr.title" class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {{ addr.title }}
                          </span>
                        </div>
                        <span v-if="addr.is_default" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          ค่าเริ่มต้น
                        </span>
                      </div>

                      <p class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        {{ addr.phone }}
                      </p>

                      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {{ addr.address_line }} {{ addr.subdistrict ? `ต. ${addr.subdistrict}` : '' }} {{ addr.district ? `อ. ${addr.district}` : '' }} {{ addr.province ? `จ. ${addr.province}` : '' }} {{ addr.postal_code }}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <div class="flex items-center gap-3">
                        <button type="button" @click="openAddressModal('shipping', addr)" class="font-bold text-blue-600 dark:text-blue-400 hover:underline">
                          แก้ไข
                        </button>
                        <button type="button" @click="deleteAddress(addr.id)" class="font-bold text-rose-500 hover:underline">
                          ลบ
                        </button>
                      </div>
                      <button 
                        v-if="!addr.is_default" 
                        type="button" 
                        @click="setAddressDefault(addr)" 
                        class="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        ตั้งเป็นค่าเริ่มต้น
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tax Invoices Section -->
              <div class="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  ข้อมูลสำหรับการออกใบกำกับภาษี ({{ getTaxAddresses.length }})
                </h3>

                <div v-if="getTaxAddresses.length === 0" class="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                  <svg class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <p class="text-xs text-slate-500 font-medium">ยังไม่มีข้อมูลออกใบกำกับภาษี</p>
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    v-for="addr in getTaxAddresses" 
                    :key="addr.id" 
                    class="p-5 rounded-2xl border transition-all flex flex-col justify-between relative bg-white dark:bg-slate-800/60"
                    :class="addr.is_default ? 'border-indigo-500 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'"
                  >
                    <div class="space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-black text-slate-900 dark:text-white">
                          {{ addr.company_name || `${addr.first_name} ${addr.last_name}` }}
                        </span>
                        <span v-if="addr.is_default" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                          ค่าเริ่มต้น
                        </span>
                      </div>

                      <p class="text-xs text-slate-500 dark:text-slate-400">
                        เลขผู้เสียภาษี: <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ addr.tax_id || '-' }}</span>
                        <span class="ml-2 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {{ addr.branch || 'สำนักงานใหญ่' }}
                        </span>
                      </p>

                      <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                        {{ addr.address_line }} {{ addr.subdistrict ? `ต. ${addr.subdistrict}` : '' }} {{ addr.district ? `อ. ${addr.district}` : '' }} {{ addr.province ? `จ. ${addr.province}` : '' }} {{ addr.postal_code }}
                      </p>
                    </div>

                    <div class="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 text-xs">
                      <div class="flex items-center gap-3">
                        <button type="button" @click="openAddressModal('tax', addr)" class="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                          แก้ไข
                        </button>
                        <button type="button" @click="deleteAddress(addr.id)" class="font-bold text-rose-500 hover:underline">
                          ลบ
                        </button>
                      </div>
                      <button 
                        v-if="!addr.is_default" 
                        type="button" 
                        @click="setAddressDefault(addr)" 
                        class="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        ตั้งเป็นค่าเริ่มต้น
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- ============================================ -->
          <!-- TAB 4: WISHLIST -->
          <!-- ============================================ -->
          <div v-else-if="activeTab === 'wishlist'" class="space-y-6 animate-fade-in-up">
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <svg class="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                    รายการสินค้าที่สนใจ (Wishlist)
                  </h2>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">สินค้าที่คุณบันทึกไว้เพื่อสั่งซื้อหรือขอใบเสนอราคาในภายหลัง</p>
                </div>
                <router-link to="/products" class="px-4 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-sm">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  ดูสินค้าเพิ่มเติม
                </router-link>
              </div>

              <!-- Empty Wishlist -->
              <div v-if="wishlistStore.items.length === 0" class="py-16 text-center space-y-4">
                <div class="w-16 h-16 bg-rose-50 dark:bg-rose-950/30 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                </div>
                <div class="space-y-1">
                  <h3 class="text-base font-bold text-slate-900 dark:text-white">ยังไม่มีสินค้าในรายการโปรด</h3>
                  <p class="text-xs text-slate-500 max-w-sm mx-auto">กดไอคอนรูปหัวใจบนหน้าสินค้าเพื่อบันทึกรายการที่คุณสนใจ</p>
                </div>
                <router-link to="/products" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  เลือกชมสินค้าแคตตาล็อก
                </router-link>
              </div>

              <!-- Wishlist Grid -->
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <ProductCard 
                  v-for="item in wishlistStore.items" 
                  :key="item.id"
                  :product="item"
                />
              </div>
            </div>
          </div>

          <!-- ============================================ -->
          <!-- TAB 5: SECURITY & PASSWORD -->
          <!-- ============================================ -->
          <div v-else-if="activeTab === 'security'" class="space-y-6 animate-fade-in-up">
            
            <!-- Change Password Card -->
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-6">
              <div class="border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  เปลี่ยนรหัสผ่าน (Change Password)
                </h2>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">ตั้งรหัสผ่านใหม่เพื่อยกระดับความปลอดภัยในการเข้าใช้งาน</p>
              </div>

              <form @submit.prevent="updatePassword" class="space-y-4 max-w-lg">
                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสผ่านปัจจุบัน <span class="text-slate-400 font-normal">(กรณีเคยตั้งไว้)</span>
                  </label>
                  <div class="relative">
                    <input 
                      :type="showCurrentPassword ? 'text' : 'password'" 
                      v-model="passwordForm.current_password" 
                      class="w-full px-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white" 
                      placeholder="ระบุรหัสผ่านปัจจุบัน"
                    />
                    <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    รหัสผ่านใหม่ <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <input 
                      :type="showNewPassword ? 'text' : 'password'" 
                      v-model="passwordForm.new_password" 
                      required 
                      minlength="6" 
                      class="w-full px-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white" 
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                    />
                    <button type="button" @click="showNewPassword = !showNewPassword" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ยืนยันรหัสผ่านใหม่ <span class="text-rose-500">*</span>
                  </label>
                  <div class="relative">
                    <input 
                      :type="showConfirmPassword ? 'text' : 'password'" 
                      v-model="passwordForm.confirm_password" 
                      required 
                      minlength="6" 
                      class="w-full px-4 pr-11 py-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white" 
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    />
                    <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    </button>
                  </div>
                </div>

                <div class="pt-2">
                  <button 
                    type="submit" 
                    :disabled="updatePasswordLoading" 
                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <svg v-if="updatePasswordLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    <span>{{ updatePasswordLoading ? 'กำลังบันทึก...' : 'อัปเดตรหัสผ่านใหม่' }}</span>
                  </button>
                </div>
              </form>
            </div>

            <!-- PDPA & Delete Account Card -->
            <div class="bg-rose-50/50 dark:bg-rose-950/20 rounded-3xl p-6 sm:p-8 border border-rose-200/80 dark:border-rose-900/40 space-y-4">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <div class="space-y-1 flex-1">
                  <h3 class="text-base font-black text-rose-900 dark:text-rose-300">ลบบัญชีผู้ใช้งานถาวร (Delete Account)</h3>
                  <p class="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                    การลบบัญชีจะส่งผลให้ข้อมูลส่วนตัว รายการสั่งซื้อ และที่อยู่ทั้งหมดถูกลบออกจากฐานข้อมูลอย่างถาวรตามมาตรฐาน PDPA และไม่สามารถกู้คืนได้
                  </p>
                </div>
              </div>

              <div class="pt-2">
                <button 
                  type="button" 
                  @click="showDeleteConfirmModal = true; confirmDeleteText = ''" 
                  class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all"
                >
                  ลบบัญชีผู้ใช้งานถาวร
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- ADDRESS MODAL (SHIPPING & TAX) -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showAddressModal" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity" @click="showAddressModal = false"></div>
        
        <!-- Modal Content -->
        <div class="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800 animate-fade-in-up">
          
          <!-- Header -->
          <div class="flex justify-between items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
            <div>
              <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {{ editingAddress ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล' }}{{ addressForm.type === 'tax' ? 'ใบกำกับภาษี' : 'ที่อยู่จัดส่ง' }}
              </h3>
              <p class="text-[11px] text-slate-500">กรอกข้อมูลให้ครบถ้วนเพื่อความถูกต้องในการจัดส่งและออกเอกสาร</p>
            </div>
            
            <button type="button" @click="showAddressModal = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto space-y-4 flex-1" style="scrollbar-width: thin;">
            
            <!-- Type Switcher -->
            <div class="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button 
                type="button" 
                @click="addressForm.type = 'shipping'"
                class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                :class="addressForm.type === 'shipping' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
                ที่อยู่จัดส่งสินค้า
              </button>
              <button 
                type="button" 
                @click="addressForm.type = 'tax'"
                class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                :class="addressForm.type === 'tax' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                ข้อมูลออกใบกำกับภาษี
              </button>
            </div>

            <!-- Tax Helper: Copy from Shipping -->
            <div v-if="addressForm.type === 'tax' && getShippingAddresses.length > 0" class="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
              <span class="text-xs text-indigo-900 dark:text-indigo-300 font-medium">ดึงข้อมูลที่อยู่จากรายการจัดส่งที่มีอยู่</span>
              <div class="relative">
                <button 
                  type="button" 
                  @click="showShippingSelector = !showShippingSelector" 
                  class="px-3 py-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors flex items-center gap-1 shadow-sm"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  เลือกที่อยู่
                </button>
                <div v-if="showShippingSelector" class="absolute right-0 top-full mt-1.5 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-20">
                  <div class="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    <button 
                      v-for="addr in getShippingAddresses" 
                      :key="addr.id" 
                      type="button" 
                      @click="copyFromShippingAddress(addr)" 
                      class="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex flex-col gap-0.5"
                    >
                      <span class="font-bold text-xs text-slate-800 dark:text-white">{{ addr.first_name }} {{ addr.last_name }}</span>
                      <span class="text-[10px] text-slate-400 truncate">{{ addr.address_line }} {{ addr.province }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Fields Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <!-- Tax Specific Fields -->
              <template v-if="addressForm.type === 'tax'">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อบริษัท / นิติบุคคล / บุคคลธรรมดา <span class="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    v-model="addressForm.company_name" 
                    required 
                    placeholder="เช่น บริษัท ตัวอย่าง จำกัด หรือ นาย สมชาย ใจดี" 
                    class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    เลขประจำตัวผู้เสียภาษี (13 หลัก) <span class="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    v-model="addressForm.tax_id" 
                    maxlength="13" 
                    required 
                    placeholder="เลข 13 หลัก" 
                    class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all dark:text-white font-mono"
                    :class="addressForm.tax_id && !isValidTaxId(addressForm.tax_id) ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'"
                  />
                  <p v-if="addressForm.tax_id && !isValidTaxId(addressForm.tax_id)" class="text-[10px] text-rose-500 mt-0.5">ต้องเป็นตัวเลข 13 หลัก</p>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    สาขา
                  </label>
                  <input 
                    type="text" 
                    v-model="addressForm.branch" 
                    placeholder="เช่น สำนักงานใหญ่ หรือ สาขาที่ 00001" 
                    class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all dark:text-white"
                  />
                </div>
              </template>

              <!-- Shipping Specific: Tag/Title -->
              <div v-if="addressForm.type === 'shipping'" class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ป้ายกำกับที่อยู่ (เช่น บ้าน, สำนักงานใหญ่, โรงงาน)
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.title" 
                  placeholder="เช่น โรงงานสาขาบางนา" 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>

              <!-- Recipient Name -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ชื่อผู้รับ / ผู้ติดต่อ <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.first_name" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  นามสกุล <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.last_name" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>

              <!-- Phone -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เบอร์โทรศัพท์ <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="tel" 
                  v-model="addressForm.phone" 
                  required 
                  placeholder="08XXXXXXXX" 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-mono"
                  :class="addressForm.phone && !isValidThaiPhone(addressForm.phone) ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'"
                />
                <p v-if="addressForm.phone && !isValidThaiPhone(addressForm.phone)" class="text-[10px] text-rose-500 mt-0.5">เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 (9-10 หลัก)</p>
              </div>

              <!-- Address Line -->
              <div class="sm:col-span-2">
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  เลขที่, อาคาร, ซอย, ถนน <span class="text-rose-500">*</span>
                </label>
                <textarea 
                  v-model="addressForm.address_line" 
                  rows="2" 
                  required 
                  placeholder="เช่น 99/9 หมู่ 4 ถนนสุขุมวิท" 
                  class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                ></textarea>
              </div>

              <!-- Province & District -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  จังหวัด <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.province" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  อำเภอ / เขต <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.district" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>

              <!-- Subdistrict & Postal Code -->
              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ตำบล / แขวง <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.subdistrict" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  รหัสไปรษณีย์ <span class="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  v-model="addressForm.postal_code" 
                  required 
                  class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all dark:text-white font-mono"
                />
              </div>

              <!-- Default Checkbox -->
              <div class="sm:col-span-2 flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="is_default_checkbox" 
                  v-model="addressForm.is_default" 
                  class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label for="is_default_checkbox" class="text-xs font-bold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  ตั้งเป็นที่อยู่หลักสำหรับการสั่งซื้อ (Default)
                </label>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-2.5 shrink-0">
            <button 
              type="button" 
              @click="showAddressModal = false" 
              class="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="button" 
              @click="saveAddress" 
              :disabled="saveAddressLoading" 
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <svg v-if="saveAddressLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              <span>{{ saveAddressLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}</span>
            </button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ============================================ -->
    <!-- DELETE ACCOUNT CONFIRMATION MODAL -->
    <!-- ============================================ -->
    <Teleport to="body">
      <div v-if="showDeleteConfirmModal" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-950/75 backdrop-blur-md" @click="showDeleteConfirmModal = false"></div>
        <div class="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 text-center border border-rose-100 dark:border-rose-900/30 animate-fade-in-up">
          <div class="w-14 h-14 bg-rose-100 dark:bg-rose-950/50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1">ยืนยันการลบบัญชีผู้ใช้งาน</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
            ข้อมูลส่วนตัว ประวัติคำสั่งซื้อ และที่อยู่ทั้งหมดของคุณจะถูกลบออกจากระบบอย่างถาวรตามนโยบายความเป็นส่วนตัว PDPA และไม่สามารถกู้คืนได้
          </p>
          
          <div class="mb-5 text-left">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              พิมพ์คำว่า <span class="text-rose-600 font-mono">DELETE</span> เพื่อยืนยัน
            </label>
            <input 
              type="text" 
              v-model="confirmDeleteText" 
              placeholder="DELETE" 
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-rose-600 focus:border-rose-600 outline-none uppercase"
            />
          </div>

          <div class="flex gap-2.5">
            <button 
              type="button"
              @click="showDeleteConfirmModal = false" 
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              type="button"
              @click="deleteAccount" 
              :disabled="confirmDeleteText !== 'DELETE' || deleteAccountLoading" 
              class="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 transition-colors shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5"
            >
              <svg v-if="deleteAccountLoading" class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              <span>ยืนยันการลบ</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Review Modal -->
    <ReviewModal
      v-if="selectedProductForReview"
      :isOpen="isReviewModalOpen"
      :product="selectedProductForReview"
      @close="isReviewModalOpen = false"
      @review-submitted="handleReviewSubmitted"
    />
  </div>
</template>
