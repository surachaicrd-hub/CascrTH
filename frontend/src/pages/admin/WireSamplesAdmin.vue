<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from '../../composables/useToast'
import { apiFetch } from '../../utils/apiFetch'
import WireSample from '../../components/ui/WireSample.vue'
import { 
  svgTemplateOptions, 
  defaultWireTypeGroups, 
  defaultWirePresets, 
  parseWireTypeGroups, 
  parseWirePresets,
  getWireSampleTitle 
} from '../../utils/wire'
import Swal from 'sweetalert2'

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)
const activeTab = ref('types') // 'types' | 'presets' | 'preview'

// Master State
const wireGroups = ref([])
const wirePresets = ref([])

// Edit Modals State
const showTypeModal = ref(false)
const isEditingType = ref(false)
const typeEditTarget = ref({
  groupIndex: -1,
  optionIndex: -1
})
const typeForm = ref({
  groupName: '',
  value: '',
  label: '',
  defaultTitle: '',
  template: 'single_black',
  image: ''
})
const isCustomGroup = ref(false)

const showPresetModal = ref(false)
const isEditingPreset = ref(false)
const presetEditIndex = ref(-1)
const presetForm = ref({
  id: '',
  name: '',
  samples: []
})

// Search & Filter
const searchQuery = ref('')

const totalTypesCount = computed(() => {
  return wireGroups.value.reduce((acc, g) => acc + (g.options?.length || 0), 0)
})

const filteredWireGroups = computed(() => {
  if (!searchQuery.value.trim()) return wireGroups.value
  const q = searchQuery.value.toLowerCase().trim()
  return wireGroups.value.map(g => {
    const matchedOptions = (g.options || []).filter(o => 
      (o.label || '').toLowerCase().includes(q) ||
      (o.defaultTitle || '').toLowerCase().includes(q) ||
      (o.value || '').toLowerCase().includes(q) ||
      (g.group || '').toLowerCase().includes(q)
    )
    return {
      ...g,
      options: matchedOptions
    }
  }).filter(g => g.options.length > 0)
})

// Load Settings from API
const loadWireSettings = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/settings')
    const json = await res.json()
    if (json.success && json.data) {
      if (json.data.wire_master_types) {
        wireGroups.value = parseWireTypeGroups(json.data.wire_master_types)
      } else {
        wireGroups.value = parseWireTypeGroups(null)
      }

      if (json.data.wire_presets) {
        wirePresets.value = parseWirePresets(json.data.wire_presets)
      } else {
        wirePresets.value = parseWirePresets(null)
      }
    } else {
      wireGroups.value = parseWireTypeGroups(null)
      wirePresets.value = parseWirePresets(null)
    }
  } catch (error) {
    console.error('Error loading wire settings:', error)
    wireGroups.value = parseWireTypeGroups(null)
    wirePresets.value = parseWirePresets(null)
    showToast('ใช้ค่าเริ่มต้นเนื่องจากโหลดข้อมูลไม่สำเร็จ', 'info')
  } finally {
    loading.value = false
  }
}

// Save All to Backend
const saveAll = async () => {
  saving.value = true
  try {
    const payload = [
      { key: 'wire_master_types', value: JSON.stringify(wireGroups.value) },
      { key: 'wire_presets', value: JSON.stringify(wirePresets.value) }
    ]

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload })
    })
    const json = await res.json()
    if (json.success) {
      showToast('บันทึกข้อมูลสายไฟทั้งหมดเรียบร้อยแล้ว', 'success')
    } else {
      throw new Error(json.error || 'Failed to save')
    }
  } catch (error) {
    console.error('Save error:', error)
    showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error')
  } finally {
    saving.value = false
  }
}

