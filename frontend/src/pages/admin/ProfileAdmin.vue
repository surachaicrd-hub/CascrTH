<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)
const uploadingImage = ref(false)

const profile = ref({
  name: '',
  profile_image_url: '',
  notification_email: '',
  notify_quotation: 0,
  notify_contact: 0,
  notify_order: 0
})
const avatarError = ref(false)

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const fileInput = ref(null)

const fetchProfile = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/admin/profile')
    const data = await res.json()
    if (data.success && data.data) {
      profile.value.name = data.data.name || ''
      profile.value.profile_image_url = data.data.profile_image_url || ''
      profile.value.notification_email = data.data.notification_email || ''
      profile.value.notify_quotation = data.data.notify_quotation || 0
      profile.value.notify_contact = data.data.notify_contact || 0
      profile.value.notify_order = data.data.notify_order || 0
      avatarError.value = false
    }
  } catch (error) {
    if (error.message !== 'Unexpected end of JSON input') {
      console.error('Failed to load profile:', error)
      showToast('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error')
    }
  } finally {
    loading.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    showToast('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('ขนาดไฟล์ต้องไม่เกิน 2MB', 'error')
    return
  }

  uploadingImage.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)

    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    }, true) // true = isFormData

    const data = await res.json()
    if (data.success) {
      profile.value.profile_image_url = data.url
      avatarError.value = false
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success')
      // Auto save after upload for better UX
      await saveProfile()
    } else {
      showToast(data.error || 'อัปโหลดไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
    showToast('เกิดข้อผิดพลาดในการอัปโหลด', 'error')
  } finally {
    uploadingImage.value = false
    e.target.value = ''
  }
}

