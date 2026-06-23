<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'
import AdminProductDropdown from '../../components/admin/AdminProductDropdown.vue'
import AdminCategoryDropdown from '../../components/admin/AdminCategoryDropdown.vue'

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const loading = ref(true)
const saving = ref(false)
const uploadingImage = ref(false)

// AI Generation State
const loadingAI = ref(false)
const loadingSectionAI = ref({
  slides: false,
  stats: false,
  features: false,
  testimonials: false,
  cta: false
})

const activeTab = ref('slider')
const tabs = [
  { key: 'slider', label: 'แบนเนอร์สไลด์', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'hero', label: 'สถิติ & จุดเด่น', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' },
  { key: 'banners', label: 'แบนเนอร์แนะนำ & Bento', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
  { key: 'categories', label: 'หมวดหมู่ & สินค้า', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { key: 'content', label: 'ขั้นตอนบริการ', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'faq', label: 'คำถามที่พบบ่อย', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'social', label: 'รีวิว & พาร์ทเนอร์', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { key: 'cta', label: 'CTA & อื่นๆ', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' }
]

// Data Models
const slides = ref([])
const stats = ref([])
const featuresHeading = ref('')
const featuresTitle = ref('')
const featuresDesc = ref('')
const featuresItems = ref([])
const featuresImage = ref('')
const featuresBadgeTitle = ref('')
const featuresBadgeDesc = ref('')
const testimonials = ref([])
const defaultCorporateReviews = [
  {
    company: 'SCG Chemicals',
    location: 'โรงงานบางปู',
    rating: 5,
    logo: 'scg',
    image: '/images/partners/scg_building.webp',
    review: 'งานติดตั้งรวดเร็ว วัสดุแข็งแรง ทีมงานมืออาชีพ บริการประทับใจมากครับ',
    badge: 'ติดตั้งโรงเก็บของ MS-M005',
    badgeColor: 'orange',
    badgeIcon: 'wrench'
  },
  {
    company: 'PTT Station',
    location: 'สาขานครอินทร์',
    rating: 5,
    logo: 'ptt',
    image: '/images/partners/ptt_building.webp',
    review: 'คุณภาพดีเกินราคา ตรงปก แข็งแรงทนทาน ใช้เก็บอุปกรณ์ร้านได้ดีมาก',
    badge: 'ติดตั้งบ้านเก็บของพลาสติก HDPE',
    badgeColor: 'blue',
    badgeIcon: 'home'
  },
  {
    company: 'HomePro',
    location: 'สาขาชลบุรี',
    rating: 5,
    logo: 'homepro',
    image: '/images/partners/homepro_building.webp',
    review: 'ทีมงานให้คำแนะนำดีมาก บริการหลังการขายยอดเยี่ยม ไว้ใจได้เลยค่ะ',
    badge: 'ติดตั้งโรงเก็บของ MS-M003',
    badgeColor: 'green',
    badgeIcon: 'check'
  },
  {
    company: 'Index Living Mall',
    location: 'สาขาเชียงใหม่',
    rating: 5,
    logo: 'index',
    image: '/images/partners/index_building.webp',
    review: 'สวยงาม แข็งแรง ตรงตามแบบที่ต้องการ จัดส่งและติดตั้งตรงเวลา',
    badge: 'ติดตั้งบ้านเก็บของ MS-S003D',
    badgeColor: 'purple',
    badgeIcon: 'home'
  },
  {
    company: 'CPF (Thailand)',
    location: 'โรงงานโคราช',
    rating: 5,
    logo: 'cpf',
    image: '/images/partners/cpf_building.webp',
    review: 'วางใจในคุณภาพและการบริการ แนะนำเลยครับ',
    badge: 'ติดตั้งโรงเก็บของ MS-M002',
    badgeColor: 'yellow',
    badgeIcon: 'star'
  }
]
const partners = ref([])
const corporateReviews = ref([...defaultCorporateReviews])
const affiliates = ref([])
const ctaTitle = ref('')
const ctaDesc = ref('')
const ctaButtonText = ref('')
const ctaButtonLink = ref('')

// Added State for Category Showcase

// Banners & Bento States
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

const categoryShowcase = ref([])
const isDraggingShowcase = ref(false)
const availableCategories = ref([])
const availableProducts = ref([])
const homeShowHighlightCategories = ref(true)
const homeShowTestimonials = ref(true)
const homeShowPartners = ref(true)
const homeShowAffiliates = ref(true)
const homeShowFaq = ref(true)
const homeShowStats = ref(true)
const homeShowFeatures = ref(true)
const homeShowHowItWorks = ref(true)

// Added State for Highlight Categories
const homeHighlightSettings = ref({
  title: 'หมวดหมู่สินค้าขายดี',
  titleHighlight: 'ยอดนิยม',
  subtitle: 'ค้นพบโซลูชันพื้นที่เก็บของที่ดีที่สุด การันตีด้วยยอดขายอันดับหนึ่ง',
  items: [
    { categoryId: '', customDesc: '', productIds: ['', '', ''] },
    { categoryId: '', customDesc: '', productIds: ['', '', ''] },
    { categoryId: '', customDesc: '', productIds: ['', '', ''] },
    { categoryId: '', customDesc: '', productIds: ['', '', ''] },
    { categoryId: '', customDesc: '', productIds: ['', '', ''] }
  ]
})

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
  howItWorksTitle: 'ขั้นตอนการบริการ',
  howItWorksHeading: 'ง่ายแค่ 4 ขั้นตอน พร้อมใช้งานทันที',
  howItWorksDesc: 'จากปรึกษาตัวเองถึงติดตั้งเสร็จสมบูรณ์ เราดูแลทุกขั้นตอนอย่างมืออาชีพ',
  projectsTitle: 'ผลงานของเรา',
  projectsHeading: 'ภาพผลงานติดตั้งจริงล่าสุด',
  projectsDesc: 'มั่นใจในคุณภาพจากผลงานจริงที่ลูกค้าไว้วางใจ',
  testimonialsTitle: 'เสียงตอบรับจากลูกค้า',
  testimonialsHeading: 'ความไว้วางใจจากตัวจริง',
  testimonialsDesc: 'เราภูมิใจที่ได้เป็นส่วนหนึ่งในการดูแลบ้านและธุรกิจของลูกค้า\nด้วยคุณภาพงานที่ได้มาตรฐาน บริการที่จริงใจ และส่งมอบตรงเวลาเสมอ',
  partnersTitle: 'พาร์ทเนอร์ของเรา',
  partnersHeading: 'ความไว้วางใจจากองค์กรชั้นนำ',
  partnersDesc: 'ขอขอบคุณทุกความไว้วางใจที่เลือก MoreSpace ดูแลพื้นที่ของคุณ',
  articlesTitle: 'คลังสาระ',
  articlesHeading: 'อัพเดทข่าวสารน่ารู้',
  faqTitle: 'คำถามที่พบบ่อย',
  faqHeading: 'สิ่งที่คุณอยากรู้',
  faqDesc: 'รวบรวมคำตอบสำหรับคำถามที่ลูกค้าสอบถามบ่อยที่สุด',
})

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

const howItWorksSteps = ref([
  { icon: 'chat', title: 'ปรึกษาฟรี', subtitle: 'พูดคุยความต้องการ', desc: 'พูดคุยกับผู้เชี่ยวชาญหรือ AI เพื่อวิเคราะห์ความต้องการและแนะนำโซลูชันที่เหมาะสมกับธุรกิจของคุณ', duration: 'ระยะเวลา: 15 - 30 นาที', color: 'emerald' },
  { icon: 'search', title: 'สำรวจพื้นที่', subtitle: 'ประเมินหน้างาน', desc: 'ทีมงานเข้าสำรวจและวิเคราะห์พื้นที่จริง ประเมินความต้องการ พร้อมให้คำแนะนำตำแหน่งติดตั้งที่ดีที่สุด', duration: 'ระยะเวลา: 1 วัน', color: 'blue' },
  { icon: 'truck', title: 'จัดส่ง & ติดตั้ง', subtitle: 'รวดเร็ว ปลอดภัย', desc: 'จัดส่งอุปกรณ์คุณภาพ พร้อมทีมช่างมืออาชีพติดตั้งอย่างประณีต ได้มาตรฐาน ใช้งานได้ทันที', duration: 'ระยะเวลา: 1 - 2 วัน', color: 'amber' },
  { icon: 'shield', title: 'รับประกัน', subtitle: 'อุ่นใจตลอดการใช้งาน', desc: 'มั่นใจด้วยการรับประกันโครงสร้าง 10 ปีเต็ม พร้อมบริการหลังการขาย ดูแลและให้คำปรึกษาตลอดอายุการใช้งาน', duration: 'ระยะเวลา: ดูแลตลอดอายุการใช้งาน', color: 'violet' }
])

const faqItems = ref([
  { q: 'บ้านเก็บของ Morespace ทนแดด ทนฝน ไหม?', a: 'ทนทานครับ โครงสร้างผลิตจากเหล็กเคลือบกันสนิม Galvalume พรีเมียมจากอเมริกา ทนแดด ทนฝน ทนลมแรง ผ่านมาตรฐานการทดสอบระดับสากล พร้อมรับประกันโครงสร้าง 10 ปีเต็ม', icon: 'home', color: 'orange', open: false },
  { q: 'ใช้เวลาติดตั้งนานแค่ไหน?', a: 'ทีมช่างมืออาชีพของเราสามารถติดตั้งให้เสร็จสมบูรณ์ภายใน 1-2 วันทำการ ขึ้นอยู่กับขนาดรุ่นที่เลือก โดยไม่ต้องเทพื้นคอนกรีตล่วงหน้า', icon: 'clock', color: 'blue', open: false },
  { q: 'ต้องเตรียมพื้นที่อย่างไรก่อนติดตั้ง?', a: 'เพียงมีพื้นที่ราบเรียบ แน่น และมีระยะห่างจากรั้วอย่างน้อย 50 เซนติเมตร ทีมงานจะเข้าสำรวจพื้นที่ฟรีก่อนการติดตั้ง พร้อมให้คำแนะนำเพิ่มเติม', icon: 'measure', color: 'purple', open: false },
  { q: 'มีบริการจัดส่งและติดตั้งทั่วประเทศไหม?', a: 'มีครับ! เราให้บริการจัดส่งและติดตั้งทั่วประเทศไทย มีทีมช่างประจำภูมิภาคกระจายอยู่ทั่วประเทศ พร้อมรับประกันงานติดตั้ง', icon: 'truck', color: 'emerald', open: false },
  { q: 'สามารถผ่อนชำระได้ไหม?', a: 'ได้ครับ เรามีบริการผ่อนชำระ 0% สูงสุด 10 เดือน ผ่านบัตรเครดิตธนาคารชั้นนำ หรือสามารถชำระเงินสดพร้อมรับส่วนลดพิเศษ', icon: 'wallet', color: 'pink', open: false },
])

const addHowItWorksStep = () => {
    howItWorksSteps.value.push({ icon: 'chat', title: '', subtitle: '', desc: '', duration: '', color: 'emerald' });
}
const removeHowItWorksStep = (index) => {
    howItWorksSteps.value.splice(index, 1);
}

const addFaqItem = () => {
    faqItems.value.push({ q: '', a: '', icon: '', color: '', open: false });
}
const removeFaqItem = (index) => {
    faqItems.value.splice(index, 1);
}

const addHighlightCategory = () => {
  if (!homeHighlightSettings.value.items) {
    homeHighlightSettings.value.items = [];
  }
  homeHighlightSettings.value.items.push({ categoryId: '', customDesc: '', productIds: ['', '', ''] });
}

const removeHighlightCategory = (index) => {
  if (homeHighlightSettings.value.items.length > 1) {
    homeHighlightSettings.value.items.splice(index, 1);
  } else {
    showToast('ต้องมีอย่างน้อย 1 หมวดหมู่', 'error');
  }
}

const getProductsByCategory = (categoryId) => {
  if (!categoryId) return [];
  const cat = availableCategories.value.find(c => String(c.id) === String(categoryId));
  if (!cat) return [];
  return availableProducts.value.filter(p => {
    // 1. Check categories array (IDs, Names, or Slugs)
    if (p.categories && Array.isArray(p.categories)) {
      const matchId = p.categories.some(val => String(val) === String(cat.id));
      const matchName = p.categories.some(val => String(val).toLowerCase().trim() === String(cat.name).toLowerCase().trim());
      const matchSlug = cat.slug && p.categories.some(val => String(val).toLowerCase().trim() === String(cat.slug).toLowerCase().trim());
      if (matchId || matchName || matchSlug) return true;
    }

    // 2. Check categories_names / categories_slugs mapped on backend
    if (p.categories_names && Array.isArray(p.categories_names)) {
      if (p.categories_names.some(name => String(name).toLowerCase().trim() === String(cat.name).toLowerCase().trim())) return true;
    }
    if (p.categories_slugs && Array.isArray(p.categories_slugs)) {
      if (cat.slug && p.categories_slugs.some(slug => String(slug).toLowerCase().trim() === String(cat.slug).toLowerCase().trim())) return true;
    }

    // 3. Check single category field (ID, Name, or Slug)
    if (p.category) {
      if (String(p.category) === String(cat.id)) return true;
      if (String(p.category).toLowerCase().trim() === String(cat.name).toLowerCase().trim()) return true;
      if (cat.slug && String(p.category).toLowerCase().trim() === String(cat.slug).toLowerCase().trim()) return true;
    }

    // 4. Check category_name / category_slug mapped on backend
    if (p.category_name && String(p.category_name).toLowerCase().trim() === String(cat.name).toLowerCase().trim()) return true;
    if (p.category_slug && cat.slug && String(p.category_slug).toLowerCase().trim() === String(cat.slug).toLowerCase().trim()) return true;

    return false;
  });
}

const loadSettings = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    
    if (data.success) {
      const s = data.data
      
      // Parse JSON arrays with fallbacks
      try { 
        const parsedSlides = s.home_slides ? JSON.parse(s.home_slides) : []
        slides.value = parsedSlides.map(slide => {
          if (!slide.features || !Array.isArray(slide.features) || slide.features.length !== 3) {
            slide.features = [
              { icon: slide.features?.[0]?.icon || 'shield', title: slide.features?.[0]?.title || 'วัสดุคุณภาพ', desc: slide.features?.[0]?.desc || 'แข็งแรง ทนทาน' },
              { icon: slide.features?.[1]?.icon || 'sun', title: slide.features?.[1]?.title || 'กันแดด กันฝน', desc: slide.features?.[1]?.desc || 'ทนทุกสภาพอากาศ' },
              { icon: slide.features?.[2]?.icon || 'wrench', title: slide.features?.[2]?.title || 'ประกอบง่าย', desc: slide.features?.[2]?.desc || 'รวดเร็ว ไม่ยุ่งยาก' }
            ]
          }
          if (!slide.highlights || !Array.isArray(slide.highlights) || slide.highlights.length !== 3) {
            slide.highlights = [
              { icon: slide.highlights?.[0]?.icon || 'sun', label: slide.highlights?.[0]?.label || 'จุดเด่น', title: slide.highlights?.[0]?.title || 'กรองแสง UV ถนอมพืชพรรณ' },
              { icon: slide.highlights?.[1]?.icon || 'leaf', label: slide.highlights?.[1]?.label || 'ความพิเศษ', title: slide.highlights?.[1]?.title || 'วัสดุเป็นมิตรต่อต้นไม้' },
              { icon: slide.highlights?.[2]?.icon || 'wind', label: slide.highlights?.[2]?.label || 'คุณสมบัติ', title: slide.highlights?.[2]?.title || 'โครงสร้างต้านลมพายุ' }
            ]
          }
          if (slide.showCta2 === undefined) {
            slide.showCta2 = true
          }
          if (slide.cta2Text === undefined) {
            slide.cta2Text = 'ปรึกษาฟรีกับ AI'
          }
          if (slide.cta2Link === undefined) {
            slide.cta2Link = '/ai-consultant'
          }
          if (slide.showHighlights === undefined) {
            slide.showHighlights = true
          }
          if (slide.showFeatures === undefined) {
            slide.showFeatures = true
          }
          return slide
        })
      } catch(e) { 
        slides.value = [] 
      }
      try { stats.value = s.home_stats ? JSON.parse(s.home_stats) : [] } catch(e) { stats.value = [] }
      try { featuresItems.value = s.home_features_items ? JSON.parse(s.home_features_items) : [] } catch(e) { featuresItems.value = [] }
      try { testimonials.value = s.home_testimonials ? JSON.parse(s.home_testimonials) : [] } catch(e) { testimonials.value = [] }
      try { partners.value = s.home_partners ? JSON.parse(s.home_partners) : [] } catch(e) { partners.value = [] }
      try {
        const parsedCorp = s.home_corporate_reviews ? JSON.parse(s.home_corporate_reviews) : []
        corporateReviews.value = Array.isArray(parsedCorp) && parsedCorp.length > 0 ? parsedCorp : defaultCorporateReviews
      } catch(e) {
        corporateReviews.value = defaultCorporateReviews
      }
      try { affiliates.value = s.home_affiliates ? JSON.parse(s.home_affiliates) : [] } catch(e) { affiliates.value = [] }
      
      featuresHeading.value = s.home_features_heading || ''
      featuresTitle.value = s.home_features_title || ''
      featuresDesc.value = s.home_features_desc || ''
      featuresImage.value = s.home_features_image || ''
      featuresBadgeTitle.value = s.home_features_badge_title || ''
      featuresBadgeDesc.value = s.home_features_badge_desc || ''
      homeShowHighlightCategories.value = s.home_show_highlight_categories !== 'false'
      homeShowTestimonials.value = s.home_show_testimonials !== 'false'
      homeShowPartners.value = s.home_show_partners !== 'false'
      homeShowAffiliates.value = s.home_show_affiliates !== 'false'
      homeShowFaq.value = s.home_show_faq !== 'false'
      homeShowStats.value = s.home_show_stats !== 'false'
      homeShowFeatures.value = s.home_show_features !== 'false'
      homeShowHowItWorks.value = s.home_show_how_it_works !== 'false'
      
      ctaTitle.value = s.home_cta_title || ''
      ctaDesc.value = s.home_cta_desc || ''
      ctaButtonText.value = s.home_cta_button_text || ''
      ctaButtonLink.value = s.home_cta_button_link || ''

      try {
        const parsedShowcase = s.home_category_showcase ? JSON.parse(s.home_category_showcase) : []
        categoryShowcase.value = Array.isArray(parsedShowcase) ? parsedShowcase.map(item => ({
          ...item,
          isCollapsed: item.isCollapsed !== undefined ? item.isCollapsed : false
        })) : []
      } catch(e) {
        categoryShowcase.value = []
      }
      
      try { 
        const parsedHighlight = s.home_highlight_categories ? JSON.parse(s.home_highlight_categories) : null;
        if (parsedHighlight) {
          // Ensure productIds is properly initialized to array of 3
          parsedHighlight.items.forEach(item => {
            if (!item.productIds) item.productIds = ['', '', ''];
            while(item.productIds.length < 3) item.productIds.push('');
          });
          homeHighlightSettings.value = parsedHighlight;
        }
      } catch(e) {}

      
      // Homepage Banners & Why Choose Us Settings
      bannerTag.value = s.home_banner_tag || 'คัดสรรสินค้าคุณภาพ'
      bannerTitle.value = s.home_banner_title || 'บ้านเก็บของ ที่แข็งแรง ทนทาน'
      bannerSubtitle.value = s.home_banner_subtitle || 'ใช้งานได้ยาวนาน คุ้มค่าคุ้มราคา'
      bannerImage.value = s.home_banner_image || '/images/home/banner-sheds.webp'
      bannerBadgeText.value = s.home_banner_badge_text || 'สินค้าขายดี'
      bannerBadgeSub.value = s.home_banner_badge_sub || 'อันดับ 1'
      try { bannerBullets.value = s.home_banner_bullets ? JSON.parse(s.home_banner_bullets) : ['กันแดด กันฝน', 'วัสดุแข็งแรง', 'ประกอบง่าย', 'ดีไซน์สวย'] } catch(e) {
        bannerBullets.value = ['กันแดด กันฝน', 'วัสดุแข็งแรง', 'ประกอบง่าย', 'ดีไซน์สวย']
      }

      whyChooseUsTitle.value = s.home_why_choose_us_title || 'ทำไมต้องเลือกเรา?'
      try { whyChooseUsBullets.value = s.home_why_choose_us_bullets ? JSON.parse(s.home_why_choose_us_bullets) : ['ดีไซน์สวย ทันสมัย', 'วัสดุแข็งแรง ทนทาน', 'กันแดด กันฝน 100%', 'ประกอบง่าย รวดเร็ว', 'เพิ่มพื้นที่ใช้บ้านเป็นระเบียบ', 'คุ้มค่า คุ้มราคา'] } catch(e) {
        whyChooseUsBullets.value = ['ดีไซน์สวย ทันสมัย', 'วัสดุแข็งแรง ทนทาน', 'กันแดด กันฝน 100%', 'ประกอบง่าย รวดเร็ว', 'เพิ่มพื้นที่ใช้บ้านเป็นระเบียบ', 'คุ้มค่า คุ้มราคา']
      }

      promoTag.value = s.home_promo_tag || 'Premium Quality'
      promoTitle.value = s.home_promo_title || 'โซลูชันจัดเก็บ ครบจบในที่เดียว'
      promoDesc.value = s.home_promo_desc || 'แข็งแรง ทนทาน ใช้งานได้นาน ดีไซน์สไตล์โมเดิร์น'
      promoBtnText.value = s.home_promo_btn_text || 'ดูเพิ่มเติม'
      promoBtnLink.value = s.home_promo_btn_link || '/products'
      promoImage.value = s.home_promo_image || '/images/home/hdpe-shed-promo.webp'

      try { sectionTitles.value = {...sectionTitles.value, ...(s.home_section_titles ? JSON.parse(s.home_section_titles) : {})} } catch(e) {}
      try {
        if (s.home_how_it_works) {
          const parsed = JSON.parse(s.home_how_it_works);
          if (Array.isArray(parsed)) {
            const defaults = [
              { icon: 'chat', title: 'ปรึกษาฟรี', subtitle: 'พูดคุยความต้องการ', desc: 'พูดคุยกับผู้เชี่ยวชาญหรือ AI เพื่อวิเคราะห์ความต้องการและแนะนำโซลูชันที่เหมาะสมกับธุรกิจของคุณ', duration: 'ระยะเวลา: 15 - 30 นาที', color: 'emerald' },
              { icon: 'search', title: 'สำรวจพื้นที่', subtitle: 'ประเมินหน้างาน', desc: 'ทีมงานเข้าสำรวจและวิเคราะห์พื้นที่จริง ประเมินความต้องการ พร้อมให้คำแนะนำตำแหน่งติดตั้งที่ดีที่สุด', duration: 'ระยะเวลา: 1 วัน', color: 'blue' },
              { icon: 'truck', title: 'จัดส่ง & ติดตั้ง', subtitle: 'รวดเร็ว ปลอดภัย', desc: 'จัดส่งอุปกรณ์คุณภาพ พร้อมทีมช่างมืออาชีพติดตั้งอย่างประณีต ได้มาตรฐาน ใช้งานได้ทันที', duration: 'ระยะเวลา: 1 - 2 วัน', color: 'amber' },
              { icon: 'shield', title: 'รับประกัน', subtitle: 'อุ่นใจตลอดการใช้งาน', desc: 'มั่นใจด้วยการรับประกันโครงสร้าง 10 ปีเต็ม พร้อมบริการหลังการขาย ดูแลและให้คำปรึกษาตลอดอายุการใช้งาน', duration: 'ระยะเวลา: ดูแลตลอดอายุการใช้งาน', color: 'violet' }
            ];
            howItWorksSteps.value = parsed.map((step, idx) => {
              const fallback = defaults[idx] || {};
              return {
                icon: step.icon || fallback.icon || 'chat',
                title: step.title !== undefined ? step.title : (fallback.title || ''),
                subtitle: step.subtitle !== undefined ? step.subtitle : (fallback.subtitle || ''),
                desc: step.desc !== undefined ? step.desc : (fallback.desc || ''),
                duration: step.duration !== undefined ? step.duration : (fallback.duration || ''),
                color: step.color || fallback.color || 'emerald'
              };
            });
          }
        }
      } catch(e) {
        console.error('Error parsing howItWorksSteps settings:', e)
      }
      try { faqItems.value = s.home_faq ? JSON.parse(s.home_faq) : faqItems.value } catch(e) {}
      try {
        const parsedCta = s.home_projects_cta ? JSON.parse(s.home_projects_cta) : null
        if (parsedCta) {
          homeProjectsCta.value = { ...homeProjectsCta.value, ...parsedCta }
        }
      } catch (e) {
        console.error('Error parsing home_projects_cta settings:', e)
      }

      // Fetch categories and products for the new showcase feature
      try {
        const [catRes, prodRes] = await Promise.all([
          apiFetch('/api/categories'),
          apiFetch('/api/products?admin=true')
        ])
        const catData = await catRes.json()
        const prodData = await prodRes.json()
        
                if (catData.success) availableCategories.value = catData.data
        if (prodData.success) availableProducts.value = prodData.data
      } catch (e) {
        console.error('Error loading reference data for showcase:', e)
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    showToast('เกิดข้อผิดพลาด ไม่สามารถดึงข้อมูลได้', 'error')
  } finally {
    loading.value = false
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    const payload = {
      home_slides: JSON.stringify(slides.value),
      home_stats: JSON.stringify(stats.value),
      home_features_heading: featuresHeading.value,
      home_features_title: featuresTitle.value,
      home_features_desc: featuresDesc.value,
      home_features_items: JSON.stringify(featuresItems.value),
      home_features_image: featuresImage.value,
      home_features_badge_title: featuresBadgeTitle.value,
      home_features_badge_desc: featuresBadgeDesc.value,
      home_testimonials: JSON.stringify(testimonials.value),
      home_partners: JSON.stringify(partners.value),
      home_corporate_reviews: JSON.stringify(corporateReviews.value),
      home_affiliates: JSON.stringify(affiliates.value),
      home_cta_title: ctaTitle.value,
      home_cta_desc: ctaDesc.value,
      home_cta_button_text: ctaButtonText.value,
      home_cta_button_link: ctaButtonLink.value,
      home_show_highlight_categories: homeShowHighlightCategories.value ? 'true' : 'false',
      home_show_testimonials: homeShowTestimonials.value ? 'true' : 'false',
      home_show_partners: homeShowPartners.value ? 'true' : 'false',
      home_show_affiliates: homeShowAffiliates.value ? 'true' : 'false',
      home_show_faq: homeShowFaq.value ? 'true' : 'false',
      home_show_stats: homeShowStats.value ? 'true' : 'false',
      home_show_features: homeShowFeatures.value ? 'true' : 'false',
      home_show_how_it_works: homeShowHowItWorks.value ? 'true' : 'false',
      home_banner_tag: bannerTag.value,
      home_banner_title: bannerTitle.value,
      home_banner_subtitle: bannerSubtitle.value,
      home_banner_image: bannerImage.value,
      home_banner_badge_text: bannerBadgeText.value,
      home_banner_badge_sub: bannerBadgeSub.value,
      home_banner_bullets: JSON.stringify(bannerBullets.value),
      home_why_choose_us_title: whyChooseUsTitle.value,
      home_why_choose_us_bullets: JSON.stringify(whyChooseUsBullets.value),
      home_promo_tag: promoTag.value,
      home_promo_title: promoTitle.value,
      home_promo_desc: promoDesc.value,
      home_promo_btn_text: promoBtnText.value,
      home_promo_btn_link: promoBtnLink.value,
      home_promo_image: promoImage.value,
      home_category_showcase: JSON.stringify(categoryShowcase.value),
      home_highlight_categories: JSON.stringify(homeHighlightSettings.value),
      home_section_titles: JSON.stringify(sectionTitles.value),
      home_how_it_works: JSON.stringify(howItWorksSteps.value),
      home_faq: JSON.stringify(faqItems.value),
      home_projects_cta: JSON.stringify(homeProjectsCta.value)
    }

    const settingsArray = Object.entries(payload).map(([key, value]) => ({ key, value }))

    const res = await apiFetch('/api/settings/batch', {
      method: 'POST',
      body: JSON.stringify({ settings: settingsArray })
    })

    const data = await res.json()

    if (data.success) {
      showToast('บันทึกสำเร็จ อัพเดทข้อมูลหน้าหลักเรียบร้อยแล้ว', 'success')
    } else {
      throw new Error(data.message || 'Failed to save')
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    showToast('เกิดข้อผิดพลาด ไม่สามารถบันทึกข้อมูลได้', 'error')
  } finally {
    saving.value = false
  }
}

const uploadImage = async (e, callback) => {
  const file = e.target.files[0]
  if (!file) return

  uploadingImage.value = true
  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      callback(data.url)
      showToast('อัพโหลดสำเร็จ รูปภาพถูกอัพโหลดเรียบร้อยแล้ว', 'success')
    } else {
      throw new Error(data.error)
    }
  } catch (error) {
    showToast(`อัพโหลดล้มเหลว ${error.message || 'ไม่สามารถอัพโหลดรูปภาพได้'}`, 'error')
  } finally {
    uploadingImage.value = false
    e.target.value = ''
  }
}

// Helpers for Arrays
const addBannerBullet = () => bannerBullets.value.push('')
const removeBannerBullet = (index) => bannerBullets.value.splice(index, 1)
const addWhyBullet = () => whyChooseUsBullets.value.push('')
const removeWhyBullet = (index) => whyChooseUsBullets.value.splice(index, 1)

const addSlide = () => {
  slides.value.push({ 
    image: '', 
    tag: '', 
    titleLine1: '', 
    titleLine2: '', 
    desc: '', 
    ctaText: '', 
    ctaLink: '',
    cta2Text: 'ปรึกษาฟรีกับ AI',
    cta2Link: '/ai-consultant',
    showCta2: true,
    showHighlights: true,
    showFeatures: true,
    features: [
      { icon: 'shield', title: 'วัสดุคุณภาพ', desc: 'แข็งแรง ทนทาน' },
      { icon: 'sun', title: 'กันแดด กันฝน', desc: 'ทนทุกสภาพอากาศ' },
      { icon: 'wrench', title: 'ประกอบง่าย', desc: 'รวดเร็ว ไม่ยุ่งยาก' }
    ],
    highlights: [
      { icon: 'sun', label: 'จุดเด่น', title: 'กรองแสง UV ถนอมพืชพรรณ' },
      { icon: 'leaf', label: 'ความพิเศษ', title: 'วัสดุเป็นมิตรต่อต้นไม้' },
      { icon: 'wind', label: 'คุณสมบัติ', title: 'โครงสร้างต้านลมพายุ' }
    ]
  })
}
const removeSlide = (index) => slides.value.splice(index, 1)

const addStat = () => stats.value.push({ value: '', label: '' })
const removeStat = (index) => stats.value.splice(index, 1)

const addFeatureItem = () => featuresItems.value.push({ title: '', desc: '', icon: 'shield' })
const removeFeatureItem = (index) => featuresItems.value.splice(index, 1)

const addTestimonial = () => testimonials.value.push({ text: '', name: '', role: '', stars: 5, avatar: '', product: '', location: '', date: '' })
const removeTestimonial = (index) => testimonials.value.splice(index, 1)

const addPartner = () => partners.value.push({ name: '', logo_url: '' })
const removePartner = (index) => partners.value.splice(index, 1)

const addCorporateReview = () => corporateReviews.value.push({
  company: '',
  location: '',
  rating: 5,
  logo: 'scg',
  image: '',
  review: '',
  badge: '',
  badgeColor: 'orange',
  badgeIcon: 'wrench'
})
const removeCorporateReview = (index) => corporateReviews.value.splice(index, 1)

const addAffiliate = () => affiliates.value.push({ name: '', description: '', banner: '', url: '' })
const removeAffiliate = (index) => affiliates.value.splice(index, 1)

const addCategoryShowcase = () => categoryShowcase.value.push({ categoryId: '', productIds: [], isCollapsed: false })
const removeCategoryShowcase = (index) => categoryShowcase.value.splice(index, 1)

const getCategoryName = (categoryId) => {
  if (!categoryId) return ''
  const cat = availableCategories.value.find(c => String(c.id) === String(categoryId))
  return cat ? cat.name : ''
}

const shouldCollapse = (showcase, index) => {
  if (isDraggingShowcase.value) return true
  return showcase.isCollapsed === true
}

const collapseAllShowcases = () => {
  categoryShowcase.value.forEach(item => {
    item.isCollapsed = true
  })
}

const expandAllShowcases = () => {
  categoryShowcase.value.forEach(item => {
    item.isCollapsed = false
  })
}


// ============================================
// AI Content Generation Handlers
// ============================================

const generateSectionContent = async (sectionKey, promptMsg, formatInstruction) => {
  loadingSectionAI.value[sectionKey] = true
  try {
    const systemPromptText = `คุณคือนักการเขียน Copywriting มืออาชีพ สำหรับบริษัท ซีอาร์ ดิสทริบิวชั่น จำกัด แบรนด์ Morespace ผู้เชี่ยวชาญด้านบ้านน็อคดาวน์ โรงเก็บของ และโรงเรือนสไตล์มินิมอลเกรดพรีเมียมจากอเมริกา โทนภาษา: น่าเชื่อถือ พรีเมียม ทันสมัย และกระตุ้นให้อยากใช้บริการ ขอให้ตอบกลับเป็นรูปแบบ JSON ตามที่ระบุเท่านั้น โดยไม่ต้องมี markdown block`
    
    const userPromptText = `${promptMsg}\n\nรูปแบบ JSON ที่ต้องการ:\n${formatInstruction}`

    const res = await apiFetch('/api/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt: userPromptText,
        systemPrompt: systemPromptText
      })
    })

    const data = await res.json()
    
    if (!data.success) throw new Error(data.error || 'AI Generation Failed')
    
    // Parse JSON safely (data.data should already be parsed by AI route, but just in case it's stringified)
    let aiData = data.data
    if (typeof aiData === 'string') {
      try {
        const cleaned = aiData.replace(/```json\n?|```\n?/g, '').trim()
        aiData = JSON.parse(cleaned)
      } catch (e) {
        throw new Error('Invalid JSON format received from AI')
      }
    }

    showToast(`AI สร้างเนื้อหาสำเร็จ: สร้างเนื้อหาสำหรับ ${sectionKey} เรียบร้อย`, 'success')
    return aiData

  } catch (error) {
    console.error(`AI Error (${sectionKey}):`, error)
    showToast(`AI ผิดพลาด ไม่สามารถสร้างเนื้อหา ${sectionKey} ได้: ${error.message}`, 'error')
    return null
  } finally {
    loadingSectionAI.value[sectionKey] = false
  }
}

