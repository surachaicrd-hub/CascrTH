<script setup>
import { ref, onMounted } from 'vue'
import { useCartStore } from '../stores/cartStore'
import { useToast } from '../composables/useToast'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const props = defineProps({
  productId: { type: String, required: true }
})

const cartStore = useCartStore()
const { showToast } = useToast()

const products = ref([])
const loading = ref(true)
const addingAll = ref(false)

const formatPrice = (price) => {
  if (!price || price <= 0) return 'สอบถามราคา'
  return `฿${Number(price).toLocaleString()}`
}



const totalBundlePrice = () => {
  return products.value.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
}

const addAllToCart = async () => {
  addingAll.value = true
  try {
    for (const p of products.value) {
      await cartStore.addToCart({
        id: p.id,
        title: p.name,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        slug: p.slug
      }, 1)
    }
    showToast(`เพิ่ม ${products.value.length} สินค้าลงตะกร้าแล้ว`, 'success')
  } catch (err) {
    showToast('ไม่สามารถเพิ่มสินค้าได้', 'error')
  } finally {
    addingAll.value = false
  }
}

onMounted(async () => {
  try {
    const res = await fetch(`/api/track-interest/frequently-bought-together?productId=${props.productId}`)
    const data = await res.json()
    if (data.success && data.products && data.products.length > 0) {
      products.value = data.products
    }
  } catch (e) {
    console.error('Failed to load frequently bought together:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="!loading && products.length > 0" class="fbt-section">
    <!-- Header -->
    <div class="fbt-header">
      <div class="fbt-icon-wrap">
        <svg class="fbt-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
      <h3 class="fbt-title">ลูกค้ามักซื้อร่วมกัน</h3>
    </div>

    <!-- Product Row -->
    <div class="fbt-products">
      <router-link
        v-for="(product, idx) in products"
        :key="product.id"
        :to="`/products/${product.slug || product.id}`"
        class="fbt-product-card"
      >
        <!-- Plus separator -->
        <div v-if="idx > 0" class="fbt-plus">
          <svg class="fbt-plus-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        
        <div class="fbt-card-inner">
          <div class="fbt-card-img-wrap">
            <img 
              :src="getOptimizedImageUrl(product.image_url, 150) || '/images/home/hero-slide-1.webp'"
              :alt="product.name"
              class="fbt-card-img"
              @error="(e) => { 
                onImageError(e); 
                if (e.target.src.includes('placeholder') || e.target.dataset.fallbackAttempted === 'original') {
                  e.target.src = '/images/home/hero-slide-1.webp';
                }
              }"
            />
          </div>
          <div class="fbt-card-info">
            <p class="fbt-card-name">{{ product.name }}</p>
            <span class="fbt-card-price">{{ formatPrice(product.price) }}</span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Bundle CTA -->
    <div class="fbt-cta">
      <div class="fbt-cta-price">
        <span class="fbt-cta-label">ราคารวม Bundle</span>
        <span class="fbt-cta-total">฿{{ totalBundlePrice().toLocaleString() }}</span>
      </div>
      <button 
        @click.prevent="addAllToCart"
        :disabled="addingAll"
        class="fbt-cta-btn"
      >
        <svg v-if="!addingAll" class="fbt-cta-btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        <svg v-else class="fbt-cta-btn-icon animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {{ addingAll ? 'กำลังเพิ่ม...' : `เพิ่มทั้ง ${products.length} ชิ้นลงตะกร้า` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.fbt-section {
  background: white;
  border-radius: 1.5rem;
  border: 1px solid #f3f4f6;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}

:global(.dark) .fbt-section {
  background: #111827;
  border-color: #1f2937;
}

.fbt-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.fbt-icon-wrap {
  width: 2rem;
  height: 2rem;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.fbt-icon {
  width: 1rem;
  height: 1rem;
  color: white;
}

.fbt-title {
  font-size: 1rem;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.01em;
}

:global(.dark) .fbt-title {
  color: white;
}

.fbt-products {
  display: flex;
  align-items: stretch;
  gap: 0;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.fbt-products::-webkit-scrollbar {
  height: 3px;
}
.fbt-products::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}

.fbt-product-card {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  text-decoration: none;
}

.fbt-plus {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  flex-shrink: 0;
}

.fbt-plus-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #d1d5db;
}

:global(.dark) .fbt-plus-icon {
  color: #4b5563;
}

.fbt-card-inner {
  width: 7.5rem;
  border-radius: 0.875rem;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  transition: all 0.25s ease;
  background: #fafafa;
}

:global(.dark) .fbt-card-inner {
  background: #0d1117;
  border-color: #1f2937;
}

.fbt-product-card:hover .fbt-card-inner {
  border-color: #fbbf24;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1);
  transform: translateY(-2px);
}

.fbt-card-img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
}

.fbt-card-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.25rem;
  transition: transform 0.4s ease;
}

.fbt-product-card:hover .fbt-card-img {
  transform: scale(1.06);
}

.fbt-card-info {
  padding: 0.5rem;
}

.fbt-card-name {
  font-size: 0.65rem;
  font-weight: 700;
  color: #374151;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 0.25rem;
}

:global(.dark) .fbt-card-name {
  color: #d1d5db;
}

.fbt-card-price {
  font-size: 0.7rem;
  font-weight: 900;
  color: #059669;
}

:global(.dark) .fbt-card-price {
  color: #34d399;
}

.fbt-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
  gap: 1rem;
  flex-wrap: wrap;
}

:global(.dark) .fbt-cta {
  border-top-color: #1f2937;
}

.fbt-cta-price {
  display: flex;
  flex-direction: column;
}

.fbt-cta-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.fbt-cta-total {
  font-size: 1.25rem;
  font-weight: 900;
  color: #111827;
}

:global(.dark) .fbt-cta-total {
  color: white;
}

.fbt-cta-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
  padding: 0.75rem 1.25rem;
  border-radius: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
  white-space: nowrap;
}

.fbt-cta-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(249, 115, 22, 0.35);
}

.fbt-cta-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.fbt-cta-btn-icon {
  width: 1.125rem;
  height: 1.125rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
