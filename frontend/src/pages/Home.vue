<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, reactive, watch } from 'vue'
import { useTrackingStore } from '../stores/tracking'
import { useCartStore } from '../stores/cartStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWishlistStore } from '../stores/wishlistStore'
import { useCompareStore } from '../stores/compareStore'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../composables/useToast'
import { useSEO } from '../composables/useSEO'
import FeatureIcon from '../components/ui/FeatureIcon.vue'
import ProductCard from '../components/ProductCard.vue'
import { getOptimizedImageUrl, onImageError } from '../utils/image'

const trackingStore = useTrackingStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const wishlistStore = useWishlistStore()
const compareStore = useCompareStore()
const authStore = useAuthStore()
const { showToast } = useToast()
const { setMeta, setStructuredData } = useSEO()

// Hero AI Chatbot state
const heroAiMessages = ref([])
const isHeroAiTyping = ref(false)

const heroAiSuggestions = [
  { text: 'แนะนำเครื่องตัดปอกสายไฟ KODERA', reply: 'เรามีเครื่องตัดปอกสายไฟ KODERA ครบทุกซีรีส์ ทั้ง C371G, C370G, C300A และ C371AF ที่ตอบสนองความเร็วและความแม่นยำสูงระดับมาตรฐานญี่ปุ่นครับ\n\nต้องการให้แนะนำรุ่นสำหรับประเภทสายไฟใดเป็นพิเศษไหมครับ?' },
  { text: 'ขอใบเสนอราคาด่วน', reply: 'คุณสามารถคลิกเมนู "ขอใบเสนอราคา" หรือส่งข้อมูลสายไฟตัวอย่างเพื่อให้ฝ่ายวิศวกรรมประเมินราคาและสเปกอย่างเป็นทางการได้ฟรีครับ!' },
  { text: 'เปรียบเทียบสเปกแต่ละรุ่น', reply: 'เครื่องจักร KODERA มีความสามารถตัดปอกสายไฟขนาดตั้งแต่ 0.08 ถึง 38 mm² มีระบบใบมีดตัด 4 ด้านและการปอกสายแบบ Step Stripping\n\nสามารถเปิดดูหน้า "เปรียบเทียบสเปก" เพื่อดูรายละเอียดได้ทันทีครับ' },
  { text: 'บริการติดตั้งและบำรุงรักษา', reply: 'เรามีทีมวิศวกรและช่างผู้เชี่ยวชาญพร้อมส่งมอบ ติดตั้ง และฝึกอบรมการใช้งานถึงโรงงาน พร้อมบริการหลังการขายและอะไหล่แท้ครบวงจรครับ' }
]

const sendHeroAiMessage = (suggestion) => {
  if (isHeroAiTyping.value) return
  heroAiMessages.value.push({ sender: 'user', text: suggestion.text })
  isHeroAiTyping.value = true
  setTimeout(() => {
    isHeroAiTyping.value = false
    heroAiMessages.value.push({ sender: 'bot', text: suggestion.reply })
  }, 800)
}

const addToCart = async (product) => {
  try {
    await cartStore.addToCart(product, 1);
    showToast(`เพิ่ม ${product.title} ลงในตะกร้าแล้ว`, 'success');
  } catch (err) {
    showToast('ไม่สามารถเพิ่มลงตะกร้าได้', 'error');
  }
}

const toggleWishlistItem = async (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  if (!authStore.isAuthenticated) {
    showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มรายการโปรด', 'warning');
    return;
  }
  const result = await wishlistStore.toggleWishlist(product);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการโปรดแล้ว' : 'นำออกจากรายการโปรดแล้ว', result.isAdded ? 'success' : 'info');
  }
}

const toggleCompareItem = (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  const result = compareStore.toggleCompare(product);
  if (result.success) {
    showToast(result.isAdded ? 'เพิ่มในรายการเปรียบเทียบแล้ว' : 'นำออกจากรายการเปรียบเทียบแล้ว', result.isAdded ? 'success' : 'info');
  } else if (result.error === 'max_reached') {
    showToast('เปรียบเทียบได้สูงสุด 4 ชิ้น', 'warning');
  }
}

const formatArticleDate = (dateString) => {
  if (!dateString) return 'ล่าสุด';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'ล่าสุด';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch(e) {
    return 'ล่าสุด';
  }
}

// Removed Showcase Slider drag and center scroll calculation logic

// Mouse parallax tracking
const mouse = reactive({ x: 0, y: 0 })
const heroRef = ref(null)

const onMouseMove = (e) => {
  if (!heroRef.value) return
  const rect = heroRef.value.getBoundingClientRect()
  // Normalize to -1 to 1 range
  mouse.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
  mouse.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
}

// Computed parallax transforms for different layers  
const parallaxSlow = computed(() => 
  `translate(${mouse.x * 8}px, ${mouse.y * 6}px)`
)
const parallaxMedium = computed(() => 
  `translate(${mouse.x * 15}px, ${mouse.y * 12}px)`
)
const parallaxFast = computed(() => 
  `translate(${mouse.x * 25}px, ${mouse.y * 20}px)`
)
const parallaxReverse = computed(() => 
  `translate(${mouse.x * -12}px, ${mouse.y * -10}px)`
)
const parallaxImage = computed(() => 
  `translate(${mouse.x * -5}px, ${mouse.y * -4}px) scale(1.05)`
)

const trackCTA = (action) => {
  trackingStore.trackEvent({ type: 'click_cta', action })
}

const formatThaiText = (text) => {
  if (!text) return ''
  return text.replace(/(ระดับมืออาชีพ|มืออาชีพ|48 ชั่วโมง|ระดับพรีเมียม)/g, '<span class="inline-block">$1</span>')
}




// Home State from Settings API
const settingsLoading = ref(true)
const slides = ref([])
const heroFeatureBadges = ref([])
const currentSlide = ref(0)
const slideProgress = ref(0)
let progressInterval = null
const stats = ref([])
const homeShowHighlightCategories = ref(true)
const featuresHeading = ref('')
const featuresTitle = ref('')
const featuresDesc = ref('')
const featuresItems = ref([])
const featuresImage = ref('')
const featuresBadgeTitle = ref('')
const featuresBadgeDesc = ref('')
const activeFeatureIndex = ref(0)
const testimonials = ref([])
const partners = ref([])
const homeShowTestimonials = ref(true)
const homeShowPartners = ref(true)
const homeShowAffiliates = ref(true)
const homeShowFaq = ref(true)
const homeShowStats = ref(true)
const homeShowFeatures = ref(true)
const ctaTitle = ref('')
const ctaDesc = ref('')
const ctaButtonText = ref('')
const ctaButtonLink = ref('')

const repeatedPartnersForMarquee = computed(() => {
  if (!partners.value || partners.value.length === 0) return []
  // Make sure we have enough items to span the screen smoothly
  // We duplicate the original array multiple times to form a long sequence
  const base = [...partners.value, ...partners.value, ...partners.value, ...partners.value]
  // We double it so the marquee can shift by -50% perfectly seamlessly
  return [...base, ...base]
})

const checklistItems = computed(() => {
  if (!featuresBadgeDesc.value || featuresBadgeDesc.value.trim() === '') {
    return ['เก็บอุปกรณ์ทำสวน', 'จัดเก็บเครื่องมือช่าง', 'ห้องเก็บของอเนกประสงค์', 'พื้นที่ทำงานส่วนตัว', 'ห้องเก็บของในบ้าน']
  }
  return featuresBadgeDesc.value.split('\n').map(item => item.trim()).filter(item => item.length > 0)
})

const recentProjects = ref([])
const homeProjectsCta = ref({
  show: true,
  title: 'บริการติดตั้งทั่วประเทศ',
  description: 'ทีมช่างมืออาชีพพร้อมบริการติดตั้งถึงหน้าบ้าน ปลอดภัย ได้มาตรฐาน',
  bullets: [
    { title: 'บริการติดตั้งถึงหน้าบ้าน', desc: 'ครอบคลุมทุกพื้นที่ทั่วประเทศ' },
    { title: 'ติดตั้งรวดเร็ว ได้มาตรฐาน', desc: 'โดยทีมช่างมืออาชีพ' },
    { title: 'รับประกันโครงสร้าง 10 ปี', desc: 'มั่นใจในคุณภาพการใช้งาน' }
  ]
})
const recentArticles = ref([])
const categories = ref([])
const categoryShowcaseSettings = ref([])
const showcaseCategoriesData = ref([])
const homeHighlightSettings = ref(null)
const highlightCategoriesList = ref([])
// Removed homeShowcaseSlider ref

// Banners & Why Choose Us Settings
const bannerTag = ref('')
const bannerTitle = ref('')
const bannerSubtitle = ref('')
const bannerImage = ref('')
const bannerBadgeText = ref('')
const bannerBadgeSub = ref('')
const bannerBullets = ref([])

const whyChooseUsTitle = ref('')
const whyChooseUsBullets = ref([])

const promoTag = ref('')
const promoTitle = ref('')
const promoDesc = ref('')
const promoBtnText = ref('')
const promoBtnLink = ref('')
const promoImage = ref('')

// Removed Cinematic Bento Showcase Slider State

const getSpecsForItem = (item) => {
  if (!item) return []
  if (item.specs && Array.isArray(item.specs) && item.specs.length > 0) {
    return item.specs
  }
  const categoryName = item.product?.category || item.subtitle || '';
  if (categoryName.includes('พลาสติก PP')) {
    return [
      { label: 'วัสดุหลัก', value: 'พลาสติก PP พรีเมียม' },
      { label: 'ความหนา', value: '12 มม. กันรังสี UV' },
      { label: 'โครงสร้าง', value: 'เหล็กเคลือบกันสนิม' },
      { label: 'การรับประกัน', value: '10 ปีเต็ม' }
    ]
  } else if (categoryName.includes('พลาสติก HDPE')) {
    return [
      { label: 'วัสดุหลัก', value: 'พลาสติก HDPE ทนทานสูง' },
      { label: 'ผิวสัมผัส', value: 'ลายไม้ธรรมชาติพรีเมียม' },
      { label: 'การกันน้ำ', value: '100% กันฝนกรด' },
      { label: 'การรับประกัน', value: '10 ปีเต็ม' }
    ]
  } else if (categoryName.includes('โลหะ')) {
    return [
      { label: 'วัสดุหลัก', value: 'เหล็ก Galvalume USA' },
      { label: 'เทคโนโลยีสี', value: 'อบความร้อนสี่ชั้น' },
      { label: 'ความต้านทานลม', value: 'สูงสุด 120 กม./ชม.' },
      { label: 'การรับประกัน', value: '10 ปีเต็ม' }
    ]
  } else if (categoryName.includes('โรงเรือน') || categoryName.includes('กรีนเฮาส์')) {
    return [
      { label: 'วัสดุคลุม', value: 'PE Mesh กันรังสี UV' },
      { label: 'โครงเหล็ก', value: 'ชุบกัลวาไนซ์กันสนิม' },
      { label: 'การระบายอากาศ', value: 'หน้าต่างตาข่ายรอบทิศ' },
      { label: 'การติดตั้ง', value: 'ง่ายด้วยน็อคดาวน์' }
    ]
  }
  // Default specs for custom slides or others
  return [
    { label: 'โครงสร้างหลัก', value: 'เกรดพรีเมียม USA' },
    { label: 'ความทนทาน', value: 'ทนทุกสภาวะอากาศ' },
    { label: 'ฟังก์ชัน', value: 'มินิมอล ประหยัดพื้นที่' },
    { label: 'การรับประกัน', value: 'โครงสร้าง 10 ปี' }
  ]
}

// Removed showcase progress handlers

let slideInterval = null

// Load Homepage Settings
const loadHomepageSettings = async () => {
  settingsLoading.value = true
  try {
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.success && data.data) {
      const s = data.data
      
      try { 
        const parsedSlides = s.home_slides ? JSON.parse(s.home_slides) : [] 
        slides.value = Array.isArray(parsedSlides) ? parsedSlides : []
      } catch(e) {}
      
      // Local slide image fallbacks if image is missing
      const localSlideImages = ['/images/home/hero-slide-1.webp', '/images/home/hero-slide-2.webp', '/images/home/hero-slide-3.webp']
      if (slides.value.length > 0) {
        slides.value = slides.value.map((slide, i) => {
          if (typeof slide !== 'object' || !slide) {
            return {
              image: localSlideImages[i] || localSlideImages[0],
              tag: '',
              titleLine1: '',
              titleLine2: '',
              desc: '',
              ctaText: 'ดูสินค้าทั้งหมด',
              ctaLink: '/products',
              ctaAction: 'view_products'
            }
          }
          const safeString = (val, fallbackVal = '') => (typeof val === 'string' && val.trim() !== '') ? val : fallbackVal;
          return {
            ...slide,
            tag: safeString(slide.tag),
            titleLine1: safeString(slide.titleLine1),
            titleLine2: safeString(slide.titleLine2),
            desc: safeString(slide.desc),
            ctaText: safeString(slide.ctaText, 'ดูสินค้าทั้งหมด'),
            ctaLink: safeString(slide.ctaLink, '/products'),
            ctaAction: safeString(slide.ctaAction, 'view_products'),
            ctaText2: safeString(slide.ctaText2, 'ขอใบเสนอราคา'),
            ctaLink2: safeString(slide.ctaLink2, '/quotation'),
            ctaAction2: safeString(slide.ctaAction2, 'quotation'),
            badgeHighlight: safeString(slide.badgeHighlight),
            badgeHighlightIcon: safeString(slide.badgeHighlightIcon, 'trophy'),
            badgeHighlightLabel: safeString(slide.badgeHighlightLabel, 'จุดเด่น'),
            badgeFeature: safeString(slide.badgeFeature),
            badgeFeatureIcon: safeString(slide.badgeFeatureIcon, 'wrench'),
            badgeFeatureLabel: safeString(slide.badgeFeatureLabel, 'คุณสมบัติ'),
            badgeSpecial: safeString(slide.badgeSpecial),
            badgeSpecialIcon: safeString(slide.badgeSpecialIcon, 'house'),
            badgeSpecialLabel: safeString(slide.badgeSpecialLabel, 'ความพิเศษ'),
            image: (slide.image && typeof slide.image === 'string' && slide.image.length > 2 && !slide.image.includes('unsplash.com')) ? slide.image : (localSlideImages[i] || localSlideImages[0])
          }
        })
      }
      try { 
        const parsedHeroFeatures = s.home_hero_feature_badges ? JSON.parse(s.home_hero_feature_badges) : [] 
        heroFeatureBadges.value = Array.isArray(parsedHeroFeatures) ? parsedHeroFeatures : []
      } catch(e) {}
      try { 
        const parsedStats = s.home_stats ? JSON.parse(s.home_stats) : [] 
        stats.value = Array.isArray(parsedStats) ? parsedStats : []
      } catch(e) {}
      try { 
        const parsedFeatures = s.home_features_items ? JSON.parse(s.home_features_items) : [] 
        featuresItems.value = Array.isArray(parsedFeatures) ? parsedFeatures : []
      } catch(e) {}
      try { 
        const parsedTestis = s.home_testimonials ? JSON.parse(s.home_testimonials) : []
        testimonials.value = Array.isArray(parsedTestis) ? parsedTestis : []
      } catch(e) {}
      try { 
        const parsedPartners = s.home_partners ? JSON.parse(s.home_partners) : []
        partners.value = Array.isArray(parsedPartners) ? parsedPartners : []
      } catch(e) {}
      try { 
        const parsedCorp = s.home_corporate_reviews ? JSON.parse(s.home_corporate_reviews) : []
        corporateReviews.value = Array.isArray(parsedCorp) ? parsedCorp : []
      } catch(e) {
        corporateReviews.value = []
      }
      try { 
        const parsedAffiliates = s.home_affiliates ? JSON.parse(s.home_affiliates) : []
        affiliatedCompanies.value = Array.isArray(parsedAffiliates) ? parsedAffiliates : []
      } catch(e) {}
      try { 
        const parsedShowcase = s.home_category_showcase ? JSON.parse(s.home_category_showcase) : []
        categoryShowcaseSettings.value = Array.isArray(parsedShowcase) ? parsedShowcase : []
      } catch(e) {}
// Removed parsedShowcaseSlider logic
      try { 
        const parsedHighlights = s.home_highlight_categories ? JSON.parse(s.home_highlight_categories) : null
        homeHighlightSettings.value = (parsedHighlights && typeof parsedHighlights === 'object') ? parsedHighlights : null
      } catch(e) {}
      try {
        const parsedFaq = s.home_faq ? JSON.parse(s.home_faq) : null
        if (parsedFaq && parsedFaq.length > 0) faqItems.value = parsedFaq
      } catch(e) {}
      try {
        const parsedTitles = s.home_section_titles ? JSON.parse(s.home_section_titles) : null
        if (parsedTitles && Object.keys(parsedTitles).length > 0) sectionTitles.value = { ...sectionTitles.value, ...parsedTitles }
      } catch(e) {}

      featuresHeading.value = s.home_features_heading || 'การจัดระเบียบพื้นที่นอกบ้านแบบพรีเมียม'
      featuresTitle.value = s.home_features_title || ''
      featuresDesc.value = s.home_features_desc || ''
      const rawFeatImg = s.home_features_image || '/images/home/features-premium.webp'
      featuresImage.value = (rawFeatImg && rawFeatImg.length > 2) ? rawFeatImg : '/images/home/features-premium.webp'
      featuresBadgeTitle.value = s.home_features_badge_title || '10-Year Warranty'
      featuresBadgeDesc.value = s.home_features_badge_desc || 'รับประกันโครงสร้างยาวนาน 10 ปี'

      ctaTitle.value = s.home_cta_title || 'พร้อมเปลี่ยนพื้นที่ของคุณหรือยัง?'
      ctaDesc.value = s.home_cta_desc || 'ปรึกษาผู้เชี่ยวชาญของเราเพื่อรับคำแนะนำที่เหมาะสมกับพื้นที่ของคุณ ฟรี! ไม่มีค่าใช้จ่าย'
      ctaButtonText.value = s.home_cta_button_text || 'ขอใบเสนอราคาด่วน'
      ctaButtonLink.value = s.home_cta_button_link || '/quotation'

      // Homepage Banners & Why Choose Us Settings
      bannerTag.value = s.home_banner_tag || ''
      bannerTitle.value = s.home_banner_title || ''
      bannerSubtitle.value = s.home_banner_subtitle || ''
      bannerImage.value = s.home_banner_image || ''
      bannerBadgeText.value = s.home_banner_badge_text || ''
      bannerBadgeSub.value = s.home_banner_badge_sub || ''
      try {
        const parsed = s.home_banner_bullets ? JSON.parse(s.home_banner_bullets) : []
        bannerBullets.value = Array.isArray(parsed) ? parsed : []
      } catch(e) {
        bannerBullets.value = []
      }

      whyChooseUsTitle.value = s.home_why_choose_us_title || ''
      try {
        const parsed = s.home_why_choose_us_bullets ? JSON.parse(s.home_why_choose_us_bullets) : []
        whyChooseUsBullets.value = Array.isArray(parsed) ? parsed : []
      } catch(e) {
        whyChooseUsBullets.value = []
      }

      promoTag.value = s.home_promo_tag || ''
      promoTitle.value = s.home_promo_title || ''
      promoDesc.value = s.home_promo_desc || ''
      promoBtnText.value = s.home_promo_btn_text || ''
      promoBtnLink.value = s.home_promo_btn_link || ''
      promoImage.value = s.home_promo_image || ''

      // Section visibility toggles
      homeShowTestimonials.value = s.home_show_testimonials !== 'false'
      homeShowPartners.value = s.home_show_partners !== 'false'
      homeShowAffiliates.value = s.home_show_affiliates !== 'false'
      homeShowFaq.value = s.home_show_faq !== 'false'
      homeShowStats.value = s.home_show_stats !== 'false'
      homeShowFeatures.value = s.home_show_features !== 'false'
      homeShowHighlightCategories.value = s.home_show_highlight_categories !== 'false'
      try {
        const parsedCta = s.home_projects_cta ? JSON.parse(s.home_projects_cta) : null
        if (parsedCta) {
          homeProjectsCta.value = { ...homeProjectsCta.value, ...parsedCta }
        }
      } catch (e) {
        console.error('Failed to parse home_projects_cta settings:', e)
      }
      
    }
  } catch (error) {
    console.error('Failed to load homepage settings:', error)
  } finally {
    // Fallback if no slides configured
    if (slides.value.length === 0) {
      slides.value = [
        {
          image: '/uploads/image-1786598541729-737143997.webp',
          tag: 'KODERA JAPAN TECHNOLOGY',
          titleLine1: 'เครื่องตัดปอกสายไฟอัตโนมัติ',
          titleLine2: 'KODERA CASTING Series มาตรฐานญี่ปุ่น',
          desc: 'เพิ่มประสิทธิภาพและผลผลิตสูงสุดในไลน์ผลิตสายไฟ ด้วยความเร็วสูงสุด 7,100 ชิ้น/ชม. ความแม่นยำระดับ ±0.1mm รองรับสายไฟ AWG#7 ถึง AWG#36',
          ctaText: 'เลือกชมเครื่องตัดปอกสายไฟ',
          ctaLink: '/products',
          ctaAction: 'view_products',
          ctaText2: 'ขอใบเสนอราคาด่วน',
          ctaLink2: '/quotation',
          ctaAction2: 'quotation',
          badgeHighlight: 'มาตรฐานญี่ปุ่น 100%',
          badgeHighlightIcon: 'trophy',
          badgeFeature: 'ความแม่นยำ ±0.1mm',
          badgeFeatureIcon: 'wrench',
          badgeSpecial: 'รับประกันศูนย์ไทย',
          badgeSpecialIcon: 'shield'
        }
      ]
    }
    if (heroFeatureBadges.value.length === 0) {
      heroFeatureBadges.value = [
        { icon: 'shield', title: 'มาตรฐานญี่ปุ่น 100%', desc: 'แบรนด์ KODERA แท้ นำเข้าโดยตรง' },
        { icon: 'trophy', title: 'ความแม่นยำ ±0.1mm', desc: 'ระบบขับเคลื่อน Stepping Motor ความเร็วสูง' },
        { icon: 'wrench', title: 'บริการติดตั้ง & อะไหล่แท้', desc: 'ทีมวิศวกรดูแลและมีอะไหล่พร้อมส่ง' }
      ]
    }
    if (stats.value.length === 0) {
      stats.value = [
        { label: 'ชิ้นที่จำหน่าย', value: '10,000+' },
        { label: 'ความพึงพอใจ', value: '98%' },
        { label: 'ประสบการณ์', value: '8 ปี' },
        { label: 'บริการหลังการขาย', value: '100%' }
      ]
    }
    // Fallback if no featuresItems configured
    if (featuresItems.value.length === 0) {
      featuresItems.value = [
        {
          icon: 'shield',
          title: 'รับประกันโครงสร้างยาวนาน',
          desc: 'มั่นใจในความทนทานและความแข็งแรง ด้วยการรับประกันโครงสร้างคุณภาพพรีเมียมยาวนานหลายปี'
        },
        {
          icon: 'bolt',
          title: 'ติดตั้งรวดเร็ว ไร้กังวล',
          desc: 'ทีมงานมืออาชีพพร้อมบริการติดตั้งที่รวดเร็ว ประณีต และปลอดภัย ให้คุณใช้งานพื้นที่ใหม่ได้ทันใจ'
        },
        {
          icon: 'lightbulb',
          title: 'ที่ปรึกษาเฉพาะบุคคลและการออกแบบด้วย AI',
          desc: 'รับคำปรึกษาจากผู้เชี่ยวชาญ และพบกับโซลูชันที่ปรับแต่งเฉพาะคุณ ด้วยการวิเคราะห์งบประมาณและการออกแบบที่แม่นยำด้วยเทคโนโลยี AI'
        }
      ]
    }

    settingsLoading.value = false
    
    // Start slider with progress if we have slides
    if (slides.value.length > 1 && !slideInterval) {
      startSlideProgress()
    }
  }
}


