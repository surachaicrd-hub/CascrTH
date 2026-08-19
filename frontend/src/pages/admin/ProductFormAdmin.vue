<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import InfoTooltip from '../../components/admin/InfoTooltip.vue'
import IconSelect from '../../components/ui/IconSelect.vue'
import draggable from 'vuedraggable'
import { useRoute, useRouter } from 'vue-router'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import { ClassicEditor, Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo, Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed } from 'ckeditor5'
import 'ckeditor5/ckeditor5.css'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import { apiFetch } from '../../utils/apiFetch'
import AdminCategoryDropdown from '../../components/admin/AdminCategoryDropdown.vue'
import AdminCategoryMultiDropdown from '../../components/admin/AdminCategoryMultiDropdown.vue'
import ProductCard from '../../components/ProductCard.vue'
import WireSample from '../../components/ui/WireSample.vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { 
  defaultWireTypeGroups, 
  defaultWirePresets, 
  parseWireTypeGroups, 
  parseWirePresets, 
  wireDefaultTitles, 
  getWireSampleTitle 
} from '../../utils/wire'

const settingsStore = useSettingsStore()

const { showToast } = useToast()
const { showConfirm } = useConfirm()

const route = useRoute()
const router = useRouter()

// Editor Config
const editor = ClassicEditor
const editorConfig = ref({
    licenseKey: 'GPL',
    plugins: [
        Bold, Essentials, Italic, Link, List, Paragraph, Table, TableToolbar, Heading, Undo,
        Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize, SimpleUploadAdapter, MediaEmbed
    ],
    toolbar: [
        'undo', 'redo', '|', 'heading', '|', 'bold', 'italic', '|',
        'link', 'uploadImage', 'mediaEmbed', 'insertTable', 'bulletedList', 'numberedList'
    ],
    table: {
        contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
    },
    image: {
        toolbar: [
            'imageTextAlternative', 'toggleImageCaption', '|',
            'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
            'resizeImage'
        ]
    },
    simpleUpload: {
        uploadUrl: '/api/upload/ckeditor',
    }
})

// Navigation Tabs
const activeTab = ref('basic')
const tabs = [
  { id: 'basic', label: 'ข้อมูลพื้นฐาน', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'details', label: 'รายละเอียดสินค้า', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'attributes', label: 'สเปกสินค้า (Attributes)', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'media', label: 'รูปภาพ', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'sales', label: 'สินค้าเกี่ยวเนื่อง', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'marketplaces', label: 'ลิงก์ร้านค้าภายนอก', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'card_ui', label: 'การ์ดสินค้า', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'seo', label: 'ตั้งค่า SEO', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }
]

const form = ref({
  name: '',
  sku: '',
  category: '',
  categories: [],
  original_price: null,
  price: 0,
  has_installation_fee: false,
  free_install_bkk: false,
  requires_foundation: true,
  installation_fee: null,
  size: '',
  image_url: '',
  description: '',
  images: [],
  is_active: true,
  is_out_of_stock: false,
  stock_quantity: '',
  sale_end_date: '',
  weight_kg: '',
  width_cm: '',
  length_cm: '',
  height_cm: '',
  limit_one_per_order: false,
  seo_title: '',
  seo_description: '',
  seo_keywords: '',
  shopee_link: '',
  lazada_link: '',
  tiktok_link: '',
  llm_context: '',
  short_description: '',
  remarks: '',
  slug: '',
  image_alt: '',
  attributes: [{ key: '', value: '' }],
  faq: [{ question: '', answer: '' }],
  related_products: [],
  badge_free_shipping: false,
  free_shipping_bkk: false,
  badge_warranty: false,
  badge_installation: false,
  badge_new: false,
  badge_bestseller: false,
  badge_recommended: false,
  badges: [],
  rating: 5.0,
  review_count: 0,
  compare_enabled: true,
  card_features: {
    enabled: true,
    top_badge: '',
    model_name: '',
    subtitle: '',
    spec_range: '',
    capabilities: [
      { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
      { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
      { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true },
      { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist', enabled: false },
      { id: 'ribbon', label: 'แยกสายแพ', icon: 'ribbon', enabled: false }
    ],
    summary: '',
    wire_samples: [
      { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
      { type: 'single_blue', title: 'สายเดี่ยวสีน้ำเงิน' },
      { type: 'single_grey', title: 'สายเดี่ยวสีเทา' }
    ],
    wire_sample_image: '',
    service_call: '',
    hotline: ''
  }
})

const loading = ref(false)
const saving = ref(false)
const aiGenerating = ref(false)
const aiGeneratingAttributes = ref(false)
const aiGeneratingFaq = ref(false)
const aiFormatting = ref(false)
const generatingFullSeo = ref(false)
const seoSubTab = ref('overview')
const SerpPreviewMode = ref('desktop') // 'desktop', 'mobile', 'rich', 'social'

const previewProduct = computed(() => {
  const mainImg = (allImages.value && allImages.value.length > 0) ? allImages.value[0] : (form.value.image_url || '')
  return {
    id: productId.value || 999999,
    name: form.value.name || 'เครื่องตัดปอกสายไฟอัตโนมัติ',
    title: form.value.name || 'เครื่องตัดปอกสายไฟอัตโนมัติ',
    sku: form.value.sku || 'C300A',
    category: form.value.category || 'CASTING',
    price: form.value.price || 0,
    original_price: form.value.original_price || 0,
    image_url: mainImg,
    images: allImages.value && allImages.value.length > 0 ? allImages.value : (mainImg ? [mainImg] : []),
    slug: form.value.slug || '',
    short_description: form.value.short_description || '',
    attributes: form.value.attributes || [],
    card_features: form.value.card_features || {}
  }
})

const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text)
    showToast('คัดลอก JSON-LD Schema เรียบร้อยแล้ว', 'success')
  }
}

const productSchemaJson = computed(() => {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": form.value.seo_title || form.value.name || 'ชื่อสินค้า',
    "description": form.value.seo_description || form.value.short_description || '',
    "sku": form.value.sku || 'N/A',
    "image": form.value.image_url || '',
    "offers": {
      "@type": "Offer",
      "price": form.value.price || 0,
      "priceCurrency": "THB",
      "availability": form.value.is_out_of_stock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
    }
  }, null, 2)
})

const faqSchemaJson = computed(() => {
  const faqs = (form.value.faq || []).filter(f => (f.question || f.q) && (f.answer || f.a))
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.question || f.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": f.answer || f.a
      }
    }))
  }, null, 2)
})

const breadcrumbSchemaJson = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yoursite.com'
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${origin}/` },
      { "@type": "ListItem", "position": 2, "name": form.value.category || "สินค้า", "item": `${origin}/products` },
      { "@type": "ListItem", "position": 3, "name": form.value.name || "ชื่อสินค้า", "item": `${origin}/product/${form.value.slug || ''}` }
    ]
  }, null, 2)
})

const seoAudit = computed(() => {
  let score = 0
  const breakdown = []
  const recommendations = []

  // 1. Technical SEO (Max 10)
  let layer1Score = 0
  if (form.value.slug && /^[a-z0-9-]+$/.test(form.value.slug)) layer1Score += 5
  else recommendations.push('กำหนด URL Slug ที่เป็นตัวอักษรภาษาอังกฤษ พิมพ์เล็ก และยัติภังค์ (-)')
  if (form.value.image_url || (Array.isArray(allImages.value) && allImages.value.length > 0)) layer1Score += 5
  else recommendations.push('เพิ่มรูปภาพหลักของสินค้าเพื่อความสมบูรณ์เชิงเทคนิค')
  score += layer1Score
  breakdown.push({ name: '1. Technical SEO', score: layer1Score, max: 10 })

  // 2. On-page SEO (Max 10)
  let layer2Score = 0
  const titleLen = form.value.seo_title?.length || 0
  const descLen = form.value.seo_description?.length || 0
  if (titleLen >= 25 && titleLen <= 60) layer2Score += 4
  else recommendations.push('ปรับตั้งค่า SEO Title ให้มีความยาวระหว่าง 25-60 ตัวอักษร')
  if (descLen >= 50 && descLen <= 160) layer2Score += 4
  else recommendations.push('ปรับตั้งค่า SEO Description ให้มีความยาวระหว่าง 50-160 ตัวอักษร')
  if (form.value.seo_keywords?.length > 5) layer2Score += 2
  else recommendations.push('ระบุคีย์เวิร์ดดักจับ Search Intent ในช่อง SEO Keywords')
  score += layer2Score
  breakdown.push({ name: '2. On-Page SEO', score: layer2Score, max: 10 })

  // 3. Content SEO (Max 10)
  let layer3Score = 0
  if (form.value.description?.length > 100) layer3Score += 5
  if (form.value.size || form.value.short_description) layer3Score += 5
  else recommendations.push('ระบุสเปกขนาด (Size) และคำอธิบายย่อสินค้าเพื่อเพิ่มคุณค่าเนื้อหา')
  score += layer3Score
  breakdown.push({ name: '3. Content & Information Gain', score: layer3Score, max: 10 })

  // 4. Semantic & Entity Mapping (Max 10)
  let layer4Score = 0
  const attrCount = Array.isArray(form.value.attributes) ? form.value.attributes.filter(a => a.name || a.key).length : 0
  if (attrCount >= 3) layer4Score += 10
  else if (attrCount > 0) layer4Score += 5
  else recommendations.push('เพิ่มคุณสมบัติเด่น (Attributes) อย่างน้อย 3 รายการเพื่อสร้าง Entity Tree')
  score += layer4Score
  breakdown.push({ name: '4. Semantic & Entity SEO', score: layer4Score, max: 10 })

  // 5. Structured Data Schema (Max 10)
  let layer5Score = 0
  if (form.value.sku) layer5Score += 4
  if (form.value.price > 0) layer5Score += 3
  if (form.value.category) layer5Score += 3
  score += layer5Score
  breakdown.push({ name: '5. Structured Data (Schema)', score: layer5Score, max: 10 })

  // 6. Internal Linking (Max 10)
  let layer6Score = 0
  const relCount = Array.isArray(form.value.related_products) ? form.value.related_products.length : 0
  if (relCount >= 2) layer6Score += 10
  else if (relCount > 0) layer6Score += 5
  else recommendations.push('เลือกสินค้าที่เกี่ยวข้องอย่างน้อย 2 ชิ้นเพื่อสร้าง Internal Topic Cluster')
  score += layer6Score
  breakdown.push({ name: '6. Internal Linking', score: layer6Score, max: 10 })

  // 7. Image SEO (Max 10)
  let layer7Score = 0
  if (form.value.image_alt?.trim()) layer7Score += 10
  else recommendations.push('ใส่คำอธิบายภาพ (Image ALT Text) ให้ครอบคลุมคีย์เวิร์ดสินค้า')
  score += layer7Score
  breakdown.push({ name: '7. Image SEO', score: layer7Score, max: 10 })

  // 8. E-E-A-T & Trust Signals (Max 10)
  let layer8Score = 0
  if (form.value.remarks || form.value.shopee_link || form.value.lazada_link) layer8Score += 10
  else layer8Score += 5
  score += layer8Score
  breakdown.push({ name: '8. E-E-A-T & Trust', score: layer8Score, max: 10 })

  // 9. GEO / LLM Context (Max 10)
  let layer9Score = 0
  if (form.value.llm_context && form.value.llm_context.length > 30) layer9Score += 10
  else recommendations.push('สร้างบริบทสำหรับ AI Search (LLM Context) เพื่อให้ ChatGPT/Perplexity อ้างอิงสินค้า')
  score += layer9Score
  breakdown.push({ name: '9. GEO / LLM Context', score: layer9Score, max: 10 })

  // 10. Answer Engine (AEO FAQs) (Max 10)
  let layer10Score = 0
  const faqCount = Array.isArray(form.value.faq) ? form.value.faq.filter(f => f.question || f.q).length : 0
  if (faqCount >= 3) layer10Score += 10
  else if (faqCount > 0) layer10Score += 5
  else recommendations.push('เพิ่มชุดคำถาม-คำตอบ (AEO FAQs) อย่างน้อย 3 ข้อเพื่อรองรับ Voice Search')
  score += layer10Score
  breakdown.push({ name: '10. Answer Engine (AEO)', score: layer10Score, max: 10 })

  return {
    score,
    breakdown,
    recommendations
  }
})

const handleFullSeoGeoAutoFix = async () => {
  if (!form.value.name) {
    showToast('กรุณากรอกชื่อสินค้าก่อนใช้งาน AI Auto-Fix', 'error')
    return
  }

  generatingFullSeo.value = true
  try {
    const res = await apiFetch('/api/ai/generate-full-seo-geo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || form.value.short_description || '',
        size: form.value.size,
        sku: form.value.sku,
        price: form.value.price
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      const payload = data.data
      if (payload.seo_title) form.value.seo_title = payload.seo_title
      if (payload.seo_description) form.value.seo_description = payload.seo_description
      if (payload.seo_keywords) form.value.seo_keywords = payload.seo_keywords
      if (payload.llm_context) form.value.llm_context = payload.llm_context
      if (payload.image_alt) form.value.image_alt = payload.image_alt

      showToast('สร้างข้อมูล SEO และ AI Context เรียบร้อยแล้ว!', 'success')
    } else {
      showToast(data.error || 'ไม่สามารถประมวลผล AI SEO & GEO ได้', 'error')
    }
  } catch (error) {
    console.error('Full SEO GEO error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    generatingFullSeo.value = false
  }
}
const uploadingImages = ref(false)
const allImages = ref([]) // Unified images layout
const isEdit = ref(false)
const isLoadingProduct = ref(false)
const productId = ref(null)

const categories = ref([])
const allProductsForSelect = ref([])
const relatedFilterCategory = ref('all')

const filteredRelatedProducts = computed(() => {
  let list = allProductsForSelect.value.filter(p => !isEdit.value || p.id !== productId.value)
  if (relatedFilterCategory.value !== 'all') {
    list = list.filter(p => p.category === relatedFilterCategory.value)
  }
  return list
})

const isRelatedSelected = (id) => {
  if (!form.value.related_products || !Array.isArray(form.value.related_products)) return false;
  return form.value.related_products.some(relId => String(relId) === String(id));
}

// Badge management
const allBadges = ref([])
const showBadgeModal = ref(false)
const badgeForm = ref({ name: '', icon: 'tag', color: 'gray' })
const editingBadgeId = ref(null)
const badgeSaving = ref(false)

const badgeIconMap = {
  check: 'M5 13l4 4L19 7',
  shield: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  cog: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  fire: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  thumbsup: 'M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z',
  truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  gift: 'M12 8v13m0-13V6a4 4 0 00-4-4 2 2 0 00-2 2v2h6zm0 0V5.5A2.5 2.5 0 0114.5 3 2 2 0 0116 5v3h-4zm-8 4h16M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  lightbulb: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  bell: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  clipboard: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  cube: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
}
const badgeColorOptions = ['emerald', 'blue', 'teal', 'amber', 'rose', 'indigo', 'purple', 'gray', 'red', 'orange', 'cyan', 'pink']
const badgeIconOptions = Object.keys(badgeIconMap)

// Icon options with Thai labels for Card UI tab
const cardIconOptions = [
  { value: 'sun', label: 'พระอาทิตย์ (กันแดด)' },
  { value: 'cloud', label: 'เมฆ (กันฝน)' },
  { value: 'shield', label: 'โล่ (ทนทาน)' },
  { value: 'shield-check', label: 'โล่เครื่องหมายถูก' },
  { value: 'wind', label: 'ลม (ระบายอากาศ)' },
  { value: 'water', label: 'หยดน้ำ (กันน้ำ)' },
  { value: 'leaf', label: 'ใบไม้ (ธรรมชาติ)' },
  { value: 'lightning', label: 'สายฟ้า (พลังงาน)' },
  { value: 'fire', label: 'ไฟ (ทนความร้อน)' },
  { value: 'check', label: 'เครื่องหมายถูก' },
  { value: 'star', label: 'ดาว (พรีเมียม)' },
  { value: 'medal', label: 'เหรียญ (รับรอง)' },
  { value: 'clock', label: 'นาฬิกา (อายุใช้งาน)' },
  { value: 'cube', label: 'กล่อง (ประกอบง่าย)' },
  { value: 'truck', label: 'รถขนส่ง (จัดส่ง)' },
  { value: 'cog', label: 'เฟือง (ระบบ)' },
  { value: 'chip', label: 'ชิป (เทคโนโลยี)' },
  { value: 'eye', label: 'ตา (มองเห็น)' },
  { value: 'heart', label: 'หัวใจ (ชื่นชอบ)' },
  { value: 'home', label: 'บ้าน (ใช้ในบ้าน)' },
  { value: 'lock', label: 'กุญแจ (ปลอดภัย)' },
  { value: 'globe', label: 'โลก (สากล)' },
  { value: 'tag', label: 'แท็ก (ป้าย)' },
  { value: 'tools', label: 'เครื่องมือ' },
  { value: 'sparkles', label: 'ประกาย (พิเศษ)' }
]

const getBadgeIconPath = (icon) => badgeIconMap[icon] || badgeIconMap.tag

const loadBadges = async () => {
  try {
    const res = await apiFetch('/api/badges')
    const data = await res.json()
    if (data.success) allBadges.value = data.data
  } catch (e) { console.error('Load badges error:', e) }
}

const toggleBadge = (badgeId) => {
  const idx = form.value.badges.indexOf(badgeId)
  if (idx >= 0) form.value.badges.splice(idx, 1)
  else form.value.badges.push(badgeId)
}

const openCreateBadge = () => {
  editingBadgeId.value = null
  badgeForm.value = { name: '', icon: 'tag', color: 'gray' }
  showBadgeModal.value = true
}

const openEditBadge = (badge) => {
  editingBadgeId.value = badge.id
  badgeForm.value = { name: badge.name, icon: badge.icon, color: badge.color }
  showBadgeModal.value = true
}

const saveBadge = async () => {
  if (!badgeForm.value.name.trim()) return showToast('กรุณาระบุชื่อป้ายกำกับ', 'warning')
  badgeSaving.value = true
  try {
    const url = editingBadgeId.value ? `/api/badges/${editingBadgeId.value}` : '/api/badges'
    const method = editingBadgeId.value ? 'PUT' : 'POST'
    const res = await apiFetch(url, { method, body: JSON.stringify(badgeForm.value) })
    const data = await res.json()
    if (data.success) {
      showToast(editingBadgeId.value ? 'แก้ไขป้ายกำกับแล้ว' : 'เพิ่มป้ายกำกับใหม่แล้ว', 'success')
      await loadBadges()
      showBadgeModal.value = false
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') }
  finally { badgeSaving.value = false }
}

const deleteBadge = async (badge) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบป้ายกำกับ',
    message: `ต้องการลบป้าย "${badge.name}" ใช่หรือไม่?`,
    confirmText: 'ลบ',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return
  try {
    const res = await apiFetch(`/api/badges/${badge.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      showToast('ลบป้ายกำกับแล้ว', 'success')
      form.value.badges = form.value.badges.filter(id => id !== badge.id)
      await loadBadges()
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาด', 'error')
    }
  } catch (e) { showToast('เกิดข้อผิดพลาด', 'error') }
}

