<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const categories = ref([])
const loading = ref(false)
const togglingId = ref(null)
// Attribute Modal State
const isAttrModalOpen = ref(false)
const currentCategoryForAttr = ref(null)
const categoryAttributes = ref([])
const attrLoading = ref(false)
const attrSaving = ref(false)
const attrForm = ref({
  id: null,
  attribute_key: '',
  attribute_label: '',
  is_required: false,
  attribute_type: 'text',
  options: ''
})

const openAttrModal = (cat) => {
  currentCategoryForAttr.value = cat
  isAttrModalOpen.value = true
  loadCategoryAttributes(cat.name)
}

const closeAttrModal = () => {
  isAttrModalOpen.value = false
  currentCategoryForAttr.value = null
  categoryAttributes.value = []
  resetAttrForm()
}

const resetAttrForm = () => {
  attrForm.value = {
    id: null,
    attribute_key: '',
    attribute_label: '',
    is_required: false,
    attribute_type: 'text',
    options: ''
  }
}

const loadCategoryAttributes = async (categoryName) => {
  attrLoading.value = true
  try {
    const res = await apiFetch(`/api/category-attributes/${encodeURIComponent(categoryName)}`)
    const data = await res.json()
    if (data.success) {
      categoryAttributes.value = data.data.map(attr => ({
        ...attr,
        options: attr.options ? JSON.parse(attr.options).join(', ') : ''
      }))
    }
  } catch (error) {
    console.error('Fetch attributes error:', error)
  } finally {
    attrLoading.value = false
  }
}

const editAttribute = (attr) => {
  attrForm.value = { ...attr }
}

const saveAttribute = async () => {
  if (!attrForm.value.attribute_key.trim() || !attrForm.value.attribute_label.trim()) {
    showToast('กรุณากรอก Key และ Label', 'warning')
    return
  }
  
  attrSaving.value = true
  const isEdit = !!attrForm.value.id
  const url = isEdit ? `/api/category-attributes/${attrForm.value.id}` : '/api/category-attributes'
  const method = isEdit ? 'PUT' : 'POST'
  
  const payload = {
    category_name: currentCategoryForAttr.value.name,
    attribute_key: attrForm.value.attribute_key,
    attribute_label: attrForm.value.attribute_label,
    is_required: attrForm.value.is_required,
    attribute_type: attrForm.value.attribute_type,
    options: attrForm.value.attribute_type === 'select' && attrForm.value.options ? attrForm.value.options.split(',').map(s => s.trim()) : null
  }

  try {
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) })
    const data = await res.json()
    if (data.success) {
      showToast(isEdit ? 'อัปเดต Attribute แล้ว' : 'เพิ่ม Attribute แล้ว', 'success')
      resetAttrForm()
      await loadCategoryAttributes(currentCategoryForAttr.value.name)
    } else {
      showToast(data.error || 'Failed to save attribute', 'error')
    }
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    attrSaving.value = false
  }
}