const SLIDE_DURATION = 7000 // 7 seconds per slide
const PROGRESS_INTERVAL = 100 // update every 100ms to save CPU
const isHoveringHero = ref(false)

const startSlideProgress = () => {
  clearInterval(slideInterval)
  clearInterval(progressInterval)
  slideProgress.value = 0
  progressInterval = setInterval(() => {
    if (!isHoveringHero.value && document.visibilityState === 'visible') {
      slideProgress.value += (PROGRESS_INTERVAL / SLIDE_DURATION) * 100
      if (slideProgress.value >= 100) {
        slideProgress.value = 0
        currentSlide.value = (currentSlide.value + 1) % slides.value.length
      }
    }
  }, PROGRESS_INTERVAL)
}

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
  startSlideProgress()
}

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
  startSlideProgress()
}

const goToSlide = (index) => {
  currentSlide.value = index
  startSlideProgress()
}

// Add Structured Data (JSON-LD)
const addStructuredData = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": settingsStore.storeName ? `${settingsStore.storeName} โดย บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด` : 'บริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด',
    "image": "https://images.unsplash.com/photo-1600607686527-6fb886090705?w=1200",
    "@id": window.location.origin,
    "url": window.location.origin,
    "telephone": "02-9081348-9",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "75/110 หมู่ 11 ตำบลคลองหนึ่ง",
      "addressLocality": "อำเภอคลองหลวง",
      "addressRegion": "ปทุมธานี",
      "postalCode": "12120",
      "addressCountry": "TH"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
      ],
      "opens": "08:30",
      "closes": "17:30"
    }
  }

  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify(schema)
  script.id = 'json-ld-localbusiness'
  document.head.appendChild(script)
}

// FAQ Schema for SEO
const faqItems = ref([
  { q: 'สินค้าทนแดด ทนฝน ไหม?', a: 'ทนทานครับ โครงสร้างผลิตจากวัสดุพรีเมียมคุณภาพสูง ทนแดด ทนฝน ทนลมแรง ผ่านมาตรฐานการทดสอบระดับสากล พร้อมรับประกันคุณภาพ', icon: 'home', color: 'orange', open: false },
  { q: 'ใช้เวลาติดตั้งนานแค่ไหน?', a: 'ทีมช่างมืออาชีพของเราสามารถติดตั้งให้เสร็จสมบูรณ์ภายใน 1-2 วันทำการ ขึ้นอยู่กับขนาดและรุ่นที่เลือก', icon: 'clock', color: 'blue', open: false },
  { q: 'ต้องเตรียมพื้นที่อย่างไรก่อนติดตั้ง?', a: 'เพียงมีพื้นที่ราบเรียบ แน่น และมีระยะห่างที่เหมาะสม ทีมงานพร้อมให้คำปรึกษาและคำแนะนำก่อนการติดตั้ง', icon: 'measure', color: 'purple', open: false },
  { q: 'มีบริการจัดส่งและติดตั้งทั่วประเทศไหม?', a: 'มีครับ! เราให้บริการจัดส่งและติดตั้งทั่วประเทศไทย พร้อมทีมช่างมืออาชีพและรับประกันงานติดตั้ง', open: false },
  { q: 'สามารถผ่อนชำระได้ไหม?', a: 'ได้ครับ เรามีบริการผ่อนชำระผ่านบัตรเครดิตธนาคารชั้นนำ หรือสามารถชำระผ่านช่องทางต่างๆ ที่สะดวก', open: false },
])



const addFaqSchema = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.value.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  }
  const script = document.createElement('script')
  script.type = 'application/ld+json'
  script.text = JSON.stringify(faqSchema)
  script.id = 'json-ld-faq'
  document.head.appendChild(script)
}

const toggleFaq = (idx) => {
  faqItems.value = faqItems.value.map((item, i) => ({
    ...item,
    open: i === idx ? !item.open : false
  }))
}

const getFaqIcon = (item, idx) => {
  if (item && item.icon) return item.icon;
  const defaultIcons = ['home', 'clock', 'measure', 'truck', 'wallet'];
  return defaultIcons[idx % 5];
}

const getFaqColor = (item, idx) => {
  if (item && item.color) return item.color;
  const defaultColors = ['orange', 'blue', 'purple', 'emerald', 'pink'];
  return defaultColors[idx % 5];
}

const getFaqPillColorClass = (item, idx) => {
  const color = getFaqColor(item, idx);
  const classes = {
    orange: 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-500/10',
    blue: 'bg-gradient-to-br from-blue-400 to-blue-500 shadow-blue-500/10',
    purple: 'bg-gradient-to-br from-purple-400 to-purple-500 shadow-purple-500/10',
    emerald: 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-500/10',
    pink: 'bg-gradient-to-br from-pink-400 to-pink-500 shadow-pink-500/10',
    indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-500 shadow-indigo-500/10',
    amber: 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/10'
  };
  return classes[color] || classes.pink;
}

const getFaqCircleBgClass = (item, idx) => {
  const color = getFaqColor(item, idx);
  const classes = {
    orange: 'bg-[#fff2e8] dark:bg-blue-950/20',
    blue: 'bg-[#e6f4ff] dark:bg-blue-950/20',
    purple: 'bg-[#f9f0ff] dark:bg-purple-950/20',
    emerald: 'bg-[#e6fffb] dark:bg-emerald-950/20',
    pink: 'bg-[#fff0f6] dark:bg-pink-950/20',
    indigo: 'bg-[#e0e7ff] dark:bg-indigo-950/20',
    amber: 'bg-[#fffbeb] dark:bg-amber-950/20'
  };
  return classes[color] || classes.pink;
}

const getFaqIconColorClass = (item, idx) => {
  const color = getFaqColor(item, idx);
  const classes = {
    orange: 'text-blue-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    emerald: 'text-emerald-500',
    pink: 'text-pink-500',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500'
  };
  return classes[color] || classes.pink;
}

// --- Corporate Partner Testimonials Carousel ---
const corporateReviews = ref([])

const partnersSliderContainer = ref(null)
const partnersActiveIndex = ref(0)

const scrollPartnersTo = (index) => {
  if (!partnersSliderContainer.value) return
  const container = partnersSliderContainer.value
  const cards = container.children
  if (cards && cards[index]) {
    const targetScroll = cards[index].offsetLeft - container.offsetLeft - (container.clientWidth - cards[index].clientWidth) / 2
    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
    partnersActiveIndex.value = index
  }
}

const handlePartnersScroll = (e) => {
  const container = e.target
  const scrollLeft = container.scrollLeft
  const width = container.clientWidth
  const children = Array.from(container.children)
  let closestIndex = 0
  let minDiff = Infinity
  children.forEach((child, idx) => {
    const childCenter = child.offsetLeft + child.clientWidth / 2
    const containerCenter = scrollLeft + width / 2
    const diff = Math.abs(childCenter - containerCenter)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = idx
    }
  })
  partnersActiveIndex.value = closestIndex
}

const prevPartnerSlide = () => {
  const nextIdx = (partnersActiveIndex.value - 1 + corporateReviews.value.length) % corporateReviews.value.length
  scrollPartnersTo(nextIdx)
}

const nextPartnerSlide = () => {
  const nextIdx = (partnersActiveIndex.value + 1) % corporateReviews.value.length
  scrollPartnersTo(nextIdx)
}

const articlesSliderContainer = ref(null)
const articlesActiveIndex = ref(0)
let articlesAutoplayInterval = null

const totalArticlePages = computed(() => Math.ceil(recentArticles.value.length / 3))

const currentArticlePage = computed(() => {
  if (recentArticles.value.length === 0) return 0
  const page = Math.floor(articlesActiveIndex.value / 3)
  return Math.min(Math.max(page, 0), totalArticlePages.value - 1)
})

const scrollArticlesTo = (index) => {
  if (!articlesSliderContainer.value) return
  const container = articlesSliderContainer.value
  const cards = container.children
  if (cards && cards[index]) {
    const targetScroll = cards[index].offsetLeft - container.offsetLeft - (container.clientWidth - cards[index].clientWidth) / 2
    container.scrollTo({ left: targetScroll, behavior: 'smooth' })
    articlesActiveIndex.value = index
  }
}

const scrollArticlesToPage = (pageIndex) => {
  const targetIndex = pageIndex * 3
  scrollArticlesTo(targetIndex)
}

const handleArticlesScroll = (e) => {
  const container = e.target
  const scrollLeft = container.scrollLeft
  const width = container.clientWidth
  const children = Array.from(container.children)
  let closestIndex = 0
  let minDiff = Infinity
  children.forEach((child, idx) => {
    const childCenter = child.offsetLeft + child.clientWidth / 2
    const containerCenter = scrollLeft + width / 2
    const diff = Math.abs(childCenter - containerCenter)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = idx
    }
  })
  articlesActiveIndex.value = closestIndex
}

const prevArticleSlide = () => {
  const totalPages = totalArticlePages.value
  if (totalPages <= 1) return
  const prevPage = (currentArticlePage.value - 1 + totalPages) % totalPages
  scrollArticlesToPage(prevPage)
}

const nextArticleSlide = () => {
  const totalPages = totalArticlePages.value
  if (totalPages <= 1) return
  const nextPage = (currentArticlePage.value + 1) % totalPages
  scrollArticlesToPage(nextPage)
}

const startArticlesAutoplay = () => {
  stopArticlesAutoplay()
  articlesAutoplayInterval = setInterval(() => {
    const totalPages = totalArticlePages.value
    if (totalPages <= 1) return
    const nextPage = (currentArticlePage.value + 1) % totalPages
    scrollArticlesToPage(nextPage)
  }, 4000)
}

const stopArticlesAutoplay = () => {
  if (articlesAutoplayInterval) {
    clearInterval(articlesAutoplayInterval)
    articlesAutoplayInterval = null
  }
}

const formattedArticlesHeading = computed(() => {
  const heading = sectionTitles.value.articlesHeading || 'อัพเดทข่าวสารน่ารู้'
  return heading.replace('น่ารู้', '<span class="text-blue-500">น่ารู้</span>')
} )




const formattedProjectsHeading = computed(() => {
  const heading = sectionTitles.value.projectsHeading || 'ภาพผลงานติดตั้งจริงล่าสุด'
  return heading.replace('ล่าสุด', '<span class="text-[#0220A4] dark:text-blue-400">ล่าสุด</span>')
})

const formattedTestimonialsHeading = computed(() => {
  const heading = sectionTitles.value.testimonialsHeading || 'ความไว้วางใจจากองค์กรชั้นนำ'
  let formatted = heading
  formatted = formatted.replace('ตัวจริง', '<span class="text-blue-500 dark:text-blue-400">ตัวจริง</span>')
  formatted = formatted.replace('องค์กรชั้นนำ', '<span class="text-blue-500 dark:text-blue-400">องค์กรชั้นนำ</span>')
  return formatted
})

const formattedPartnersHeading = computed(() => {
  const heading = sectionTitles.value.partnersHeading || 'ความไว้วางใจจากองค์กรชั้นนำ'
  return heading.replace('องค์กรชั้นนำ', '<span class="text-blue-500 dark:text-blue-400">องค์กรชั้นนำ</span>')
})

const cleanProjectTitle = (title) => {
  if (!title) return ''
  return title.replace(/\s+(ณ|เขต|อำเภอ).*$/, '').trim()
}

const getModelFromTitle = (title) => {
  if (!title) return ''
  const match = title.match(/รุ่น\s+([A-Za-z0-9-]+)/)
  return match ? match[1] : ''
}

const sectionTitles = ref({
  categoriesTitle: 'คอลเลกชัน',
  categoriesTitleHighlight: 'พื้นที่เก็บของ',
  categoriesDesc: 'เลือกดูหมวดหมู่สินค้าที่ออกแบบมาเพื่อตอบโจทย์ทุกพื้นที่ของคุณ',
  collectionTitle: 'รุ่นยอดนิยม',
  collectionDesc: 'สัมผัสการออกแบบที่ขายดีที่สุด การันตีคุณภาพและความสวยงามเกินราคา',
  showcaseBadge: 'คอลเลกชันยอดฮิตสินค้าแนะนำ',
  showcaseTitle: 'สินค้าแนะนำ',
  showcaseTitleHighlight: 'ที่ออกแบบเป็นพิเศษ',
  showcaseViewAllText: 'ดูรุ่นทั้งหมด (100+)',

  projectsTitle: 'ผลงานของเรา',
  projectsHeading: 'ภาพผลงานติดตั้งจริงล่าสุด',
  projectsDesc: 'มั่นใจในคุณภาพจากผลงานจริงที่ลูกค้าไว้วางใจ',
  testimonialsTitle: 'เสียงตอบรับจากลูกค้า',
  testimonialsHeading: 'ความไว้วางใจจากตัวจริง',
  testimonialsDesc: 'เราภูมิใจที่ได้เป็นส่วนหนึ่งในการดูแลบ้านและธุรกิจของลูกค้า\nด้วยคุณภาพงานที่ได้มาตรฐาน บริการที่จริงใจ และส่งมอบตรงเวลาเสมอ',
  partnersTitle: 'พาร์ทเนอร์ของเรา',
  partnersHeading: 'ความไว้วางใจจากองค์กรชั้นนำ',
  partnersDesc: 'ขอขอบคุณทุกความไว้วางใจที่เลือกเราดูแลพื้นที่ของคุณ',
  articlesTitle: 'คลังสาระ',
  articlesHeading: 'อัพเดทข่าวสารน่ารู้',
  faqTitle: 'คำถามที่พบบ่อย',
  faqHeading: 'สิ่งที่คุณอยากรู้',
  faqDesc: 'รวบรวมคำตอบสำหรับคำถามที่ลูกค้าสอบถามบ่อยที่สุด',
  affiliatesTitle: 'บริษัทในเครือ',
  affiliatesHeading: 'เครือข่ายธุรกิจของเรา',
  affiliatesDesc: 'เครือข่ายธุรกิจที่มั่นคง ร่วมมือสร้างสรรค์นวัตกรรมและบริการคุณภาพระดับมาตรฐานสากล',
})