onMounted(async () => {
  await loadCategories()
  await loadAllProductsForSelect()
  await loadBadges()
  await loadMasterWireData()
  
  if (route.params.id) {
    isEdit.value = true
    productId.value = route.params.id
    loading.value = true
    await loadProduct()
    loading.value = false
  }
})

const loadCategories = async () => {
  try {
    const res = await apiFetch('/api/categories')
    const data = await res.json()
    if (data.success) {
      categories.value = data.data
    }
  } catch (error) {
    console.error('Fetch categories error:', error)
  }
}

// System for Category Templates
const categoryTemplates = ref([])

const loadCategoryTemplates = async (categoryName) => {
  if (!categoryName) return
  try {
    const res = await apiFetch(`/api/category-attributes/${encodeURIComponent(categoryName)}`)
    const data = await res.json()
    if (data.success) {
      categoryTemplates.value = data.data
      syncAttributesWithTemplate()
    }
  } catch (error) {
    console.error('Fetch templates error:', error)
  }
}

const syncAttributesWithTemplate = () => {
  if (!Array.isArray(form.value.attributes)) form.value.attributes = []
  
  const existingAttrsMap = new Map()
  form.value.attributes.forEach(attr => {
    if (attr && attr.key) {
      existingAttrsMap.set(attr.key.trim().toLowerCase(), attr)
    }
  })
  
  const newAttributes = []
  
  // Add template attributes
  categoryTemplates.value.forEach(template => {
    const keyLower = template.attribute_key ? template.attribute_key.trim().toLowerCase() : ''
    const labelLower = template.attribute_label ? template.attribute_label.trim().toLowerCase() : ''
    const existing = (keyLower ? existingAttrsMap.get(keyLower) : null) || (labelLower ? existingAttrsMap.get(labelLower) : null)
    
    newAttributes.push({
      key: template.attribute_key,
      value: existing ? existing.value : '',
      isTemplate: true,
      label: template.attribute_label,
      type: template.attribute_type,
      options: template.options ? (typeof template.options === 'string' ? JSON.parse(template.options) : template.options) : [],
      required: template.is_required
    })
    if (keyLower) existingAttrsMap.delete(keyLower)
    if (labelLower) existingAttrsMap.delete(labelLower)
  })
  
  // Append custom attributes
  existingAttrsMap.forEach(attr => {
    if (attr && (attr.key?.trim() || attr.value?.trim())) {
      newAttributes.push({
        key: attr.key,
        value: attr.value,
        isTemplate: false
      })
    }
  })
  
  // If empty and no templates, add a blank row
  if (newAttributes.length === 0) {
    newAttributes.push({ key: '', value: '', isTemplate: false })
  }
  
  form.value.attributes = newAttributes
}

watch(() => form.value.categories, (newCategories) => {
  if (newCategories && newCategories.length > 0) {
    const primaryCategory = newCategories[0]
    // Keep legacy category field in sync
    form.value.category = primaryCategory
    // Skip watcher-triggered template load during initial product load
    if (!isLoadingProduct.value) {
      loadCategoryTemplates(primaryCategory)
    }
    // Default filter to product's primary category
    if (relatedFilterCategory.value === 'all' && primaryCategory) {
      relatedFilterCategory.value = primaryCategory
    }
  }
}, { deep: true })

const loadAllProductsForSelect = async () => {
  try {
    // Only fetch for admin, to get all active/inactive for selection
    const res = await apiFetch('/api/products?admin=true')
    const data = await res.json()
    if (data.success) {
      allProductsForSelect.value = data.data
    }
  } catch (error) {
    console.error('Fetch all products error:', error)
  }
}

