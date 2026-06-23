<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import FeatureIcon from '../../components/ui/FeatureIcon.vue'
import IconSelect from '../../components/ui/IconSelect.vue'

const iconOptions = [
  { value: 'check', label: 'เครื่องหมายถูก (Check)' },
  { value: 'shield', label: 'โล่ป้องกัน (Shield)' },
  { value: 'truck', label: 'รถบรรทุก (Truck)' },
  { value: 'cog', label: 'ฟันเฟือง (Cog)' },
  { value: 'clock', label: 'นาฬิกา (Clock)' },
  { value: 'star', label: 'ดาว (Star)' },
  { value: 'cloud', label: 'ก้อนเมฆ (Cloud)' },
  { value: 'puzzle', label: 'ส่วนประกอบ (Puzzle)' },
  { value: 'sun', label: 'พระอาทิตย์ (Sun)' },
  { value: 'rain', label: 'ฝนตก (Rain)' },
  { value: 'snow', label: 'เกล็ดหิมะ (Snow)' },
  { value: 'lock', label: 'กุญแจ (Lock)' },
  { value: 'key', label: 'ลูกกุญแจ (Key)' },
  { value: 'home', label: 'บ้าน (Home)' },
  { value: 'office', label: 'อาคาร (Office)' },
  { value: 'tree', label: 'ต้นไม้ (Tree)' },
  { value: 'leaf', label: 'ใบไม้ (Leaf)' },
  { value: 'tools', label: 'เครื่องมือ (Tools)' },
  { value: 'wrench', label: 'ประแจ (Wrench)' },
  { value: 'hammer', label: 'ค้อน (Hammer)' },
  { value: 'lightning', label: 'สายฟ้า (Lightning)' },
  { value: 'fire', label: 'ไฟ (Fire)' },
  { value: 'water', label: 'หยดน้ำ (Water)' },
  { value: 'wind', label: 'ลม (Wind)' },
  { value: 'eye', label: 'ดวงตา (Eye)' },
  { value: 'heart', label: 'หัวใจ (Heart)' },
  { value: 'thumbs-up', label: 'ยอดเยี่ยม (Thumbs Up)' },
  { value: 'medal', label: 'เหรียญรางวัล (Medal)' },
  { value: 'tag', label: 'ป้ายราคา (Tag)' },
  { value: 'chart', label: 'กราฟ (Chart)' },
  { value: 'cube', label: 'กล่อง (Cube)' },
  { value: 'globe', label: 'โลก (Globe)' },
  { value: 'cash', label: 'เงินสด (Cash)' },
  { value: 'credit-card', label: 'บัตรเครดิต (Credit Card)' },
  { value: 'speakerphone', label: 'โทรโข่ง (Speaker)' },
  { value: 'chip', label: 'ชิป (Chip)' },
  { value: 'color-swatch', label: 'จานสี (Color)' }
]

const router = useRouter()
const route = useRoute()
const { showToast } = useToast()
const { showConfirm } = useConfirm()

const loading = ref(false)
const saving = ref(false)
const uploadingImage = ref(false)
const uploadingIcon = ref(false)

const editForm = ref({
  id: null,
  name: '',
  description: '',
  image_url: '',
  icon_url: '',
  is_active: true,
  features: { enabled: true, items: [] }
})

const isEditMode = ref(false)

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true
    await loadCategory(route.params.id)
  } else {
    // New mode, add one empty feature by default
    editForm.value.features = { enabled: true, items: [{ icon: 'check', name: '', description: '' }] }
    editForm.value.is_active = true
  }
})