const highlightCatIndex = ref(0)

const highlightProgress = ref(0)
let highlightInterval = null

const HIGHLIGHT_DURATION = 6000
const HIGHLIGHT_TICK = 30

const highlightCategoryProducts = ref({}) // cache products for each highlighted category

const fetchHighlightProducts = async (catIndex) => {
  if (highlightCategoryProducts.value[catIndex]) return
  const highlightCat = highlightCategoriesList.value[catIndex];
  if (!highlightCat) return
  
  const selectedIds = highlightCat.productIds ? highlightCat.productIds.filter(id => id && String(id).trim() !== '').map(id => String(id).trim()) : [];
  
  if (selectedIds.length > 0) {
    try {
      const promises = selectedIds.map(id => 
        fetch(`/api/products/${id}`)
          .then(r => r.ok ? r.json() : null)
          .catch(() => null)
      );
      const results = await Promise.all(promises);
      highlightCategoryProducts.value[catIndex] = results.filter(Boolean).map(r => r.data).filter(Boolean);
    } catch (err) {
      console.error('Failed to fetch specific highlight products', err)
    }
  } else {
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(highlightCat.name)}&limit=3`)
      const data = await res.json()
      if (data.success) {
        highlightCategoryProducts.value[catIndex] = data.data
      }
    } catch (err) {
      console.error('Failed to fetch highlight products', err)
    }
  }
}

watch(highlightCatIndex, (newIdx) => {
  fetchHighlightProducts(newIdx)
})

const startHighlightRotation = () => {
  clearInterval(highlightInterval)
  highlightProgress.value = 0
  highlightInterval = setInterval(() => {
    highlightProgress.value += (HIGHLIGHT_TICK / HIGHLIGHT_DURATION) * 100
    if (highlightProgress.value >= 100) {
      highlightProgress.value = 0
      highlightCatIndex.value = (highlightCatIndex.value + 1) % (highlightCategoriesList.value.length || 1) // Rotate through available categories
    }
  }, HIGHLIGHT_TICK)
}

const setHighlightCat = (index) => {
  highlightCatIndex.value = index
  startHighlightRotation()
}

const prevHighlightCat = () => {
  if (highlightCategoriesList.value.length === 0) return;
  const newIndex = (highlightCatIndex.value - 1 + highlightCategoriesList.value.length) % highlightCategoriesList.value.length;
  setHighlightCat(newIndex);
};

const nextHighlightCat = () => {
  if (highlightCategoriesList.value.length === 0) return;
  const newIndex = (highlightCatIndex.value + 1) % highlightCategoriesList.value.length;
  setHighlightCat(newIndex);
};

const getCategoryHighlightBullets = (category) => {
  if (!category) return [];
  if (category.bullets && category.bullets.some(b => b && b.trim() !== '')) {
    return category.bullets.filter(b => b && b.trim() !== '');
  }
  const catName = category.name;
  if (!catName) return [];
  if (catName.includes('ตู้และกล่อง') || catName.includes('กล่องเก็บของ')) {
    return [
      'วัสดุ HDPE เกรดพรีเมียม',
      'ทนแดด ทนฝน ไม่ซีด ไม่กรอบ',
      'ปลอดภัย ปราศจากสารพิษ',
      'รับน้ำหนักได้สูง'
    ];
  } else if (catName.includes('HDPE') || catName.includes('พลาสติก')) {
    return [
      'วัสดุ HDPE เกรดพรีเมียม',
      'โครงสร้างผนังสองชั้นทนทานพิเศษ',
      'กันแดด กันฝน 100% ไม่เป็นสนิม',
      'ระบบล็อคนิรภัย ปลอดภัย'
    ];
  } else if (catName.includes('PP')) {
    return [
      'พลาสติก PP ทนทานเนื้อเหนียว',
      'ดีไซน์มินิมอล เข้ากับทุกมุมบ้าน',
      'ทนความร้อน ทนรังสี UV',
      'ดูแลรักษาง่าย ไม่ต้องทาสี'
    ];
  } else if (catName.includes('โลหะ') || catName.includes('เหล็ก')) {
    return [
      'เหล็กกัลวาไนซ์กันสนิม 100%',
      'แข็งแกร่งทนทาน ทนแรงลมได้ดี',
      'ทนความร้อนสูง ปลอดภัยจากอัคคีภัย',
      'อายุการใช้งานยาวนานนับสิบปี'
    ];
  } else {
    return [
      'วัสดุพรีเมียม แข็งแรงทนทาน',
      'ดีไซน์โมเดิร์น สวยงามหรูหรา',
      'ทนทานทุกสภาพภูมิอากาศ',
      'รับประกันคุณภาพการใช้งาน'
    ];
  }
};

const getButtonLink = (category) => {
  if (!category) return '/products';
  if (category.customLink) return category.customLink;
  return `/products?category=${encodeURIComponent(category.name)}`;
};

const handleAddToCart = async (e, product) => {
  e.preventDefault();
  e.stopPropagation();
  try {
    await cartStore.addToCart(product, 1);
    showToast(`เพิ่ม ${product.title || product.name} ลงในตะกร้าแล้ว`, 'success');
  } catch (err) {
    showToast('ไม่สามารถเพิ่มลงตะกร้าได้', 'error');
  }
};

onMounted(() => {
  if (categories.value.length > 0) {
    fetchHighlightProducts(0)
  }
  startHighlightRotation()
  startArticlesAutoplay()
})

onUnmounted(() => {
  clearInterval(highlightInterval)
  stopArticlesAutoplay()
})

const showcaseProducts = ref([])

// Removed totalSlides and scrollToSlide methods

// Affiliated companies (loaded from settings)
const affiliatedCompanies = ref([])

const getBusinessTag = (name) => {
  if (!name) return 'บริษัทในเครือ'
  const lower = name.toLowerCase()
  if (lower.includes('crtech')) return 'เครื่องกำเนิดไฟฟ้า & วิศวกรรม'
  if (lower.includes('autosplice')) return 'เทคโนโลยีเชื่อมต่อโลหะ'
  if (lower.includes('shed') || lower.includes('storage')) return 'อาคาร & ห้องเก็บของสำเร็จรูป'
  return 'บริษัทในเครือ'
}

const fetchShowcaseProducts = async () => {
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.success) {
      const saleProducts = data.data.filter(p => p.original_price && Number(p.original_price) > Number(p.price));
      showcaseProducts.value = saleProducts.slice(0, 8).map((p, index) => ({
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        title: p.name,
        image: p.image_url || '/images/home/hero-slide-1.webp',
        subtitle: p.sku ? `รุ่น ${p.sku}` : (p.category || 'Premium Unit'),
        price: p.price,
        originalPrice: p.original_price,
        is_out_of_stock: p.is_out_of_stock || false,
        isBestSeller: p.badge_bestseller === true || p.badge_bestseller === 1 || p.badge_bestseller === 'true',
        isHiddenMobile: '',
        card_features: p.card_features || null,
        compare_enabled: p.compare_enabled !== false,
        badge_bestseller: p.badge_bestseller,
        badge_free_shipping: p.badge_free_shipping,
        badge_warranty: p.badge_warranty,
        badge_installation: p.badge_installation,
        badge_new: p.badge_new,
        badge_recommended: p.badge_recommended
      }))

// Removed homeShowcaseSlider enrichment logic
    }
  } catch (err) {
    console.error('Failed to fetch showcase products', err)
  }
}

const fetchRecentContent = async () => {
  try {
    const limit = homeProjectsCta.value.show ? 5 : 6;
    if (settingsStore.isProjectsEnabled) {
      const [projRes, artRes] = await Promise.all([
        fetch(`/api/projects/published?limit=${limit}`),
        fetch('/api/articles?limit=9')
      ])
      const projData = await projRes.json()
      const artData = await artRes.json()
      if (projData.success) {
        recentProjects.value = projData.data.slice(0, limit)
      }
      if (artData.success) {
        recentArticles.value = artData.data.slice(0, 9)
      }
    } else {
      const artRes = await fetch('/api/articles?limit=9')
      const artData = await artRes.json()
      if (artData.success) {
        recentArticles.value = artData.data.slice(0, 9)
      }
    }
  } catch (err) {
    console.error('Failed to fetch recent content', err)
  }
}

const fetchCategories = async () => {
  try {
    const res = await fetch('/api/categories')
    const data = await res.json()
    if (data.success) {
      // Sort categories by sort_order or preserve API order
      const sorted = (data.data || []).sort((a, b) => {
        const orderA = a.sort_order ?? 0;
        const orderB = b.sort_order ?? 0;
        return orderA - orderB;
      });
      categories.value = sorted;

      // Initialize highlight Categories list
      if (homeHighlightSettings.value && homeHighlightSettings.value.items && homeHighlightSettings.value.items.some(i => i.categoryId)) {
        const configuredCats = homeHighlightSettings.value.items
          .map(item => {
            const cat = categories.value.find(c => String(c.id) === String(item.categoryId));
            if (!cat) return null;
            return {
              ...cat,
              customDescription: item.customDesc || cat.description,
              productIds: item.productIds || [],
              bullets: item.bullets || [],
              customLink: item.customLink || '',
              badgeText: item.badgeText || '',
              buttonText: item.buttonText || ''
            }
          })
          .filter(Boolean);
          
        const usedIds = configuredCats.map(c => String(c.id));
        let fallbackIndex = 0;
        while (configuredCats.length < 5 && fallbackIndex < categories.value.length) {
          const fallbackCat = categories.value[fallbackIndex];
          if (!usedIds.includes(String(fallbackCat.id))) {
            configuredCats.push({
              ...fallbackCat,
              customDescription: fallbackCat.description,
              productIds: [],
              bullets: [],
              customLink: '',
              badgeText: '',
              buttonText: ''
            });
            usedIds.push(String(fallbackCat.id));
          }
          fallbackIndex++;
        }
        highlightCategoriesList.value = configuredCats;
      } else {
        // Fallback to top 5 categories
        highlightCategoriesList.value = categories.value.slice(0, 5).map(cat => ({
          ...cat,
          customDescription: cat.description,
          productIds: [],
          bullets: [],
          customLink: '',
          badgeText: '',
          buttonText: ''
        }));
      }

      fetchHighlightProducts(0);
    }
  } catch (err) {
    console.error('Failed to fetch categories', err)
  }
}

const buildShowcaseCategoriesData = async () => {
  if (categoryShowcaseSettings.value.length === 0 || categories.value.length === 0) return;
  
  const formattedData = [];
  
  for (const showcase of categoryShowcaseSettings.value) {
    const category = categories.value.find(c => String(c.id) === String(showcase.categoryId));
    if (!category) continue;
    
    // Fetch specifically the products selected for this category
    let products = [];
    if (showcase.productIds && showcase.productIds.length > 0) {
      try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(category.name)}`);
        const data = await res.json();
        if (data.success) {
           products = data.data.filter(p => showcase.productIds.includes(p.id))
                              .sort((a,b) => showcase.productIds.indexOf(a.id) - showcase.productIds.indexOf(b.id));
        }
      } catch(e) { console.error('Error fetching showcase products for category', category.name, e) }
    }
    
    // Fallback: if no specific products were selected, or if the selected products were deleted
    if (products.length === 0) {
      try {
        const res = await fetch(`/api/products?category=${encodeURIComponent(category.name)}`);
        const data = await res.json();
        // Since API limit might not be supported, enforce local slice
        if (data.success) products = data.data.slice(0, 4); // Show 4 latest products as fallback
      } catch(e) { console.error('Error fetching showcase products fallback for category', category.name, e) }
    }
    
    
    let parsedFeatures = { enabled: true, items: [] };
    try {
      if (typeof category.features === 'string') {
        const parsed = JSON.parse(category.features);
        if (Array.isArray(parsed)) {
          parsedFeatures.items = parsed || [];
        } else if (parsed && typeof parsed === 'object') {
          parsedFeatures.enabled = parsed.enabled !== false;
          parsedFeatures.items = Array.isArray(parsed.items) ? parsed.items : [];
        }
      } else if (Array.isArray(category.features)) {
        parsedFeatures.items = [...category.features];
      } else if (category.features && typeof category.features === 'object') {
        parsedFeatures.enabled = category.features.enabled !== false;
        parsedFeatures.items = Array.isArray(category.features.items) ? category.features.items : [];
      }
    } catch (e) {}

    if (products.length > 0) {
      formattedData.push({
        category: { ...category, features: parsedFeatures },
        products: products.map(p => ({
          id: p.id,
          slug: p.slug,
          sku: p.sku,
          title: p.name,
          image: p.image_url || '/images/placeholder.png',
          subtitle: p.sku ? `SKU: ${p.sku}` : (p.category || 'Premium Unit'),
          price: p.price,
          originalPrice: p.original_price,
          is_out_of_stock: p.is_out_of_stock || false,
          card_features: p.card_features || null,
          compare_enabled: p.compare_enabled !== false
        }))
      });
    }
  }
  
  showcaseCategoriesData.value = formattedData;
}

// --- Category Flow Slider Logic ---
const categorySliderRef = ref(null)
const activeCenterIndex = ref(0)
let autoScrollCatInterval = null
const isHoveringCatSlider = ref(false)

const extendedCategories = computed(() => {
  if (!categories.value || categories.value.length === 0) return []
  // Duplicate a few times for infinite looping
  return [...categories.value, ...categories.value, ...categories.value, ...categories.value]
})

const updateActiveCenter = () => {
  if (!categorySliderRef.value) return
  const container = categorySliderRef.value
  const center = container.scrollLeft + container.clientWidth / 2
  
  let closestIndex = 0
  let minDistance = Infinity
  
  const children = Array.from(container.children)
  children.forEach((child, index) => {
    const childCenter = child.offsetLeft + child.clientWidth / 2 - container.offsetLeft
    // The exact child center relative to scroll container
    const absDistance = Math.abs(childCenter - center)
    if (absDistance < minDistance) {
      minDistance = absDistance
      closestIndex = index
    }
  })
  
  activeCenterIndex.value = closestIndex
}

const slideToNextCat = () => {
  if (!categorySliderRef.value) return
  const container = categorySliderRef.value
  const children = Array.from(container.children)
  
  let nextIndex = activeCenterIndex.value + 1
  
  // Infinite scroll illusion reset
  if (nextIndex >= Math.floor(extendedCategories.value.length * 0.75)) {
    // Silently jump back
    container.style.scrollBehavior = 'auto'
    const resetIndex = Math.floor(extendedCategories.value.length / 4)
    const resetChild = children[resetIndex]
    const resetScrollTarget = resetChild.offsetLeft - (container.clientWidth / 2) + (resetChild.clientWidth / 2)
    container.scrollLeft = resetScrollTarget
    
    // Request reflow
    void container.offsetWidth
    
    container.style.scrollBehavior = 'smooth'
    nextIndex = resetIndex + 1
  }

  if (nextIndex < children.length) {
    const nextChild = children[nextIndex]
    const scrollTarget = nextChild.offsetLeft - (container.clientWidth / 2) + (nextChild.clientWidth / 2)
    
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    })
  }
}

const startAutoScrollCat = () => {
  if (autoScrollCatInterval) clearInterval(autoScrollCatInterval)
  autoScrollCatInterval = setInterval(() => {
    if (!isHoveringCatSlider.value) {
      slideToNextCat()
    }
  }, 2500) // Slide interval
}

const stopAutoScrollCat = () => {
  if (autoScrollCatInterval) clearInterval(autoScrollCatInterval)
}

const onCatSliderEnter = () => {
  isHoveringCatSlider.value = true
}

const onCatSliderLeave = () => {
  isHoveringCatSlider.value = false
}

const onCatScroll = () => {
  // Update active index via requestAnimationFrame to throttle
  window.requestAnimationFrame(() => {
    updateActiveCenter()
  })
}

const slideCatByDirection = (direction) => {
  if (!categorySliderRef.value) return
  const container = categorySliderRef.value
  const children = Array.from(container.children)
  
  let nextIndex = activeCenterIndex.value + direction
  if (nextIndex < 0) nextIndex = 0
  if (nextIndex >= children.length) nextIndex = children.length - 1
  
  const targetChild = children[nextIndex]
  if (targetChild) {
    const scrollTarget = targetChild.offsetLeft - (container.clientWidth / 2) + (targetChild.clientWidth / 2)
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    })
  }
}

const prevCatSlide = () => slideCatByDirection(-1)
const nextCatSlide = () => slideCatByDirection(1)

const handleCatClick = (e, index) => {
  if (index !== activeCenterIndex.value) {
    e.preventDefault()
    // Scroll to it instead of navigating immediately if it's not the center
    const container = categorySliderRef.value
    const child = container.children[index]
    const scrollTarget = child.offsetLeft - (container.clientWidth / 2) + (child.clientWidth / 2)
    
    container.scrollTo({
      left: scrollTarget,
      behavior: 'smooth'
    })
  }
}



const allBadges = ref([])
const loadMasterBadges = async () => {
  try {
    const res = await fetch('/api/badges')
    const data = await res.json()
    if (data.success) {
      allBadges.value = data.data
    }
  } catch (e) {
    console.error('Error loading master badges', e)
  }
}

const resolveProductBadge = (badgeId) => {
  return allBadges.value.find(b => b.id === badgeId)
}

const getRibbonColorClass = (color) => {
  const maps = {
    red: 'from-red-600 to-red-500',
    orange: 'from-blue-600 to-blue-500',
    amber: 'from-amber-500 to-amber-400',
    emerald: 'from-emerald-600 to-emerald-500',
    teal: 'from-teal-600 to-teal-500',
    blue: 'from-blue-600 to-blue-500',
    cyan: 'from-cyan-600 to-cyan-500',
    indigo: 'from-indigo-600 to-indigo-500',
    purple: 'from-purple-600 to-purple-500',
    pink: 'from-pink-600 to-pink-500',
    rose: 'from-rose-600 to-rose-500',
    gray: 'from-gray-600 to-gray-500'
  }
  return maps[color] || 'from-rose-600 to-rose-500'
}

const initData = async () => {
  await loadMasterBadges()
  await loadHomepageSettings()
  addStructuredData()
  addFaqSchema()
  fetchShowcaseProducts()
  fetchRecentContent()
  await fetchCategories()
  await buildShowcaseCategoriesData()
  
  if (categories.value.length > 0) {
    fetchHighlightProducts(0)
  }
  startHighlightRotation()
// Removed startShowcaseProgress call
}

