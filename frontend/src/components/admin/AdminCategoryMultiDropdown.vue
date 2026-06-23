<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  categories: { type: Array, required: true },
  placeholder: { type: String, default: '- เลือกหมวดหมู่ -' },
  valueKey: { type: String, default: 'id' } // 'id' or 'name'
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const dropRef = ref(null)
const triggerRef = ref(null)
const searchQuery = ref('')
const searchInputRef = ref(null)
const dropdownStyle = ref({})

const selectedCategories = computed(() => {
  if (!props.modelValue || !Array.isArray(props.modelValue)) return []
  return props.categories.filter(c => {
    const val = props.valueKey === 'name' ? c.name : c.id
    return props.modelValue.includes(val)
  })
})

const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return props.categories
  const q = searchQuery.value.trim().toLowerCase()
  return props.categories.filter(c => c.name.toLowerCase().includes(q))
})

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownHeight = 340

  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    // Open upward
    dropdownStyle.value = {
      position: 'fixed',
      left: rect.left + 'px',
      bottom: (window.innerHeight - rect.top + 4) + 'px',
      width: Math.max(rect.width, 280) + 'px',
      maxWidth: '90vw',
      zIndex: 9999
    }
  } else {
    // Open downward
    dropdownStyle.value = {
      position: 'fixed',
      left: rect.left + 'px',
      top: (rect.bottom + 4) + 'px',
      width: Math.max(rect.width, 280) + 'px',
      maxWidth: '90vw',
      zIndex: 9999
    }
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    searchQuery.value = ''
    nextTick(() => {
      updateDropdownPosition()
      searchInputRef.value?.focus()
    })
  }
}

function toggleCategory(cat) {
  const val = props.valueKey === 'name' ? cat.name : cat.id
  let newValue = [...(props.modelValue || [])]
  const index = newValue.indexOf(val)
  
  if (index > -1) {
    newValue.splice(index, 1)
  } else {
    newValue.push(val)
  }
  
  emit('update:modelValue', newValue)
}

function removeCategory(val, event) {
  if (event) {
    event.stopPropagation();
  }
  let newValue = [...(props.modelValue || [])]
  const index = newValue.indexOf(val)
  if (index > -1) {
    newValue.splice(index, 1)
    emit('update:modelValue', newValue)
  }
}

function clearSelection() {
  emit('update:modelValue', [])
  searchQuery.value = ''
}

function onClickOutside(e) {
  if (dropRef.value && !dropRef.value.contains(e.target) && triggerRef.value && !triggerRef.value.contains(e.target)) {
    open.value = false
    searchQuery.value = ''
  }
}

function onScroll() {
  if (open.value) updateDropdownPosition()
}

// Category image helper
function getCategoryImage(cat) {
  return cat.image_url || cat.image || null
}

function getCategoryProductCount(cat) {
  return cat.product_count ?? cat.productCount ?? null
}

function isSelected(cat) {
  const val = props.valueKey === 'name' ? cat.name : cat.id
  return (props.modelValue || []).includes(val)
}

onMounted(() => {
  document.addEventListener('mousedown', onClickOutside)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div class="relative text-sm">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      type="button"
      @click="toggle"
      class="w-full flex items-center justify-between border rounded-xl px-2 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[46px]"
      :class="selectedCategories.length > 0 ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-300'"
    >
      <div class="flex flex-wrap items-center gap-1.5 flex-1 overflow-hidden">
        <template v-if="selectedCategories.length > 0">
          <div 
            v-for="selected in selectedCategories" 
            :key="selected.id"
            class="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200"
          >
            <span class="truncate max-w-[120px] text-xs font-semibold">{{ selected.name }}</span>
            <span @click="removeCategory(valueKey === 'name' ? selected.name : selected.id, $event)" class="text-emerald-500 hover:text-emerald-700 cursor-pointer p-0.5 rounded-full hover:bg-emerald-200 transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </span>
          </div>
        </template>
        <template v-else>
          <div class="px-1 w-full flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <span class="text-gray-400">{{ placeholder }}</span>
          </div>
        </template>
      </div>
      <svg class="w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200" :class="{ 'rotate-180': open }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Panel (teleported to body) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="open" ref="dropRef" :style="dropdownStyle" class="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          <!-- Search Input -->
          <div class="p-2 border-b border-gray-100 shrink-0">
            <div class="relative">
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-gray-400"
                placeholder="ค้นหาหมวดหมู่..."
                @keydown.escape="open = false"
              />
            </div>
          </div>

          <!-- Options List -->
          <div class="max-h-64 overflow-y-auto fancy-scrollbar py-1 flex-1">
            <!-- Clear Option -->
            <button v-if="selectedCategories.length > 0" type="button" @click="clearSelection" class="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-500 border-b border-gray-100 text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              ล้างการเลือกทั้งหมด
            </button>

            <div v-if="filteredCategories.length === 0" class="px-3 py-6 text-center text-gray-400 text-xs">
              <svg class="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ไม่พบหมวดหมู่ที่ค้นหา
            </div>

            <button
              v-for="cat in filteredCategories"
              :key="cat.id"
              type="button"
              @click="toggleCategory(cat)"
              class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 border-b last:border-b-0 border-gray-50 transition-colors text-left group"
              :class="{'bg-emerald-50/60': isSelected(cat)}"
            >
              <!-- Checkbox -->
              <div class="w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors"
                :class="isSelected(cat) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 group-hover:border-emerald-400 bg-white text-transparent'">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>

              <!-- Category Image -->
              <div class="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-200 group-hover:border-emerald-300 transition-colors">
                <img v-if="getCategoryImage(cat)" :src="getCategoryImage(cat)" class="w-full h-full object-cover" @error="e => e.target.style.display='none'" />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
              </div>

              <!-- Category Info -->
              <div class="truncate flex-1">
                <div class="text-sm text-gray-800 font-semibold truncate group-hover:text-emerald-700 transition-colors">{{ cat.name }}</div>
                <div v-if="getCategoryProductCount(cat) !== null" class="text-[11px] text-gray-400 mt-0.5">{{ getCategoryProductCount(cat) }} สินค้า</div>
              </div>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fancy-scrollbar::-webkit-scrollbar { width: 5px; }
.fancy-scrollbar::-webkit-scrollbar-track { background: transparent; }
.fancy-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 5px; }
.fancy-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>
