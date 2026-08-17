<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '../stores/settingsStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])
const router = useRouter()
const settingsStore = useSettingsStore()

const searchQuery = ref('')
const results = ref([])
const loading = ref(false)
const searchInput = ref(null)
const activeIndex = ref(-1)
const categories = ref([])
const recentSearches = ref([])
let debounceTimer = null

// Load recent searches from localStorage
const loadRecent = () => {
  try { recentSearches.value = JSON.parse(localStorage.getItem('recentSearches') || '[]').slice(0, 5) } catch { recentSearches.value = [] }
}
const saveRecent = (q) => {
  if (!q || q.length < 2) return
  const list = recentSearches.value.filter(s => s !== q)
  list.unshift(q)
  recentSearches.value = list.slice(0, 5)
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}
const clearRecent = () => { recentSearches.value = []; localStorage.removeItem('recentSearches') }

const close = () => { emit('update:modelValue', false); searchQuery.value = ''; results.value = []; activeIndex.value = -1 }

const search = async (q) => {
  if (!q || q.length < 2) { results.value = []; return }
  loading.value = true
  activeIndex.value = -1
  try {
    const [prodRes, artRes] = await Promise.allSettled([
      fetch(`/api/products?search=${encodeURIComponent(q)}`).then(r => r.json()),
      fetch(`/api/articles?search=${encodeURIComponent(q)}`).then(r => r.json()),
    ])
    const items = []
    if (prodRes.status === 'fulfilled' && prodRes.value.success) {
      prodRes.value.data.slice(0, 5).forEach(p => {
        let catLabel = p.category
        if (Array.isArray(p.categories) && p.categories.length > 0) {
          catLabel = p.categories.join(', ')
        } else if (p.categories) {
          try {
            const parsed = typeof p.categories === 'string' ? JSON.parse(p.categories) : p.categories
            if (Array.isArray(parsed) && parsed.length > 0) {
              catLabel = parsed.join(', ')
            }
          } catch(e) {}
        }
        items.push({ type: 'product', title: p.name, subtitle: catLabel || '', image: p.image_url, link: `/products/${p.slug || p.id}`, price: p.price, originalPrice: p.original_price })
      })
    }
    if (artRes.status === 'fulfilled' && artRes.value.success) {
      (artRes.value.data || []).slice(0, 3).forEach(a => {
        items.push({ type: 'article', title: a.title, subtitle: a.category || 'บทความ', image: a.cover_image, link: `/blog/${a.slug || a.id}` })
      })
    }
    results.value = items
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const groupedResults = computed(() => {
  const products = results.value.filter(r => r.type === 'product')
  const articles = results.value.filter(r => r.type === 'article')
  return { products, articles }
})

watch(searchQuery, (val) => { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => search(val), 300) })
watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
    loadRecent()
    fetch('/api/categories').then(r => r.json()).then(d => { if (d.success) categories.value = d.data.slice(0, 6) }).catch(() => {})
    setTimeout(() => searchInput.value?.focus(), 150)
  } else { document.body.style.overflow = '' }
})

const goTo = (link) => { saveRecent(searchQuery.value); router.push(link); close() }
const searchFromRecent = (q) => { searchQuery.value = q; search(q) }
const searchByCategory = (name) => { router.push(`/products/category/${encodeURIComponent(name)}`); close() }

const flatResults = computed(() => results.value)
const handleKeydown = (e) => {
  if (e.key === 'Escape') { close(); return }
  if (!props.modelValue) return
  if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex.value = Math.min(activeIndex.value + 1, flatResults.value.length - 1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex.value = Math.max(activeIndex.value - 1, -1) }
  else if (e.key === 'Enter' && activeIndex.value >= 0 && flatResults.value[activeIndex.value]) { e.preventDefault(); goTo(flatResults.value[activeIndex.value].link) }
}

