<script setup>
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import { useSettingsStore } from '../../stores/settingsStore'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'
import FancySelect from '../../components/admin/FancySelect.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()
const settingsStore = useSettingsStore()

const products = ref([])
const loading = ref(true)
const categories = ref([])

// Active states for UI feedback
const togglingId = ref(null)

const deletingId = ref(null)

// Filtering & Search
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')
const selectedStock = ref('all')
const selectedSale = ref('all')
const sortBy = ref('newest')

// Dropdown options
const categoryOptions = computed(() => [
  { value: 'all', label: 'ทุกหมวดหมู่' },
  ...categories.value.map(c => ({ value: c, label: c }))
])
const statusOptions = [
  { value: 'all', label: 'ทุกสถานะ' },
  { value: 'active', label: 'แสดงผล' },
  { value: 'inactive', label: 'ซ่อน' },
]
const stockOptions = [
  { value: 'all', label: 'สต๊อกทั้งหมด' },
  { value: 'unlimited', label: 'ไม่จำกัด' },
  { value: 'instock', label: 'มีสินค้า' },
  { value: 'low', label: 'เหลือน้อย (≤5)' },
  { value: 'outofstock', label: 'สินค้าหมด' },
]
const saleOptions = [
  { value: 'all', label: 'ราคาทั้งหมด' },
  { value: 'sale', label: 'มีส่วนลด' },
  { value: 'flash', label: 'Flash Sale' },
  { value: 'normal', label: 'ราคาปกติ' },
]
const sortOptions = [
  { value: 'newest', label: 'เพิ่มล่าสุดก่อน' },
  { value: 'oldest', label: 'เก่าสุดก่อน' },
  { value: 'name', label: 'ชื่อ ก-ฮ' },
  { value: 'price_asc', label: 'ราคาน้อย → มาก' },
  { value: 'price_desc', label: 'ราคามาก → น้อย' },
  { value: 'order', label: 'ลำดับที่จัด' },
]

// Pagination & Sorting
const currentPage = ref(1)
const itemsPerPage = ref(50)
const itemsPerPageOptions = [10, 25, 50, 100]

const fetchProducts = async () => {
  try {
    const res = await apiFetch('/api/products?admin=true')
    const data = await res.json()
    if (data.success) {
      products.value = data.data.map(p => {
        let parsedCategories = []
        if (typeof p.categories === 'string') {
          try { parsedCategories = JSON.parse(p.categories) || [] } catch (e) { parsedCategories = [] }
        } else if (Array.isArray(p.categories)) {
          parsedCategories = p.categories
        }
        if (parsedCategories.length === 0 && p.category) {
          parsedCategories = [p.category]
        }
        return {
          ...p,
          categories: parsedCategories
        }
      })
      
      // Extract unique categories for filter dropdown
      const cats = new Set()
      products.value.forEach(p => {
        if (p.categories) {
          p.categories.forEach(c => cats.add(c))
        }
      })
      categories.value = Array.from(cats)
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
  } finally {
    loading.value = false
  }
}

// Format date helper
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Computed Properties
const filteredProducts = computed(() => {
  let result = products.value

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    )
  }

  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.categories && p.categories.includes(selectedCategory.value))
  }

  if (selectedStatus.value !== 'all') {
    const isAct = selectedStatus.value === 'active'
    result = result.filter(p => p.is_active === isAct)
  }

  if (selectedStock.value !== 'all') {
    if (selectedStock.value === 'unlimited') result = result.filter(p => p.stock_quantity === null)
    else if (selectedStock.value === 'instock') result = result.filter(p => p.stock_quantity === null || p.stock_quantity > 0)
    else if (selectedStock.value === 'outofstock') result = result.filter(p => p.stock_quantity !== null && p.stock_quantity <= 0)
    else if (selectedStock.value === 'low') result = result.filter(p => p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= 5)
  }

  if (selectedSale.value !== 'all') {
    if (selectedSale.value === 'sale') result = result.filter(p => p.original_price && p.original_price > p.price)
    else if (selectedSale.value === 'flash') result = result.filter(p => p.sale_end_date)
    else if (selectedSale.value === 'normal') result = result.filter(p => !p.original_price || p.original_price <= p.price)
  }

  // Sorting
  if (sortBy.value === 'newest') {
    result = [...result].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
  } else if (sortBy.value === 'oldest') {
    result = [...result].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
  } else if (sortBy.value === 'name') {
    result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'))
  } else if (sortBy.value === 'price_asc') {
    result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0))
  } else if (sortBy.value === 'price_desc') {
    result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0))
  } else if (sortBy.value === 'order') {
    // Default sort_order from DB
  }

  return result
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value) || 1)

