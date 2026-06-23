<script setup>
import { computed } from 'vue'
import { useTrackingStore } from '../stores/tracking'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const props = defineProps({
  excludeProductId: { type: String, default: '' }
})

const trackingStore = useTrackingStore()

const displayProducts = computed(() => {
  return trackingStore.recentlyViewed
    .filter(p => p.id !== props.excludeProductId)
    .slice(0, 6)
})

const formatPrice = (price) => {
  if (!price || price <= 0) return 'สอบถามราคา'
  return `฿${Number(price).toLocaleString()}`
}


</script>

<template>
  <div v-if="displayProducts.length >= 2" class="rv-section">
    <!-- Section Header -->
    <div class="rv-header flex items-center justify-between">
      <div class="rv-header-left flex items-center gap-3">
        <div class="rv-icon-wrap">
          <svg class="rv-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="rv-title">สินค้าที่คุณเพิ่งดู</h3>
        <span class="rv-count">{{ displayProducts.length }} รายการ</span>
      </div>
      
      <!-- View More Button -->
      <router-link v-if="trackingStore.recentlyViewed.filter(p => p.id !== props.excludeProductId).length > 6" to="/recently-viewed" class="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm">
        ดูทั้งหมด
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
      </router-link>
    </div>

    <!-- Horizontal Scroll Strip -->
    <div class="rv-scroll-container">
      <div class="rv-scroll-track">
        <router-link
          v-for="product in displayProducts"
          :key="product.id"
          :to="`/products/${product.slug || product.id}`"
          class="rv-card"
        >
          <!-- Image -->
          <div class="rv-card-img-wrap">
            <img 
              :src="getOptimizedImageUrl(product.image_url, 200) || '/images/home/hero-slide-1.webp'"
              :alt="product.name"
              class="rv-card-img"
              @error="(e) => { 
                onImageError(e); 
                if (e.target.src.includes('placeholder') || e.target.dataset.fallbackAttempted === 'original') {
                  e.target.src = '/images/home/hero-slide-1.webp';
                }
              }"
            />
            <div class="rv-card-category" :title="(Array.isArray(product.categories) && product.categories.length > 0) ? product.categories.join(', ') : (product.category || '')">
              {{ (Array.isArray(product.categories) && product.categories.length > 0) ? product.categories.join(', ') : (product.category || '') }}
            </div>
          </div>

          <!-- Info -->
          <div class="rv-card-info">
            <p class="rv-card-name" :title="product.name">{{ product.name }}</p>
            <div class="rv-card-price-row">
              <span class="rv-card-price">{{ formatPrice(product.price) }}</span>
              <span v-if="product.original_price && product.original_price > product.price" class="rv-card-original">
                ฿{{ Number(product.original_price).toLocaleString() }}
              </span>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rv-section {
  margin-top: 2.5rem;
  margin-bottom: 1rem;
}

.rv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.rv-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rv-icon-wrap {
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.rv-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: white;
}

.rv-title {
  font-size: 1.25rem;
  font-weight: 900;
  color: #111827;
  letter-spacing: -0.02em;
}

:global(.dark) .rv-title {
  color: white;
}

.rv-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

:global(.dark) .rv-count {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
}

.rv-scroll-container {
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 0.5rem;
  margin: 0 -0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.rv-scroll-container::-webkit-scrollbar {
  height: 4px;
}
.rv-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.rv-scroll-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}
:global(.dark) .rv-scroll-container::-webkit-scrollbar-thumb {
  background: #374151;
}

.rv-scroll-track {
  display: flex;
  gap: 0.875rem;
  width: max-content;
}

.rv-card {
  display: flex;
  flex-direction: column;
  width: 11rem;
  flex-shrink: 0;
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #f3f4f6;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
}

:global(.dark) .rv-card {
  background: #111827;
  border-color: #1f2937;
}

.rv-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  border-color: #a5b4fc;
}

:global(.dark) .rv-card:hover {
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.1);
  border-color: #6366f1;
}

.rv-card-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f9fafb;
}

:global(.dark) .rv-card-img-wrap {
  background: #0d1117;
}

.rv-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.rv-card:hover .rv-card-img {
  transform: scale(1.08);
}

.rv-card-category {
  position: absolute;
  bottom: 0.375rem;
  left: 0.375rem;
  font-size: 0.55rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: white;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rv-card-info {
  padding: 0.625rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.rv-card-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

:global(.dark) .rv-card-name {
  color: #f3f4f6;
}

.rv-card-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.rv-card-price {
  font-size: 0.8rem;
  font-weight: 900;
  color: #059669;
}

:global(.dark) .rv-card-price {
  color: #34d399;
}

.rv-card-original {
  font-size: 0.65rem;
  color: #9ca3af;
  text-decoration: line-through;
}
</style>
