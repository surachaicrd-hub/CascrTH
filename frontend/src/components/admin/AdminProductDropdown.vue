<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  products: { type: Array, required: true },
  placeholder: { type: String, default: '- เลือกสินค้า -' }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const dropRef = ref(null)
const triggerRef = ref(null)
const searchQuery = ref('')
const searchInputRef = ref(null)
const dropdownStyle = ref({})

const selected = computed(() => props.products.find(p => String(p.id) === String(props.modelValue)))

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return props.products
  const q = searchQuery.value.trim().toLowerCase()
  return props.products.filter(p =>
    (p.name && p.name.toLowerCase().includes(q)) ||
    (p.sku && p.sku.toLowerCase().includes(q))
  )
})

function updateDropdownPosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownHeight = 320
  
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    // Open upward
    dropdownStyle.value = {
      position: 'fixed',
      left: rect.left + 'px',
      bottom: (window.innerHeight - rect.top + 4) + 'px',
      width: Math.max(rect.width, 300) + 'px',
      maxWidth: '90vw',
      zIndex: 9999
    }
  } else {
    // Open downward
    dropdownStyle.value = {
      position: 'fixed',
      left: rect.left + 'px',
      top: (rect.bottom + 4) + 'px',
      width: Math.max(rect.width, 300) + 'px',
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

function selectProduct(pId) {
  emit('update:modelValue', pId)
  open.value = false
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

function formatPrice(price) {
  if (!price) return ''
  return '฿' + Number(price).toLocaleString()
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
    <!-- Trigger -->
    <button ref="triggerRef" type="button" @click="toggle" class="w-full flex items-center justify-between border rounded-xl px-3 py-2 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all h-[42px]" :class="selected ? 'border-emerald-300 bg-emerald-50/20' : 'border-gray-300'">
      <div class="flex items-center gap-2 truncate overflow-hidden">
        <template v-if="selected">
          <div class="w-6 h-6 rounded-md overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-200">
            <img :src="selected.image_url || '/images/placeholder.png'" class="w-full h-full object-cover" @error="e => e.target.src='/images/placeholder.png'" />
          </div>
          <span class="truncate text-left text-gray-700 font-medium text-xs">
            <span class="text-[10px] text-gray-400 mr-0.5 font-mono">[{{ selected.sku || 'N/A' }}]</span>
            {{ selected.name }}
          </span>
        </template>
        <template v-else>
          <span class="text-gray-400 text-xs">{{ placeholder }}</span>
        </template>
      </div>
      <svg class="w-4 h-4 text-gray-400 shrink-0 ml-1 transition-transform duration-200" :class="{ 'rotate-180': open }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown (teleported via fixed positioning) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-150"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div v-if="open" ref="dropRef" :style="dropdownStyle" class="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <!-- Search -->
          <div class="p-2 border-b border-gray-100">
            <div class="relative">
              <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none placeholder:text-gray-400"
                placeholder="ค้นหาชื่อหรือ SKU..."
                @keydown.escape="open = false"
              />
            </div>
          </div>

          <!-- Options -->
          <div class="max-h-64 overflow-y-auto fancy-scrollbar py-1">
            <button type="button" @click="selectProduct('')" class="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-500 italic border-b border-gray-100 text-sm flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              {{ placeholder }} (ดึงล่าสุดอัตโนมัติ)
            </button>

            <div v-if="filteredProducts.length === 0" class="px-3 py-6 text-center text-gray-400 text-xs">
              <svg class="w-8 h-8 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              ไม่พบสินค้าที่ค้นหา
            </div>

            <button v-for="prod in filteredProducts" :key="prod.id" type="button" @click="selectProduct(prod.id)" class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-emerald-50 border-b last:border-b-0 border-gray-50 transition-colors text-left group" :class="{'bg-emerald-50/50': String(prod.id) === String(modelValue)}">
              <div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-200 group-hover:border-emerald-300 transition-colors">
                <img :src="prod.image_url || '/images/placeholder.png'" class="w-full h-full object-cover" @error="e => e.target.src='/images/placeholder.png'" />
              </div>
              <div class="truncate flex-1">
                <div class="text-[11px] text-gray-400 font-mono mb-0.5">{{ prod.sku || 'N/A' }}</div>
                <div class="text-sm text-gray-800 font-medium truncate group-hover:text-emerald-700 transition-colors">{{ prod.name }}</div>
                <div v-if="prod.price" class="text-[11px] text-emerald-600 font-bold mt-0.5">{{ formatPrice(prod.price) }}</div>
              </div>
              <div v-if="String(prod.id) === String(modelValue)" class="text-emerald-500 shrink-0">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
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
