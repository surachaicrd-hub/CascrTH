<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import ReviewModal from '../components/ReviewModal.vue'
import { getTrackingUrl } from '../utils/trackingUrls'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()

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
const updatePasswordLoading = ref(false)

const updatePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    alert("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน")
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
      alert("เปลี่ยนรหัสผ่านสำเร็จ")
      passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    } else {
      alert(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
    }
  } catch (error) {
    console.error(error)
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
  } finally {
    updatePasswordLoading.value = false
  }
}

const showDeleteConfirmModal = ref(false)
const confirmDeleteText = ref('')
const deleteAccountLoading = ref(false)

const confirmDeleteAccount = () => {
  showDeleteConfirmModal.value = true
  confirmDeleteText.value = ''
}

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
      alert("ลบบัญชีสำเร็จ")
      showDeleteConfirmModal.value = false
      authStore.logout()
      router.push('/')
    } else {
      alert("ไม่สามารถลบบัญชีได้")
    }
  } catch (err) {
    console.error(err)
    alert("เกิดข้อผิดพลาด")
  } finally {
    deleteAccountLoading.value = false
  }
}

const logout = () => {
  authStore.logout()
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

const removeFromWishlist = (item) => {
  wishlistStore.toggleWishlist(item, authStore.user?.id)
}

// ==== Restored Profile & Address Management Logic ====
const userProfile = ref({ first_name: '', last_name: '', phone: '', email: '' })
const isEditingProfile = ref(false)
const updateProfileLoading = ref(false)

const avatarLoading = ref(false)
const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.size > 5 * 1024 * 1024) {
    alert('ไฟล์รูปต้องมีขนาดไม่เกิน 5MB')
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
      if(authStore.user) {
          authStore.updateProfile({ avatar_url: data.avatar_url })
      }
    } else {
      alert(data.error || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้')
    }
  } catch (err) {
    console.error('Avatar upload failed:', err)
    alert('เกิดข้อผิดพลาดในการอัปโหลด')
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
const addressSuggestions = ref([])
const activeAddressField = ref('')

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
        first_name: data.data.first_name, 
        last_name: data.data.last_name, 
        phone: data.data.phone || '',
        email: data.data.email || ''
      }
      
      // Sync localStore with truth if desynced
      authStore.updateProfile({
        first_name: data.data.first_name,
        last_name: data.data.last_name,
        avatar_url: data.data.avatar_url,
        email: data.data.email,
        line_id: data.data.line_id,
        google_id: data.data.google_id
      })
    }
  } catch(e) {}
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
      alert(data.message || 'บันทึกข้อมูลส่วนตัวสำเร็จ')
      isEditingProfile.value = false
      await fetchProfile() // Refetch profile to update token and lock the email field
    } else {
      alert(data.error || 'บันทึกไม่สำเร็จ')
    }
  } catch(e) {
    console.error('Update profile error:', e)
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
  } finally { updateProfileLoading.value = false }
}

const fetchAddresses = async () => {
    try {
        const res = await fetch('/api/users/addresses', { headers: { 'Authorization': `Bearer ${authStore.token}` }})
        const data = await res.json()
        if (data.success) {
            userAddresses.value = data.data
        }
    } catch(e) {}
}

const openAddressModal = (type = 'shipping', addr = null) => {
    showAddressModal.value = true
    editingAddress.value = addr
    showShippingSelector.value = false
    if (addr) {
        addressForm.value = { ...addr }
    } else {
        addressForm.value = { type, company_name: '', tax_id: '', branch: '', title: '', first_name: '', last_name: '', address_line: '', subdistrict: '', district: '', province: '', postal_code: '', phone: '', is_default: false }
    }
}

const saveAddress = async () => {
    if (addressForm.value.type === 'tax' && addressForm.value.tax_id && !isValidTaxId(addressForm.value.tax_id)) return alert('เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง')
    if (addressForm.value.phone && !isValidThaiPhone(addressForm.value.phone)) return alert('เบอร์โทรศัพท์ไม่ถูกต้อง')
    
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
            showAddressModal.value = false
            fetchAddresses()
        } else alert(data.error)
    } catch(e) {} finally { saveAddressLoading.value = false }
}

const deleteAddress = async (id) => {
    if(!confirm('ยืนยันการลบที่อยู่นี้?')) return
    try {
        const res = await fetch(`/api/users/addresses/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authStore.token}` } })
        if (res.ok) fetchAddresses()
    } catch(e) {}
}

