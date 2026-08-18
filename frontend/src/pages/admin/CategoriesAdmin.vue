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
const aiGeneratingTemplates = ref(false)

const COMMON_ATTRIBUTE_PRESETS = [
  { label: 'รุ่นสินค้า', key: 'model', type: 'text', required: true },
  { label: 'ขนาดสายไฟที่รองรับ', key: 'wire_size_range', type: 'text', required: true },
  { label: 'ความยาวในการตัด', key: 'cutting_length', type: 'text', required: false },
  { label: 'ความยาวปอกสายไฟ', key: 'strip_length', type: 'text', required: false },
  { label: 'แรงอัดย้ำ', key: 'crimping_force', type: 'text', required: false },
  { label: 'แหล่งจ่ายไฟ', key: 'power_supply', type: 'text', required: false },
  { label: 'กำลังไฟฟ้า', key: 'power_consumption', type: 'text', required: false },
  { label: 'ขนาดตัวเครื่อง (กxลxส)', key: 'machine_dimensions', type: 'text', required: false },
  { label: 'น้ำหนักตัวเครื่อง', key: 'machine_weight', type: 'text', required: false }
]

const applyPreset = (preset) => {
  attrForm.value.attribute_label = preset.label
  attrForm.value.attribute_key = preset.key
  attrForm.value.attribute_type = preset.type || 'text'
  attrForm.value.is_required = preset.required || false
}

const isAiAttrModalOpen = ref(false)
const aiCustomText = ref('')

const openAiAttrModal = () => {
  aiCustomText.value = ''
  isAiAttrModalOpen.value = true
}

const closeAiAttrModal = () => {
  isAiAttrModalOpen.value = false
  aiCustomText.value = ''
}

