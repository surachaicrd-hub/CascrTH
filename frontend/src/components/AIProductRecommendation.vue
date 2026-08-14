<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTrackingStore } from '../stores/tracking'

const trackingStore = useTrackingStore()
const route = useRoute()

const recommendations = ref([])
const activeIndex = ref(0)
const isVisible = ref(false)
const loading = ref(false)

// Config (loaded from settings API)
const displayDelay = ref(15) // seconds - default
const cooldownMinutes = ref(60) // minutes - default
const isAiEnabled = ref(true) // default
const productCount = ref(4) // default
const STORAGE_KEY = 'ai_rec_closed_at'

const currentProduct = computed(() => recommendations.value[activeIndex.value] || null)

const checkCooldown = () => {
  const closedAt = localStorage.getItem(STORAGE_KEY)
  if (!closedAt) return true
  
  const elapsed = (Date.now() - parseInt(closedAt, 10)) / (1000 * 60)
  return elapsed > cooldownMinutes.value
}

const formatPrice = (price) => {
  if (!price || price <= 0) return 'สอบถามราคา'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(price)
}

const fetchRecommendation = async () => {
    if (!checkCooldown()) return
    if (!isAiEnabled.value) return

    // Safety check for session
    if (!trackingStore.sessionId) {
        trackingStore.initSession()
    }

    loading.value = true
    try {
        const res = await fetch(`/api/track-interest/smart-recommendation?sessionId=${trackingStore.sessionId}&limit=${productCount.value}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        
        if (data.success && data.products && data.products.length > 0) {
            recommendations.value = data.products.map(p => {
                // Reformat image URL if it's stored as JSON array string
                let imageUrl = p.image_url
                if (imageUrl) {
                    try {
                        const parsed = JSON.parse(imageUrl)
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            imageUrl = parsed[0]
                        }
                    } catch (e) { /* not json */ }
                } else {
                    imageUrl = '/images/home/hero-slide-1.webp'
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
                    id: p.id,
                    sku: p.sku || '',
                    slug: p.slug,
                    title: p.name,
                    price: Number(p.price) || 0,
                    originalPrice: p.original_price ? Number(p.original_price) : null,
                    image: imageUrl,
                    categories: cats,
                    category: cats.join(', ') || p.category || '',
                    isAiPredict: data.source === 'ai_enhanced' || data.source === 'scoring'
                }
            })
            
            activeIndex.value = 0

            // Show widget after a small delay to mimic "analysis"
            setTimeout(() => {
                isVisible.value = true
            }, 1200)
        }
    } catch (error) {
        console.error('Widget error:', error)
    } finally {
        loading.value = false
    }
}

const closeWidget = () => {
    isVisible.value = false
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
}

const nextProduct = () => {
    if (recommendations.value.length <= 1) return
    activeIndex.value = (activeIndex.value + 1) % recommendations.value.length
}

const prevProduct = () => {
    if (recommendations.value.length <= 1) return
    activeIndex.value = (activeIndex.value - 1 + recommendations.value.length) % recommendations.value.length
}

// Auto-rotate every 5s
let rotateInterval = null
const startAutoRotate = () => {
    if (rotateInterval) clearInterval(rotateInterval)
    if (recommendations.value.length > 1) {
        rotateInterval = setInterval(nextProduct, 5000)
    }
}

const stopAutoRotate = () => {
    if (rotateInterval) {
        clearInterval(rotateInterval)
        rotateInterval = null
    }
}

onMounted(async () => {
    // Load settings first, then start the widget timer
    try {
        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok) {
            const settingsData = await settingsRes.json()
            if (settingsData.success && settingsData.data) {
                if (settingsData.data.ai_recommendation_enabled !== undefined) {
                    isAiEnabled.value = String(settingsData.data.ai_recommendation_enabled) !== 'false'
                }
                if (settingsData.data.ai_widget_delay !== undefined) {
                    displayDelay.value = parseInt(settingsData.data.ai_widget_delay) || 15
                }
                if (settingsData.data.ai_widget_cooldown !== undefined) {
                    cooldownMinutes.value = parseInt(settingsData.data.ai_widget_cooldown) || 60
                }
                if (settingsData.data.ai_widget_product_count !== undefined) {
                    productCount.value = parseInt(settingsData.data.ai_widget_product_count) || 4
                }
            }
        }
    } catch (e) {
        // Use defaults if settings fail
    }
    
    if (isAiEnabled.value) {
        setTimeout(fetchRecommendation, displayDelay.value * 1000)
    }
})

watch(() => route.path, () => {
    if (!isVisible.value && checkCooldown() && isAiEnabled.value) {
        setTimeout(fetchRecommendation, displayDelay.value * 1000)
    }
})

watch(isVisible, (val) => {
    if (val) startAutoRotate()
    else stopAutoRotate()
})
</script>

<template>
  <transition name="slide-up">
    <div 
      v-if="isVisible && currentProduct" 
      class="ai-widget"
      @mouseenter="stopAutoRotate"
      @mouseleave="startAutoRotate"
    >
      <!-- Close Button -->
      <button @click="closeWidget" class="ai-close-btn" aria-label="ปิด">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>

      <!-- AI Indicator Badge -->
      <div class="ai-badge">
        <svg class="ai-badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 21L8.188 15.904L3 15L8.188 14.096L9 9L9.813 14.096L15 15L9.813 15.904ZM19.007 10.08L18.5 13L17.993 10.08L15 9.57L17.993 9.06L18.5 6L19.007 9.06L22 9.57L19.007 10.08Z" />
        </svg>
        <span>AI แนะนำสำหรับคุณ</span>
        <!-- Dots indicator -->
        <div v-if="recommendations.length > 1" class="ai-dots">
          <button 
            v-for="(_, idx) in recommendations" 
            :key="idx"
            @click="activeIndex = idx"
            class="ai-dot"
            :class="{ 'ai-dot-active': idx === activeIndex }"
          />
        </div>
      </div>

      <!-- Product Card with transition -->
      <transition name="card-slide" mode="out-in">
        <div :key="activeIndex" class="ai-card-body">
          <router-link :to="`/products/${currentProduct.slug || currentProduct.id}`" @click="isVisible = false" class="ai-card-link">
            <!-- Thumbnail -->
            <div class="ai-thumb">
              <img :src="currentProduct.image" :alt="currentProduct.title" @error="currentProduct.image = '/images/home/hero-slide-1.webp'" class="ai-thumb-img">
            </div>
            
            <!-- Info -->
            <div class="ai-info">
              <h4 class="ai-product-name" :title="currentProduct.title">{{ currentProduct.title }}</h4>
              <div class="ai-price-row">
                <span class="ai-price">{{ formatPrice(currentProduct.price) }}</span>
                <span v-if="currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price" class="ai-original-price">
                  {{ formatPrice(currentProduct.originalPrice) }}
                </span>
              </div>
              <span v-if="currentProduct.sku" class="ai-sku">SKU: {{ currentProduct.sku }}</span>
              <span v-else-if="currentProduct.category && !/^[0-9a-fA-F-]{20,}$/.test(currentProduct.category)" class="ai-category">{{ currentProduct.category }}</span>
            </div>
          </router-link>
        </div>
      </transition>

      <!-- Navigation Arrows -->
      <div v-if="recommendations.length > 1" class="ai-nav">
        <button @click="prevProduct" class="ai-nav-btn" aria-label="ก่อนหน้า">
          <svg class="ai-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <span class="ai-nav-count">{{ activeIndex + 1 }}/{{ recommendations.length }}</span>
        <button @click="nextProduct" class="ai-nav-btn" aria-label="ถัดไป">
          <svg class="ai-nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>

      <!-- Action -->
      <router-link :to="`/products/${currentProduct.slug || currentProduct.id}`" @click="isVisible = false" class="ai-action-btn">
        ดูรายละเอียดสินค้า →
      </router-link>
    </div>
  </transition>
</template>

<style scoped>
.ai-widget {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  z-index: 50;
  width: 20rem;
  background: white;
  border-radius: 1.25rem;
  box-shadow: 0 20px 40px rgba(2, 32, 164, 0.12), 0 0 0 1px rgba(2, 32, 164, 0.08);
  overflow: hidden;
  border: 1px solid rgba(2, 32, 164, 0.15);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
}

.ai-widget:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 50px rgba(2, 32, 164, 0.18), 0 0 0 1px rgba(2, 32, 164, 0.15);
}

:global(.dark) .ai-widget {
  background: #111827;
  border-color: rgba(91, 124, 255, 0.3);
  box-shadow: 0 20px 45px rgba(0,0,0,0.5), 0 0 0 1px rgba(91, 124, 255, 0.2);
}

:global(.dark) .ai-widget:hover {
  box-shadow: 0 24px 50px rgba(91, 124, 255, 0.15), 0 0 0 1px rgba(91, 124, 255, 0.35);
}

/* Close Button */
.ai-close-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  padding: 0.375rem;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 999px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

:global(.dark) .ai-close-btn {
  background: rgba(0,0,0,0.5);
  color: #9ca3af;
}

.ai-close-btn:hover {
  color: #0220A4;
  background: white;
}

:global(.dark) .ai-close-btn:hover {
  color: white;
  background: #374151;
}

/* Badge */
.ai-badge {
  background: linear-gradient(135deg, #0220A4, #4169E1);
  color: white;
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding: 0.625rem 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.ai-badge-icon {
  width: 0.875rem;
  height: 0.875rem;
  animation: pulse 2s infinite;
  display: inline-block;
}

.ai-dots {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.ai-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.35);
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  padding: 0;
}

.ai-dot-active {
  background: white;
  width: 0.875rem;
}

/* Card Body */
.ai-card-body {
  padding: 0.875rem;
}

.ai-card-link {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  text-decoration: none;
}

.ai-thumb {
  width: 4rem;
  height: 4rem;
  border-radius: 0.875rem;
  overflow: hidden;
  flex-shrink: 0;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.3s ease;
}

:global(.dark) .ai-thumb {
  background: #0d1117;
  border-color: #1f2937;
}

.ai-card-link:hover .ai-thumb {
  border-color: #0220A4;
  box-shadow: 0 0 10px rgba(2, 32, 164, 0.15);
  transform: scale(1.03);
}

.ai-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 0.125rem;
}

.ai-info {
  flex: 1;
  min-width: 0;
}

.ai-product-name {
  font-size: 0.8rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 0.25rem;
  transition: color 0.2s ease;
}

:global(.dark) .ai-product-name {
  color: white;
}

.ai-card-link:hover .ai-product-name {
  color: #0220A4;
}

:global(.dark) .ai-card-link:hover .ai-product-name {
  color: #5B7CFF;
}

.ai-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  margin-bottom: 0.125rem;
}

.ai-price {
  font-size: 0.8rem;
  font-weight: 900;
  color: #0220A4;
}

:global(.dark) .ai-price {
  color: #5B7CFF;
}

.ai-original-price {
  font-size: 0.65rem;
  color: #9ca3af;
  text-decoration: line-through;
}

.ai-sku,
.ai-category {
  font-size: 0.6rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:global(.dark) .ai-sku,
:global(.dark) .ai-category {
  color: #9ca3af;
}

/* Navigation */
.ai-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0 0.875rem 0.5rem;
}

.ai-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

:global(.dark) .ai-nav-btn {
  background: #1f2937;
  border-color: #374151;
  color: #9ca3af;
}

.ai-nav-btn:hover {
  border-color: #0220A4;
  color: #0220A4;
}

.ai-nav-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.ai-nav-count {
  font-size: 0.65rem;
  font-weight: 800;
  color: #9ca3af;
  letter-spacing: 0.08em;
}

/* Action Button */
.ai-action-btn {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: #0220A4;
  background: #F3F5FF;
  border-top: 1px solid #E8EDFF;
  text-decoration: none;
  transition: all 0.2s;
}

:global(.dark) .ai-action-btn {
  background: rgba(2, 32, 164, 0.05);
  border-top-color: #1f2937;
  color: #5B7CFF;
}

.ai-action-btn:hover {
  background: #E8EDFF;
  color: #01166F;
}

:global(.dark) .ai-action-btn:hover {
  background: rgba(2, 32, 164, 0.1);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.card-slide-enter-active,
.card-slide-leave-active {
  transition: all 0.25s ease;
}

.card-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.card-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.85; }
}

/* Mobile responsive */
@media (max-width: 640px) {
  .ai-widget {
    left: 0.75rem;
    right: 0.75rem;
    width: auto;
    bottom: 1rem;
  }
}
</style>
