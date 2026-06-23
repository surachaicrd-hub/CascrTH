<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cartStore'
import { useTrackingStore } from '../stores/tracking'

const cartStore = useCartStore()
const trackingStore = useTrackingStore()
const router = useRouter()
const enriching = ref(false)

// Enrich cart items with product data if missing (fix stale localStorage)
const enrichCartItems = async () => {
  const needsEnrich = cartStore.items.filter(i => !i.name || !i.image_url)
  if (needsEnrich.length === 0) return
  enriching.value = true
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) {
      const productsMap = {}
      data.data.forEach(p => { productsMap[p.id] = p })
      cartStore.items.forEach(item => {
        const pid = item.product_id || item.id
        const product = productsMap[pid]
        if (product) {
          if (!item.name) item.name = product.name
          if (!item.image_url) item.image_url = product.image_url
          if (!item.category) item.category = product.category
          if (!item.size) item.size = product.size
          if (!item.slug) item.slug = product.slug
          if (item.price === undefined || item.price === null) item.price = product.price
          if (item.original_price === undefined) item.original_price = product.original_price
          if (!item.images) {
            try { item.images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images } catch { item.images = [] }
          }
        }
      })
    }
  } catch (e) { console.error('Enrich cart error:', e) }
  finally { enriching.value = false }
}

onMounted(() => { enrichCartItems() })

const proceedToCheckout = () => {
  if (cartStore.items.length === 0) return;
  trackingStore.trackEvent({
    type: 'begin_checkout',
    itemsCount: cartStore.cartTotal,
    totalValue: cartStore.subtotal
  });
  router.push('/checkout')
}

const getProductImage = (item) => {
  if (item.image_url && item.image_url !== '') return item.image_url
  if (item.cover_image) return item.cover_image
  if (item.images) {
    const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0]
  }
  return null
}

const getProductLink = (item) => {
  const slug = item.slug || item.product_id || item.id
  return `/products/${slug}`
}

const formatPrice = (val) => {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0
  return n.toLocaleString()
}

const hasDiscount = (item) => {
  const op = parseFloat(item.original_price)
  const p = parseFloat(item.price)
  return op && op > p
}

const discountPercent = (item) => {
  const op = parseFloat(item.original_price)
  const p = parseFloat(item.price)
  if (!op || op <= p) return 0
  return Math.round(((op - p) / op) * 100)
}