const generateHighlightCategoriesWithAI = async () => {
  const selectedItems = homeHighlightSettings.value.items.filter(item => item.categoryId);
  if (selectedItems.length === 0) {
    showToast('กรุณาเพิ่มหมวดหมู่ และเลือกหมวดหมู่อย่างน้อย 1 รายการก่อนให้ AI ช่วยเขียน', 'error');
    return;
  }

  const categoryNames = selectedItems.map((item, index) => {
    const cat = availableCategories.value.find(c => String(c.id) === String(item.categoryId));
    return `หมวดหมู่ที่ ${index + 1}: ${cat ? cat.name : 'ไม่ระบุ'}`;
  }).join('\n');

  const prompt = `ช่วยเขียนและปรับปรุงข้อความสำหรับส่วน "ไฮไลท์หมวดหมู่สินค้า" บนหน้าหลักของเว็บไซต์ โดยเน้นหลัก SEO และการตลาดที่ดึงดูดการคลิก (Call to Action) ให้ออกมาพรีเมียมและน่าเชื่อถือ
อิงจากหมวดหมู่ที่เลือกไว้ดังนี้:
${categoryNames}

ขอรูปแบบที่มี:
1. title: หัวข้อหลัก (เช่น คอลเลกชันพื้นที่เก็บของ)
2. titleHighlight: คำเด่นของหัวข้อหลักที่จะทำสีเขียว (เช่น ยอดนิยม)
3. subtitle: คำอธิบายรองที่ดึงดูดให้อยากกดดู สินค้าแข็งแรงทนทาน ดีไซน์มินิมอล
4. categoryDescriptions: อาร์เรย์ของคำอธิบายสั้นๆ (ประมาณ 1-2 บรรทัด) สำหรับแต่ละหมวดหมู่ เรียงตามลำดับด้านบน เน้นดึงจุดเด่นของแต่ละหมวดหมู่ออกมาให้กระตุ้นการตัดสินใจซื้อ`;

  const format = `{
  "title": "ข้อความหัวข้อหลักไม่มีคำเด่น",
  "titleHighlight": "คำเด่นสีเขียวที่จะต่อท้าย",
  "subtitle": "คำอธิบายรองเพื่อดึงดูดคลิก",
  "categoryDescriptions": [
    "คำอธิบายหมวดหมู่ที่ 1...",
    "คำอธิบายหมวดหมู่ที่ 2..."
  ]
}`;

  const data = await generateSectionContent('highlightCategories', prompt, format);
  if (data) {
    homeHighlightSettings.value.title = data.title || homeHighlightSettings.value.title;
    homeHighlightSettings.value.titleHighlight = data.titleHighlight || homeHighlightSettings.value.titleHighlight;
    homeHighlightSettings.value.subtitle = data.subtitle || homeHighlightSettings.value.subtitle;
    
    if (data.categoryDescriptions && Array.isArray(data.categoryDescriptions)) {
      let descIndex = 0;
      homeHighlightSettings.value.items.forEach(item => {
        if (item.categoryId && descIndex < data.categoryDescriptions.length) {
          item.customDesc = data.categoryDescriptions[descIndex];
          descIndex++;
        }
      });
    }
  }
}


