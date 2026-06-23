<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCompareStore } from '../stores/compareStore'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useToast } from '../composables/useToast'

const compareStore = useCompareStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const { showToast } = useToast()

const loading = ref(true)
const fullProducts = ref([])
const categoryTemplates = ref([])

const formatPrice = (price) => {
  if (!price) return '0'
  return Number(price).toLocaleString()
}

const fetchFullProducts = async () => {
  loading.value = true
  fullProducts.value = []
  try {
    const promises = compareStore.items.map(item =>
      fetch(`/api/products/${item.id}`).then(r => r.json())
    )
    const results = await Promise.allSettled(promises)
    fullProducts.value = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => {
        const p = r.value.data
        let attrs = []
        if (typeof p.attributes === 'string') {
          try { attrs = JSON.parse(p.attributes) || [] } catch { attrs = [] }
        } else if (Array.isArray(p.attributes)) {
          attrs = p.attributes
        }
        let cats = []
        if (typeof p.categories === 'string') {
          try { cats = JSON.parse(p.categories) || [] } catch { cats = [] }
        } else if (Array.isArray(p.categories)) {
          cats = p.categories
        }
        if (cats.length === 0 && p.category) {
          cats = [p.category]
        }
        return { 
          ...p, 
          parsedAttributes: attrs.filter(a => a.key && a.value),
          resolvedCategories: cats
        }
      })
      
    // Fetch attributes templates for ALL unique categories (not just the first)
    const uniqueCategories = [...new Set(fullProducts.value.flatMap(p => p.resolvedCategories || []).filter(Boolean))]
    const allTemplates = []
    
    for (const cat of uniqueCategories) {
      try {
        const tRes = await fetch(`/api/category-attributes/${encodeURIComponent(cat)}`)
        const tData = await tRes.json()
        if (tData.success && tData.data) {
          tData.data.forEach(t => {
            // Tag each template with its source category for context
            allTemplates.push({ ...t, _sourceCategory: cat })
          })
        }
      } catch(e) { console.error('Template fetch err for', cat, ':', e) }
    }
    
    categoryTemplates.value = allTemplates
  } catch (err) {
    console.error('Fetch compare products error:', err)
  } finally {
    loading.value = false
  }
}

// Merge all attribute keys from templates and all products
const allAttributeKeys = computed(() => {
  const keys = []
  const added = new Set()
  
  // 1. Add template keys first
  categoryTemplates.value.forEach(t => {
    keys.push({ key: t.attribute_key, label: t.attribute_label, isTemplate: true })
    added.add(t.attribute_key)
  })
  
  // 2. Add any custom keys not in template
  fullProducts.value.forEach(p => {
    p.parsedAttributes?.forEach(a => {
      if (!added.has(a.key)) {
        keys.push({ key: a.key, label: a.key, isTemplate: false })
        added.add(a.key)
      }
    })
  })
  
  return keys
})

const getAttributeValue = (product, key) => {
  const attr = product.parsedAttributes?.find(a => a.key === key)
  return attr ? attr.value : null
}

// Find cheapest product
const cheapestPrice = computed(() => {
  const prices = fullProducts.value.map(p => Number(p.price) || Infinity)
  return Math.min(...prices)
})

const removeProduct = (productId) => {
  compareStore.removeFromCompare(productId)
  fullProducts.value = fullProducts.value.filter(p => p.id !== productId)
}

const addToCart = async (product) => {
  try {
    await cartStore.addToCart({ ...product, title: product.name }, 1)
    showToast(`เพิ่ม ${product.name} ลงในตะกร้าแล้ว`, 'success')
  } catch {
    showToast('ไม่สามารถเพิ่มลงตะกร้าได้', 'error')
  }
}

onMounted(() => {
  if (compareStore.items.length > 0) {
    fetchFullProducts()
  } else {
    loading.value = false
  }
})
</script>