const submitAiGenerateAttributes = async () => {
  if (!currentCategoryForAttr.value) return

  aiGeneratingTemplates.value = true
  try {
    const res = await apiFetch('/api/category-attributes/ai-generate-template', {
      method: 'POST',
      body: JSON.stringify({ 
        category_name: currentCategoryForAttr.value.name,
        custom_text: aiCustomText.value.trim()
      })
    })
    const data = await res.json()
    if (data.success) {
      showToast(`AI สร้างแม่แบบสเปกสำเร็จ (${data.data.length} รายการ)`, 'success')
      closeAiAttrModal()
      await loadCategoryAttributes(currentCategoryForAttr.value.name)
    } else {
      showToast(data.error || 'ไม่สามารถสร้างแม่แบบได้', 'error')
    }
  } catch (error) {
    console.error('AI Generate templates error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingTemplates.value = false
  }
}

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
        <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" @click="closeAttrModal"></div>

        <!-- Modal Panel -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
          enter-to-class="scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="scale-100 opacity-100 translate-y-0"
          leave-to-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
        >
          <div v-if="isAttrModalOpen" class="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-5xl overflow-hidden transform transition-all border border-gray-100 flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-4">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-black text-gray-900">แม่แบบคุณสมบัติ (Attributes Template)</h3>
                    <span class="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">{{ currentCategoryForAttr?.name }}</span>
                    <span v-if="categoryAttributes.length > 0" class="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">{{ categoryAttributes.length }} สเปก</span>
                  </div>
                  <p class="text-xs text-gray-500 mt-0.5">กำหนดหัวข้อสเปกมาตรฐานของหมวดนี้ เพื่อให้หน้าเพิ่มสินค้าและตารางเปรียบเทียบสเปกเป็นระเบียบ</p>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <button 
                  type="button" 
                  @click="openAiAttrModal" 
                  :disabled="aiGeneratingTemplates || attrLoading"
                  class="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  title="ให้ AI ช่วยสร้างแม่แบบสเปกมาตรฐานที่ตรงกับหมวดหมู่นี้อัตโนมัติ"
                >
                  <svg v-if="aiGeneratingTemplates" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span>{{ aiGeneratingTemplates ? 'AI กำลังสร้าง...' : 'AI สร้างแม่แบบอัตโนมัติ' }}</span>
                </button>

                <button @click="closeAttrModal" class="p-2 text-gray-400 hover:text-gray-600 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div class="flex flex-col lg:flex-row gap-6 overflow-hidden flex-1 min-h-[460px]">
              <!-- List Panel -->
              <div class="flex-1 min-w-0 overflow-y-auto bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4">
                <div v-if="attrLoading" class="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-2">
                  <svg class="w-6 h-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>กำลังโหลดรายการคุณสมบัติ...</span>
                </div>

                <div v-else-if="categoryAttributes.length === 0" class="text-center py-12 px-6 bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center">
                  <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </div>
                  <h4 class="text-sm font-bold text-slate-800 mb-1">ยังไม่มีแม่แบบคุณสมบัติสำหรับหมวดหมู่นี้</h4>
                  <p class="text-xs text-slate-500 max-w-sm mb-4">การเพิ่มแม่แบบสเปกจะช่วยให้หน้าเพิ่มสินค้าและตารางเปรียบเทียบแสดงผลตรงตามมาตรฐานอุตสาหกรรม</p>
                  <button 
                    type="button" 
                    @click="openAiAttrModal" 
                    :disabled="aiGeneratingTemplates"
                    class="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <span>สร้างแม่แบบอัตโนมัติด้วย AI</span>
                  </button>
                </div>

                <div v-else class="space-y-2">
                  <div class="flex items-center justify-between text-xs text-slate-500 px-2 pb-1 font-semibold">
                    <span>ลากเพื่อเรียงลำดับการแสดงผล</span>
                    <span>{{ categoryAttributes.length }} รายการ</span>
                  </div>

                  <draggable v-model="categoryAttributes" :animation="200" handle=".drag-handle" item-key="id" @end="onAttrReorder" class="space-y-2">
                    <template #item="{ element, index }">
                      <div class="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all group">
                        <div class="cursor-grab drag-handle text-slate-300 hover:text-slate-600 p-1 shrink-0" title="คลิกค้างเพื่อลากสลับลำดับ">
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                        </div>
                        <span class="text-xs font-mono font-bold text-slate-400 w-5 text-center shrink-0">{{ index + 1 }}</span>
                        <div class="flex-1 min-w-0">
                          <div class="font-bold text-slate-800 text-sm flex items-center gap-2">
                            <span>{{ element.attribute_label }}</span>
                            <span v-if="element.is_required" class="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded font-bold">จำเป็น</span>
                          </div>
                          <div class="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <span class="text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded text-[11px] font-semibold">{{ element.attribute_key }}</span>
                            <span class="text-slate-300">•</span>
                            <span class="text-slate-400 text-[11px]">{{ element.attribute_type }}</span>
                          </div>
                        </div>
                        <div class="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                          <button type="button" @click="editAttribute(element)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                          <button type="button" @click="deleteAttribute(element)" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="ลบ">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
              
              <!-- Form Panel -->
              <div class="w-full lg:w-96 shrink-0 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-y-auto flex flex-col justify-between">
                <div>
                  <h4 class="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                    <span class="flex items-center gap-1.5">
                      <svg v-if="attrForm.id" class="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      <svg v-else class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                      {{ attrForm.id ? 'แก้ไขคุณสมบัติ' : 'เพิ่มคุณสมบัติใหม่' }}
                    </span>
                    <button v-if="attrForm.id" type="button" @click="resetAttrForm" class="text-xs text-indigo-600 hover:underline font-normal">เพิ่มใหม่</button>
                  </h4>

                  <!-- Presets -->
                  <div v-if="!attrForm.id" class="mb-4">
                    <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">แม่แบบแนะนำด่วน:</label>
                    <div class="flex flex-wrap gap-1.5">
                      <button 
                        v-for="p in COMMON_ATTRIBUTE_PRESETS" 
                        :key="p.key"
                        type="button" 
                        @click="applyPreset(p)"
                        class="text-[11px] px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg transition-colors border border-slate-200/60 font-medium"
                      >
                        + {{ p.label }}
                      </button>
                    </div>
                  </div>

                  <form @submit.prevent="saveAttribute" class="space-y-3.5">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">ชื่อคุณสมบัติ (Label ภาษาไทย) <span class="text-rose-500">*</span></label>
                      <input v-model="attrForm.attribute_label" type="text" required placeholder="เช่น รุ่นสินค้า, ขนาดสายไฟ (sq mm)" class="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>รหัสคุณสมบัติ (Key - ภาษาอังกฤษ) <span class="text-rose-500">*</span></span>
                      </label>
                      <input v-model="attrForm.attribute_key" type="text" required placeholder="เช่น model, wire_size, cutting_length" class="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono outline-none transition-all">
                      <p class="text-[10px] text-slate-400 mt-1">ใช้ตัวพิมพ์เล็กและขีดล่าง เช่น model, wire_size, power_supply</p>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">ประเภทข้อมูล</label>
                        <select v-model="attrForm.attribute_type" class="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                          <option value="text">ข้อความทั่วไป (Text)</option>
                          <option value="number">ตัวเลข (Number)</option>
                          <option value="select">ตัวเลือก (Select)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1">&nbsp;</label>
                        <label class="flex items-center gap-2 mt-1.5 cursor-pointer">
                          <input type="checkbox" v-model="attrForm.is_required" class="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer">
                          <span class="text-xs text-slate-700 font-medium select-none">สเปกสำคัญ</span>
                        </label>
                      </div>
                    </div>
                    <div v-if="attrForm.attribute_type === 'select'">
                      <label class="block text-xs font-bold text-slate-700 mb-1">ตัวเลือก (คั่นด้วยเครื่องหมายจุลภาค)</label>
                      <input v-model="attrForm.options" type="text" placeholder="เช่น 220V, 380V หรือ Single, Dual" class="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                    </div>
                    <div class="pt-3 flex gap-2 border-t border-slate-100 mt-4">
                      <button v-if="attrForm.id" type="button" @click="resetAttrForm" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">ยกเลิก</button>
                      <button type="submit" :disabled="attrSaving" class="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50">
                        {{ attrSaving ? 'กำลังบันทึก...' : (attrForm.id ? 'อัปเดตสเปก' : 'เพิ่มคุณสมบัติ') }}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- AI Attribute Extraction Modal -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isAiAttrModalOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity" @click="closeAiAttrModal"></div>

        <!-- Modal Panel -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
          enter-to-class="scale-100 opacity-100 translate-y-0"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="scale-100 opacity-100 translate-y-0"
          leave-to-class="scale-95 opacity-0 translate-y-4 sm:translate-y-0"
        >
          <div class="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-xl overflow-hidden transform transition-all border border-gray-100">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-2xl shadow-sm">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div>
                  <h3 class="text-base font-black text-gray-900 flex items-center gap-2">
                    <span>AI สกัดสเปกและสร้างแม่แบบอัตโนมัติ</span>
                  </h3>
                  <span class="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">หมวดหมู่: {{ currentCategoryForAttr?.name }}</span>
                </div>
              </div>
              <button @click="closeAiAttrModal" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div class="space-y-4">
              <div class="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
                <svg class="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span><strong class="font-bold">คำแนะนำ:</strong> หากคุณมีข้อมูลสเปกสินค้า, แคตตาล็อก, โบรชัวร์ หรือข้อความภาษาไทย/อังกฤษ สามารถนำมาวางในช่องด้านล่างได้เลย AI จะวิเคราะห์และสกัดคุณสมบัติทางเทคนิคออกมาเป็นแม่แบบให้อัตโนมัติ (หรือหากปล่อยว่างไว้ AI จะวิเคราะห์จากชื่อหมวดและสินค้าในระบบ)</span>
              </div>

              <div>
                <label class="block text-xs font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>ข้อมูลสินค้า / โบรชัวร์ / ข้อความสเปกตัวอย่าง (ไม่บังคับ)</span>
                  <span class="text-[11px] text-gray-400 font-normal">รองรับทั้งไทยและอังกฤษ</span>
                </label>
                <textarea
                  v-model="aiCustomText"
                  rows="6"
                  placeholder="วางข้อมูลสเปกสินค้า เช่น:&#10;Model: KODERA C371G&#10;Wire Size: 0.08 - 10 sq mm / AWG#7 - #28&#10;Cutting Length: 0.1 - 99999 mm&#10;Stripping Length: Front 0.1-30mm, Rear 0.1-70mm&#10;Blade Material: Tungsten Carbide&#10;Power Supply: AC 220V 50/60Hz 450W&#10;Dimensions: 550 x 500 x 400 mm&#10;Weight: 45 kg"
                  class="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono outline-none transition-all placeholder:text-slate-400"
                ></textarea>
              </div>

              <div class="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  @click="closeAiAttrModal"
                  :disabled="aiGeneratingTemplates"
                  class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  @click="submitAiGenerateAttributes"
                  :disabled="aiGeneratingTemplates"
                  class="flex-2 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg v-if="aiGeneratingTemplates" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <span>{{ aiGeneratingTemplates ? 'AI กำลังวิเคราะห์และสกัดข้อมูล...' : 'สกัดและสร้างแม่แบบด้วย AI' }}</span>
                </button>
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