const deleteAttribute = async (attr) => {
  const isConfirmed = await showConfirm({
    title: `ลบ Attribute`,
    message: `แน่ใจหรือไม่ที่จะลบ "${attr.attribute_label}"?`,
    confirmText: 'ลบ',
    type: 'danger'
  })
  if (!isConfirmed) return
  
  try {
    const res = await apiFetch(`/api/category-attributes/${attr.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('ลบ Attribute แล้ว', 'success')
      await loadCategoryAttributes(currentCategoryForAttr.value.name)
      if (attrForm.value.id === attr.id) resetAttrForm()
    }
  } catch (error) {
    showToast('Error deleting attribute', 'error')
  }
}

const onAttrReorder = async () => {
  const orderedIds = categoryAttributes.value.map(a => a.id)
  try {
    const res = await apiFetch('/api/category-attributes/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds })
    })
    const data = await res.json()
    if (data.success) showToast('ลำดับถูกอัปเดต', 'success')
  } catch (error) {
    showToast('Error reordering', 'error')
  }
}

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/categories')
    const data = await res.json()
    if (data.success) {
      categories.value = data.data
    }
  } catch (error) {
    console.error('Fetch categories error:', error)
  } finally {
    loading.value = false
  }
}

const deleteCategory = async (cat) => {
  const isConfirmed = await showConfirm({
    title: `ลบหมวดหมู่สินค้า "${cat.name}"`,
    message: `คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ "${cat.name}"? การลบหมวดหมู่ไม่สามารถกู้คืนได้`,
    confirmText: 'ลบหมวดหมู่',
    type: 'danger'
  })
  
  if (!isConfirmed) return
  
  try {
    const res = await apiFetch(`/api/categories/${cat.id}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (data.success) {
      showToast('ลบหมวดหมู่เรียบร้อยแล้ว', 'success')
      await loadCategories()
    } else {
      showToast('ลบข้อมูลไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Delete category error:', error)
    showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
  }
}

const toggleActive = async (cat) => {
  if (togglingId.value) return
  togglingId.value = cat.id
  const newStatus = !(cat.is_active === 1 || cat.is_active === true)
  try {
    const res = await apiFetch(`/api/categories/${cat.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: cat.name,
        description: cat.description,
        image_url: cat.image_url,
        icon_url: cat.icon_url,
        features: cat.features ? (typeof cat.features === 'string' ? JSON.parse(cat.features) : cat.features) : null,
        is_active: newStatus
      })
    })
    const data = await res.json()
    if (data.success) {
      cat.is_active = newStatus
      showToast(newStatus ? 'เปิดแสดงผลสำเร็จ' : 'ปิดการแสดงผลสำเร็จ', 'success')
    } else {
      showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Update category error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    togglingId.value = null
  }
}

const onReorderEnd = async () => {
  const orderedIds = categories.value.map(cat => cat.id)
  try {
    const res = await apiFetch('/api/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds })
    })
    const data = await res.json()
    if (!data.success) {
      showToast('บันทึกลำดับไม่สำเร็จ', 'error')
      await loadCategories()
    } else {
      showToast('อัปเดตลำดับหมวดหมู่เรียบร้อย', 'success')
    }
  } catch (error) {
    console.error('Reorder error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error')
    await loadCategories()
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="h-full flex flex-col relative">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการหมวดหมู่สินค้า</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">เพิ่ม ลบ หรือแก้ไขข้อมูลและรูปภาพหมวดหมู่สินค้า
          <InfoTooltip title="หมวดหมู่คืออะไร?" description="หมวดหมู่ใช้จัดกลุ่มสินค้าบนหน้าเว็บเพื่อให้ลูกค้าค้นหาสินค้าได้ง่ายขึ้น<ul><li><strong>ลากจัดเรียง:</strong> ลากแถวเพื่อจัดลำดับการแสดงผลบนหน้าเว็บ</li><li><strong>คุณสมบัติ (Attributes):</strong> ตั้งแม่แบบสเปกประจำหมวด (เช่น ขนาด, วัสดุ) เมื่อเพิ่มสินค้าใหม่จะมีช่องกรอกสเปกให้อัตโนมัติ</li><li><strong>ไอคอน:</strong> แนะนำ PNG พื้นหลังโปร่งใส เพื่อให้แสดงผลสวยงามบนหน้าเว็บ</li></ul>" />
        </p>
      </div>
      <router-link to="/admin/categories/new" class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors">
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        เพิ่มหมวดหมู่ใหม่
      </router-link>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
      <div v-if="loading" class="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-xs uppercase tracking-widest text-gray-500 border-b border-gray-200">
              <th class="px-4 py-4 font-bold w-12 text-center" title="ลากเพื่อจัดลำดับ"></th>
              <th class="px-6 py-4 font-bold">ไอคอน</th>
              <th class="px-6 py-4 font-bold">รูปหน้าปก</th>
              <th class="px-6 py-4 font-bold">ชื่อหมวดหมู่ / รายละเอียด</th>
              <th class="px-6 py-4 font-bold text-center">การแสดงผล</th>
              <th class="px-6 py-4 font-bold text-right">จัดการ</th>
            </tr>
          </thead>
          <draggable 
            v-model="categories" 
            tag="tbody" 
            class="divide-y divide-gray-100" 
            item-key="id" 
            @end="onReorderEnd"
            handle=".drag-handle"
            :animation="250"
            ghost-class="category-ghost"
            drag-class="category-drag"
          >
            <template #item="{ element: cat }">
              <tr class="hover:bg-gray-50/50 transition-colors bg-white">
                <td class="px-4 py-4 text-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 drag-handle" title="คลิกค้างไว้เพื่อลากจัดลำดับ">
                  <svg class="w-6 h-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                </td>
                <td class="px-6 py-4 w-20">
                  <div class="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center">
                     <img v-if="cat.icon_url" :src="cat.icon_url" class="w-full h-full object-contain p-1">
                     <svg v-else class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </td>
                <td class="px-6 py-4 w-24">
                  <div class="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                     <img v-if="cat.image_url" :src="cat.image_url" class="w-full h-full object-cover">
                     <svg v-else class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-bold text-gray-900 text-base mb-1">{{ cat.name }}</div>
                  <div class="text-sm text-gray-500 line-clamp-2 max-w-md">{{ cat.description || 'ไม่มีคำอธิบาย...' }}</div>
                </td>
                <td class="px-6 py-4 text-center">
                  <button 
                    @click="toggleActive(cat)" 
                    :disabled="togglingId === cat.id"
                    class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    :class="(cat.is_active === 1 || cat.is_active === true) ? 'bg-emerald-500' : 'bg-gray-200'"
                    :title="(cat.is_active === 1 || cat.is_active === true) ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดงผล'"
                  >
                    <span 
                      aria-hidden="true" 
                      class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="(cat.is_active === 1 || cat.is_active === true) ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </button>
                </td>
                <td class="px-6 py-4 flex justify-end gap-2">
                  <button @click="openAttrModal(cat)" class="inline-flex items-center justify-center px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs rounded-xl transition-colors">
                    <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                    คุณสมบัติ
                  </button>
                  <router-link :to="'/admin/categories/' + cat.id + '/edit'" class="inline-flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors">
                    <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    แก้ไข
                  </router-link>
                  <button @click="deleteCategory(cat)" class="inline-flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition-colors">
                    <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    ลบ
                  </button>
                </td>
              </tr>
            </template>
            <tr v-if="categories.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-500">ไม่มีข้อมูลหมวดหมู่ กรุณาเพิ่มหมวดหมู่ใหม่</td>
            </tr>
          </draggable>
        </table>
      </div>
    </div>

    <!-- Attribute Manager Modal -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isAttrModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" @click="closeAttrModal"></div>

        <!-- Modal Panel -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
          enter-to-class="scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="scale-100 opacity-100 translate-y-0"
          leave-to-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
        >
          <div v-if="isAttrModalOpen" class="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-4xl overflow-hidden transform transition-all border border-gray-100 flex flex-col max-h-[90vh]">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
                <svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                คุณสมบัติ (Attributes): <span class="text-indigo-600">{{ currentCategoryForAttr?.name }}</span>
              </h3>
              <button @click="closeAttrModal" class="p-2 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div class="flex flex-col lg:flex-row gap-6 overflow-hidden flex-1 min-h-[400px]">
              <!-- List -->
              <div class="flex-1 overflow-y-auto bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div v-if="attrLoading" class="text-center py-8 text-gray-500">กำลังโหลด...</div>
                <div v-else-if="categoryAttributes.length === 0" class="text-center py-8 text-gray-500 text-sm bg-white rounded-lg border border-dashed border-gray-300">ยังไม่มีแม่แบบคุณสมบัติสำหรับหมวดหมู่นี้<br>การเพิ่ม Template จะช่วยให้หน้าเปรียบเทียบเรียงสวยงามขึ้น</div>
                <draggable v-else v-model="categoryAttributes" :animation="200" handle=".drag-handle" item-key="id" @end="onAttrReorder" class="space-y-2">
                  <template #item="{ element }">
                    <div class="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm group">
                      <div class="cursor-grab drag-handle text-gray-400 hover:text-gray-600" title="คลิกค้างเพื่อลากสลับลำดับ"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg></div>
                      <div class="flex-1 min-w-0">
                        <div class="font-bold text-gray-900 text-sm flex items-center gap-2">
                          {{ element.attribute_label }}
                          <span v-if="element.is_required" class="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">จำเป็น</span>
                        </div>
                        <div class="text-xs text-gray-500 font-mono mt-0.5">{{ element.attribute_key }} <span class="mx-1 text-gray-300">|</span> {{ element.attribute_type }}</div>
                      </div>
                      <div class="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                        <button type="button" @click="editAttribute(element)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                        <button type="button" @click="deleteAttribute(element)" class="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
              
              <!-- Form -->
              <div class="w-full lg:w-80 bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-y-auto shrink-0">
                <h4 class="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">{{ attrForm.id ? 'แก้ไขคุณสมบัติ' : 'เพิ่มคุณสมบัติใหม่' }}</h4>
                <form @submit.prevent="saveAttribute" class="space-y-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5">ชื่อคุณสมบัติ (Label) <span class="text-red-500">*</span></label>
                    <input v-model="attrForm.attribute_label" type="text" required placeholder="เช่น รุ่น, ซีรีส์, ความกว้าง" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1.5">รหัสคุณสมบัติ (Key - ภาษาอังกฤษ) <span class="text-red-500">*</span></label>
                    <input v-model="attrForm.attribute_key" type="text" required placeholder="เช่น series, width_cm" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-mono outline-none" :disabled="attrForm.id !== null && false">
                    <p class="text-[10px] text-gray-500 mt-1">ตัวพิมพ์เล็ก ไม่มีเว้นวรรค เช่น model, width, origin</p>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1.5">ประเภทข้อมูล</label>
                      <select v-model="attrForm.attribute_type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                        <option value="text">ข้อความทั่วไป</option>
                        <option value="number">ตัวเลข (Number)</option>
                        <option value="select">ตัวเลือก (Select)</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1.5">&nbsp;</label>
                      <label class="flex items-center gap-2 mt-2 cursor-pointer">
                        <input type="checkbox" v-model="attrForm.is_required" class="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer">
                        <span class="text-sm text-gray-700 font-medium select-none">บังคับต้องระบุ</span>
                      </label>
                    </div>
                  </div>
                  <div v-if="attrForm.attribute_type === 'select'" class="animate-fade-in">
                    <label class="block text-xs font-bold text-gray-700 mb-1.5">ตัวเลือก (คั่นด้วยเครื่องหมายลูกน้ำ)</label>
                    <input v-model="attrForm.options" type="text" placeholder="เช่น แดง, น้ำเงิน, ดำ หรือ S, M, L" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  </div>
                  <div class="pt-4 flex gap-2 border-t border-gray-100 mt-6">
                    <button v-if="attrForm.id" type="button" @click="resetAttrForm" class="flex-1 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-bold rounded-xl transition-colors">ยกเลิกดารแก้ไข</button>
                    <button type="submit" :disabled="attrSaving" class="flex-1 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50">
                      {{ attrSaving ? 'กำลังบันทึก...' : (attrForm.id ? 'อัปเดตข้อมูล' : 'เพิ่มคุณสมบัติ') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

  </div>
</template>

<style scoped>
/* Ghost class applies to the original spot indicating where item will be dropped */
.category-ghost {
  opacity: 0.4;
  background-color: #ecfdf5 !important; /* emerald-50 */
}

/* Drag class applies to the element currently being moving */
.category-drag {
  opacity: 1 !important;
  background-color: #ffffff;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
</style>