const generateHeroSlidesWithAI = async () => {
  const prompt = `ช่วยเขียนสไลด์ 3 หน้า สำหรับแบนเนอร์ด้านบนสุดของเว็บไซต์ 
แต่ละสไลด์ควรมีธีมต่างกัน เช่น 1. ห้องเก็บของพรีเมียม 2. โรงเรือนต้นไม้ 3. บริการติดตั้ง 48 ชม.
โดยใช้ภาพประกอบแบบ Placeholder ตามความเหมาะสม (ภาพแนววิวสวยๆ จาก unsplash)`
  
  const format = `{
  "slides": [
    {
      "image": "url รูปภาพ (unsplash 1600x900)",
      "tag": "ข้อความ tag สั้นๆ เหนือหัวข้อ",
      "titleLine1": "หัวข้อบรรทัด 1",
      "titleLine2": "หัวข้อบรรทัด 2 (เน้นคำสำคัญ)",
      "desc": "คำอธิบายความยาว 1-2 บรรทัด",
      "ctaText": "ข้อความปุ่ม",
      "ctaLink": "ลิงก์ (เช่น /products, /ai-consultant)"
    }
  ]
}`

  const data = await generateSectionContent('slides', prompt, format)
  if (data && data.slides) {
    slides.value = data.slides
  }
}

