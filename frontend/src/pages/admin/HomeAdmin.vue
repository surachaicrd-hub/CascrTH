<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const uploadingImage = ref(false)

// Active Tab
const activeTab = ref('slider')
const tabs = [
  { key: 'slider', label: '1. แบนเนอร์สไลด์หลัก (Hero Slider)', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'featured', label: '2. แบนเนอร์โปรโมชั่น & สินค้าแนะนำ', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { key: 'categories', label: '3. หมวดหมู่สินค้าแสดงหน้าแรก', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { key: 'visibility', label: '4. จัดการเปิด/ปิด Section หน้าแรก', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }
]

// Default Hero Slides
const defaultSlides = [
  {
    id: 1,
    tag: '★ บ้านเก็บของ PP',
    titleLine1: 'บ้านเก็บของ.com',
    titleLine2: 'บ้านเก็บของพลาสติก PP ทนแดด ทนฝน',
    desc: 'ผลิตด้วยพลาสติก PP (Polypropylene) แข็งแรง ทนแดด',
    ctaText: 'บ้านเก็บของพลาสติก PP',
    ctaLink: '/products',
    ctaText2: 'คำนวณพื้นที่จัดเก็บ',
    ctaLink2: '/space-calculator',
    image: '/images/home/hero-slide-1.webp',
    badgeHighlight: 'เกรดพรีเมียม',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'รับประกัน 10 ปี',
    badgeFeatureIcon: 'wrench',
    badgeSpecial: 'ดีไซน์สไตล์โมเดิร์น',
    badgeSpecialIcon: 'house'
  },
  {
    id: 2,
    tag: '★ บ้านเก็บของพลาสติก HDPE ลายไม้',
    titleLine1: 'แข็งแกร่ง ทนทาน',
    titleLine2: 'สวยงามกลมกลืนกับสวนหลังบ้าน',
    desc: 'ผลิตจากพลาสติก HDPE หนาสองชั้น ป้องกันรังสี UV 100% ไม่เป็นสนิม ไม่ผุกร่อน ตลอดอายุการใช้งาน',
    ctaText: 'เลือกดูรุ่นพลาสติก',
    ctaLink: '/products',
    ctaText2: 'คำนวณพื้นที่จัดเก็บ',
    ctaLink2: '/space-calculator',
    image: '/images/home/hero-slide-2.webp',
    badgeHighlight: 'ผิวลายไม้ธรรมชาติ',
    badgeHighlightIcon: 'leaf',
    badgeFeature: 'กันรังสี UV 100%',
    badgeFeatureIcon: 'sun',
    badgeSpecial: 'ทนแดดทนฝน 100%',
    badgeSpecialIcon: 'rain'
  },
  {
    id: 3,
    tag: '★ บ้านเก็บของโลหะ Galvalume',
    titleLine1: 'โครงสร้างเหล็กกล้าแข็งแรง',
    titleLine2: 'ปลอดภัยด้วยระบบล็อกมาตรฐาน',
    desc: 'ทนลมแรงสูงสุด 120 กม./ชม. อบสีความร้อน 4 ชั้น กันสนิม พร้อมช่องระบายอากาศป้องกันกลิ่นอับชื้น',
    ctaText: 'เลือกดูรุ่นโลหะ',
    ctaLink: '/products',
    ctaText2: 'คำนวณพื้นที่จัดเก็บ',
    ctaLink2: '/space-calculator',
    image: '/images/home/hero-slide-3.webp',
    badgeHighlight: 'เหล็ก Galvalume USA',
    badgeHighlightIcon: 'shield',
    badgeFeature: 'ทนลมแรง 120 กม./ชม.',
    badgeFeatureIcon: 'wind',
    badgeSpecial: 'ระบบล็อกมาตรฐาน',
    badgeSpecialIcon: 'lock'
  }
]

const defaultHeroFeatureBadges = [
  { icon: 'shield', title: 'วัสดุคุณภาพ', desc: 'แข็งแรง ทนทาน' },
  { icon: 'sun', title: 'กันแดด กันฝน', desc: 'ทนทุกสภาพอากาศ' },
  { icon: 'wrench', title: 'ประกอบง่าย', desc: 'รวดเร็ว ไม่ยุ่งยาก' }
]

const slides = ref([...defaultSlides])
const heroFeatureBadges = ref([...defaultHeroFeatureBadges])

// TAB 2: Promos & Featured Banner Data
const bannerTag = ref('คัดสรรสินค้าคุณภาพ')
const bannerTitle = ref('บ้านเก็บของ ที่แข็งแรง ทนทาน')
const bannerSubtitle = ref('ใช้งานได้ยาวนาน คุ้มค่าคุ้มราคา')
const bannerImage = ref('/images/home/banner-sheds.webp')
const bannerBadgeText = ref('สินค้าขายดี')
const bannerBadgeSub = ref('อันดับ 1')
const bannerBullets = ref(['กันแดด กันฝน', 'วัสดุแข็งแรง', 'ประกอบง่าย', 'ดีไซน์สวย'])

const promoTag = ref('Premium Quality')
const promoTitle = ref('โซลูชันจัดเก็บ ครบจบในที่เดียว')
const promoDesc = ref('แข็งแรง ทนทาน ใช้งานได้นาน ดีไซน์สไตล์โมเดิร์น')
const promoBtnText = ref('ดูเพิ่มเติม')
const promoBtnLink = ref('/products')
const promoImage = ref('/images/home/hdpe-shed-promo.webp')

const whyChooseUsTitle = ref('ทำไมต้องเลือกเรา?')
const whyChooseUsBullets = ref(['ดีไซน์สวย ทันสมัย', 'วัสดุแข็งแรง ทนทาน', 'กันแดด กันฝน 100%', 'ประกอบง่าย รวดเร็ว', 'เพิ่มพื้นที่ใช้บ้านเป็นระเบียบ', 'คุ้มค่า คุ้มราคา'])

// TAB 3: Category Showcase Settings & Product Selector Data
const allCategories = ref([])
const allProducts = ref([])
const categoryShowcase = ref([]) // Array of { categoryId, productIds }

// TAB 4: Section Visibility Toggles
const homeShowTestimonials = ref(true)
const homeShowPartners = ref(true)
const homeShowAffiliates = ref(true)
const homeShowFaq = ref(true)

const homeShowFeatures = ref(true)

// Icon Options
const iconOptions = [
  { value: 'shield', label: 'โล่ (Shield)' },
  { value: 'sun', label: 'ดวงอาทิตย์ (Sun)' },
  { value: 'wrench', label: 'ประแจ (Wrench)' },
  { value: 'trophy', label: 'ถ้วยรางวัล (Trophy)' },
  { value: 'leaf', label: 'ใบไม้ (Leaf)' },
  { value: 'house', label: 'บ้าน (House)' },
  { value: 'rain', label: 'ฝน (Rain)' },
  { value: 'wind', label: 'ลม (Wind)' },
  { value: 'lock', label: 'กุญแจ (Lock)' }
]

// Upload Handler
const handleImageUpload = async (event, targetRef) => {
  const file = event.target.files[0]
  if (!file) return

  uploadingImage.value = true
  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      if (typeof targetRef === 'function') {
        targetRef(data.url)
      } else {
        targetRef.value = data.url
      }
      showToast('อัพโหลดรูปภาพสำเร็จ', 'success')
    } else {
      showToast(data.message || 'เกิดข้อผิดพลาดในการอัพโหลด', 'error')
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    showToast('เกิดข้อผิดพลาดในการอัพโหลด', 'error')
  } finally {
    uploadingImage.value = false
    event.target.value = ''
  }
}

// Slide Helpers
const addSlide = () => {
  slides.value.push({
    id: Date.now(),
    tag: '★ สินค้ายอดนิยม',
    titleLine1: 'บ้านเก็บของพรีเมียม',
    titleLine2: 'เพื่อบ้านและสวนของคุณ',
    desc: 'ยกระดับพื้นที่ด้วยบ้านเก็บของและโรงจอดรถคุณภาพสูง ทนทานทุกสภาวะอากาศ',
    ctaText: 'เลือกชมสินค้า',
    ctaLink: '/products',
    ctaText2: 'คำนวณพื้นที่จัดเก็บ',
    ctaLink2: '/space-calculator',
    image: '/images/home/hero-slide-1.webp',
    badgeHighlight: 'เกรดพรีเมียม',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'รับประกัน 10 ปี',
    badgeFeatureIcon: 'wrench',
    badgeSpecial: 'ดีไซน์โมเดิร์น',
    badgeSpecialIcon: 'house'
  })
}

const removeSlide = async (index) => {
  const confirmed = await showConfirm({
    title: 'ยืนยันการลบสไลด์',
    message: `คุณต้องการลบแบนเนอร์สไลด์ที่ ${index + 1} ใช่หรือไม่?`,
    confirmText: 'ลบสไลด์',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (confirmed) {
    slides.value.splice(index, 1)
    showToast('ลบแบนเนอร์เรียบร้อยแล้ว', 'success')
  }
}

// Bullet Item Helpers
const addBannerBullet = () => {
  bannerBullets.value.push('จุดเด่นใหม่')
}

const removeBannerBullet = (idx) => {
  bannerBullets.value.splice(idx, 1)
}

const addWhyBullet = () => {
  whyChooseUsBullets.value.push('เหตุผลใหม่')
}

const removeWhyBullet = (idx) => {
  whyChooseUsBullets.value.splice(idx, 1)
}

// Category Showcase Helpers
const addCategoryShowcase = () => {
  const unselectedCat = allCategories.value.find(c => !categoryShowcase.value.some(s => String(s.categoryId) === String(c.id)))
  const catId = unselectedCat ? unselectedCat.id : (allCategories.value[0]?.id || 1)
  categoryShowcase.value.push({
    categoryId: catId,
    productIds: []
  })
}

const removeCategoryShowcase = (index) => {
  categoryShowcase.value.splice(index, 1)
}

const getProductsForCategory = (catId) => {
  const cat = allCategories.value.find(c => String(c.id) === String(catId))
  if (!cat) return allProducts.value
  return allProducts.value.filter(p => String(p.category_id) === String(catId) || p.category === cat.name)
}

const toggleShowcaseProduct = (showcase, prodId) => {
  if (!showcase.productIds) showcase.productIds = []
  const idx = showcase.productIds.indexOf(prodId)
  if (idx > -1) {
    showcase.productIds.splice(idx, 1)
  } else {
    showcase.productIds.push(prodId)
  }
}

// Fetch Initial Data
const fetchData = async () => {
  loading.value = true
  try {
    // 1. Fetch categories & products for selectors
    const [catRes, prodRes, settingsRes] = await Promise.all([
      apiFetch('/api/categories').catch(() => null),
      apiFetch('/api/products').catch(() => null),
      apiFetch('/api/settings')
    ])

    if (catRes) {
      const catData = await catRes.json()
      if (catData.success && catData.data) allCategories.value = catData.data
    }

    if (prodRes) {
      const prodData = await prodRes.json()
      if (prodData.success && prodData.data) allProducts.value = prodData.data
    }

    const data = await settingsRes.json()
    if (data.success && data.data) {
      const s = data.data

      // Slides
      try {
        const parsedSlides = s.home_slides ? JSON.parse(s.home_slides) : []
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) slides.value = parsedSlides
      } catch (e) {}

      // Hero Badges
      try {
        const parsedBadges = s.home_hero_feature_badges ? JSON.parse(s.home_hero_feature_badges) : []
        if (Array.isArray(parsedBadges) && parsedBadges.length > 0) heroFeatureBadges.value = parsedBadges
      } catch (e) {}

      // Top Banner
      if (s.home_banner_tag) bannerTag.value = s.home_banner_tag
      if (s.home_banner_title) bannerTitle.value = s.home_banner_title
      if (s.home_banner_subtitle) bannerSubtitle.value = s.home_banner_subtitle
      if (s.home_banner_image) bannerImage.value = s.home_banner_image
      if (s.home_banner_badge_text) bannerBadgeText.value = s.home_banner_badge_text
      if (s.home_banner_badge_sub) bannerBadgeSub.value = s.home_banner_badge_sub
      try {
        const parsedBullets = s.home_banner_bullets ? JSON.parse(s.home_banner_bullets) : null
        if (Array.isArray(parsedBullets)) bannerBullets.value = parsedBullets
      } catch (e) {}

      // Promo Card
      if (s.home_promo_tag) promoTag.value = s.home_promo_tag
      if (s.home_promo_title) promoTitle.value = s.home_promo_title
      if (s.home_promo_desc) promoDesc.value = s.home_promo_desc
      if (s.home_promo_btn_text) promoBtnText.value = s.home_promo_btn_text
      if (s.home_promo_btn_link) promoBtnLink.value = s.home_promo_btn_link
      if (s.home_promo_image) promoImage.value = s.home_promo_image

      // Why Choose Us
      if (s.home_why_choose_us_title) whyChooseUsTitle.value = s.home_why_choose_us_title
      try {
        const parsedWhy = s.home_why_choose_us_bullets ? JSON.parse(s.home_why_choose_us_bullets) : null
        if (Array.isArray(parsedWhy)) whyChooseUsBullets.value = parsedWhy
      } catch (e) {}

      // Category Showcase
      try {
        const parsedShowcase = s.home_category_showcase ? JSON.parse(s.home_category_showcase) : []
        if (Array.isArray(parsedShowcase)) categoryShowcase.value = parsedShowcase
      } catch (e) {}

      // Visibility Toggles
      homeShowTestimonials.value = s.home_show_testimonials !== 'false'
      homeShowPartners.value = s.home_show_partners !== 'false'
      homeShowAffiliates.value = s.home_show_affiliates !== 'false'
      homeShowFaq.value = s.home_show_faq !== 'false'

      homeShowFeatures.value = s.home_show_features !== 'false'
    }
  } catch (error) {
    console.error('Error loading homepage settings:', error)
    showToast('เกิดข้อผิดพลาด ไม่สามารถดึงข้อมูลได้', 'error')
  } finally {
    loading.value = false
  }
}

// Batch Save Settings
const saveSettings = async () => {
  saving.value = true
  try {
    const payload = {
      settings: [
        { key: 'home_slides', value: JSON.stringify(slides.value) },
        { key: 'home_hero_feature_badges', value: JSON.stringify(heroFeatureBadges.value) },
        { key: 'home_banner_tag', value: bannerTag.value },
        { key: 'home_banner_title', value: bannerTitle.value },
        { key: 'home_banner_subtitle', value: bannerSubtitle.value },
        { key: 'home_banner_image', value: bannerImage.value },
        { key: 'home_banner_badge_text', value: bannerBadgeText.value },
        { key: 'home_banner_badge_sub', value: bannerBadgeSub.value },
        { key: 'home_banner_bullets', value: JSON.stringify(bannerBullets.value) },
        { key: 'home_promo_tag', value: promoTag.value },
        { key: 'home_promo_title', value: promoTitle.value },
        { key: 'home_promo_desc', value: promoDesc.value },
        { key: 'home_promo_btn_text', value: promoBtnText.value },
        { key: 'home_promo_btn_link', value: promoBtnLink.value },
        { key: 'home_promo_image', value: promoImage.value },
        { key: 'home_why_choose_us_title', value: whyChooseUsTitle.value },
        { key: 'home_why_choose_us_bullets', value: JSON.stringify(whyChooseUsBullets.value) },
        { key: 'home_category_showcase', value: JSON.stringify(categoryShowcase.value) },
        { key: 'home_show_testimonials', value: String(homeShowTestimonials.value) },
        { key: 'home_show_partners', value: String(homeShowPartners.value) },
        { key: 'home_show_affiliates', value: String(homeShowAffiliates.value) },
        { key: 'home_show_faq', value: String(homeShowFaq.value) },

        { key: 'home_show_features', value: String(homeShowFeatures.value) }
      ]
    }

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    const data = await res.json()

    if (data.success) {
      showToast('บันทึกการตั้งค่าหน้าแรกเรียบร้อยแล้ว', 'success')
    } else {
      showToast(data.message || 'เกิดข้อผิดพลาดในการบันทึก', 'error')
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('เกิดข้อผิดพลาดในการบันทึก', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 p-6 md:p-10 pb-28">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <span>จัดการแสดงสินค้า & แบนเนอร์หน้าแรก (Homepage Showcase Admin)</span>
          </h1>
          <p class="text-gray-500 text-sm mt-1">ตั้งค่าและจัดระเบียบการแสดงสินค้า สไลด์ แบนเนอร์โปรโมชั่น และหมวดหมู่ในหน้าหลักแบบมืออาชีพ</p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="bg-white p-12 rounded-2xl shadow-sm text-center">
        <div class="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-gray-500 font-medium">กำลังโหลดข้อมูลการตั้งค่าหน้าแรก...</p>
      </div>

      <!-- Content Area -->
      <div v-else class="space-y-6">
        
        <!-- Navigation Tabs -->
        <div class="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all',
              activeTab === tab.key
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            ]"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon" />
            </svg>
            {{ tab.label }}
          </button>
        </div>

        <form @submit.prevent="saveSettings" class="space-y-6">
          
          <!-- ==================== TAB 1: ตั้งค่าสไลด์หน้าแรก ==================== -->
          <div v-show="activeTab === 'slider'" class="space-y-6">
            
            <!-- Hero Slider Cards Container -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    รายการแบนเนอร์สไลด์ (Hero Slider Banners)
                  </h2>
                  <p class="text-xs text-gray-500 mt-0.5">ลากเพื่อสลับลำดับการแสดงผลแบนเนอร์สไลด์บนหน้าแรก</p>
                </div>
                <button type="button" @click="addSlide" class="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition flex items-center gap-2 shadow-sm">
                  <span>+ เพิ่มสไลด์ใหม่</span>
                </button>
              </div>

              <div class="p-6 space-y-6">
                <div v-if="slides.length === 0" class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  ยังไม่มีแบนเนอร์สไลด์ กดปุ่ม "+ เพิ่มสไลด์ใหม่" เพื่อเริ่มต้น
                </div>

                <draggable v-model="slides" item-key="id" handle=".slide-drag-handle" class="space-y-6">
                  <template #item="{ element: slide, index }">
                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative space-y-5">
                      
                      <!-- Card Header Bar -->
                      <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div class="flex items-center gap-3">
                          <span class="slide-drag-handle cursor-grab active:cursor-grabbing p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 shadow-xs" title="ลากเพื่อจัดลำดับ">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                          </span>
                          <span class="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span>สไลด์ที่ {{ index + 1 }}</span>
                            <span v-if="slide.tag" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-md">
                              {{ slide.tag }}
                            </span>
                          </span>
                        </div>
                        <button type="button" @click="removeSlide(index)" class="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-100">
                          ลบสไลด์นี้
                        </button>
                      </div>

                      <!-- Main Form Inputs -->
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <!-- Tag Badge -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">แท็กป้ายกำกับด้านบน (Tag Badge)</label>
                          <input type="text" v-model="slide.tag" placeholder="เช่น ★ บ้านเก็บของ PP" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium">
                        </div>

                        <!-- Image Input & Upload -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพแบนเนอร์สไลด์ (Slide Image)</label>
                          <div class="flex items-center gap-2">
                            <input type="text" v-model="slide.image" placeholder="/images/home/hero-slide-1.webp" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                            <label class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border border-gray-300 shrink-0">
                              อัพโหลดรูป...
                              <input type="file" accept="image/*" class="hidden" @change="(e) => handleImageUpload(e, (url) => slide.image = url)">
                            </label>
                          </div>
                        </div>

                        <!-- Title Line 1 -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลัก บรรทัดที่ 1 (Title Line 1)</label>
                          <input type="text" v-model="slide.titleLine1" placeholder="เช่น บ้านเก็บของ.com" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                        </div>

                        <!-- Title Line 2 -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลัก บรรทัดที่ 2 (Title Line 2)</label>
                          <input type="text" v-model="slide.titleLine2" placeholder="เช่น บ้านเก็บของพลาสติก PP ทนแดด ทนฝน" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-blue-600">
                        </div>

                        <!-- Description -->
                        <div class="md:col-span-2">
                          <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายรายละเอียด (Description)</label>
                          <textarea v-model="slide.desc" rows="2" placeholder="ผลิตด้วยพลาสติก PP (Polypropylene) แข็งแรง ทนแดด" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <!-- Button 1 (Primary CTA) -->
                        <div class="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                          <span class="text-xs font-bold text-blue-600 block">ปุ่มกดหลัก (Primary Button)</span>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ข้อความบนปุ่ม</label>
                              <input type="text" v-model="slide.ctaText" placeholder="บ้านเก็บของพลาสติก PP" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ลิงก์ปลายทาง</label>
                              <input type="text" v-model="slide.ctaLink" placeholder="/products" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                            </div>
                          </div>
                        </div>

                        <!-- Button 2 (Secondary CTA) -->
                        <div class="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                          <span class="text-xs font-bold text-gray-700 block">ปุ่มกดรอง (Secondary Button)</span>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ข้อความบนปุ่ม</label>
                              <input type="text" v-model="slide.ctaText2" placeholder="คำนวณพื้นที่จัดเก็บ" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ลิงก์ปลายทาง</label>
                              <input type="text" v-model="slide.ctaLink2" placeholder="/space-calculator" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                            </div>
                          </div>
                        </div>

                      </div>

                      <!-- Badges inside Slide Card -->
                      <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                        <span class="text-xs font-bold text-gray-700 block">ป้ายจุดเด่นย่อยบนภาพสไลด์ (Slide Badges 3 รายการ)</span>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div class="space-y-1">
                            <label class="block text-[10px] font-bold text-gray-500">จุดเด่น 1 (Highlight)</label>
                            <input type="text" v-model="slide.badgeHighlight" placeholder="เกรดพรีเมียม" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                          </div>
                          <div class="space-y-1">
                            <label class="block text-[10px] font-bold text-gray-500">จุดเด่น 2 (Feature)</label>
                            <input type="text" v-model="slide.badgeFeature" placeholder="รับประกัน 10 ปี" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                          </div>
                          <div class="space-y-1">
                            <label class="block text-[10px] font-bold text-gray-500">จุดเด่น 3 (Special)</label>
                            <input type="text" v-model="slide.badgeSpecial" placeholder="ดีไซน์สไตล์โมเดิร์น" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                          </div>
                        </div>
                      </div>

                      <!-- Image Thumbnail Preview -->
                      <div v-if="slide.image" class="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                        <img :src="slide.image" class="w-24 h-16 object-cover rounded-lg border border-gray-200 shadow-xs" @error="(e) => e.target.src = '/images/placeholder.png'">
                        <div>
                          <p class="text-xs font-bold text-gray-800">ตัวอย่างภาพสไลด์ที่ {{ index + 1 }}</p>
                          <p class="text-[10px] text-gray-500 break-all">{{ slide.image }}</p>
                        </div>
                      </div>

                    </div>
                  </template>
                </draggable>
              </div>
            </div>

            <!-- Bottom Hero Feature Badges -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  การ์ดจุดเด่นมุมซ้ายล่างสไลด์ (Hero Feature Badges 3 การ์ด)
                </h2>
                <p class="text-xs text-gray-500 mt-0.5">การ์ดแสดง 3 ไอคอนจุดเด่นที่ซ้อนอยู่มุมซ้ายล่างของแบนเนอร์สไลด์</p>
              </div>

              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div v-for="(badge, idx) in heroFeatureBadges" :key="idx" class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-blue-600">การ์ดที่ {{ idx + 1 }}</span>
                    </div>
                    
                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 mb-1">ไอคอน</label>
                      <select v-model="badge.icon" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold">
                        <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 mb-1">หัวข้อหลัก</label>
                      <input type="text" v-model="badge.title" placeholder="เช่น วัสดุคุณภาพ" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                    </div>

                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 mb-1">รายละเอียดขยายความ</label>
                      <input type="text" v-model="badge.desc" placeholder="เช่น แข็งแรง ทนทาน" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ==================== TAB 2: แบนเนอร์โปรโมชั่น & สินค้าแนะนำ ==================== -->
          <div v-show="activeTab === 'featured'" class="space-y-6">
            
            <!-- Top Hero Banner Settings -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
                  แบนเนอร์แนะนำสินค้าหลัก (Top Featured Showcase Banner)
                </h2>
                <p class="text-xs text-gray-500 mt-0.5">แบนเนอร์กว้างด้านขวาในส่วนสินค้าลดราคา/สินค้าแนะนำ</p>
              </div>

              <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">แท็กป้ายกำกับ (Tagline)</label>
                    <input type="text" v-model="bannerTag" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพแบนเนอร์ (Banner Photo)</label>
                    <div class="flex items-center gap-2">
                      <input type="text" v-model="bannerImage" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                      <label class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border border-gray-300 shrink-0">
                        อัพโหลด...
                        <input type="file" accept="image/*" class="hidden" @change="(e) => handleImageUpload(e, (url) => bannerImage = url)">
                      </label>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลัก (Banner Title)</label>
                    <input type="text" v-model="bannerTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อย่อย (Banner Subtitle)</label>
                    <input type="text" v-model="bannerSubtitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-blue-600 font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">ข้อความในป้ายวงกลมส้ม (Badge Main Text)</label>
                    <input type="text" v-model="bannerBadgeText" placeholder="เช่น สินค้าขายดี" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">ข้อความบรรทัดล่างป้ายวงกลม (Badge Sub Text)</label>
                    <input type="text" v-model="bannerBadgeSub" placeholder="เช่น อันดับ 1" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                  </div>
                </div>

                <!-- Bullets List -->
                <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-bold text-gray-700">จุดเด่นย่อยบนแบนเนอร์ (Bullets List)</span>
                    <button type="button" @click="addBannerBullet" class="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-md hover:bg-blue-200 transition">
                      + เพิ่มจุดเด่น
                    </button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div v-for="(bullet, idx) in bannerBullets" :key="idx" class="flex items-center gap-2">
                      <input type="text" v-model="bannerBullets[idx]" class="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium">
                      <button type="button" @click="removeBannerBullet(idx)" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 font-bold bg-red-50 rounded">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Promo Card Settings -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                  การ์ดโปรโมชั่นไซด์บาร์ (Side Promo Card)
                </h2>
                <p class="text-xs text-gray-500 mt-0.5">การ์ดโซลูชันจัดเก็บโปรโมชั่นในแถบซ้าย</p>
              </div>

              <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">แท็กป้ายกำกับ (Tag)</label>
                    <input type="text" v-model="promoTag" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพสินค้าการ์ดโปรโมชั่น (Promo Image)</label>
                    <div class="flex items-center gap-2">
                      <input type="text" v-model="promoImage" class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <label class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer shrink-0">
                        อัพโหลด...
                        <input type="file" accept="image/*" class="hidden" @change="(e) => handleImageUpload(e, (url) => promoImage = url)">
                      </label>
                    </div>
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อการ์ดโปรโมชั่น (Title)</label>
                    <input type="text" v-model="promoTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-900">
                  </div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายรายละเอียด (Description)</label>
                    <textarea v-model="promoDesc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"></textarea>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">ข้อความบนปุ่ม</label>
                    <input type="text" v-model="promoBtnText" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">ลิงก์ปลายทางปุ่ม</label>
                    <input type="text" v-model="promoBtnLink" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  </div>
                </div>
              </div>
            </div>

            <!-- Why Choose Us Bullets -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 class="text-lg font-bold text-gray-900">การ์ดจุดเด่น "ทำไมต้องเลือกเรา?" (Why Choose Us)</h2>
                  <p class="text-xs text-gray-500 mt-0.5">จุดเด่นเช็กลิสต์ด้านขวาของส่วนสินค้าแนะนำ</p>
                </div>
                <button type="button" @click="addWhyBullet" class="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 transition">
                  + เพิ่มข้อความ
                </button>
              </div>

              <div class="p-6 space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลัก</label>
                  <input type="text" v-model="whyChooseUsTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="(bullet, idx) in whyChooseUsBullets" :key="idx" class="flex items-center gap-2">
                    <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                    <input type="text" v-model="whyChooseUsBullets[idx]" class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium">
                    <button type="button" @click="removeWhyBullet(idx)" class="text-red-500 hover:text-red-700 text-xs px-2 py-1 font-bold bg-red-50 rounded">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ==================== TAB 3: หมวดหมู่สินค้าแสดงหน้าแรก ==================== -->
          <div v-show="activeTab === 'categories'" class="space-y-6">
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    บล็อกหมวดหมู่สินค้าไฮไลต์บนหน้าแรก (Category Showcase Blocks)
                  </h2>
                  <p class="text-xs text-gray-500 mt-0.5">เลือกหมวดหมู่และกำหนดสินค้าเฉพาะที่จะนำมาแสดงเป็นบล็อกตารางบนหน้าแรก</p>
                </div>
                <button type="button" @click="addCategoryShowcase" class="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition shadow-sm">
                  + เพิ่มหมวดหมู่ไฮไลต์
                </button>
              </div>

              <div class="p-6 space-y-6">
                <div v-if="categoryShowcase.length === 0" class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  ยังไม่ได้เลือกหมวดหมู่แสดงบนหน้าแรก กดปุ่ม "+ เพิ่มหมวดหมู่ไฮไลต์" เพื่อเริ่มต้น
                </div>

                <draggable v-model="categoryShowcase" item-key="categoryId" handle=".cat-drag-handle" class="space-y-6">
                  <template #item="{ element: showcase, index }">
                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative space-y-4">
                      
                      <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div class="flex items-center gap-3">
                          <span class="cat-drag-handle cursor-grab active:cursor-grabbing p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600" title="ลากเพื่อจัดลำดับ">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                          </span>
                          <span class="font-bold text-gray-800 text-sm">หมวดหมู่ไฮไลต์ที่ {{ index + 1 }}</span>
                        </div>
                        <button type="button" @click="removeCategoryShowcase(index)" class="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                          ลบหมวดหมู่นี้
                        </button>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">เลือกหมวดหมู่สินค้า</label>
                          <select v-model="showcase.categoryId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-800">
                            <option v-for="cat in allCategories" :key="cat.id" :value="cat.id">
                              {{ cat.name }} (ID: {{ cat.id }})
                            </option>
                          </select>
                        </div>
                      </div>

                      <!-- Select specific products -->
                      <div class="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
                        <div class="flex justify-between items-center">
                          <span class="text-xs font-bold text-gray-700">เลือกลิสต์สินค้าเฉพาะในหมวดหมู่นี้ (เลือกได้หลายชิ้น หรือไม่เลือกเพื่อดึง 4 สินค้าล่าสุดอัตโนมัติ)</span>
                          <span class="text-[10px] font-bold text-blue-600">เลือกแล้ว {{ (showcase.productIds || []).length }} ชิ้น</span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-2 border border-gray-150 rounded-lg bg-gray-50/50">
                          <div
                            v-for="product in getProductsForCategory(showcase.categoryId)"
                            :key="product.id"
                            @click="toggleShowcaseProduct(showcase, product.id)"
                            :class="[
                              'flex items-center gap-2.5 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all',
                              (showcase.productIds || []).includes(product.id)
                                ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                            ]"
                          >
                            <input
                              type="checkbox"
                              :checked="(showcase.productIds || []).includes(product.id)"
                              class="rounded text-blue-500 focus:ring-blue-500 pointer-events-none"
                            />
                            <img :src="product.image_url || product.image || '/images/placeholder.png'" class="w-8 h-8 object-cover rounded border shrink-0">
                            <span class="truncate">{{ product.name }}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </template>
                </draggable>
              </div>
            </div>

          </div>

          <!-- ==================== TAB 4: จัดการเปิด/ปิด Section ==================== -->
          <div v-show="activeTab === 'visibility'" class="space-y-6">
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50">
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  ควบคุมการเปิด / ปิด การแสดงผล Section หน้าหลัก
                </h2>
                <p class="text-xs text-gray-500 mt-0.5">เปิดหรือปิดส่วนประกอบต่างๆ ของหน้าแรกได้อย่างอิสระ</p>
              </div>

              <div class="p-6 divide-y divide-gray-100">
                


                <div class="py-4 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-gray-800">Section จุดเด่นแบรนด์ (Brand Features)</h3>
                    <p class="text-xs text-gray-500">แสดงการเปรียบเทียบจุดเด่น 10-Year Warranty และวัสดุคุณภาพสูง</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowFeatures" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div class="py-4 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-gray-800">Section รีวิวจากลูกค้า (Customer Testimonials & Reviews)</h3>
                    <p class="text-xs text-gray-500">แสดงรีวิวความประทับใจ การใช้งานจริงจากลูกค้า</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowTestimonials" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div class="py-4 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-gray-800">Section พันธมิตรธุรกิจ (Corporate Partners & Clients)</h3>
                    <p class="text-xs text-gray-500">แสดงโลโก้องค์กร บริษัท และหน่วยงานที่ไว้วางใจ</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowPartners" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

                <div class="py-4 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-gray-800">Section คำถามที่พบบ่อย (FAQs Section)</h3>
                    <p class="text-xs text-gray-500">แสดงรายการคำถาม-คำตอบที่พบบ่อยในหน้าแรก</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowFaq" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>

              </div>
            </div>

          </div>

          <!-- Bottom Save Floating Bar -->
          <div class="fixed bottom-0 right-0 left-64 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button type="submit" :disabled="saving || uploadingImage" class="bg-blue-500 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <svg v-if="saving" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              {{ saving ? 'กำลังบันทึก...' : uploadingImage ? 'กำลังอัพโหลดรูป...' : 'บันทึกการตั้งค่าทั้งหมด' }}
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</template>