const handleScroll = () => {
  // Example: You can add scroll-based animations or lazy loading here
  // For now, it's just a placeholder for the event listener
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  initData()
  if (authStore.isAuthenticated) {
    wishlistStore.fetchWishlist()
  }

  // Dynamic Home SEO & GEO Tags
  const updateHomeSeoAndSchemas = () => {
    const sName = settingsStore.storeName || '';
    const sDesc = settingsStore.storeDescription || '';
    const sLegal = settingsStore.companyLegalName || sName || '';

    setMeta({
      title: settingsStore.storeOgTitle || sName || '',
      description: sDesc,
      keywords: settingsStore.storeKeywords || '',
      llmContext: settingsStore.storeDefaultLlmContext || '',
      canonicalUrl: `${window.location.origin}/`,
      type: 'website'
    })

    // Home Organization & WebSite Schemas
    setStructuredData([
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": sLegal,
        "alternateName": sName,
        "url": window.location.origin,
        "logo": `${window.location.origin}/logo.png`,
        "description": sDesc
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": sName,
        "url": window.location.origin,
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${window.location.origin}/products?search={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      }
    ], 'dynamic-structured-data')
  }

  updateHomeSeoAndSchemas()
  watch([() => settingsStore.storeName, () => settingsStore.storeDescription, () => settingsStore.companyLegalName], () => {
    updateHomeSeoAndSchemas()
  })
  
  // Refresh AOS after content loads
  await nextTick()
  
  // Jump slider to the middle to prevent empty left gap on load
  if (categorySliderRef.value && extendedCategories.value.length > 0) {
    const container = categorySliderRef.value
    // Disable smooth scroll temporarily
    container.style.scrollBehavior = 'auto'
    
    // Calculate index to jump to (the start of the second duplicate block)
    const jumpIndex = Math.floor(extendedCategories.value.length / 4)
    
    setTimeout(() => {
      const children = Array.from(container.children)
      if (children[jumpIndex]) {
        const targetChild = children[jumpIndex]
        const scrollTarget = targetChild.offsetLeft - (container.clientWidth / 2) + (targetChild.clientWidth / 2)
        container.scrollLeft = scrollTarget
        updateActiveCenter()
      }
      
      // Restore smooth scroll behavior and start auto scroll
      container.style.scrollBehavior = 'smooth'
      startAutoScrollCat()
    }, 50)
  } else {
    startAutoScrollCat()
  }
})

// Dynamic contact channels for the home page banner
const bannerPhone = computed(() => {
  return settingsStore.contactPhones?.[0]?.value || settingsStore.storePhone || '02-9081348-9'
})

const bannerPhoneLink = computed(() => {
  return `tel:${bannerPhone.value.replace(/[^0-9+]/g, '')}`
})

const bannerWorkingHours = computed(() => {
  return settingsStore.contactWorkingHours || 'จันทร์ - เสาร์ 08.30 - 17.30 น.'
})

const bannerLineId = computed(() => {
  return settingsStore.contactLines?.[0]?.value || ''
})

const bannerLineLink = computed(() => {
  if (settingsStore.contactLines?.[0]?.url) return settingsStore.contactLines[0].url
  return bannerLineId.value ? `https://line.me/R/ti/p/~${bannerLineId.value.replace('@', '')}` : '#'
})

const bannerCompanyName = computed(() => {
  return settingsStore.contactCompanyName || ''
})

const bannerCompanyLocation = computed(() => {
  const fullAddress = settingsStore.contactAddress || ''
  if (!fullAddress) return 'กรุงเทพฯ ประเทศไทย'
  if (fullAddress.includes('กรุงเทพ')) return 'กรุงเทพฯ ประเทศไทย'
  if (fullAddress.includes('ปทุมธานี')) return 'ปทุมธานี ประเทศไทย'
  if (fullAddress.includes('นนทบุรี')) return 'นนทบุรี ประเทศไทย'
  return fullAddress.length > 25 ? fullAddress.substring(0, 22) + '...' : fullAddress
})

const formatCTATitle = (text) => {
  if (!text) return '';
  let formatted = text;
  if (settingsStore.storeName) {
    formatted = formatted.replace(`${settingsStore.storeName}:`, `<span class="text-[#0220A4] dark:text-blue-400">${settingsStore.storeName}:</span>`);
  }
  formatted = formatted.replace('พื้นที่พรีเมียม', '<span class="bg-gradient-to-r from-[#0220A4] via-[#0220A4] to-[#0220A4] dark:from-blue-400 dark:to-amber-300 bg-clip-text text-transparent pb-1">พื้นที่พรีเมียม</span>');
  return formatted;
}

const formatCTADesc = (text) => {
  if (!text) return '';
  let formatted = text;
  formatted = formatted.replace('โรงจอดรถ', '<span class="text-[#0220A4] dark:text-blue-400 font-semibold">โรงจอดรถ</span>');
  formatted = formatted.replace('โกดังเก็บของ', '<span class="text-[#0220A4] dark:text-blue-400 font-semibold">โกดังเก็บของ</span>');
  formatted = formatted.replace('พื้นที่อเนกประสงค์', '<span class="text-[#0220A4] dark:text-blue-400 font-semibold">พื้นที่อเนกประสงค์</span>');
  return formatted;
}

onUnmounted(() => {
  clearInterval(slideInterval)
  clearInterval(progressInterval)
  stopAutoScrollCat()
// Removed stopShowcaseProgress call
  window.removeEventListener('scroll', handleScroll)
  
  const script = document.getElementById('json-ld-localbusiness')
  if (script) document.head.removeChild(script)
  const faqScript = document.getElementById('json-ld-faq')
  if (faqScript) document.head.removeChild(faqScript)
})
</script>