const setAddressDefault = async (addr) => {
    try {
        await fetch(`/api/users/addresses/${addr.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authStore.token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...addr, is_default: true })
        })
        fetchAddresses()
    } catch(e) {}
}

const handleAddressInput = (field, value) => {}
const handleAddressBlur = () => { setTimeout(() => activeAddressField.value = '', 200) }
const selectAddress = (addr) => {}

const copyFromShippingAddress = (addr) => {
    addressForm.value = {
        ...addressForm.value,
        first_name: addr.first_name, last_name: addr.last_name,
        phone: addr.phone, address_line: addr.address_line,
        subdistrict: addr.subdistrict, district: addr.district,
        province: addr.province, postal_code: addr.postal_code
    }
    showShippingSelector.value = false
}
// ===============================================================

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  fetchOrders()
  wishlistStore.fetchWishlist(authStore.user?.id)
  fetchProfile()
  fetchAddresses()
})
</script>

<template>
  <div class="px-4 py-8 w-full max-w-7xl mx-auto mt-16 md:mt-24">
    <div class="flex flex-col lg:flex-row gap-8 w-full">
      
      <!-- Sidebar Navigation -->
      <div class="w-full lg:w-72 shrink-0 space-y-6">
        <div class="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
          <div class="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 relative z-10 shadow-lg shadow-emerald-500/30 overflow-hidden bg-gradient-to-tr from-emerald-500 to-emerald-400 group cursor-pointer" @click="$refs.avatarInput.click()">
            <img v-if="authStore.user?.avatar_url && !avatarError" :src="authStore.user?.avatar_url" @error="avatarError = true" alt="Profile" class="w-full h-full object-cover" />
            <div v-else class="text-white text-4xl font-black">
              {{ authStore.user?.first_name?.charAt(0) || authStore.user?.username?.charAt(0) || 'U' }}
            </div>
            
            <div class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg class="w-8 h-8 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            
             <div v-if="avatarLoading" class="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center">
                 <svg class="animate-spin w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
             </div>
          </div>
          <input type="file" ref="avatarInput" accept="image/*" class="hidden" @change="handleAvatarUpload" />
          <h2 class="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
            {{ authStore.user?.first_name }} {{ authStore.user?.last_name || '' }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 truncate">{{ authStore.user?.email }}</p>
        </div>

        <div class="bg-white dark:bg-[#111827] rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
          <button @click="activeTab = 'profile'" :class="activeTab === 'profile' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left uppercase text-sm tracking-wider">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            ข้อมูลส่วนตัว
          </button>
          
          <button @click="activeTab = 'addresses'" :class="activeTab === 'addresses' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left uppercase text-sm tracking-wider">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            ที่อยู่จัดส่ง
          </button>

          <button @click="activeTab = 'orders'" :class="activeTab === 'orders' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left uppercase text-sm tracking-wider">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            ประวัติสั่งซื้อ
          </button>
          
          <button @click="activeTab = 'wishlist'" :class="activeTab === 'wishlist' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left uppercase text-sm tracking-wider">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            รายการโปรด
          </button>

          <button @click="activeTab = 'security'" :class="activeTab === 'security' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left uppercase text-sm tracking-wider">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            ความปลอดภัย
          </button>

          <button @click="logout" class="flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-colors text-left text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 uppercase text-sm tracking-wider font-bold mt-4 border-t border-gray-100 dark:border-gray-800 pt-5">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            ออกจากระบบ
          </button>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 min-w-0 lg:w-[calc(100%-20rem)] w-full block">
        
        <!-- ============ PROFILE TAB ============ -->
        <div v-if="activeTab === 'profile'" class="space-y-6">
          
          <!-- Warning Banner for LINE users without email -->
          <div v-if="!authStore.user?.email && authStore.user?.line_id" class="p-5 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
            <div class="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <svg class="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div class="flex-1 relative z-10">
              <h4 class="font-bold text-amber-950 dark:text-amber-400 text-base mb-1 flex items-center gap-2">
                <span>โปรดระบุอีเมลในระบบของคุณ</span>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 animate-pulse">สำคัญ</span>
              </h4>
              <p class="text-sm text-amber-800 dark:text-amber-300/80 leading-relaxed">เนื่องจากคุณสมัครสมาชิกผ่านบัญชี LINE และยังไม่ได้ระบุอีเมลในระบบ โปรดกรอกอีเมลเพื่อเปิดใช้งานฟังก์ชันรับใบเสนอราคา ข้อมูลข่าวสาร และลิงก์ยืนยันตัวตนเพื่อรักษาสิทธิประโยชน์และความปลอดภัยสูงสุดของบัญชีคุณ</p>
            </div>
          </div>

          <div class="bg-white dark:bg-[#111827] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
             <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800 gap-4">
               <div>
                   <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">ข้อมูลส่วนตัว</h2>
                   <p class="text-sm text-gray-500 dark:text-gray-400">จัดการข้อมูลส่วนบุคคลและการตั้งค่าโปรไฟล์ของคุณ</p>
               </div>
               <button v-if="!isEditingProfile" @click="isEditingProfile = true" class="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                 แก้ไขข้อมูล
               </button>
             </div>
             <form @submit.prevent="updateProfile" class="w-full space-y-6">
               <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ชื่อ</label>
                   <input v-model="userProfile.first_name" type="text" :disabled="!isEditingProfile" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2937] disabled:bg-gray-100 disabled:dark:bg-[#111827] disabled:text-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none" required />
                 </div>
                 <div>
                   <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">นามสกุล</label>
                   <input v-model="userProfile.last_name" type="text" :disabled="!isEditingProfile" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2937] disabled:bg-gray-100 disabled:dark:bg-[#111827] disabled:text-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none" required />
                 </div>
                 <div class="md:col-span-2">
                   <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">เบอร์โทรศัพท์</label>
                   <input v-model="userProfile.phone" type="tel" :disabled="!isEditingProfile" class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1f2937] disabled:bg-gray-100 disabled:dark:bg-[#111827] disabled:text-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none" placeholder="08xxxxxxxx" />
                 </div>
                 <div class="md:col-span-2">
                   <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">อีเมล <span class="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">ไม่สามารถแก้ไขได้</span></label>
                   <input :value="authStore.user?.email" type="email" disabled class="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#111827] opacity-60 text-gray-500 dark:text-gray-400 outline-none cursor-not-allowed" />
                 </div>
               </div>
               
               <div v-if="isEditingProfile" class="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
                 <button type="submit" :disabled="updateProfileLoading" class="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center min-w-[140px]">
                   <span v-if="updateProfileLoading" class="flex items-center gap-2">
                     <svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     กำลังบันทึก...
                   </span>
                   <span v-else>บันทึกข้อมูล</span>
                 </button>
                 <button type="button" @click="isEditingProfile = false; fetchProfile()" class="px-6 py-2.5 bg-white dark:bg-[#1f2937] text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#374151] transition-colors">
                   ยกเลิก
                 </button>
               </div>
             </form>
          </div>
        </div>

        <!-- ============ ADDRESSES TAB ============ -->
        <div v-else-if="activeTab === 'addresses'" class="space-y-6">
          <div class="bg-white dark:bg-[#111827] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
             <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-gray-800 gap-4">
               <div>
                   <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">สมุดที่อยู่</h2>
                   <p class="text-sm text-gray-500 dark:text-gray-400">จัดการข้อมูลที่อยู่สำหรับการจัดส่งและการออกใบกำกับภาษี</p>
               </div>
               <button @click="openAddressModal('shipping')" class="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                 เพิ่มที่อยู่ใหม่
               </button>
             </div>
             
             <!-- Separated Layout -->
             <div v-if="userAddresses.length === 0" class="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">ยังไม่มีที่อยู่ในสมุดบันทึก</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">เพิ่มที่อยู่จัดส่งของคุณ เพื่อความสะดวกรวดเร็วในการสั่งซื้อครั้งต่อไป</p>
                <button @click="openAddressModal('shipping')" class="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-colors">เพิ่มที่อยู่แรกของคุณ</button>
             </div>
             
             <div v-else class="space-y-8">
                <!-- Shipping addresses block -->
                <div v-if="getShippingAddresses.length > 0">
                    <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800 w-full">
                         <span>ที่อยู่จัดส่ง ({{ getShippingAddresses.length }})</span>
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="addr in getShippingAddresses" :key="addr.id" class="relative p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors group bg-white dark:bg-[#1f2937] shadow-sm flex flex-col h-full overflow-hidden">
                            <div v-if="addr.is_default" class="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-400 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                              ค่าเริ่มต้น
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-900 dark:text-white mb-1 mt-1 flex items-center gap-2">
                                  {{ addr.first_name }} {{ addr.last_name }} 
                                  <span v-if="addr.title" class="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md font-bold truncate max-w-[100px]">{{ addr.title }}</span>
                                </h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>{{ addr.phone }}</p>
                                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
                                  {{ addr.address_line }} ต.{{ addr.subdistrict }} อ.{{ addr.district }} จ.{{ addr.province }} {{ addr.postal_code }}
                                </p>
                            </div>
                            <div class="flex items-center gap-4 mt-6 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button @click="openAddressModal('shipping', addr)" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 underline decoration-2 underline-offset-4">แก้ไข</button>
                                <button @click="deleteAddress(addr.id)" class="text-sm font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 underline decoration-2 underline-offset-4">ลบ</button>
                                <div class="flex-1"></div>
                                <button v-if="!addr.is_default" @click="setAddressDefault(addr)" class="text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">ตั้งเป็นค่าเริ่มต้น</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tax addresses block -->
                <div v-if="getTaxAddresses.length > 0">
                    <div class="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
                        <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2 m-0 relative top-auto">
                            <span>ที่อยู่ออกใบกำกับภาษี ({{ getTaxAddresses.length }})</span>
                        </h3>
                        <button @click="openAddressModal('tax')" class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline font-bold text-xs decoration-2 underline-offset-4 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> เพิ่ม
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="addr in getTaxAddresses" :key="addr.id" class="relative p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 transition-colors group bg-white dark:bg-[#1f2937] shadow-sm flex flex-col h-full overflow-hidden">
                            <div v-if="addr.is_default" class="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-400 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-xl shadow-md z-10 flex items-center gap-1">
                               <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                              ค่าเริ่มต้น
                            </div>
                            <div class="flex-1">
                                <h4 class="font-bold text-gray-900 dark:text-white mb-1 mt-1">{{ addr.company_name || (addr.first_name + ' ' + addr.last_name) }}  <span v-if="addr.title" class="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md ml-2 font-bold">{{ addr.title }}</span></h4>
                                <p class="text-[13px] text-gray-500 dark:text-gray-400 mb-1 leading-snug">เลขผู้เสียภาษี: {{ addr.tax_id || '-' }} <span class="ml-2 text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">{{ addr.branch || 'สำนักงานใหญ่' }}</span></p>
                                <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-1 mt-3 line-clamp-2">
                                  {{ addr.address_line }} ต.{{ addr.subdistrict }} อ.{{ addr.district }} จ.{{ addr.province }} {{ addr.postal_code }}
                                </p>
                            </div>
                            <div class="flex items-center gap-4 mt-6 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <button @click="openAddressModal('tax', addr)" class="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 underline decoration-2 underline-offset-4">แก้ไข</button>
                                <button @click="deleteAddress(addr.id)" class="text-sm font-bold text-rose-500 dark:text-rose-400 hover:text-rose-600 underline decoration-2 underline-offset-4">ลบ</button>
                                <div class="flex-1"></div>
                                <button v-if="!addr.is_default" @click="setAddressDefault(addr)" class="text-[11px] font-bold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">ตั้งเป็นค่าเริ่มต้น</button>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Mini CTA for Tax Addresses if zero -->
                <div v-else-if="getShippingAddresses.length > 0" class="p-4 bg-gray-50 dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-2xl text-sm flex items-center justify-between">
                   <span class="text-gray-600 dark:text-gray-400">ต้องการออกใบกำกับภาษีในนามบริษัทใช่ไหม?</span> <button @click="openAddressModal('tax')" class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">เพิ่มข้อมูลที่นี่</button>
                </div>
             </div>
          </div>
        </div>

        <!-- ============ ORDERS TAB ============ -->
        <div v-else-if="activeTab === 'orders'" class="space-y-6">
          <div class="bg-white dark:bg-[#111827] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
            <!-- Loading -->
            <div v-if="loadingOrders" class="text-center py-16">
              <svg class="animate-spin w-12 h-12 text-emerald-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p class="text-gray-500 dark:text-gray-400 font-bold">กำลังโหลดข้อมูลการสั่งซื้อ...</p>
            </div>
            
            <div v-else>
              <div v-if="orders.length === 0" class="text-center py-16">
                <!-- Empty State -->
                <svg class="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">ยังไม่มีรายการสั่งซื้อ</h3>
                <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">คุณยังไม่มีรายการสั่งซื้อใดๆ ในระบบขณะนี้</p>
                <router-link to="/products" class="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30">
                  เริ่มเลือกซื้อสินค้าเลย
                </router-link>
              </div>
              <div v-else class="text-left">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">ประวัติการสั่งซื้อของคุณ</h2>
                <div class="space-y-6">
                  <router-link :to="'/order-success/' + order.id" v-for="order in paginatedOrders" :key="order.id" class="block border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#111827] cursor-pointer group">
                    <!-- Order Header -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm">
                        <div>
                          <p class="text-gray-500 dark:text-gray-400 font-medium text-xs mb-0.5 uppercase tracking-wider">วันที่สั่งซื้อ</p>
                          <p class="font-bold text-gray-900 dark:text-gray-100">{{ new Date(order.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
                        </div>
                        <div>
                          <p class="text-gray-500 dark:text-gray-400 font-medium text-xs mb-0.5 uppercase tracking-wider">ยอดรวมสุทธิ</p>
                          <p class="font-bold text-emerald-600 dark:text-emerald-400">฿{{ Number(order.total_amount).toLocaleString() }}</p>
                        </div>
                        <div class="hidden md:block">
                          <p class="text-gray-500 dark:text-gray-400 font-medium text-xs mb-0.5 uppercase tracking-wider">จัดส่งไปที่</p>
                          <p class="font-bold text-gray-900 dark:text-gray-100 truncate w-32 xl:w-48">{{ order.shipping_address ? (order.shipping_address.first_name + ' ' + order.shipping_address.last_name) : 'ไม่ระบุ' }}</p>
                        </div>
                      </div>
                      <div class="text-left md:text-right flex flex-col items-start md:items-end">
                        <p class="text-gray-500 dark:text-gray-400 font-medium text-xs mb-0.5 uppercase tracking-wider">หมายเลขคำสั่งซื้อ</p>
                        <p class="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          #{{ order.id.split('-')[0].toUpperCase() }}
                        </p>
                      </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div class="px-6 py-5">
                      <div class="flex flex-col gap-4">
                        <div v-for="item in order.items" :key="item.id" class="flex items-center gap-4 border-b border-gray-50 dark:border-gray-800/50 pb-4 last:border-0 last:pb-0">
                          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl shrink-0 flex items-center justify-center text-gray-400 overflow-hidden relative border border-gray-200 dark:border-gray-700/50">
                             <img v-if="item.product_image" :src="item.product_image" :alt="item.product_name" class="w-full h-full object-cover absolute inset-0 z-0" />
                             <svg v-else class="w-6 h-6 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          </div>
                          <div class="flex-1">
                            <h4 class="font-bold text-gray-900 dark:text-white line-clamp-1">{{ item.product_name }}</h4>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">จำนวน {{ item.quantity }} ชิ้น</p>
                          </div>
                          <div class="text-right shrink-0">
                            <p class="font-bold text-gray-900 dark:text-white" :class="order.order_status === 'completed' || order.order_status === 'delivered' ? 'mb-2' : ''">฿{{ Number(item.price_at_purchase * item.quantity).toLocaleString() }}</p>
                            <button v-if="settingsStore.showProductReview && (order.order_status === 'completed' || order.order_status === 'delivered') && !item.is_reviewed" 
                                    @click.prevent="openReviewModal(item)" 
                                    class="px-3 py-1 text-[11px] font-bold border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors inline-block">
                               เขียนรีวิวสินค้า
                            </button>
                            <span v-else-if="settingsStore.showProductReview && (order.order_status === 'completed' || order.order_status === 'delivered') && item.is_reviewed" 
                                  class="px-3 py-1 text-[11px] font-bold border border-gray-300 text-gray-400 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 rounded-lg inline-block cursor-not-allowed">
                               รีวิวแล้ว
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Order Progress Timeline -->
                    <div v-if="order.payment_status !== 'cancelled' && order.order_status !== 'cancelled'" class="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                      <div class="flex items-center justify-between relative">
                        <!-- Progress Line Background -->
                        <div class="absolute top-4 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        <!-- Progress Line Active -->
                        <div class="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-500" 
                             :style="{ width: order.order_status === 'completed' || order.order_status === 'delivered' ? 'calc(100% - 48px)' : order.order_status === 'shipped' ? 'calc(75% - 36px)' : order.order_status === 'processing' || order.order_status === 'confirmed' ? 'calc(50% - 24px)' : order.payment_status === 'paid' ? 'calc(25% - 12px)' : '0%' }"></div>
                        
                        <!-- Step 1: รอชำระ -->
                        <div class="relative z-10 flex flex-col items-center gap-1.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                               :class="'bg-emerald-500 text-white'">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          </div>
                          <span class="text-[10px] font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">สั่งซื้อ</span>
                        </div>

                        <!-- Step 2: ชำระเงิน -->
                        <div class="relative z-10 flex flex-col items-center gap-1.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                               :class="order.payment_status === 'paid' || order.payment_status === 'reviewing' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'">
                            <svg v-if="order.payment_status === 'paid'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else-if="order.payment_status === 'reviewing'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                            <span v-else>2</span>
                          </div>
                          <span class="text-[10px] font-bold whitespace-nowrap" :class="order.payment_status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : order.payment_status === 'reviewing' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'">
                            {{ order.payment_status === 'reviewing' ? 'ตรวจสอบ' : 'ชำระเงิน' }}
                          </span>
                        </div>

                        <!-- Step 3: เตรียมจัดส่ง -->
                        <div class="relative z-10 flex flex-col items-center gap-1.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                               :class="['processing','confirmed','shipped','delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'">
                            <svg v-if="['shipped','delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else-if="['processing','confirmed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                            <span v-else>3</span>
                          </div>
                          <span class="text-[10px] font-bold whitespace-nowrap" :class="['processing','confirmed','shipped','delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">เตรียมจัดส่ง</span>
                        </div>

                        <!-- Step 4: จัดส่งแล้ว -->
                        <div class="relative z-10 flex flex-col items-center gap-1.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                               :class="['shipped','delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'">
                            <svg v-if="['delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <svg v-else-if="order.order_status === 'shipped'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"/></svg>
                            <span v-else>4</span>
                          </div>
                          <span class="text-[10px] font-bold whitespace-nowrap" :class="['shipped','delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">จัดส่งแล้ว</span>
                        </div>

                        <!-- Step 5: เสร็จสิ้น -->
                        <div class="relative z-10 flex flex-col items-center gap-1.5">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                               :class="['delivered','completed'].includes(order.order_status) ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'">
                            <svg v-if="['delivered','completed'].includes(order.order_status)" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                            <span v-else>5</span>
                          </div>
                          <span class="text-[10px] font-bold whitespace-nowrap" :class="['delivered','completed'].includes(order.order_status) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'">เสร็จสิ้น</span>
                        </div>
                      </div>

                      <!-- Tracking Number -->
                      <div v-if="order.tracking_number" class="mt-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <svg class="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        <div class="flex-1 min-w-0">
                          <p class="text-[10px] font-bold text-blue-500/70 uppercase tracking-wider">เลขพัสดุ {{ order.shipping_provider ? '(' + order.shipping_provider + ')' : '' }}</p>
                          <p class="text-sm font-black text-blue-700 dark:text-blue-300 truncate">{{ order.tracking_number }}</p>
                        </div>
                        <a v-if="order.shipping_provider" :href="getTrackingUrl(order.shipping_provider, order.tracking_number)" target="_blank" rel="noopener noreferrer" @click.stop class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                          ติดตามพัสดุ
                        </a>
                      </div>
                    </div>

                    <!-- Cancelled Banner -->
                    <div v-if="order.payment_status === 'cancelled' || order.order_status === 'cancelled'" class="px-6 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-800/30">
                      <p class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        คำสั่งซื้อนี้ถูกยกเลิกแล้ว
                      </p>
                    </div>

                    <!-- Order Footer -->
                    <div class="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center">
                      <span v-if="order.payment_status === 'pending'" class="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm group-hover:shadow-md">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                        ดำเนินการชำระเงิน
                      </span>
                      <span v-else class="text-sm font-bold text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-500 dark:group-hover:text-emerald-400 flex items-center gap-1">
                        ดูรายละเอียด
                        <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                      </span>
                    </div>
                  </router-link>
                </div>

                <div v-if="totalOrderPages > 1" class="mt-8 flex justify-center">
                    <div class="inline-flex items-center gap-2 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 p-2 rounded-2xl shadow-sm">
                        <button @click="changeOrderPage(ordersCurrentPage - 1)" :disabled="ordersCurrentPage === 1" class="p-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-gray-800 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <span class="text-sm font-bold text-gray-700 dark:text-gray-300 px-4 min-w-[100px] text-center">
                          หน้า {{ ordersCurrentPage }} จาก {{ totalOrderPages }}
                        </span>
                        
                        <button @click="changeOrderPage(ordersCurrentPage + 1)" :disabled="ordersCurrentPage === totalOrderPages" class="p-2 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-white dark:hover:bg-gray-800 dark:text-gray-400 disabled:opacity-40 disabled:hover:bg-transparent transition-all">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============ WISHLIST TAB ============ -->
        <div v-else-if="activeTab === 'wishlist'" class="space-y-6">
          <div class="bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
            <h2 class="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg class="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
              รายการโปรดของฉัน
            </h2>

            <!-- Loading -->
            <div v-if="wishlistStore.isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="i in 3" :key="'wl-sk-'+i" class="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden animate-pulse">
                <div class="aspect-square bg-gray-200 dark:bg-gray-700"></div>
                <div class="p-4"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div></div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else-if="wishlistStore.items.length === 0" class="text-center py-16">
              <svg class="w-16 h-16 mx-auto text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">ยังไม่มีรายการโปรด</h3>
              <p class="text-gray-500 dark:text-gray-400 mb-6">กดไอคอนหัวใจบนสินค้าที่คุณสนใจเพื่อบันทึกไว้ดูภายหลัง</p>
              <router-link to="/products" class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                ดูสินค้าทั้งหมด
              </router-link>
            </div>

            <!-- Wishlist Grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <ProductCard 
                v-for="item in wishlistStore.items" 
                :key="item.id"
                :product="item"
              />
            </div>
          </div>
        </div>

        <!-- ============ SECURITY TAB ============ -->
        <div v-else-if="activeTab === 'security'" class="space-y-6">
              <!-- Change Password -->
              <div class="bg-white dark:bg-[#111827] rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">เปลี่ยนรหัสผ่าน</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">กรอกรหัสผ่านใหม่เพื่ออัปเดตความปลอดภัยบัญชีของคุณ</p>
                <form @submit.prevent="updatePassword" class="w-full md:w-2/3 xl:w-1/2 space-y-4">
                  <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสผ่านปัจจุบัน <span class="text-gray-400 font-normal">(ถ้ามี)</span></label>
                    <input type="password" v-model="passwordForm.current_password" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="••••••••">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสผ่านใหม่ <span class="text-red-500">*</span></label>
                    <input type="password" v-model="passwordForm.new_password" required minlength="6" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="••••••••">
                  </div>
                  <div>
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ยืนยันรหัสผ่านใหม่ <span class="text-red-500">*</span></label>
                    <input type="password" v-model="passwordForm.confirm_password" required minlength="6" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" placeholder="••••••••">
                  </div>
                  <div class="pt-2">
                    <button type="submit" :disabled="updatePasswordLoading" class="w-full flex justify-center py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/30">
                        <svg v-if="updatePasswordLoading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        เปลี่ยนรหัสผ่าน
                    </button>
                  </div>
                </form>
              </div>

              <!-- Delete Account -->
              <div class="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30">
                <h2 class="text-xl font-bold text-red-700 dark:text-red-400 mb-2">ลบบัญชีผู้ใช้งาน</h2>
                <p class="text-red-600/80 dark:text-red-400/80 text-sm mb-6 max-w-2xl leading-relaxed">
                  เมื่อคุณลบบัญชี ข้อมูลส่วนตัว ที่อยู่ และการตั้งค่าทั้งหมดของคุณจะถูกลบออกจากระบบอย่างถาวร ไม่สามารถกู้คืนได้ (ตามมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล PDPA)
                </p>
                <button @click="showDeleteConfirmModal = true; confirmDeleteText = ''" class="px-6 py-2.5 bg-red-600 text-white font-bold text-sm rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
                  ลบบัญชีอย่างถาวร
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>

  <!-- Address Modal -->
  <Teleport to="body">
    <div v-if="showAddressModal" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showAddressModal = false"></div>
      <div class="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {{ editingAddress ? 'แก้ไข' : 'เพิ่ม' }}{{ addressForm.type === 'tax' ? 'ข้อมูลใบกำกับภาษี' : 'ที่อยู่จัดส่ง' }}
                
                <div v-if="addressForm.type === 'tax' && getShippingAddresses.length > 0" class="relative ml-auto mr-4">
                     <button @click="showShippingSelector = !showShippingSelector" class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold rounded-lg text-sm hover:bg-emerald-100 transition border border-emerald-200 dark:border-emerald-800">
                         <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                         ดึงจากที่อยู่จัดส่ง
                     </button>
                     <div v-if="showShippingSelector" class="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
                         <div class="max-h-60 overflow-y-auto">
                             <button v-for="addr in getShippingAddresses" :key="addr.id" @click="copyFromShippingAddress(addr)" class="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-b border-gray-50 dark:border-gray-700/50 transition flex flex-col gap-1 last:border-0">
                                 <span class="font-bold text-gray-900 dark:text-white text-sm">{{ addr.title || 'ที่อยู่จัดส่ง' }}</span>
                                 <span class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ addr.address_line }} ต.{{ addr.subdistrict }}</span>
                             </button>
                         </div>
                     </div>
                </div>
            </h3>
            <button @click="showAddressModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>
        <div class="p-6 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div v-if="addressForm.type === 'tax'" class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อบริษัท / นิติบุคคล <span class="text-gray-400 font-normal">(ถ้ามี)</span></label>
                    <input type="text" v-model="addressForm.company_name" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                </div>
                
                <div v-if="addressForm.type === 'tax'">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">เลขประจำตัวผู้เสียภาษี 13 หลัก</label>
                    <input type="text" v-model="addressForm.tax_id" maxlength="13" class="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" :class="addressForm.tax_id && !isValidTaxId(addressForm.tax_id) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'">
                    <p v-if="addressForm.tax_id && !isValidTaxId(addressForm.tax_id)" class="text-xs text-red-500 mt-1 font-medium">เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก</p>
                </div>
                <div v-if="addressForm.type === 'tax'">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">สำนักงานใหญ่ / สาขา</label>
                    <input type="text" v-model="addressForm.branch" placeholder="เช่น สำนักงานใหญ่ หรือ สาขาที่ 00001" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                </div>

                <div v-if="addressForm.type === 'shipping'" class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อเรียกที่อยู่ <span class="text-gray-400 font-normal">(เช่น บ้าน, ที่ทำงาน)</span></label>
                    <input type="text" v-model="addressForm.title" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                </div>

                <div class="col-span-1">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ชื่อผู้รับ / ผู้ติดต่อ <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.first_name" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                </div>
                <div class="col-span-1">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">นามสกุล <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.last_name" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                </div>
                <div class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">เบอร์โทรศัพท์ <span class="text-red-500">*</span></label>
                    <input type="tel" v-model="addressForm.phone" required class="w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors" :class="addressForm.phone && !isValidThaiPhone(addressForm.phone) ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'">
                    <p v-if="addressForm.phone && !isValidThaiPhone(addressForm.phone)" class="text-xs text-red-500 mt-1 font-medium">เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก</p>
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">บ้านเลขที่, ถนน, ซอย, หมู่บ้าน <span class="text-red-500">*</span></label>
                    <textarea v-model="addressForm.address_line" rows="2" required class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors"></textarea>
                </div>

                <div class="relative">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">จังหวัด <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.province" required @input="handleAddressInput('province', $event.target.value)" @focus="handleAddressInput('province', $event.target.value)" @blur="handleAddressBlur" autocomplete="off" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                    <ul v-if="addressSuggestions.length > 0 && activeAddressField === 'province'" class="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        <li v-for="(addr, idx) in addressSuggestions" :key="idx" @click="selectAddress(addr)" class="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                            ต.{{addr.district}} อ.{{addr.amphoe}} จ.{{addr.province}} {{addr.zipcode}}
                        </li>
                    </ul>
                </div>
                <div class="relative">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">อำเภอ / เขต <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.district" required @input="handleAddressInput('district', $event.target.value)" @focus="handleAddressInput('district', $event.target.value)" @blur="handleAddressBlur" autocomplete="off" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                    <ul v-if="addressSuggestions.length > 0 && activeAddressField === 'district'" class="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        <li v-for="(addr, idx) in addressSuggestions" :key="idx" @click="selectAddress(addr)" class="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                            ต.{{addr.district}} อ.{{addr.amphoe}} จ.{{addr.province}} {{addr.zipcode}}
                        </li>
                    </ul>
                </div>
                <div class="relative">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ตำบล / แขวง <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.subdistrict" required @input="handleAddressInput('subdistrict', $event.target.value)" @focus="handleAddressInput('subdistrict', $event.target.value)" @blur="handleAddressBlur" autocomplete="off" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                    <ul v-if="addressSuggestions.length > 0 && activeAddressField === 'subdistrict'" class="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        <li v-for="(addr, idx) in addressSuggestions" :key="idx" @click="selectAddress(addr)" class="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                            ต.{{addr.district}} อ.{{addr.amphoe}} จ.{{addr.province}} {{addr.zipcode}}
                        </li>
                    </ul>
                </div>
                <div class="relative">
                    <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">รหัสไปรษณีย์ <span class="text-red-500">*</span></label>
                    <input type="text" v-model="addressForm.postal_code" required @input="handleAddressInput('postal_code', $event.target.value)" @focus="handleAddressInput('postal_code', $event.target.value)" @blur="handleAddressBlur" autocomplete="off" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
                    <ul v-if="addressSuggestions.length > 0 && activeAddressField === 'postal_code'" class="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                        <li v-for="(addr, idx) in addressSuggestions" :key="idx" @click="selectAddress(addr)" class="px-4 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                            ต.{{addr.district}} อ.{{addr.amphoe}} จ.{{addr.province}} {{addr.zipcode}}
                        </li>
                    </ul>
                </div>

                <div class="md:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" id="is_default_checkbox" v-model="addressForm.is_default" class="rounded text-emerald-600 focus:ring-emerald-500 bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-700 w-5 h-5">
                    <label for="is_default_checkbox" class="text-sm font-bold text-gray-700 dark:text-gray-300 select-none cursor-pointer">ตั้งเป็นที่อยู่ค่าเริ่มต้น (Default)</label>
                </div>
            </div>
        </div>
        <div class="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#111827] flex justify-end gap-3 shrink-0">
            <button @click="showAddressModal = false" class="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-800 transition rounded-xl">ยกเลิก</button>
            <button @click="saveAddress" :disabled="saveAddressLoading" class="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30 disabled:opacity-50 flex items-center gap-2">
                <svg v-if="saveAddressLoading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                บันทึกข้อมูล
            </button>
        </div>
    </div>
    </div>
  </Teleport>

  <!-- Delete Account Confirm Modal -->
  <Teleport to="body">
    <div v-if="showDeleteConfirmModal" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" @click="showDeleteConfirmModal = false"></div>
      <div class="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md relative z-10 shadow-2xl p-6 text-center">
        <div class="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 class="text-xl font-black text-gray-900 dark:text-white mb-2">เตือนความจำ!</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">คุณกำลังดำเนินการลบบัญชีข้อมูลอย่างถาวร<br>การกระทำนี้ <strong class="text-red-500">ไม่สามารถกู้คืนได้</strong></p>
        
        <div class="mb-6 text-left">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">พิมพ์คำว่า <span class="text-red-600">DELETE</span> เพื่อยืนยัน</label>
          <input type="text" v-model="confirmDeleteText" placeholder="DELETE" class="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-red-500 focus:border-red-500 transition-colors uppercase">
        </div>

        <div class="flex gap-3">
          <button @click="showDeleteConfirmModal = false" class="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            ยกเลิก
          </button>
          <button @click="deleteAccount" :disabled="confirmDeleteText !== 'DELETE' || deleteAccountLoading" class="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center">
            <svg v-if="deleteAccountLoading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <ReviewModal
    v-if="selectedProductForReview"
    :isOpen="isReviewModalOpen"
    :product="selectedProductForReview"
    @close="isReviewModalOpen = false"
    @review-submitted="handleReviewSubmitted"
  />
</template>