const paginatedProducts = computed({
  get() {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredProducts.value.slice(start, end)
  },
  set(newValue) {
    // Determine the offset in the master list based on pagination
    const start = (currentPage.value - 1) * itemsPerPage.value
    
    // We only update the relative order of the currently visible slice inside the master 'products' array
    // Create a new array to trigger reactivity
    const newProducts = [...products.value]
    
    // Create a lookup for original elements from the visible slice
    const visibleSliceIds = paginatedProducts.value.map(p => p.id)
    
    // Replace elements at the exact original positions with the new dragged order
    visibleSliceIds.forEach((id, index) => {
      const globalIndex = products.value.findIndex(p => p.id === id)
      if (globalIndex !== -1) {
        newProducts[globalIndex] = newValue[index]
      }
    })
    
    products.value = newProducts
  }
})

const onDragEnd = async (evt) => {
  // Extract ALL ordered IDs from the entire master list to maintain absolute order in the DB
  const orderedIds = products.value.map(p => p.id)
  
  try {
    const res = await apiFetch('/api/products/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds })
    })
    const data = await res.json()
    if (data.success) {
      showToast('อัปเดตลำดับเรียบร้อย', 'success')
      // Refresh to sync the absolute true logic from backend (important across pages)
      fetchProducts()
    } else {
      showToast('อัปเดตลำดับไม่สำเร็จ', 'error')
    }
  } catch (err) {
    console.error('Reorder error:', err)
  }
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Reset page when filters change
import { watch } from 'vue'
watch([searchQuery, selectedCategory, selectedStatus, selectedStock, selectedSale, sortBy, itemsPerPage], () => {
  currentPage.value = 1
})