<template>
  <div class="home-page overflow-x-hidden bg-[#FAF9F6] dark:bg-[#0C0E14]">
    
    <!-- Loading State -->
    <div v-if="settingsLoading" class="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] dark:bg-[#0C0E14]">
      <div class="w-14 h-14 border-4 border-[#0220A4]/20 border-t-[#0220A4] rounded-full animate-spin mb-4"></div>
      <p class="text-[#0220A4] text-sm font-bold tracking-widest uppercase">กำลังโหลดหน้าเว็บไซต์...</p>
    </div>

    <!-- Main Content -->
    <template v-else>
    <div class="dark text-white">
      <section ref="heroRef" @mousemove="onMouseMove" @mouseenter="isHoveringHero = true" @mouseleave="mouse.x = 0; mouse.y = 0; isHoveringHero = false" 
        class="relative min-h-[760px] lg:h-screen lg:max-h-[960px] flex items-center overflow-hidden bg-gradient-to-b from-[#070C18] via-[#0A1226] to-[#080E1E]"
      >
      <!-- High-Tech Ambient Studio Lighting & Grid -->
      <div class="absolute -top-32 left-1/4 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-[170px] pointer-events-none"></div>
      <div class="absolute top-1/3 -right-20 w-[600px] h-[600px] bg-cyan-500/12 rounded-full blur-[160px] pointer-events-none"></div>
      <div class="absolute -bottom-20 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <!-- Precision Tech Dot Grid -->
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none"
        style="background-image: radial-gradient(circle, rgba(56, 189, 248, 0.8) 1px, transparent 1px); background-size: 32px 32px;">
      </div>

      <!-- Top Header Accent Line -->
      <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent z-30"></div>

      <!-- Top Header Protection Gradient (Protects Navbar contrast while keeping hero stage bright) -->
      <div class="absolute top-0 left-0 right-0 h-32 z-10 pointer-events-none bg-gradient-to-b from-[#070C18]/95 via-[#070C18]/60 to-transparent"></div>

      <!-- Main Enterprise Split Stage Container -->
      <div class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 md:pt-32 pb-24 sm:pb-28 lg:pb-36">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <!-- ================= LEFT COLUMN: Value Proposition & Information Hierarchy ================= -->
          <div class="lg:col-span-7 flex flex-col text-left">
            <transition name="hero-stagger" mode="out-in">
              <div :key="currentSlide" class="flex flex-col text-left">
                
                <!-- Category / Brand Tag Badge (Glowing Modern Pill) -->
                <div class="hero-stagger-1 inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-cyan-500/30 backdrop-blur-xl shadow-lg mb-4 w-fit select-none transition-all duration-300">
                  <span class="flex h-2 w-2 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                  </span>
                  <span class="text-xs font-bold tracking-wider text-cyan-300 uppercase">
                    {{ slides[currentSlide]?.tag || 'KODERA JAPAN TECHNOLOGY' }}
                  </span>
                </div>
                
                <!-- Headline (Crisp, High Contrast, Radiant Gradient) -->
                <h1 class="hero-stagger-2 hero-heading text-[2.2rem] xs:text-[2.6rem] sm:text-[3.2rem] md:text-[3.6rem] lg:text-[3.9rem] font-black text-white tracking-tight leading-[1.12] mb-4 font-['IBM_Plex_Sans_Thai'] break-words">
                  <span class="block text-white drop-shadow-md" v-html="formatThaiText(slides[currentSlide]?.titleLine1 || 'เครื่องตัดปอกสายไฟอัตโนมัติ')"></span>
                  <span class="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 drop-shadow-md" v-html="formatThaiText(slides[currentSlide]?.titleLine2 || 'KODERA CASTING Series มาตรฐานญี่ปุ่น')"></span>
                </h1>
                
                <!-- Description -->
                <p class="hero-stagger-3 text-slate-300 text-sm sm:text-base md:text-lg font-light leading-relaxed mb-6 max-w-xl text-balance">
                  {{ slides[currentSlide]?.desc || 'เพิ่มประสิทธิภาพและผลผลิตสูงสุดในไลน์ผลิตสายไฟ ด้วยความเร็วสูงสุด 7,100 ชิ้น/ชม. ความแม่นยำระดับ ±0.1mm รองรับสายไฟ AWG#7 ถึง AWG#36' }}
                </p>

                <!-- Core Capability Badges (What the machines do - Clear & Professional) -->
                <div class="hero-stagger-3 flex flex-wrap items-center gap-2 sm:gap-2.5 mb-7">
                  <template v-if="slides[currentSlide]?.capabilities && slides[currentSlide]?.capabilities.length > 0">
                    <div v-for="(cap, capIdx) in slides[currentSlide].capabilities" :key="capIdx"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold backdrop-blur-md transition-all duration-300"
                      :class="cap.icon === 'twist' ? 'bg-indigo-950/60 border-indigo-500/30 text-indigo-300' : (cap.icon === 'strip_mid' ? 'bg-teal-950/60 border-teal-500/30 text-teal-300' : (cap.icon === 'strip_end' ? 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300' : 'bg-blue-950/60 border-blue-500/30 text-blue-300'))"
                    >
                      <svg v-if="cap.icon === 'twist'" class="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      <svg v-else-if="cap.icon === 'strip_mid'" class="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      <svg v-else-if="cap.icon === 'strip_end'" class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <svg v-else class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
                      </svg>
                      <span>{{ cap.label }}</span>
                    </div>
                  </template>
                  <template v-else>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
                      <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"/>
                      </svg>
                      <span>ตัดสายไฟ (Cut)</span>
                    </div>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-md">
                      <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                      </svg>
                      <span>ปอกหัว-ท้าย (Strip)</span>
                    </div>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
                      <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                      <span>ปั่นเกลียว (Twist)</span>
                    </div>
                    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-semibold backdrop-blur-md">
                      <svg class="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      <span>ย้ำเทอร์มินอล (Crimp)</span>
                    </div>
                  </template>
                </div>
                
                <!-- CTA Action Buttons -->
                <div class="hero-stagger-4 flex flex-row flex-wrap items-center gap-4 mb-6">
                  <!-- Primary Glowing Button -->
                  <router-link :to="slides[currentSlide]?.ctaLink || '/products'" @click="trackCTA(slides[currentSlide]?.ctaAction || 'view_products')" 
                    class="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all duration-300 bg-gradient-to-r from-[#0220A4] via-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#3B82F6] rounded-full shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] active:scale-95 overflow-hidden whitespace-nowrap"
                  >
                    <span class="relative z-10">{{ slides[currentSlide]?.ctaText || 'เลือกชมเครื่องตัดปอกสายไฟ' }}</span>
                    <svg class="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                    </svg>
                    <span class="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-1000 ease-out"></span>
                  </router-link>

                  <!-- Frosted Glass Secondary Button -->
                  <router-link :to="slides[currentSlide]?.ctaLink2 || '/quotation'" @click="trackCTA(slides[currentSlide]?.ctaAction2 || 'quotation')" 
                    class="group inline-flex items-center justify-center gap-2.5 px-7 py-4 text-sm font-semibold tracking-wide text-slate-200 hover:text-white bg-white/[0.07] hover:bg-white/[0.14] border border-white/[0.15] hover:border-cyan-400/40 rounded-full shadow-lg backdrop-blur-xl hover:scale-[1.03] active:scale-95 transition-all duration-300 whitespace-nowrap"
                  >
                    <div class="w-6 h-6 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition-colors">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                    </div>
                    <span>{{ slides[currentSlide]?.ctaText2 || 'ขอใบเสนอราคาด่วน' }}</span>
                  </router-link>
                </div>

                <!-- Trust Micro-Bar -->
                <div class="hero-stagger-4 flex items-center gap-4 text-xs text-slate-400 font-medium pt-2 border-t border-white/[0.08]">
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    มาตรฐานญี่ปุ่น 100%
                  </span>
                  <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span class="flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    ความแม่นยำสูง ±0.1mm
                  </span>
                  <span class="w-1 h-1 rounded-full bg-slate-600 hidden sm:inline-block"></span>
                  <span class="hidden sm:flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    รับประกันศูนย์ไทย
                  </span>
                </div>

              </div>
            </transition>
          </div>

          <!-- ================= RIGHT COLUMN: 1:1 Full-Frame Product Studio Stage ================= -->
          <div class="lg:col-span-5 relative flex items-center justify-center">
            
            <!-- 1:1 Aspect Ratio Precision Studio Stage Container -->
            <div class="relative w-full max-w-[460px] sm:max-w-[500px] lg:max-w-[520px] aspect-square mx-auto flex items-center justify-center group">
              
              <!-- Ambient Backlight Glow -->
              <div class="absolute -inset-4 bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-teal-500/20 rounded-[36px] blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

              <!-- Full-Frame 1:1 Image Canvas (Edge-to-Edge Image without inner margins) -->
              <div class="relative w-full h-full rounded-3xl overflow-hidden border border-white/25 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] bg-white flex items-center justify-center">
                
                <transition name="fade" mode="out-in">
                  <img :key="currentSlide"
                    :src="getOptimizedImageUrl(slides[currentSlide]?.image, 1200)" 
                    :alt="slides[currentSlide]?.tag || 'KODERA Wire Processing Machine'"
                    class="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 select-none"
                    @error="(e) => { 
                      onImageError(e); 
                      if (e.target.src.includes('placeholder') || e.target.dataset.fallbackAttempted === 'original') {
                        e.target.src = '/uploads/image-1786598541729-737143997.webp';
                      }
                    }"
                  />
                </transition>

              </div>

              <!-- Top-Right Floating Japan / Precision Badge -->
              <div v-if="slides[currentSlide]?.badgeHighlight" 
                class="absolute -top-3.5 -right-2 sm:-right-4 z-30 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/95 border border-cyan-400/50 shadow-2xl backdrop-blur-xl text-white pointer-events-none transition-all duration-300"
              >
                <div class="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-[10px]">
                  JP
                </div>
                <span class="text-xs font-bold text-cyan-300">
                  {{ slides[currentSlide]?.badgeHighlight || 'มาตรฐานญี่ปุ่น 100%' }}
                </span>
              </div>

              <!-- Bottom Floating Spec Ribbon -->
              <div class="absolute -bottom-3 sm:-bottom-4 inset-x-4 sm:inset-x-8 z-30 py-2.5 px-4 rounded-2xl bg-slate-900/95 border border-blue-400/40 shadow-2xl backdrop-blur-xl flex items-center justify-around text-center pointer-events-none transition-all duration-300">
                <!-- Spec 1 -->
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span class="text-[11px] sm:text-xs font-bold text-white">
                    {{ slides[currentSlide]?.badgeFeature || '7,100 ชิ้น/ชม.' }}
                  </span>
                </div>

                <!-- Divider -->
                <div class="w-px h-3.5 bg-slate-700"></div>

                <!-- Spec 2 -->
                <div class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span class="text-[11px] sm:text-xs font-bold text-slate-200">
                    {{ slides[currentSlide]?.badgeSpecial || 'AWG#7 ~ AWG#36' }}
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      <!-- ================= BOTTOM DESKTOP BAR: Feature Cards & Capsule Hub ================= -->
      <div class="absolute bottom-0 left-0 right-0 z-20 pointer-events-none hidden md:block">
        <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-end justify-between pointer-events-auto pb-6">
            
            <!-- Left Side: Bento Value Cards -->
            <div v-if="heroFeatureBadges && heroFeatureBadges.length > 0" class="flex items-end gap-3.5">
              <div v-for="(badge, index) in heroFeatureBadges.slice(0, 3)" :key="index"
                class="w-60 bg-slate-900/70 hover:bg-slate-900/90 backdrop-blur-2xl border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-1 group shadow-2xl"
              >
                <div class="flex items-center gap-3">
                  <!-- Icon Box -->
                  <div class="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-cyan-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm">
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path v-if="badge.icon === 'sun'" stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      <path v-else-if="badge.icon === 'wrench'" stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                      <path v-else-if="badge.icon === 'trophy'" stroke-linecap="round" stroke-linejoin="round" d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M12 2a7 7 0 00-7 7v3.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V9a7 7 0 00-7-7z" />
                      <path v-else-if="badge.icon === 'leaf'" stroke-linecap="round" stroke-linejoin="round" d="M12 3c-5 0-8 3-8 8 0 5 4 7 8 10 4-3 8-5 8-10 0-5-3-8-8-8zM12 3v18M12 11c3-2 5-2 5-2" />
                      <path v-else-if="badge.icon === 'wind'" stroke-linecap="round" stroke-linejoin="round" d="M2 10h15a2.5 2.5 0 10-2.5-2.5M2 14h18a2.5 2.5 0 11-2.5 2.5M2 18h12a2.5 2.5 0 10-2.5-2.5" />
                      <path v-else-if="badge.icon === 'house'" stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10M9 21v-6a1 1 0 011-1h4a1 1 0 011 1v6" />
                      <path v-else-if="badge.icon === 'bolt'" stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      <path v-else-if="badge.icon === 'lock'" stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div class="text-left flex-1 min-w-0">
                    <div class="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">{{ badge.title }}</div>
                    <p class="text-[10px] text-slate-400 font-light mt-0.5 truncate">{{ badge.desc }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side: Unified Capsule Slider Control Hub -->
            <div class="flex items-center gap-3 select-none mb-1">
              <div class="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/[0.1] shadow-2xl">
                <!-- Prev Button -->
                <button @click="prevSlide" aria-label="สไลด์ก่อนหน้า"
                  class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white border border-white/10 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <!-- Slide Progress Indicator -->
                <div class="flex items-center gap-2 px-1">
                  <span class="text-xs font-mono font-bold text-cyan-400">
                    {{ String(currentSlide + 1).padStart(2, '0') }}
                  </span>
                  
                  <div class="flex items-center gap-1.5">
                    <button v-for="(slide, idx) in slides" :key="idx" 
                      @click="goToSlide(idx)"
                      :aria-label="`ดูสไลด์ที่ ${idx + 1}`"
                      class="relative h-2 rounded-full transition-all duration-500 overflow-hidden cursor-pointer focus:outline-none"
                      :class="currentSlide === idx ? 'w-8 bg-white/15' : 'w-2 bg-white/20 hover:bg-white/40'"
                    >
                      <div v-if="currentSlide === idx" 
                        class="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-[30ms] ease-linear"
                        :style="{ width: `${slideProgress}%` }"
                      ></div>
                    </button>
                  </div>

                  <span class="text-xs font-mono text-slate-500">
                    {{ String(slides.length || 1).padStart(2, '0') }}
                  </span>
                </div>

                <!-- Next Button -->
                <button @click="nextSlide" aria-label="สไลด์ถัดไป"
                  class="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white border border-white/10 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- ================= MOBILE FALLBACK CONTROLS ================= -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 select-none md:hidden">
        <div class="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl">
          <button @click="prevSlide" aria-label="สไลด์ก่อนหน้า"
            class="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-blue-600 active:scale-95 transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex items-center gap-1">
            <button v-for="(slide, idx) in slides" :key="idx" 
              @click="goToSlide(idx)"
              :aria-label="`ดูสไลด์ที่ ${idx + 1}`"
              class="relative h-1.5 rounded-full transition-all duration-300 overflow-hidden"
              :class="currentSlide === idx ? 'w-6 bg-white/20' : 'w-1.5 bg-white/30'"
            >
              <div v-if="currentSlide === idx" 
                class="absolute inset-0 bg-cyan-400 rounded-full"
                :style="{ width: `${slideProgress}%` }"
              ></div>
            </button>
          </div>
          <button @click="nextSlide" aria-label="สไลด์ถัดไป"
            class="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-blue-600 active:scale-95 transition-all"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
    </div>

    <!-- Holiday / Campaign Banner Section (Light & Luxurious Enterprise Announcement Bar) -->
    <section v-if="settingsStore.isHolidayActive" class="relative w-full overflow-hidden bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900 border-y border-amber-200/80 dark:border-amber-500/20 shadow-sm py-3 sm:py-3.5">
      <!-- Background Ambient Light & Warm Luminous Glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-[380px] h-[120px] bg-amber-300/25 blur-[50px] rounded-full"></div>
        <div class="absolute top-1/2 right-1/4 -translate-y-1/2 w-[320px] h-[120px] bg-orange-300/20 blur-[50px] rounded-full"></div>
        <div class="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80"></div>
      </div>

      <!-- Background Custom Image Overlay if present -->
      <div v-if="settingsStore.holidayImage" class="absolute inset-0 bg-cover bg-center opacity-[0.06] mix-blend-multiply pointer-events-none" :style="{ backgroundImage: `url(${settingsStore.holidayImage})` }"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6 bg-white/95 dark:bg-slate-800/90 backdrop-blur-md border border-amber-200/70 dark:border-amber-500/20 rounded-2xl px-4 py-2.5 sm:px-6 sm:py-3 shadow-md shadow-amber-500/5">
          
          <!-- Notice Icon/Badge & Text Content -->
          <div class="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3.5 text-center sm:text-left flex-1 min-w-0">
            <!-- Badge Pill (Light Tone with Elegant Amber Gradient) -->
            <div class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-xs font-bold tracking-wide uppercase shrink-0 shadow-md shadow-amber-500/25">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <svg class="w-3.5 h-3.5 text-amber-100 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>{{ settingsStore.holidayName || 'ประกาศพิเศษ' }}</span>
            </div>

            <!-- Message Text (Crisp Dark Text on Light Surface) -->
            <p class="text-slate-800 dark:text-slate-100 text-xs sm:text-sm md:text-base font-semibold leading-normal">
              {{ settingsStore.holidayMessage || 'สิทธิพิเศษและโปรโมชั่นสุดคุ้มวันนี้' }}
            </p>
          </div>

          <!-- Right Action Button -->
          <div class="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-center">
            <!-- Custom Image Thumbnail if present -->
            <div v-if="settingsStore.holidayImage" class="w-9 h-9 rounded-lg overflow-hidden border border-amber-200 shadow shrink-0 hidden md:block">
              <img :src="settingsStore.holidayImage" alt="Campaign Thumbnail" class="w-full h-full object-cover">
            </div>

            <router-link :to="settingsStore.holidayBtnLink || '/products'" class="group relative inline-flex items-center justify-center gap-2 px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wide text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-95 transition-all duration-300 overflow-hidden shrink-0 whitespace-nowrap">
              <span class="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></span>
              <span class="relative z-10">{{ settingsStore.holidayBtnText || 'ดูรายละเอียด' }}</span>
              <svg class="w-3.5 h-3.5 text-white relative z-10 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </router-link>
          </div>

        </div>
      </div>
    </section>


    
    <!-- Highlight Categories Auto-Rotating Showcase -->
    <template v-if="false">
    <section v-if="homeShowHighlightCategories" class="py-24 md:py-32 bg-gray-50 dark:bg-[#0f172a] overflow-hidden relative border-t border-gray-100 dark:border-gray-800">
      <!-- Decorative Backdrop -->
      <div class="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/3 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-16">
           <h2 class="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">{{ homeHighlightSettings?.title || 'หมวดหมู่สินค้าขายดี' }}<span class="text-emerald-500">{{ homeHighlightSettings?.titleHighlight ? ' '+homeHighlightSettings.titleHighlight : ' ยอดนิยม' }}</span></h2>
           <p class="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base">{{ homeHighlightSettings?.subtitle || 'ค้นพบโซลูชันพื้นที่เก็บของที่ดีที่สุด การันตีด้วยยอดขายอันดับหนึ่ง' }}</p>
        </div>

        <div v-if="highlightCategoriesList.length > 0" class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            
            <!-- Left Side: Recommended Products Showcase (lg:col-span-7) -->
            <div class="lg:col-span-7 order-2 lg:order-1 flex flex-col justify-between">
                <div>
                    <!-- Header with crown icon -->
                    <div class="flex items-center gap-2.5 mb-2 text-left">
                        <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 dark:text-amber-400 shadow-sm">
                          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 18h18V8l-4 4-5-7-5 7-4-4v10z" />
                          </svg>
                        </span>
                        <h3 class="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-['IBM_Plex_Sans_Thai'] tracking-tight">
                            สินค้าขายดี
                        </h3>
                    </div>
                    <p class="text-xs sm:text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-8 font-['IBM_Plex_Sans_Thai'] text-left pl-0.5">
                        สินค้าขายดี คุณภาพพรีเมียม
                    </p>

                    <!-- Products Grid / Scroll Container -->
                    <div v-if="!highlightCategoryProducts[highlightCatIndex]" class="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-pulse">
                        <div v-for="n in 3" :key="n" class="bg-white dark:bg-gray-800 rounded-3xl h-[380px] border border-gray-150 dark:border-white/5"></div>
                    </div>
                    <div v-else class="flex sm:grid sm:grid-cols-3 gap-6 overflow-x-auto sm:overflow-visible hide-scrollbar pb-6 sm:pb-0 snap-x snap-mandatory">
                        <router-link v-for="(product, pIdx) in highlightCategoryProducts[highlightCatIndex]" :key="product.id"
                            :to="`/products/${product.slug || product.id}`"
                            class="snap-start flex-shrink-0 w-[240px] sm:w-auto bg-white dark:bg-[#111827] border border-gray-150 dark:border-white/5 rounded-3xl p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(2,32,164,0.08)] hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col group text-left"
                        >
                            <!-- Dynamic ribbon configured via admin -->
                            <div v-if="product.badges && product.badges.length > 0 && resolveProductBadge(product.badges[0])" class="absolute top-0 left-0 overflow-hidden w-24 h-24 z-10 pointer-events-none">
                                <div :class="['absolute bg-gradient-to-r text-white font-extrabold text-[8px] uppercase tracking-wider text-center py-1 w-[140px] -rotate-45 -translate-x-[38px] translate-y-[20px] shadow-sm border-b border-white/10', getRibbonColorClass(resolveProductBadge(product.badges[0]).color)]">
                                    {{ resolveProductBadge(product.badges[0]).name }}
                                </div>
                            </div>

                            <!-- Product Image -->
                            <div class="relative aspect-square rounded-[20px] overflow-hidden bg-gray-50 dark:bg-gray-800 mb-4 border border-gray-100 dark:border-gray-700/50 shrink-0">
                                <img :src="getOptimizedImageUrl(product.image || product.image_url, 400) || '/images/placeholder.png'"
                                    :alt="product.name || 'สินค้ารุ่นแนะนำ'"
                                    class="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500 ease-out"
                                >
                                <div v-if="product.is_out_of_stock" class="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-[2]">
                                    <span class="text-base font-black text-gray-500/35 dark:text-gray-400/35 -rotate-12 select-none pointer-events-none tracking-widest">หมดแล้ว</span>
                                </div>
                            </div>

                            <!-- Product Info -->
                            <div class="flex flex-col flex-grow">
                                <h4 class="font-black text-gray-900 dark:text-white text-[13px] md:text-sm leading-snug mb-2 group-hover:text-[#0220A4] transition-colors font-['IBM_Plex_Sans_Thai']">
                                    {{ product.name }}
                                </h4>

                                <!-- Price & Cart -->
                                <div class="flex items-end justify-between mt-auto">
                                    <div>
                                        <p class="text-[10px] text-gray-400 line-through leading-none mb-1 font-['IBM_Plex_Sans_Thai']" v-if="product.original_price && Number(product.original_price) > Number(product.price)">
                                            ฿{{ Number(product.original_price).toLocaleString() }}
                                        </p>
                                        <p class="text-[#0220A4] dark:text-blue-400 font-black text-base md:text-lg leading-none font-['IBM_Plex_Sans_Thai']">

                                            ฿{{ Number(product.price).toLocaleString() }}
                                        </p>
                                    </div>
                                    
                                    <!-- Cart button -->
                                    <button
                                        @click.prevent="handleAddToCart($event, product)"
                                        class="w-10 h-10 rounded-full bg-gradient-to-br from-[#0220A4] to-[#2B4FD4] hover:from-blue-600 hover:to-blue-500 flex items-center justify-center transition-colors shadow-md hover:shadow-lg active:scale-95 group/cart cursor-pointer select-none shrink-0"
                                        title="เพิ่มลงตะกร้า"
                                        aria-label="เพิ่มลงตะกร้า"
                                    >
                                        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </router-link>
                    </div>
                </div>

                <!-- Page dot indicator at the bottom -->
                <div class="flex items-center gap-1.5 mt-10 justify-start pl-1 shrink-0">
                    <button v-for="i in highlightCategoriesList.length" :key="i"
                      @click="setHighlightCat(i - 1)"
                      :aria-label="`ดูหมวดหมู่ที่ ${i}`"
                      class="group relative h-1.5 rounded-full overflow-hidden transition-all duration-500 cursor-pointer"
                      :class="highlightCatIndex === (i - 1) ? 'w-16 md:w-20 bg-blue-100 dark:bg-blue-900/50 shadow-sm' : 'w-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-blue-200'"
                    >
                      <div v-if="highlightCatIndex === (i - 1)" class="h-full bg-[#0220A4] rounded-full transition-none" :style="{ width: `${highlightProgress}%` }"></div>
                    </button>
                </div>
            </div>

            <!-- Right Side: Category Showcase Card (lg:col-span-5) -->
            <div class="lg:col-span-5 order-1 lg:order-2 relative">
                <!-- Arrow controls centered vertically, overlapping left and right borders -->
                <!-- Left arrow -->
                <button
                    type="button"
                    @click="prevHighlightCat"
                    class="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-white/5 shadow-lg flex items-center justify-center text-gray-500 hover:text-[#0220A4] hover:scale-105 active:scale-95 transition-all cursor-pointer z-30"
                    aria-label="หมวดหมู่ก่อนหน้า"
                >
                    <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <!-- Right arrow -->
                <button
                    type="button"
                    @click="nextHighlightCat"
                    class="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-150 dark:border-white/5 shadow-lg flex items-center justify-center text-gray-500 hover:text-[#0220A4] hover:scale-105 active:scale-95 transition-all cursor-pointer z-30"
                    aria-label="หมวดหมู่ถัดไป"
                >
                    <svg class="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>

                <!-- Showcase container card -->
                <div class="w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.12)] relative bg-gray-900 isolate min-h-[480px] lg:min-h-[520px] flex flex-col justify-between p-8 md:p-10 group/showcase">
                    
                    <!-- Background Category Image with Ken Burns / zoom effect -->
                    <img :key="highlightCatIndex"
                        :src="getOptimizedImageUrl(highlightCategoriesList[highlightCatIndex].image_url, 800) || '/images/placeholder.png'" 
                        :alt="highlightCategoriesList[highlightCatIndex].name"
                        class="absolute inset-0 w-full h-full object-cover transition-transform duration-[12s] scale-100 group-hover/showcase:scale-105 select-none pointer-events-none z-0"
                        @error="onImageError"
                    >

                    <!-- Premium dark visual gradient overlay -->
                    <div class="absolute inset-0 bg-gradient-to-tr from-[#0a0f18]/95 via-[#0d131f]/75 to-transparent z-10 pointer-events-none"></div>
                    
                    <!-- Content Layer (Z-index 20 to sit above gradient and image) -->
                    <div class="relative z-20 flex flex-col justify-between h-full flex-grow text-left">
                        <div>
                            <!-- PREMIUM QUALITY Badge -->
                            <div class="inline-flex items-center gap-2 mb-6">
                                <div class="w-7 h-7 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center border border-amber-400/40 shadow-inner shrink-0">
                                    <svg class="w-4 h-4 text-amber-400 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span class="text-[10px] md:text-xs text-amber-400 font-extrabold uppercase tracking-widest font-['IBM_Plex_Sans_Thai']">{{ highlightCategoriesList[highlightCatIndex].badgeText || 'PREMIUM QUALITY' }}</span>
                            </div>

                            <!-- Title -->
                            <h3 class="text-2xl sm:text-3xl md:text-[34px] font-black text-white mb-6 leading-tight font-['IBM_Plex_Sans_Thai'] tracking-tight drop-shadow-md">
                                {{ highlightCategoriesList[highlightCatIndex].name }}
                            </h3>
                            
                            <!-- Features checklist bullets -->
                            <ul class="space-y-3.5 mb-8">
                                <li v-for="(bullet, bIdx) in getCategoryHighlightBullets(highlightCategoriesList[highlightCatIndex])" :key="bIdx" class="flex items-center gap-3 text-left">
                                    <div class="w-5 h-5 rounded-full bg-[#0220A4]/25 text-[#0220A4] flex items-center justify-center shrink-0 border border-[#0220A4]/45 shadow-inner">
                                        <svg class="w-3.5 h-3.5 text-[#0220A4] stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span class="text-sm md:text-base font-extrabold text-white font-['IBM_Plex_Sans_Thai'] drop-shadow">
                                        {{ bullet }}
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <!-- Action Button -->
                        <a v-if="getButtonLink(highlightCategoriesList[highlightCatIndex]).startsWith('http')"
                            :href="getButtonLink(highlightCategoriesList[highlightCatIndex])"
                            target="_blank"
                            class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-blue-50 text-[#0220A4] hover:text-[#01166F] font-black rounded-full transition-all shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(2,32,164,0.2)] text-sm md:text-base font-['IBM_Plex_Sans_Thai'] self-start group/btn select-none"
                        >
                            <span>{{ highlightCategoriesList[highlightCatIndex].buttonText || 'ดูรายละเอียดสินค้า' }}</span>
                            <svg class="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </a>
                        <router-link v-else
                            :to="getButtonLink(highlightCategoriesList[highlightCatIndex])"
                            class="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-blue-50 text-[#0220A4] hover:text-[#01166F] font-black rounded-full transition-all shadow-[0_10px_25px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_30px_rgba(2,32,164,0.2)] text-sm md:text-base font-['IBM_Plex_Sans_Thai'] self-start group/btn select-none"
                        >
                            <span>{{ highlightCategoriesList[highlightCatIndex].buttonText || 'ดูรายละเอียดสินค้า' }}</span>
                            <svg class="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </router-link>
                    </div>

                    <!-- Category indicator dots at the bottom inside card -->
                    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                        <button v-for="(cat, idx) in highlightCategoriesList" :key="idx"
                            @click="setHighlightCat(idx)"
                            :aria-label="`ดูหมวดหมู่ที่ ${idx + 1}`"
                            class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                            :class="highlightCatIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'"
                        ></button>
                    </div>

                </div>
            </div>
        </div>
      </div>
    </section>
    </template>

    <!-- Luxury Features Section (Removed) -->
    <template v-if="false">
      <!-- Soft ambient backdrop glow blobs for depth -->
      <div class="absolute top-1/4 left-0 w-[350px] h-[350px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div class="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-amber-500/5 dark:bg-amber-500/8 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <!-- Main Split Container (Full Grid) -->
        <div class="relative grid grid-cols-1 lg:grid-cols-12 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-[0_25px_60px_rgba(0,0,0,0.03)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.2)] bg-white/40 dark:bg-slate-900/10 backdrop-blur-md items-stretch">
          
          <!-- LEFT SIDE: Text and cards (lg:col-span-6) -->
          <div class="lg:col-span-6 text-left p-6 sm:p-10 lg:p-14 lg:pr-10 z-20 flex flex-col justify-center">
            
            <!-- Elegant capsule tag -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 mb-4 shadow-sm select-none self-start group transition-all duration-300 hover:bg-blue-100/50 dark:hover:bg-blue-950/40">
              <span class="w-2 h-2 rounded-full bg-[#0220A4] animate-pulse"></span>
              <span class="text-[10px] sm:text-xs font-black tracking-[0.15em] text-[#0220A4] uppercase font-sans">{{ featuresHeading || 'REIMAGINE YOUR LIVING' }}</span>
            </div>
            
            <!-- Headline with Deep Blue brand coloring gradient -->
            <h3 v-html="featuresTitle" class="text-2xl sm:text-3xl md:text-[38px] font-black tracking-tight text-gray-900 dark:text-white leading-[1.2] mb-4 font-['IBM_Plex_Sans_Thai']"></h3>
            
            <!-- Elegant gradient line -->
            <div class="w-16 h-1 bg-gradient-to-r from-[#0220A4] via-[#2B4FD4] to-transparent rounded-full mb-4"></div>
            
            <p class="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-6 max-w-xl font-['IBM_Plex_Sans_Thai']">
              {{ featuresDesc }}
            </p>
            
            <!-- Horizontal Cards list -->
            <div class="space-y-2.5">
              <!-- Dynamic Item Loops -->
              <div v-for="(item, idx) in featuresItems" :key="idx"
                @click="activeFeatureIndex = activeFeatureIndex === idx ? -1 : idx"
                class="rounded-2xl pl-5 pr-5 flex items-center justify-between shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:shadow-[0_15px_30px_rgba(2,32,164,0.04)] hover:-translate-y-0.5 transition-all duration-300 group select-none cursor-pointer border"
                :class="activeFeatureIndex === idx ? 'bg-white/95 dark:bg-[#0f172a]/75 border-blue-300 dark:border-blue-900/50 p-4 shadow-[0_10px_25px_rgba(2,32,164,0.03)]' : 'bg-white/50 dark:bg-[#0f172a]/30 border-slate-100/60 dark:border-white/5 py-2.5 shadow-none'"
              >
                <div class="flex gap-3 sm:gap-4 items-center flex-1">
                  <!-- Icon Circle Badge -->
                  <div class="rounded-full flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/10 border-2 transition-all duration-300"
                    :class="activeFeatureIndex === idx ? 'w-11 h-11 bg-gradient-to-br from-[#0220A4] to-[#2B4FD4] border-blue-100 dark:border-blue-950/45 scale-105' : 'w-9 h-9 bg-gradient-to-br from-blue-400 to-[#0220A4] border-blue-50/50 dark:border-blue-950/20'"
                  >
                    <!-- Render Icon SVG dynamically based on configuration -->
                    <svg v-if="item.icon === 'shield' || !item.icon" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <svg v-else-if="item.icon === 'bolt'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <svg v-else-if="item.icon === 'lightbulb'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <svg v-else-if="item.icon === 'star'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
                    </svg>
                    <svg v-else-if="item.icon === 'tools'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <svg v-else-if="item.icon === 'check'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <svg v-else-if="item.icon === 'heart'" :class="activeFeatureIndex === idx ? 'w-5 h-5' : 'w-4 h-4'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <!-- Texts -->
                  <div class="text-left leading-normal flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black text-[#0220A4] font-sans tracking-wide">0{{ idx + 1 }}</span>
                      <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-white font-['IBM_Plex_Sans_Thai'] tracking-wide">
                        {{ item.title }}
                      </h4>
                    </div>
                    <div class="grid transition-all duration-300 ease-in-out" :class="activeFeatureIndex === idx ? 'grid-rows-[1fr] mt-1.5 opacity-100' : 'grid-rows-[0fr] opacity-0'">
                      <div class="overflow-hidden">
                        <p class="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-medium font-['IBM_Plex_Sans_Thai'] leading-relaxed max-w-sm sm:max-w-md pb-0.5">
                          {{ item.desc }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Chevron trigger -->
                <div class="rounded-full border flex items-center justify-center transition-all duration-300 shrink-0"
                  :class="activeFeatureIndex === idx ? 'w-7 h-7 bg-[#0220A4] border-[#0220A4] text-white rotate-90 scale-105' : 'w-6.5 h-6.5 border-slate-100/80 dark:border-white/10 text-blue-400 bg-slate-50/50 dark:bg-slate-800/20 rotate-0'"
                >
                  <svg class="w-3.5 h-3.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <!-- RIGHT SIDE: Image, S-Curve overlay, badges, checklists (lg:col-span-6) -->
          <div class="lg:col-span-6 relative flex flex-col justify-center z-10 overflow-hidden min-h-[480px] lg:min-h-0 group/panel">
            
            <!-- Background Shed Image -->
            <img 
              :src="featuresImage || '/images/home/features-premium.webp'" 
              alt="Premium Shed Setup" 
              class="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-[10s] ease-out group-hover/panel:scale-105" 
            >
            <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

            <!-- S-Curve SVG Overlay -->
            <svg class="hidden lg:block absolute inset-0 w-full h-full text-[#fdfcf9] dark:text-[#0b0f19] fill-current z-10 pointer-events-none" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <defs>
                <linearGradient id="scurve-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#0220A4" />
                  <stop offset="50%" stop-color="#2B4FD4" />
                  <stop offset="100%" stop-color="#d35a00" />
                </linearGradient>
                <filter id="scurve-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="-6" dy="0" stdDeviation="10" flood-color="#000000" flood-opacity="0.1" />
                </filter>
              </defs>
              <path d="M 140,0 C 20,180 -40,420 260,600 L 0,600 L 0,0 Z" filter="url(#scurve-shadow)" />
              <path d="M 140,0 C 20,180 -40,420 260,600" fill="none" stroke="url(#scurve-gradient)" stroke-width="8" vector-effect="non-scaling-stroke" />
            </svg>


            <!-- Overlapping Checklist Card (Space-saving dynamic tag layout) -->
            <div class="absolute right-4 bottom-4 lg:right-6 lg:bottom-6 z-20 select-none group/card w-fit max-w-[calc(100%-2rem)] lg:max-w-[80%] ml-auto">
              <!-- Luxury Black Checklist Card with Glassmorphic tags -->
              <div class="relative bg-gradient-to-br from-[#13151a]/95 via-[#0e1013]/95 to-[#07080a]/95 rounded-2xl p-4 sm:p-4.5 text-slate-100 text-left shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 z-10 transition-all duration-500 overflow-hidden hover:border-[#0220A4]/30 hover:shadow-[0_20px_40px_rgba(2,32,164,0.15)]">
                
                <div class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/card:animate-shine z-0 pointer-events-none"></div>

                <h4 class="text-xs sm:text-sm font-black leading-tight mb-2.5 tracking-wide font-['IBM_Plex_Sans_Thai'] relative z-10 text-white flex items-center gap-1.5">
                  <span class="inline-block w-1.5 h-3.5 bg-gradient-to-b from-[#0220A4] to-[#2B4FD4] rounded-full"></span>
                  {{ featuresBadgeTitle || 'เหมาะสำหรับทุกการใช้งาน' }}
                </h4>
                
                <!-- Horizontal Tag Chips instead of vertical stack to save space -->
                <div class="flex flex-wrap gap-2 relative z-10">
                  <span 
                    v-for="(item, idx) in checklistItems" 
                    :key="idx" 
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] dark:bg-white/[0.06] border border-white/10 hover:border-[#0220A4]/30 hover:bg-[#0220A4]/10 text-slate-200 hover:text-white text-[11px] font-bold font-['IBM_Plex_Sans_Thai'] transition-all duration-200 group/item cursor-default"
                  >
                    <span class="w-3.5 h-3.5 rounded-full bg-[#0220A4]/20 text-[#0220A4] group-hover/item:bg-[#0220A4] group-hover/item:text-white flex items-center justify-center shrink-0 transition-colors duration-200">
                      <svg class="w-2 h-2 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {{ item }}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
        <!-- FOOTER: Custom Design Premium Contact Banner Bar -->
        <div class="bg-gradient-to-r from-[#0220A4] via-[#01166F] to-[#011055] text-white rounded-3xl p-5 md:p-6 lg:p-7 mt-10 shadow-[0_20px_50px_rgba(2,32,164,0.25)] select-none relative z-10 group/banner border border-white/15 overflow-hidden">
          
          <!-- Decorative corner glows -->
          <div class="absolute -right-16 -top-16 w-40 h-40 bg-white rounded-full blur-[70px] opacity-15 pointer-events-none group-hover/banner:opacity-25 transition-opacity duration-500"></div>
          <div class="absolute -left-16 -bottom-16 w-40 h-40 bg-amber-300 rounded-full blur-[80px] opacity-25 pointer-events-none group-hover/banner:opacity-35 transition-opacity duration-500"></div>

          <div class="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8">
            
            <!-- Section 1: Left Title & Info -->
            <div class="flex items-center gap-4 text-left w-full xl:w-1/4 flex-shrink-0 justify-center xl:justify-start">
              <div class="w-12 h-12 flex-shrink-0 flex items-center justify-center relative">
                <!-- Hexagon Outline + Solid White Hexagon + Blue Check SVG -->
                <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l8.66 5v10L12 22l-8.66-5V7Z" stroke="#FBBF24" stroke-width="1.5" stroke-linejoin="round" />
                  <path d="M12 4.5l6.5 3.75v7.5L12 19.5l-6.5-3.75v-7.5Z" fill="white" stroke="#FBBF24" stroke-width="0.5" stroke-linejoin="round" />
                  <path d="M9.5 12l1.8 1.8 3.5-3.5" stroke="#0220A4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="leading-tight">
                <h4 class="text-[18px] font-black tracking-tight font-['IBM_Plex_Sans_Thai'] flex items-center gap-1.5 text-white">
                  ปรึกษาฟรี! วันนี้
                  <span class="text-amber-300 text-base animate-pulse inline-flex items-center">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.187-.904L9 9l.813 5.096L15 15l-5.187.904z" />
                    </svg>
                  </span>
                </h4>
                <p class="text-white/90 text-xs font-semibold font-['IBM_Plex_Sans_Thai'] mt-1 max-w-[220px] leading-snug">ผู้เชี่ยวชาญพร้อมให้คำแนะนำและออกแบบโซลูชันที่เหมาะกับคุณ</p>
              </div>
            </div>
            
            <!-- Section 2: Contact Channels Grid (Compact & Glassmorphic) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full xl:w-3/5">
              
              <!-- Phone Contact Card -->
              <a :href="bannerPhoneLink" class="group/item flex items-center gap-3.5 p-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/35 hover:scale-[1.02] transition-all duration-300 text-left">
                <span class="w-9 h-9 bg-white text-[#0220A4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:rotate-12 transition-transform">
                  <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.21a.96.96 0 00.25-1A11.36 11.36 0 018.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.58c0-.56-.45-1.04-1-1.04z" />
                  </svg>
                </span>
                <div class="leading-none min-w-0">
                  <span class="text-[9px] font-bold text-blue-50 uppercase tracking-widest block mb-1">สอบถามโทรเลย</span>
                  <span class="text-[15px] font-black tracking-wide font-sans text-white block truncate">{{ bannerPhone }}</span>
                  <span class="text-[10px] text-blue-50 block mt-1 font-semibold font-['IBM_Plex_Sans_Thai'] truncate">{{ bannerWorkingHours }}</span>
                </div>
              </a>

              <!-- LINE Contact Card -->
              <a :href="bannerLineLink" target="_blank" class="group/item flex items-center gap-3.5 p-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/35 hover:scale-[1.02] transition-all duration-300 text-left">
                <span class="w-9 h-9 bg-white text-[#06C755] rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
                    <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738s-12 4.369-12 9.738c0 4.814 4.269 8.846 10.036 9.613.391.084.92.258 1.057.59.12.301.079.765.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.304" />
                    <text x="12" y="12.2" font-size="5" font-family="'Inter', 'Arial', sans-serif" font-weight="900" fill="#06C755" text-anchor="middle" letter-spacing="-0.2">LINE</text>
                  </svg>
                </span>
                <div class="leading-none min-w-0">
                  <span class="text-[9px] font-bold text-blue-50 uppercase tracking-widest block mb-1">ไลน์แอดอย่างเป็นทางการ</span>
                  <span class="text-[15px] font-black tracking-wide font-sans text-white block truncate">{{ bannerLineId }}</span>
                  <span class="text-[10px] text-blue-50 block mt-1 font-semibold font-['IBM_Plex_Sans_Thai'] truncate">ตอบกลับไว แนะนำฟรี!</span>
                </div>
              </a>

              <!-- Address/Company Contact Card -->
              <div class="group/item flex items-center gap-3.5 p-3 px-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 hover:border-white/35 hover:scale-[1.02] transition-all duration-300 text-left">
                <span class="w-9 h-9 bg-white text-[#0220A4] rounded-xl flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform">
                  <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                </span>
                <div class="leading-none min-w-0">
                  <span class="text-[9px] font-bold text-blue-50 uppercase tracking-widest block mb-1">สำนักงานใหญ่</span>
                  <span class="text-[13px] font-black tracking-wide text-white block truncate font-['IBM_Plex_Sans_Thai']">{{ bannerCompanyName }}</span>
                  <span class="text-[10px] text-blue-50 block mt-1 font-semibold font-['IBM_Plex_Sans_Thai'] truncate">{{ bannerCompanyLocation }}</span>
                </div>
              </div>

            </div>
            
            <!-- Section 3: CTA Button -->
            <div class="w-full xl:w-auto flex-shrink-0 flex justify-center xl:justify-end">
              <router-link 
                to="/quotation" 
                class="group/cta flex flex-col items-center justify-center p-3 px-6 bg-white hover:bg-blue-50 active:scale-95 transition-all rounded-2xl shadow-lg hover:shadow-xl w-full xl:w-auto select-none border border-blue-100/50"
              >
                <div class="flex items-center gap-1.5 font-['IBM_Plex_Sans_Thai'] leading-none">
                  <span class="text-[14px] font-black text-[#9a3412] tracking-wide">ขอรับคำปรึกษาฟรี</span>
                  <svg class="w-4 h-4 text-[#9a3412] stroke-[3.5] transform group-hover/cta:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <span class="text-[9px] font-bold text-gray-700 mt-1.5 leading-none font-['IBM_Plex_Sans_Thai']">คลิกเลย! ทีมงานพร้อมดูแลคุณ</span>
              </router-link>
            </div>
            
          </div>
        </div>

      </div>
    </template>

<!-- Category Showcase Blocks -->
    <template v-if="showcaseCategoriesData.length > 0">
      <section v-for="(showcase, index) in showcaseCategoriesData" :key="index" class="py-20 md:py-28 bg-white dark:bg-[#0a0f16] border-t border-gray-100 dark:border-gray-800/50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 md:mb-16 gap-4">
            <div class="flex items-center gap-4">
              <div v-if="showcase.category.icon_url || showcase.category.image_url" 
                   class="w-16 h-16 rounded-2xl overflow-hidden bg-emerald-600 dark:bg-emerald-500/20 flex items-center justify-center shadow-md flex-shrink-0"
                   :class="showcase.category.icon_url ? 'p-3' : 'p-0'"
              >
                <img width="64" height="64" v-if="showcase.category.icon_url" :src="getOptimizedImageUrl(showcase.category.icon_url, 128)" :alt="showcase.category.name" class="w-full h-full object-contain drop-shadow-sm" @error="onImageError">
                <img width="64" height="64" v-else :src="getOptimizedImageUrl(showcase.category.image_url, 128)" :alt="showcase.category.name" class="w-full h-full object-cover" @error="onImageError">
              </div>
              <div v-else class="w-16 h-16 rounded-2xl bg-emerald-600 dark:bg-emerald-500/20 flex items-center justify-center shadow-md">
                 <svg class="w-8 h-8 text-white dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <div>
                <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block mb-1">หมวดหมู่</span>
                <h2 class="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">{{ showcase.category.name }}</h2>
              </div>
            </div>
            
            <router-link :to="`/products?category=${encodeURIComponent(showcase.category.name)}`" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors shadow-sm whitespace-nowrap">
              ดูสินค้าทั้งหมด (100+) <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
            </router-link>
          </div>

          <!-- Showcase Products Grid (3 items per row on desktop) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-12">
            <ProductCard 
              v-for="product in showcase.products" 
              :key="product.id" 
              :product="product" 
            />
          </div>
        </div>
      </section>
    </template>





    <!-- Recent Projects Showcase -->
    <section v-if="settingsStore.isProjectsEnabled && recentProjects.length > 0" class="py-20 md:py-28 bg-[#f8f9fa] dark:bg-[#0f172a]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 md:mb-16 gap-6">
          <div class="text-left">
            <!-- Pill badge -->
            <div class="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 text-[#0220A4] dark:text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100/50 dark:border-blue-900/30 uppercase tracking-widest mb-4">
              <!-- Document icon -->
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{{ sectionTitles.projectsTitle }}</span>
            </div>
            
            <h3 class="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white" v-html="formattedProjectsHeading"></h3>
            <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm font-light leading-relaxed">
              {{ sectionTitles.projectsDesc }}
            </p>
          </div>
          
          <!-- View All Button -->
          <router-link to="/projects" class="inline-flex text-sm font-bold text-[#0220A4] hover:text-[#01166F] items-center justify-center gap-2.5 px-6 py-3 rounded-full border border-[#0220A4]/30 hover:border-[#0220A4] hover:bg-blue-50/50 transition-all duration-300 whitespace-nowrap">
            <svg class="w-4.5 h-4.5 text-[#0220A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>ดูผลงานทั้งหมด</span>
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </router-link>
        </div>

        <!-- 3-Column Grid Layout -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <router-link 
            v-for="project in recentProjects" 
            :key="project.id"
            :to="'/projects/' + (project.slug || project.id)" 
            class="group relative block rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 h-[350px] hover:-translate-y-1.5"
          >
            <!-- Image -->
            <img :src="getOptimizedImageUrl(project.cover_image, 700)" :alt="project.title" class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1200ms] ease-out" @error="onImageError">
            
            <!-- Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent group-hover:from-black/90 group-hover:via-black/40 transition-all duration-500"></div>
            
            <!-- Badges -->
            <!-- Size badge on top-left (dynamic) -->
            <div v-if="project.badge_size" class="absolute top-4 left-4 z-10">
              <span class="inline-flex items-center gap-1.5 bg-[#f5efe6]/95 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
                <!-- Ruler / Tape icon -->
                <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.83 2.18a2 2 0 00-2.83 0L2.18 10.01a2 2 0 000 2.83l7.82 7.82a2 2 0 002.83 0l7.82-7.82a2 2 0 000-2.83l-7.82-7.82z" />
                </svg>
                {{ project.badge_size }}
              </span>
            </div>

            <!-- Tag badge on top-right (dynamic) -->
            <div v-if="project.badge_tag" class="absolute top-4 right-4 z-10">
              <span class="inline-flex items-center gap-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-md">
                {{ project.badge_tag }}
              </span>
            </div>

            <!-- Content at bottom -->
            <div class="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-left">
              <h4 class="font-bold text-white leading-snug mb-3 line-clamp-2 text-base md:text-lg">
                {{ cleanProjectTitle(project.title) }}
              </h4>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/80">
                <p class="flex items-center gap-1.5 text-xs font-semibold">
                  <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {{ project.location || 'ประเทศไทย' }}
                </p>
                <p v-if="project.service_date" class="flex items-center gap-1.5 text-xs font-semibold">
                  <svg class="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {{ new Date(project.service_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' }) }}
                </p>
              </div>
            </div>
          </router-link>

          <!-- Redesigned Service CTA Card (6th Card) -->
          <div v-if="homeProjectsCta.show" class="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0220A4] via-[#01166F] to-[#011055] p-6 flex flex-col justify-between shadow-md hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 h-[350px] hover:-translate-y-1.5">
            <!-- Header -->
            <div class="flex items-start gap-3">
              <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                <svg class="w-6 h-6 text-[#0220A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                </svg>
              </div>
              <div class="text-left text-white">
                <h4 class="text-lg font-black leading-tight tracking-tight">{{ homeProjectsCta.title }}</h4>
                <p class="text-[11px] text-blue-100/90 font-medium mt-1 leading-snug">{{ homeProjectsCta.description }}</p>
              </div>
            </div>

            <!-- Middle Pill Badges -->
            <div class="space-y-2.5 my-3">
              <div v-for="(bullet, index) in homeProjectsCta.bullets" :key="index" class="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-full py-1.5 px-3.5 shadow-sm text-left">
                <span class="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#0220A4]">
                  <svg v-if="index === 0" class="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <svg v-else-if="index === 1" class="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <span class="text-[11px] font-bold text-gray-800 leading-tight">
                  {{ bullet.title }} <span class="text-gray-600 font-medium">{{ bullet.desc }}</span>
                </span>
              </div>
            </div>

            <!-- Action Button -->
            <router-link 
              to="/quotation" 
              class="flex items-center justify-center w-full bg-white hover:bg-blue-50 active:scale-95 transition-all py-3 rounded-2xl shadow-md text-[#9a3412] font-black text-sm gap-2 mt-auto"
            >
              <span>ขอใบเสนอราคา</span>
              <svg class="w-4 h-4 stroke-[3.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </router-link>
          </div>
        </div>

        <!-- Bottom Feature Highlights Bar -->
        <div class="max-w-7xl mx-auto mt-12 bg-white dark:bg-[#0f172a] rounded-[24px] border border-gray-100 dark:border-gray-800/80 shadow-md p-5 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          <!-- Item 1 -->
          <div class="flex items-center gap-4 w-full md:w-auto px-4 py-1.5 justify-center md:justify-start">
            <span class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0 text-blue-500">
              <svg class="w-5.5 h-5.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </span>
            <div class="flex flex-col text-left">
              <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">ประสบการณ์มากกว่า 10 ปี</span>
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-light mt-0.5">ในงานออกแบบและติดตั้ง</span>
            </div>
          </div>

          <div class="hidden md:block h-8 w-[1px] bg-gray-100 dark:bg-gray-800/80"></div>

          <!-- Item 2 -->
          <div class="flex items-center gap-4 w-full md:w-auto px-4 py-1.5 justify-center md:justify-start">
            <span class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0 text-blue-500">
              <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v5l-2.5-1.5L7 20v-5M12 15v5l2.5-1.5 2.5 1.5v-5M12 13a5 5 0 100-10 5 5 0 000 10z" />
              </svg>
            </span>
            <div class="flex flex-col text-left">
              <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">วัสดุคุณภาพสูง</span>
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-light mt-0.5">ได้มาตรฐาน แข็งแรง ทนทาน</span>
            </div>
          </div>

          <div class="hidden md:block h-8 w-[1px] bg-gray-100 dark:bg-gray-800/80"></div>

          <!-- Item 3 -->
          <div class="flex items-center gap-4 w-full md:w-auto px-4 py-1.5 justify-center md:justify-start">
            <span class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0 text-blue-500">
              <svg class="w-5.5 h-5.5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            <div class="flex flex-col text-left">
              <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">ทีมช่างมืออาชีพ</span>
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-light mt-0.5">ติดตั้งรวดเร็ว ปลอดภัย</span>
            </div>
          </div>

          <div class="hidden md:block h-8 w-[1px] bg-gray-100 dark:bg-gray-800/80"></div>

          <!-- Item 4 -->
          <div class="flex items-center gap-4 w-full md:w-auto px-4 py-1.5 justify-center md:justify-start">
            <span class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0 text-blue-500">
              <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
            <div class="flex flex-col text-left">
              <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">ลูกค้าไว้วางใจมากกว่า 1,000+ ราย</span>
              <span class="text-[11px] text-gray-500 dark:text-gray-400 font-light mt-0.5">ทั่วประเทศ</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof / Testimonials Section -->
    <template v-if="false">
    <section v-if="homeShowTestimonials" class="py-20 md:py-28 bg-gradient-to-b from-[#fff8f2] via-white to-white dark:from-[#1a1208] dark:via-[#0a0f16] dark:to-[#0a0f16] relative overflow-hidden">
      <!-- Subtle background decorations -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-20 right-[-8%] w-80 h-80 bg-blue-400/5 blur-[100px] rounded-full"></div>
        <div class="absolute bottom-20 left-[-5%] w-72 h-72 bg-blue-300/5 blur-[100px] rounded-full"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Section Header -->
        <div class="text-center mb-14">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 mb-5">
            <svg class="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <span class="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">{{ sectionTitles.testimonialsTitle }}</span>
          </div>
          <!-- Main heading with Deep Blue highlight -->
          <h3 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4" v-html="formattedTestimonialsHeading"></h3>
          <!-- Subtitle -->
          <p class="max-w-2xl mx-auto text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
            {{ sectionTitles.testimonialsDesc || 'เราภูมิใจที่ได้เป็นส่วนหนึ่งในการดูแลบ้านและธุรกิจของลูกค้า\nด้วยคุณภาพงานที่ได้มาตรฐาน บริการที่จริงใจ และส่งมอบตรงเวลาเสมอ' }}
          </p>
        </div>

        <!-- Testimonial Cards Grid -->
        <div v-if="testimonials.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-left mb-14">
          <div v-for="(review, index) in testimonials" :key="index"
            class="relative bg-white dark:bg-[#141c2b] rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(2,32,164,0.08)] group overflow-hidden flex flex-col"
          >

            <!-- Top bar: Stars + Score + Quote icon -->
            <div class="flex items-center justify-between px-6 pt-6 pb-0">
              <div class="flex items-center gap-2.5">
                <!-- Stars -->
                <div class="flex gap-0.5">
                  <svg v-for="i in Number(review.stars || 5)" :key="'s'+i" class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                </div>
                <!-- Numeric score -->
                <span class="text-sm font-extrabold text-gray-800 dark:text-white">{{ (Number(review.stars) || 5).toFixed(1) }}</span>
              </div>
              <!-- Quote icon -->
              <svg class="w-10 h-10 text-blue-500/80" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z"/></svg>
            </div>

            <!-- Review text -->
            <div class="px-6 pt-4 pb-5 flex-grow">
              <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-6">
                "{{ review.text }}"
              </p>
            </div>

            <!-- Customer info -->
            <div class="px-6 pb-4">
              <div class="flex items-center gap-3">
                <!-- Avatar -->
                <div v-if="review.avatar" class="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-200 dark:ring-blue-800/50">
                  <img :src="review.avatar" :alt="review.name" class="w-full h-full object-cover" @error="review.avatar = ''">
                </div>
                <div v-else :class="['w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ring-2 ring-blue-200 dark:ring-blue-800/50', index % 3 === 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : index % 3 === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400']">{{ (review.name || 'A').charAt(0) }}</div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900 dark:text-white">{{ review.name }}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ review.role }}</p>
                </div>
              </div>
            </div>

            <!-- Installation details metadata -->
            <div v-if="review.product || review.location || review.date" class="px-6 pb-5">
              <div class="bg-gray-50 dark:bg-white/5 rounded-xl p-3.5 space-y-2 border border-gray-100 dark:border-white/5">
                <div v-if="review.product" class="flex items-center gap-2.5 text-xs">
                  <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-[72px]">สินค้า/บริการ</span>
                  <span class="font-semibold text-gray-700 dark:text-gray-200">{{ review.product }}</span>
                </div>
                <div v-if="review.location" class="flex items-center gap-2.5 text-xs">
                  <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <span class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-[72px]">พื้นที่ติดตั้ง</span>
                  <span class="font-semibold text-gray-700 dark:text-gray-200">{{ review.location }}</span>
                </div>
                <div v-if="review.date" class="flex items-center gap-2.5 text-xs">
                  <svg class="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-[72px]">วันที่ติดตั้ง</span>
                  <span class="font-semibold text-gray-700 dark:text-gray-200">{{ review.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-12 text-gray-500">
          ไม่พบข้อมูลรีวิว
        </div>


      </div>
    </section>
    </template>

    <!-- Partners / Trusted By Section -->
    <template v-if="homeShowPartners && corporateReviews.length > 0">
    <section class="py-20 md:py-28 bg-[#f9fafb] dark:bg-[#0a0f16] relative overflow-hidden border-t border-gray-100 dark:border-white/5">
      <!-- Background decoration -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-1/4 left-[-10%] w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <!-- Header -->
        <div class="text-center mb-14">
          <div class="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-500 tracking-wide uppercase mb-3">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
            <span>รีวิวจากลูกค้าจริง</span>
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </div>
          <h3 class="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4" v-html="formattedPartnersHeading">
          </h3>
          <p class="max-w-2xl mx-auto text-sm md:text-base text-gray-500 dark:text-gray-400 font-light leading-relaxed">
            {{ sectionTitles.partnersDesc || 'ขอขอบคุณทุกความไว้วางใจที่เลือกเราดูแลพื้นที่ของคุณ' }}
          </p>
        </div>

        <!-- Slider Carousel Container -->
        <div class="relative px-0 md:px-8 mb-16">
          <!-- Left Arrow Navigation -->
          <button 
            @click="prevPartnerSlide" 
            class="absolute left-[-12px] md:left-0 xl:hidden top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-all duration-300"
            aria-label="Previous slide"
          >
            <svg class="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Cards Scroll Area -->
          <div 
            ref="partnersSliderContainer"
            @scroll="handlePartnersScroll"
            class="flex gap-3 xl:gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 px-1"
          >
            <div 
              v-for="(review, index) in corporateReviews" 
              :key="index"
              class="w-[240px] sm:w-[260px] md:w-[280px] xl:w-[218px] shrink-0 snap-center bg-white dark:bg-[#141c2b] rounded-2xl border border-gray-100 dark:border-white/5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
            >
              <!-- Card Image Header -->
              <div class="h-36 xl:h-32 relative bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                <!-- Grayscale building image -->
                <img 
                  :src="review.image" 
                  :alt="review.company" 
                  class="w-full h-full object-cover grayscale brightness-95"
                />
                <!-- Quote badge absolute top-left -->
                <div class="absolute top-4 left-4 w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <!-- Quote Icon SVG -->
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11h4v10H0z"/>
                  </svg>
                </div>
              </div>

              <!-- Card Body Content -->
              <div class="p-4 flex-grow flex flex-col justify-between text-left">
                <div>
                  <!-- Company Info Bar: Logo + Name/Role + Stars -->
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <!-- Logo Circular Container -->
                      <div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
                        <!-- SCG Logo -->
                        <svg v-if="review.logo === 'scg'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                          <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" fill="#E31B23" />
                          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="900" font-size="28" font-family="'Inter', sans-serif">SCG</text>
                        </svg>
                        <!-- PTT Logo -->
                        <svg v-else-if="review.logo === 'ptt'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                          <path d="M50 10C50 10 25 45 25 65C25 78.8 36.2 90 50 90C63.8 90 75 78.8 75 65C75 45 50 10 50 10Z" fill="#0056B3"/>
                          <path d="M50 30C50 30 35 55 35 68C35 76.3 41.7 83 50 83C58.3 83 65 76.3 65 68C65 55 50 30 50 30Z" fill="#E31B23"/>
                          <text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="900" font-size="16" font-family="'Inter', sans-serif">ptt</text>
                        </svg>
                        <!-- HomePro Logo -->
                        <svg v-else-if="review.logo === 'homepro'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                          <path d="M20 55 L50 25 L80 55 L70 55 L70 75 L30 75 L30 55 Z" stroke="#0056B3" stroke-width="6" fill="none" stroke-linejoin="round"/>
                          <path d="M62 37 L62 28 L68 28 L68 43" stroke="#0056B3" stroke-width="6" fill="none" stroke-linecap="round"/>
                          <rect x="42" y="55" width="16" height="20" fill="#F58220" rx="2"/>
                          <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" fill="#0056B3" font-weight="800" font-size="10" font-family="'Inter', sans-serif">HomePro</text>
                        </svg>
                        <!-- Index Logo -->
                        <svg v-else-if="review.logo === 'index'" class="w-9 h-9" viewBox="0 0 100 100" fill="none">
                          <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" fill="black" font-weight="900" font-size="18" font-family="'Outfit', sans-serif">Index</text>
                          <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="#FFC72C" font-weight="800" font-size="10" font-family="'Outfit', sans-serif">Living Mall</text>
                        </svg>
                        <!-- CPF Logo -->
                        <svg v-else-if="review.logo === 'cpf'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                          <circle cx="50" cy="50" r="42" stroke="#008542" stroke-width="6" fill="none"/>
                          <circle cx="50" cy="50" r="35" stroke="#FFC72C" stroke-width="2" fill="none"/>
                          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#008542" font-weight="900" font-size="22" font-family="'Inter', sans-serif">CPF</text>
                        </svg>
                        <!-- Custom Image Logo -->
                        <img v-else-if="review.logo" :src="review.logo" class="w-full h-full object-contain p-1" />
                        <!-- Fallback Profile Placeholder -->
                        <svg v-else class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>

                      <!-- Name & Location -->
                      <div class="flex flex-col">
                        <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight">{{ review.company }}</span>
                        <span class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{{ review.location }}</span>
                      </div>
                    </div>

                    <!-- Star Ratings -->
                    <div class="flex gap-0.5 text-blue-500">
                      <svg v-for="i in review.rating" :key="i" class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </div>

                  <!-- Review Quote Text -->
                  <p class="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mb-4 font-light">
                    {{ review.review }}
                  </p>
                </div>

                <!-- Product Badge Pill -->
                <div class="mt-auto pt-2">
                  <span 
                    :class="[
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors shadow-sm',
                      review.badgeColor === 'orange' ? 'bg-blue-50 border-blue-100 text-blue-500 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400' : '',
                      review.badgeColor === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-500 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400' : '',
                      review.badgeColor === 'green' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' : '',
                      review.badgeColor === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400' : '',
                      review.badgeColor === 'yellow' ? 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400' : ''
                    ]"
                  >
                    <!-- Small custom svg icon inside badge -->
                    <!-- Wrench for SCG -->
                    <svg v-if="review.badgeIcon === 'wrench'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                    <!-- Home/Building for PTT and Index -->
                    <svg v-else-if="review.badgeIcon === 'home'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <!-- Check for HomePro -->
                    <svg v-else-if="review.badgeIcon === 'check'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <!-- Star for CPF -->
                    <svg v-else-if="review.badgeIcon === 'star'" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.977-2.888a1 1 0 00-1.176 0l-3.977 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span>{{ review.badge }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Arrow Navigation -->
          <button 
            @click="nextPartnerSlide" 
            class="absolute right-[-12px] md:right-0 xl:hidden top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-500 hover:text-blue-600 transition-all duration-300"
            aria-label="Next slide"
          >
            <svg class="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Slider Pagination Dots -->
        <div class="flex xl:hidden justify-center gap-1 mb-16">
          <button 
            v-for="(review, index) in corporateReviews" 
            :key="index"
            @click="scrollPartnersTo(index)"
            class="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none"
            :aria-label="`Go to slide ${index + 1}`"
          >
            <span
              :class="[
                'h-2.5 rounded-full transition-all duration-300 block',
                partnersActiveIndex === index ? 'bg-blue-600 w-5' : 'bg-gray-300 dark:bg-gray-700 w-2.5'
              ]"
            ></span>
          </button>
        </div>


      </div>
    </section>
    </template>

    <!-- Latest Articles -->
    <section 
      v-if="recentArticles.length > 0" 
      class="py-24 md:py-32 bg-[#f8f9fa] dark:bg-[#0f172a] border-t border-gray-100 dark:border-white/5 relative overflow-hidden"
      @mouseenter="stopArticlesAutoplay"
      @mouseleave="startArticlesAutoplay"
    >
      <!-- Decor -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-40 right-[-10%] w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full"></div>
        <div class="absolute bottom-10 left-[-5%] w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full"></div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-6">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/20 text-[#0220A4] dark:text-blue-400 text-xs font-bold tracking-wider uppercase mb-4 border border-blue-100 dark:border-blue-900/30">
              <svg class="w-4 h-4 text-[#0220A4] dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              {{ sectionTitles.articlesTitle }}
            </div>
            <h3 class="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white" v-html="formattedArticlesHeading"></h3>
            <p class="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400 font-light">บทความและข่าวสารที่คัดสรรมาเพื่อคุณ</p>
          </div>
          <router-link to="/blog" class="group inline-flex items-center gap-2.5 px-6 py-3 border border-[#0220A4]/30 dark:border-blue-500/20 hover:border-[#0220A4] dark:hover:border-blue-500 rounded-full text-sm font-bold text-[#0220A4] dark:text-blue-400 bg-white dark:bg-gray-800 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(2,32,164,0.1)]">
            อ่านบทความทั้งหมด 
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </router-link>
        </div>

        <!-- Slider Carousel Container -->
        <div class="relative px-0 md:px-8 mb-12">
          <!-- Left Arrow Navigation -->
          <button 
            v-if="recentArticles.length > 1"
            @click="prevArticleSlide" 
            :class="['absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-sm z-20', recentArticles.length <= 4 ? 'xl:hidden' : '']"
            aria-label="Previous slide"
          >
            <svg class="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <!-- Slider Track -->
          <div 
            ref="articlesSliderContainer"
            @scroll="handleArticlesScroll"
            class="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar px-4 md:px-0"
          >
            <!-- Article Cards -->
            <router-link 
              v-for="(article, idx) in recentArticles" 
              :key="article.id"
              :to="'/blog/' + (article.slug || article.id)"
              class="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] snap-start shrink-0 flex flex-col bg-white dark:bg-[#1a2333] rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] transition-all duration-500 border border-gray-100 dark:border-white/5 hover:-translate-y-2 hover:border-blue-200 dark:hover:border-blue-500/30"
            >
              <!-- Cover Image -->
              <div class="w-full aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                <img v-if="article.cover_image" :src="getOptimizedImageUrl(article.cover_image, 700)" :alt="article.title" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1.5s] ease-out" @error="onImageError">
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10">
                  <svg class="w-12 h-12 text-blue-200 dark:text-blue-800/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7" />
                  </svg>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>

                <!-- Floating Badges -->
                <div class="absolute top-5 left-5 flex flex-col gap-2">
                  <div v-if="article.is_featured" class="bg-gradient-to-r from-amber-400 to-blue-500 text-white px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1 w-fit">
                    <svg class="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    แนะนำ
                  </div>
                  <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-sm border border-white/20 w-fit">
                    <p class="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1.5">
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatArticleDate(article.published_at || article.created_at) }}
                    </p>
                  </div>
                </div>

                <!-- Read more button floating -->
                <div class="absolute bottom-5 right-5 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out delay-100">
                  <div class="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40">
                    <svg class="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Content -->
              <div class="p-6 md:p-8 flex-grow flex flex-col justify-between relative text-left">
                <div>
                  <div class="mb-4">
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">{{ article.category || 'บทความทั่วไป' }}</span>
                  </div>
                  <h4 class="font-bold text-gray-900 dark:text-white text-xl md:text-2xl mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{{ article.title }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 font-light line-clamp-3 leading-relaxed mb-6 flex-grow">{{ article.excerpt || article.seo_description || 'อ่านรายละเอียดเชิงลึกและเทคนิคต่างๆ เพิ่มเติมได้ภายในบทความนี้...' }}</p>
                </div>
                <div class="mt-auto pt-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  <span class="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 font-medium text-xs">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ article.view_count || 0 }} ยอดเข้าชม
                  </span>
                  <div class="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                    <svg class="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </router-link>
          </div>

          <!-- Right Arrow Navigation -->
          <button 
            v-if="recentArticles.length > 1"
            @click="nextArticleSlide" 
            :class="['absolute top-1/2 -translate-y-1/2 right-0 w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 transition-all duration-300 shadow-sm z-20', recentArticles.length <= 4 ? 'xl:hidden' : '']"
            aria-label="Next slide"
          >
            <svg class="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Pagination Dots -->
        <div v-if="totalArticlePages > 1" :class="['flex justify-center gap-1 mb-16', recentArticles.length <= 4 ? 'xl:hidden' : '']">
          <button 
            v-for="pageIdx in totalArticlePages" 
            :key="'dot-' + pageIdx"
            @click="scrollArticlesToPage(pageIdx - 1)"
            class="w-8 h-8 min-w-[32px] min-h-[32px] flex items-center justify-center focus:outline-none"
            :aria-label="'Go to page ' + pageIdx"
          >
            <span
              :class="[
                'h-2.5 rounded-full transition-all duration-300 block',
                currentArticlePage === (pageIdx - 1) ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-gray-700 w-2.5'
              ]"
            ></span>
          </button>
        </div>

      </div>
    </section>

    <!-- FAQ Section -->
    <template v-if="false">
    <section v-if="homeShowFaq" class="faq-section-redesign py-20 md:py-28 relative overflow-hidden">
      <!-- Soft blue/grey gradient background -->
      <div class="absolute inset-0 bg-gradient-to-b from-[#e8f1f9]/40 via-[#f7fafc] to-[#f4f7fa] dark:from-[#0d131f] dark:via-[#111827] dark:to-[#0f172a]"></div>
      

      
      <!-- Decorative blurred orbs -->
      <div class="absolute top-20 right-[-5%] w-80 h-80 bg-blue-300/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-10 left-[-5%] w-72 h-72 bg-blue-200/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <!-- Header: Badge + Heading + Decorative 3D question mark -->
        <div class="relative text-center mb-14">
          <!-- Pill Badge (Outlined) -->
          <div class="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#e8edff] border border-[#b3c3ff] text-[#0220A4] text-xs font-bold uppercase mb-4 shadow-sm shadow-blue-500/5">
            <svg class="w-4 h-4 text-[#0220A4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            {{ sectionTitles.faqTitle }}
          </div>
          <!-- Main Heading -->
          <h3 class="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white mb-4">
            {{ sectionTitles.faqHeading.replace('อยากรู้', '') }}
            <span class="relative inline-block text-[#e05600] z-10">
              อยากรู้
              <svg class="absolute left-0 bottom-[-8px] w-full h-3 text-[#e05600] pointer-events-none select-none z-[-1]" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none">
                <path d="M2,6 C30,9 70,9 98,5" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
              </svg>
            </span>
          </h3>
          <p class="text-gray-500 dark:text-gray-400 max-w-xl mx-auto font-light text-sm md:text-base mb-4">{{ sectionTitles.faqDesc }}</p>
          
          <!-- Blue subtitle capsule separator -->
          <div class="flex justify-center items-center gap-1.5 mt-2 mb-6">
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span class="w-8 h-1.5 rounded-full bg-blue-500"></span>
          </div>


        </div>

        <!-- FAQ Accordion Items -->
        <div class="space-y-4">
          <div 
            v-for="(item, idx) in faqItems" 
            :key="idx"
            class="faq-card-redesign rounded-3xl overflow-hidden transition-all duration-500"
            :class="item.open 
              ? 'bg-white dark:bg-[#1e2738] border-2 border-blue-200 dark:border-blue-500/30 shadow-[0_12px_40px_-8px_rgba(2,32,164,0.1)]' 
              : 'bg-white dark:bg-[#1a2333]/90 border border-gray-200/80 dark:border-white/5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:border-blue-200'"
          >
            <div class="flex-1">
              <button 
                @click="toggleFaq(idx)" 
                class="w-full flex items-center justify-between px-5 md:px-6 py-5 text-left group"
              >
                <div class="flex items-center gap-3 md:gap-4">
                  <!-- Custom Colored Number Pill -->
                  <div 
                    class="w-11 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all duration-300 text-white shadow-sm"
                    :class="getFaqPillColorClass(item, idx)"
                  >
                    {{ String(idx + 1).padStart(2, '0') }}
                  </div>
                  
                  <!-- Custom Colored Icon Circle Container -->
                  <div 
                    class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ml-0.5 transition-colors"
                    :class="getFaqCircleBgClass(item, idx)"
                  >
                    <!-- House icon -->
                    <svg v-if="getFaqIcon(item, idx) === 'home'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <!-- Clock icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'clock'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <!-- Measuring tape icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'measure'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 7h1m-1 4h1m-1 4h1m-1 4h1m3-13h3a2 2 0 012 2v14a2 2 0 01-2 2h-3a2 2 0 01-2-2V5a2 2 0 012-2zM5 12h2m-2-3h2m-2 6h2m-2 3h2" />
                    </svg>
                    <!-- Truck icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'truck'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m10 0H3m10 0a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 11-4 0m4 0H17m-4-6h5l2 5" />
                    </svg>
                    <!-- Wallet icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'wallet'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <!-- Chat icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'chat'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <!-- Shield icon -->
                    <svg v-else-if="getFaqIcon(item, idx) === 'shield'" class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <!-- Help icon -->
                    <svg v-else class="w-5 h-5" :class="getFaqIconColorClass(item, idx)" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>

                  <!-- Question Text -->
                  <h4 class="text-sm md:text-lg font-bold text-gray-900 dark:text-white leading-snug">{{ item.q }}</h4>
                </div>

                <!-- Styled Outline Chevron -->
                <div 
                  :class="[
                    'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 border',
                    item.open 
                      ? 'bg-[#e8edff] dark:bg-blue-950/20 border-[#c3d0ff] dark:border-blue-500/30 text-[#0220A4]' 
                      : 'bg-[#f4f7fb] dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  <svg 
                    :class="['w-5 h-5 transition-transform duration-300', item.open ? 'rotate-180' : '']" 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </button>

              <!-- Expanded Answer Content -->
              <div v-if="item.open" class="faq-answer-reveal px-5 md:px-6 pb-6">
                <!-- Align left margin with question text start -->
                <div class="ml-14 md:ml-16">
                  <!-- Flex row: Text on left, Q1 custom feature badges on right -->
                  <div class="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <p class="text-gray-600 dark:text-gray-300 font-light leading-relaxed text-sm md:text-base flex-1 pr-0 md:pr-4">{{ item.a }}</p>
                    
                    <!-- Q1 Feature Badges (Horizontal Row of Small White Cards) -->
                    <div v-if="idx === 0" class="flex items-center gap-3 w-full md:w-auto shrink-0 justify-start md:justify-end mt-2 md:mt-0">
                      <!-- Card 1 -->
                      <div class="flex flex-col items-center justify-center w-[72px] h-[78px] bg-white dark:bg-[#1a2333] border border-gray-200/80 dark:border-white/5 rounded-2xl shadow-sm">
                        <svg class="w-6 h-6 text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">ทนแดด</span>
                      </div>
                      <!-- Card 2 -->
                      <div class="flex flex-col items-center justify-center w-[72px] h-[78px] bg-white dark:bg-[#1a2333] border border-gray-200/80 dark:border-white/5 rounded-2xl shadow-sm">
                        <svg class="w-6 h-6 text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">ทนฝน</span>
                      </div>
                      <!-- Card 3 -->
                      <div class="flex flex-col items-center justify-center w-[72px] h-[78px] bg-white dark:bg-[#1a2333] border border-gray-200/80 dark:border-white/5 rounded-2xl shadow-sm">
                        <svg class="w-6 h-6 text-blue-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span class="text-[10px] font-bold text-gray-700 dark:text-gray-300">ไม่เป็นสนิม</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>
    </template>


    <!-- Affiliated Companies Section -->
    <section v-if="homeShowAffiliates && affiliatedCompanies.length > 0" class="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-[#0c0e14] dark:to-[#08090d] border-t border-gray-100 dark:border-white/[0.03]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="text-center mb-12 md:mb-16">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/25 dark:border-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-3 uppercase tracking-[0.2em]">
            <span>{{ sectionTitles.affiliatesTitle || 'บริษัทในเครือ' }}</span>
          </div>
          <h3 class="text-2xl md:text-4.5xl font-black tracking-tight text-gray-900 dark:text-white font-['IBM_Plex_Sans_Thai']">
            {{ sectionTitles.affiliatesHeading || 'เครือข่ายธุรกิจของเรา' }}
          </h3>
          <p class="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base font-light">
            {{ sectionTitles.affiliatesDesc || 'เครือข่ายธุรกิจที่มั่นคง ร่วมมือสร้างสรรค์นวัตกรรมและบริการคุณภาพระดับมาตรฐานสากล' }}
          </p>
        </div>

        <!-- Grid Container / Mobile Swipeable Carousel -->
        <div class="flex md:grid md:grid-cols-3 gap-6 lg:gap-8 overflow-x-auto md:overflow-x-visible scrollbar-none snap-x snap-mandatory pb-6 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          <a 
            v-for="(company, idx) in affiliatedCompanies" 
            :key="idx"
            :href="company.url || '#'" 
            :target="company.url ? '_blank' : '_self'" 
            rel="noopener noreferrer"
            class="group flex flex-col h-full w-[290px] sm:w-[320px] md:w-auto shrink-0 snap-center rounded-3xl overflow-hidden bg-white dark:bg-[#121622] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.06)] dark:hover:shadow-[0_20px_40px_rgba(16,185,129,0.12)] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-500/20 dark:hover:border-emerald-500/30 transition-all duration-500 hover:-translate-y-2"
          >
            <!-- Banner Image Section (16:9 Aspect Ratio) -->
            <div class="relative aspect-video w-full overflow-hidden bg-[#1a2333] flex items-center justify-center border-b border-gray-100 dark:border-white/[0.04]">
              <img 
                v-if="company.banner || company.image"
                :src="getOptimizedImageUrl(company.banner || company.image, 800)" 
                :alt="company.name" 
                class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 select-none pointer-events-none"
                @error="onImageError"
              >
              <!-- Elegant Fallback Placeholder when no image URL is provided -->
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#131b2e] via-[#101726] to-[#0a0f1d] p-6 text-center select-none">
                <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 shadow-inner">
                  <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-slate-300 line-clamp-1 font-['IBM_Plex_Sans_Thai']">{{ company.name }}</span>
              </div>

              <!-- Subtle top-right external link badge -->
              <div v-if="company.url" class="absolute top-3 right-3 bg-white/95 dark:bg-[#0c0e14]/80 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center text-gray-700 dark:text-white shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <!-- Category Tag Badge above Title -->
                <div v-if="company.tag || getBusinessTag(company.name)" class="mb-2">
                  <span class="inline-flex items-center px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 rounded-md uppercase tracking-wider">
                    {{ company.tag || getBusinessTag(company.name) }}
                  </span>
                </div>

                <h4 class="text-lg md:text-xl font-bold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors font-['IBM_Plex_Sans_Thai']">
                  {{ company.name }}
                </h4>
                
                <!-- Line-clamped Description to keep heights uniform -->
                <p v-if="company.description" class="text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed mt-2.5 line-clamp-3 sm:line-clamp-4 min-h-[48px] overflow-hidden">
                  {{ company.description }}
                </p>
              </div>

              <!-- Action Link Footer -->
              <div class="pt-4 mt-4 border-t border-gray-100 dark:border-white/[0.04] flex items-center justify-between text-emerald-800 dark:text-emerald-400 text-sm font-bold">
                <span class="font-['IBM_Plex_Sans_Thai']">{{ company.buttonText || 'เข้าชมเว็บไซต์' }}</span>
                <div class="w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950/20 group-hover:bg-emerald-700 group-hover:text-white flex items-center justify-center transition-all duration-300">
                  <svg class="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>


    </template>
  </div>