// Factory Reset
const handleFactoryReset = async () => {
  const result = await Swal.fire({
    title: 'กู้คืนค่าเริ่มต้นโรงงาน?',
    text: 'รายการชนิดสายไฟและชุดสำเร็จรูปทั้งหมดจะถูกรีเซ็ตกลับเป็นค่ามาตรฐานจากโรงงาน Kodera',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ใช่, กู้คืนค่าเริ่มต้น',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    wireGroups.value = JSON.parse(JSON.stringify(defaultWireTypeGroups))
    wirePresets.value = JSON.parse(JSON.stringify(defaultWirePresets))
    await saveAll()
    showToast('กู้คืนค่าเริ่มต้นโรงงานเรียบร้อยแล้ว', 'success')
  }
}

// Group Actions
const addCategory = async () => {
  const { value: groupName } = await Swal.fire({
    title: 'เพิ่มหมวดหมู่สายไฟใหม่',
    input: 'text',
    inputLabel: 'ชื่อหมวดหมู่ (Category Name)',
    inputPlaceholder: 'เช่น สายคอนเนคเตอร์พิเศษ, สายไฟทนความร้อนสูง',
    showCancelButton: true,
    confirmButtonText: 'เพิ่มหมวดหมู่',
    cancelButtonText: 'ยกเลิก',
    inputValidator: (val) => {
      if (!val || !val.trim()) return 'กรุณากรอกชื่อหมวดหมู่'
    }
  })

  if (groupName && groupName.trim()) {
    wireGroups.value.push({
      group: groupName.trim(),
      options: []
    })
    showToast(`เพิ่มหมวดหมู่ "${groupName.trim()}" สำเร็จ`, 'success')
  }
}

const editCategoryName = async (gIdx) => {
  const currentName = wireGroups.value[gIdx].group
  const { value: newName } = await Swal.fire({
    title: 'แก้ไขชื่อหมวดหมู่',
    input: 'text',
    inputValue: currentName,
    showCancelButton: true,
    confirmButtonText: 'บันทึก',
    cancelButtonText: 'ยกเลิก',
    inputValidator: (val) => {
      if (!val || !val.trim()) return 'กรุณากรอกชื่อหมวดหมู่'
    }
  })

  if (newName && newName.trim() && newName.trim() !== currentName) {
    wireGroups.value[gIdx].group = newName.trim()
    showToast('แก้ไขชื่อหมวดหมู่เรียบร้อย', 'success')
  }
}

const deleteCategory = async (gIdx) => {
  const grp = wireGroups.value[gIdx]
  const count = grp.options?.length || 0
  const result = await Swal.fire({
    title: `ลบหมวดหมู่ "${grp.group}"?`,
    text: count > 0 ? `หมวดหมู่นี้มีสายไฟอยู่ ${count} รายการ ซึ่งจะถูกลบทั้งหมด` : 'ยืนยันการลบหมวดหมู่นี้',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ลบหมวดหมู่',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    wireGroups.value.splice(gIdx, 1)
    showToast('ลบหมวดหมู่เรียบร้อยแล้ว', 'info')
  }
}

const moveGroup = (idx, direction) => {
  const targetIdx = idx + direction
  if (targetIdx < 0 || targetIdx >= wireGroups.value.length) return
  const item = wireGroups.value.splice(idx, 1)[0]
  wireGroups.value.splice(targetIdx, 0, item)
}

// Wire Type Actions
const openAddTypeModal = (defaultGroup = '') => {
  isEditingType.value = false
  isCustomGroup.value = false
  typeEditTarget.value = { groupIndex: -1, optionIndex: -1 }
  const defaultGroupName = defaultGroup || (wireGroups.value[0]?.group || 'สายเดี่ยวปอกปลาย 2 ด้าน (Single Wire Stripping)')
  typeForm.value = {
    groupName: defaultGroupName,
    value: 'wire_' + Date.now().toString(36),
    label: 'สายไฟกำหนดเอง',
    defaultTitle: 'สายไฟกำหนดเอง',
    template: 'single_black',
    image: ''
  }
  showTypeModal.value = true
}

const openEditTypeModal = (gIdx, oIdx) => {
  isEditingType.value = true
  isCustomGroup.value = false
  typeEditTarget.value = { groupIndex: gIdx, optionIndex: oIdx }
  const opt = wireGroups.value[gIdx].options[oIdx]
  typeForm.value = {
    groupName: wireGroups.value[gIdx].group,
    value: opt.value || opt.id || '',
    label: opt.label || '',
    defaultTitle: opt.defaultTitle || opt.title || opt.label || '',
    template: opt.template || opt.value || 'single_black',
    image: opt.image || ''
  }
  showTypeModal.value = true
}

const saveTypeModal = () => {
  if (!typeForm.value.groupName || !typeForm.value.groupName.trim()) {
    showToast('กรุณาระบุหมวดหมู่ของสายไฟ', 'warning')
    return
  }
  typeForm.value.groupName = typeForm.value.groupName.trim()

  if (!typeForm.value.label.trim()) {
    showToast('กรุณากรอกป้ายกำกับสายไฟ', 'warning')
    return
  }
  if (!typeForm.value.defaultTitle.trim()) {
    typeForm.value.defaultTitle = typeForm.value.label.trim().replace(/^[^\wก-๙\s]+/, '').trim()
  }
  if (!typeForm.value.value.trim()) {
    typeForm.value.value = 'wire_' + Date.now().toString(36)
  }

  const optionData = {
    value: typeForm.value.value.trim(),
    label: typeForm.value.label.trim(),
    defaultTitle: typeForm.value.defaultTitle.trim(),
    template: typeForm.value.template,
    image: typeForm.value.image || ''
  }

  if (isEditingType.value) {
    const { groupIndex, optionIndex } = typeEditTarget.value
    const currentGroup = wireGroups.value[groupIndex]
    
    // If group changed, move option to target group
    if (currentGroup.group !== typeForm.value.groupName) {
      currentGroup.options.splice(optionIndex, 1)
      let targetGroup = wireGroups.value.find(g => g.group === typeForm.value.groupName)
      if (!targetGroup) {
        targetGroup = { group: typeForm.value.groupName, options: [] }
        wireGroups.value.push(targetGroup)
      }
      targetGroup.options.push(optionData)
    } else {
      currentGroup.options[optionIndex] = optionData
    }
    showToast('อัปเดตชนิดสายไฟเรียบร้อย', 'success')
  } else {
    let targetGroup = wireGroups.value.find(g => g.group === typeForm.value.groupName)
    if (!targetGroup) {
      targetGroup = { group: typeForm.value.groupName, options: [] }
      wireGroups.value.push(targetGroup)
    }
    targetGroup.options.push(optionData)
    showToast('เพิ่มชนิดสายไฟใหม่เรียบร้อย', 'success')
  }

  showTypeModal.value = false
}

const duplicateType = (gIdx, oIdx) => {
  const opt = wireGroups.value[gIdx].options[oIdx]
  const clone = JSON.parse(JSON.stringify(opt))
  clone.value = clone.value + '_copy_' + Math.floor(Math.random() * 1000)
  clone.label = `${clone.label} (สำเนา)`
  clone.defaultTitle = `${clone.defaultTitle} (สำเนา)`
  wireGroups.value[gIdx].options.splice(oIdx + 1, 0, clone)
  showToast('คัดลอกชนิดสายไฟแล้ว', 'success')
}

const deleteType = async (gIdx, oIdx) => {
  const opt = wireGroups.value[gIdx].options[oIdx]
  const result = await Swal.fire({
    title: `ลบชนิดสายไฟ "${opt.defaultTitle || opt.label}"?`,
    text: 'การลบนี้จะมีผลเมื่อบันทึกข้อมูล',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ลบรายการ',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    wireGroups.value[gIdx].options.splice(oIdx, 1)
    showToast('ลบชนิดสายไฟเรียบร้อย', 'info')
  }
}

const moveTypeInGroup = (gIdx, oIdx, direction) => {
  const list = wireGroups.value[gIdx].options
  const targetIdx = oIdx + direction
  if (targetIdx < 0 || targetIdx >= list.length) return
  const item = list.splice(oIdx, 1)[0]
  list.splice(targetIdx, 0, item)
}

// Preset Actions
const openAddPresetModal = () => {
  isEditingPreset.value = false
  presetEditIndex.value = -1
  presetForm.value = {
    id: 'preset_' + Date.now().toString(36),
    name: 'ชุดสายไฟใหม่',
    samples: [
      { type: 'single_black', title: 'สายเดี่ยวสีดำ', image: '' }
    ]
  }
  showPresetModal.value = true
}

const openEditPresetModal = (idx) => {
  isEditingPreset.value = true
  presetEditIndex.value = idx
  const p = wirePresets.value[idx]
  presetForm.value = {
    id: p.id || 'preset_' + idx,
    name: p.name || '',
    samples: JSON.parse(JSON.stringify(p.samples || []))
  }
  showPresetModal.value = true
}

const addSampleToPresetForm = (type = 'single_black') => {
  presetForm.value.samples.push({
    type,
    title: getWireSampleTitle({ type }),
    image: ''
  })
}

const removeSampleFromPresetForm = (sIdx) => {
  presetForm.value.samples.splice(sIdx, 1)
}

const moveSampleInPresetForm = (sIdx, direction) => {
  const list = presetForm.value.samples
  const targetIdx = sIdx + direction
  if (targetIdx < 0 || targetIdx >= list.length) return
  const item = list.splice(sIdx, 1)[0]
  list.splice(targetIdx, 0, item)
}

const savePresetModal = () => {
  if (!presetForm.value.name.trim()) {
    showToast('กรุณากรอกชื่อชุดพรีเซ็ต', 'warning')
    return
  }
  if (!presetForm.value.samples || presetForm.value.samples.length === 0) {
    showToast('กรุณาเพิ่มสายไฟอย่างน้อย 1 รายการในชุดพรีเซ็ต', 'warning')
    return
  }

  const presetData = {
    id: presetForm.value.id || 'preset_' + Date.now().toString(36),
    name: presetForm.value.name.trim(),
    samples: JSON.parse(JSON.stringify(presetForm.value.samples))
  }

  if (isEditingPreset.value) {
    wirePresets.value[presetEditIndex.value] = presetData
    showToast('อัปเดตชุดพรีเซ็ตเรียบร้อย', 'success')
  } else {
    wirePresets.value.push(presetData)
    showToast('เพิ่มชุดพรีเซ็ตใหม่เรียบร้อย', 'success')
  }

  showPresetModal.value = false
}

const deletePreset = async (idx) => {
  const p = wirePresets.value[idx]
  const result = await Swal.fire({
    title: `ลบชุดพรีเซ็ต "${p.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ลบชุดพรีเซ็ต',
    cancelButtonText: 'ยกเลิก'
  })

  if (result.isConfirmed) {
    wirePresets.value.splice(idx, 1)
    showToast('ลบชุดพรีเซ็ตเรียบร้อย', 'info')
  }
}

const duplicatePreset = (idx) => {
  const p = wirePresets.value[idx]
  const clone = JSON.parse(JSON.stringify(p))
  clone.id = clone.id + '_copy_' + Math.floor(Math.random() * 1000)
  clone.name = `${clone.name} (สำเนา)`
  wirePresets.value.splice(idx + 1, 0, clone)
  showToast('คัดลอกชุดพรีเซ็ตแล้ว', 'success')
}

// Flat list of all available types for dropdowns
const allFlatWireTypes = computed(() => {
  const list = []
  wireGroups.value.forEach(g => {
    (g.options || []).forEach(o => {
      list.push({
        value: o.value,
        label: o.label,
        defaultTitle: o.defaultTitle || o.title || o.label,
        template: o.template || o.value,
        group: g.group
      })
    })
  })
  return list
})

onMounted(() => {
  loadWireSettings()
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    
    <!-- Top Bar Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              จัดการข้อมูลสายไฟ (Wire Samples Master Data)
            </h1>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              เพิ่ม ลบ แก้ไขชื่อภาษาไทย หมวดหมู่ กราฟิก และชุดสำเร็จรูปสำหรับเครื่องตัดปอกสายไฟ
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Global Actions -->
      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          type="button"
          @click="handleFactoryReset"
          class="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          title="กู้คืนชุดสายไฟมาตรฐานโรงงาน Kodera"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span>กู้คืนค่าโรงงาน</span>
        </button>

        <button
          type="button"
          @click="saveAll"
          :disabled="saving || loading"
          class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <svg v-if="saving" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
          <span>{{ saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง' }}</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs & Stats -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
      <div class="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          @click="activeTab = 'types'"
          :class="['px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5', activeTab === 'types' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white']"
        >
          <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>ชนิดสายไฟมาตรฐาน</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{{ totalTypesCount }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'presets'"
          :class="['px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5', activeTab === 'presets' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white']"
        >
          <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          <span>ชุดสำเร็จรูป (Presets)</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{{ wirePresets.length }}</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'preview'"
          :class="['px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5', activeTab === 'preview' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white']"
        >
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          <span>พรีวิวการแสดงผลจริง</span>
        </button>
      </div>

      <!-- Search & Add Actions -->
      <div class="flex items-center gap-2">
        <div v-if="activeTab === 'types'" class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="ค้นหาชื่อหรือรหัสสายไฟ..."
            class="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 w-44 sm:w-60"
          />
          <svg class="w-4 h-4 text-slate-400 absolute left-2.5 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <button
          v-if="activeTab === 'types'"
          type="button"
          @click="addCategory"
          class="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>+ เพิ่มหมวดหมู่</span>
        </button>

        <button
          v-if="activeTab === 'types'"
          type="button"
          @click="openAddTypeModal()"
          class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>+ เพิ่มชนิดสายไฟ</span>
        </button>

        <button
          v-if="activeTab === 'presets'"
          type="button"
          @click="openAddPresetModal"
          class="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>+ เพิ่มชุดพรีเซ็ต</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-12 text-center text-slate-400 space-y-2">
      <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="text-xs font-semibold">กำลังโหลดข้อมูลสายไฟ...</p>
    </div>

    <!-- TAB 1: MASTER WIRE TYPES -->
    <div v-else-if="activeTab === 'types'" class="space-y-6">
      
      <div 
        v-for="(grp, gIdx) in filteredWireGroups" 
        :key="'grp-'+gIdx"
        class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        <!-- Group Header -->
        <div class="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
            <h2 class="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">
              {{ grp.group }}
            </h2>
            <span class="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold shrink-0">
              {{ grp.options?.length || 0 }} รายการ
            </span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <button
              type="button"
              @click="moveGroup(gIdx, -1)"
              :disabled="gIdx === 0"
              class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
              title="เลื่อนหมวดหมู่ขึ้น"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
            </button>
            <button
              type="button"
              @click="moveGroup(gIdx, 1)"
              :disabled="gIdx === wireGroups.length - 1"
              class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
              title="เลื่อนหมวดหมู่ลง"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button
              type="button"
              @click="openAddTypeModal(grp.group)"
              class="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
            >
              + เพิ่มในหมวดนี้
            </button>
            <button
              type="button"
              @click="editCategoryName(gIdx)"
              class="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              title="แก้ไขชื่อหมวดหมู่"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button
              type="button"
              @click="deleteCategory(gIdx)"
              class="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
              title="ลบหมวดหมู่นี้"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <!-- Wire Options Table / List -->
        <div class="divide-y divide-slate-100 dark:divide-slate-800/80">
          <div 
            v-for="(opt, oIdx) in grp.options" 
            :key="opt.value + '-' + oIdx"
            class="p-3 sm:p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <!-- Left: Order, Visual Preview, Name & Code -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <!-- Reorder Buttons -->
              <div class="flex flex-col shrink-0">
                <button
                  type="button"
                  @click="moveTypeInGroup(gIdx, oIdx, -1)"
                  :disabled="oIdx === 0"
                  class="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 15l7-7 7 7" /></svg>
                </button>
                <button
                  type="button"
                  @click="moveTypeInGroup(gIdx, oIdx, 1)"
                  :disabled="oIdx === grp.options.length - 1"
                  class="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <!-- Live Visual Box -->
              <div class="w-28 sm:w-36 h-9 rounded-xl bg-slate-900 dark:bg-slate-950 p-1.5 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800 shadow-inner">
                <WireSample :sample="{ type: opt.template || opt.value, image: opt.image }" :height="20" />
              </div>

              <!-- Label, Default Title & Key -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    {{ opt.label }}
                  </span>
                  <span class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {{ opt.value }}
                  </span>
                </div>
                <div class="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  <span class="font-medium">ชื่อมาตรฐาน: <strong class="text-slate-700 dark:text-slate-300 font-semibold">{{ opt.defaultTitle }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
              <button
                type="button"
                @click="openEditTypeModal(gIdx, oIdx)"
                class="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span>แก้ไข</span>
              </button>

              <button
                type="button"
                @click="duplicateType(gIdx, oIdx)"
                class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                title="คัดลอกรายการนี้"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>

              <button
                type="button"
                @click="deleteType(gIdx, oIdx)"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="ลบรายการนี้"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          <div v-if="!grp.options || grp.options.length === 0" class="p-6 text-center text-xs text-slate-400">
            ยังไม่มีรายการสายไฟในหมวดนี้ คลิก "+ เพิ่มในหมวดนี้" ด้านบนเพื่อเพิ่มสายไฟ
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: WIRE PRESETS -->
    <div v-else-if="activeTab === 'presets'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div 
        v-for="(p, pIdx) in wirePresets" 
        :key="p.id || pIdx"
        class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
      >
        <div class="space-y-2">
          <!-- Preset Header -->
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
              <h3 class="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {{ p.name }}
              </h3>
            </div>
            <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
              {{ p.samples?.length || 0 }} สาย
            </span>
          </div>

          <!-- Preset Wire Samples Rows -->
          <div class="space-y-1.5 pt-1">
            <div 
              v-for="(sample, sIdx) in p.samples" 
              :key="'ps-'+sIdx"
              class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60"
            >
              <div class="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[48%]">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {{ sample.title || getWireSampleTitle(sample) }}
                </span>
              </div>
              <div class="flex-1 min-w-[80px] max-w-[50%] flex items-center justify-end">
                <WireSample :sample="sample" :height="14" />
              </div>
            </div>
          </div>
        </div>

        <!-- Preset Footer Actions -->
        <div class="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span class="text-[10.5px] text-slate-400 font-mono">ID: {{ p.id }}</span>
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              @click="openEditPresetModal(pIdx)"
              class="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors cursor-pointer"
            >
              แก้ไขชุดนี้
            </button>
            <button
              type="button"
              @click="duplicatePreset(pIdx)"
              class="p-1 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
              title="คัดลอกชุดนี้"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
            <button
              type="button"
              @click="deletePreset(pIdx)"
              class="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
              title="ลบชุดนี้"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: LIVE PREVIEW IN CARD & DETAIL -->
    <div v-else-if="activeTab === 'preview'" class="space-y-6">
      <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
        <h2 class="text-base font-bold text-slate-900 dark:text-white mb-1">
          ตัวอย่างจำลองการแสดงผลบนการ์ดสินค้า (Card Live Preview)
        </h2>
        <p class="text-xs text-slate-500 mb-4">
          แสดงตัวอย่างลักษณะที่ลูกค้าจะมองเห็นในรายการสินค้าหน้าเว็บ
        </p>

        <!-- Preview Card Container -->
        <div class="max-w-sm mx-auto bg-white dark:bg-[#111827] rounded-[1.75rem] border border-slate-200/90 dark:border-slate-800 p-5 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-2xl font-black text-[#002855] dark:text-white">C370G</span>
            <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">KODERA</span>
          </div>

          <div class="w-full bg-[#002855] text-white py-1.5 px-3 rounded-full text-center text-xs font-bold">
            AWG#10 ~ AWG#32
          </div>

          <!-- The Wire Samples Section Mockup -->
          <div class="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                ตัวอย่างสายไฟที่รองรับ
              </span>
              <span class="text-[9.5px] font-semibold px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">3 แบบ</span>
            </div>

            <div class="space-y-1.5">
              <div 
                v-for="sample in [
                  { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
                  { type: 'single_grey', title: 'สายเดี่ยวสีเทา' },
                  { type: 'ground_yellow_green', title: 'สายดินเขียว-เหลือง' }
                ]"
                :key="sample.type"
                class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60"
              >
                <div class="flex items-center gap-1.5 min-w-0 shrink-0 max-w-[48%]">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span class="text-[10px] md:text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {{ sample.title }}
                  </span>
                </div>
                <div class="flex-1 min-w-[70px] max-w-[52%] flex items-center justify-end">
                  <WireSample :sample="sample" :height="14" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL 1: ADD / EDIT WIRE TYPE -->
    <div v-if="showTypeModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <svg v-if="isEditingType" class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <svg v-else class="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            {{ isEditingType ? 'แก้ไขข้อมูลชนิดสายไฟ' : 'เพิ่มชนิดสายไฟใหม่' }}
          </h3>
          <button @click="showTypeModal = false" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-4 overflow-y-auto">
          <!-- Live Preview in Modal -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">ภาพจำลองสายไฟ (Live Preview)</label>
            <div class="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-950 p-2 flex items-center justify-center border border-slate-800 shadow-inner">
              <WireSample :sample="{ type: typeForm.template, image: typeForm.image }" :height="24" />
            </div>
          </div>

          <!-- Group Category -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">หมวดหมู่ (Category)</label>
              <button
                type="button"
                @click="isCustomGroup = !isCustomGroup"
                class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{{ isCustomGroup ? '← เลือกจากหมวดหมู่ที่มี' : '+ สร้างหมวดหมู่ใหม่' }}</span>
              </button>
            </div>

            <!-- Standard Select Dropdown when choosing existing category -->
            <div v-if="!isCustomGroup" class="relative">
              <select
                v-model="typeForm.groupName"
                class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer appearance-none pr-8"
              >
                <option v-for="(g, idx) in wireGroups" :key="idx" :value="g.group">
                  {{ g.group }}
                </option>
              </select>
              <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <!-- Custom Text Input when creating new category -->
            <input
              v-else
              v-model="typeForm.groupName"
              type="text"
              placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ที่ต้องการสร้าง..."
              class="w-full bg-slate-50 dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20"
              autofocus
            />
          </div>

          <!-- Label (with icon) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ป้ายกำกับแสดงในเมนูตัวเลือก (Dropdown Label)
            </label>
            <input
              v-model="typeForm.label"
              type="text"
              placeholder="เช่น สายดิน เขียว-เหลือง (ปอก 2 ด้าน)"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <!-- Default Title (for Card/Detail) -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ชื่อแสดงบนการ์ดสินค้า (Default Title on Product Card)
            </label>
            <input
              v-model="typeForm.defaultTitle"
              type="text"
              placeholder="เช่น สายดินเขียว-เหลือง, สายเดี่ยวสีดำ 0.5-2.5 mm²"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <!-- Visual Template Selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">รูปแบบกราฟิกจำลอง (SVG Graphic Template)</label>
            <select
              v-model="typeForm.template"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option v-for="tmpl in svgTemplateOptions" :key="tmpl.value" :value="tmpl.value">
                {{ tmpl.name }}
              </option>
            </select>
          </div>

          <!-- Unique Value / Key -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
              รหัสอ้างอิงชนิดสายไฟ (Key / Code Identifier)
            </label>
            <input
              v-model="typeForm.value"
              type="text"
              placeholder="เช่น ground_yellow_green, single_purple"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="showTypeModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            @click="saveTypeModal"
            class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {{ isEditingType ? 'บันทึกการแก้ไข' : 'เพิ่มชนิดสายไฟ' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: ADD / EDIT PRESET -->
    <div v-if="showPresetModal" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 class="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            {{ isEditingPreset ? 'แก้ไขชุดพรีเซ็ตสำเร็จรูป' : 'เพิ่มชุดพรีเซ็ตสำเร็จรูปใหม่' }}
          </h3>
          <button @click="showPresetModal = false" class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-4 overflow-y-auto">
          <!-- Preset Name -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อชุดพรีเซ็ต (Preset Name)</label>
            <input
              v-model="presetForm.name"
              type="text"
              placeholder="เช่น C300A (สายเดี่ยว ดำ/น้ำเงิน/เทา)"
              class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <!-- Samples inside Preset -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300">
                รายการสายไฟในชุดนี้ ({{ presetForm.samples.length }} รายการ)
              </label>
              <button
                type="button"
                @click="addSampleToPresetForm('single_black')"
                class="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                + เพิ่มสายไฟในชุด
              </button>
            </div>

            <div class="space-y-2">
              <div 
                v-for="(sample, sIdx) in presetForm.samples" 
                :key="'ps-form-'+sIdx"
                class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <button 
                      type="button" 
                      @click="moveSampleInPresetForm(sIdx, -1)" 
                      :disabled="sIdx === 0" 
                      class="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      ▲
                    </button>
                    <button 
                      type="button" 
                      @click="moveSampleInPresetForm(sIdx, 1)" 
                      :disabled="sIdx === presetForm.samples.length - 1" 
                      class="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                    >
                      ▼
                    </button>
                    <span class="text-xs font-bold text-slate-500">สายไฟ #{{ sIdx + 1 }}</span>
                  </div>

                  <button
                    type="button"
                    @click="removeSampleFromPresetForm(sIdx)"
                    class="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                  >
                    ลบ
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10.5px] font-semibold text-slate-500 mb-1">เลือกชนิดสายไฟ</label>
                    <select
                      v-model="sample.type"
                      class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option v-for="t in allFlatWireTypes" :key="t.value" :value="t.value">
                        {{ t.label }} ({{ t.group }})
                      </option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-[10.5px] font-semibold text-slate-500 mb-1">ชื่อสายไฟ</label>
                    <input
                      v-model="sample.title"
                      type="text"
                      placeholder="เช่น สายเดี่ยวสีดำ"
                      class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <!-- Live Preview in Row -->
                <div class="h-6 rounded bg-slate-900 p-1 flex items-center justify-center">
                  <WireSample :sample="sample" :height="16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            @click="showPresetModal = false"
            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            @click="savePresetModal"
            class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
          >
            {{ isEditingPreset ? 'บันทึกการแก้ไข' : 'เพิ่มชุดพรีเซ็ต' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