const loadCategory = async (id) => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/categories/${id}`)
    const data = await res.json()
    if (data.success && data.data) {
      const cat = data.data
      let parsedFeatures = { enabled: true, items: [] }
      try {
        if (typeof cat.features === 'string') {
          const parsed = JSON.parse(cat.features)
          if (Array.isArray(parsed)) {
            parsedFeatures.items = parsed || []
          } else if (parsed && typeof parsed === 'object') {
            parsedFeatures.enabled = parsed.enabled !== false
            parsedFeatures.items = Array.isArray(parsed.items) ? parsed.items : []
          }
        } else if (Array.isArray(cat.features)) {
          parsedFeatures.items = [...cat.features]
        } else if (cat.features && typeof cat.features === 'object') {
          parsedFeatures.enabled = cat.features.enabled !== false
          parsedFeatures.items = Array.isArray(cat.features.items) ? cat.features.items : []
        }
      } catch (e) {}
      
      const isActive = cat.is_active !== undefined ? (cat.is_active === 1 || cat.is_active === true) : true
      editForm.value = { ...cat, is_active: isActive, features: parsedFeatures }
    } else {
      showToast('ไม่พบข้อมูลหมวดหมู่', 'error')
      router.push('/admin/categories')
    }
  } catch (error) {
    console.error('Fetch category error:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  } finally {
    loading.value = false
  }
}

const uploadImage = async (e) => {
  const file = e.target.files?.[0] || e.dataTransfer?.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    showToast('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'warning')
    return
  }

  uploadingImage.value = true
  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      editForm.value.image_url = '' + data.url
      showToast('อัปโหลดรูปภาพสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดล้มเหลว: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
    showToast('เกิดข้อผิดพลาดในการอัปโหลดภาพ', 'error')
  } finally {
    uploadingImage.value = false
    if (e.target.value) e.target.value = ''
  }
}

const handleDrop = (e) => {
  uploadImage(e);
}

const uploadIcon = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToast('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 'warning')
    return
  }
  uploadingIcon.value = true
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (data.success) {
      editForm.value.icon_url = '' + data.url
      showToast('อัปโหลดไอคอนสำเร็จ', 'success')
    } else {
      showToast('อัปโหลดล้มเหลว: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Icon Error:', error)
    showToast('เกิดข้อผิดพลาดในการอัปโหลดไอคอน', 'error')
  } finally {
    uploadingIcon.value = false
    if (e.target.value) e.target.value = ''
  }
}

const saveCategory = async () => {
  if (!editForm.value.name.trim()) {
    showToast('กรุณากรอกชื่อหมวดหมู่', 'warning')
    return
  }
  
  saving.value = true
  const url = isEditMode.value ? `/api/categories/${editForm.value.id}` : '/api/categories'
  const method = isEditMode.value ? 'PUT' : 'POST'

  try {
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(editForm.value)
    })
    const data = await res.json()
    if (data.success) {
      showToast(isEditMode.value ? 'อัปเดตข้อมูลหมวดหมู่เรียบร้อยแล้ว' : 'เพิ่มหมวดหมู่สินค้าเรียบร้อยแล้ว', 'success')
      if (!isEditMode.value && data.data && data.data.id) {
        editForm.value.id = data.data.id
        isEditMode.value = true
        router.replace(`/admin/categories/${data.data.id}/edit`)
      }
    } else {
      showToast(data.error || 'Failed to save category', 'error')
    }
  } catch (error) {
    console.error('Save category error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error')
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/admin/categories')
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-12">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <router-link to="/admin/categories" class="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
      </router-link>
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <svg class="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          {{ isEditMode ? 'แก้ไขข้อมูลหมวดหมู่' : 'เพิ่มหมวดหมู่สินค้าใหม่' }}
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          {{ isEditMode ? 'อัปเดตรายละเอียด รูปภาพ และคุณสมบัติเด่นของหมวดหมู่' : 'สร้างหมวดหมู่ใหม่เพื่อใช้ในการจัดกลุ่มสินค้า' }}
        </p>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
      <svg class="animate-spin h-8 w-8 text-emerald-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      กำลังโหลดข้อมูล...
    </div>

    <form v-else @submit.prevent="saveCategory" class="space-y-6">
      
      <!-- Basic Info Section -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 class="font-bold text-gray-900 text-lg">ข้อมูลพื้นฐาน</h2>
          <p class="text-sm text-gray-500">ชื่อและคำอธิบายหมวดหมู่</p>
        </div>
        <div class="p-8 space-y-6">
          <!-- Name -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">ชื่อหมวดหมู่ <span class="text-red-500">*</span></label>
            <input v-model="editForm.name" type="text" required placeholder="เช่น Greenhouses" class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow">
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">รายละเอียด (คำอธิบายสั้นๆ)</label>
            <textarea v-model="editForm.description" rows="3" placeholder="พิมพ์คำอธิบายประกอบ..." class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-shadow"></textarea>
          </div>

          <!-- Status Toggle -->
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200/60">
            <div>
              <span class="block text-sm font-bold text-gray-900">การแสดงผลหมวดหมู่สินค้า</span>
              <span class="block text-xs text-gray-500 mt-0.5">เปิด-ปิดการแสดงผลหมวดหมู่นี้และสินค้าทั้งหมดในหมวดหมู่บนหน้าเว็บ</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" v-model="editForm.is_active" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span class="ml-3 text-sm font-bold" :class="editForm.is_active ? 'text-emerald-600' : 'text-slate-400'">{{ editForm.is_active ? 'แสดงผล' : 'ไม่แสดงผล' }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Media Section -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 class="font-bold text-gray-900 text-lg">รูปภาพและไอคอน</h2>
          <p class="text-sm text-gray-500">สำหรับแสดงผลในหน้าหลักและหน้ารายการสินค้า</p>
        </div>
        <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Icon Upload -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3">ไอคอนหมวดหมู่ <span class="text-gray-400 font-normal">(PNG พื้นโปร่งใส)</span></label>
            <div class="flex items-center gap-4">
              <div class="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800 hover:bg-slate-700 transition-colors overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                <img v-if="editForm.icon_url" :src="editForm.icon_url" class="w-full h-full object-contain p-3 transition-transform group-hover:scale-110">
                <svg v-else class="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                <input type="file" accept="image/*" @change="uploadIcon" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" :disabled="uploadingIcon">
              </div>
              <div class="flex-1 text-sm">
                <div v-if="uploadingIcon" class="text-emerald-500 font-medium">กำลังอัปโหลด...</div>
                <div v-else-if="editForm.icon_url" class="flex flex-col gap-1.5">
                  <span class="text-emerald-600 font-bold">อัปโหลดสำเร็จ</span>
                  <button type="button" @click="editForm.icon_url = ''" class="inline-flex w-max text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors">ลบไอคอน</button>
                </div>
                <div v-else class="text-gray-500 leading-relaxed">คลิกที่กล่องเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง<br><span class="text-xs text-gray-400">ขนาดแนะนำ: 120x120px</span></div>
              </div>
            </div>
          </div>

          <!-- Cover Image Upload -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-3">รูปหน้าปก (Cover Image)</label>
            <div 
              class="relative group w-full border-2 border-dashed rounded-2xl transition-all duration-200"
              :class="editForm.image_url ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50'"
              @dragover.prevent
              @drop.prevent="handleDrop"
            >
              <input type="file" id="file-upload" accept="image/*" @change="uploadImage" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="uploadingImage">
              
              <div class="p-6 text-center flex flex-col items-center justify-center min-h-[140px]">
                <!-- Preview State -->
                <template v-if="editForm.image_url && !uploadingImage">
                  <div class="relative w-full h-32 rounded-xl shadow-sm overflow-hidden bg-white mb-3">
                    <img :src="editForm.image_url" class="w-full h-full object-cover">
                  </div>
                  <button type="button" @click.stop="editForm.image_url = ''" class="text-xs text-red-500 hover:text-red-700 font-bold z-20 relative px-3 py-1.5 rounded hover:bg-red-50 transition-colors">ลบรูปภาพหน้าปก</button>
                </template>

                <!-- Loading State -->
                <template v-else-if="uploadingImage">
                  <svg class="animate-spin h-8 w-8 text-emerald-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="text-sm font-bold text-gray-500">กำลังอัปโหลด...</div>
                </template>

                <!-- Empty State -->
                <template v-else>
                  <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-110 transition-transform">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                  <div class="text-sm">
                    <span class="font-bold text-emerald-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                  </div>
                </template>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Features Section -->
      <div class="bg-white rounded-3xl shadow-sm border border-gray-100">
        <div class="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-3xl">
          <div>
            <h2 class="font-bold text-gray-900 text-lg">คุณสมบัติเด่น (Features)</h2>
            <p class="text-sm text-gray-500">แถบยาวด้านล่างรายการสินค้าในหน้าหลัก (ควรมี 3-5 รายการ)</p>
          </div>
          <div class="flex items-center gap-4 flex-wrap">
            <label class="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" v-model="editForm.features.enabled" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span class="ml-3 text-sm font-bold" :class="editForm.features.enabled ? 'text-emerald-600' : 'text-slate-400'">{{ editForm.features.enabled ? 'เปิดแสดงผล' : 'ปิดแสดงผล' }}</span>
            </label>
            <button type="button" @click="editForm.features.items.push({ icon: 'check', name: '', description: '' })" :disabled="!editForm.features.enabled" class="inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-sm font-bold rounded-xl transition-colors disabled:opacity-50">
              <svg class="w-5 h-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มคุณสมบัติ
            </button>
          </div>
        </div>

        <div v-if="!editForm.features.enabled" class="text-center py-12 bg-gray-50 border-2 border-gray-200 border-dashed rounded-b-3xl">
          <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
          <p class="text-sm font-bold text-gray-500">การแสดงผลคุณสมบัติเด่นถูกปิดอยู่</p>
          <p class="text-xs text-gray-400 mt-1">เปิดสวิตช์ด้านบนเพื่อแก้ไขและแสดงฟีเจอร์ในหน้าหมวดหมู่</p>
        </div>

        <div v-else class="p-8">
          <div class="space-y-4">
            <transition-group name="list" tag="div" class="space-y-4">
              <div v-for="(feat, idx) in editForm.features.items" :key="idx" :style="{ zIndex: 50 - idx }" class="flex flex-col sm:flex-row gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-200/60 relative group hover:border-emerald-200 transition-colors">
                
                <div class="w-full sm:w-64 shrink-0">
                  <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">ไอคอน (Icon)</label>
                  <IconSelect v-model="feat.icon" :options="iconOptions" />
                </div>
                
                <div class="flex-1 space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">หัวข้อคุณสมบัติ <span class="text-red-400">*</span></label>
                    <input v-model="feat.name" type="text" placeholder="เช่น วัสดุ HDPE เกรดพรีเมียม" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-gray-900 shadow-sm" required>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">คำอธิบายเพิ่มเติม</label>
                    <input v-model="feat.description" type="text" placeholder="เช่น แข็งแรง ทนแดด ทนฝน (เว้นว่างได้)" class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-600 shadow-sm">
                  </div>
                </div>

                <button type="button" @click="editForm.features.items.splice(idx, 1)" class="absolute -top-3 -right-3 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full shadow-sm border border-gray-200 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="ลบรายการนี้">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </transition-group>

            <div v-if="!editForm.features.items || editForm.features.items.length === 0" class="text-center py-12 bg-gray-50 border-2 border-gray-200 border-dashed rounded-2xl flex flex-col items-center justify-center">
              <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              <h3 class="text-sm font-bold text-gray-900 mb-1">ยังไม่มีคุณสมบัติเด่น</h3>
              <p class="text-xs text-gray-500 mb-4">หมวดหมู่นี้จะไม่มีแถบฟีเจอร์ด้านล่างในหน้าหลัก</p>
              <button type="button" @click="editForm.features.items.push({ icon: 'check', name: '', description: '' })" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50">
                เพิ่มคุณสมบัติแรก
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Action Bar -->
      <div class="sticky bottom-4 bg-white/80 backdrop-blur-xl py-4 px-6 flex items-center justify-end gap-3 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06),0_10px_20px_rgba(0,0,0,0.04)] mt-12 rounded-[2rem] border border-slate-200/80 transition-all group hover:border-emerald-200">
        <button type="button" @click="cancel" class="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          ยกเลิก
        </button>
        <button type="submit" :disabled="saving" class="px-8 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center">
          <svg v-if="saving" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          {{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลหมวดหมู่' }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