const generateStatsWithAI = async () => {
  const prompt = `ช่วยคิดสถิติ 4 ตัวเลขที่น่าสนใจ เพื่อแสดงความน่าเชื่อถือของบริษัทเกี่ยวกับสถาปัตยกรรม Knockdown มินิมอล`
  const format = `{
  "stats": [
    { "value": "ตัวเลข (เช่น 5,000+, 10)", "label": "คำอธิบาย (เช่น ปีแห่งความไว้วางใจ)" }
  ]
}`

  const data = await generateSectionContent('stats', prompt, format)
  if (data && data.stats) {
    stats.value = data.stats
  }
}

const generateFeaturesWithAI = async () => {
  const prompt = `ช่วยเขียนข้อความแนะนำจุดเด่นของบริการ Morespace ประกอบด้วยหัวข้อหลัก, ย่อหน้าแนะนำ, และจุดเด่นย่อย 3 ข้อ (เช่น รับประกัน, ติดตั้งไว, วิเคราะห์งบด้วย AI)`
  const format = `{
  "featuresHeading": "คำโปรยสั้นๆ (อักษรตัวเล็ก)",
  "featuresTitle": "หัวข้อน่าสนใจ 1-2 บรรทัด (ใช้ <br> ขึ้นบรรทัดใหม่)",
  "featuresDesc": "คำอธิบายขยายความ",
  "featuresBadgeTitle": "หัวข้อตราประทับขนาดเล็กทับภาพ",
  "featuresBadgeDesc": "คำอธิบายตราประทับ",
  "featuresItems": [
    { "title": "หัวข้อจุดเด่น", "desc": "คำอธิบายจุดเด่นสั้นๆ" }
  ]
}`

  const data = await generateSectionContent('features', prompt, format)
  if (data) {
    featuresHeading.value = data.featuresHeading || ''
    featuresTitle.value = data.featuresTitle || ''
    featuresDesc.value = data.featuresDesc || ''
    featuresBadgeTitle.value = data.featuresBadgeTitle || ''
    featuresBadgeDesc.value = data.featuresBadgeDesc || ''
    if (data.featuresItems) featuresItems.value = data.featuresItems
  }
}

const generateTestimonialsWithAI = async () => {
  const prompt = `ลองแต่งรีวิวที่ดูสมจริงจากผู้ใช้งานบ้านเก็บของหรือโรงเรือน Morespace จำนวน 3 รีวิว โดยกำหนดข้อมูลสินค้า/บริการ พื้นที่ติดตั้ง และวันที่ติดตั้งให้สอดคล้องกัน`
  const format = `{
  "testimonials": [
    { "text": "ความประทับใจยาวๆ", "name": "ชื่อจริง หรือนามแฝง (เช่น คุณพลอยลภัส)", "role": "อาชีพ หรือจังหวัด", "stars": 5, "avatar": "", "product": "รุ่นสินค้า เช่น Premium-01", "location": "พื้นที่ เช่น อ.เมือง จ.เชียงใหม่", "date": "เดือน ปี เช่น ต.ค. 2568" }
  ]
}`

  const data = await generateSectionContent('testimonials', prompt, format)
  if (data && data.testimonials) {
    testimonials.value = data.testimonials
  }
}

const generateCTAWithAI = async () => {
  const prompt = `เขียนประโยคสำหรับแบนเนอร์ที่มีปุ่มกดเชิญชวนให้คนมาใช้บริการ หรือขอใบเสนอราคา`
  const format = `{
  "ctaTitle": "หัวข้อใหญ่ชวนดึงดูดใจ",
  "ctaDesc": "คำขยายความสร้างความมั่นใจ",
  "ctaButtonText": "ข้อความบนปุ่ม (เช่น ขอราคาด่วน)",
  "ctaButtonLink": "/quotation"
}`

  const data = await generateSectionContent('cta', prompt, format)
  if (data) {
    ctaTitle.value = data.ctaTitle || ''
    ctaDesc.value = data.ctaDesc || ''
    ctaButtonText.value = data.ctaButtonText || ''
    ctaButtonLink.value = data.ctaButtonLink || '/quotation'
  }
}