<template>
  <div class="bg-[#f8f9fa] dark:bg-[#0a0f16] min-h-screen pt-24 md:pt-32 pb-20 transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            เปรียบเทียบสินค้า
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">เปรียบเทียบคุณสมบัติของสินค้าที่คุณสนใจ แบบ side-by-side</p>
        </div>
        <button v-if="compareStore.itemCount > 0" @click="compareStore.clearAll(); fullProducts = []" class="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          ล้างทั้งหมด
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center min-h-[40vh]">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-800"></div>
          <div class="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="compareStore.itemCount === 0" class="text-center py-20">
        <div class="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
          <svg class="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">ยังไม่ได้เลือกสินค้าเปรียบเทียบ</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">เลือกสินค้าอย่างน้อย 2 ชิ้นจากหน้าสินค้า เพื่อเริ่มเปรียบเทียบคุณสมบัติ</p>
        <router-link to="/products" class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          ไปหน้าสินค้า
        </router-link>
      </div>

      <!-- Only 1 item info -->
      <div v-else-if="fullProducts.length === 1" class="text-center py-10">
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-8 max-w-lg mx-auto">
          <svg class="w-10 h-10 text-amber-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h3 class="text-lg font-bold text-amber-800 dark:text-amber-300 mb-2">เลือกสินค้าเพิ่มอีกอย่างน้อย 1 ชิ้น</h3>
          <p class="text-amber-700 dark:text-amber-400 text-sm mb-4">คุณเลือกไว้ 1 ชิ้น ต้องการอย่างน้อย 2 ชิ้นเพื่อเปรียบเทียบ</p>
          <router-link to="/products" class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-500 transition-all">
            เลือกสินค้าเพิ่ม
          </router-link>
        </div>
      </div>

      <!-- Comparison Table -->
      <div v-else class="overflow-x-auto -mx-4 px-4">
        <div class="min-w-[640px]">
          <table class="w-full border-collapse">
            <!-- Product Images -->
            <thead>
              <tr>
                <th class="w-40 md:w-52 p-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest align-top bg-white dark:bg-[#111827] rounded-tl-2xl border border-gray-100 dark:border-gray-800">
                  สินค้า
                </th>
                <th v-for="product in fullProducts" :key="'img-' + product.id" class="p-4 text-center align-top bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 last:rounded-tr-2xl" :class="{ 'min-w-[200px]': true }">
                  <div class="relative group">
                    <button @click="removeProduct(product.id)" class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600" title="ลบออก">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    <router-link :to="'/products/' + (product.slug || product.id)">
                      <img :src="product.image_url || '/placeholder.png'" :alt="product.name" class="w-28 h-28 md:w-36 md:h-36 object-contain mx-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 hover:scale-105 transition-transform">
                    </router-link>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              <!-- Name -->
              <tr>
                <td class="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">ชื่อสินค้า</td>
                <td v-for="product in fullProducts" :key="'name-' + product.id" class="p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                  <router-link :to="'/products/' + (product.slug || product.id)" class="text-sm font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2">
                    {{ product.name }}
                  </router-link>
                </td>
              </tr>

              <!-- Price -->
              <tr>
                <td class="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800">ราคา</td>
                <td v-for="product in fullProducts" :key="'price-' + product.id" class="p-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
                  <div class="flex items-center gap-2">
                    <span class="text-lg font-black" :class="Number(product.price) === cheapestPrice && fullProducts.length > 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'">
                      ฿{{ formatPrice(product.price) }}
                    </span>
                    <span v-if="Number(product.price) === cheapestPrice && fullProducts.length > 1" class="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      ถูกสุด
                    </span>
                  </div>
                  <span v-if="product.original_price && Number(product.original_price) > Number(product.price)" class="text-xs text-gray-500 dark:text-gray-400 line-through">฿{{ formatPrice(product.original_price) }}</span>
                </td>
              </tr>

              <!-- Category -->
              <tr>
                <td class="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">หมวดหมู่</td>
                <td v-for="product in fullProducts" :key="'cat-' + product.id" class="p-4 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="cat in product.resolvedCategories" :key="cat" class="text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full font-semibold border border-gray-200/50 dark:border-gray-700/50">{{ cat }}</span>
                  </div>
                </td>
              </tr>

              <!-- Stock -->
              <tr>
                <td class="p-4 text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800">สถานะ</td>
                <td v-for="product in fullProducts" :key="'stock-' + product.id" class="p-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800">
                  <span v-if="!product.is_out_of_stock" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">มีสินค้า</span>
                  <span v-else class="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full">สินค้าหมด</span>
                </td>
              </tr>

              <!-- Dynamic Attributes -->
              <tr v-for="(attrDef, idx) in allAttributeKeys" :key="'attr-' + attrDef.key">
                <td class="p-4 text-sm font-bold border border-gray-100 dark:border-gray-800"
                    :class="[idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : 'bg-white dark:bg-[#111827]', attrDef.isTemplate ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400']">
                  {{ attrDef.label }}
                </td>
                <td v-for="product in fullProducts" :key="'attr-' + product.id + '-' + attrDef.key" class="p-4 border border-gray-100 dark:border-gray-800" :class="idx % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : 'bg-white dark:bg-[#111827]'">
                  <span v-if="getAttributeValue(product, attrDef.key)" class="text-sm text-gray-800 dark:text-gray-200 font-medium whitespace-pre-line">{{ getAttributeValue(product, attrDef.key) }}</span>
                  <span v-else class="text-sm text-gray-300 dark:text-gray-600">—</span>
                </td>
              </tr>

              <!-- Actions -->
              <tr>
                <td class="p-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800 rounded-bl-2xl"></td>
                <td v-for="(product, idx) in fullProducts" :key="'action-' + product.id" class="p-4 bg-white dark:bg-[#111827] border border-gray-100 dark:border-gray-800" :class="{ 'rounded-br-2xl': idx === fullProducts.length - 1 }">
                  <div class="flex flex-col gap-2">
                    <router-link :to="'/products/' + (product.slug || product.id)" class="w-full text-center px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      ดูรายละเอียด
                    </router-link>
                    <button v-if="settingsStore.isOnlineShoppingEnabled && !product.is_out_of_stock" @click="addToCart(product)" class="w-full px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                      เพิ่มลงตะกร้า
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>