const saveProfile = async () => {
  // Validate Passwords if user is trying to change it
  if (passwordForm.value.new_password || passwordForm.value.current_password) {
    if (!passwordForm.value.current_password) {
      showToast('กรุณากรอกรหัสผ่านปัจจุบัน', 'error')
      return
    }
    if (!passwordForm.value.new_password) {
      showToast('กรุณากรอกรหัสผ่านใหม่', 'error')
      return
    }
    if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
      showToast('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error')
      return
    }
    if (passwordForm.value.new_password.length < 6) {
      showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 'error')
      return
    }
  }

  saving.value = true
  try {
    const payload = {
      name: profile.value.name,
      profile_image_url: profile.value.profile_image_url,
      notification_email: profile.value.notification_email,
      notify_quotation: profile.value.notify_quotation,
      notify_contact: profile.value.notify_contact,
      notify_order: profile.value.notify_order
    }
    
    if (passwordForm.value.new_password) {
      payload.password = passwordForm.value.current_password
      payload.new_password = passwordForm.value.new_password
    }

    const res = await apiFetch('/api/admin/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    
    if (data.success) {
      showToast('บันทึกข้อมูลโปรไฟล์เรียบร้อย', 'success')
      
      // Update global admin context in localStorage to reflect UI changes instantly
      const storedUser = localStorage.getItem('adminUser')
      if (storedUser) {
        const userObj = JSON.parse(storedUser)
        userObj.name = data.data.name
        userObj.profile_image_url = data.data.profile_image_url
        localStorage.setItem('adminUser', JSON.stringify(userObj))
        // Dispatch custom event to tell AdminLayout to update without refreshing
        window.dispatchEvent(new Event('adminProfileUpdated'))
      }

      // Clear password fields on success
      passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    } else {
      showToast(data.error || 'บันทึกไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    saving.value = false
  }
}

const getInitials = (name) => {
  if (!name) return 'A'
  return name.substring(0, 1).toUpperCase()
}

onMounted(() => {
  fetchProfile()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24">
    <div class="mb-8">
      <h1 class="text-3xl font-black text-gray-900 tracking-tight">โปรไฟล์ผู้ดูแลระบบ</h1>
      <p class="text-sm text-gray-500 mt-2 font-medium flex items-center gap-1">จัดการข้อมูลส่วนตัว รูปภาพ และเปลี่ยนรหัสผ่าน
        <InfoTooltip title="ตั้งค่าโปรไฟล์ส่วนตัว" description="แก้ไขข้อมูลที่เกี่ยวกับตัวคุณเองบัญชีผู้ใช้งานคนปัจุบัน<ul><li><strong>รูปโปรไฟล์:</strong> สามารถอัปโหลดรูปภาพส่วนตัว (แนะนำอัตราส่วน 1:1 จัตุรัส)</li><li><strong>เปลี่ยนรหัสผ่าน:</strong> ถ้ามีการแก้ไขรหัสผ่าน ระบบจะบังคับให้ต้องกรอก 'รหัสผ่านปัจจุบัน' ก่อนทุกครั้งเพื่อยืนยันความเป็นเจ้าของ</li></ul>" />
      </p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400 flex flex-col items-center">
      <svg class="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      กำลังโหลดข้อมูล...
    </div>

    <div v-else class="w-full flex flex-col lg:flex-row gap-8 items-start">
      
      <!-- General Form -->
      <form @submit.prevent="saveProfile" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 w-full relative">
        
        <div class="p-8 sm:p-10">
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             ข้อมูลบัญชี
          </h2>
          
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
             <!-- Avatar Block -->
             <div class="relative group shrink-0">
               <div class="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl font-black">
                 <img v-if="profile.profile_image_url && !avatarError" :src="profile.profile_image_url" @error="avatarError = true" class="w-full h-full object-cover">
                 <span v-else>{{ getInitials(profile.name) }}</span>
               </div>
               
               <button 
                 type="button" 
                 @click="triggerFileInput"
                 :disabled="uploadingImage"
                 class="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-white focus:outline-none disabled:opacity-50"
               >
                 <svg v-if="!uploadingImage" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                 <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               </button>
               <input type="file" ref="fileInput" @change="handleImageUpload" accept="image/*" class="hidden">
             </div>
             
             <div class="flex-1 w-full">
               <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อแสดงผล</label>
               <input 
                 v-model="profile.name" 
                 type="text" 
                 placeholder="ผู้ดูแลระบบ" 
                 class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-medium text-gray-900 shadow-sm"
               >
               <p class="text-[11px] text-gray-400 mt-2 font-medium">ชื่อนี้จะถูกแสดงในแถบเมนูด้านซ้าย</p>
             </div>
          </div>
          
          <hr class="border-gray-100 my-8">
          
          <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
             <svg class="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             เปลี่ยนรหัสผ่าน <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md ml-2">ทางเลือก (ปล่อยว่างได้)</span>
          </h2>
          
          <div class="space-y-5">
             <div>
               <label class="block text-sm font-bold text-gray-700 mb-1.5">รหัสผ่านปัจจุบัน</label>
               <input 
                 v-model="passwordForm.current_password" 
                 type="password" 
                 placeholder="กรอกรหัสผ่านปัจจุบันเพื่อยืนยันสิทธิ์" 
                 class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors bg-gray-50 focus:bg-white"
               >
             </div>
             
             <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">รหัสผ่านใหม่</label>
                  <input 
                    v-model="passwordForm.new_password" 
                    type="password" 
                    placeholder="อย่างน้อย 6 ตัวอักษร" 
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
               </div>
               <div>
                  <label class="block text-sm font-bold text-gray-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                  <input 
                    v-model="passwordForm.confirm_password" 
                    type="password" 
                    placeholder="กรอกให้ตรงกัน" 
                    class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  >
               </div>
             </div>
          </div>

           <hr class="border-gray-100 my-8">
           
           <h2 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              การตั้งค่าการแจ้งเตือนทางอีเมล
           </h2>
           
           <div class="space-y-5 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 mb-8">
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">อีเมลที่ใช้รับการแจ้งเตือน</label>
                <input 
                  v-model="profile.notification_email" 
                  type="email" 
                  placeholder="เช่น your-email@example.com" 
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white font-medium text-gray-900 shadow-sm"
                >
                <p class="text-[11px] text-gray-400 mt-2 font-medium">หากระบุ ระบบจะส่งอีเมลแจ้งเตือนสำหรับหัวข้อที่คุณเลือกด้านล่างไปที่อีเมลนี้</p>
              </div>
              
              <div class="space-y-4 pt-3">
                <label class="block text-sm font-bold text-gray-700 uppercase tracking-wider text-xs">เหตุการณ์ที่ต้องการรับการแจ้งเตือน</label>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label class="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all group">
                    <div class="flex items-center h-5">
                      <input v-model="profile.notify_quotation" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                    </div>
                    <div class="text-sm">
                      <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">ขอใบเสนอราคา</span>
                      <p class="text-xs text-gray-400 mt-0.5">มีลูกค้าขอใบเสนอราคา</p>
                    </div>
                  </label>
                  
                  <label class="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all group">
                    <div class="flex items-center h-5">
                      <input v-model="profile.notify_contact" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                    </div>
                    <div class="text-sm">
                      <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">ติดต่อเรา</span>
                      <p class="text-xs text-gray-400 mt-0.5">ลูกค้าส่งฟอร์มติดต่อเรา</p>
                    </div>
                  </label>
                  
                  <label class="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all group">
                    <div class="flex items-center h-5">
                      <input v-model="profile.notify_order" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                    </div>
                    <div class="text-sm">
                      <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">สั่งซื้อสินค้าใหม่</span>
                      <p class="text-xs text-gray-400 mt-0.5">มีคำสั่งซื้อใหม่ในระบบ</p>
                    </div>
                  </label>
                </div>
              </div>
           </div>
        </div>

        <!-- Sticky Actions Bar -->
        <div class="fixed bottom-0 left-0 sm:left-64 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/60 p-4 sm:px-8 sm:py-5 flex justify-end gap-3 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.1)]">
          <!-- decorative top highlight -->
          <div class="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
          
          <button type="button" @click="saveProfile" :disabled="saving" class="relative overflow-hidden group px-6 py-2.5 sm:px-10 sm:py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-gray-900/20">
            <div class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span class="relative flex items-center justify-center gap-2">
              <svg v-if="saving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