const removingId = ref(null)
const handleRemove = async (item) => {
  removingId.value = item.cart_item_id || item.id
  await cartStore.removeFromCart(item.id, item.cart_item_id)
  removingId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0f16] transition-colors">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">

      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-4">
          <router-link to="/products" class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all shadow-sm hover:shadow-md">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </router-link>
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">ตะกร้าสินค้า</h1>
            <p v-if="cartStore.items.length > 0" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ cartStore.cartTotal }} รายการในตะกร้าของคุณ</p>
          </div>
        </div>
        <router-link v-if="cartStore.items.length > 0" to="/products" class="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
          เลือกสินค้าเพิ่ม
        </router-link>
      </div>

      <!-- Empty State -->
      <div v-if="cartStore.items.length === 0 && !cartStore.loading" class="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#111827] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div class="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-8">
          <svg class="w-14 h-14 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 class="text-2xl font-black text-gray-900 dark:text-white mb-2">ตะกร้ายังว่างอยู่</h2>
        <p class="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-center text-sm leading-relaxed">ค้นหาสินค้าที่คุณต้องการ แล้วเพิ่มลงตะกร้าได้เลย!</p>
        <router-link to="/products" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-10 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
          ไปเลือกสินค้า
        </router-link>
      </div>

      <!-- Cart Layout -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative items-start">

        <!-- Loading Overlay -->
        <div v-if="cartStore.loading || enriching" class="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
          <div class="flex flex-col items-center gap-3">
            <div class="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-sm font-medium text-gray-500">กำลังโหลด...</span>
          </div>
        </div>

        <!-- Left: Cart Items -->
        <div class="lg:col-span-8 space-y-4">
          <TransitionGroup name="cart-item" tag="div" class="space-y-4">
            <div v-for="item in cartStore.items" :key="item.cart_item_id || item.id"
              :class="['bg-white dark:bg-[#111827] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700', removingId === (item.cart_item_id || item.id) ? 'opacity-50 scale-98' : '']">

              <div class="flex flex-col sm:flex-row">
                <!-- Product Image -->
                <router-link :to="getProductLink(item)" class="relative w-full sm:w-44 h-44 sm:h-auto flex-shrink-0 bg-gray-50 dark:bg-gray-800 overflow-hidden group">
                  <img v-if="getProductImage(item)" :src="getProductImage(item)" :alt="item.name || 'สินค้า'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div v-else class="w-full h-full flex items-center justify-center min-h-[160px]">
                    <svg class="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <!-- Discount Badge -->
                  <div v-if="hasDiscount(item)" class="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                    -{{ discountPercent(item) }}%
                  </div>
                </router-link>

                <!-- Product Info -->
                <div class="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                  <div>
                    <!-- Top row: Name + Delete -->
                    <div class="flex justify-between items-start gap-3 mb-2">
                      <div class="flex-1 min-w-0">
                        <router-link :to="getProductLink(item)" class="text-base sm:text-lg font-bold text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                          {{ item.name || 'สินค้า #' + (item.product_id || item.id).toString().substring(0,8) }}
                        </router-link>
                        <div class="flex flex-wrap items-center gap-2 mt-1.5">
                          <span v-if="item.category" class="text-[11px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md">{{ item.category }}</span>
                          <span v-if="item.size" class="text-[11px] font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                            {{ item.size }}
                          </span>
                          <span v-if="item.sku" class="text-[11px] text-gray-400 dark:text-gray-500">SKU: {{ item.sku }}</span>
                        </div>
                      </div>
                      <button @click="handleRemove(item)" class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="ลบออกจากตะกร้า">
                        <svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Bottom row: Qty + Price -->
                  <div class="flex flex-wrap items-end justify-between gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <!-- Quantity -->
                    <div class="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
                      <button @click="cartStore.updateQuantity(item.id, item.cart_item_id, item.quantity - 1)" :disabled="item.quantity <= 1"
                        class="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4" /></svg>
                      </button>
                      <span class="w-10 text-center text-sm font-black text-gray-900 dark:text-white select-none">{{ item.quantity || 1 }}</span>
                      <button @click="cartStore.updateQuantity(item.id, item.cart_item_id, item.quantity + 1)"
                        :disabled="item.limit_one_per_order || (item.stock_quantity !== null && item.stock_quantity !== undefined && item.quantity >= item.stock_quantity)"
                        class="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    <!-- Price -->
                    <div class="text-right">
                      <div v-if="hasDiscount(item)" class="text-[13px] text-gray-500 dark:text-gray-400 line-through mb-0.5">
                        ฿{{ formatPrice(parseFloat(item.original_price) * (item.quantity || 1)) }}
                      </div>
                      <div class="text-xl font-black text-gray-900 dark:text-white">
                        ฿{{ formatPrice((parseFloat(item.price) || 0) * (item.quantity || 1)) }}
                      </div>
                      <div class="text-[11px] text-gray-400 mt-0.5">฿{{ formatPrice(item.price) }} / ชิ้น</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <!-- Continue Shopping (Mobile) -->
          <router-link to="/products" class="sm:hidden flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-all mt-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            เลือกสินค้าเพิ่มเติม
          </router-link>
        </div>

        <!-- Right: Order Summary -->
        <div class="lg:col-span-4 sticky top-28">
          <div class="bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <h2 class="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                สรุปคำสั่งซื้อ
              </h2>
            </div>

            <div class="p-6">
              <!-- Item Summary -->
              <div class="space-y-3 text-sm mb-6">
                <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>ยอดรวมสินค้า ({{ cartStore.cartTotal }} ชิ้น)</span>
                  <span class="font-bold text-gray-900 dark:text-white">฿{{ formatPrice(cartStore.subtotal + cartStore.discountTotal) }}</span>
                </div>
                <div v-if="cartStore.discountTotal > 0" class="flex justify-between items-center">
                  <span class="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    ส่วนลดสินค้า
                  </span>
                  <span class="font-bold text-emerald-600 dark:text-emerald-400">-฿{{ formatPrice(cartStore.discountTotal) }}</span>
                </div>
                <div class="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>ค่าจัดส่ง</span>
                  <span class="font-medium text-gray-500">คำนวณเมื่อชำระเงิน</span>
                </div>
              </div>

              <!-- Total -->
              <div class="pt-5 border-t border-gray-100 dark:border-gray-800 mb-6">
                <div class="flex justify-between items-end">
                  <div>
                    <span class="text-sm text-gray-500">ยอดสุทธิ</span>
                  </div>
                  <div class="text-right">
                    <div class="text-3xl font-black text-emerald-600 dark:text-emerald-400">฿{{ formatPrice(cartStore.subtotal) }}</div>
                    <p class="text-[10px] text-gray-400 mt-1">ราคารวมภาษีมูลค่าเพิ่มแล้ว</p>
                  </div>
                </div>
              </div>

              <!-- Checkout Button -->
              <button @click="proceedToCheckout" class="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30 flex items-center justify-center gap-3 text-base">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                ดำเนินการชำระเงิน
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>

              <!-- Trust Badges -->
              <div class="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                <div class="flex items-center justify-center gap-5 text-gray-400">
                  <div class="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    ปลอดภัย 100%
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    ชำระเงินง่าย
                  </div>
                  <div class="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    คุณภาพรับประกัน
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.cart-item-enter-active { transition: all 0.3s ease; }
.cart-item-leave-active { transition: all 0.25s ease; }
.cart-item-enter-from { opacity: 0; transform: translateX(-20px); }
.cart-item-leave-to { opacity: 0; transform: translateX(20px) scale(0.95); }
.cart-item-move { transition: transform 0.3s ease; }
.scale-98 { transform: scale(0.98); }
</style>
