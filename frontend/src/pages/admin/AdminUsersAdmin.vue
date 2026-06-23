<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiFetch } from '../../utils/apiFetch'
import { useNotifications } from '../../composables/useNotifications'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const users = ref([])
const avatarErrors = ref({})
const loading = ref(true)

const showModal = ref(false)
const modalType = ref('add') // 'add' or 'edit'

const form = ref({
  id: '',
  username: '',
  name: '',
  password: '',
  profile_image_url: '',
  notification_email: '',
  notify_quotation: 0,
  notify_contact: 0,
  notify_order: 0
})
const saving = ref(false)

const currentUser = ref(null)

onMounted(() => {
  const storedUser = localStorage.getItem('adminUser')
  if (storedUser) {
    currentUser.value = JSON.parse(storedUser)
  }
  fetchUsers()
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/admin/users')
    const data = await res.json()
    if (data.success) {
      users.value = data.data
    }
  } catch (error) {
    console.error('Failed to load users:', error)
    showToast('โหลดข้อมูลผู้ใช้งานไม่สำเร็จ', 'error')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  modalType.value = 'add'
  form.value = {
    id: '',
    username: '',
    name: '',
    password: '',
    profile_image_url: '',
    notification_email: '',
    notify_quotation: 0,
    notify_contact: 0,
    notify_order: 0
  }
  showModal.value = true
}

const openEditModal = (user) => {
  if (user.username === 'admin') {
    showToast('ไม่สามารถแก้ไขบัญชีผู้ดูแลระบบหลักได้จากหน้านี้', 'error')
    return
  }
  modalType.value = 'edit'
  form.value = {
    id: user.id,
    username: user.username,
    name: user.name || '',
    password: '', // Leave empty unless changing
    profile_image_url: user.profile_image_url || '',
    notification_email: user.notification_email || '',
    notify_quotation: user.notify_quotation || 0,
    notify_contact: user.notify_contact || 0,
    notify_order: user.notify_order || 0
  }
  showModal.value = true
}

const saveUser = async () => {
  if (!form.value.username || (modalType.value === 'add' && !form.value.password)) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
    return
  }

  saving.value = true
  try {
    const url = modalType.value === 'add' ? '/api/admin/users' : `/api/admin/users/${form.value.id}`
    const method = modalType.value === 'add' ? 'POST' : 'PUT'
    
    const payload = { ...form.value }
    // Don't send empty password on edit
    if (modalType.value === 'edit' && !payload.password) {
      delete payload.password
    }

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    })
    
    const data = await res.json()
    
    if (data.success) {
      showToast(modalType.value === 'add' ? 'เพิ่มผู้ใช้งานสำเร็จ' : 'แก้ไขผู้ใช้งานสำเร็จ', 'success')
      showModal.value = false
      fetchUsers()
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (error) {
    console.error('Save user error:', error)
    showToast('ไม่สามารถบันทึกข้อมูลได้', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = async (user) => {
  if (user.username === 'admin') {
    showToast('บัญชีผู้ดูแลระบบหลักไม่สามารถลบได้', 'error')
    return
  }
  if (currentUser.value?.id === user.id) {
    showToast('คุณไม่สามารถลบบัญชีตัวเองได้', 'error')
    return
  }

  const isConfirmed = await showConfirm({
    title: 'ลบข้อมูลผู้ใช้งาน',
    message: `คุณต้องการลบผู้ใช้งาน ${user.username} ใช่หรือไม่?`,
    confirmText: 'ลบผู้ใช้',
    type: 'danger'
  })

  if (!isConfirmed) return

  try {
    const res = await apiFetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('ลบผู้ใช้งานสำเร็จ', 'success')
      fetchUsers()
    } else {
      showToast(data.error || 'ลบไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Delete user error:', error)
    showToast('เกิดข้อผิดพลาด', 'error')
  }
}

const getInitials = (name) => {
  if (!name) return 'A'
  return name.substring(0, 1).toUpperCase()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('th-TH', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>

<template>
  <div class="h-full flex flex-col pb-24 w-full">
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h1 class="text-3xl font-black text-gray-900 tracking-tight">การจัดการผู้ใช้งาน</h1>
        <p class="text-sm text-gray-500 mt-2 font-medium flex items-center gap-1">เพิ่ม ลด และแก้ไขข้อมูลผู้ดูแลระบบ
          <InfoTooltip title="การตั้งค่า Admin" description="จัดการรายชื่อและบัญชีสำหรับเข้าสู่ระบบหลังบ้าน<ul><li><strong>สิทธิ์ Main Admin:</strong> บัญชี 'admin' หลักไม่สามารถถูกลบ พักการใช้งาน หรือถูกเปลี่ยน Username ได้</li><li><strong>ลบบัญชี:</strong> ควบคุมสิทธิ์การเข้าถึงโดยการลบบัญชีผู้ใช้งานที่หมดวาระหน้าที่แล้ว</li></ul>" />
        </p>
      </div>
      <button @click="openAddModal" class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        เพิ่มผู้ใช้ใหม่
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-400 flex flex-col items-center">
      <svg class="animate-spin h-8 w-8 text-emerald-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      กำลังโหลดข้อมูล...
    </div>

    <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
      <div class="overflow-x-auto w-full">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="bg-gray-50/80 text-gray-500 uppercase text-xs font-bold border-b border-gray-200">
            <tr>
              <th class="px-6 py-4">ผู้ใช้งาน</th>
              <th class="px-6 py-4">ชื่อเข้าสู่ระบบ</th>
              <th class="px-6 py-4">วันที่เพิ่ม</th>
              <th class="px-6 py-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <TransitionGroup name="list">
              <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold overflow-hidden border border-emerald-200">
                      <img v-if="user.profile_image_url && !avatarErrors[user.id]" :src="user.profile_image_url" @error="avatarErrors[user.id] = true" class="w-full h-full object-cover">
                      <span v-else>{{ getInitials(user.name || user.username) }}</span>
                    </div>
                    <div>
                      <div class="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                        {{ user.name || user.username }}
                        <span v-if="user.username === 'admin'" class="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-1.5 py-0.5 rounded-md">Main</span>
                      </div>
                      <div class="text-xs text-gray-500 mt-0.5" v-if="user.name">{{ user.username }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 bg-gray-100/80 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border border-gray-200">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    {{ user.username }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-500 font-medium">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      v-if="user.username !== 'admin'"
                      @click="openEditModal(user)" 
                      title="แก้ไข"
                      class="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <span v-else class="text-xs text-gray-300 pointer-events-none p-2">-</span>
                    
                    <button 
                      v-if="user.username !== 'admin' && currentUser?.id !== user.id"
                      @click="confirmDelete(user)" 
                      title="ลบทิ้ง"
                      class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                    <span v-else-if="user.username !== 'admin'" class="text-[10px] text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md pointer-events-none">บัญชีคุณ</span>
                  </div>
                </td>
              </tr>
            </TransitionGroup>
          </tbody>
        </table>
        
        <div v-if="users.length === 0 && !loading" class="p-12 text-center text-gray-500 flex flex-col items-center">
            <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            ยังไม่มีบัญชีผู้ใช้งานเพิ่มเติม
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            <h3 class="text-xl font-bold text-gray-900">
              {{ modalType === 'add' ? 'เพิ่มผู้ใช้งานใหม่' : 'แก้ไขผู้ใช้งาน' }}
            </h3>
            <button @click="showModal = false" class="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div class="p-6 overflow-y-auto">
            <form @submit.prevent="saveUser" class="space-y-5">
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อแสดงผล (ชื่อจริง) <span class="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">ไม่บังคับ</span></label>
                <input v-model="form.name" type="text" placeholder="ผู้จัดการทั่วไป" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
              </div>

              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">ชื่อเข้าสู่ระบบ (Username) <span class="text-rose-500">*</span></label>
                <input v-model="form.username" type="text" :disabled="modalType === 'edit'" placeholder="เช่น manager01" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500">
                <p v-if="modalType === 'edit'" class="text-xs text-gray-400 mt-1.5 font-medium flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  ชื่อเข้าสู่ระบบไม่สามารถเปลี่ยนได้
                </p>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-gray-700 mb-1.5">
                  รหัสผ่าน 
                  <span v-if="modalType === 'add'" class="text-rose-500">*</span>
                  <span v-else class="text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">ปล่อยว่างเพื่อใช้รหัสเดิม</span>
                </label>
                <input v-model="form.password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors">
              </div>

              <div class="pt-4 border-t border-gray-100">
                <h4 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  การตั้งค่าอีเมลแจ้งเตือน
                </h4>
                
                <div class="space-y-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/50">
                  <div>
                    <label class="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">อีเมลรับการแจ้งเตือน</label>
                    <input v-model="form.notification_email" type="email" placeholder="เช่น admin@example.com" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white">
                  </div>
                  
                  <div class="space-y-3 pt-1">
                    <label class="block text-[11px] font-bold text-gray-500 mb-1 uppercase tracking-wider">หัวข้อที่ต้องการรับแจ้งเตือน</label>
                    
                    <label class="flex items-start gap-3 cursor-pointer group">
                      <div class="flex items-center h-5">
                        <input v-model="form.notify_quotation" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                      </div>
                      <div class="text-sm">
                        <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">ขอใบเสนอราคา</span>
                        <p class="text-xs text-gray-400">ส่งอีเมลเมื่อมีลูกค้าส่งข้อมูลขอใบเสนอราคาจากหน้าเว็บ</p>
                      </div>
                    </label>
                    
                    <label class="flex items-start gap-3 cursor-pointer group">
                      <div class="flex items-center h-5">
                        <input v-model="form.notify_contact" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                      </div>
                      <div class="text-sm">
                        <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">ติดต่อเรา / ส่งข้อความ</span>
                        <p class="text-xs text-gray-400">ส่งอีเมลเมื่อลูกค้าส่งแบบฟอร์มติดต่อเราบนหน้าเว็บไซต์</p>
                      </div>
                    </label>
                    
                    <label class="flex items-start gap-3 cursor-pointer group">
                      <div class="flex items-center h-5">
                        <input v-model="form.notify_order" :true-value="1" :false-value="0" type="checkbox" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 transition-all cursor-pointer">
                      </div>
                      <div class="text-sm">
                        <span class="font-bold text-gray-700 group-hover:text-emerald-700 transition-colors">สั่งซื้อสินค้าใหม่</span>
                        <p class="text-xs text-gray-400">ส่งอีเมลแจ้งเตือนทุกครั้งเมื่อมีคำสั่งซื้อใหม่เข้ามาในระบบ</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </form>
          </div>
          
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button @click="showModal = false" type="button" class="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              ยกเลิก
            </button>
            <button @click="saveUser" :disabled="saving" type="button" class="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
              <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
            </button>
          </div>
          
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-active .relative,
.fade-leave-active .relative {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.fade-enter-from .relative,
.fade-leave-to .relative {
  transform: scale(0.95) translateY(10px);
}
</style>