const toggleActive = async (product) => {
  if (togglingId.value) return // Prevent multiple clicks
  togglingId.value = product.id
  const newStatus = !product.is_active
  try {
    const res = await apiFetch(`/api/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...product, is_active: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      product.is_active = newStatus
      showToast(newStatus ? 'เปิดแสดงผลสำเร็จ' : 'ซ่อนสินค้าสำเร็จ', 'success')
    } else {
      showToast('อัปเดตสถานะไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Update product error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error')
  } finally {
    togglingId.value = null
  }
}


const deleteProduct = async (product) => {
  if (deletingId.value) return // Prevent double delete
  
  const isConfirmed = await showConfirm({
    title: `ลบข้อมูลสินค้า "${product.name}"`,
    message: `คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า "${product.name}" ออกจากระบบ? การกระทำนี้ไม่สามารถกู้คืนได้`,
    confirmText: 'ลบข้อมูล',
    type: 'danger'
  })
  
  if (!isConfirmed) return
  
  deletingId.value = product.id
  try {
    const res = await apiFetch(`/api/products/${product.id}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (data.success) {
      products.value = products.value.filter(p => p.id !== product.id)
      showToast('ลบข้อมูลสินค้าเรียบร้อยแล้ว', 'success')
    } else {
      showToast('ลบสินค้าไม่สำเร็จ', 'error')
    }
  } catch (error) {
    console.error('Delete error:', error)
    showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
  } finally {
    deletingId.value = null
  }
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการข้อมูลสินค้า</h1>
        <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">ทั้งหมด {{ products.length }} รายการบนหน้าเว็บ
          <InfoTooltip title="หน้าจัดการสินค้าคืออะไร?" description="หน้านี้แสดงรายการสินค้าทั้งหมด สามารถค้นหา, กรอง และจัดลำดับได้<ul><li><strong>ลากจัดลำดับ:</strong> ลากแถวเพื่อเปลี่ยนลำดับการแสดงบนหน้าเว็บ</li><li><strong>สถานะ (แสดงผล/ซ่อน):</strong> กดปุ่ม Toggle เพื่อซ่อนสินค้าชั่วคราวโดยไม่ต้องลบ</li><li><strong>Flash Sale:</strong> สินค้าที่มีไอคอนสายฟ้าจะแสดงราคาลดแล้ว</li><li><strong>สต๊อก:</strong> ไม่จำกัด = ไม่ต้องติดตามจำนวน, คลิกแก้ไขเพื่อตั้งค่า</li></ul>" />
        </p>
      </div>
      <router-link to="/admin/products/new" class="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        เพิ่มสินค้าใหม่
      </router-link>
    </div>

    <!-- Filters & Search Bar -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6 space-y-4">
      <!-- Row 1: Search + Primary Filters -->
      <div class="flex flex-col lg:flex-row gap-3 items-stretch">
        <!-- Search -->
        <div class="relative flex-1 min-w-0 max-w-lg">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <svg class="w-4.5 h-4.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="ค้นหาชื่อสินค้า, SKU..." 
            class="pl-10 w-full bg-gray-50 border border-gray-200 hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white rounded-xl px-4 py-2.5 text-sm transition-all outline-none"
          >
        </div>

        <!-- Category Filter -->
        <FancySelect
          v-model="selectedCategory"
          :options="categoryOptions"
          icon="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          color="emerald"
          min-width="160px"
        />

        <!-- Status Filter -->
        <FancySelect
          v-model="selectedStatus"
          :options="statusOptions"
          icon="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          color="blue"
          min-width="130px"
        />

        <!-- Items per page -->
        <div class="flex items-center gap-2 text-sm text-gray-500 shrink-0 ml-auto bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
          <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          <select v-model="itemsPerPage" class="appearance-none bg-transparent text-sm font-bold text-gray-700 pr-5 cursor-pointer outline-none">
            <option v-for="opt in itemsPerPageOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <span class="text-gray-400">/ หน้า</span>
        </div>
      </div>
      
      <!-- Row 2: Advanced Filters -->
      <div class="flex flex-col sm:flex-row gap-3 items-center pt-3 border-t border-gray-100">
        <!-- Stock Filter -->
        <FancySelect
          v-model="selectedStock"
          :options="stockOptions"
          icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          color="violet"
          min-width="155px"
        />

        <!-- Sale Filter -->
        <FancySelect
          v-model="selectedSale"
          :options="saleOptions"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          color="orange"
          min-width="145px"
        />

        <!-- Sort -->
        <FancySelect
          v-model="sortBy"
          :options="sortOptions"
          icon="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
          color="gray"
          min-width="180px"
        />

        <!-- Result count + Reset -->
        <div class="ml-auto flex items-center gap-3">
          <button v-if="selectedCategory !== 'all' || selectedStatus !== 'all' || selectedStock !== 'all' || selectedSale !== 'all' || searchQuery" @click="searchQuery = ''; selectedCategory = 'all'; selectedStatus = 'all'; selectedStock = 'all'; selectedSale = 'all'; sortBy = 'newest'" class="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ล้างตัวกรอง
          </button>
          <div class="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
            พบ <span class="font-bold text-gray-700">{{ filteredProducts.length }}</span> / {{ products.length }} รายการ
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1">
      <div v-if="loading" class="p-8 text-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200/80">
            <tr class="text-gray-500 text-[11px] font-bold uppercase tracking-widest">
              <th class="px-6 py-4 w-10 text-center">ลำดับ</th>
              <th class="px-6 py-4">ภาพสินค้า</th>
              <th class="px-6 py-4">ข้อมูลสินค้า / SKU</th>
              <th class="px-6 py-4">ราคาปัจจุบัน</th>
              <th class="px-6 py-4">จำนวนคงเหลือ</th>
              <th class="px-6 py-4">วันที่อัปเดต</th>
              <th class="px-6 py-4">การแสดงผล</th>

              <th class="px-6 py-4 text-right">ตัวเลือกจัดการ</th>
            </tr>
          </thead>
          <draggable 
            v-if="!loading && paginatedProducts.length > 0"
            v-model="paginatedProducts" 
            tag="tbody" 
            item-key="id" 
            class="divide-y divide-gray-100/60 text-sm bg-white"
            handle=".drag-handle"
            @end="onDragEnd"
          >
            <template #item="{ element: product, index }">
              <tr class="hover:bg-emerald-50/40 transition-all duration-200 group">
                <td class="px-3 py-5 text-center">
                  <div class="drag-handle cursor-grab active:cursor-grabbing text-gray-300 group-hover:text-emerald-500 p-2 opacity-40 hover:opacity-100 transition-all bg-gray-50 hover:bg-emerald-100 rounded-xl mx-auto w-10 h-10 flex items-center justify-center">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                  </div>
                </td>
                <td class="px-6 py-5">
                <div class="relative w-16 h-16 rounded-2xl bg-gray-50 overflow-hidden border border-gray-200/70 shadow-sm group-hover:shadow-md transition-shadow">
                  <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100/50">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="font-extrabold text-gray-900 mb-1.5 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                  {{ product.name }}
                </div>
                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <!-- SKU Badge (Prominent, same row as category) -->
                  <span v-if="product.sku" class="inline-flex items-center gap-1 text-[11px] font-black font-mono text-slate-800 bg-slate-100 border border-slate-300/80 px-2.5 py-0.5 rounded-md shadow-2xs tracking-wide" title="รหัส SKU">
                    <span class="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-wider">SKU:</span>
                    <span>{{ product.sku }}</span>
                  </span>
                  <!-- Category Badges -->
                  <span v-for="cat in product.categories" :key="cat" class="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 inline-flex items-center px-2.5 py-0.5 rounded-md">{{ cat }}</span>
                  <!-- Review Rating Badge -->
                  <div v-if="settingsStore.showProductRating && product.review_count > 0" class="inline-flex items-center gap-1 text-[11px] font-bold text-yellow-700 bg-yellow-50 border border-yellow-200/60 px-2 py-0.5 rounded-md shadow-2xs">
                     <svg class="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                     {{ Number(product.rating || 5).toFixed(1) }} <span class="text-yellow-600/70">({{ product.review_count }})</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col gap-1">
                  <div v-if="product.original_price && product.original_price > product.price" class="flex items-center gap-1.5">
                    <span class="text-xs font-semibold text-gray-400 line-through">฿{{ new Intl.NumberFormat('th-TH').format(product.original_price) }}</span>
                    <span class="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">-{{ Math.round(((product.original_price - product.price) / product.original_price) * 100) }}%</span>
                  </div>
                  <div class="font-black text-gray-900 text-base flex items-center gap-1.5">
                    ฿{{ new Intl.NumberFormat('th-TH').format(product.price) }}
                    <div v-if="product.sale_end_date" class="relative flex items-center justify-center w-5 h-5 bg-orange-50 rounded-full border border-orange-200" title="Flash Sale Active">
                      <div class="absolute inset-0 bg-orange-400 opacity-20 rounded-full animate-ping"></div>
                      <svg class="w-3 h-3 text-orange-500 relative z-10" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.381z" clip-rule="evenodd"/></svg>
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="font-medium text-sm">
                  <div v-if="product.stock_quantity === null" class="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200/60 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                    ไม่จำกัด
                  </div>
                  <div v-else-if="product.stock_quantity > 0" class="inline-flex items-center gap-1.5 text-gray-700 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                    <div class="w-2 h-2 rounded-full" :class="product.stock_quantity < 10 ? 'bg-orange-400' : 'bg-emerald-400'"></div>
                    {{ product.stock_quantity }} ชิ้น
                  </div>
                  <div v-else class="inline-flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200/60 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm">
                    <div class="w-2 h-2 rounded-full bg-red-500"></div>
                    สินค้าหมด
                  </div>
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="text-xs font-semibold text-gray-500 whitespace-nowrap bg-gray-50/80 inline-block px-3 py-1.5 rounded-lg border border-gray-100">
                  {{ formatDate(product.created_at) }}
                </div>
              </td>
              <td class="px-6 py-5">
                <div class="flex flex-col items-center gap-1.5">
                  <button 
                    @click="toggleActive(product)"
                    :disabled="togglingId === product.id"
                    :class="['relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait', product.is_active ? 'bg-emerald-500' : 'bg-gray-200']"
                  >
                    <span v-if="togglingId === product.id" class="absolute inset-0 flex items-center justify-center">
                      <svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    </span>
                    <span v-else :class="['inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm', product.is_active ? 'translate-x-6' : 'translate-x-1']"></span>
                  </button>
                  <span class="text-[10px] font-bold tracking-wide" :class="product.is_active ? 'text-emerald-600' : 'text-gray-400'">
                    {{ product.is_active ? 'แสดงผล' : 'ซ่อน' }}
                  </span>
                </div>
              </td>

              <td class="px-6 py-5">
                <div class="flex items-center justify-end gap-2">
                  <router-link 
                    :to="`/admin/products/${product.id}/edit`" 
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50/90 hover:bg-blue-600 hover:text-white border border-blue-200/80 hover:border-blue-600 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 group/btn" 
                    title="แก้ไขสินค้า"
                  >
                    <svg class="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    <span>แก้ไข</span>
                  </router-link>
                  <button 
                    @click="deleteProduct(product)" 
                    :disabled="deletingId === product.id" 
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50/90 hover:bg-rose-600 hover:text-white border border-rose-200/80 hover:border-rose-600 rounded-xl transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait group/btn" 
                    title="ลบสินค้า"
                  >
                    <svg v-if="deletingId === product.id" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <svg v-else class="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    <span>ลบ</span>
                  </button>
                </div>
              </td>
            </tr>
            </template>
          </draggable>
          <tbody v-if="filteredProducts.length === 0 && !loading">
            <tr>
              <td colspan="9" class="px-6 py-16 text-center">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                  <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <h3 class="text-gray-900 font-bold text-lg mb-1">ไม่พบสินค้า</h3>
                <p class="text-gray-500">ไม่พบข้อมูลสินค้าที่ตรงกับเงื่อนไขการค้นหาของคุณ ปรับตัวกรองแล้วลองอีกครั้ง</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="filteredProducts.length > 0" class="border-t border-gray-200 px-6 py-4 flex items-center justify-between bg-gray-50/50">
        <div class="text-sm text-gray-500">
          แสดง <span class="font-bold text-gray-900">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> ถึง 
          <span class="font-bold text-gray-900">{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</span> 
          จากทั้งหมด <span class="font-bold text-gray-900">{{ filteredProducts.length }}</span> รายการ
        </div>
        <div class="flex items-center gap-1">
          <button 
            @click="changePage(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          
          <div class="flex items-center gap-1 mx-2">
            <template v-for="page in totalPages" :key="page">
              <!-- Show first, last, current, and adjacent pages -->
              <button 
                v-if="page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1"
                @click="changePage(page)"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-bold transition-colors flex items-center justify-center',
                  currentPage === page 
                    ? 'bg-emerald-600 text-white border-transparent' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                ]"
              >
                {{ page }}
              </button>
              <span v-else-if="page === currentPage - 2 || page === currentPage + 2" class="text-gray-400 px-1">...</span>
            </template>
          </div>

          <button 
            @click="changePage(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