const formatPrice = (p) => p != null ? '฿' + Number(p).toLocaleString() : ''

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => { window.removeEventListener('keydown', handleKeydown); document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <transition name="search-overlay">
      <div v-if="modelValue" class="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4" @click.self="close">
        <div class="absolute inset-0 bg-black/70 backdrop-blur-md"></div>

        <div class="relative w-full max-w-2xl transform transition-all">
          <!-- Search Card -->
          <div class="bg-white dark:bg-[#111827] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200/80 dark:border-gray-700/50 overflow-hidden">

            <!-- Input Area -->
            <div class="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div class="relative flex-shrink-0">
                <svg v-if="!loading" class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <div v-else class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <input ref="searchInput" v-model="searchQuery" type="text" placeholder="ค้นหาสินค้า, บทความ, หมวดหมู่..." class="flex-1 text-base sm:text-lg font-medium bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400" autocomplete="off" />
              <div class="flex items-center gap-2 flex-shrink-0">
                <kbd v-if="!searchQuery" class="hidden sm:inline-flex items-center px-2 py-1 text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">ESC</kbd>
                <button v-if="searchQuery" @click="searchQuery = ''; results = []; searchInput?.focus()" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
                <button @click="close" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <!-- Content Area -->
            <div class="max-h-[55vh] overflow-y-auto overscroll-contain">

              <!-- Skeleton Loading -->
              <div v-if="loading" class="p-4 space-y-3">
                <div v-for="n in 3" :key="n" class="flex items-center gap-4 px-3 py-3 animate-pulse">
                  <div class="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4"></div>
                    <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg w-1/2"></div>
                  </div>
                </div>
              </div>

              <!-- Results -->
              <div v-else-if="results.length > 0" class="py-2">
                <!-- Products -->
                <template v-if="groupedResults.products.length">
                  <div class="px-5 pt-3 pb-1.5">
                    <span class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">สินค้า</span>
                  </div>
                  <button v-for="(item, i) in groupedResults.products" :key="item.link" @click="goTo(item.link)"
                    :class="['w-full flex items-center gap-4 px-5 py-3 transition-all duration-150 text-left group', activeIndex === i ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']">
                    <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-200/50 dark:border-gray-700/50 group-hover:border-emerald-300 dark:group-hover:border-emerald-700 transition-colors">
                      <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-[14px] text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{{ item.title }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[11px] text-gray-400 truncate">{{ item.subtitle }}</span>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                      <div v-if="item.originalPrice && item.originalPrice > item.price" class="text-[11px] text-gray-500 dark:text-gray-400 line-through">{{ formatPrice(item.originalPrice) }}</div>
                      <div class="text-sm font-black text-emerald-600 dark:text-emerald-400">{{ formatPrice(item.price) }}</div>
                    </div>
                  </button>
                </template>

                <!-- Articles -->
                <template v-if="groupedResults.articles.length">
                  <div class="px-5 pt-4 pb-1.5">
                    <span class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">บทความ</span>
                  </div>
                  <button v-for="(item, idx) in groupedResults.articles" :key="item.link" @click="goTo(item.link)"
                    :class="['w-full flex items-center gap-4 px-5 py-3 transition-all duration-150 text-left group', activeIndex === (groupedResults.products.length + idx) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']">
                    <div class="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      <img v-if="item.image" :src="item.image" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-bold text-[14px] text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ item.title }}</p>
                      <span class="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 mt-1 inline-block">{{ item.subtitle }}</span>
                    </div>
                    <svg class="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0 group-hover:translate-x-0.5 transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </template>

                <!-- View All -->
                <div class="px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                  <button @click="router.push(`/products?search=${encodeURIComponent(searchQuery)}`); close()" class="w-full text-center py-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-xl transition-colors">
                    ดูผลลัพธ์ทั้งหมดสำหรับ "{{ searchQuery }}" →
                  </button>
                </div>
              </div>

              <!-- No Results -->
              <div v-else-if="searchQuery.length >= 2 && !loading" class="py-12 text-center px-6">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <p class="text-gray-900 dark:text-white font-bold mb-1">ไม่พบผลลัพธ์</p>
                <p class="text-sm text-gray-400">ลองค้นหาด้วยคำค้นอื่น หรือเลือกจากหมวดหมู่ด้านล่าง</p>
              </div>

              <!-- Initial State: Recent + Categories -->
              <div v-else class="py-3">
                <!-- Recent Searches -->
                <div v-if="recentSearches.length > 0" class="px-5 pb-3">
                  <div class="flex items-center justify-between mb-2.5">
                    <span class="text-[11px] font-black text-gray-400 uppercase tracking-widest">ค้นหาล่าสุด</span>
                    <button @click="clearRecent" class="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors">ล้างทั้งหมด</button>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="q in recentSearches" :key="q" @click="searchFromRecent(q)" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all">
                      <svg class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {{ q }}
                    </button>
                  </div>
                </div>

                <!-- Quick Categories -->
                <div v-if="categories.length > 0" class="px-5 pb-2" :class="recentSearches.length ? 'pt-3 border-t border-gray-100 dark:border-gray-800' : ''">
                  <span class="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 block">หมวดหมู่ยอดนิยม</span>
                  <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button v-for="cat in categories" :key="cat.id" @click="searchByCategory(cat.name)" class="group flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all">
                      <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                        <img v-if="cat.icon_url" :src="cat.icon_url" class="w-5 h-5 object-contain filter invert dark:invert-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                        <img v-else-if="cat.image_url" :src="cat.image_url" class="w-full h-full object-cover" />
                        <svg v-else class="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                      </div>
                      <span class="text-[13px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate transition-colors">{{ cat.name }}</span>
                    </button>
                  </div>
                </div>

                <!-- Quick Links -->
                <div class="px-5 py-3 border-t border-gray-100 dark:border-gray-800 mt-1">
                  <div class="flex flex-wrap gap-2">
                    <button @click="router.push('/projects'); close()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:shadow-md transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                      ผลงานการติดตั้ง
                    </button>
                    <button @click="router.push('/quotation'); close()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:shadow-md transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      ขอใบเสนอราคา
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-between px-5 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
              <div class="hidden sm:flex items-center gap-3">
                <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-[10px]">↑↓</kbd> เลื่อน</span>
                <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-[10px]">↵</kbd> เลือก</span>
                <span class="flex items-center gap-1"><kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 font-mono text-[10px]">esc</kbd> ปิด</span>
              </div>
              <span class="sm:hidden">กดค้นหาเพื่อเริ่มต้น</span>
              <span v-if="settingsStore.storeName" class="font-medium">Powered by <span class="text-emerald-500 font-bold">{{ settingsStore.storeName }}</span></span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.search-overlay-enter-active { transition: opacity 0.2s ease; }
.search-overlay-enter-active > div:last-child { transition: opacity 0.2s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.search-overlay-leave-active { transition: opacity 0.15s ease; }
.search-overlay-leave-active > div:last-child { transition: opacity 0.15s ease, transform 0.15s ease; }
.search-overlay-enter-from { opacity: 0; }
.search-overlay-enter-from > div:last-child { opacity: 0; transform: translateY(-20px) scale(0.97); }
.search-overlay-leave-to { opacity: 0; }
.search-overlay-leave-to > div:last-child { opacity: 0; transform: translateY(-10px) scale(0.98); }
</style>