const generateAllWithAI = async () => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการสร้างเนื้อหาใหม่ทั้งหมด',
    message: 'คุณแน่ใจหรือไม่ว่าจะสุ่มสร้างเนื้อหาทั้งหมดขึ้นมาใหม่? การกระทำนี้จะเปลี่ยนค่าในฟิลด์ที่เห็นอยู่ทันที (แต่ยังไม่ถูกบันทึกลง Database จนกว่าคุณจะกดบันทึก)',
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    type: 'warning'
  })
  if (!isConfirmed) return

  loadingAI.value = true
  showToast('กำลังคัดสรรเนื้อหา... AI เริ่มดำเนินการในแต่ละส่วนแล้ว กรุณารอสักครู่', 'success')
  
  try {
    await Promise.all([
      generateHeroSlidesWithAI(),
      generateHighlightCategoriesWithAI(),
      generateStatsWithAI(),
      generateFeaturesWithAI(),
      generateTestimonialsWithAI(),
      generateCTAWithAI()
    ])
    showToast('สร้างเนื้อหาหน้าแรกสำเร็จ กรุณาตรวจสอบและแก้ไขรายละเอียดให้ตรงตามต้องการ', 'success')
  } catch (err) {
    console.error('Master AI Error:', err)
  } finally {
    loadingAI.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="h-full flex flex-col pb-24">
    <div class="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">จัดการหน้าหลัก (Homepage)</h1>
        <p class="text-gray-500 mt-1 flex items-center gap-1">ตั้งค่าและจัดการเนื้อหาทั้งหมดบนหน้าแรกของเว็บไซต์
          <InfoTooltip title="หน้าหลัก (Homepage) คืออะไร?" description="หน้านี้ควบคุมเนื้อหาทั้งหมดที่แสดงบนหน้าแรกของเว็บไซต์ แบ่งเป็นแท็บต่างๆ ดังนี้:<ul><li><strong>แบนเนอร์สไลด์:</strong> รูปภาพขนาดใหญ่ด้านบน แนะนำ 1920×700 px</li><li><strong>สถิติ & จุดเด่น:</strong> ตัวเลขความน่าเชื่อถือและจุดเด่นบริการ</li><li><strong>หมวดหมู่ & สินค้า:</strong> เลือกหมวดหมู่และสินค้าที่ต้องการโชว์</li><li><strong>AI สร้างเนื้อหา:</strong> กดปุ่ม AI เพื่อให้ระบบเขียนข้อความให้อัตโนมัติ</li></ul><strong>สำคัญ:</strong> กดบันทึกทุกครั้งที่แก้ไข ข้อมูลจะขึ้นหน้าเว็บทันที" />
        </p>
      </div>
      <button type="button" @click="generateAllWithAI" :disabled="loadingAI" class="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/30 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
        <svg v-if="loadingAI" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-50" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
        {{ loadingAI ? 'กำลังใช้ AI สร้างเนื้อหา...' : 'สร้างเนื้อหาทั้งหมดอัตโนมัติ (AI)' }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      กำลังดึงข้อมูล...
    </div>

    <div v-else class="w-full space-y-6">
      <!-- Tab Navigation -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 flex flex-wrap gap-1">
        <button v-for="tab in tabs" :key="tab.key" type="button" @click="activeTab = tab.key"
          :class="[activeTab === tab.key ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900', 'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200']">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"></path></svg>
          {{ tab.label }}
        </button>
      </div>

      <form @submit.prevent="saveSettings">
        <!-- ==================== TAB: แบนเนอร์แนะนำ & Bento ==================== -->
        <div v-show="activeTab === 'banners'" class="space-y-6">
          <!-- 1. Top Hero Banner -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
              <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span class="text-sm font-bold text-orange-800">ส่วนที่ 1: แบนเนอร์ฮีโร่ด้านบน (Hero Banner)</span>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกำกับด้านบนสุด (Tag Line)</label>
                  <input type="text" v-model="bannerTag" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก (Title)</label>
                  <input type="text" v-model="bannerTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อรอง (Subtitle)</label>
                  <input type="text" v-model="bannerSubtitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกลม - หัวข้อหลัก (e.g. สินค้าขายดี)</label>
                  <input type="text" v-model="bannerBadgeText" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกลม - หัวข้อย่อย (e.g. อันดับ 1)</label>
                  <input type="text" v-model="bannerBadgeSub" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-2">รูปภาพแบนเนอร์ด้านขวา</label>
                  <div 
                    class="aspect-video bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden relative group flex items-center justify-center transition"
                    @dragover.prevent
                    @drop.prevent="e => handleFileDrop(e, url => bannerImage = url)"
                  >
                    <img v-if="bannerImage" :src="bannerImage" @error="bannerImage = ''" class="w-full h-full object-cover" />
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4">
                      <svg class="w-8 h-8 mb-2 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      <span class="text-[10px] font-bold text-gray-500">ลากไฟล์มาวาง หรือ คลิกเพื่ออัพโหลด</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label class="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                        {{ bannerImage ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
                        <input type="file" class="hidden" accept="image/*" @change="e => uploadImage(e, url => bannerImage = url)">
                      </label>
                      <button v-if="bannerImage" type="button" @click="bannerImage = ''" class="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-700 transition">
                        ลบรูป
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bullet items list -->
              <div class="border-t border-gray-150 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-gray-700">จุดเด่นย่อยบนแบนเนอร์ (Bullets - แนะนำ 4 รายการ)</span>
                  <button type="button" @click="addBannerBullet" class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                    เพิ่มรายการ
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="(bullet, index) in bannerBullets" :key="index" class="flex items-center gap-2">
                    <input type="text" v-model="bannerBullets[index]" class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" />
                    <button type="button" @click="removeBannerBullet(index)" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. Left Sidebar Promo Card -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
              <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <span class="text-sm font-bold text-orange-800">ส่วนที่ 2: การ์ดโฆษณาด้านซ้าย (Promo Card)</span>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกำกับ (Tag)</label>
                  <input type="text" v-model="promoTag" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก (Title)</label>
                  <input type="text" v-model="promoTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย (Description)</label>
                  <input type="text" v-model="promoDesc" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความปุ่มกด (Button Text)</label>
                  <input type="text" v-model="promoBtnText" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ลิงก์ของปุ่มกด (Button Link)</label>
                  <input type="text" v-model="promoBtnLink" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-700 mb-2">รูปภาพสินค้าการ์ดซ้าย</label>
                  <div 
                    class="aspect-video bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden relative group flex items-center justify-center transition"
                    @dragover.prevent
                    @drop.prevent="e => handleFileDrop(e, url => promoImage = url)"
                  >
                    <img v-if="promoImage" :src="promoImage" @error="promoImage = ''" class="w-full h-full object-cover" />
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4">
                      <svg class="w-8 h-8 mb-2 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      <span class="text-[10px] font-bold text-gray-500">ลากไฟล์มาวาง หรือ คลิกเพื่ออัพโหลด</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <label class="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                        {{ promoImage ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
                        <input type="file" class="hidden" accept="image/*" @change="e => uploadImage(e, url => promoImage = url)">
                      </label>
                      <button v-if="promoImage" type="button" @click="promoImage = ''" class="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-700 transition">
                        ลบรูป
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Why Choose Us Checklist -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div class="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
              <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span class="text-sm font-bold text-orange-800">ส่วนที่ 3: เช็คลิสต์ทำไมต้องเลือกเรา (Why Choose Us)</span>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อส่วนเช็คลิสต์ (Title)</label>
                <input type="text" v-model="whyChooseUsTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
              </div>

              <div class="border-t border-gray-150 pt-4">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-gray-700">จุดขายเด่นสะท้อนความไว้วางใจ (Bullets - แนะนำ 6 รายการ)</span>
                  <button type="button" @click="addWhyBullet" class="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
                    เพิ่มรายการ
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="(bullet, index) in whyChooseUsBullets" :key="index" class="flex items-center gap-2">
                    <input type="text" v-model="whyChooseUsBullets[index]" class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" />
                    <button type="button" @click="removeWhyBullet(index)" class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ==================== TAB: หมวดหมู่ & สินค้า ==================== -->
        <div v-show="activeTab === 'categories'">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="flex items-center justify-between p-6" :class="homeShowHighlightCategories ? 'bg-gray-50 border-b border-gray-100' : ''">
            <div>
              <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                ส่วนไฮไลท์หมวดหมู่สินค้ายอดนิยม (Highlight Categories)
              </h2>
              <p class="text-xs text-gray-500 mt-1">ตั้งค่าเปิด-ปิดและแก้ไขรายละเอียดในส่วนที่เป็นเนื้อหาแนะนำหมวดหมู่และสินค้าเด่น บนหน้าหลัก</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="homeShowHighlightCategories" class="sr-only peer">
              <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <!-- Highlight Category Settings Content (Visible if toggle is ON) -->
          <div v-show="homeShowHighlightCategories" class="p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก</label>
                <input type="text" v-model="homeHighlightSettings.title" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="หมวดหมู่สินค้าขายดี">
              </div>
              <div>
                <label class="block text-xs font-bold text-gray-600 mb-1">คำเน้น (สีเขียว)</label>
                <input type="text" v-model="homeHighlightSettings.titleHighlight" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="ยอดนิยม">
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบายรอง (Subtitle)</label>
              <input type="text" v-model="homeHighlightSettings.subtitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="ค้นพบโซลูชันพื้นที่เก็บของที่ดีที่สุด...">
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 mt-6 gap-2">
              <h3 class="font-bold text-gray-800">เลือกหมวดหมู่หลัก และสินค้ารุ่นแนะนำ (สามารถเพิ่ม/ลบได้ตามต้องการ)</h3>
              <button type="button" @click="generateHighlightCategoriesWithAI" :disabled="loadingSectionAI.highlightCategories" class="text-sm font-bold text-violet-600 hover:text-violet-700 bg-violet-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition disabled:opacity-50 whitespace-nowrap">
                <svg v-if="loadingSectionAI.highlightCategories" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-50" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                {{ loadingSectionAI.highlightCategories ? 'AI กำลังคิด...' : 'สร้างเนื้อหาด้วย AI' }}
              </button>
            </div>
            
            <draggable
              v-model="homeHighlightSettings.items"
              tag="div"
              class="space-y-6"
              item-key="categoryId"
              handle=".highlight-drag-handle"
              :animation="250"
              ghost-class="showcase-ghost"
              drag-class="showcase-drag"
            >
              <template #item="{ element: item, index }">
                <div class="relative p-5 border border-gray-200 rounded-xl bg-gray-50 group">
                  <div class="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                    <div class="cursor-grab active:cursor-grabbing text-gray-500 p-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition highlight-drag-handle" title="ลากเพื่อจัดลำดับ">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </div>
                    <button type="button" @click="removeHighlightCategory(index)" class="text-red-400 hover:text-red-500 transition-colors" title="ลบหมวดหมู่นี้" v-if="homeHighlightSettings.items.length > 1">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
              <div class="flex items-center gap-3 mb-4 pr-8">
                <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">No. {{ index + 1 }}</div>
                <h4 class="font-bold text-gray-700">ลำดับที่ {{ index + 1 }}</h4>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">เลือกหมวดหมู่</label>
                  <AdminCategoryDropdown v-model="item.categoryId" :categories="availableCategories" placeholder="- เลือกหมวดหมู่ -" />
                </div>
                
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบายที่แสดงแทน (ถ้าเว้นว่างจะใช้คำอธิบายจากหมวดหมู่)</label>
                  <textarea v-model="item.customDesc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="ดีไซน์ทันสมัย สไตล์มินิมอล แข็งแรง ทนทานทุกสภาวะอากาศ..."></textarea>
                </div>

                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">เลือกสินค้ารุ่นแนะนำ (เลือกได้สูงสุด 3 รุ่น) (ถ้าเว้นว่าง ระบบจะดึงล่าสุดอัตโนมัติ)</label>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <AdminProductDropdown v-model="item.productIds[0]" :products="getProductsByCategory(item.categoryId)" placeholder="- สินค้าที่ 1 -" />
                    <AdminProductDropdown v-model="item.productIds[1]" :products="getProductsByCategory(item.categoryId)" placeholder="- สินค้าที่ 2 -" />
                    <AdminProductDropdown v-model="item.productIds[2]" :products="getProductsByCategory(item.categoryId)" placeholder="- สินค้าที่ 3 -" />
                  </div>
                </div>
              </div>
                </div>
              </template>
            </draggable>

            <button type="button" @click="addHighlightCategory" class="mt-4 w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
              เพิ่มหมวดหมู่ไฮไลท์
            </button>
          </div>
        </div>

        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วนหมวดหมู่</span>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก</label><input type="text" v-model="sectionTitles.categoriesTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">คำเน้นสีเขียว</label><input type="text" v-model="sectionTitles.categoriesTitleHighlight" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย</label><input type="text" v-model="sectionTitles.categoriesDesc" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
          </div>
        </div>

        </div><!-- END TAB categories -->



        <!-- ==================== TAB: ขั้นตอนบริการ ==================== -->
        <div v-show="activeTab === 'content'">
        <!-- How It Works / Section Titles Customization -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  แก้ไข 4 ขั้นตอนการบริการ (How It Works)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงส่วนขั้นตอนบริการบนหน้าหลัก</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" v-model="homeShowHowItWorks" class="sr-only peer">
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <button v-if="homeShowHowItWorks" type="button" @click="addHowItWorksStep" class="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                  เพิ่มขั้นตอน
                </button>
              </div>
            </div>
          </div>
          <div v-if="homeShowHowItWorks" class="p-6">
            <div class="space-y-4">
              <div v-for="(step, index) in howItWorksSteps" :key="'hiw-'+index" class="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm group">
                <button type="button" @click="removeHowItWorksStep(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="ลบขั้นตอน">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="flex items-center gap-2 mb-3">
                  <span class="font-black text-indigo-100 text-3xl">STEP {{ index + 1 }}</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อ (Title)</label><input type="text" v-model="step.title" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></div>
                  <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อย่อย (Subtitle)</label><input type="text" v-model="step.subtitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">ไอคอน (Icon Name)</label>
                    <select v-model="step.icon" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                      <option value="chat">Chat (ปรึกษา)</option>
                      <option value="search">Search (สำรวจ/ค้นหา)</option>
                      <option value="truck">Truck (จัดส่ง/รถ)</option>
                      <option value="shield">Shield (โล่/รับประกัน)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">สีหลัก (Color Theme)</label>
                    <select v-model="step.color" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                      <option value="emerald">Emerald (เขียว)</option>
                      <option value="blue">Blue (น้ำเงิน)</option>
                      <option value="amber">Amber (ส้มเหลือง)</option>
                      <option value="violet">Violet (ม่วง)</option>
                    </select>
                  </div>
                  <div><label class="block text-xs font-bold text-gray-600 mb-1">ระยะเวลา (Duration)</label><input type="text" v-model="step.duration" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></div>
                  <div></div>
                  <div class="md:col-span-2">
                    <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย (Description)</label>
                    <textarea v-model="step.desc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วนขั้นตอนบริการ</span>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อเล็กบนสุด</label><input type="text" v-model="sectionTitles.howItWorksTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก</label><input type="text" v-model="sectionTitles.howItWorksHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย</label><input type="text" v-model="sectionTitles.howItWorksDesc" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
          </div>
        </div>

        </div><!-- END TAB content -->

        <!-- ==================== TAB: คำถามที่พบบ่อย ==================== -->
        <div v-show="activeTab === 'faq'">
        <!-- FAQ Customization -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  คำถามที่พบบ่อย (FAQ)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงส่วนคำถามที่พบบ่อยบนหน้าหลัก</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input type="checkbox" v-model="homeShowFaq" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div v-if="homeShowFaq" class="mt-3">
              <button type="button" @click="addFaqItem" class="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                เพิ่มคำถามใหม่
              </button>
            </div>
          </div>
          <div v-if="homeShowFaq" class="p-6">
            <div class="space-y-4">
              <div v-for="(item, index) in faqItems" :key="'faq-'+index" class="relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm group">
                <button type="button" @click="removeFaqItem(index)" class="absolute top-4 right-4 text-red-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="ลบคำถาม">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <div class="space-y-4 max-w-[95%]">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="md:col-span-2">
                      <label class="block text-xs font-bold text-gray-600 mb-1">คำถาม (Q)</label>
                      <input type="text" v-model="item.q" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="เช่น ทนแดด ทนฝน ไหม?">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">ไอคอน (Icon)</label>
                        <select v-model="item.icon" class="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                          <option value="">เริ่มต้น (ตามลำดับ)</option>
                          <option value="home">บ้าน (Home)</option>
                          <option value="clock">นาฬิกา (Clock)</option>
                          <option value="measure">ตลับเมตร (Ruler)</option>
                          <option value="truck">ขนส่ง (Truck)</option>
                          <option value="wallet">การเงิน/ผ่อน (Wallet)</option>
                          <option value="chat">แชท (Chat)</option>
                          <option value="shield">รับประกัน (Shield)</option>
                          <option value="help">ช่วยเหลือ (Help)</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">โทนสี (Color)</label>
                        <select v-model="item.color" class="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-emerald-500">
                          <option value="">เริ่มต้น (ตามลำดับ)</option>
                          <option value="orange">ส้ม (Orange)</option>
                          <option value="blue">ฟ้า (Blue)</option>
                          <option value="purple">ม่วง (Purple)</option>
                          <option value="emerald">เขียว (Emerald)</option>
                          <option value="pink">ชมพู (Pink)</option>
                          <option value="indigo">น้ำเงิน (Indigo)</option>
                          <option value="amber">เหลือง (Amber)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">คำตอบ (A)</label>
                    <textarea v-model="item.a" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="อธิบายคำตอบแบบละเอียด..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วน FAQ</span>
          </div>
          <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อเล็กบนสุด</label><input type="text" v-model="sectionTitles.faqTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก</label><input type="text" v-model="sectionTitles.faqHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            <div><label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย</label><input type="text" v-model="sectionTitles.faqDesc" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
          </div>
        </div>

        </div><!-- END TAB faq -->

        <!-- ==================== TAB: แบนเนอร์สไลด์ ==================== -->
        <div v-show="activeTab === 'slider'">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              แบนเนอร์ภาพสไลด์ (Hero Slider)
            </h2>
            <div class="flex items-center gap-2">
              <button type="button" @click="generateHeroSlidesWithAI" :disabled="loadingSectionAI.slides" class="text-sm bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 disabled:opacity-50">
                <svg v-if="loadingSectionAI.slides" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> ใช้ AI เขียนเนื้อหาสไลด์
              </button>
              <button type="button" @click="addSlide" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มสไลด์
              </button>
            </div>
          </div>
          <div class="p-6 space-y-6">
            <div v-if="slides.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              ยังไม่มีสไลด์ กดปุ่ม "+ เพิ่มสไลด์" ด้านบน
            </div>
            
            <draggable
              v-model="slides"
              tag="div"
              class="space-y-6"
              item-key="image"
              handle=".slide-drag-handle"
              :animation="250"
              ghost-class="showcase-ghost"
              drag-class="showcase-drag"
            >
              <template #item="{ element: slide, index }">
                <div class="p-5 border border-gray-200 rounded-xl bg-gray-50 relative">
                  <div class="absolute top-4 right-4 flex items-center gap-1.5">
                    <div class="cursor-grab active:cursor-grabbing text-gray-500 p-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition slide-drag-handle" title="ลากเพื่อจัดลำดับ">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </div>
                    <button type="button" @click="removeSlide(index)" class="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition" title="ลบสไลด์">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
              
              <div class="flex items-center gap-3 mb-4">
                <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">{{ index + 1 }}</div>
                <h3 class="font-bold text-gray-700">ลำดับสไลด์ {{ index + 1 }}</h3>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Image Upload -->
                <div class="lg:col-span-4">
                  <label class="block text-sm font-bold text-gray-700 mb-2">รูปภาพพื้นหลัง</label>
                  <div class="aspect-video bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative group">
                    <img v-if="slide.image" :src="slide.image" @error="slide.image = ''" class="w-full h-full object-cover">
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span class="text-xs font-medium">อัพโหลดรูปภาพ</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <label class="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                        {{ slide.image ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
                        <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => slide.image = url)">
                      </label>
                    </div>
                  </div>
                </div>

                <!-- Text Inputs -->
                <div class="lg:col-span-8 space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกำกับ (Tag)</label>
                      <input type="text" v-model="slide.tag" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น: ที่สุดแห่งนวัตกรรม">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบรรทัด 1</label>
                      <input type="text" v-model="slide.titleLine1" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เนรมิตพื้นที่ว่างเปล่า">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบรรทัด 2 (เน้นสี)</label>
                      <input type="text" v-model="slide.titleLine2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เป็นสถาปัตยกรรมระดับพรีเมียม">
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย</label>
                    <textarea v-model="slide.desc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="บอกลาห้องเก็บของ..."></textarea>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความปุ่ม CTA 1</label>
                      <input type="text" v-model="slide.ctaText" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="ดูคอลเลกชันทั้งหมด">
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">ลิงก์ปุ่ม CTA 1</label>
                      <input type="text" v-model="slide.ctaLink" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="/products">
                    </div>
                  </div>

                  <!-- New: Button 2 Settings -->
                  <div class="border-t border-gray-100 pt-4 mt-2">
                    <p class="text-xs font-bold text-indigo-600 mb-3 flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                      การตั้งค่าปุ่มกดปุ่มที่ 2 (Secondary CTA)
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div class="flex items-center">
                        <label class="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" v-model="slide.showCta2" class="sr-only peer">
                          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          <span class="ml-2 text-xs font-bold text-gray-600">เปิดแสดงปุ่มที่ 2</span>
                        </label>
                      </div>
                      <div v-if="slide.showCta2">
                        <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความปุ่ม 2</label>
                        <input type="text" v-model="slide.cta2Text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เช่น ปรึกษาฟรีกับ AI">
                      </div>
                      <div v-if="slide.showCta2">
                        <label class="block text-xs font-bold text-gray-600 mb-1">ลิงก์ปุ่ม 2</label>
                        <input type="text" v-model="slide.cta2Link" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-500 focus:ring-2 focus:ring-emerald-500" placeholder="เช่น /ai-consultant">
                      </div>
                    </div>
                  </div>

                  <!-- New: Floating Highlights Editor (Right side overlays) -->
                  <div class="border-t border-gray-100 pt-4 mt-2">
                    <div class="flex items-center justify-between mb-3">
                      <p class="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7.104 9.006c-.461-.005-.838-.344-.928-.797C5.362 5.093 7.201 2 7.201 2s.22.617.575 1.157c1.378 2.091 5.021 3.256 5.228 6.843.048.835-.116 1.666-.464 2.428-.439.96-.328 1.93.303 2.74A2.001 2.001 0 0016 14c0-.987-.406-1.897-1.085-2.573C15.827 12.339 17 13.593 17 15c0 1.344-.52 2.605-1.464 3.535l2.121.122z"></path></svg>
                        สติกเกอร์ไฮไลท์ลอยบนรูปภาพขวา (3 จุด)
                      </p>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="slide.showHighlights" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span class="ml-2 text-xs font-bold text-gray-600">เปิดแสดงไฮไลท์</span>
                      </label>
                    </div>
                    <div v-show="slide.showHighlights" class="space-y-3">
                      <div v-for="(hl, hIdx) in slide.highlights" :key="'hl-'+hIdx" class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">ไอคอนจุดที่ {{ hIdx + 1 }}</label>
                          <select v-model="hl.icon" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500">
                            <option value="sun">Sun (พระอาทิตย์)</option>
                            <option value="leaf">Leaf (ใบไม้)</option>
                            <option value="wind">Wind (สายลม)</option>
                            <option value="shield">Shield (โล่ป้องกัน)</option>
                            <option value="star">Star (ดาว)</option>
                            <option value="medal">Medal (เหรียญรางวัล)</option>
                            <option value="tag">Tag (ป้ายราคาสินค้า)</option>
                            <option value="cube">Cube (กล่องสามมิติ)</option>
                            <option value="heart">Heart (หัวใจ)</option>
                            <option value="thumbs-up">Thumbs Up (ไลก์)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">ป้ายกำกับ (เช่น จุดเด่น, ความพิเศษ)</label>
                          <input type="text" v-model="hl.label" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500" placeholder="ป้ายกำกับ">
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">ข้อความดีเทล (เช่น กรองแสง UV)</label>
                          <input type="text" v-model="hl.title" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500" placeholder="ข้อความรายละเอียด">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- New: Bottom Features Editor (3 Items) -->
                  <div class="border-t border-gray-100 pt-4 mt-2">
                    <div class="flex items-center justify-between mb-3">
                      <p class="text-xs font-bold text-indigo-600 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        คุณสมบัติย่อย 3 ช่องด้านล่างสไลด์
                      </p>
                      <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="slide.showFeatures" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span class="ml-2 text-xs font-bold text-gray-600">เปิดแสดงคุณสมบัติย่อย</span>
                      </label>
                    </div>
                    <div v-show="slide.showFeatures" class="space-y-3">
                      <div v-for="(feat, fIdx) in slide.features" :key="'feat-'+fIdx" class="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">ไอคอนช่องที่ {{ fIdx + 1 }}</label>
                          <select v-model="feat.icon" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500">
                            <option value="shield">Shield (โล่ป้องกัน)</option>
                            <option value="sun">Sun (กันแดด)</option>
                            <option value="cloud">Cloud (กันฝน)</option>
                            <option value="wrench">Wrench (ประแจ/ติดตั้ง)</option>
                            <option value="cog">Cog (เฟือง)</option>
                            <option value="hammer">Hammer (ค้อน)</option>
                            <option value="truck">Truck (จัดส่ง)</option>
                            <option value="clock">Clock (เวลา/รับประกัน)</option>
                            <option value="leaf">Leaf (ธรรมชาติ)</option>
                            <option value="tools">Tools (เครื่องมือ)</option>
                            <option value="home">Home (บ้าน)</option>
                            <option value="cube">Cube (กล่อง)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">หัวข้อคุณสมบัติ</label>
                          <input type="text" v-model="feat.title" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500" placeholder="เช่น วัสดุคุณภาพ">
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-0.5">รายละเอียดประกอบ</label>
                          <input type="text" v-model="feat.desc" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-emerald-500" placeholder="เช่น แข็งแรง ทนทาน">
                        </div>
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
        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วนสินค้าแนะนำ (Showcase Section)</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกำกับเหนือหัวข้อ (Badge)</label><input type="text" v-model="sectionTitles.showcaseBadge" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เช่น คอลเลกชันยอดฮิตสินค้าแนะนำ"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">ข้อความปุ่มดูทั้งหมด</label><input type="text" v-model="sectionTitles.showcaseViewAllText" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เช่น ดูรุ่นทั้งหมด (100+)"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก (Title)</label><input type="text" v-model="sectionTitles.showcaseTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เช่น สินค้าแนะนำ"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อไฮไลท์ (Title Highlight)</label><input type="text" v-model="sectionTitles.showcaseTitleHighlight" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เช่น ที่ออกแบบเป็นพิเศษ"></div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบายใต้หัวข้อ</label><input type="text" v-model="sectionTitles.collectionDesc" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="คำอธิบายเพิ่มเติม"></div>
            </div>
          </div>
        </div>

        </div><!-- END TAB slider -->

        <!-- ==================== TAB: สถิติ & จุดเด่น ==================== -->
        <div v-show="activeTab === 'hero'">
        <!-- Stats Counter Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                  ตัวเลขสถิติ (Stats Counter)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงตัวเลขสถิติบนหน้าหลัก</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" v-model="homeShowStats" class="sr-only peer">
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
            <div v-if="homeShowStats" class="flex items-center gap-2 mt-3">
              <button type="button" @click="generateStatsWithAI" :disabled="loadingSectionAI.stats" class="text-sm bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 disabled:opacity-50">
                <svg v-if="loadingSectionAI.stats" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> ใช้ AI สร้างตัวเลขสถิติ
              </button>
              <button type="button" @click="addStat" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มสถิติ
              </button>
            </div>
          </div>
          <div class="p-6">
            <div v-if="stats.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl mb-4">
              ยังไม่มีสถิติ (แนะนำให้ใส่ 3-4 รายการ เช่น "5,000+", "โปรเจกต์ทั่วประเทศ")
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div v-for="(stat, index) in stats" :key="index" class="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                <button type="button" @click="removeStat(index)" class="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition" title="ลบสถิติ">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">ตัวเลข (Value)</label>
                    <input type="text" v-model="stat.value" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น: 10+, 5,000">
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความ (Label)</label>
                    <input type="text" v-model="stat.label" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น: ปีแห่งประสบการณ์">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                  จุดเด่น (Features)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงส่วนจุดเด่นบนหน้าหลัก</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input type="checkbox" v-model="homeShowFeatures" class="sr-only peer">
                  <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <button v-if="homeShowFeatures" type="button" @click="generateFeaturesWithAI" :disabled="loadingSectionAI.features" class="text-sm bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 disabled:opacity-50">
                  <svg v-if="loadingSectionAI.features" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> ใช้ AI เขียนจุดเด่นบริการ
                </button>
              </div>
            </div>
          </div>
          <div v-if="homeShowFeatures" class="p-6 space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <!-- Left: Text content -->
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">ป้ายกำกับ (Heading)</label>
                  <input type="text" v-model="featuresHeading" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="จุดหมายแห่งความสมบูรณ์แบบ">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อหลัก (Title)</label>
                  <input type="text" v-model="featuresTitle" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เปลี่ยนทุกตารางนิ้วให้คุ้มค่า (ใช้ <br> ขึ้นบรรทัดใหม่ได้)">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย (Description)</label>
                  <textarea v-model="featuresDesc" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เหนือกว่าด้วยวัสดุเกรดพรีเมียม..."></textarea>
                </div>
                
                <div class="border-t border-gray-100 pt-4 mt-2">
                  <div class="flex justify-between items-center mb-3">
                    <label class="block text-sm font-bold text-gray-700">รายการจุดเด่นย่อย (3 รายการ)</label>
                    <button type="button" @click="addFeatureItem" v-if="featuresItems.length < 5" class="text-xs text-emerald-600 font-bold hover:underline">+ เพิ่มรายการ</button>
                  </div>
                  <div class="space-y-3">
                    <div v-for="(item, index) in featuresItems" :key="index" class="p-3 bg-gray-50 border border-gray-200 rounded-xl relative group">
                      <button type="button" @click="removeFeatureItem(index)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                        <div class="md:col-span-3">
                          <input type="text" v-model="item.title" class="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-bold focus:ring-2 focus:border-emerald-500" placeholder="หัวข้อย่อย">
                        </div>
                        <div>
                          <select v-model="item.icon" class="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:border-emerald-500">
                            <option value="shield">🛡️ โล่ป้องกัน</option>
                            <option value="bolt">⚡ สายฟ้า</option>
                            <option value="lightbulb">💡 หลอดไฟ</option>
                            <option value="star">⭐ ดาว</option>
                            <option value="tools">🔧 เครื่องมือ</option>
                            <option value="check">✔️ สำเร็จ</option>
                            <option value="heart">❤️ ใส่ใจ</option>
                          </select>
                        </div>
                      </div>
                      <input type="text" v-model="item.desc" class="w-full border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:border-emerald-500" placeholder="คำอธิบายสั้นๆ">
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Right: Image & Badge -->
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-2">รูปภาพประกอบ</label>
                  <div class="aspect-[4/3] bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 overflow-hidden relative group">
                    <img v-if="featuresImage" :src="featuresImage" @error="featuresImage = ''" class="w-full h-full object-cover">
                    <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                      <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      <span class="text-xs">อัพโหลดรูปภาพ (แนวตั้ง)</span>
                    </div>
                    <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <label class="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                        {{ featuresImage ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
                        <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => featuresImage = url)">
                      </label>
                    </div>
                  </div>
                </div>
                
                <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-3">
                  <h4 class="text-xs font-bold text-emerald-800 flex items-center gap-1"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> การ์ดจุดเด่นประกอบรูปภาพฝั่งขวา</h4>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-500 mb-1">หัวข้อการ์ด (เช่น เหมาะสำหรับทุกการใช้งาน)</label>
                    <input type="text" v-model="featuresBadgeTitle" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="เหมาะสำหรับทุกการใช้งาน">
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-500 mb-1">รายการจุดเด่นย่อย (พิมพ์ 1 รายการต่อ 1 บรรทัด)</label>
                    <textarea v-model="featuresBadgeDesc" rows="4" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="เก็บอุปกรณ์ทำสวน&#10;จัดเก็บเครื่องมือช่าง&#10;ห้องเก็บของอเนกประสงค์"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div><!-- END TAB hero -->

        <!-- ==================== TAB: รีวิว & พาร์ทเนอร์ ==================== -->
        <div v-show="activeTab === 'social'">
        <!-- Testimonials -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  รีวิวจากลูกค้า (Testimonials)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงส่วนรีวิวจากลูกค้าบนหน้าหลัก</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input type="checkbox" v-model="homeShowTestimonials" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div v-if="homeShowTestimonials" class="flex items-center gap-2 mt-3">
              <button type="button" @click="generateTestimonialsWithAI" :disabled="loadingSectionAI.testimonials" class="text-sm bg-violet-50 text-violet-700 hover:bg-violet-100 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 disabled:opacity-50">
                <svg v-if="loadingSectionAI.testimonials" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> ใช้ AI เขียนรีวิวลูกค้า
              </button>
              <button type="button" @click="addTestimonial" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มรีวิว
              </button>
            </div>
          </div>
          <div v-if="homeShowTestimonials" class="p-6">
            <div v-if="testimonials.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl mb-4">
              ยังไม่มีรีวิว (ควรมี 3 รีวิวเพื่อให้จัดวางพอดี)
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="(review, index) in testimonials" :key="index" class="p-5 border border-gray-200 rounded-2xl bg-gray-50 relative group">
                <button type="button" @click="removeTestimonial(index)" class="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition" title="ลบรีวิว"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความรีวิว</label>
                    <textarea v-model="review.text" rows="3" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="ประทับใจตั้งแต่เซลล์ให้คำปรึกษา..."></textarea>
                  </div>
                  
                  <!-- Avatar Image Upload & Link -->
                  <div class="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100">
                    <div class="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative group flex-shrink-0 flex items-center justify-center">
                      <img v-if="review.avatar" :src="review.avatar" class="w-full h-full object-cover">
                      <div v-else class="w-full h-full flex items-center justify-center font-bold text-sm bg-orange-100 text-orange-700">
                        {{ (review.name || 'A').charAt(0) }}
                      </div>
                      <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <label class="cursor-pointer text-white text-[9px] font-bold">
                          อัพโหลด
                          <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => review.avatar = url)">
                        </label>
                      </div>
                    </div>
                    <div class="flex-grow">
                      <label class="block text-[10px] font-bold text-gray-600 mb-1">รูปโปรไฟล์ (URL)</label>
                      <div class="flex gap-1">
                        <input type="text" v-model="review.avatar" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500" placeholder="https://...">
                        <button v-if="review.avatar" type="button" @click="review.avatar = ''" class="text-[10px] text-red-500 hover:text-red-700 border border-gray-200 px-1.5 rounded" title="ลบรูป">ลบ</button>
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-600 mb-1">ชื่อลูกค้า</label>
                      <input type="text" v-model="review.name" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-bold focus:ring-1 focus:border-emerald-500" placeholder="คุณสุรศักดิ์ ท.">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-600 mb-1">ตำแหน่ง/จังหวัด</label>
                      <input type="text" v-model="review.role" class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="กรุงเทพฯ">
                    </div>
                  </div>
                  <div>
                    <label class="block text-[10px] font-bold text-gray-600 mb-1">จำนวนดาว (1-5)</label>
                    <input type="number" v-model="review.stars" min="1" max="5" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500">
                  </div>

                  <!-- Additional Metadata -->
                  <div class="border-t border-gray-200 pt-2.5 mt-2.5">
                    <span class="block text-[9px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">รายละเอียดงานติดตั้ง (แสดงใต้รีวิว)</span>
                    <div class="grid grid-cols-3 gap-1.5">
                      <div>
                        <label class="block text-[9px] font-bold text-gray-600 mb-0.5">สินค้า/บริการ</label>
                        <input type="text" v-model="review.product" class="w-full border border-gray-300 rounded-lg px-1.5 py-1 text-[10px] focus:ring-1 focus:border-emerald-500" placeholder="รุ่น Premium-01">
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-gray-600 mb-0.5">พื้นที่ติดตั้ง</label>
                        <input type="text" v-model="review.location" class="w-full border border-gray-300 rounded-lg px-1.5 py-1 text-[10px] focus:ring-1 focus:border-emerald-500" placeholder="จ.เชียงใหม่">
                      </div>
                      <div>
                        <label class="block text-[9px] font-bold text-gray-600 mb-0.5">วันที่ติดตั้ง</label>
                        <input type="text" v-model="review.date" class="w-full border border-gray-300 rounded-lg px-1.5 py-1 text-[10px] focus:ring-1 focus:border-emerald-500" placeholder="ต.ค. 2568">
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Partners -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50 bg-gradient-to-r from-gray-50 to-orange-50/10">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  ความไว้วางใจจากองค์กรชั้นนำ (Corporate Reviews Slider)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงและจัดการข้อมูลสไลด์รีวิวจากองค์กรชั้นนำบนหน้าแรก</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input type="checkbox" v-model="homeShowPartners" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div v-if="homeShowPartners" class="mt-3">
              <button type="button" @click="addCorporateReview" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มการ์ดรีวิว
              </button>
            </div>
          </div>

          <div v-if="homeShowPartners" class="p-6">
            <div v-if="corporateReviews.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl mb-4">
              ยังไม่มีการ์ดรีวิวองค์กร (ควรมีอย่างน้อย 3-5 การ์ดเพื่อให้สไลด์สวยงาม)
            </div>
            <div class="space-y-6">
              <div v-for="(review, index) in corporateReviews" :key="index" class="p-5 border border-gray-200 rounded-2xl bg-gray-50 relative group">
                <button type="button" @click="removeCorporateReview(index)" class="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition" title="ลบรีวิว"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  <!-- Left side: Images (Building and logo) -->
                  <div class="lg:col-span-4 space-y-4">
                    <!-- Building photo -->
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">รูปภาพสถานที่ / โรงงาน (สัดส่วนประมาณ 4:3)</label>
                      <div class="flex items-center gap-3 mb-2">
                        <div class="w-24 aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-gray-300 flex-shrink-0">
                          <img v-if="review.image" :src="review.image" class="object-cover w-full h-full grayscale">
                          <span v-else class="text-[10px] text-gray-400 text-center font-bold">ไม่มีรูป</span>
                        </div>
                        <div class="flex-grow space-y-1.5">
                          <div class="flex gap-2">
                            <label class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                              อัพโหลดรูปภาพ
                              <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => review.image = url)">
                            </label>
                            <button v-if="review.image" type="button" @click="review.image = ''" class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-lg transition">
                              ลบรูป
                            </button>
                          </div>
                          <input type="text" v-model="review.image" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500 font-mono text-gray-500" placeholder="หรือใส่ URL /images/...">
                        </div>
                      </div>
                    </div>

                    <!-- Logo photo selection -->
                    <div class="bg-white p-3 rounded-xl border border-gray-150 space-y-2">
                      <label class="block text-xs font-bold text-gray-600">โลโก้แบรนด์</label>
                      <div class="flex items-center gap-3">
                        <div class="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center flex-shrink-0 relative">
                          <!-- Predefined SVGs (for backward compatibility if existing data uses key strings) -->
                          <svg v-if="review.logo === 'scg'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                            <polygon points="50,5 90,28 90,72 50,95 10,72 10,28" fill="#E31B23" />
                            <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="900" font-size="28" font-family="'Inter', sans-serif">SCG</text>
                          </svg>
                          <svg v-else-if="review.logo === 'ptt'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                            <path d="M50 10C50 10 25 45 25 65C25 78.8 36.2 90 50 90C63.8 90 75 78.8 75 65C75 45 50 10 50 10Z" fill="#0056B3"/>
                            <path d="M50 30C50 30 35 55 35 68C35 76.3 41.7 83 50 83C58.3 83 65 76.3 65 68C65 55 50 30 50 30Z" fill="#E31B23"/>
                            <text x="50%" y="67%" dominant-baseline="middle" text-anchor="middle" fill="white" font-weight="900" font-size="16" font-family="'Inter', sans-serif">ptt</text>
                          </svg>
                          <svg v-else-if="review.logo === 'homepro'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                            <path d="M20 55 L50 25 L80 55 L70 55 L70 75 L30 75 L30 55 Z" stroke="#0056B3" stroke-width="6" fill="none" stroke-linejoin="round"/>
                            <path d="M62 37 L62 28 L68 28 L68 43" stroke="#0056B3" stroke-width="6" fill="none" stroke-linecap="round"/>
                            <rect x="42" y="55" width="16" height="20" fill="#F58220" rx="2"/>
                            <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" fill="#0056B3" font-weight="800" font-size="10" font-family="'Inter', sans-serif">HomePro</text>
                          </svg>
                          <svg v-else-if="review.logo === 'index'" class="w-9 h-9" viewBox="0 0 100 100" fill="none">
                            <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" fill="black" font-weight="900" font-size="18" font-family="'Outfit', sans-serif">Index</text>
                            <text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="#FFC72C" font-weight="800" font-size="10" font-family="'Outfit', sans-serif">Living Mall</text>
                          </svg>
                          <svg v-else-if="review.logo === 'cpf'" class="w-8 h-8" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="42" stroke="#008542" stroke-width="6" fill="none"/>
                            <circle cx="50" cy="50" r="35" stroke="#FFC72C" stroke-width="2" fill="none"/>
                            <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#008542" font-weight="900" font-size="22" font-family="'Inter', sans-serif">CPF</text>
                          </svg>
                          <!-- Custom uploaded image logo -->
                          <img v-else-if="review.logo" :src="review.logo" class="w-full h-full object-contain p-1.5">
                          <span v-else class="text-[10px] text-gray-400 text-center font-bold">ไม่มีรูป</span>
                        </div>
                        
                        <div class="flex-grow space-y-1.5">
                          <div class="flex gap-2">
                            <label class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg cursor-pointer transition flex items-center gap-1">
                              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                              อัพโหลดรูปภาพ
                              <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => review.logo = url)">
                            </label>
                            <button v-if="review.logo" type="button" @click="review.logo = ''" class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-lg transition">
                              ลบรูป
                            </button>
                          </div>
                          <input type="text" v-model="review.logo" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500 font-mono text-gray-500" placeholder="หรือใส่ URL รูปภาพโลโก้แบรนด์">
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Right side: Text inputs -->
                  <div class="lg:col-span-8 space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">ชื่อแบรนด์/บริษัท</label>
                        <input type="text" v-model="review.company" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:border-emerald-500" placeholder="เช่น SCG Chemicals">
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">สาขา/สถานที่</label>
                        <input type="text" v-model="review.location" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="เช่น โรงงานบางปู">
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">จำนวนดาว (1-5)</label>
                        <input type="number" v-model="review.rating" min="1" max="5" class="w-full border border-gray-300 rounded-lg px-3 py-1 text-xs focus:ring-1 focus:border-emerald-500">
                      </div>
                      <!-- Sorting actions -->
                      <div class="flex items-end justify-end gap-1.5">
                        <button type="button" 
                          @click="index > 0 && ([corporateReviews[index], corporateReviews[index - 1]] = [corporateReviews[index - 1], corporateReviews[index]])" 
                          :disabled="index === 0" 
                          class="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-150 disabled:opacity-30" 
                          title="เลื่อนขึ้น"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>
                        </button>
                        <button type="button" 
                          @click="index < corporateReviews.length - 1 && ([corporateReviews[index], corporateReviews[index + 1]] = [corporateReviews[index + 1], corporateReviews[index]])" 
                          :disabled="index === corporateReviews.length - 1" 
                          class="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-150 disabled:opacity-30" 
                          title="เลื่อนลง"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">ข้อความรีวิว/ความคิดเห็น</label>
                      <textarea v-model="review.review" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:border-emerald-500" placeholder="ประทับใจตั้งแต่ทีมงานให้ข้อมูล..."></textarea>
                    </div>

                    <!-- Badge metadata -->
                    <div class="p-3 bg-white border border-gray-150 rounded-xl space-y-3">
                      <h4 class="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ป้ายกำกับสินค้า (Product Badge Pill)
                      </h4>
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-1">ข้อความป้าย (เช่น ติดตั้งโรงเก็บของ MS-M005)</label>
                          <input type="text" v-model="review.badge" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500" placeholder="ติดตั้งโรงเก็บของ MS-M005">
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-1">สีของป้าย</label>
                          <select v-model="review.badgeColor" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500 bg-white">
                            <option value="orange">ส้ม (Orange)</option>
                            <option value="blue">น้ำเงิน (Blue)</option>
                            <option value="green">เขียว (Green)</option>
                            <option value="purple">ม่วง (Purple)</option>
                            <option value="yellow">เหลือง (Yellow)</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-[10px] font-bold text-gray-500 mb-1">ไอคอนประกอบ</label>
                          <select v-model="review.badgeIcon" class="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:border-emerald-500 bg-white">
                            <option value="wrench">🔧 ประแจ (Wrench)</option>
                            <option value="home">🏠 บ้าน (Home)</option>
                            <option value="check">✅ เครื่องหมายถูก (Check)</option>
                            <option value="star">⭐ ดาว (Star)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Affiliated Companies Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  บริษัทในเครือ (Affiliated Companies)
                </h2>
                <p class="text-xs text-gray-500 mt-1">เปิด/ปิด การแสดงแบนเนอร์บริษัทในเครือบนหน้าหลัก</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                <input type="checkbox" v-model="homeShowAffiliates" class="sr-only peer">
                <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div v-if="homeShowAffiliates" class="mt-3">
              <button type="button" @click="addAffiliate" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มบริษัทในเครือ
              </button>
            </div>
          </div>
          <div v-if="homeShowAffiliates" class="p-6">
            <div v-if="affiliates.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl mb-4">
              ยังไม่มีบริษัทในเครือ (เพิ่มแบนเนอร์โฆษณาของบริษัทในเครือ พร้อมลิงก์ไปยังเว็บไซต์)
            </div>
            <div class="space-y-5">
              <div v-for="(affiliate, index) in affiliates" :key="index" class="p-5 border border-gray-200 rounded-xl bg-gray-50 relative">
                <button type="button" @click="removeAffiliate(index)" class="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition" title="ลบ">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">{{ index + 1 }}</div>
                  <h3 class="font-bold text-gray-700">บริษัทในเครือ {{ index + 1 }}</h3>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <!-- Banner Image Upload -->
                  <div class="lg:col-span-5">
                    <label class="block text-xs font-bold text-gray-600 mb-2">รูปแบนเนอร์โฆษณา</label>
                    <div class="aspect-[2/1] bg-gray-200 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden relative group">
                      <img v-if="affiliate.banner" :src="affiliate.banner" @error="affiliate.banner = ''" class="w-full h-full object-cover">
                      <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <svg class="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        <span class="text-xs font-medium">อัพโหลดแบนเนอร์ (แนะนำ 16:9)</span>
                      </div>
                      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <label class="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100">
                          {{ affiliate.banner ? 'เปลี่ยนรูป' : 'เลือกรูปภาพ' }}
                          <input type="file" class="hidden" accept="image/*" @change="(e) => uploadImage(e, url => affiliate.banner = url)">
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Text Inputs -->
                  <div class="lg:col-span-7 space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">ชื่อบริษัท</label>
                        <input type="text" v-model="affiliate.name" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="เช่น: CR Tech">
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">URL เว็บไซต์</label>
                        <input type="text" v-model="affiliate.url" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="https://www.crtech.co.th">
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบาย</label>
                      <textarea v-model="affiliate.description" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" placeholder="แหล่งรวมเครื่องกำเนิดไฟฟ้าคุณภาพ..."></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วนรีวิว / พาร์ทเนอร์ / บริษัทในเครือ</span>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อรีวิว (เล็ก)</label><input type="text" v-model="sectionTitles.testimonialsTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อรีวิว (หลัก)</label><input type="text" v-model="sectionTitles.testimonialsHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบายใต้หัวข้อรีวิว</label>
              <textarea v-model="sectionTitles.testimonialsDesc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="เราภูมิใจที่ได้เป็นส่วนหนึ่ง..."></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อพาร์ทเนอร์ (เล็ก)</label><input type="text" v-model="sectionTitles.partnersTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อพาร์ทเนอร์ (หลัก)</label><input type="text" v-model="sectionTitles.partnersHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">คำอธิบายใต้หัวข้อพาร์ทเนอร์</label>
              <textarea v-model="sectionTitles.partnersDesc" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="ขอขอบคุณทุกความไว้วางใจที่เลือก MoreSpace ดูแลพื้นที่ของคุณ"></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบริษัทในเครือ (เล็ก)</label><input type="text" v-model="sectionTitles.affiliatesTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบริษัทในเครือ (หลัก)</label><input type="text" v-model="sectionTitles.affiliatesHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            </div>
          </div>
        </div>

        </div><!-- END TAB social -->

        <!-- ==================== TAB: CTA & ตั้งค่าหัวข้อ ==================== -->
        <div v-show="activeTab === 'cta'">
        <!-- CTA Banner Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              หมวดหมู่สินค้าแนะนำ (Category Showcase)
            </h2>
            <div class="flex items-center gap-2">
              <button type="button" @click="collapseAllShowcases" class="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-semibold transition border border-gray-200">
                ยุบทั้งหมด
              </button>
              <button type="button" @click="expandAllShowcases" class="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-2.5 py-1.5 rounded-lg font-semibold transition border border-gray-200">
                ขยายทั้งหมด
              </button>
              <button type="button" @click="addCategoryShowcase" class="text-sm bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg font-bold transition border border-emerald-200">
                + เพิ่มหมวดหมู่แนะนำ
              </button>
            </div>
          </div>
          <div class="p-6">
            <div v-if="categoryShowcase.length === 0" class="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl mb-4">
              ยังไม่มีการตั้งค่าหมวดหมู่สินค้าแนะนำ (ส่วนนี้จะแสดงรายการสินค้าตามหมวดหมู่ที่เลือกบนหน้าเว็บหลัก)
            </div>
            
            <draggable
              v-model="categoryShowcase"
              tag="div"
              class="space-y-6"
              item-key="categoryId"
              handle=".showcase-drag-handle"
              :animation="250"
              ghost-class="showcase-ghost"
              drag-class="showcase-drag"
              @start="isDraggingShowcase = true"
              @end="isDraggingShowcase = false"
            >
              <template #item="{ element: showcase, index }">
                <div class="p-5 border border-gray-200 rounded-xl bg-gray-50 relative">
                  <div class="absolute top-4 right-4 flex items-center gap-2">
                    <!-- Chevron Toggle Button -->
                    <button type="button" @click="showcase.isCollapsed = !showcase.isCollapsed" class="text-gray-400 hover:text-gray-600 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition" :title="showcase.isCollapsed ? 'ขยาย' : 'ยุบ'">
                      <svg class="w-5 h-5 transition-transform duration-200" :class="{ 'rotate-180': !showcase.isCollapsed }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    <div class="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition showcase-drag-handle" title="ลากเพื่อจัดลำดับ">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path></svg>
                    </div>
                    <button type="button" @click="removeCategoryShowcase(index)" class="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition" title="ลบ">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  <div class="flex items-center gap-3 pr-24 cursor-pointer select-none" :class="{ 'mb-4': !shouldCollapse(showcase, index), 'mb-0': shouldCollapse(showcase, index) }" @click="showcase.isCollapsed = !showcase.isCollapsed">
                    <div class="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">{{ index + 1 }}</div>
                    <h3 class="font-bold text-gray-700 flex items-center gap-2 flex-wrap">
                      <span>ลำดับการแสดงที่ {{ index + 1 }}</span>
                      <span v-if="showcase.categoryId" class="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                        {{ getCategoryName(showcase.categoryId) }}
                      </span>
                      <span v-if="shouldCollapse(showcase, index)" class="text-[11px] font-normal text-gray-400">
                        (มีสินค้า {{ showcase.productIds ? showcase.productIds.length : 0 }} รายการ)
                      </span>
                    </h3>
                  </div>

                  <div v-show="!shouldCollapse(showcase, index)" class="space-y-4">
                  <!-- Category Selection -->
                  <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">เลือกหมวดหมู่ที่จะแสดง <span class="text-red-500">*</span></label>
                    <AdminCategoryDropdown v-model="showcase.categoryId" :categories="availableCategories" placeholder="-- โปรดเลือกหมวดหมู่ --" />
                  </div>

                  <!-- Product Selection -->
                  <div v-if="showcase.categoryId" class="space-y-4">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <!-- Left Column: Product Selector (Checkboxes) -->
                      <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                          เลือกสินค้าที่จะแสดง <span class="text-xs text-gray-500 font-normal">(คลิกเพื่อเลือก/ไม่เลือก)</span>
                        </label>
                        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          <div class="max-h-80 overflow-y-auto p-2 space-y-1">
                            <!-- Filter products specific to the chosen category -->
                            <div v-for="product in getProductsByCategory(showcase.categoryId)" :key="product.id" 
                                 class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors cursor-pointer"
                                 @click="showcase.productIds.includes(product.id) ? showcase.productIds = showcase.productIds.filter(id => id !== product.id) : showcase.productIds.push(product.id)">
                              
                              <div class="flex items-center gap-3">
                                <input type="checkbox" :checked="showcase.productIds.includes(product.id)" 
                                       @change.stop="showcase.productIds.includes(product.id) ? showcase.productIds = showcase.productIds.filter(id => id !== product.id) : showcase.productIds.push(product.id)"
                                       class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500">
                                <img :src="product.image_url" class="w-10 h-10 object-cover rounded shadow-sm border border-gray-100" @error="(e) => e.target.src = '/images/placeholder.png'">
                                <div>
                                  <div class="font-bold text-sm text-gray-800">{{ product.name }}</div>
                                  <div class="text-xs text-gray-500">{{ product.sku || 'N/A' }}</div>
                                </div>
                              </div>
                              
                              <div v-if="showcase.productIds.includes(product.id)" class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center justify-center min-w-[24px]">
                                {{ showcase.productIds.indexOf(product.id) + 1 }}
                              </div>
                            </div>
                            
                            <div v-if="getProductsByCategory(showcase.categoryId).length === 0" class="text-center py-8 text-sm text-gray-500">
                              ไม่พบสินค้าในหมวดหมู่นี้
                            </div>
                          </div>
                          
                          <!-- Summary Footer -->
                          <div class="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-600 flex justify-between items-center">
                             <span>เลือกแล้ว {{ showcase.productIds.length }} รายการ</span>
                             <button type="button" v-if="showcase.productIds.length > 0" @click="showcase.productIds = []" class="text-red-500 hover:text-red-700 hover:underline">
                                ล้างทั้งหมด
                             </button>
                          </div>
                        </div>
                      </div>

                      <!-- Right Column: Drag and Drop Sorting -->
                      <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                          ลากวางจัดลำดับจัดตำแหน่งสินค้าเด่น <span class="text-xs text-gray-500 font-normal">(ลากเพื่อเรียงลำดับ)</span>
                        </label>
                        
                        <div v-if="showcase.productIds.length === 0" class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400 h-[calc(100%-2rem)] flex flex-col items-center justify-center min-h-[150px]">
                          <svg class="w-8 h-8 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          โปรดเลือกสินค้าด้านซ้ายเพื่อเปิดการจัดตำแหน่งลำดับสินค้า
                        </div>

                        <div v-else class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm max-h-[352px] overflow-y-auto">
                          <draggable
                            v-model="showcase.productIds"
                            tag="div"
                            class="space-y-2"
                            :item-key="id => id"
                            handle=".product-drag-handle"
                            :animation="250"
                            ghost-class="showcase-ghost"
                            drag-class="showcase-drag"
                          >
                            <template #item="{ element: productId, index }">
                              <div v-if="availableProducts.find(p => p.id === productId)" class="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-emerald-300 transition-colors group/item">
                                <div class="flex items-center gap-3">
                                  <div class="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 bg-white border border-gray-200 rounded shadow-xs product-drag-handle" title="ลากเพื่อจัดตำแหน่ง">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                                    </svg>
                                  </div>
                                  <div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                                    {{ index + 1 }}
                                  </div>
                                  <img :src="availableProducts.find(p => p.id === productId).image_url" class="w-8 h-8 object-cover rounded shadow-sm border border-gray-200" @error="(e) => e.target.src = '/images/placeholder.png'">
                                  <div class="truncate max-w-[150px] sm:max-w-[200px]">
                                    <div class="font-bold text-xs text-gray-800 truncate" :title="availableProducts.find(p => p.id === productId).name">
                                      {{ availableProducts.find(p => p.id === productId).name }}
                                    </div>
                                    <div class="text-[10px] text-gray-500">{{ availableProducts.find(p => p.id === productId).sku || 'N/A' }}</div>
                                  </div>
                                </div>
                                
                                <button type="button" @click="showcase.productIds = showcase.productIds.filter(id => id !== productId)" class="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition opacity-0 group-hover/item:opacity-100" title="เอาสินค้าออก">
                                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </template>
                          </draggable>
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

        <!-- Section Title Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-indigo-50/50 border-b border-indigo-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            <span class="text-sm font-bold text-indigo-700">ตั้งค่าหัวข้อส่วนผลงาน / บทความ</span>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อผลงาน (เล็ก)</label><input type="text" v-model="sectionTitles.projectsTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อผลงาน (หลัก)</label><input type="text" v-model="sectionTitles.projectsHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-600 mb-1">รายละเอียดผลงาน (คำอธิบายใต้หัวข้อหลัก)</label>
              <input type="text" v-model="sectionTitles.projectsDesc" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500">
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบทความ (เล็ก)</label><input type="text" v-model="sectionTitles.articlesTitle" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
              <div><label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อบทความ (หลัก)</label><input type="text" v-model="sectionTitles.articlesHeading" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"></div>
            </div>
          </div>
        </div>

        <!-- Projects CTA Settings -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="p-4 bg-orange-50/50 border-b border-orange-100 flex items-center gap-2">
            <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span class="text-sm font-bold text-orange-700">ตั้งค่าการ์ดบริการติดตั้ง (การ์ดขวาล่างในผลงานล่าสุด)</span>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span class="text-sm font-bold text-gray-700 block">แสดงการ์ดบริการติดตั้ง</span>
                <span class="text-xs text-gray-500 block">เปิด-ปิดการแสดงผลการ์ดบริการติดตั้งในการ์ดสุดท้ายของหน้าหลัก</span>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="homeProjectsCta.show" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
              </label>
            </div>

            <div v-if="homeProjectsCta.show" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">หัวข้อการ์ด</label>
                  <input type="text" v-model="homeProjectsCta.title" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="บริการติดตั้งทั่วประเทศ">
                </div>
                <div>
                  <label class="block text-xs font-bold text-gray-600 mb-1">รายละเอียดการ์ด</label>
                  <input type="text" v-model="homeProjectsCta.description" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500" placeholder="ทีมช่างมืออาชีพพร้อมบริการติดตั้งถึงหน้าบ้าน ปลอดภัย ได้มาตรฐาน">
                </div>
              </div>

              <!-- Bullets -->
              <div class="space-y-3">
                <label class="block text-xs font-bold text-gray-700">รายการจุดเด่น (3 รายการ)</label>
                <div v-for="(bullet, idx) in homeProjectsCta.bullets" :key="idx" class="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                  <span class="text-xs font-bold text-orange-600">รายการที่ {{ idx + 1 }}</span>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 mb-1">หัวข้อของจุดเด่น</label>
                      <input type="text" v-model="bullet.title" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500">
                    </div>
                    <div>
                      <label class="block text-[10px] font-bold text-gray-500 mb-1">รายละเอียดของจุดเด่น</label>
                      <input type="text" v-model="bullet.desc" class="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-orange-500">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div><!-- END TAB cta -->

        <!-- Buttons -->
        <div class="fixed bottom-0 right-0 left-64 bg-white border-t border-gray-200 p-4 flex justify-end gap-3 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button type="submit" :disabled="saving || uploadingImage" class="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-600/20">
            <svg v-if="saving" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            {{ saving ? 'กำลังบันทึก...' : uploadingImage ? 'กำลังอัพโหลดรูป...' : 'บันทึกการเปลี่ยนแปลง' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.showcase-ghost {
  opacity: 0.4;
  background-color: #ecfdf5 !important; /* emerald-50 */
}
.showcase-drag {
  opacity: 1 !important;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
}
</style>