const loadProduct = async () => {
  isLoadingProduct.value = true
  try {
    const res = await apiFetch(`/api/products/${productId.value}`)
    const data = await res.json()
    if (data.success) {
      const p = data.data

      // ── Parse all JSON string fields from raw API data first ──
      if (typeof p.images === 'string') {
        try { p.images = JSON.parse(p.images) } catch { p.images = [] }
      }
      if (typeof p.attributes === 'string') {
        try { p.attributes = JSON.parse(p.attributes) || [] } catch { p.attributes = [] }
      }
      if (!Array.isArray(p.attributes)) p.attributes = []
      
      if (typeof p.faq === 'string') {
        try { p.faq = JSON.parse(p.faq) } catch { p.faq = [{ question: '', answer: '' }] }
      }
      if (typeof p.related_products === 'string') {
        try { p.related_products = JSON.parse(p.related_products) } catch { p.related_products = [] }
      }
      if (typeof p.badges === 'string') {
        try { p.badges = JSON.parse(p.badges) || [] } catch { p.badges = [] }
      } else if (!p.badges) {
        p.badges = []
      }
      if (!Array.isArray(p.badges)) {
        p.badges = [p.badges]
      }

      // Sync database boolean badge columns to dynamic badges list
      const systemBadgesMap = {
        badge_bestseller: 'badge-bestseller',
        badge_warranty: 'badge-warranty',
        badge_installation: 'badge-installation',
        badge_new: 'badge-new',
        badge_recommended: 'badge-recommended',
        badge_free_shipping: 'badge-free-shipping'
      }
      for (const [col, badgeId] of Object.entries(systemBadgesMap)) {
        if (p[col] && !p.badges.includes(badgeId)) {
          p.badges.push(badgeId)
        }
      }

      // Parse categories JSON
      if (typeof p.categories === 'string') {
        try { p.categories = JSON.parse(p.categories) } catch { p.categories = [] }
      }
      if (!Array.isArray(p.categories) || p.categories.length === 0) {
        // Fallback: use old category field
        p.categories = p.category ? [p.category] : []
      }

      // Ensure arrays have at least one empty entry for the UI
      if (!p.faq || p.faq.length === 0) p.faq = [{ question: '', answer: '' }]
      if (!p.related_products) p.related_products = []

      // Ensure card_features has default structure
      if (!p.card_features || typeof p.card_features !== 'object') {
        p.card_features = {}
      }
      if (p.card_features.enabled === undefined) p.card_features.enabled = true
      if (!p.card_features.top_badge) p.card_features.top_badge = p.category || 'CASTING'
      if (!p.card_features.model_name) p.card_features.model_name = p.sku || ''
      if (!p.card_features.subtitle) p.card_features.subtitle = 'เครื่องตัดปลอกสายไฟ KODERA'
      if (!p.card_features.spec_range) {
        if (p.attributes) {
          try {
            const attrs = typeof p.attributes === 'string' ? JSON.parse(p.attributes) : p.attributes
            const f = attrs?.find(a => a.key?.includes('ขนาดสายไฟ') || a.value?.includes('AWG'))
            if (f) p.card_features.spec_range = f.value
          } catch(e) {}
        }
      }
      if (!p.card_features.capabilities || !Array.isArray(p.card_features.capabilities) || p.card_features.capabilities.length === 0) {
        const m = (p.sku || p.name || '').toUpperCase()
        if (m.includes('371AF') || m.includes('371AG')) {
          p.card_features.capabilities = [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true },
            { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist', enabled: true },
            { id: 'ribbon', label: 'แยกสายแพ', icon: 'ribbon', enabled: true }
          ]
        } else if (m.includes('371G') || m.includes('371')) {
          p.card_features.capabilities = [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true },
            { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist', enabled: true }
          ]
        } else {
          p.card_features.capabilities = [
            { id: 'cut', label: 'ตัด', icon: 'cut', enabled: true },
            { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end', enabled: true },
            { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid', enabled: true }
          ]
        }
      }
      if (!p.card_features.wire_samples || !Array.isArray(p.card_features.wire_samples) || p.card_features.wire_samples.length === 0) {
        const m = (p.sku || p.name || '').toUpperCase()
        if (m.includes('371AF') || m.includes('371AG')) {
          p.card_features.wire_samples = [
            { type: 'flat_ribbon_grey', title: 'สายแพแบนสีเทา' },
            { type: 'flat_ribbon_rainbow', title: 'สายแพแบนสีรุ้ง' }
          ]
        } else if (m.includes('371G')) {
          p.card_features.wire_samples = [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' },
            { type: 'twisted_pair', title: 'สายตีเกลียว' }
          ]
        } else if (m.includes('370G')) {
          p.card_features.wire_samples = [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' },
            { type: 'ground_yellow_green', title: 'สายดินเขียว-เหลือง' }
          ]
        } else {
          p.card_features.wire_samples = [
            { type: 'single_black', title: 'สายเดี่ยวสีดำ' },
            { type: 'single_blue', title: 'สายเดี่ยวสีน้ำเงิน' },
            { type: 'single_grey', title: 'สายเดี่ยวสีเทา' }
          ]
        }
      }
      if (!p.card_features.summary) p.card_features.summary = p.short_description || ''

      // ── Single assign to form.value (without attributes — will be synced via template) ──
      const { attributes: rawAttributes, ...restData } = p
      form.value = { ...form.value, ...restData, attributes: rawAttributes }

      // ── Fix sale_end_date timezone ──
      if (form.value.sale_end_date) {
        try {
           const d = new Date(form.value.sale_end_date)
           d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
           form.value.sale_end_date = d.toISOString().slice(0, 16)
        } catch(e) {}
      }

      // ── Populate unified images array ──
      const arr = []
      if (p.image_url) arr.push(p.image_url)
      if (Array.isArray(p.images)) arr.push(...p.images)
      allImages.value = arr.filter(Boolean)

      // ── Load category templates and sync attributes LAST ──
      // This ensures syncAttributesWithTemplate() merges raw attributes with template metadata
      // and does NOT get overwritten by a second form.value assignment
      // Load category templates based on primary category
      const primaryCat = form.value.categories && form.value.categories.length > 0 ? form.value.categories[0] : form.value.category
      if (primaryCat) {
        await loadCategoryTemplates(primaryCat)
      }
    }
  } catch (error) {
    console.error('Fetch error:', error)
  } finally {
    isLoadingProduct.value = false
  }
}

const handleImagesUpload = async (e) => {
  const files = Array.from(e.target.files || e.dataTransfer?.files || [])
  if (files.length === 0) return
  
  const validFiles = files.filter(f => f.type.startsWith('image/'))
  if (validFiles.length < files.length) {
    showToast('บางไฟล์ไม่ใช่รูปภาพ ระบบจะข้ามไฟล์เหล่านั้นไป', 'warning')
  }
  
  if (validFiles.length === 0) return

  uploadingImages.value = true
  for (const file of validFiles) {
    await uploadFile(file, (url) => { allImages.value.push('' + url) })
  }
  uploadingImages.value = false
  if (e.target.value) e.target.value = ''
}

const handleImagesDrop = (e) => { handleImagesUpload(e) }

const removeImage = (index) => {
  allImages.value.splice(index, 1)
}

const generateSEO = async () => {
  if (!form.value.name) {
    showToast('กรุณากรอกชื่อสินค้าก่อนให้ AI สร้าง SEO', 'warning')
    return
  }

  aiGenerating.value = true
  try {
    const res = await apiFetch('/api/ai/generate-seo', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      form.value.seo_title = data.data.title || form.value.seo_title
      form.value.seo_keywords = data.data.keywords || form.value.seo_keywords
      form.value.seo_description = data.data.description || form.value.seo_description
      if (data.data.llm_context) {
        form.value.llm_context = data.data.llm_context
      }
      showToast('AI สร้างข้อมูล SEO และ LLM Context อัตโนมัติสำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGenerating.value = false
  }
}

const generateAttributes = async () => {
  if (!form.value.description && !form.value.name && !form.value.short_description) {
    showToast('กรุณากรอกชื่อหรือรายละเอียดสินค้าก่อนให้ AI ดึงสเปก', 'warning')
    return
  }

  aiGeneratingAttributes.value = true
  try {
    const res = await apiFetch('/api/ai/generate-attributes', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        categories: form.value.categories,
        shortDescription: form.value.short_description || '',
        description: form.value.description || '',
        sku: form.value.sku || '',
        size: form.value.size || '',
        price: form.value.price || '',
        remarks: form.value.remarks || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data && Array.isArray(data.data)) {
      const validAttrs = data.data.filter(a => (a.key && String(a.key).trim()) || (a.value && String(a.value).trim()))
      form.value.attributes = validAttrs
      if (categoryTemplates.value && categoryTemplates.value.length > 0) {
        syncAttributesWithTemplate()
      }
      showToast('AI ดึงสเปกสินค้าอัตโนมัติสำเร็จแล้ว (' + validAttrs.length + ' รายการ)', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI Attributes Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingAttributes.value = false
  }
}

const generateFaq = async () => {
  if (!form.value.description && !form.value.name) {
    showToast('กรุณากรอกชื่อและรายละเอียดสินค้าก่อนให้ AI สร้าง FAQ', 'warning')
    return
  }

  aiGeneratingFaq.value = true
  try {
    const res = await apiFetch('/api/ai/generate-faq', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        description: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data && Array.isArray(data.data)) {
      // If FAQ is empty (just the default blank entry), replace entirely
      if (form.value.faq.length === 1 && !form.value.faq[0].question && !form.value.faq[0].answer) {
        form.value.faq = data.data
      } else {
        // Otherwise append new FAQ items to existing ones
        form.value.faq = [...form.value.faq, ...data.data]
      }
      showToast('AI สร้างคำถามที่พบบ่อยสำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างข้อมูลได้', 'error')
    }
  } catch (error) {
    console.error('AI FAQ Generation error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingFaq.value = false
  }
}

const standardCapabilities = [
  { id: 'cut', label: 'ตัด', icon: 'cut' },
  { id: 'strip_end', label: 'ปอกปลาย', icon: 'strip_end' },
  { id: 'strip_mid', label: 'ปอกกลางสาย', icon: 'strip_mid' },
  { id: 'twist', label: 'ปั่นเกลียว', icon: 'twist' },
  { id: 'ribbon', label: 'แยกสายแพ', icon: 'ribbon' }
]

const toggleCapability = (capId) => {
  if (!form.value.card_features.capabilities) form.value.card_features.capabilities = []
  const existing = form.value.card_features.capabilities.find(c => (c.id || c.icon) === capId)
  if (existing) {
    existing.enabled = !existing.enabled
  } else {
    const std = standardCapabilities.find(s => s.id === capId)
    if (std) {
      form.value.card_features.capabilities.push({ ...std, enabled: true })
    }
  }
}

const isCapabilityEnabled = (capId) => {
  if (!form.value.card_features?.capabilities) return false
  const found = form.value.card_features.capabilities.find(c => (c.id || c.icon) === capId)
  return found ? found.enabled !== false : false
}

const addCustomCapability = () => {
  if (!form.value.card_features.capabilities) form.value.card_features.capabilities = []
  form.value.card_features.capabilities.push({
    id: 'custom_' + Date.now(),
    label: 'ฟังก์ชันใหม่',
    icon: 'cut',
    enabled: true
  })
}

const removeCapability = (idx) => {
  form.value.card_features.capabilities.splice(idx, 1)
}

const autoDetectSpecFromAttributes = () => {
  if (form.value.attributes && form.value.attributes.length > 0) {
    const found = form.value.attributes.find(a => 
      a.key?.includes('ขนาดสายไฟ') || a.value?.includes('AWG') || a.key?.includes('สเปก')
    )
    if (found && found.value) {
      form.value.card_features.spec_range = found.value
      showToast('ดึงขนาดสายไฟจาก Attributes สำเร็จ', 'success')
      return
    }
  }
  if (form.value.size) {
    form.value.card_features.spec_range = form.value.size
    showToast('ดึงขนาดจากข้อมูลสินค้าสำเร็จ', 'success')
    return
  }
  showToast('ไม่พบข้อมูลขนาดสายไฟใน Attributes', 'warning')
}

const autoFillSummaryFromDescription = () => {
  if (form.value.short_description) {
    form.value.card_features.summary = form.value.short_description
    showToast('คัดลอกจากคำอธิบายย่อเรียบร้อย', 'success')
  } else if (form.value.description) {
    const clean = form.value.description.replace(/<[^>]*>?/gm, '').trim().slice(0, 120)
    form.value.card_features.summary = clean
    showToast('สร้างสรุปจากรายละเอียดเรียบร้อย', 'success')
  } else {
    showToast('ยังไม่มีคำอธิบายสินค้า', 'warning')
  }
}

const wireTypeOptions = ref(parseWireTypeGroups(null))
const wirePresets = ref(parseWirePresets(null))

const loadMasterWireData = async () => {
  try {
    const res = await apiFetch('/api/settings/public')
    const json = await res.json()
    if (json.success && json.data) {
      if (json.data.wire_master_types) {
        wireTypeOptions.value = parseWireTypeGroups(json.data.wire_master_types)
      }
      if (json.data.wire_presets) {
        wirePresets.value = parseWirePresets(json.data.wire_presets)
      }
    }
  } catch (e) {
    console.error('Error loading master wire data:', e)
  }
}

const applyWirePreset = (preset) => {
  form.value.card_features.wire_samples = JSON.parse(JSON.stringify(preset.samples))
  showToast(`นำเข้าตัวอย่างสายไฟชุด "${preset.name}" สำเร็จ`, 'success')
}

const addWireSample = (type = 'single_black', title = '', image = '') => {
  if (!form.value.card_features.wire_samples) form.value.card_features.wire_samples = []
  form.value.card_features.wire_samples.push({
    type,
    title: title || wireDefaultTitles[type] || 'ตัวอย่างสายไฟ',
    image: image || ''
  })
}

const addCustomImageWireSample = () => {
  addWireSample('custom_image', 'สายไฟกำหนดเอง', '')
}

const removeWireSample = (idx) => {
  form.value.card_features.wire_samples.splice(idx, 1)
}

const moveWireSample = (idx, direction) => {
  const list = form.value.card_features.wire_samples
  const targetIdx = idx + direction
  if (targetIdx < 0 || targetIdx >= list.length) return
  const item = list.splice(idx, 1)[0]
  list.splice(targetIdx, 0, item)
}

const duplicateWireSample = (idx) => {
  const item = form.value.card_features.wire_samples[idx]
  if (!item) return
  const clone = JSON.parse(JSON.stringify(item))
  clone.title = `${clone.title || 'ตัวอย่างสายไฟ'} (สำเนา)`
  form.value.card_features.wire_samples.splice(idx + 1, 0, clone)
  showToast('คัดลอกรายการสายไฟแล้ว', 'success')
}

const clearAllWireSamples = async () => {
  if (!form.value.card_features.wire_samples || form.value.card_features.wire_samples.length === 0) return
  const ok = await showConfirm({
    title: 'ล้างรายการสายไฟทั้งหมด',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการตัวอย่างสายไฟทั้งหมดในการ์ดนี้?',
    confirmText: 'ล้างทั้งหมด',
    type: 'danger'
  })
  if (ok) {
    form.value.card_features.wire_samples = []
    showToast('ล้างรายการสายไฟเรียบร้อยแล้ว', 'info')
  }
}

const onWireTypeChange = (sample, newType) => {
  const currentTitle = sample.title ? sample.title.trim() : ''
  // If title is empty or matches one of default titles, update to new default title
  const isDefaultOrEmpty = !currentTitle || Object.values(wireDefaultTitles).includes(currentTitle)
  if (isDefaultOrEmpty && wireDefaultTitles[newType]) {
    sample.title = wireDefaultTitles[newType]
  }
}

const uploadingWireIdx = ref(null)

const handleWireSampleUpload = async (event, sIdx) => {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingWireIdx.value = sIdx
  try {
    await uploadFile(file, (url) => {
      if (form.value.card_features.wire_samples[sIdx]) {
        form.value.card_features.wire_samples[sIdx].image = url
        if (form.value.card_features.wire_samples[sIdx].type !== 'custom_image') {
          form.value.card_features.wire_samples[sIdx].type = 'custom_image'
        }
        showToast('อัปโหลดรูปภาพสายไฟสำเร็จ', 'success')
      }
    })
  } catch (err) {
    console.error('Wire image upload error:', err)
    showToast('อัปโหลดรูปภาพไม่สำเร็จ', 'error')
  } finally {
    uploadingWireIdx.value = null
    event.target.value = ''
  }
}

const removeWireSampleImage = (sIdx) => {
  if (form.value.card_features.wire_samples[sIdx]) {
    form.value.card_features.wire_samples[sIdx].image = ''
    showToast('นำรูปภาพออกแล้ว', 'info')
  }
}

const addCardFeatureStack = () => {
  if (!form.value.card_features.stack) form.value.card_features.stack = []
  if (form.value.card_features.stack.length < 3) {
    form.value.card_features.stack.push({ icon: 'tag', text: '' })
  }
}
const removeCardFeatureStack = (idx) => {
  form.value.card_features.stack.splice(idx, 1)
}
const addCardFeatureBottom = () => {
  if (!form.value.card_features.bottom_bar) form.value.card_features.bottom_bar = []
  if (form.value.card_features.bottom_bar.length < 3) {
    form.value.card_features.bottom_bar.push({ icon: 'tag', title: '', subtitle: '' })
  }
}
const removeCardFeatureBottom = (idx) => {
  form.value.card_features.bottom_bar.splice(idx, 1)
}

const uploadFile = async (file, callback) => {
  const formData = new FormData()
  formData.append('image', file)
  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      callback(data.url)
    } else {
      showToast('อัปโหลดล้มเหลว: ' + data.error, 'error')
    }
  } catch (error) {
    console.error('Upload Error:', error)
  }
}

const formatDescriptionSEO = async () => {
  if (!form.value.description) {
    showToast('กรุณากรอกรายละเอียดสินค้าเบื้องต้นก่อนให้ AI ช่วยจัดรูปแบบ', 'warning')
    return
  }
  
  try {
    aiFormatting.value = true
    const res = await apiFetch('/api/ai/format-description', {
      method: 'POST',
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        categories: form.value.categories,
        sku: form.value.sku,
        size: form.value.size,
        description: form.value.description
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      form.value.description = data.data
      showToast('AI จัดฟอร์แมตโครงสร้างเนื้อหา SEO สำเร็จแล้ว', 'success')
    } else {
      showToast(data.error || 'เกิดข้อผิดพลาดในการจัดรูปแบบ', 'error')
    }
  } catch (error) {
    console.error('AI format error:', error)
    showToast('การเชื่อมต่อกับ AI ขัดข้อง', 'error')
  } finally {
    aiFormatting.value = false
  }
}

const generateSlug = () => {
  if (!form.value.name) return
  let s = form.value.name.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-ก-๙]+/g, '')
        .replace(/\u0e4d/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
  form.value.slug = s
}

const addAttribute = () => form.value.attributes.push({ key: '', value: '' })
const removeAttribute = (index) => form.value.attributes.splice(index, 1)

const addFaq = () => form.value.faq.push({ question: '', answer: '' })
const removeFaq = async (index) => {
  const isConfirmed = await showConfirm({
    title: 'ยืนยันการลบ',
    message: 'คุณแน่ใจหรือไม่ว่าต้องการลบคำถาม FAQ นี้?',
    confirmText: 'ลบข้อมูล',
    cancelText: 'ยกเลิก',
    type: 'danger'
  })
  if (!isConfirmed) return
  form.value.faq.splice(index, 1)
  // Auto-save to persist deletion immediately (only if editing existing product)
  if (isEdit.value) {
    await saveProduct()
  }
}

const saveProduct = async () => {
  // ─── Client-side Validation ───
  const validationErrors = []

  // 1. Required: Product Name
  if (!form.value.name || !String(form.value.name).trim()) {
    validationErrors.push('กรุณากรอกชื่อสินค้า')
  }

  // 2. Required: Category (at least one)
  if (!form.value.categories || !Array.isArray(form.value.categories) || form.value.categories.length === 0) {
    validationErrors.push('กรุณาเลือกหมวดหมู่สินค้าอย่างน้อย 1 หมวดหมู่')
  }

  // 3. Price validation
  const priceVal = form.value.price !== null && form.value.price !== undefined && form.value.price !== ''
    ? Number(typeof form.value.price === 'string' ? form.value.price.replace(/[^\d.]/g, '') : form.value.price)
    : null

  if (priceVal === null || isNaN(priceVal)) {
    validationErrors.push('กรุณากรอกราคาสินค้าให้ถูกต้อง')
  } else if (priceVal < 0) {
    validationErrors.push('ราคาสินค้าต้องไม่ติดลบ')
  }

  // 3.5. Installation fee validation
  if (form.value.has_installation_fee) {
    const installFee = Number(form.value.installation_fee)
    if (isNaN(installFee) || installFee < 0) {
      validationErrors.push('กรุณาระบุค่าติดตั้งให้ถูกต้อง (ไม่ติดลบ)')
    }
  }

  // 4. Original price vs sale price
  if (form.value.original_price !== null && form.value.original_price !== undefined && form.value.original_price !== '') {
    const origVal = Number(typeof form.value.original_price === 'string' ? form.value.original_price.replace(/[^\d.]/g, '') : form.value.original_price)
    if (isNaN(origVal)) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ไม่ถูกต้อง กรุณากรอกเป็นตัวเลข')
    } else if (origVal < 0) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ต้องไม่ติดลบ')
    } else if (priceVal !== null && !isNaN(priceVal) && origVal > 0 && priceVal > 0 && origVal <= priceVal) {
      validationErrors.push('ราคาเต็ม (ก่อนลด) ต้องมากกว่าราคาขาย')
    }
  }

  // 5. Image recommendation (warning, not blocking)
  if (!allImages.value || allImages.value.length === 0) {
    showToast('แนะนำให้เพิ่มรูปภาพสินค้าอย่างน้อย 1 รูป', 'warning')
  }

  // 6. Numeric dimension fields validation
  const numericFields = [
    { key: 'weight_kg', label: 'น้ำหนัก' },
    { key: 'width_cm', label: 'ความกว้าง' },
    { key: 'length_cm', label: 'ความยาว' },
    { key: 'height_cm', label: 'ความสูง' },
    { key: 'stock_quantity', label: 'จำนวนสต็อก' }
  ]
  for (const field of numericFields) {
    const val = form.value[field.key]
    if (val !== null && val !== undefined && val !== '') {
      const num = Number(val)
      if (isNaN(num)) {
        validationErrors.push(`${field.label} ต้องเป็นตัวเลขเท่านั้น`)
      } else if (num < 0) {
        validationErrors.push(`${field.label} ต้องไม่ติดลบ`)
      }
    }
  }

  // 7. Sale end date validation
  if (form.value.sale_end_date) {
    const saleEnd = new Date(form.value.sale_end_date)
    if (isNaN(saleEnd.getTime())) {
      validationErrors.push('วันสิ้นสุดโปรโมชัน ไม่ถูกต้อง')
    } else if (saleEnd < new Date()) {
      showToast('วันสิ้นสุดโปรโมชันผ่านมาแล้ว ระบบจะบันทึกให้แต่โปรดตรวจสอบอีกครั้ง', 'warning')
    }
  }

  // 8. SKU duplicate-character check (basic format)
  if (form.value.sku && String(form.value.sku).trim().length > 100) {
    validationErrors.push('รหัส SKU ยาวเกินไป (สูงสุด 100 ตัวอักษร)')
  }

  // 9. Slug validation
  if (form.value.slug && /\s/.test(form.value.slug)) {
    validationErrors.push('Slug ต้องไม่มีช่องว่าง')
  }

  // ─── Show validation errors and abort ───
  if (validationErrors.length > 0) {
    validationErrors.forEach((msg, i) => {
      setTimeout(() => showToast(msg, 'error', 5000), i * 200)
    })
    return
  }

  saving.value = true
  
  // Sync allImages back to form
  form.value.image_url = allImages.value && allImages.value.length > 0 ? allImages.value[0] : ''
  form.value.images = allImages.value && allImages.value.length > 1 ? allImages.value.slice(1) : []
  
  // Create a deep copy payload for sending to the API so we don't destroy `form.value` UI state
  const payload = JSON.parse(JSON.stringify(form.value))
  
  // Clean arrays for attributes (strip template UI metadata before saving to DB)
  if (Array.isArray(payload.attributes)) {
    payload.attributes = payload.attributes
      .filter(a => a && (String(a.key || '').trim() !== '' || String(a.value || '').trim() !== ''))
      .map(a => ({ key: String(a.key || '').trim(), value: String(a.value || '') }))
  } else {
    payload.attributes = []
  }

  if (Array.isArray(payload.faq)) {
    payload.faq = payload.faq.filter(f => f && (String(f.question || '').trim() !== '' || String(f.answer || '').trim() !== ''))
  } else {
    payload.faq = []
  }

  if (!Array.isArray(payload.badges)) {
    payload.badges = []
  }

  // Sync database boolean badge columns with dynamic badges list before coercion/saving
  const systemBadgesMap = {
    badge_bestseller: 'badge-bestseller',
    badge_warranty: 'badge-warranty',
    badge_installation: 'badge-installation',
    badge_new: 'badge-new',
    badge_recommended: 'badge-recommended',
    badge_free_shipping: 'badge-free-shipping'
  }
  for (const [col, badgeId] of Object.entries(systemBadgesMap)) {
    payload[col] = payload.badges.includes(badgeId)
  }

  if (payload.price === null || payload.price === undefined) payload.price = 0
  if (payload.category === null || payload.category === undefined) payload.category = ''
  // Sync categories array to payload
  if (!Array.isArray(payload.categories) || payload.categories.length === 0) {
    payload.categories = payload.category ? [payload.category] : []
  }
  payload.category = payload.categories.length > 0 ? payload.categories[0] : ''
  
  if (typeof payload.price === 'string') {
    payload.price = Number(payload.price.replace(/[^\d.]/g, ''))
  }
  if (typeof payload.original_price === 'string' && payload.original_price) {
    payload.original_price = Number(payload.original_price.replace(/[^\d.]/g, ''))
  }
  
  payload.is_active = typeof payload.is_active === 'string' ? payload.is_active === 'true' : Boolean(payload.is_active)
  payload.is_out_of_stock = typeof payload.is_out_of_stock === 'string' ? payload.is_out_of_stock === 'true' : Boolean(payload.is_out_of_stock)
  payload.badge_free_shipping = typeof payload.badge_free_shipping === 'string' ? payload.badge_free_shipping === 'true' : Boolean(payload.badge_free_shipping)
  payload.free_shipping_bkk = typeof payload.free_shipping_bkk === 'string' ? payload.free_shipping_bkk === 'true' : Boolean(payload.free_shipping_bkk)
  payload.requires_foundation = typeof payload.requires_foundation === 'string' ? payload.requires_foundation === 'true' : Boolean(payload.requires_foundation)
  payload.badge_warranty = typeof payload.badge_warranty === 'string' ? payload.badge_warranty === 'true' : Boolean(payload.badge_warranty)
  payload.badge_installation = typeof payload.badge_installation === 'string' ? payload.badge_installation === 'true' : Boolean(payload.badge_installation)
  payload.badge_new = typeof payload.badge_new === 'string' ? payload.badge_new === 'true' : Boolean(payload.badge_new)
  payload.badge_bestseller = typeof payload.badge_bestseller === 'string' ? payload.badge_bestseller === 'true' : Boolean(payload.badge_bestseller)
  payload.badge_recommended = typeof payload.badge_recommended === 'string' ? payload.badge_recommended === 'true' : Boolean(payload.badge_recommended)
  payload.limit_one_per_order = typeof payload.limit_one_per_order === 'string' ? payload.limit_one_per_order === 'true' : Boolean(payload.limit_one_per_order)
  payload.compare_enabled = typeof payload.compare_enabled === 'string' ? payload.compare_enabled === 'true' : payload.compare_enabled !== false
  
  const method = isEdit.value ? 'PUT' : 'POST'
  const url = isEdit.value ? `/api/products/${productId.value}` : '/api/products'
  
  try {
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(payload)
    })

    // ─── Handle HTTP status-level errors ───
    if (!res.ok) {
      let errorData = {}
      try { errorData = await res.json() } catch { /* non-JSON response */ }
      const serverMsg = errorData.error || ''

      if (res.status === 401 || res.status === 403) {
        showToast('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error', 5000)
        router.push('/admin/login')
        return
      }
      if (res.status === 400) {
        showToast('ข้อมูลไม่ถูกต้อง: ' + (serverMsg || 'กรุณาตรวจสอบข้อมูลที่กรอกอีกครั้ง'), 'error', 5000)
        return
      }
      if (res.status === 404) {
        showToast('ไม่พบสินค้าในระบบ อาจถูกลบไปแล้ว', 'error', 5000)
        return
      }
      if (res.status === 413) {
        showToast('ข้อมูลมีขนาดใหญ่เกินไป กรุณาลดขนาดรูปภาพหรือเนื้อหา', 'error', 5000)
        return
      }
      if (res.status === 429) {
        showToast('คำขอถูกจำกัด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง', 'warning', 5000)
        return
      }
      if (res.status >= 500) {
        showToast('เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่ภายหลัง หรือติดต่อผู้ดูแลระบบ', 'error', 5000)
        console.error('Server error:', res.status, serverMsg)
        return
      }
      // Generic fallback for other HTTP errors
      showToast('บันทึกไม่สำเร็จ (HTTP ' + res.status + '): ' + (serverMsg || 'Unknown Error'), 'error', 5000)
      return
    }

    const data = await res.json()
    if (data.success) {
      showToast('บันทึกข้อมูลสินค้าเรียบร้อยแล้ว', 'success')
      if (!isEdit.value && data.id) {
        isEdit.value = true
        productId.value = data.id
        router.replace(`/admin/products/${data.id}/edit`)
      }
    } else {
      console.error('Save product failed:', data.error)
      showToast('บันทึกไม่สำเร็จ: ' + (data.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'), 'error', 5000)
    }
  } catch (error) {
    console.error('Save error:', error)
    // ─── Differentiate network-level errors ───
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต', 'error', 5000)
    } else if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('Timeout')) {
      showToast('การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง', 'error', 5000)
    } else {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + error.message, 'error', 5000)
    }
  } finally {
    saving.value = false
  }
}