</template>

<style scoped>
/* Responsive S-Curve Masking */
@media (min-width: 1024px) {
  .clip-s-curve {
    clip-path: url(#s-curve-mask);
  }
}

/* Premium Hero Heading Styles */
.hero-heading {
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  text-shadow: 0 2px 20px rgba(27, 34, 45, 0.08);
  letter-spacing: normal;
}
.hero-heading-brand {
  text-shadow: 0 4px 25px rgba(2, 32, 164, 0.15);
  filter: drop-shadow(0 2px 8px rgba(2, 32, 164, 0.1));
}

.slide-fade-enter-active {
  transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}
.slide-fade-leave-active {
  transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}
.slide-fade-enter-from {
  opacity: 0;
}
.slide-fade-leave-to {
  opacity: 0;
}

/* Custom Image Fade Transition for Foreground Card */
.hero-image-fade-enter-active {
  transition: all 1.0s cubic-bezier(0.25, 1, 0.5, 1);
}
.hero-image-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  position: absolute;
}
.hero-image-fade-enter-from {
  opacity: 0;
  transform: scale(1.06) rotate(0.5deg);
  filter: blur(2px);
}
.hero-image-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
  filter: blur(1px);
}

/* Floating Badge Smooth Slide & Fade Transition */
.badge-fade-enter-active,
.badge-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.badge-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.badge-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Hero staggered text entrance */
.hero-stagger-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-stagger-leave-active {
  transition: all 0.3s ease;
}
.hero-stagger-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.hero-stagger-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Stagger delays for child elements */
.hero-stagger-enter-active .hero-stagger-1 { animation: stagger-in 0.6s 0.1s both cubic-bezier(0.16, 1, 0.3, 1); }
.hero-stagger-enter-active .hero-stagger-2 { animation: stagger-in 0.7s 0.2s both cubic-bezier(0.16, 1, 0.3, 1); }
.hero-stagger-enter-active .hero-stagger-3 { animation: stagger-in 0.7s 0.35s both cubic-bezier(0.16, 1, 0.3, 1); }
.hero-stagger-enter-active .hero-stagger-4 { animation: stagger-in 0.7s 0.5s both cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes stagger-in {
  from { opacity: 0; transform: translateY(25px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

/* Ken Burns parallax for hero images */
.hero-parallax-img {
  animation: ken-burns 15s ease-in-out infinite alternate;
  will-change: transform;
  backface-visibility: hidden;
}
@keyframes ken-burns {
  0% { transform: scale(1.02) translate(0, 0); }
  100% { transform: scale(1.08) translate(-0.5%, -0.5%); }
}

/* Animated gradient text */
@keyframes gradient-text {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
.animate-gradient-text {
  animation: gradient-text 4s linear infinite;
}

/* Gradient mesh drift */
@keyframes gradient-drift {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(30px, -30px) rotate(5deg); }
  66% { transform: translate(-20px, 20px) rotate(-3deg); }
}
@keyframes gradient-drift-reverse {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(-30px, 30px) rotate(-5deg); }
  66% { transform: translate(20px, -20px) rotate(3deg); }
}
.animate-gradient-drift {
  animation: gradient-drift 15s ease-in-out infinite;
}
.animate-gradient-drift-reverse {
  animation: gradient-drift-reverse 18s ease-in-out infinite;
}

/* Scroll indicator */
@keyframes scroll-indicator {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(300%); }
}
.animate-scroll-indicator {
  animation: scroll-indicator 2s ease-in-out infinite;
}

.up-fade-enter-active,
.up-fade-leave-active {
  transition: all 0.5s ease;
}
.up-fade-enter-from,
.up-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.text-shadow-lg {
  text-shadow: 0 4px 20px rgba(0,0,0,0.6);
}
.text-shadow-sm {
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Partner logo marquee */
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 25s linear infinite;
}
.animate-marquee:hover {
  animation-play-state: paused;
}

/* FAQ answer reveal animation */
.faq-answer-reveal {
  animation: faq-slide-in 0.3s ease-out;
}
@keyframes faq-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Floating particles */
@keyframes float-slow {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-30px) translateX(15px); }
  50% { transform: translateY(-15px) translateX(-10px); }
  75% { transform: translateY(-40px) translateX(5px); }
}
@keyframes float-medium {
  0%, 100% { transform: translateY(0) translateX(0); }
  33% { transform: translateY(-20px) translateX(-20px); }
  66% { transform: translateY(-35px) translateX(10px); }
}
@keyframes float-fast {
  0%, 100% { transform: translateY(0) translateX(0); }
  50% { transform: translateY(-25px) translateX(15px); }
}
.animate-float-slow {
  animation: float-slow 8s ease-in-out infinite;
}
.animate-float-medium {
  animation: float-medium 6s ease-in-out infinite;
}
.animate-float-fast {
  animation: float-fast 4s ease-in-out infinite;
}

