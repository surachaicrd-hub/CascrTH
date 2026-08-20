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
  { key: 'affiliates', label: '4. เครือข่ายธุรกิจ & บริษัทในเครือ', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'visibility', label: '5. จัดการเปิด/ปิด Section หน้าแรก', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' }
]

// Default Hero Slides
const defaultSlides = [
  {
    id: 1,
    image: '/uploads/image-1786691654969-434900526.webp',
    tag: 'CASTING • KODERA JAPAN',
    titleLine1: 'KODERA C371G CASTING',
    titleLine2: 'เครื่องตัดปอกสายไฟอัตโนมัติ รุ่นมาตรฐานยอดนิยม',
    desc: 'รุ่นมาตรฐาน สามารถติดตั้งออฟฟังก์ชั่นเสริมได้หลายแบบ รองรับขนาดสายไฟ AWG#7 (10sq) ถึง AWG#28 (0.08sq) ตัด ปอก ปั่นเกลียวครบจบในเครื่องเดียว',
    ctaText: 'ดูสเปก KODERA C371G',
    ctaLink: '/products/kodera-c371g-casting-wire-stripping-machine',
    ctaText2: 'ขอใบเสนอราคาด่วน',
    ctaLink2: '/quotation',
    badgeHighlight: 'มาตรฐานญี่ปุ่น 100%',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'AWG#7 (10sq) ~ AWG#28 (0.08sq)',
    badgeFeatureIcon: 'bolt',
    badgeSpecial: 'ตัด • ปอกปลาย • ปอกกลาง • ปั่นเกลียว',
    badgeSpecialIcon: 'wrench'
  },
  {
    id: 2,
    image: '/uploads/image-1786691924940-548125460.webp',
    tag: 'COMPACT HIGH PRECISION • KODERA JAPAN',
    titleLine1: 'KODERA C370G CASTING',
    titleLine2: 'เครื่องตัดปอกสายไฟขนาดกะทัดรัด ความแม่นยำสูง',
    desc: 'ตัวเครื่องขนาดกระทัดรัด ให้ประสิทธิภาพและความแม่นยำสูง รองรับขนาดสายไฟ AWG#10 (5.5sq) ถึง AWG#32 (0.03sq) เหมาะสำหรับไลน์ผลิตที่ต้องการประหยัดพื้นที่',
    ctaText: 'ดูสเปก KODERA C370G',
    ctaLink: '/products/kodera-c370g-wire-stripping-machine',
    ctaText2: 'ขอใบเสนอราคาด่วน',
    ctaLink2: '/quotation',
    badgeHighlight: 'ความแม่นยำสูง ±0.1mm',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'AWG#10 (5.5sq) ~ AWG#32 (0.03sq)',
    badgeFeatureIcon: 'bolt',
    badgeSpecial: 'ตัด • ปอกปลาย • ปอกกลางสาย',
    badgeSpecialIcon: 'shield'
  },
  {
    id: 3,
    image: '/uploads/image-1786691981472-331672943.webp',
    tag: 'LIGHTWEIGHT & FAST • KODERA JAPAN',
    titleLine1: 'KODERA C300A CASTING',
    titleLine2: 'เครื่องตัดปอกสายไฟขนาดเล็ก น้ำหนักเบา คล่องตัว',
    desc: 'เครื่องตัดปลอกสายไฟที่มีขนาดเล็ก และน้ำหนักเบา ซึ่งพัฒนาจากรุ่น C300 รองรับสายไฟ AWG#16 (1.25sq) ถึง AWG#36 (0.01sq) ทำงานรวดเร็ว เสถียร แม่นยำ',
    ctaText: 'ดูสเปก KODERA C300A',
    ctaLink: '/products/automatic-wire-stripper-c300a',
    ctaText2: 'ขอใบเสนอราคาด่วน',
    ctaLink2: '/quotation',
    badgeHighlight: 'ขนาดกะทัดรัด น้ำหนักเบา',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'AWG#16 (1.25sq) ~ AWG#36 (0.01sq)',
    badgeFeatureIcon: 'bolt',
    badgeSpecial: 'ตัด • ปอกปลาย • ปอกกลางสาย',
    badgeSpecialIcon: 'shield'
  },
  {
    id: 4,
    image: '/uploads/image-1786692728703-131134660.webp',
    tag: 'FLAT & RIBBON CABLE • KODERA JAPAN',
    titleLine1: 'KODERA C371AF CASTING',
    titleLine2: 'เครื่องตัดปอกสายไฟแบบสายแบนและสายแพ',
    desc: 'เครื่องตัดปลอกสายไฟแบบสายแบนและสายแพ รองรับขนาดสายไฟ AWG#7 (10sq) ถึง AWG#28 (0.08sq) ออกแบบสำหรับงานเฉพาะทางในอุตสาหกรรมอิเล็กทรอนิกส์และยานยนต์',
    ctaText: 'ดูสเปก KODERA C371AF',
    ctaLink: '/products/casting-c371ag-wire-stripping-machine',
    ctaText2: 'ขอใบเสนอราคาด่วน',
    ctaLink2: '/quotation',
    badgeHighlight: 'สำหรับสายแบน & สายแพ',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'AWG#7 (10sq) ~ AWG#28 (0.08sq)',
    badgeFeatureIcon: 'bolt',
    badgeSpecial: 'ตัด • ปอกปลาย • ปอกกลางสาย',
    badgeSpecialIcon: 'shield'
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
const bannerTag = ref('JAPANESE ENGINEERING')
const bannerTitle = ref('เครื่องตัดปอกสายไฟ KODERA แท้จากประเทศญี่ปุ่น')
const bannerSubtitle = ref('ความแม่นยำสูง ทนทาน คุ้มค่าการลงทุนระยะยาว')
const bannerImage = ref('/logo.webp')
const bannerBadgeText = ref('มาตรฐานสากล')
const bannerBadgeSub = ref('JAPAN QUALITY')
const bannerBullets = ref(['ความแม่นยำสูง ±0.1mm', 'มาตรฐานญี่ปุ่น 100%', 'รองรับสายไฟหลากหลายขนาด', 'บริการ On-site และฝึกอบรม'])

const promoTag = ref('Wire Harness Solutions')
const promoTitle = ref('โซลูชันระบบตัดปอกและย้ำสายไฟ ครบวงจรในที่เดียว')
const promoDesc = ref('ยกระดับประสิทธิภาพการผลิตด้วยเครื่องจักรคุณภาพสูง')
const promoBtnText = ref('ดูสินค้าทั้งหมด')
const promoBtnLink = ref('/products')
const promoImage = ref('/logo.webp')

const whyChooseUsTitle = ref('ทำไมโรงงานชั้นนำถึงเลือก KODERA จาก CR Distribution?')
const whyChooseUsBullets = ref([
  'ผู้นำเข้าแบรนด์ KODERA แท้จากประเทศญี่ปุ่น',
  'ความเร็วและความแม่นยำระดับไมครอน',
  'บริการส่งมอบ ติดตั้ง และฝึกอบรมถึงหน้างาน',
  'สต็อกอะไหล่แท้และใบมีดครบวงจร',
  'ทีมวิศวกรผู้เชี่ยวชาญให้คำปรึกษาตลอดอายุการใช้งาน',
  'รับประกันคุณภาพและบริการหลังการขาย'
])

// TAB 3: Category Showcase Settings & Product Selector Data
const allCategories = ref([])
const allProducts = ref([])
const categoryShowcase = ref([]) // Array of { categoryId, productIds }

// TAB 4: Affiliated Companies & Business Network
const affiliatesTitle = ref('บริษัทในเครือ')
const affiliatesHeading = ref('เครือข่ายธุรกิจของเรา')
const affiliatesDesc = ref('เครือข่ายธุรกิจที่มั่นคง ร่วมมือสร้างสรรค์นวัตกรรมและบริการคุณภาพระดับมาตรฐานสากล')
const rawSectionTitles = ref({})

const defaultAffiliates = [
  {
    id: 1,
    name: 'KODERA MFG. CO., LTD.',
    tag: 'บริษัทในเครือ',
    description: 'ผู้ผลิตเครื่องตัดปอกสายไฟอัตโนมัติชั้นนำจากประเทศญี่ปุ่น มาตรฐานระดับโลก',
    banner: '',
    url: 'https://www.kodera.co.jp/',
    buttonText: 'เข้าชมเว็บไซต์'
  },
  {
    id: 2,
    name: 'CR Distribution (Thailand)',
    tag: 'บริษัทในเครือ',
    description: 'ตัวแทนจำหน่ายและศูนย์บริการเครื่องจักร KODERA อย่างเป็นทางการในประเทศไทย',
    banner: '',
    url: 'https://crdistribution.co.th',
    buttonText: 'เข้าชมเว็บไซต์'
  }
]
const affiliates = ref([...defaultAffiliates])

// TAB 5: Section Visibility Toggles
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
    tag: 'KODERA JAPAN TECHNOLOGY',
    titleLine1: 'เครื่องตัดปอกสายไฟอัตโนมัติ',
    titleLine2: 'KODERA CASTING Series มาตรฐานญี่ปุ่น',
    desc: 'เพิ่มประสิทธิภาพและผลผลิตสูงสุดในไลน์ผลิตสายไฟ ด้วยความเร็วสูงสุด 7,100 ชิ้น/ชม. ความแม่นยำระดับ ±0.1mm รองรับสายไฟ AWG#7 ถึง AWG#36',
    ctaText: 'เลือกชมเครื่องตัดปอกสายไฟ',
    ctaLink: '/products',
    ctaText2: 'ขอใบเสนอราคาด่วน',
    ctaLink2: '/quotation',
    image: '/uploads/image-1786598541729-737143997.webp',
    badgeHighlight: 'มาตรฐานญี่ปุ่น 100%',
    badgeHighlightIcon: 'trophy',
    badgeFeature: 'ความแม่นยำ ±0.1mm',
    badgeFeatureIcon: 'wrench',
    badgeSpecial: 'รับประกันศูนย์ไทย',
    badgeSpecialIcon: 'shield'
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

// Affiliated Companies Helpers
const addAffiliate = () => {
  affiliates.value.push({
    id: Date.now(),
    name: '',
    tag: 'บริษัทในเครือ',
    description: '',
    banner: '',
    url: '',
    buttonText: 'เข้าชมเว็บไซต์'
  })
}

const removeAffiliate = async (index) => {
  const confirmed = await showConfirm({
    title: 'ยืนยันการลบ',
    message: `คุณต้องการลบบริษัท/เครือข่ายธุรกิจ "${affiliates.value[index]?.name || 'รายการนี้'}" ใช่หรือไม่?`,
    confirmText: 'ลบรายการ',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (confirmed) {
    affiliates.value.splice(index, 1)
    showToast('ลบรายการเรียบร้อยแล้ว', 'success')
  }
}

const duplicateAffiliate = (index) => {
  const item = affiliates.value[index]
  if (!item) return
  affiliates.value.splice(index + 1, 0, {
    ...item,
    id: Date.now(),
    name: item.name ? `${item.name} (สำเนา)` : ''
  })
  showToast('คัดลอกรายการเรียบร้อย', 'success')
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

      // Section Titles
      try {
        const parsedTitles = s.home_section_titles ? JSON.parse(s.home_section_titles) : null
        if (parsedTitles && typeof parsedTitles === 'object') {
          rawSectionTitles.value = { ...parsedTitles }
          if (parsedTitles.affiliatesTitle) affiliatesTitle.value = parsedTitles.affiliatesTitle
          if (parsedTitles.affiliatesHeading) affiliatesHeading.value = parsedTitles.affiliatesHeading
          if (parsedTitles.affiliatesDesc) affiliatesDesc.value = parsedTitles.affiliatesDesc
        }
      } catch (e) {}

      // Affiliated Companies
      try {
        const parsedAffiliates = s.home_affiliates ? JSON.parse(s.home_affiliates) : []
        if (Array.isArray(parsedAffiliates) && parsedAffiliates.length > 0) {
          affiliates.value = parsedAffiliates.map((a, idx) => ({
            id: a.id || (Date.now() + idx),
            name: a.name || '',
            tag: a.tag || 'บริษัทในเครือ',
            description: a.description || '',
            banner: a.banner || a.image || '',
            url: a.url || '',
            buttonText: a.buttonText || 'เข้าชมเว็บไซต์'
          }))
        }
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
    const updatedSectionTitles = {
      ...rawSectionTitles.value,
      affiliatesTitle: affiliatesTitle.value,
      affiliatesHeading: affiliatesHeading.value,
      affiliatesDesc: affiliatesDesc.value
    }

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
        { key: 'home_affiliates', value: JSON.stringify(affiliates.value) },
        { key: 'home_section_titles', value: JSON.stringify(updatedSectionTitles) },
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
                          <input type="text" v-model="slide.tag" placeholder="เช่น KODERA JAPAN TECHNOLOGY" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium">
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
                          <input type="text" v-model="slide.titleLine1" placeholder="เช่น เครื่องตัดปอกสายไฟอัตโนมัติ" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
                        </div>

                        <!-- Title Line 2 -->
                        <div>
                          <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลัก บรรทัดที่ 2 (Title Line 2)</label>
                          <input type="text" v-model="slide.titleLine2" placeholder="เช่น KODERA CASTING Series มาตรฐานญี่ปุ่น" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-bold text-blue-600">
                        </div>

                        <!-- Description -->
                        <div class="md:col-span-2">
                          <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายรายละเอียด (Description)</label>
                          <textarea v-model="slide.desc" rows="2" placeholder="เพิ่มประสิทธิภาพและผลผลิตสูงสุดในไลน์ผลิตสายไฟ ด้วยความเร็วสูงสุด 7,100 ชิ้น/ชม. ความแม่นยำระดับ ±0.1mm" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <!-- Button 1 (Primary CTA) -->
                        <div class="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                          <span class="text-xs font-bold text-blue-600 block">ปุ่มกดหลัก (Primary Button)</span>
                          <div class="grid grid-cols-2 gap-2">
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ข้อความบนปุ่ม</label>
                              <input type="text" v-model="slide.ctaText" placeholder="เลือกชมเครื่องตัดปอกสายไฟ" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
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
                              <input type="text" v-model="slide.ctaText2" placeholder="เช่น ขอใบเสนอราคาด่วน" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                            </div>
                            <div>
                              <label class="block text-[10px] font-bold text-gray-500 mb-1">ลิงก์ปลายทาง</label>
                              <input type="text" v-model="slide.ctaLink2" placeholder="เช่น /quotation" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
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
                            <input type="text" v-model="slide.badgeHighlight" placeholder="เช่น มาตรฐานญี่ปุ่น 100%" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                          </div>
                          <div class="space-y-1">
                            <label class="block text-[10px] font-bold text-gray-500">จุดเด่น 2 (Feature)</label>
                            <input type="text" v-model="slide.badgeFeature" placeholder="เช่น 7,100 ชิ้น/ชม." class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                          </div>
                          <div class="space-y-1">
                            <label class="block text-[10px] font-bold text-gray-500">จุดเด่น 3 (Special)</label>
                            <input type="text" v-model="slide.badgeSpecial" placeholder="เช่น AWG#7 ~ AWG#36" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
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
                      <button type="button" @click="removeBannerBullet(idx)" class="text-red-500 hover:text-red-700 text-xs p-1.5 font-bold bg-red-50 rounded-lg">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
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
                      <span class="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                      </span>
                      <input type="text" v-model="whyChooseUsBullets[idx]" class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium">
                      <button type="button" @click="removeWhyBullet(idx)" class="text-red-500 hover:text-red-700 text-xs p-1.5 font-bold bg-red-50 rounded-lg">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
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

          <!-- ==================== TAB 4: เครือข่ายธุรกิจ & บริษัทในเครือ ==================== -->
          <div v-show="activeTab === 'affiliates'" class="space-y-6">
            
            <!-- Section Header & Visibility Controls -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>ตั้งค่าหัวข้อบล็อก "บริษัทในเครือ" (Section Header Settings)</span>
                  </h2>
                  <p class="text-xs text-gray-500 mt-0.5">กำหนดข้อความหัวข้อ ป้ายกำกับ และคำอธิบายสำหรับส่วนเครือข่ายธุรกิจบนหน้าแรก</p>
                </div>
                
                <!-- Quick Status Toggle -->
                <div class="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-xs shrink-0">
                  <div class="flex flex-col text-right">
                    <span class="text-xs font-bold text-gray-800">แสดง Section นี้</span>
                    <span :class="['text-[10px] font-semibold', homeShowAffiliates ? 'text-emerald-600' : 'text-gray-400']">
                      {{ homeShowAffiliates ? '● เปิดใช้งานบนหน้าแรก' : '○ ปิดการแสดงผล' }}
                    </span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowAffiliates" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>

              <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">ป้ายกำกับด้านบน (Section Badge / Tag)</label>
                  <input type="text" v-model="affiliatesTitle" placeholder="เช่น บริษัทในเครือ" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-semibold">
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-1">หัวข้อหลักของบล็อก (Section Heading)</label>
                  <input type="text" v-model="affiliatesHeading" placeholder="เช่น เครือข่ายธุรกิจของเรา" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-bold">
                </div>

                <div class="md:col-span-2">
                  <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายรายละเอียด (Section Subtitle / Description)</label>
                  <textarea v-model="affiliatesDesc" rows="2" placeholder="เช่น เครือข่ายธุรกิจที่มั่นคง ร่วมมือสร้างสรรค์นวัตกรรมและบริการคุณภาพระดับมาตรฐานสากล" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></textarea>
                </div>
              </div>
            </div>

            <!-- Affiliated Companies List Container -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>รายการการ์ดบริษัทในเครือ (Affiliated Companies Cards)</span>
                  </h2>
                  <p class="text-xs text-gray-500 mt-0.5">ลากเพื่อสลับลำดับการแสดงผลการ์ดบนหน้าแรก (แนะนำ 2-6 บริษัท)</p>
                </div>
                <button type="button" @click="addAffiliate" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                  <span>+ เพิ่มบริษัทใหม่</span>
                </button>
              </div>

              <div class="p-6 space-y-6">
                <div v-if="affiliates.length === 0" class="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  ยังไม่มีข้อมูลบริษัทในเครือ กดปุ่ม "+ เพิ่มบริษัทใหม่" เพื่อเริ่มต้น
                </div>

                <draggable v-model="affiliates" item-key="id" handle=".affiliate-drag-handle" class="space-y-6">
                  <template #item="{ element: company, index }">
                    <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative space-y-5">
                      
                      <!-- Card Header Bar -->
                      <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                        <div class="flex items-center gap-3">
                          <span class="affiliate-drag-handle cursor-grab active:cursor-grabbing p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 shadow-xs" title="ลากเพื่อจัดลำดับ">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                          </span>
                          <span class="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <span>บริษัทที่ {{ index + 1 }}</span>
                            <span v-if="company.name" class="font-bold text-emerald-700">
                              - {{ company.name }}
                            </span>
                            <span v-if="company.tag" class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-md">
                              {{ company.tag }}
                            </span>
                          </span>
                        </div>

                        <div class="flex items-center gap-2">
                          <button type="button" @click="duplicateAffiliate(index)" class="text-gray-600 hover:text-gray-900 text-xs font-semibold px-2.5 py-1.5 bg-white rounded-lg hover:bg-gray-100 transition border border-gray-200">
                            คัดลอก
                          </button>
                          <button type="button" @click="removeAffiliate(index)" class="text-red-500 hover:text-red-700 text-xs font-bold px-3 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition border border-red-100">
                            ลบรายการนี้
                          </button>
                        </div>
                      </div>

                      <!-- Form Inputs & Live Preview -->
                      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        <!-- Left Form Fields (8 cols) -->
                        <div class="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <!-- Company Name -->
                          <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">ชื่อบริษัท / องค์กร (Company Name) <span class="text-red-500">*</span></label>
                            <input type="text" v-model="company.name" placeholder="เช่น KODERA MFG. CO., LTD." class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-bold">
                          </div>

                          <!-- Tag / Badge Text -->
                          <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">ป้ายกำกับประเภท (Card Tag / Badge)</label>
                            <input type="text" v-model="company.tag" placeholder="เช่น บริษัทในเครือ หรือ สำนักงานใหญ่ญี่ปุ่น" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                          </div>

                          <!-- Button Text -->
                          <div>
                            <label class="block text-xs font-bold text-gray-700 mb-1">ข้อความบนปุ่มกด (Button Text)</label>
                            <input type="text" v-model="company.buttonText" placeholder="เช่น เข้าชมเว็บไซต์" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                          </div>

                          <!-- Website Link -->
                          <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">ลิงก์เว็บไซต์ (Website URL)</label>
                            <div class="relative">
                              <input type="url" v-model="company.url" placeholder="https://www.kodera.co.jp/" class="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs">
                              <svg class="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </div>
                          </div>

                          <!-- Description -->
                          <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">คำอธิบายรายละเอียด (Description)</label>
                            <textarea v-model="company.description" rows="2" placeholder="เช่น ผู้ผลิตเครื่องตัดปอกสายไฟอัตโนมัติชั้นนำจากประเทศญี่ปุ่น มาตรฐานระดับโลก" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></textarea>
                          </div>

                          <!-- Banner Image Upload & Input -->
                          <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-700 mb-1">รูปภาพแบนเนอร์ / โลโก้บริษัท (Banner Image)</label>
                            <div class="flex items-center gap-2">
                              <input type="text" v-model="company.banner" placeholder="/images/affiliates/kodera.webp หรือ https://..." class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                              <label class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border border-gray-300 shrink-0">
                                อัพโหลดรูป...
                                <input type="file" accept="image/*" class="hidden" @change="(e) => handleImageUpload(e, (url) => company.banner = url)">
                              </label>
                            </div>
                            <p class="text-[11px] text-gray-400 mt-1">แนะนำขนาดสัดส่วน 16:10 หรือ 800x500px (JPG, PNG, WebP)</p>
                          </div>

                        </div>

                        <!-- Right Preview Card (4 cols) -->
                        <div class="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-3">
                          <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">ตัวอย่างการแสดงผลบนหน้าแรก</span>
                          
                          <div class="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm flex flex-col">
                            <!-- Image part -->
                            <div class="relative aspect-[16/10] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                              <img 
                                v-if="company.banner" 
                                :src="company.banner" 
                                :alt="company.name" 
                                class="w-full h-full object-cover"
                              />
                              <div v-else class="flex flex-col items-center justify-center p-3 text-slate-500 text-center">
                                <svg class="w-8 h-8 opacity-40 text-emerald-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span class="text-[10px]">ยังไม่มีรูปแบนเนอร์</span>
                              </div>
                              <span class="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-bold text-white bg-emerald-600/90 rounded uppercase">
                                {{ company.tag || 'บริษัทในเครือ' }}
                              </span>
                            </div>

                            <!-- Content part -->
                            <div class="p-3.5 space-y-2">
                              <h4 class="font-bold text-sm text-gray-900 line-clamp-1">
                                {{ company.name || 'ชื่อบริษัท' }}
                              </h4>
                              <p class="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                {{ company.description || 'คำอธิบายรายละเอียดบริษัท...' }}
                              </p>
                              <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-emerald-700 text-xs font-bold">
                                <span>{{ company.buttonText || 'เข้าชมเว็บไซต์' }}</span>
                                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>

                    </div>
                  </template>
                </draggable>
              </div>
            </div>

          </div>

          <!-- ==================== TAB 5: จัดการเปิด/ปิด Section ==================== -->
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
                    <h3 class="text-sm font-bold text-gray-800">Section บริษัทในเครือ & เครือข่ายธุรกิจ (Affiliated Companies)</h3>
                    <p class="text-xs text-gray-500">แสดงการ์ดข้อมูลบริษัทและเครือข่ายธุรกิจพันธมิตร</p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="homeShowAffiliates" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
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