// AI Import Feature
const showAiImportModal = ref(false)
const rawAiInput = ref('')
const extractingAiAll = ref(false)

// AI Copywriting State
const showAiGenerateModal = ref(false)
const aiGeneratingDescription = ref(false)
const aiModelParams = ref({
  keywords: '',
  highlights: '',
  tone: 'luxury',
  length: 'standard',
  includeSEO: true
})

const openAiImportModal = () => {
  rawAiInput.value = ''
  showAiImportModal.value = true
}

const extractFromRaw = async () => {
  if (!rawAiInput.value.trim()) {
    showToast('กรุณาวางข้อมูลดิบก่อน', 'warning')
    return
  }
  
  extractingAiAll.value = true
  try {
    const res = await apiFetch('/api/ai/extract-product-all', {
      method: 'POST',
      body: JSON.stringify({ rawText: rawAiInput.value, knownCategory: form.value.category })
    })

    const data = await res.json()
    if (res.ok && data.success && data.data) {
      const extracted = data.data
      
      // Merge values into form intelligently
      if (extracted.name) form.value.name = extracted.name
      // Auto-fill image alt with product name for SEO
      if (extracted.name) form.value.image_alt = extracted.name
      if (extracted.sku) form.value.sku = extracted.sku
      if (extracted.price) form.value.price = extracted.price
      if (extracted.original_price) form.value.original_price = extracted.original_price
      if (extracted.image_url && typeof extracted.image_url === 'string') {
        form.value.image_url = extracted.image_url;
        if (!allImages.value.includes(extracted.image_url)) {
          allImages.value.unshift(extracted.image_url);
        }
      }
      if (Array.isArray(extracted.images)) {
        extracted.images.forEach(img => {
          if (img && typeof img === 'string' && !allImages.value.includes(img)) {
            allImages.value.push(img);
          }
        });
      }
      if (extracted.category && extracted.category !== form.value.category) {
        // Find if the category exists via name or just set it
        const catObj = categories.value.find(c => c.name === extracted.category)
        if (catObj) form.value.category = catObj.name
        else form.value.category = extracted.category
        
        await loadCategoryTemplates(form.value.category)
      } else if (!extracted.category && form.value.category) {
        if (categoryTemplates.value.length === 0) {
          await loadCategoryTemplates(form.value.category)
        }
      }
      if (extracted.seo_title) form.value.seo_title = extracted.seo_title
      if (extracted.seo_description) form.value.seo_description = extracted.seo_description
      if (extracted.seo_keywords) form.value.seo_keywords = extracted.seo_keywords
      if (extracted.slug) form.value.slug = extracted.slug
      if (extracted.llm_context) form.value.llm_context = extracted.llm_context
      if (extracted.description) form.value.description = extracted.description
      if (extracted.short_description) form.value.short_description = extracted.short_description
      if (extracted.remarks) form.value.remarks = extracted.remarks
      if (extracted.size) form.value.size = extracted.size
      
      if (extracted.weight_kg !== undefined && extracted.weight_kg !== null) form.value.weight_kg = extracted.weight_kg
      if (extracted.width_cm !== undefined && extracted.width_cm !== null) form.value.width_cm = extracted.width_cm
      if (extracted.length_cm !== undefined && extracted.length_cm !== null) form.value.length_cm = extracted.length_cm
      if (extracted.height_cm !== undefined && extracted.height_cm !== null) form.value.height_cm = extracted.height_cm
      
      // Badges
      if (extracted.badge_free_shipping === true) form.value.badge_free_shipping = true
      if (extracted.free_shipping_bkk === true) form.value.free_shipping_bkk = true
      if (extracted.requires_foundation === false) form.value.requires_foundation = false
      if (extracted.requires_foundation === true) form.value.requires_foundation = true
      if (extracted.badge_warranty === true) form.value.badge_warranty = true
      if (extracted.badge_installation === true) form.value.badge_installation = true
      if (extracted.badge_new === true) form.value.badge_new = true
      if (extracted.badge_bestseller === true) form.value.badge_bestseller = true
      
      if (Array.isArray(extracted.attributes) && extracted.attributes.length > 0) {
        // Build template-based attributes first, then map AI values into them
        if (categoryTemplates.value.length > 0) {
          // Start with template structure
          const templateAttrs = categoryTemplates.value.map(t => ({
            key: t.attribute_key,
            label: t.attribute_label,
            value: '',
            isTemplate: true
          }))
          
          // Map AI-extracted values into template slots
          const unmatchedAttrs = []
          extracted.attributes.forEach(attr => {
            const attrKey = attr.key ? String(attr.key).trim() : ''
            const attrKeyLower = attrKey.toLowerCase()
            const matched = templateAttrs.find(t => {
              const tKey = (t.key || '').toLowerCase()
              const tLabel = (t.label || '').toLowerCase()
              return tKey === attrKeyLower || 
                     tLabel === attrKeyLower ||
                     tLabel.includes(attrKeyLower) ||
                     attrKeyLower.includes(tKey) ||
                     tKey.includes(attrKeyLower)
            })
            if (matched) {
              matched.value = attr.value
            } else {
              unmatchedAttrs.push({ key: attrKey, value: attr.value, isTemplate: false })
            }
          })
          
          // Combine: templates (with filled values) + extra unmatched attributes
          form.value.attributes = [...templateAttrs, ...unmatchedAttrs]
        } else {
          // No templates available — just use raw AI attributes
          form.value.attributes = extracted.attributes
        }
      }
      
      if (Array.isArray(extracted.faq) && extracted.faq.length > 0) {
        if (form.value.faq.length === 1 && !form.value.faq[0].question) {
           form.value.faq = extracted.faq
        } else {
           form.value.faq.push(...extracted.faq)
        }
      }

      showToast('AI ดึงข้อมูลทั้งหมดและเติมลงฟอร์มเรียบร้อยแล้ว', 'success')
      showAiImportModal.value = false
    } else {
      showToast(data.error || 'ไม่สามารถให้ AI สกัดข้อมูลได้ กรุณาตรวจสอบ API Key ในตั้งค่า', 'error')
    }
  } catch (error) {
    console.error('AI Extraction error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    extractingAiAll.value = false
  }
}

const openAiGenerateModal = () => {
  aiModelParams.value.keywords = form.value.seo_keywords || ''
  
  let highlightsArr = []
  if (form.value.name) highlightsArr.push(`สินค้า: ${form.value.name}`)
  if (form.value.sku) highlightsArr.push(`รหัส/รุ่น: ${form.value.sku}`)
  if (form.value.category) highlightsArr.push(`หมวดหมู่: ${form.value.category}`)
  if (form.value.size) highlightsArr.push(`ขนาด/มิติ: ${form.value.size}`)
  if (form.value.short_description) highlightsArr.push(`สรุปเบื้องต้น: ${form.value.short_description}`)
  
  if (form.value.attributes && form.value.attributes.length > 0) {
    form.value.attributes.forEach(attr => {
      if (attr && (attr.key || attr.label) && attr.value) {
        highlightsArr.push(`- ${attr.label || attr.key}: ${attr.value}`)
      }
    })
  }
  
  aiModelParams.value.highlights = highlightsArr.join('\n')
  aiModelParams.value.tone = 'luxury'
  aiModelParams.value.length = 'standard'
  aiModelParams.value.includeSEO = true
  
  showAiGenerateModal.value = true
}

const generateDescriptionWithAI = async () => {
  if (!form.value.name) {
    showToast('กรุณากรอกชื่อสินค้าเพื่อความถูกต้องในการเขียนเนื้อหา', 'warning')
    return
  }

  aiGeneratingDescription.value = true
  try {
    const res = await apiFetch('/api/ai/generate-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productName: form.value.name,
        category: form.value.category,
        categories: form.value.categories,
        sku: form.value.sku,
        size: form.value.size,
        shortDescription: form.value.short_description || '',
        attributes: form.value.attributes,
        keywords: aiModelParams.value.keywords,
        highlights: aiModelParams.value.highlights,
        tone: aiModelParams.value.tone,
        length: aiModelParams.value.length,
        includeSEO: aiModelParams.value.includeSEO,
        currentDescription: form.value.description || ''
      })
    })

    const data = await res.json()
    if (data.success && data.data) {
      const payload = data.data
      if (payload.description) {
        form.value.description = payload.description
      }
      if (aiModelParams.value.includeSEO) {
        if (payload.seo_title) form.value.seo_title = payload.seo_title.substring(0, 60)
        if (payload.seo_description) form.value.seo_description = payload.seo_description.substring(0, 160)
        if (payload.seo_keywords) form.value.seo_keywords = payload.seo_keywords
      }
      showToast('AI เขียนเนื้อหาแนะนำสินค้าและ SEO เรียบร้อยแล้ว!', 'success')
      showAiGenerateModal.value = false
    } else {
      showToast(data.error || 'AI ไม่สามารถสร้างเนื้อหาได้', 'error')
    }
  } catch (error) {
    console.error('AI Copywriting error:', error)
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อ AI', 'error')
  } finally {
    aiGeneratingDescription.value = false
  }
}
</script>