/* Animated tech grid */
.hero-grid {
  background-image: 
    linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
    linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px);
  background-size: 80px 80px;
  animation: grid-move 20s linear infinite;
}
@keyframes grid-move {
  0% { background-position: 0 0; }
  100% { background-position: 80px 80px; }
}

/* Radial gradient vignette for grid fade */
.hero-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, #0a0f16 75%);
}


.fade-enter-active, .fade-leave-active {
  transition: opacity 1s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-slide-up-enter-active, .fade-slide-up-leave-active {
  transition: all 0.6s ease;
}
.fade-slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Cinematic Bento Showcase Custom Keyframes & Animations */
@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes podium-glow {
  0%, 100% {
    transform: scale(1) translateY(0);
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.2);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.02) translateY(1px);
    box-shadow: 0 0 55px rgba(16, 185, 129, 0.7), inset 0 0 25px rgba(16, 185, 129, 0.4);
    opacity: 0.6;
  }
}
.animate-podium-glow {
  animation: podium-glow 4s ease-in-out infinite;
}

/* Chatbot Float and Play Ripple animations */
@keyframes chatbot-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
.animate-chatbot-float {
  animation: chatbot-float 3s ease-in-out infinite;
}

@keyframes play-pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
.play-btn-ripple::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px solid rgba(2, 32, 164, 0.4);
  animation: play-pulse 2.2s infinite;
  pointer-events: none;
}

/* Glassmorphic floating badges */
.premium-glass-badge {
  @apply backdrop-blur-xl bg-white/70 dark:bg-[#121826]/75 border border-white/40 dark:border-white/10 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.25)] rounded-2xl py-2.5 px-4 flex items-center gap-2.5 hover:bg-white/80 dark:hover:bg-[#121826]/90 hover:scale-105 hover:shadow-[0_16px_36px_-4px_rgba(2,32,164,0.12)] transition-all duration-300;
}



/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-none {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

@media (min-width: 1024px) {
  .clip-slant-slant {
    clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%);
  }
}
</style>