<template>
  <div class="bg-slate-50/70 min-h-screen pb-32 font-sans text-slate-800 antialiased">
    <!-- Sticky Header & Tab Navigation Bar -->
    <div class="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
      <div class="w-full px-4 sm:px-6">
        <!-- Top Action Bar -->
        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3 min-w-0">
            <router-link to="/admin/products" class="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0" title="ย้อนกลับไปหน้ารายการสินค้า">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </router-link>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h1 class="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {{ isEdit ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่' }}
                </h1>
                <span v-if="isEdit" class="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md shrink-0">EDIT</span>
                <span v-else class="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md shrink-0">NEW</span>
              </div>
              <p v-if="form.name" class="text-xs text-slate-500 truncate font-medium max-w-md sm:max-w-xl">{{ form.name }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 shrink-0">
            <a v-if="isEdit && form.slug" :href="'/product/' + form.slug" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
              ดูหน้าเว็บจริง
            </a>
            <button type="button" @click="openAiImportModal" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-200/60">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
              นำเข้าจาก AI
            </button>
            <button type="button" @click="saveProduct" :disabled="saving" class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50">
              <svg v-if="saving" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
              บันทึก
            </button>
          </div>
        </div>
        
        <!-- Segmented Navigation Tabs -->
        <div class="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-2 pt-1 border-t border-slate-100">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-3.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap rounded-lg transition-all duration-200 select-none relative',
              activeTab === tab.id 
                ? 'bg-emerald-50 text-emerald-700 shadow-xs font-bold border border-emerald-200/80' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            ]"
          >
            <svg class="w-3.5 h-3.5 shrink-0" :class="activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="tab.icon"></path>
            </svg>
            <span>{{ tab.label }}</span>
            <span v-if="tab.id === 'media' && allImages.length" class="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">{{ allImages.length }}</span>
            <span v-if="tab.id === 'attributes' && form.attributes?.length" class="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">{{ form.attributes.length }}</span>
            <span v-if="tab.id === 'faq' && form.faq?.length" class="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">{{ form.faq.length }}</span>
            <span v-if="tab.id === 'sales' && form.related_products?.length" class="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-200 text-slate-700">{{ form.related_products.length }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-pulse flex flex-col items-center">
        <div class="h-8 w-8 bg-emerald-300 rounded-full mb-3"></div>
        <div class="h-4 w-36 bg-slate-200 rounded"></div>
      </div>
    </div>

    <!-- Main Form Container -->
    <form v-else @submit.prevent="saveProduct" class="w-full px-4 sm:px-6 pt-6">
      
      <!-- TAB 1: ข้อมูลพื้นฐาน (Basic Info) -->
      <div v-show="activeTab === 'basic'" class="space-y-6 animate-[fadeIn_0.2s_ease-out]">
        <!-- Section: General Info -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">1. ข้อมูลหลักสินค้า</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">ชื่อสินค้า <span class="text-rose-500">*</span></label>
              <input v-model="form.name" type="text" maxlength="1000" placeholder="เช่น โรงเรือนปลูกต้นไม้ไซส์ L" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>รหัสสินค้า / SKU</span>
                <InfoTooltip title="SKU" description="รหัสอ้างอิงสินค้าเฉพาะสำหรับการสต๊อกและเอกสาร" />
              </label>
              <input v-model="form.sku" type="text" maxlength="100" placeholder="เช่น MS-GH004" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">หมวดหมู่สินค้า <span class="text-rose-500">*</span></label>
              <AdminCategoryMultiDropdown v-model="form.categories" :categories="categories" value-key="name" placeholder="เลือกหมวดหมู่" />
            </div>
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <span>URL Slug (ลิงก์สินค้า)</span>
              <InfoTooltip title="URL Slug" description="ส่วนท้ายของลิงก์ URL สินค้า เช่น /product/greenhouse-l ช่วยให้ค้นหาเจอบน Google" />
            </label>
            <div class="flex items-center gap-2">
              <div class="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                <span class="text-slate-400 font-mono select-none hidden sm:inline">domain.com/product/</span>
                <input v-model="form.slug" type="text" maxlength="255" placeholder="greenhouse-l" class="flex-1 bg-transparent border-none p-1 font-mono text-indigo-700 focus:ring-0 outline-none text-xs">
              </div>
              <button type="button" @click="generateSlug" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                สร้างจากชื่อ
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">ขนาดสินค้า (กxยxส)</label>
              <input v-model="form.size" type="text" placeholder="เช่น 2.4 x 3.6 x 2.2 เมตร" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">คะแนนรีวิว (0 - 5.0)</label>
              <input v-model.number="form.rating" type="number" step="0.1" min="0" max="5" placeholder="4.8" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">จำนวนผู้รีวิว</label>
              <input v-model.number="form.review_count" type="number" step="1" min="0" placeholder="45" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
            </div>
          </div>
        </div>

        <!-- Section: Pricing & Stock -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">2. ราคา สต๊อก และการจำกัดเวลา</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5">ราคาตั้งต้น (ขีดฆ่า)</label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">฿</span>
                <input v-model.number="form.original_price" type="number" placeholder="15000" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-emerald-700 mb-1.5">ราคาขายจริง <span class="text-rose-500">*</span></label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-emerald-600 text-xs font-bold">฿</span>
                <input v-model.number="form.price" type="number" placeholder="12900" class="w-full bg-emerald-50/40 border border-emerald-300 text-emerald-900 text-xs rounded-lg pl-7 pr-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold">
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1.5">จำนวนสต๊อกคงเหลือ</label>
              <input v-model.number="form.stock_quantity" type="number" min="0" placeholder="ปล่อยว่างหากมีของตลอด" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
            </div>

            <div>
              <label class="block text-xs font-bold text-orange-600 mb-1.5 flex items-center justify-between">
                <span>วันหมดอายุ Flash Sale</span>
                <InfoTooltip title="Flash Sale" description="ระบบจะแสดงนาฬิกานับถอยหลังหมดเวลาราคาพิเศษอัตโนมัติ" />
              </label>
              <input v-model="form.sale_end_date" type="datetime-local" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none">
            </div>
          </div>
        </div>

        <!-- Section: Shipping & Installation -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">3. การจัดส่งและค่าบริการติดตั้ง</h3>
          
          <!-- Shipping options pills -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2">นโยบายค่าจัดส่งสินค้า</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors"
                     :class="(!form.badge_free_shipping && !form.free_shipping_bkk) ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'">
                <input type="radio" name="shipping_type" class="text-emerald-600 focus:ring-emerald-500"
                       :checked="!form.badge_free_shipping && !form.free_shipping_bkk"
                       @change="form.badge_free_shipping = false; form.free_shipping_bkk = false">
                <div>
                  <span class="block text-xs font-bold text-slate-800">คิดค่าจัดส่งปกติ</span>
                  <span class="block text-[10px] text-slate-500">คำนวณตามระยะทาง/น้ำหนัก</span>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors"
                     :class="form.free_shipping_bkk ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'">
                <input type="radio" name="shipping_type" class="text-emerald-600 focus:ring-emerald-500"
                       :checked="form.free_shipping_bkk"
                       @change="form.badge_free_shipping = false; form.free_shipping_bkk = true">
                <div>
                  <span class="block text-xs font-bold text-slate-800">ส่งฟรี กทม.และปริมณฑล</span>
                  <span class="block text-[10px] text-slate-500">ฟรี 6 จังหวัดรอบกทม.</span>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors"
                     :class="form.badge_free_shipping ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'">
                <input type="radio" name="shipping_type" class="text-emerald-600 focus:ring-emerald-500"
                       :checked="form.badge_free_shipping"
                       @change="form.badge_free_shipping = true; form.free_shipping_bkk = false">
                <div>
                  <span class="block text-xs font-bold text-slate-800">จัดส่งฟรีทั่วประเทศ</span>
                  <span class="block text-[10px] text-slate-500">ฟรีทุกจังหวัดทั่วไทย</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Weight and dimensions -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
              <span>ขนาดและน้ำหนักกล่องเพื่อคำนวณค่าจัดส่ง</span>
              <InfoTooltip title="น้ำหนักและขนาด" description="ใช้คำนวณค่าจัดส่งโดยตรงในหน้าชำระเงิน" />
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-1">น้ำหนัก (กก.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.weight_kg" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-1">ความกว้าง (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.width_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-1">ความยาว (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.length_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-slate-500 mb-1">ความสูง (ซม.) <span class="text-rose-500">*</span></label>
                <input v-model.number="form.height_cm" type="number" step="0.1" min="0" placeholder="0.0" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
              </div>
            </div>
          </div>

          <!-- Installation fee inputs -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer" @click="form.has_installation_fee = !form.has_installation_fee">
              <div>
                <span class="block text-xs font-bold text-slate-800">มีค่าบริการติดตั้งแยกต่างหาก</span>
                <span class="block text-[10px] text-slate-500">ระบุค่าติดตั้งเหมาจ่ายตายตัว</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative', form.has_installation_fee ? 'bg-emerald-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.has_installation_fee ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>

            <div :class="!form.has_installation_fee ? 'opacity-40 pointer-events-none' : ''">
              <label class="block text-xs font-bold text-slate-700 mb-1">ค่าบริการติดตั้ง (บาท)</label>
              <input v-model.number="form.installation_fee" :disabled="!form.has_installation_fee" type="number" min="0" placeholder="เช่น 1500" class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
            </div>
          </div>
        </div>

        <!-- Section: Summaries & Remarks -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">4. รายละเอียดย่อยและหมายเหตุ</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดย่อยสรุปจุดเด่น (Short Description)</label>
              <textarea v-model="form.short_description" rows="2" maxlength="500" placeholder="อธิบายจุดเด่นสั้นๆ 1-2 บรรทัดสำหรับพรีวิว..." class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"></textarea>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุพิเศษ (Special Remarks)</label>
              <textarea v-model="form.remarks" rows="2" maxlength="500" placeholder="เช่น * ไม่รวมค่าจัดส่งต่างจังหวัด..." class="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Section: Status & Badges -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">5. สถานะการจำหน่าย สวิตช์เงื่อนไข และป้ายสินค้า</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <!-- Switch Active -->
            <div @click="form.is_active = !form.is_active" class="p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between" :class="form.is_active ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'">
              <div>
                <span class="block text-xs font-bold" :class="form.is_active ? 'text-emerald-800' : 'text-slate-600'">เปิดขายบนหน้าเว็บ</span>
                <span class="block text-[10px] text-slate-400">แสดงสินค้าบนสโตร์</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative shrink-0', form.is_active ? 'bg-emerald-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.is_active ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>

            <!-- Switch Out of stock -->
            <div @click="form.is_out_of_stock = !form.is_out_of_stock" class="p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between" :class="form.is_out_of_stock ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-slate-50'">
              <div>
                <span class="block text-xs font-bold" :class="form.is_out_of_stock ? 'text-amber-800' : 'text-slate-600'">ป้าย "สินค้าหมดชั่วคราว"</span>
                <span class="block text-[10px] text-slate-400">ปิดการสั่งแต่คงหน้า SEO ไว้</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative shrink-0', form.is_out_of_stock ? 'bg-amber-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.is_out_of_stock ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>

            <!-- Switch Foundation -->
            <div @click="form.requires_foundation = !form.requires_foundation" class="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <span class="block text-xs font-bold text-slate-700">ต้องปูพื้นซีเมนต์/สำเร็จ</span>
                <span class="block text-[10px] text-slate-400">คำนวณแผ่นพื้นเพิ่มหากวางบนดิน</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative shrink-0', form.requires_foundation ? 'bg-blue-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.requires_foundation ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>

            <!-- Switch Limit 1 -->
            <div @click="form.limit_one_per_order = !form.limit_one_per_order" class="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <span class="block text-xs font-bold text-slate-700">จำกัด 1 ชิ้น/คำสั่งซื้อ</span>
                <span class="block text-[10px] text-slate-400">สำหรับสินค้าขนาดใหญ่พิเศษ</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative shrink-0', form.limit_one_per_order ? 'bg-rose-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.limit_one_per_order ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>

            <!-- Switch Compare -->
            <div @click="form.compare_enabled = !form.compare_enabled" class="p-3 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer transition-colors flex items-center justify-between">
              <div>
                <span class="block text-xs font-bold text-slate-700">อนุญาตให้เปรียบเทียบสเปก</span>
                <span class="block text-[10px] text-slate-400">เปิดปุ่ม Compare หน้าเว็บ</span>
              </div>
              <div :class="['w-9 h-5 rounded-full transition-colors relative shrink-0', form.compare_enabled ? 'bg-indigo-500' : 'bg-slate-300']">
                <span :class="['w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform', form.compare_enabled ? 'left-4.5' : 'left-0.5']"></span>
              </div>
            </div>
          </div>

          <!-- Feature Badges -->
          <div class="pt-3 border-t border-slate-100">
            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-bold text-slate-700">ป้ายจุดขายสินค้า (Feature Badges)</label>
              <button type="button" @click="openCreateBadge" class="text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-md transition-colors">+ เพิ่มป้ายใหม่</button>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div v-for="badge in allBadges" :key="badge.id" class="flex items-center justify-between p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                <label class="flex items-center gap-2 cursor-pointer min-w-0 flex-1" @click.prevent="toggleBadge(badge.id)">
                  <div :class="['w-4 h-4 rounded border flex items-center justify-center shrink-0', form.badges.includes(badge.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white']">
                    <svg v-if="form.badges.includes(badge.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span class="font-semibold text-slate-700 truncate">{{ badge.name }}</span>
                </label>
                <div v-if="!badge.is_system" class="flex items-center gap-1 shrink-0 ml-1">
                  <button type="button" @click="openEditBadge(badge)" class="text-slate-400 hover:text-indigo-600 p-0.5">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </button>
                  <button type="button" @click="deleteBadge(badge)" class="text-slate-400 hover:text-rose-600 p-0.5">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: รายละเอียดสินค้า (Details) -->
      <div v-show="activeTab === 'details'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800">รายละเอียดสินค้าแบบเต็ม (Rich Text & SEO)</h2>
            <p class="text-xs text-slate-500">ใส่รายละเอียด คุณสมบัติ รูปภาพ และตารางข้อมูลเพื่อผลทาง SEO</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" @click="openAiGenerateModal" class="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z"></path></svg>
              เขียนด้วย AI
            </button>
            <button type="button" @click="formatDescriptionSEO" :disabled="aiFormatting || !form.description" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200/60 flex items-center gap-1.5 transition-all disabled:opacity-50">
              <svg v-if="aiFormatting" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>AI จัดฟอร์แมต SEO</span>
            </button>
          </div>
        </div>

        <div class="ckeditor-container border border-slate-200 rounded-lg overflow-hidden">
          <Ckeditor :editor="editor" v-model="form.description" :config="editorConfig" />
        </div>
      </div>

      <!-- TAB 3: สเปกสินค้า (Attributes) -->
      <div v-show="activeTab === 'attributes'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800">ตารางสเปกสินค้า (Product Attributes)</h2>
            <p class="text-xs text-slate-500">ข้อมูลจำเพาะเชิงเทคนิคสำหรับแสดงผลเปรียบเทียบสเปก</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" @click="generateAttributes" :disabled="aiGeneratingAttributes || !form.name" class="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5">
              <svg v-if="aiGeneratingAttributes" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>AI ดึงสเปกอัตโนมัติ</span>
            </button>
            <button type="button" @click="addAttribute" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200">
              + เพิ่มสเปก Custom
            </button>
          </div>
        </div>

        <!-- Attributes List -->
        <div class="space-y-2">
          <div v-for="(attr, index) in form.attributes" :key="'attr-'+index" class="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <!-- Template Attr -->
            <template v-if="attr.isTemplate">
              <div class="w-full sm:w-1/3 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{{ attr.label }}</span>
                <span v-if="attr.required" class="text-rose-500">*</span>
              </div>
              <template v-if="attr.type === 'select'">
                <select v-model="attr.value" class="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-1.5 outline-none focus:border-emerald-500">
                  <option value="">-- ไม่ระบุ --</option>
                  <option v-for="opt in attr.options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
              </template>
              <template v-else-if="attr.type === 'number'">
                <input v-model="attr.value" type="number" step="any" placeholder="ระบุตัวเลข" class="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-1.5 outline-none focus:border-emerald-500">
              </template>
              <template v-else>
                <input v-model="attr.value" type="text" placeholder="ระบุรายละเอียด" class="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-1.5 outline-none focus:border-emerald-500">
              </template>
            </template>
            
            <!-- Custom Attr -->
            <template v-else>
              <input v-model="attr.key" type="text" placeholder="หัวข้อสเปก (เช่น วัสดุ)" class="w-full sm:w-1/3 bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-1.5 outline-none focus:border-emerald-500">
              <input v-model="attr.value" type="text" placeholder="รายละเอียด" class="flex-1 bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-1.5 outline-none focus:border-emerald-500">
              <button type="button" @click="removeAttribute(index)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </template>
          </div>

          <div v-if="!form.attributes || form.attributes.length === 0" class="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            ยังไม่มีข้อมูลสเปก เลือกหมวดหมู่สินค้าในแท็บแรกเพื่อโหลดตารางสเปกแนะนำ
          </div>
        </div>
      </div>

      <!-- TAB 4: รูปภาพและสื่อ (Media) -->
      <div v-show="activeTab === 'media'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800">แกลเลอรีรูปภาพสินค้า (Gallery & Cover)</h2>
          <p class="text-xs text-slate-500">รูปภาพแรกสุดจะถูกใช้เป็นภาพปกหลัก ลากวางเพื่อสลับตำแหน่งได้เลย</p>
        </div>

        <!-- Alt Text -->
        <div class="bg-amber-50/60 border border-amber-200/80 rounded-lg p-3">
          <label class="block text-xs font-bold text-amber-900 mb-1">Image Alt Text (คำบรรยายภาพเพื่อ SEO)</label>
          <input v-model="form.image_alt" type="text" placeholder="เช่น รูปโรงเรือนอเนกประสงค์ขนาด L สีเขียว" class="w-full bg-white border border-amber-200 text-slate-900 text-xs rounded-md px-3 py-2 outline-none">
        </div>

        <!-- Draggable Gallery -->
        <draggable 
          v-model="allImages" 
          class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3" 
          item-key="index"
          :animation="200"
        >
          <template #header>
            <!-- Dropzone Tile -->
            <div 
              class="relative rounded-lg border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all aspect-square flex flex-col items-center justify-center p-3 text-center cursor-pointer bg-slate-50"
              @dragover.prevent
              @drop.prevent="handleImagesDrop"
            >
              <input type="file" multiple accept="image/*" @change="handleImagesUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :disabled="uploadingImages">
              <template v-if="uploadingImages">
                <svg class="animate-spin h-6 w-6 text-emerald-600 mb-1" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span class="text-[10px] font-bold text-emerald-700">กำลังอัปโหลด...</span>
              </template>
              <template v-else>
                <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <span class="text-xs font-bold text-slate-700">เพิ่มรูปภาพ</span>
                <span class="text-[10px] text-slate-400">ลากไฟล์มาวางที่นี่</span>
              </template>
            </div>
          </template>

          <template #item="{ element, index }">
            <div class="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group bg-white shadow-xs" :class="index === 0 ? 'ring-2 ring-emerald-500' : ''">
              <img :src="element" class="w-full h-full object-cover">
              
              <!-- Badges -->
              <div v-if="index === 0" class="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">ภาพปก</div>
              <div v-else class="absolute top-1.5 left-1.5 bg-slate-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">#{{ index + 1 }}</div>

              <!-- Delete Action -->
              <button type="button" @click.stop="removeImage(index)" class="absolute top-1.5 right-1.5 bg-white/90 hover:bg-rose-600 text-slate-700 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-xs">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </template>
        </draggable>
      </div>

      <!-- TAB 5: สินค้าเกี่ยวเนื่อง (Sales) -->
      <div v-show="activeTab === 'sales'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800">สินค้าเกี่ยวเนื่องและอะไหล่ (Related Products)</h2>
            <p class="text-xs text-slate-500">เลือกสินค้าแนะนำคู่กันเพื่อเพิ่มยอดขายแบบ Cross-selling</p>
          </div>
          <div class="w-full sm:w-64">
            <AdminCategoryDropdown v-model="relatedFilterCategory" :categories="[{id: 'all', name: 'ดูทุกหมวดหมู่'}, ...categories]" value-key="name" placeholder="กรองตามหมวดหมู่" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-1 border border-slate-100 rounded-lg">
          <label v-for="prod in filteredRelatedProducts" :key="prod.id" 
            class="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all bg-white"
            :class="isRelatedSelected(prod.id) ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500/30' : 'border-slate-200 hover:bg-slate-50'">
            <input type="checkbox" :value="prod.id" v-model="form.related_products" class="rounded text-indigo-600 focus:ring-indigo-500">
            <div class="w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0">
              <img v-if="prod.image_url" :src="prod.image_url" class="w-full h-full object-cover">
            </div>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold text-slate-800 truncate">{{ prod.name }}</div>
              <div class="text-[10px] text-slate-400 truncate">{{ prod.category || 'ไม่มีหมวดหมู่' }}</div>
            </div>
          </label>
        </div>
      </div>

      <!-- TAB 6: คำถามที่พบบ่อย (FAQ) -->
      <div v-show="activeTab === 'faq'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-sm font-bold text-slate-800">คำถามที่พบบ่อย (FAQ)</h2>
            <p class="text-xs text-slate-500">คำถามตอบที่พบบ่อยบนหน้าสินค้า ช่วยลดภาระงานของแอดมิน</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" @click.prevent="generateFaq" :disabled="aiGeneratingFaq || !form.name" class="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold rounded-lg transition-colors border border-indigo-200/60 flex items-center gap-1.5 disabled:opacity-50">
              <svg v-if="aiGeneratingFaq" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span>{{ aiGeneratingFaq ? 'กำลังคิด FAQ...' : 'ให้ AI ช่วยคิด FAQ' }}</span>
            </button>
            <button type="button" @click.prevent="addFaq" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200">
              + เพิ่มด้วยตัวเอง
            </button>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="(item, idx) in form.faq" :key="'faq-item-'+idx" class="p-3.5 bg-slate-50 rounded-lg border border-slate-200 relative">
            <button type="button" @click.prevent="removeFaq(idx)" class="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <div class="space-y-2 pr-8">
              <input v-model="item.question" placeholder="คำถาม (เช่น รับประกันกี่ปี?)" class="w-full bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-md px-3 py-2 outline-none focus:border-indigo-500">
              <textarea v-model="item.answer" placeholder="คำตอบที่ชัดเจนและกระชับ..." rows="2" class="w-full bg-white border border-slate-200 text-xs text-slate-600 rounded-md px-3 py-2 outline-none focus:border-indigo-500 resize-none"></textarea>
            </div>
          </div>

          <div v-if="!form.faq || form.faq.length === 0" class="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            ยังไม่มีคำถามตอบที่พบบ่อย กดปุ่มด้านบนเพื่อเพิ่มด้วยตัวเองหรือใช้ AI
          </div>
        </div>
      </div>

      <!-- TAB 7: การ์ดสินค้า (Industrial Machinery Card UI & Live Preview) -->
      <div v-show="activeTab === 'card_ui'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-[fadeIn_0.2s_ease-out]">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
          <div>
            <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#002855]"></span>
              <span>ตั้งค่าการ์ดสินค้าตามแบบอุตสาหกรรม (Industrial Machine Card UI)</span>
            </h2>
            <p class="text-xs text-slate-500">จัดการข้อมูลที่แสดงบนการ์ดสินค้าทุกส่วนอย่างครบถ้วนตามแบบแคตตาล็อก KODERA / CASTING</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Live Interactive Card
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Controls (col-span-7) -->
          <div class="lg:col-span-7 space-y-6">
            
            <!-- Section 1: ข้อมูลหัวการ์ด & รหัสรุ่น -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h3 class="text-xs font-black uppercase tracking-wider text-[#002855] flex items-center gap-2">
                <svg class="w-4 h-4 text-[#002855]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                1. ป้ายแบรนด์ / หมวดหมู่ & รหัสรุ่น
              </h3>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">
                    ป้ายหัวการ์ด (Top Left Badge)
                  </label>
                  <input 
                    v-model="form.card_features.top_badge" 
                    type="text" 
                    :placeholder="form.category || 'CASTING'" 
                    class="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#002855] font-bold text-[#002855]"
                  />
                  <span class="text-[10px] text-slate-400">เว้นว่างไว้จะใช้ชื่อหมวดหมู่สินค้า</span>
                </div>

                <div>
                  <label class="block text-[11px] font-bold text-slate-700 mb-1">
                    รหัสรุ่นตัวหนา (Model Name)
                  </label>
                  <input 
                    v-model="form.card_features.model_name" 
                    type="text" 
                    :placeholder="form.sku || 'C300A'" 
                    class="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#002855] font-black text-slate-900"
                  />
                  <span class="text-[10px] text-slate-400">เว้นว่างไว้จะใช้ SKU ของสินค้า</span>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-bold text-slate-700 mb-1">
                  คำบรรยายประเภทเครื่อง (Subtitle)
                </label>
                <input 
                  v-model="form.card_features.subtitle" 
                  type="text" 
                  placeholder="เครื่องตัดปลอกสายไฟ KODERA" 
                  class="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#002855]"
                />
              </div>
            </div>

            <!-- Section 2: สเปกขนาดสายไฟหลัก (Main Spec Pill) -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-wider text-[#002855] flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#002855]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  2. สเปกขนาดสายไฟหลัก (Main Spec Pill)
                </h3>
                <button 
                  type="button" 
                  @click.prevent="autoDetectSpecFromAttributes" 
                  class="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200/60 flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  ดึงจาก Attributes
                </button>
              </div>

              <div>
                <input 
                  v-model="form.card_features.spec_range" 
                  type="text" 
                  placeholder="AWG#16 (1.25sq) ~ AWG#36 (0.01sq)" 
                  class="w-full bg-[#002855] text-white font-bold text-xs rounded-lg px-3.5 py-2.5 outline-none placeholder:text-blue-300 shadow-inner"
                />
                <span class="text-[10px] text-slate-400 mt-1 block">ช่วงขนาดสายไฟที่รองรับ แสดงในแถบสีน้ำเงินเข้ม</span>
              </div>
            </div>

            <!-- Section 3: ฟังก์ชันการทำงาน (Capabilities Badges) -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-wider text-[#002855] flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#002855]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  3. ฟังก์ชันการทำงาน (Capabilities)
                </h3>
                <button 
                  type="button" 
                  @click.prevent="addCustomCapability" 
                  class="text-[10px] font-bold text-[#002855] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200"
                >
                  + เพิ่มฟังก์ชันกำหนดเอง
                </button>
              </div>

              <!-- Quick Toggles for Standard Capabilities -->
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="std in standardCapabilities" 
                  :key="std.id" 
                  type="button" 
                  @click.prevent="toggleCapability(std.id)" 
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border"
                  :class="isCapabilityEnabled(std.id) ? 'bg-[#002855] text-white border-[#002855] shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'"
                >
                  <svg v-if="isCapabilityEnabled(std.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                  <span>{{ std.label }}</span>
                </button>
              </div>

              <!-- Detailed list for active capabilities -->
              <div class="space-y-2 pt-2">
                <div 
                  v-for="(cap, idx) in form.card_features?.capabilities" 
                  :key="'cap-edit-'+idx" 
                  class="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 text-xs"
                >
                  <input type="checkbox" v-model="cap.enabled" class="rounded text-[#002855] shrink-0" />
                  <input v-model="cap.label" type="text" placeholder="ชื่อฟังก์ชัน" class="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none" />
                  <select v-model="cap.icon" class="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none">
                    <option value="cut">ตัด (Cut)</option>
                    <option value="strip_end">ปอกปลาย (Strip End)</option>
                    <option value="strip_mid">ปอกกลางสาย (Strip Middle)</option>
                    <option value="twist">ปั่นเกลียว (Twist)</option>
                    <option value="ribbon">แยกสายแพ (Ribbon Split)</option>
                  </select>
                  <button type="button" @click.prevent="removeCapability(idx)" class="text-slate-400 hover:text-rose-600 p-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Section 4: ข้อความสรุปจุดเด่นบนการ์ด -->
            <div class="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-black uppercase tracking-wider text-[#002855] flex items-center gap-2">
                  <svg class="w-4 h-4 text-[#002855]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  4. ข้อความสรุปจุดเด่นบนการ์ด (Summary)
                </h3>
                <button 
                  type="button" 
                  @click.prevent="autoFillSummaryFromDescription" 
                  class="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-200/60 flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  คัดลอกจากคำอธิบายย่อ
                </button>
              </div>

              <div>
                <textarea 
                  v-model="form.card_features.summary" 
                  rows="3" 
                  placeholder="เครื่องตัดปลอกสายไฟที่มีขนาดเล็ก และน้ำหนักเบา ซึ่งพัฒนาจากรุ่น C300 สามารถตัดสายไฟได้หลายแบบ" 
                  class="w-full bg-white border border-slate-200 text-xs text-slate-700 rounded-lg p-3 outline-none focus:border-[#002855] leading-relaxed resize-none"
                ></textarea>
                <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>ความยาวที่เหมาะสม: 80 - 140 ตัวอักษร</span>
                  <span>{{ (form.card_features?.summary || '').length }} ตัวอักษร</span>
                </div>
              </div>
            </div>

            <!-- Section 5: ตัวอย่างสายไฟที่รองรับ (Supported Wire Samples) -->
            <div class="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div class="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-200/80">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-[#002855]/10 text-[#002855] flex items-center justify-center font-bold">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                  </div>
                  <div>
                    <h3 class="text-xs sm:text-sm font-black uppercase tracking-wider text-[#002855] flex items-center gap-1.5">
                      5. ตัวอย่างสายไฟที่รองรับ (Supported Wire Samples)
                    </h3>
                    <p class="text-[11px] text-slate-500 font-normal">จัดการประเภทสายไฟ ตั้งชื่อ ปรับแต่งสไตล์ หรืออัปโหลดรูปภาพสายไฟจริง</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <router-link
                    to="/admin/wires"
                    target="_blank"
                    class="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="เปิดหน้าระบบจัดการข้อมูลสายไฟและพรีเซ็ตในแท็บใหม่"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>จัดการข้อมูลสายไฟ</span>
                  </router-link>
                  <span class="px-2 py-0.5 bg-blue-50 text-[#002855] text-[11px] font-bold rounded-md border border-blue-100">
                    {{ form.card_features?.wire_samples?.length || 0 }} รายการ
                  </span>
                  <button 
                    v-if="form.card_features?.wire_samples?.length > 0"
                    type="button" 
                    @click.prevent="clearAllWireSamples" 
                    class="text-[11px] text-slate-400 hover:text-rose-600 px-2 py-0.5 rounded hover:bg-rose-50 transition-colors font-medium cursor-pointer"
                    title="ล้างรายการสายไฟทั้งหมด"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
              </div>

              <!-- Presets for fast import -->
              <div class="bg-white/80 p-3 rounded-xl border border-slate-200/70 space-y-2">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    ชุดพรีเซ็ตแนะนำตามรุ่นสินค้า (Preset Templates):
                  </span>
                  <span class="text-[10px] text-slate-400">คลิกเพื่อแทนที่ตัวอย่างสายไฟทันที</span>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  <button 
                    v-for="(preset, pIdx) in wirePresets" 
                    :key="'wp-'+pIdx" 
                    type="button" 
                    @click.prevent="applyWirePreset(preset)" 
                    class="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-[#002855] text-xs font-semibold rounded-lg border border-slate-200 text-left transition-colors flex items-center justify-between group cursor-pointer"
                    :title="preset.name"
                  >
                    <span class="truncate">{{ preset.name }}</span>
                    <span class="text-[10px] text-slate-400 group-hover:text-blue-600 shrink-0 ml-1">({{ preset.samples.length }})</span>
                  </button>
                </div>
              </div>

              <!-- Quick Add Toolbar -->
              <div class="bg-slate-100/80 p-3 rounded-xl border border-slate-200 space-y-2">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span class="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    เพิ่มรายการสายไฟด่วน (Quick Add):
                  </span>
                  <button 
                    type="button" 
                    @click.prevent="addCustomImageWireSample" 
                    class="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-all flex items-center gap-1 cursor-pointer ml-auto"
                    title="เพิ่มรายการสายไฟโดยใช้วิธีอัปโหลดรูปภาพ"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    + อัปโหลดรูปภาพสายไฟ
                  </button>
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                  <!-- สายเดี่ยว & ปอกกลาง -->
                  <button type="button" @click.prevent="addWireSample('single_black', 'สายเดี่ยวสีดำ ปอก 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    <span class="w-2 h-2 rounded-full bg-slate-800"></span> + สายเดี่ยว (ดำ)
                  </button>
                  <button type="button" @click.prevent="addWireSample('single_blue', 'สายเดี่ยวสีน้ำเงิน ปอก 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer">
                    <span class="w-2 h-2 rounded-full bg-blue-600"></span> + สายเดี่ยว (น้ำเงิน)
                  </button>
                  <button type="button" @click.prevent="addWireSample('single_red', 'สายเดี่ยวสีแดง ปอก 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-[11px] font-semibold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer">
                    <span class="w-2 h-2 rounded-full bg-rose-600"></span> + สายเดี่ยว (แดง)
                  </button>
                  <button type="button" @click.prevent="addWireSample('ground_yellow_green', 'สายดินเขียว-เหลือง')" class="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer">
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span> + สายดิน
                  </button>
                  <button type="button" @click.prevent="addWireSample('mid_strip_multi', 'ปอกกลางสายหลายตำแหน่ง')" class="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-semibold border border-indigo-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + ปอกกลางสายหลายช่วง
                  </button>

                  <!-- สายคู่, สายแยก, สายแพ -->
                  <button type="button" @click.prevent="addWireSample('twocore_sheath_strip', 'สายคู่ 2 คอร์ ปอกเปลือกนอก')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายคู่ 2 คอร์
                  </button>
                  <button type="button" @click.prevent="addWireSample('twocore_split_y', 'สายแยก 2 แฉก (Y-Branch)')" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-700 rounded-lg text-[11px] font-semibold border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายแยก 2 แฉก
                  </button>
                  <button type="button" @click.prevent="addWireSample('flat_ribbon_split', 'สายแพแบนแยกเส้นหลายสาย')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายแพแยกเส้น
                  </button>
                  <button type="button" @click.prevent="addWireSample('flat_ribbon_semi_strip', 'สายแพแบน กึ่งปอกคงปลอก 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายแพกึ่งปอก
                  </button>
                  <button type="button" @click.prevent="addWireSample('flat_ribbon_grey', 'สายแพแบนสีเทา (ปอกปลาย 2 ด้าน)')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายแพสีเทา
                  </button>
                  <button type="button" @click.prevent="addWireSample('flat_ribbon_rainbow', 'สายแพแบนสีรุ้ง (ปอกปลาย 2 ด้าน)')" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-[11px] font-semibold border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + สายแพสีรุ้ง
                  </button>
                  <button type="button" @click.prevent="addWireSample('corrugated_tube', 'ท่อร้อยสายไฟลูกฟูก (Corrugated Tube)')" class="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + ท่อลูกฟูก
                  </button>

                  <!-- สายไฟขนาดใหญ่ & มัลติคอร์ -->
                  <button type="button" @click.prevent="addWireSample('thick_cable_50sq', 'สายไฟขนาดใหญ่ 50 SQ')" class="px-2 py-1 bg-white hover:bg-purple-50 text-purple-700 rounded-lg text-[11px] font-semibold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + 50 SQ
                  </button>
                  <button type="button" @click.prevent="addWireSample('thick_cable_80sq', 'สายไฟขนาดใหญ่ 80 SQ')" class="px-2 py-1 bg-white hover:bg-purple-50 text-purple-700 rounded-lg text-[11px] font-semibold border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + 80 SQ
                  </button>
                  <button type="button" @click.prevent="addWireSample('multicore_cable', 'สายมัลติคอร์ MULTI CORE')" class="px-2 py-1 bg-white hover:bg-cyan-50 text-cyan-700 rounded-lg text-[11px] font-semibold border border-cyan-200 transition-colors flex items-center gap-1 cursor-pointer">
                    + MULTI CORE
                  </button>

                  <!-- เข้าหัวย้ำเทอร์มินอล, ใส่ซีลยาง & บัดกรี -->
                  <button type="button" @click.prevent="addWireSample('crimp_double_seal', 'ย้ำหัว 2 ด้าน พร้อมใส่ซีลยาง 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-[11px] font-semibold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer">
                    + ย้ำ 2 ด้าน + ซีลยาง (C558SSA)
                  </button>
                  <button type="button" @click.prevent="addWireSample('crimp_double', 'ย้ำหัวเทอร์มินอล 2 ด้าน')" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-[11px] font-semibold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer">
                    + ย้ำหัว 2 ด้าน (C511e)
                  </button>
                  <button type="button" @click.prevent="addWireSample('crimp_single_tin_single', 'ย้ำหัว 1 ด้าน + จุ่มตะกั่ว 1 ด้าน')" class="px-2 py-1 bg-white hover:bg-amber-50 text-amber-800 rounded-lg text-[11px] font-semibold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer">
                    + ย้ำ 1 ด้าน + จุ่มตะกั่ว (C550SZe)
                  </button>
                </div>
              </div>

              <!-- List of active samples -->
              <div class="space-y-2.5">
                <div v-if="!form.card_features?.wire_samples || form.card_features.wire_samples.length === 0" class="text-center py-8 bg-white rounded-xl border border-dashed border-slate-300 p-6">
                  <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p class="text-xs font-bold text-slate-700">ยังไม่มีรายการตัวอย่างสายไฟในการ์ดนี้</p>
                  <p class="text-[11px] text-slate-400 mt-0.5">เลือกชุดพรีเซ็ตด้านบน หรือกดปุ่มเพิ่มสายไฟเพื่อเริ่มต้น</p>
                  <button 
                    type="button" 
                    @click.prevent="addWireSample('single_black')" 
                    class="mt-3 px-3 py-1.5 bg-[#002855] hover:bg-[#003366] text-white text-xs font-bold rounded-lg shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    + เพิ่มสายไฟรายการแรก
                  </button>
                </div>

                <div 
                  v-for="(sample, sIdx) in form.card_features?.wire_samples" 
                  :key="'sample-edit-'+sIdx" 
                  class="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all p-3 space-y-2.5"
                >
                  <!-- Top Row: Order, Preview, Type, Title, Actions -->
                  <div class="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                    <!-- Order Badge & Up/Down -->
                    <div class="flex items-center gap-0.5 shrink-0 bg-slate-100 px-1 py-0.5 rounded-lg border border-slate-200">
                      <span class="text-[11px] font-bold text-slate-600 w-4 text-center select-none">{{ sIdx + 1 }}</span>
                      <div class="flex flex-col">
                        <button 
                          type="button" 
                          @click.prevent="moveWireSample(sIdx, -1)" 
                          :disabled="sIdx === 0" 
                          class="text-slate-400 hover:text-[#002855] disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 transition-colors cursor-pointer"
                          title="เลื่อนขึ้น"
                        >
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button 
                          type="button" 
                          @click.prevent="moveWireSample(sIdx, 1)" 
                          :disabled="sIdx === form.card_features.wire_samples.length - 1" 
                          class="text-slate-400 hover:text-[#002855] disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 transition-colors cursor-pointer"
                          title="เลื่อนลง"
                        >
                          <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>

                    <!-- Live Visual Preview Box -->
                    <div class="w-24 sm:w-28 h-8 rounded-lg bg-slate-900/90 dark:bg-slate-950 p-1 flex items-center justify-center overflow-hidden shrink-0 border border-slate-800 shadow-inner" title="ภาพแสดงผลจริงในการ์ด">
                      <WireSample :sample="sample" :height="20" />
                    </div>

                    <!-- Wire Type Dropdown Selector -->
                    <div class="w-44 sm:w-52 shrink-0">
                      <select 
                        v-model="sample.type" 
                        @change="onWireTypeChange(sample, sample.type)"
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                      >
                        <optgroup v-for="(group, gIdx) in wireTypeOptions" :key="'grp-'+gIdx" :label="group.group">
                          <option v-for="opt in group.options" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                          </option>
                        </optgroup>
                      </select>
                    </div>

                    <!-- Name / Title Input -->
                    <div class="flex-1 min-w-[160px]">
                      <input 
                        v-model="sample.title" 
                        type="text" 
                        placeholder="ชื่อ/คำอธิบายสายไฟ เช่น สายเดี่ยวสีดำ 0.5-2.5 mm²" 
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white" 
                      />
                    </div>

                    <!-- Actions: Duplicate, Delete -->
                    <div class="flex items-center gap-1 shrink-0 ml-auto">
                      <button 
                        type="button" 
                        @click.prevent="duplicateWireSample(sIdx)" 
                        class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="คัดลอกรายการนี้"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button 
                        type="button" 
                        @click.prevent="removeWireSample(sIdx)" 
                        class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Image Upload / Attachment Box (Visible if type is custom_image or image is present) -->
                  <div 
                    v-if="sample.type === 'custom_image' || sample.image" 
                    class="pt-2 border-t border-slate-100 flex items-center gap-3 bg-slate-50/70 p-2 rounded-lg"
                  >
                    <!-- Image thumbnail preview -->
                    <div v-if="sample.image" class="w-14 h-10 bg-white border border-slate-200 rounded-md overflow-hidden flex items-center justify-center shrink-0 p-0.5">
                      <img :src="sample.image" :alt="sample.title" class="max-h-full max-w-full object-contain" />
                    </div>

                    <!-- Upload / URL Controls -->
                    <div class="flex-1 flex items-center gap-2 flex-wrap">
                      <label class="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs transition-colors shrink-0">
                        <svg v-if="uploadingWireIdx === sIdx" class="w-3.5 h-3.5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <svg v-else class="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span>{{ uploadingWireIdx === sIdx ? 'กำลังอัปโหลด...' : (sample.image ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพสายไฟ') }}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          class="hidden" 
                          :disabled="uploadingWireIdx === sIdx"
                          @change="e => handleWireSampleUpload(e, sIdx)" 
                        />
                      </label>

                      <div class="flex-1 min-w-[180px]">
                        <input 
                          v-model="sample.image" 
                          type="text" 
                          placeholder="หรือวางลิงก์รูปภาพ https://... หรือ /uploads/..." 
                          class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 font-mono text-slate-700" 
                        />
                      </div>

                      <button 
                        v-if="sample.image" 
                        type="button" 
                        @click.prevent="removeWireSampleImage(sIdx)" 
                        class="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        นำรูปออก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Live Card Preview (col-span-5) -->
          <div class="lg:col-span-5">
            <div class="sticky top-20 bg-slate-100/90 rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div class="flex items-center justify-between">
                <div class="text-[11px] font-bold uppercase tracking-wider text-[#002855] flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ตัวอย่างการ์ดสินค้าจริง (LIVE PREVIEW)</span>
                </div>
                <span class="text-[10px] text-slate-500 font-medium">ตรงตามหน้าเว็บจริง 100%</span>
              </div>
              
              <div class="max-w-[340px] mx-auto">
                <ProductCard :product="previewProduct" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 8: ลิงก์ร้านค้าภายนอก (Marketplaces) -->
      <div v-show="activeTab === 'marketplaces'" class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-[fadeIn_0.2s_ease-out]">
        <div class="border-b border-slate-100 pb-3">
          <h2 class="text-sm font-bold text-slate-800">ลิงก์สั่งซื้อผ่านมาร์เก็ตเพลสภายนอก (External Marketplaces)</h2>
          <p class="text-xs text-slate-500">ใส่ URL ของสินค้าใน Shopee, Lazada, TikTok เพื่อให้ลูกค้าเลือกสั่งซื้อได้ตามสะดวก</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Shopee -->
          <div class="p-4 rounded-xl border border-orange-200 bg-orange-50/30 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-orange-700 flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.32,15.772c-0.27,0.73-1.077,1.066-1.846,1.066  c-0.627,0-1.229-0.218-1.691-0.623l-1.041-0.906l-1.037,0.908c-0.457,0.401-1.06,0.621-1.69,0.621  c-0.78,0-1.58-0.344-1.848-1.068l-0.896-2.428l2.482-1.39l0.981,2.656c0.048,0.129,0.165,0.207,0.297,0.207  c0.125,0,0.231-0.081,0.297-0.197L11.516,13h0.963l0.893,1.616c0.065,0.117,0.174,0.198,0.298,0.198  c0.133,0,0.252-0.077,0.301-0.205l0.985-2.671l2.48,1.394L16.32,15.772z M12.569,8.711V8.222c0-1.082,0.881-1.963,1.963-1.963  c1.08,0,1.961,0.881,1.961,1.963v0.489h0.982V10.74h-6.872V8.711H12.569z M13.551,8.711h1.961V8.222  c0-0.54-0.44-0.981-0.98-0.981c-0.542,0-0.981,0.441-0.981,0.981V8.711z"/></svg>
                <span>Shopee URL</span>
              </label>
              <a v-if="form.shopee_link" :href="form.shopee_link" target="_blank" class="text-[10px] text-orange-600 underline font-semibold">ทดสอบเปิด</a>
            </div>
            <input v-model="form.shopee_link" type="url" placeholder="https://shopee.co.th/..." class="w-full bg-white border border-orange-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-orange-500">
          </div>

          <!-- Lazada -->
          <div class="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M16.425,13.67c0,1.523-1.631,2.378-2.914,2.378  c-1.373,0-2.887-0.87-2.887-2.433c0-0.076,0.004-0.155,0.013-0.233h-1.229c0,0.011,0.001,0.021,0.001,0.033  c0,2.155,1.93,3.435,3.951,3.435c2.31,0,4.194-1.423,4.194-3.551c0-2.919-4.103-2.919-4.103-4.22c0-0.457,0.487-0.783,1.155-0.783  c0.812,0,1.298,0.463,1.401,1.139h1.306V9.418h-1.312C15.897,8.601,14.795,8.19,13.438,8.19c-1.635,0-2.584,0.91-2.584,1.88  C10.854,12.338,16.425,12.019,16.425,13.67z M8.07,16.7h1.41V8.344H8.07V16.7z"/></svg> 
                <span>Lazada URL</span>
              </label>
              <a v-if="form.lazada_link" :href="form.lazada_link" target="_blank" class="text-[10px] text-blue-600 underline font-semibold">ทดสอบเปิด</a>
            </div>
            <input v-model="form.lazada_link" type="url" placeholder="https://lazada.co.th/..." class="w-full bg-white border border-blue-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500">
          </div>

          <!-- TikTok -->
          <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.34 2.88 2.88 0 012.31-4.53 2.66 2.66 0 011.61.53v-3.46a6.18 6.18 0 00-1.61-.22 6.33 6.33 0 106.33 6.33V8.16a8.4 8.4 0 004.78 1.49V6.21a4.91 4.91 0 01-1-0.52z"/></svg>
                <span>TikTok Shop URL</span>
              </label>
              <a v-if="form.tiktok_link" :href="form.tiktok_link" target="_blank" class="text-[10px] text-slate-700 underline font-semibold">ทดสอบเปิด</a>
            </div>
            <input v-model="form.tiktok_link" type="url" placeholder="https://tiktok.com/..." class="w-full bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-slate-500">
          </div>
        </div>
      </div>

      <!-- TAB 9: ตั้งค่า SEO & AI GEO Engine (Full Dashboard Matching Screenshots) -->
      <div v-show="activeTab === 'seo'" class="space-y-6 animate-[fadeIn_0.2s_ease-out]">

        <!-- Top Header Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900">SEO & Structured Data Management</h2>
              <p class="text-xs text-slate-500">Meta Tags, Focus Keyword, Schema Markup, Social Previews & AI Context</p>
            </div>
          </div>
          <button type="button" @click="handleFullSeoGeoAutoFix" :disabled="generatingFullSeo" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
            <svg v-if="generatingFullSeo" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4 text-amber-300" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            <span>{{ generatingFullSeo ? 'กำลังประมวลผล 12-Layers...' : 'AI Auto-Generate SEO' }}</span>
          </button>
        </div>

        <!-- Section 1: • SEO HEALTH SCORE -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              SEO HEALTH SCORE
            </h3>
            <span class="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
              {{ seoAudit.score }}/100
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: `${seoAudit.score}%` }"></div>
          </div>

          <!-- Checklist Items (Matching Screenshots) -->
          <div class="space-y-2 pt-2">
            <div class="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div class="flex items-center gap-2 text-emerald-900 font-bold">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>SEO Title length is optimal</span>
              </div>
              <span class="text-[11px] text-slate-500">{{ form.seo_title?.length || 0 }} chars (30-60 recommended)</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div class="flex items-center gap-2 text-emerald-900 font-bold">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>Meta description length is optimal</span>
              </div>
              <span class="text-[11px] text-slate-500">{{ form.seo_description?.length || 0 }} chars (70-160 recommended)</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div class="flex items-center gap-2 text-emerald-900 font-bold">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>SEO keywords defined</span>
              </div>
              <span class="text-[11px] text-slate-500">{{ form.seo_keywords ? form.seo_keywords.split(',').length : 0 }} keywords set</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div class="flex items-center gap-2 text-emerald-900 font-bold">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>URL slug is set</span>
              </div>
              <span class="text-[11px] text-slate-500 font-mono">{{ form.slug || 'not-set' }}</span>
            </div>

            <div class="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs">
              <div class="flex items-center gap-2 text-emerald-900 font-bold">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                <span>Product name is set</span>
              </div>
              <span class="text-[11px] text-slate-500 truncate max-w-[200px]">{{ form.name || 'not-set' }}</span>
            </div>
          </div>
        </div>

        <!-- Section 2: SERP & SOCIAL PREVIEWS (Matching Screenshots) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <!-- SERP Mode Tabs -->
          <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
            <button type="button" @click="SerpPreviewMode = 'desktop'" :class="[SerpPreviewMode === 'desktop' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-slate-500 border-transparent', 'px-3 py-1.5 border-b-2 text-xs rounded-t-lg transition-all']">
              Desktop SERP
            </button>
            <button type="button" @click="SerpPreviewMode = 'mobile'" :class="[SerpPreviewMode === 'mobile' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-slate-500 border-transparent', 'px-3 py-1.5 border-b-2 text-xs rounded-t-lg transition-all']">
              Mobile SERP
            </button>
            <button type="button" @click="SerpPreviewMode = 'rich'" :class="[SerpPreviewMode === 'rich' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-slate-500 border-transparent', 'px-3 py-1.5 border-b-2 text-xs rounded-t-lg transition-all']">
              Rich Snippet
            </button>
            <button type="button" @click="SerpPreviewMode = 'social'" :class="[SerpPreviewMode === 'social' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-500' : 'text-slate-500 border-transparent', 'px-3 py-1.5 border-b-2 text-xs rounded-t-lg transition-all']">
              Social Card
            </button>
          </div>

          <!-- Desktop SERP Mockup -->
          <div v-if="SerpPreviewMode === 'desktop'" class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div class="flex items-center gap-1.5 text-xs text-[#006621]">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/></svg>
              <span class="font-mono truncate text-[11px]">yoursite.com > product > {{ form.slug || 'premium-aluminum-garden-planter-ms-gb9' }}</span>
            </div>
            <h4 class="text-base font-bold text-[#1a0dab] hover:underline cursor-pointer leading-snug">
              {{ form.seo_title || form.name || 'ชื่อสินค้าที่จะแสดงบน Google' }}
            </h4>
            <p class="text-xs text-[#4d5156] leading-relaxed line-clamp-2">
              {{ form.seo_description || form.short_description || 'รายละเอียดสินค้า...' }}
            </p>
          </div>

          <!-- Mobile SERP Mockup -->
          <div v-if="SerpPreviewMode === 'mobile'" class="max-w-sm mx-auto p-4 bg-white border border-slate-300 rounded-2xl shadow-md space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">M</div>
              <div class="text-[11px] text-slate-500 font-mono truncate">yoursite.com > product > {{ form.slug || 'product' }}</div>
            </div>
            <h4 class="text-sm font-bold text-[#1a0dab] line-clamp-2">
              {{ form.seo_title || form.name || 'ชื่อสินค้า' }}
            </h4>
            <p class="text-xs text-[#4d5156] line-clamp-3">
              {{ form.seo_description || form.short_description || 'รายละเอียด...' }}
            </p>
          </div>

          <!-- Rich Snippet Mockup -->
          <div v-if="SerpPreviewMode === 'rich'" class="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div class="text-[11px] font-mono text-[#006621]">yoursite.com > product > {{ form.slug || 'product' }}</div>
            <h4 class="text-base font-bold text-[#1a0dab]">{{ form.seo_title || form.name }}</h4>
            <div class="flex items-center gap-3 text-xs text-amber-600 font-bold">
              <span class="flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-amber-500 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                5.0 ({{ form.review_count || 12 }} reviews)
              </span>
              <span class="text-slate-700 font-bold">฿{{ Number(form.price || 0).toLocaleString() }}</span>
              <span class="text-emerald-600 font-bold">In stock</span>
            </div>
            <p class="text-xs text-[#4d5156]">{{ form.seo_description }}</p>
          </div>

          <!-- Social Card Mockup -->
          <div v-if="SerpPreviewMode === 'social'" class="max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div class="h-40 bg-slate-100 flex items-center justify-center overflow-hidden">
              <img v-if="form.image_url" :src="form.image_url" class="w-full h-full object-cover">
              <span v-else class="text-xs text-slate-400">Preview Image</span>
            </div>
            <div class="p-3.5 bg-slate-50 space-y-1">
              <span class="text-[10px] text-slate-400 uppercase font-mono">yoursite.com</span>
              <h5 class="text-xs font-bold text-slate-900 truncate">{{ form.seo_title || form.name }}</h5>
              <p class="text-[11px] text-slate-500 line-clamp-2">{{ form.seo_description }}</p>
            </div>
          </div>
        </div>

        <!-- Section 3: • INDEXING & CRAWL CONTROL (Matching Screenshots) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            INDEXING & CRAWL CONTROL
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <label class="block text-[10px] font-black uppercase text-slate-400">CANONICAL URL</label>
              <div class="text-xs font-mono text-indigo-600 truncate">
                https://yoursite.com/product/{{ form.slug || 'premium-aluminum-garden-planter-ms-gb9' }}
              </div>
            </div>

            <div class="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
              <label class="block text-[10px] font-black uppercase text-emerald-700">ROBOTS META TAG</label>
              <div class="text-xs font-mono font-bold text-emerald-800">
                index, follow
              </div>
            </div>
          </div>

          <div class="space-y-1">
            <label class="block text-xs font-bold text-slate-700">Image Alt Text</label>
            <input v-model="form.image_alt" placeholder="ระบุคำอธิบายภาพหลักสินค้า" class="w-full border border-slate-200 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500">
          </div>
        </div>

        <!-- Section 4: • AI CONTEXT (LLM / CHATGPT / GEMINI / PERPLEXITY) (Matching Screenshots) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span>
              AI CONTEXT (LLM / CHATGPT / GEMINI / PERPLEXITY)
            </h3>
            <span class="text-[10px] font-mono font-bold text-slate-400">
              {{ form.llm_context?.length || 0 }}/5000
            </span>
          </div>

          <textarea v-model="form.llm_context" rows="4" placeholder="ข้อความอธิบายข้อเท็จจริง สเปก และการใช้งาน สำหรับ AI Search Engines..." class="w-full border border-slate-200 rounded-xl p-3.5 text-xs outline-none focus:border-purple-500 resize-none font-sans leading-relaxed"></textarea>

          <div class="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-2 text-xs text-indigo-900 font-medium">
            <svg class="w-4 h-4 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Embedded as structured metadata for AI Search Engines (SearchGPT, Perplexity, Gemini) to accurately summarize your product</span>
          </div>
        </div>

        <!-- Section 5: • STRUCTURED DATA (JSON-LD SCHEMA) (Matching Screenshots) -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 class="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            STRUCTURED DATA (JSON-LD SCHEMA)
          </h3>

          <!-- Schema Block 1: Product Schema -->
          <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                Product Schema (auto)
              </div>
              <button type="button" @click="copyToClipboard(productSchemaJson)" class="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Copy
              </button>
            </div>
            <pre class="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all">{{ productSchemaJson }}</pre>
          </div>

          <!-- Schema Block 2: FAQPage Schema -->
          <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                FAQPage Schema
              </div>
              <button type="button" @click="copyToClipboard(faqSchemaJson)" class="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Copy
              </button>
            </div>
            <pre class="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all">{{ faqSchemaJson }}</pre>
          </div>

          <!-- Schema Block 3: BreadcrumbList Schema -->
          <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <div class="flex items-center gap-2 text-xs font-bold text-slate-800">
                <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                BreadcrumbList Schema (auto)
              </div>
              <button type="button" @click="copyToClipboard(breadcrumbSchemaJson)" class="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Copy
              </button>
            </div>
            <pre class="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all">{{ breadcrumbSchemaJson }}</pre>
          </div>
        </div>

      </div>

      <!-- Floating Bottom Action Bar -->
      <div class="sticky bottom-4 z-40 w-full bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-lg rounded-2xl p-3.5 px-6 flex items-center justify-between gap-3 mt-8">
        <div class="hidden sm:block text-xs font-semibold text-slate-500">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
          มีข้อมูลเตรียมพร้อมบันทึก
        </div>
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <router-link to="/admin/products" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors">
            ยกเลิก
          </router-link>
          <button type="submit" :disabled="saving" class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50">
            <svg v-if="saving" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            <span>{{ saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสินค้า' }}</span>
          </button>
        </div>
      </div>

    </form>
  </div>
  <!-- Badge Management Modal -->
  <Teleport to="body">
    <div v-if="showBadgeModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="showBadgeModal = false"></div>
      <div class="relative bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-8 animate-[fadeIn_0.2s_ease-out] border border-white/50 ring-1 ring-slate-900/5">
        <button @click="showBadgeModal = false" class="absolute top-5 right-5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors outline-none focus:ring-2 focus:ring-rose-200">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        <h3 class="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <div class="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl relative overflow-hidden group">
            <div class="absolute inset-0 bg-emerald-500/10 pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
            <svg class="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"></path></svg>
          </div>
          {{ editingBadgeId ? 'แก้ไขป้ายกำกับสินค้า' : 'พิ่มป้ายกำกับสินค้าใหม่' }}
        </h3>

        <div class="space-y-7">
          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">ชื่อป้ายกำกับ</label>
            <input v-model="badgeForm.name" type="text" maxlength="100" placeholder="เช่น สินค้าลดพิเศษ" class="w-full border border-slate-200 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-sm placeholder:text-slate-300">
          </div>

          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">เลือกไอคอนสัญลักษณ์</label>
            <div class="grid grid-cols-6 gap-2">
              <button v-for="ic in badgeIconOptions" :key="ic" type="button" @click="badgeForm.icon = ic"
                :class="['p-3 rounded-2xl border-2 transition-all flex items-center justify-center outline-none', badgeForm.icon === ic ? `border-${badgeForm.color}-500 bg-${badgeForm.color}-50 shadow-sm scale-110 relative z-10` : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 bg-white']">
                <svg :class="`w-5 h-5 transition-colors ${badgeForm.icon === ic ? 'text-'+badgeForm.color+'-600' : 'text-slate-400'}`" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getBadgeIconPath(ic)"></path></svg>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-black text-slate-800 mb-2.5">เลือกสี</label>
            <div class="flex flex-wrap gap-2.5">
              <button v-for="c in badgeColorOptions" :key="c" type="button" @click="badgeForm.color = c"
                :class="['w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shrink-0 outline-none shadow-sm hover:shadow-md hover:-translate-y-0.5', `bg-${c}-500`, badgeForm.color === c ? 'border-white scale-110 ring-4 ring-'+c+'-200 shadow-md relative z-10' : 'border-white/50 ring-1 ring-slate-200']">
                <svg v-if="badgeForm.color === c" class="w-5 h-5 text-white shrink-0 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </button>
            </div>
          </div>

          <!-- Preview -->
          <div class="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-inner">
            <p class="text-[10px] text-slate-400 mb-3 font-black uppercase tracking-widest flex items-center gap-2">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3"/></svg>
              ตัวอย่างการแสดงผล
            </p>
            <div class="flex justify-center py-2">
              <div :class="`inline-flex items-center gap-2 text-[13px] font-black tracking-wider px-4 py-2 rounded-xl border-2 text-${badgeForm.color}-600 bg-${badgeForm.color}-50 border-${badgeForm.color}-200 shadow-sm transition-all`">
                <svg :class="`w-4 h-4`" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" :d="getBadgeIconPath(badgeForm.icon)"></path></svg>
                {{ badgeForm.name || 'ชื่อป้ายกำกับ' }}
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
          <button type="button" @click="showBadgeModal = false" class="px-5 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-slate-200">ยกเลิก</button>
          <button type="button" @click="saveBadge" :disabled="badgeSaving" class="px-6 py-3 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] active:scale-95 flex items-center gap-2 outline-none border border-emerald-400 group focus:ring-4 focus:ring-emerald-500/20">
            <svg v-if="badgeSaving" class="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4.5 h-4.5 group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            {{ badgeSaving ? 'กำลังบันทึก...' : (editingBadgeId ? 'บันทึกการแก้ไข' : 'เพิ่มป้ายกำกับ') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- AI Import Modal -->
  <Teleport to="body">
    <div v-if="showAiImportModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px);">
      <div 
        class="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col"
        style="max-height: calc(100vh - 40px);"
      >
        <div class="px-6 py-5 border-b border-slate-100/80 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-white rounded-xl shadow-sm text-indigo-600 border border-indigo-100/50">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-800 tracking-wide">นำเข้าข้อมูลด้วย AI</h3>
              <p class="text-xs text-slate-500 font-medium">วางเนื้อหาดิบ แล้วปล่อยให้ AI กรอกข้อมูลในฟอร์ม</p>
            </div>
          </div>
          <button type="button" @click="showAiImportModal = false" class="p-2 hover:bg-slate-200/50 text-slate-400 hover:text-slate-700 rounded-xl transition-colors shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div class="p-6 overflow-y-auto bg-slate-50/30 flex-1">
          <div class="space-y-4">
             <label class="block text-[13px] font-black text-slate-700">วางข้อมูลดิบที่นี่ <span class="text-red-500">*</span></label>
             <textarea 
               v-model="rawAiInput" 
               rows="10" 
               class="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-2xl p-4 hover:border-slate-300 focus:ring-4 focus:ring-indigo-500/[0.07] focus:border-indigo-500 transition-all placeholder:text-slate-300 font-medium outline-none shadow-sm shadow-slate-100"
               placeholder="วางข้อความ รายละเอียด สเปกสินค้า ที่ก็อปปี้มาหน้าเว็บอื่นได้เลย..."
             ></textarea>
          </div>
        </div>

        <div class="px-6 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button type="button" @click="showAiImportModal = false" class="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-colors active:scale-95 outline-none focus:ring-4 focus:ring-slate-200">ยกเลิก</button>
          <button type="button" @click="extractFromRaw" :disabled="extractingAiAll || !rawAiInput.trim()" class="px-5 py-2.5 text-sm font-black text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-2 outline-none whitespace-nowrap">
            <svg v-if="extractingAiAll" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            {{ extractingAiAll ? 'กำลังให้ AI จัดการให้...' : 'เริ่มสกัดข้อมูลอัตโนมัติ' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- AI Content Generator Modal -->
  <Teleport to="body">
    <div v-if="showAiGenerateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style="background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(12px);">
      <div 
        class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_20px_60px_-10px_rgba(0,0,0,0.3)] border border-slate-200/50 dark:border-slate-800 flex flex-col transition-all duration-300"
        style="max-height: calc(100vh - 40px);"
      >
        <!-- Modal Header -->
        <div class="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-violet-500/10 via-indigo-500/5 to-transparent flex justify-between items-center shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl shadow-md text-white">
              <svg class="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456" />
              </svg>
            </div>
            <div>
              <h3 class="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-wide">เขียนเนื้อหาใหม่แบบมืออาชีพด้วย AI</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-bold">สร้างสรรค์คำบรรยายตามโครงสร้าง SEO On-Page และกรอก Meta Tags อัตโนมัติ</p>
            </div>
          </div>
          <button type="button" @click="showAiGenerateModal = false" class="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl transition-colors shrink-0 outline-none">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Modal Body Form -->
        <div class="p-6 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex-1 space-y-6 custom-scrollbar">
          <!-- Product Context (Read-only badge info) -->
          <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shadow-sm shrink-0">
            <div>
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">สินค้าเป้าหมาย</span>
              <span class="text-sm font-black text-slate-800 dark:text-white">{{ form.name || 'ยังไม่มีชื่อสินค้า' }}</span>
            </div>
            <span class="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black border border-emerald-100/50 dark:border-emerald-900/50 whitespace-nowrap">
              {{ form.category || 'หมวดหมู่ทั่วไป' }}
            </span>
          </div>

          <!-- SEO Keywords -->
          <div class="space-y-2">
            <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>คีย์เวิร์ด SEO ที่ต้องการเน้น (Target Keywords)</span>
              <span class="text-xs font-medium text-slate-400">คั่นระหว่างคำด้วยเครื่องหมายจุลภาค (,)</span>
            </label>
            <input 
              v-model="aiModelParams.keywords" 
              type="text"
              class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="เช่น เครื่องตัดปอกสายไฟ, KODERA, Wire Stripping Machine, ใบมีดตัดสายไฟ"
            >
          </div>

          <!-- Product Highlights -->
          <div class="space-y-2">
            <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">
              จุดขาย ข้อมูลสินค้า หรือสเปกเด่น (Product Highlights) <span class="text-red-500">*</span>
            </label>
            <textarea 
              v-model="aiModelParams.highlights" 
              rows="6"
              class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl p-4 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium outline-none resize-none custom-scrollbar"
              placeholder="ระบุจุดเด่นสั้นๆ ทีละบรรทัด เช่น:
- ทนต่อทุกสภาพอากาศ ทนแดด ทนฝน 100%
- ผลิตจากพลาสติก HDPE หนาเป็นพิเศษ แข็งแรงทนทาน
- มีระบบล็อกความปลอดภัยแน่นหนา"
            ></textarea>
          </div>

          <!-- Tone & Length Row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">โทนเสียงภาษา (Tone of Voice)</label>
              <select 
                v-model="aiModelParams.tone"
                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none"
              >
                <option value="luxury">Luxury & Premium (หรูหรา น่าเชื่อถือ)</option>
                <option value="friendly">Friendly & Informative (เป็นมิตร สุภาพ ให้ข้อมูล)</option>
                <option value="persuasive">Sales-Driven & Persuasive (เน้นความคุ้มค่า/ปิดการขาย)</option>
              </select>
            </div>

            <div class="space-y-2">
              <label class="block text-[13px] font-black text-slate-700 dark:text-slate-300">ระดับความยาวเนื้อหา (Length)</label>
              <select 
                v-model="aiModelParams.length"
                class="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-950 dark:text-white text-sm rounded-xl px-4 py-3 hover:border-slate-300 dark:hover:border-slate-600 focus:ring-4 focus:ring-violet-500/[0.07] focus:border-violet-500 transition-all font-medium outline-none"
              >
                <option value="short">สั้นและกระชับ (~300 คำ)</option>
                <option value="standard">มาตรฐานสากล (~600 คำ - แนะนำสำหรับ SEO)</option>
                <option value="comprehensive">วิเคราะห์เชิงลึกอย่างสมบูรณ์ (~1000 คำ)</option>
              </select>
            </div>
          </div>

          <!-- Checkbox Include SEO Meta Tags -->
          <div class="pt-2">
            <label class="flex items-center gap-3 cursor-pointer group select-none">
              <div class="relative">
                <input 
                  type="checkbox" 
                  v-model="aiModelParams.includeSEO" 
                  class="sr-only peer"
                >
                <div class="w-10 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-500 peer-checked:to-indigo-500"></div>
              </div>
              <div class="flex flex-col">
                <span class="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">กรอกข้อมูล SEO Meta Tags ค้นหาบน Google ไปพร้อมกัน</span>
                <span class="text-xs text-slate-400 font-bold">เขียน SEO Title และ Meta Description เพื่อกรอกลงในแท็บ SEO & SERP อัตโนมัติ</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="px-6 py-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0 rounded-b-3xl">
          <button 
            type="button" 
            @click="showAiGenerateModal = false" 
            class="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95 outline-none"
          >
            ยกเลิก
          </button>
          
          <button 
            type="button" 
            @click="generateDescriptionWithAI" 
            :disabled="aiGeneratingDescription || !aiModelParams.highlights.trim()" 
            class="px-5 py-2.5 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] active:scale-95 flex items-center gap-2 outline-none whitespace-nowrap"
          >
            <span v-if="aiGeneratingDescription" class="mr-1">
              <svg class="animate-spin h-4.5 w-4.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            <svg v-else class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09l2.846.813-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span>{{ aiGeneratingDescription ? 'AI กำลังวิเคราะห์และเรียบเรียง...' : 'เริ่มเขียนเนื้อหาด้วย AI' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Adjust CKEditor to fit current UI vibe */
.ckeditor-container :deep(.ck-editor__editable_inline) {
  min-height: 250px;
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
}
.ckeditor-container :deep(.ck-toolbar) {
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  background-color: #f9fafb;
}

/* Draggable classes */
.image-ghost {
  opacity: 0.3;
  transform: scale(0.95);
}
.image-drag {
  opacity: 1 !important;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  transform: scale(1.05);
  z-index: 50;
}
</style>
